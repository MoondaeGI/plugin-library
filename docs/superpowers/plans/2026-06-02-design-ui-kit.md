# design-ui-kit + tokens.css 공유 토대 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-tokens.json을 단일 CSS(`tokens.css`)로 물질화해 모든 `.design/` HTML이 공유하게 하고, 그 위에 UI 컴포넌트 라이브러리를 HTML/CSS로 저작하는 `design-ui-kit` 스킬을 추가한다.

**Architecture:** `tokens-to-css.mjs`(결정적 생성기)가 brand-tokens.json + 고정 관례 레이어 → `assets/tokens.css`를 만든다. `design-ui-kit`은 chrome(템플릿)/specimen+class(저작)/토큰(주입) 3분할로 `assets/ui-kit/ui-kit.css` + `view/ui-kit.html`을 산출하고, lock 후 `design-md-compiler`를 호출해 DESIGN.md에 컴포넌트를 반영한다.

**Tech Stack:** Node.js ESM(스킬 스크립트), 순수 HTML/CSS(토큰·컴포넌트), `node:test`(단위 테스트), `five-server`(라이브 프리뷰, 기존 `serve-design.mjs`).

**Spec:** `docs/superpowers/specs/2026-06-02-design-ui-kit-design.md`

---

## Prerequisites (시작 전 확인)

- [ ] **folder-restructure 구현 완료 확인** — 스킬들이 `.design/assets/`·`.design/view/` 표기를 쓰는지 확인한다. 이 플랜의 모든 경로는 그 표기를 전제한다.
  - Run: `grep -rl "\.design/final/" skills/` — 결과가 비어야(또는 기록물만) 한다. `final/`이 아직 남아 있으면 restructure가 미완 → **이 플랜을 시작하지 말고** restructure 플랜을 먼저 실행한다.
- [ ] `npm test`가 현재 통과하는지 확인(회귀 기준선). Run: `npm test`

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | brand-tokens.json → tokens.css 결정적 생성(순수 `generateTokensCss` + CLI) | 신규 |
| `tests/tokens-to-css.test.mjs` | 생성기 단위 테스트 | 신규 |
| `skills/design-ui-kit/SKILL.md` | ui-kit 저작 스킬 본문 | 신규 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | chrome 스캐폴드(보드/패널/매트릭스 골격·슬롯·쇼케이스 CSS·헤더 key-visual 슬롯) | 신규 |
| `skills/design-brand-kit/SKILL.md` | lock 시 tokens.css 생성 단계·overview tokens.css 소비·§10 ui-kit 마커 슬롯 | 수정 |
| `skills/design-logo/SKILL.md` | `view/logos.html`이 tokens.css 소비 | 수정 |
| `skills/design-iconset/SKILL.md` · `scripts/build-iconset-sheet.mjs` | `view/iconset-sheet.html`이 tokens.css 소비 | 수정 |
| `skills/design-md-compiler/SKILL.md` | 입력에 ui-kit.css·ui-kit.html·tokens.css 추가, §4/§5 근거 변경 | 수정 |
| `agents/designer.md` | 파이프라인에 ui-kit 단계 추가 | 수정 |
| `README.md` · `docs/design/README.md` | 파이프라인 문서 갱신 | 수정 |

**변수 네이밍 계약(중요):** `tokens.css`가 내보내는 변수명이 권위다. 컴포넌트(`ui-kit.css`)·chrome·다른 view HTML은 **정확히 그 이름**만 쓴다.
- color: `--color-<kebab(key)>` (예: `surfaceAlt`→`--color-surface-alt`, `textMuted`→`--color-text-muted`, `background`→`--color-background`)
- typography: `--font-<key>` (display/heading/body/mono/accent)
- radius: `--radius-<key>` + `--radius-pill: 999px`
- shadow: `--shadow-<key>`
- page spacing: `--space-section-y`·`--space-container-x`·`--space-card-padding`
- micro spacing(고정 관례): `--space-1`…`--space-8` = 4/8/12/16/24/32/48/64
- tint(파생): `--tint-primary|accent|success|warning|danger`
- brand-tokens.json에 없는 키(`--color-primary-dark/-light`, `--color-bg`)는 **만들지 않는다.** 버튼 active 등 음영은 `filter`/tint로 처리.

