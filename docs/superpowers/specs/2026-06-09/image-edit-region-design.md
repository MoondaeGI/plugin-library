# image-edit-region — 설계 (spec)

날짜: 2026-06-09 · 단계: brainstorming 산출 spec (다음: writing-plans)

## 1. 목적과 배경

이미지 edit API에 전체 이미지를 주고 "여기만 고쳐"라고 자연어로 지시하면, 고치려는 영역 *밖*의 배경이 미세하게 흔들린다(drift). 이는 OpenAI gpt-image 계열의 `images/edit`이 픽셀 치환 인페인팅이 아니라 "soft mask + 전체 재생성"이라 마스크 밖 보존을 보장하지 않는, 널리 보고된 모델 한계다.

`image-edit-region`은 이미지의 **특정 직사각형 영역만 흔들림 없이 편집**하는 로컬 도구다. 브라우저에 이미지를 띄워 마우스로 영역을 드래그해 고르면, 그 영역만 edit API로 고치고, **마스크 밖은 로컬에서 원본 픽셀 그대로 재합성(composite)**해 흔들림을 차단한다.

이 spec은 idea 단계에서 `personal:devils-advocate` 2라운드를 거쳐 합의된 결정을 설계로 확정한 것이다.

### 핵심 통찰

- **흔들림 차단의 알맹이는 GUI가 아니라 로컬 재합성이다.** API의 mask 파라미터만으로는 보존이 보장되지 않으므로(drift의 근본 원인), 마스크 밖을 100% 보존하는 유일한 결정적 방법은 클라이언트 측 재합성이다.
- **MCP는 불필요하다.** 사람이 드래그하는 동기·단발 상호작용이라 MCP의 이점(모델 자율 호출·세션 상태)이 발동하지 않는다. 단, MCP를 버려도 "브라우저 → Node로 결과를 회수하는 단명 로컬 서버" 배관은 동일하게 필요하다 — 이를 설계 1급 항목으로 명시한다.
- **서버 활동은 Claude 대화 토큰을 늘리지 않는다.** 서버·브라우저·드래그·합성은 전부 자식 프로세스(Claude 컨텍스트 밖)에서 일어나고, Claude에는 실행 명령 한 줄과 결과 경로 한 줄만 오간다. 늘 수 있는 비용은 OpenAI 이미지 API 달러이며, 이는 저품질 미리보기/고품질 확정 전략으로 통제한다(§6).

## 2. 범위

### v1 포함
- 직사각형 bbox 영역 선택(브라우저 드래그 GUI)
- 전체+마스크 전송 후 로컬 재합성(접근 2)
- GUI 안 before/after 리뷰 루프(확정/다시)
- 저품질 미리보기 / 고품질 확정
- 하드 페이스트 합성

### v1 비포함 (구조만 열어두고 후속)
- 브러시/자유곡선 마스크, 다중 영역
- 경계 페더링(seam blending)
- 타이트 크롭 모드(접근 1)
- OpenAI 외 provider

## 3. 형태와 파일 구조

**새 독립 스킬** `skills/image-edit-region/`. edit 단계는 기존 공유 생성기 `image-gen`을 자식 프로세스로 호출한다(provider 경계 = image-gen이 이미 담당, 새 추상화 없음).

```
skills/image-edit-region/
  SKILL.md                 # 산문 워크플로 (오케스트레이션 규칙)
  scripts/
    region-edit.mjs        # 진입점 CLI: 미니 서버 기동 → 브라우저 → 대기 → 결과 경로 반환
    server.mjs             # node:http 의존성0 미니 서버 (라우트·생명주기)
    composite.mjs          # autocrop의 decodePNG/encodePNG 재사용 → 마스크 생성·재합성
    ui/
      index.html           # 드래그 GUI (canvas·지시문칸·편집/확정/다시 버튼)
      app.js               # 캔버스 드래그·POST 통신 (로직은 순수함수로 분리)
```

### 책임 분리
- `region-edit.mjs` — 입력 검증 → 서버 기동 → 브라우저 오픈 → 확정/취소까지 대기 → 최종 경로 stdout. 인자: `--image`(필수), `--prompt`(선택 — GUI 입력칸의 초기값일 뿐, 최종 지시문의 권위는 GUI다 = 결정 C), `--out`(선택 — 미지정 시 입력과 같은 폴더에 `<이름>-edited.png`).
- `server.mjs` — GUI·이미지 서빙 + 편집 1사이클 + 확정/취소/하트비트. 편집 알맹이는 composite.mjs와 image-gen 호출에 위임.
- `composite.mjs` — 마스크 PNG 생성 + "API 결과의 bbox만 원본 위에 붙이기". `skills/image-gen/scripts/autocrop.mjs`의 `decodePNG`/`encodePNG` 재사용.
- **edit 단계** — `skills/image-gen/scripts/image-gen.mjs`를 자식 프로세스로 호출(API 코드 중복 0). image-gen은 `--mask` 추가(§5) 외 변경 없음.

