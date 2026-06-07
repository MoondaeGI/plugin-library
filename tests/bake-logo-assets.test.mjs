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
