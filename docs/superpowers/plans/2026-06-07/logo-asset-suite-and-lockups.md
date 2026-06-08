# §6 락업 6종 + 이미지-모드 사이징 + favicon/app-icon(PNG·로고 맥락) + 마스코트 가드 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-kit overview §6에 락업 6종을 렌더하고, 이미지-모드 워드마크 사이징을 토큰으로 잡으며, favicon/app-icon을 **PNG로 로고 맥락에서 산출**(레터마크/단순=autocrop 재사용, 그 외=로고 `--image` + 캐싱 프롬프트로 단순화 생성)하고, **마스코트 아키타입을 가드**한다.

**Architecture:** `tokens-to-css.mjs`에 `--logo-wm-img-scale` + `.lockup .wordmark-img`를 추가(코드·TDD)하고, 폐기된 `bake-logo-assets.mjs`를 제거한 뒤, design-logo·brand-kit SKILL과 참조 문서를 "favicon PNG(재사용/접근 C)·락업 6종·마스코트 가드"로 갱신한다. 나머지는 마크다운 저작 지침 편집이다.

**Tech Stack:** Node.js ESM(스킬 스크립트), `node:test`, 순수 HTML/CSS(토큰·락업), 마크다운 스킬 문서.

**Spec:** `docs/superpowers/specs/2026-06-07/logo-asset-suite-and-lockups-design.md`

---

## Prerequisites

- [ ] `npm test`가 현재 통과하는지 확인(회귀 기준선). Run: `npm test` → 전체 PASS. 현재 테스트 수를 메모(= BASE).
- [ ] 선행 의존 없음 — 이미 머지된 락업 시스템(`.lockup*`)·`tokens.css`·design-logo/brand-kit 토대 + 어제 실행된 favicon-monochrome(`bake-logo-assets.mjs`·`.mark-mono`) 위에서 동작.

## File Structure

| 파일 | 책임 | 신규/수정/삭제 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `--logo-wm-img-scale` + `.lockup .wordmark-img` emit | 수정 |
| `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` | 새 var·클래스·기본값·override 테스트 | 수정 |
| `skills/design-logo/scripts/bake-logo-assets.mjs` | favicon/app-icon 베이크(폐기) | **삭제** |
| `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs` | 위 테스트 | **삭제** |
| `skills/design-logo/SKILL.md` | 흐름 11 재작성(favicon PNG 재사용/C)·흐름 10 프롬프트 캐싱·자산트리·footer·품질·락업 튜닝 | 수정 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | favicon PNG 프리뷰 + 이미지-모드 락업 단서 | 수정 |
| `skills/references/design/logo-art-direction.md` | §7 favicon 맥락 생성 프레이밍 + 마스코트 가드(Avoid ×3) | 수정 |
| `skills/design-brand-kit/SKILL.md` | §6 임시 favicon.png·락업 6종·`wmImgScale` 스키마·line 224 교체·자산트리·흐름 5·8 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 락업 6종 + favicon.png(head·타일·app-icon CSS) + `.wordmark-img` | 수정 |
| `skills/design-brand-kit/references/brand-kit-image.md` | 스트레이 "심볼릭 마스코트" 제거 | 수정 |
| `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md` | B-🅱-ii 대체됨 표기 | 수정 |

**계약(중요):**
- **`lockup.wmImgScale`**(brand-tokens.json `lockup` 블록 선택 키, 기본 `"1.5"`): 이미지-모드 워드마크 이미지 높이 = `1em`의 배수. `tokens-to-css.mjs`가 `--logo-wm-img-scale` var + `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }`로 emit.
- **`favicon.png`**: `assets/logo/favicon.png`. favicon·app-icon 한 마크(PNG). 재사용 분기(레터마크/단순 심볼) = `logo.png` autocrop. 생성 분기(그 외) = `logo.png`를 `--image --input-fidelity high` + 캐싱 로고 프롬프트로 단순화 생성. app-icon = overview §6 CSS 타일(별도 파일 없음). non-clobber 표식은 기존 `candidate/logo/logo-briefs.md`.
- **`logo-prompt.txt`**: `candidate/logo/logo-prompt.txt`. design-logo가 로고 lock 시 저장하는 확정 로고 최종 프롬프트 — favicon 생성 분기의 의미 가이드 재료.

---

## Phase A — 락업 이미지-모드 사이징 (코드 · TDD)

### Task A1: `--logo-wm-img-scale` + `.lockup .wordmark-img`

**Files:**
- Modify: `skills/design-brand-kit/scripts/tokens-to-css.mjs`
- Test: `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`

- [ ] **Step 1: 실패하는 테스트 추가**

`tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` **맨 끝**(마지막 `});` 다음)에 추가:

