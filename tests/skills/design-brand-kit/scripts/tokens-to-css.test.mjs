import { test } from "node:test";
import assert from "node:assert/strict";
import { generateTokensCss, hexToRgba } from "../../../../skills/design-brand-kit/scripts/tokens-to-css.mjs";

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

test("wordmark 블록 없으면 기본값 .wordmark 클래스 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.wordmark\s*\{/);
  assert.match(css, /font-family:\s*var\(--font-wordmark,\s*var\(--font-display\)\)/);
  assert.match(css, /letter-spacing:\s*normal/);
  assert.match(css, /font-weight:\s*700/);
  assert.match(css, /text-transform:\s*none/);
  assert.match(css, /color:\s*var\(--color-text\)/);
});

test("wordmark.font 있으면 --font-wordmark emit", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { font: '"Gugi", sans-serif' } });
  assert.match(css, /--font-wordmark:\s*"Gugi", sans-serif/);
});

test("wordmark.font 없으면 --font-wordmark 생략", () => {
  assert.doesNotMatch(generateTokensCss(SAMPLE), /--font-wordmark:/);
});

test("wordmark 레터링 값 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { tracking: "-0.02em", weight: "800", case: "uppercase", color: "primary" } });
  assert.match(css, /letter-spacing:\s*-0\.02em/);
  assert.match(css, /font-weight:\s*800/);
  assert.match(css, /text-transform:\s*uppercase/);
  assert.match(css, /color:\s*var\(--color-primary\)/);
});

test("wordmark.color가 없는 토큰이면 text로 폴백", () => {
  const css = generateTokensCss({ ...SAMPLE, wordmark: { color: "nonexistent" } });
  assert.match(css, /color:\s*var\(--color-text\)/);
});

const SAMPLE_RICH = {
  color: SAMPLE.color,
  typography: {
    display: { family: '"Gowun Batang", serif', size: "48px", weight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" },
    heading: { family: '"Pretendard", sans-serif', size: "32px", weight: 600, lineHeight: 1.25, letterSpacing: "-0.01em" },
    body:    { family: '"Pretendard", sans-serif', size: "16px", weight: 400, lineHeight: 1.6, letterSpacing: "0" },
    caption: { family: '"Pretendard", sans-serif', size: "13px", weight: 400, lineHeight: 1.4, letterSpacing: "0" },
    label:   { family: '"Pretendard", sans-serif', size: "12px", weight: 600, lineHeight: 1.2, letterSpacing: "0.04em" },
    mono:    { family: '"IBM Plex Mono", monospace', size: "13px", weight: 400, lineHeight: 1.5, letterSpacing: "0" },
    accent:  { family: '"Gowun Batang", serif' }
  }
};

test("객체 typography: --font-<role>를 family에서 emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-display:\s*"Gowun Batang", serif/);
  assert.match(css, /--font-heading:\s*"Pretendard", sans-serif/);
});

test("객체 typography: --text-<role>-{size,weight,leading,tracking} emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--text-display-size:\s*48px/);
  assert.match(css, /--text-display-weight:\s*700/);
  assert.match(css, /--text-display-leading:\s*1\.1/);
  assert.match(css, /--text-display-tracking:\s*-0\.02em/);
});

test("caption·label 역할도 emit", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-caption:\s*"Pretendard"/);
  assert.match(css, /--text-label-tracking:\s*0\.04em/);
});

test("객체에 숫자 필드 없으면 해당 --text-* 생략 (accent는 family만)", () => {
  const css = generateTokensCss(SAMPLE_RICH);
  assert.match(css, /--font-accent:\s*"Gowun Batang"/);
  assert.doesNotMatch(css, /--text-accent-size/);
});

test("하위호환: 문자열 typography는 --font-<role>만 emit (--text-* 없음)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--font-display:\s*"Gowun Batang"/);
  assert.doesNotMatch(css, /--text-display-size/);
});

test("lockup 블록 없으면 기본 --logo-* 토큰 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--logo-mark-scale:\s*1\.8/);
  assert.match(css, /--logo-gap:\s*0\.5em/);
  assert.match(css, /--logo-tagline-size:\s*0\.42em/);
  assert.match(css, /--logo-tagline-tracking:\s*0\.22em/);
});

test("lockup 기본 .lockup 클래스 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.lockup\s*\{[^}]*display:\s*inline-flex/);
  assert.match(css, /\.lockup--stacked\s*\{[^}]*flex-direction:\s*column/);
  assert.match(css, /\.lockup__mark\s*\{[^}]*height:\s*calc\(var\(--logo-mark-scale\)\s*\*\s*1em\)/);
  assert.match(css, /\.lockup__mark\s*\{[^}]*object-fit:\s*contain/);
  assert.match(css, /\.lockup__tagline\s*\{/);
});

test("lockup override 값 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, lockup: { markScale: "2.0", gap: "0.7em", taglineTracking: "0.3em" } });
  assert.match(css, /--logo-mark-scale:\s*2\.0/);
  assert.match(css, /--logo-gap:\s*0\.7em/);
  assert.match(css, /--logo-tagline-tracking:\s*0\.3em/);
});

test("lockup tagline 색은 토큰 키, 없으면 text 폴백", () => {
  const css1 = generateTokensCss({ ...SAMPLE, lockup: { taglineColor: "primary" } });
  assert.match(css1, /\.lockup__tagline\s*\{[^}]*color:\s*var\(--color-primary\)/);
  const css2 = generateTokensCss({ ...SAMPLE, lockup: { taglineColor: "nonexistent" } });
  assert.match(css2, /\.lockup__tagline\s*\{[^}]*color:\s*var\(--color-text\)/);
});

test("mark-mono 기본 클래스 emit (mask + 기본 text 색)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.mark-mono\s*\{[^}]*mask-size:\s*contain/);
  assert.match(css, /\.mark-mono\s*\{[^}]*background-color:\s*var\(--color-text\)/);
  assert.match(css, /\.mark-mono\s*\{[^}]*display:\s*inline-block/);
});

test("mark-mono 색 토큰별 modifier emit (text 제외)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.mark-mono--primary\s*\{[^}]*background-color:\s*var\(--color-primary\)/);
  assert.match(css, /\.mark-mono--surface-alt\s*\{[^}]*background-color:\s*var\(--color-surface-alt\)/);
  assert.doesNotMatch(css, /\.mark-mono--text\s*\{/);
});

test("lockup wmImgScale 기본 토큰 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--logo-wm-img-scale:\s*1\.5/);
});

test("lockup .wordmark-img 규칙 emit (markScale와 분리)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.lockup \.wordmark-img\s*\{[^}]*height:\s*calc\(var\(--logo-wm-img-scale\)\s*\*\s*1em\)/);
  assert.match(css, /\.lockup \.wordmark-img\s*\{[^}]*width:\s*auto/);
});

test("lockup wmImgScale override 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, lockup: { wmImgScale: "1.9" } });
  assert.match(css, /--logo-wm-img-scale:\s*1\.9/);
});
