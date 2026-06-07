# design-logo HTML 재작성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-logo` 스킬을 "40칸 그리드 이미지 보드" 모델에서 "3~4개 개별 투명 PNG + 저작한 `logos.html` 탐색 시트" 모델로 재작성한다.

**Architecture:** 변경은 두 소스 파일에 국한된다 — `skills/design-logo/SKILL.md`(흐름·출력·이미지 라우팅 재작성)와 `skills/design-logo/references/`(보드 ref 제거 → 시트 저작 ref 신설). 실행 코드는 없고 마크다운 콘텐츠다. 검증은 (1) 새 ref 존재·구 ref 제거, (2) SKILL.md에 제거된 보드/ref로의 dangling 참조 없음, (3) `npm run sync` 무오류(skills/ → Codex 번들 재생성), (4) `npm test` 그린.

**Tech Stack:** Markdown 스킬 문서, Node.js 스크립트(`npm run sync` = sync-mcp + sync-codex-plugin + sync-agents), `node --test`(기존 스크립트 테스트). 이미지 생성은 공유 `image-gen` 스킬(`gpt-image-1.5 --background transparent --autocrop`).

**참조 스펙:** `docs/superpowers/specs/2026-06-02/design-logo-html-rewrite-design.md`

---

## File Structure

| 파일 | 책임 | 변경 |
|---|---|---|
| `skills/image-gen/scripts/image-gen.mjs` | 공유 이미지 생성기 | `--input-fidelity` 복원(모델 게이트) |
| `tests/image-gen-image-input.test.mjs` | image-gen edits 동작 테스트 | "제거 가드" 2건 뒤집기 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | 탐색 시트 저작 가이드: 레이아웃·카드·발산 모드(A/B/C)·수렴·컷아웃 프롬프트 청크 | **신규** (fidelity 서술 보정 포함) |
| `skills/design-logo/SKILL.md` | 스킬 본문: 목적·전제·입출력 파일·이미지 라우팅·흐름(Phase 0~3)·`logos.html` 저작·라이브 프리뷰·품질/금지 | **재작성** |
| `skills/design-logo/references/logo-exploration-board.md` | (구) 40칸 보드 아트 디렉션 | **제거** |
| `../references/design/logo-art-direction.md` (공유) | 형태 언어·품질 테스트·Avoid(§1–9) | **불변** — 인용만 유지 |

각 태스크는 독립적으로 의미 있는 변경을 만든다. 실행 순서: Task 0(image-gen 선행) → Task 1(시트 ref) → Task 1b(ref fidelity 보정) → Task 2(SKILL.md 재작성 + 구 ref 제거) → Task 3(sync·test 검증).

> **보정 노트 (리뷰 중 발견):** 스펙·계획이 "`--image`는 항상 high fidelity"라는 구 gpt-image-2 보드 플로우의 전제를 베껴왔으나, 새 플로우의 컷아웃은 `gpt-image-1.5`이고 `image-gen`이 `input_fidelity`를 보내지 않아 기본 low로 느슨하게 참조한다. 따라서 Task 0에서 `--input-fidelity`를 복원하고, 앵커 호출(모드 A·C·수렴·다듬기)은 `--input-fidelity high`를 쓰도록 문서를 보정한다. 스펙 결정 7 참조.

> **레이아웃 후속 변경 (실행 후):** 아래 Task 1·2 본문에 박힌 경로 스냅샷은 `.design/generated/logo/`(작업)·`.design/final/logo/`(flat lock)을 쓰지만, 사용자 결정으로 **brand-kit 동형 레이아웃**으로 옮겼다 — 작업은 `.design/logo/`(시트·brief는 루트, 모든 PNG는 `assets/`), lock은 `.design/final/logo/assets/`, `logos.html`의 `<img>`는 `assets/...` 상대참조, 라이브 서버는 `.design/logo`. **정본은 커밋된 `skills/design-logo/SKILL.md`·`references/logo-sheet-html-direction.md`와 스펙의 "파일 구조" 절**이며, 아래 스냅샷은 그보다 앞선 상태다.

> **Phase 3 제거 (실행 후):** 아래 Task 2 본문에 있는 "Phase 3 — (선택) 로고 시스템"(wordmark·favicon·app-icon)과 "다음 단계: design-page-image" 안내는 사용자 결정으로 **삭제**했다 — 현재 로고 시스템은 불필요하므로 확정 **단일 로고만** 산출하고, 끝나면 **`design-iconset`**으로 안내한다. 정본은 커밋된 `skills/design-logo/SKILL.md`.

---

### Task 0: image-gen `--input-fidelity` 복원 (선행)

**Files:**
- Modify: `skills/image-gen/scripts/image-gen.mjs`
- Test: `tests/image-gen-image-input.test.mjs`

배경: `a65eaf5`가 `--input-fidelity`를 추가했으나 이후 "gpt-image-2 미지원"을 이유로 일괄 제거됐다. gpt-image-1.x에서 유용하던 옵션까지 죽어, 새 design-logo 플로우(gpt-image-1.5 앵커 컷아웃)가 입력 마크에 못 묶인다. **모델 게이트로 복원**한다.

