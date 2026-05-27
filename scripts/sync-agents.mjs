#!/usr/bin/env node
// agents/*.md(Claude 소스)에서 codex-agents/*.toml(Codex 생성물)을 만든다.
// 생성물은 커밋되며 `--check`로 소스와의 동기화를 검증한다. Codex 설치는
// scripts/codex-reinstall.mjs가 이 toml을 ~/.codex/agents/로 복사한다.
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseAgentMd, toCodexToml } from './lib/transform-agent.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const AGENTS_SRC = path.join(ROOT, 'agents');
const CODEX_OUT = path.join(ROOT, 'codex-agents');

const mode = process.argv.includes('--check') ? 'check' : 'write';

function build() {
  const desired = new Map(); // filename -> toml text
  if (!existsSync(AGENTS_SRC)) return desired;
  const files = readdirSync(AGENTS_SRC).filter((f) => f.endsWith('.md')).sort();
  for (const file of files) {
    const md = readFileSync(path.join(AGENTS_SRC, file), 'utf8');
    const { frontmatter, body } = parseAgentMd(md);
    const name = frontmatter.name || path.basename(file, '.md');
    desired.set(`${name}.toml`, toCodexToml({ name, description: frontmatter.description, body }));
  }
  return desired;
}

function existingTomls() {
  if (!existsSync(CODEX_OUT)) return [];
  return readdirSync(CODEX_OUT).filter((f) => f.endsWith('.toml'));
}

function main() {
  const desired = build();

  if (mode === 'check') {
    const failures = [];
    for (const [name, text] of desired) {
      const p = path.join(CODEX_OUT, name);
      if (!existsSync(p)) failures.push(`${name} (missing)`);
      else if (readFileSync(p, 'utf8') !== text) failures.push(`${name} (differs)`);
    }
    for (const f of existingTomls()) {
      if (!desired.has(f)) failures.push(`${f} (stale — no matching agents/*.md)`);
    }
    if (failures.length) {
      console.error('sync-agents: codex-agents/ out of date:');
      failures.forEach((f) => console.error('  ' + f));
      console.error('Run `npm run sync` and commit the changes.');
      process.exit(1);
    }
    console.log('sync-agents: codex-agents/ is up to date.');
    return;
  }

  mkdirSync(CODEX_OUT, { recursive: true });
  let changed = 0;
  for (const [name, text] of desired) {
    const p = path.join(CODEX_OUT, name);
    if (!existsSync(p) || readFileSync(p, 'utf8') !== text) {
      writeFileSync(p, text, 'utf8');
      changed++;
    }
  }
  console.log(changed ? `sync-agents: wrote ${changed} file(s) to codex-agents/` : 'sync-agents: already in sync, no changes written');
}

main();
