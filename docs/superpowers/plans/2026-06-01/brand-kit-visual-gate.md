# Brand Kit 시각 승인 게이트 + 컨택트 시트 발산 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit`의 승인 게이트를 텍스트에서 공짜 시각(HTML)으로 바꾸고, 발산을 풀-킷 3벌 대신 고정 템플릿 기반 3열 컨택트 시트로 전환한다.

**Architecture:** 컨택트 시트는 결정적 스크립트(`build-contact-sheet.mjs`)가 `directions.json`을 고정 템플릿에 주입해 생성(자유 저작 X). overview.html은 기존대로 LLM 자유 저작. `routes/` 폴더는 폐지하고 단일 작업 폴더 + `directions.{json,html}`로 단순화. 레퍼런스는 overview 저작 / 컨택트 시트 / 이미지 아트디렉션 3파일로 책임 분리.

**Tech Stack:** Node.js(ESM, `node:test`), 정적 HTML/CSS, Google Fonts CDN. 스킬 마크다운 문서.

**Spec:** `docs/superpowers/specs/2026-06-01/brand-kit-visual-gate-design.md`

> **참고:** `scripts/contact-sheet.template.html`·`scripts/build-contact-sheet.mjs`는 설계 검증용 프로토타입으로 이미 작성됨. Task 1은 그 스크립트에 테스트를 입히고 에러 종료코드를 정돈한다.

> **커밋·명령 실행 규칙:** 이 저장소는 `git`/스크립트 실행 전 사용자 승인을 요구한다. 각 Task의 commit·`npm run sync` 단계는 실행 전 사용자에게 확인받는다.

---

### Task 1: build-contact-sheet 테스트 + CLI 에러 종료코드 정돈

**Files:**
- Test: `tests/build-contact-sheet.test.mjs` (create)
- Modify: `skills/design-brand-kit/scripts/build-contact-sheet.mjs` (파일 끝 `main()` 호출부)

- [ ] **Step 1: 실패 테스트 작성**

`tests/build-contact-sheet.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'design-brand-kit', 'scripts', 'build-contact-sheet.mjs');

function validData() {
  return {
    product: 'MODO',
    directions: ['a', 'b', 'c'].map((id) => ({
      id, label: `방향 ${id}`, mood: '무드', wordmark: 'MODO',
      headline: '헤드라인', body: '본문', tagline: '태그라인',
      palette: { primary: '#0E7C7B', accent: '#14B8A6', background: '#F7FAF9', surface: '#FFFFFF', text: '#0F1B1A', textMuted: '#5B6B69', border: '#E2EAE8' },
      typography: { display: '"IBM Plex Sans KR", sans-serif', body: '"Noto Sans KR", sans-serif' },
    })),
  };
}

function run(data) {
  const d = mkdtempSync(path.join(tmpdir(), 'cs-'));
  const inPath = path.join(d, 'directions.json');
  const outPath = path.join(d, 'directions.html');
  writeFileSync(inPath, JSON.stringify(data), 'utf8');
  const res = spawnSync('node', [SCRIPT, '--in', inPath, '--out', outPath], { encoding: 'utf8' });
  return { res, outPath };
}

test('유효한 3방향 → 열 3개 + 치환 안 된 토큰 없음', () => {
  const { res, outPath } = run(validData());
  assert.equal(res.status, 0, res.stderr);
  const html = readFileSync(outPath, 'utf8');
  assert.equal((html.match(/class="col"/g) || []).length, 3);
  assert.doesNotMatch(html, /\{\{[A-Z_]+\}\}/);
});

test('팔레트 HEX·워드마크·태그라인 렌더', () => {
  const { outPath } = run(validData());
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /#14B8A6/);
  assert.match(html, /MODO/);
  assert.match(html, /태그라인/);
});

test('매핑된 폰트는 해당 CDN <link>', () => {
  const { outPath } = run(validData());
  const html = readFileSync(outPath, 'utf8');
  assert.match(html, /IBM\+Plex\+Sans\+KR/);
  assert.match(html, /Noto\+Sans\+KR/);
});

test('미매핑 폰트 → stderr 경고 + Google 폴백 링크', () => {
  const data = validData();
  data.directions[0].typography.display = '"Made Up Font", sans-serif';
  const { res, outPath } = run(data);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stderr, /Made Up Font/);
  assert.match(readFileSync(outPath, 'utf8'), /Made\+Up\+Font/);
});

test('directions 가 3개가 아니면 종료코드 2', () => {
  const data = validData();
  data.directions.pop();
  assert.equal(run(data).res.status, 2);
});

test('필수 필드 누락이면 종료코드 2 + stderr 에 필드명', () => {
  const data = validData();
  delete data.directions[1].palette;
  const { res } = run(data);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /palette/);
});
```

