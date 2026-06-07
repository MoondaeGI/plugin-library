import { test } from "node:test";
import assert from "node:assert/strict";
import { srgbToOklab, oklabToSrgb, hexToRgb, remapLogoDark } from "../skills/design-logo/scripts/remap-logo-dark.mjs";
import { encodePNG, decodePNG } from "../skills/image-gen/scripts/autocrop.mjs";

test("OKLab round-trip: sRGB→OKLab→sRGB 가 원본과 ±2 이내", () => {
  for (const c of [[110,74,46],[201,116,59],[237,224,204],[0,0,0],[255,255,255],[221,110,146]]) {
    const rt = oklabToSrgb(srgbToOklab(c));
    for (let i=0;i<3;i++) assert.ok(Math.abs(rt[i]-c[i]) <= 2, `${c} → ${rt} (ch ${i})`);
  }
});

test("hexToRgb: #RRGGBB 파싱", () => {
  assert.deepEqual(hexToRgb("#EDE0CC"), [237,224,204]);
  assert.deepEqual(hexToRgb("6E4A2E"), [110,74,46]);
});

test("OKLab L: 흰색이 검정보다 큼(밝기 단조성)", () => {
  assert.ok(srgbToOklab([255,255,255])[0] > srgbToOklab([0,0,0])[0]);
});

// 2x2 RGBA 픽스처: px0=cocoa(불투명), px1=caramel(불투명), px2=투명, px3=흰(불투명)
function fixture() {
  const px = Buffer.from([
    110,74,46,255,   // px0 cocoa #6E4A2E
    201,116,59,255,  // px1 caramel #C9743B
    0,0,0,0,         // px2 투명
    255,255,255,255, // px3 흰
  ]);
  return encodePNG(px, 2, 2, 6);
}
const MAP = [
  { src:[110,74,46], dst:[237,224,204] },  // cocoa → 연크림 #EDE0CC
  { src:[201,116,59], dst:[240,180,90] },  // caramel → 앰버 #F0B45A
];

test("remapLogoDark: 소스색 픽셀이 대응 타깃색으로(±3), alpha 보존", () => {
  const { px } = decodePNG(remapLogoDark(fixture(), MAP));
  for (let i=0;i<3;i++) assert.ok(Math.abs(px[i]-[237,224,204][i])<=3, `px0 ch${i}=${px[i]}`);
  for (let i=0;i<3;i++) assert.ok(Math.abs(px[4+i]-[240,180,90][i])<=3, `px1 ch${i}=${px[4+i]}`);
  assert.equal(px[11], 0); // px2 투명 보존
});

test("remapLogoDark: 매핑 1개면 모든 불투명 픽셀이 그 타깃 단색(±3)", () => {
  const { px } = decodePNG(remapLogoDark(fixture(), [{ src:[110,74,46], dst:[10,20,30] }]));
  for (const base of [0,4,12]) for (let i=0;i<3;i++) assert.ok(Math.abs(px[base+i]-[10,20,30][i])<=3);
});

test("remapLogoDark: RGB(투명 없음)·빈 매핑은 에러", () => {
  assert.throws(()=>remapLogoDark(encodePNG(Buffer.from([1,2,3,4,5,6]),2,1,2), MAP), /RGBA/);
  assert.throws(()=>remapLogoDark(fixture(), []), /매핑/);
});
