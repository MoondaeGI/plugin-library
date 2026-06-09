# 브러시/사각형 마스크 편집 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-10/image-edit-region-brush-mask-design.md`

**Goal:** `image-edit-region`에 브러시로 임의 형태의 편집 영역을 칠하는 모드를 더하되, 기존 사각형 모드는 그대로 옵션으로 유지한다.

**Architecture:** additive(경로 둘). 사각형은 기존 `{bbox}` 경로(`buildMask`+`compositeRegion`)를 그대로 쓰고, 브러시는 클라이언트가 만든 마스크 PNG를 `{maskPng}` dataURL로 보내 새 마스크 경로(`compositeMask` alpha 가중 블렌드)로 처리한다. `runEditCycle`이 `maskBuf` 유무로 분기한다.

**Tech Stack:** Node `node:test`, 의존성0 `node:http`, 브라우저 Canvas 2D, PNG decode/encode는 `skills/image-gen/scripts/autocrop.mjs` 재사용.

---

## File Structure

- **Modify** `skills/image-edit-region/scripts/composite.mjs` — `compositeMask`, `maskHasEditableArea` 추가. 기존 함수 전부 유지.
- **Modify** `skills/image-edit-region/scripts/edit-cycle.mjs` — `runEditCycle`에 `maskBuf` 분기.
- **Modify** `skills/image-edit-region/scripts/server.mjs` — `decodeMaskDataUrl` 추가, `handleEdit`/`handleConfirm`이 `maskBuf` 운반.
- **Modify** `skills/image-edit-region/scripts/region-edit.mjs` — `runEditCycle`/`saveFinal` 클로저가 `maskBuf`를 넘기도록.
- **Modify** `skills/image-edit-region/scripts/ui/index.html` — 도구 토글·브러시 크기·지우개·전체지우기 컨트롤.
- **Modify** `skills/image-edit-region/scripts/ui/app.js` — 2-캔버스 브러시, `buildBrushPayload` 순수 export.
- **Modify** `skills/image-edit-region/SKILL.md` — 브러시 모드 한 줄.
- **Create** tests: `composite-mask.test.mjs`, `edit-cycle-mask.test.mjs`, `server-mask.test.mjs`, `ui/app.test.mjs`.

테스트 import 깊이: `tests/skills/image-edit-region/scripts/*.test.mjs`는 `../../../../`, `tests/skills/image-edit-region/scripts/ui/*.test.mjs`는 `../../../../../`.

---

## Task 1: compositeMask + maskHasEditableArea (composite.mjs)

**Files:**
- Modify: `skills/image-edit-region/scripts/composite.mjs`
- Test: `tests/skills/image-edit-region/scripts/composite-mask.test.mjs`

- [ ] **Step 1: 실패 테스트 작성**

`tests/skills/image-edit-region/scripts/composite-mask.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compositeMask, maskHasEditableArea } from '../../../../skills/image-edit-region/scripts/composite.mjs';
import { encodePNG, decodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w, h, [r, g, b, a]) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) { px[i*4]=r; px[i*4+1]=g; px[i*4+2]=b; px[i*4+3]=a; }
  return encodePNG(px, w, h, 6);
}

// 마스크: 전부 alpha 255(보존), 지정 픽셀만 다른 alpha
function maskWith(w, h, overrides) {
  const px = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) px[i*4+3] = 255;
  for (const [x, y, a] of overrides) px[(y*w+x)*4+3] = a;
  return encodePNG(px, w, h, 6);
}

test('compositeMask: alpha0=편집(edited), alpha255=보존(original), 부분alpha=블렌드', () => {
  const original = solid(4, 4, [255, 0, 0, 255]); // 빨강
  const edited   = solid(4, 4, [0, 0, 255, 255]); // 파랑
  const mask = maskWith(4, 4, [[1, 1, 0], [2, 2, 127]]); // (1,1) 편집, (2,2) 절반
  const out = compositeMask(original, edited, mask);
  const { px, width } = decodePNG(out);
  const at = (x, y) => [...px.subarray((y*width+x)*4, (y*width+x)*4+4)];
  assert.deepEqual(at(0, 0), [255, 0, 0, 255]); // 보존
  assert.deepEqual(at(1, 1), [0, 0, 255, 255]); // 편집
  assert.deepEqual(at(2, 2), [127, 0, 128, 255]); // w=(255-127)/255≈0.502 블렌드
});

test('compositeMask: 셋 중 하나라도 크기 다르면 거부', () => {
  const original = solid(4, 4, [255, 0, 0, 255]);
  const edited   = solid(4, 4, [0, 0, 255, 255]);
  const mask     = maskWith(3, 3, []);
  assert.throws(() => compositeMask(original, edited, mask), /크기/);
});

test('maskHasEditableArea: 전부 불투명이면 false, 일부 투명이면 true', () => {
  assert.equal(maskHasEditableArea(maskWith(4, 4, [])), false);
  assert.equal(maskHasEditableArea(maskWith(4, 4, [[0, 0, 0]])), true);
  assert.equal(maskHasEditableArea(maskWith(4, 4, [[0, 0, 200]])), true); // <255
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite-mask.test.mjs`
Expected: FAIL — `compositeMask`/`maskHasEditableArea` not exported.