- [ ] **Step 2: 테스트 실행 → 종료코드 2 기대하는 2개가 실패 확인**

Run: `node --test tests/build-contact-sheet.test.mjs`
Expected: 렌더/폰트/경고 테스트는 PASS, "종료코드 2" 2개는 FAIL (현재 ContactSheetError 가 uncaught → 종료코드 1).

- [ ] **Step 3: `main()` 호출부를 에러 핸들링으로 감싼다**

`skills/design-brand-kit/scripts/build-contact-sheet.mjs` 끝의 `main();` 을 교체:

```js
// ContactSheetError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (image-gen 규약과 일치).
try {
  main();
} catch (err) {
  if (err instanceof ContactSheetError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
}
```

- [ ] **Step 4: 테스트 재실행 → 전부 PASS**

Run: `node --test tests/build-contact-sheet.test.mjs`
Expected: 6 pass, 0 fail.

- [ ] **Step 5: 커밋 (승인 후)**

```bash
git add tests/build-contact-sheet.test.mjs skills/design-brand-kit/scripts/build-contact-sheet.mjs skills/design-brand-kit/scripts/contact-sheet.template.html
git commit -m "feat(brand-kit): 컨택트 시트 생성기(템플릿+주입) + 테스트"
```

---

### Task 2: 컨택트 시트 레퍼런스 문서 신설

**Files:**
- Create: `skills/design-brand-kit/references/brand-kit-contact-sheet.md`

- [ ] **Step 1: 문서 작성**

`brand-kit-contact-sheet.md` 에 다음을 담는다(실제 내용으로 작성):
- **책임 선언**: `directions.html`(발산 게이트) 생성 전담. overview.html(자유 저작)·brand-kit-image.md(이미지)와의 경계.
- **자유 저작 금지**: 컨택트 시트는 `build-contact-sheet.mjs`가 고정 템플릿에 `directions.json`을 주입해 만든다. 3열은 동일 레이아웃이라야 색·폰트 차이가 또렷하다 — LLM이 HTML을 직접 쓰지 않는다.
- **`directions.json` 스키마**: spec 의 스키마 블록(product + directions[3].{id,label,mood,wordmark,headline,body,tagline,palette{primary,accent,background,surface,text,textMuted,border},typography{display,body}}) 전체. 폰트 스택은 `../references/design/font-catalog.md`에서만 고른다.
- **3방향 스프레드 가이드**(brand-kit-image.md 에서 이관): 출발점 아키타입 — 루트 A 안전한 라이트 SaaS형 / 루트 B 프리미엄 에디토리얼형 / 루트 C 대담한 실험형. 제품 무드(Q4–6)로 또렷이 다른 세 방향으로 구체화하며, 셋은 같은 제품 사실(§1·타깃·문제)과 Q6 회피 제약만 공유한다("같은 브랜드의 세 해석"이 아니다). 디스커버리에서 거부된 방향만 대체.
- **생성 명령**: `node "<skill>/scripts/build-contact-sheet.mjs" --in "<cwd>/.design/brand-kit/directions.json" --out "<cwd>/.design/brand-kit/directions.html"`
- **게이트 사용**: 시트를 사용자에게 제시 → 한 열 선택 → 그 방향만 풀 킷으로 전개(SKILL.md 흐름 4). 분위기 고정이면 컨택트 시트 단계 자체를 건너뛴다.

- [ ] **Step 2: 검증**

Run: `node skills/design-brand-kit/scripts/build-contact-sheet.mjs --in <샘플> --out <임시>` 로 문서의 스키마·명령이 실제 스크립트와 일치하는지 1회 대조(필드명 오타 없음).
Expected: 정상 생성.

- [ ] **Step 3: 커밋 (승인 후)**

```bash
git add skills/design-brand-kit/references/brand-kit-contact-sheet.md
git commit -m "docs(brand-kit): 컨택트 시트 레퍼런스 신설(발산 3방향 가이드 이관)"
```

---

### Task 3: html-direction.md → brand-kit-html-direction.md 승격(이름변경) + 참조 갱신

**Files:**
- Rename: `skills/design-brand-kit/references/html-direction.md` → `skills/design-brand-kit/references/brand-kit-html-direction.md`
- Modify: `skills/design-brand-kit/SKILL.md:292`
- Modify: `skills/design-brand-kit/references/brand-kit-image.md:106`, `:108`

- [ ] **Step 1: git mv 로 이름변경**