```js
test("lockup wmImgScale 기본 토큰 emit", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /--logo-wm-img-scale:\s*1\.5/);
});

test("lockup .wordmark-img 규칙 emit (markScale와 분리)", () => {
  const css = generateTokensCss(SAMPLE);
  assert.match(css, /\.lockup \.wordmark-img\s*\{[^}]*height:\s*calc\(var\(--logo-wm-img-scale\)\s*\*\s*1em\)/);
  assert.match(css, /\.lockup \.wordmark-img\s*\{[^}]*width:\s*auto/);
});

test("lockup wmImgScale override 적용", () => {
  const css = generateTokensCss({ ...SAMPLE, lockup: { wmImgScale: "1.9" } });
  assert.match(css, /--logo-wm-img-scale:\s*1\.9/);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
Expected: FAIL — `--logo-wm-img-scale`·`.lockup .wordmark-img` 미생성으로 신규 3개 실패.

- [ ] **Step 3: 구현 — 기본값 추가**

`skills/design-brand-kit/scripts/tokens-to-css.mjs`의 `LOCKUP_DEFAULTS`(현재 line 11)를 교체:

찾기:
```js
const LOCKUP_DEFAULTS = { markScale: "1.8", gap: "0.5em", taglineSize: "0.42em", taglineTracking: "0.22em", taglineColor: "textMuted" };
```
교체:
```js
const LOCKUP_DEFAULTS = { markScale: "1.8", gap: "0.5em", taglineSize: "0.42em", taglineTracking: "0.22em", taglineColor: "textMuted", wmImgScale: "1.5" };
```

- [ ] **Step 4: 구현 — var emit**

`generateLockupVars`의 `--logo-tagline-tracking` 줄 **다음**에 한 줄 추가:

찾기:
```js
    `  --logo-tagline-tracking: ${pick(lockup.taglineTracking, LOCKUP_DEFAULTS.taglineTracking)};`,
```
교체:
```js
    `  --logo-tagline-tracking: ${pick(lockup.taglineTracking, LOCKUP_DEFAULTS.taglineTracking)};`,
    `  --logo-wm-img-scale: ${pick(lockup.wmImgScale, LOCKUP_DEFAULTS.wmImgScale)};`,
```

- [ ] **Step 5: 구현 — 클래스 규칙 emit**

`generateLockupClass`의 `.lockup__mark` 줄 **다음**에 한 줄 추가:

찾기:
```js
    ".lockup__mark { height: calc(var(--logo-mark-scale) * 1em); width: auto; object-fit: contain; flex: none; }",
```
교체:
```js
    ".lockup__mark { height: calc(var(--logo-mark-scale) * 1em); width: auto; object-fit: contain; flex: none; }",
    ".lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }",
```

- [ ] **Step 6: 통과 확인**

Run: `node --test tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
Expected: PASS (기존 + 신규 3).

- [ ] **Step 7: 전체 회귀**

Run: `npm test`
Expected: 전체 PASS (BASE + 3).

- [ ] **Step 8: 커밋**

```bash
git add skills/design-brand-kit/scripts/tokens-to-css.mjs tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs
git commit -F - <<'EOF'
feat(brand-kit): 락업 이미지-모드 워드마크 사이징(--logo-wm-img-scale + .wordmark-img)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase B — favicon 베이크 스크립트 제거

### Task B1: `bake-logo-assets.mjs` + 테스트 삭제

**Files:**
- Delete: `skills/design-logo/scripts/bake-logo-assets.mjs`
- Delete: `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs`

- [ ] **Step 1: 잔존 import 소비자 0 재확인**

Run: `node -e "const {execSync}=require('child_process'); process.stdout.write(execSync('git grep -l bake-logo-assets -- skills tests scripts').toString())"`
Expected: `skills/design-logo/scripts/bake-logo-assets.mjs`·`tests/skills/design-logo/scripts/bake-logo-assets.test.mjs`, 그리고 **문서 참조**(`skills/design-logo/SKILL.md`·`skills/design-brand-kit/SKILL.md`)만. 다른 `.mjs`가 import하면 중단하고 재검토. (SKILL.md 참조는 Phase C·D에서 제거.)

- [ ] **Step 2: 삭제**

```bash
git rm skills/design-logo/scripts/bake-logo-assets.mjs tests/skills/design-logo/scripts/bake-logo-assets.test.mjs
```

- [ ] **Step 3: 회귀 확인**

Run: `npm test`
Expected: 전체 PASS (BASE + 3 − 4 = BASE − 1). 실패 0(삭제된 4 테스트만큼만 감소).

- [ ] **Step 4: 커밋**

```bash
git commit -F - <<'EOF'
refactor(design-logo): favicon/app-icon 베이크 스크립트 제거(PNG 재사용/생성으로 대체)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase C — design-logo 지침 (favicon PNG·접근 C·캐싱·마스코트 프레이밍)

### Task C1: design-logo SKILL.md

**Files:**
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: candidate 트리 — logo-prompt.txt 추가**

찾기(현재 line 42):
```
      logo-briefs.md                 # 시드 출처·발산 모드·라운드 로그·확정 컨셉
```
교체:
```
      logo-briefs.md                 # 시드 출처·발산 모드·라운드 로그·확정 컨셉
      logo-prompt.txt                # 확정 로고 최종 프롬프트 (favicon 생성 분기 재료)
```

- [ ] **Step 2: candidate 트리 — mark-mono 시안 → favicon 시안**

찾기(현재 line 47):
```
      mark-mono-candidate.png (+v2…) # 단색 마크 축약 시안(프리뷰 게이트)
```
교체:
```
      favicon-candidate.png (+v2…)   # favicon 생성 시안(접근 C 프리뷰 게이트)
```

- [ ] **Step 3: assets 트리 교체**

찾기(현재 line 50–55):
```
    logo/  logo.png                  # 확정 심볼 (풍부한 마크)
           mark-mono.png             # 단색 마스터 (favicon·app-icon·페이지내 재색의 소스)
           favicon-light.png         # 라이트 탭용(ink 마크) — bake-logo-assets 생성
           favicon-dark.png          # 다크 탭용(흰 마크) — bake-logo-assets 생성
           app-icon.png              # 브랜드색 타일 + 흰 마크 — bake-logo-assets 생성
           logo-dark.png             # 다크모드 변형 (remap-logo-dark 또는 생성 폴백)
```
교체:
```
    logo/  logo.png                  # 확정 심볼 (풍부한 마크)
           favicon.png               # favicon/app-icon 마크 (레터마크/단순=autocrop 재사용, 그 외=접근 C 생성)
           logo-dark.png             # 다크모드 변형 (remap-logo-dark 또는 생성 폴백)
```

