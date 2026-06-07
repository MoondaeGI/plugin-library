# image-gen 버전 보존 + 확정본 final 폴더 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미지 생성 시 기존 시안을 잃지 않도록 `image-gen.mjs`에 `--auto-version`을 추가하고, 디자인 스킬에 확정본 `.design/final/` 폴더 컨벤션을 배선한다.

**Architecture:** `--auto-version` 플래그는 `--out` 충돌 시 die 대신 다음 `-vN`으로 증분한다(플래그 미지정 시 기존 동작 유지). 디자인 스킬은 모든 시안을 `.design/generated/`에 누적하고, lock 시 확정본만 `.design/final/`(미러형)로 수동 복사하며, 다운스트림은 final 우선·generated 폴백으로 읽는다.

**Tech Stack:** Node ≥18 (전역 fetch, `node:fs`/`node:path`), `node:test` + `node:assert/strict`. 테스트 실행 `npm test`.

---

## File Structure

- `skills/image-gen/scripts/image-gen.mjs` — `--auto-version` 파싱 + 버전 증분 헬퍼. 단일 책임 유지(프롬프트 in → 이미지 out), 충돌 해소 로직만 추가.
- `tests/image-gen-auto-version.test.mjs` (신규) — dry-run 기반 버전 증분 동작 가드.
- `skills/image-gen/SKILL.md` — `--auto-version` 옵션 문서.
- `skills/design-page-image/SKILL.md` — 생성 호출에 `--auto-version`, final 경로/복사 단계.
- `skills/design-md-compiler/SKILL.md` — 입력에 `.design/final/` 우선 추가.
- `skills/design-html-prototype/SKILL.md` — 입력에 `.design/final/` 우선 추가.
- `skills/design-brand-kit/SKILL.md` — (⚠ 다른 세션이 수정 중) 정리→복사 + `--auto-version`. **마지막에, 그 세션 변경이 커밋된 뒤 진행.**

---

### Task 1: `--auto-version` 플래그 — 테스트 먼저

**Files:**
- Test: `tests/image-gen-auto-version.test.mjs` (Create)
- Modify: `skills/image-gen/scripts/image-gen.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/image-gen-auto-version.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}

// 이미 존재하는 출력 파일을 만든다
function existingOut(name, ...alsoExisting) {
  const dir = mkdtempSync(path.join(tmpdir(), 'img-av-'));
  const out = path.join(dir, name);
  writeFileSync(out, Buffer.from([0x89]));
  for (const extra of alsoExisting) writeFileSync(path.join(dir, extra), Buffer.from([0x89]));
  return out;
}

test('--auto-version: 기존 파일이 있으면 다음 -v2 로 증분한다', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic-v2\.png/);
});

test('--auto-version: -v2 도 있으면 -v3 로 건너뛴다', () => {
  const out = existingOut('pic.png', 'pic-v2.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic-v3\.png/);
});

test('--auto-version 없이 기존 파일이면 에러로 막는다 (회귀 가드)', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /이미 존재/);
});

test('--force 는 --auto-version 보다 우선 — 지정 경로를 그대로 쓴다', () => {
  const out = existingOut('pic.png');
  const res = run(['--prompt', 'x', '--out', out, '--auto-version', '--force', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /pic\.png/);
  assert.doesNotMatch(res.stdout, /pic-v\d/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/image-gen-auto-version.test.mjs`
Expected: FAIL — `--auto-version` 미구현이라 기존 파일 충돌 시 status 2로 die, 첫 두 테스트가 실패.

- [ ] **Step 3: 최소 구현 — 파싱 + 헬퍼 + 분기**

`skills/image-gen/scripts/image-gen.mjs`의 `parseArgs` 기본값에 `autoVersion: false` 추가 (`force: false,` 줄 다음):

```javascript
    force: false,
    autoVersion: false,
    dryRun: false,
```

`switch`에 케이스 추가 (`case '--force': opts.force = true; break;` 다음):

