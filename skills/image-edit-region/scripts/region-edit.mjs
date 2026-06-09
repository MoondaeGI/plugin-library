#!/usr/bin/env node
// CLI 진입점: 인자 검증 → 서버 기동 → 브라우저 오픈 → 확정/취소까지 대기 → 결과 경로 출력.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export class RegionEditInputError extends Error {
  constructor(message) { super(message); this.name = 'RegionEditInputError'; }
}

export function parseArgs(argv) {
  const o = { image: undefined, prompt: '', out: undefined, model: 'gpt-image-2' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]; const next = () => argv[++i];
    switch (a) {
      case '--image': o.image = next(); break;
      case '--prompt': o.prompt = next() ?? ''; break;
      case '--out': o.out = next(); break;
      case '--model': o.model = next(); break;
      case '--help': case '-h': o.help = true; break;
      default: throw new RegionEditInputError(`알 수 없는 인자: ${a}`);
    }
  }
  if (!o.help && !o.image) throw new RegionEditInputError('--image <png 경로> 가 필요합니다.');
  return o;
}

export function resolveOutPath(image, out) {
  if (out) return out;
  const dir = path.dirname(image); const ext = path.extname(image);
  return `${dir}/${path.basename(image, ext)}-edited.png`;
}