- [ ] **Step 1: 회귀 테스트부터 갱신 (TDD — 기대 동작을 먼저 고정)**

`tests/image-gen-image-input.test.mjs`에서 기존 "제거되어 거부된다" 테스트(아래)를 **삭제**한다:
```js
// gpt-image-2 는 input_fidelity 를 지원하지 않아 옵션을 제거했다.
// 이제 --input-fidelity 는 알 수 없는 인자로 비0 종료해야 한다(회귀 가드).
test('--input-fidelity 는 제거되어 알 수 없는 인자로 거부된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--input-fidelity', 'high', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /알 수 없는 인자/);
});
```
그 자리에 아래 4개 테스트를 추가한다:
```js
// --input-fidelity 는 gpt-image-1.x + edits(--image) 일 때만 페이로드에 들어간다.
test('--input-fidelity high + --image + gpt-image-1.5 면 payload 에 input_fidelity 가 있다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'high', '--model', 'gpt-image-1.5', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"input_fidelity": "high"/);
});

test('gpt-image-2 에는 --input-fidelity 를 줘도 payload 에서 빠진다', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--input-fidelity', 'high', '--model', 'gpt-image-2', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});

test('--input-fidelity 가 high|low 가 아니면 비0 종료한다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--input-fidelity', 'medium', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /high 또는 low/);
});

test('--input-fidelity 없이 --image 만이면 payload 에 input_fidelity 가 없다 (기존 가드 유지)', () => {
  const img = makeImage();
  const res = run(['--prompt', 'x', '--out', outPath(), '--image', img, '--model', 'gpt-image-1.5', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /input_fidelity/);
});
```
(라인 60-65의 기존 "input_fidelity 가 없다" 테스트는 model 기본값이 gpt-image-2라 그대로 통과 — 유지.)

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: 새 테스트가 FAIL(아직 `--input-fidelity`가 알 수 없는 인자라 status 2 / payload에 input_fidelity 없음).

- [ ] **Step 3: 스크립트에 옵션 복원 (모델 게이트)**

`skills/image-gen/scripts/image-gen.mjs` 변경:

(a) `parseArgs`의 `--image` 케이스 바로 다음 줄에 추가:
```js
      case '--input-fidelity': opts.inputFidelity = next(); break;
```

(b) `main()`의 `for (const img of opts.images)` 검증 루프 바로 다음에 추가:
```js
  if (opts.inputFidelity && !['high', 'low'].includes(opts.inputFidelity)) {
    die('오류: --input-fidelity 는 high 또는 low 여야 합니다.');
  }
```

(c) 기존 주석(아래 2줄)을 교체:
```js
  // input_fidelity 는 gpt-image-2 가 지원하지 않는다(항상 high fidelity로 입력 이미지를 처리).
  // 따라서 페이로드에 넣지 않는다 — gpt-image-1/1.5 만 low/high 선택을 지원했던 옵션이라 제거함.
```
다음으로:
```js
  // input_fidelity: gpt-image-1.x + edits(--image) 에서만 의미가 있다.
  // gpt-image-2 는 미지원(항상 high)이라 보내지 않는다 — 플래그가 와도 조용히 드롭하고 통지만.
  if (opts.inputFidelity) {
    if (useEdits && opts.model.startsWith('gpt-image-1')) {
      fields.input_fidelity = opts.inputFidelity;
    } else if (opts.model.startsWith('gpt-image-2')) {
      console.error('알림: gpt-image-2 는 input_fidelity 를 지원하지 않아 무시합니다(항상 high).');
    }
  }
```

(d) 파일 상단 옵션 주석 블록에서 `--background` 설명 줄 다음에 도움말 1줄 추가:
```js
//   --input-fidelity high | low           (gpt-image-1.x + --image 에서만; gpt-image-2는 무시)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/image-gen-image-input.test.mjs`
Expected: 모든 테스트 PASS.

- [ ] **Step 5: Commit**

```
git add skills/image-gen/scripts/image-gen.mjs tests/image-gen-image-input.test.mjs
git commit -F <메시지파일>
```
커밋 메시지(정확히):
```
feat(image-gen): --input-fidelity 모델 게이트로 복원

gpt-image-1.x + edits 에서만 input_fidelity 를 보내고 gpt-image-2 에는
보내지 않는다. design-logo 의 앵커 컷아웃(gpt-image-1.5)이 입력 마크에
high fidelity 로 묶이도록 복원. 회귀 가드 테스트를 동작·게이트 검증으로 갱신.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

---

### Task 1b: 시트 ref fidelity 서술 보정

**Files:**
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`

Task 1에서 만든 ref는 "`gpt-image`는 `--image`를 항상 high fidelity"라는 틀린 전제를 담고 있다. Task 0 복원에 맞춰 보정한다.

- [ ] **Step 1: §3 근거 문단 교체**

