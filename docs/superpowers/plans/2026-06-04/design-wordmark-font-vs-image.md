# 워드마크 font-vs-image + design-logo 역할 재정의 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 워드마크를 brand-kit에서 폰트/이미지로 분기하고(폰트면 이미지 생성 스킵), 워드마크 폰트+레터링을 tokens.css의 단일 `.wordmark` 클래스로 묶어 드리프트를 막으며, design-logo 역할을 온디맨드 로고 제작/교체로 재정의한다.

**Architecture:** `tokens-to-css.mjs`가 brand-tokens.json의 선택 `wordmark` 블록에서 `--font-wordmark`(있으면)와 단일 `.wordmark` 클래스를 emit한다. brand-kit이 §6에서 모드(폰트/이미지)를 도메인 역게이트와 함께 결정하고, 폰트 모드면 `wordmark-base.png`를 만들지 않고 overview·아키타입·ui-kit masthead가 `<span class="wordmark">`로 렌더한다. font-catalog에 로고타입 서브셋을 추가하고, design-logo는 역할만 재정의한다.

**Tech Stack:** Node.js ESM(스킬 스크립트), 순수 HTML/CSS(토큰·컴포넌트), `node:test`(단위 테스트), 마크다운 스킬 문서.

**Spec:** `docs/superpowers/specs/2026-06-04/design-wordmark-font-vs-image-design.md`

---

## Prerequisites

- [ ] `npm test`가 현재 통과하는지 확인(회귀 기준선). Run: `npm test` → 전체 PASS(현재 129).
- [ ] 선행 의존 없음 — 이 플랜은 이미 머지된 design-ui-kit + tokens.css 토대 위에서 동작한다(`assets/tokens.css`·`tokens-to-css.mjs`·ui-kit 템플릿 존재 전제).

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `wordmark` 블록 → `--font-wordmark` + `.wordmark` 클래스 emit | 수정 |
| `tests/tokens-to-css.test.mjs` | `.wordmark`·`--font-wordmark`·기본값 테스트 | 수정 |
| `skills/references/design/font-catalog.md` | Logotype(워드마크용) 서브셋 섹션 | 수정 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens.json `wordmark` 블록, §6 모드+역게이트, 폰트 모드 이미지 스킵, overview §1 분기+폰트링크, §8 Logotype 우선, 강등 검토 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §1·§6 워드마크 슬롯 img/span 분기 | 수정 |
| `skills/design-brand-kit/references/archetypes/{a-ruled-grid,b-editorial,c-sidebar,d-stacked-bands}.md` | 워드마크 슬롯 모드별 분기 | 수정 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | `.board-head .wm` 제거, `.wordmark` 사용 | 수정 |
| `skills/design-ui-kit/SKILL.md` | masthead `.wordmark` 사용 + `slot:font-links`에 wordmark 폰트 포함 | 수정 |
| `skills/design-logo/SKILL.md` | description·목적 재정의 + 선택성 등급 | 수정 |

**계약(중요):**
- **`wordmark` 블록 스키마**(brand-tokens.json 최상위, 전부 선택): `{ "font": "", "tracking": "", "weight": "700", "case": "none", "color": "primary" }`. `font` 비면 `--font-wordmark` 생략(→ display 폴백). 나머지 비면 기본값(tracking=normal, weight=700, case=none, color=text).
- **`.wordmark` 클래스 계약**: `font-family: var(--font-wordmark, var(--font-display))` + `letter-spacing`·`font-weight`·`text-transform`·`color: var(--color-<key>)`. overview §1·ui-kit masthead·아키타입은 폰트 모드에서 `<span class="wordmark">브랜드명</span>`만 쓴다(레터링 재구현 금지).

---

## Phase A — tokens-to-css `.wordmark` 클래스 (TDD)

### Task A1: `wordmark` 블록 → `--font-wordmark` + `.wordmark` 클래스

**Files:**
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs`
- Test: `tests/tokens-to-css.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/tokens-to-css.test.mjs` 파일 **맨 끝**(마지막 `});` 다음)에 아래 테스트를 추가한다:

```js
test("wordmark 블록 없으면 기본값 .wordmark 클래스 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.wordmark\s*\{/);
  assert.match(css, /font-family:\s*var\(--font-wordmark,\s*var\(--font-display\)\)/);
  assert.match(css, /letter-spacing:\s*normal/);
  assert.match(css, /font-weight:\s*700/);
  assert.match(css, /text-transform:\s*none/);
  assert.match(css, /color:\s*var\(--color-text\)/);
});

