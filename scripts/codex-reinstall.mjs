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
import { readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
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

// 1) regenerate generated files from source (mcp + Codex bundle + agent toml)
run('node scripts/sync-mcp.mjs');
run('node scripts/sync-codex-plugin.mjs');
run('node scripts/sync-agents.mjs');

// 2) remove (ok if not installed), then 3) add fresh from the marketplace
run(`codex plugin remove ${PLUGIN}`, { allowFail: true });
run(`codex plugin add ${PLUGIN}`);

// 4) install custom agents — Codex 플러그인은 에이전트를 번들하지 못하므로
//    생성된 TOML을 ~/.codex/agents/ 로 직접 복사한다.
const agentsSrc = path.join(ROOT, 'codex-agents');
if (existsSync(agentsSrc)) {
  const agentsDest = path.join(os.homedir(), '.codex', 'agents');
  mkdirSync(agentsDest, { recursive: true });
  const tomls = readdirSync(agentsSrc).filter((f) => f.endsWith('.toml'));
  for (const f of tomls) {
    copyFileSync(path.join(agentsSrc, f), path.join(agentsDest, f));
    console.log(`  copied ${f} → ${agentsDest}`);
  }
  console.log(`codex-reinstall: ${tomls.length} agent(s) installed to ~/.codex/agents/`);
}

console.log('\ncodex-reinstall: done — personal@personal 재설치 완료.');