## 4. 데이터 흐름과 서버 생명주기

```
region-edit.mjs --image foo.png --prompt "로고를 빨갛게" --out out.png
  1. 입력 검증 → PNG 디코드(크기 파악)
  2. node:http 서버 server.listen(0) → OS가 빈 포트 자동 배정 (포트 충돌 원천 제거)
  3. 배정 포트로 URL 구성 → 브라우저 오픈(screenshot.mjs의 resolveBrowser 재사용)
  4. Node는 Promise를 들고 대기 (확정/취소/타임아웃까지)
  5. Promise resolve → 최종 경로 stdout, 서버 종료, 임시폴더 정리, exit 0
```

### 라우트 (브라우저 ↔ Node 신호 채널)

| 라우트 | 방향 | 역할 |
|---|---|---|
| `GET /` | →브라우저 | 드래그 GUI(index.html) |
| `GET /image` | →브라우저 | 원본 PNG 바이트 |
| `POST /edit` `{bbox, prompt}` | 브라우저→Node | 편집 1사이클(§5): 마스크→image-gen(저품질)→재합성→미리보기 저장→`{previewId}` |
| `GET /preview/:id` | →브라우저 | composite 결과 PNG(before/after 표시) |
| `POST /confirm` `{previewId}` | 브라우저→Node | bbox·지시문으로 고품질 1회 재실행 → `--out` 저장 → 응답 → **Promise resolve(저장경로)** |
| `POST /cancel` | 브라우저→Node | 응답 → Promise resolve(취소) |
| `POST /ping` | 브라우저→Node | 하트비트 |

**신호 회수(🔴):** 드래그 결과 bbox는 `POST /edit` body로, 최종 확정은 `POST /confirm`이 Node의 대기 Promise를 resolve하는 지점으로 흘러든다. 이것이 MCP였어도 동일하게 필요했던 배관이다.

### 브라우저 생명주기 — "안 끝나는 길" 처리 (🟡)

1. **창을 그냥 닫음** → GUI가 3초마다 `POST /ping`. 서버가 ~10초 ping 없으면 창 닫힘으로 간주 → 취소·종료. (Edge가 기존 프로세스에 창을 붙여 자식 PID가 즉시 죽는 `screenshot.mjs` 함정을 PID 추적 대신 **페이지 하트비트로 우회** — 핵심 설계점.)
2. **드래그 안 하고 방치** → 전역 유휴 타임아웃(기본 10분) → 취소·종료, stderr 안내.
3. **포트 충돌** → `listen(0)` OS 자동 배정이라 충돌 없음.
4. **Ctrl+C(Node)** → SIGINT 핸들러로 서버 닫고 임시파일 정리.

**임시파일:** 미리보기·마스크는 `mkdtemp` 임시 폴더에. 확정 시 `--out`만 남기고 모든 종료 경로(확정·취소·타임아웃·SIGINT)에서 임시 폴더 삭제.

## 5. 편집 1사이클 (접근 2: 전체+마스크 → 로컬 재합성)

```
입력: 원본 PNG, bbox{x,y,w,h}, 지시문
 1. 마스크 생성   composite.buildMask(width,height,bbox)
                  → 원본과 같은 크기 알파 PNG. bbox 안=편집가능(투명), 밖=보존(불투명).
 2. edit 호출    image-gen.mjs --image 원본 --mask 마스크 --prompt 지시문 --quality low
                  → 전체 결과 PNG 반환 (bbox 밖은 흔들렸을 수 있음)
 3. 로컬 재합성   composite.compositeRegion(원본, API결과, bbox)
                  → 원본 px 복사 → API결과의 bbox 픽셀만 그 자리에 덮어씀
                  → API의 bbox 밖 픽셀은 전부 버림 (= 흔들림 차단)
 4. 미리보기 저장 임시폴더 → previewId 반환
확정 시: 같은 bbox·지시문으로 --quality high 1회 재실행 → --out 저장
```

### composite.mjs 인터페이스 (순수함수)
- `buildMask(width, height, bbox) -> Buffer` — 알파 마스크 PNG. `encodePNG` 재사용.
- `compositeRegion(originalBuf, editedBuf, bbox) -> Buffer` — `decodePNG` 둘 다 → 원본 px 복사 → edited의 bbox 픽셀 덮어쓰기 → `encodePNG`.
- 경계 seam: v1은 **하드 페이스트**(픽셀 그대로). 페더링은 구조만 열어두고 v2.

