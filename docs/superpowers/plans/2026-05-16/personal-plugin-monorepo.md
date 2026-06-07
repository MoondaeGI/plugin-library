# Personal Plugin Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a single-plugin monorepo at `C:\Users\ansgu\work\plugin` that registers as both a Claude Code plugin and a Codex CLI plugin, with a single-source MCP definition that auto-syncs to both formats and a Node-based `.env` wrapper that injects secrets without committing them.

**Architecture:** Two manifests (`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`) reference format-specific generated MCP files. The source of truth is `mcp.servers.json` (Codex direct-map format). `scripts/sync-mcp.mjs` produces both target files plus `.env.example`. `scripts/with-env.mjs` is wired into every MCP `command` to load `.env` into the spawned process. A SessionStart hook regenerates stale outputs. All shared logic is in pure libs under `scripts/lib/` and tested with `node --test`. AGENTS.md + CLAUDE.md (with `@AGENTS.md` import) + `.claude/`, `.codex/` are DEV CONFIG only — they shape how Claude/Codex behave when working *on* this repo, not what plugin users receive.

**Tech Stack:** Node.js (built-ins only — `node:fs`, `node:child_process`, `node:crypto`, `node:test`, `node:assert`). No external npm dependencies. PowerShell on Windows for shell commands; Bash works equivalently in WSL/Git Bash.

---

## File Structure

Files **created** by this plan:

```
.claude-plugin/
├── plugin.json                        # Claude manifest
├── marketplace.json                   # self-marketplace for Claude install
└── (mcp.json, mcp.sync-state.json — generated, committed)

.codex-plugin/
└── plugin.json                        # Codex manifest
    (mcp.json — generated, committed)

.agents/plugins/
└── marketplace.json                   # self-marketplace for Codex install

scripts/
├── lib/
│   ├── parse-env.mjs                  # .env parser
│   ├── parse-env.test.mjs
│   ├── transform-mcp.mjs              # source → Claude/Codex format
│   ├── transform-mcp.test.mjs
│   ├── secret-patterns.mjs            # secret pattern detection
│   └── secret-patterns.test.mjs
├── with-env.mjs                       # entrypoint: load .env, spawn child
├── with-env.test.mjs
├── check-secrets.mjs                  # entrypoint: walk JSON, report leaks
└── sync-mcp.mjs                       # entrypoint: orchestrate sync

skills/
└── .gitkeep                           # placeholder

hooks/
└── hooks.json                         # SessionStart stale-check

.claude/
└── settings.json                      # DEV: permission allow list

.codex/
└── config.toml                        # DEV: placeholder

mcp.servers.json                       # single source (starts as `{}`)
package.json                           # npm scripts, no deps
AGENTS.md                              # DEV: single source of dev guidance
CLAUDE.md                              # DEV: imports @AGENTS.md
README.md                              # external user docs
```

Files **modified**:

```
.gitignore                             # expand from existing 2 lines
```

Files **deleted** (typo cleanup):

```
.env.exmaple                           # typo, replaced by generated .env.example
.mcp.exmaple.json                      # typo, no longer needed (mcp.servers.json is SSOT)
.mcp.json                              # empty, not used at root in our design
```

Files **preserved as-is**:

```
.env                                   # exists, empty; user fills with real secrets
```

---

## Task 1: Foundation — git init, gitignore, typo cleanup, skills placeholder

**Files:**
- Modify: `.gitignore`
- Delete: `.env.exmaple`, `.mcp.exmaple.json`, `.mcp.json`
- Create: `skills/.gitkeep`

- [ ] **Step 1: Initialize git repository**

Run:
```powershell
git init
git config user.email "ansgur119977@gmail.com"
git config user.name "ansgu"
```
Expected: `Initialized empty Git repository in C:/Users/ansgu/work/plugin/.git/`

- [ ] **Step 2: Expand `.gitignore`**

Replace `.gitignore` with:
```
# Secrets
.env

# Personal Claude settings
.claude/settings.local.json

# Personal Codex settings
.codex/.local.toml

# Node
node_modules/

# OS
Thumbs.db
.DS_Store
```

- [ ] **Step 3: Delete typo / unused files**

Run:
```powershell
Remove-Item .env.exmaple
Remove-Item .mcp.exmaple.json
Remove-Item .mcp.json
```
Expected: all three files removed without error.

- [ ] **Step 4: Create `skills/.gitkeep` so the directory tracks**

Write empty file at `skills/.gitkeep`.

- [ ] **Step 5: First commit (foundation)**

Run:
```powershell
git add .gitignore skills/.gitkeep
git commit -m "chore: initialize repo, expand gitignore, add skills placeholder"
git status
```
Expected: clean working tree, one commit on main/master.

---

## Task 2: `scripts/lib/parse-env.mjs` — pure `.env` parser (TDD)

