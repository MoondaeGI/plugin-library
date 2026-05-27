# Designer 서브에이전트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 스킬 파이프라인을 운전하는 단일 `designer` 서브에이전트를 Claude(번들)와 Codex(생성 TOML 설치) 양쪽에 추가한다.

**Architecture:** 단일 소스 `agents/designer.md`(Claude 네이티브, 직접 읽힘)에서 `scripts/sync-agents.mjs`가 `codex-agents/designer.toml`을 생성한다. `model`·`tools`는 Claude 전용이라 Codex TOML로 옮기지 않는다. Codex는 플러그인이 에이전트를 번들하지 못하므로, `codex:reinstall`이 생성된 TOML을 `~/.codex/agents/`로 복사한다.

**Tech Stack:** Node.js ESM(외부 의존성 없음), `node:test`, 기존 sync 파이프라인 패턴(`transform-mcp.mjs`/`sync-mcp.mjs`).

**참고 스펙:** `docs/superpowers/specs/2026-05-27-designer-agent-design.md`

---

## 파일 구조

| 파일 | 책임 | 신규/수정 |
| --- | --- | --- |
| `scripts/lib/transform-agent.mjs` | 순수 변환: 에이전트 md 파싱 + Codex TOML 생성 | 신규 |
| `tests/transform-agent.test.mjs` | 변환 단위 테스트 | 신규 |
| `scripts/sync-agents.mjs` | CLI 래퍼: `agents/*.md` → `codex-agents/*.toml` (write/--check) | 신규 |
| `agents/designer.md` | designer 에이전트 소스(Claude 직접 사용, 단일 진실 소스) | 신규 |
| `codex-agents/designer.toml` | 생성물(커밋) — sync가 생성 | 신규(생성) |
| `.claude-plugin/plugin.json` | `agents` 키 명시 | 수정 |
| `package.json` | `sync`/`validate`/`prepare` 체인에 sync-agents 추가 | 수정 |
| `scripts/codex-reinstall.mjs` | TOML → `~/.codex/agents/` 복사 단계 추가 | 수정 |
| `README.md`, `AGENTS.md` | "에이전트" 섹션 + 생성물 목록 | 수정 |

---

## Task 1: 변환 로직 `transform-agent.mjs` (TDD)

**Files:**
- Create: `scripts/lib/transform-agent.mjs`
- Test: `tests/transform-agent.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

Create `tests/transform-agent.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAgentMd, toCodexToml } from '../scripts/lib/transform-agent.mjs';

const sampleMd = `---
name: designer
description: 디자인 작업을 협업한다
tools: Read, Write, Skill
model: inherit
---

당신은 디자이너다.
한국어로 일한다.
`;

test('parseAgentMd extracts frontmatter and body', () => {
  const { frontmatter, body } = parseAgentMd(sampleMd);
  assert.equal(frontmatter.name, 'designer');
  assert.equal(frontmatter.description, '디자인 작업을 협업한다');
  assert.equal(frontmatter.tools, 'Read, Write, Skill');
  assert.equal(frontmatter.model, 'inherit');
  assert.equal(body, '당신은 디자이너다.\n한국어로 일한다.\n');
});

test('parseAgentMd throws without opening fence', () => {
  assert.throws(() => parseAgentMd('no frontmatter here'), /frontmatter fence/);
});

test('parseAgentMd throws without closing fence', () => {
  assert.throws(() => parseAgentMd('---\nname: x\n'), /closing/);
});