### 좌표·해상도 정합 (🟡, 3중 변환 책임)
```
브라우저 캔버스 좌표 → 원본 픽셀 좌표 → API 기대 크기 → 다시 원본 픽셀
```
- 캔버스가 이미지를 축소 표시하면 `app.js`가 표시배율로 나눠 **원본 픽셀 bbox로 환산**해 전송(브라우저가 원본 좌표 책임).
- 접근 2는 전체를 받고 전체를 돌려주므로 결과가 원본과 같은 크기 → bbox가 그대로 맞음(타이트 크롭이었다면 생겼을 리사이즈 왕복 없음 — 접근 2 부수 이점).
- gpt-image 크기 제약(변 16배수 등)은 image-gen이 처리. 원본이 제약을 벗어나면 image-gen 호출 전 1회 정규화 후 결과를 원본 크기로 되돌림.

## 6. 비용 (Claude 토큰 vs API 달러)

- **Claude 대화 토큰**: 거의 안 늘어남. 서버·브라우저·합성은 자식 프로세스(컨텍스트 밖). Claude엔 실행 명령 + 결과 경로만 오감. MCP로 해도 동일.
- **OpenAI 이미지 API 달러**: 접근 2는 매 편집마다 전체 전송, 리뷰 루프가 이를 배가. 통제책:
  - 미리보기 `--quality low`, **확정 시에만 `--quality high` 1회**.
  - 초기 지시문을 GUI에서 다듬어 "다시" 횟수 최소화.
  - (후속) 비용 부담 시 접근 1(타이트 크롭) 옵션화.

## 7. image-gen 변경

`image-gen.mjs`에 `--mask <경로>` 플래그 추가 → edits 페이로드에 `mask` 필드 포함. **하위호환**(미지정 시 현행 동작 그대로). 공유 생성기에 대한 작고 외과적인 확장이며, 변경 이유를 주석으로 남긴다(CLAUDE.md 규칙). 테스트는 `tests/skills/image-gen/scripts/`에 mask 페이로드 케이스 추가.

## 8. 에러 처리 (커스텀 에러·경계 검증·불변)

| 지점 | 처리 |
|---|---|
| 입력 검증 | `--image` 없음/파일 없음/PNG 아님 → `RegionEditInputError`(exit 2). `--prompt`·`--out`은 선택 |
| 브라우저 못 찾음 | `resolveBrowser()` null → `BrowserNotFoundError`(exit 3) — screenshot.mjs 규약 |
| OPENAI_API_KEY 없음 | **사전 검증 안 함**. image-gen 자식이 exit 2로 실패하면 stderr 그대로 전달 |
| edit API 실패 | image-gen 자식 비정상 종료 → 미리보기 실패 응답 `{error}` → GUI 표시, **루프 유지(서버 안 죽음)** |
| 창 닫힘/유휴 | 하트비트·타임아웃 → 취소로 수렴, 임시폴더 정리 |
| 마스크/디코드 실패 | `CompositeError`(비8bit·인터레이스 PNG 등) → autocrop 메시지 규약 |

원칙: **서버는 편집 1회 실패로 죽지 않는다**(루프 유지). 죽는 건 입력·환경 등 회복 불가 오류뿐.

## 9. 테스트 (`tests/skills/image-edit-region/scripts/` 미러링, `node --test`)

- `composite.test.mjs` — `buildMask`(bbox 안 투명·밖 불투명), `compositeRegion`(bbox만 교체·밖 픽셀 바이트 동일성), 디코드 실패. 작은 합성 PNG로 결정적 검증.
- `region-edit.test.mjs` — 인자 파싱, 입력 검증 에러, 좌표 환산(캔버스→원본 픽셀) 순수함수.
- `server.test.mjs` — 라우트 핸들러를 브라우저 없이 직접 호출(가짜 req/res): `/edit`이 composite·image-gen을 올바른 인자로 부르는지(image-gen은 주입 의존성으로 모킹), `/confirm`이 Promise resolve, 하트비트 타임아웃.
- `app.js` — 드래그→bbox 환산·POST 페이로드 구성 순수함수만 단위 테스트(캔버스 e2e는 범위 밖).
- **TDD 필수**(CLAUDE.md): 각 순수함수는 테스트 먼저 → 구현. image-gen 자식·브라우저 spawn은 경계라 의존성 주입으로 모킹.

## 10. 살아남은 우려 추적 (idea 단계 인계)

- 🔴 신호 회수 메커니즘 → §4 라우트·Promise resolve로 해소.
- 🔴 composite 부재 → §5 로컬 재합성으로 해소(접근 2).
- 🟡 Windows 헤드풀 브라우저 생명주기 → §4 하트비트·타임아웃으로 해소.
- 🟡 영역 모양 확장 → §2 v1 bbox, 브러시 후속(구조 개방).
- 🟡 좌표·해상도 정합 → §5 변환 책임 명시.