- [ ] **Step 4: 흐름 10 — 확정 시 프롬프트 캐싱**

찾기(현재 line 139 끝부):
```
 `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록한다 — 이 파일은 brand-kit의 non-clobber 표식이자 md-compiler의 출처 표식이다(design-brand-kit 흐름 8·design-md-compiler §12).
```
교체:
```
 `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록한다 — 이 파일은 brand-kit의 non-clobber 표식이자 md-compiler의 출처 표식이다(design-brand-kit 흐름 8·design-md-compiler §12). 또한 확정 로고를 생성한 **최종 프롬프트를 `candidate/logo/logo-prompt.txt`에 저장**한다(흐름 11 favicon 생성 분기의 의미 가이드 재료 — 재사용 분기면 불필요).
```

- [ ] **Step 5: 흐름 11 재작성 (단색 베이크 → favicon PNG 재사용/접근 C)**

찾기(현재 line 140 — `11. **단색 자산 suite(스펙 B-🅱-ii)**:` 로 시작하는 줄 **전체**):
```
11. **단색 자산 suite(스펙 B-🅱-ii)**: 심볼 lock 직후 — ⓐ 확정 `logo.png`를 첨부(`--image --input-fidelity high`)해 "single flat color, bold thick strokes, simplest silhouette, drop frame/text/accents, legible at 16px"로 `candidate/logo/mark-mono-candidate.png`를 축약 생성한다(하이브리드, `logo-art-direction.md` §7 단색 프레이밍). ⓑ **프리뷰 게이트**: `logos.html` 단색 프리뷰 섹션에 16/24/32px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 결과를 사용자에게 제시(평이한 승인만). ⓒ 승인 후 `assets/logo/mark-mono.png`로 lock하고, brand-tokens.json 색을 읽어 베이크한다: `node "<이 스킬 디렉터리>/scripts/bake-logo-assets.mjs" --mark <.design>/assets/logo/mark-mono.png --out-dir <.design>/assets/logo --ink "<brand text/ink HEX>" --tile "<brand primary HEX>"` → `favicon-light.png`·`favicon-dark.png`·`app-icon.png` 생성. **HTML은 편집하지 않는다**(overview §6이 이 경로들을 가리킴).
```
교체:
```
11. **favicon/app-icon 마크(스펙 §4 — PNG, 로고 맥락)**: 심볼 lock 직후 — 확정 `logo.png`로 favicon을 만든다. ⓐ **유형 판정**: 레터마크이거나 이미 16px에 읽히는 단순 심볼이면 **재사용** — `node "<이 스킬 디렉터리>/../image-gen/scripts/autocrop.mjs" --in <.design>/assets/logo/logo.png --out <.design>/assets/logo/favicon.png --pad-pct 6`(생성 0). ⓑ 그 외(픽토리얼·엠블럼·콤비네이션·복잡 심볼·워드마크)면 **생성(접근 C)** — `candidate/logo/logo-prompt.txt`(흐름 10 저장본, 없으면 `logo-briefs.md`·`BRAND_KIT.md §6`에서 모티프·실 HEX 재구성)에 favicon 단순화 지시("single bold flat mark of the core motif only, drop text/frame/fine detail, legible at 16px, transparent")를 더해 프롬프트 파일을 쓰고, `--image <.design>/assets/logo/logo.png --input-fidelity high --model gpt-image-1.5 --background transparent --quality high --autocrop`로 `candidate/logo/favicon-candidate.png`를 생성(`--auto-version`). ⓒ **프리뷰 게이트**: `logos.html` favicon 프리뷰 섹션에 16/24/32/48px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 사용자에게 제시(평이한 승인만). ⓓ 승인 후 `assets/logo/favicon.png`로 lock. **app-icon은 같은 마크** — overview §6에서 `favicon.png`를 브랜드색 라운드 타일에 얹어 CSS 프리뷰(별도 파일 없음). **HTML은 편집하지 않는다**(overview §6·`<head>`가 `favicon.png`를 가리킴).
```

- [ ] **Step 6: footer 노트 교체**

찾기(현재 line 144 — `> 워드마크는 이 스킬에서 굽지 않는다`로 시작하는 줄 **전체**):
```
> 워드마크는 이 스킬에서 굽지 않는다 — 락업에서 `.wordmark`로 별도 조합한다(스펙 B-🅰). 파비콘·앱 아이콘은 흐름 11(단색 자산 suite)에서 단색 마스터 `mark-mono.png`로부터 `bake-logo-assets.mjs`로 베이크한다(스펙 B-🅱-ii). 풀로고 다크 변형은 흐름 12에서 `remap-logo-dark.mjs`로 리맵한다(스펙 B-🅱-i). 확정 심볼 + 단색 자산 suite + 다크 변형을 산출한다.
```
교체:
```
> 워드마크는 이 스킬에서 굽지 않는다 — 락업에서 `.wordmark`로 별도 조합한다(스펙 B-🅰). 파비콘·앱 아이콘은 흐름 11에서 `favicon.png`로 만든다 — 레터마크/단순 심볼은 로고 autocrop 재사용, 그 외는 로고를 `--image`로 주입해 단순화 생성(접근 C). app-icon은 같은 마크(overview CSS 타일). 풀로고 다크 변형은 흐름 12에서 `remap-logo-dark.mjs`로 리맵한다(스펙 B-🅱-i). 확정 심볼 + favicon/app-icon 마크 + 다크 변형을 산출한다.
```

