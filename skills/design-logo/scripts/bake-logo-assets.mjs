#!/usr/bin/env node
// bake-logo-assets.mjs — 단색 마크 마스터(mark-mono.png)에서 favicon(light/dark)·app-icon을 베이크한다.
// 외부 의존성 없음 — image-gen/scripts/autocrop.mjs 의 PNG 코덱(node:zlib)을 재사용한다.
// 범용 변환기: brand-tokens.json을 모른다. 색은 hex 플래그로 받는다(호출하는 쪽이 토큰값을 넘긴다).
//
// 라이브러리: import { recolorMark, compositeAppIcon, bakeAll } from './bake-logo-assets.mjs'
// CLI: node bake-logo-assets.mjs --mark <png> --out-dir <dir> --ink "#4A3B42" [--tile "#DD6E92"]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('hex 색이 잘못됨: ' + hex);
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// RGBA 마크의 alpha를 보존하고 모든 픽셀 RGB를 hex로 교체한다.
export function recolorMark(buf, hex) {
  const { width, height, colorType, px } = decodePNG(buf);
  if (colorType !== 6) throw new Error('RGBA(투명) PNG가 필요합니다 (colorType=' + colorType + ')');
  const [r, g, b] = hexToRgb(hex);
  const out = Buffer.from(px);
  for (let i = 0; i < out.length; i += 4) { out[i] = r; out[i + 1] = g; out[i + 2] = b; } // alpha(out[i+3]) 유지
  return encodePNG(out, width, height, 6);
}

// 정사각 타일(tileHex, 불투명)에 마크(markHex)를 마크 alpha로 합성한다(out alpha=255).
export function compositeAppIcon(buf, tileHex, markHex = '#FFFFFF') {
  const { width, height, colorType, px } = decodePNG(buf);
  if (colorType !== 6) throw new Error('RGBA(투명) PNG가 필요합니다 (colorType=' + colorType + ')');
  const [tr, tg, tb] = hexToRgb(tileHex); const [mr, mg, mb] = hexToRgb(markHex);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    const a = px[i * 4 + 3] / 255; const o = i * 4;
    out[o] = Math.round(tr * (1 - a) + mr * a);
    out[o + 1] = Math.round(tg * (1 - a) + mg * a);
    out[o + 2] = Math.round(tb * (1 - a) + mb * a);
    out[o + 3] = 255;
  }
  return encodePNG(out, width, height, 6);
}

export function bakeAll(buf, { ink = '#000000', tile, white = '#FFFFFF' } = {}) {
  return {
    faviconLight: recolorMark(buf, ink),
    faviconDark: recolorMark(buf, white),
    appIcon: compositeAppIcon(buf, tile || ink, white),
  };
}

// ---- CLI ----
function isMain() { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
if (isMain()) {
  const args = process.argv.slice(2); const o = {};
  for (let i = 0; i < args.length; i++) { const a = args[i]; const n = () => args[++i];
    if (a === '--mark') o.mark = n();
    else if (a === '--out-dir') o.outDir = n();
    else if (a === '--ink') o.ink = n();
    else if (a === '--tile') o.tile = n();
    else if (a === '--help' || a === '-h') { console.log('node bake-logo-assets.mjs --mark <png> --out-dir <dir> --ink "#RRGGBB" [--tile "#RRGGBB"]'); process.exit(0); }
    else { console.error('오류: 알 수 없는 인자 ' + a); process.exit(2); } }
  if (!o.mark || !o.outDir || !o.ink) { console.error('오류: --mark, --out-dir, --ink 가 필요합니다'); process.exit(2); }
  if (!existsSync(o.mark)) { console.error('오류: 파일 없음: ' + o.mark); process.exit(2); }
  try {
    const { faviconLight, faviconDark, appIcon } = bakeAll(readFileSync(o.mark), { ink: o.ink, tile: o.tile });
    mkdirSync(path.resolve(o.outDir), { recursive: true });
    writeFileSync(path.join(o.outDir, 'favicon-light.png'), faviconLight);
    writeFileSync(path.join(o.outDir, 'favicon-dark.png'), faviconDark);
    writeFileSync(path.join(o.outDir, 'app-icon.png'), appIcon);
    console.log('베이크 완료 → favicon-light.png, favicon-dark.png, app-icon.png');
  } catch (e) { console.error('오류: ' + e.message); process.exit(2); }
}
