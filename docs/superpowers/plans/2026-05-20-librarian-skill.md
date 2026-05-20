# librarian skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** kb 지식 베이스를 운영하는 `librarian` 스킬과, vault 경로를 `.env`에서 해석하는 리졸버 스크립트를 추가한다.

**Architecture:** vault 경로는 `.env`의 `LIBRARIAN_VAULT_PATH`로 설정한다. 스킬은 markdown이라 `.env`를 못 읽으므로 skill 전용 리졸버(`skills/librarian/scripts/resolve-vault.mjs`)가 루트 공유 라이브러리 `scripts/lib/parse-env.mjs`를 재사용해 경로를 해석·검증하고 stdout으로 절대경로를 출력한다. 스킬은 그 경로의 `AGENTS.md`를 단일 진실원천으로 읽어 ingest/query/lint를 수행하고, vault 자체 git 저장소에 커밋한다.

**Tech Stack:** Node.js (ESM, `node:test`), Claude Code + Codex 공용 플러그인 스킬(markdown).

**Spec:** `docs/superpowers/specs/2026-05-20-librarian-skill-design.md`

---

## File Structure

| 파일 | 역할 |
|---|---|
| `skills/librarian/scripts/resolve-vault.mjs` | (신규) `LIBRARIAN_VAULT_PATH` 해석 + kb 구조 검증 + 절대경로 출력. `resolveVaultPath()` 함수 export + CLI 진입점. |
| `tests/librarian-resolve-vault.test.mjs` | (신규) 리졸버 단위 + CLI 통합 테스트. |
| `skills/librarian/SKILL.md` | (신규) 스킬 본문 — vault 해석, ingest/query/lint 절차, vault 저장소 커밋. |
| `scripts/lib/parse-env.mjs` | (기존, 변경 없음) 리졸버가 상대경로로 재사용. |
| `AGENTS.md` | (수정) `LIBRARIAN_VAULT_PATH` 설정 문서 한 줄 추가. |

`skills/librarian/references/` (ingest/query/lint 분리)는 SKILL.md가 길어질 때만 도입 — 이번 범위 밖(YAGNI).

---

## Task 1: vault 리졸버 + 테스트

**Files:**
- Create: `skills/librarian/scripts/resolve-vault.mjs`
- Test: `tests/librarian-resolve-vault.test.mjs`
- Reuse (no change): `scripts/lib/parse-env.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/librarian-resolve-vault.test.mjs`:

```js
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
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../skills/librarian/scripts/resolve-vault.mjs'` (모듈 미존재).

- [ ] **Step 3: 리졸버 구현**

`skills/librarian/scripts/resolve-vault.mjs`:

```js
#!/usr/bin/env node
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { parseEnv } from '../../../scripts/lib/parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_ENV_PATH = path.join(PLUGIN_ROOT, '.env');
const VAR = 'LIBRARIAN_VAULT_PATH';
const REQUIRED = ['AGENTS.md', 'index.md'];

export function resolveVaultPath({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  const merged = { ...fileEnv, ...env }; // process env wins over .env file
  const raw = (merged[VAR] ?? '').trim();
  if (!raw) {
    throw new Error(
      `${VAR} is not set. Add it to ${envPath} ` +
        `(e.g. ${VAR}=C:\\Users\\you\\work\\docs\\kb) or export it as an environment variable.`,
    );
  }
  const vaultPath = path.resolve(raw);
  if (!existsSync(vaultPath) || !statSync(vaultPath).isDirectory()) {
    throw new Error(`${VAR} points to "${vaultPath}", which is not an existing directory.`);
  }
  const missing = REQUIRED.filter((f) => !existsSync(path.join(vaultPath, f)));
  if (missing.length > 0) {
    throw new Error(
      `"${vaultPath}" is not a kb vault (missing ${missing.join(', ')}). Check ${VAR}.`,
    );
  }
  return vaultPath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    process.stdout.write(resolveVaultPath() + '\n');
  } catch (err) {
    process.stderr.write(err.message + '\n');
    process.exit(1);
  }
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `npm test`
Expected: PASS — 새 8개 테스트 포함 전체 통과.

- [ ] **Step 5: 커밋**

```bash
git add skills/librarian/scripts/resolve-vault.mjs tests/librarian-resolve-vault.test.mjs
git commit -m "feat(librarian): add vault path resolver (.env LIBRARIAN_VAULT_PATH)"
```

---

## Task 2: librarian SKILL.md

**Files:**
- Create: `skills/librarian/SKILL.md`

플러그인 규약(CLAUDE.md)상 스킬 추가는 `superpowers:writing-skills`를 따른다. 아래 내용을 작성하되, frontmatter·서술 형식은 writing-skills 규약(공통 키 `name`/`description`, 트리거 잘 걸리는 3인칭 description)으로 검토한다.

- [ ] **Step 1: writing-skills 규약 확인**

`superpowers:writing-skills` 스킬을 호출해 frontmatter/구조 규약을 확인한다 (플러그인 CLAUDE.md 요구사항).

- [ ] **Step 2: SKILL.md 작성**

`skills/librarian/SKILL.md`:

```markdown
---
name: librarian
description: kb 지식 베이스에 소스를 입수(ingest)·질의(query)·점검(lint)할 때 사용. 소스를 요약해 sources/entities/concepts/syntheses 페이지로 정리하고 교차링크·index·log를 갱신한 뒤 vault 저장소에 커밋한다.
---

