# image-edit-region Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** docs/superpowers/specs/2026-06-09/image-edit-region-design.md

**Goal:** 이미지의 직사각형 영역만 흔들림 없이 편집하는 로컬 스킬을 만든다 — 브라우저 드래그로 영역을 고르고, 전체+마스크를 edit API에 보낸 뒤 마스크 밖을 로컬 재합성해 보존한다.

**Architecture:** 새 스킬 `skills/image-edit-region/`. 순수 PNG I/O(`composite.mjs`)는 기존 `autocrop.mjs`의 decode/encode를 재사용한다. 편집 1사이클 오케스트레이션(`edit-cycle.mjs`)은 마스크를 만들어 기존 공유 생성기 `image-gen.mjs`를 자식 프로세스로 호출하고 결과를 재합성한다. `node:http` 의존성0 미니 서버(`server.mjs`)가 드래그 GUI를 서빙하고 브라우저↔Node 신호를 회수한다. CLI 진입점(`region-edit.mjs`)이 서버를 띄우고 브라우저를 열어 확정/취소까지 대기한다.

**Tech Stack:** Node ≥18 (전역 fetch·FormData), `node:http`, 외부 의존성 0. 테스트는 `node --test`. 브라우저는 OS 설치본(Edge/Chrome/Brave)을 headful로 spawn.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `skills/image-gen/scripts/image-gen.mjs` (수정) | `--mask <경로>` 추가 → edits 페이로드에 `mask` 필드 |
| `skills/image-edit-region/scripts/composite.mjs` (생성) | 순수 PNG: `toRGBA`·`buildMask`·`compositeRegion` |
| `skills/image-edit-region/scripts/edit-cycle.mjs` (생성) | `runEditCycle`: 마스크 생성→image-gen 자식 호출→재합성 |
| `skills/image-edit-region/scripts/server.mjs` (생성) | `node:http` 라우트·하트비트·유휴 타임아웃 |
| `skills/image-edit-region/scripts/region-edit.mjs` (생성) | CLI: 인자 파싱·검증·서버 기동·브라우저 오픈·대기 |
| `skills/image-edit-region/scripts/ui/index.html` (생성) | 드래그 GUI 마크업 |
| `skills/image-edit-region/scripts/ui/app.js` (생성) | 캔버스 드래그·POST. 순수함수(`canvasToImageBbox`·`buildEditPayload`) 분리 |
| `skills/image-edit-region/SKILL.md` (생성) | 산문 워크플로 |

테스트는 `tests/` 아래 미러링. 상대경로 깊이: `tests/skills/image-edit-region/scripts/X.test.mjs` → 소스는 `../../../../skills/image-edit-region/scripts/X.mjs`.

---

## Task 1: image-gen `--mask` 확장

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`
- Test: `tests/skills/image-gen/scripts/image-gen-mask.test.mjs`

image-gen.mjs는 import 시 `main()`을 즉시 실행하는 CLI라 자식 프로세스(`--dry-run`)로 테스트한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-gen/scripts/image-gen-mask.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(__dirname, '../../../../skills/image-gen/scripts/image-gen.mjs');
const FIX = path.resolve(__dirname, '../../../../skills/image-gen/scripts'); // 아무 기존 파일이나 존재 경로로 사용

test('--mask 는 edits dry-run 페이로드/출력에 mask 경로를 드러낸다', () => {
  const r = spawnSync('node', [
    GEN, '--dry-run', '--prompt', 'x',
    '--image', path.join(FIX, 'autocrop.mjs'),
    '--mask', path.join(FIX, 'image-gen.mjs'),
    '--out', path.join(FIX, 'out.png'),
  ], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /mask/i);
  assert.match(r.stdout, /image-gen\.mjs/);
});

test('--mask 만 주고 --image 가 없으면 거부한다', () => {
  const r = spawnSync('node', [
    GEN, '--dry-run', '--prompt', 'x',
    '--mask', path.join(FIX, 'image-gen.mjs'),
    '--out', path.join(FIX, 'out.png'),
  ], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /mask/i);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-gen/scripts/image-gen-mask.test.mjs`
Expected: FAIL — `--mask`가 "알 수 없는 인자"로 die(상태 2)거나 stdout에 mask 없음.

- [ ] **Step 3: 최소 구현**

`image-gen.mjs` parseArgs의 `--image` 케이스 바로 아래에 추가:
```js
      case '--mask': opts.mask = next(); break;
```
검증 블록(`for (const img of opts.images)` 루프 다음)에 추가:
```js
  // --mask: edits(--image 동반)에서만 의미. 단독 사용은 거부. 파일 존재 검증.
  if (opts.mask) {
    if (opts.images.length === 0) die('오류: --mask 는 --image 와 함께 써야 합니다(edits 전용).');
    if (!existsSync(opts.mask)) die(`오류: --mask 파일을 찾을 수 없습니다: ${opts.mask}`);
  }
```
dry-run 출력 블록에서 `useEdits` 분기 안, images 출력 다음에 추가:
```js
      if (opts.mask) console.log('[dry-run] mask: ' + path.resolve(opts.mask));
```
FormData 구성(`if (useEdits)` 블록), `image[]` append 루프 다음에 추가:
```js
    if (opts.mask) {
      const mbuf = readFileSync(opts.mask);
      form.append('mask', new Blob([mbuf], { type: 'image/png' }), path.basename(opts.mask));
    }
```
HELP 문자열의 옵션 목록에 한 줄 추가:
```
//   --mask           편집 영역 마스크 PNG(투명=편집)  (edits 전용; --image 동반 필수)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-gen/scripts/image-gen-mask.test.mjs`
Expected: PASS (2/2).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs tests/skills/image-gen/scripts/image-gen-mask.test.mjs
git commit -m "feat(image-gen): edits용 --mask 플래그 추가"
```

---

## Task 2: composite.mjs — toRGBA + buildMask

**Files:**
- Create: `skills/image-edit-region/scripts/composite.mjs`
- Test: `tests/skills/image-edit-region/scripts/composite.test.mjs`

`autocrop.mjs`의 `decodePNG`/`encodePNG`를 재사용한다. 마스크는 OpenAI edits 규약(투명 영역=편집)대로 **bbox 안 alpha=0, 밖 alpha=255**인 풀사이즈 RGBA PNG.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/composite.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMask, toRGBA } from '../../../../skills/image-edit-region/scripts/composite.mjs';
import { decodePNG, encodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

// 단색 RGBA PNG Buffer 생성 헬퍼
function solidRGBA(w, h, [r, g, b, a]) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { px[i*4]=r; px[i*4+1]=g; px[i*4+2]=b; px[i*4+3]=a; }
  return encodePNG(px, w, h, 6);
}

test('buildMask: bbox 안은 alpha 0(편집), 밖은 alpha 255(보존)', () => {
  const maskBuf = buildMask(4, 4, { x: 1, y: 1, w: 2, h: 2 });
  const { px, bpp, width } = decodePNG(maskBuf);
  assert.equal(bpp, 4);
  const alphaAt = (x, y) => px[(y * width + x) * 4 + 3];
  assert.equal(alphaAt(0, 0), 255); // 밖
  assert.equal(alphaAt(1, 1), 0);   // 안
  assert.equal(alphaAt(2, 2), 0);   // 안
  assert.equal(alphaAt(3, 3), 255); // 밖
});

test('toRGBA: RGB(bpp3) 버퍼를 RGBA(bpp4)로 변환하며 alpha=255', () => {
  const rgbPng = (() => {
    const px = Buffer.alloc(2 * 1 * 3); px[0]=10; px[1]=20; px[2]=30; px[3]=40; px[4]=50; px[5]=60;
    return encodePNG(px, 2, 1, 2);
  })();
  const { px, bpp, width, height } = decodePNG(rgbPng);
  const rgba = toRGBA(px, bpp, width, height);
  assert.equal(rgba.length, 2 * 1 * 4);
  assert.deepEqual([...rgba.subarray(0, 4)], [10, 20, 30, 255]);
  assert.deepEqual([...rgba.subarray(4, 8)], [40, 50, 60, 255]);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite.test.mjs`
