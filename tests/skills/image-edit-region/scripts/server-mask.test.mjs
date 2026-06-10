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
