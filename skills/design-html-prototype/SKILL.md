---
name: design-html-prototype
description: DESIGN.md와 brand tokens를 바탕으로 풀페이지 HTML 프로토타입을 만들 때 쓰는 스펙 스킬. 무엇을 만들지(입력·출력 경로·섹션 구조·리뷰 게이트)만 정의하고, 실제 HTML 저작·레이아웃 QA는 web-publisher 서브에이전트에 위임한다.
---

# Design HTML Prototype

DESIGN.md를 바탕으로 한 **풀페이지 HTML 프로토타입의 스펙**을 정의하는 스킬이다. 산출물은 "버리는 프리뷰"가 아니라 디자인 확인용으로 충실히 구현한 마크업이다.

**이 스킬은 HTML을 직접 저작하지 않는다.** 무엇을 만들지(입력·출력 경로·섹션 구조·완전성 체크리스트)만 정하고, 실제 마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 맡는다(아래 "HTML 산출 위임"). 이렇게 해야 모든 HTML이 web-publisher의 빌드+QA 루프를 거쳐 깨진 div가 그대로 나오지 않는다.

## 목적

프로덕션 수준의 React 앱을 바로 만들지 않는다. 먼저 브랜드 방향·레이아웃·컴포넌트 톤을 확인할 수 있는 풀페이지 HTML 프로토타입을 만든다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/DESIGN.md`
- `.design/reference/brand-tokens.json`
- `.design/assets/css/components.css` (컴포넌트 권위)
- `.design/view/ui-kit.html` (컴포넌트 마크업 레퍼런스 — 정규 중첩 구조 참조)
- `.design/assets/icon/*.svg` + `.design/assets/icon/icon-map.json` (아이콘 권위 — 인라인 currentColor)
- `.design/reference/page/**/*.{png,jpg,jpeg,webp}` (확정 comp) → 없으면 `.design/candidate/page/**/*.{png,jpg,jpeg,webp}` 폴백 (+ 선택 `manifest.json`)

권위 기준은 `DESIGN.md`/브랜드 토큰이다. 생성 comp(`.design/reference/page/**` 또는 `candidate/page/**`의 풀페이지 목업 PNG)는 gpt-image 산출물이라 **정답이 아니라 불완전한 한 해석**이다 — 레이아웃·자산 위치의 *참고*로만 쓰고, 충실 기준은 항상 `DESIGN.md`다.

## 출력 파일

- `.design/prototype/index.html` (사용자가 디렉터리 없이 단일 파일을 원하면 `.design/prototype.html`)

## 자산 갭 해소 (빌드 전)

comp를 충실히 구현하려면 `.design/assets/`에 없는 자산이 필요할 수 있다(타사 브랜드 마크·hero/카드 등 콘텐츠 이미지). web-publisher는 "이미 만들어진 자산만 소비"하므로, 조달은 **이 스킬이 빌드 전에** 끝낸다. 갈림 축은 자산 *종류*가 아니라 **가용성**이다.

1. **슬롯 열거** — comp + `DESIGN.md` + 섹션 구조를 읽어 `.design/assets/`에 없는 필요 자산을 슬롯으로 나열한다.
2. **슬롯별 해소(cascade):**

   | 슬롯 종류 | 해소 |
   |---|---|
   | 제품 UI 글리프 | 이미 `.design/assets/icon/*.svg`에 있음 → 그대로 참조 |
   | 벤더 브랜드 마크 | `scripts/fetch-vendor-logo.mjs --vendor <name> --out <cwd>/.design/assets/icon/vendor/<name>.svg` (필요 시 `--ref <set:name>`). `resolved`면 색 보존 SVG 저장, `escalate`면 **사람에게 직접 제공 요청**(gpt-image로 로고 생성 금지) |
   | 콘텐츠 이미지 (hero·키비주얼·카드 아트) | `image-gen`으로 생성, 프롬프트 권위 기준은 `DESIGN.md` 토큰(comp는 `--image` 참고로만). `--out <cwd>/.design/assets/content/<slot>.<ext>`. `OPENAI_API_KEY`가 없으면 → 토큰 그라디언트 **라벨 플레이스홀더 + gap 로그** |

3. **매니페스트 기록** — `.design/assets/manifest.json`에 슬롯별 `{ id, type, source, path, status }`를 기록한다.
   - `type`: `vendor` | `content` | `glyph`
   - `source`: `iconify:<set>:<name>` | `image-gen` | `placeholder` | `escalate`
   - `status`: `resolved` | `placeholder` | `escalate`
4. **검수 게이트** — 조달된 자산(fetch된 로고·생성 이미지·플레이스홀더·에스컬레이션)을 사람이 확인한다. 미해결(escalate)이 있으면 진행 전에 사람이 자산을 제공한다.

> `.design/assets/`엔 designer가 *저작한* 자산(brand-kit·logo·icon·page)이 있다. 조달분은 `icon/vendor/`·`content/` **전용 하위 폴더에만** 쓰고, 저작 자산을 덮어쓰지 않는다.

## 완전성 체크리스트 (빌드 전)

`DESIGN.md`를 읽어 섹션 구조를 정할 때, 함께 **완전성 체크리스트**를 만들어 빌드 스펙에 실어 web-publisher에 넘긴다. web-publisher는 빌드 후 이 체크리스트를 결정적으로(Read/Grep) 대조해 *구현 누락*(DESIGN.md에 정의됐는데 통째로 빠진 섹션·요소)을 스스로 잡는다 — 사람이 매번 수동으로 발견해 재수정을 요청할 필요가 없게.

- **권위는 `DESIGN.md`다.** 앵커는 `DESIGN.md`의 실제 카피·섹션 정의에서만 뽑는다. comp 이미지(gpt-image 산출물 = 불완전한 한 해석)는 앵커 출처로 쓰지 않는다 — 정확한 자산을 comp의 틀린 자산에 맞춰 되돌리는 함정을 피하기 위함.
- 항목 종류:
  - **필수 섹션** — `DESIGN.md`가 기술한 섹션 목록(랜딩이면 hero·problem·…·footer; 다른 화면이면 그에 맞게).
  - **핵심 헤딩·문구 앵커** — 섹션별로 `DESIGN.md`의 *실제 카피*에서 뽑은 distinctive 문자열(섹션 제목·핵심 CTA 문구 등). `DESIGN.md`가 권위이므로 web-publisher는 이 카피를 그대로 써야 하고, 따라서 verbatim 대조가 공정하다. 섹션이 present-but-empty면 앵커가 안 잡혀 미충족으로 드러난다.
  - **핵심 요소** — 그 화면에 반드시 있어야 하는 인터랙티브·구조 요소(CTA 버튼·내비 링크·플랜 카드 N개·폼 필드 등).
- **인라인 전달**: 별도 파일을 만들지 않고 빌드 스펙 안에 적어 web-publisher에 넘긴다.

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

- web-publisher를 직접 디스패치할 수 있으면(메인 세션) 위 입력·출력 경로·섹션 구조·완전성 체크리스트를 **스펙으로 넘겨** 빌드+QA를 맡긴다.
- 위임 시 **`.design/assets/manifest.json`을 함께 넘겨** "어느 슬롯을 어느 파일로 채울지" 알린다. web-publisher가 매니페스트 밖 자산 갭을 만나면 손으로 지어내지 말고 보고하게 한다(아래 web-publisher 계약).
- 위임 시 **완전성 체크리스트도 스펙에 포함**해 넘긴다 — web-publisher가 빌드 후 Read/Grep으로 대조해 구현 누락을 자가 수정한다(web-publisher 흐름의 "완전성 자가 대조").
- 위임 시 **컴포넌트·아이콘 재사용 대조도 스펙에 포함**해 넘긴다 — web-publisher가 빌드 후 Read/Grep으로 (a) ui-kit 컴포넌트 중복 재저작, (b) 아이콘셋 밖 인라인 SVG, (c) 쌍 아이콘 글리프 불일치를 자가 수정한다(web-publisher 흐름의 "컴포넌트·아이콘 재사용 자가 대조").
- web-publisher를 부를 도구가 없으면(서브에이전트로 실행 중) HTML을 직접 만들지 말고, "풀페이지 프로토타입을 web-publisher로 빌드해야 한다"는 점과 위 스펙을 메인 세션에 넘긴다.

## 흐름 (리뷰 게이트)

1. `DESIGN.md`·`.design/reference/brand-tokens.json`·생성 이미지(comp)를 읽어 위 스펙(출력 경로·섹션 구조)을 정한다.
2. **자산 갭 해소(빌드 전)** — 위 "자산 갭 해소" 절대로 슬롯을 열거·조달하고 `.design/assets/manifest.json`을 기록한다. 검수 게이트에서 사람이 확인하고, escalate가 있으면 자산을 제공받는다.
3. **완전성 체크리스트 생성(빌드 전)** — 위 "완전성 체크리스트" 절대로 `DESIGN.md`에서 필수 섹션·핵심 문구 앵커·핵심 요소를 뽑는다.
4. web-publisher에 위임해 `.design/prototype/index.html`을 빌드+QA한다 — **매니페스트(슬롯↔파일 경로)와 완전성 체크리스트를 함께** 넘긴다. web-publisher는 빌드·레이아웃 QA에 더해 체크리스트를 Read/Grep으로 대조해 미충족 항목을 자기 맥락 내부 루프로 채운다.
5. **사람이 브라우저로 확인한다 — comp 충실도 게이트.** 확인 시 comp(`.design/reference/page/*.png`)를 **나란히** 두고 구조적 divergence(화살표 위치·패널 비율·헤더 형태 등)를 본다. comp는 비권위("불완전한 한 해석")이므로 **사람이 살릴 점/버릴 점을 판정**한다 — 자동 픽셀 복제는 강제하지 않는다. (자동 비전 대조는 향후 옵션.)
6. 마음에 안 들면 스펙·자산·체크리스트를 고쳐 web-publisher로 다시 빌드한다(4~5 반복).
7. 더 손볼 게 있으면 `DESIGN.md`나 토큰을 고쳐 `design-md-compiler`·이 스킬을 다시 돌리거나, 만족하면 **실제 구현으로 진행**하도록 안내한다.

## 금지 사항

- 이 스킬에서 HTML을 직접 저작하지 않는다(→ web-publisher).
- 이미지 생성 결과를 픽셀 단위로 억지 복제하라고 요구하지 않는다.
- 타사 브랜드 마크를 손으로 흉내내거나 image-gen으로 생성하지 않는다 — Iconify fetch, 없으면 사람 에스컬레이션.
