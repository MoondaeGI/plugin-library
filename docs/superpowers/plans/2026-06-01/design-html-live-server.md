# design HTML 라이브 프리뷰 (serve-design) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** design 스킬이 산출한 HTML을 자동으로 브라우저에 띄우고, 파일이 바뀌면 자동 새로고침되는 공유 라이브 프리뷰 런처(`scripts/serve-design.mjs`)를 만들고 `design-brand-kit`에 배선한다.

**Architecture:** 얇은 런처가 인자/경로를 검증해 `five-server` 옵션으로 변환하고 five-server를 기동한다. watch·자동 새로고침·브라우저 오픈·OS 분기는 전부 five-server에 위임(우리는 구현하지 않음). 런처는 `--print-options`로 옵션 해석만 출력해(서버 미기동) 기존 `spawnSync` 블랙박스 테스트 패턴으로 검증한다. five-server는 실제 기동 시에만 lazy `import()` → 테스트는 의존성 없이 동작.

**Tech Stack:** Node.js 22 (ESM, `"type":"module"`), `five-server`(devDependency), `node:test` + `node:assert/strict`.

**참고 스펙:** `docs/superpowers/specs/2026-06-01/design-html-live-server-design.md`

---

## File Structure

- **Create** `scripts/serve-design.mjs` — 공유 런처(얇은 래퍼). 책임: argv→five-server 옵션 변환 + 기동. 여러 design 스킬이 공유(`AGENTS.md` 규칙대로 최상위 `scripts/`로 승격).
- **Create** `tests/serve-design.test.mjs` — `--print-options` 출력·종료코드를 `spawnSync`로 검증.
- **Modify** `package.json` — `devDependencies`에 `five-server` 추가(`npm install --save-dev`).
- **Modify** `skills/design-brand-kit/SKILL.md` — overview.html 저작 흐름에 "라이브 프리뷰" 배선.

> node_modules는 이미 `.gitignore`(27행), `package-lock.json`은 추적 중 → 추가 gitignore/승인 불필요.

---

### Task 1: 런처 + 테스트 (TDD)

**Files:**
- Create: `tests/serve-design.test.mjs`
- Create: `scripts/serve-design.mjs`

- [ ] **Step 1: 실패 테스트 작성** — `tests/serve-design.test.mjs` 전체를 작성한다.

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'scripts', 'serve-design.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function tmpDirWithHtml() {
  const d = mkdtempSync(path.join(tmpdir(), 'sd-'));
  writeFileSync(path.join(d, 'overview.html'), '<!doctype html><title>x</title>', 'utf8');
  return d;
}

test('디렉터리 입력 → root=그 dir, open=true, 기본 포트', () => {
  const d = tmpDirWithHtml();
  const res = run([d, '--print-options']);
  assert.equal(res.status, 0, res.stderr);
  const o = JSON.parse(res.stdout);
  assert.equal(o.root, path.resolve(d));
  assert.equal(o.open, true);
  assert.equal(o.port, 5500);
});

test('HTML 파일 입력 → root=부모, open=파일명', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([path.join(d, 'overview.html'), '--print-options']).stdout);
  assert.equal(o.root, path.resolve(d));
  assert.equal(o.open, 'overview.html');
});

test('--port N → 포트 반영', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([d, '--port', '8080', '--print-options']).stdout);
  assert.equal(o.port, 8080);
});

test('--no-open → open=false', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([d, '--no-open', '--print-options']).stdout);
  assert.equal(o.open, false);
});

test('HTML 파일 + --no-open → open=false', () => {
  const d = tmpDirWithHtml();
  const o = JSON.parse(run([path.join(d, 'overview.html'), '--no-open', '--print-options']).stdout);
  assert.equal(o.open, false);
});

test('존재하지 않는 경로 → 종료코드 2 + stderr', () => {
  const res = run([path.join(tmpdir(), 'nope-xyz-123-sd'), '--print-options']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없/);
});

test('경로 인자 없음 → 종료코드 2 + usage', () => {
  const res = run(['--print-options']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /사용:/);
});

test('알 수 없는 플래그 → 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--bogus', '--print-options']).status, 2);
});

