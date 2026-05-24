#!/usr/bin/env node
// Rebuild the Codex bundle from source and refresh the installed Codex plugin.
//
// `codex plugin add` cannot update an already-installed plugin (it fails while
// backing up the existing cache entry), so the reliable refresh is remove → add.
// This wraps: regenerate generated files (mcp + codex bundle) → remove → add.
//
// Usage: npm run codex:reinstall
// Requires the `codex` CLI on PATH (Codex installs only).
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PLUGIN = 'personal@personal';

function run(cmd, { allowFail = false } = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
  } catch (err) {
    if (allowFail) {
      console.log(`  (무시하고 계속 — 아직 설치돼 있지 않을 수 있음)`);
      return;
    }
    console.error(`codex-reinstall: 실패 — ${cmd}`);
    process.exit(typeof err.status === 'number' ? err.status : 1);
  }
}

// 1) regenerate generated files from source (mcp + Codex bundle)
run('node scripts/sync-mcp.mjs');
run('node scripts/sync-codex-plugin.mjs');

// 2) remove (ok if not installed), then 3) add fresh from the marketplace
run(`codex plugin remove ${PLUGIN}`, { allowFail: true });
run(`codex plugin add ${PLUGIN}`);

console.log('\ncodex-reinstall: done — personal@personal 재설치 완료.');
