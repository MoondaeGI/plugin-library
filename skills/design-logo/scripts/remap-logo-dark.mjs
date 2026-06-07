#!/usr/bin/env node
// remap-logo-dark.mjs — 라이트 풀로고를 다크 변형으로 결정론 리맵한다(생성 아님).
// 영역별 소스색 → 타깃 hex를 OKLab 지각공간에서 매칭하고, 경계는 가장 가까운 두 앵커
// 사이를 OKLab에서 보간해 매끄럽게 잇는다. alpha 보존. 외부 의존성 없음 —
// image-gen/scripts/autocrop.mjs 의 PNG 코덱(node:zlib)을 재사용한다.
// 범용 변환기: brand-tokens.json을 모른다. 색 매핑은 --map "#SRC:#DST" 로 받는다.
//
// 라이브러리: import { remapLogoDark } from './remap-logo-dark.mjs'
// CLI: node remap-logo-dark.mjs --in <png> --out <png> --map "#6E4A2E:#EDE0CC" --map "#C9743B:#F0B45A"

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG, encodePNG } from '../../image-gen/scripts/autocrop.mjs';

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error('hex 색이 잘못됨: ' + hex);
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
}

function srgbToLinear(c){ c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); }
function linearToSrgb(c){ const v = c<=0.0031308 ? 12.92*c : 1.055*Math.pow(c,1/2.4)-0.055; return Math.max(0, Math.min(255, Math.round(v*255))); }

export function srgbToOklab([R,G,B]) {
  const r=srgbToLinear(R), g=srgbToLinear(G), b=srgbToLinear(B);
  const l=0.4122214708*r+0.5363325363*g+0.0514459929*b;
  const m=0.2119034982*r+0.6806995451*g+0.1073969566*b;
  const s=0.0883024619*r+0.2817188376*g+0.6299787005*b;
  const l_=Math.cbrt(l), m_=Math.cbrt(m), s_=Math.cbrt(s);
  return [
    0.2104542553*l_+0.7936177850*m_-0.0040720468*s_,
    1.9779984951*l_-2.4285922050*m_+0.4505937099*s_,
    0.0259040371*l_+0.7827717662*m_-0.8086757660*s_,
  ];
}

export function oklabToSrgb([L,A,B]) {
  const l_=L+0.3963377774*A+0.2158037573*B;
  const m_=L-0.1055613458*A-0.0638541728*B;
  const s_=L-0.0894841775*A-1.2914855480*B;
  const l=l_*l_*l_, m=m_*m_*m_, s=s_*s_*s_;
  return [
    linearToSrgb(+4.0767416621*l-3.3077115913*m+0.2309699292*s),
    linearToSrgb(-1.2684380046*l+2.6097574011*m-0.3413193965*s),
    linearToSrgb(-0.0041960863*l-0.7034186147*m+1.7076147010*s),
  ];
}