Expected: FAIL — composite.mjs 없음(ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: 최소 구현**

`skills/image-edit-region/scripts/composite.mjs`:
```js
#!/usr/bin/env node
// 순수 PNG 합성 도구 — autocrop.mjs의 decode/encode를 재사용한다.
// 외부 의존성 없음. bbox 는 원본 픽셀 좌표 {x, y, w, h}(정수).
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

export class CompositeError extends Error {
  constructor(message) { super(message); this.name = 'CompositeError'; }
}

// RGB/RGBA px 버퍼를 RGBA(bpp4)로 정규화. RGB는 alpha=255로 채운다.
export function toRGBA(px, bpp, width, height) {
  if (bpp === 4) return Buffer.from(px);
  if (bpp !== 3) throw new CompositeError(`지원하지 않는 bpp: ${bpp}`);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    out[i*4] = px[i*3]; out[i*4+1] = px[i*3+1]; out[i*4+2] = px[i*3+2]; out[i*4+3] = 255;
  }
  return out;
}

// 원본과 같은 크기의 마스크 PNG. bbox 안 alpha=0(편집), 밖 alpha=255(보존).
export function buildMask(width, height, bbox) {
  assertBbox(bbox, width, height);
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = x >= bbox.x && x < bbox.x + bbox.w && y >= bbox.y && y < bbox.y + bbox.h;
      px[(y * width + x) * 4 + 3] = inside ? 0 : 255; // RGB는 0
    }
  }
  return encodePNG(px, width, height, 6);
}

export function assertBbox(bbox, width, height) {
  const { x, y, w, h } = bbox || {};
  if (![x, y, w, h].every(Number.isInteger)) throw new CompositeError('bbox 는 정수 {x,y,w,h} 여야 합니다.');
  if (w <= 0 || h <= 0) throw new CompositeError('bbox 의 w·h 는 양수여야 합니다.');
  if (x < 0 || y < 0 || x + w > width || y + h > height) throw new CompositeError('bbox 가 이미지 범위를 벗어났습니다.');
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite.test.mjs`
Expected: PASS (2/2).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/composite.mjs tests/skills/image-edit-region/scripts/composite.test.mjs
git commit -m "feat(image-edit-region): composite buildMask·toRGBA"
```

---

## Task 3: composite.mjs — compositeRegion

**Files:**
- Modify: `skills/image-edit-region/scripts/composite.mjs`
- Test: `tests/skills/image-edit-region/scripts/composite.test.mjs` (테스트 추가)

API 결과의 bbox 픽셀만 원본 복사본 위에 덮어쓰고, bbox 밖은 원본 그대로 보존한다.

- [ ] **Step 1: 실패하는 테스트 추가**

`composite.test.mjs`에 추가 (상단 import에 `compositeRegion` 추가):
```js
import { buildMask, toRGBA, compositeRegion } from '../../../../skills/image-edit-region/scripts/composite.mjs';

test('compositeRegion: bbox 안은 edited, 밖은 original 픽셀 보존', () => {
  const original = solidRGBA(4, 4, [255, 0, 0, 255]); // 전부 빨강
  const edited   = solidRGBA(4, 4, [0, 0, 255, 255]); // 전부 파랑
  const out = compositeRegion(original, edited, { x: 1, y: 1, w: 2, h: 2 });
  const { px, width } = decodePNG(out);
  const at = (x, y) => [...px.subarray((y*width+x)*4, (y*width+x)*4+4)];
  assert.deepEqual(at(0, 0), [255, 0, 0, 255]); // 밖 = 빨강 보존
  assert.deepEqual(at(1, 1), [0, 0, 255, 255]); // 안 = 파랑
  assert.deepEqual(at(2, 2), [0, 0, 255, 255]); // 안 = 파랑
  assert.deepEqual(at(3, 3), [255, 0, 0, 255]); // 밖 = 빨강 보존
});

test('compositeRegion: 크기 다른 edited 는 거부', () => {
  const original = solidRGBA(4, 4, [255, 0, 0, 255]);
  const edited   = solidRGBA(3, 3, [0, 0, 255, 255]);
  assert.throws(() => compositeRegion(original, edited, { x: 0, y: 0, w: 2, h: 2 }), /크기/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite.test.mjs`
Expected: FAIL — `compositeRegion` export 없음.

- [ ] **Step 3: 최소 구현**

`composite.mjs`에 추가:
```js
// 원본 복사본의 bbox 영역에 edited 의 같은 영역 픽셀을 덮어쓴다(접근 2 재합성).
// original·edited 는 같은 크기여야 한다(접근 2는 전체를 보내고 전체를 받으므로 보장).
export function compositeRegion(originalBuf, editedBuf, bbox) {
  const o = decodePNG(originalBuf);
  const e = decodePNG(editedBuf);
  if (o.width !== e.width || o.height !== e.height) {
    throw new CompositeError(`크기 불일치: 원본 ${o.width}x${o.height} vs 편집 ${e.width}x${e.height}`);
  }
  assertBbox(bbox, o.width, o.height);
  const W = o.width, H = o.height;
  const out = toRGBA(o.px, o.bpp, W, H);
  const eRGBA = toRGBA(e.px, e.bpp, W, H);
  for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
    const rowStart = (y * W + bbox.x) * 4;
    const rowLen = bbox.w * 4;
    eRGBA.copy(out, rowStart, rowStart, rowStart + rowLen);
  }
  return encodePNG(out, W, H, 6);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite.test.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/composite.mjs tests/skills/image-edit-region/scripts/composite.test.mjs
git commit -m "feat(image-edit-region): compositeRegion 로컬 재합성"
```

---

## Task 4: edit-cycle.mjs — runEditCycle

**Files:**
- Create: `skills/image-edit-region/scripts/edit-cycle.mjs`
- Test: `tests/skills/image-edit-region/scripts/edit-cycle.test.mjs`

마스크 생성 → image-gen 자식 호출 → 재합성 → 결과 PNG 경로 반환. image-gen 실행은 주입 가능한 의존성(`runImageGen`)으로 두어 테스트에서 모킹한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/edit-cycle.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runEditCycle } from '../../../../skills/image-edit-region/scripts/edit-cycle.mjs';
import { encodePNG, decodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w, h, c) {
  const px = Buffer.alloc(w*h*4);
  for (let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}
  return encodePNG(px, w, h, 6);
}

test('runEditCycle: 마스크를 만들고 image-gen 을 부른 뒤 결과를 재합성한다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255])); // 빨강

  let seen = null;
  // image-gen 모킹: 호출 인자를 기록하고, --out 위치에 파랑 이미지를 떨군다.
  const runImageGen = async (args) => {
    seen = args;
    const outIdx = args.indexOf('--out');
    writeFileSync(args[outIdx + 1], solid(4, 4, [0, 0, 255, 255]));
    return { status: 0, stdout: args[outIdx + 1], stderr: '' };
  };

  const res = await runEditCycle({
    imagePath, bbox: { x: 1, y: 1, w: 2, h: 2 }, prompt: '파랗게',
    quality: 'low', workDir: dir, runImageGen,
  });

  // image-gen 에 --image(원본)·--mask·--prompt·--quality low 가 넘어갔는지
  assert.ok(seen.includes('--image') && seen.includes(imagePath));
  assert.ok(seen.includes('--mask'));
  assert.ok(seen.includes('--quality') && seen[seen.indexOf('--quality')+1] === 'low');
  // 결과 파일 존재 + bbox 안 파랑/밖 빨강
  assert.ok(existsSync(res.outPath));
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(0,0), [255,0,0,255]);
  assert.deepEqual(at(1,1), [0,0,255,255]);
});

test('runEditCycle: image-gen 비정상 종료 시 에러를 던진다', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const runImageGen = async () => ({ status: 1, stdout: '', stderr: 'API 500' });
  await assert.rejects(
    runEditCycle({ imagePath, bbox: { x:0,y:0,w:2,h:2 }, prompt:'x', quality:'low', workDir: dir, runImageGen }),
    /image-gen/,
  );
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/edit-cycle.test.mjs`
Expected: FAIL — edit-cycle.mjs 없음.

- [ ] **Step 3: 최소 구현**

`skills/image-edit-region/scripts/edit-cycle.mjs`:
```js
#!/usr/bin/env node
// 편집 1사이클 오케스트레이션: 마스크 생성 → image-gen 자식 호출 → 로컬 재합성.
// image-gen 실행은 runImageGen 으로 주입(테스트 모킹). 기본 구현은 spawnSync.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG } from '../../image-gen/scripts/autocrop.mjs';
import { buildMask, compositeRegion } from './composite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_GEN = path.resolve(__dirname, '../../image-gen/scripts/image-gen.mjs');

export class EditCycleError extends Error {
  constructor(message) { super(message); this.name = 'EditCycleError'; }
}

// 기본 image-gen 실행기: node image-gen.mjs <args> 를 동기 spawn.
export function defaultRunImageGen(args) {
  const r = spawnSync('node', [IMAGE_GEN, ...args], { encoding: 'utf8' });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// imagePath 의 bbox 영역만 prompt 로 편집한 결과 PNG 를 workDir 에 만들고 경로를 돌려준다.
export async function runEditCycle({ imagePath, bbox, prompt, quality, workDir, runImageGen = defaultRunImageGen }) {
  const orig = readFileSync(imagePath);
  const { width, height } = decodePNG(orig);

  const tag = `${bbox.x}-${bbox.y}-${bbox.w}-${bbox.h}-${quality}`;
  const maskPath = path.join(workDir, `mask-${tag}.png`);
  writeFileSync(maskPath, buildMask(width, height, bbox));

  const editedApi = path.join(workDir, `api-${tag}.png`);

  const args = [
    '--image', imagePath,
    '--mask', maskPath,
    '--prompt', prompt,
    '--quality', quality,
    '--out', editedApi,
    '--force',
  ];
  const r = await runImageGen(args);
  if (r.status !== 0) {
    throw new EditCycleError(`image-gen 실패(status ${r.status}): ${r.stderr || r.stdout}`);
  }

  const outPath = path.join(workDir, `preview-${tag}.png`);
  writeFileSync(outPath, compositeRegion(orig, readFileSync(editedApi), bbox));
  return { outPath, maskPath, editedApi };
}
```
> `tag`에 `quality`를 포함해 저품질 미리보기와 고품질 확정 산출물이 같은 workDir에서 충돌하지 않게 한다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/edit-cycle.test.mjs`
Expected: PASS (2/2).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/edit-cycle.mjs tests/skills/image-edit-region/scripts/edit-cycle.test.mjs
git commit -m "feat(image-edit-region): runEditCycle (마스크→image-gen→재합성)"
```

---

## Task 5: app.js 순수함수 — 좌표 환산·페이로드

**Files:**
- Create: `skills/image-edit-region/scripts/ui/app.js`
- Test: `tests/skills/image-edit-region/scripts/ui/app.test.mjs`

브라우저 캔버스 좌표를 원본 픽셀 bbox로 환산하는 순수함수를 먼저 만든다(캔버스 e2e 없이 단위 테스트). app.js는 이 순수함수 + DOM 바인딩으로 구성하되, DOM 코드는 `if (typeof window !== 'undefined')` 가드 뒤에 둬 node 테스트에서 import 가능하게 한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/ui/app.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canvasToImageBbox, buildEditPayload } from '../../../../../skills/image-edit-region/scripts/ui/app.js';

test('canvasToImageBbox: 표시배율을 반영해 원본 픽셀 정수 bbox로 환산', () => {
  // 원본 800x600, 캔버스 400x300(0.5배). 캔버스 (100,50)~(300,250) 드래그.
  const bbox = canvasToImageBbox(
    { x0: 100, y0: 50, x1: 300, y1: 250 },
    { canvasW: 400, canvasH: 300, imageW: 800, imageH: 600 },
  );
  assert.deepEqual(bbox, { x: 200, y: 100, w: 400, h: 400 });
});

test('canvasToImageBbox: 뒤집힌 드래그(우→좌)도 정규화', () => {
  const bbox = canvasToImageBbox(
    { x0: 300, y0: 250, x1: 100, y1: 50 },
    { canvasW: 400, canvasH: 300, imageW: 400, imageH: 300 },
  );
  assert.deepEqual(bbox, { x: 100, y: 50, w: 200, h: 200 });
});

test('canvasToImageBbox: 이미지 경계로 클램프', () => {
  const bbox = canvasToImageBbox(
    { x0: -10, y0: -10, x1: 410, y1: 310 },
    { canvasW: 400, canvasH: 300, imageW: 400, imageH: 300 },
  );
  assert.deepEqual(bbox, { x: 0, y: 0, w: 400, h: 300 });
});

test('buildEditPayload: bbox·prompt 를 JSON 페이로드로', () => {
  const p = buildEditPayload({ x: 1, y: 2, w: 3, h: 4 }, '빨갛게');
  assert.deepEqual(p, { bbox: { x: 1, y: 2, w: 3, h: 4 }, prompt: '빨갛게' });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/ui/app.test.mjs`
Expected: FAIL — app.js 없음.

- [ ] **Step 3: 최소 구현 (순수함수 부분)**

`skills/image-edit-region/scripts/ui/app.js` 상단:
```js
// 드래그 영역 편집 GUI. 순수함수는 node 테스트가 import 하고, DOM 바인딩은 window 가드 뒤.

// 캔버스 좌표 사각(뒤집힘 허용)을 원본 픽셀 정수 bbox 로 환산하고 이미지 경계로 클램프.
export function canvasToImageBbox(rect, { canvasW, canvasH, imageW, imageH }) {
  const sx = imageW / canvasW, sy = imageH / canvasH;
  let x0 = Math.min(rect.x0, rect.x1), y0 = Math.min(rect.y0, rect.y1);
  let x1 = Math.max(rect.x0, rect.x1), y1 = Math.max(rect.y0, rect.y1);
  let ix0 = Math.round(x0 * sx), iy0 = Math.round(y0 * sy);
  let ix1 = Math.round(x1 * sx), iy1 = Math.round(y1 * sy);
  ix0 = Math.max(0, Math.min(imageW, ix0)); iy0 = Math.max(0, Math.min(imageH, iy0));
  ix1 = Math.max(0, Math.min(imageW, ix1)); iy1 = Math.max(0, Math.min(imageH, iy1));
  return { x: ix0, y: iy0, w: ix1 - ix0, h: iy1 - iy0 };
}

export function buildEditPayload(bbox, prompt) {
  return { bbox, prompt };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/ui/app.test.mjs`
Expected: PASS (4/4).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/ui/app.js tests/skills/image-edit-region/scripts/ui/app.test.mjs
git commit -m "feat(image-edit-region): app.js 좌표 환산 순수함수"
```

---

## Task 6: server.mjs — 라우트 핸들러

**Files:**
- Create: `skills/image-edit-region/scripts/server.mjs`
- Test: `tests/skills/image-edit-region/scripts/server.test.mjs`

`createSession(deps)` 가 라우트 핸들러 + 상태(미리보기 맵·확정 Promise)를 가진 세션 객체를 반환한다. `node:http` 서버 기동은 `startServer`가 담당하되, 테스트는 세션의 순수 핸들러(`handleEdit`·`handleConfirm`·`handleCancel`)를 직접 부른다.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/server.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../../../../skills/image-edit-region/scripts/server.mjs';

function deps(overrides = {}) {
  return {
    imagePath: '/tmp/orig.png',
    outPath: '/tmp/out.png',
    workDir: '/tmp/work',
    runEditCycle: async ({ quality }) => ({ outPath: `/tmp/work/preview-${quality}.png` }),
    saveFinal: async (previewBbox, prompt) => '/tmp/out.png',
    ...overrides,
  };
}

test('handleEdit: runEditCycle(low)을 부르고 previewId 를 발급', async () => {
  const s = createSession(deps());
  const r = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  assert.ok(r.previewId);
  assert.equal(s.getPreview(r.previewId).quality, 'low');
});

test('handleConfirm: saveFinal(high)을 부르고 확정 Promise 를 resolve', async () => {
  const s = createSession(deps());
  const e = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  const done = s.waitForExit();
  const r = await s.handleConfirm({ previewId: e.previewId });
  assert.equal(r.savedPath, '/tmp/out.png');
  assert.deepEqual(await done, { status: 'confirmed', path: '/tmp/out.png' });
});

test('handleConfirm: 없는 previewId 는 거부', async () => {
  const s = createSession(deps());
  await assert.rejects(s.handleConfirm({ previewId: 'nope' }), /previewId/);
});

test('handleCancel: 확정 Promise 를 cancelled 로 resolve', async () => {
  const s = createSession(deps());
  const done = s.waitForExit();
  await s.handleCancel();
  assert.deepEqual(await done, { status: 'cancelled' });
});

test('handleEdit: runEditCycle 실패는 error 응답(세션 유지)', async () => {
  const s = createSession(deps({ runEditCycle: async () => { throw new Error('boom'); } }));
  const r = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  assert.match(r.error, /boom/);
  assert.equal(s.isAlive(), true);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server.test.mjs`
Expected: FAIL — server.mjs 없음.

- [ ] **Step 3: 최소 구현 (세션 핸들러 부분)**

`skills/image-edit-region/scripts/server.mjs`:
```js
#!/usr/bin/env node
// node:http 의존성0 미니 서버. createSession 이 라우트 핸들러+상태를 들고,
// startServer 가 그것을 HTTP 라우팅에 연결한다. 핸들러는 브라우저 없이 단위 테스트 가능.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function createSession({ runEditCycle, saveFinal, idleMs = 600_000, heartbeatMs = 10_000 }) {
  const previews = new Map(); // previewId -> { bbox, prompt, quality, outPath }
  let seq = 0;
  let alive = true;
  let resolveExit;
  const exitPromise = new Promise((res) => { resolveExit = res; });

  function finish(result) {
    if (!alive) return;
    alive = false;
    resolveExit(result);
  }

  return {
    waitForExit() { return exitPromise; },
    isAlive() { return alive; },
    getPreview(id) { return previews.get(id); },

    async handleEdit({ bbox, prompt }) {
      try {
        const { outPath } = await runEditCycle({ bbox, prompt, quality: 'low' });
        const previewId = `p${++seq}`;
        previews.set(previewId, { bbox, prompt, quality: 'low', outPath });
        return { previewId };
      } catch (err) {
        return { error: err.message };
      }
    },

    async handleConfirm({ previewId }) {
      const p = previews.get(previewId);
      if (!p) throw new Error(`알 수 없는 previewId: ${previewId}`);
      const savedPath = await saveFinal(p.bbox, p.prompt); // 고품질 재실행
      finish({ status: 'confirmed', path: savedPath });
      return { savedPath };
    },

    async handleCancel() {
      finish({ status: 'cancelled' });
      return { ok: true };
    },

    // 하트비트: 마지막 ping 이후 heartbeatMs 초과면 창 닫힘으로 간주.
    _idleMs: idleMs,
    _heartbeatMs: heartbeatMs,
    finish,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server.test.mjs`
Expected: PASS (5/5).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/server.mjs tests/skills/image-edit-region/scripts/server.test.mjs
git commit -m "feat(image-edit-region): server 세션 핸들러"
```

---

## Task 7: server.mjs — 하트비트/유휴 타임아웃

**Files:**
- Modify: `skills/image-edit-region/scripts/server.mjs`
- Test: `tests/skills/image-edit-region/scripts/server.test.mjs` (추가)

타이머 주입(`now`·`setTimer`)으로 결정적 테스트. 가짜 시계로 "ping 없음 → 창 닫힘 취소", "유휴 초과 → 취소"를 검증.

- [ ] **Step 1: 실패하는 테스트 추가**

`server.test.mjs`에 추가 (상단 import 유지):
```js
test('워치독: heartbeatMs 동안 ping 없으면 창 닫힘으로 cancel', async () => {
  let t = 0;
  const timers = [];
  const s = createSession(deps());
  const watch = s.startWatchdog({
    now: () => t,
    setTimer: (fn, ms) => { timers.push({ fn, ms }); return timers.length - 1; },
    clearTimer: () => {},
  });
  const done = s.waitForExit();
  s.handlePing();          // t=0 에 ping
  t = 20_000;              // heartbeatMs(10s) 초과
  timers.forEach((x) => x.fn()); // 워치독 tick 실행
  assert.deepEqual(await done, { status: 'cancelled', reason: 'window-closed' });
  watch.stop();
});

test('워치독: 유휴 idleMs 초과면 timeout 으로 cancel', async () => {
  let t = 0;
  const timers = [];
  const s = createSession({ ...deps(), idleMs: 100, heartbeatMs: 1_000_000 });
  const watch = s.startWatchdog({
    now: () => t, setTimer: (fn) => { timers.push(fn); return 0; }, clearTimer: () => {},
  });
  const done = s.waitForExit();
  s.handlePing();
  t = 200; // idle 초과
  timers.forEach((fn) => fn());
  assert.deepEqual(await done, { status: 'cancelled', reason: 'idle-timeout' });
  watch.stop();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server.test.mjs`
Expected: FAIL — `startWatchdog`·`handlePing` 없음.

- [ ] **Step 3: 최소 구현**

`createSession` 내부에 상태·메서드 추가. `return {...}` 객체에 다음을 더한다:
```js
    handlePing() { this._lastPing = (this._now ? this._now() : 0); this._started ??= this._lastPing; },

    startWatchdog({ now, setTimer, clearTimer, tickMs = 1000 } = {}) {
      this._now = now || (() => 0);
      this._lastPing = this._now();
      this._started = this._now();
      const self = this;
      const id = (setTimer || ((fn, ms) => setInterval(fn, ms).unref?.() ?? 0))(function tick() {
        const t = self._now();
        if (!self.isAlive()) return;
        if (t - self._lastPing >= self._heartbeatMs) self.finish({ status: 'cancelled', reason: 'window-closed' });
        else if (t - self._started >= self._idleMs) self.finish({ status: 'cancelled', reason: 'idle-timeout' });
      }, tickMs);
      return { stop() { (clearTimer || clearInterval)(id); } };
    },
```
> 주: `finish`가 `{status:'cancelled'}`(Task 6) 와 `{status:'cancelled', reason}`(여기) 둘 다 낼 수 있다. Task 6의 `handleCancel`은 `reason` 없이 그대로 둔다 — 테스트가 정확히 그 형태를 기대한다.

`finish`를 `return` 객체 바깥의 클로저 함수에서 객체 메서드로 옮긴 상태이므로, Task 6의 `finish`를 객체 메서드 `finish(result){...}`로 두고 `handleConfirm`/`handleCancel`/워치독 모두 `this.finish(...)` 또는 클로저 `finish`를 일관되게 호출한다. 구현 시 `finish`는 클로저 함수 하나로 유지하고 워치독 tick 에서도 그 클로저를 캡처해 호출한다(아래 정리).

정리된 구조(혼동 제거):
```js
export function createSession({ runEditCycle, saveFinal, idleMs = 600_000, heartbeatMs = 10_000 }) {
  const previews = new Map();
  let seq = 0, alive = true, resolveExit;
  let lastPing = 0, started = 0, nowFn = () => 0;
  const exitPromise = new Promise((res) => { resolveExit = res; });
  function finish(result) { if (!alive) return; alive = false; resolveExit(result); }

  const session = {
    waitForExit: () => exitPromise,
    isAlive: () => alive,
    getPreview: (id) => previews.get(id),
    finish,
    async handleEdit({ bbox, prompt }) {
      try {
        const { outPath } = await runEditCycle({ bbox, prompt, quality: 'low' });
        const previewId = `p${++seq}`;
        previews.set(previewId, { bbox, prompt, quality: 'low', outPath });
        return { previewId };
      } catch (err) { return { error: err.message }; }
    },
    async handleConfirm({ previewId }) {
      const p = previews.get(previewId);
      if (!p) throw new Error(`알 수 없는 previewId: ${previewId}`);
      const savedPath = await saveFinal(p.bbox, p.prompt);
      finish({ status: 'confirmed', path: savedPath });
      return { savedPath };
    },
    async handleCancel() { finish({ status: 'cancelled' }); return { ok: true }; },
    handlePing() { lastPing = nowFn(); },
    startWatchdog({ now, setTimer, clearTimer, tickMs = 1000 } = {}) {
      nowFn = now || (() => Date.now());
      lastPing = nowFn(); started = nowFn();
      const tick = () => {
        if (!alive) return;
        const t = nowFn();
        if (t - lastPing >= heartbeatMs) finish({ status: 'cancelled', reason: 'window-closed' });
        else if (t - started >= idleMs) finish({ status: 'cancelled', reason: 'idle-timeout' });
      };
      const id = (setTimer || ((fn, ms) => { const h = setInterval(fn, ms); h.unref?.(); return h; }))(tick, tickMs);
      return { stop: () => (clearTimer || clearInterval)(id) };
    },
  };
  return session;
}
```
이 정리된 버전으로 Task 6·7 핸들러를 모두 대체한다(Task 6 테스트도 그대로 통과).

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server.test.mjs`
Expected: PASS (7/7).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/server.mjs tests/skills/image-edit-region/scripts/server.test.mjs
git commit -m "feat(image-edit-region): 하트비트·유휴 워치독"
```

---

## Task 8: server.mjs — HTTP 라우팅 (startServer)

**Files:**
- Modify: `skills/image-edit-region/scripts/server.mjs`
- Test: `tests/skills/image-edit-region/scripts/server-http.test.mjs`

세션 핸들러를 실제 `node:http` 서버에 연결하고 `listen(0)`으로 빈 포트를 받는다. 통합 테스트는 실제 요청을 보낸다(브라우저 없이 fetch).

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/server-http.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startServer, createSession } from '../../../../skills/image-edit-region/scripts/server.mjs';
import { encodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w,h,c){const px=Buffer.alloc(w*h*4);for(let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}return encodePNG(px,w,h,6);}

test('startServer: /image 는 원본 PNG, /edit 는 previewId, /confirm 은 종료', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-http-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4,4,[255,0,0,255]));
  const previewPng = path.join(dir, 'preview.png');
  writeFileSync(previewPng, solid(4,4,[0,0,255,255]));

  const session = createSession({
    runEditCycle: async () => ({ outPath: previewPng }),
    saveFinal: async () => path.join(dir, 'out.png'),
  });
  const { url, close } = await startServer({ session, imagePath, uiDir: path.resolve('skills/image-edit-region/scripts/ui') });

  const img = await fetch(`${url}/image`);
  assert.equal(img.headers.get('content-type'), 'image/png');

  const edit = await (await fetch(`${url}/edit`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ bbox:{x:0,y:0,w:2,h:2}, prompt:'x' }) })).json();
  assert.ok(edit.previewId);

  const done = session.waitForExit();
  const conf = await (await fetch(`${url}/confirm`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ previewId: edit.previewId }) })).json();
  assert.ok(conf.savedPath);
  assert.equal((await done).status, 'confirmed');
  await close();
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server-http.test.mjs`
Expected: FAIL — `startServer` 없음.

- [ ] **Step 3: 최소 구현**

`server.mjs`에 추가:
```js
const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}
function sendJson(res, code, obj) { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(obj)); }
async function sendFile(res, file, type) {
  try { const buf = await readFile(file); res.writeHead(200, { 'content-type': type }); res.end(buf); }
  catch { res.writeHead(404); res.end('not found'); }
}