---

## Phase A — tokens.css 공유 토대

### Task A1: `tokens-to-css.mjs` 생성기 (TDD)

**Files:**
- Create: `skills/design-brand-kit/scripts/tokens-to-css.mjs`
- Test: `tests/tokens-to-css.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/tokens-to-css.test.mjs`:
```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTokensCss, hexToRgba } from "../skills/design-brand-kit/scripts/tokens-to-css.mjs";

const SAMPLE = {
  color: { primary:"#36495F", accent:"#8C5A6F", background:"#F4EEE4",
           surface:"#FBF7F0", surfaceAlt:"#EBE3D6", text:"#2C2A27",
           textMuted:"#8A8175", border:"#E4DBCD", success:"#6F8A66",
           warning:"#C3974E", danger:"#B05750" },
  typography: { display:'"Gowun Batang", serif', heading:'"Pretendard", sans-serif',
                body:'"Pretendard", sans-serif', mono:'"IBM Plex Mono", monospace',
                accent:'"Gowun Batang", serif' },
  radius: { sm:"8px", md:"14px", lg:"20px", xl:"28px" },
  shadow: { sm:"0 1px 2px rgba(44,42,39,.06)", md:"0 4px 14px rgba(44,42,39,.08)" },
  spacing: { sectionY:"96px", containerX:"24px", cardPadding:"20px" }
};

test("color 토큰을 --color-*(kebab)로 매핑", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--color-primary:\s*#36495F/);
  assert.match(css, /--color-surface-alt:\s*#EBE3D6/);
  assert.match(css, /--color-text-muted:\s*#8A8175/);
  assert.match(css, /--color-background:\s*#F4EEE4/);
});

test("typography를 --font-*로 매핑", () => {
  assert.match(generateTokensCss(SAMPLE), /--font-display:\s*"Gowun Batang"/);
  assert.match(generateTokensCss(SAMPLE), /--font-mono:\s*"IBM Plex Mono"/);
});

test("radius 매핑 + --radius-pill 추가", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--radius-md:\s*14px/);
  assert.match(css, /--radius-pill:\s*999px/);
});

test("페이지 spacing을 --space-section-y 등으로 매핑", () => {
  assert.match(generateTokensCss(SAMPLE), /--space-section-y:\s*96px/);
});

test("입력과 무관하게 고정 관례 spacing 스케일 추가", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--space-1:\s*4px/);
  assert.match(css, /--space-8:\s*64px/);
});

test("brand color에서 tint 파생", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--tint-primary:\s*rgba\(54,\s*73,\s*95,\s*0?\.08\)/);
  assert.match(css, /--tint-danger:\s*rgba\(176,\s*87,\s*80,\s*0?\.12\)/);
});

test("hexToRgba 변환", () => {
  assert.equal(hexToRgba("#36495F", 0.08), "rgba(54, 73, 95, 0.08)");
});

test("brand-tokens에 없는 키는 만들지 않음", () => {
  const css = generateTokensCss(SAMPLE);
  assert.doesNotMatch(css, /--color-primary-dark/);
  assert.doesNotMatch(css, /--color-bg:/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: FAIL — `Cannot find module '.../tokens-to-css.mjs'`

- [ ] **Step 3: 최소 구현**

`skills/design-brand-kit/scripts/tokens-to-css.mjs`:
```js
// brand-tokens.json → assets/tokens.css 결정적 생성.
// (a) brand-tokens.json 매핑 + (b) 고정 관례 primitive 레이어(spacing 스케일·tint).
// 변수 네이밍 계약은 플랜 File Structure 참조 — 컴포넌트 CSS가 이 이름에 의존.
import { readFile, writeFile } from "node:fs/promises";

