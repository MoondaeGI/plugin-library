import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compositeMask, maskHasEditableArea, featherMask } from '../../../../skills/image-edit-region/scripts/composite.mjs';
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

// 왼쪽 절반(col < splitX) alpha 0(편집), 오른쪽 절반 alpha 255(보존)
function halfMask(w, h, splitX) {
  const px = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[(y*w+x)*4+3] = x < splitX ? 0 : 255;
  return encodePNG(px, w, h, 6);
}

test('featherMask: 경계를 그라데이션으로 번지게 한다(단조 증가)', () => {
  const m = featherMask(halfMask(8, 8, 4), 2);
  const { px, width } = decodePNG(m);
  const a = (x, y) => px[(y*width+x)*4+3];
  assert.equal(a(0, 0), 0);     // 깊은 편집 영역은 그대로 0
  assert.equal(a(7, 0), 255);   // 깊은 보존 영역은 그대로 255
  // 경계(3→5)는 0과 255 사이로 부드럽게 증가
  assert.ok(a(3, 0) > 0 && a(3, 0) < a(4, 0) && a(4, 0) < a(5, 0) && a(5, 0) < 255);
  // 행 전체가 단조 비감소
  for (let x = 1; x < 8; x++) assert.ok(a(x, 0) >= a(x - 1, 0));
});

test('featherMask: radius 0 은 하드 경계 유지(번지지 않음)', () => {
  const m = featherMask(halfMask(8, 8, 4), 0);
  const { px, width } = decodePNG(m);
  const a = (x, y) => px[(y*width+x)*4+3];
  assert.equal(a(3, 0), 0);    // 경계 안쪽 여전히 0
  assert.equal(a(4, 0), 255);  // 경계 바깥 여전히 255
});
