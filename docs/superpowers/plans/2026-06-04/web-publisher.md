# web-publisher 에이전트 + web-publisher-qa 스킬 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** designer가 만든 디자인을 확정 CSS/토큰 위에 충실히 HTML로 구현하고, OS 브라우저 스크린샷(의존성 0)으로 보이는 레이아웃 깨짐을 자가 검사하는 `web-publisher` 에이전트와 `web-publisher-qa` 스킬을 추가한다.

**Architecture:** `agents/web-publisher.md`(에이전트) + `skills/web-publisher-qa/`(스크린샷 QA 스킬, 스크립트 포함). 저작은 기존 `design-html-prototype` 스킬 재사용. 스크린샷은 OS 설치 브라우저(Edge/Chrome/Chromium/Brave)를 `--headless=new --screenshot`으로 호출 — npm 의존성 0. 스크립트는 순수 함수 + CLI로 나뉘며, 인자 해석/계획은 `--print-plan` dry-run으로 단위 테스트(실제 브라우저 비실행 — `serve-design.mjs`의 `--print-options` 패턴 답습).

**Tech Stack:** Node.js(ESM, `node:test`), `child_process.spawnSync`, OS 브라우저 CLI. 신규 npm 의존성 없음.

**승인된 spec:** `docs/superpowers/specs/2026-06-04/web-publisher-design.md`

---

## File Structure

| 파일 | 책임 |
|---|---|
| `skills/web-publisher-qa/scripts/screenshot.mjs` (신규) | 브라우저 해결 + breakpoint 해석 + 스크린샷 인자 빌드 + 캡처 실행. 순수 함수 export + CLI. |
| `tests/web-publisher-qa-screenshot.test.mjs` (신규) | 위 스크립트의 순수 함수·CLI(dry-run/에러) 단위 테스트. |
| `skills/web-publisher-qa/SKILL.md` (신규) | QA 스킬 지시문 — 스크립트 호출법, breakpoint 규칙, 알려진 한계, temp 출력, PNG 판독 절차. |
| `agents/web-publisher.md` (신규) | 에이전트 정의 — 충실 구현자 페르소나 + 저작·QA 스킬 호출 흐름. |
| `agents/designer.md` (수정) | 파이프라인 7단계(HTML 저작)를 web-publisher 담당으로 갱신. |
| `skills/design-html-prototype/SKILL.md` (수정) | 호출 주체(web-publisher)·산출물 성격 한 줄 명확화. |

생성물(`codex-agents/web-publisher.toml`, `plugins/personal/`)은 `npm run sync`가 자동 생성하며 **gitignore라 커밋 안 함**(마지막 Task).

---

## Task 1: 브라우저 해결 (resolveBrowser + 후보 목록)

**Files:**
- Create: `skills/web-publisher-qa/scripts/screenshot.mjs`
- Test: `tests/web-publisher-qa-screenshot.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/web-publisher-qa-screenshot.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultBrowserCandidates, resolveBrowser } from '../skills/web-publisher-qa/scripts/screenshot.mjs';

test('win32 후보 목록은 Edge를 첫 번째로 둔다', () => {
  const list = defaultBrowserCandidates('win32', { 'ProgramFiles(x86)': 'C:\\PFx86', 'ProgramFiles': 'C:\\PF' });
  assert.match(list[0], /Microsoft\\Edge\\Application\\msedge\.exe$/);
  assert.ok(list.some((p) => /chrome\.exe$/.test(p)));
});

test('darwin 후보 목록은 .app 바이너리 경로를 포함한다', () => {
  const list = defaultBrowserCandidates('darwin', {});
  assert.ok(list.some((p) => p.includes('Google Chrome.app/Contents/MacOS')));
});

test('resolveBrowser는 존재하는 첫 후보를 고른다', () => {
  const candidates = ['/no/a', '/yes/b', '/yes/c'];
  const got = resolveBrowser({ candidates, exists: (p) => p.startsWith('/yes') });
  assert.equal(got, '/yes/b');
});

test('resolveBrowser는 후보가 하나도 없으면 null', () => {
  const got = resolveBrowser({ candidates: ['/no/a', '/no/b'], exists: () => false });
  assert.equal(got, null);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: FAIL — `Cannot find module ... screenshot.mjs`

- [ ] **Step 3: 최소 구현**

`skills/web-publisher-qa/scripts/screenshot.mjs`:

```javascript
#!/usr/bin/env node
// web-publisher-qa: OS 설치 브라우저로 HTML을 breakpoint별 스크린샷한다.
// npm 의존성 0 — Edge/Chrome/Chromium/Brave를 --headless=new --screenshot으로 호출.
import { existsSync } from 'node:fs';