test("wordmark.font 있으면 --font-wordmark emit", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { font: '"Gugi", sans-serif' } });
  assert.match(css, /--font-wordmark:\s*"Gugi", sans-serif/);
});

test("wordmark.font 없으면 --font-wordmark 생략", () => {
  assert.doesNotMatch(generateTokensCss(SAMPLE), /--font-wordmark:/);
});

test("wordmark 레터링 값 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { tracking: "-0.02em", weight: "800", case: "uppercase", color: "primary" } });
  assert.match(css, /letter-spacing:\s*-0\.02em/);
  assert.match(css, /font-weight:\s*800/);
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /color:\s*var\(--color-primary\)/);
});

test("wordmark.color가 없는 토큰이면 text로 폴백", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { color: "nonexistent" } });
  assert.match(css, /color:\s*var\(--color-text\)/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: FAIL — `.wordmark` 미생성으로 새 테스트 5개 실패(기존 8개는 PASS).

- [ ] **Step 3: 구현**

`skills/design-brand-kit/scripts/tokens-to-css.mjs`에서 두 곳을 수정한다.

(a) 상수 블록(`TINT_ALPHA` 정의 아래)에 워드마크 기본값과 헬퍼를 추가:

```js
const WORDMARK_DEFAULTS = { tracking: "normal", weight: "700", case: "none", color: "text" };

const pick = (v, d) => (v !== undefined && v !== null && String(v).trim() !== "" ? v : d);

function generateWordmarkClass(wordmark = {}, color = {}) {
  const colorKey = color[wordmark.color] ? wordmark.color : "text";
  return [
    ".wordmark {",
    "  font-family: var(--font-wordmark, var(--font-display));",
    `  letter-spacing: ${pick(wordmark.tracking, WORDMARK_DEFAULTS.tracking)};`,
    `  font-weight: ${pick(wordmark.weight, WORDMARK_DEFAULTS.weight)};`,
    `  text-transform: ${pick(wordmark.case, WORDMARK_DEFAULTS.case)};`,
    `  color: var(--color-${kebab(colorKey)});`,
    "}",
    "",
  ].join("\n");
}
```

(b) `generateTokensCss`를 수정 — `wordmark`를 destructure에 추가하고, typography 루프 직후에 `--font-wordmark`를 조건부 emit하고, `:root` 닫은 뒤 `.wordmark` 클래스를 덧붙인다:

```js
export function generateTokensCss(tokens) {
  const { color = {}, typography = {}, radius = {}, shadow = {}, spacing = {}, wordmark = {} } = tokens;
  const L = ["/* tokens.css — brand-tokens.json + 고정 관례 레이어 (tokens-to-css.mjs 생성, 직접 수정 금지) */", ":root {"];

  for (const [k, v] of Object.entries(color)) L.push(`  --color-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(typography)) if (v) L.push(`  --font-${kebab(k)}: ${v};`);
  if (wordmark.font) L.push(`  --font-wordmark: ${wordmark.font};`);
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
  return L.join("\n") + generateWordmarkClass(wordmark, color);
}
```

> 주: 헤더 주석에 "워드마크 .wordmark 클래스 포함"을 덧붙여도 되지만 기능엔 무관. `kebab`·`hexToRgba`·`MICRO_SPACE`·`TINT_ALPHA`는 기존 정의 그대로 사용.

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: PASS (13 tests — 기존 8 + 신규 5).

- [ ] **Step 5: 전체 회귀 확인**

Run: `npm test`
Expected: 전체 PASS(기존 129 + 5 = 134).

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/tokens-to-css.test.mjs
git commit -F - <<'EOF'
feat(brand-kit): tokens.css에 워드마크 .wordmark 클래스 + --font-wordmark 생성

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase B — font-catalog 로고타입 서브셋

### Task B1: Logotype 섹션 추가

**Files:**
- Modify: `skills/references/design/font-catalog.md`

- [ ] **Step 1: Logotype 섹션 추가**

`skills/references/design/font-catalog.md`에서 기존 `## Display (heading / 임팩트)` 섹션 **다음**(다음 `---` 또는 다음 `##` 직전)에 새 섹션을 추가한다. 항목 형식은 기존과 동일(**폰트명** — 역할 · 성격 한 줄 · 한글 Y/N · 라이선스 · URL · 폴백 스택). 카탈로그의 검증 백본 원칙(실존·로드 가능 폰트만)을 지킨다 — 아래는 실존 Google Fonts 한글 로고타입급 후보:

```md
---

## Logotype (워드마크용)

큰 크기에서 개성·균형이 사는 로고타입급 페이스. **워드마크가 폰트 모드일 때 전용 로고타입 폰트로 우선 고른다**(brand-tokens.json `wordmark.font`). display 폰트로 충분하면 비워 display를 재사용한다. 과용 금지 — 워드마크 한 곳에만 쓴다.

- **Gugi** — logotype/display · 붓 기운 도는 굵은 단일 웨이트, 강한 개성의 한글 로고타입 · 한글 Y · OFL · https://fonts.google.com/specimen/Gugi · `"Gugi", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Gasoek One** — logotype/display · 초굵은 임팩트 산세리프, 포스터·로고용 · 한글 Y · OFL · https://fonts.google.com/specimen/Gasoek+One · `"Gasoek One", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Jua** — logotype/display · 둥글고 친근한 손글씨풍 굵은 마크, 캐주얼 브랜드 · 한글 Y · OFL · https://fonts.google.com/specimen/Jua · `"Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Do Hyeon** — logotype/display · 각진 고딕 단일 웨이트, 견고한 산업·테크 워드마크 · 한글 Y · OFL · https://fonts.google.com/specimen/Do+Hyeon · `"Do Hyeon", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Song Myung** — logotype/editorial · 가는 명조 로고타입, 문학·럭셔리·에디토리얼 워드마크 · 한글 Y · OFL · https://fonts.google.com/specimen/Song+Myung · `"Song Myung", "Nanum Myeongjo", Georgia, serif`
- **Diphylleia** — logotype/editorial · 고대비 세리프, 우아한 프리미엄 워드마크 · 한글 Y · OFL · https://fonts.google.com/specimen/Diphylleia · `"Diphylleia", "Nanum Myeongjo", Georgia, serif`
```

> 라틴 전용 브랜드라면 기존 Display/Serif 섹션의 페이스(예: 임팩트 sans, 고대비 세리프)를 로고타입으로 그대로 쓸 수 있다 — 별도 추가 불필요. 이 섹션은 한글 로고타입 공백을 메우는 용도.

- [ ] **Step 2: 구조 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/references/design/font-catalog.md','utf8'); if(!/## Logotype/.test(s)) throw new Error('Logotype 섹션 없음'); if(!/Gugi/.test(s)) throw new Error('항목 없음'); console.log('font-catalog OK')"`
Expected: `font-catalog OK`

- [ ] **Step 3: 커밋**

```bash
git add skills/references/design/font-catalog.md
git commit -F - <<'EOF'
feat(font-catalog): 워드마크용 Logotype 서브셋 추가

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase C — brand-kit 변경

### Task C1: brand-kit SKILL.md — wordmark 블록·§6 모드·이미지 스킵·overview·§8

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: brand-tokens.json 구조에 `wordmark` 블록 추가**

`## brand-tokens.json 구조`의 JSON에서 `"spacing": { ... }` 줄 **다음**에 wordmark 블록을 추가한다(마지막 항목이므로 spacing 줄 끝에 콤마 추가):

```json
  "spacing": { "sectionY": "", "containerX": "", "cardPadding": "" },
  "wordmark": { "font": "", "tracking": "", "weight": "700", "case": "none", "color": "primary" }
```

그리고 JSON 아래 설명 단락에 한 줄 추가:
> `wordmark`(선택)는 **폰트 모드 워드마크**의 스타일이다. `font`는 비우면 `display` 재사용, 채우면 `font-catalog.md`의 **Logotype 서브셋**에서 고른 전용 폰트(폴백 스택 포함). `tracking`/`weight`/`case`(none|uppercase|lowercase)/`color`(color 토큰 키)는 `tokens.css`의 `.wordmark` 클래스로 emit된다 — 이게 워드마크 레터링의 단일 권위이며 §6 산문에 중복하지 않는다. 이미지 모드면 이 블록은 무시된다.