`## 3. 발산 모드 (A / B / C)`의 `- **근거**:` 줄을 아래로 교체:
```markdown
- **근거**: 컷아웃은 `gpt-image-1.5`로 만든다. `image-gen`이 `input_fidelity`를 안 보내면 입력 이미지를 **기본 low로 느슨하게** 참조하므로, 모드 A·C(앵커 첨부)는 `--input-fidelity high`를 함께 줘야 마크에 단단히 묶인다. "메타포까지 완전 발산"을 원하면 시드를 붙이지 않는 B가 맞다. 모드 A에서 변주 폭이 좁아지는 건 **의도된 트레이드오프**.
```

- [ ] **Step 2: §5 수렴 첫 항목 교체**

`## 5. 수렴 (고른 #N → 좁히기)`의 첫 불릿을 아래로 교체:
```markdown
- 사용자가 #N을 고르면 그 **PNG를 `--image --input-fidelity high`로 첨부** + "이 방향을 유지하며 서로 조금씩 다른 3~4 변주". high fidelity가 방향을 단단히 묶는다.
```

- [ ] **Step 3: §6 다듬기 항목 보정**

`## 6. 단독 로고 만들기`의 둘째 불릿에서 ``그 PNG를 `--image`로 첨부`` → ``그 PNG를 `--image --input-fidelity high`로 첨부``로 바꾼다.

- [ ] **Step 4: §8 청크 꼬리·모드 A/C·수렴 줄 보정**

`## 8. 컷아웃 생성 프롬프트 청크`에서:
- "모드 A·C: 위 청크 + `logo-base.png`(A) ..." 줄 끝에 `` 호출에 `--input-fidelity high` 를 더한다.``를 덧붙인다.
- ``수렴: 고른 #N PNG를 `--image`로 첨부`` → ``수렴: 고른 #N PNG를 `--image --input-fidelity high`로 첨부``.
- 마지막 문장 "한 라운드 3~4콜은 ... `--model gpt-image-1.5 --background transparent --autocrop --auto-version`." 뒤에 `` 앵커(A·C·수렴)는 여기에 `--input-fidelity high` 추가.``를 덧붙인다.

- [ ] **Step 5: 보정 반영 검증**

Grep 도구로 `skills/design-logo/references/logo-sheet-html-direction.md`에서 확인:
- `--input-fidelity high` → 매치 ≥3.
- `항상 high fidelity` → **매치 0** (틀린 전제 제거됨).

- [ ] **Step 6: Commit**

