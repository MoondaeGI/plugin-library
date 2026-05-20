import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { resolveVaultPath } from '../skills/librarian/scripts/resolve-vault.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const RESOLVER = path.join(PLUGIN_ROOT, 'skills', 'librarian', 'scripts', 'resolve-vault.mjs');
const PARSE_ENV = path.join(PLUGIN_ROOT, 'scripts', 'lib', 'parse-env.mjs');
const NO_ENV = path.join(tmpdir(), 'librarian-no-such.env');

function makeKbVault() {
  const dir = mkdtempSync(path.join(tmpdir(), 'kb-vault-'));
  writeFileSync(path.join(dir, 'AGENTS.md'), '# kb\n');
  writeFileSync(path.join(dir, 'index.md'), '# index\n');
  return dir;
}

// --- resolveVaultPath() unit tests ---

test('resolves an absolute path to a valid kb vault from env', () => {
  const vault = makeKbVault();
  const got = resolveVaultPath({ envPath: NO_ENV, env: { LIBRARIAN_VAULT_PATH: vault } });
  assert.equal(got, path.resolve(vault));
  rmSync(vault, { recursive: true, force: true });
});

test('throws with guidance when the var is unset', () => {
  assert.throws(
    () => resolveVaultPath({ envPath: NO_ENV, env: {} }),
    /LIBRARIAN_VAULT_PATH is not set/,
  );
});

test('throws when the path does not exist', () => {
  const missing = path.join(tmpdir(), 'librarian-missing-' + Date.now());
  assert.throws(
    () => resolveVaultPath({ envPath: NO_ENV, env: { LIBRARIAN_VAULT_PATH: missing } }),
    /not an existing directory/,
  );
});

test('throws when the directory is not a kb vault (missing index.md)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'not-kb-'));
  writeFileSync(path.join(dir, 'AGENTS.md'), '# x\n');
  assert.throws(
    () => resolveVaultPath({ envPath: NO_ENV, env: { LIBRARIAN_VAULT_PATH: dir } }),
    /not a kb vault \(missing index\.md\)/,
  );
  rmSync(dir, { recursive: true, force: true });
});

test('process env overrides the .env file value', () => {
  const fromEnv = makeKbVault();
  const fromFile = makeKbVault();
  const tmp = mkdtempSync(path.join(tmpdir(), 'env-'));
  const envFile = path.join(tmp, '.env');
  writeFileSync(envFile, `LIBRARIAN_VAULT_PATH=${fromFile}\n`);
  const got = resolveVaultPath({ envPath: envFile, env: { LIBRARIAN_VAULT_PATH: fromEnv } });
  assert.equal(got, path.resolve(fromEnv));
  rmSync(fromEnv, { recursive: true, force: true });
  rmSync(fromFile, { recursive: true, force: true });
  rmSync(tmp, { recursive: true, force: true });
});

test('reads the path from the .env file when not in process env', () => {
  const vault = makeKbVault();
  const tmp = mkdtempSync(path.join(tmpdir(), 'env-'));
  const envFile = path.join(tmp, '.env');
  writeFileSync(envFile, `LIBRARIAN_VAULT_PATH=${vault}\n`);
  const got = resolveVaultPath({ envPath: envFile, env: {} });
  assert.equal(got, path.resolve(vault));
  rmSync(vault, { recursive: true, force: true });
  rmSync(tmp, { recursive: true, force: true });
});

// --- CLI integration tests (fake plugin root, mirrors with-env.test.mjs) ---

function runResolverWithFakeRoot(envContent) {
  const tmp = mkdtempSync(path.join(tmpdir(), 'resolver-root-'));
  const scriptDir = path.join(tmp, 'skills', 'librarian', 'scripts');
  const libDir = path.join(tmp, 'scripts', 'lib');
  mkdirSync(scriptDir, { recursive: true });
  mkdirSync(libDir, { recursive: true });
  copyFileSync(RESOLVER, path.join(scriptDir, 'resolve-vault.mjs'));
  copyFileSync(PARSE_ENV, path.join(libDir, 'parse-env.mjs'));
  if (envContent !== null) writeFileSync(path.join(tmp, '.env'), envContent);
  const { LIBRARIAN_VAULT_PATH, ...cleanEnv } = process.env;
  const res = spawnSync('node', [path.join(scriptDir, 'resolve-vault.mjs')], {
    encoding: 'utf8',
    env: cleanEnv,
  });
  rmSync(tmp, { recursive: true, force: true });
  return res;
}

test('CLI prints the vault path and exits 0 on success', () => {
  const vault = makeKbVault();
  const res = runResolverWithFakeRoot(`LIBRARIAN_VAULT_PATH=${vault}\n`);
  assert.equal(res.status, 0);
  assert.equal(res.stdout.trim(), path.resolve(vault));
  rmSync(vault, { recursive: true, force: true });
});

test('CLI prints guidance and exits 1 when the var is unset', () => {
  const res = runResolverWithFakeRoot(null);
  assert.equal(res.status, 1);
  assert.match(res.stderr, /LIBRARIAN_VAULT_PATH is not set/);
});
