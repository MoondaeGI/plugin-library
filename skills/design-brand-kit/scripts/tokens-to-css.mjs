// brand-tokens.json → assets/css/tokens.css 결정적 생성.
// (a) brand-tokens.json 매핑 + (b) 고정 관례 primitive 레이어(spacing 스케일·tint).
// 변수 네이밍 계약은 design-ui-kit 플랜 File Structure 참조 — 컴포넌트 CSS가 이 이름에 의존.
import { readFile, writeFile } from "node:fs/promises";

const MICRO_SPACE = { 1:"4px", 2:"8px", 3:"12px", 4:"16px", 5:"24px", 6:"32px", 7:"48px", 8:"64px" };
const TINT_ALPHA = { primary:0.08, accent:0.10, success:0.14, warning:0.16, danger:0.12 };

const WORDMARK_DEFAULTS = { tracking: "normal", weight: "700", case: "none", color: "text" };

const LOCKUP_DEFAULTS = { markScale: "1.8", gap: "0.5em", taglineSize: "0.42em", taglineTracking: "0.22em", taglineColor: "textMuted", wmImgScale: "1.5" };

function generateLockupVars(lockup = {}) {
  return [
    `  --logo-mark-scale: ${pick(lockup.markScale, LOCKUP_DEFAULTS.markScale)};`,
    `  --logo-gap: ${pick(lockup.gap, LOCKUP_DEFAULTS.gap)};`,
    `  --logo-tagline-size: ${pick(lockup.taglineSize, LOCKUP_DEFAULTS.taglineSize)};`,
    `  --logo-tagline-tracking: ${pick(lockup.taglineTracking, LOCKUP_DEFAULTS.taglineTracking)};`,
    `  --logo-wm-img-scale: ${pick(lockup.wmImgScale, LOCKUP_DEFAULTS.wmImgScale)};`,
  ];
}

function generateLockupClass(lockup = {}, color = {}) {
  const wanted = pick(lockup.taglineColor, LOCKUP_DEFAULTS.taglineColor);
  const tagColor = color[wanted] ? wanted : "text";
  return [
    ".lockup { display: inline-flex; align-items: center; gap: var(--logo-gap); }",
    ".lockup--stacked { flex-direction: column; text-align: center; }",
    ".lockup__mark { height: calc(var(--logo-mark-scale) * 1em); width: auto; object-fit: contain; flex: none; }",
    ".lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }",
    ".lockup__body { display: flex; flex-direction: column; }",
    ".lockup--stacked .lockup__body { align-items: center; }",
    `.lockup__tagline { font-family: var(--font-body, var(--font-display)); font-size: var(--logo-tagline-size); letter-spacing: var(--logo-tagline-tracking); text-transform: uppercase; color: var(--color-${kebab(tagColor)}); }`,
    "",
  ].join("\n");
}

function generateMarkMonoClass(color = {}) {
  const mods = Object.keys(color)
    .filter((k) => k !== "text")
    .map((k) => `.mark-mono--${kebab(k)} { background-color: var(--color-${kebab(k)}); }`);
  return [
    ".mark-mono {",
    "  display: inline-block; width: 1em; height: 1em;",
    "  background-color: var(--color-text);",
    "  -webkit-mask-size: contain; mask-size: contain;",
    "  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;",
    "  -webkit-mask-position: center; mask-position: center;",
    "}",
    ...mods,
    "",
  ].join("\n");
}

const pick = (v, d) => (v !== undefined && v !== null && String(v).trim() !== "" ? v : d);

function generateWordmarkClass(wordmark = {}, color = {}) {
  const colorKey = color[wordmark.color] ? wordmark.color : "text";
  return [
    ".wordmark {",
    "  font-family: var(--font-wordmark, var(--font-display));",
    `  letter-spacing: ${pick(wordmark.tracking, WORDMARK_DEFAULTS.tracking)};`,
    `  font-weight: ${pick(wordmark.weight, WORDMARK_DEFAULTS.weight)};`,
    `  text-transform: ${pick(wordmark.case, WORDMARK_DEFAULTS.case)};`,
    `  color: var(--color-${kebab(colorKey)});`,
    "}",
    "",
  ].join("\n");
}

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

// typography 역할당 토큰 emit. 값이 문자열이면 family 단독(하위호환), 객체면 family + 정량 스펙.
// 정량 변수: --text-<role>-size|weight|leading|tracking (leading=lineHeight, tracking=letterSpacing).
function pushTypography(L, typography) {
  const has = (x) => x !== undefined && x !== null && String(x).trim() !== "";
  for (const [k, v] of Object.entries(typography)) {
    if (!v) continue;
    const role = kebab(k);
    if (typeof v === "string") { L.push(`  --font-${role}: ${v};`); continue; }
    if (has(v.family)) L.push(`  --font-${role}: ${v.family};`);
    if (has(v.size)) L.push(`  --text-${role}-size: ${v.size};`);
    if (has(v.weight)) L.push(`  --text-${role}-weight: ${v.weight};`);
    if (has(v.lineHeight)) L.push(`  --text-${role}-leading: ${v.lineHeight};`);
    if (has(v.letterSpacing)) L.push(`  --text-${role}-tracking: ${v.letterSpacing};`);
  }
}

export function hexToRgba(hex, alpha) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateTokensCss(tokens) {
  const { color = {}, typography = {}, radius = {}, shadow = {}, spacing = {}, wordmark = {}, lockup = {} } = tokens;
  const L = ["/* tokens.css — brand-tokens.json + 고정 관례 레이어 (tokens-to-css.mjs 생성, 직접 수정 금지) */", ":root {"];

  for (const [k, v] of Object.entries(color)) L.push(`  --color-${kebab(k)}: ${v};`);
  pushTypography(L, typography);
  if (wordmark.font) L.push(`  --font-wordmark: ${wordmark.font};`);
  L.push(...generateLockupVars(lockup));
  for (const [k, v] of Object.entries(radius)) L.push(`  --radius-${k}: ${v};`);
  L.push(`  --radius-pill: 999px;`);
  for (const [k, v] of Object.entries(shadow)) L.push(`  --shadow-${k}: ${v};`);
  for (const k of ["sectionY", "containerX", "cardPadding"]) {
    if (spacing[k]) L.push(`  --space-${kebab(k)}: ${spacing[k]};`);
  }
  for (const [k, v] of Object.entries(MICRO_SPACE)) L.push(`  --space-${k}: ${v};`);
  for (const [k, a] of Object.entries(TINT_ALPHA)) {
    if (color[k]) L.push(`  --tint-${k}: ${hexToRgba(color[k], a)};`);
  }

  L.push("}", "");
  return L.join("\n") + generateWordmarkClass(wordmark, color) + generateLockupClass(lockup, color) + generateMarkMonoClass(color);
}

// CLI: node tokens-to-css.mjs <brand-tokens.json> <out tokens.css>
const isMain = import.meta.url === `file://${process.argv[1]}` ||
               process.argv[1]?.endsWith("tokens-to-css.mjs");
if (isMain && process.argv[2]) {
  const [, , inPath, outPath] = process.argv;
  const tokens = JSON.parse(await readFile(inPath, "utf8"));
  await writeFile(outPath, generateTokensCss(tokens), "utf8");
  console.log(`tokens.css written → ${outPath}`);
}