- [ ] **Step 7: 품질 기준 — 단색 자산 줄 교체**

찾기(현재 line 149 — `- **단색 자산(스펙 B-🅱-ii)**:` 로 시작하는 줄 **전체**):
```
- **단색 자산(스펙 B-🅱-ii)**: `mark-mono.png`는 16px에서 읽히는 단색 축약 마크다. favicon(light/dark)·app-icon은 `bake-logo-assets.mjs`로 마스터에서 베이크한다(손편집 금지 — 마스터만 고치고 재베이크). 풍부한 다색 풀로고의 다크 변형은 흐름 12(🅱-i 결정론 리맵) 참조 — mask 단색 재색과 다른 경로다.
```
교체:
```
- **favicon/app-icon(스펙 §4)**: `favicon.png`는 16px에 읽히는 마크다 — 레터마크/단순 심볼은 `logo.png`를 autocrop해 재사용, 그 외는 `logo.png`를 `--image`로 주입 + 캐싱 로고 프롬프트로 단순화 생성(접근 C, gpt-image-1.5). app-icon은 같은 마크(overview에서 브랜드 타일 위 CSS 프리뷰 — 별도 파일 없음). 손편집·맥락 없는 생성 금지(로고가 진실, favicon은 그 함수). 풍부한 다색 풀로고의 다크 변형은 흐름 12(🅱-i 결정론 리맵) 참조.
```

- [ ] **Step 8: 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/design-logo/SKILL.md','utf8'); ['favicon.png','favicon/app-icon 마크(스펙 §4 — PNG, 로고 맥락)','logo-prompt.txt','접근 C'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(/bake-logo-assets|mark-mono/.test(s))throw new Error('stale bake/mark-mono ref'); console.log('logo SKILL OK')"
```
Expected: `logo SKILL OK`

- [ ] **Step 9: 커밋**

```bash
git add skills/design-logo/SKILL.md
git commit -F - <<'EOF'
feat(design-logo): 흐름 11을 favicon PNG(재사용/접근 C)로 재작성 + 프롬프트 캐싱(베이크 제거)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task C2: logo-art-direction.md §7 프레이밍

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`

- [ ] **Step 1: §7 단색 마크 축약 프레이밍 → favicon PNG 맥락 생성**

찾기(현재 line 92 안의 한 문장 — `**단색 마크 축약(스펙 B-🅱-ii)**:` 부터 `재색은 alpha 기반이다.` 까지):
```
**단색 마크 축약(스펙 B-🅱-ii)**: favicon·app-icon·다크용 `mark-mono.png`는 확정 `logo.png`를 첨부(`--image --input-fidelity high`)해 "single flat color, bold thick strokes, simplest silhouette, drop the frame/text/accents, must read at 16px"로 축약 생성한다(하이브리드). 충실도가 부족하면 더 굵게·단순하게 재생성한다. 단색 마스터의 색은 무관하다 — 재색은 alpha 기반이다.
```
교체:
```
**favicon/app-icon 마크(스펙 §4 — PNG, 로고 맥락)**: 레터마크/이미 16px에 읽히는 단순 심볼이면 확정 `logo.png`를 autocrop해 `favicon.png`로 재사용한다(생성 없음). 그 외는 `logo.png`를 첨부(`--image --input-fidelity high`)하고 캐싱한 로고 프롬프트(모티프·실 HEX·금지)에 "single bold flat mark of the core motif only, drop text/frame/fine detail, legible at 16px, transparent"를 더해 단순화 생성한다(접근 C). 충실도가 부족하면 더 굵게·단순하게 재생성. app-icon은 같은 마크(overview에서 브랜드 타일 위 CSS).
```

- [ ] **Step 2: 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/references/design/logo-art-direction.md','utf8'); if(!s.includes('favicon/app-icon 마크(스펙 §4 — PNG, 로고 맥락)'))throw new Error('missing favicon framing'); if(s.includes('단색 마크 축약(스펙 B-🅱-ii)'))throw new Error('stale mono framing'); console.log('art-dir framing OK')"
```
Expected: `art-dir framing OK`

- [ ] **Step 3: 커밋**

```bash
git add skills/references/design/logo-art-direction.md
git commit -F - <<'EOF'
feat(design-logo): §7 favicon 프레이밍을 PNG 맥락 생성(재사용/접근 C)으로 갱신

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

> 주의: 같은 파일의 **마스코트 가드(Avoid)** 는 Phase E에서 함께 편집한다(별 커밋).

### Task C3: logo-sheet-html-direction.md 프리뷰

**Files:**
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`

- [ ] **Step 1: 락업 프리뷰에 이미지-모드 단서 추가**

찾기(현재 line 18 끝부):
```
 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트).
```
교체:
```
 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트). 이미지 모드 워드마크면 `<span class="wordmark">` 대신 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">`(높이는 `--logo-wm-img-scale`). 심볼·워드마크 둘 다 프리뷰에서 튜닝한다.
