import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', '..', '..', '..', 'skills', 'image-gen', 'scripts', 'image-gen.mjs');
function run(args) { return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' }); }
function outPath() { return path.join(mkdtempSync(path.join(tmpdir(), 'img-ac-')), 'o.png'); }

test('--autocrop 는 알려진 인자로 dry-run 을 통과한다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--autocrop', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
});

test('--autocrop-pad-pct 도 인자로 수용된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--autocrop', '--autocrop-pad-pct', '8', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
});

test('autocrop 미지정 시 기존 동작 유지 (회귀 가드)', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
});