```
git add skills/design-logo/references/logo-sheet-html-direction.md
git commit -F <메시지파일>
```
커밋 메시지(정확히):
```
fix(design-logo): 시트 ref fidelity 서술을 --input-fidelity high 기준으로 보정

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

---

### Task 1: 시트 저작 ref 신설

**Files:**
- Create: `skills/design-logo/references/logo-sheet-html-direction.md`

- [ ] **Step 1: 새 ref 파일 작성**

아래 전체 내용을 그대로 작성한다:

````markdown
# 로고 탐색 시트 (logos.html) 저작 가이드

## 0. 목적 / 사용법

`design-logo`가 **한 라운드 3~4개 로고 컨셉**을 개별 투명 PNG로 만든 뒤, 그것들을 저작한 `logos.html` 탐색 시트에 담을 때 읽는다. 형태 언어·컨셉 5방법·construction geometry·품질 테스트·Avoid는 공유 ref `../../references/design/logo-art-direction.md`(§1–9)를 따르고, 이 문서는 **시트 레이아웃·카드 구성·발산 모드 스티어·수렴·컷아웃 프롬프트 청크**만 다룬다.

목표 품질: "괜찮은 AI 이미지"가 아니라 **진지한 브랜딩 스튜디오의 로고 탐색 시트**. 시트는 이미지가 아니라 `overview.html`처럼 **LLM이 저작하는 HTML**이다.

## 1. 시트 레이아웃 (logos.html)

- **단일 self-contained HTML**(CSS 인라인). 모든 `<img>`는 **형제 상대경로**(`concepts/round-N/01.png`·`seed.png`) — `generated/logo/`든 어디든 같은 HTML이 동작.
- brand-kit의 A/B/C/D 아키타입을 쓰지 **않는다** — 목적이 다른 **전용 탐색 시트**(마크 비교 갤러리).
- **번호 카드 그리드**: 한 라운드 3~4개 + 베이스라인 타일. 카드 사이 넉넉한 거터, 절제된 밀도.
- **헤더**: 브랜드명 + "LOGO EXPLORATION" + 라운드·발산 모드 라벨(예: "Round 2 · 제로베이스 발산").
- **푸터**: 태그라인 + 작은 스튜디오 라벨.
- 캔버스 라이트/다크는 브랜드 비주얼 모드(BRAND_KIT)에 맞춘다. **실색**은 `brand-tokens.json`, **실폰트**는 `../../references/design/font-catalog.md`의 실존 family를 CDN `<link>`로 로드.
- 콘텐츠(브랜드명·태그라인·라벨)는 지어내지 않는다 — `BRAND_KIT.md`/tokens에서, 라벨은 그 라운드에서 실제 만든 컨셉 방향을 가리킨다.

## 2. 카드 구성

각 카드 = **투명 로고 PNG**(충분히 크게 — autocrop으로 마크가 캔버스를 꽉 채운 상태라 `height:Npx`가 곧 마크 크기) + **인덱스 번호**(`01`–`04`) + **한 줄 방향 라벨** + **컨셉 방법/유형 태그**(예: "negative-space / symbol").
- `logo-base.png` = **베이스라인 타일(#0 "brand-kit 기준")** 고정. 비교·즉시 선택용.
- 비정사각 마크는 `object-fit:contain`.

## 3. 발산 모드 (A / B / C)

탐색 시작 시 발산 앵커를 고른다. **라운드마다 다시 고를 수 있다**.

| 모드 | 앵커 | `--image` | 특성 |
|---|---|---|---|
| A 기준 발산 | `logo-base.png` | 첨부 | 그 마크 계열 변주. 일관성↑ 다양성↓ |
| B 제로베이스 완전 발산 | 없음 | 미첨부 | `BRAND_KIT.md` §6·메타포·색·금지·성격을 프롬프트에. 다양성 최대 |
| C 첨부 이미지 기준 | 사용자 첨부 이미지(`seed-user.png`) | 첨부 | 사용자 레퍼런스를 앵커로 |

- **근거**: `gpt-image`는 `--image`를 **항상 high fidelity**로 처리한다(`--input-fidelity` 미지원). 시드를 붙이면 그 마크에 강하게 끌려가므로, "메타포까지 완전 발산"을 원하면 시드를 붙이지 않는 B가 맞다. 모드 A에서 변주 폭이 좁아지는 건 **의도된 트레이드오프**.

## 4. 컨셉 분포 (3~4개를 다르게)

- 3~4개를 `logo-art-direction.md`의 축에 걸쳐 분포 — 한 형태의 미세 변주 반복 금지.
- 컨셉 5방법(§2): 모노그램+의미 / 제품 액션 / 메타포 융합 / 네거티브 스페이스 / 구성 기하. 유형(§4): 워드마크 / 레터마크 / 심볼 / 콤비네이션 / 엠블럼.
- 발산 모드 B·C는 **메타포·심볼 자체가 다른** 큰 스윙(추상 기하 vs 구체 상징 vs 레터마크). 브랜드 **성격·금지·색**만 공유 — "한 브랜드의 3~4가지 해석".

## 5. 수렴 (고른 #N → 좁히기)

- 사용자가 #N을 고르면 그 **PNG를 `--image`로 첨부** + "이 방향을 유지하며 서로 조금씩 다른 3~4 변주". high fidelity가 방향을 단단히 묶는다.
- 새 라운드는 시트를 **교체**한다. 이전 PNG는 `concepts/round-N/`에 `--auto-version`으로 남는다.

## 6. 단독 로고 만들기 (고른 #N → 단독 로고)

- 고른 PNG는 이미 깨끗한 투명 단독 컷아웃이므로 **보드 셀 재추출이 없다**. 만족스러우면 그 PNG를 `logo-candidate.png`로 승격해 다듬는다.
- 더 다듬고 싶으면 그 PNG를 `--image`로 첨부 + "중앙 정렬, plain 단색/투명 배경, 형태·기하 유지, 단일 마크만". 품질 프레이밍·Avoid는 `../../references/design/logo-art-direction.md` §3·§6·§7, 판정은 §8.

## 7. 금지 사항

- 카드마다 완전히 다른 스타일 난립으로 브랜드 일관성 상실(발산은 메타포 발산이지 품질 난립이 아님).
- 번호 누락·중복, 한 카드에 여러 마크, 읽히지 않는 미세 디테일, 시트에 가짜 본문 텍스트.
- `logo-art-direction.md` §6 클리셰(방패·자물쇠·기어·말풍선·의미 없는 그라데이션/3D/sparkle, 유명 마크 모방).

## 8. 컷아웃 생성 프롬프트 청크 (그대로 떠넣기)

**발산 모드 B(제로베이스) — 컨셉 1개당 1콜**:
```text
Create ONE clean logo mark for "[BRAND NAME]" — a single centered mark on a transparent background, no grid, no text labels, no scenery.
Concept: [this card's method/type — e.g. negative-space symbol of (core metaphor)]. Single consistent stroke weight, strong silhouette, legible at small size, valid in solid monochrome. Brand color [HEX].
Brand DNA: [core metaphor / construction from BRAND_KIT §6], [personality adjectives].
Avoid: shield/lock/globe/gear/speech-bubble cliches, meaningless gradient/3D bevel/drop shadow/sparkle, copying famous marks, text-only logo.
```
- 모드 A·C: 위 청크 + `logo-base.png`(A) 또는 `seed-user.png`(C)를 `--image`로 첨부, "이 마크를 모티브로 한 새 해석" 문구 추가.
- 수렴: 고른 #N PNG를 `--image`로 첨부 + "이 방향을 유지하며 서로 조금씩 다른 변주, 단일 마크, 투명 배경".

위 [브래킷]은 `BRAND_KIT.md`/tokens/Q&A에서 채운다. 한 라운드 3~4콜은 **병렬 백그라운드**로 호출하고, `--model gpt-image-1.5 --background transparent --autocrop --auto-version`.
````

- [ ] **Step 2: 파일 존재·핵심 섹션 검증**

Run (PowerShell):
```powershell
Test-Path "skills/design-logo/references/logo-sheet-html-direction.md"
```
Expected: `True`

Grep 도구로 다음이 모두 존재하는지 확인: `발산 모드 (A / B / C)`, `베이스라인 타일`, `gpt-image-1.5 --background transparent --autocrop`, `high fidelity`.
Expected: 4개 모두 매치.

- [ ] **Step 3: Commit**

```bash
git add skills/design-logo/references/logo-sheet-html-direction.md
git commit -m "feat(design-logo): logos.html 탐색 시트 저작 ref 신설"
```

---

### Task 2: SKILL.md 재작성 + 구 보드 ref 제거

**Files:**
- Modify (전체 재작성): `skills/design-logo/SKILL.md`
- Delete: `skills/design-logo/references/logo-exploration-board.md`

- [ ] **Step 1: SKILL.md 전체를 아래 내용으로 교체**

````markdown
---
name: design-logo
description: 확정된 brand kit를 바탕으로 로고를 탐색·확정하는 스킬. brand-kit이 만든 assets/logo-base.png(투명)를 시드로, 한 라운드에 3~4개의 큰 방향(메타포까지 발산)을 개별 투명 PNG로 만들어 저작한 logos.html 탐색 시트(번호·라벨·실색·실폰트)로 보여주고, #N을 골라 수렴 라운드 또는 단독 확정으로 좁힌 뒤 (선택) wordmark·favicon·app-icon까지 .design/final/logo/에 확정할 때 사용한다.
---

# Design Logo

당신은 확정된 브랜드 킷에서 출발해 실제로 쓸 수 있는 로고를 좁혀가는 아이덴티티 디자이너다.

## 목적

`design-brand-kit`이 확정된 뒤 사용한다. 보드의 "로고 방향"은 한 칸짜리 제시일 뿐이라, 여기서 **브랜딩 스튜디오의 로고 탐색**처럼 한 라운드에 **3~4개의 큰 방향**(메타포까지 갈라진 발산)을 개별 투명 PNG로 만들어 저작한 **`logos.html` 탐색 시트**(번호·방향 라벨·실색·실폰트)로 보여준다. 사용자가 `#N`을 고르면 그 방향으로 **수렴 라운드**(3~4 변주)를 더 돌거나 **바로 단독 확정**한다. 고른 PNG는 이미 깨끗한 컷아웃이라 보드 셀 재추출이 없다. 확정 로고와 (선택) 로고 시스템(wordmark·favicon·app-icon)을 `.design/final/logo/`에 확정한다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다. 형태 언어·컨셉 방법·품질 테스트는 `../references/design/logo-art-direction.md`, 시트 저작은 `references/logo-sheet-html-direction.md`를 따른다.

## 전제

- `design-brand-kit` 산출물(`.design/final/brand-kit/assets/logo-base.png`·`BRAND_KIT.md`·`brand-tokens.json`)이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 로고용 최소 Q&A).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패).
- `logos.html`은 이미지가 아니라 `references/logo-sheet-html-direction.md`를 가드레일로 **LLM이 저작**한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/final/brand-kit/assets/logo-base.png` — **확정 로고 마크 시드(투명).** 모드 A·베이스라인 타일·로고 시스템 시드.
- `.design/final/brand-kit/assets/wordmark-base.png` — 확정 워드마크 시드(투명). 로고 시스템(Phase 3) 워드마크 시드.
- `.design/final/brand-kit/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴, §8 타이포(워드마크용).
- `.design/final/brand-kit/brand-tokens.json` — 색 HEX·타이포(시트 실색·실폰트).

