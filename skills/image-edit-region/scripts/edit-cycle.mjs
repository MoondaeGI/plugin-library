#!/usr/bin/env node
// 편집 1사이클 오케스트레이션: 마스크 생성 → image-gen 자식 호출 → 로컬 재합성.
// image-gen 실행은 runImageGen 으로 주입(테스트 모킹). 기본 구현은 spawnSync.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG } from '../../image-gen/scripts/autocrop.mjs';
import { buildMask, compositeRegion, resizePNG } from './composite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_GEN = path.resolve(__dirname, '../../image-gen/scripts/image-gen.mjs');

// gpt-image-2 크기 제약: 변이 16의 배수, 각 변 ≤3840, 긴변/짧은변 비율 ≤3.
export function gptImageSizeOk(w, h) {
  return w % 16 === 0 && h % 16 === 0 && w <= 3840 && h <= 3840 && Math.max(w, h) / Math.min(w, h) <= 3;
}

export class EditCycleError extends Error {
  constructor(message) { super(message); this.name = 'EditCycleError'; }
}

// 기본 image-gen 실행기: node image-gen.mjs <args> 를 동기 spawn.
export function defaultRunImageGen(args) {
  const r = spawnSync('node', [IMAGE_GEN, ...args], { encoding: 'utf8' });
  return { status: r.status ?? 1, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
}

// imagePath 의 bbox 영역만 prompt 로 편집한 결과 PNG 를 workDir 에 만들고 경로를 돌려준다.
export async function runEditCycle({ imagePath, bbox, prompt, quality, workDir, runImageGen = defaultRunImageGen }) {
  const orig = readFileSync(imagePath);
  const { width, height } = decodePNG(orig);

  const tag = `${bbox.x}-${bbox.y}-${bbox.w}-${bbox.h}-${quality}`;
  const maskPath = path.join(workDir, `mask-${tag}.png`);
  writeFileSync(maskPath, buildMask(width, height, bbox));

  const editedApi = path.join(workDir, `api-${tag}.png`);

  const size = gptImageSizeOk(width, height) ? `${width}x${height}` : 'auto';
  const args = [
    '--image', imagePath,
    '--mask', maskPath,
    '--prompt', prompt,
    '--quality', quality,
    '--size', size,
    '--out', editedApi,
    '--force',
  ];
  const r = await runImageGen(args);
  if (r.status !== 0) {
    throw new EditCycleError(`image-gen 실패(status ${r.status}): ${r.stderr || r.stdout}`);
  }

  const outPath = path.join(workDir, `preview-${tag}.png`);
  // API 결과가 원본과 다른 크기로 올 수 있으므로(특히 size=auto) 원본 크기로 되돌린 뒤 합성한다.
  const editedResized = resizePNG(readFileSync(editedApi), width, height);
  writeFileSync(outPath, compositeRegion(orig, editedResized, bbox));
  return { outPath, maskPath, editedApi };
}
