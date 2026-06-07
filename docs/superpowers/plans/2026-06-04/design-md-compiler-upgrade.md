# design-md-compiler 업그레이드 + typography 1급화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-md-compiler`가 만드는 DESIGN.md를 Apple 분석 문서급으로 구체화하고(토큰 frontmatter + 컴포넌트 산문 + Do/Don't + Responsive + Provenance), 그 전제인 typography 스케일을 brand-kit 토큰으로 1급화한다.

**Architecture:** 두 갈래. (A) `design-brand-kit`의 typography 스키마를 폰트명 문자열 → `{family,size,weight,lineHeight,letterSpacing}` 객체로 1급화하고 `tokens-to-css.mjs`가 `--text-*` 변수를 emit(TDD). (B) `design-md-compiler/SKILL.md`(스킬 프롬프트 prose)를 업그레이드 — 컴파일된 토큰 frontmatter(거울, 매 호출 재생성), 컴포넌트는 §5 산문, rationale는 전사만, 입력 없으면 이전 단계 먼저 안내.

**Tech Stack:** Node.js ESM 스크립트(`node:test`), 마크다운 스킬 프롬프트.

**근거 스펙:** `docs/superpowers/specs/2026-06-04/design-md-compiler-upgrade-design.md`

**확정된 설계 결정:**
- typography 역할 = 기존 `display/heading/body/mono/accent` 유지 + `caption`·`label` 추가(개명 없음 → `--font-*` 계약·ui-kit 문서 불변). 각 역할 = 객체.
- `tokens-to-css.mjs`는 객체/문자열 둘 다 받음(하위호환): 문자열이면 `--font-<role>`만, 객체면 `--font-<role>`(family) + `--text-<role>-{size,weight,leading,tracking}`.
- `directions.json`(contact-sheet 입력)은 문자열 typography 유지 → `build-contact-sheet.mjs` 불변.
- 컴파일러 입력에 `candidate/ui-kit/ui-kit-briefs.md` 추가(의도 전사 근거).

---

## File Structure

| 파일 | 역할 | 변경 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | brand-tokens.json → tokens.css emit | typography 객체 지원 + `--text-*` emit |
| `tests/tokens-to-css.test.mjs` | tokens-to-css 단위 테스트 | 객체/하위호환/caption·label 테스트 추가 |
| `skills/design-brand-kit/SKILL.md` | brand-kit 스킬 프롬프트 | §8 + brand-tokens.json 스키마 객체화·caption/label |
| `skills/design-brand-kit/references/brand-kit-contact-sheet.md` | directions.json 문서 | "directions.json은 문자열 유지" 명시 노트 |
| `skills/design-md-compiler/SKILL.md` | 컴파일러 스킬 프롬프트 | 전면 업그레이드(frontmatter·§1-12·규칙·흐름) |

`build-contact-sheet.mjs`는 **변경 없음**(directions.json 문자열 유지). 전체 테스트 통과로 회귀 확인.

---

## Part A — brand-kit typography 1급화 (TDD)

### Task A1: tokens-to-css 객체 typography 테스트 추가 (실패 작성)

**Files:**
- Test: `tests/tokens-to-css.test.mjs` (기존 파일 끝에 추가)

- [ ] **Step 1: 실패 테스트 작성**

`tests/tokens-to-css.test.mjs` 맨 위 `SAMPLE` 아래에 리치 샘플을 추가한다(파일 상단 import 블록 바로 다음, 기존 `const SAMPLE = {...}` 다음 줄):

```js
const SAMPLE_RICH = {
  color: SAMPLE.color,
  typography: {
    display: { family: '"Gowun Batang", serif', size: "48px", weight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" },
    heading: { family: '"Pretendard", sans-serif', size: "32px", weight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" },
    body:    { family: '"Pretendard", sans-serif', size: "16px", weight: 400, lineHeight: 1.6, letterSpacing: "0" },
    caption: { family: '"Pretendard", sans-serif', size: "13px", weight: 400, lineHeight: 1.4, letterSpacing: "0" },
    label:   { family: '"Pretendard", sans-serif', size: "12px", weight: 600, lineHeight: 1.2, letterSpacing: "0.04em" },
    mono:    { family: '"IBM Plex Mono", monospace', size: "13px", weight: 400, lineHeight: 1.5, letterSpacing: "0" },
    accent:  { family: '"Gowun Batang", serif' }
  }
};
```