```bash
git mv skills/design-brand-kit/references/html-direction.md skills/design-brand-kit/references/brand-kit-html-direction.md
```

- [ ] **Step 2: SKILL.md 참조 갱신**

`SKILL.md:292` 의 `` `references/html-direction.md` `` → `` `references/brand-kit-html-direction.md` `` (한 군데).

- [ ] **Step 3: brand-kit-image.md 참조 갱신**

`brand-kit-image.md:106` 헤딩 `### HTML 오버뷰 레이아웃 스펙 → references/html-direction.md` 와 `:108` 본문의 `html-direction.md` 를 모두 `brand-kit-html-direction.md` 로.

- [ ] **Step 4: 잔여 참조 0 확인**

Run: `rg "html-direction\.md" skills/design-brand-kit` (또는 Grep)
Expected: `brand-kit-html-direction.md` 만 매칭, 구 이름 0건.

- [ ] **Step 5: 커밋 (승인 후)**

```bash
git add -A skills/design-brand-kit
git commit -m "refactor(brand-kit): html-direction → brand-kit-html-direction 승격 + 참조 갱신"
```

---

### Task 4: brand-kit-image.md — 발산 3루트 삭제 + routes/ 경로 정리

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

- [ ] **Step 1: "발산 3 루트" 절 삭제**

`### 발산 3 루트 (route별 풀 overview.html 비교)` 헤딩부터(현 110행) 그 절 끝(현 126행, 루트 A/B/C 매핑 포함)까지 **통째 삭제**. 발산 책임은 SKILL.md + brand-kit-contact-sheet.md 로 이관됨.

- [ ] **Step 2: 산출물 v2 절에서 routes/ 언급 제거**

현 10~11행, 19~20행의 `routes/route-{a,b,c}/assets/`·`routes/route-{a,b,c}/overview.html` 등 route별 경로 문장을 단일 작업 폴더(`.design/brand-kit/`) 기준으로 수정. "발산 중: 각 route…" 문장 제거.

- [ ] **Step 3: §11 저장 절에서 routes/ 경로 제거**

현 191~194행의 "발산 route 자산"·"확정 승격"(routes/route-X 순수 복사) 문장을 제거하고, 저장 경로를 `.design/brand-kit/assets/`(작업) / `.design/final/brand-kit/assets/`(lock) 2단계로 단순화.

- [ ] **Step 4: §12 발산 prompt 노트 정리**

현 242행 `**발산 3 루트**: …` 문단에서 route별 자산 경로(`routes/...`) 언급을 제거. 발산 시 프롬프트가 directions 에서 고른 방향 1벌 기준임을 반영하거나, 발산 오케스트레이션은 SKILL.md 참조로 한 줄 처리.

- [ ] **Step 5: routes/ 잔여 0 확인**

Run: `rg "routes/route" skills/design-brand-kit/references/brand-kit-image.md`
Expected: 0건.

- [ ] **Step 6: 커밋 (승인 후)**

```bash
git add skills/design-brand-kit/references/brand-kit-image.md
git commit -m "docs(brand-kit): 이미지 가이드에서 발산 3루트 삭제·routes/ 경로 정리"
```

---

### Task 5: SKILL.md — 레이아웃·흐름·게이트·경로 개정

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: 출력 파일 레이아웃(현 59~86행) 교체**

`routes/route-{a,b,c}/` 트리를 spec 의 새 레이아웃으로 교체:
```
.design/brand-kit/
  directions.json      # 열림일 때만 — 3방향 최소 데이터
  directions.html      # 열림일 때만 — 3열 컨택트 시트 (= 발산 게이트)
  BRAND_KIT.md / brand-tokens.json / overview.html / brief.md
  assets/  logo-base · wordmark-base · key-visual · ui-base · icons/<name>.png
.design/final/brand-kit/  …  # lock (변경 없음)
```
레이아웃 규칙에서 "확정 = 순수 복사(routes→top)" 제거(단일 작업 폴더), `<img>` 형제 assets 상대참조·lock 순수 복사·`--auto-version`·분위기 분기 규칙은 유지하되 routes 표현 제거.

- [ ] **Step 2: brand-tokens 폰트 노트(현 205행) 개정**

"후보 2~3개를 specimen URL과 함께 제시해 승인 게이트(흐름 3)에서 확정" → 폰트 후보를 **컨택트 시트(directions.html)에서 실폰트로 시각 제시**해 게이트에서 고른다로 수정(글자 대신 보고 고름).

- [ ] **Step 3: brand-briefs 발산 3루트(현 222~226행) 개정**