const MICRO_SPACE = { 1:"4px", 2:"8px", 3:"12px", 4:"16px", 5:"24px", 6:"32px", 7:"48px", 8:"64px" };
const TINT_ALPHA = { primary:0.08, accent:0.10, success:0.14, warning:0.16, danger:0.12 };

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

export function hexToRgba(hex, alpha) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateTokensCss(tokens) {
  const { color = {}, typography = {}, radius = {}, shadow = {}, spacing = {} } = tokens;
  const L = ["/* tokens.css — brand-tokens.json + 고정 관례 레이어 (tokens-to-css.mjs 생성, 직접 수정 금지) */", ":root {"];

  for (const [k, v] of Object.entries(color)) L.push(`  --color-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(typography)) if (v) L.push(`  --font-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(radius)) L.push(`  --radius-${k}: ${v};`);
  L.push(`  --radius-pill: 999px;`);
  for (const [k, v] of Object.entries(shadow)) L.push(`  --shadow-${k}: ${v};`);
  for (const k of ["sectionY", "containerX", "cardPadding"]) {
    if (spacing[k]) L.push(`  --space-${kebab(k)}: ${spacing[k]};`);
  }
  for (const [k, v] of Object.entries(MICRO_SPACE)) L.push(`  --space-${k}: ${v};`);
  for (const [k, a] of Object.entries(TINT_ALPHA)) {
    if (color[k]) L.push(`  --tint-${k}: ${hexToRgba(color[k], a)};`);
  }

  L.push("}", "");
  return L.join("\n");
}

// CLI: node tokens-to-css.mjs <brand-tokens.json> <out tokens.css>
const isMain = import.meta.url === `file://${process.argv[1]}` ||
               process.argv[1]?.endsWith("tokens-to-css.mjs");
if (isMain && process.argv[2]) {
  const [, , inPath, outPath] = process.argv;
  const tokens = JSON.parse(await readFile(inPath, "utf8"));
  await writeFile(outPath, generateTokensCss(tokens), "utf8");
  console.log(`tokens.css written → ${outPath}`);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: PASS (8 tests)

- [ ] **Step 5: 전체 스위트 회귀 없음 확인**

Run: `npm test`
Expected: 모든 테스트 PASS

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/tokens-to-css.test.mjs
git commit -m "feat(brand-kit): brand-tokens.json → tokens.css 결정적 생성기 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task A2: brand-kit이 tokens.css 생성 + overview 소비 + §10 마커

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: lock 단계에 tokens.css 생성 추가**

`SKILL.md`의 흐름 8(lock) 직전/직후에 단계를 추가한다 — 내용 체크리스트:
  - lock 시 `node <이 스킬 디렉터리>/scripts/tokens-to-css.mjs <cwd>/.design/brand-tokens.json <cwd>/.design/assets/tokens.css` 실행해 `assets/tokens.css` 생성(브랜드 토큰이 바뀌면 재실행).
  - "생성물 — 직접 수정 금지, brand-tokens.json을 고치고 재생성" 명시.

- [ ] **Step 2: overview.html이 tokens.css 소비하도록 규칙 변경**

`### overview.html 저작` 절에 추가 — 내용 체크리스트:
  - overview.html은 `<link rel="stylesheet" href="../assets/tokens.css">`를 head에 넣고, 데이터 섹션 색·폰트·radius·shadow를 **값 인라인 대신 `var(--token)`**으로 렌더(실 HEX는 tokens.css가 보유).
  - `view/` 깊이 기준 상대경로(`../assets/tokens.css`).

- [ ] **Step 3: §10에 ui-kit 마커 슬롯 추가**

overview §10(비주얼 & UI 방향) 안에 멱등 슬롯을 두도록 명시:
```html
<!-- design-ui-kit:slot --> (확정 대기) <!-- /design-ui-kit:slot -->
```
(design-logo §6·design-iconset §11 슬롯과 동일 patch-on-lock 규약.)

- [ ] **Step 4: 검증**

Run: `npm run validate`
Expected: PASS (생성물·소스 일치 게이트)
수동: 더미 `.design/`(brand-tokens.json 존재)에서 Step1 명령 실행 → `assets/tokens.css` 생성·`--color-primary` 등 포함 확인.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): lock 시 tokens.css 생성 + overview tokens.css 소비 + §10 ui-kit 슬롯

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task A3: logo·iconset view HTML이 tokens.css 소비