```

- [ ] **Step 2: 단색 마크 프리뷰 → favicon 마크 프리뷰**

찾기(현재 line 19 — `- **단색 마크 가독 프리뷰 섹션(스펙 B-🅱-ii)**:` 로 시작하는 불릿 **전체**):
```
- **단색 마크 가독 프리뷰 섹션(스펙 B-🅱-ii)**: 시트 하단에 단색 마크 후보(`mark-mono`)를 16·24·32·48px로, light/dark 두 배경에 렌더한다 — `<img src="../candidate/logo/mark-mono-candidate.png" width="16" height="16">` 식. "favicon 크기에서 읽히나"를 보는 자리(스펙 B-🅱-ii 프리뷰 게이트). app-icon 미리보기는 브랜드색 정사각 타일 + `filter:brightness(0) invert(1)` 흰 마크로 보여준다. **이 시트는 `mask` 재색 데모를 포함하면 반드시 라이브 서버(http)로 열어 본다 — `file://`에서는 mask가 빈다.**
```
교체:
```
- **favicon 마크 가독 프리뷰 섹션(스펙 §4)**: 시트 하단에 favicon 후보(생성 분기면 `../candidate/logo/favicon-candidate.png`, 재사용 분기면 `../assets/logo/favicon.png`)를 16·24·32·48px로, light/dark 두 배경에 렌더한다 — `<img src="../candidate/logo/favicon-candidate.png" width="16" height="16">` 식. "favicon 크기에서 읽히나"를 보는 자리(접근 C 프리뷰 게이트). app-icon 미리보기는 브랜드색 라운드 타일 위에 같은 `favicon.png`를 얹어 보여준다(마크 색 보존). favicon은 PNG라 `file://`에서도 렌더되지만, 페이지에 `.mark-mono` mask 데모를 함께 넣으면 라이브 서버(http)로 열어 본다(`file://`에선 mask가 빈다).
```

- [ ] **Step 3: 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/design-logo/references/logo-sheet-html-direction.md','utf8'); ['favicon 마크 가독 프리뷰 섹션(스펙 §4)','favicon-candidate.png','wordmark-img'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(s.includes('mark-mono-candidate.png'))throw new Error('stale mark-mono ref'); console.log('logo-sheet OK')"
```
Expected: `logo-sheet OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-logo/references/logo-sheet-html-direction.md
git commit -F - <<'EOF'
feat(design-logo): logos.html favicon PNG 프리뷰 + 이미지-모드 락업 단서

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase D — brand-kit 지침 (임시 favicon.png · 락업 6종 · wmImgScale)

### Task D1: brand-kit SKILL.md

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: 자산 트리에 favicon.png**

찾기(현재 line 72):
```
    logo/       logo.png   # 캐노니컬 표시 로고 — brand-kit이 logo-base에서 시드(미러), design-logo가 덮어씀. overview §6이 이 경로를 가리킴(non-clobber: logo-briefs.md 있으면 안 건드림)
```
교체:
```
    logo/       logo.png · favicon.png   # 캐노니컬 로고(logo-base 시드 미러) + favicon/app-icon 마크(brand-kit autocrop 임시 · design-logo 재사용/생성 정제). overview §6·<head>가 이 경로를 가리킴(non-clobber: logo-briefs.md 있으면 안 건드림)
```

- [ ] **Step 2: brand-tokens.json lockup 블록에 wmImgScale**

찾기(현재 line 212):
```
  "lockup": { "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted" }
```
교체:
```
  "lockup": { "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted", "wmImgScale": "1.5" }
```

- [ ] **Step 3: lockup 노트에 wmImgScale 문장**

찾기(현재 line 222 끝부):
```
 **마크 모양마다 균형이 달라 `markScale`은 프리뷰에서 에이전트가 조정**한다(사용자는 승인만).
```
교체:
```
 **마크 모양마다 균형이 달라 `markScale`은 프리뷰에서 에이전트가 조정**한다(사용자는 승인만). **이미지 모드 워드마크**는 `wmImgScale`(워드마크 이미지 높이 = `1em`의 배수, 기본 1.5)로 `.wordmark-img` 높이가 emit된다 — 심볼 `markScale`과 함께 프리뷰에서 조정해 균형을 맞춘다.
```

- [ ] **Step 4: line 224 베이크 노트 → favicon PNG 노트**

찾기(현재 line 224):
```
> 단색 자산(favicon·app-icon)은 design-logo가 `mark-mono.png`에서 `bake-logo-assets.mjs`로 베이크하며, 입력 색은 brand-tokens.json의 `text`(ink)·`primary`(tile)를 쓴다. brand-kit은 토큰만 제공하고 베이크는 design-logo 소관이다(스펙 B-🅱-ii).
```
교체:
```
> **favicon·app-icon은 PNG 마크다(베이크 아님).** brand-kit은 `logo-base.png`를 autocrop해 임시 `assets/logo/favicon.png`를 두고(§6이 안 비게), design-logo가 로고 lock 후 확정 `logo.png`로 정제한다 — 레터마크/단순 심볼은 autocrop 재사용, 그 외는 `--image`로 주입해 단순화 생성(접근 C). app-icon은 같은 마크(overview에서 브랜드 타일 위 CSS). 흐름 5·8 non-clobber 동일.
```

- [ ] **Step 5: 흐름 5에 임시 favicon.png 단계**

찾기(현재 line 352 — `   - **로고 캐노니컬 미러**:` 로 시작하는 불릿 **전체**):
```
   - **로고 캐노니컬 미러**: `logo-base.png`를 생성/갱신할 때마다 `assets/logo/logo.png`로 복사한다(§6이 이 경로를 가리킴). 단 `candidate/logo/logo-briefs.md`가 있으면(design-logo가 이미 확정 로고를 만듦) **덮어쓰지 않는다**(non-clobber — 확정 로고 보존).