```javascript
      case '--force': opts.force = true; break;
      // --auto-version: --out 충돌 시 die 대신 다음 -vN 으로 자동 증분(시안 보존).
      // 플래그를 주지 않으면 기존 동작(충돌 시 --force 없으면 die) 그대로 — 범용 호출자 영향 0.
      case '--auto-version': opts.autoVersion = true; break;
```

`outPaths` 함수 다음에 버전 증분 헬퍼 추가:

```javascript
// --out 에 -v{N} 을 끼운 경로. base.png → base-v2.png (원본 확장자 유지).
function versionedOut(out, v) {
  const dir = path.dirname(out);
  const ext0 = path.extname(out);
  const base = path.basename(out, ext0);
  return path.join(dir, `${base}-v${v}${ext0}`);
}

// 충돌 없는 다음 버전의 타깃 세트를 찾는다. 원본(접미 없음)을 v1로 보고 v2부터 스캔.
// --n>1 이면 변형 세트 전체가 비어 있는 첫 버전을 고른다. 999에서 안전 차단.
function nextVersionTargets(out, n, ext) {
  for (let v = 2; v < 1000; v++) {
    const candidates = outPaths(versionedOut(out, v), n, ext);
    if (!candidates.some((p) => existsSync(p))) return candidates;
  }
  die(`오류: --auto-version 버전 한도(999)를 초과했습니다: ${out}`);
}
```

`main()`의 타깃/충돌 검사 블록을 교체. 기존:

```javascript
  const ext = '.' + (opts.outputFormat === 'jpeg' ? 'jpg' : opts.outputFormat);
  const targets = outPaths(opts.out, opts.n, ext);

  if (!opts.force) {
    const clash = targets.find((p) => existsSync(p));
    if (clash) die(`오류: 이미 존재합니다: ${clash}\n(덮어쓰려면 --force, 또는 버전 파일명 -v2 를 쓰세요.)`);
  }
```

교체 후:

```javascript
  const ext = '.' + (opts.outputFormat === 'jpeg' ? 'jpg' : opts.outputFormat);
  let targets = outPaths(opts.out, opts.n, ext);

  // --force 가 최우선(지정 경로 그대로 덮어씀). 아니면 충돌 시:
  //   --auto-version → 다음 -vN 으로 증분 / 미지정 → die.
  if (!opts.force) {
    const clash = targets.find((p) => existsSync(p));
    if (clash) {
      if (opts.autoVersion) {
        targets = nextVersionTargets(opts.out, opts.n, ext);
      } else {
        die(`오류: 이미 존재합니다: ${clash}\n(덮어쓰려면 --force, 자동 버전은 --auto-version, 또는 버전 파일명 -v2 를 쓰세요.)`);
      }
    }
  }
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/image-gen-auto-version.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: 회귀 — 기존 image-gen 테스트 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: PASS (변경 없음 가드).

- [ ] **Step 6: 커밋**

```bash
git add tests/image-gen-auto-version.test.mjs skills/image-gen/scripts/image-gen.mjs
git commit -m "feat(image-gen): --auto-version 으로 --out 충돌 시 -vN 자동 증분"
```

---

### Task 2: `image-gen` SKILL.md — `--auto-version` 문서화

**Files:**
- Modify: `skills/image-gen/SKILL.md`

- [ ] **Step 1: 옵션 설명 추가**

`SKILL.md`의 "변형" 불릿(`- **변형**: ...개별 호출.`) 다음에 새 불릿 추가:

```markdown
- **버전 보존**: `--auto-version`을 주면 `--out`이 이미 있을 때 에러 대신 다음 `-vN`(`-v2`,`-v3`…)으로 자동 증분해 저장한다(기존 시안을 잃지 않음). 미지정 시 기존 동작(충돌 시 `--force` 없으면 에러). `--force`는 지정 경로를 그대로 덮어쓰며 `--auto-version`보다 우선.
```

`--out` 불릿의 "기존 파일은 `--force` 없이는 안 덮음." 문장 끝에 추가:

```markdown
기존 파일은 `--force` 없이는 안 덮음(자동 버전은 `--auto-version`).
```

- [ ] **Step 2: 커밋**

```bash
git add skills/image-gen/SKILL.md
git commit -m "docs(image-gen): --auto-version 옵션 문서화"
```

---

### Task 3: `design-page-image` SKILL.md — `--auto-version` + final 배선

**Files:**
- Modify: `skills/design-page-image/SKILL.md`

- [ ] **Step 1: 호출 예에 `--auto-version` 추가**

`skills/design-page-image/SKILL.md:106-110` 호출 예를 교체:

```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <임시 프롬프트 파일> \
    --out "<cwd>/.design/generated/page/section-1-hero.png" \
    --auto-version --quality high
