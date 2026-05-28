# Unify Env on .env Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 비밀/설정의 단일 메커니즘을 `.env`로 통일한다. 스크립트가 `.env`를 직접 읽고(`loadEnv`), Codex 번들에는 sync가 `.env`+`scripts/lib`를 함께 넣어 양쪽에서 동작하게 한다. `setx`/`apply-env`는 폐기한다.

**Architecture:** 공용 `loadEnv()`가 "스크립트 위치 기준 `../../.env`"를 읽어 `process.env`와 병합한다(OS env 우선). 번들이 레포 레이아웃(`scripts/lib/`, 루트 `.env`)을 미러링하므로 동일 상대경로가 Claude(레포 in-place)와 Codex(캐시 스냅샷) 양쪽에서 맞는다.

**Tech Stack:** Node ≥18 ESM, `node:test`, 기존 `parseEnv`/sync 스크립트.

**핵심 경로 검증:**
- `loadEnv` (`scripts/lib/load-env.mjs`): `resolve(__dirname,'..','..','.env')` → Claude `repo/.env`, Codex `plugins/personal/.env`.
- `image-gen.mjs`·`resolve-vault.mjs` (`skills/*/scripts/`): `../../../scripts/lib/load-env.mjs` → Claude `repo/scripts/lib`, Codex `plugins/personal/scripts/lib` (sync가 번들).

---

### Task 1: 공용 `loadEnv()` 헬퍼

**Files:**
- Create: `scripts/lib/load-env.mjs`
- Test: `tests/load-env.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/load-env.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { loadEnv } from '../scripts/lib/load-env.mjs';

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
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/load-env.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/load-env.mjs'`

- [ ] **Step 3: `loadEnv` 구현**

`scripts/lib/load-env.mjs`:
```js
#!/usr/bin/env node
// .env(레포 루트 또는 Codex 번들 루트)를 읽어 process.env와 병합해 반환한다.
// 비밀의 단일 소스는 .env — 스크립트가 직접 읽으므로 편집 즉시 반영된다(Claude in-place).
// Codex는 번들 스냅샷이라 sync가 .env를 번들 루트로 복사하고 같은 상대경로로 읽힌다.
// OS 환경변수가 있으면 그것이 우선한다(임시 오버라이드용).
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parseEnv } from './parse-env.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DEFAULT_ENV_PATH = path.resolve(__dirname, '..', '..', '.env');

export function loadEnv({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const fileEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
  return { ...fileEnv, ...env };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/load-env.test.mjs`
Expected: PASS (3 tests)

- [ ] **Step 5: 커밋**

```bash
git add scripts/lib/load-env.mjs tests/load-env.test.mjs
git commit -m "feat(env): add shared loadEnv() helper reading .env merged with process.env"
```

---

### Task 2: `image-gen.mjs` — `loadEnv` 사용 + 에러 메시지 갱신

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs` (imports, line 118, error block 119–129)

- [ ] **Step 1: import 추가**

`skills/image-gen/scripts/image-gen.mjs` 상단 import 블록(현재 24–25행, `import path from 'node:path';` 다음)에 추가:
```js
import { loadEnv } from '../../../scripts/lib/load-env.mjs';
```

- [ ] **Step 2: 키 읽기 교체**

old_string:
```js
  const apiKey = process.env.OPENAI_API_KEY;
```
new_string:
```js
  const apiKey = loadEnv().OPENAI_API_KEY;
```

- [ ] **Step 3: 에러 메시지에서 `env:apply` 제거**

old_string:
```js
    die(
      [
        '오류: OPENAI_API_KEY 환경변수가 설정돼 있지 않습니다.',
        '`.env`에 적은 뒤 `npm run env:apply`로 OS에 등록하거나, 직접 환경변수로 설정하세요:',
        '  PowerShell: $env:OPENAI_API_KEY = "sk-..."',
        '  bash:       export OPENAI_API_KEY="sk-..."',
      ].join('\n'),
      2,
    );