```
교체:
```
   - **로고 캐노니컬 미러**: `logo-base.png`를 생성/갱신할 때마다 `assets/logo/logo.png`로 복사한다(§6이 이 경로를 가리킴). 단 `candidate/logo/logo-briefs.md`가 있으면(design-logo가 이미 확정 로고를 만듦) **덮어쓰지 않는다**(non-clobber — 확정 로고 보존).
   - **favicon 임시 마크**: `candidate/logo/logo-briefs.md`가 **없으면** `logo-base.png`를 autocrop해 `assets/logo/favicon.png`를 둔다(`node "<이 스킬 디렉터리>/../image-gen/scripts/autocrop.mjs" --in <.design>/assets/logo/logo.png --out <.design>/assets/logo/favicon.png --pad-pct 6` — 무API 임시본, overview §6 favicon/app-icon 자리와 `<head>` favicon `<link>`가 이 파일을 가리켜 §6이 안 빈다). **있으면**(design-logo 정제본) 건드리지 않는다(non-clobber).
```

- [ ] **Step 6: 흐름 8 non-clobber에 favicon.png 보장**

찾기(현재 line 356 끝부):
```
 이로써 brand-kit 재실행이 확정 로고를 날리지 않는다.
```
교체:
```
 이로써 brand-kit 재실행이 확정 로고를 날리지 않는다. **favicon.png도 동일** — `logo-briefs.md`가 없으면 최신 autocrop 임시본을 보장하고, 있으면 design-logo 정제본을 건드리지 않는다.
```

- [ ] **Step 7: 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); ['favicon.png','wmImgScale','favicon·app-icon은 PNG 마크다','favicon 임시 마크'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(/bake-logo-assets|mark-mono/.test(s))throw new Error('stale bake/mark-mono ref'); console.log('brand-kit SKILL OK')"
```
Expected: `brand-kit SKILL OK`

- [ ] **Step 8: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -F - <<'EOF'
feat(brand-kit): 임시 favicon.png(autocrop) 흐름 + lockup wmImgScale 스키마(베이크 노트 교체)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task D2: brand-kit-html-direction.md §6

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`

- [ ] **Step 1: §6 매핑 줄의 app-icon 괄호 갱신(색 보존)**

찾기(현재 line 22 안의 토막):
```
· 앱아이콘[브랜드색 라운드 타일, `filter:brightness(0) invert(1)`로 흰 마크] · 파비콘)
```
교체:
```
· 앱아이콘[브랜드색 라운드 타일 위 favicon.png, 색 보존] · 파비콘)
```

- [ ] **Step 2: 락업 렌더 불릿 → 6종 패밀리**

찾기(현재 line 23 — `  - **락업 렌더(신규)**:` 로 시작하는 불릿 **전체**):
```
  - **락업 렌더(신규)**: §6에 실제 `.lockup`을 1개 이상 렌더한다 — `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`(가로) 와 `.lockup.lockup--stacked`(세로). 태그라인이 있으면 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>` 추가. `.lockup*`·`.wordmark`는 tokens.css가 정의(재구현 금지). 이미지 모드 워드마크면 `<span class="wordmark">` 대신 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">`(워드마크 자체가 이미지). 심볼이 없으면 락업 생략하고 워드마크만.
