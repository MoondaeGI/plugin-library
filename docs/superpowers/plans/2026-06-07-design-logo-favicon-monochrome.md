# favicon / 단색마크 시스템 (스펙 B-🅱-ii) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 확정 심볼에서 작은 크기에 읽히는 단색 마크 마스터를 만들고, 그 마스터에서 favicon(light/dark)·app-icon을 무의존 재색 스크립트로 베이크하며, 페이지내 런타임 재색(`tokens.css` `.mark-mono`)을 제공한다.

**Architecture:** 새 스크립트 `bake-logo-assets.mjs`가 기존 `autocrop.mjs`의 PNG 코덱(`decodePNG`/`encodePNG`, node:zlib만)을 재사용해 ① favicon = alpha 보존 RGB 재색, ② app-icon = 정사각 타일 + 흰 마크 합성을 수행한다. `tokens-to-css.mjs`는 `.lockup`/`.wordmark`와 같은 패턴으로 `.mark-mono` mask 유틸을 emit한다. 단색 마크 생성·프리뷰 게이트·자산 토폴로지는 design-logo SKILL 흐름에, §6 소비·head 스왑 스니펫은 brand-kit 지침에 명문화한다. design-logo는 자기 자산 파일만 생산(HTML 무편집).

**Tech Stack:** Node.js ESM(`bake-logo-assets.mjs`, `tokens-to-css.mjs`), `node:test`(단위 테스트), node:zlib PNG 코덱(기존 재사용), 순수 CSS(mask 유틸), 마크다운 스킬 가이드.

**Spec:** `docs/superpowers/specs/2026-06-07-design-logo-favicon-monochrome-design.md`

---

## Prerequisites

- [ ] 기준선. Run: `npm test` → 전체 PASS(현재 193). Run: `npm run validate` → PASS.
- [ ] 코덱 전제 확인: `skills/image-gen/scripts/autocrop.mjs`가 `decodePNG`(→`{width,height,colorType,bpp,px}`)·`encodePNG(px,w,h,colorType)`를 **export**한다(확인됨). colorType 6 = RGBA(bpp4), 2 = RGB(bpp3). gpt-image 투명 출력은 colorType 6.

## File Structure

| 파일 | 책임 | 신규/수정 |
|---|---|---|
| `skills/design-logo/scripts/bake-logo-assets.mjs` | 단색 마스터 → favicon×2 재색 + app-icon 합성 (lib + CLI) | **신규** |
| `tests/bake-logo-assets.test.mjs` | 재색(alpha 보존·RGB 교체)·합성·bakeAll 테스트 | **신규** |
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `.mark-mono` 유틸 + 색 토큰별 modifier emit | 수정 |
| `tests/tokens-to-css.test.mjs` | `.mark-mono` 클래스·modifier·기본색 테스트 | 수정 |
| `skills/design-logo/SKILL.md` | 단색 마크 단계·하이브리드 생성·프리뷰 게이트·자산 토폴로지·베이크 호출 | 수정 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | logos.html 단색 마크 가독 프리뷰 섹션 | 수정 |
| `skills/references/design/logo-art-direction.md` | 단색 마크 축약 프롬프트 프레이밍 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 favicon/app-icon 실파일 소비 + `.mark-mono` 재색 + head 스왑 스니펫 | 수정 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens 색 → 베이크 입력 흐름 한 줄 | 수정 |

**계약(중요):**
- **`bake-logo-assets.mjs` lib API**:
  - `recolorMark(buf, hex) → Buffer` — RGBA PNG의 불투명도(alpha) 보존, 모든 픽셀 RGB를 `hex`로 교체.
  - `compositeAppIcon(buf, tileHex, markHex='#FFFFFF') → Buffer` — 같은 크기 정사각 캔버스를 `tileHex`(불투명)로 채우고 마크 alpha로 `markHex`를 블렌드(out alpha=255).
  - `bakeAll(buf, {ink, tile, white='#FFFFFF'}) → {faviconLight, faviconDark, appIcon}` — `faviconLight=recolorMark(ink)`, `faviconDark=recolorMark(white)`, `appIcon=compositeAppIcon(tile, white)`.
  - 색 입력은 **hex 플래그**(스크립트는 brand-tokens.json을 모른다 — image-gen/autocrop처럼 범용 변환기). design-logo SKILL이 brand-tokens 값을 읽어 넘긴다.