# librarian

`kb` 지식 베이스(LLM Wiki)를 운영한다: 입수(ingest) → 목록화 → 교차참조 → 열람(query) → 점검(lint).

이 스킬은 **운영 절차**만 담는다. 페이지 구조·frontmatter·계약은 **vault의 `AGENTS.md`가 단일 진실원천**이다 — 여기서 재기술하지 않는다.

## 0. vault 위치 확인 (모든 operation 공통 첫 단계)

이 스킬 디렉터리의 리졸버로 vault 절대경로를 얻는다:

\`\`\`
node "<이 스킬 디렉터리>/scripts/resolve-vault.mjs"
\`\`\`

- stdout의 절대경로를 이후 `$VAULT`로 사용한다.
- 종료 코드가 0이 아니면 stderr 안내대로 `.env`에 `LIBRARIAN_VAULT_PATH`를 설정하라고 사용자에게 알리고 **중단**한다. 추측으로 경로를 만들거나 다른 vault(예: 보관함)를 건드리지 않는다.

이어서 `$VAULT/AGENTS.md`를 읽어 페이지 계약을 로드한다.

## 1. ingest — 소스 입수

입력: 메시지 안의 소스 path 또는 URL (자연어로 전달; 형식 인자에 의존하지 않는다).

소스 인자 규칙 (raw 불변):
- path가 `$VAULT/raw/` 안 → 그대로 사용.
- path가 `raw/` 밖이거나 URL → 먼저 `$VAULT/raw/`에 clip·저장 후 사용 (원본 영구 보존).
- 소스 미지정 → `$VAULT/raw/`에서 대응 source 페이지가 없는 미처리 파일을 스캔.

절차:
1. 소스를 읽는다. 이미지가 있으면 직접 보고 핵심을 글로 옮긴다 (vault는 text-only).
2. **triage**: 핵심 takeaway를 사용자와 확인한다 (무인 발사 아님).
3. `$VAULT/sources/`에 요약 페이지를 쓴다 (AGENTS.md의 source 계약).
4. 건드린 `entities/`·`concepts/`·`syntheses/`를 생성·갱신하고 교차링크한다. 새 데이터가 기존 주장과 충돌하면 모순을 표시한다. 고립 노드 금지 — 모든 새 페이지는 최소 1개 outbound wikilink.
5. `$VAULT/index.md`를 갱신하고, `$VAULT/log.md`에 `## [YYYY-MM-DD] ingest | 제목`을 추가한다.
6. **커밋**(아래 커밋 규약).

## 2. query — 질의

1. `$VAULT/index.md`로 관련 페이지를 찾아 읽는다.
2. 출처를 인용해 답한다.
3. 답이 새 비교·연결·분석을 담으면 `$VAULT/syntheses/`나 `concepts/`에 되먹이고 `index`·`log`를 갱신한 뒤 커밋한다.

## 3. lint — 점검

다음을 점검해 리포트한다:
- 모순, 낡은 주장(새 소스가 갱신한 것)
- 고아 페이지(인바운드 링크 0), 누락된 교차링크
- 페이지가 없는 핵심 개념
- `index.md` 정합성

리포트 + 다음에 조사할 질문/소스를 제안한다. 수정을 적용했으면 커밋한다.

## 커밋 규약

