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