**Files:**
- Modify: `skills/design-logo/SKILL.md`, `skills/design-iconset/SKILL.md`, `skills/design-iconset/scripts/build-iconset-sheet.mjs`

- [ ] **Step 1: build-iconset-sheet.mjs 확인 — 토큰값 인라인 여부**

Read: `skills/design-iconset/scripts/build-iconset-sheet.mjs`
- 토큰 HEX·폰트를 인라인으로 박고 있으면 → `<link href="../assets/tokens.css">` 추가 + 해당 값을 `var(--token)`으로 치환.
- 인자로만 받고 인라인이 없으면 → 변경 없음(주석/링크만).

- [ ] **Step 2: 시트 생성 로직이 바뀌면 테스트 갱신**

Read: `tests/build-iconset-sheet.test.mjs`
- 출력 HTML에 `tokens.css` link가 포함되는지 어서션 추가(로직을 바꾼 경우만).
- Run: `node --test tests/build-iconset-sheet.test.mjs` → 의도대로 FAIL → 구현 → PASS.

- [ ] **Step 3: logos.html·iconset-sheet.html 저작 규칙 갱신**

두 SKILL.md의 시트 저작/생성 절에 "`<link href="../assets/tokens.css">` + `var(--token)` 사용, 값 인라인 금지" 명시.

- [ ] **Step 4: 검증**

Run: `npm test` → PASS
Run: `npm run validate` → PASS

- [ ] **Step 5: 커밋**

```bash
git add skills/design-logo/SKILL.md skills/design-iconset/
git commit -m "refactor(logo,iconset): view 시트가 공유 tokens.css 소비

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase B — design-ui-kit 스킬

### Task B1: chrome 스캐폴드 템플릿

**Files:**
- Create: `skills/design-ui-kit/templates/ui-kit-sheet.html`

- [ ] **Step 1: 템플릿 작성**

`view/` 깊이에서 `../assets/ui-kit/ui-kit.css`를 link하는 자기완결 chrome. **4그룹 섹션·매트릭스 grid·번호 라벨·헤더 key-visual 슬롯·쇼케이스 전용 CSS**를 포함하고, 컴포넌트가 들어갈 자리는 `<!-- slot:* -->` 마커로 비운다. 내용:

```html
<!DOCTYPE html>
<!-- view/ui-kit.html — UI Kit 쇼케이스(개발자 핸드오프). chrome=고정 템플릿.
     컴포넌트 specimen은 <!-- slot:* --> 자리에 design-ui-kit이 저작해 채운다. -->