test('toCodexToml includes name, description, developer_instructions', () => {
  const toml = toCodexToml({ name: 'designer', description: '디자인 작업을 협업한다', body: '당신은 디자이너다.\n' });
  assert.match(toml, /^name = "designer"$/m);
  assert.match(toml, /^description = "디자인 작업을 협업한다"$/m);
  assert.match(toml, /developer_instructions = '''/);
  assert.match(toml, /당신은 디자이너다\./);
});

test('toCodexToml excludes Claude-only model and tools', () => {
  const toml = toCodexToml({ name: 'designer', description: 'd', body: 'b\n' });
  assert.doesNotMatch(toml, /^model =/m);
  assert.doesNotMatch(toml, /^tools =/m);
});

test('toCodexToml escapes quotes and backslashes in description', () => {
  const toml = toCodexToml({ name: 'a', description: 'say "hi" c:\\\\x', body: 'b\n' });
  assert.match(toml, /description = "say \\"hi\\" c:\\\\\\\\x"/);
});

test('toCodexToml throws when body contains a literal triple-quote', () => {
  assert.throws(() => toCodexToml({ name: 'a', description: 'd', body: "x ''' y\n" }), /triple/);
});

test('toCodexToml requires name and description', () => {
  assert.throws(() => toCodexToml({ description: 'd', body: 'b\n' }), /name/);
  assert.throws(() => toCodexToml({ name: 'a', body: 'b\n' }), /description/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/transform-agent.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/transform-agent.mjs'`

- [ ] **Step 3: 최소 구현 작성**

Create `scripts/lib/transform-agent.mjs`:

```js
// Claude 에이전트 markdown(YAML-ish frontmatter + 본문)을 파싱하고, 동일 에이전트의
// Codex 커스텀 에이전트 TOML을 생성한다.
//
// `model`/`tools`는 Claude 전용 frontmatter라 Codex TOML로 옮기지 않는다 —
// `opus`/`sonnet`은 Anthropic 모델 슬러그이고 Codex는 OpenAI 모델로 동작하므로
// 무의미하다. Codex는 `model` 생략 시 세션 모델을 상속한다.

const FENCE = '---';

// 단순 `key: value` frontmatter(단일 라인 값) + 본문을 분리한다.
export function parseAgentMd(mdText) {
  const lines = mdText.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== FENCE) {
    throw new Error('agent md: must start with a --- frontmatter fence');
  }
  const frontmatter = {};
  let closeIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === FENCE) { closeIdx = i; break; }
    if (lines[i].trim() === '') continue;
    const m = lines[i].match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!m) throw new Error(`agent md: unparseable frontmatter line: "${lines[i]}"`);
    frontmatter[m[1]] = m[2].trim();
  }
  if (closeIdx === -1) throw new Error('agent md: missing closing --- frontmatter fence');
  const body = lines.slice(closeIdx + 1).join('\n').trim() + '\n';
  return { frontmatter, body };
}

function tomlBasicString(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

export function toCodexToml({ name, description, body } = {}) {
  if (!name) throw new Error('agent md: frontmatter requires `name`');
  if (!description) throw new Error('agent md: frontmatter requires `description`');
  if ((body ?? '').includes("'''")) {
    throw new Error("agent md: body contains a triple-quote (''') which breaks the TOML literal string");
  }
  const instr = body.endsWith('\n') ? body : body + '\n';
  return [
    `# Auto-generated from agents/${name}.md by scripts/sync-agents.mjs — do not edit manually.`,
    '# `model`/`tools`는 Claude 전용이라 여기엔 포함하지 않는다(Codex는 세션 모델 상속).',
    `name = ${tomlBasicString(name)}`,
    `description = ${tomlBasicString(description)}`,
    "developer_instructions = '''",
    instr.replace(/\n$/, ''),
    "'''",
    '',
  ].join('\n');
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/transform-agent.test.mjs`
Expected: PASS (8 tests)

- [ ] **Step 5: 커밋**

```bash
git add scripts/lib/transform-agent.mjs tests/transform-agent.test.mjs
git commit -m "feat(agents): add agent md→Codex TOML transform" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 동기화 래퍼 `sync-agents.mjs` + package.json 연결

**Files:**
- Create: `scripts/sync-agents.mjs`
- Modify: `package.json:7-14` (scripts 블록)

- [ ] **Step 1: 래퍼 작성**

Create `scripts/sync-agents.mjs`:

```js
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
```

- [ ] **Step 2: package.json scripts 수정**

Modify `package.json` scripts 블록 — `sync`, `validate`, `prepare` 세 줄을 다음으로 교체:

```json
    "sync": "node scripts/sync-mcp.mjs && node scripts/sync-codex-plugin.mjs && node scripts/sync-agents.mjs",
    "codex:reinstall": "node scripts/codex-reinstall.mjs",
    "env:apply": "node scripts/apply-env.mjs",
    "validate": "node scripts/sync-mcp.mjs --check && node scripts/sync-agents.mjs --check",
    "test": "node --test \"tests/**/*.test.mjs\"",
    "prepare": "node scripts/sync-mcp.mjs && node scripts/sync-codex-plugin.mjs && node scripts/sync-agents.mjs"
```

(`codex:reinstall`/`env:apply`/`test`는 기존 값 그대로 — 블록 전체를 일관되게 보여주기 위함.)

- [ ] **Step 3: sync 실행 — 아직 agents/ 없음 → no-op 확인**

Run: `npm run sync`
Expected: 마지막 줄에 `sync-agents: already in sync, no changes written` (agents/ 디렉터리가 없으면 desired가 비어 통과).

- [ ] **Step 4: 커밋**

```bash
git add scripts/sync-agents.mjs package.json
git commit -m "feat(agents): wire sync-agents into sync/validate/prepare" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: designer 에이전트 소스 + 생성물

**Files:**
- Create: `agents/designer.md`
- Modify: `.claude-plugin/plugin.json`
- Generate: `codex-agents/designer.toml` (sync로)

- [ ] **Step 1: 에이전트 소스 작성**

Create `agents/designer.md`:

```markdown
---
name: designer
description: 브랜드 킷·페이지 이미지·DESIGN.md·HTML 프로토타입을 디자인 스킬 파이프라인으로 만들 때 사용한다. 디자인 작업 전반을 협업하며 단계적으로 진행한다.
tools: Read, Write, Edit, Bash, Glob, Grep, Skill
model: inherit
---

당신은 제품 디자인 작업을 처음부터 끝까지 함께 끌고 가는 협업형 디자이너다. 직접 즉흥으로 결과물을 지어내지 말고, 아래 디자인 스킬을 단계에 맞게 `Skill` 도구로 호출해 그 스킬의 지시를 따른다.

## 파이프라인

1. **design-brand-kit** — 제품 설명에서 브랜드 킷(`.design/BRAND_KIT.md`, `.design/brand-tokens.json`)과 종합 브랜드 오버뷰 보드(메인 산출물)를 만든다. 단색 로고는 선택.
2. **design-page-image** — 브랜드 킷을 바탕으로 랜딩/대시보드/앱 화면의 섹션별 이미지 브리프와 섹션 이미지를 만든다.
3. **design-md-compiler** — 위 산출물을 구현자가 따를 수 있는 `.design/DESIGN.md`로 정리한다.
4. **design-html-prototype** — `DESIGN.md`와 토큰으로 빠르게 확인 가능한 단일 HTML/CSS 프로토타입을 만든다.

각 단계는 앞 단계의 `.design/` 산출물을 입력으로 받는다. 사용자가 특정 단계만 원하면 그 단계만 한다.

## 작업 원칙

- **한 번에 하나.** 이미지·섹션은 한 장씩 만들어 보여주고 피드백을 받는다. 피드백은 한 번에 한 가지만 반영해 다시 만든다. 확정(lock)되면 다음으로 넘어간다.
- **산출물 위치**: 대상 프로젝트의 `.design/` 아래. 스킬이 지정한 경로를 그대로 따른다.
- **이미지 생성에는 `OPENAI_API_KEY`가 필요**하다(`.env` + `npm run env:apply`). 키가 없으면 이미지 단계는 사람이 직접 드롭하도록 안내하고 나머지를 진행한다.
- **한국어**로 소통하고, 생성 이미지 안의 텍스트도 한국어로 렌더한다.
- 시작할 때 어느 단계부터 할지, 입력(제품 설명 등)이 충분한지 먼저 확인한다. 부족하면 합리적 기본값을 쓰되 추측한 부분을 밝힌다.

## 하지 않을 것

- 스킬을 건너뛰고 즉흥으로 결과물을 지어내지 않는다.
- 여러 산출물을 한꺼번에 쏟아내지 않는다 — 만들고, 보여주고, 고친다.
```

- [ ] **Step 2: plugin.json에 agents 키 명시**

Modify `.claude-plugin/plugin.json` — `mcpServers` 줄 뒤에 `agents` 추가:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "personal",
  "description": "Personal shared plugin for Claude Code and Codex CLI",
  "author": { "name": "ansgu" },
  "mcpServers": "./.claude-plugin/mcp.json",
  "agents": "./agents/"
}
```

- [ ] **Step 3: 생성 실행**

Run: `npm run sync`
Expected: 마지막 줄 `sync-agents: wrote 1 file(s) to codex-agents/`. `codex-agents/designer.toml`이 생성됨.

- [ ] **Step 4: 생성물 점검**

Run: `node --eval "process.stdout.write(require('fs').readFileSync('codex-agents/designer.toml','utf8'))"`
Expected: `name = "designer"`, `description = "..."`, `developer_instructions = '''` 로 시작하는 멀티라인, **`model =`·`tools =` 줄 없음**.

- [ ] **Step 5: validate 통과 확인**

Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.` + `sync-agents: codex-agents/ is up to date.`

- [ ] **Step 6: 커밋**

```bash
git add agents/designer.md .claude-plugin/plugin.json codex-agents/designer.toml
git commit -m "feat(agents): add designer agent (Claude md source + generated Codex toml)" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Codex 설치 단계 (`codex-reinstall.mjs`)

**Files:**
- Modify: `scripts/codex-reinstall.mjs`

- [ ] **Step 1: import와 설치 단계 추가**

Modify `scripts/codex-reinstall.mjs`:

상단 import 줄을 교체:

```js
import { execSync } from 'node:child_process';
import { readdirSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
```

`run('node scripts/sync-codex-plugin.mjs');` 줄 바로 뒤에 추가:

```js
run('node scripts/sync-agents.mjs');
```

마지막 `console.log('\ncodex-reinstall: done ...')` 줄 **앞에** 다음 블록 삽입:

```js
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
```

- [ ] **Step 2: 구문 점검 (codex CLI 없이 import만 검증)**

Run: `node --check scripts/codex-reinstall.mjs`
Expected: 출력 없음(구문 정상). 실제 `npm run codex:reinstall`은 `codex` CLI가 있을 때 Task 6에서 사용자가 실행.

- [ ] **Step 3: 커밋**

```bash
git add scripts/codex-reinstall.mjs
git commit -m "feat(agents): install Codex agent toml into ~/.codex/agents on reinstall" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: 문서 (한국어)

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: README에 "에이전트" 섹션 추가**

Modify `README.md` — "레이아웃" 섹션(`## 레이아웃`) **앞에** 다음 섹션을 삽입:

```markdown
## 에이전트

`designer` 서브에이전트는 디자인 스킬 파이프라인(`design-brand-kit` → `design-page-image` → `design-md-compiler` → `design-html-prototype`)을 협업하며 운전한다.

- **소스**: `agents/designer.md` (Claude 네이티브 — 단일 진실 소스).
- **Claude**: 플러그인이 `agents/`를 번들하므로 자동 노출된다 (`@agent-personal:designer`). 수정 후 `/reload-plugins`.
- **Codex**: 플러그인이 에이전트를 번들하지 못한다. `npm run sync`가 `agents/designer.md` → `codex-agents/designer.toml`을 생성하고, `npm run codex:reinstall`이 이를 `~/.codex/agents/`로 복사한다. (수동: `copy codex-agents\designer.toml %USERPROFILE%\.codex\agents\`.) 열려 있던 Codex 세션은 재시작해야 반영된다.
- **`model`/`tools`는 Claude 전용** frontmatter라 Codex TOML로 옮기지 않는다(`opus`/`sonnet`은 Anthropic 슬러그). Codex는 세션 모델을 상속한다.
```

- [ ] **Step 2: README 레이아웃 목록에 항목 추가**

Modify `README.md` — `- \`skills/\` — Claude와 Codex가 공유하는 ...` 줄 **뒤에** 두 줄 추가:

```markdown
- `agents/` — Claude 서브에이전트 **소스** (`designer.md` 등; Claude가 직접 읽음)
- `codex-agents/` — **생성물**: `agents/*.md`에서 만든 Codex 에이전트 TOML (`npm run sync`가 생성, `codex:reinstall`이 `~/.codex/agents/`로 설치)
```

- [ ] **Step 3: AGENTS.md 생성물 목록 + 에이전트 문단**

Modify `AGENTS.md` — "## 스킬" 섹션 **앞에** 다음 섹션을 삽입:

```markdown
## 에이전트

- `designer` 서브에이전트의 단일 소스는 `agents/designer.md`(Claude 네이티브)다. Claude는 `agents/`를 직접 번들로 읽고, Codex는 에이전트를 번들하지 못하므로 `scripts/sync-agents.mjs`가 `codex-agents/designer.toml`을 생성한다(커밋되는 생성물). `npm run codex:reinstall`이 그 TOML을 `~/.codex/agents/`로 복사한다.
- `model`·`tools`는 Claude 전용 frontmatter라 Codex TOML로 옮기지 않는다(`opus`/`sonnet`은 Anthropic 모델 슬러그라 Codex에 무의미; Codex는 세션 모델 상속). 도구별 모델 고정이 필요해지면 소스에 `codex_model` 키를 추가한다.
- `agents/*.md`를 수정한 뒤 `npm run sync`로 `codex-agents/`를 재생성하고, Claude는 `/reload-plugins`, Codex는 `npm run codex:reinstall`로 갱신한다.
```

이어서 AGENTS.md "생성된 파일은 직접 수정하지 않기" 항목의 커밋 생성물 목록에 `codex-agents/*.toml`을 포함하도록, 해당 불릿 끝 문장에 한 문장 덧붙임:

```markdown
  추가로 `codex-agents/*.toml`은 `scripts/sync-agents.mjs`가 `agents/*.md`에서 생성하는 커밋 생성물이다 — 직접 수정하지 말고 `agents/*.md`를 고친 뒤 `npm run sync`를 실행한다.
```

- [ ] **Step 4: 커밋**

```bash
git add README.md AGENTS.md
git commit -m "docs(agents): document designer agent and dual-tool install" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: 최종 검증

**Files:** 없음(검증만)

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS (기존 48 + Task 1의 8 = 56), fail 0.

- [ ] **Step 2: validate**

Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.` + `sync-agents: codex-agents/ is up to date.`

- [ ] **Step 3: 작업 트리 확인**

Run: `git status --short`
Expected: 비어 있음(모든 변경 커밋됨). `codex-agents/designer.toml`은 추적됨, `plugins/personal/`은 여전히 gitignore.

- [ ] **Step 4: (사용자) Codex 반영**

Run: `npm run codex:reinstall` (codex CLI 필요)
Expected: 스킬 재설치 + `copied designer.toml → ...\.codex\agents` + `1 agent(s) installed`. 이후 Codex 세션 재시작.

- [ ] **Step 5: (사용자 선택) 푸시**

```bash
git push origin main
```
```

---

## Self-Review

**Spec coverage:**
- 단일 소스 → 생성: Task 1(변환)+Task 2(래퍼)+Task 3(소스/생성) ✓
- 필드 매핑(model/tools 제외): Task 1 테스트 + 구현 ✓
- Claude `agents/designer.md` + plugin.json: Task 3 ✓
- Codex `codex-agents/designer.toml` 생성·커밋: Task 3 ✓
- sync/validate/prepare 연결: Task 2 ✓
- Codex 설치(`~/.codex/agents/` 복사): Task 4 ✓
- 문서: Task 5 ✓
- 테스트/validate: Task 1 + Task 6 ✓
- 제약/비대칭(번들 미지원 등): 문서 Task 5에 반영 ✓

**Placeholder scan:** 모든 코드 스텝에 실제 코드/명령/기대 출력 포함. TBD/TODO 없음.

**Type/이름 일관성:** `parseAgentMd`/`toCodexToml`가 Task 1 정의와 Task 2 사용에서 동일. `codex-agents/`, `AGENTS_SRC`, `CODEX_OUT` 경로 일관. `designer` 이름이 소스/생성물/설치에서 일관.