- [ ] **Step 3: 구현 추가**

`composite.mjs` 끝에 추가(기존 함수는 그대로 둔다):

```js
// 마스크에 편집 영역(alpha<255)이 하나라도 있는지. 빈 편집을 호출부에서 거르는 용도.
export function maskHasEditableArea(maskBuf) {
  const { px, bpp, width, height } = decodePNG(maskBuf);
  const m = toRGBA(px, bpp, width, height);
  for (let i = 0; i < width * height; i++) if (m[i*4+3] < 255) return true;
  return false;
}

// 마스크 alpha 가중 블렌드 합성. 편집가중 w=(255-alpha)/255.
// out = edited*w + original*(1-w). alpha0=완전 편집, alpha255=완전 보존, 중간=페더링.
// 세 PNG(원본·편집·마스크)는 같은 크기여야 한다.
export function compositeMask(originalBuf, editedBuf, maskBuf) {
  const o = decodePNG(originalBuf), e = decodePNG(editedBuf), m = decodePNG(maskBuf);
  if (o.width !== e.width || o.height !== e.height || o.width !== m.width || o.height !== m.height) {
    throw new CompositeError(`크기 불일치: 원본 ${o.width}x${o.height}, 편집 ${e.width}x${e.height}, 마스크 ${m.width}x${m.height}`);
  }
  const W = o.width, H = o.height;
  const out = toRGBA(o.px, o.bpp, W, H);
  const eR = toRGBA(e.px, e.bpp, W, H);
  const mR = toRGBA(m.px, m.bpp, W, H);
  for (let i = 0; i < W * H; i++) {
    const w = (255 - mR[i*4+3]) / 255; // 편집 가중
    if (w === 0) continue;             // 보존: 원본 그대로
    for (let c = 0; c < 3; c++) {
      out[i*4+c] = Math.round(eR[i*4+c] * w + out[i*4+c] * (1 - w));
    }
    // alpha 채널은 원본(불투명) 유지
  }
  return encodePNG(out, W, H, 6);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/composite-mask.test.mjs`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/composite.mjs tests/skills/image-edit-region/scripts/composite-mask.test.mjs
git commit -m "feat(image-edit-region): compositeMask 가중 블렌드 + maskHasEditableArea 추가"
```

---

## Task 2: runEditCycle 마스크 분기 (edit-cycle.mjs)

**Files:**
- Modify: `skills/image-edit-region/scripts/edit-cycle.mjs`
- Test: `tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs`

- [ ] **Step 1: 실패 테스트 작성**

`tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runEditCycle } from '../../../../skills/image-edit-region/scripts/edit-cycle.mjs';
import { buildMask } from '../../../../skills/image-edit-region/scripts/composite.mjs';
import { encodePNG, decodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function solid(w, h, c) {
  const px = Buffer.alloc(w*h*4);
  for (let i=0;i<w*h;i++){px[i*4]=c[0];px[i*4+1]=c[1];px[i*4+2]=c[2];px[i*4+3]=c[3];}
  return encodePNG(px, w, h, 6);
}

test('runEditCycle(maskBuf): --mask 로 마스크를 보내고 compositeMask 로 합성', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255])); // 빨강
  const maskBuf = buildMask(4, 4, { x: 1, y: 1, w: 2, h: 2 }); // (1,1)~(2,2) 편집

  let seen = null;
  const runImageGen = async (args) => {
    seen = args;
    writeFileSync(args[args.indexOf('--out') + 1], solid(4, 4, [0, 0, 255, 255])); // 파랑
    return { status: 0, stdout: '', stderr: '' };
  };

  const res = await runEditCycle({ imagePath, maskBuf, prompt: '파랗게', quality: 'low', workDir: dir, runImageGen });

  assert.ok(seen.includes('--mask'));
  assert.ok(seen.includes('--image') && seen.includes(imagePath));
  assert.ok(seen.includes('--size'));
  assert.equal(seen[seen.indexOf('--quality') + 1], 'low');
  assert.ok(existsSync(res.outPath));
  const { px, width } = decodePNG(readFileSync(res.outPath));
  const at = (x,y)=>[...px.subarray((y*width+x)*4,(y*width+x)*4+4)];
  assert.deepEqual(at(0, 0), [255, 0, 0, 255]); // 보존
  assert.deepEqual(at(1, 1), [0, 0, 255, 255]); // 편집
});

