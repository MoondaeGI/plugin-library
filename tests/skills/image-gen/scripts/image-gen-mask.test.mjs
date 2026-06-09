import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GEN = path.resolve(__dirname, '../../../../skills/image-gen/scripts/image-gen.mjs');
const FIX = path.resolve(__dirname, '../../../../skills/image-gen/scripts'); // 아무 기존 파일이나 존재 경로로 사용

test('--mask 는 edits dry-run 페이로드/출력에 mask 경로를 드러낸다', () => {
  const r = spawnSync('node', [
    GEN, '--dry-run', '--prompt', 'x',
    '--image', path.join(FIX, 'autocrop.mjs'),
    '--mask', path.join(FIX, 'image-gen.mjs'),
    '--out', path.join(FIX, 'out.png'),
  ], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /mask/i);
  assert.match(r.stdout, /\[dry-run\] mask:/);
});

test('--mask 만 주고 --image 가 없으면 거부한다', () => {
  const r = spawnSync('node', [
    GEN, '--dry-run', '--prompt', 'x',
    '--mask', path.join(FIX, 'image-gen.mjs'),
    '--out', path.join(FIX, 'out.png'),
  ], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /mask/i);
});