- [ ] **Step 2: §6 워드마크 방향에 모드 결정 + 도메인 역게이트**

`## BRAND_KIT.md 구조`의 `## 6. 로고 방향 (Logo Direction)` 블록에서 `- 워드마크 방향:` 한 줄을 아래로 교체한다:

```md
- 워드마크 방향:
  - 모드: (폰트 | 이미지 — **기본 바이어스 폰트**). **도메인 역게이트**: 로고 방향이 콤비네이션 마크·엠블럼·커스텀 레터마크이거나, `references/brand-kit-image.md`가 해당 도메인(럭셔리·뷰티·패션·컬처럴·실험)에 커스텀/세리프 워드마크를 처방하면 **이미지 모드 권장**. 폰트 바이어스는 "조판형 워드마크" 한정 — 정체성이 커스텀 레터링인 브랜드를 폰트로 평준화하지 않는다.
  - (폰트 모드) 텍스트(브랜드명) · 폰트(display 재사용 | 카탈로그 Logotype 서브셋의 전용 폰트). case/tracking/weight/color는 brand-tokens.json `wordmark` 블록이 권위(여기 산문 중복 금지).
  - (이미지 모드) `wordmark-base.png`가 production 워드마크(재저작 없음). 단, 단순 타입 조판이면 폰트 모드 재분류 검토(특히 한글 — 글리프 뭉갬).
```

- [ ] **Step 3: 폰트 모드면 wordmark-base.png 생성 스킵**

`## 이미지 생성` 섹션의 투명 라우팅 항목(`logo-base.png`·`wordmark-base.png`… 줄)과 `## 흐름`의 **5. 자산 생산** 항목에 각각 한 줄 추가:
- 투명 라우팅 항목 끝에: "**워드마크가 폰트 모드면 `wordmark-base.png`를 생성하지 않는다**(텍스트로 렌더). 이미지 모드일 때만 생성."
- 흐름 5(자산 생산)에: "워드마크 **이미지 모드일 때만** `wordmark-base.png` 생성. 폰트 모드면 스킵하고 §1을 `<span class="wordmark">`로 저작."

- [ ] **Step 4: overview.html 저작에 워드마크 모드 분기 + 폰트 링크**

`### overview.html 저작` 절에서 §1 워드마크 관련 지침을 아래 내용으로 보강한다(기존 "§1 워드마크는 `../assets/brand-kit/wordmark-base.png`를 `<img>`로" 문구를 모드 분기로 교체/확장):

내용 체크리스트:
  - **이미지 모드**: §1 워드마크 = `<img src="../assets/brand-kit/wordmark-base.png">`(현행).
  - **폰트 모드**: §1 워드마크 = `<span class="wordmark">브랜드명</span>`. `wordmark-base.png`는 없음. `.wordmark`는 `tokens.css`가 정의(레터링 재구현 금지).
  - **폰트 `<link>` 주입(필수)**: `wordmark.font`가 전용 Logotype 폰트면 그 폰트의 실폰트 CDN `<link>`도 head의 폰트 링크 세트에 포함한다(누락 시 시스템 폴백으로 깨짐). `font-catalog.md`의 URL/패밀리를 사용.

- [ ] **Step 5: §8 타이포 노트에 Logotype 우선 한 줄**

`brand-tokens.json 구조` 아래 타이포 폰트 선택 노트(폰트는 `font-catalog.md`에서만 고른다는 단락)에 한 줄 추가:
> 워드마크가 폰트 모드이고 전용 로고타입 폰트를 쓰면 `font-catalog.md`의 **Logotype 서브셋**에서 고른다(없으면 display 재사용).

- [ ] **Step 6: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); ['\"wordmark\":','도메인 역게이트','class=\\\"wordmark\\\"','Logotype'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); console.log('brand-kit SKILL OK')"`
Expected: `brand-kit SKILL OK`
Run: `npm run validate`
Expected: PASS.