// 세션 핸들러를 node:http 에 연결하고 listen(0). { url, close, port } 반환.
export async function startServer({ session, imagePath, uiDir = path.join(__dirname, 'ui') }) {
  const previewById = session._previewFiles || new Map();
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://localhost');
      if (req.method === 'GET' && u.pathname === '/') return sendFile(res, path.join(uiDir, 'index.html'), 'text/html; charset=utf-8');
      if (req.method === 'GET' && u.pathname === '/app.js') return sendFile(res, path.join(uiDir, 'app.js'), 'text/javascript; charset=utf-8');
      if (req.method === 'GET' && u.pathname === '/image') return sendFile(res, imagePath, 'image/png');
      if (req.method === 'GET' && u.pathname.startsWith('/preview/')) {
        const id = u.pathname.slice('/preview/'.length);
        const p = session.getPreview(id);
        if (!p) { res.writeHead(404); return res.end('no preview'); }
        return sendFile(res, p.outPath, 'image/png');
      }
      if (req.method === 'POST' && u.pathname === '/edit') return sendJson(res, 200, await session.handleEdit(await readJson(req)));
      if (req.method === 'POST' && u.pathname === '/confirm') {
        try { return sendJson(res, 200, await session.handleConfirm(await readJson(req))); }
        catch (e) { return sendJson(res, 400, { error: e.message }); }
      }
      if (req.method === 'POST' && u.pathname === '/cancel') return sendJson(res, 200, await session.handleCancel());
      if (req.method === 'POST' && u.pathname === '/ping') { session.handlePing(); return sendJson(res, 200, { ok: true }); }
      res.writeHead(404); res.end('not found');
    } catch (err) { sendJson(res, 500, { error: err.message }); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return { url: `http://127.0.0.1:${port}`, port, close: () => new Promise((r) => server.close(r)) };
}
```
(상단 import 에 `import { readFile } from 'node:fs/promises';` 와 `import { fileURLToPath } from 'node:url';` 가 이미 있는지 확인 — 없으면 추가.)

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server-http.test.mjs`
Expected: PASS.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/server.mjs tests/skills/image-edit-region/scripts/server-http.test.mjs
git commit -m "feat(image-edit-region): startServer HTTP 라우팅"
```

---

## Task 9: region-edit.mjs — CLI 인자 파싱·검증

**Files:**
- Create: `skills/image-edit-region/scripts/region-edit.mjs`
- Test: `tests/skills/image-edit-region/scripts/region-edit.test.mjs`

인자 파싱·검증·`--out` 기본값을 순수함수로 분리해 테스트. 서버 기동·브라우저 오픈은 Task 10에서 와이어링.

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/skills/image-edit-region/scripts/region-edit.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs, resolveOutPath } from '../../../../skills/image-edit-region/scripts/region-edit.mjs';

test('parseArgs: --image 필수, --prompt·--out 선택', () => {
  const o = parseArgs(['--image', 'a.png']);
  assert.equal(o.image, 'a.png');
  assert.equal(o.prompt, '');
  assert.equal(o.out, undefined);
});

test('parseArgs: --image 누락은 throw', () => {
  assert.throws(() => parseArgs(['--prompt', 'x']), /--image/);
});

test('resolveOutPath: 미지정 시 <이름>-edited.png', () => {
  assert.equal(resolveOutPath('/p/foo.png', undefined), '/p/foo-edited.png');
  assert.equal(resolveOutPath('/p/foo.png', '/q/bar.png'), '/q/bar.png');
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/region-edit.test.mjs`
Expected: FAIL — region-edit.mjs 없음.