```
교체:
```
  - **락업 패밀리 렌더(6종)**: §6에 다음을 모두 렌더한다 — ① 가로 `.lockup` · ② 세로 `.lockup.lockup--stacked` · ⑤ 심볼 단독(`<img src="../assets/logo/logo.png">`) · ⑥ 워드마크 단독(이미지 모드 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">` | 폰트 모드 `<span class="wordmark">브랜드명</span>`)은 **항상**. 태그라인이 있으면 ③ 가로+태그라인 · ④ 세로+태그라인도 추가. 가로/세로 구조: `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`, 태그라인은 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>`. **이미지 모드 워드마크**는 `<span class="wordmark">` 대신 `<img class="wordmark-img" ...>` — 높이는 `.wordmark-img`(tokens.css, `--logo-wm-img-scale`)가, 심볼은 `--logo-mark-scale`이 잡는다(둘 다 토큰, 재구현 금지). 심볼이 없으면 락업·심볼단독 생략, 워드마크 단독만.
```

- [ ] **Step 3: favicon 실파일 불릿 → favicon.png + app-icon CSS + head**

찾기(현재 line 24 — `  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**:` 로 시작하는 불릿 **전체**):
```
  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**: §6 변형 타일은 design-logo가 베이크한 실제 자산을 가리킨다 — 앱아이콘 `<img src="../assets/logo/app-icon.png">`, 파비콘 `<img src="../assets/logo/favicon-light.png">`. 페이지내 단색 마크 재색은 `.mark-mono`(tokens.css 정의)에 `style="-webkit-mask-image:url('../assets/logo/mark-mono.png');mask-image:url('../assets/logo/mark-mono.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로(어두운 타일 위 흰 마크는 `filter:brightness(0) invert(1)`). **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.** `<head>`에 다크 스왑 favicon을 넣는다: `<link rel="icon" href="../assets/logo/favicon-light.png" media="(prefers-color-scheme: light)">` 와 `<link rel="icon" href="../assets/logo/favicon-dark.png" media="(prefers-color-scheme: dark)">`. 단색 자산이 아직 없으면(design-logo 미실행) 이 타일·스니펫은 생략한다.
```
교체:
```
  - **favicon/app-icon 마크(PNG)**: favicon/app-icon 자리는 `assets/logo/favicon.png`(brand-kit autocrop 임시 또는 design-logo 정제 마크)를 가리킨다 — 파비콘 `<img src="../assets/logo/favicon.png">`, 16px·32px 미리보기로 가독을 보여준다. **app-icon**은 같은 `favicon.png`를 브랜드색 라운드 타일에 얹어 보여준다 — `<div style="background:var(--color-primary);border-radius:22%;padding:18%"><img src="../assets/logo/favicon.png" style="width:100%;display:block"></div>`(마크 색 보존; 별도 app-icon 파일 없음). `<head>`에 `<link rel="icon" href="../assets/logo/favicon.png">`를 **무조건** 넣는다. favicon은 brand-kit이 이미 임시 저작해 두므로 design-logo 미실행이어도 채워진다.
  - **로고 단색 변형 표시**: 로고를 한 색으로 보여줄 땐 `.mark-mono`(tokens.css)에 `style="-webkit-mask-image:url('../assets/logo/logo.png');mask-image:url('../assets/logo/logo.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로 지정한다. 별도 파일 생성 없음. **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.**
```

- [ ] **Step 4: 다크 로고 스왑 불릿의 트레일러 갱신**

찾기(현재 line 25 끝부):
```
 작은 마크·favicon의 다크는 이게 아니라 🅱-ii(단색 마스터·favicon-dark)가 담당.
```
교체:
```
 작은 마크·favicon은 단일 `favicon.png` 한 장이라 다크 스왑 없이 그대로 쓴다.
```

- [ ] **Step 5: 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); ['락업 패밀리 렌더(6종)','favicon/app-icon 마크(PNG)','로고 단색 변형 표시','rel=\"icon\" href=\"../assets/logo/favicon.png\"'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(/favicon-light\.png|favicon-dark\.png|app-icon\.png|mark-mono\.png/.test(s))throw new Error('stale baked favicon ref'); console.log('html-direction OK')"
```
Expected: `html-direction OK`

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -F - <<'EOF'
feat(brand-kit): §6 락업 6종 + favicon.png(head·타일·app-icon CSS) 무조건 렌더 지침

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase E — 마스코트 가드

### Task E1: Avoid 가드 + 스트레이 제거

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

- [ ] **Step 1: §6 Avoid(한글)에 마스코트 가드**

찾기(현재 `skills/references/design/logo-art-direction.md` line 75 안의 토막):
```
· 정당화 없는 랜덤 동물 ·
```
교체:
```
· 정당화 없는 랜덤 동물 · 마스코트/캐릭터/의인화 마크(gpt-image가 여러 생성·접점에서 캐릭터 일관성을 못 지킴) ·
```

- [ ] **Step 2: §7 프롬프트 청크 Avoid(영문)에 마스코트 가드**

찾기(현재 line 88 안의 토막):
```
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, fake luxury crest,
```
교체:
```
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, mascot/character/anthropomorphic marks (no character consistency across renders), fake luxury crest,
```

- [ ] **Step 3: §7.1 보드 블록 Avoid에 마스코트 가드**

찾기(현재 line 102):
```
Avoid: shield/lock/globe/gear clichés, meaningless gradient/3D bevel/sparkle, letters-only logo, a grid/sheet of many logo variations.
```
교체:
```
Avoid: shield/lock/globe/gear clichés, meaningless gradient/3D bevel/sparkle, letters-only logo, mascot/character marks, a grid/sheet of many logo variations.
```

- [ ] **Step 4: brand-kit-image.md 스트레이 "심볼릭 마스코트" 제거**

찾기(현재 `skills/design-brand-kit/references/brand-kit-image.md` line 116 안의 토막):
```
커스텀 워드마크/태도 있는 아이콘/심볼릭 마스코트/프린트 마크
```
교체:
```
커스텀 워드마크/태도 있는 아이콘/프린트 마크
```

- [ ] **Step 5: 검증**

Run:
```bash
node -e "const fs=require('fs');
const a=fs.readFileSync('skills/references/design/logo-art-direction.md','utf8');
if(!a.includes('마스코트/캐릭터/의인화 마크'))throw new Error('kr guard missing');
if(!a.includes('mascot/character/anthropomorphic marks'))throw new Error('en chunk guard missing');
if(!a.includes('letters-only logo, mascot/character marks'))throw new Error('board guard missing');
const b=fs.readFileSync('skills/design-brand-kit/references/brand-kit-image.md','utf8');
if(b.includes('심볼릭 마스코트'))throw new Error('stray mascot not removed');
console.log('mascot guard OK')"
```
Expected: `mascot guard OK`

- [ ] **Step 6: 커밋**

```bash
git add skills/references/design/logo-art-direction.md skills/design-brand-kit/references/brand-kit-image.md
git commit -F - <<'EOF'
feat(design-logo): 마스코트/캐릭터 마크 가드(gpt-image 캐릭터 일관성 한계) + 스트레이 제거

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase F — 스펙 대체 표기 · 동기화 · 검증

### Task F1: favicon-monochrome(B-🅱-ii) 스펙 대체 표기

**Files:**
- Modify: `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md`

- [ ] **Step 1: 문서 최상단에 대체 노트 추가**

파일 첫 줄(`# ...` 제목) **바로 다음**에 인용 블록 한 줄을 삽입:

```md
> **⚠️ 대체됨(2026-06-08):** 이 스펙의 "단색 마스터 → `bake-logo-assets.mjs` 베이크" 경로는 `logo-asset-suite-and-lockups-design.md`로 대체되었다 — favicon·app-icon은 이제 **PNG**이며 로고 맥락에서 만든다(레터마크/단순=autocrop 재사용, 그 외=로고 `--image`+캐싱 프롬프트로 단순화 생성). `bake-logo-assets.mjs`는 제거됨. 16px 가독 게이트의 취지만 유효하다.
```

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md','utf8'); if(!s.includes('대체됨(2026-06-08)'))throw new Error('missing note'); console.log('spec note OK')"`
Expected: `spec note OK`

- [ ] **Step 3: 커밋**

```bash
git add docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md
git commit -F - <<'EOF'
docs(spec): B-🅱-ii favicon 베이크는 PNG 맥락 생성으로 대체됨 표기

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task F2: 동기화 · 게이트 · 수동 통합 · reload

- [ ] **Step 1: 생성물 동기화**

Run: `npm run sync`
(루트 `skills/`·`agents/` 기준 Codex 번들 재생성 — gitignore라 커밋엔 안 보임. MCP 무변화.)

- [ ] **Step 2: 게이트 통과 확인**

Run: `npm test` → 전체 PASS (BASE − 1).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 수동 통합 검증 (`tokens-to-css` 산출)**

```bash
D="$TEMP/_lk/.design"; rm -rf "$TEMP/_lk"; mkdir -p "$D/assets"
cat > "$D/brand-tokens.json" <<'JSON'
{ "color": { "primary":"#2BF57E", "text":"#F4F8FF", "textMuted":"#AEB8E0", "background":"#0E1330", "surface":"#1A1F4D" },
  "typography": { "display":"\"LINE Seed KR\", sans-serif", "body":"\"IBM Plex Sans KR\", sans-serif" },
  "lockup": { "markScale":"1.6", "wmImgScale":"1.9" } }
JSON
node "skills/design-brand-kit/scripts/tokens-to-css.mjs" "$D/brand-tokens.json" "$D/assets/tokens.css"
grep -E "(--logo-wm-img-scale: 1.9|\.lockup \.wordmark-img)" "$D/assets/tokens.css"
rm -rf "$TEMP/_lk"
```
확인: `--logo-wm-img-scale: 1.9`, `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); ... }`. 블록 없는 토큰으로 같은 명령 → `--logo-wm-img-scale: 1.5` 기본값 확인. `.mark-mono`는 그대로 emit되는지도 확인(유지).

- [ ] **Step 4: reload 안내**

사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. Codex는 `npm run codex:reinstall` 후 열려 있던 세션을 재시작하세요."** (skills·references·scripts 변경.)

- [ ] **Step 5: 동기화 커밋(생성물 변화가 있으면)**

```bash
git status   # 커밋 생성물(.claude-plugin/* 등) 변화 확인 — 이번엔 없을 것
# 변화 있으면만:
git add -A && git commit -F - <<'EOF'
chore: npm run sync 생성물 동기화

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Self-Review (작성자 점검 결과)