파일 끝에 테스트를 추가한다:

```js
test("객체 typography: --font-<role>를 family에서 emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-display:\s*"Gowun Batang", serif/);
  assert.match(css, /--font-heading:\s*"Pretendard", sans-serif/);
});

test("객체 typography: --text-<role>-{size,weight,leading,tracking} emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--text-display-size:\s*48px/);
  assert.match(css, /--text-display-weight:\s*700/);
  assert.match(css, /--text-display-leading:\s*1\.1/);
  assert.match(css, /--text-display-tracking:\s*-0\.02em/);
});

test("caption·label 역할도 emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-caption:\s*"Pretendard"/);
  assert.match(css, /--text-label-tracking:\s*0\.04em/);
});

test("객체에 숫자 필드 없으면 해당 --text-* 생략 (accent는 family만)", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-accent:\s*"Gowun Batang"/);
  assert.doesNotMatch(css, /--text-accent-size/);
});

test("하위호환: 문자열 typography는 --font-<role>만 emit (--text-* 없음)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--font-display:\s*"Gowun Batang"/);
  assert.doesNotMatch(css, /--text-display-size/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: 새 테스트 4개 FAIL (객체가 `[object Object]`로 stringify되어 `--text-*` 없음 / `--font-display`가 `[object Object]`). 기존 테스트는 PASS. 하위호환 테스트는 PASS(이미 문자열 경로 동작).

### Task A2: tokens-to-css.mjs 객체 typography 구현

**Files:**
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs:41`

- [ ] **Step 3: 구현**

`tokens-to-css.mjs`의 41번째 줄:

```js
  for (const [k, v] of Object.entries(typography)) if (v) L.push(`  --font-${kebab(k)}: ${v};`);
```

을 다음으로 교체한다:

```js
  pushTypography(L, typography);
```

그리고 `generateTokensCss` 함수 정의(36번째 줄 `export function generateTokensCss`) **바로 위**에 헬퍼를 추가한다:

```js
// typography 역할당 토큰 emit. 값이 문자열이면 family 단독(하위호환), 객체면 family + 정량 스펙.
// 정량 변수: --text-<role>-size|weight|leading|tracking (leading=lineHeight, tracking=letterSpacing).
function pushTypography(L, typography) {
  const has = (x) => x !== undefined && x !== null && String(x).trim() !== "";
  for (const [k, v] of Object.entries(typography)) {
    if (!v) continue;
    const role = kebab(k);
    if (typeof v === "string") { L.push(`  --font-${role}: ${v};`); continue; }
    if (has(v.family)) L.push(`  --font-${role}: ${v.family};`);
    if (has(v.size)) L.push(`  --text-${role}-size: ${v.size};`);
    if (has(v.weight)) L.push(`  --text-${role}-weight: ${v.weight};`);
    if (has(v.lineHeight)) L.push(`  --text-${role}-leading: ${v.lineHeight};`);
    if (has(v.letterSpacing)) L.push(`  --text-${role}-tracking: ${v.letterSpacing};`);
  }
}
```

- [ ] **Step 4: 테스트 통과 확인 + 전체 회귀**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: 전부 PASS.

Run: `npm test`
Expected: 전체 스위트 PASS (특히 `build-contact-sheet.test.mjs` 회귀 없음 — directions.json 문자열 경로 불변).

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/tokens-to-css.test.mjs
git commit -m "feat(brand-kit): typography 토큰을 정량 객체로 1급화 (--text-* emit, 문자열 하위호환)"
```

### Task A3: brand-kit SKILL.md 스키마·§8 업데이트

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md:142-150` (§8 타이포그래피)
- Modify: `skills/design-brand-kit/SKILL.md:198` (brand-tokens.json 스키마)

- [ ] **Step 1: §8 역할 목록에 캡션/라벨을 토큰 역할로 명시**

`SKILL.md` 142-150번째 줄(§8 블록)에서 `- 타입 스케일 (예: ...)` 줄(149)을 다음으로 교체한다:

```md
- 타입 스케일 — 역할별 size/weight/lineHeight/letterSpacing을 정한다 (`brand-tokens.json`의 `typography.<role>` 객체로 박힘). 역할: display · heading · body · caption · label · mono · accent. (예: Display 48/700/1.1/-0.02em, H1=heading 32/600/1.25/-0.01em, Body 16/400/1.6/0, Caption 13/400/1.4/0, Label 12/600/1.2/0.04em)
```

