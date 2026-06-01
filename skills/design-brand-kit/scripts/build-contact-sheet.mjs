#!/usr/bin/env node
// brand-kit 컨택트 시트 생성기 (directions.json → directions.html)
//
// 책임: directions.json 을 읽어 contact-sheet.template.html 의 토큰을 결정적으로 치환한다.
//   overview.html 과 달리 자유 저작이 아니라 고정 템플릿 + 데이터 주입 — 3열이 바이트 단위로
//   동일한 레이아웃이라야 색·폰트 차이가 또렷이 비교된다.
//
// 사용: node build-contact-sheet.mjs --in <directions.json> --out <directions.html>
//
// 입력 스키마 (directions.json):
//   { "product": "이름",
//     "directions": [ { "id","label","mood","wordmark","headline","body","tagline",
//                       "palette": { primary,accent,background,surface,text,textMuted,border },
//                       "typography": { display, body } }, ... (정확히 3) ] }

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(HERE, "contact-sheet.template.html");

class ContactSheetError extends Error {
  constructor(message) {
    super(message);
    this.name = "ContactSheetError";
  }
}

// 폰트 family → Google Fonts CDN <link>. 카탈로그 family 의 실제 가용 웨이트에 맞춘 명시 매핑.
// 카탈로그에 없는 family 는 weight 축 없이 best-effort 로 로드(경고).
const FONT_CDN = {
  "Pretendard": "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css",
  "IBM Plex Sans KR": "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap",
  "Noto Sans KR": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap",
  "Gothic A1": "https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700;900&display=swap",
  "Gowun Dodum": "https://fonts.googleapis.com/css2?family=Gowun+Dodum&display=swap",
  "Gowun Batang": "https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap",
  "Nanum Myeongjo": "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap",
  "Noto Serif KR": "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;600;700&display=swap",
  "Song Myung": "https://fonts.googleapis.com/css2?family=Song+Myung&display=swap",
  "Diphylleia": "https://fonts.googleapis.com/css2?family=Diphylleia&display=swap",
  "Black Han Sans": "https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap",
  "Gasoek One": "https://fonts.googleapis.com/css2?family=Gasoek+One&display=swap",
  "Do Hyeon": "https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap",
  "Jua": "https://fonts.googleapis.com/css2?family=Jua&display=swap",
  "LINE Seed KR": "https://cdn.jsdelivr.net/gh/webfontworld/lineSeed/LINESeedKR.css",
};

// 색 키 → 한국어 역할 라벨 (스와치 표시 순서)
const PALETTE_ROLES = [
  ["primary", "주색"],
  ["accent", "강조"],
  ["background", "배경"],
  ["surface", "표면"],
  ["text", "본문"],
  ["textMuted", "흐린본문"],
  ["border", "경계"],
];

const REQUIRED_DIR_FIELDS = ["id", "label", "mood", "wordmark", "headline", "body", "tagline", "palette", "typography"];

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key.startsWith("--")) throw new ContactSheetError(`알 수 없는 인자: ${key}`);
    // F2: 값 없는 플래그(dangling flag) → 깔끔한 에러
    if (i + 1 >= argv.length || argv[i + 1].startsWith("--"))
      throw new ContactSheetError(`${key} 에 값이 없습니다.`);
    out[key.slice(2)] = argv[i + 1];
  }
  if (!out.in || !out.out) throw new ContactSheetError("사용: --in <directions.json> --out <directions.html>");
  return out;
}

