# image-gen 이미지 입력(레퍼런스/편집) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `image-gen.mjs`가 `--image` 입력을 받으면 OpenAI `/v1/images/edits` 엔드포인트로 분기해 레퍼런스 기반 생성·편집을 지원하게 한다.

**Architecture:** 같은 스크립트 안에서 `--image` 유무로 엔드포인트만 분기한다. 이미지가 있으면 Node 18+ 전역 `FormData`/`Blob`으로 multipart를 만들어 `/edits`로, 없으면 기존 JSON 경로로 `/generations`로 보낸다. 응답 파싱·파일 저장·`--out`/`--n`/`--dry-run` 로직은 두 경로가 공유한다. "편집이냐 레퍼런스냐"는 스크립트가 구분하지 않고 호출자의 프롬프트 + `--input-fidelity`가 결정한다.

**Tech Stack:** Node ≥18 (전역 `fetch`/`FormData`/`Blob`, 외부 의존성 0), `node:test` + `spawnSync` 통합 테스트(dry-run 기반, API 키 불필요).

**Spec:** `docs/superpowers/specs/2026-05-28-image-gen-image-input-design.md`

---

## 참고: 현재 스크립트 구조 (변경 전)

`skills/image-gen/scripts/image-gen.mjs` (177줄):
- 28행: `const ENDPOINT = 'https://api.openai.com/v1/images/generations';`
- 42–71행: `parseArgs(argv)` — 43–51행 기본값 객체, 55–68행 인자 switch
- 73–78행: `outPaths(out, n, ext)`
- 80–171행: `main()` — 87–91행 검증, 93–94행 ext/targets, 96–99행 clash 검사, 101–108행 `body` JSON, 110–117행 dry-run, 119–130행 apiKey 로드, 132–146행 fetch, 148–170행 응답 저장
- dry-run 분기는 apiKey 로드보다 **먼저** 반환하므로 dry-run 테스트는 키가 필요 없다.
- `die(msg, code = 2)` — 기본 종료 코드 2.

---

## Task 1: `--image` 파싱 + 엔드포인트 분기 (dry-run)

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`
- Test: `tests/image-gen-image-input.test.mjs` (Create)

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/image-gen-image-input.test.mjs` 생성:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(PLUGIN_ROOT, 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}

