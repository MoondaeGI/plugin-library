# design-iconset SVG 재작성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-iconset`을 image-gen 기반 "시트 이미지 1장" 스킬에서, §11+tokens를 근거로 LLM이 제품용 SVG를 직접 저작하고 결정적 HTML 그리드로 검수하는 스킬로 재작성한다.

**Architecture:** 신규 결정적 스크립트(`build-iconset-sheet.mjs`)가 `.design/icon/*.svg`를 글롭해 번호+kebab 라벨 그리드 HTML을 렌더한다(기존 `build-contact-sheet.mjs` 패턴 답습). 스킬 흐름은 2단 승인 게이트(목록→메타포)와 SVG 저작·외과 편집·구조 린트로 재작성된다. brand-kit과 공유 icon ref 팩은 변경하지 않는다.

**Tech Stack:** Node.js ESM(`node:fs`/`node:path`, `node --test`), HTML/CSS 템플릿, 기존 `scripts/lib/serve-design.mjs`(라이브 프리뷰).

**참조 spec:** `docs/superpowers/specs/2026-06-02/design-iconset-svg-rewrite-design.md`

---

## File Structure

- `skills/design-iconset/scripts/iconset-sheet.template.html` — **신규.** 시트 HTML 스켈레톤(CSS + 치환 토큰). 스킬 로컬 자산.
- `skills/design-iconset/scripts/build-iconset-sheet.mjs` — **신규.** `.design/icon/*.svg`를 글롭→번호+라벨 그리드 HTML 렌더(결정적). 스킬 로컬(Codex 번들 자동 포함).
- `tests/build-iconset-sheet.test.mjs` — **신규.** 위 스크립트 단위 테스트.
- `skills/design-iconset/references/iconset-sheet.md` — **재작성.** PNG 시드·image 프롬프트 청크 → SVG 가족 계약·그리드 렌더·편집 스티어링.
- `skills/design-iconset/SKILL.md` — **재작성.** 입력/출력/흐름/생성 방식 전면 교체.
- 변경 없음: `skills/design-brand-kit/**`, `skills/references/design/icon/**`.

---

## Task 1: 시트 HTML 템플릿

**Files:**
- Create: `skills/design-iconset/scripts/iconset-sheet.template.html`

- [ ] **Step 1: 템플릿 파일 작성**

`build-contact-sheet.mjs`/`contact-sheet.template.html`과 같은 "고정 스켈레톤 + 토큰 치환" 방식. 치환 토큰: `{{TITLE}}` `{{BRAND}}` `{{COUNT}}` `{{CANVAS}}` `{{INK}}` `{{ACCENT}}` `{{CELLS}}` `{{STRIP}}`.

```html
<!doctype html>
<!--
  design-iconset 시트 템플릿 (iconset-sheet.html 생성용 스켈레톤)
  - 책임: 레이아웃·CSS 골격만. 자유 저작 금지 — build-iconset-sheet.mjs 가 토큰을 치환한다.
  - 치환 토큰: TITLE, BRAND, COUNT, CANVAS, INK, ACCENT, CELLS, STRIP
  - 아이콘은 인라인 SVG(currentColor) — .grid 는 ink 색, .striprow 는 accent 색으로 recolor 시연.
-->
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<style>
  :root{ --canvas:{{CANVAS}}; --ink:{{INK}}; --accent:{{ACCENT}}; --line:rgba(127,127,127,.18); }
  *{ box-sizing:border-box; }
  body{ margin:0; background:var(--canvas); color:var(--ink);
    font-family:-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif; padding:40px 28px 64px; }
  .wrap{ max-width:1100px; margin:0 auto; }
  .topbar{ display:flex; justify-content:space-between; align-items:baseline;
    font-size:11px; letter-spacing:.16em; text-transform:uppercase; opacity:.5; margin-bottom:8px; }
  h1{ font-size:22px; margin:0 0 22px; letter-spacing:-.01em; }
  .grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:1px;
    background:var(--line); border:1px solid var(--line); border-radius:14px; overflow:hidden; }
  .cell{ background:var(--canvas); margin:0; padding:18px 10px 12px;
    display:flex; flex-direction:column; align-items:center; gap:10px; position:relative; min-height:104px; }
  .cell .idx{ position:absolute; top:6px; left:8px; font-size:10px; opacity:.4; font-variant-numeric:tabular-nums; }
  .glyph{ color:var(--ink); display:flex; align-items:center; justify-content:center; height:34px; }
  .glyph svg{ width:32px; height:32px; display:block; }
  .label{ font-size:11px; opacity:.7; text-align:center; word-break:break-word; }
  .striprow{ margin-top:26px; padding:16px 18px; border:1px dashed var(--line); border-radius:12px;
    display:flex; flex-wrap:wrap; gap:14px; align-items:center; color:var(--accent); }
  .striprow .cap{ font-size:11px; letter-spacing:.12em; text-transform:uppercase; opacity:.6; color:var(--ink); margin-right:6px; }
  .mini svg{ width:16px; height:16px; display:block; }
</style>
</head>
<body>
<div class="wrap">
  <div class="topbar"><span>{{BRAND}} · ICON SET</span><span>{{COUNT}} icons</span></div>
  <h1>{{BRAND}} 아이콘 세트</h1>
  <div class="grid">{{CELLS}}</div>
  <div class="striprow"><span class="cap">16px · accent</span>{{STRIP}}</div>
</div>
</body>
</html>
```