function loadDirections(inPath) {
  let raw;
  try {
    raw = readFileSync(inPath, "utf8");
  } catch (err) {
    throw new ContactSheetError(`directions.json 을 읽을 수 없습니다: ${inPath} (${err.message})`);
  }
  // F1: JSON 파싱 실패 → ContactSheetError (종료코드 2)
  let data;
  try { data = JSON.parse(raw); }
  catch (err) { throw new ContactSheetError(`directions.json JSON 파싱 실패: ${err.message}`); }
  if (!data || typeof data !== "object") throw new ContactSheetError("directions.json 최상위가 객체가 아닙니다.");
  if (!Array.isArray(data.directions) || data.directions.length !== 3) {
    throw new ContactSheetError("directions 는 정확히 3개여야 합니다.");
  }
  data.directions.forEach((d, i) => {
    for (const f of REQUIRED_DIR_FIELDS) {
      if (d[f] == null) throw new ContactSheetError(`directions[${i}] 에 '${f}' 가 없습니다.`);
    }
  });
  return data;
}

// 폰트 스택 첫 따옴표 family 추출 (CDN 매핑·디스플레이 라벨용)
function primaryFamily(stack) {
  const m = String(stack).match(/"([^"]+)"/);
  return m ? m[1] : String(stack).split(",")[0].trim();
}

function googleFallback(family) {
  return `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}&display=swap`;
}

function buildFontLinks(directions) {
  const families = new Set();
  for (const d of directions) {
    families.add(primaryFamily(d.typography.display));
    families.add(primaryFamily(d.typography.body));
  }
  const links = [
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  ];
  for (const fam of families) {
    const href = FONT_CDN[fam];
    if (!href) {
      console.warn(`[warn] 카탈로그 매핑에 없는 폰트 '${fam}' — best-effort Google Fonts 로드`);
    }
    links.push(`<link rel="stylesheet" href="${href ?? googleFallback(fam)}">`);
  }
  return links.join("\n");
}

// F3: HTML 텍스트 콘텐츠 이스케이프 (CSS style="" 속성값에는 사용 안 함)
function escHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildSwatches(palette) {
  return PALETTE_ROLES
    .filter(([key]) => palette[key])
    .map(([key, label]) => {
      const hex = palette[key];
      return `<div class="sw"><span class="chip" style="background:${hex}"></span><span class="hex">${escHtml(hex)}</span><span class="role">${label}</span></div>`;
    })
    .join("\n");
}

function buildColumn(d) {
  const p = d.palette;
  const style = [
    `--bg:${p.background}`,
    `--text:${p.text}`,
    `--accent:${p.accent}`,
    `--display:${d.typography.display.replace(/"/g, "'")}`,
    `--body:${d.typography.body.replace(/"/g, "'")}`,
  ].join(";");
  return `<div class="col" style="${style}">
  <div class="id">방향 ${escHtml(d.id.toUpperCase())} · ${escHtml(d.label)}</div>
  <div class="wordmark">${escHtml(d.wordmark)}</div>
  <div class="mood">${escHtml(d.mood)}</div>
  <h2 class="headline">${escHtml(d.headline)}</h2>
  <p class="body">${escHtml(d.body)}</p>
  <div class="divider"></div>
  <div class="palette">${buildSwatches(p)}</div>
  <div class="divider"></div>
  <div class="tagline">"${escHtml(d.tagline)}"</div>
  <div class="fontnote">${primaryFamily(d.typography.display)} · ${primaryFamily(d.typography.body)}</div>
</div>`;
}

function render(data) {
  const template = readFileSync(TEMPLATE_PATH, "utf8");
  const columns = data.directions.map(buildColumn).join("\n");
  return template
    .replace(/\{\{TITLE\}\}/g, `${data.product ?? "Brand"} · 방향 비교`)
    .replace(/\{\{PRODUCT\}\}/g, data.product ?? "Brand")
    .replace(/\{\{FONT_LINKS\}\}/g, buildFontLinks(data.directions))
    .replace(/\{\{COLUMNS\}\}/g, columns);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const data = loadDirections(args.in);
  writeFileSync(args.out, render(data), "utf8");
  console.log(`컨택트 시트 생성: ${args.out}`);
}

// ContactSheetError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (image-gen 규약과 일치).
try {
  main();
} catch (err) {
  if (err instanceof ContactSheetError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