- [ ] **Step 7: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -F - <<'EOF'
feat(brand-kit): 워드마크 폰트/이미지 모드 분기 + wordmark 토큰 블록 + 도메인 역게이트

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task C2: brand-kit references — html-direction + 4개 아키타입 워드마크 슬롯 분기

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`
- Modify: `skills/design-brand-kit/references/archetypes/a-ruled-grid.md`
- Modify: `skills/design-brand-kit/references/archetypes/b-editorial.md`
- Modify: `skills/design-brand-kit/references/archetypes/c-sidebar.md`
- Modify: `skills/design-brand-kit/references/archetypes/d-stacked-bands.md`

- [ ] **Step 1: brand-kit-html-direction.md §1·§6 슬롯 분기**

`## 섹션 매핑`(또는 해당 절)의 §1·§6 줄을 모드 분기로 보강한다. 현재:
- §1: "`../assets/brand-kit/wordmark-base.png` `<img>`(크게)"
- §6: "`../assets/brand-kit/wordmark-base.png`(락업)"

각 줄에 분기를 덧붙인다(원문 유지 + 폰트 모드 대안):
  - §1 끝에: " — **폰트 모드면** 워드마크는 `<img>` 대신 `<span class="wordmark">브랜드명</span>`(크게). `.wordmark`는 tokens.css가 정의."
  - §6 끝에: " — **폰트 모드면** 락업의 워드마크 부분을 `<span class="wordmark">`로 대체(심볼은 그대로 이미지)."
  - 추가로 §4 "autocrop 전제(컷아웃: logo·wordmark·icons)" 줄에: "(워드마크는 **이미지 모드에 한함** — 폰트 모드면 컷아웃 없음)."

- [ ] **Step 2: c-sidebar.md — invert 트릭 모드 분기**

`c-sidebar.md`의 워드마크 CSS(현재 `line 16`: `.side img.wm{ height:38px; filter:brightness(0) invert(1); align-self:flex-start; }`)와 사이드바 설명(`워드마크[흰 반전]`)에 폰트 모드 분기를 추가한다. CSS 줄 다음에 한 줄 추가:

```css
.side .wordmark{ font-size:22px; color:#fff; align-self:flex-start; } /* 폰트 모드: 흰 반전 대신 흰색 텍스트 */
```

그리고 사이드바 설명의 `워드마크[흰 반전]`를 `워드마크[이미지=흰 반전 img.wm | 폰트=흰색 .wordmark]`로 교체.

- [ ] **Step 3: a-ruled-grid·b-editorial·d-stacked-bands 슬롯 한 줄 분기**

세 아키타입의 워드마크 언급 줄에 각각 모드 분기 한 줄을 덧붙인다(골격 불변, 슬롯만 양쪽 명시):
  - `a-ruled-grid.md`(히어로 "키비주얼 배경 + 워드마크"): "워드마크 슬롯 = 이미지 모드 `<img>` | 폰트 모드 `<span class="wordmark">`."
  - `b-editorial.md`(좌 "워드마크+큰 세리프 풀쿼트"): 동일 한 줄.
  - `d-stacked-bands.md`(§1 "키비주얼 풀블리드 + 워드마크 오버레이"): 동일 한 줄. 오버레이가 어두우면 `.wordmark` color를 밝게.

- [ ] **Step 4: 검증**

Run: `node -e "const fs=require('fs'); const f='skills/design-brand-kit/references/'; ['archetypes/c-sidebar.md'].forEach(p=>{const s=fs.readFileSync(f+p,'utf8'); if(!/\.wordmark/.test(s)) throw new Error('no .wordmark in '+p)}); ['archetypes/a-ruled-grid.md','archetypes/b-editorial.md','archetypes/d-stacked-bands.md','brand-kit-html-direction.md'].forEach(p=>{const s=fs.readFileSync(f+p,'utf8'); if(!/wordmark/i.test(s)) throw new Error('no wordmark branch in '+p)}); console.log('archetypes OK')"`
Expected: `archetypes OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/references/
git commit -F - <<'EOF'
feat(brand-kit): 아키타입·html-direction 워드마크 슬롯을 폰트/이미지 모드로 분기

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase D — ui-kit 변경

### Task D1: ui-kit 템플릿 masthead `.wordmark` + SKILL 폰트 링크

**Files:**
- Modify: `skills/design-ui-kit/templates/ui-kit-sheet.html`
- Modify: `skills/design-ui-kit/SKILL.md`

- [ ] **Step 1: 템플릿에서 `.board-head .wm`을 `.wordmark` 기반으로 교체**

`skills/design-ui-kit/templates/ui-kit-sheet.html`의 `<style>`에서 아래 줄을 찾는다:

```css
  .board-head .wm { font:700 22px var(--font-display); color:var(--color-primary); }