- [ ] **Step 3: 최소 구현 (파싱 부분만)**

`skills/image-edit-region/scripts/region-edit.mjs`:
```js
#!/usr/bin/env node
// CLI 진입점: 인자 검증 → 서버 기동 → 브라우저 오픈 → 확정/취소까지 대기 → 결과 경로 출력.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export class RegionEditInputError extends Error {
  constructor(message) { super(message); this.name = 'RegionEditInputError'; }
}

export function parseArgs(argv) {
  const o = { image: undefined, prompt: '', out: undefined, model: 'gpt-image-2' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; const next = () => argv[++i];
    switch (a) {
      case '--image': o.image = next(); break;
      case '--prompt': o.prompt = next() ?? ''; break;
      case '--out': o.out = next(); break;
      case '--model': o.model = next(); break;
      case '--help': case '-h': o.help = true; break;
      default: throw new RegionEditInputError(`알 수 없는 인자: ${a}`);
    }
  }
  if (!o.help && !o.image) throw new RegionEditInputError('--image <png 경로> 가 필요합니다.');
  return o;
}

export function resolveOutPath(image, out) {
  if (out) return out;
  const dir = path.dirname(image); const ext = path.extname(image);
  return path.join(dir, `${path.basename(image, ext)}-edited.png`);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/region-edit.test.mjs`