test('runEditCycle(maskBuf): 편집 영역이 없는 마스크는 거부', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const emptyMask = solid(4, 4, [0, 0, 0, 255]); // 전부 불투명 = 편집 영역 없음
  await assert.rejects(
    runEditCycle({ imagePath, maskBuf: emptyMask, prompt: 'x', quality: 'low', workDir: dir, runImageGen: async () => ({ status: 0 }) }),
    /편집/,
  );
});

test('runEditCycle(maskBuf): 마스크 크기가 이미지와 다르면 거부', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ier-'));
  const imagePath = path.join(dir, 'orig.png');
  writeFileSync(imagePath, solid(4, 4, [255, 0, 0, 255]));
  const badMask = buildMask(3, 3, { x: 1, y: 1, w: 1, h: 1 });
  await assert.rejects(
    runEditCycle({ imagePath, maskBuf: badMask, prompt: 'x', quality: 'low', workDir: dir, runImageGen: async () => ({ status: 0 }) }),
    /마스크/,
  );
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs`
Expected: FAIL — `runEditCycle`이 아직 `maskBuf`를 모름(bbox undefined로 throw).

- [ ] **Step 3: 구현 — runEditCycle 분기**

`edit-cycle.mjs`의 import 줄에 `compositeMask`, `maskHasEditableArea` 추가:

```js
import { buildMask, compositeRegion, compositeMask, maskHasEditableArea, resizePNG } from './composite.mjs';
```

파일 끝에 작은 해시 헬퍼 추가(마스크 경로 파일명 충돌 방지 — 입력 기반 결정적):

```js
// 마스크 내용 기반 짧은 16진 해시. 같은 마스크는 같은 파일명(덮어쓰기 안전).
function shortHash(buf) {
  let h = 0;
  for (let i = 0; i < buf.length; i++) h = (h * 31 + buf[i]) | 0;
  return (h >>> 0).toString(16);
}
```

`runEditCycle`을 아래로 교체(시그니처에 `maskBuf` 추가, bbox/mask 분기):

```js
export async function runEditCycle({ imagePath, bbox, maskBuf, prompt, quality, workDir, runImageGen = defaultRunImageGen }) {
  const orig = readFileSync(imagePath);
  const { width, height } = decodePNG(orig);

  let tag, maskPath;
  if (maskBuf) {
    if (!maskHasEditableArea(maskBuf)) throw new EditCycleError('편집할 영역이 칠해지지 않았습니다.');
    const m = decodePNG(maskBuf);
    if (m.width !== width || m.height !== height) {
      throw new EditCycleError(`마스크 크기 불일치: 이미지 ${width}x${height} vs 마스크 ${m.width}x${m.height}`);
    }
    tag = `mask-${shortHash(maskBuf)}-${quality}`;
    maskPath = path.join(workDir, `${tag}-mask.png`);
    writeFileSync(maskPath, maskBuf);
  } else {
    tag = `${bbox.x}-${bbox.y}-${bbox.w}-${bbox.h}-${quality}`;
    maskPath = path.join(workDir, `mask-${tag}.png`);
    writeFileSync(maskPath, buildMask(width, height, bbox));
  }

  const editedApi = path.join(workDir, `api-${tag}.png`);
  const size = gptImageSizeOk(width, height) ? `${width}x${height}` : 'auto';
  const args = [
    '--image', imagePath, '--mask', maskPath, '--prompt', prompt,
    '--quality', quality, '--size', size, '--out', editedApi, '--force',
  ];
  const r = await runImageGen(args);
  if (r.status !== 0) throw new EditCycleError(`image-gen 실패(status ${r.status}): ${r.stderr || r.stdout}`);

  const outPath = path.join(workDir, `preview-${tag}.png`);
  // API 결과는 원본과 다른 크기로 올 수 있으므로 원본 크기로 되돌린 뒤 합성한다.
  const editedResized = resizePNG(readFileSync(editedApi), width, height);
  const composited = maskBuf
    ? compositeMask(orig, editedResized, maskBuf)
    : compositeRegion(orig, editedResized, bbox);
  writeFileSync(outPath, composited);
  return { outPath, maskPath, editedApi };
}
```

- [ ] **Step 4: 통과 확인 (신규 + 기존 회귀)**

Run: `node --test tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs tests/skills/image-edit-region/scripts/edit-cycle.test.mjs`
Expected: PASS (신규 3 + 기존 3). 기존 bbox 테스트도 그대로 통과.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/edit-cycle.mjs tests/skills/image-edit-region/scripts/edit-cycle-mask.test.mjs
git commit -m "feat(image-edit-region): runEditCycle 마스크 경로 분기(compositeMask)"
```

---

## Task 3: dataURL 디코드 + handleEdit/handleConfirm 분기 (server.mjs)

**Files:**
- Modify: `skills/image-edit-region/scripts/server.mjs`
- Test: `tests/skills/image-edit-region/scripts/server-mask.test.mjs`

- [ ] **Step 1: 실패 테스트 작성**

`tests/skills/image-edit-region/scripts/server-mask.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, decodeMaskDataUrl } from '../../../../skills/image-edit-region/scripts/server.mjs';
import { encodePNG } from '../../../../skills/image-gen/scripts/autocrop.mjs';

function pngDataUrl() {
  const px = Buffer.alloc(2 * 2 * 4, 255);
  const buf = encodePNG(px, 2, 2, 6);
  return 'data:image/png;base64,' + buf.toString('base64');
}

function deps(overrides = {}) {
  return {
    runEditCycle: async ({ quality }) => ({ outPath: `/tmp/preview-${quality}.png` }),
    saveFinal: async () => '/tmp/out.png',
    ...overrides,
  };
}

test('decodeMaskDataUrl: 올바른 dataURL 을 Buffer 로', () => {
  const buf = decodeMaskDataUrl(pngDataUrl());
  assert.ok(Buffer.isBuffer(buf) && buf.length > 0);
});

test('decodeMaskDataUrl: 형식 오류는 throw', () => {
  assert.throws(() => decodeMaskDataUrl('not-a-data-url'), /형식/);
});

test('handleEdit(maskPng): 디코드한 maskBuf 를 runEditCycle 에 넘기고 previewId 발급', async () => {
  let passed = null;
  const s = createSession(deps({ runEditCycle: async (a) => { passed = a; return { outPath: '/tmp/p.png' }; } }));
  const r = await s.handleEdit({ maskPng: pngDataUrl(), prompt: 'x' });
  assert.ok(r.previewId);
  assert.ok(Buffer.isBuffer(passed.maskBuf));
  assert.equal(passed.bbox, undefined);
  assert.equal(s.getPreview(r.previewId).quality, 'low');
});

test('handleEdit(bbox): 기존 사각형 경로 회귀', async () => {
  const s = createSession(deps());
  const r = await s.handleEdit({ bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
  assert.ok(r.previewId);
});

test('handleEdit(maskPng): 잘못된 dataURL 은 error 응답(세션 유지)', async () => {
  const s = createSession(deps());
  const r = await s.handleEdit({ maskPng: 'bad', prompt: 'x' });
  assert.match(r.error, /형식/);
  assert.equal(s.isAlive(), true);
});

test('handleConfirm(maskPng): saveFinal 에 maskBuf 가 담긴 입력 전달', async () => {
  let saved = null;
  const s = createSession(deps({ saveFinal: async (input) => { saved = input; return '/tmp/out.png'; } }));
  const e = await s.handleEdit({ maskPng: pngDataUrl(), prompt: 'x' });
  await s.handleConfirm({ previewId: e.previewId });
  assert.ok(Buffer.isBuffer(saved.maskBuf));
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/server-mask.test.mjs`
Expected: FAIL — `decodeMaskDataUrl` 미export, `handleEdit`이 maskPng 모름.

- [ ] **Step 3: 구현 — server.mjs**

import 아래(파일 상단 헬퍼 영역)에 추가:

```js
// data:image/png;base64,... dataURL 을 PNG Buffer 로. 전송 계층 관심사라 서버에 둔다.
export function decodeMaskDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') throw new Error('maskPng 가 문자열이 아닙니다.');
  const m = /^data:image\/png;base64,(.+)$/s.exec(dataUrl);
  if (!m) throw new Error('maskPng 형식이 잘못되었습니다(data:image/png;base64 필요).');
  return Buffer.from(m[1], 'base64');
}
```

`createSession` 안의 `handleEdit`를 교체(bbox/maskPng 분기, 미리보기에 maskBuf 보관):

```js
    async handleEdit({ bbox, prompt, maskPng }) {
      try {
        const maskBuf = maskPng ? decodeMaskDataUrl(maskPng) : undefined;
        const { outPath } = await runEditCycle({ bbox, maskBuf, prompt, quality: 'low' });
        const previewId = `p${++seq}`;
        previews.set(previewId, { bbox, maskBuf, prompt, quality: 'low', outPath });
        return { previewId };
      } catch (err) { return { error: err.message }; }
    },
```

`handleConfirm`의 saveFinal 호출을 객체 입력으로 교체:

```js
    async handleConfirm({ previewId }) {
      const p = previews.get(previewId);
      if (!p) throw new Error(`알 수 없는 previewId: ${previewId}`);
      const savedPath = await saveFinal({ bbox: p.bbox, maskBuf: p.maskBuf, prompt: p.prompt }); // 고품질 재실행
      finish({ status: 'confirmed', path: savedPath });
      return { savedPath };
    },
```

- [ ] **Step 4: 통과 확인 (신규 + 기존 회귀)**

Run: `node --test tests/skills/image-edit-region/scripts/server-mask.test.mjs tests/skills/image-edit-region/scripts/server.test.mjs`
Expected: PASS. 기존 server.test 의 `saveFinal: async (previewBbox, prompt) => ...` 목은 인자를 무시하므로 객체 한 개를 받아도 그대로 통과.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/scripts/server.mjs tests/skills/image-edit-region/scripts/server-mask.test.mjs
git commit -m "feat(image-edit-region): /edit maskPng dataURL 분기 + decodeMaskDataUrl"
```

---

## Task 4: region-edit 클로저 maskBuf 운반 (region-edit.mjs)

**Files:**
- Modify: `skills/image-edit-region/scripts/region-edit.mjs:81-88`

- [ ] **Step 1: 구현 — createSession 클로저 교체**

`region-edit.mjs`의 `createSession({ ... runEditCycle / saveFinal ... })` 두 클로저를 교체:

```js
    runEditCycle: ({ bbox, maskBuf, prompt, quality }) =>
      runEditCycle({ imagePath: image, bbox, maskBuf, prompt, quality, workDir, runImageGen: defaultRunImageGen }),
    saveFinal: async ({ bbox, maskBuf, prompt }) => {
      const r = await runEditCycle({ imagePath: image, bbox, maskBuf, prompt, quality: 'high', workDir, runImageGen: defaultRunImageGen });
      const { copyFileSync } = await import('node:fs');
      copyFileSync(r.outPath, outPath);
      return outPath;
    },
```

- [ ] **Step 2: 회귀 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/region-edit.test.mjs`
Expected: PASS — `region-edit.test`는 `parseArgs`/`resolveOutPath`/`resolveGuiBrowser`만 검사하므로 영향 없음. 클로저는 타입만 확장.

- [ ] **Step 3: 커밋**

```bash
git add skills/image-edit-region/scripts/region-edit.mjs
git commit -m "feat(image-edit-region): saveFinal/runEditCycle 클로저가 maskBuf 운반"
```

---

## Task 5: 브러시 GUI (index.html + app.js)

순수함수 `buildBrushPayload`만 자동 테스트하고, DOM 동작은 Task 6 스모크 체크포인트에서 사람이 확인한다.

**Files:**
- Modify: `skills/image-edit-region/scripts/ui/app.js`
- Modify: `skills/image-edit-region/scripts/ui/index.html`
- Test: `tests/skills/image-edit-region/scripts/ui/app.test.mjs`

- [ ] **Step 1: 실패 테스트 작성**

`tests/skills/image-edit-region/scripts/ui/app.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBrushPayload, buildEditPayload } from '../../../../../skills/image-edit-region/scripts/ui/app.js';

test('buildBrushPayload: maskPng dataURL 과 prompt 를 묶는다', () => {
  assert.deepEqual(
    buildBrushPayload('data:image/png;base64,AAAA', '파랗게'),
    { maskPng: 'data:image/png;base64,AAAA', prompt: '파랗게' },
  );
});

test('buildEditPayload: 기존 bbox payload 회귀', () => {
  assert.deepEqual(buildEditPayload({ x:0,y:0,w:2,h:2 }, 'x'), { bbox: { x:0,y:0,w:2,h:2 }, prompt: 'x' });
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/skills/image-edit-region/scripts/ui/app.test.mjs`
Expected: FAIL — `buildBrushPayload` 미export.

- [ ] **Step 3: app.js 교체**

`skills/image-edit-region/scripts/ui/app.js` 전체를 아래로 교체:

```js
// 드래그(사각형)·브러시 영역 편집 GUI. 순수함수는 node 테스트가 import 하고, DOM 바인딩은 window 가드 뒤.

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

export function buildEditPayload(bbox, prompt) { return { bbox, prompt }; }
export function buildBrushPayload(maskPng, prompt) { return { maskPng, prompt }; }

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  const promptEl = $('prompt'), statusEl = $('status'), afterEl = $('after');
  const bboxHintEl = $('bboxhint'), afterHintEl = $('afterhint');
  const editBtn = $('edit'), confirmBtn = $('confirm'), redoBtn = $('redo'), cancelBtn = $('cancel');
  const overlay = $('overlay'), overlayLabel = $('overlay-label'), overlaySub = $('overlay-sub');
  const toolRectBtn = $('tool-rect'), toolBrushBtn = $('tool-brush');
  const brushCtl = $('brushctl'), sizeEl = $('brushsize'), eraseEl = $('erase'), clearBtn = $('clearmask');

  const img = new Image();
  let imageW = 0, imageH = 0, rect = null, dragging = false, lastPreviewId = null;
  let tool = 'rect';            // 'rect' | 'brush'
  let painting = false, painted = false, lastPt = null;
  // 마스크 캔버스(원본 해상도): 데이터. 칠 캔버스: 시각 오버레이.
  const maskCv = document.createElement('canvas'), maskCtx = maskCv.getContext('2d');
  const paintCv = document.createElement('canvas'), paintCtx = paintCv.getContext('2d');

  const setStatus = (m, type = '') => { statusEl.textContent = m; statusEl.className = type; };
  const showOverlay = (label, sub) => { overlayLabel.textContent = label; overlaySub.textContent = sub || ''; overlay.hidden = false; };
  const hideOverlay = () => { overlay.hidden = true; };

  const qp = new URLSearchParams(location.search).get('prompt');
  if (qp) promptEl.value = qp;

  img.onload = () => {
    imageW = img.naturalWidth; imageH = img.naturalHeight;
    const scale = Math.min(1, 720 / imageW);
    cv.width = Math.round(imageW * scale); cv.height = Math.round(imageH * scale);
    maskCv.width = imageW; maskCv.height = imageH;
    paintCv.width = imageW; paintCv.height = imageH;
    resetMask();
    draw();
  };
  img.src = '/image';

  // 마스크 초기화: 전체 불투명 검정(보존) / 칠 캔버스 비움.
  function resetMask() {
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = '#000'; maskCtx.fillRect(0, 0, imageW, imageH);
    paintCtx.clearRect(0, 0, imageW, imageH);
    painted = false;
  }

  function draw() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(img, 0, 0, cv.width, cv.height);
    if (tool === 'brush') {
      ctx.drawImage(paintCv, 0, 0, cv.width, cv.height); // 칠한 편집 영역 오버레이
    } else if (rect) {
      const x = Math.min(rect.x0, rect.x1), y = Math.min(rect.y0, rect.y1);
      const w = Math.abs(rect.x1 - rect.x0), h = Math.abs(rect.y1 - rect.y0);
      ctx.fillStyle = 'rgba(10,12,16,.45)';
      ctx.fillRect(0, 0, cv.width, y);
      ctx.fillRect(0, y + h, cv.width, cv.height - (y + h));
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, cv.width - (x + w), h);
      ctx.strokeStyle = '#6d8cff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }

  // 표시 좌표 → 내부 캔버스 해상도(사각형용).
  const pos = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (cv.width / r.width), y: (e.clientY - r.top) * (cv.height / r.height) };
  };
  // 표시 좌표 → 원본 픽셀(브러시용).
  const posImage = (e) => {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) * (imageW / r.width), y: (e.clientY - r.top) * (imageH / r.height) };
  };

  function updateBboxHint() {
    if (tool === 'brush') { bboxHintEl.textContent = '브러시로 바꿀 영역을 칠하세요. 지우개로 지울 수 있어요.'; return; }
    if (!rect) { bboxHintEl.textContent = '이미지를 드래그해 편집할 영역을 지정하세요.'; return; }
    const b = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
    bboxHintEl.innerHTML = `선택: <b>${b.w}×${b.h}px</b> @ (${b.x}, ${b.y}) · 원본 픽셀 기준`;
  }

  // 브러시 한 획: from→to 를 둥근 선으로. 마스크는 destination-out(편집)/검정(지우개),
  // 칠 캔버스는 반투명 강조(편집)/destination-out(지우개).
  function stroke(from, to) {
    const r = Number(sizeEl.value);
    const erasing = eraseEl.checked;
    for (const [c, mode, style] of [
      [maskCtx, erasing ? 'source-over' : 'destination-out', '#000'],
      [paintCtx, erasing ? 'destination-out' : 'source-over', 'rgba(109,140,255,.5)'],
    ]) {
      c.globalCompositeOperation = mode;
      c.strokeStyle = style; c.fillStyle = style;
      c.lineWidth = r * 2; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(from.x, from.y); c.lineTo(to.x, to.y); c.stroke();
      c.beginPath(); c.arc(to.x, to.y, r, 0, Math.PI * 2); c.fill();
    }
    if (!erasing) painted = true;
  }

  // 포인터: 사각형(rect) 모드와 브러시 모드 공용 진입점.
  cv.addEventListener('mousedown', (e) => {
    if (tool === 'brush') { painting = true; lastPt = posImage(e); stroke(lastPt, lastPt); draw(); }
    else { const p = pos(e); rect = { x0: p.x, y0: p.y, x1: p.x, y1: p.y }; dragging = true; }
  });
  cv.addEventListener('mousemove', (e) => {
    if (tool === 'brush') { if (!painting) return; const p = posImage(e); stroke(lastPt, p); lastPt = p; draw(); }
    else { if (!dragging) return; const p = pos(e); rect.x1 = p.x; rect.y1 = p.y; draw(); updateBboxHint(); }
  });
  window.addEventListener('mouseup', () => { dragging = false; painting = false; });

  function setTool(t) {
    tool = t;
    toolRectBtn.classList.toggle('active', t === 'rect');
    toolBrushBtn.classList.toggle('active', t === 'brush');
    brushCtl.style.display = t === 'brush' ? '' : 'none';
    cv.style.cursor = t === 'brush' ? 'cell' : 'crosshair';
    updateBboxHint(); draw();
  }
  toolRectBtn.onclick = () => setTool('rect');
  toolBrushBtn.onclick = () => setTool('brush');
  clearBtn.onclick = () => { resetMask(); draw(); setStatus('마스크를 비웠습니다.'); };

  async function postJson(url, body) {
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    return r.json();
  }

  editBtn.onclick = async () => {
    let payload;
    if (tool === 'brush') {
      if (!painted) return setStatus('편집할 영역을 브러시로 칠하세요.', 'err');
      payload = buildBrushPayload(maskCv.toDataURL('image/png'), promptEl.value);
    } else {
      if (!rect) return setStatus('먼저 편집할 영역을 드래그하세요.', 'err');
      const bbox = canvasToImageBbox(rect, { canvasW: cv.width, canvasH: cv.height, imageW, imageH });
      if (bbox.w < 1 || bbox.h < 1) return setStatus('영역이 너무 작습니다.', 'err');
      payload = buildEditPayload(bbox, promptEl.value);
    }
    editBtn.disabled = true; redoBtn.disabled = true; confirmBtn.disabled = true;
    showOverlay('미리보기 만드는 중…', '선택 영역만 편집하고 나머지는 보존합니다');
    setStatus('편집 중…', 'busy');
    try {
      const res = await postJson('/edit', payload);
      if (res.error) { setStatus('실패: ' + res.error, 'err'); return; }
      lastPreviewId = res.previewId;
      afterEl.src = `/preview/${res.previewId}?t=${Date.now()}`; afterEl.style.display = 'block';
      afterHintEl.style.display = 'none';
      confirmBtn.disabled = false; redoBtn.disabled = false;
      setStatus('미리보기 완료 — 마음에 들면 확정 저장하세요.', 'ok');
    } catch (e) {
      setStatus('요청 실패: ' + e.message, 'err');
    } finally {
      editBtn.disabled = false; hideOverlay();
    }
  };

  confirmBtn.onclick = async () => {
    if (!lastPreviewId) return;
    editBtn.disabled = true; redoBtn.disabled = true; confirmBtn.disabled = true;
    showOverlay('고품질로 저장 중…', '한 번 더 고품질로 편집해 파일로 저장합니다');
    setStatus('저장 중…', 'busy');
    try {
      const res = await postJson('/confirm', { previewId: lastPreviewId });
      if (res.error) { setStatus('실패: ' + res.error, 'err'); confirmBtn.disabled = false; return; }
      setStatus('저장됨: ' + res.savedPath + ' — 창을 닫아도 됩니다.', 'ok');
    } catch (e) {
      setStatus('요청 실패: ' + e.message, 'err'); confirmBtn.disabled = false;
    } finally {
      editBtn.disabled = false; hideOverlay();
    }
  };

  redoBtn.onclick = () => {
    afterEl.style.display = 'none'; afterHintEl.style.display = '';
    confirmBtn.disabled = true; redoBtn.disabled = true;
    setStatus('영역·지시문을 고쳐 다시 편집하세요.');
  };
  cancelBtn.onclick = async () => { await postJson('/cancel', {}); setStatus('취소됨 — 창을 닫아도 됩니다.'); };

  const ping = () => { fetch('/ping', { method: 'POST' }).catch(() => {}); };
  ping();
  setInterval(ping, 3000);
  window.addEventListener('pagehide', () => { try { navigator.sendBeacon('/cancel'); } catch (e) { /* 닫히는 중 실패 무시 */ } });

  setTool('rect');
}
```

- [ ] **Step 4: index.html 컨트롤 추가**

`index.html`의 편집 지시 카드(`<h2>편집 지시</h2>` 블록)에서 `<div class="field">` **위에** 도구 토글을, 그리고 prompt 필드 **아래에** 브러시 컨트롤을 넣는다. 아래 `<h2>편집 지시</h2>` 직후부터 첫 `<div class="btns"...>` 직전까지를 교체:

```html
        <h2>편집 지시</h2>
        <div class="btns" style="margin-bottom:12px;">
          <button id="tool-rect" class="ghost active">사각형</button>
          <button id="tool-brush" class="ghost">브러시</button>
        </div>
        <div id="brushctl" style="display:none; margin-bottom:12px;">
          <label class="field" style="flex-direction:row; align-items:center; gap:10px;">
            <span>브러시 크기</span>
            <input id="brushsize" type="range" min="4" max="120" value="32" style="flex:1;" />
          </label>
          <div class="btns" style="margin-top:9px; align-items:center;">
            <label class="field" style="flex-direction:row; align-items:center; gap:7px; flex:1;">
              <input id="erase" type="checkbox" /> <span>지우개</span>
            </label>
            <button id="clearmask" class="ghost">전체 지우기</button>
          </div>
        </div>
        <div class="field">
          <span>무엇으로 바꿀까요?</span>
          <textarea id="prompt" placeholder="예: 케이크 윗면의 고명을 걷어내고 깨끗한 크림 표면으로"></textarea>
        </div>
```

그리고 `<style>` 안에 활성 도구 표시 한 줄 추가(아무 위치, 예: `button.ghost` 규칙 아래):

```css
    button.ghost.active { background:var(--accent); border-color:var(--accent); color:#fff; }
```

- [ ] **Step 5: 순수함수 테스트 통과 확인**

Run: `node --test tests/skills/image-edit-region/scripts/ui/app.test.mjs`
Expected: PASS (2 tests)

- [ ] **Step 6: 커밋**

```bash
git add skills/image-edit-region/scripts/ui/app.js skills/image-edit-region/scripts/ui/index.html tests/skills/image-edit-region/scripts/ui/app.test.mjs
git commit -m "feat(image-edit-region): 브러시 모드 GUI(2-캔버스·도구 토글·크기·지우개·전체지우기)"
```

---

## Task 6: 문서·동기화·전체 스위트·스모크

**Files:**
- Modify: `skills/image-edit-region/SKILL.md`

- [ ] **Step 1: SKILL.md 사용법 갱신**

`SKILL.md`의 사용법/내부 동작 설명에 브러시 모드를 한 줄 더한다(기존 사각형 설명 옆):
- 사각형 드래그 또는 **브러시로 영역을 칠해** 편집할 곳을 지정한다.
- 브러시 모드는 원본 해상도 마스크를 만들어 보내고, 결과를 **마스크 alpha 가중 블렌드**로 재합성해 칠한 곳만 바뀐다.

- [ ] **Step 2: 동기화 + 시크릿 점검**

Run: `npm run sync`
Expected: Codex 번들/생성물 재생성, 에러 없음.

- [ ] **Step 3: 전체 테스트 스위트**

Run: `npm test`
Expected: 기존 + 신규(compositeMask 3, edit-cycle-mask 3, server-mask 6, app 2) 전부 PASS, 회귀 0.

- [ ] **Step 4: 스모크 (사람 확인 — 사용자 승인 후 실행)**

케이크 이미지로 Chrome에서 브러시 모드를 수동 확인한다:

Run: `node skills/image-edit-region/scripts/region-edit.mjs --image "D:\기타 프로그램\design-test\SugarLoop\.design\assets\brand-kit\key-visual.png" --prompt "고명을 걷어내고 깨끗한 크림으로"`

확인 항목:
- [ ] 브러시 탭 전환 → 크기 슬라이더·지우개·전체지우기 노출
- [ ] 칠한 영역이 반투명 파랑 오버레이로 표시
- [ ] 지우개로 일부 지워짐, 전체 지우기로 초기화
- [ ] 편집 미리보기: 칠한 곳만 바뀌고 나머지는 원본 보존(경계 자연스러움)
- [ ] 확정 저장 → `<원본>-edited.png` 생성
- [ ] 사각형 모드도 그대로 동작(회귀 없음)

- [ ] **Step 5: 커밋**

```bash
git add skills/image-edit-region/SKILL.md
git commit -m "docs(image-edit-region): 브러시 모드 사용법 추가"
```

---

## Self-Review (작성자 체크)

- **Spec coverage:** compositeMask 가중 블렌드(T1)·maskHasEditableArea(T1)·runEditCycle 분기(T2)·dataURL 전송/검증(T3)·region-edit 운반(T4)·2-캔버스 GUI/도구 토글/크기/지우개/전체지우기(T5)·SKILL.md/sync/스모크(T6) — 스펙 각 절 대응됨. 사각형 유지 = 기존 함수 보존 + 분기.
- **Placeholder scan:** 모든 코드 스텝에 실제 코드/명령/기대 출력 포함. "적절히 처리" 류 없음.
- **Type consistency:** `runEditCycle({ imagePath, bbox, maskBuf, prompt, quality, workDir, runImageGen })` / `handleEdit({ bbox, prompt, maskPng })` / `saveFinal({ bbox, maskBuf, prompt })` / `compositeMask(original, edited, mask)` / `maskHasEditableArea(mask)` / `decodeMaskDataUrl(dataUrl)` / `buildBrushPayload(maskPng, prompt)` — 태스크 간 명칭·시그니처 일치.
```