test('--port 값이 숫자가 아니면 종료코드 2', () => {
  const d = tmpDirWithHtml();
  assert.equal(run([d, '--port', 'abc', '--print-options']).status, 2);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test "tests/serve-design.test.mjs"`
Expected: FAIL — 모든 테스트가 status 2(스크립트 파일 없음 → node가 모듈 못 찾아 비정상 종료)나 JSON 파싱 실패로 떨어진다. (`scripts/serve-design.mjs` 가 아직 없음.)

- [ ] **Step 3: 런처 구현** — `scripts/serve-design.mjs` 작성.

```js
#!/usr/bin/env node
// design HTML 라이브 프리뷰 런처 (얇은 래퍼)
//
// 책임: 인자/경로를 검증해 five-server 옵션으로 변환하고 five-server를 기동한다.
//   파일 watch·자동 새로고침·브라우저 오픈·OS 분기는 전부 five-server에 위임한다 —
//   이 스크립트는 그 로직을 구현하지 않는다. (overview.html은 형제 assets/ 상대경로라
//   서빙 루트만 맞으면 그대로 동작.)
//
// 사용: node scripts/serve-design.mjs <dir|html경로> [--port N] [--no-open]
//       node scripts/serve-design.mjs <...> --print-options   # 옵션만 출력, 서버 미기동(테스트용)
//
// 여러 design 스킬(design-brand-kit·design-html-prototype 등)이 공유한다.

import { statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

const DEFAULT_PORT = 5500;

class ServeDesignError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServeDesignError";
  }
}

function parseArgs(argv) {
  const out = { target: undefined, port: DEFAULT_PORT, open: true, printOptions: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-open") {
      out.open = false;
    } else if (a === "--print-options") {
      out.printOptions = true;
    } else if (a === "--port") {
      const v = argv[++i];
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0) throw new ServeDesignError(`--port 값이 올바르지 않습니다: ${v}`);
      out.port = n;
    } else if (a.startsWith("--")) {
      throw new ServeDesignError(`알 수 없는 인자: ${a}`);
    } else if (out.target === undefined) {
      out.target = a;
    } else {
      throw new ServeDesignError(`인자가 너무 많습니다: ${a}`);
    }
  }
  if (out.target === undefined) {
    throw new ServeDesignError("사용: serve-design.mjs <dir|html경로> [--port N] [--no-open]");
  }
  return out;
}

// target 경로 → five-server {root, open}. dir이면 root=dir; 파일이면 root=부모·open=파일명.
function resolveTarget(target, openFlag) {
  const abs = resolve(target);
  let stat;
  try {
    stat = statSync(abs);
  } catch {
    throw new ServeDesignError(`경로를 찾을 수 없습니다: ${abs}`);
  }
  if (stat.isDirectory()) {
    return { root: abs, open: openFlag ? true : false };
  }
  return { root: dirname(abs), open: openFlag ? basename(abs) : false };
}

// argv → five-server start() 옵션 {root, port, open} (+ printOptions 플래그)
function buildOptions(argv) {
  const args = parseArgs(argv);
  const { root, open } = resolveTarget(args.target, args.open);
  return { root, port: args.port, open, printOptions: args.printOptions };
}

async function main() {
  const { printOptions, ...opts } = buildOptions(process.argv.slice(2));
  if (printOptions) {
    console.log(JSON.stringify(opts));
    return;
  }
  let FiveServer;
  try {
    ({ default: FiveServer } = await import("five-server"));
  } catch (err) {
    throw new ServeDesignError(`five-server를 불러오지 못했습니다 — 'npm install' 했는지 확인하세요. (${err.message})`);
  }
  const server = new FiveServer();
  await server.start(opts);
  console.log(`design 라이브 프리뷰: http://localhost:${opts.port}/ (root: ${opts.root})`);
  console.log("파일이 바뀌면 브라우저가 자동 새로고침됩니다. 종료: Ctrl+C");
}