```

- [ ] **Step 2: 저장 경로 불릿 교체**

기존 `skills/design-page-image/SKILL.md:111`:

```markdown
- **저장 경로**: `--out`에 **대상 프로젝트 cwd 기준 절대 경로** `<cwd>/.design/generated/page/`. 파일명 `section-1-hero.png` 식, 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다.
```

교체:

```markdown
- **저장 경로**: 시안은 `<cwd>/.design/generated/page/`에 누적한다 — `--auto-version`을 항상 붙여 재생성 때 `-v2`,`-v3`…로 증분하고 기존 시안을 덮지 않는다. 파일명 `section-1-hero.png` 식.
- **확정본 분리**: 섹션을 lock하면 그 시안을 `<cwd>/.design/final/page/`로 복사하고(버전 접미를 뗀 의미 이름, 예: `section-1-hero-v3.png` → `final/page/section-1-hero.png`), 시안은 지우지 않는다. 다운스트림(`design-md-compiler`·`design-html-prototype`)은 `.design/final/`을 우선 읽는다.
```

- [ ] **Step 3: 흐름의 lock 단계 교체**

기존 `skills/design-page-image/SKILL.md:119`:

```markdown
   - 확정되면 `.design/generated/page/`에 저장하고 다음 섹션으로.
```

교체:

```markdown
   - 확정(lock)되면 그 시안을 `.design/final/page/`로 복사(버전 접미 뗀 이름)하고 다음 섹션으로. 시안은 `.design/generated/page/`에 그대로 둔다.
```

- [ ] **Step 4: 커밋**

```bash
git add skills/design-page-image/SKILL.md
git commit -m "docs(design-page-image): --auto-version + 확정본 final 폴더 배선"
```

---

### Task 4: `design-md-compiler` SKILL.md — final 우선 입력

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: 입력 파일 목록에 final 우선 추가**

기존 `skills/design-md-compiler/SKILL.md:20-21`:

```markdown
- `.design/generated/**/*.{png,jpg,jpeg,webp}` (생성/드롭된 이미지 — 수동 드롭 시 PNG 외 형식도 포함)
- `.design/generated/manifest.json` (선택 — 있으면 캡션·순서·섹션 매핑 메타로 사용, 없으면 파일명 glob)
```

교체:

```markdown
- `.design/final/**/*.{png,jpg,jpeg,webp}` (확정본 — **있으면 이것을 우선** 사용)
- `.design/generated/**/*.{png,jpg,jpeg,webp}` (final이 없을 때의 폴백; 시안 누적본 — 수동 드롭 시 PNG 외 형식도 포함)
- `.design/manifest.json` 또는 `.design/generated/manifest.json` (선택 — 있으면 캡션·순서·섹션 매핑 메타로 사용, 없으면 파일명 glob)
```

- [ ] **Step 2: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "docs(design-md-compiler): 확정본 .design/final 우선 입력"
```

---

### Task 5: `design-html-prototype` SKILL.md — final 우선 입력

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 입력 파일 목록 교체**

기존 `skills/design-html-prototype/SKILL.md:18`:

```markdown
- `.design/generated/**/*.{png,jpg,jpeg,webp}` (+ 선택 `.design/generated/manifest.json`)
```

교체:

```markdown
- `.design/final/**/*.{png,jpg,jpeg,webp}` (확정본 — 있으면 우선) → 없으면 `.design/generated/**/*.{png,jpg,jpeg,webp}` 폴백 (+ 선택 `manifest.json`)
```