// 존재하는 더미 이미지 파일 (dry-run은 바이트를 읽지 않고 존재만 확인)
function makeImage(name = 'ref.png') {
  const dir = mkdtempSync(path.join(tmpdir(), 'img-in-'));
  const p = path.join(dir, name);
  writeFileSync(p, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return p;
}

// 아직 존재하지 않는 출력 경로 (clash 검사 통과용)
function outPath(name = 'out.png') {
  return path.join(mkdtempSync(path.join(tmpdir(), 'img-out-')), name);
}

test('--image 가 있으면 dry-run 이 edits 엔드포인트와 이미지 목록을 출력한다', () => {
  const img1 = makeImage('a.png');
  const img2 = makeImage('b.png');
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img1, '--image', img2, '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POST https:\/\/api\.openai\.com\/v1\/images\/edits/);
  assert.match(res.stdout, /images \(2\)/);
});

test('--image 가 없으면 dry-run 이 generations 엔드포인트를 유지한다 (회귀 가드)', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /POST https:\/\/api\.openai\.com\/v1\/images\/generations/);
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: FAIL — `--image` 가 알 수 없는 인자라 `die`로 종료(status 2)하거나 edits 출력이 없음.

- [ ] **Step 3: 구현 — 상수·파싱·분기·dry-run 출력**

`image-gen.mjs` 28행, generations 상수 **뒤에** edits 상수 추가:

```js
const ENDPOINT = 'https://api.openai.com/v1/images/generations';
const EDITS_ENDPOINT = 'https://api.openai.com/v1/images/edits';
```

`parseArgs`의 기본값 객체(43–51행)에 `images: []` 추가:

```js
  const opts = {
    size: 'auto',
    quality: 'medium',
    model: 'gpt-image-2',
    n: 1,
    outputFormat: 'png',
    force: false,
    dryRun: false,
    images: [],
  };
```

switch(55–68행)에 `--prompt-file` case 아래로 `--image` case 추가:

```js
      case '--prompt-file': opts.promptFile = next(); break;
      case '--image': opts.images.push(next()); break;
```

`main()`의 clash 검사(96–99행) **뒤에** 엔드포인트 선택 추가:

```js
  const useEdits = opts.images.length > 0;
  const endpoint = useEdits ? EDITS_ENDPOINT : ENDPOINT;
```

기존 `body` 객체(101–108행)를 `fields`로 교체(두 경로 공유):

```js
  const fields = {
    model: opts.model,
    prompt,
    n: opts.n,
    size: opts.size,
    quality: opts.quality,
    output_format: opts.outputFormat,
  };
```

dry-run 블록(110–117행)을 교체:

```js
  if (opts.dryRun) {
    const preview = prompt.trim().slice(0, 80) + (prompt.trim().length > 80 ? '…' : '');
    console.log('[dry-run] POST ' + endpoint);
    if (useEdits) {
      console.log(`[dry-run] images (${opts.images.length}):`);
      opts.images.forEach((p) => console.log('  ' + path.resolve(p)));
    }
    console.log('[dry-run] payload: ' + JSON.stringify({ ...fields, prompt: preview }, null, 2));
    console.log('[dry-run] out:');
    targets.forEach((p) => console.log('  ' + path.resolve(p)));
    return;
  }
```

실제 fetch(132–146행)에서 `body: JSON.stringify(body)` → `body: JSON.stringify(fields)`, `fetch(ENDPOINT, ...)` → `fetch(endpoint, ...)`로 변경(generations 경로 유지; edits 경로는 Task 4에서 추가):

```js
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: ac.signal,
    });
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: PASS (두 테스트).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs tests/image-gen-image-input.test.mjs
git commit -m "feat(image-gen): --image 입력 시 edits 엔드포인트로 분기"
```

---

## Task 2: 입력 이미지 파일 존재 검증

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`
- Test: `tests/image-gen-image-input.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/image-gen-image-input.test.mjs` 끝에 추가:

```js
test('존재하지 않는 --image 경로는 비0 종료로 실패한다', () => {
  const missing = path.join(tmpdir(), 'no-such-image-' + Date.now() + '.png');
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', missing, '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /찾을 수 없습니다/);
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: FAIL — 현재는 존재하지 않아도 dry-run 이 status 0으로 통과함.

- [ ] **Step 3: 구현 — 검증 추가**

`main()`의 `--n` 검증(91행) **뒤에** 추가:

```js
  if (!Number.isInteger(opts.n) || opts.n < 1 || opts.n > 10) die('오류: --n 은 1-10 사이 정수여야 합니다.');
  for (const img of opts.images) {
    if (!existsSync(img)) die(`오류: --image 파일을 찾을 수 없습니다: ${img}`);
  }
```

(`existsSync`는 24행에서 이미 import됨.)

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: PASS (3개 테스트 전부).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs tests/image-gen-image-input.test.mjs
git commit -m "feat(image-gen): --image 파일 존재 검증"
```

---

## Task 3: `--input-fidelity` 파싱·검증·페이로드 포함

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`
- Test: `tests/image-gen-image-input.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/image-gen-image-input.test.mjs` 끝에 추가:

```js
test('잘못된 --input-fidelity 값은 비0 종료로 실패한다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--input-fidelity', 'medium', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /high 또는 low/);
});

test('--input-fidelity high 는 edits 페이로드에 포함된다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'high', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"input_fidelity": "high"/);
});

test('--input-fidelity 미지정이면 페이로드에 input_fidelity 가 없다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: FAIL — `--input-fidelity` 가 알 수 없는 인자라 status 2이나 `/high 또는 low/` 미매치, 페이로드에 키 없음.

- [ ] **Step 3: 구현 — 파싱·검증·포함**

switch(Task 1에서 추가한 `--image` case 아래)에 추가:

```js
      case '--image': opts.images.push(next()); break;
      case '--input-fidelity': opts.inputFidelity = next(); break;
```

`main()`의 이미지 존재 검증(Task 2) **뒤에** 값 검증 추가:

```js
  for (const img of opts.images) {
    if (!existsSync(img)) die(`오류: --image 파일을 찾을 수 없습니다: ${img}`);
  }
  if (opts.inputFidelity && !['high', 'low'].includes(opts.inputFidelity)) {
    die('오류: --input-fidelity 는 high 또는 low 여야 합니다.');
  }
```

`fields` 객체(Task 1) 정의 **뒤에** edits 한정 포함 추가:

```js
  const fields = {
    model: opts.model,
    prompt,
    n: opts.n,
    size: opts.size,
    quality: opts.quality,
    output_format: opts.outputFormat,
  };
  if (useEdits && opts.inputFidelity) fields.input_fidelity = opts.inputFidelity;
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: PASS (6개 테스트 전부).

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs tests/image-gen-image-input.test.mjs
git commit -m "feat(image-gen): --input-fidelity 옵션 추가"
```

---

## Task 4: 실제 edits 요청을 FormData multipart로 전송

자동 테스트는 dry-run 으로 분기·검증을 이미 덮는다. 이 태스크는 실제 API 호출 경로(키 필요)라 자동 테스트 없이 spec대로 구현하고, dry-run 스위트가 계속 녹색인지로 회귀를 막는다.

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`

- [ ] **Step 1: MIME 헬퍼 추가**

`outPaths` 함수(73–78행) **뒤에** 추가:

```js
const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};
function mimeFor(file) {
  return MIME_BY_EXT[path.extname(file).toLowerCase()] || 'application/octet-stream';
}
```

(`readFileSync`·`path`는 24–25행에서 이미 import됨.)

- [ ] **Step 2: fetch 블록을 useEdits 분기로 교체**

`main()`의 AbortController/fetch 영역(132–146행)을 교체. apiKey 로드(119–130행)는 이 블록보다 앞이므로 그대로 사용 가능:

```js
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);

  let requestInit;
  if (useEdits) {
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) form.append(k, String(v));
    for (const img of opts.images) {
      const buf = readFileSync(img);
      form.append('image[]', new Blob([buf], { type: mimeFor(img) }), path.basename(img));
    }
    requestInit = {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: ac.signal,
    };
  } else {
    requestInit = {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
      signal: ac.signal,
    };
  }

  let res;
  try {
    res = await fetch(endpoint, requestInit);
  } catch (err) {
    die(`오류: API 요청 실패 — ${err.name === 'AbortError' ? `${TIMEOUT_MS}ms 타임아웃` : err.message}`, 1);
  } finally {
    clearTimeout(timer);
  }
```

> 주의: edits 경로에선 `Content-Type`을 직접 지정하지 않는다 — `FormData`가 multipart boundary와 함께 자동 설정한다. 직접 지정하면 boundary가 빠져 API가 거부한다.

- [ ] **Step 3: 회귀 테스트 실행 → 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: PASS (6개 — dry-run 경로는 영향 없음).

- [ ] **Step 4: dry-run 으로 페이로드 육안 확인**

Run: `node skills/image-gen/scripts/image-gen.mjs --prompt "두 레퍼런스를 참고해 새 히어로" --out ./tmp-check.png --image tests/fixtures/any.png --input-fidelity high --dry-run`
(없는 이미지면 `찾을 수 없습니다`로 실패하는 게 정상 — 존재하는 아무 PNG 경로로 바꿔 실행.)
Expected: `POST .../v1/images/edits`, `images (1)`, payload에 `"input_fidelity": "high"`.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs
git commit -m "feat(image-gen): edits 요청을 FormData multipart로 전송"
```

---

## Task 5: HELP 텍스트 + SKILL.md 문서 갱신

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs` (HELP 상수, 14–22행 옵션 주석)
- Modify: `skills/image-gen/SKILL.md`

- [ ] **Step 1: 스크립트 상단 옵션 주석 갱신**

14–22행 옵션 주석 블록에 두 줄 추가(`--n` 줄 아래):

```js
//   --n              변형 개수 1-10          (기본 1; >1이면 파일명에 -1,-2… 접미)
//   --image          입력/레퍼런스 이미지     (반복 가능; 1개+면 /edits 로 분기 — 레퍼런스·편집 공용)
//   --input-fidelity high | low             (선택; gpt-image-2 전용. high=원본 충실/편집, 생략=느슨한 참고)
```

- [ ] **Step 2: HELP 상수 갱신**

31–35행 `HELP` 문자열의 usage 줄에 `--image`/`--input-fidelity` 반영:

```js
const HELP = `image-gen.mjs — OpenAI Images API 직접 호출 (Codex 비의존)

  node image-gen.mjs --prompt-file <파일> --out <경로> [--image <경로>...] [--input-fidelity high] [--size WxH] [--quality high] [--model gpt-image-2] [--n 1] [--force] [--dry-run]

--image 가 1개 이상이면 /v1/images/edits 로 보낸다 (레퍼런스 생성·편집 공용 — 구분은 프롬프트와 --input-fidelity 로).
OPENAI_API_KEY 환경변수가 필요하다 (--dry-run 제외). --help로 이 도움말 출력.`;
```

- [ ] **Step 3: SKILL.md 사용법 갱신**

`skills/image-gen/SKILL.md`의 "## 사용" 절 불릿 목록에 추가(`**변형**` 불릿 아래):

```markdown
- **이미지 입력**: `--image <경로>`(반복 가능)로 입력/레퍼런스 이미지를 넘기면 `/v1/images/edits`로 보낸다. **`edits`라는 이름과 무관하게 레퍼런스 기반 새 생성·편집·합성을 모두 담당한다.** "편집이냐 레퍼런스냐"는 이 스크립트가 구분하지 않는다 — 호출자의 **프롬프트 문구**와 **`--input-fidelity`**(`high`=원본 충실 보존→편집, 생략=느슨한 참고→레퍼런스, gpt-image-2 전용)로 표현한다. 텍스트→이미지(이미지 없음)는 기존 `/generations` 그대로.
```

- [ ] **Step 4: 문서 정합성 확인**

Run: `node skills/image-gen/scripts/image-gen.mjs --help`
Expected: 새 옵션 두 개가 usage에 보이고 edits 안내 문구 출력.

- [ ] **Step 5: 커밋**

```bash
git add skills/image-gen/scripts/image-gen.mjs skills/image-gen/SKILL.md
git commit -m "docs(image-gen): --image/--input-fidelity 사용법 반영"
```

---

## Task 6: Codex 번들 sync + 전체 테스트

**Files:** (코드 변경 없음 — 검증·재생성)

- [ ] **Step 1: Codex 번들 재생성**

`skills/`를 수정했으므로 Codex 자기완결형 번들을 재생성한다.

Run: `npm run sync`
Expected: 성공 종료. `plugins/personal/`(gitignore된 로컬 생성물)이 갱신됨 — 커밋 대상 아님.

- [ ] **Step 2: 전체 테스트 스위트 실행**

Run: `npm test`
Expected: 신규 `image-gen-image-input.test.mjs` 6개 포함 전부 PASS, 기존 테스트 회귀 없음.

- [ ] **Step 3: git 상태 확인**

Run: `git status`
Expected: 추적 대상에 미커밋 변경 없음(`plugins/personal/`은 gitignore). 남아 있으면 적절히 커밋.

---

## Self-Review (작성자 점검 완료)

- **Spec 커버리지:** §5 CLI(`--image`/`--input-fidelity`)→T1·T3, §6 분기/multipart→T1·T4, §7 검증/dry-run→T2·T3, §9 SKILL.md→T5, §10 테스트(a–e)→T1·T2·T3, §11 sync→T6. mask·상위 스킬 연동은 spec 비목표라 태스크 없음(의도적).
- **Placeholder 스캔:** 모든 코드 스텝에 실제 코드·명령·기대 출력 명시. TBD/TODO 없음.
- **타입/명칭 정합성:** `opts.images`(배열)·`opts.inputFidelity`·`useEdits`·`endpoint`·`fields`·`mimeFor`·`EDITS_ENDPOINT`가 T1·T3·T4에서 동일 명칭으로 일관. `fields`는 T1에서 도입해 dry-run과 실제 요청 양쪽이 공유 — generations/edits 모두 같은 객체 사용.