> `logo-base.png`가 **없으면** Phase 0에서 brand-kit 안내 또는 로고 Q&A로 진행한다(아래 흐름).

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  generated/logo/
    seed.png                     # logo-base 복사/참조 (모드 A·C 앵커)
    seed-user.png                # (선택) 사용자 첨부 이미지
    concepts/round-N/01..04.png  # 라운드별 개별 투명 PNG (--auto-version)
    logos.html                   # 현재 라운드 시트 (교체, 상대경로 <img>)
    logo-candidate.png (+v2…)    # 고른 #N 단독 다듬기
  final/logo/
    logo.png · wordmark.png · favicon.png · app-icon.png   # lock 세트
  image-briefs/logo-briefs.md    # 시드 출처·발산 모드·라운드 로그·확정 컨셉·시스템 스펙
```

- `logos.html`의 모든 `<img>`는 형제 상대경로(`concepts/round-N/01.png`·`seed.png`) → generated/든 어디든 동일 동작.
- 탐색 시트(`logos.html`)는 **작업 산출물** — final로 잠그지 않는다. 시안은 `generated/logo/`에 `--auto-version`으로 누적. 확정 단일 로고·시스템만 `final/logo/`로 복사한다. **`final/logo`는 이 스킬이 단독으로 채운다**(brand-kit은 로고를 final로 잠그지 않는다).

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 로고 마크·워드마크·파비콘은 `gpt-image-1.5` + `--background transparent --autocrop`(투명 PNG, 여백 제거). 앱 아이콘만 `gpt-image-2` 불투명(배경을 프롬프트로 "plain near-white/near-black background, no scenery" 지시). **투명 컷아웃은 `--autocrop`을 붙여 마크가 캔버스를 꽉 채우게 한다.**
- **개별 PNG, 그리드 아님**: 40칸 그리드 합성은 더 안 쓴다. 컨셉마다 단독 마크 PNG 1장씩 생성한다.
- **한 라운드 3~4콜 = 병렬 백그라운드**: 서로 다른 컨셉은 `image-gen`을 동시(백그라운드) 호출해 병렬 생성(순차는 느림). 다듬기 루프는 순차.
- **충실도**: 컷아웃은 `gpt-image-1.5`다. 앵커(모드 A·C·수렴·다듬기)는 `--image --input-fidelity high`로 첨부해야 입력 마크에 단단히 묶인다(미지정이면 기본 low로 느슨하게 참조). 발산 모드 B는 미첨부(완전 발산). "보존이냐 새로냐"는 **시드 첨부 여부 + input-fidelity**로 표현한다.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 컷아웃 청크는 `references/logo-sheet-html-direction.md` §8, 단독 로고 품질 프레이밍은 `../references/design/logo-art-direction.md` §7.
- 호출 예(발산 컨셉 1개 — 모드 B, 시드 미첨부):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --out "<cwd>/.design/generated/logo/concepts/round-1/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --autocrop --quality low
  ```
