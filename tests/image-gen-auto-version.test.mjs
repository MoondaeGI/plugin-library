import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}

// 이미 존재하는 출력 파일을 만든다
function existingOut(name, ...alsoExisting) {
  const dir = mkdtempSync(path.join(tmpdir(), 'img-av-'));
  const out = path.join(dir, name);
  writeFileSync(out, Buffer.from([0x89]));
  for (const extra of alsoExisting) writeFileSync(path.join(dir, extra), Buffer.from([0x89]));
  return out;
}

test('--auto-version: 기존 파일이 있으면 다음 -v2 로 증분한다', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic-v2\.png/);
});

test('--auto-version: -v2 도 있으면 -v3 로 건너뛴다', () => {
  const out = existingOut('pic.png', 'pic-v2.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic-v3\.png/);
});

test('--auto-version 없이 기존 파일이면 에러로 막는다 (회귀 가드)', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /이미 존재/);
});

test('--force 는 --auto-version 보다 우선 — 지정 경로를 그대로 쓴다', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--force', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic\.png/);
  assert.doesNotMatch(res.stdout, /pic-v\d/);
});
