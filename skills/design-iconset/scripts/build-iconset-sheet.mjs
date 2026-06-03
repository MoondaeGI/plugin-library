#!/usr/bin/env node
// design-iconset 시트 생성기 (.design/candidate/icon/*.svg → .design/view/iconset-sheet.html)
//
// 책임: 아이콘 폴더의 *.svg 를 파일명 정렬로 모아 번호+kebab 라벨 그리드 HTML 을 결정적으로 렌더한다.
//   SVG 는 인라인 임베드(currentColor/CSS 작동), 루트 <svg> 의 width/height 는 제거해 CSS 로 크기 제어.
//   색(캔버스/잉크/액센트)은 시트가 공유 ../assets/tokens.css 의 var(--color-*) 를 참조한다
//   (HEX 인라인 주입 폐지 — 전사 드리프트 방지. tokens.css 부재 시 var() 폴백값으로 degrade).
//
// 사용: node build-iconset-sheet.mjs --in <icon디렉터리> --out <html> [--brand <이름>]

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(HERE, "iconset-sheet.template.html");

class IconsetSheetError extends Error {
  constructor(message) { super(message); this.name = "IconsetSheetError"; }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new IconsetSheetError(`알 수 없는 인자: ${key}`);
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--"))
      throw new IconsetSheetError(`${key} 에 값이 없습니다.`);
    out[key.slice(2)] = argv[i + 1];
  }
  if (!out.in || !out.out)
    throw new IconsetSheetError("사용: --in <icon디렉터리> --out <html> [--brand <이름>]");
  return out;
}

// 루트 <svg> 의 width/height 속성만 제거 → CSS 가 크기 제어 (viewBox·자식요소는 유지).
function normalizeSvg(raw) {
  const m = raw.match(/<svg[^>]*>/i);
  if (!m) return raw.trim();
  const cleaned = m[0].replace(/\s(width|height)=["'][^"']*["']/gi, "");
  return raw.replace(m[0], cleaned).trim();
}

function loadIcons(dir) {
  let names;
  try {
    names = readdirSync(dir).filter((n) => n.toLowerCase().endsWith(".svg")).sort();
  } catch (err) {
    throw new IconsetSheetError(`아이콘 디렉터리를 읽을 수 없습니다: ${dir} (${err.message})`);
  }
  if (names.length === 0) throw new IconsetSheetError(`SVG 파일이 없습니다: ${dir}`);
  return names.map((name) => {
    const raw = readFileSync(join(dir, name), "utf8");
    if (!/<svg[\s>]/i.test(raw)) throw new IconsetSheetError(`SVG 가 아닙니다: ${name}`);
    return { label: name.replace(/\.svg$/i, ""), svg: normalizeSvg(raw) };
  });
}

const pad = (n) => String(n).padStart(2, "0");
const escHtml = (s) => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function buildCells(icons) {
  return icons.map((ic, i) =>
`<figure class="cell">
  <span class="idx">${pad(i + 1)}</span>
  <div class="glyph">${ic.svg}</div>
  <figcaption class="label">${escHtml(ic.label)}</figcaption>
</figure>`).join("\n");
}

const buildStrip = (icons) => icons.map((ic) => `<span class="mini">${ic.svg}</span>`).join("\n");

function render({ icons, brand }) {
  const safeBrand = escHtml(brand);
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  return template
    .replace(/\{\{TITLE\}\}/g, `${safeBrand} · ICON SET`)
    .replace(/\{\{BRAND\}\}/g, safeBrand)
    .replace(/\{\{COUNT\}\}/g, String(icons.length))
    .replace(/\{\{CELLS\}\}/g, buildCells(icons))
    .replace(/\{\{STRIP\}\}/g, buildStrip(icons));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const icons = loadIcons(args.in);
  const brand = args.brand || "Brand";
  writeFileSync(args.out, render({ icons, brand }), "utf8");
  console.log(`아이콘 시트 생성: ${args.out} (${icons.length}개)`);
}

// IconsetSheetError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (build-contact-sheet·image-gen 규약과 일치).
try {
  main();
} catch (err) {
  if (err instanceof IconsetSheetError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