- [ ] **Step 2: brand-tokens.json 스키마를 객체 typography로 교체**

`SKILL.md:198`의:

```json
  "typography": { "display": "", "heading": "", "body": "", "mono": "", "accent": "" },
```

을 다음으로 교체한다:

```json
  "typography": {
    "display": { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "heading": { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "body":    { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "caption": { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "label":   { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "mono":    { "family": "", "size": "", "weight": 0, "lineHeight": 0, "letterSpacing": "" },
    "accent":  { "family": "" }
  },
```

- [ ] **Step 3: 스키마 설명 노트 보강**

`SKILL.md:206`의 설명 문단 시작(`> **타이포(§8)·\`typography\` 토큰의 폰트는...`) 바로 앞에 새 노트 한 줄을 추가한다:

```md
> **`typography.<role>`는 객체다**: `family`(폰트 스택, 카탈로그 실존값) + `size`/`weight`/`lineHeight`/`letterSpacing`(정량 스펙). `tokens-to-css.mjs`가 `--font-<role>`(family) + `--text-<role>-{size,weight,leading,tracking}`로 emit한다. `accent`는 family만 필수, 나머지 정량 필드는 선택(있는 것만 emit). 폰트명 문자열(구형)도 하위호환으로 받지만, 신규 킷은 객체로 작성한다.
```

- [ ] **Step 4: 검수**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: PASS (문서 변경이라 직접 영향 없음 — 회귀 확인용).

육안 확인: `SKILL.md` §8과 스키마 블록이 객체 형식·7역할을 보여주는가.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "docs(brand-kit): §8 타입 스케일·brand-tokens.json typography를 정량 객체·7역할로"
```

### Task A4: contact-sheet 문서에 스키마 구분 노트

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-contact-sheet.md:80` 근처

- [ ] **Step 1: directions.json은 문자열 유지 명시**

`brand-kit-contact-sheet.md`의 80번째 줄(`| \`directions[n].typography.body\` | string | 본문 폰트 스택. |`) **다음 줄**에 노트를 추가한다:

```md

> **참고:** `directions.json`의 `typography`는 발산 탐색용이라 **폰트 스택 문자열만** 쓴다(`display`/`body`). lock된 `brand-tokens.json`의 `typography.<role>` 정량 객체(`tokens-to-css.mjs` 입력)와는 **다른 스키마**다 — 컨택트 시트는 색·폰트 *방향* 비교가 목적이므로 정량 스펙을 받지 않는다.
```

- [ ] **Step 2: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-contact-sheet.md
git commit -m "docs(brand-kit): directions.json typography는 문자열, brand-tokens.json은 객체임을 명시"
```

---

## Part B — design-md-compiler SKILL.md 업그레이드

### Task B1: design-md-compiler SKILL.md 전면 교체

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md` (전체 교체)

- [ ] **Step 1: 새 SKILL.md 작성**

`skills/design-md-compiler/SKILL.md` 전체를 다음으로 교체한다:

````md
---
name: design-md-compiler
description: 브랜드 킷·페이지 이미지 브리프·생성 이미지 목록을 바탕으로 실제 구현자가 따를 수 있는 DESIGN.md를 만들 때 사용한다. 토큰 frontmatter + 컴포넌트 산문으로 외부 도구에서도 단독 활용 가능하게 컴파일한다.
---

# Design MD Compiler

당신은 브랜드와 이미지 레퍼런스를 실제 구현 규칙으로 변환하는 디자인 시스템 정리자다.

## 목적

이미지 생성 결과와 브랜드 문서를 그대로 두지 않고, HTML/CSS/React 구현자가 따를 수 있는 `DESIGN.md`로 정리한다. DESIGN.md는 **이 파이프라인 밖의 다른 도구·AI가 단독으로 받아 써도 동작하도록(portable)** 토큰을 frontmatter에 컴파일하고 컴포넌트를 산문으로 충실히 기술한 self-contained 문서다.

## 입력 파일 (있는 것만 읽는다, cwd 기준)

- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- `.design/assets/tokens.css` (있으면 — §4 디자인 토큰·frontmatter의 실제 변수·값 권위)
- `.design/assets/ui-kit/ui-kit.css` (있으면 — §5 컴포넌트 규칙의 권위: 확정된 class·variant·상태)
- `.design/candidate/ui-kit/ui-kit-briefs.md` (있으면 — §5 컴포넌트 **의도(왜 이 형태)** 전사 근거)
- `.design/view/ui-kit.html` (있으면 — 컴포넌트 쇼케이스 룩·분류 참조)
- `.design/candidate/brand-kit/brand-briefs.md`
- `.design/candidate/page/page-briefs.md`
- `.design/view/overview.html` (있으면 — 브랜드 오버뷰 룩·섹션 구조 참조)
- `.design/assets/brand-kit/*.png`, `.design/assets/brand-kit/icon/*.png` (확정 base 자산)
- `.design/assets/logo/*.png`, `.design/assets/icon/*.svg`, `.design/assets/page/*.{png,jpg,jpeg,webp}` (확정 deliverable)
- `.design/candidate/page/*.{png,jpg,jpeg,webp}` (확정 전 시안 폴백)
- `.design/manifest.json` (선택 — 캡션·순서·섹션 매핑 메타, 없으면 파일명 glob)

## 출력 파일

- `DESIGN.md` (대상 프로젝트 cwd 루트)

## DESIGN.md 구조

### A. Frontmatter (tokens.css에서 컴파일 — `do not edit`, 매 호출 재생성)

`DESIGN.md` 맨 위에 `---`로 감싼 YAML frontmatter를 둔다. 값은 **손으로 쓰지 않고 `tokens.css`에서 긁어** 채운다(`tokens.css` 없으면 `brand-tokens.json` 폴백). 컴포넌트는 frontmatter에 넣지 않는다(§5 산문).

```yaml
---
# generated from .design/assets/tokens.css — do not edit (regenerated on every compile)
meta:          # 제품 에센스 한 문단
colors:        # 의미키 → HEX                       (--color-*)
typography:    # 역할 → {family,size,weight,lineHeight,letterSpacing}  (--font-* + --text-*-*)
spacing:       # (--space-*)
radius:        # (--radius-*)
shadow:        # (--shadow-*)
border:        # (있으면)
breakpoints:   # (--bp-* 있으면 — 없으면 생략 + §12에 표시)
---
```

### B. 본문 (산문 — 모든 토큰 참조는 `{colors.x}`·`{typography.y}` 점 표기)

```md
# DESIGN.md

## 1. 제품 요약
- 제품명: / 대상 사용자: / 핵심 가치: / 화면 목적:

## 2. 브랜드 성격
- 키워드: / 말투: / 사용자가 느껴야 할 감정: / 피해야 할 인상:

## 3. 시각 방향
- 전체 분위기: / 레이아웃 원칙: / 이미지 사용 방식: / 아이콘·일러스트 방향:
- Key Characteristics: (이 디자인을 한 줄씩 규정하는 불릿 5~8개)

## 4. 디자인 토큰
각 토큰은 값 + "왜/어디"를 함께 적는다(아래 작성 규칙 D3 전사).
### Colors        — 의미키·{colors.x}·HEX·용도
### Typography    — 역할·{typography.x}·family/size/weight/lineHeight/letterSpacing·용도
### Spacing
### Radius
### Elevation     — shadow/elevation 레벨·용도 (별도 대섹션 없이 여기에)
### Shapes        — radius 스케일·기하 규칙 (여기에)
### Border

## 5. 컴포넌트 규칙
컴포넌트마다 스펙 블록: **의미 이름** + 실제 ui-kit class + 배경/텍스트/타이포/radius/padding(전부 {token.ref}) + 상태(default·active·focus 등 ui-kit.css 강제상태 그대로) + 용도 + 살릴점/버릴점.
### Button / Input / Card / Badge / Navigation / Table / Dashboard Panel / Alert·Toast / Empty State …(ui-kit.css에 있는 것)

## 6. 페이지 섹션 규칙
### Hero / Problem / Product Mechanism / Feature Grid / Dashboard·Evidence / CTA·Footer

## 7. Responsive Behavior
breakpoint 표·터치타깃·collapsing 전략. (breakpoint 토큰 없으면 "고정폭 데스크톱 전용"으로 적고 §12에 표시)

## 8. 이미지 에셋 사용 규칙
- 로고: / 배경: / 제품 목업: / UI 킷 레퍼런스: / 사용하지 말아야 할 방식:

## 9. Do's & Don'ts
토큰 참조로 박은 강제·금지(예: "모든 인터랙티브는 {colors.primary} — 2번째 accent 금지").

## 10. 구현 제약
- HTML/CSS: / React 이식: / 접근성: / 반응형: / 성능:

## 11. Anti-slop checklist
- Hero가 2~3줄 안에 들어오는가? / 버튼 대비가 충분한가? / 의미 없는 blob·glow가 없는가?
- 섹션 간 레이아웃이 반복되지 않는가? / UI 텍스트가 이미지에 박혀 있지 않은가? / 컴포넌트가 재사용 가능한 구조인가?

## 12. Provenance & Known Gaps
- 읽은 입력 파일 목록 / 추측한 값(표시) / 누락 입력(어떤 이전 단계가 필요한지) / 근거 부족 항목 / frontmatter는 tokens.css에서 재생성됨을 명시.
```