- **`.mark-mono` CSS 계약**: `.mark-mono`(inline-block, `width/height:1em`, `mask-size:contain` 등, `background-color:var(--color-text)`) + 색 토큰별 `.mark-mono--<kebab(key)>`(text 제외). `mask-image:url(...)`는 소비처가 인라인. **mask 재색은 http 서빙에서만 렌더**(file:// 불가).
- **자산 캐노니컬 경로**(`.design/assets/logo/`): `mark-mono.png`(마스터)·`favicon-light.png`(ink=라이트탭)·`favicon-dark.png`(흰=다크탭)·`app-icon.png`(타일+흰마크).

---

## Task 1: bake-logo-assets `recolorMark` (TDD)

**Files:**
- Create: `skills/design-logo/scripts/bake-logo-assets.mjs`
- Test: `tests/bake-logo-assets.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/bake-logo-assets.test.mjs` 생성:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { recolorMark } from "../skills/design-logo/scripts/bake-logo-assets.mjs";
import { encodePNG, decodePNG } from "../skills/image-gen/scripts/autocrop.mjs";

// 2x2 RGBA 픽스처: [불투명 검정, 투명, 반투명 회색, 불투명 흰]
function fixture() {
  const px = Buffer.from([
    0, 0, 0, 255,      // px0 불투명
    0, 0, 0, 0,        // px1 투명
    128, 128, 128, 128, // px2 반투명
    255, 255, 255, 255, // px3 불투명
  ]);
  return encodePNG(px, 2, 2, 6);
}

test("recolorMark: 불투명 픽셀 RGB를 타깃색으로 교체, alpha 보존", () => {
  const out = recolorMark(fixture(), "#DD6E92"); // 221,110,146
  const { px, colorType } = decodePNG(out);
  assert.equal(colorType, 6);
  assert.deepEqual([px[0], px[1], px[2], px[3]], [221, 110, 146, 255]); // px0
  assert.equal(px[7], 0);   // px1 alpha 보존(투명)
  assert.equal(px[11], 128); // px2 alpha 보존(반투명)
  assert.deepEqual([px[8], px[9], px[10]], [221, 110, 146]); // px2 RGB도 교체
});

test("recolorMark: RGB(투명 없음) PNG는 에러", () => {
  const rgb = encodePNG(Buffer.from([1, 2, 3, 4, 5, 6]), 2, 1, 2); // colorType 2
  assert.throws(() => recolorMark(rgb, "#000000"), /RGBA/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/bake-logo-assets.test.mjs`
Expected: FAIL — `bake-logo-assets.mjs` 없음 / `recolorMark` 미정의.

- [ ] **Step 3: 구현**

`skills/design-logo/scripts/bake-logo-assets.mjs` 생성:

```js
#!/usr/bin/env node
// bake-logo-assets.mjs — 단색 마크 마스터(mark-mono.png)에서 favicon(light/dark)·app-icon을 베이크한다.
// 외부 의존성 없음 — image-gen/scripts/autocrop.mjs 의 PNG 코덱(node:zlib)을 재사용한다.
// 범용 변환기: brand-tokens.json을 모른다. 색은 hex 플래그로 받는다(호출하는 쪽이 토큰값을 넘긴다).
//
// 라이브러리: import { recolorMark, compositeAppIcon, bakeAll } from './bake-logo-assets.mjs'
// CLI: node bake-logo-assets.mjs --mark <png> --out-dir <dir> --ink "#4A3B42" [--tile "#DD6E92"]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('hex 색이 잘못됨: ' + hex);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// RGBA 마크의 alpha를 보존하고 모든 픽셀 RGB를 hex로 교체한다.
export function recolorMark(buf, hex) {
  const { width, height, colorType, px } = decodePNG(buf);
  if (colorType !== 6) throw new Error('RGBA(투명) PNG가 필요합니다 (colorType=' + colorType + ')');
  const [r, g, b] = hexToRgb(hex);
  const out = Buffer.from(px);
  for (let i = 0; i < out.length; i += 4) { out[i] = r; out[i + 1] = g; out[i + 2] = b; } // alpha(out[i+3]) 유지
  return encodePNG(out, width, height, 6);
}

// 정사각 타일(tileHex, 불투명)에 마크(markHex)를 마크 alpha로 합성한다(out alpha=255).
export function compositeAppIcon(buf, tileHex, markHex = '#FFFFFF') {
  const { width, height, colorType, px } = decodePNG(buf);
  if (colorType !== 6) throw new Error('RGBA(투명) PNG가 필요합니다 (colorType=' + colorType + ')');
  const [tr, tg, tb] = hexToRgb(tileHex); const [mr, mg, mb] = hexToRgb(markHex);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const a = px[i * 4 + 3] / 255; const o = i * 4;
    out[o] = Math.round(tr * (1 - a) + mr * a);
    out[o + 1] = Math.round(tg * (1 - a) + mg * a);
    out[o + 2] = Math.round(tb * (1 - a) + mb * a);
    out[o + 3] = 255;
  }
  return encodePNG(out, width, height, 6);
}

export function bakeAll(buf, { ink = '#000000', tile, white = '#FFFFFF' } = {}) {
  return {
    faviconLight: recolorMark(buf, ink),
    faviconDark: recolorMark(buf, white),
    appIcon: compositeAppIcon(buf, tile || ink, white),
  };
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/bake-logo-assets.test.mjs`
Expected: PASS (recolorMark 2 테스트). compositeAppIcon/CLI는 Task 2·3.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-logo/scripts/bake-logo-assets.mjs tests/bake-logo-assets.test.mjs
git commit -F - <<'EOF'
feat(design-logo): bake-logo-assets recolorMark (단색 마크 alpha 보존 재색)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 2: bake-logo-assets `compositeAppIcon` (TDD)

**Files:**
- Test: `tests/bake-logo-assets.test.mjs` (수정)
- (구현은 Task 1에서 이미 작성됨 — 이 태스크는 테스트로 계약을 고정한다)

- [ ] **Step 1: 합성 테스트 추가**

`tests/bake-logo-assets.test.mjs` **맨 끝**에 추가(`compositeAppIcon`을 import 줄에 추가):

먼저 import 줄을 다음으로 교체:

```js
import { recolorMark, compositeAppIcon, bakeAll } from "../skills/design-logo/scripts/bake-logo-assets.mjs";
```

그리고 끝에 추가:

```js
test("compositeAppIcon: 불투명 마크 픽셀=흰색, 투명=타일색, 전부 불투명", () => {
  const out = compositeAppIcon(fixture(), "#DD6E92"); // 타일 221,110,146 / 마크 흰 기본
  const { px } = decodePNG(out);
  assert.deepEqual([px[0], px[1], px[2], px[3]], [255, 255, 255, 255]); // px0 불투명 마크 → 흰
  assert.deepEqual([px[4], px[5], px[6], px[7]], [221, 110, 146, 255]); // px1 투명 → 타일색, alpha 255
  assert.equal(px[11], 255); // px2 반투명도 결과는 불투명
});

test("bakeAll: 세 자산 버퍼 반환(light=ink, dark=흰, appIcon 불투명)", () => {
  const r = bakeAll(fixture(), { ink: "#4A3B42", tile: "#DD6E92" });
  const light = decodePNG(r.faviconLight); const dark = decodePNG(r.faviconDark); const app = decodePNG(r.appIcon);
  assert.deepEqual([light.px[0], light.px[1], light.px[2]], [74, 59, 66]); // px0 ink
  assert.deepEqual([dark.px[0], dark.px[1], dark.px[2]], [255, 255, 255]); // px0 흰
  assert.equal(app.px[7], 255); // appIcon 투명 픽셀도 불투명
});
```

- [ ] **Step 2: 통과 확인**

Run: `node --test tests/bake-logo-assets.test.mjs`
Expected: PASS (recolorMark 2 + composite/bakeAll 2 = 4).

- [ ] **Step 3: 커밋**

```bash
git add tests/bake-logo-assets.test.mjs
git commit -F - <<'EOF'
test(design-logo): bake-logo-assets compositeAppIcon·bakeAll 계약 테스트

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 3: bake-logo-assets CLI

**Files:**
- Modify: `skills/design-logo/scripts/bake-logo-assets.mjs` (CLI 블록 추가)

- [ ] **Step 1: CLI 블록 추가**

`bake-logo-assets.mjs` **맨 끝**(`bakeAll` 정의 다음)에 추가:

```js
// ---- CLI ----
function isMain() { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
if (isMain()) {
  const args = process.argv.slice(2); const o = {};
  for (let i = 0; i < args.length; i++) { const a = args[i]; const n = () => args[++i];
    if (a === '--mark') o.mark = n();
    else if (a === '--out-dir') o.outDir = n();
    else if (a === '--ink') o.ink = n();
    else if (a === '--tile') o.tile = n();
    else if (a === '--help' || a === '-h') { console.log('node bake-logo-assets.mjs --mark <png> --out-dir <dir> --ink "#RRGGBB" [--tile "#RRGGBB"]'); process.exit(0); }
    else { console.error('오류: 알 수 없는 인자 ' + a); process.exit(2); } }
  if (!o.mark || !o.outDir || !o.ink) { console.error('오류: --mark, --out-dir, --ink 가 필요합니다'); process.exit(2); }
  if (!existsSync(o.mark)) { console.error('오류: 파일 없음: ' + o.mark); process.exit(2); }
  try {
    const { faviconLight, faviconDark, appIcon } = bakeAll(readFileSync(o.mark), { ink: o.ink, tile: o.tile });
    mkdirSync(path.resolve(o.outDir), { recursive: true });
    writeFileSync(path.join(o.outDir, 'favicon-light.png'), faviconLight);
    writeFileSync(path.join(o.outDir, 'favicon-dark.png'), faviconDark);
    writeFileSync(path.join(o.outDir, 'app-icon.png'), appIcon);
    console.log('베이크 완료 → favicon-light.png, favicon-dark.png, app-icon.png');
  } catch (e) { console.error('오류: ' + e.message); process.exit(2); }
}
```

- [ ] **Step 2: CLI 통합 확인 (픽스처 베이크)**

Run:
```bash
D=$(mktemp -d)
node -e "import('./skills/image-gen/scripts/autocrop.mjs').then(m=>{const px=Buffer.alloc(16*16*4); for(let i=0;i<16*16;i++){px[i*4]=0;px[i*4+1]=0;px[i*4+2]=0;px[i*4+3]=(i%2)?255:0;} require('fs').writeFileSync(process.env.D+'/mark-mono.png', m.encodePNG(px,16,16,6));})" 2>/dev/null || \
node --input-type=module -e "import {encodePNG} from './skills/image-gen/scripts/autocrop.mjs'; import {writeFileSync} from 'node:fs'; const px=Buffer.alloc(16*16*4); for(let i=0;i<16*16;i++){px[i*4+3]=(i%2)?255:0;} writeFileSync(process.env.D+'/mark-mono.png', encodePNG(px,16,16,6));"
node skills/design-logo/scripts/bake-logo-assets.mjs --mark "$D/mark-mono.png" --out-dir "$D" --ink "#4A3B42" --tile "#DD6E92"
ls "$D"
rm -rf "$D"
```
Expected: `베이크 완료 …` + `ls`에 `favicon-light.png favicon-dark.png app-icon.png mark-mono.png`.

- [ ] **Step 3: 인자 누락 시 exit 2 확인**

Run: `node skills/design-logo/scripts/bake-logo-assets.mjs --mark x.png; echo "exit=$?"`
Expected: `오류: --mark, --out-dir, --ink 가 필요합니다` + `exit=2`.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-logo/scripts/bake-logo-assets.mjs
git commit -F - <<'EOF'
feat(design-logo): bake-logo-assets CLI (--mark/--out-dir/--ink/--tile)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 4: tokens-to-css `.mark-mono` 유틸 (TDD)

**Files:**
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs`
- Test: `tests/tokens-to-css.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/tokens-to-css.test.mjs` **맨 끝**에 추가:

```js
test("mark-mono 기본 클래스 emit (mask + 기본 text 색)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.mark-mono\s*\{[^}]*mask-size:\s*contain/);
  assert.match(css, /\.mark-mono\s*\{[^}]*background-color:\s*var\(--color-text\)/);
  assert.match(css, /\.mark-mono\s*\{[^}]*display:\s*inline-block/);
});

test("mark-mono 색 토큰별 modifier emit (text 제외)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.mark-mono--primary\s*\{[^}]*background-color:\s*var\(--color-primary\)/);
  assert.match(css, /\.mark-mono--surface-alt\s*\{[^}]*background-color:\s*var\(--color-surface-alt\)/);
  assert.doesNotMatch(css, /\.mark-mono--text\s*\{/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: FAIL — `.mark-mono` 미생성으로 새 2테스트 실패(기존은 PASS).

- [ ] **Step 3: 구현**

`skills/design-brand-kit/scripts/tokens-to-css.mjs`를 2곳 수정한다.

(a) `generateLockupClass` 정의 **다음**(`const pick` 위·아래 무관하나 `kebab` 정의 이후가 안전 — `generateWordmarkClass` 다음 줄에 `kebab`이 정의되어 있으므로 파일 하단 `generateLockupClass` 뒤에 둔다)에 추가:

```js
function generateMarkMonoClass(color = {}) {
  const mods = Object.keys(color)
    .filter((k) => k !== "text")
    .map((k) => `.mark-mono--${kebab(k)} { background-color: var(--color-${kebab(k)}); }`);
  return [
    ".mark-mono {",
    "  display: inline-block; width: 1em; height: 1em;",
    "  background-color: var(--color-text);",
    "  -webkit-mask-size: contain; mask-size: contain;",
    "  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;",
    "  -webkit-mask-position: center; mask-position: center;",
    "}",
    ...mods,
    "",
  ].join("\n");
}
```

(b) 마지막 `return` 줄(`... + generateLockupClass(lockup, color);`)을 교체:

```js
  return L.join("\n") + generateWordmarkClass(wordmark, color) + generateLockupClass(lockup, color) + generateMarkMonoClass(color);
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/tokens-to-css.test.mjs`
Expected: PASS (기존 + 신규 2).

- [ ] **Step 5: 전체 회귀**

Run: `npm test`
Expected: 전체 PASS(193 + bake 4 + mark-mono 2 = 199).

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/tokens-to-css.test.mjs
git commit -F - <<'EOF'
feat(brand-kit): tokens.css에 .mark-mono mask 유틸 + 색 modifier 생성

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 5: design-logo 단색 마크 단계 + 프리뷰 게이트 + 자산 토폴로지

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: logo-art-direction에 단색 마크 축약 프레이밍 추가**

`skills/references/design/logo-art-direction.md`의 §7 직후 설명 문단(현재 "**심볼-only 원칙**: …"으로 끝나는 단락) **끝**에 한 줄 추가:

```
**단색 마크 축약(스펙 B-🅱-ii)**: favicon·app-icon·다크용 `mark-mono.png`는 확정 `logo.png`를 첨부(`--image --input-fidelity high`)해 "single flat color, bold thick strokes, simplest silhouette, drop the frame/text/accents, must read at 16px"로 축약 생성한다(하이브리드). 충실도가 부족하면 더 굵게·단순하게 재생성한다. 단색 마스터의 색은 무관하다 — 재색은 alpha 기반이다.
```

- [ ] **Step 2: logo-sheet-html-direction에 단색 마크 프리뷰 섹션 추가**

`skills/design-logo/references/logo-sheet-html-direction.md`의 `## 1. 시트 레이아웃` 절에서 **Task 🅰가 추가한 "락업 프리뷰 섹션(신규)" 불릿 다음**에 새 불릿 추가:

```
- **단색 마크 가독 프리뷰 섹션(스펙 B-🅱-ii)**: 시트 하단에 단색 마크 후보(`mark-mono`)를 16·24·32·48px로, light/dark 두 배경에 렌더한다 — `<img src="../candidate/logo/mark-mono-candidate.png" width="16" height="16">` 식. "favicon 크기에서 읽히나"를 보는 자리(스펙 B-🅱-ii 프리뷰 게이트). app-icon 미리보기는 브랜드색 정사각 타일 + `filter:brightness(0) invert(1)` 흰 마크로 보여준다. **이 시트는 `mask` 재색 데모를 포함하면 반드시 라이브 서버(http)로 열어 본다 — `file://`에서는 mask가 빈다.**
```

- [ ] **Step 3: design-logo SKILL 자산 트리에 단색 자산 추가**

`skills/design-logo/SKILL.md`의 자산 트리에서 다음 줄:

```
  assets/
    logo/  logo.png                  # 확정 (단일 로고)
```

을 다음으로 교체:

```
  assets/
    logo/  logo.png                  # 확정 심볼 (풍부한 마크)
           mark-mono.png             # 단색 마스터 (favicon·app-icon·페이지내 재색의 소스)
           favicon-light.png         # 라이트 탭용(ink 마크) — bake-logo-assets 생성
           favicon-dark.png          # 다크 탭용(흰 마크) — bake-logo-assets 생성
           app-icon.png              # 브랜드색 타일 + 흰 마크 — bake-logo-assets 생성
```

또한 candidate 트리의 `logo-candidate.png (+v2…)` 줄 **다음**에 추가:

```
      mark-mono-candidate.png (+v2…) # 단색 마크 축약 시안(프리뷰 게이트)
```

- [ ] **Step 4: design-logo SKILL 흐름에 단색 마크 단계 + 프리뷰 게이트 추가**

`skills/design-logo/SKILL.md` `## 흐름`의 **10. 확정(덮어쓰기 — HTML 무수정)** 항목 **다음**에 새 항목 추가:

```
11. **단색 자산 suite(스펙 B-🅱-ii)**: 심볼 lock 직후 — ⓐ 확정 `logo.png`를 첨부(`--image --input-fidelity high`)해 "single flat color, bold thick strokes, simplest silhouette, drop frame/text/accents, legible at 16px"로 `candidate/logo/mark-mono-candidate.png`를 축약 생성한다(하이브리드, `logo-art-direction.md` §7 단색 프레이밍). ⓑ **프리뷰 게이트**: `logos.html` 단색 프리뷰 섹션에 16/24/32px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 결과를 사용자에게 제시(평이한 승인만). ⓒ 승인 후 `assets/logo/mark-mono.png`로 lock하고, brand-tokens.json 색을 읽어 베이크한다:
    `node ../image-gen/scripts/../../design-logo/scripts/bake-logo-assets.mjs --mark .design/assets/logo/mark-mono.png --out-dir .design/assets/logo --ink "<brand text/ink HEX>" --tile "<brand primary HEX>"` → `favicon-light.png`·`favicon-dark.png`·`app-icon.png` 생성. **HTML은 편집하지 않는다**(overview §6이 이 경로들을 가리킴).
```

> 주의: 위 호출 경로는 SKILL 기준 상대경로다. design-logo SKILL은 cwd가 스킬 디렉터리이므로 실제로는 `node scripts/bake-logo-assets.mjs --mark <.design>/assets/logo/mark-mono.png --out-dir <.design>/assets/logo --ink "…" --tile "…"`로 적는다(다른 흐름의 `image-gen` 호출 표기와 일관되게). 정확한 표기는 기존 흐름의 스크립트 호출 컨벤션에 맞춘다.

- [ ] **Step 5: design-logo SKILL 품질 기준에 단색 자산 한 줄**

`## 품질 기준 / 금지 사항`의 `- **심볼-only**: …` 줄 **다음**에 추가:

```
- **단색 자산(스펙 B-🅱-ii)**: `mark-mono.png`는 16px에서 읽히는 단색 축약 마크다. favicon(light/dark)·app-icon은 `bake-logo-assets.mjs`로 마스터에서 베이크한다(손편집 금지 — 마스터만 고치고 재베이크). 풍부한 다색 로고의 다크 2장은 본 단계 비범위(🅱-i 이연).
```

- [ ] **Step 6: 검증**

Run:
```bash
node -e "const fs=require('fs');
const a=fs.readFileSync('skills/references/design/logo-art-direction.md','utf8'); if(!/단색 마크 축약/.test(a)) throw new Error('art-dir 누락');
const b=fs.readFileSync('skills/design-logo/references/logo-sheet-html-direction.md','utf8'); if(!/단색 마크 가독 프리뷰/.test(b)) throw new Error('sheet 누락');
const c=fs.readFileSync('skills/design-logo/SKILL.md','utf8'); if(!/단색 자산 suite/.test(c)||!/mark-mono.png/.test(c)||!/bake-logo-assets/.test(c)) throw new Error('logo SKILL 누락');
console.log('design-logo 단색 OK')"
```
Expected: `design-logo 단색 OK`

- [ ] **Step 7: 커밋**

```bash
git add skills/references/design/logo-art-direction.md skills/design-logo/references/logo-sheet-html-direction.md skills/design-logo/SKILL.md
git commit -F - <<'EOF'
feat(design-logo): 단색 마크 단계·프리뷰 게이트·자산 토폴로지(스펙 B-🅱-ii)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 6: brand-kit §6 favicon/app-icon 소비 + head 스왑 스니펫

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: brand-kit-html-direction §6에 실파일 소비 + 재색 + head 스니펫**

`skills/design-brand-kit/references/brand-kit-html-direction.md`의 §6 항목에서 **Task 🅰가 추가한 "락업 렌더(신규)" 하위 불릿 다음**에 새 하위 불릿 추가:

```
  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**: §6 변형 타일은 design-logo가 베이크한 실제 자산을 가리킨다 — 앱아이콘 `<img src="../assets/logo/app-icon.png">`, 파비콘 `<img src="../assets/logo/favicon-light.png">`. 페이지내 단색 마크 재색은 `.mark-mono`(tokens.css 정의)에 `style="-webkit-mask-image:url('../assets/logo/mark-mono.png');mask-image:url('../assets/logo/mark-mono.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로(어두운 타일 위 흰 마크는 `filter:brightness(0) invert(1)`). **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.** `<head>`에 다크 스왑 favicon을 넣는다:
    `<link rel="icon" href="../assets/logo/favicon-light.png" media="(prefers-color-scheme: light)">`
    `<link rel="icon" href="../assets/logo/favicon-dark.png" media="(prefers-color-scheme: dark)">`
    단색 자산이 아직 없으면(design-logo 미실행) 이 타일·스니펫은 생략한다.
```

- [ ] **Step 2: brand-kit SKILL에 베이크 입력 흐름 한 줄**

`skills/design-brand-kit/SKILL.md`의 brand-tokens.json `lockup` 블록 설명 단락(`> `lockup`(선택)은 …`) **다음**에 한 줄 추가:

```
> 단색 자산(favicon·app-icon)은 design-logo가 `mark-mono.png`에서 `bake-logo-assets.mjs`로 베이크하며, 입력 색은 brand-tokens.json의 `text`(ink)·`primary`(tile)를 쓴다. brand-kit은 토큰만 제공하고 베이크는 design-logo 소관이다(스펙 B-🅱-ii).
```

- [ ] **Step 3: 검증**

Run:
```bash
node -e "const fs=require('fs');
const h=fs.readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); if(!/favicon\/app-icon 실파일/.test(h)||!/prefers-color-scheme/.test(h)||!/mark-mono/.test(h)) throw new Error('html-direction 누락');
const s=fs.readFileSync('skills/design-brand-kit/SKILL.md','utf8'); if(!/bake-logo-assets/.test(s)) throw new Error('brand-kit SKILL 누락');
console.log('brand-kit §6 OK')"
```
Expected: `brand-kit §6 OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-html-direction.md skills/design-brand-kit/SKILL.md
git commit -F - <<'EOF'
feat(brand-kit): §6 favicon/app-icon 실파일 소비 + 다크 스왑 스니펫(스펙 B-🅱-ii)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Task 7: 동기화 · 게이트 · 통합 검증

- [ ] **Step 1: 동기화**

Run: `npm run sync` (Codex 번들·codex-agents 재생성 — gitignore).

- [ ] **Step 2: 게이트**

Run: `npm test` → 전체 PASS(199).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 통합 검증 (베이크 실제 PNG 디코드 확인)**

```bash
D=$(mktemp -d)
node --input-type=module -e "
import { encodePNG } from './skills/image-gen/scripts/autocrop.mjs';
import { writeFileSync } from 'node:fs';
const W=32,H=32; const px=Buffer.alloc(W*H*4);
for(let i=0;i<W*H;i++){ const cx=i%W, cy=(i/W)|0; const on=(cx>8&&cx<24&&cy>8&&cy<24); px[i*4+3]=on?255:0; }
writeFileSync(process.env.D+'/mark-mono.png', encodePNG(px,W,H,6));
"
node skills/design-logo/scripts/bake-logo-assets.mjs --mark "$D/mark-mono.png" --out-dir "$D" --ink "#4A3B42" --tile "#DD6E92"
node --input-type=module -e "
import { decodePNG } from './skills/image-gen/scripts/autocrop.mjs';
import { readFileSync } from 'node:fs';
const L=decodePNG(readFileSync(process.env.D+'/favicon-light.png'));
const A=decodePNG(readFileSync(process.env.D+'/app-icon.png'));
// 중앙(불투명 마크) 픽셀 인덱스
const i=(16*32+16)*4;
console.log('favicon-light 중앙 RGB =', L.px[i],L.px[i+1],L.px[i+2], '(기대 74,59,66)');
console.log('app-icon 코너 alpha =', A.px[3], '(기대 255=불투명 타일)');
"
rm -rf "$D"
```
확인: favicon-light 중앙 RGB = `74 59 66`(ink), app-icon 코너 alpha = `255`(불투명 타일).

- [ ] **Step 4: 더미 tokens.css 통합 검증 (.mark-mono)**

```bash
D=$(mktemp -d); cat > "$D/bt.json" <<'JSON'
{ "color": { "primary":"#DD6E92", "text":"#4A3B42", "textMuted":"#9A8A90", "background":"#FFF8F4", "surface":"#FFFFFF" },
  "typography": { "display":"serif", "body":"sans-serif" } }
JSON
node "skills/design-brand-kit/scripts/tokens-to-css.mjs" "$D/bt.json" "$D/tokens.css"
grep -E "(\.mark-mono \{|mask-size: contain|\.mark-mono--primary)" "$D/tokens.css"
rm -rf "$D"
```
확인: `.mark-mono {`·`mask-size: contain`·`.mark-mono--primary { background-color: var(--color-primary); }`. `text`는 modifier 없음.

- [ ] **Step 5: 최종 코드리뷰 + reload 안내**

전체 diff(`<이 작업 시작 커밋>..HEAD`)를 최종 점검(코드 = bake-logo-assets + tokens-to-css, 나머지 마크다운). 효율 조정(메모리 피드백): per-task 리뷰는 생략, 코드 태스크(1·2·3·4)만 본 최종 종합에서 본다.
사용자에게: **"`/reload-plugins` 실행. Codex는 `npm run codex:reinstall`."**

---

## Self-Review (작성자 점검)

- **Spec 커버리지:** §4.1 소유·흐름→Task5(단계·게이트); §4.2 자산 토폴로지→Task5(트리)+Task1~3(베이크); §4.3 재색 스크립트→Task1~3; §4.4 `.mark-mono`→Task4; §4.5 head 스왑 스니펫→Task6; §4.6 다크 경계→Task5 Step5(품질기준 한 줄)+spec; §6 영향 파일 9개→Task1~6 전부. 누락 없음.
- **Placeholder 스캔:** Task1~4는 완전한 구현·테스트 코드. 마크다운 Task5·6은 정확한 삽입 문자열 + 검증 명령. Task5 Step4의 베이크 호출 경로만 "기존 호출 컨벤션에 맞춘다"는 재량 여지가 있으나, 핵심 인자(`--mark/--out-dir/--ink/--tile`)는 고정. "TBD/적절히" 없음.
- **타입/계약 일관성:** `recolorMark(buf,hex)`·`compositeAppIcon(buf,tileHex,markHex)`·`bakeAll(buf,{ink,tile,white})`가 Task1(정의)·Task2·Task3(소비)에서 동일. 자산 파일명 `mark-mono.png`·`favicon-light.png`·`favicon-dark.png`·`app-icon.png`가 Task3(쓰기)·Task5(트리·흐름)·Task6(소비)에서 동일. `.mark-mono`·`.mark-mono--<key>` 네이밍이 Task4(생성)·Task6(소비)에서 동일.
- **테스트 카운트:** 기존 193 + bake 4(Task1 2 + Task2 2) + mark-mono 2(Task4) = **199**. Task7 게이트와 일치.
