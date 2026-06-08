# 컨트롤 높이 토큰화 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08/control-height-tokens-design.md`

**Goal:** `tokens-to-css.mjs`가 고정 관례 `--control-h-sm/md/lg`(32/40/48px)를 emit하고, design-ui-kit이 단일행 컨트롤(input·button·select 등)에 이 높이를 쓰도록 저작 규칙을 박아 같은 행 컨트롤 높이 정렬을 구조적으로 보장한다.

**Architecture:** 토큰 primitive는 코드 변경(TDD), 소비·거울은 SKILL.md 프로즈. `--space-1..8`과 동일한 고정 관례 레이어로 추가해 brand-tokens.json은 건드리지 않는다.

**Tech Stack:** Node.js ESM(`tokens-to-css.mjs`), node:test, Markdown(SKILL.md). 검증 `npm test` + Grep/Read.

---

## File Structure

- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs` — `--control-h-*` emit
- Modify: `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` — emit 검증
- Modify: `skills/design-ui-kit/SKILL.md` — 변수 네이밍 계약 + 단일행 컨트롤 높이 저작 규칙
- Modify: `skills/design-md-compiler/SKILL.md` — §4 frontmatter 거울에 `--control-h-*`

> **동시 세션 주의:** `design-ui-kit/SKILL.md`·`design-md-compiler/SKILL.md`에 다른 세션의 미커밋 경로-재구성 수정이 있다. 사용자가 "무시하고 진행" 승인함(위치 변경이라 무해). 각 태스크에서 `git add <정확한 파일경로>`만 쓰되, 그 파일의 경로-재구성 hunk가 함께 커밋될 수 있음을 인지한다. **`git add -A`/`git add .` 절대 금지**(다른 파일 혼입 방지). `tokens-to-css.mjs`·테스트는 깨끗하니 무관.

---

## Task 1: tokens-to-css.mjs에 `--control-h-*` 고정 관례 emit (TDD)

**Files:**
- Modify: `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs`

- [ ] **Step 1: 실패 테스트 추가**

`tokens-to-css.test.mjs`의 "입력과 무관하게 고정 관례 spacing 스케일 추가" 테스트 **다음**에 삽입:
```js
test("고정 관례 컨트롤 높이 스케일 추가", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--control-h-sm:\s*32px/);
  assert.match(css, /--control-h-md:\s*40px/);
  assert.match(css, /--control-h-lg:\s*48px/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
Expected: 새 테스트 FAIL(`--control-h-sm` 미존재), 나머지 PASS.

- [ ] **Step 3: 최소 구현**

`tokens-to-css.mjs` 상단 `const MICRO_SPACE = {...};` 줄 **다음**에 추가:
```js
const CONTROL_HEIGHT = { sm:"32px", md:"40px", lg:"48px" };
```
그리고 `generateTokensCss` 안의 MICRO_SPACE emit 루프
```js
  for (const [k, v] of Object.entries(MICRO_SPACE)) L.push(`  --space-${k}: ${v};`);
```
**다음 줄**에 추가:
```js
  for (const [k, v] of Object.entries(CONTROL_HEIGHT)) L.push(`  --control-h-${k}: ${v};`);
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
Expected: 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs
git commit -m "feat(tokens-to-css): 고정 관례 컨트롤 높이 --control-h-sm/md/lg emit

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: design-ui-kit 변수 네이밍 계약 + 단일행 컨트롤 높이 규칙

**Files:**
- Modify: `skills/design-ui-kit/SKILL.md`

먼저 파일을 Read해 아래 두 앵커의 현재 위치를 확인한다(동시 세션으로 줄번호 이동 가능).

- [ ] **Step 1: 변수 네이밍 계약에 control-h 추가**

변수 네이밍 계약 목록에서 micro spacing 줄
```md
- micro spacing(고정 관례) `--space-1`…`--space-8` = 4/8/12/16/24/32/48/64
```
**다음 줄**에 삽입:
```md
- control height(고정 관례) `--control-h-sm|md|lg` = 32/40/48
```

- [ ] **Step 2: ui-kit.css 저작 단계에 컨트롤 높이 규칙 추가**

Phase 2 `**ui-kit.css 저작**` 단계 본문(매트릭스 강제상태 예시 부근) 아래에 소절 삽입:
```md
   **단일행 컨트롤 높이 정렬(중요)**: `.input`·`.select`·`.btn`(+`.btn-sm`/`.btn-lg`)·`.stepper`·search field 등 한 줄짜리 인터랙티브 컨트롤은 세로 크기를 padding이 아니라 **`height: var(--control-h-md)`**(기본)로 잡고, 변형은 `--control-h-sm`/`--control-h-lg`를 쓴다. 콘텐츠는 flex(`align-items:center`) 또는 line-height로 세로 센터링하고, **가로 padding은 유지**한다. 이렇게 해야 input·button을 한 행에 놓아도 높이가 어긋나지 않는다. **textarea(멀티라인)·checkbox/radio/toggle(자체 고정 크기)은 제외.**
```

- [ ] **Step 3: 반영 확인**

Run: Grep `control-h` in `skills/design-ui-kit/SKILL.md`
Expected: 네이밍 계약 + 저작 규칙 두 군데에 존재.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(design-ui-kit): 단일행 컨트롤 높이를 --control-h-* 토큰으로 정렬

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
> `git status --short`로 staged가 `design-ui-kit/SKILL.md` 하나뿐인지 확인 후 커밋.

---

## Task 3: md-compiler §4 frontmatter 거울에 control-h 포함

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

먼저 Read로 frontmatter YAML 예시 블록 위치 확인.

- [ ] **Step 1: frontmatter 예시에 controls 키 추가**

frontmatter YAML 주석 블록의 `spacing:` 줄
```yaml
spacing:       # (--space-*)
```
**다음 줄**에 삽입:
```yaml
controls:      # 컨트롤 높이 (--control-h-*)
```

- [ ] **Step 2: D1 거울 규칙에 control-h 명시**

작성 규칙 D1(frontmatter 컴파일) 문장 끝에 한 구절 추가:
```md
컨트롤 높이 `--control-h-*`도 spacing·radius와 같은 고정 관례 토큰이므로 frontmatter에 거울로 포함한다(`controls:`).
```

- [ ] **Step 3: 반영 확인**

Run: Grep `control-h` in `skills/design-md-compiler/SKILL.md`
Expected: frontmatter 예시 + D1 두 군데에 존재.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(design-md-compiler): frontmatter 거울에 --control-h-* 포함

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
> `git status --short`로 staged가 `design-md-compiler/SKILL.md` 하나뿐인지 확인 후 커밋.

---

## Task 4: 회귀 확인

**Files:** 없음(검증만)

- [ ] **Step 1: 전체 테스트**

Run: `npm test`
Expected: 전부 PASS(신규 control-h 테스트 포함). **`npm run sync`는 상위에서 처리 — 실행 금지.**

---

## Self-Review

- **스펙 커버리지:** 설계1(토큰 emit)→Task1, 설계2(ui-kit 소비)→Task2, 설계3(md frontmatter)→Task3, 회귀→Task4. 전 항목 대응.
- **Placeholder:** 모든 코드/텍스트 스텝에 실제 내용 포함. TBD 없음.
- **일관성:** 토큰명 `--control-h-sm/md/lg`·값 32/40/48이 Task1(코드)·Task2(계약·규칙)·Task3(frontmatter)에서 동일. textarea·checkbox 제외가 Task2에 명시.
