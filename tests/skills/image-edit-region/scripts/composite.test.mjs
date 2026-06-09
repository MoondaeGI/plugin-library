import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMask, toRGBA, compositeRegion } from '../../../../skills/image-edit-region/scripts/composite.mjs';
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