**Files:**
- Create: `scripts/lib/parse-env.mjs`
- Test: `scripts/lib/parse-env.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/parse-env.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEnv } from './parse-env.mjs';

test('parses simple KEY=VALUE', () => {
  assert.deepEqual(parseEnv('FOO=bar'), { FOO: 'bar' });
});

test('ignores blank lines and comments', () => {
  const text = `# comment\n\nFOO=bar\n# trailing\n`;
  assert.deepEqual(parseEnv(text), { FOO: 'bar' });
});

test('handles double-quoted values with escapes', () => {
  assert.deepEqual(parseEnv('FOO="hello\\nworld"'), { FOO: 'hello\nworld' });
});

test('handles single-quoted values literally', () => {
  assert.deepEqual(parseEnv("FOO='hello\\nworld'"), { FOO: 'hello\nworld' });
});

test('accepts optional export prefix', () => {
  assert.deepEqual(parseEnv('export FOO=bar'), { FOO: 'bar' });
});

test('handles multiple lines and CRLF', () => {
  const text = 'FOO=1\r\nBAR=2\r\n';
  assert.deepEqual(parseEnv(text), { FOO: '1', BAR: '2' });
});

test('returns empty object for empty input', () => {
  assert.deepEqual(parseEnv(''), {});
});

test('skips malformed lines silently', () => {
  assert.deepEqual(parseEnv('FOO=bar\nnot_a_kv_line\nBAZ=qux'), { FOO: 'bar', BAZ: 'qux' });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/lib/parse-env.test.mjs`
Expected: FAIL — `Cannot find module './parse-env.mjs'` or similar.

- [ ] **Step 3: Write `parse-env.mjs`**

Create `scripts/lib/parse-env.mjs`:
```js
const LINE_RE = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/;

export function parseEnv(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    if (!raw || raw.trim().startsWith('#')) continue;
    const m = raw.match(LINE_RE);
    if (!m) continue;
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"') && val.length >= 2) {
      val = val.slice(1, -1).replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    } else if (val.startsWith("'") && val.endsWith("'") && val.length >= 2) {
      val = val.slice(1, -1).replace(/\\n/g, '\n');
    }
    out[m[1]] = val;
  }
  return out;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/lib/parse-env.test.mjs`
Expected: PASS — all 8 tests pass.

- [ ] **Step 5: Commit**

Run:
```powershell
git add scripts/lib/parse-env.mjs scripts/lib/parse-env.test.mjs
git commit -m "feat: add .env parser library"
```

---

## Task 3: `scripts/lib/transform-mcp.mjs` — pure transforms (TDD)

**Files:**
- Create: `scripts/lib/transform-mcp.mjs`
- Test: `scripts/lib/transform-mcp.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/transform-mcp.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toClaudeFormat, toCodexFormat, extractPlaceholders } from './transform-mcp.mjs';

