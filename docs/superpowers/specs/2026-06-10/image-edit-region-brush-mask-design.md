# image-edit-region 브러시/사각형 마스크 편집 — 설계

**날짜:** 2026-06-10
**대상 스킬:** `skills/image-edit-region`
**관련 계획:** `docs/superpowers/plans/2026-06-10/image-edit-region-brush-mask.md`

## 배경 / 문제

현재 `image-edit-region`은 **사각형 드래그**로만 편집 영역을 지정한다. 사각형은
둥근 사물·불규칙 형태를 잡을 때 의도하지 않은 주변까지 편집 영역에 포함되어,
gpt-image가 그 빈 영역까지 새로 그리면서 결과가 "빵꾸"나는(넓게 뭉개지는) 문제가
있다. 사용자의 실제 용도는 "이 부분만 바꿔주세요"라 **정밀한 영역 지정**이 필요하다.

브러시로 칠한 영역만 편집하면 편집 영역이 좁아져 백엔드 교체와 무관하게 체감
품질이 개선된다. 이 설계는 **사각형은 그대로 옵션으로 두고**, 브러시 마스크
경로를 곁에 더하는(additive) 방식이다.

## 목표 / 비목표

**목표**
- 브러시로 임의 형태의 편집 영역을 칠하고, 그 영역만 편집한다.
- "선택 영역 밖은 원본 그대로" 흔들림 방지 보장을 **마스크 경로에서도 동일하게** 유지.
- 사각형 모드는 기존 코드·동작·테스트를 그대로 유지(회귀 0).

**비목표**
- 백엔드(gpt-image) 교체나 inpainting 엔진 변경 — 별도 작업.
- 마법봉(색 기반 자동 선택), 외부 마스크 파일(`--mask`) 입력 — 이번 범위 아님.
- 스트로크 단위 Undo — v1 제외(전체지우기·지우개로 보정).

## 핵심 설계

### 데이터 흐름 (additive — 경로 둘)

```
GUI
 ├─ 사각형 모드(기존): 드래그 → canvasToImageBbox → POST /edit { bbox, prompt }
 └─ 브러시 모드(신규): 표시 캔버스(원본+반투명 칠) + 숨은 마스크 캔버스(원본 해상도)
      도구: 브러시 · 지우개 · 크기 슬라이더 · 전체지우기
      "편집 미리보기" → 마스크 캔버스 toDataURL → POST /edit { maskPng, prompt }
        ↓
서버 handleEdit: bbox 또는 maskPng 중 하나로 분기
        ↓
runEditCycle:
  - maskBuf 있으면 → 마스크 경로: 크기·편집영역 검증 → image-gen(--size 원본)
                     → 결과 원본크기 resize → compositeMask(가중 블렌드)
  - 없으면        → 사각형 경로(기존): buildMask → image-gen → resize → compositeRegion
        ↓
미리보기 저장(분기 입력 bbox|mask 함께 보관) → 확정 시 같은 입력으로 high 재실행
```

### 마스크 규약

- **클라이언트 생성:** 마스크 캔버스를 원본 해상도로 만든다. 불투명 검정으로 전체를
  채우고(`fillRect`, 보존), 칠한 영역을 `globalCompositeOperation='destination-out'`으로
  지워 **alpha 0(편집 가능)** 으로 만든다. 지우개는 반대로 다시 불투명하게 칠한다.
  좌표는 표시 크기→원본 픽셀로 스케일 보정(`cv.width/r.width` 패턴, 기존 `pos()` 재사용).
  결과: 편집 영역 alpha 0, 보존 영역 alpha 255 — 기존 `buildMask` 규약과 동일하며
  OpenAI `/v1/images/edits`의 "투명=편집" 규약과 일치.
- **합성(가중 블렌드):** 픽셀마다 `편집가중 w = (255 - maskAlpha) / 255`,
  `out = round(edited*w + original*(1-w))`. 하드 컷이 아니라 브러시 AA 경계가
  자연스럽게 페더링되어 이음새가 줄어든다. **OpenAI에 보낸 마스크와 합성에 쓰는
  마스크가 동일**하므로 편집 의도와 보존 경계가 일관된다.

### 전송 방식

기존 JSON `POST /edit`에 마스크를 **base64 PNG dataURL** 문자열(`maskPng`)로 동봉한다.
의존성0 `node:http` 서버에 multipart 파서를 들이지 않기 위함. 마스크는 대부분 균일한
PNG라 수 KB 수준으로 localhost 전송에 부담 없음. 서버는 `data:image/png;base64,` 접두를
떼고 `Buffer.from(b64, 'base64')`로 디코드한다.

## 모듈별 변경

### `skills/image-edit-region/scripts/composite.mjs`
- **추가** `compositeMask(originalBuf, editedBuf, maskBuf)`:
  세 PNG 디코드 → 모두 RGBA 정규화 → 셋이 같은 크기인지 검증(아니면 `CompositeError`)
  → 픽셀별 가중 블렌드로 합성 → `encodePNG`.
- **추가** `maskHasEditableArea(maskBuf)`: 마스크에 alpha < 255인 픽셀이 하나라도
  있으면 `true`(편집할 영역이 있음). 없으면 빈 편집 → 호출부에서 거부.