`### 발산 3 루트 (자산 첫 생성용 …)` 서브섹션을 directions 기반으로: 발산은 `directions.json`(3방향 최소 데이터) → 컨택트 시트 게이트로 하며, 상세 스프레드 가이드는 `references/brand-kit-contact-sheet.md` 참조. route별 brief 3벌 언급 제거(brief 는 고른 방향 1벌).

- [ ] **Step 4: 흐름 3·4(현 296~303행) 재작성**

- 흐름 3(승인 게이트): "문서 제시" → **분위기 열림이면 `directions.html`(3열 컨택트 시트) 제시 → 한 열 선택**; **고정이면 data-only `overview.html` 제시 → 승인**. 어느 쪽도 게이트까지 이미지 0콜.
- 흐름 4(발산): "routes 풀 overview 3장 비교/순수 복사 승격" → "`build-contact-sheet.mjs`로 `directions.html` 생성 → 한 열 선택 → 그 방향만 `.design/brand-kit/`에 풀 킷 인스턴스화". route 폴더·승격 복사 표현 제거.
- 흐름 1: "분위기 열림 → routes/route-{a,b,c}/ 3벌" → "분위기 열림 → `directions.json` 작성 후 컨택트 시트". 단일 방향 전개는 고른 뒤.

- [ ] **Step 5: 이미지 호출 예시(현 266~288행) 경로 수정**

`routes/route-a/assets/...` 절대경로 예시를 `.design/brand-kit/assets/...` 기준으로 수정(발산 route 예시 2개 → 단일 작업 폴더 예시로 통합). 투명 라우팅·앵커 일관성·품질 규율 텍스트는 유지.

- [ ] **Step 6: routes/ 잔여 0 확인 + 컨택트 시트 참조 존재 확인**

Run: `rg "routes/route" skills/design-brand-kit/SKILL.md` → 0건.
Run: `rg "brand-kit-contact-sheet|directions\.(json|html)" skills/design-brand-kit/SKILL.md` → 흐름/레이아웃에 참조 존재.

- [ ] **Step 7: 커밋 (승인 후)**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): 시각 게이트·컨택트 시트 발산으로 흐름·레이아웃 개정"
```

---

### Task 6: Codex 번들 sync + 전체 테스트 + 최종 확인

**Files:** (생성물 — 직접 수정 X)

- [ ] **Step 1: sync 재생성 (승인 후 실행)**

Run: `npm run sync`
Expected: `plugins/personal/` 의 design-brand-kit 스킬에 새 `scripts/`·`references/` 가 반영(에러 없이 완료). (gitignore된 로컬 생성물 — 커밋 안 함.)

- [ ] **Step 2: 전체 테스트**

Run: `npm test`
Expected: 신규 `build-contact-sheet.test.mjs` 포함 전부 PASS.

- [ ] **Step 3: 게이트 통합 확인 — 샘플 directions 로 시트 1장 생성**

Run: `node skills/design-brand-kit/scripts/build-contact-sheet.mjs --in <샘플 directions.json> --out <임시>.html` → 브라우저 육안 확인(3열 themed 렌더).
Expected: A/B/C 각자 색·폰트로 또렷이 구분.

- [ ] **Step 4: 문서 일관성 스윕**

Run: `rg "routes/route" skills/design-brand-kit`
Expected: 0건(SKILL.md·references 전반에서 route 폴더 표현 제거 완료).

---

## Self-Review

**Spec coverage:**
- 결정1(시각 게이트) → Task 5 Step 4. 결정2(overview 재사용+플레이스홀더) → Task 5 Step 1·4. 결정3(컨택트 시트 발산) → Task 1·2, Task 5 Step 3·4. 결정4(템플릿+주입 결정적) → Task 1. 결정5(routes/ 폐지) → Task 4·5. 결정6(레퍼런스 책임 분리) → Task 2·3·4. 검증(테스트·sync) → Task 1·6. 누락 없음.

**Placeholder scan:** 코드 단계(Task 1)는 전체 테스트·구현 코드 포함. 문서 단계(Task 2·4·5)는 "실제 내용으로 작성/교체"를 지시하되 무엇을 어디서 가져와 어떻게 바꾸는지 행 번호·출처와 함께 명시 — 마크다운 산문 재작성이라 코드블록 대신 구체 지시로 충분.

**Type consistency:** `build-contact-sheet.mjs`·`directions.json` 필드명(label/mood/wordmark/headline/body/tagline/palette{7키}/typography{display,body})이 스크립트·테스트·Task 2 문서에서 일치. `ContactSheetError`·종료코드 2 가 Task 1 전체에서 일관.