## 작성 규칙

- **D1 — frontmatter 컴파일(거울)**: frontmatter 값은 `tokens.css`(없으면 `brand-tokens.json`)에서 긁어 채운다. 손으로 쓰지 않으며 `# generated ... do not edit` 주석을 박는다. `tokens.css`가 단일 권위, frontmatter는 거울(projection). typography는 `--font-<role>`(family)와 `--text-<role>-{size,weight,leading,tracking}`를 합쳐 역할 객체로 적는다.
- **D6 — 재생성 트리거**: 이 스킬은 호출될 때마다 frontmatter를 `tokens.css`에서 **항상 재컴파일**한다(거울을 매번 다시 닦음). 이미 `DESIGN.md`가 있고 `tokens.css`가 더 최신이면 "frontmatter stale — 재생성함"을 §12에 적는다. "한 번 만들고 방치"로 인한 drift를 막는다.
- **D2 — 컴포넌트는 §5 산문**: 컴포넌트는 frontmatter에 구조화 YAML로 넣지 않는다(임의 CSS→YAML 변환은 깨지기 쉽고 ui-kit.css와 이중 관리). §5에 의미 이름 + 실제 ui-kit class명 + 토큰 참조 스펙 + 상태 + 용도로 산문 기술한다. 포터빌리티는 토큰 frontmatter + 이 산문으로 달성한다.
- **§5 컴포넌트 권위**: 확정된 `assets/ui-kit/ui-kit.css`(있으면)의 **실제 class·variant·강제상태**(`.is-hover`·`.is-checked` 등)에서 뽑아 구현자가 복사해 쓰게 한다 — 이미지 추론이 아니다. 없으면 BRAND_KIT §10·이미지에서 추론(폴백)하되 §12에 폴백임을 표시.
- **D3 — rationale 전사, 창작 금지**: 토큰/컴포넌트별 "왜/어디"는 ① `BRAND_KIT.md` §7/§8/§10·금지 패턴 + `ui-kit-briefs.md`의 의도를 **그대로 옮긴다** → ② 근거 없으면 **사실만**("이 토큰은 `.btn-primary`에서 참조됨") → 시적 의도를 지어내지 않는다. 근거 얇은 항목은 얇은 채로 두고 §12에 "근거 부족" 표시.
- **토큰 참조 문법**: 본문 산문은 인라인 HEX·px 대신 `{colors.primary}`·`{typography.body}` 점 표기로 frontmatter를 가리킨다.
- 색상은 HEX, spacing·radius·shadow는 실제 CSS 값(frontmatter에 정의, 산문은 참조).
- **이미지 레퍼런스의 살릴 점과 버릴 점을 구분한다.** 최종 문구는 이미지가 아니라 코드에 있어야 한다고 명시한다.
- 이미지는 `assets/` 하위 폴더로 종류 구분: `assets/brand-kit/`·`assets/logo/`·`assets/icon/`·`assets/page/`. `view/overview.html`은 브랜드 오버뷰 룩 참조.

## 금지 사항

- "고급스럽게"·"깔끔하게" 같은 추상 표현만 남기지 않는다.
- 이미지 결과를 무조건 정답으로 취급하지 않는다.
- 구현 불가능한 효과를 강제하지 않는다.
- **근거 없는 의도(rationale)를 창작하지 않는다**(D3). 빈칸을 그럴듯하게 메우지 말고 §12에 표시한다.

## 흐름 (리뷰 게이트)