```

다음으로 교체(워드마크 폰트·레터링은 tokens.css `.wordmark`가 권위, 크기만 보드용으로):

```css
  .board-head .wordmark { font-size:22px; }
```

그리고 masthead 슬롯 주석(`<!-- slot:masthead ... -->`)이 있는 `.board-head` div 안에서, 저작 시 워드마크를 `<span class="wordmark">브랜드명</span>`으로 넣도록 주석을 보강한다 — 주석 텍스트의 `워드마크/제목` 부분에 "(폰트 모드: `<span class="wordmark">`, 이미지 모드: `<img>`)"를 덧붙인다.

- [ ] **Step 2: ui-kit SKILL.md masthead 규칙 + 폰트 링크**

`skills/design-ui-kit/SKILL.md`의 흐름 5(ui-kit.html 저작) `slot:masthead`·`slot:font-links` 지침을 보강한다 — 내용 체크리스트:
  - `slot:masthead`: 워드마크 = 폰트 모드면 `<span class="wordmark">브랜드명</span>`(`.wordmark`는 tokens.css 정의 — 레터링 재구현 금지), 이미지 모드면 `<img src="../assets/brand-kit/wordmark-base.png">`. key-visual `--kv` 주입은 현행 유지.
  - `slot:font-links`: brand-tokens.json typography(display/heading/body/mono) **+ `wordmark.font`(있으면)**의 실폰트 CDN `<link>`를 모두 주입한다(전용 로고타입 폰트 누락 시 시스템 폴백으로 깨짐).

- [ ] **Step 3: 구조 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-ui-kit/templates/ui-kit-sheet.html','utf8'); if(/\.board-head \.wm\b/.test(s)) throw new Error('.wm still present'); if(!/\.board-head \.wordmark/.test(s)) throw new Error('.wordmark missing'); console.log('template OK')"`
Expected: `template OK`
Run: `node -e "const s=require('fs').readFileSync('skills/design-ui-kit/SKILL.md','utf8'); if(!/wordmark/.test(s)) throw new Error('SKILL missing wordmark'); console.log('ui-kit SKILL OK')"`
Expected: `ui-kit SKILL OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-ui-kit/templates/ui-kit-sheet.html skills/design-ui-kit/SKILL.md
git commit -F - <<'EOF'
feat(ui-kit): masthead 워드마크를 .wordmark 클래스로 + font-links에 wordmark 폰트 포함

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase E — design-logo 역할 재정의

### Task E1: design-logo SKILL.md description·목적·선택성 등급

**Files:**
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: description 재정의**

frontmatter `description:`을 역할이 분명하도록 보강한다(앞부분에 사용 시점을 명시):

```
description: brand-kit의 로고 이미지가 마음에 들지 않거나 단순히 프로젝트 로고를 만들 때 쓰는 온디맨드 단계. 확정된 brand kit를 바탕으로 로고를 탐색·확정한다. assets/brand-kit/logo-base.png(투명)를 시드로, 한 라운드에 3~4개 방향을 개별 투명 PNG로 만들어 logos.html 탐색 시트(번호·라벨·실색·실폰트)로 보여주고, #N을 골라 수렴 라운드 또는 단독 확정으로 좁혀 assets/logo/에 확정한다.
```

- [ ] **Step 2: 목적 + 선택성 등급 명시**

`## 목적`(또는 첫 문단)에 한 줄, 그리고 적절한 위치(전제/흐름 근처)에 선택성 등급을 추가한다:
  - 목적 한 줄: "이 단계는 **온디맨드**다 — brand-kit이 만든 `logo-base.png`가 만족스러우면 건너뛴다. brand-kit 로고가 아쉽거나 별도 프로젝트 로고가 필요할 때만 탐색한다."
  - 선택성 등급: "**logo-skip = 단일 마크 한정 충분**(`logo-base.png`가 단일 컷아웃 마크를 대체 — 락업·변형 같은 로고 *시스템*은 없음). 이는 `design-iconset` 건너뛰기(core 아이콘 없으면 ui-kit이 유니코드로 degrade)와 달리 단일 마크 용도엔 무손실이다."

