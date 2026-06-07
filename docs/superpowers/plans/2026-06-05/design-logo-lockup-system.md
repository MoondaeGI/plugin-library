# 로고 락업 시스템 (스펙 B-🅰) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 심볼+워드마크를 토큰 기반 `.lockup` CSS로 조합하고, 그 락업을 리뷰 HTML(logos.html·overview §6·ui-kit masthead)에 렌더해 production 모습으로 검수·승인하게 한다.

**Architecture:** `tokens-to-css.mjs`가 brand-tokens.json `lockup` 블록에서 `--logo-*` 토큰 + `.lockup--horizontal/.stacked`·`.lockup__mark`·`.lockup__tagline` 클래스를 emit(`.wordmark`와 같은 패턴). 세 HTML 저작 스킬이 그 CSS를 consume해 실제 심볼+`.wordmark`로 락업을 렌더한다. design-logo는 심볼만 emit. 비율 등 optical 균형은 에이전트가 렌더·스크린샷·조정하고 사용자는 승인.

**Tech Stack:** Node.js ESM(`tokens-to-css.mjs`), `node:test`(단위 테스트), 순수 HTML/CSS(토큰·락업), 마크다운 스킬 가이드.

**Spec:** `docs/superpowers/specs/2026-06-05/design-logo-lockup-system-design.md`

---

## Prerequisites

- [ ] 기준선. Run: `npm test` → 전체 PASS(현재 189). Run: `npm run validate` → PASS.
- [ ] 이 플랜은 머지된 `.wordmark` 토큰 토대 위에서 동작(`tokens-to-css.mjs`에 `generateWordmarkClass`·`pick`·`kebab` 존재 전제 — 확인됨).

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `lockup` 블록 → `--logo-*` 토큰 + `.lockup*` 클래스 emit | 수정 |
| `tests/tokens-to-css.test.mjs` | 락업 토큰·클래스·기본값·폴백 테스트 | 수정 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens.json `lockup` 블록 스키마·설명 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6에 `.lockup` 렌더 지침 | 수정 |
| `skills/design-logo/SKILL.md` | 심볼-only + logos.html 락업 렌더 + 에이전트 프리뷰 게이트 | 수정 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | logos.html 락업 섹션 | 수정 |
| `skills/references/design/logo-art-direction.md` | §7 "Wordmark (if shown)" 심볼-only 제약 | 수정 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | masthead `.lockup` 렌더(심볼 있으면), 폴백 `.wordmark` | 수정 |
| `skills/design-ui-kit/SKILL.md` | masthead 락업 지침 + font-links | 수정 |

**계약(중요):**
- **`lockup` 블록 스키마**(brand-tokens.json 최상위, 전부 선택): `{ "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted" }`. 전부 비면 기본값.
- **CSS 계약**: `.lockup`(inline-flex, gap=`var(--logo-gap)`) / `.lockup--stacked`(column) / `.lockup__mark`(height=`calc(var(--logo-mark-scale)*1em)`, object-fit:contain) / `.lockup__body`(워드마크+태그라인 세로) / `.lockup__tagline`(자간·크기·색 토큰). 마크 크기는 락업 font-size(=워드마크 크기)의 배수. 저작 HTML은 `<span class="wordmark">`·심볼 `<img|svg class="lockup__mark">`를 이 골격에 끼운다.

---

## Task 1: tokens-to-css `.lockup` 토큰·클래스 (TDD)

**Files:**
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs`
- Test: `tests/tokens-to-css.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/tokens-to-css.test.mjs` **맨 끝**(마지막 줄 다음)에 추가:

```js
test("lockup 블록 없으면 기본 --logo-* 토큰 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--logo-mark-scale:\s*1\.8/);
  assert.match(css, /--logo-gap:\s*0\.5em/);
  assert.match(css, /--logo-tagline-size:\s*0\.42em/);
  assert.match(css, /--logo-tagline-tracking:\s*0\.22em/);
});

