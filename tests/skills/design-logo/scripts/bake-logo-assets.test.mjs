import { test } from "node:test";
import assert from "node:assert/strict";
import { recolorMark, compositeAppIcon, bakeAll } from "../../../../skills/design-logo/scripts/bake-logo-assets.mjs";
import { encodePNG, decodePNG } from "../../../../skills/image-gen/scripts/autocrop.mjs";

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
