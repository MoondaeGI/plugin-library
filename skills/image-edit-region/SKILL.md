---
name: image-edit-region
description: 이미지의 특정 영역만 흔들림 없이 편집할 때 사용한다. 브라우저에 이미지를 띄워 사각형 드래그 또는 브러시로 영역을 고르면, 그 영역만 OpenAI image edit API로 고치고 마스크 밖은 로컬에서 원본 그대로 재합성해 배경 흔들림(drift)을 차단한다. 로고·사물 교체처럼 "여기만 바꾸고 나머지는 그대로" 편집에 쓴다. OPENAI_API_KEY 필요.
---

# image-edit-region

전체 이미지를 edit API에 주면 고치려는 영역 밖이 흔들리는 문제(drift)를 막는 영역 편집 도구.
**접근: 전체+마스크를 API에 보내되, 결과의 bbox 부분만 원본 위에 로컬 재합성**해 마스크 밖을 보존한다.

## 언제

- 이미지의 특정 영역(로고·아이콘·사물 등)만 바꾸고 배경은 그대로 두고 싶을 때. 사각 영역은 드래그, 불규칙 형태는 브러시로 고른다.
- **쓰지 않음**: 이미지 전체 재생성·새 이미지 생성(그건 image-gen).

## 사용

```bash
node "<이 스킬 디렉터리>/scripts/region-edit.mjs" \
  --image "<원본 png 절대경로>" \
  --prompt "로고를 빨간색으로" \
  --out "<결과 png 경로>"      # 미지정 시 <이름>-edited.png
```

1. 명령을 실행하면 브라우저가 열린다(`--prompt`는 입력칸 초기값).
2. 바꿀 영역을 고른다 — **사각형**: 마우스로 드래그. **브러시**: 도구를 브러시로 바꾼 뒤 칠한다(크기 슬라이더·지우개·전체 지우기 제공). 지시문을 확인/수정한 뒤 **"편집(미리보기)"**.
   - 미리보기는 저품질로 빠르게. before/after를 본다.
3. 마음에 들면 **"확정 저장"**(고품질 1회 재실행 → `--out` 저장), 아니면 **"다시"**.
4. 확정/취소되면 서버가 닫히고, 저장 경로가 stdout에 출력된다.

## 전제

- `OPENAI_API_KEY`(`.env` 또는 환경변수) — edit 단계가 `image-gen`을 호출한다. 사전 검증하지 말고 그냥 실행한다(없으면 image-gen이 안내하며 실패).
- 입력은 PNG(비인터레이스 8-bit). 설치된 브라우저(Edge/Chrome/Brave) 필요.

## 내부

- `scripts/region-edit.mjs` CLI → `server.mjs`(미니 서버) + `ui/`(드래그·브러시 GUI) + `edit-cycle.mjs`(마스크→image-gen→재합성) + `composite.mjs`(순수 PNG).
- 흔들림 차단의 핵심은 GUI가 아니라 로컬 재합성 — **사각형**은 `compositeRegion`(API 결과의 bbox만 덮어씀), **브러시**는 `compositeMask`(마스크 alpha 가중 블렌드로 칠한 곳만 덮고 경계는 페더링). 바깥 픽셀은 원본 그대로 보존한다.
- 브러시 마스크는 GUI가 원본 해상도로 만들어(`alpha 0`=편집, `255`=보존) `{ maskPng }` dataURL로 전송하고, `maskHasEditableArea`로 빈 편집을 거른다.

## 범위 밖(후속)

다중 영역, 타이트 크롭 모드, 외부 마스크 파일 입력(그림판·Photopea), 마법봉 선택, OpenAI 외 provider(FLUX-Fill 등 diffusion inpainting).