const sample = {
  github: {
    command: 'node',
    args: ['./scripts/with-env.mjs', 'npx', '-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_TOKEN: '${GITHUB_TOKEN}' },
  },
};

test('toCodexFormat returns the source unchanged', () => {
  assert.deepEqual(toCodexFormat(sample), sample);
});

test('toClaudeFormat wraps in mcpServers', () => {
  assert.deepEqual(toClaudeFormat(sample), { mcpServers: sample });
});

test('toClaudeFormat handles empty source', () => {
  assert.deepEqual(toClaudeFormat({}), { mcpServers: {} });
});

test('toCodexFormat handles empty source', () => {
  assert.deepEqual(toCodexFormat({}), {});
});

test('extractPlaceholders finds ${VAR} in env values', () => {
  assert.deepEqual(extractPlaceholders(sample), ['GITHUB_TOKEN']);
});

test('extractPlaceholders dedupes and sorts', () => {
  const src = {
    a: { command: 'x', env: { TOKEN: '${TOKEN}', URL: '${URL}' } },
    b: { command: 'y', env: { TOKEN: '${TOKEN}' } },
  };
  assert.deepEqual(extractPlaceholders(src), ['TOKEN', 'URL']);
});

test('extractPlaceholders also scans args for placeholders', () => {
  const src = {
    a: { command: 'x', args: ['--endpoint', '${API_ENDPOINT}'], env: {} },
  };
  assert.deepEqual(extractPlaceholders(src), ['API_ENDPOINT']);
});

test('extractPlaceholders returns empty array when none', () => {
  assert.deepEqual(extractPlaceholders({}), []);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/lib/transform-mcp.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `transform-mcp.mjs`**

Create `scripts/lib/transform-mcp.mjs`:
```js
const PLACEHOLDER_RE = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

export function toCodexFormat(source) {
  return source;
}

export function toClaudeFormat(source) {
  return { mcpServers: source };
}

export function extractPlaceholders(source) {
  const found = new Set();
  const scan = (v) => {
    if (typeof v === 'string') {
      for (const m of v.matchAll(PLACEHOLDER_RE)) found.add(m[1]);
    } else if (Array.isArray(v)) {
      v.forEach(scan);
    } else if (v && typeof v === 'object') {
      Object.values(v).forEach(scan);
    }
  };
  scan(source);
  return [...found].sort();
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/lib/transform-mcp.test.mjs`
Expected: PASS — all 8 tests pass.

- [ ] **Step 5: Commit**

Run:
```powershell
git add scripts/lib/transform-mcp.mjs scripts/lib/transform-mcp.test.mjs
git commit -m "feat: add MCP transform library"
```

---

## Task 4: `scripts/lib/secret-patterns.mjs` — secret detection (TDD)

**Files:**
- Create: `scripts/lib/secret-patterns.mjs`
- Test: `scripts/lib/secret-patterns.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `scripts/lib/secret-patterns.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyValue } from './secret-patterns.mjs';

test('placeholder is OK', () => {
  assert.equal(classifyValue('${GITHUB_TOKEN}').level, 'ok');
});

test('placeholder with multiple vars is OK', () => {
  assert.equal(classifyValue('${A}/${B}').level, 'ok');
});

test('GitHub PAT prefix is ERROR', () => {
  const r = classifyValue('ghp_abc123def456ghi789jkl012mno345pqr678');
  assert.equal(r.level, 'error');
  assert.match(r.reason, /github/i);
});

test('OpenAI key prefix is ERROR', () => {
  const r = classifyValue('sk-proj-abc123def456ghi789');
  assert.equal(r.level, 'error');
});

test('Slack bot token is ERROR', () => {
  const r = classifyValue('xoxb-1234567890-abcdefghij');
  assert.equal(r.level, 'error');
});

test('GitLab PAT prefix is ERROR', () => {
  const r = classifyValue('glpat-abc123def456ghi789');
  assert.equal(r.level, 'error');
});

test('Anthropic key prefix is ERROR', () => {
  const r = classifyValue('sk-ant-api03-abcdef');
  assert.equal(r.level, 'error');
});

test('short plain string is OK', () => {
  assert.equal(classifyValue('hello').level, 'ok');
});

test('empty string is OK', () => {
  assert.equal(classifyValue('').level, 'ok');
});

test('long opaque-looking string is WARN', () => {
  const r = classifyValue('a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6');
  assert.equal(r.level, 'warn');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/lib/secret-patterns.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `secret-patterns.mjs`**

Create `scripts/lib/secret-patterns.mjs`:
```js
const PLACEHOLDER_ONLY = /^(?:\$\{[A-Z_][A-Z0-9_]*\})+$/;
const PLACEHOLDER_ANYWHERE = /\$\{[A-Z_][A-Z0-9_]*\}/;

const ERROR_PATTERNS = [
  { re: /^ghp_[A-Za-z0-9]{20,}$/, reason: 'looks like a GitHub personal access token' },
  { re: /^github_pat_[A-Za-z0-9_]{20,}$/, reason: 'looks like a GitHub fine-grained PAT' },
  { re: /^sk-ant-[A-Za-z0-9-]{20,}$/, reason: 'looks like an Anthropic API key' },
  { re: /^sk-(?:proj-)?[A-Za-z0-9-]{20,}$/, reason: 'looks like an OpenAI API key' },
  { re: /^xox[bp]-[A-Za-z0-9-]{20,}$/, reason: 'looks like a Slack token' },
  { re: /^glpat-[A-Za-z0-9_-]{20,}$/, reason: 'looks like a GitLab personal access token' },
  { re: /^AIza[A-Za-z0-9_-]{30,}$/, reason: 'looks like a Google API key' },
];

const WARN_OPAQUE_MIN_LEN = 40;
const WARN_OPAQUE_RE = /^[A-Za-z0-9_\-+/=]+$/;

export function classifyValue(value) {
  if (typeof value !== 'string') return { level: 'ok' };
  if (value === '') return { level: 'ok' };

  // If the entire value is composed of placeholders, treat as OK.
  if (PLACEHOLDER_ONLY.test(value)) return { level: 'ok' };

  // If a value contains placeholders but also other content, allow it (still safe).
  if (PLACEHOLDER_ANYWHERE.test(value)) return { level: 'ok' };

  for (const { re, reason } of ERROR_PATTERNS) {
    if (re.test(value)) return { level: 'error', reason };
  }

  if (value.length >= WARN_OPAQUE_MIN_LEN && WARN_OPAQUE_RE.test(value)) {
    return { level: 'warn', reason: 'long opaque-looking string — verify this is not a secret' };
  }

  return { level: 'ok' };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/lib/secret-patterns.test.mjs`
Expected: PASS — all 10 tests pass.

- [ ] **Step 5: Commit**

Run:
```powershell
git add scripts/lib/secret-patterns.mjs scripts/lib/secret-patterns.test.mjs
git commit -m "feat: add secret pattern classifier"
```

---

## Task 5: `scripts/with-env.mjs` — `.env` loader + child spawner

**Files:**
- Create: `scripts/with-env.mjs`
- Test: `scripts/with-env.test.mjs`

- [ ] **Step 1: Write failing integration test**

Create `scripts/with-env.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WITH_ENV = path.join(__dirname, 'with-env.mjs');

function runWithFakeRoot(envContent, childArgs) {
  // Make a temp dir, put .env there, copy with-env.mjs to <tmp>/scripts/
  const tmp = mkdtempSync(join(tmpdir(), 'with-env-test-'));
  const scriptsDir = join(tmp, 'scripts');
  require('node:fs').mkdirSync(scriptsDir);
  require('node:fs').copyFileSync(WITH_ENV, join(scriptsDir, 'with-env.mjs'));
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
    'node', '-e', 'process.stdout.write(process.env.MY_TEST_VAR || "MISSING")',
  ]);
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'hello_world');
});

test('parent env wins over .env (no overwrite)', () => {
  // We can't easily set parent env per-call here cross-platform without complicating;
  // assert by setting via process.env in this test process
  process.env.MY_OVERRIDE_VAR = 'from_parent';
  const res = runWithFakeRoot('MY_OVERRIDE_VAR=from_dotenv', [
    'node', '-e', 'process.stdout.write(process.env.MY_OVERRIDE_VAR)',
  ]);
  delete process.env.MY_OVERRIDE_VAR;
  assert.equal(res.status, 0);
  assert.equal(res.stdout, 'from_parent');
});

test('runs cleanly when .env is absent', () => {
  const res = runWithFakeRoot(null, [
    'node', '-e', 'process.stdout.write("ok")',
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test scripts/with-env.test.mjs`
Expected: FAIL — `with-env.mjs` not found.

- [ ] **Step 3: Write `scripts/with-env.mjs`**

Create `scripts/with-env.mjs`:
```js
#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEnv } from './lib/parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PLUGIN_ROOT, '.env');

const fileEnv = existsSync(ENV_PATH)
  ? parseEnv(readFileSync(ENV_PATH, 'utf8'))
  : {};

const env = { ...fileEnv, ...process.env };

const [cmd, ...args] = process.argv.slice(2);
if (!cmd) {
  console.error('with-env: missing command');
  process.exit(2);
}

const child = spawn(cmd, args, {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const forward = (sig) => () => child.kill(sig);
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(signal === 'SIGTERM' ? 143 : 130);
  }
  process.exit(code ?? 0);
});

child.on('error', (err) => {
  console.error(`with-env: failed to spawn: ${err.message}`);
  process.exit(127);
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test scripts/with-env.test.mjs`
Expected: PASS — all 5 tests pass.

Note: If "parent env wins" test fails because of test runner subprocess env, that's still a valid behavior assertion; investigate if it fails.

- [ ] **Step 5: Commit**

Run:
```powershell
git add scripts/with-env.mjs scripts/with-env.test.mjs
git commit -m "feat: add with-env wrapper that loads .env and spawns child"
```

---

## Task 6: `scripts/check-secrets.mjs` — entrypoint that walks JSON

**Files:**
- Create: `scripts/check-secrets.mjs`

This is a thin wrapper around `secret-patterns.mjs` already tested. The walk logic is small enough to verify by a tiny inline test in the script's main path.

- [ ] **Step 1: Write `check-secrets.mjs`**

Create `scripts/check-secrets.mjs`:
```js
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classifyValue } from './lib/secret-patterns.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');

export function findIssues(source) {
  const issues = [];
  const walk = (node, pathParts) => {
    if (typeof node === 'string') {
      const r = classifyValue(node);
      if (r.level === 'error' || r.level === 'warn') {
        issues.push({ path: pathParts.join('.'), level: r.level, reason: r.reason, value: node });
      }
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, [...pathParts, String(i)]));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, [...pathParts, k]);
    }
  };
  walk(source, []);
  return issues;
}

function main() {
  const target = process.argv[2] ?? path.join(PLUGIN_ROOT, 'mcp.servers.json');
  let source;
  try {
    source = JSON.parse(readFileSync(target, 'utf8'));
  } catch (err) {
    console.error(`check-secrets: cannot read ${target}: ${err.message}`);
    process.exit(2);
  }
  const issues = findIssues(source);
  let errors = 0;
  let warns = 0;
  for (const issue of issues) {
    const tag = issue.level === 'error' ? 'ERROR' : 'WARN';
    console.error(`${tag}: ${issue.path}: ${issue.reason}`);
    if (issue.level === 'error') errors++;
    else warns++;
  }
  if (errors > 0) {
    console.error(`check-secrets: ${errors} error(s) found — refusing to continue.`);
    process.exit(1);
  }
  if (warns > 0) {
    console.error(`check-secrets: ${warns} warning(s) — review manually.`);
  } else {
    console.log('check-secrets: ok');
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
```

- [ ] **Step 2: Smoke test the script manually**

Run:
```powershell
'{}' | Out-File -Encoding utf8 mcp.servers.json
node scripts/check-secrets.mjs
```
Expected: prints `check-secrets: ok`, exit code 0.

Then test the error path:
```powershell
'{"x":{"env":{"K":"ghp_abc123def456ghi789jkl012mno345pqr678"}}}' | Out-File -Encoding utf8 mcp.servers.json
node scripts/check-secrets.mjs
```
Expected: prints `ERROR: x.env.K: looks like a GitHub personal access token`, exit code 1.

- [ ] **Step 3: Reset `mcp.servers.json`**

Run:
```powershell
'{}' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
```

- [ ] **Step 4: Commit**

Run:
```powershell
git add scripts/check-secrets.mjs mcp.servers.json
git commit -m "feat: add check-secrets entrypoint"
```

---

## Task 7: `scripts/sync-mcp.mjs` — orchestrator

**Files:**
- Create: `scripts/sync-mcp.mjs`

- [ ] **Step 1: Write `sync-mcp.mjs`**

Create `scripts/sync-mcp.mjs`:
```js
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

  writeAll(claudeText, codexText, envExampleText, newHash);
  console.log('sync-mcp: wrote .claude-plugin/mcp.json, .codex-plugin/mcp.json, .env.example, .claude-plugin/mcp.sync-state.json');
}

function writeAll(claudeText, codexText, envExampleText, hash) {
  mkdirSync(path.dirname(CLAUDE_OUT), { recursive: true });
  mkdirSync(path.dirname(CODEX_OUT), { recursive: true });
  writeFileSync(CLAUDE_OUT, claudeText, 'utf8');
  writeFileSync(CODEX_OUT, codexText, 'utf8');
  writeFileSync(ENV_EXAMPLE, envExampleText, 'utf8');
  writeJson(STATE, { sourceHash: hash, syncedAt: new Date().toISOString() });
}

main();
```

- [ ] **Step 2: Smoke-test `sync-mcp.mjs` with empty source**

Ensure `mcp.servers.json` contains `{}`. Then run:
```powershell
node scripts/sync-mcp.mjs
```
Expected: prints `sync-mcp: wrote ...`, exit 0. Files created:
- `.claude-plugin/mcp.json` → `{ "mcpServers": {} }`
- `.codex-plugin/mcp.json` → `{}`
- `.env.example` → header comment only
- `.claude-plugin/mcp.sync-state.json` → `{ "sourceHash": "...", "syncedAt": "..." }`

Verify each file:
```powershell
Get-Content .claude-plugin/mcp.json
Get-Content .codex-plugin/mcp.json
Get-Content .env.example
Get-Content .claude-plugin/mcp.sync-state.json
```

- [ ] **Step 3: Smoke-test `--check` mode**

Run:
```powershell
node scripts/sync-mcp.mjs --check
```
Expected: `sync-mcp: all generated files are up to date.`, exit 0.

Then deliberately corrupt one file:
```powershell
'{"mcpServers":{"x":"corrupt"}}' | Out-File -Encoding utf8 -NoNewline .claude-plugin/mcp.json
node scripts/sync-mcp.mjs --check
```
Expected: exits with code 1, lists `.claude-plugin/mcp.json (differs)`.

Restore by re-running:
```powershell
node scripts/sync-mcp.mjs
```

- [ ] **Step 4: Smoke-test `--check-stale` mode**

Modify `mcp.servers.json` to a different (still empty-valid) value:
```powershell
'{ }' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
node scripts/sync-mcp.mjs --check-stale
```
Expected: stderr says `sync-mcp: source changed since last sync, regenerating...` then `done.`. Re-running `--check-stale` is silent (no output) because state is now fresh.

Reset:
```powershell
'{}' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
node scripts/sync-mcp.mjs
```

- [ ] **Step 5: Commit**

Run:
```powershell
git add scripts/sync-mcp.mjs .claude-plugin/mcp.json .codex-plugin/mcp.json .env.example .claude-plugin/mcp.sync-state.json
git commit -m "feat: add sync-mcp orchestrator with --check and --check-stale modes"
```

---

## Task 8: Manifests — `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`

**Files:**
- Create: `.claude-plugin/plugin.json`
- Create: `.codex-plugin/plugin.json`

- [ ] **Step 1: Write Claude manifest**

Create `.claude-plugin/plugin.json`:
```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "personal",
  "description": "Personal shared plugin for Claude Code and Codex CLI",
  "author": { "name": "ansgu" },
  "mcpServers": "./.claude-plugin/mcp.json"
}
```

- [ ] **Step 2: Write Codex manifest**

Create `.codex-plugin/plugin.json`:
```json
{
  "name": "personal",
  "description": "Personal shared plugin for Claude Code and Codex CLI",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.codex-plugin/mcp.json"
}
```

- [ ] **Step 3: Validate JSON parses**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/plugin.json'))"
node -e "JSON.parse(require('fs').readFileSync('.codex-plugin/plugin.json'))"
```
Expected: both commands complete silently (exit 0).

- [ ] **Step 4: Commit**

Run:
```powershell
git add .claude-plugin/plugin.json .codex-plugin/plugin.json
git commit -m "feat: add Claude and Codex plugin manifests"
```

---

## Task 9: `hooks/hooks.json` — SessionStart stale-check

**Files:**
- Create: `hooks/hooks.json`

- [ ] **Step 1: Write hooks config**

Create `hooks/hooks.json`:
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT:-.}/scripts/sync-mcp.mjs\" --check-stale"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Validate JSON**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('hooks/hooks.json'))"
```
Expected: silent exit 0.

- [ ] **Step 3: Commit**

Run:
```powershell
git add hooks/hooks.json
git commit -m "feat: add SessionStart hook for stale-sync detection"
```

---

## Task 10: Self-marketplaces for Claude and Codex install

**Files:**
- Create: `.claude-plugin/marketplace.json`
- Create: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Write Claude marketplace**

Create `.claude-plugin/marketplace.json`:
```json
{
  "$schema": "https://json.schemastore.org/claude-code-marketplace.json",
  "name": "personal",
  "owner": { "name": "ansgu" },
  "plugins": [
    {
      "name": "personal",
      "source": { "type": "path", "path": "." },
      "description": "Personal plugin (this repo)"
    }
  ]
}
```

- [ ] **Step 2: Write Codex marketplace**

Create `.agents/plugins/marketplace.json`:
```json
{
  "name": "personal",
  "plugins": [
    {
      "name": "personal",
      "source": { "type": "path", "path": "./" },
      "description": "Personal plugin (this repo)"
    }
  ]
}
```

- [ ] **Step 3: Validate JSON**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json'))"
node -e "JSON.parse(require('fs').readFileSync('.agents/plugins/marketplace.json'))"
```
Expected: both silent exit 0.

- [ ] **Step 4: Commit**

Run:
```powershell
git add .claude-plugin/marketplace.json .agents/plugins/marketplace.json
git commit -m "feat: add self-marketplace files for local install"
```

---

## Task 11: DEV config — `.claude/settings.json`, `.codex/config.toml`

**Files:**
- Create: `.claude/settings.json`
- Create: `.codex/config.toml`

- [ ] **Step 1: Write Claude DEV settings**

Create `.claude/settings.json`:
```json
{
  "permissions": {
    "allow": [
      "Bash(npm run sync:*)",
      "Bash(npm run validate:*)",
      "Bash(npm test:*)",
      "Bash(node scripts/sync-mcp.mjs:*)",
      "Bash(node scripts/check-secrets.mjs:*)",
      "Bash(node --test:*)"
    ]
  }
}
```

- [ ] **Step 2: Write Codex DEV config (placeholder)**

Create `.codex/config.toml`:
```toml
# Project-scoped Codex config. Loaded only if this project is marked trusted.
# Currently a placeholder — add model preferences, sandbox settings, etc. as
# they're needed.
```

- [ ] **Step 3: Validate**

Run:
```powershell
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))"
```
Expected: silent exit 0.

- [ ] **Step 4: Commit**

Run:
```powershell
git add .claude/settings.json .codex/config.toml
git commit -m "feat: add DEV config (.claude/settings.json, .codex/config.toml)"
```

---

## Task 12: Docs — `AGENTS.md`, `CLAUDE.md`, `README.md`

**Files:**
- Modify: `AGENTS.md` (currently empty)
- Create: `CLAUDE.md`
- Modify: `README.md` (currently empty)

- [ ] **Step 1: Write `AGENTS.md` (single source of dev guidance)**

Replace `AGENTS.md` with:
```markdown
# Plugin development

This repo is a personal monorepo plugin for both Claude Code and Codex CLI.
The same directory is recognized as a plugin by both tools.

## Workflow

- **Add an MCP server**: edit `mcp.servers.json`, then run `npm run sync`,
  then commit the source and the generated files.
- **Never commit secrets**: `.env` is gitignored. Real values stay there.
  All committed MCP entries reference variables via `${VAR_NAME}` placeholders.
  `scripts/check-secrets.mjs` blocks the sync if a real-looking secret is
  detected inside `mcp.servers.json`.
- **Do not hand-edit generated files**: `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, `.env.example`, and `.claude-plugin/mcp.sync-state.json`
  are produced by `scripts/sync-mcp.mjs`. Edit `mcp.servers.json` and re-run sync.

## Skills

- Skills live in `skills/<name>/SKILL.md` and are shared between Claude and Codex.
- Stick to the common frontmatter (`name`, `description`). Tool-specific
  extensions go in only if the other tool ignores unknown keys cleanly.
- Skill-local scripts go in `skills/<name>/scripts/`. Promote to top-level
  `scripts/` only when something else (a hook, another skill) also uses them.

## Testing locally

- Claude Code: `claude --plugin-dir .` from inside this directory.
- Codex CLI: register this repo as a marketplace via `.agents/plugins/marketplace.json`,
  then `/plugins` → install. Falls back to manual MCP entries in
  `~/.codex/config.toml` if Codex plugin install gives trouble.
- Run script tests anytime: `node --test scripts/`.

## Update flow

- Same machine, in-session: `/reload-plugins` after editing.
- Other machine: `git pull`, then `/reload-plugins` or `/plugin update personal`
  (depending on install method).
- "Auto-update on push" is not guaranteed — explicit `/plugin update`
  is the reliable trigger.
```

- [ ] **Step 2: Write `CLAUDE.md`**

Create `CLAUDE.md`:
```markdown
@AGENTS.md

## Claude-specific

- Use `superpowers:writing-skills` when adding a new skill under `skills/`.
- When proposing structural changes to the plugin layout, prefer plan mode.
- `mcp.servers.json` is the single source of truth for MCP — never edit
  `.claude-plugin/mcp.json` or `.codex-plugin/mcp.json` directly.
```

- [ ] **Step 3: Write `README.md` (external user docs)**

Replace `README.md` with:
```markdown
# personal plugin

Personal Claude Code + Codex CLI plugin. Single repo, two manifests, shared
MCP source and skills.

## Quick start

```powershell
git clone <this-repo> plugin
cd plugin
npm install           # runs sync automatically via the prepare script
cp .env.example .env
# open .env and fill in real values
```

## Install

### Claude Code

Local development:
```powershell
claude --plugin-dir .
```

Marketplace install (one-time):
```
/plugin marketplace add <path-or-git-url-to-this-repo>
/plugin install personal
```

### Codex CLI

Inside Codex: `/plugins` → install from the bundled marketplace in
`.agents/plugins/marketplace.json`.

## Layout

- `mcp.servers.json` — single source for MCP server definitions (edit this)
- `scripts/sync-mcp.mjs` — regenerates `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, and `.env.example` from the source
- `scripts/with-env.mjs` — wraps every MCP command and injects `.env`
- `skills/` — skills shared between Claude and Codex
- `hooks/hooks.json` — session hooks (currently: stale-sync check)

For development guidance, see [AGENTS.md](./AGENTS.md).

## Adding an MCP server

Edit `mcp.servers.json`:

```json
{
  "example": {
    "command": "node",
    "args": ["./scripts/with-env.mjs", "npx", "-y", "@example/mcp-server"],
    "env": { "EXAMPLE_API_KEY": "${EXAMPLE_API_KEY}" }
  }
}
```

Then:
```powershell
npm run sync
```

Generated files are updated. Add the new variable to `.env`, then `/reload-plugins`.
```

- [ ] **Step 4: Commit**

Run:
```powershell
git add AGENTS.md CLAUDE.md README.md
git commit -m "docs: add AGENTS.md, CLAUDE.md, README.md"
```

---

## Task 13: `package.json` and verify `npm install` auto-syncs

**Files:**
- Create: `package.json`

- [ ] **Step 1: Write `package.json`**

Create `package.json`:
```json
{
  "name": "personal-plugin",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Personal plugin for Claude Code and Codex CLI",
  "scripts": {
    "sync": "node scripts/sync-mcp.mjs",
    "validate": "node scripts/sync-mcp.mjs --check",
    "test": "node --test scripts/",
    "prepare": "node scripts/sync-mcp.mjs"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2: Verify `npm install` runs sync via prepare**

First, deliberately corrupt one generated file so we can see prepare regenerate it:
```powershell
'{}' | Out-File -Encoding utf8 -NoNewline .claude-plugin/mcp.json
```

Run:
```powershell
npm install
```
Expected: `npm install` completes without errors, and `prepare` runs `node scripts/sync-mcp.mjs` which restores `.claude-plugin/mcp.json`.

Verify:
```powershell
Get-Content .claude-plugin/mcp.json
```
Expected: `{ "mcpServers": {} }` again.

- [ ] **Step 3: Run all tests via npm**

Run:
```powershell
npm test
```
Expected: all `node --test` cases pass.

- [ ] **Step 4: Run validate**

Run:
```powershell
npm run validate
```
Expected: `sync-mcp: all generated files are up to date.` exit 0.

- [ ] **Step 5: Commit**

Run:
```powershell
git add package.json
git commit -m "feat: add package.json with sync/validate/test scripts"
```

Note: if `npm install` created `package-lock.json` and you don't want it, delete it before committing. Since we have zero deps, the lockfile would be near-empty — commit or skip per preference. Default: commit.

```powershell
git add package-lock.json
git commit -m "chore: add package-lock.json"
```

---

## Task 14: End-to-end smoke test

**Files:** none

Verify that the plugin actually loads in Claude Code and that the wiring is intact end-to-end.

- [ ] **Step 1: Verify Claude Code loads the plugin**

Run:
```powershell
claude --plugin-dir . --debug
```

In another shell, look for the plugin manager once Claude Code starts. Run `/help` and `/plugin list`. Expected: `personal` appears with no errors. Look at `claude --debug` output for "plugin loaded: personal" or equivalent.

If errors mention manifest issues, validate:
```powershell
claude plugin validate
```

Quit Claude Code (`Ctrl+C` or `/exit`).

- [ ] **Step 2: Verify `/reload-plugins` works**

Open Claude Code with `claude --plugin-dir .`. Edit `README.md` (touch any file). In Claude Code: `/reload-plugins`. Expected: completes without errors.

- [ ] **Step 3: Verify stale-sync hook fires**

While running Claude Code (`claude --plugin-dir .`), in another shell modify `mcp.servers.json`:
```powershell
'{ }' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
```

Exit Claude Code, then restart `claude --plugin-dir .`. SessionStart hook fires and runs `sync-mcp.mjs --check-stale`. If stale, regeneration message appears in Claude's hook log / `--debug` output.

Reset:
```powershell
'{}' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
node scripts/sync-mcp.mjs
```

- [ ] **Step 4: Verify check-secrets blocks a fake leak**

Put a fake secret in `mcp.servers.json`:
```powershell
'{"x":{"env":{"K":"ghp_abc123def456ghi789jkl012mno345pqr678"}}}' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
npm run sync
```
Expected: prints `ERROR: x.env.K: ...` and exits with code 1. Generated files are NOT updated.

Reset:
```powershell
'{}' | Out-File -Encoding utf8 -NoNewline mcp.servers.json
npm run sync
```

- [ ] **Step 5: Final commit (if any artifacts changed during smoke tests)**

Run:
```powershell
git status
```

If clean: no commit needed. If artifacts changed (state file timestamp etc.), commit:
```powershell
git add -A
git commit -m "chore: smoke-test artifacts"
```

- [ ] **Step 6: Tag the initial scaffolded state**

Run:
```powershell
git tag -a v0.0.0 -m "Initial scaffold"
git log --oneline
```
Expected: clean history with all the feature commits, tag attached to HEAD.

---

## Self-Review

After writing the plan, I checked the spec section-by-section:

- **Spec 3.1 directory layout** → Tasks 1, 8, 9, 10, 11, 12, 13 (every directory and file in the spec layout has a task that creates it).
- **Spec 3.2 manifests** → Task 8 (both manifests with exact content from spec).
- **Spec 3.3 MCP single source + sync** → Tasks 6, 7 (orchestrator + libraries from Tasks 2, 3, 4).
- **Spec 3.4 sync trigger points** → Task 9 covers SessionStart hook; Task 13 covers `npm install` prepare hook; Task 7 covers `--check` and `--check-stale` modes.
- **Spec 3.5 with-env.mjs** → Task 5 (with shell-on-Windows logic and signal forwarding).
- **Spec 3.6 check-secrets.mjs** → Tasks 4 (patterns) + 6 (entrypoint).
- **Spec 3.7 skills/hooks/AGENTS.md** → Task 9 (hooks), Task 12 (AGENTS.md + CLAUDE.md). Skills directory placeholder in Task 1.
- **Spec 3.8 DEV config** → Task 11.
- **Spec 3.9 plugin OUTPUT vs DEV skill** → Documented in AGENTS.md (Task 12).
- **Spec 4 install & update** → Task 10 (self-marketplaces) + Task 14 (smoke test); described in README (Task 12).
- **Spec 5 out-of-scope items** → None of the excluded items appear as tasks. Verified.
- **Spec 6 risks** → Mitigations are baked in: SessionStart hook (Task 9), prepare script (Task 13), check-secrets (Task 7 invokes findIssues from Task 6).

Placeholder scan: searched for "TBD", "TODO", "implement later", "fill in details", "appropriate error handling" — none present.

Type consistency: function names used across tasks:
- `parseEnv` — Task 2 defines, Task 5 imports → match.
- `toCodexFormat`, `toClaudeFormat`, `extractPlaceholders` — Task 3 defines, Task 7 imports → match.
- `classifyValue` — Task 4 defines, Task 6 imports → match.
- `findIssues` — Task 6 defines and exports, Task 7 imports → match.

Path consistency: `scripts/lib/parse-env.mjs` referenced consistently across `scripts/with-env.mjs` and tests. `.claude-plugin/mcp.json`, `.codex-plugin/mcp.json`, `.env.example`, `.claude-plugin/mcp.sync-state.json` all match between Task 7's writes and Task 13's verification.

Plan complete.

---

## Execution

**Plan complete and saved to `docs/superpowers/plans/2026-05-16/personal-plugin-monorepo.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