Expected: PASS (3/3).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/region-edit.mjs tests/skills/image-edit-region/scripts/region-edit.test.mjs
git commit -m "feat(image-edit-region): region-edit CLI 파싱"
```

---

## Task 10: region-edit.mjs — 와이어링 (서버·브라우저·대기)

**Files:**
- Modify: `skills/image-edit-region/scripts/region-edit.mjs`

세션·서버를 조립하고 브라우저를 headful로 열어 확정/취소까지 대기한다. 이 부분은 브라우저·자식 프로세스 경계라 자동 테스트 대신 Task 12 수동 스모크로 검증한다. `saveFinal`은 고품질 재실행을 한 번 더 돌려 `--out`에 저장한다.

- [ ] **Step 1: 와이어링 구현 (`main`)**

`region-edit.mjs`에 추가:
```js
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createSession, startServer } from './server.mjs';
import { runEditCycle, defaultRunImageGen } from './edit-cycle.mjs';
import { resolveBrowser } from '../../web-publisher-qa/scripts/screenshot.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function openBrowser(url) {
  const browser = resolveBrowser();
  if (!browser) throw new RegionEditInputError('설치된 브라우저(Edge/Chrome/Brave)를 찾지 못했습니다.');
  const child = spawn(browser, [url], { detached: true, stdio: 'ignore' });
  child.unref();
  return child;
}