```
new_string:
```js
    die(
      [
        '오류: OPENAI_API_KEY 가 설정돼 있지 않습니다.',
        '플러그인 루트의 `.env`에 OPENAI_API_KEY=sk-... 를 추가하세요 (저장 즉시 반영, 재시작 불필요).',
        'Codex에서는 `.env` 수정 후 `npm run codex:reinstall`로 번들을 갱신하세요.',
        '또는 직접 환경변수로: PowerShell `$env:OPENAI_API_KEY = "sk-..."`, bash `export OPENAI_API_KEY="sk-..."`.',
      ].join('\n'),
      2,
    );
```

- [ ] **Step 4: dry-run 동작 확인 (키 불필요 경로)**

Run: `node skills/image-gen/scripts/image-gen.mjs --prompt "hi" --out ./tmp-x.png --dry-run`
Expected: `[dry-run]` 출력, 에러 없음. (loadEnv import가 깨지지 않았는지 확인)

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs
git commit -m "feat(image-gen): read OPENAI_API_KEY via loadEnv (.env-direct), drop env:apply guidance"
```

---

### Task 3: `resolve-vault.mjs` — 공용 `loadEnv`로 리팩터 + librarian 테스트 갱신

**Files:**
- Modify: `skills/librarian/scripts/resolve-vault.mjs` (imports, 함수 head)
- Modify: `tests/librarian-resolve-vault.test.mjs` (fake-root에 load-env.mjs 복사)

- [ ] **Step 1: librarian 테스트의 fake-root에 load-env 복사 추가**

`tests/librarian-resolve-vault.test.mjs`에서 `PARSE_ENV` 상수 다음에 추가:
```js
const LOAD_ENV = path.join(PLUGIN_ROOT, 'scripts', 'lib', 'load-env.mjs');
```
그리고 `runResolverWithFakeRoot` 안 `copyFileSync(PARSE_ENV, ...)` 다음 줄에 추가:
```js
  copyFileSync(LOAD_ENV, path.join(libDir, 'load-env.mjs'));
```

- [ ] **Step 2: 테스트 실패 확인 (아직 resolve-vault가 load-env를 안 씀 → 통과하지만 무의미; 리팩터 후 깨지지 않아야 함)**

Run: `node --test tests/librarian-resolve-vault.test.mjs`
Expected: PASS (리팩터 전이므로 기존대로 통과). 이 단계는 baseline 확인용.

- [ ] **Step 3: `resolve-vault.mjs` 리팩터**

파일 전체에서 imports와 함수 head를 교체한다.

old_string:
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
```
new_string:
```js
#!/usr/bin/env node
import { existsSync, statSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadEnv, DEFAULT_ENV_PATH } from '../../../scripts/lib/load-env.mjs';

const VAR = 'LIBRARIAN_VAULT_PATH';
const REQUIRED = ['AGENTS.md', 'index.md'];

