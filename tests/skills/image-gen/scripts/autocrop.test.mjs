import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autocropBuffer, encodePNG, decodePNG } from '../skills/image-gen/scripts/autocrop.mjs';

function rgba(w, h) { return Buffer.alloc(w * h * 4); } // 전부 투명

test('RGBA: 투명 여백을 잘라 내용 바운딩박스 크기로 만든다', () => {
  const w = 20, h = 20, px = rgba(w, h);
  for (let y = 7; y <= 12; y++) for (let x = 7; x <= 12; x++) { const i = (y * w + x) * 4; px[i] = 100; px[i + 1] = 100; px[i + 2] = 100; px[i + 3] = 255; }
  const res = autocropBuffer(encodePNG(px, w, h, 6), { padPct: 0 });
  assert.equal(res.width, 6); assert.equal(res.height, 6);
  const dec = decodePNG(res.buffer); // 라운드트립 디코드 확인
  assert.equal(dec.width, 6); assert.equal(dec.height, 6); assert.equal(dec.colorType, 6);
});

test('RGBA: 전부 투명이면 null 을 반환한다', () => {
  assert.equal(autocropBuffer(encodePNG(rgba(10, 10), 10, 10, 6)), null);
});

test('--pad-pct 가 잘린 둘레에 여백을 더한다', () => {
  const w = 20, h = 20, px = rgba(w, h);
  for (let y = 7; y <= 12; y++) for (let x = 7; x <= 12; x++) px[(y * w + x) * 4 + 3] = 255;
  const res = autocropBuffer(encodePNG(px, w, h, 6), { padPct: 50 }); // 6 -> +3 each side = 12
  assert.equal(res.width, 12); assert.equal(res.height, 12);
});

test('RGB: 단색(코너 기준) 배경을 트림한다', () => {
  const w = 12, h = 12, bpp = 3, px = Buffer.alloc(w * h * bpp, 255); // 흰 배경
  for (let y = 4; y <= 6; y++) for (let x = 4; x <= 6; x++) { const i = (y * w + x) * bpp; px[i] = 0; px[i + 1] = 0; px[i + 2] = 0; }
  const res = autocropBuffer(encodePNG(px, w, h, 2), { padPct: 0 });
  assert.equal(res.width, 3); assert.equal(res.height, 3);
});
