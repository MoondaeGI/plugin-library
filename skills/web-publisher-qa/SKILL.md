---
name: web-publisher-qa
description: web-publisher가 구현한 HTML/CSS를 OS 브라우저 스크린샷으로 자가 검사하는 스킬. breakpoint별로 스크린샷을 찍어 "보이는 레이아웃 깨짐"(요소 overflow·정렬 어긋남·grid 불균일·깨진 이미지·겹침)을 점검한다. 의존성 0 — 설치된 Edge/Chrome/Chromium/Brave를 호출. a11y·대비·시맨틱 정밀 검사는 범위 밖.
---

# web-publisher-qa

당신은 구현된 HTML/CSS를 **렌더해서 눈으로** 점검하는 QA다. 코드만 읽지 말고 스크린샷을 찍어 본다.

## 입력

- 검사할 HTML 파일 경로(예: `prototype/index.html`).
- (선택) breakpoint 폭. 없으면 기본 `375 / 768 / 1280`.

## 절차

1. 스크린샷을 찍는다(아래 스크립트). 산출물은 시스템 임시 폴더에 둔다 — 대상 프로젝트를 더럽히지 않는다.

   ```bash
   node skills/web-publisher-qa/scripts/screenshot.mjs <html경로> --widths 375,768,1280
   ```

   - 반응형이 아닌 고정폭 화면이면 단일 폭만: `--widths 1280`.
   - 사용자가 특정 폭을 지정하면 그 값으로: `--widths 390,1440`.
   - 출력 JSON의 `produced` 경로들이 PNG다. `browser`가 null이고 exit 3이면 **브라우저가 없어 스크린샷을 건너뛴 것** — 사용자에게 "시각 검사는 건너뜀"을 알리고 코드 기반 점검만 한다.

2. 생성된 각 PNG를 **Read 도구로 열어** 본다.

3. 다음 **기계적 레이아웃 깨짐**만 본다(미적 판단 아님):
   - 요소가 컨테이너 밖으로 튀어나옴(`input`이 `div` 밖 등)
   - grid/flex 칸 높이·정렬 불균일
   - 가로로 잘려나가는 콘텐츠(뷰포트 초과)
   - 깨진 이미지(빈 자리·broken icon)
   - 요소 겹침

4. 발견을 **폭별로** 리포트한다: 무엇이 / 어느 폭에서 / 어떻게 깨졌는지.

## 알려진 한계

- 부모에 `overflow:hidden`이 걸려 **잘린** overflow는 스크린샷에 거의 안 드러나 놓칠 수 있다. 스크린샷 QA는 *보이는* 깨짐을 잡는 도구다.
- 대비비·접근성·시맨틱 같은 수치/비가시 항목은 이 스킬 범위 밖이다(필요 시 후속 도구).

## 하지 않을 것

- "보기 좋은가" 같은 미적 판정(디자인 충실도는 designer/사람 몫).
- 발견을 멋대로 대규모로 뜯어고치기 — web-publisher가 저작 스킬로 외과적으로 고치고 다시 검사한다.