- [ ] **Step 2: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "docs(design-html-prototype): 확정본 .design/final 우선 입력"
```

---

### Task 6: `design-brand-kit` SKILL.md — 정리→복사 + `--auto-version` (⚠ 마지막)

**⚠ 선행 조건:** 이 파일은 다른 세션이 수정 중이다(시작 시점 unstaged `M`). 그 세션 변경이 커밋·정리된 뒤에만 진행한다. 진행 전 `git status`로 깨끗한지 확인하고, 충돌 시 현재 파일 내용을 다시 Read해 정확한 old text를 잡는다.

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: 선행 조건 확인**

Run: `git status --short skills/design-brand-kit/SKILL.md`
Expected: 출력 없음(clean). 출력이 있으면 멈추고 사용자에게 알린다.

- [ ] **Step 2: 생성 호출 예에 `--auto-version` 추가**

초안 생성 호출 예(`--out ".../brand-overview-route-a.png"` ... `--size 1024x1536 --quality low --model gpt-image-2`)에 `--auto-version`을 추가한다. 증분 편집/수렴 호출(`-v2` 산출)에도 동일하게 추가한다. ⚠ 정확한 줄은 Step 1 이후 다시 Read해 확인.

- [ ] **Step 3: "정리(삭제)" → "복사(확정본 final)" 단계 교체**

기존 "정리" 문장("방향이 lock되면 안 고른 루트·이전 버전(초안·편집 중간본)을 삭제하고, 최종 편집본만 `brand-overview.png`로 남긴다.")을 다음으로 교체:

```markdown
   - **확정(복사)**: 방향이 lock되면 최종 편집본을 `<cwd>/.design/final/brand-kit/brand-overview.png`로 복사한다(로고·추가 탐색은 `.design/final/{logo,…}/`). 시안(`.design/generated/...`)은 지우지 않고 그대로 둔다 — 다운스트림은 `.design/final/`을 우선 읽는다.
```

5번 항목(로고·추가 탐색)의 "확정되면 해당 `.design/generated/<폴더>/`에 저장" 문구도 "확정되면 `.design/final/<폴더>/`로 복사"로 맞춘다.

- [ ] **Step 4: 출력 파일 목록에 final 추가**

출력 파일 섹션(`.design/generated/brand-kit/`·`.design/generated/logo/`)에 확정본 항목 추가:

```markdown
- `.design/final/{brand-kit,logo}/` — 확정본(다운스트림이 우선 읽음); 시안은 `.design/generated/`에 보존
```

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "docs(design-brand-kit): 정리(삭제)→복사(final) + --auto-version"
```

---

### Task 7: sync + 검증

**Files:** 없음(생성물 재생성).

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전부 PASS.

- [ ] **Step 2: Codex 번들/생성물 재생성**

`skills/`가 바뀌었으므로 sync로 Codex 번들을 재생성한다.
Run: `npm run sync`
그 다음 `git status`로 커밋되는 생성물 변화 확인(`plugins/personal/`는 gitignore라 무시).

- [ ] **Step 3: 사용자에게 reload 안내**

`/reload-plugins`(Claude) / `npm run codex:reinstall`(Codex)는 사용자가 실행. 직접 실행하지 않는다.

---

## Self-Review

**Spec coverage:**
- 덮어쓰기 방지(`--auto-version`) → Task 1. ✅
- 다른 호출자 영향 0(플래그 off 기본) → Task 1 회귀 테스트. ✅
- final 폴더 미러형 → Task 3·6 (page/brand-kit/logo). ✅
- lock 시 수동 복사 + 버전 접미 제거 → Task 3·6. ✅
- 다운스트림 final 우선·generated 폴백 → Task 4·5. ✅
- 시안 보존(삭제 안 함) → Task 3·6. ✅

**Placeholder scan:** Task 6 Step 2는 "다시 Read해 확인"으로 남겨 둠 — 이는 플레이스홀더가 아니라 동시 편집 위험에 대한 명시적 안전 절차(정확한 old text가 그 세션 결과에 의존).

**Type/이름 일관성:** `--auto-version` 플래그명, `versionedOut`/`nextVersionTargets` 헬퍼명, `.design/final/{brand-kit,logo,page}/` 경로가 전 태스크에서 일관됨. ✅