- **Spec 커버리지:** §2/§3 D9(이미지-모드 사이징)→A1; D7(bake 제거)→B1; D1·D2·D3·D4(favicon PNG·접근 C·재사용·캐싱)→C1·C2·C3·D1·D2; D5(brand-kit 임시/design-logo 정제)→C1 Step4·5·D1 Step5·6; D6(app-icon CSS)→C1 Step5·D2 Step3; D8(마스코트 가드)→E1; D10(.mark-mono 유지)→D2 Step3·F2 Step3; §7 락업 토큰→A1; §9 마스코트 가드→E1; §10 영향파일→전 Task; §11 검증→F2. 누락 없음.
- **Placeholder 스캔:** A1은 완전한 테스트·구현 코드(현재 파일 검증된 찾기/교체). 마크다운 Task는 현재 파일에서 읽은 정확한 찾기/교체 문자열 + node grep 검증. "TBD/적절히" 없음.
- **타입/이름 일관성:** `wmImgScale`(토큰 키)·`--logo-wm-img-scale`(var)·`.lockup .wordmark-img`(클래스)·`favicon.png`(경로)·`logo-prompt.txt`(캐싱)·`favicon-candidate.png`(시안)가 A1·C1·C2·C3·D1·D2·F2에서 동일. `접근 C`·`autocrop 재사용` 용어가 design-logo·brand-kit·art-dir에서 동일.
- **삭제 안전:** B1 Step1이 import 소비자 0(자기+SKILL 문서 참조만)을 git grep으로 확인한 뒤 삭제. SKILL.md 베이크 참조는 C1·D1에서 제거(grep 검증 Step에 stale 가드 포함).
- **순서:** Phase B(삭제)가 C·D(SKILL의 bake 참조 제거)보다 먼저라 일시적으로 SKILL.md가 없는 스크립트를 문서로 가리키지만, 런타임 import가 아니라 텍스트라 테스트/validate에 무해. C1·D1에서 정리되고 각 검증 Step의 stale 가드가 잔존을 막는다.
- **마스코트 가드 위치:** C2가 §7 line 92(favicon 프레이밍)를, E1이 §6 line 75·§7 line 88·§7.1 line 102(Avoid)를 편집 — 서로 다른 줄이라 충돌 없음. 같은 파일이지만 별 커밋.
