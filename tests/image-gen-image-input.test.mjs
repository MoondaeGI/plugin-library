import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(PLUGIN_ROOT, 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}

// 존재하는 더미 이미지 파일 (dry-run은 바이트를 읽지 않고 존재만 확인)
function makeImage(name = 'ref.png') {
  const dir = mkdtempSync(path.join(tmpdir(), 'img-in-'));
  const p = path.join(dir, name);
  writeFileSync(p, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return p;
}

// 아직 존재하지 않는 출력 경로 (clash 검사 통과용)
function outPath(name = 'out.png') {
  return path.join(mkdtempSync(path.join(tmpdir(), 'img-out-')), name);
}

test('--image 가 있으면 dry-run 이 edits 엔드포인트와 이미지 목록을 출력한다', () => {
  const img1 = makeImage('a.png');
  const img2 = makeImage('b.png');
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img1, '--image', img2, '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POST https:\/\/api\.openai\.com\/v1\/images\/edits/);
  assert.match(res.stdout, /images \(2\)/);
});

test('--image 가 없으면 dry-run 이 generations 엔드포인트를 유지한다 (회귀 가드)', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POST https:\/\/api\.openai\.com\/v1\/images\/generations/);
});

test('존재하지 않는 --image 경로는 비0 종료로 실패한다', () => {
  const missing = path.join(tmpdir(), 'no-such-image-' + Date.now() + '.png');
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', missing, '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없습니다/);
});

// --input-fidelity 는 gpt-image-1.x + edits(--image) 일 때만 페이로드에 들어간다.
test('--input-fidelity high + --image + gpt-image-1.5 면 payload 에 input_fidelity 가 있다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'high', '--model', 'gpt-image-1.5', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"input_fidelity": "high"/);
});

test('--input-fidelity low 도 payload 에 그대로 전달된다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'low', '--model', 'gpt-image-1.5', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"input_fidelity": "low"/);
});

test('gpt-image-2 에는 --input-fidelity 를 줘도 payload 에서 빠진다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'high', '--model', 'gpt-image-2', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});

test('--input-fidelity 가 high|low 가 아니면 비0 종료한다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--input-fidelity', 'medium', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /high 또는 low/);
});

test('--input-fidelity 없이 --image 만이면 payload 에 input_fidelity 가 없다 (기존 가드 유지)', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--model', 'gpt-image-1.5', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});

test('--image 만으로 보낸 edits 페이로드에는 input_fidelity 가 없다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});