- [ ] **Step 3: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-logo/SKILL.md','utf8'); ['온디맨드','단일 마크 한정 충분'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); console.log('logo SKILL OK')"`
Expected: `logo SKILL OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-logo/SKILL.md
git commit -F - <<'EOF'
docs(logo): 온디맨드 로고 제작/교체로 역할 재정의 + 선택성 등급 명시

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase F — 동기화 · 최종 검증

### Task F1: sync · 게이트 · 수동 통합 · reload

- [ ] **Step 1: 생성물 동기화**

Run: `npm run sync`
(루트 `skills/`·`agents/` 기준 Codex 번들 `plugins/personal/`·`codex-agents/` 재생성 — gitignore라 커밋엔 안 보임. MCP 변경 없어 `.claude-plugin/mcp.json` 등 커밋 생성물 무변화.)

- [ ] **Step 2: 게이트 통과 확인**

Run: `npm test` → 전체 PASS(134).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 수동 통합 검증 (더미 `.design/`)**

```bash
D="$TEMP/_wm_integ/.design"; rm -rf "$TEMP/_wm_integ"; mkdir -p "$D/assets"
# wordmark 블록 채운 더미 brand-tokens.json (전용 폰트 + uppercase + primary)
cat > "$D/brand-tokens.json" <<'JSON'
{ "color": { "primary":"#36495F", "text":"#2C2A27", "background":"#F4EEE4", "surface":"#FBF7F0" },
  "typography": { "display":"\"Gowun Batang\", serif", "body":"\"Pretendard\", sans-serif" },
  "radius": { "md":"14px" }, "shadow": { "sm":"0 1px 2px rgba(0,0,0,.06)" },
  "spacing": { "sectionY":"96px" },
  "wordmark": { "font":"\"Gugi\", sans-serif", "tracking":"-0.01em", "weight":"800", "case":"uppercase", "color":"primary" } }
JSON
node "skills/design-brand-kit/scripts/tokens-to-css.mjs" "$D/brand-tokens.json" "$D/assets/tokens.css"
grep -E "(--font-wordmark|\.wordmark|letter-spacing|text-transform:|color: var\(--color-primary\))" "$D/assets/tokens.css"
rm -rf "$TEMP/_wm_integ"
```
확인: `--font-wordmark: "Gugi", sans-serif`, `.wordmark { ... letter-spacing: -0.01em; font-weight: 800; text-transform: uppercase; color: var(--color-primary); }`. 그리고 `wordmark` 블록 없는 brand-tokens.json으로 같은 명령 → `.wordmark` 기본값(letter-spacing: normal, color: var(--color-text)), `--font-wordmark` 생략 확인.

- [ ] **Step 4: reload 안내**

사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. Codex는 `npm run codex:reinstall` 후 열려 있던 세션을 재시작하세요."** (skills·references 변경.)

- [ ] **Step 5: 동기화 커밋(생성물 변화가 있으면)**

```bash
git status   # 커밋 생성물(.claude-plugin/* 등) 변화 확인 — 이번엔 없을 것
# 변화 있으면만:
git add -A && git commit -F - <<'EOF'
chore: npm run sync 생성물 동기화

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** §3 모델→C1(§6 모드·역게이트)·C2(분기); §4.1 `.wordmark`+토큰→A1(생성기 TDD)+C1(스키마); §4.2 소비·폰트로딩→C1(overview)·D1(ui-kit); §4.3 §6 역게이트→C1; §4.4 아키타입 골격→C2; §4.5 강등→C1(§6); §5 Logotype→B1; §6 logo 재정의→E1; §7 영향파일→전 Task; §8 검증→F1. 누락 없음.
- **Placeholder 스캔:** 코드 스텝(A1)은 완전한 구현·테스트 코드 포함. 마크다운 스텝은 정확한 삽입 문자열·구조 검증 명령 포함. "TBD/적절히 처리" 없음.
- **타입/이름 일관성:** `wordmark` 블록 스키마(`font/tracking/weight/case/color`)가 A1 생성기·테스트·C1 스키마·F1 통합에서 동일. `.wordmark` 클래스 계약(`var(--font-wordmark, var(--font-display))` + 레터링)이 A1·C1·C2·D1에서 일치. `--font-wordmark` 네이밍 일관.
- **선행 의존:** design-ui-kit·tokens.css 토대가 이미 머지됨(이 세션 앞부분). 새 선행 없음.