- **유지(제거 안 함)** `buildMask`, `compositeRegion`, `assertBbox`, `toRGBA`,
  `resizePNG` — 사각형 경로가 계속 사용.

### `skills/image-edit-region/scripts/edit-cycle.mjs`
- `runEditCycle`가 **마스크 입력을 선택적으로** 받도록 확장:
  `runEditCycle({ imagePath, bbox, maskBuf, prompt, quality, workDir, runImageGen })`.
  - `maskBuf`가 있으면: `maskHasEditableArea` 검증, 마스크 크기 == 이미지 검증,
    마스크를 workDir에 기록해 `--mask`로 전달, 결과 resize 후 `compositeMask`로 합성.
  - 없으면: 기존 bbox 경로 그대로(`buildMask` + `compositeRegion`).
  - tag/파일명: bbox 경로는 기존 `bbox.x-...-quality`, 마스크 경로는 `mask-<seq>-quality`
    (bbox 없으므로 호출부가 넘기는 단조 증가 seq 사용).

### `skills/image-edit-region/scripts/server.mjs`
- `handleEdit`가 `{ bbox, prompt }` 또는 `{ maskPng, prompt }`를 받도록 분기.
  - `maskPng` 있으면 dataURL 디코드 → `maskBuf` → `runEditCycle({ maskBuf, prompt, quality:'low' })`.
  - `previews`에 분기 입력(`bbox` 또는 `maskBuf`)을 함께 보관.
- `handleConfirm`은 저장된 분기 입력으로 `saveFinal` 호출(고품질 재실행) — bbox 또는 mask.
- 디코드/검증 실패는 기존처럼 `{ error }` 반환(핸들러는 throw하지 않음).

### `skills/image-edit-region/scripts/region-edit.mjs`
- `saveFinal` 클로저가 bbox 대신 "분기 입력"을 받아 high 품질로 `runEditCycle` 재실행하도록
  소폭 수정(마스크 경로 지원).

### `skills/image-edit-region/scripts/ui/index.html`
- 사각형↔브러시 **도구 토글**, 브러시 **크기 슬라이더**, **지우개 토글**, **전체지우기**
  버튼을 컨트롤 카드에 추가. 기존 다크 카드 스타일 따름.

### `skills/image-edit-region/scripts/ui/app.js`
- 숨은 **마스크 캔버스**(원본 해상도) 추가. 브러시 모드에서 포인터 이동 시 표시 캔버스에는
  반투명 칠 오버레이를, 마스크 캔버스에는 `destination-out`(브러시)/불투명(지우개)로 그린다.
- 도구 상태(`tool: 'rect'|'brush'`, `brushSize`, `erasing`) 관리. 사각형 모드는 기존
  드래그/`canvasToImageBbox`/`{bbox}` 전송 로직 그대로.
- 브러시 모드 "편집 미리보기": 마스크 캔버스 `toDataURL('image/png')` → `{ maskPng, prompt }` 전송.
- 전체지우기: 표시·마스크 캔버스를 초기 상태로 리셋.

## 에러 처리

- 빈 편집(마스크에 alpha<255 픽셀 없음): 서버가 `{ error: '편집할 영역을 칠하세요' }` 반환,
  GUI는 상태줄에 표시(기존 `setStatus(...,'err')`).
- 마스크 크기 ≠ 이미지: `CompositeError`/`EditCycleError` → `{ error }`로 표면화.
- dataURL 형식 오류: 디코드 실패를 잡아 `{ error }` 반환.
- 커스텀 에러(`CompositeError`, `EditCycleError`)는 기존 규약 유지.

## 테스트 (TDD, `tests/` 미러)

- `tests/skills/image-edit-region/scripts/composite-mask.test.mjs`
  - 편집 영역(alpha 0) 픽셀은 edited로 교체된다.
  - 보존 영역(alpha 255) 픽셀은 original 그대로다(바이트 불변).
  - 경계(부분 alpha)에서 가중 블렌드 값이 맞다.
  - 크기 불일치(원본/편집/마스크) 시 `CompositeError`.
  - `maskHasEditableArea`: 전부 불투명 → false, 일부 투명 → true.
- `tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs`
  - 모킹 `runImageGen`으로 마스크 경로: `--mask`/`--size 원본` 인자, resize 경로, `compositeMask` 호출.
  - 빈 편집 마스크 → 에러.
- `tests/skills/image-edit-region/scripts/server-mask.test.mjs`
  - `handleEdit({ maskPng })` dataURL 디코드 → previewId 반환.
  - `handleEdit({ bbox })` 기존 경로 회귀.
  - 잘못된 dataURL → `{ error }`.
- 기존 사각형 테스트 전부 그대로 통과(회귀 0).

## 동기화 / 마무리

- 스킬 소스 변경 후 `npm run sync`로 Codex 번들 재생성, `npm test`로 전체 스위트 확인.
- `SKILL.md`에 브러시 모드 사용법 한 줄 추가.

## 미해결 / 후속 (이번 범위 밖)

- 백엔드 교체(FLUX-Fill 등 diffusion inpainting) — 품질의 가장 큰 레버. 별도 설계.
- 외부 마스크 파일 입력(`--mask`로 Photopea/그림판 결과 받기) — 곁가지로 싸게 추가 가능.
- 스트로크 단위 Undo.
