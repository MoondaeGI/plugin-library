import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTokensCss, hexToRgba } from "../skills/design-brand-kit/scripts/tokens-to-css.mjs";

const SAMPLE = {
  color: { primary:"#36495F", accent:"#8C5A6F", background:"#F4EEE4",
           surface:"#FBF7F0", surfaceAlt:"#EBE3D6", text:"#2C2A27",
           textMuted:"#8A8175", border:"#E4DBCD", success:"#6F8A66",
           warning:"#C3974E", danger:"#B05750" },
  typography: { display:'"Gowun Batang", serif', heading:'"Pretendard", sans-serif',
                body:'"Pretendard", sans-serif', mono:'"IBM Plex Mono", monospace',
                accent:'"Gowun Batang", serif' },
  radius: { sm:"8px", md:"14px", lg:"20px", xl:"28px" },
  shadow: { sm:"0 1px 2px rgba(44,42,39,.06)", md:"0 4px 14px rgba(44,42,39,.08)" },
  spacing: { sectionY:"96px", containerX:"24px", cardPadding:"20px" }
};

test("color 토큰을 --color-*(kebab)로 매핑", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--color-primary:\s*#36495F/);
  assert.match(css, /--color-surface-alt:\s*#EBE3D6/);
  assert.match(css, /--color-text-muted:\s*#8A8175/);
  assert.match(css, /--color-background:\s*#F4EEE4/);
});

test("typography를 --font-*로 매핑", () => {
  assert.match(generateTokensCss(SAMPLE), /--font-display:\s*"Gowun Batang"/);
  assert.match(generateTokensCss(SAMPLE), /--font-mono:\s*"IBM Plex Mono"/);
});

test("radius 매핑 + --radius-pill 추가", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--radius-md:\s*14px/);
  assert.match(css, /--radius-pill:\s*999px/);
});

test("페이지 spacing을 --space-section-y 등으로 매핑", () => {
  assert.match(generateTokensCss(SAMPLE), /--space-section-y:\s*96px/);
});

test("입력과 무관하게 고정 관례 spacing 스케일 추가", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--space-1:\s*4px/);
  assert.match(css, /--space-8:\s*64px/);
});

test("brand color에서 tint 파생", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--tint-primary:\s*rgba\(54,\s*73,\s*95,\s*0?\.08\)/);
  assert.match(css, /--tint-danger:\s*rgba\(176,\s*87,\s*80,\s*0?\.12\)/);
});

test("hexToRgba 변환", () => {
  assert.equal(hexToRgba("#36495F", 0.08), "rgba(54, 73, 95, 0.08)");
});

test("brand-tokens에 없는 키는 만들지 않음", () => {
  const css = generateTokensCss(SAMPLE);
  assert.doesNotMatch(css, /--color-primary-dark/);
  assert.doesNotMatch(css, /--color-bg:/);
});
