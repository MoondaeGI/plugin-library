import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const WITH_ENV = path.join(PLUGIN_ROOT, 'scripts', 'with-env.mjs');
const PARSE_ENV = path.join(PLUGIN_ROOT, 'scripts', 'lib', 'parse-env.mjs');

function runWithFakeRoot(envContent, childArgs) {
  const tmp = mkdtempSync(join(tmpdir(), 'with-env-test-'));
  const scriptsDir = join(tmp, 'scripts');
  const libDir = join(scriptsDir, 'lib');
  mkdirSync(scriptsDir);
  mkdirSync(libDir);
  copyFileSync(WITH_ENV, join(scriptsDir, 'with-env.mjs'));
  copyFileSync(PARSE_ENV, join(libDir, 'parse-env.mjs'));
  if (envContent !== null) writeFileSync(join(tmp, '.env'), envContent);
  const res = spawnSync('node', [join(scriptsDir, 'with-env.mjs'), ...childArgs], {
    encoding: 'utf8',
    cwd: tmp,
  });
  rmSync(tmp, { recursive: true, force: true });
  return res;
}

test('passes .env values into child process', () => {
  const res = runWithFakeRoot('MY_TEST_VAR=hello_world', [
    'node', '-e',
    "process.stdout.write(process.env.MY_TEST_VAR===undefined?'MISSING':process.env.MY_TEST_VAR)",
  ]);
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'hello_world');
});

test('parent env wins over .env (no overwrite)', () => {
  process.env.MY_OVERRIDE_VAR = 'from_parent';
  const res = runWithFakeRoot('MY_OVERRIDE_VAR=from_dotenv', [
    'node', '-e',
    'process.stdout.write(process.env.MY_OVERRIDE_VAR)',
  ]);
  delete process.env.MY_OVERRIDE_VAR;
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'from_parent');
});

test('runs cleanly when .env is absent', () => {
  const res = runWithFakeRoot(null, [
    'node', '-e', "process.stdout.write('ok')",
  ]);
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'ok');
});

test('exits with code 2 when no command given', () => {
  const res = runWithFakeRoot(null, []);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /missing command/i);
});

test('propagates child exit code', () => {
  const res = runWithFakeRoot(null, ['node', '-e', 'process.exit(7)']);
  assert.equal(res.status, 7);
});