export function resolveVaultPath({ envPath = DEFAULT_ENV_PATH, env = process.env } = {}) {
  const merged = loadEnv({ envPath, env });
  const raw = (merged[VAR] ?? '').trim();
```

(이후 본문·`isMain` 블록은 그대로 둔다. `isMain`은 `pathToFileURL`만 쓰므로 `fileURLToPath` 제거가 안전하다.)

- [ ] **Step 4: librarian 테스트 통과 확인**

Run: `node --test tests/librarian-resolve-vault.test.mjs`
Expected: PASS (7 tests). 특히 `process env overrides the .env file value`, `reads the path from the .env file`, CLI 통합 2건이 통과해야 한다 (fake-root에 load-env.mjs 복사가 반영됨).

- [ ] **Step 5: 커밋**

```bash
git add skills/librarian/scripts/resolve-vault.mjs tests/librarian-resolve-vault.test.mjs
git commit -m "refactor(librarian): use shared loadEnv() in resolve-vault, bundle load-env in test root"
```

---

### Task 4: `sync-codex-plugin` — `scripts/lib`+`.env`를 번들에 포함

**Files:**
- Modify: `scripts/sync-codex-plugin.mjs` (`buildBundle`, `readExistingBundle`, `writeBundle`, `syncBundle`, `isMain`, 헤더 주석)
- Test: `tests/sync-codex-plugin.test.mjs` (신규 케이스 추가)

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/sync-codex-plugin.test.mjs`의 `makeSkill` 헬퍼 다음에 헬퍼와 테스트를 추가:
```js
function makeLib(libSrc, name, body) {
  mkdirSync(libSrc, { recursive: true });
  writeFileSync(path.join(libSrc, name), body, 'utf8');
}

test('buildBundle includes scripts/lib files when libSrc is given', () => {
  const skillsSrc = tmp();
  const libSrc = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeLib(libSrc, 'load-env.mjs', '// load');
  const bundle = buildBundle(skillsSrc, { libSrc });
  assert.equal(bundle.get('scripts/lib/load-env.mjs'), '// load');
  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(libSrc, { recursive: true, force: true });
});

test('buildBundle includes .env when envPath exists, omits when absent', () => {
  const skillsSrc = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  const envDir = tmp();
  const envPath = path.join(envDir, '.env');
  writeFileSync(envPath, 'OPENAI_API_KEY=sk-test\n', 'utf8');
  const withEnv = buildBundle(skillsSrc, { envPath });
  assert.equal(withEnv.get('.env'), 'OPENAI_API_KEY=sk-test\n');
  const noEnv = buildBundle(skillsSrc, { envPath: path.join(envDir, 'nope.env') });
  assert.equal(noEnv.has('.env'), false);
  rmSync(skillsSrc, { recursive: true, force: true });
  rmSync(envDir, { recursive: true, force: true });
});

test('write mode bundles lib + .env, check mode then passes', () => {
  const skillsSrc = tmp();
  const libSrc = tmp();
  const bundleDir = tmp();
  const envDir = tmp();
  makeSkill(skillsSrc, 'design-brand-kit', '# brand');
  makeLib(libSrc, 'load-env.mjs', '// load');
  const envPath = path.join(envDir, '.env');
  writeFileSync(envPath, 'OPENAI_API_KEY=sk-test\n', 'utf8');

  const w = syncBundle({ skillsSrc, libSrc, envPath, bundleDir, mode: 'write', log: quiet });
  assert.equal(w.ok, true);
  assert.equal(readFileSync(path.join(bundleDir, 'scripts', 'lib', 'load-env.mjs'), 'utf8'), '// load');
  assert.equal(readFileSync(path.join(bundleDir, '.env'), 'utf8'), 'OPENAI_API_KEY=sk-test\n');

  const c = syncBundle({ skillsSrc, libSrc, envPath, bundleDir, mode: 'check', log: quiet });
  assert.equal(c.ok, true);
  assert.deepEqual(c.failures, []);

  [skillsSrc, libSrc, bundleDir, envDir].forEach((d) => rmSync(d, { recursive: true, force: true }));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/sync-codex-plugin.test.mjs`
Expected: FAIL — `scripts/lib/...`·`.env`가 번들에 없음(`buildBundle`이 옵션 무시).

- [ ] **Step 3: `sync-codex-plugin.mjs` 구현**

`PLUGIN_ROOT` 정의 다음 상수 추가:
```js
const LIB_SRC = path.join(PLUGIN_ROOT, 'scripts', 'lib');
const ENV_SRC = path.join(PLUGIN_ROOT, '.env');
```

`buildBundle` 교체:
```js
export function buildBundle(skillsSrc, { libSrc, envPath } = {}) {
  const files = new Map();
  files.set('.codex-plugin/plugin.json', manifestText());
  for (const rel of collectFiles(skillsSrc)) {
    files.set('skills/' + rel.split(path.sep).join('/'), readFileSync(path.join(skillsSrc, rel), 'utf8'));
  }
  if (libSrc) {
    for (const rel of collectFiles(libSrc)) {
      files.set('scripts/lib/' + rel.split(path.sep).join('/'), readFileSync(path.join(libSrc, rel), 'utf8'));
    }
  }
  if (envPath && existsSync(envPath)) {
    files.set('.env', readFileSync(envPath, 'utf8'));
  }
  return files;
}
```

`readExistingBundle` 교체:
```js
function readExistingBundle(bundleDir) {
  const files = new Map();
  const manifestAbs = path.join(bundleDir, '.codex-plugin', 'plugin.json');
  if (existsSync(manifestAbs)) files.set('.codex-plugin/plugin.json', readFileSync(manifestAbs, 'utf8'));
  const skillsDir = path.join(bundleDir, 'skills');
  for (const rel of collectFiles(skillsDir)) {
    files.set('skills/' + rel.split(path.sep).join('/'), readFileSync(path.join(skillsDir, rel), 'utf8'));
  }
  const libDir = path.join(bundleDir, 'scripts', 'lib');
  for (const rel of collectFiles(libDir)) {
    files.set('scripts/lib/' + rel.split(path.sep).join('/'), readFileSync(path.join(libDir, rel), 'utf8'));
  }
  const envAbs = path.join(bundleDir, '.env');
  if (existsSync(envAbs)) files.set('.env', readFileSync(envAbs, 'utf8'));
  return files;
}
```

`writeBundle` 교체 (stale 서브트리 정리 확장):
```js
function writeBundle(bundleDir, desired) {
  // skills/·scripts/·.env 를 갈아엎어 삭제된 소스가 남지 않게 한다.
  rmSync(path.join(bundleDir, 'skills'), { recursive: true, force: true });
  rmSync(path.join(bundleDir, 'scripts'), { recursive: true, force: true });
  rmSync(path.join(bundleDir, '.env'), { force: true });
  for (const [rel, text] of desired) {
    const abs = path.join(bundleDir, rel.split('/').join(path.sep));
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, text, 'utf8');
  }
}
```

`syncBundle` 시그니처에 `libSrc`, `envPath` 추가하고 `buildBundle` 호출에 전달:
```js
export function syncBundle({ skillsSrc, libSrc, envPath, bundleDir, mode = 'write', log = console } = {}) {
  const desired = buildBundle(skillsSrc, { libSrc, envPath });
```
(이하 본문 동일.)

`isMain` 블록의 `syncBundle` 호출에 전달:
```js
  const result = syncBundle({
    skillsSrc: SKILLS_SRC,
    libSrc: LIB_SRC,
    envPath: ENV_SRC,
    bundleDir: BUNDLE_DIR,
    mode: parseMode(process.argv.slice(2)),
  });
```

헤더 주석(파일 상단)에 한 줄 추가: 번들이 이제 `scripts/lib/`와 (있으면) 루트 `.env`도 미러링한다는 설명.

- [ ] **Step 4: 테스트 통과 확인 (신규 + 기존)**

Run: `node --test tests/sync-codex-plugin.test.mjs`
Expected: PASS (기존 6 + 신규 3). 기존 `buildBundle(skillsSrc)` 무옵션 케이스도 통과해야 한다.

- [ ] **Step 5: 커밋**

```bash
git add scripts/sync-codex-plugin.mjs tests/sync-codex-plugin.test.mjs
git commit -m "feat(sync): bundle scripts/lib and .env into Codex plugin for .env-direct reads"
```

---

### Task 5: `apply-env`/`setx` 폐기

**Files:**
- Delete: `scripts/apply-env.mjs`
- Delete: `tests/apply-env.test.mjs`
- Modify: `package.json` (`env:apply` 스크립트 제거)

- [ ] **Step 1: 파일 삭제**

```bash
git rm scripts/apply-env.mjs tests/apply-env.test.mjs
```

- [ ] **Step 2: `package.json`에서 `env:apply` 제거**

old_string:
```json
    "env:apply": "node scripts/apply-env.mjs",
```
new_string: (해당 줄 완전 삭제 — 위 줄 `codex:reinstall`의 끝 쉼표는 유지)

- [ ] **Step 3: 잔여 참조 없는지 확인**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
Expected: 에러 없음 (유효한 JSON).
Run: `git grep -n "apply-env\|env:apply" -- ':!docs/superpowers/plans/2026-05-2*'`
Expected: 코드/문서에 잔여 참조 없음 (docs의 과거 플랜 기록은 제외).

- [ ] **Step 4: 커밋**

```bash
git add package.json
git commit -m "chore(env): retire apply-env/setx — .env is the single mechanism"
```

---

### Task 6: `.env.example` 생성기 문구 갱신

**Files:**
- Modify: `scripts/lib/transform-mcp.mjs` (line ~31, 생성되는 `.env.example` 헤더)

- [ ] **Step 1: 생성기 문구 교체**

`scripts/lib/transform-mcp.mjs`에서 해당 줄을 먼저 읽어 정확한 문맥을 확인한 뒤 교체.

old_string:
```js
    '# .env로 복사해 값을 채운 뒤 `npm run env:apply` 실행.',
```
new_string:
```js
    '# .env로 복사해 값을 채우면 스크립트가 바로 읽습니다 (재시작·apply 불필요).',
    '# Codex는 .env 수정 후 `npm run codex:reinstall`로 번들을 갱신하세요.',
```

- [ ] **Step 2: 커밋 (재생성은 Task 8의 sync에서 일괄)**

```bash
git add scripts/lib/transform-mcp.mjs
git commit -m "docs(env): update generated .env.example header for .env-direct model"
```

---

### Task 7: 문서 갱신 (env:apply 흔적 제거)

**Files:**
- Modify: `README.md` (lines ~72, ~97, ~102)
- Modify: `AGENTS.md` (env 불릿 — "`.env` 값을 OS 환경변수로 (`npm run env:apply`)" 단락)
- Modify: `skills/image-gen/SKILL.md` (line ~18)
- Modify: `skills/design-brand-kit/SKILL.md` (line ~227)
- Modify: `skills/design-page-image/SKILL.md` (line ~98)
- Modify: `agents/designer.md` (line ~23)

각 파일에서 `npm run env:apply` 언급을 ".env에 적으면 바로 읽힘 (Claude 즉시; Codex는 `npm run codex:reinstall`)" 취지로 교체한다. 구현자는 각 파일의 해당 줄을 읽어 자연스러운 문장으로 바꾼다.

- [ ] **Step 1: AGENTS.md env 단락 재작성**

기존 "**`.env` 값을 OS 환경변수로 (`npm run env:apply`)**" 단락 전체를 아래로 교체:
```md
- **`.env`가 비밀의 단일 소스**: 스크립트는 공용 `loadEnv()`(`scripts/lib/load-env.mjs`)로 `.env`를 직접 읽는다(OS 환경변수가 있으면 그것이 우선). `.env`만 고치면 Claude는 즉시 반영된다. Codex는 번들 스냅샷이라 `npm run codex:reinstall`로 갱신하면 `scripts/sync-codex-plugin.mjs`가 `.env`와 `scripts/lib/`를 번들에 복사한다(둘 다 gitignore된 로컬 생성물). MCP 서버가 `${VAR}`를 OS env에서 치환해야 하는 경우는 별도지만, 현재 MCP 서버는 없다.
```

- [ ] **Step 2: README.md 3개 지점 교체**

- line ~72 `scripts/apply-env.mjs` 항목: 삭제하고, 대신 `scripts/lib/load-env.mjs`(`.env`+process.env 병합, 스크립트가 직접 읽음)를 설명하는 항목으로 교체.
- line ~97·~102: `npm run env:apply` 안내를 ".env에 적으면 바로 읽힘 — Codex는 `npm run codex:reinstall`" 로 교체.

- [ ] **Step 3: 스킬/에이전트 3+1개 지점 교체**

`skills/image-gen/SKILL.md:18`, `skills/design-brand-kit/SKILL.md:227`, `skills/design-page-image/SKILL.md:98`, `agents/designer.md:23` 에서 `(`.env` + `npm run env:apply`)` 패턴을 `(`.env` — 저장 즉시 반영; Codex는 `npm run codex:reinstall`)` 로 교체.

- [ ] **Step 4: 문서 정합성 확인**

Run: `git grep -n "env:apply\|apply-env\|setx" -- ':!docs/superpowers/plans/2026-05-2*'`
Expected: 잔여 없음.

- [ ] **Step 5: 커밋**

```bash
git add README.md AGENTS.md skills/image-gen/SKILL.md skills/design-brand-kit/SKILL.md skills/design-page-image/SKILL.md agents/designer.md
git commit -m "docs: replace env:apply guidance with .env-direct + codex:reinstall model"
```

---

### Task 8: gitignore 확인 + sync + 전체 검증 + 최종 커밋

**Files:**
- Verify: `.gitignore` (`plugins/personal/`, `.env`)
- Generated: `.env.example`, `codex-agents/designer.toml`, `plugins/personal/**` (sync 재생성)

- [ ] **Step 1: gitignore 확인**

Run: `git check-ignore -v plugins/personal/.env .env plugins/personal/scripts/lib/load-env.mjs`
Expected: 세 경로 모두 무시됨(번들에 복사될 `.env`/생성물이 커밋되지 않음). 무시 안 되면 `.gitignore`에 `plugins/personal/` 추가.

- [ ] **Step 2: sync 실행 (번들·생성물 재생성)**

Run: `npm run sync`
Expected: 에러 없음. `sync-codex-plugin`이 `plugins/personal/`에 `scripts/lib/`·`.env`(존재 시)를 포함해 기록. `.env.example`·`codex-agents/designer.toml` 갱신.

- [ ] **Step 3: 번들이 self-contained인지 확인**

Run: `node -e "const{existsSync}=require('fs');const p='plugins/personal';console.log('lib:',existsSync(p+'/scripts/lib/load-env.mjs'),'parse:',existsSync(p+'/scripts/lib/parse-env.mjs'))"`
Expected: `lib: true parse: true`.

- [ ] **Step 4: 전체 테스트 + validate**

Run: `npm test`
Expected: 모든 테스트 PASS (load-env, librarian, sync-codex-plugin 포함; apply-env 테스트는 삭제됨).
Run: `npm run validate`
Expected: `sync-mcp`·`sync-agents` up to date.

- [ ] **Step 5: 최종 커밋 (생성물 — `.env.example`, `codex-agents/`만; `plugins/personal/`은 gitignore)**

```bash
git add .env.example codex-agents/designer.toml docs/superpowers/plans/2026-05-28-unify-env-on-dotenv.md
git status --short   # plugins/personal/ 가 스테이지에 없어야 함
git commit -m "chore(sync): regenerate .env.example and agent bundle for .env-direct model"
```

---

## Self-Review

- **Spec coverage:** loadEnv 헬퍼(T1) ✓, image-gen 전환(T2) ✓, librarian 통일·테스트(T3) ✓, Codex 번들에 lib+.env(T4) ✓, setx 폐기(T5) ✓, 생성기 문구(T6) ✓, 문서(T7) ✓, gitignore+sync+검증(T8) ✓.
- **Placeholder scan:** 모든 코드 단계에 실제 코드/명령 포함. 문서 교체는 대상 줄·새 문구 명시.
- **Type consistency:** `loadEnv({ envPath, env })`·`DEFAULT_ENV_PATH` 시그니처가 T1 정의와 T2/T3 사용에서 일치. `buildBundle(skillsSrc, { libSrc, envPath })`·`syncBundle({..., libSrc, envPath})`가 T4 정의·테스트·isMain에서 일치.
- **Codex 경로 검증:** 번들이 레포 레이아웃 미러 → `loadEnv`의 `../../.env`, 스킬 스크립트의 `../../../scripts/lib`가 양쪽에서 동일하게 해석됨(헤더 "핵심 경로 검증" 참조).
