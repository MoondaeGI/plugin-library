import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', '..', '..', '..', 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function outPath(name = 'out.png') {
  return path.join(mkdtempSync(path.join(tmpdir(), 'img-bg-')), name);
}

test('--background transparent 가 페이로드에 background:"transparent" 를 넣는다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'transparent', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"background":\s*"transparent"/);
});

test('--background 미지정이면 페이로드에 background 키가 없다 (회귀 가드)', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /"background"/);
});

test('--background opaque 도 페이로드에 그대로 전달된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'opaque', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"background":\s*"opaque"/);
});

test('잘못된 --background 값은 비0 종료로 거부된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'rainbow', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /background/);
});