export async function main(argv) {
  const opts = parseArgs(argv);
  if (opts.help) { console.log('usage: node region-edit.mjs --image <png> [--prompt ...] [--out ...] [--model ...]'); return 0; }
  const image = path.resolve(opts.image);
  if (!existsSync(image)) throw new RegionEditInputError(`이미지를 찾을 수 없습니다: ${image}`);
  const outPath = resolveOutPath(image, opts.out);
  const workDir = mkdtempSync(path.join(tmpdir(), 'image-edit-region-'));

  const session = createSession({
    runEditCycle: ({ bbox, prompt, quality }) =>
      runEditCycle({ imagePath: image, bbox, prompt, quality, workDir, runImageGen: defaultRunImageGen }),
    saveFinal: async (bbox, prompt) => {
      const r = await runEditCycle({ imagePath: image, bbox, prompt, quality: 'high', workDir, runImageGen: defaultRunImageGen });
      const { copyFileSync } = await import('node:fs');
      copyFileSync(r.outPath, outPath);
      return outPath;
    },
  });

  const { url, close } = await startServer({ session, imagePath: image, uiDir: path.join(__dirname, 'ui') });
  const watch = session.startWatchdog({});
  openBrowser(url);
  process.on('SIGINT', () => session.finish({ status: 'cancelled', reason: 'sigint' }));

  console.error(`브라우저에서 영역을 편집하세요: ${url}`);
  const result = await session.waitForExit();
  watch.stop();
  await close();
  rmSync(workDir, { recursive: true, force: true });

  if (result.status === 'confirmed') { console.log(result.path); return 0; }
  console.error(`취소됨(${result.reason || 'user'}).`);
  return 1;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main(process.argv.slice(2)).then((c) => process.exit(c)).catch((err) => {
    console.error(`오류: ${err.message}`);
    process.exit(err instanceof RegionEditInputError ? 2 : 1);
  });
}
```

- [ ] **Step 2: 파싱 회귀 확인 (와이어링이 기존 export를 깨지 않았는지)**

Run: `node --test tests/skills/image-edit-region/scripts/region-edit.test.mjs`
Expected: PASS (3/3) — main 추가가 parseArgs/resolveOutPath export를 유지.

- [ ] **Step 3: 커밋**

```bash
git add skills/image-edit-region/scripts/region-edit.mjs
git commit -m "feat(image-edit-region): 서버·브라우저 와이어링"
```

---

## Task 11: ui/index.html + app.js DOM 바인딩

**Files:**
- Create: `skills/image-edit-region/scripts/ui/index.html`
- Modify: `skills/image-edit-region/scripts/ui/app.js` (DOM 바인딩 추가)

캔버스에 `/image`를 그리고 드래그로 사각 선택 → 지시문 입력 → "편집"(POST /edit) → `/preview/:id`를 before/after로 표시 → "확정"(POST /confirm) 또는 "다시". 3초 주기 `POST /ping`. DOM 코드는 `app.test.mjs`가 깨지지 않게 순수 export 아래 `window` 가드 뒤에 둔다.

- [ ] **Step 1: index.html 작성**

`skills/image-edit-region/scripts/ui/index.html`:
```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>image-edit-region</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 16px; background: #111; color: #eee; }
    #wrap { display: flex; gap: 16px; flex-wrap: wrap; }
    canvas { border: 1px solid #444; cursor: crosshair; max-width: 100%; }
    .col { display: flex; flex-direction: column; gap: 8px; }
    textarea { width: 360px; height: 60px; }
    button { padding: 8px 14px; font-size: 14px; }
    #status { min-height: 1.2em; color: #9cf; }
    img#after { border: 1px solid #444; max-width: 360px; display: none; }
  </style>
</head>
<body>
  <h3>영역을 드래그하고 지시문을 입력하세요</h3>
  <div id="wrap">
    <div class="col">
      <canvas id="cv"></canvas>
    </div>
    <div class="col">
      <textarea id="prompt" placeholder="예: 로고를 빨간색으로"></textarea>
      <div>
        <button id="edit">편집(미리보기)</button>
        <button id="confirm" disabled>확정 저장</button>
        <button id="redo" disabled>다시</button>
        <button id="cancel">취소</button>
      </div>
      <div id="status"></div>
      <img id="after" alt="편집 결과" />
    </div>
  </div>
  <script type="module" src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: app.js DOM 바인딩 추가**

`app.js` 끝(순수 export 아래)에 추가:
```js
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const promptEl = document.getElementById('prompt');
  const statusEl = document.getElementById('status');
  const afterEl = document.getElementById('after');
  const editBtn = document.getElementById('edit');
  const confirmBtn = document.getElementById('confirm');
  const redoBtn = document.getElementById('redo');
  const cancelBtn = document.getElementById('cancel');

  const img = new Image();
  let imageW = 0, imageH = 0, rect = null, dragging = false, lastPreviewId = null;
  const setStatus = (m) => { statusEl.textContent = m; };

  // 초기 prompt 는 ?prompt= 쿼리에서(결정 C: 대화 지시문 프리필)
  const qp = new URLSearchParams(location.search).get('prompt');
  if (qp) promptEl.value = qp;

  img.onload = () => {
    imageW = img.naturalWidth; imageH = img.naturalHeight;
    const scale = Math.min(1, 720 / imageW);
    cv.width = Math.round(imageW * scale); cv.height = Math.round(imageH * scale);
    draw();
  };
  img.src = '/image';

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (rect) {
      ctx.strokeStyle = '#9cf'; ctx.lineWidth = 2;
      ctx.strokeRect(Math.min(rect.x0,rect.x1), Math.min(rect.y0,rect.y1), Math.abs(rect.x1-rect.x0), Math.abs(rect.y1-rect.y0));
    }
  }
  const pos = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  cv.addEventListener('mousedown', (e) => { const p = pos(e); rect = { x0:p.x, y0:p.y, x1:p.x, y1:p.y }; dragging = true; });
  cv.addEventListener('mousemove', (e) => { if (!dragging) return; const p = pos(e); rect.x1 = p.x; rect.y1 = p.y; draw(); });
  window.addEventListener('mouseup', () => { dragging = false; });

  async function postJson(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  editBtn.onclick = async () => {
    if (!rect) return setStatus('먼저 영역을 드래그하세요.');
    const bbox = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    if (bbox.w < 1 || bbox.h < 1) return setStatus('영역이 너무 작습니다.');
    setStatus('편집 중(미리보기)…'); editBtn.disabled = true;
    const res = await postJson('/edit', buildEditPayload(bbox, promptEl.value));
    editBtn.disabled = false;
    if (res.error) return setStatus('실패: ' + res.error);
    lastPreviewId = res.previewId;
    afterEl.src = `/preview/${res.previewId}?t=${Date.now()}`; afterEl.style.display = 'block';
    confirmBtn.disabled = false; redoBtn.disabled = false;
    setStatus('미리보기 준비됨. 확정하거나 다시 시도하세요.');
  };
  confirmBtn.onclick = async () => {
    if (!lastPreviewId) return;
    setStatus('고품질로 저장 중…'); confirmBtn.disabled = true;
    const res = await postJson('/confirm', { previewId: lastPreviewId });
    if (res.error) { confirmBtn.disabled = false; return setStatus('실패: ' + res.error); }
    setStatus('저장됨: ' + res.savedPath + ' — 창을 닫아도 됩니다.');
  };
  redoBtn.onclick = () => { afterEl.style.display = 'none'; confirmBtn.disabled = true; redoBtn.disabled = true; setStatus('영역·지시문을 고쳐 다시 편집하세요.'); };
  cancelBtn.onclick = async () => { await postJson('/cancel', {}); setStatus('취소됨 — 창을 닫아도 됩니다.'); };

  setInterval(() => { fetch('/ping', { method: 'POST' }).catch(() => {}); }, 3000);
}
```

- [ ] **Step 3: 순수함수 테스트 회귀 확인**

Run: `node --test tests/skills/image-edit-region/scripts/ui/app.test.mjs`
Expected: PASS (4/4) — DOM 가드 때문에 node import 시 DOM 코드는 실행 안 됨.

- [ ] **Step 4: 커밋**

```bash
git add skills/image-edit-region/scripts/ui/index.html skills/image-edit-region/scripts/ui/app.js
git commit -m "feat(image-edit-region): 드래그 GUI(index.html·app.js DOM)"
```

> 주: Task 10의 `openBrowser(url)`은 `?prompt=`를 붙여 열도록 보완한다 — `main`에서 `const guiUrl = opts.prompt ? \`${url}/?prompt=${encodeURIComponent(opts.prompt)}\` : url;` 후 `openBrowser(guiUrl)`. 이 한 줄을 Task 10 구현에 포함하거나 여기서 추가 커밋.

---

## Task 12: SKILL.md + 전체 테스트 + 수동 스모크

**Files:**
- Create: `skills/image-edit-region/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/image-edit-region/SKILL.md`:
```markdown
---
name: image-edit-region
description: 이미지의 특정 직사각형 영역만 흔들림 없이 편집할 때 사용한다. 브라우저에 이미지를 띄워 마우스로 영역을 드래그해 고르면, 그 영역만 OpenAI image edit API로 고치고 마스크 밖은 로컬에서 원본 그대로 재합성해 배경 흔들림(drift)을 차단한다. 로고·사물 교체처럼 "여기만 바꾸고 나머지는 그대로" 편집에 쓴다. OPENAI_API_KEY 필요.
---

# image-edit-region

전체 이미지를 edit API에 주면 고치려는 영역 밖이 흔들리는 문제(drift)를 막는 영역 편집 도구.
**접근: 전체+마스크를 API에 보내되, 결과의 bbox 부분만 원본 위에 로컬 재합성**해 마스크 밖을 보존한다.

## 언제

- 이미지의 특정 사각 영역(로고·아이콘·사물 등)만 바꾸고 배경은 그대로 두고 싶을 때.
- **쓰지 않음**: 이미지 전체 재생성·새 이미지 생성(그건 image-gen), 불규칙 형태 정밀 마스킹(현재 직사각형만 — 후속).

## 사용

```bash
node "<이 스킬 디렉터리>/scripts/region-edit.mjs" \
  --image "<원본 png 절대경로>" \
  --prompt "로고를 빨간색으로" \
  --out "<결과 png 경로>"      # 미지정 시 <이름>-edited.png
```

1. 명령을 실행하면 브라우저가 열린다(`--prompt`는 입력칸 초기값).
2. 이미지에서 바꿀 **영역을 마우스로 드래그**하고, 지시문을 확인/수정한 뒤 **"편집(미리보기)"**.
   - 미리보기는 저품질로 빠르게. before/after를 본다.
3. 마음에 들면 **"확정 저장"**(고품질 1회 재실행 → `--out` 저장), 아니면 **"다시"**.
4. 확정/취소되면 서버가 닫히고, 저장 경로가 stdout에 출력된다.

## 전제

- `OPENAI_API_KEY`(`.env` 또는 환경변수) — edit 단계가 `image-gen`을 호출한다. 사전 검증하지 말고 그냥 실행한다(없으면 image-gen이 안내하며 실패).
- 입력은 PNG(비인터레이스 8-bit). 설치된 브라우저(Edge/Chrome/Brave) 필요.

## 내부

- `scripts/region-edit.mjs` CLI → `server.mjs`(미니 서버) + `ui/`(드래그 GUI) + `edit-cycle.mjs`(마스크→image-gen→재합성) + `composite.mjs`(순수 PNG).
- 흔들림 차단의 핵심은 GUI가 아니라 `compositeRegion` — API 결과의 bbox만 원본 위에 덮어쓰고 바깥 픽셀은 버린다.

## 범위 밖(후속)

브러시/자유곡선 마스크, 경계 페더링, 다중 영역, 타이트 크롭 모드, OpenAI 외 provider.
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `npm test`
Expected: 모든 테스트 PASS(기존 + 신규). 신규: image-gen-mask, composite, edit-cycle, ui/app, server, server-http, region-edit.

- [ ] **Step 3: 생성물 검증 (스킬 추가 반영)**

Run: `npm run sync && npm run validate`
Expected: sync가 `plugins/personal/`(gitignore)를 재생성, validate 통과. 커밋되는 생성물 변화 없음.

- [ ] **Step 4: 수동 스모크 (사용자 승인 후, 키 필요)**

작은 PNG 하나로:
Run: `node skills/image-edit-region/scripts/region-edit.mjs --image <테스트.png> --prompt "이 영역을 파랗게"`
확인: 브라우저 열림 → 드래그 → 편집 → before/after → 확정 → stdout에 저장 경로 → bbox 밖 원본 보존.
> CLAUDE.md 규칙: 이 실행은 사용자 승인 후 진행.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/SKILL.md
git commit -m "feat(image-edit-region): SKILL.md 워크플로 문서"
```

- [ ] **Step 6: reload 안내**

사용자에게: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. Codex는 `npm run codex:reinstall` 후 세션 재시작."** (skills/ 변경 반영)

---

## Self-Review 메모 (작성자 점검 결과)

- **스펙 커버리지**: §3 파일구조→Task2~12, §4 라우트·생명주기→Task6~8·10, §5 편집사이클·재합성→Task2~4, §6 저품질/고품질→Task4·10, §7 image-gen --mask→Task1, §8 에러→커스텀 에러 클래스 각 Task, §9 테스트→각 Task TDD. 모두 매핑됨.
- **좌표 정합(§5)**: canvasToImageBbox(Task5)가 캔버스→원본 픽셀 환산 담당. 접근 2라 원본=결과 크기로 bbox 그대로 적용(리사이즈 왕복 없음). gpt-image 크기 제약은 image-gen이 처리 — 원본이 제약 위반 시 정규화는 v1에서 image-gen 에러로 노출(후속에서 자동 정규화 보완).
- **타입 일관성**: bbox `{x,y,w,h}` 정수, previewId 문자열, exit 결과 `{status:'confirmed'|'cancelled', path?, reason?}`로 전 Task 통일.
- **알려진 정련**: Task7은 Task6 핸들러를 "정리된 구조"로 대체하도록 명시(Task6 테스트도 동일 통과). 산출물 파일명에 `quality`를 넣어 저/고품질 충돌 방지.
