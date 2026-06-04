---
name: design-html-prototype
description: DESIGN.md와 brand tokens를 바탕으로 빠르게 확인 가능한 단일 HTML/CSS 프로토타입을 만들 때 사용한다.
---

# Design HTML Prototype

당신은 DESIGN.md를 바탕으로 HTML/CSS를 구현하는 프론트엔드 엔지니어다. 이 스킬은 **web-publisher 에이전트**가 호출하며, 산출물은 "버리는 프리뷰"가 아니라 디자인 확인용으로 충실히 구현한 마크업이다. 구현 후 web-publisher가 `web-publisher-qa` 스킬로 레이아웃을 점검한다.

## 목적

프로덕션 수준의 React 앱을 바로 만들지 않는다. 먼저 브랜드 방향·레이아웃·컴포넌트 톤을 확인할 수 있는 간단한 HTML 프로토타입을 만든다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `DESIGN.md`
- `.design/brand-tokens.json`
- `.design/assets/**/*.{png,jpg,jpeg,webp}` (확정본) → 없으면 `.design/candidate/**/*.{png,jpg,jpeg,webp}` 폴백 (+ 선택 `manifest.json`)

## 출력 파일

- `prototype/index.html` (사용자가 디렉터리 없이 단일 파일을 원하면 `prototype.html`)

## 구현 규칙

- HTML·CSS·JS를 한 파일에 넣어도 된다.
- CSS variables를 사용한다.
- 텍스트는 실제 HTML 텍스트로 작성한다 (이미지로 대체하지 않는다).
- 버튼·카드·입력창·배지·테이블은 재사용 가능한 class로 만든다.
- 복잡한 이미지는 `<img>` 또는 배경 이미지로 쓰되, UI 전체를 이미지로 대체하지 않는다.
- React로 옮기기 쉽도록 section과 component 구조를 명확히 나눈다.

## 기본 HTML 구조

아래는 랜딩 페이지 기본 예시다. DESIGN.md가 대시보드·앱 화면 등 다른 화면을 기술하면 섹션 구조를 그에 맞게 조정한다.

```html
<header class="site-header"></header>
<main>
  <section class="hero"></section>
  <section class="problem"></section>
  <section class="mechanism"></section>
  <section class="features"></section>
  <section class="dashboard-preview"></section>
  <section class="cta"></section>
</main>
<footer class="site-footer"></footer>
```

## CSS 구조

변수 값은 자리표시자다 — `.design/brand-tokens.json`의 실제 값으로 채운다.

```css
:root {
  --color-primary: ;
  --color-background: ;
  --color-surface: ;
  --color-text: ;
  --font-display: ;
  --font-body: ;
  --font-mono: ;
  /* --accent: ;   brand-tokens.json typography.accent가 있을 때만 선언 — 인용/풀쿼트용 */
  --radius-md: ;
  --shadow-md: ;
}
.container {}
.btn {}
.btn-primary {}
.card {}
.badge {}
.section {}
```

- **폰트**: `--font-*`는 `.design/brand-tokens.json`의 `typography`(카탈로그에서 고른 실존 family+폴백)로 채운다. 그 폰트가 카탈로그(`../references/design/font-catalog.md`)의 웹폰트면 출처에서 로드한다 — Google Fonts는 `<head>`에 `<link>`, Pretendard·SUIT 등은 jsDelivr/CDN `<link>`/`@import`. 그래야 고른 폰트가 프로토타입에서 실제로 렌더된다. 상용·system 폰트(Apple SD Gothic Neo 등)는 폴백 스택에 의존한다. `typography.accent`(있으면)는 `--accent` CSS 변수로 노출하고 인용·풀쿼트·히어로 태그라인 등 소량 포인트에 적용한다(`font-family:var(--accent)`).

## 품질 기준

- 첫 화면의 핵심 문구가 명확해야 한다.
- Hero 제목은 너무 좁게 줄바꿈되지 않아야 한다.
- CTA 버튼은 명확하고 대비가 충분해야 한다.
- 섹션 간 리듬이 있어야 한다.
- 카드와 컴포넌트는 재사용 가능한 구조여야 한다.
- 가로 스크롤이 생기지 않아야 한다.
- 모바일에서도 기본적으로 깨지지 않아야 한다.

## 금지 사항

- 인라인 스타일을 남발하지 않는다.
- 모든 컴포넌트를 이미지로 대체하지 않는다.
- 이미지 생성 결과를 픽셀 단위로 억지 복제하지 않는다.
- 의미 없는 애니메이션을 과하게 넣지 않는다.
- 프로토타입 단계에서 과도한 빌드 시스템을 만들지 않는다.

## 흐름 (리뷰 게이트)

1. `DESIGN.md`·`.design/brand-tokens.json`·생성 이미지를 읽고 `prototype/index.html`을 작성한다.
2. 사람이 브라우저로 확인한다.
3. 마음에 안 들면 프로토타입(1단계)을 고쳐 다시 확인한다(2단계).
4. 더 손볼 게 있으면 `DESIGN.md`나 토큰을 고쳐 `design-md-compiler`·`design-html-prototype`을 다시 돌리거나, 만족하면 **실제 구현으로 진행**하도록 안내한다. (이 스킬이 파이프라인의 마지막 단계다.)
