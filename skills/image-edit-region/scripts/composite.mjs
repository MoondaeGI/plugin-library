#!/usr/bin/env node
// 순수 PNG 합성 도구 — autocrop.mjs의 decode/encode를 재사용한다.
// 외부 의존성 없음. bbox 는 원본 픽셀 좌표 {x, y, w, h}(정수).
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

export class CompositeError extends Error {
  constructor(message) { super(message); this.name = 'CompositeError'; }
}

// RGB/RGBA px 버퍼를 RGBA(bpp4)로 정규화. RGB는 alpha=255로 채운다.
export function toRGBA(px, bpp, width, height) {
  if (bpp === 4) return Buffer.from(px);
  if (bpp !== 3) throw new CompositeError(`지원하지 않는 bpp: ${bpp}`);
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    out[i*4] = px[i*3]; out[i*4+1] = px[i*3+1]; out[i*4+2] = px[i*3+2]; out[i*4+3] = 255;
  }
  return out;
}

// 원본과 같은 크기의 마스크 PNG. bbox 안 alpha=0(편집), 밖 alpha=255(보존).
export function buildMask(width, height, bbox) {
  assertBbox(bbox, width, height);
  const px = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = x >= bbox.x && x < bbox.x + bbox.w && y >= bbox.y && y < bbox.y + bbox.h;
      px[(y * width + x) * 4 + 3] = inside ? 0 : 255; // RGB는 0
    }
  }
  return encodePNG(px, width, height, 6);
}

export function assertBbox(bbox, width, height) {
  const { x, y, w, h } = bbox || {};
  if (![x, y, w, h].every(Number.isInteger)) throw new CompositeError('bbox 는 정수 {x,y,w,h} 여야 합니다.');
  if (w <= 0 || h <= 0) throw new CompositeError('bbox 의 w·h 는 양수여야 합니다.');
  if (x < 0 || y < 0 || x + w > width || y + h > height) throw new CompositeError('bbox 가 이미지 범위를 벗어났습니다.');
}

// PNG 를 targetW×targetH 로 bilinear 리샘플(RGBA 반환). 크기가 같으면 RGBA로만 재인코드.
export function resizePNG(buf, targetW, targetH) {
  const { width: sw, height: sh, bpp, px } = decodePNG(buf);
  const src = toRGBA(px, bpp, sw, sh);
  if (sw === targetW && sh === targetH) return encodePNG(src, targetW, targetH, 6);
  const out = Buffer.alloc(targetW * targetH * 4);
  for (let y = 0; y < targetH; y++) {
    const fy = Math.min(sh - 1, Math.max(0, (y + 0.5) * sh / targetH - 0.5));
    const y0 = Math.floor(fy), y1 = Math.min(sh - 1, y0 + 1), wy = fy - y0;
    for (let x = 0; x < targetW; x++) {
      const fx = Math.min(sw - 1, Math.max(0, (x + 0.5) * sw / targetW - 0.5));
      const x0 = Math.floor(fx), x1 = Math.min(sw - 1, x0 + 1), wx = fx - x0;
      const oi = (y * targetW + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = src[(y0*sw+x0)*4+c], p01 = src[(y0*sw+x1)*4+c];
        const p10 = src[(y1*sw+x0)*4+c], p11 = src[(y1*sw+x1)*4+c];
        const top = p00 + (p01 - p00) * wx, bot = p10 + (p11 - p10) * wx;
        out[oi + c] = Math.round(top + (bot - top) * wy);
      }
    }
  }
  return encodePNG(out, targetW, targetH, 6);
}

// 원본 복사본의 bbox 영역에 edited 의 같은 영역 픽셀을 덮어쓴다(접근 2 재합성).
// original·edited 는 같은 크기여야 한다(접근 2는 전체를 보내고 전체를 받으므로 보장).
export function compositeRegion(originalBuf, editedBuf, bbox) {
  const o = decodePNG(originalBuf);
  const e = decodePNG(editedBuf);
  if (o.width !== e.width || o.height !== e.height) {
    throw new CompositeError(`크기 불일치: 원본 ${o.width}x${o.height} vs 편집 ${e.width}x${e.height}`);
  }
  assertBbox(bbox, o.width, o.height);
  const W = o.width, H = o.height;
  const out = toRGBA(o.px, o.bpp, W, H);
  const eRGBA = toRGBA(e.px, e.bpp, W, H);
  for (let y = bbox.y; y < bbox.y + bbox.h; y++) {
    const rowStart = (y * W + bbox.x) * 4;
    const rowLen = bbox.w * 4;
    eRGBA.copy(out, rowStart, rowStart, rowStart + rowLen);
  }
  return encodePNG(out, W, H, 6);
}