- 커밋은 항상 **vault 저장소**에서: `git -C "$VAULT" add -A && git -C "$VAULT" commit -m "<op>: <제목>"`. 플러그인 repo가 아니다.
- 기본은 자동 커밋. 사용자가 원하면 커밋 전 확인으로 전환한다.

## 멀티 에이전트

Claude 도구명을 사용한다. Codex 등 다른 에이전트에서는 동등한 셸/파일 도구로 대응한다 (리졸버 호출은 셸 실행만 필요).
```

> 참고: 위 코드블록 안의 `\`\`\`` 펜스는 SKILL.md에 실제로 쓸 때 일반 ``` 펜스로 둔다 (여기서는 중첩 표시를 위해 이스케이프).

- [ ] **Step 3: 리졸버 연동 스모크 확인**

Run: `node skills/librarian/scripts/resolve-vault.mjs`
Expected: 실제 `.env`의 `LIBRARIAN_VAULT_PATH`(`C:\Users\ansgu\work\docs\kb`)가 출력되고 exit 0. (SKILL.md 0절에 적은 명령이 그대로 동작함을 확인.)

- [ ] **Step 4: frontmatter 확인**

`skills/librarian/SKILL.md`에 `name: librarian`과 트리거용 `description`이 있는지 확인.

- [ ] **Step 5: 커밋**

```bash
git add skills/librarian/SKILL.md
git commit -m "feat(librarian): add SKILL.md (ingest/query/lint over kb vault)"
```

---

## Task 3: 문서화 + 최종 검증

**Files:**
- Modify: `AGENTS.md` (플러그인 루트)

- [ ] **Step 1: AGENTS.md에 `LIBRARIAN_VAULT_PATH` 문서 추가**

`AGENTS.md`의 `## 스킬` 섹션 끝에 다음 bullet을 추가한다:

```markdown
- `librarian` 스킬은 운영 대상 vault(kb) 경로를 `.env`의 `LIBRARIAN_VAULT_PATH`에서 읽습니다 (gitignore된 머신별 로컬 값 — `.env.example`에는 없음). 설정이 없거나 잘못되면 `skills/librarian/scripts/resolve-vault.mjs`가 안내와 함께 실패합니다.
```

- [ ] **Step 2: 전체 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 기존 + 신규 테스트 전체 통과.

- [ ] **Step 3: sync 무결성 확인 (MCP 생성 파일 영향 없음 확인)**

Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.` (이 작업은 `mcp.servers.json`을 안 건드리므로 영향 없음.)

- [ ] **Step 4: 리졸버 스모크**

Run: `node skills/librarian/scripts/resolve-vault.mjs`
Expected: `C:\Users\ansgu\work\docs\kb` 출력, exit 0.

- [ ] **Step 5: 커밋**

```bash
git add AGENTS.md
git commit -m "docs: document LIBRARIAN_VAULT_PATH for the librarian skill"
```

- [ ] **Step 6: 수동 스킬 테스트 (사람 확인)**

`claude --plugin-dir .`로 세션을 열고 librarian을 호출해 query/ingest가 vault를 올바로 잡는지 확인한다 (자동화 불가 — 사람 검증). Codex에서도 동일 확인.

---

## Self-Review

- **Spec coverage:**
  - §4 vault 경로 해석(env, 우선순위, 검증, stdout/stderr) → Task 1.
  - §5 `.env.example` 미수정 + 3곳 문서화 → 리졸버 에러(Task 1), SKILL.md(Task 2), AGENTS.md(Task 3). `.env.example`은 어느 task도 안 건드림 ✓.
  - §6 호출 인터페이스(자연어 path/URL) → SKILL.md ingest 절(Task 2).
  - §7 ingest/query/lint → SKILL.md(Task 2).
  - §8 vault 저장소 git 커밋 → SKILL.md 커밋 규약(Task 2).
  - §9 파일 구조(스킬 안 리졸버, 루트 lib, 루트 tests) → Task 1/2 경로 ✓.
  - §10 멀티 에이전트 → SKILL.md(Task 2).
- **Placeholder scan:** 모든 코드/명령/SKILL 본문이 구체적. `references/`는 의도적으로 범위 밖(YAGNI)으로 명시.
- **Type consistency:** `resolveVaultPath({ envPath, env })` 시그니처, `LIBRARIAN_VAULT_PATH` 변수명, 에러 메시지 정규식(`is not set` / `not an existing directory` / `not a kb vault \(missing ...\)`)이 테스트와 구현에서 일치.