1. **입력 점검 → 없으면 이전 단계 먼저 안내(D4)**:
   - `ui-kit.css` 없음 → "§5를 제대로 채우려면 `design-ui-kit`을 먼저 lock하고 다시 호출하세요"를 먼저 안내. 사용자가 그래도 진행하면 폴백(BRAND_KIT §10·이미지 추론) + §12 Known Gaps.
   - `--bp-*` breakpoint 토큰 없음 → "반응형이 필요하면 `design-brand-kit`에서 폼팩터를 정하고 다시 시도하세요" 안내. 진행 시 §7은 "고정폭 데스크톱 전용".
   - `page-briefs.md`/page 이미지 없음 → §6은 가능한 범위만, 누락은 §12.
2. 존재하는 입력을 읽고 `DESIGN.md`(cwd 루트)를 작성한다 — frontmatter는 tokens.css에서 재컴파일(D1·D6), 본문은 §1–12.
3. 사람이 DESIGN.md를 검토한다.
4. 마음에 안 들면 입력을 보강하거나 DESIGN.md를 고쳐(2단계) 다시 검토한다(3단계). 좋으면 안내한다: **"다음 단계: `design-html-prototype`"**.
````

- [ ] **Step 2: 구조 검수 (셀프 체크리스트)**

`skills/design-md-compiler/SKILL.md`를 다시 읽고 확인한다:
- frontmatter 블록이 **토큰만**(컴포넌트 없음) 담는가 — D2.
- §1~12가 다 있고 §7 Responsive·§9 Do's&Don'ts·§12 Provenance가 신설됐는가.
- 입력 목록에 `candidate/ui-kit/ui-kit-briefs.md`가 있는가 — D3.
- 작성 규칙에 D1(컴파일 거울)·D6(재생성 트리거)·D3(전사·창작 금지)가 박혔는가.
- 흐름 1단계가 "이전 단계 먼저 안내"인가 — D4.

빠진 항목 있으면 인라인 수정.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(design-md-compiler): 토큰 frontmatter·컴포넌트 산문·Do/Don't·Responsive·Provenance로 DESIGN.md 해상도 업그레이드"
```

### Task B2: Codex 번들 재생성 + 전체 테스트

**Files:**
- (생성물) `plugins/personal/` — gitignore, 커밋 안 함

- [ ] **Step 1: sync 실행 (skills/ 변경 반영)**

Run: `npm run sync`
Expected: 에러 없이 완료. `plugins/personal/`(gitignore)·`codex-agents/`(gitignore) 재생성. 커밋 대상 생성물(`.claude-plugin/mcp.json` 등)은 이번 변경(MCP 무관)으로 바뀌지 않아야 함.

- [ ] **Step 2: 전체 테스트**

Run: `npm test`
Expected: 전체 PASS.

- [ ] **Step 3: sync로 커밋 대상 생성물이 바뀌었는지 확인**

Run: `git status --short`
Expected: 커밋되지 않은 추적 파일 변화가 없어야 정상(번들은 gitignore). 만약 `.claude-plugin/mcp.json` 등이 바뀌면 함께 커밋:

```bash
git add -A
git commit -m "chore: sync 생성물 갱신"
```
(바뀐 게 없으면 이 커밋은 생략.)

---

## Self-Review

**1. Spec coverage:**
- D1 토큰 frontmatter 거울 → Task B1 작성 규칙 D1. ✅
- D2 컴포넌트 산문 → Task B1 §5·작성 규칙 D2. ✅
- D3 전사·창작 금지 → Task B1 작성 규칙 D3·금지 사항. ✅
- D4 이전 단계 먼저 → Task B1 흐름 1단계. ✅
- D6 재생성 트리거 → Task B1 작성 규칙 D6. ✅
- D7 typography 1급화 → Task A1~A4. ✅
- 구조 §1~12(§7·§9·§12 신설) → Task B1 DESIGN.md 구조. ✅
- ui-kit-briefs.md 입력 추가 → Task B1 입력 목록 + B2 검수. ✅
- directions.json 문자열 유지/contact-sheet 불변 → Part A 설계 + Task A4 노트 + A2 Step4 회귀. ✅

**2. Placeholder scan:** 모든 코드 step에 실제 코드·정확 경로·명령·기대 출력 포함. "구현 계획에서 확정"류 미해결 없음(역할 세트·var명 확정됨). ✅

**3. Type consistency:** `pushTypography(L, typography)` 시그니처가 호출부(line 41 교체)와 정의부 일치. emit 변수명 `--text-<role>-{size,weight,leading,tracking}`가 테스트(A1)·구현(A2)·문서(A3)·컴파일러(B1)에서 동일. ✅

---

## Execution Handoff

(플랜 저장 후 실행 방식 선택은 본문에서 안내)
