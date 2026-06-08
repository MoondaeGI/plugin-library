# html-prototype 충실도 게이트 — 설계

**상태:** 설계(검토 대기)
**대상 파일:** `skills/design-html-prototype/SKILL.md`, `agents/web-publisher.md`
**짝 스펙:** `ui-kit-structural-components-design.md` (같은 날짜 폴더 — ui-kit 어휘 확장)

## 배경

SugarLoop 프로토타입(`prototype/index.html`)을 증거 사례로, html-prototype → web-publisher
파이프라인이 다음 세 가지 divergence를 막지 못했다.

1. **카우셀이 comp와 다름** — 화살표 위치·패널 비율 등이 `assets/page/home-web.png`와 갈림.
2. **카우셀 prev/next 화살표 모양이 서로 다름** — prev는 꼬리 달린 긴 화살표(`arrow-left` 계열),
   next는 chevron(`chevron-right` 계열). 둘 다 아이콘셋 파일이 아니라 자리마다 박은 인라인 SVG.
3. **헤더가 ui-kit와 다름** — ui-kit.css에 `.navbar`(166–175)·`.btn-icon`(31–32)이 있는데
   재사용하지 않고 `.site-header`·`.icon-btn`을 인라인 `<style>`로 새로 저작.

### 오진 정정

초기 가설은 "프로토타입이 ui-kit.css를 링크하지 않는다"였으나 **틀렸다**. 실제 파일
`prototype/index.html:18`에 `<link rel="stylesheet" href="../.design/assets/ui-kit/ui-kit.css">`가
있다. 입력 부족 문제가 아니라 **web-publisher의 저작 규율 + 자가검사 게이트 누락** 문제다.

### 근본 원인 분류

| 증상 | 원인 | 기계적으로 잡히나 |
|---|---|---|
| ② 화살표 모양 불일치 | 아이콘을 아이콘셋에서 안 쓰고 자리마다 인라인 SVG 창작 | ✅ (Read/Grep) |
| ③ 헤더가 ui-kit와 다름 | 존재하는 ui-kit 컴포넌트를 재사용 않고 중복 재저작 | ✅ (Read/Grep) |
| ① 카우셀이 comp와 다름 | comp 충실도 — comp는 비권위("불완전한 한 해석")라 web-publisher가 미적 판정 안 함 | ❌ (사람/비전 필요) |

## 설계 목표

- ②③은 **예방(저작 규율) + 탐지(자가검사 게이트)** 로 자동으로 잡는다.
- ①은 기계로 못 잡으므로 **사람 검토 게이트**를 명시한다(자동 비전 대조는 옵션 언급만).
- 기존 "완전성 자가 대조"(섹션 누락)와 **병렬**되는 새 게이트로 추가한다.

## 변경 1 — `agents/web-publisher.md`

### 1a. HTML 품질 기준에 "컴포넌트 재사용 우선" 추가

- 무엇을 저작하기 전에 `ui-kit.css`에 해당 컴포넌트(navbar·btn·btn-icon·card·badge·input·
  table·chip 등)가 있는지 **먼저 확인하고, 있으면 재사용**한다.
- 페이지 전용 CSS는 **ui-kit가 덮지 않는 레이아웃**(카우셀·페이지 그리드·섹션 리듬)에만 짠다.
- ui-kit 컴포넌트를 페이지에 맞게 적응해야 하면(예: navbar → 풀블리드 sticky 헤더),
  **내부 요소(`.brand`·`.nav-links`·`.btn-icon`)는 재사용하고 컨테이너만 조립**한다 —
  컴포넌트 CSS를 처음부터 다시 쓰지 않는다. (= 헤더 (나)안)
- `ui-kit.html`을 **컴포넌트 마크업 레퍼런스**로 참조해 정규 중첩 구조를 그대로 쓴다.

### 1b. HTML 품질 기준에 "아이콘 출처" 추가

- 아이콘은 `.design/assets/icon/*.svg`(+`icon-map.json`)에서만 **인라인 currentColor**로 쓴다.
  자리마다 SVG 패스를 창작하지 않는다.
- 쌍 컨트롤(prev/next, ±, 펼치기/접기 등)은 **같은 글리프 패밀리를 미러**해 모양을 맞춘다.

### 1c. 흐름에 신규 단계 "컴포넌트·아이콘 재사용 자가 대조"

"완전성 자가 대조"와 같은 결의 기계적 자가검사 단계로 추가한다. 빌드된 HTML을 Read/Grep해
다음을 플래그하고, 발견 시 수정 루프(외과적 수정 → 재검사):

- (a) **ui-kit 컴포넌트를 중복 재저작한 페이지 CSS** — ui-kit.css에 같은 역할의 클래스가 있는데
  페이지 `<style>`에서 동등 컴포넌트를 새로 정의한 경우(헤더·버튼·카드·배지·입력 등).
- (b) **아이콘셋 밖 인라인 SVG** — `assets/icon/`에 대응 글리프가 있는데 임의 패스를 박은 경우.
- (c) **쌍 아이콘 글리프 불일치** — 같은 컨트롤 쌍이 다른 글리프 패밀리를 쓴 경우.

> 이 대조는 "보기 좋은가" 미적 판정이 아니라 존재·출처의 객관·기계적 판정이므로
> web-publisher의 "미적 충실도는 판정 안 함" 경계와 충돌하지 않는다(완전성 자가 대조와 동일 논리).

## 변경 2 — `skills/design-html-prototype/SKILL.md`

### 2a. 입력 보강

현재 입력 목록(`SKILL.md:16-22`)에 빠진 것을 명시:
- `.design/assets/ui-kit/ui-kit.css` (컴포넌트 권위)
- `.design/view/ui-kit.html` (컴포넌트 마크업 레퍼런스)
- `.design/assets/icon/*.svg` + `.design/assets/icon/icon-map.json` (아이콘 권위)

### 2b. 위임 스펙에 "컴포넌트·아이콘 재사용 대조" 포함

완전성 체크리스트와 **나란히**, web-publisher에 넘기는 빌드 스펙에 재사용 대조 지시를 싣는다
(변경 1c가 동작하도록 인라인 전달).

### 2c. comp 충실도 사람 검토 게이트 (①)

흐름의 "사람이 브라우저로 확인" 단계를 보강:
- 사람이 확인할 때 **comp(`assets/page/*.png`)를 나란히** 두고 구조적 divergence
  (화살표 위치·패널 비율·헤더 형태 등)를 확인하도록 명시한다.
- comp는 비권위("불완전한 한 해석")이므로 **사람이 살릴 점/버릴 점을 판정**한다 —
  자동 픽셀 복제를 강제하지 않는다.
- (옵션) 자동 비전 대조는 향후 가능성으로만 언급, 기본은 사람 게이트.

## 비목표 (out of scope)

- SugarLoop 산출물 자체를 수정하지 않는다(증거 사례일 뿐).
- ui-kit에 새 컴포넌트를 추가하는 일은 짝 스펙(`ui-kit-structural-components-design.md`) 소관.
- 자동 비전 기반 comp 대조 구현(향후).

## 영향 / 후속

- 스킬·에이전트 md만 수정 → 스크립트 로직 변경 없음(테스트 영향 없음).
- 수정 후 `npm run sync`로 Codex 번들(`plugins/personal/`·`codex-agents/`) 재생성 필요.
- Claude는 `/reload-plugins`, Codex는 `npm run codex:reinstall`로 갱신.