<html lang="ko">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>UI Kit</title>
<!-- 폰트 CDN link는 brand-tokens.json typography에 맞춰 design-ui-kit이 주입 -->
<!-- slot:font-links -->
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/ui-kit/ui-kit.css">
<style>
  body { margin:0; background:var(--color-background); color:var(--color-text); font-family:var(--font-body); }
  .board { max-width:1180px; margin:0 auto; padding:32px 24px 80px; }
  /* 헤더 밴드: key-visual 은은한 블리드(제목 쪽 불투명 surface로 가독 보호; 패널 뒤엔 안 깔림) */
  .board-head { position:relative; overflow:hidden; display:flex; align-items:center; gap:16px;
    padding:26px 24px; margin-bottom:18px; border:1px solid var(--color-border);
    border-radius:var(--radius-lg); background:var(--color-surface); }
  .board-head::before { content:""; position:absolute; inset:0;
    background:var(--kv, none) right center / cover no-repeat; opacity:.28;
    -webkit-mask-image:linear-gradient(90deg,transparent 0%,transparent 32%,rgba(0,0,0,.55) 62%,#000 100%);
    mask-image:linear-gradient(90deg,transparent 0%,transparent 32%,rgba(0,0,0,.55) 62%,#000 100%); }
  .board-head::after { content:""; position:absolute; inset:0;
    background:linear-gradient(90deg,var(--color-surface) 28%,transparent 78%); }
  .board-head > * { position:relative; z-index:1; }
  .board-head .wm { font:700 22px var(--font-display); color:var(--color-primary); }
  .board-head .sub { font:400 13px var(--font-body); color:var(--color-text-muted); }
  .panel { background:var(--color-surface); border:1px solid var(--color-border);
    border-radius:var(--radius-lg); padding:22px 24px; box-shadow:var(--shadow-sm); margin-bottom:18px; }
  .panel > h2 { margin:0 0 18px; font:700 12px var(--font-heading); letter-spacing:.1em;
    text-transform:uppercase; color:var(--color-primary); }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
  .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
  @media (max-width:780px){ .grid2,.grid3{ grid-template-columns:1fr; } }
  .sub-h { font:600 11px var(--font-heading); letter-spacing:.06em; text-transform:uppercase;
    color:var(--color-text-muted); margin:0 0 12px; }
  .block { margin-bottom:22px; }
  .row { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
  .stack { display:flex; flex-direction:column; gap:12px; }
  .matrix { display:grid; gap:10px 16px; align-items:center; }
  .matrix .h { font:600 11px var(--font-heading); text-transform:uppercase; letter-spacing:.05em; color:var(--color-text-muted); }
  .matrix .st { font:500 12px var(--font-body); color:var(--color-text-muted); }
  .label-n { font:600 11px var(--font-mono); color:var(--color-primary); opacity:.7; margin-bottom:8px; display:block; }
  .swatches { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:12px; }
</style>
</head>
<body>
<div class="board">
  <div class="board-head"><!-- slot:masthead key-visual은 style="--kv:url('../assets/brand-kit/key-visual.png')" 로 .board-head에 주입 --></div>
  <div class="panel"><h2>1 · Foundations</h2><!-- slot:foundations --></div>
  <div class="panel"><h2>2 · Core Interactive Components</h2><!-- slot:core --></div>
  <div class="panel"><h2>3 · Informational Components</h2><!-- slot:informational --></div>
  <div class="panel"><h2>4 · Structural Components</h2><!-- slot:structural --></div>
</div>
</body>
</html>
```

- [ ] **Step 2: 검증 (구조)**

Run: `node -e "const s=require('fs').readFileSync('skills/design-ui-kit/templates/ui-kit-sheet.html','utf8'); ['slot:foundations','slot:core','slot:informational','slot:structural','tokens.css','ui-kit.css'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); console.log('template OK')"`
Expected: `template OK`

- [ ] **Step 3: 커밋**

```bash
git add skills/design-ui-kit/templates/ui-kit-sheet.html
git commit -m "feat(ui-kit): 쇼케이스 chrome 스캐폴드 템플릿 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task B2: design-ui-kit SKILL.md 작성

**Files:**
- Create: `skills/design-ui-kit/SKILL.md`

> 새 스킬 작성이므로 `superpowers:writing-skills`를 사용해 작성·검증한다.

- [ ] **Step 1: frontmatter + 본문 작성** — 아래 내용을 **모두** 포함(스펙 §5 근거):

  - **frontmatter:** `name: design-ui-kit`, `description:`(확정 brand kit 위에 UI 컴포넌트 라이브러리를 HTML/CSS로 저작; §10·토큰·iconset SVG 권위; chrome 템플릿+specimen/css 저작+tokens.css 주입; assets/ui-kit/ui-kit.css + view/ui-kit.html 산출; image-gen 불필요).
  - **입력(권위):** `.design/BRAND_KIT.md` §10(+§7·§8), `.design/assets/tokens.css`(+brand-tokens.json), `.design/assets/icon/*.svg`(currentColor 인라인), 참조 시드 `.design/assets/brand-kit/ui-base.png`·`key-visual.png`.
  - **산출물:** `.design/assets/ui-kit/ui-kit.css`(컴포넌트 class, 상단 `@import "../tokens.css";`, **토큰 변수만 — 하드코딩 HEX·px 0**), `.design/view/ui-kit.html`(템플릿 기반 쇼케이스). ~800줄 초과 시 family별 분리.
  - **3분할 규약(§5.3.1):** chrome=`templates/ui-kit-sheet.html`에서 시작(저작 안 함) / specimen+class=저작 / 토큰=tokens.css 주입. 변수 네이밍 계약 명시(File Structure 표와 동일).
  - **컴포넌트 분류(§5.4):** 4그룹(Foundations/Core Interactive/Informational/Structural). IN/예시/OUT 표(table·nav·card·empty·toast 포함; dashboard panel=예시 패널·차트 제외; 마케팅 히어로 제외→page-image).
  - **게이트1:** family별 목록을 넉넉히 제안→안 쓰는 것만 빼서 확정. **게이트2:** 핵심 스타일 방향(버튼 형태·radius·그림자 깊이)을 §10 근거로 합의.
  - **매트릭스+강제상태(§5.5):** 행=상태×열=변형. hover/focus 정적 표시용 강제상태 class는 의사상태와 **규칙 공유**: `.btn-primary:hover, .btn-primary.is-hover { … }`. 컨트롤은 `.is-checked`·`.is-on` 등.
  - **key-visual 헤더(§5.3.2):** 헤더 밴드 `--kv`로 은은히 허용 / 패널 뒤 금지.
  - **품질 기준(§5.7):** 토큰 준수·시맨틱/접근성(label·alt·role·focus 가시)·대비·반응형(컴포넌트)·§10 "피해야 할 요소" 금지.
  - **흐름:** 게이트1→게이트2→(템플릿 chrome + specimen/css 저작)→`serve-design.mjs`(루트=`.design/`)로 결정적 렌더·번호/라벨 외과 편집→lock(`assets/ui-kit/` 승격 + overview §10 슬롯 한 줄 링크 patch)→**`design-md-compiler` 호출**.
  - **라이브 프리뷰:** `node ../../scripts/lib/serve-design.mjs <cwd>/.design` 최초 1회만 사용자 확인 후 백그라운드.

- [ ] **Step 2: writing-skills 검증**

`superpowers:writing-skills`의 검증 절차로 frontmatter·구조·트리거 description을 점검한다. SKILL.md 내 모든 경로가 `.design/assets/`·`.design/view/` 표기인지 확인.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(ui-kit): design-ui-kit 스킬 추가 (컴포넌트 라이브러리 저작)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase C — design-md-compiler 통합

### Task C1: md-compiler 입력·근거 변경

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: 입력 파일에 추가**

`## 입력 파일` 목록에 추가:
  - `.design/assets/tokens.css`
  - `.design/assets/ui-kit/ui-kit.css`
  - `.design/view/ui-kit.html`

- [ ] **Step 2: §4·§5 근거 규칙 추가**

`## 작성 규칙`에 명시:
  - **§4 디자인 토큰** = `tokens.css`/`brand-tokens.json`에서 실제 변수·값으로.
  - **§5 컴포넌트 규칙** = 확정된 `ui-kit.css`(권위)의 실제 class·variant·상태에서 뽑는다(이미지 추론이 아님). ui-kit.css가 없으면 기존대로 BRAND_KIT §10·이미지에서 추론(폴백).

- [ ] **Step 3: 검증**

Run: `npm run validate` → PASS
수동: 더미 `.design/`(ui-kit.css 존재)로 md-compiler 흐름을 따라가 §5가 ui-kit.css class를 반영하는지 점검.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(md-compiler): ui-kit.css·tokens.css를 §4/§5 권위 입력으로

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Phase D — 파이프라인 배선 · 문서 · 동기화

### Task D1: 에이전트·README 갱신

**Files:**
- Modify: `agents/designer.md`, `README.md`, `docs/design/README.md`

- [ ] **Step 1: 파이프라인에 ui-kit 단계 추가**

세 파일에서 파이프라인 순서를 갱신: `brand-kit → logo → iconset → **ui-kit** → page-image → md-compiler → (html-prototype)`. 각 곳에 design-ui-kit 한 줄 설명 추가. tokens.css가 brand-kit 산출 공유 토대임을 designer.md에 한 줄.

- [ ] **Step 2: 커밋**

```bash
git add agents/designer.md README.md docs/design/README.md
git commit -m "docs: 디자인 파이프라인에 design-ui-kit + tokens.css 반영

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

### Task D2: 동기화 · 최종 검증

- [ ] **Step 1: 생성물 동기화**

Run: `npm run sync`
(루트 `skills/`·`agents/` 기준으로 Codex 번들 `plugins/personal/`·`codex-agents/` 재생성 — gitignore라 커밋엔 안 보임. `.claude-plugin/mcp.json` 등 커밋 생성물은 이번 변경에 MCP가 없어 변화 없음.)

- [ ] **Step 2: 게이트 통과 확인**

Run: `npm run validate` → PASS
Run: `npm test` → 전체 PASS

- [ ] **Step 3: 수동 통합 검증 (더미 `.design/`)**

1. brand-tokens.json 둔 더미 `.design/`에서 `tokens-to-css.mjs` 실행 → `assets/tokens.css` 생성.
2. `templates/ui-kit-sheet.html`을 `view/ui-kit.html`로 복사, 간단한 specimen 몇 개 + 아이콘 인라인.
3. `node scripts/lib/serve-design.mjs <dummy>/.design` → 브라우저로 `view/ui-kit.html` 오픈.
4. 확인: tokens.css 변수 렌더(실 HEX·실폰트), 매트릭스 강제상태(hover/focus/checked 정적 표시), 패널은 불투명 surface(헤더만 key-visual 블리드), 아이콘 currentColor.

- [ ] **Step 4: reload 안내**

`skills/`·`agents/`가 바뀌었으므로 사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. Codex는 `npm run codex:reinstall` 후 열려 있던 세션을 재시작하세요."**

- [ ] **Step 5: 동기화 커밋(생성물 변화가 있으면)**

```bash
git status   # .claude-plugin/* 등 커밋 생성물 변화 확인
# 변화 있으면:
git add -A && git commit -m "chore: npm run sync 생성물 동기화

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** §4 tokens.css→A1/A2/A3, §5 ui-kit→B1/B2, §6 md-compiler→C1, §7 overview 링크→A2(슬롯)+B2(lock patch), §8 범위밖→해당 없음(다크모드·html-prototype 제외 유지), §9 파일→D1, §10 검증→D2. **§5.3.2 key-visual** → B1(템플릿 `--kv` 슬롯)+B2(규칙). 누락 없음.
- **타입/이름 일관성:** 변수 네이밍 계약(File Structure)을 A1 생성기·B1 chrome·B2 컴포넌트가 동일하게 참조(`--color-background`·`--space-1..8`·`--tint-*`). `generateTokensCss`/`hexToRgba` 시그니처가 A1 테스트·구현·CLI에서 일치.
- **선행 의존:** Prerequisites에서 folder-restructure 구현(`assets/`·`view/`)을 게이트로 명시 — 미완 시 중단.
