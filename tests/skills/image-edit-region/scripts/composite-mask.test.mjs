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