test("lockup 기본 .lockup 클래스 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.lockup\s*\{[^}]*display:\s*inline-flex/);
  assert.match(css, /\.lockup--stacked\s*\{[^}]*flex-direction:\s*column/);
  assert.match(css, /\.lockup__mark\s*\{[^}]*height:\s*calc\(var\(--logo-mark-scale\)\s*\*\s*1em\)/);
  assert.match(css, /\.lockup__mark\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.lockup__tagline\s*\{/);
});

test("lockup override 값 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, lockup: { markScale: "2.0", gap: "0.7em", taglineTracking: "0.3em" } });
  assert.match(css, /--logo-mark-scale:\s*2\.0/);
  assert.match(css, /--logo-gap:\s*0\.7em/);
  assert.match(css, /--logo-tagline-tracking:\s*0\.3em/);
});

test("lockup tagline 색은 토큰 키, 없으면 text 폴백", () => {
  const css1 = generateTokensCss({ ...SAMPLE, lockup: { taglineColor: "primary" } });
  assert.match(css1, /\.lockup__tagline\s*\{[^}]*color:\s*var\(--color-primary\)/);
  const css2 = generateTokensCss({ ...SAMPLE, lockup: { taglineColor: "nonexistent" } });
  assert.match(css2, /\.lockup__tagline\s*\{[^}]*color:\s*var\(--color-text\)/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: FAIL — `--logo-*`·`.lockup` 미생성으로 새 4테스트 실패(기존은 PASS).

- [ ] **Step 3: 구현**

`skills/design-brand-kit/scripts/tokens-to-css.mjs`를 3곳 수정한다.

(a) `WORDMARK_DEFAULTS` 정의 **아래**에 lockup 기본값·헬퍼 추가:

```js
const LOCKUP_DEFAULTS = { markScale: "1.8", gap: "0.5em", taglineSize: "0.42em", taglineTracking: "0.22em", taglineColor: "textMuted" };

function generateLockupVars(lockup = {}) {
  return [
    `  --logo-mark-scale: ${pick(lockup.markScale, LOCKUP_DEFAULTS.markScale)};`,
    `  --logo-gap: ${pick(lockup.gap, LOCKUP_DEFAULTS.gap)};`,
    `  --logo-tagline-size: ${pick(lockup.taglineSize, LOCKUP_DEFAULTS.taglineSize)};`,
    `  --logo-tagline-tracking: ${pick(lockup.taglineTracking, LOCKUP_DEFAULTS.taglineTracking)};`,
  ];
}

function generateLockupClass(lockup = {}, color = {}) {
  const wanted = pick(lockup.taglineColor, LOCKUP_DEFAULTS.taglineColor);
  const tagColor = color[wanted] ? wanted : "text";
  return [
    ".lockup { display: inline-flex; align-items: center; gap: var(--logo-gap); }",
    ".lockup--stacked { flex-direction: column; text-align: center; }",
    ".lockup__mark { height: calc(var(--logo-mark-scale) * 1em); width: auto; object-fit: contain; flex: none; }",
    ".lockup__body { display: flex; flex-direction: column; }",
    ".lockup--stacked .lockup__body { align-items: center; }",
    `.lockup__tagline { font-family: var(--font-body, var(--font-display)); font-size: var(--logo-tagline-size); letter-spacing: var(--logo-tagline-tracking); text-transform: uppercase; color: var(--color-${kebab(tagColor)}); }`,
    "",
  ].join("\n");
}
```

(b) `generateTokensCss`의 destructure에 `lockup` 추가하고, 락업 토큰을 :root에 emit한다. `const { color = {}, ... wordmark = {} } = tokens;` 줄을 다음으로 교체:

```js
  const { color = {}, typography = {}, radius = {}, shadow = {}, spacing = {}, wordmark = {}, lockup = {} } = tokens;
```

그리고 `if (wordmark.font) L.push(...)` 줄 **다음**에 추가:

```js
  L.push(...generateLockupVars(lockup));
```

(c) 마지막 `return` 줄을 교체:

```js
  return L.join("\n") + generateWordmarkClass(wordmark, color) + generateLockupClass(lockup, color);
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: PASS (기존 + 신규 4).

- [ ] **Step 5: 전체 회귀**

Run: `npm test`
Expected: 전체 PASS(189 + 4 = 193).

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/tokens-to-css.test.mjs
git commit -m "feat(brand-kit): tokens.css에 .lockup 클래스 + --logo-* 토큰 생성

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: brand-tokens.json `lockup` 블록 + brand-kit SKILL

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: brand-tokens.json 구조에 `lockup` 블록 추가**

`## brand-tokens.json 구조`의 JSON에서 `"wordmark": { ... }` 줄 **다음**에 추가(앞 줄 끝에 콤마):

```json
  "wordmark": { "font": "", "tracking": "", "weight": "700", "case": "none", "color": "primary" },
  "lockup": { "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted" }
```

- [ ] **Step 2: 설명 단락 추가**

JSON 아래 설명에 한 줄 추가:

> `lockup`(선택)은 **심볼+워드마크 락업**의 비율·간격이다. `markScale`(마크 높이 = 워드마크 font-size의 배수, 기본 1.8)·`gap`(심볼-워드마크 간격)·`tagline*`(소제목 크기·자간·색 토큰 키)는 `tokens.css`의 `.lockup*` 클래스로 emit된다 — 락업 관계의 단일 권위다. 비우면 기본값. **마크 모양마다 균형이 달라 `markScale`은 프리뷰에서 에이전트가 조정**한다(사용자는 승인만).

- [ ] **Step 3: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); ['\"lockup\":','markScale','프리뷰에서 에이전트가 조정'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); console.log('brand-kit SKILL OK')"`
Expected: `brand-kit SKILL OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): brand-tokens.json lockup 블록 + 스키마 설명

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: brand-kit-html-direction §6 락업 렌더 지침

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`

- [ ] **Step 1: §6 매핑에 락업 렌더 한 단락 추가**

`## 섹션 → 자산/데이터 매핑`의 **§6** 항목 끝(— **폰트 모드면** … 문장 다음)에 추가:

```
  - **락업 렌더(신규)**: §6에 실제 `.lockup`을 1개 이상 렌더한다 — `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`(가로) 와 `.lockup.lockup--stacked`(세로). 태그라인이 있으면 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>` 추가. `.lockup*`·`.wordmark`는 tokens.css가 정의(재구현 금지). 이미지 모드 워드마크면 `<span class="wordmark">` 대신 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">`(워드마크 자체가 이미지). 심볼이 없으면 락업 생략하고 워드마크만.
```

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); ['class=\\\"lockup\\\"','lockup__mark','락업 렌더(신규)'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); console.log('html-direction OK')"`
Expected: `html-direction OK`

- [ ] **Step 3: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -m "feat(brand-kit): overview §6에 .lockup 렌더 지침

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: design-logo 심볼-only + logos.html 락업 + 프리뷰 게이트

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: logo-art-direction §7 "Wordmark (if shown)" 제약**

`skills/references/design/logo-art-direction.md` §7 프롬프트 청크의 `Wordmark (if shown): ...` 줄을 다음으로 교체:

```
Wordmark: by default DO NOT render the brand name inside the symbol — this is a standalone symbol asset. The wordmark is composed separately in the lockup (spec B). Only render letters if the chosen type is itself a wordmark/lettermark.
```

그리고 §7 직후 설명 문단 끝에 한 줄 추가:

```
**심볼-only 원칙**: design-logo의 `logo.png`는 심볼이다(워드마크 안 구움) — 워드마크는 `.lockup`에서 별도 조합한다(분리성 보장).
```

- [ ] **Step 2: logo-sheet-html-direction에 락업 섹션 지침 추가**

`skills/design-logo/references/logo-sheet-html-direction.md` `## 1. 시트 레이아웃` 절 끝에 새 불릿 추가:

```
- **락업 프리뷰 섹션(신규)**: 시트 하단에 lock 후보 심볼 + 워드마크를 합친 `.lockup`(가로)·`.lockup.lockup--stacked`(세로)을 렌더한다 — `<img class="lockup__mark" src="../candidate/logo/concepts/round-N/0X.png">` + `<span class="wordmark">브랜드명</span>`. `.lockup*`·`.wordmark`는 `../assets/tokens.css`가 정의(없으면 brand-tokens.json 값/폴백 인라인). 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트).
```

- [ ] **Step 3: design-logo SKILL에 심볼-only + 에이전트 프리뷰 게이트 명문화**

`skills/design-logo/SKILL.md` `## 흐름`의 Phase 2 단독 확정(8) 근처(또는 lock 직전)에 새 항목을 추가:

```
- **락업 프리뷰 게이트(신규, 스펙 B-🅰)**: 심볼을 lock하기 전, 확정 심볼 + 워드마크를 `.lockup`(가로·세로)으로 `logos.html`에 렌더한다. 에이전트가 그 결과를 `web-publisher-qa`로 스크린샷해 균형을 자가판정하고, 어색하면 brand-tokens.json `lockup.markScale`/`gap`을 조정해 재렌더한 뒤 **결과를 사용자에게 제시**한다(사용자는 "좋다/심볼 더 크게" 같은 평이한 승인만 — 수치 직접 편집 없음). 마크는 심볼이며 워드마크는 굽지 않는다.
```

그리고 description/목적 근처 또는 §품질 기준에 한 줄:

```
- **심볼-only**: `logo.png`는 심볼이다(워드마크 안 구움). 워드마크 결합은 `.lockup`이 담당(스펙 B-🅰).
```

- [ ] **Step 4: 검증**

Run:
```bash
node -e "const fs=require('fs'); const a=fs.readFileSync('skills/references/design/logo-art-direction.md','utf8'); if(!/심볼-only 원칙/.test(a)) throw new Error('art-dir 누락'); const b=fs.readFileSync('skills/design-logo/references/logo-sheet-html-direction.md','utf8'); if(!/락업 프리뷰 섹션/.test(b)) throw new Error('sheet 누락'); const c=fs.readFileSync('skills/design-logo/SKILL.md','utf8'); if(!/락업 프리뷰 게이트/.test(c)||!/심볼-only/.test(c)) throw new Error('logo SKILL 누락'); console.log('design-logo OK')"
```
Expected: `design-logo OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/references/design/logo-art-direction.md skills/design-logo/references/logo-sheet-html-direction.md skills/design-logo/SKILL.md
git commit -m "feat(design-logo): 심볼-only + logos.html 락업 프리뷰 게이트(에이전트 조정)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: ui-kit masthead `.lockup`

**Files:**
- Modify: `skills/design-ui-kit/templates/ui-kit-sheet.html`
- Modify: `skills/design-ui-kit/SKILL.md`

- [ ] **Step 1: 템플릿 masthead에 락업 옵션**

`skills/design-ui-kit/templates/ui-kit-sheet.html`를 **Read**한다. masthead(`.board-head`)에서 현재 `<span class="wordmark">`(또는 `.wordmark` 슬롯)을 쓰는 곳을, 심볼 자산이 있으면 `.lockup`으로 감싸도록 주석/슬롯을 보강한다. `<style>`에 락업 보조 줄이 필요하면 추가(크기만):

```css
  .board-head .lockup { font-size: 22px; }
```

그리고 masthead 슬롯 주석을 다음 취지로 보강(저작 시 분기): "심볼 자산(`../assets/logo/logo.png`)이 있으면 `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`, 없으면 `<span class="wordmark">브랜드명</span>` 단독."

- [ ] **Step 2: ui-kit SKILL masthead 지침**

`skills/design-ui-kit/SKILL.md`의 `slot:masthead` 지침에 한 줄 추가:

```
- masthead는 심볼 자산이 있으면 `.lockup`(심볼 + `.wordmark`)으로, 없으면 `.wordmark` 단독으로 저작한다. `.lockup*`은 tokens.css가 정의(재구현 금지). `slot:font-links`는 워드마크 폰트 포함(기존)을 유지한다.
```

- [ ] **Step 3: 검증**

Run: `node -e "const fs=require('fs'); const t=fs.readFileSync('skills/design-ui-kit/templates/ui-kit-sheet.html','utf8'); if(!/lockup/.test(t)) throw new Error('템플릿 누락'); const s=fs.readFileSync('skills/design-ui-kit/SKILL.md','utf8'); if(!/\.lockup/.test(s)) throw new Error('ui-kit SKILL 누락'); console.log('ui-kit OK')"`
Expected: `ui-kit OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-ui-kit/templates/ui-kit-sheet.html skills/design-ui-kit/SKILL.md
git commit -m "feat(ui-kit): masthead를 .lockup(심볼+워드마크)로, 폴백 .wordmark

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: 동기화 · 게이트 · 통합 검증

- [ ] **Step 1: 동기화**

Run: `npm run sync` (Codex 번들 재생성 — gitignore).

- [ ] **Step 2: 게이트**

Run: `npm test` → 전체 PASS(193).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 통합 검증 (더미 tokens.css)**

```bash
D="$TEMP/_lockup_integ"; rm -rf "$D"; mkdir -p "$D"
cat > "$D/brand-tokens.json" <<'JSON'
{ "color": { "primary":"#DD6E92", "text":"#4A3B42", "textMuted":"#9A8A90", "background":"#FFF8F4", "surface":"#FFFFFF" },
  "typography": { "display":"\"Diphylleia\", serif", "body":"\"Pretendard\", sans-serif" },
  "radius": { "md":"14px" }, "shadow": { "sm":"0 1px 2px rgba(0,0,0,.06)" }, "spacing": { "sectionY":"80px" },
  "lockup": { "markScale":"1.9", "taglineColor":"textMuted" } }
JSON
node "skills/design-brand-kit/scripts/tokens-to-css.mjs" "$D/brand-tokens.json" "$D/tokens.css"
grep -E "(--logo-mark-scale: 1.9|\.lockup__mark|calc\(var\(--logo-mark-scale\)|\.lockup__tagline.*color: var\(--color-text-muted\))" "$D/tokens.css"
rm -rf "$D"
```
확인: `--logo-mark-scale: 1.9`, `.lockup__mark { height: calc(var(--logo-mark-scale) * 1em); ... }`, `.lockup__tagline { ... color: var(--color-text-muted); }`. lockup 블록 없는 토큰으로 같은 명령 → 기본값(1.8) 확인.

- [ ] **Step 4: reload 안내**

사용자에게: **"`/reload-plugins` 실행. Codex는 `npm run codex:reinstall`."**

---

## Self-Review (작성자 점검)

- **Spec 커버리지:** §3.1 레이아웃→Task1(CSS)+Task3/4/5(렌더); §3.2 토큰·override→Task1+Task2; §3.3 구성 입력(심볼/워드마크/태그라인)→Task3/4 마크업; §3.4 프리뷰 게이트(에이전트 조정)→Task4 Step3 + Task3/5 렌더 위치; §3.5 심볼-only→Task4 Step1·3; §4 소유·불변식→Task3/4/5가 각자 HTML 저작·shared CSS consume; §5 영향 파일 9개→Task1~5 전부; ui-kit→Task5. 누락 없음.
- **Placeholder 스캔:** Task1은 완전한 구현·테스트 코드. 마크다운 Task는 정확한 삽입 문자열·검증 명령. 마크 정규화(spec §6.3)는 "render-time object-fit + 에이전트 markScale 조정"으로 해소(tight-variant는 비범위). "TBD/적절히" 없음.
- **일관성:** `.lockup`·`.lockup--stacked`·`.lockup__mark`·`.lockup__body`·`.lockup__tagline` 네이밍이 Task1(생성)·Task3/4/5(소비)에서 동일. 토큰 `--logo-mark-scale`/`--logo-gap`/`--logo-tagline-*` 일치. `lockup` 블록 스키마(markScale/gap/taglineSize/taglineTracking/taglineColor)가 Task1·Task2·Task6에서 동일.