- 호출 예(모드 A/C·수렴 — 앵커 첨부, **high fidelity로 묶음**):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <컨셉 프롬프트 파일> \
    --image "<cwd>/.design/generated/logo/seed.png" --input-fidelity high \
    --out "<cwd>/.design/generated/logo/concepts/round-2/01.png" \
    --auto-version --model gpt-image-1.5 --background transparent --autocrop --quality low
  ```

### logos.html 저작 (이미지 아님)

`logos.html`은 생성기로 만들지 않는다 — `references/logo-sheet-html-direction.md`의 레이아웃 규칙을 가드레일로 **LLM이 저작**한다: 자산은 `<img>`(상대경로), 브랜드명·태그라인은 `BRAND_KIT.md`에서, 색은 `brand-tokens.json` 실값, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`. 카드 라벨은 그 라운드에서 실제 만든 컨셉 방향을 가리킨다(지어내지 않음). `logo-base.png`는 베이스라인 타일(#0)로 고정.

### 라이브 프리뷰 (자동 새로고침)

`logos.html`을 **처음 제시할 때** 공유 런처로 로컬 라이브 서버를 **한 번 백그라운드로** 띄운다 — 이후 PNG 재생성·HTML 편집 때마다 자동 새로고침.

```
node ../../scripts/lib/serve-design.mjs <cwd>/.design/generated/logo
```

- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동. lock 후/세션 종료 시 서버를 종료한다(포트 점유 방지).

## 흐름 (디자이너 협업 루프)

### Phase 0 — 입력 감지 (시작 시 필수)

- `.design/final/brand-kit/BRAND_KIT.md`와 `assets/logo-base.png` 존재, 그리고 **사용자 첨부 이미지** 유무를 확인한다.
- **사용자 첨부 이미지가 있으면** → `generated/logo/seed-user.png`로 저장하고 **역할을 묻는다**:
  - **"이 방향으로 발산"** → Phase 2 발산 모드 C(그 이미지를 앵커로).
  - **"이걸 다듬자/확정"** → Phase 2 단독 다듬기 루프로 직행(그 이미지를 시드로).
- **brand-kit이 있으면** → Phase 1.
- **brand-kit이 없으면** → 묻는다: "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·타이포·보이스까지 갖춰 마크 근거가 탄탄)".
  - **예** → design-brand-kit을 안내하고 종료.
  - **아니오** → **로고용 최소 Q&A**(한 번에 하나씩): 제품명·한 줄 소개 / 분야 / 브랜드 성격·톤 / 핵심 메타포·심볼 방향 / 색(HEX 또는 방향) / 워드마크 타입 방향 / 피할 클리셰. 추측 금지. 수집분을 `logo-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). 이 경우 Phase 2는 **발산 모드 B 고정**(시드 미첨부, 텍스트→이미지). 끝에 "더 완전한 시스템이 필요하면 design-brand-kit"을 안내.

### Phase 1 — 시드 + 승인 게이트 (brand kit가 있을 때)

1. 입력 읽기(`BRAND_KIT.md` §6·tokens·assets/logo-base.png).
2. **시드 = `assets/logo-base.png` 직접**(재추출하지 않는다). `generated/logo/seed.png`로 복사하거나 경로를 그대로 시드로 쓴다. 보여주고 "이 마크 맞아요?" 확인.
   - **단일 커밋 옵션**: 사용자가 `logo-base`를 그대로 확정할 수 있다(탐색은 opt-in).
3. `logo-briefs.md` 작성(시드 출처·발산 방향·제약).
4. **승인 게이트 (생성 전 필수)**: 시드 + brief를 제시하고 방향 확인. 승인 전엔 이미지를 한 장도 생성하지 않는다.

### Phase 2 — 탐색 시트 → 단독 로고 확정

**탐색은 opt-in.** `logo-base`가 만족스러우면 탐색을 건너뛰고 바로 단독 확정(8)→로고 시스템(Phase 3)으로 간다. "다른 방향도 보고 싶다"일 때만 탐색을 시작한다.

5. **발산 모드 선택**: A(기준·logo-base 앵커) / B(제로베이스 완전 발산·미첨부) / C(첨부 이미지 앵커). 라운드마다 다시 고를 수 있다. (Phase 0 최소 Q&A 경로는 B 고정.)
6. **발산 라운드 생성**: 컨셉 3~4개를 `references/logo-sheet-html-direction.md` §8 청크로 **병렬 백그라운드** 생성(`gpt-image-1.5 --background transparent --autocrop --quality low`) → `concepts/round-N/01..04.png`. `logos.html`을 저작해 번호·방향 라벨·베이스라인 타일(#0)로 보여준다. 처음 제시 시 라이브 서버 1회 기동.
7. **수정 루프**:
   - **"다시, 더 다르게"** → 발산 라운드 재생성(모드 재선택 가능), `logos.html` **교체**.
   - **"#N 좋다"** → 사용자에게 묻는다: **(a) 수렴 라운드** — 그 PNG를 `--image --input-fidelity high`로 첨부해 같은 방향 3~4 변주를 만들고 시트 교체(반복 가능), 또는 **(b) 바로 단독 확정**.
8. **단독 로고**: 고른 PNG는 이미 투명 단독 컷아웃이므로 **재추출 없이** `logo-candidate.png`로 승격한다. 더 다듬고 싶으면 그 PNG를 `--image --input-fidelity high`로 첨부해 "중앙 정렬, 형태·기하 유지, 단일 마크만"으로 다듬는다(`logo-art-direction.md` §7 품질 프레이밍, §8 품질 테스트로 자가 판정).
9. **다듬기 루프**: 직전 후보를 `--image --input-fidelity high`로 첨부해 한 번에 한 가지만 증분 편집(나머지 보존), `--auto-version`. lock까지.
10. **확정(복사)**: 확정본을 `.design/final/logo/logo.png`로 복사. 시안은 `generated/logo/`에 보존.

### Phase 3 — (선택) 로고 시스템

11. logo.png lock 후 "워드마크 / 파비콘 / 앱 아이콘도 만들까요?"라고 제안한다. 원하는 것만, **확정 logo.png를 `--image`로 첨부**해 한 개씩 생성→보여줌→다듬기→lock:
    - **wordmark**: "<제품명>을 BRAND_KIT §8 타입 방향으로 워드마크화, 심볼+워드마크 락업 또는 워드마크 단독, plain 단색 배경" → `wordmark.png`.
    - **favicon**: "이 마크를 16/24/32px에서 읽히게 단순화, 단색, 정사각, plain 단색 배경" → `favicon.png`.
    - **app-icon**: "이 마크를 라운드 사각 앱 아이콘 타일에 배치, 브랜드 컬러 배경, iOS/Android 앱 아이콘 스타일, 넉넉한 패딩" → `app-icon.png`(gpt-image-2 불투명).
    - 각 확정본을 `final/logo/`로 복사, `logo-briefs.md`에 로고 시스템 스펙을 기록.
12. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**. 라이브 프리뷰 서버가 떠 있으면 종료한다.

## 품질 기준 / 금지 사항

- 시트의 3~4개는 **또렷이 구별되는 큰 방향**이어야 한다 — 미세 변주 반복 금지. 레이아웃·카드 규칙은 `references/logo-sheet-html-direction.md`.
- 단독 로고는 `../references/design/logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미)를 통과해야 한다.
- 로고 마크·워드마크·파비콘 배경은 투명(gpt-image-1.5 `--background transparent --autocrop`). 앱 아이콘은 gpt-image-2 불투명 컬러 타일.
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 있는 로고, 카드마다 스타일 난립, 시트에 가짜 본문 텍스트, 유명 마크 모방 (§6·§9).
- 한글 워드마크는 짧고 단순하게, 정확한 문구의 권위 원본은 `BRAND_KIT.md`.
````