- [ ] **Step 2: 커밋**

```bash
git add skills/design-iconset/scripts/iconset-sheet.template.html
git commit -m "feat(iconset): add SVG sheet HTML template

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: 시트 생성 스크립트 (TDD)

**Files:**
- Create: `skills/design-iconset/scripts/build-iconset-sheet.mjs`
- Test: `tests/build-iconset-sheet.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/build-iconset-sheet.test.mjs` (패턴은 `tests/build-contact-sheet.test.mjs` 답습 — `spawnSync` + tmpdir + 종료코드):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'design-iconset', 'scripts', 'build-iconset-sheet.mjs');

// 아이콘 폴더 + 선택적 tokens.json 을 tmp 에 만들고 스크립트 실행
function setup(svgs, tokens) {
  const d = mkdtempSync(path.join(tmpdir(), 'is-'));
  const iconDir = path.join(d, 'icon');
  mkdirSync(iconDir);
  for (const [name, content] of Object.entries(svgs)) writeFileSync(path.join(iconDir, name), content, 'utf8');
  const outPath = path.join(d, 'iconset-sheet.html');
  const argv = [SCRIPT, '--in', iconDir, '--out', outPath, '--brand', 'MODO'];
  if (tokens) {
    const tp = path.join(d, 'brand-tokens.json');
    writeFileSync(tp, JSON.stringify(tokens), 'utf8');
    argv.push('--tokens', tp);
  }
  const res = spawnSync('node', argv, { encoding: 'utf8' });
  return { res, outPath, iconDir };
}

const SVG = (extra = '') => `<svg ${extra}viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16"/></svg>`;

test('N개 SVG → N개 셀 + 치환 안 된 토큰 없음', () => {
  const { res, outPath } = setup({ 'search.svg': SVG(), 'add.svg': SVG(), 'close.svg': SVG() });
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(outPath, 'utf8');
  assert.equal((html.match(/class="cell"/g) || []).length, 3);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
});

test('번호는 파일명 정렬 + 01.. zero-pad', () => {
  const { outPath } = setup({ 'z-last.svg': SVG(), 'a-first.svg': SVG(), 'm-mid.svg': SVG() });
  const html = readFileSync(outPath, 'utf8');
  // 정렬: a-first(01) < m-mid(02) < z-last(03)
  assert.ok(html.indexOf('a-first') < html.indexOf('m-mid'));
  assert.ok(html.indexOf('m-mid') < html.indexOf('z-last'));
  assert.match(html, /class="idx">01</);
  assert.match(html, /class="idx">03</);
});

