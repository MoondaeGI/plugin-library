#!/usr/bin/env node
// autocrop.mjs — PNG의 투명(alpha) 여백을 잘라 마크/아이콘이 캔버스를 꽉 채우게 한다.
// gpt-image는 마크를 작게 그려 넓은 투명 여백을 남기므로, HTML에서 크기를 줘도 마크가 콩알만 해진다.
// 내용 바운딩박스로 크롭하면 자산이 "꽉 찬" 실제 로고/아이콘이 되어 크기 지정이 그대로 먹는다.
// 외부 의존성 없음 — Node 내장 zlib만 사용. 8-bit RGBA(투명 컷아웃) / RGB, 비인터레이스 PNG 지원.
//
// 라이브러리: import { autocropBuffer } from './autocrop.mjs'
// CLI: node autocrop.mjs --in <png> --out <png> [--pad-pct 4] [--threshold 8]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc32(buf) { let c = 0xFFFFFFFF; for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
function paeth(a, b, c) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }

// PNG → { width, height, colorType, bpp, px(raw RGBA/RGB) }
export function decodePNG(buf) {
  if (!buf.subarray(0, 8).equals(SIG)) throw new Error('PNG 시그니처 아님');
  let off = 8, ihdr = null; const idatParts = [];
  while (off + 8 <= buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') ihdr = { width: data.readUInt32BE(0), height: data.readUInt32BE(4), bitDepth: data[8], colorType: data[9], interlace: data[12] };
    else if (type === 'IDAT') idatParts.push(data);
    off += 12 + len;
    if (type === 'IEND') break;
  }
  if (!ihdr) throw new Error('IHDR 없음');
  if (ihdr.interlace) throw new Error('인터레이스 PNG 미지원');
  if (ihdr.bitDepth !== 8 || (ihdr.colorType !== 6 && ihdr.colorType !== 2)) throw new Error(`8-bit RGBA/RGB 만 지원 (colorType=${ihdr.colorType}, bitDepth=${ihdr.bitDepth})`);
  const bpp = ihdr.colorType === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idatParts));
  const { width: w, height: h } = ihdr; const stride = w * bpp; const px = Buffer.alloc(h * stride); let p = 0;
  for (let y = 0; y < h; y++) {
    const ft = raw[p++]; const row = px.subarray(y * stride, (y + 1) * stride); const prev = y > 0 ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const rb = raw[p++]; const a = x >= bpp ? row[x - bpp] : 0; const b = prev ? prev[x] : 0; const c = (prev && x >= bpp) ? prev[x - bpp] : 0;
      let v; switch (ft) { case 0: v = rb; break; case 1: v = rb + a; break; case 2: v = rb + b; break; case 3: v = rb + ((a + b) >> 1); break; case 4: v = rb + paeth(a, b, c); break; default: throw new Error('알 수 없는 필터 ' + ft); }
      row[x] = v & 0xFF;
    }
  }
  return { width: w, height: h, colorType: ihdr.colorType, bpp, px };
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'ascii'); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

// raw px(RGBA/RGB) → PNG Buffer (필터 0)
export function encodePNG(px, w, h, colorType) {
  const bpp = colorType === 6 ? 4 : 3; const stride = w * bpp;
  const filtered = Buffer.alloc(h * (stride + 1));
  for (let y = 0; y < h; y++) { filtered[y * (stride + 1)] = 0; px.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = colorType; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([SIG, chunk('IHDR', ih), chunk('IDAT', deflateSync(filtered)), chunk('IEND', Buffer.alloc(0))]);
}

// 투명/단색 여백을 잘라낸 PNG Buffer 반환. 내용이 없으면 null.
export function autocropBuffer(buf, { padPct = 0, threshold = 8 } = {}) {
  const { width, height, colorType, bpp, px } = decodePNG(buf);
  const stride = width * bpp; const hasAlpha = bpp === 4; const bg = hasAlpha ? null : [px[0], px[1], px[2]];
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = y * stride + x * bpp;
    const content = hasAlpha ? px[i + 3] > threshold
      : (Math.abs(px[i] - bg[0]) + Math.abs(px[i + 1] - bg[1]) + Math.abs(px[i + 2] - bg[2])) > threshold * 3;
    if (content) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  if (maxX < 0) return null;
  const pad = Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * padPct / 100);
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad); maxY = Math.min(height - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const cropped = Buffer.alloc(ch * cw * bpp);
  for (let y = 0; y < ch; y++) { const so = (minY + y) * stride + minX * bpp; px.copy(cropped, y * cw * bpp, so, so + cw * bpp); }
  return { buffer: encodePNG(cropped, cw, ch, colorType), width: cw, height: ch, fromWidth: width, fromHeight: height };
}

// ---- CLI ----
function isMain() { return process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
if (isMain()) {
  const args = process.argv.slice(2); const o = { padPct: 0, threshold: 8 };
  for (let i = 0; i < args.length; i++) { const a = args[i]; const n = () => args[++i];
    if (a === '--in') o.in = n(); else if (a === '--out') o.out = n(); else if (a === '--pad-pct') o.padPct = parseFloat(n()); else if (a === '--threshold') o.threshold = parseInt(n(), 10);
    else if (a === '--help' || a === '-h') { console.log('node autocrop.mjs --in <png> --out <png> [--pad-pct 4] [--threshold 8]'); process.exit(0); }
    else { console.error('오류: 알 수 없는 인자 ' + a); process.exit(2); } }
  if (!o.in || !o.out) { console.error('오류: --in 과 --out 이 필요합니다'); process.exit(2); }
  if (!existsSync(o.in)) { console.error('오류: 파일 없음: ' + o.in); process.exit(2); }
  try {
    const res = autocropBuffer(readFileSync(o.in), { padPct: o.padPct, threshold: o.threshold });
    if (!res) { console.error('오류: 내용이 없습니다(전부 투명/단색)'); process.exit(2); }
    mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
    writeFileSync(o.out, res.buffer);
    console.log(`${path.basename(o.in)} ${res.fromWidth}x${res.fromHeight} -> ${res.width}x${res.height}`);
  } catch (e) { console.error('오류: ' + e.message); process.exit(2); }
}
