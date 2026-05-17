#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { toClaudeFormat, toCodexFormat, extractPlaceholders } from './lib/transform-mcp.mjs';
import { findIssues } from './check-secrets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');

const SOURCE = path.join(PLUGIN_ROOT, 'mcp.servers.json');
const CLAUDE_OUT = path.join(PLUGIN_ROOT, '.claude-plugin', 'mcp.json');
const CODEX_OUT = path.join(PLUGIN_ROOT, '.codex-plugin', 'mcp.json');
const ENV_EXAMPLE = path.join(PLUGIN_ROOT, '.env.example');
const STATE = path.join(PLUGIN_ROOT, '.claude-plugin', 'mcp.sync-state.json');

const mode = parseMode(process.argv.slice(2));

function parseMode(args) {
  if (args.includes('--check')) return 'check';
  if (args.includes('--check-stale')) return 'check-stale';
  return 'write';
}

function readSource() {
  if (!existsSync(SOURCE)) {
    console.error(`sync-mcp: ${SOURCE} not found`);
    process.exit(2);
  }
  try {
    return JSON.parse(readFileSync(SOURCE, 'utf8'));
  } catch (err) {
    console.error(`sync-mcp: failed to parse ${SOURCE}: ${err.message}`);
    process.exit(2);
  }
}

function hashSource(text) {
  return 'sha256-' + createHash('sha256').update(text).digest('hex');
}

function readStateHash() {
  if (!existsSync(STATE)) return null;
  try {
    return JSON.parse(readFileSync(STATE, 'utf8')).sourceHash ?? null;
  } catch {
    return null;
  }
}

function renderEnvExample(placeholders) {
  const header = '# Auto-generated from mcp.servers.json — do not edit manually\n';
  const body = placeholders.map((k) => `${k}=`).join('\n');
  return placeholders.length > 0 ? header + body + '\n' : header;
}

function writeJson(file, obj) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function diffExisting(file, expected) {
  if (!existsSync(file)) return { equal: false, reason: 'missing' };
  const actual = readFileSync(file, 'utf8');
  return { equal: actual === expected, reason: actual === expected ? null : 'differs' };
}

function buildOutputs(source) {
  const claudeText = JSON.stringify(toClaudeFormat(source), null, 2) + '\n';
  const codexText = JSON.stringify(toCodexFormat(source), null, 2) + '\n';
  const placeholders = extractPlaceholders(source);
  const envExampleText = renderEnvExample(placeholders);
  return { claudeText, codexText, envExampleText };
}

function writeAll(claudeText, codexText, envExampleText, hash) {
  mkdirSync(path.dirname(CLAUDE_OUT), { recursive: true });
  mkdirSync(path.dirname(CODEX_OUT), { recursive: true });
  writeFileSync(CLAUDE_OUT, claudeText, 'utf8');
  writeFileSync(CODEX_OUT, codexText, 'utf8');
  writeFileSync(ENV_EXAMPLE, envExampleText, 'utf8');
  writeJson(STATE, { sourceHash: hash, syncedAt: new Date().toISOString() });
}

function main() {
  const sourceText = readFileSync(SOURCE, 'utf8');
  const source = readSource();

  const issues = findIssues(source);
  const errors = issues.filter((i) => i.level === 'error');
  if (errors.length > 0) {
    for (const e of errors) console.error(`ERROR: ${e.path}: ${e.reason}`);
    console.error('sync-mcp: refusing to sync — fix secrets in mcp.servers.json');
    process.exit(1);
  }
  for (const w of issues.filter((i) => i.level === 'warn')) {
    console.error(`WARN: ${w.path}: ${w.reason}`);
  }

  const { claudeText, codexText, envExampleText } = buildOutputs(source);
  const newHash = hashSource(sourceText);

  if (mode === 'check-stale') {
    const stale = readStateHash() !== newHash;
    if (stale) {
      console.error('sync-mcp: source changed since last sync, regenerating...');
      writeAll(claudeText, codexText, envExampleText, newHash);
      console.error('sync-mcp: done.');
    }
    return;
  }

  if (mode === 'check') {
    const claudeDiff = diffExisting(CLAUDE_OUT, claudeText);
    const codexDiff = diffExisting(CODEX_OUT, codexText);
    const envDiff = diffExisting(ENV_EXAMPLE, envExampleText);
    const stateHashOk = readStateHash() === newHash;
    const failures = [];
    if (!claudeDiff.equal) failures.push(`${CLAUDE_OUT} (${claudeDiff.reason})`);
    if (!codexDiff.equal) failures.push(`${CODEX_OUT} (${codexDiff.reason})`);
    if (!envDiff.equal) failures.push(`${ENV_EXAMPLE} (${envDiff.reason})`);
    if (!stateHashOk) failures.push(`${STATE} (hash mismatch)`);
    if (failures.length > 0) {
      console.error('sync-mcp: generated files out of date:');
      failures.forEach((f) => console.error('  ' + f));
      console.error('Run `npm run sync` and commit the changes.');
      process.exit(1);
    }
    console.log('sync-mcp: all generated files are up to date.');
    return;
  }

  const upToDate =
    readStateHash() === newHash &&
    diffExisting(CLAUDE_OUT, claudeText).equal &&
    diffExisting(CODEX_OUT, codexText).equal &&
    diffExisting(ENV_EXAMPLE, envExampleText).equal;
  if (upToDate) {
    console.log('sync-mcp: already in sync, no changes written');
    return;
  }
  writeAll(claudeText, codexText, envExampleText, newHash);
  console.log('sync-mcp: wrote .claude-plugin/mcp.json, .codex-plugin/mcp.json, .env.example, .claude-plugin/mcp.sync-state.json');
}

main();