// 플랫폼별 Chromium 계열 실행 파일 후보(우선순위 순).
export function defaultBrowserCandidates(platform = process.platform, env = process.env) {
  if (platform === 'win32') {
    const pf = env['ProgramFiles'] || 'C:\\Program Files';
    const pfx86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = env['LOCALAPPDATA'] || '';
    const list = [
      `${pfx86}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pfx86}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pf}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
    ];
    if (local) list.push(`${local}\\Google\\Chrome\\Application\\chrome.exe`);
    return list;
  }
  if (platform === 'darwin') {
    return [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ];
  }
  return [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
    '/usr/bin/brave-browser',
  ];
}

export function resolveBrowser({ candidates, exists = existsSync } = {}) {
  const list = candidates ?? defaultBrowserCandidates();
  for (const p of list) {
    if (exists(p)) return p;
  }
  return null;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋**

```bash
git add skills/web-publisher-qa/scripts/screenshot.mjs tests/web-publisher-qa-screenshot.test.mjs
git commit -m "feat(web-publisher-qa): 브라우저 자동 해결 (resolveBrowser)"
```

---

## Task 2: breakpoint 해석 + 스크린샷 인자/계획 빌드

**Files:**
- Modify: `skills/web-publisher-qa/scripts/screenshot.mjs`
- Test: `tests/web-publisher-qa-screenshot.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/web-publisher-qa-screenshot.test.mjs` 상단 import에 추가:

```javascript
import { parseWidths, buildScreenshotArgs, planCaptures } from '../skills/web-publisher-qa/scripts/screenshot.mjs';
```

파일 끝에 테스트 추가:

```javascript
test('parseWidths: 빈 입력이면 기본값 375/768/1280', () => {
  assert.deepEqual(parseWidths([]), [375, 768, 1280]);
});

test('parseWidths: 콤마/복수 인자를 정수로 해석', () => {
  assert.deepEqual(parseWidths(['390,1440']), [390, 1440]);
  assert.deepEqual(parseWidths(['375', '768']), [375, 768]);
});

test('parseWidths: 유효한 폭이 없으면 throw', () => {
  assert.throws(() => parseWidths(['abc']), /invalid --width/);
});

test('buildScreenshotArgs: headless/screenshot/window-size/file URL 포함', () => {
  const args = buildScreenshotArgs({ htmlPath: '/tmp/page.html', outPath: '/out/page-375.png', width: 375 });
  assert.ok(args.includes('--headless=new'));
  assert.ok(args.some((a) => a === '--screenshot=/out/page-375.png'));
  assert.ok(args.some((a) => a === '--window-size=375,1100'));
  assert.ok(args.some((a) => a.startsWith('file://') && a.endsWith('page.html')));
});

test('planCaptures: 폭마다 <base>-<width>.png 산출', () => {
  const caps = planCaptures({ htmlPath: '/tmp/index.html', outDir: '/out', widths: [375, 768] });
  assert.equal(caps.length, 2);
  assert.equal(caps[0].width, 375);
  assert.ok(caps[0].outPath.endsWith('index-375.png'));
  assert.ok(caps[1].outPath.endsWith('index-768.png'));
  assert.ok(caps[0].args.some((a) => a === '--screenshot=' + caps[0].outPath));
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: FAIL — `parseWidths is not a function` 등

- [ ] **Step 3: 구현 추가**

`screenshot.mjs`의 import 줄을 아래로 교체하고(상단), 함수들을 `resolveBrowser` 아래에 추가:

```javascript
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const DEFAULT_WIDTHS = [375, 768, 1280];
const DEFAULT_HEIGHT = 1100;
```

(위 `const`들은 파일 상단, import 직후에 둔다.) 함수 추가:

```javascript
export function parseWidths(raw, defaults = DEFAULT_WIDTHS) {
  if (!raw || raw.length === 0) return [...defaults];
  const widths = raw
    .flatMap((s) => String(s).split(','))
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (widths.length === 0) throw new Error(`invalid --width values: ${raw.join(' ')}`);
  return widths;
}

export function buildScreenshotArgs({ htmlPath, outPath, width, height = DEFAULT_HEIGHT }) {
  const fileUrl = pathToFileURL(path.resolve(htmlPath)).href;
  return [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars=false',
    `--screenshot=${outPath}`,
    `--window-size=${width},${height}`,
    fileUrl,
  ];
}

export function planCaptures({ htmlPath, outDir, widths, height = DEFAULT_HEIGHT }) {
  const base = path.basename(htmlPath).replace(/\.[^.]+$/, '') || 'page';
  return widths.map((width) => {
    const outPath = path.join(outDir, `${base}-${width}.png`);
    return { width, outPath, args: buildScreenshotArgs({ htmlPath, outPath, width, height }) };
  });
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: PASS (9 tests)

- [ ] **Step 5: 커밋**

```bash
git add skills/web-publisher-qa/scripts/screenshot.mjs tests/web-publisher-qa-screenshot.test.mjs
git commit -m "feat(web-publisher-qa): breakpoint 해석 + 스크린샷 계획 빌드"
```

---

## Task 3: CLI (인자 해석, --print-plan dry-run, 캡처 실행)

**Files:**
- Modify: `skills/web-publisher-qa/scripts/screenshot.mjs`
- Test: `tests/web-publisher-qa-screenshot.test.mjs`

> CLI 통합 테스트는 `serve-design.mjs` 패턴을 따라 **실제 브라우저를 띄우지 않는 경로만** 검증한다(`--print-plan`·usage·에러). 실제 캡처는 수동 검증으로 갈음한다(spec 부록의 2회 실증이 동작 증거).

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/web-publisher-qa-screenshot.test.mjs` 상단에 추가:

```javascript
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../skills/web-publisher-qa/scripts/screenshot.mjs', import.meta.url));

function runCli(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function tmpHtml() {
  const d = mkdtempSync(path.join(tmpdir(), 'wpqa-'));
  const f = path.join(d, 'index.html');
  writeFileSync(f, '<!doctype html><title>x</title>', 'utf8');
  return { d, f };
}
```

(테스트 파일이 `path`를 이미 import하지 않았다면 `import path from 'node:path';`도 추가.)

파일 끝에 테스트 추가:

```javascript
test('CLI --print-plan: 계획 JSON 출력 + exit 0', () => {
  const { d, f } = tmpHtml();
  const out = path.join(d, 'shots');
  const res = runCli([f, '--out', out, '--widths', '375,768', '--print-plan']);
  assert.equal(res.status, 0, res.stderr);
  const plan = JSON.parse(res.stdout);
  assert.deepEqual(plan.widths, [375, 768]);
  assert.equal(plan.captures.length, 2);
  assert.ok(plan.captures[0].outPath.endsWith('index-375.png'));
  rmSync(d, { recursive: true, force: true });
});

test('CLI --browser 오버라이드가 계획에 반영', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--out', path.join(d, 's'), '--browser', '/custom/brow', '--print-plan']);
  assert.equal(JSON.parse(res.stdout).browser, '/custom/brow');
  rmSync(d, { recursive: true, force: true });
});

test('CLI: html 경로 없음 → exit 2 + usage', () => {
  const res = runCli(['--print-plan']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /usage:/);
});

test('CLI: 존재하지 않는 파일 → exit 2', () => {
  const res = runCli([path.join(tmpdir(), 'nope-wpqa-xyz.html'), '--print-plan']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없/);
});

test('CLI: 알 수 없는 플래그 → exit 2', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--bogus', '--print-plan']);
  assert.equal(res.status, 2);
  rmSync(d, { recursive: true, force: true });
});

test('CLI: 잘못된 width → exit 2', () => {
  const { d, f } = tmpHtml();
  const res = runCli([f, '--widths', 'abc', '--print-plan']);
  assert.equal(res.status, 2);
  rmSync(d, { recursive: true, force: true });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: FAIL — CLI가 아직 없어 stdout 비어 JSON.parse 에러 / status 불일치

- [ ] **Step 3: 구현 추가**

`screenshot.mjs` 상단 import에 추가:

```javascript
import { existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import path from 'node:path';
```

(기존 import 줄들을 위 한 묶음으로 통합 — 중복 import 제거.) 파일 끝에 추가:

```javascript
const USAGE =
  'usage: node screenshot.mjs <html-file> [--widths 375,768,1280] [--out <dir>] [--browser <path>] [--print-plan]';

export function parseArgv(argv) {
  const opts = { htmlPath: null, widths: [], outDir: null, browser: null, printPlan: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--print-plan') opts.printPlan = true;
    else if (a === '--width' || a === '--widths') {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} 값이 필요합니다`);
      opts.widths.push(v);
    } else if (a === '--out') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--out 값이 필요합니다');
      opts.outDir = v;
    } else if (a === '--browser') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--browser 값이 필요합니다');
      opts.browser = v;
    } else if (a.startsWith('--')) {
      throw new Error(`알 수 없는 플래그: ${a}`);
    } else if (opts.htmlPath === null) {
      opts.htmlPath = a;
    } else {
      throw new Error(`예상치 못한 인자: ${a}`);
    }
  }
  return opts;
}

export function main(argv) {
  let opts;
  try {
    opts = parseArgv(argv);
  } catch (e) {
    process.stderr.write(e.message + '\n' + USAGE + '\n');
    return 2;
  }
  if (!opts.htmlPath) {
    process.stderr.write('html 파일 경로가 필요합니다\n' + USAGE + '\n');
    return 2;
  }
  const htmlPath = path.resolve(opts.htmlPath);
  if (!existsSync(htmlPath)) {
    process.stderr.write(`찾을 수 없는 파일: ${htmlPath}\n`);
    return 2;
  }
  let widths;
  try {
    widths = parseWidths(opts.widths);
  } catch (e) {
    process.stderr.write(e.message + '\n');
    return 2;
  }
  const outDir = opts.outDir
    ? path.resolve(opts.outDir)
    : opts.printPlan
      ? path.join(tmpdir(), 'wp-qa-(temp)')
      : mkdtempSync(path.join(tmpdir(), 'wp-qa-'));
  const browser = opts.browser ?? resolveBrowser();
  const captures = planCaptures({ htmlPath, outDir, widths });

  if (opts.printPlan) {
    process.stdout.write(
      JSON.stringify(
        { htmlPath, outDir, browser, widths, captures: captures.map((c) => ({ width: c.width, outPath: c.outPath })) },
        null,
        2,
      ) + '\n',
    );
    return 0;
  }
  if (!browser) {
    process.stderr.write('스크린샷용 브라우저를 찾지 못했습니다 — 시각 검사를 건너뜁니다.\n');
    return 3;
  }
  mkdirSync(outDir, { recursive: true });
  const produced = [];
  for (const c of captures) {
    const res = spawnSync(browser, c.args, { encoding: 'utf8' });
    if (res.status === 0 && existsSync(c.outPath)) produced.push(c.outPath);
  }
  process.stdout.write(JSON.stringify({ browser, outDir, produced }, null, 2) + '\n');
  return produced.length === captures.length ? 0 : 4;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  process.exit(main(process.argv.slice(2)));
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/web-publisher-qa-screenshot.test.mjs`
Expected: PASS (15 tests)

- [ ] **Step 5: 실제 캡처 수동 확인 (1회)**

Run (Windows 예):
```
node skills/web-publisher-qa/scripts/screenshot.mjs <임의 .html> --widths 375 --out %TEMP%\wpqa-manual
```
Expected: stdout JSON에 `produced`로 PNG 경로 1개, 파일 실제 생성. (브라우저 없는 환경이면 exit 3 + "건너뜁니다" 메시지 — 정상 축소 동작 확인.)

- [ ] **Step 6: 커밋**

```bash
git add skills/web-publisher-qa/scripts/screenshot.mjs tests/web-publisher-qa-screenshot.test.mjs
git commit -m "feat(web-publisher-qa): CLI(--print-plan dry-run + 캡처 실행)"
```

---

## Task 4: web-publisher-qa SKILL.md

**Files:**
- Create: `skills/web-publisher-qa/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

`skills/web-publisher-qa/SKILL.md`:

```markdown
---
name: web-publisher-qa
description: web-publisher가 구현한 HTML/CSS를 OS 브라우저 스크린샷으로 자가 검사하는 스킬. breakpoint별로 스크린샷을 찍어 "보이는 레이아웃 깨짐"(요소 overflow·정렬 어긋남·grid 불균일·깨진 이미지·겹침)을 점검한다. 의존성 0 — 설치된 Edge/Chrome/Chromium/Brave를 호출. a11y·대비·시맨틱 정밀 검사는 범위 밖.
---

# web-publisher-qa

당신은 구현된 HTML/CSS를 **렌더해서 눈으로** 점검하는 QA다. 코드만 읽지 말고 스크린샷을 찍어 본다.

## 입력

- 검사할 HTML 파일 경로(예: `prototype/index.html`).
- (선택) breakpoint 폭. 없으면 기본 `375 / 768 / 1280`.

## 절차

1. 스크린샷을 찍는다(아래 스크립트). 산출물은 시스템 임시 폴더에 둔다 — 대상 프로젝트를 더럽히지 않는다.

   ```bash
   node skills/web-publisher-qa/scripts/screenshot.mjs <html경로> --widths 375,768,1280
   ```

   - 반응형이 아닌 고정폭 화면이면 단일 폭만: `--widths 1280`.
   - 사용자가 특정 폭을 지정하면 그 값으로: `--widths 390,1440`.
   - 출력 JSON의 `produced` 경로들이 PNG다. `browser`가 null이고 exit 3이면 **브라우저가 없어 스크린샷을 건너뛴 것** — 사용자에게 "시각 검사는 건너뜀"을 알리고 코드 기반 점검만 한다.

2. 생성된 각 PNG를 **Read 도구로 열어** 본다.

3. 다음 **기계적 레이아웃 깨짐**만 본다(미적 판단 아님):
   - 요소가 컨테이너 밖으로 튀어나옴(`input`이 `div` 밖 등)
   - grid/flex 칸 높이·정렬 불균일
   - 가로로 잘려나가는 콘텐츠(뷰포트 초과)
   - 깨진 이미지(빈 자리·broken icon)
   - 요소 겹침

4. 발견을 **폭별로** 리포트한다: 무엇이 / 어느 폭에서 / 어떻게 깨졌는지.

## 알려진 한계

- 부모에 `overflow:hidden`이 걸려 **잘린** overflow는 스크린샷에 거의 안 드러나 놓칠 수 있다. 스크린샷 QA는 *보이는* 깨짐을 잡는 도구다.
- 대비비·접근성·시맨틱 같은 수치/비가시 항목은 이 스킬 범위 밖이다(필요 시 후속 도구).

## 하지 않을 것

- "보기 좋은가" 같은 미적 판정(디자인 충실도는 designer/사람 몫).
- 발견을 멋대로 대규모로 뜯어고치기 — web-publisher가 저작 스킬로 외과적으로 고치고 다시 검사한다.
```

- [ ] **Step 2: 스킬 형식 점검**

Run: `node -e "const fs=require('fs');const t=fs.readFileSync('skills/web-publisher-qa/SKILL.md','utf8');if(!/^---[\s\S]*?name:\s*web-publisher-qa[\s\S]*?---/.test(t))throw new Error('frontmatter missing');console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: 커밋**

```bash
git add skills/web-publisher-qa/SKILL.md
git commit -m "feat(web-publisher-qa): QA 스킬 지시문 추가"
```

---

## Task 5: web-publisher 에이전트

**Files:**
- Create: `agents/web-publisher.md`

- [ ] **Step 1: 에이전트 정의 작성**

`agents/web-publisher.md` (`agents/designer.md`와 동형 frontmatter):

```markdown
---
name: web-publisher
description: designer가 만든 브랜드 킷·DESIGN.md·이미지·확정 CSS를 바탕으로, 디자인 의도를 해치지 않고 HTML/CSS를 충실히 구현하고 OS 브라우저 스크린샷으로 보이는 레이아웃 깨짐을 자가 검사하는 퍼블리셔다.
tools: Read, Write, Edit, Bash, Glob, Grep, Skill
model: inherit
---

당신은 디자인을 **웹에서 실재화**하는 퍼블리셔다. 즉흥으로 디자인을 바꾸지 말고, designer가 정한 토큰·레이아웃 의도를 그대로 따라 HTML/CSS로 옮긴다.

## 입력 (대상 프로젝트 cwd)

- `DESIGN.md`, `.design/brand-tokens.json`, `.design/assets/tokens.css`
- `.design/assets/ui-kit/ui-kit.css`, `.design/assets/icon/*.svg`
- `.design/assets/**`(확정 이미지) → 없으면 `.design/candidate/**`
- 사용자 요청사항(어떤 화면·섹션을 구현할지)

## 흐름

1. **구현** — `design-html-prototype` 스킬을 `Skill` 도구로 호출해 `DESIGN.md`·토큰·이미지대로 HTML/CSS를 만든다. 토큰 변수(`tokens.css`)·`ui-kit.css` 클래스를 쓰고, 색·폰트를 하드코딩하지 않는다.
2. **자가 QA** — `web-publisher-qa` 스킬을 호출해 구현 결과를 breakpoint별 스크린샷으로 점검한다. 보이는 레이아웃 깨짐(요소 overflow·정렬·grid 불균일·깨진 이미지·겹침)을 찾는다.
3. **수정 반복** — 깨짐을 찾으면 1로 돌아가 **외과적으로** 고치고 2를 다시 돌린다. 깨짐이 없으면 완료.
4. 사람(또는 designer)이 디자인 충실도를 보는 건 그다음, 별개 단계다.

## 작업 원칙

- **디자인을 해치지 않는다.** 구현 편의로 레이아웃·색·간격을 바꾸지 않는다 — 토큰과 DESIGN.md가 권위다.
- **한 번에 하나.** 만들고, 스크린샷으로 보고, 한 가지씩 고친다.
- **한국어**로 소통한다.

## 경계

- 브랜드 킷·로고·아이콘·ui-kit·이미지·DESIGN.md 생성은 **designer 몫** — 이미 만들어진 걸 입력으로 받는다.
- 공통 컴포넌트 추출·React/Next·페이지 코드(실제 구현)는 **미래 front-developer 몫** — 하지 않는다.

## 하지 않을 것

- 스킬을 건너뛰고 즉흥으로 결과물을 지어내지 않는다.
- "보기 좋은가" 미적 판정을 자처하지 않는다(디자인 충실도는 designer/사람).
```

- [ ] **Step 2: 커밋**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): 퍼블리셔 에이전트 추가"
```

---

## Task 6: designer 경계 갱신 (핸드오프)

**Files:**
- Modify: `agents/designer.md`
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: designer.md 파이프라인 7단계 갱신**

`agents/designer.md`에서 7단계 줄을 찾아 교체.

찾기:
```
7. **design-html-prototype** — `DESIGN.md`와 토큰으로 빠르게 확인 가능한 단일 HTML/CSS 프로토타입을 만든다.
```
교체:
```
7. **(web-publisher 담당) design-html-prototype** — `DESIGN.md`·토큰·이미지로 HTML/CSS를 구현하는 단계. 이 단계는 designer가 아니라 **web-publisher 에이전트**가 맡는다(사용자가 web-publisher를 호출). designer 범위는 6단계(`design-md-compiler`)까지이며, 여기서 HTML 저작을 web-publisher로 넘긴다.
```

- [ ] **Step 2: design-html-prototype 호출 주체 한 줄 명확화**

`skills/design-html-prototype/SKILL.md`에서 도입 문장을 찾아 교체.

찾기:
```
당신은 DESIGN.md를 바탕으로 빠르게 확인 가능한 HTML 프로토타입을 만드는 프론트엔드 프로토타입 엔지니어다.
```
교체:
```
당신은 DESIGN.md를 바탕으로 HTML/CSS를 구현하는 프론트엔드 엔지니어다. 이 스킬은 **web-publisher 에이전트**가 호출하며, 산출물은 "버리는 프리뷰"가 아니라 디자인 확인용으로 충실히 구현한 마크업이다. 구현 후 web-publisher가 `web-publisher-qa` 스킬로 레이아웃을 점검한다.
```

- [ ] **Step 3: 변경 확인**

Run: `git diff --stat agents/designer.md skills/design-html-prototype/SKILL.md`
Expected: 두 파일 각 1곳 변경.

- [ ] **Step 4: 커밋**

```bash
git add agents/designer.md skills/design-html-prototype/SKILL.md
git commit -m "refactor(designer): HTML 저작 단계를 web-publisher로 이관"
```

---

## Task 7: 동기화 · 전체 테스트 · 마무리

**Files:** (소스 없음 — 생성물 동기화 + 게이트)

- [ ] **Step 1: 생성물 동기화**

Run: `npm run sync`
Expected: `codex-agents/web-publisher.toml`과 `plugins/personal/` 재생성(gitignore — 커밋 대상 아님). 에러 없음.

- [ ] **Step 2: 생성물-소스 일치 게이트**

Run: `npm run validate`
Expected: MCP 생성물 in sync (이 변경은 MCP 무관이라 통과).

- [ ] **Step 3: 전체 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS (신규 `web-publisher-qa-screenshot.test.mjs` 15개 포함).

- [ ] **Step 4: 스테이징 점검**

Run: `git status --short`
Expected: 추적 파일은 이미 이전 Task들에서 커밋됨. `codex-agents/`·`plugins/personal/`은 gitignore라 안 보여야 함. 남은 변경 없으면 OK.

- [ ] **Step 5: Codex 재설치 + reload 안내**

`agents/`·`skills/`가 바뀌었으므로:
Run: `npm run codex:reinstall`
그리고 사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."**

---

## Self-Review (작성자 체크 — 실행 전 확인 완료)

**Spec coverage:**
- §2 에이전트 신설 → Task 5. HTML 저작 이관 → Task 6. QA(스크린샷·기계적 깨짐) → Task 1–4. 의존성 0(OS 브라우저) → Task 1·3.
- §5.1 에이전트 frontmatter(designer 동형) → Task 5. §5.2 별도 QA 스킬 → Task 4. §5.3 수동 핸드오프 → Task 6(designer.md 갱신).
- §7.1 QA 흐름·알려진 한계 → Task 4 SKILL.md. §7.2 breakpoint(인자→기본값) → Task 2·3. §8 브라우저 해결·폴백(없으면 스킵+보고) → Task 1·3(exit 3). §6 temp 출력 → Task 3·4.
- §9 designer/ front-developer 경계 → Task 5·6.

**Placeholder scan:** 모든 코드 스텝에 실제 코드. TBD/TODO 없음.

**Type consistency:** `resolveBrowser`/`defaultBrowserCandidates`/`parseWidths`/`buildScreenshotArgs`/`planCaptures`/`parseArgv`/`main` 시그니처가 Task 1→3 전반에서 일치. `--print-plan` 출력 키(`htmlPath/outDir/browser/widths/captures`)가 Task 3 테스트와 구현에서 일치.
