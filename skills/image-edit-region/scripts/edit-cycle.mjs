#!/usr/bin/env node
// 편집 1사이클 오케스트레이션: 마스크 생성 → image-gen 자식 호출 → 로컬 재합성.
// image-gen 실행은 runImageGen 으로 주입(테스트 모킹). 기본 구현은 spawnSync.
import { spawnSync } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { decodePNG } from '../../image-gen/scripts/autocrop.mjs';
import { buildMask, compositeRegion } from './composite.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_GEN = path.resolve(__dirname, '../../image-gen/scripts/image-gen.mjs');

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

  const args = [
    '--image', imagePath,
    '--mask', maskPath,
    '--prompt', prompt,
    '--quality', quality,
    '--out', editedApi,
    '--force',
  ];
  const r = await runImageGen(args);
  if (r.status !== 0) {
    throw new EditCycleError(`image-gen 실패(status ${r.status}): ${r.stderr || r.stdout}`);
  }

  const outPath = path.join(workDir, `preview-${tag}.png`);
  writeFileSync(outPath, compositeRegion(orig, readFileSync(editedApi), bbox));
  return { outPath, maskPath, editedApi };
}