- [ ] **Step 2: 구 보드 ref 제거**

Run (PowerShell):
```powershell
Remove-Item "skills/design-logo/references/logo-exploration-board.md"
```

- [ ] **Step 3: dangling 참조 없음 검증**

Grep 도구로 `skills/design-logo/` 아래에서 다음 패턴을 검색:
- `logo-exploration-board` → Expected: **매치 0** (SKILL.md가 더는 구 ref를 가리키지 않음).
- `exploration-board.png` → Expected: **매치 0** (40칸 보드 산출물 참조 제거됨).

Grep 도구로 `skills/design-logo/SKILL.md`에서 다음이 존재하는지 확인:
- `logo-sheet-html-direction` → Expected: 매치 ≥1.
- `logos.html` → Expected: 매치 ≥1.
- `발산 모드` → Expected: 매치 ≥1.

Run (PowerShell, 구 파일 삭제 확인):
```powershell
Test-Path "skills/design-logo/references/logo-exploration-board.md"
```
Expected: `False`

- [ ] **Step 4: Commit**

```bash
git add skills/design-logo/SKILL.md
git rm skills/design-logo/references/logo-exploration-board.md
git commit -m "refactor(design-logo): 40칸 보드를 3~4개 개별 PNG + logos.html 시트로 재작성"
```

