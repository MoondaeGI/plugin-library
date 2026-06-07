import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadEnv } from '../../../scripts/lib/load-env.mjs';

function tmpEnv(content) {
  const dir = mkdtempSync(path.join(tmpdir(), 'load-env-'));
  const p = path.join(dir, '.env');
  writeFileSync(p, content);
  return { dir, p };
}

test('merges .env file values with process env', () => {
  const { dir, p } = tmpEnv('FOO=fromfile\nBAR=baz\n');
  const got = loadEnv({ envPath: p, env: { OTHER: 'x' } });
  assert.equal(got.FOO, 'fromfile');
  assert.equal(got.BAR, 'baz');
  assert.equal(got.OTHER, 'x');
  rmSync(dir, { recursive: true, force: true });
});

test('process env wins over .env file', () => {
  const { dir, p } = tmpEnv('FOO=fromfile\n');
  const got = loadEnv({ envPath: p, env: { FOO: 'fromenv' } });
  assert.equal(got.FOO, 'fromenv');
  rmSync(dir, { recursive: true, force: true });
});

test('returns just env when the .env file is absent', () => {
  const missing = path.join(tmpdir(), 'load-env-none-' + Date.now(), '.env');
  const got = loadEnv({ envPath: missing, env: { FOO: 'x' } });
  assert.equal(got.FOO, 'x');
});