// ServeDesignError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (build-contact-sheet·image-gen 규약과 일치).
main().catch((err) => {
  if (err instanceof ServeDesignError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
});
```

- [ ] **Step 4: 통과 확인**

Run: `node --test "tests/serve-design.test.mjs"`
Expected: PASS — 9개 테스트 모두 통과. (five-server 미설치여도 `--print-options` 경로는 import 안 하므로 통과.)

- [ ] **Step 5: 전체 테스트 회귀 확인**

Run: `npm test`
Expected: PASS — serve-design + 기존 build-contact-sheet 테스트 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add scripts/serve-design.mjs tests/serve-design.test.mjs
git commit -m "feat(design): HTML 라이브 프리뷰 런처 serve-design.mjs(+테스트)"
```

---

### Task 2: five-server 의존성 추가 + 실기동 스모크

**Files:**
- Modify: `package.json` (+ `package-lock.json` 자동 갱신)

- [ ] **Step 1: devDependency 설치** *(상태 변경 명령 — 실행 전 사용자 확인)*

Run: `npm install --save-dev five-server`
Expected: `package.json` 의 `devDependencies` 에 `five-server` 추가, `package-lock.json` 갱신, `node_modules/five-server` 설치.

- [ ] **Step 2: 실기동 스모크(수동, 30초)** — 임시 폴더로 실제 서버가 뜨고 브라우저가 열리는지 1회 확인.

```bash
mkdir -p /tmp/sd-smoke && printf '<!doctype html><title>smoke</title><h1>live</h1>' > /tmp/sd-smoke/overview.html
node scripts/serve-design.mjs /tmp/sd-smoke --port 5599
```
Expected: 콘솔에 `design 라이브 프리뷰: http://localhost:5599/` 출력 + 기본 브라우저가 `overview.html` 을 연다. `overview.html` 의 `<h1>` 텍스트를 고쳐 저장하면 브라우저가 자동 새로고침된다. 확인 후 `Ctrl+C` 로 종료.
> Windows PowerShell이면: `node scripts/serve-design.mjs $env:TEMP\sd-smoke --port 5599` (임시 HTML은 적절히 생성).

- [ ] **Step 3: 생성물 게이트 확인**

Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.` (의존성 추가는 MCP 생성물과 무관 — 통과 확인용.)

- [ ] **Step 4: 커밋**

```bash
git add package.json package-lock.json
git commit -m "build(design): live preview용 five-server devDependency 추가"
```

---

### Task 3: design-brand-kit SKILL.md 배선

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: 저작 섹션에 "라이브 프리뷰" 안내 추가** — `### overview.html 저작 (이미지 아님)` 단락(292행) 바로 뒤에 새 소제목을 삽입한다.

기존(앵커, line 292 끝 ~ 294):
```
콘텐츠를 지어내지 않는다(변주는 레이아웃만).

## 흐름 (디자이너 협업 루프)
```

다음으로 교체:
```
콘텐츠를 지어내지 않는다(변주는 레이아웃만).

### 라이브 프리뷰 (자동 새로고침)

`overview.html`을 **처음 피드백용으로 제시할 때** 공유 런처로 로컬 라이브 서버를 **한 번
백그라운드로** 띄운다 — 이후 자산 재생성·HTML 외과 편집 때마다 브라우저가 자동
새로고침된다(수동 새로고침 불필요). watch·reload·브라우저 오픈은 `five-server`에 위임한다.

```
node ../../scripts/serve-design.mjs <cwd>/.design/brand-kit
```

- 발산(분기) 중이면 비교할 폴더(예: `<cwd>/.design/brand-kit/routes`)를 루트로 띄워
  3개 `overview.html`을 함께 본다.
- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동(이후 같은 서버 유지).
- lock 후 또는 세션 종료 시 서버를 종료한다(`Ctrl+C`/백그라운드 종료 — 포트 점유 방지).

## 흐름 (디자이너 협업 루프)
```

- [ ] **Step 2: 흐름 step 8(lock)에 서버 종료 한 줄 추가** — 8번 항목 끝에 덧붙인다.

기존(line 307, 끝부분):
```
(각자 `.design/brand-kit/assets/`를 시드로 읽음).
```

다음으로 교체:
```
(각자 `.design/brand-kit/assets/`를 시드로 읽음). 라이브 프리뷰 서버가 떠 있으면 종료한다(포트 점유 방지).
```

- [ ] **Step 3: 변경 확인**

Run: `node --test "tests/**/*.test.mjs"`
Expected: PASS (문서 변경이라 테스트 영향 없음 — 회귀 확인).

- [ ] **Step 4: 생성물 동기화(skills/ 변경)**

Run: `npm run sync`
Expected: 무오류 종료. (`plugins/personal/`·`codex-agents/`는 gitignore 생성물 — 스테이징 안 함.)

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): overview.html 라이브 프리뷰(serve-design) 배선"
```

- [ ] **Step 6: 플러그인 갱신 안내** — `skills/` 가 바뀌었으므로:
  - `npm run codex:reinstall` 실행(Codex 번들 갱신).
  - 사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."**

---

## Self-Review

**Spec coverage:**
- five-server 채택 → Task 2. ✅
- 최상위 `scripts/serve-design.mjs` 얇은 런처 → Task 1. ✅
- devDependency 추가 → Task 2 Step 1. ✅
- 인자(`<dir|html>`·`--port`·`--no-open`) + 경로 해석(dir/파일) + 커스텀 에러 exit 2 → Task 1 구현·테스트. ✅
- design-brand-kit 배선(반복 루프 진입 시 백그라운드 기동·발산 비교·lock 종료·최초 1회 확인) → Task 3. ✅
- 테스트: 인자 파싱/경로 해석/검증/기본값/올바른 옵션 → Task 1 9케이스. ✅ (스펙의 "주입 spawner" 대신 `--print-options` + 블랙박스 spawnSync로 동등 검증 — 저장소 기존 패턴과 일치, 더 단순.)
- 범위 밖(타 스킬 실제 배선·고급 옵션) 미포함. ✅

**Placeholder scan:** TBD/TODO 없음. 모든 코드·명령·기대출력 명시. ✅

**Type consistency:** `ServeDesignError`·`parseArgs`·`resolveTarget`·`buildOptions`·`{root,port,open,printOptions}` 명칭이 구현·main·테스트에서 일관. five-server API `new FiveServer().start({root,port,open})` 일관. ✅

**정제 사항(스펙 대비):** ① five-server CLI 플래그 대신 프로그래매틱 `start()` API 사용(플래그 모호성 회피). ② 실기동 시에만 lazy `import("five-server")` → 테스트 의존성 0. ③ `--print-options`로 블랙박스 테스트. 셋 다 스펙 결정(라이브러리·위치·의존성·배선)을 바꾸지 않는 구현 세부.