---

### Task 3: sync·test 검증

**Files:** (소스 변경 없음 — 검증만)

- [ ] **Step 1: 스크립트 테스트 그린 확인**

Run:
```bash
npm test
```
Expected: 모든 `tests/**/*.test.mjs` PASS (스킬 문서 변경이 스크립트 테스트를 깨지 않음).

- [ ] **Step 2: Codex 번들 재생성 무오류 확인**

> 명령 실행은 사용자 확인 후 진행한다(전역 규칙).

Run:
```bash
npm run sync
```
Expected: `sync-mcp` + `sync-codex-plugin` + `sync-agents` 모두 무오류 종료. `plugins/personal/` 아래 `design-logo` 스킬이 새 `logos.html` 흐름으로 재생성되고, 구 `logo-exploration-board.md`가 번들에서 사라진다(번들은 gitignore라 커밋 대상 아님).

- [ ] **Step 3: 번들 반영 스팟 체크**

Grep 도구로 `plugins/personal/skills/design-logo/` 아래에서 확인:
- `logo-sheet-html-direction.md` 파일 존재(Glob), `logo-exploration-board.md` 부재.
Expected: 신규 ref 있음, 구 ref 없음.

- [ ] **Step 4: 커밋 (mcp 생성물 변동이 있으면만)**

`npm run sync`는 보통 skills 변경에 대해 **커밋되는** 산출물을 만들지 않는다(`plugins/personal/`·`codex-agents/`는 gitignore, `.claude-plugin/mcp.json` 등은 mcp.servers.json이 안 바뀌었으므로 불변). `git status`로 확인:
```bash
git status --short
```
- 변동 없음 → 추가 커밋 불필요(Task 1·2 커밋으로 완결).
- 예기치 않은 추적 파일 변동이 있으면 내용을 확인하고 사용자에게 보고 후 커밋 여부 결정.

---

## Self-Review

**1. Spec coverage:**
- 렌더 모델(개별 투명 PNG + 저작 HTML) → Task 1 §8 청크 + Task 2 이미지 생성/logos.html 저작 ✓
- 라운드=교체 → Task 2 출력 파일·흐름 7 ✓
- 발산 폭(메타포까지) → Task 1 §4 ✓
- 발산 모드 A/B/C → Task 1 §3 + Task 2 흐름 5 ✓
- 수렴 앵커 첨부 → Task 1 §5 + Task 2 흐름 7(a) ✓
- 보드 셀 재추출 제거 → Task 2 흐름 8 ✓
- Phase 0(no brand-kit→질문→Q&A=모드B; 첨부 이미지→역할 질문) → Task 2 Phase 0 ✓
- 파일 구조 → Task 2 출력 파일 ✓
- logos.html 레이아웃(전용 시트·베이스라인 타일·실색/실폰트·상대경로) → Task 1 §1·§2 ✓
- 라이브 프리뷰 → Task 2 라이브 프리뷰 절 ✓
- 변경 대상(SKILL.md 재작성·구 ref 제거·신 ref 신설·공유 art-direction 불변) → Task 1·2·3 ✓
- 품질/금지 → Task 1 §7 + Task 2 품질 기준 ✓

**2. Placeholder scan:** 모든 코드/콘텐츠 블록은 실제 작성할 전체 내용·실제 명령·기대 출력 포함. TBD/TODO 없음. ✓

**3. Type consistency:** 파일·폴더 이름 일관 — `logos.html`, `concepts/round-N/01..04.png`, `seed.png`, `seed-user.png`, `logo-candidate.png`, `references/logo-sheet-html-direction.md`가 Task 1·2·3에서 동일 표기. 발산 모드 A/B/C 표기 일관. ✓
