import { test } from "node:test";
import assert from "node:assert/strict";
import { srgbToOklab, oklabToSrgb, hexToRgb } from "../skills/design-logo/scripts/remap-logo-dark.mjs";

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
