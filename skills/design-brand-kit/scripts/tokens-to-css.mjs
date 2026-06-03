// brand-tokens.json → assets/tokens.css 결정적 생성.
// (a) brand-tokens.json 매핑 + (b) 고정 관례 primitive 레이어(spacing 스케일·tint).
// 변수 네이밍 계약은 design-ui-kit 플랜 File Structure 참조 — 컴포넌트 CSS가 이 이름에 의존.
import { readFile, writeFile } from "node:fs/promises";

const MICRO_SPACE = { 1:"4px", 2:"8px", 3:"12px", 4:"16px", 5:"24px", 6:"32px", 7:"48px", 8:"64px" };
const TINT_ALPHA = { primary:0.08, accent:0.10, success:0.14, warning:0.16, danger:0.12 };

const kebab = (s) => s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

export function hexToRgba(hex, alpha) {
  const m = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const [r, g, b] = [m[1], m[2], m[3]].map((h) => parseInt(h, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function generateTokensCss(tokens) {
  const { color = {}, typography = {}, radius = {}, shadow = {}, spacing = {} } = tokens;
  const L = ["/* tokens.css — brand-tokens.json + 고정 관례 레이어 (tokens-to-css.mjs 생성, 직접 수정 금지) */", ":root {"];

  for (const [k, v] of Object.entries(color)) L.push(`  --color-${kebab(k)}: ${v};`);
  for (const [k, v] of Object.entries(typography)) if (v) L.push(`  --font-${kebab(k)}: ${v};`);
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
  return L.join("\n");
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
