---
name: design-html-prototype
description: DESIGN.md와 brand tokens를 바탕으로 풀페이지 HTML 프로토타입을 만들 때 쓰는 스펙 스킬. 무엇을 만들지(입력·출력 경로·섹션 구조·리뷰 게이트)만 정의하고, 실제 HTML 저작·레이아웃 QA는 web-publisher 서브에이전트에 위임한다.
---

# Design HTML Prototype

DESIGN.md를 바탕으로 한 **풀페이지 HTML 프로토타입의 스펙**을 정의하는 스킬이다. 산출물은 "버리는 프리뷰"가 아니라 디자인 확인용으로 충실히 구현한 마크업이다.

**이 스킬은 HTML을 직접 저작하지 않는다.** 무엇을 만들지(입력·출력 경로·섹션 구조)만 정하고, 실제 마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 맡는다(아래 "HTML 산출 위임"). 이렇게 해야 모든 HTML이 web-publisher의 빌드+QA 루프를 거쳐 깨진 div가 그대로 나오지 않는다.

## 목적

프로덕션 수준의 React 앱을 바로 만들지 않는다. 먼저 브랜드 방향·레이아웃·컴포넌트 톤을 확인할 수 있는 풀페이지 HTML 프로토타입을 만든다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `DESIGN.md`
- `.design/brand-tokens.json`
- `.design/assets/**/*.{png,jpg,jpeg,webp}` (확정본) → 없으면 `.design/candidate/**/*.{png,jpg,jpeg,webp}` 폴백 (+ 선택 `manifest.json`)

## 출력 파일

- `prototype/index.html` (사용자가 디렉터리 없이 단일 파일을 원하면 `prototype.html`)

## 섹션 구조

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

## 페이지 수준 목표

web-publisher의 범용 HTML 품질 기준에 더해, 풀페이지 프로토타입은 다음을 만족해야 한다.

- 첫 화면의 핵심 문구가 명확해야 한다.
- Hero 제목은 너무 좁게 줄바꿈되지 않아야 한다.
- CTA 버튼은 명확하고 대비가 충분해야 한다.
- 섹션 간 리듬이 있어야 한다.

## HTML 산출 위임 (web-publisher)

마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 수행한다. 이 스킬에서 div를 직접 저작하지 않는다.

- web-publisher를 직접 디스패치할 수 있으면(메인 세션) 위 입력·출력 경로·섹션 구조를 **스펙으로 넘겨** 빌드+QA를 맡긴다.
- web-publisher를 부를 도구가 없으면(서브에이전트로 실행 중) HTML을 직접 만들지 말고, "풀페이지 프로토타입을 web-publisher로 빌드해야 한다"는 점과 위 스펙을 메인 세션에 넘긴다.

## 흐름 (리뷰 게이트)

1. `DESIGN.md`·`.design/brand-tokens.json`·생성 이미지를 읽어 위 스펙(출력 경로·섹션 구조)을 정한다.
2. web-publisher에 위임해 `prototype/index.html`을 빌드+QA한다.
3. 사람이 브라우저로 확인한다.
4. 마음에 안 들면 스펙을 고쳐 web-publisher로 다시 빌드한다(2~3 반복).
5. 더 손볼 게 있으면 `DESIGN.md`나 토큰을 고쳐 `design-md-compiler`·이 스킬을 다시 돌리거나, 만족하면 **실제 구현으로 진행**하도록 안내한다.

## 금지 사항

- 이 스킬에서 HTML을 직접 저작하지 않는다(→ web-publisher).
- 이미지 생성 결과를 픽셀 단위로 억지 복제하라고 요구하지 않는다.
