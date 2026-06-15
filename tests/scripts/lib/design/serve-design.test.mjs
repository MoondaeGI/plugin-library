import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', '..', '..', '..', 'scripts', 'lib', 'design', 'serve-design.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function tmpDirWithHtml() {
  const d = mkdtempSync(path.join(tmpdir(), 'sd-'));
  writeFileSync(path.join(d, 'overview.html'), '<!doctype html><title>x</title>', 'utf8');
  return d;
}

test('디렉터리 입력 → root=그 dir, open=true, 기본 포트', () => {
  const d = tmpDirWithHtml();
  const res = run([d, '--print-options']);
  assert.equal(res.status, 0, res.stderr);
  const o = JSON.parse(res.stdout);
  assert.equal(o.root, path.resolve(d));
  assert.equal(o.open, true);
  assert.equal(o.port, 5500);
});

test('HTML 파일 입력 → root=부모, open=파일명', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([path.join(d, 'overview.html'), '--print-options']).stdout);
  assert.equal(o.root, path.resolve(d));
  assert.equal(o.open, 'overview.html');
});

test('--port N → 포트 반영', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([d, '--port', '8080', '--print-options']).stdout);
  assert.equal(o.port, 8080);
});

test('--no-open → open=false', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([d, '--no-open', '--print-options']).stdout);
  assert.equal(o.open, false);
});

test('HTML 파일 + --no-open → open=false', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([path.join(d, 'overview.html'), '--no-open', '--print-options']).stdout);
  assert.equal(o.open, false);
});

test('존재하지 않는 경로 → 종료코드 2 + stderr', () => {
  const res = run([path.join(tmpdir(), 'nope-xyz-123-sd'), '--print-options']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없/);
});

test('경로 인자 없음 → 종료코드 2 + usage', () => {
  const res = run(['--print-options']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /사용:/);
});

test('알 수 없는 플래그 → 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--bogus', '--print-options']).status, 2);
});

test('--port 값이 숫자가 아니면 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--port', 'abc', '--print-options']).status, 2);
});

test('--port 값 없이 마지막 인자 → 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--port']).status, 2);
});

test('--port 가 65535 초과면 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--port', '65536', '--print-options']).status, 2);
});