test('라벨 = .svg 제거한 파일명', () => {
  const { outPath } = setup({ 'leak-detection.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /class="label">leak-detection</);
});

test('SVG 는 인라인 임베드 (img src 아님)', () => {
  const { outPath } = setup({ 'search.svg': SVG() });
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /<svg[^>]*viewBox="0 0 24 24"/);
  assert.doesNotMatch(html, /<img[^>]*\.svg/);
});

test('루트 <svg> 의 width/height 제거 (viewBox 유지)', () => {
  // 루트에 width="999" 를 넣어 식별 — 출력에 999 가 남으면 안 됨
  const { outPath } = setup({ 'x.svg': SVG('width="999" height="999" ') });
  const html = readFileSync(outPath, 'utf8');
  assert.doesNotMatch(html, /999/);
  assert.match(html, /viewBox="0 0 24 24"/);
});

test('결정적 — 같은 입력 두 번 → 바이트 동일', () => {
  const svgs = { 'a.svg': SVG(), 'b.svg': SVG() };
  const r1 = setup(svgs); const r2 = setup(svgs);
  assert.equal(readFileSync(r1.outPath, 'utf8'), readFileSync(r2.outPath, 'utf8'));
});

test('tokens 있으면 캔버스/잉크/액센트 색 적용', () => {
  const { outPath } = setup({ 'a.svg': SVG() },
    { color: { background: '#0B0F14', text: '#E6EDF3', accent: '#14B8A6' } });
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /--canvas:#0B0F14/);
  assert.match(html, /--ink:#E6EDF3/);
  assert.match(html, /--accent:#14B8A6/);
});

test('tokens 없으면 기본색', () => {
  const { outPath } = setup({ 'a.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /--canvas:#ffffff/);
});

test('SVG 0개 → 종료코드 2', () => {
  const { res } = setup({ 'readme.txt': 'not an svg' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /SVG/);
});

test('.svg 인데 내용이 SVG 아니면 종료코드 2 + 파일명', () => {
  const { res } = setup({ 'broken.svg': 'just text' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /broken\.svg/);
});

test('--in 디렉터리 없음 → 종료코드 2', () => {
  const res = spawnSync('node', [SCRIPT, '--in', path.join(tmpdir(), 'nope-xyz'), '--out', path.join(tmpdir(), 'o.html')], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('인자 없이 → 종료코드 2 + usage', () => {
  const res = spawnSync('node', [SCRIPT], { encoding: 'utf8' });
  assert.equal(res.status, 2);
  assert.match(res.stderr, /--in/);
});

test('값 없는 플래그(--in 만) → 종료코드 2', () => {
  const res = spawnSync('node', [SCRIPT, '--in'], { encoding: 'utf8' });
  assert.equal(res.status, 2);
});

test('HTML 특수문자 라벨 이스케이프', () => {
  const { outPath } = setup({ 'a&b.svg': SVG() });
  assert.match(readFileSync(outPath, 'utf8'), /a&amp;b/);
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --test tests/build-iconset-sheet.test.mjs`
Expected: FAIL (스크립트 파일이 없어 `node` 실행 실패 → 모든 케이스 status≠0/예상 불일치)

- [ ] **Step 3: 스크립트 구현**

`skills/design-iconset/scripts/build-iconset-sheet.mjs`:

```js
#!/usr/bin/env node
// design-iconset 시트 생성기 (.design/icon/*.svg → iconset-sheet.html)
//
// 책임: 아이콘 폴더의 *.svg 를 파일명 정렬로 모아 번호+kebab 라벨 그리드 HTML 을 결정적으로 렌더한다.
//   SVG 는 인라인 임베드(currentColor/CSS 작동), 루트 <svg> 의 width/height 는 제거해 CSS 로 크기 제어.
//   색(캔버스/잉크/액센트)은 brand-tokens.json 이 있으면 거기서, 없으면 기본값.
//
// 사용: node build-iconset-sheet.mjs --in <icon디렉터리> --out <html> [--tokens <brand-tokens.json>] [--brand <이름>]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(HERE, "iconset-sheet.template.html");
const DEFAULTS = { canvas: "#ffffff", ink: "#111111", accent: "#555555" };

class IconsetSheetError extends Error {
  constructor(message) { super(message); this.name = "IconsetSheetError"; }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new IconsetSheetError(`알 수 없는 인자: ${key}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--"))
      throw new IconsetSheetError(`${key} 에 값이 없습니다.`);
    out[key.slice(2)] = argv[i + 1];
  }
  if (!out.in || !out.out)
    throw new IconsetSheetError("사용: --in <icon디렉터리> --out <html> [--tokens <brand-tokens.json>] [--brand <이름>]");
  return out;
}

// 루트 <svg> 의 width/height 속성만 제거 → CSS 가 크기 제어 (viewBox·자식요소는 유지).
function normalizeSvg(raw) {
  const m = raw.match(/<svg[^>]*>/i);
  if (!m) return raw.trim();
  const cleaned = m[0].replace(/\s(width|height)="[^"]*"/gi, "");
  return raw.replace(m[0], cleaned).trim();
}

function loadIcons(dir) {
  let names;
  try {
    names = readdirSync(dir).filter((n) => n.toLowerCase().endsWith(".svg")).sort();
  } catch (err) {
    throw new IconsetSheetError(`아이콘 디렉터리를 읽을 수 없습니다: ${dir} (${err.message})`);
  }
  if (names.length === 0) throw new IconsetSheetError(`SVG 파일이 없습니다: ${dir}`);
  return names.map((name) => {
    const raw = readFileSync(join(dir, name), "utf8");
    if (!/<svg[\s>]/i.test(raw)) throw new IconsetSheetError(`SVG 가 아닙니다: ${name}`);
    return { label: name.replace(/\.svg$/i, ""), svg: normalizeSvg(raw) };
  });
}

function loadColors(tokensPath) {
  if (!tokensPath) return { ...DEFAULTS };
  let data;
  try { data = JSON.parse(readFileSync(tokensPath, "utf8")); }
  catch (err) { throw new IconsetSheetError(`brand-tokens.json 을 읽을 수 없습니다: ${err.message}`); }
  const c = (data && data.color) || {};
  return {
    canvas: c.background || DEFAULTS.canvas,
    ink: c.text || DEFAULTS.ink,
    accent: c.accent || DEFAULTS.accent,
  };
}

const pad = (n) => String(n).padStart(2, "0");
const escHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildCells(icons) {
  return icons.map((ic, i) =>
`<figure class="cell">
  <span class="idx">${pad(i + 1)}</span>
  <div class="glyph">${ic.svg}</div>
  <figcaption class="label">${escHtml(ic.label)}</figcaption>
</figure>`).join("\n");
}

const buildStrip = (icons) => icons.map((ic) => `<span class="mini">${ic.svg}</span>`).join("\n");

function render({ icons, colors, brand }) {
  const safeBrand = escHtml(brand);
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  return template
    .replace(/\{\{TITLE\}\}/g, `${safeBrand} · ICON SET`)
    .replace(/\{\{BRAND\}\}/g, safeBrand)
    .replace(/\{\{COUNT\}\}/g, String(icons.length))
    .replace(/\{\{CANVAS\}\}/g, colors.canvas)
    .replace(/\{\{INK\}\}/g, colors.ink)
    .replace(/\{\{ACCENT\}\}/g, colors.accent)
    .replace(/\{\{CELLS\}\}/g, buildCells(icons))
    .replace(/\{\{STRIP\}\}/g, buildStrip(icons));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const icons = loadIcons(args.in);
  const colors = loadColors(args.tokens);
  const brand = args.brand || "Brand";
  writeFileSync(args.out, render({ icons, colors, brand }), "utf8");
  console.log(`아이콘 시트 생성: ${args.out} (${icons.length}개)`);
}

// IconsetSheetError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (build-contact-sheet·image-gen 규약과 일치).
try {
  main();
} catch (err) {
  if (err instanceof IconsetSheetError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --test tests/build-iconset-sheet.test.mjs`
Expected: PASS (모든 케이스 통과)

- [ ] **Step 5: 커밋**

```bash
git add skills/design-iconset/scripts/build-iconset-sheet.mjs tests/build-iconset-sheet.test.mjs
git commit -m "feat(iconset): add deterministic SVG sheet builder

.design/icon/*.svg 를 글롭해 번호+kebab 라벨 그리드 HTML 로 렌더.
인라인 임베드(currentColor)·루트 width/height 제거·tokens 색 적용.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: references/iconset-sheet.md 재작성

**Files:**
- Modify(전체 교체): `skills/design-iconset/references/iconset-sheet.md`

- [ ] **Step 1: 파일 내용을 아래로 전체 교체**

```markdown
# 아이콘 세트 SVG 저작 + 시트 디렉션

## 0. 목적 / 사용법

`design-iconset`이 **제품용 SVG 아이콘을 직접 저작**하고 그것을 **HTML 그리드 시트**로 렌더할 때 읽는 문서다. 아이콘 형태·시스템 규칙·스타일 선택·도메인 모티프·Avoid·검증 테스트는 공유 ref 팩 `../../references/design/icon/`(`icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`·`icon-reference-vendors.md`)을 따른다. 이 문서는 **SVG 가족 계약·currentColor 규칙·그리드 렌더·셀 참조·편집 스티어링·구조 린트**만 다룬다.

> **중요:** `icon-rules.md §6`·이 문서의 이전 §6은 **image-gen 프롬프트 청크**였다. iconset은 더 이상 래스터를 생성하지 않으므로 그 청크를 쓰지 않는다 — 그건 brand-kit 컨셉 아이콘용이다. iconset은 SVG 코드를 직접 저작한다.

목표 품질: "랜덤 AI 아이콘 모음"이 아니라 **하나의 가족(one family)으로 읽히고 제품 코드에 바로 쓰는 SVG 세트**(recolor·scale 가능). cross-icon 일관성이 전부다.

## 1. SVG 가족 계약 (스타일 인지)

§11의 **아이콘 스타일** 필드가 계약 스타일을 결정한다. Illustrative는 기본 세트에서 제외(특수 용도만).

**모든 스타일 공통 불변:**
- `viewBox="0 0 24 24"` — 24px artboard, 2px 패딩, 20px live area.
- 루트 `<svg>`에 `width`/`height`를 박지 않는다 — CSS·호출부가 크기 제어(시트 스크립트가 방어적으로 제거하기도 함).
- 공유 키라인/그리드 정렬 · 광학 크기 균형 · 코너 반경 통일 · 하나의 메타포 언어 · 차분한 밀도.

**스타일별 분기:**

| 스타일 | 일관성 앵커 | recolor 규칙 | 구조 린트 |
|---|---|---|---|
| Line/Outline | 균일 stroke-width, join/cap | `stroke="currentColor"` `fill="none"` | 전 SVG stroke-width 동일 |
| Filled | 면 채움·시각 무게 | `fill="currentColor"` | stray stroke 0, 단색 |
| Solid Glyph | 단단한 단색 글리프 | `fill="currentColor"` | 단색, 과밀 없음 |
| Duotone | base+accent 2톤 | `currentColor` + 보조 `fill-opacity=".4"` → One-Color Test 통과 | 정확히 2톤 |
| Outline+Min Fill | stroke + 절제된 fill | `stroke="currentColor"` + 액센트 토큰 최소 fill | stroke 균일 + fill 절제 |

- **상태 아이콘**(success/warning/danger)은 어느 스타일이든 구성 동일, `brand-tokens.json`의 **토큰 색만 분기**.
- 저작 중 형태·일관성·메타포·회피의 권위는 계약이 아니라 `icon-rules.md §1–§5` + `icon-domain-examples.md`다 — 충돌·모호 시 원 팩으로 해소.

## 2. currentColor / recolor

- 일반 아이콘은 `currentColor`로 — 호출부의 `color`(또는 CSS `color`)를 상속해 recolor된다.
- Duotone도 보조 톤을 `currentColor` + `fill-opacity`로 묶어 **한 색으로 recolor** 가능하게 유지(One-Color Test 통과). 별도 색 하드코딩 금지.
- 색이 의미인 상태 아이콘만 토큰 색을 박는다.

## 3. 그리드 렌더 (build-iconset-sheet.mjs)

- 검수 시트는 `scripts/build-iconset-sheet.mjs`가 `.design/icon/`의 `*.svg`를 **파일명 정렬**로 글롭해 결정적으로 렌더한다 — 항상 폴더와 일치(별도 생성 이미지 없음).
- 각 셀: 좌상단 인덱스 번호(`01`–) + 인라인 SVG + 하단 영어 kebab-case 라벨(= 파일명). 하단에 16px accent strip(Small UI Test + recolor 시연).
- 호출:
  ```bash
  node "<스킬 디렉터리>/scripts/build-iconset-sheet.mjs" \
    --in "<cwd>/.design/icon" \
    --out "<cwd>/.design/icon/iconset-sheet.html" \
    --tokens "<cwd>/.design/final/brand-kit/brand-tokens.json" \
    --brand "<브랜드명>"
  ```
- 라이브 프리뷰: `node ../../scripts/lib/serve-design.mjs <cwd>/.design/icon` (five-server가 watch·자동 새로고침).

## 4. 셀 참조 = 번호/이름 → 해당 .svg 외과 편집

- 사용자가 "7번" 또는 "search 아이콘"으로 지목하면 **해당 `.svg` 파일만** 외과 편집한다. 다른 파일은 건드리지 않는다(SVG는 파일 단위라 다른 칸 무손상이 보장된다 — 래스터 시트와 달리 통째 재생성이 아니다).
- 목록 자체를 바꾸면(추가/삭제) 파일을 추가/삭제한 뒤 시트를 다시 렌더한다.

## 5. 구조 린트 + 시각 자가 검수

- **구조 린트(결정적)**: 모든 `.svg`가 같은 `viewBox`인가, 스타일 앵커를 지키는가(line=stroke-width 균일, duotone=정확히 2톤, 루트 width/height 없음). 어긋난 파일을 고친다.
- **시각 자가 검수(라이브 프리뷰)**: `icon-rules.md §5` — One-Color Test(단색에서 의미 유지)·Small UI Test(16/20/24px 가독)·cross-icon 메타포/무게 일관성을 눈으로 판정.

## 6. 금지 사항

- 파일마다 다른 스타일/굵기(가족 상실), 라벨이 영어 kebab-case 아님/의미 불일치, 한 파일에 여러 마크.
- 루트 `<svg>`에 width/height 하드코딩, 색 하드코딩(상태 아이콘 제외), 읽히지 않는 미세 디테일.
- `icon-rules.md §4` Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 3D·gradient·drop shadow, 섞인 스타일, 사진풍 디바이스).
```

- [ ] **Step 2: 커밋**

```bash
git add skills/design-iconset/references/iconset-sheet.md
git commit -m "docs(iconset): rewrite sheet ref for SVG authoring + grid render

PNG 시드·image 프롬프트 청크 → SVG 가족 계약(스타일 인지)·currentColor·
그리드 렌더·외과 편집·구조 린트.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: SKILL.md 재작성

**Files:**
- Modify(전체 교체): `skills/design-iconset/SKILL.md`

- [ ] **Step 1: 파일 내용을 아래로 전체 교체**

````markdown
---
name: design-iconset
description: 확정된 brand kit를 바탕으로 제품에서 실제로 쓰는 아이콘 세트를 SVG 코드로 직접 저작하는 스킬. BRAND_KIT.md §11(아이콘 스타일·폼 규칙·메타포·상태 규칙)·brand-tokens.json을 권위 근거로(brand-kit의 PNG 아이콘은 안 읽음 — 그건 브랜드 컨셉용), 아이콘 목록을 코어/도메인/상태 3분류로 제안·확정하고(게이트1), 각 아이콘의 concept→metaphor를 승인받은 뒤(게이트2), viewBox 0 0 24 24·currentColor 개별 .svg를 .design/icon/에 저작한다. 폴더를 HTML 그리드로 결정적 렌더해 번호·라벨로 검수·외과 편집하고, 확정 세트를 .design/final/icon/으로 lock한다. image-gen·OPENAI_API_KEY 불필요.
---

# Design Iconset

당신은 확정된 브랜드 킷에서 출발해 **제품 코드에 바로 쓰는 하나의 일관된 SVG 아이콘 가족**을 만드는 디자인 시스템 디자이너다.

## 목적

`design-brand-kit`(과 보통 `design-logo`)이 확정된 뒤 사용한다. brand kit의 §11 아이코노그래피는 스타일·폼 규칙·메타포·상태 규칙을 한 줄씩 박아둔 결정이므로, 여기서 그 결정을 따라 **제품에서 실제로 쓸 아이콘 세트를 개별 SVG 파일로 직접 저작**한다. 각 SVG는 `viewBox="0 0 24 24"`·`currentColor`로 recolor·무한 scale 된다. 품질 기준은 "랜덤 AI 아이콘"이 아니라 **하나의 가족(one family)으로 읽히는 제품 아이콘 세트**다 — cross-icon 일관성이 전부다.

**역할 분리:** brand-kit의 `assets/icons/*.png`는 **브랜드 컨셉/정체성 전시용**(overview에만)이라 제품에 안 나간다. iconset은 그것을 시드로도 읽지 않는다 — 스타일 근거는 **§11 규칙 + tokens만**이며, 제품용 SVG 가족을 처음부터 직접 저작한다.

**로고와 다르다:** 로고는 기억되는 한 개의 마크(발산 탐색), 아이콘은 같은 규칙으로 묶인 여러 신호(수렴 일관성)다. 아이콘은 로고보다 튀면 안 된다.

## 전제

- `design-brand-kit` 산출물 중 `.design/final/brand-kit/BRAND_KIT.md`·`.design/final/brand-kit/brand-tokens.json`이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 아이콘용 최소 Q&A로 진행).
- **이미지 생성·`OPENAI_API_KEY` 불필요** — 아이콘은 LLM이 SVG 코드를 직접 저작한다. 검수 시트만 결정적 스크립트로 HTML 렌더한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

권위 원본은 md/tokens다.

- `.design/final/brand-kit/BRAND_KIT.md` — §11 아이코노그래피(스타일·폼 규칙·메타포·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지 패턴.
- `.design/final/brand-kit/brand-tokens.json` — 색 HEX(라인색·액센트·상태색·캔버스).
- **brand-kit `assets/icons/*`는 읽지 않는다**(컨셉용). 없으면 Phase 0 폴백.

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  icon/                       # 작업본 (저작·편집 루프)
    <name>.svg                # 제품 deliverable (currentColor, viewBox 0 0 24 24)
    iconset-sheet.html        # 검수 시트(폴더에서 결정적 렌더, 항상 일치)
    iconset-briefs.md         # 읽은 md 근거·확정 목록·메타포 매핑·가족 계약·제약
  final/icon/                 # lock — 순수 복사, 다운스트림이 읽음
    <name>.svg
    iconset-sheet.html
```

- 작업본 `.design/icon/` → lock `.design/final/icon/` **순수 복사**(brand-kit의 `final/brand-kit/` 패턴과 일관). 버전 이력은 git.
- `generated/`는 두지 않는다(SVG는 텍스트라 초안 누적 불필요).

## SVG 저작 방식

- **LLM이 §11 폼 규칙 + tokens를 따라 각 아이콘을 깨끗한 SVG로 직접 작성**한다. 가족 계약(스타일·viewBox·stroke/fill·join/cap·코너·색)은 `references/iconset-sheet.md §1`, 형태·일관성·메타포·회피의 권위는 `../references/design/icon/`(`icon-rules.md §1–§5`·`icon-style-catalog.md`·`icon-domain-examples.md`)다. **`icon-rules.md §6` 이미지 청크는 쓰지 않는다.**
- **검수 시트는 결정적 스크립트**: `scripts/build-iconset-sheet.mjs`가 `.design/icon/*.svg`를 글롭→번호+kebab 라벨 HTML 그리드 렌더. `references/iconset-sheet.md §3`.
- **라이브 프리뷰**: `node ../../scripts/lib/serve-design.mjs <cwd>/.design/icon` (five-server watch·자동 새로고침). 처음 제시할 때 **최초 1회만 사용자 확인** 후 백그라운드 기동, lock/종료 시 닫는다.

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/final/brand-kit/BRAND_KIT.md`·`brand-tokens.json` 존재 확인.
- **있으면** → Phase 1.
- **없으면** → 두 길 제시:
  - **(1) 브랜드 킷 먼저**(권장) — design-brand-kit 안내 후 종료.
  - **(2) 아이콘용 최소 Q&A** — 한 번에 하나씩: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`../references/design/icon/icon-style-catalog.md`) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지. 수집분을 `iconset-briefs.md`에 기록(가짜 `BRAND_KIT.md` 만들지 않음). 끝에 design-brand-kit 안내.

### Phase 1 — 흡수 → 목록 게이트 → 메타포 게이트
1. **md/tokens 흡수 + art direction 백본 고정**: §11(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지패턴 + tokens 색을 읽어 **SVG 가족 계약**을 확정(`references/iconset-sheet.md §1`). 권위는 `icon-rules.md §1–§5`·`icon-style-catalog.md`·`icon-domain-examples.md`.
2. **게이트 1 — 목록**: 아이콘 목록을 3분류로 유도해 제시하고 "더 받을 거?"를 묻는다.
   - **① 코어/시스템**(거의 모든 앱; 근거 §1 사용 맥락): 예 `search`·`settings`·`add`·`edit`·`delete`·`close`·`menu`·`filter`·`sort`·`chevron`·`check`·`more`.
   - **② 도메인/기능**(이 제품만; 근거 §1·§2·§3·§4·§11 + `icon-domain-examples.md` 해당 도메인): 제품이 하는 일을 동사/명사로 분해해 매핑.
   - **③ 상태**(근거 §11 상태 규칙): `status-success`·`status-warning`·`status-danger`·`status-info`. 구성 동일, 색만 분기.
   - 규율: **추측 금지**(근거 약하면 임의 추가 말고 물어서 넣음), **과다 생성 방지**(기본은 실제 쓸 것만; ~28개 초과 시 기능 그룹 분할 안내).
   - 사용자가 추가/제거/직접지정(영어 kebab-case)으로 편집 → **라벨 목록 확정(잠금)**.
3. **게이트 2 — 메타포 (저작 전 필수)**: 확정 라벨마다 **concept → metaphor(shape)** 매핑을 표(`# | label | concept | metaphor(shape) | category`)로 제시해 승인받는다. 직역(`icon-rules.md §4 Avoid`)·메타포 언어 불일치(`§3` 전부 기하/전부 흐름)를 여기서 검수한다. *단순 라벨이 아니라 "왜 이 형태인가"를 먼저 합의.* 짚인 행만 고쳐 재승인.
4. `iconset-briefs.md` 작성(읽은 md 근거·확정 목록·메타포 매핑·가족 계약·색·제약).

### Phase 2 — SVG 저작 → 시트 검수 → 편집 → lock
5. **SVG 저작**: 확정 목록을 가족 계약에 따라 개별 `.svg`로 작성(`.design/icon/<name>.svg`). 모든 SVG가 공통 불변 + 스타일별 분기(`references/iconset-sheet.md §1`)를 따른다. 모호하면 `icon-rules.md §1–§5`로 해소.
6. **시트 렌더**: `build-iconset-sheet.mjs`로 `.design/icon/iconset-sheet.html` 생성 → `serve-design.mjs` 라이브 프리뷰로 검수.
7. **편집 루프**: 번호/이름 지목 → **해당 `.svg`만 외과 편집**(`references/iconset-sheet.md §4`) → 자동 새로고침. 목록 변경이면 파일 추가/삭제 후 재렌더.
8. **일관성 검사**: 구조 린트(viewBox·스타일 앵커 균일) + 시각 자가 검수(One-Color/Small UI/cross-icon, `icon-rules.md §5`).
9. **lock**: 확정 `*.svg` + `iconset-sheet.html`을 `.design/final/icon/`로 순수 복사. 산출 경로 제시 후 안내: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**. 라이브 프리뷰 서버가 떠 있으면 종료.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 스타일 앵커·그리드·메타포 언어·시각 무게) — `../references/design/icon/icon-rules.md §3`.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6).
- 라벨은 영어 kebab-case + 아이콘 의미와 일치. 한 파일에 여러 마크 금지.
- 루트 `<svg>`에 width/height·색 하드코딩 금지(상태 아이콘 색 제외) — `currentColor`로 recolor 유지.
- `icon-rules.md §4` Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 디테일 과밀, 3D/bevel, gradient, drop shadow, 섞인 스타일, 작아지면 안 읽히는 디테일, 사진풍 렌더).
- 권위 원본은 md/tokens — 계약·가이드와 어긋나면 md/tokens가 정답.
````

- [ ] **Step 2: 커밋**

```bash
git add skills/design-iconset/SKILL.md
git commit -m "feat(iconset): rewrite skill for direct SVG authoring

image-gen 시트 이미지 → LLM SVG 직접 저작. brand-kit PNG 디커플(§11+tokens만),
2단 게이트(목록→메타포), .design/icon → .design/final/icon lock,
결정적 HTML 그리드 검수. OPENAI_API_KEY 불필요.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 동기화 + 전체 검증

**Files:** (소스 없음 — 검증·번들 재생성)

- [ ] **Step 1: Codex 번들 재생성**

Run: `npm run sync`
Expected: 성공(0). `skills/design-iconset/`의 신규 스크립트·템플릿·재작성 문서가 `plugins/personal/`(gitignored 로컬 번들)에 반영. `mcp.servers.json`을 안 건드렸으므로 커밋 대상 생성물(`.claude-plugin/mcp.json` 등)은 변화 없음.

- [ ] **Step 2: 전체 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 기존 테스트 + 신규 `build-iconset-sheet.test.mjs` 모두 green.

- [ ] **Step 3: (있으면) 시크릿/싱크 상태 확인 후 커밋**

`npm run sync`가 커밋 대상 파일을 바꾸지 않았다면 커밋할 것이 없다. `git status`로 확인:

Run: `git status --porcelain`
Expected: 추적 대상 변경 없음(번들·codex-agents는 gitignored). 변경이 있으면 내용 확인 후:

```bash
git add -A
git commit -m "chore(iconset): sync generated artifacts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage** (spec 섹션 → 태스크 매핑):
- §3 역할 분리(brand-kit PNG 디커플) → Task 4 SKILL.md(전제·역할 분리·입력).
- §4 Approach A(LLM SVG 저작, no image-gen) → Task 4(SVG 저작 방식).
- §5 흐름(Phase 0/1 2게이트/2) → Task 4(흐름).
- §6 가족 계약(스타일 인지 표) → Task 3 §1 + Task 4 참조.
- §7 산출물(.design/icon, final/icon) → Task 4(출력) + 스크립트 경로(Task 2).
- §8 시트 스크립트 → Task 1(템플릿) + Task 2(스크립트, TDD).
- §9 변경 범위 → Task 1–4 + Task 5(sync). brand-kit/공유 팩 미변경 확인됨.
- §10 테스트 전략 → Task 2(스크립트 TDD 13케이스) + Task 5(전체 suite).
- §11 기본값(viewBox·currentColor·라이브 프리뷰·28개 상한) → Task 3 §1/§2/§3 + Task 4(SVG 저작·Phase 1 규율).

**2. Placeholder scan:** TBD/TODO/"적절히 처리" 없음. 코드·문서 전문 포함. ✓

**3. Type consistency:** 스크립트 식별자 일관 — `IconsetSheetError`·`parseArgs`·`loadIcons`·`normalizeSvg`·`loadColors`·`buildCells`·`buildStrip`·`render`·`main`. 치환 토큰(`TITLE`/`BRAND`/`COUNT`/`CANVAS`/`INK`/`ACCENT`/`CELLS`/`STRIP`)이 템플릿(Task 1)과 `render()`(Task 2)에서 동일. CSS 클래스(`cell`/`idx`/`glyph`/`label`/`striprow`/`mini`)가 템플릿·`buildCells`/`buildStrip`·테스트 assert와 일치. ✓
```
