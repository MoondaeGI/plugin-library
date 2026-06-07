# §6 락업 패밀리 + 이미지-모드 락업 사이징 + 전용 favicon 마크 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-kit overview §6에 락업 패밀리 6종을 렌더하고, 이미지-모드 워드마크의 락업 사이징을 토큰으로 잡으며, favicon/app-icon을 로고 베이크가 아니라 전용 SVG 마크 저작으로 전환한다(brand-kit 저작 + design-logo 정제).

**Architecture:** `tokens-to-css.mjs`에 `--logo-wm-img-scale` + `.lockup .wordmark-img`를 추가(코드·TDD)하고, favicon/app-icon 베이크 스크립트(`bake-logo-assets.mjs`)를 제거한 뒤, brand-kit·design-logo SKILL과 참조 문서를 "전용 마크 저작 + 락업 6종"으로 갱신한다. 나머지는 마크다운 저작 지침 편집이다.

**Tech Stack:** Node.js ESM(스킬 스크립트), `node:test`, 순수 HTML/CSS(토큰·락업), 마크다운 스킬 문서.

**Spec:** `docs/superpowers/specs/2026-06-07/logo-asset-suite-and-lockups-design.md`

---

## Prerequisites

- [ ] `npm test`가 현재 통과하는지 확인(회귀 기준선). Run: `npm test` → 전체 PASS.
- [ ] 선행 의존 없음 — 이미 머지된 락업 시스템(`.lockup*`)·`tokens.css`·design-logo/brand-kit 토대 위에서 동작.

## File Structure

| 파일 | 책임 | 신규/수정/삭제 |
|---|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `--logo-wm-img-scale` + `.lockup .wordmark-img` emit | 수정 |
| `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` | 새 var·클래스·기본값·override 테스트 | 수정 |
| `skills/design-logo/scripts/bake-logo-assets.mjs` | favicon/app-icon 베이크(폐기) | **삭제** |
| `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs` | 위 테스트 | **삭제** |
| `skills/design-brand-kit/SKILL.md` | favicon.svg 저작 흐름·락업 6종·`wmImgScale` 스키마·자산 트리·line 224 교체 | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 락업 6종 + favicon.svg 무조건 + `.wordmark-img` + 단색 마스크 | 수정 |
| `skills/design-logo/SKILL.md` | 흐름 11 재작성(favicon.svg 정제)·락업 프리뷰 워드마크 튜닝·자산 트리·footer | 수정 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | favicon 마크 프리뷰·락업 프리뷰 갱신 | 수정 |
| `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md` | B-🅱-ii 대체됨 표기 | 수정 |

**계약(중요):**
- **`lockup.wmImgScale`**(brand-tokens.json `lockup` 블록 선택 키, 기본 `"1.5"`): 이미지-모드 워드마크 이미지 높이 = `1em`의 배수. `tokens-to-css.mjs`가 `--logo-wm-img-scale` var + `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }`로 emit.
- **`favicon.svg`**: `assets/logo/favicon.svg`. 에이전트가 §6 심볼 방향 + `brand-tokens.json` 색으로 저작한 전용 SVG. favicon·app-icon 한 마크. brand-kit 저작(임시) → design-logo 정제. non-clobber 표식은 기존 `candidate/logo/logo-briefs.md`.

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

```js
const LOCKUP_DEFAULTS = { markScale: "1.8", gap: "0.5em", taglineSize: "0.42em", taglineTracking: "0.22em", taglineColor: "textMuted", wmImgScale: "1.5" };
```

- [ ] **Step 4: 구현 — var emit**

`generateLockupVars`의 `--logo-tagline-tracking` 줄 **다음**에 한 줄 추가:

```js
    `  --logo-tagline-tracking: ${pick(lockup.taglineTracking, LOCKUP_DEFAULTS.taglineTracking)};`,
    `  --logo-wm-img-scale: ${pick(lockup.wmImgScale, LOCKUP_DEFAULTS.wmImgScale)};`,
```

- [ ] **Step 5: 구현 — 클래스 규칙 emit**

`generateLockupClass`의 반환 배열에서 `.lockup__mark` 줄 **다음**에 한 줄 추가:

```js
    ".lockup__mark { height: calc(var(--logo-mark-scale) * 1em); width: auto; object-fit: contain; flex: none; }",
    ".lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }",
```

- [ ] **Step 6: 통과 확인**

Run: `node --test tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs`
Expected: PASS (기존 + 신규 3).

- [ ] **Step 7: 전체 회귀**

Run: `npm test`
Expected: 전체 PASS.

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

Run: `node -e "const {execSync}=require('child_process'); const out=execSync('git grep -l \"bake-logo-assets\" -- skills tests scripts').toString(); console.log(out)"`
Expected: `skills/design-logo/scripts/bake-logo-assets.mjs`와 `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs` **두 줄만**(서로 외 import 없음). SKILL.md의 참조는 Phase D에서 제거. 다른 `.mjs`가 import하면 중단하고 재검토.

- [ ] **Step 2: 삭제**

```bash
git rm skills/design-logo/scripts/bake-logo-assets.mjs tests/skills/design-logo/scripts/bake-logo-assets.test.mjs
```

- [ ] **Step 3: 회귀 확인**

Run: `npm test`
Expected: 전체 PASS(삭제된 테스트만큼 개수 감소, 실패 0).

- [ ] **Step 4: 커밋**

```bash
git commit -F - <<'EOF'
refactor(design-logo): favicon/app-icon 베이크 스크립트 제거(전용 마크 저작으로 대체)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase C — brand-kit 저작 지침

### Task C1: brand-kit SKILL.md

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: 자산 트리에 favicon.svg**

`logo/       logo.png   # 캐노니컬 표시 로고` 로 시작하는 줄(현재 line 72)을 찾아 `logo.png` → `logo.png · favicon.svg`로 바꾸고 주석에 favicon 설명을 덧붙인다:

찾기:
```
    logo/       logo.png   # 캐노니컬 표시 로고 — brand-kit이 logo-base에서 시드(미러), design-logo가 덮어씀. overview §6이 이 경로를 가리킴(non-clobber: logo-briefs.md 있으면 안 건드림)
```
교체:
```
    logo/       logo.png · favicon.svg   # 캐노니컬 표시 로고(logo-base 시드 미러) + 전용 favicon/app-icon 마크(brand-kit 저작·design-logo 정제). overview §6·<head>가 이 경로를 가리킴(non-clobber: logo-briefs.md 있으면 안 건드림)
```

- [ ] **Step 2: brand-tokens.json `lockup` 블록에 wmImgScale**

찾기(현재 line 212):
```
  "lockup": { "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted" }
```
교체:
```
  "lockup": { "markScale": "1.8", "gap": "0.5em", "taglineSize": "0.42em", "taglineTracking": "0.22em", "taglineColor": "textMuted", "wmImgScale": "1.5" }
```

- [ ] **Step 3: lockup 설명 노트에 wmImgScale 한 문장**

`> \`lockup\`(선택)은 **심볼+워드마크 락업**의` 으로 시작하는 노트(현재 line 222)의 **끝**(`...사용자는 승인만).`) 바로 뒤에 이어 붙인다:

찾기(줄 끝):
```
 **마크 모양마다 균형이 달라 `markScale`은 프리뷰에서 에이전트가 조정**한다(사용자는 승인만).
```
교체:
```
 **마크 모양마다 균형이 달라 `markScale`은 프리뷰에서 에이전트가 조정**한다(사용자는 승인만). **이미지 모드 워드마크**는 `wmImgScale`(워드마크 이미지 높이 = `1em`의 배수, 기본 1.5)로 `.wordmark-img` 높이가 emit된다 — 심볼 `markScale`과 함께 프리뷰에서 조정해 균형을 맞춘다.
```

- [ ] **Step 4: line 224 단색 베이크 노트 → 전용 마크 저작으로 교체**

찾기(현재 line 224):
```
> 단색 자산(favicon·app-icon)은 design-logo가 `mark-mono.png`에서 `bake-logo-assets.mjs`로 베이크하며, 입력 색은 brand-tokens.json의 `text`(ink)·`primary`(tile)를 쓴다. brand-kit은 토큰만 제공하고 베이크는 design-logo 소관이다(스펙 B-🅱-ii).
```
교체:
```
> **favicon·app-icon은 전용 마크 저작이다(베이크 아님).** 로고를 재사용·단색화하거나 gpt-image로 생성하지 않고, 에이전트가 §6 심볼 방향 + `brand-tokens.json` 색으로 `assets/logo/favicon.svg`(SVG)를 **직접 저작**한다 — 같은 한 마크가 favicon과 app-icon. brand-kit이 저작(임시)하고 design-logo가 로고 lock 후 정제한다(흐름 5·8 non-clobber 동일).
```

- [ ] **Step 5: 흐름 5(자산 생산)에 favicon.svg 저작 단계**

`- **로고 캐노니컬 미러**:` 로 시작하는 흐름 5 하위 불릿(현재 line 352, `...확정 로고 보존).`로 끝남) **다음 줄**에 새 불릿을 추가:

```
   - **favicon/app-icon 마크 저작**: `candidate/logo/logo-briefs.md`가 **없으면** §6 심볼 방향 + 토큰 색으로 `assets/logo/favicon.svg`를 저작한다(16px 가독 우선의 단순 벡터, gpt-image 없음 — 같은 한 마크가 favicon·app-icon). overview §6 favicon/app-icon 자리와 `<head>` favicon `<link>`가 이 파일을 가리킨다. **있으면**(design-logo 정제본) 건드리지 않는다(non-clobber).
```

- [ ] **Step 6: 흐름 8(lock non-clobber)에 favicon.svg 보장**

`- **로고 캐노니컬 미러(non-clobber)**:` 로 시작하는 흐름 8 불릿(현재 line 356, `...날리지 않는다.`로 끝남)의 **끝**에 이어 붙인다:

찾기(줄 끝):
```
 이로써 brand-kit 재실행이 확정 로고를 날리지 않는다.
```
교체:
```
 이로써 brand-kit 재실행이 확정 로고를 날리지 않는다. **favicon.svg도 동일** — `logo-briefs.md`가 없으면 최신 저작본을 보장하고, 있으면 design-logo 정제본을 건드리지 않는다.
```

- [ ] **Step 7: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); ['favicon.svg','wmImgScale','전용 마크 저작','favicon/app-icon 마크 저작'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(s.includes('bake-logo-assets.mjs로 베이크'))throw new Error('stale bake note'); console.log('brand-kit SKILL OK')"`
Expected: `brand-kit SKILL OK`

- [ ] **Step 8: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -F - <<'EOF'
feat(brand-kit): favicon.svg 전용 마크 저작 흐름 + lockup wmImgScale 스키마

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task C2: brand-kit-html-direction.md §6

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`

- [ ] **Step 1: §6 락업 렌더 불릿을 6종 패밀리로 교체**

`  - **락업 렌더(신규)**:` 로 시작하는 불릿(현재 line 23) 전체를 교체:

찾기(불릿 한 줄 전체, `  - **락업 렌더(신규)**:` … `심볼이 없으면 락업 생략하고 워드마크만.`):
```
  - **락업 렌더(신규)**: §6에 실제 `.lockup`을 1개 이상 렌더한다 — `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`(가로) 와 `.lockup.lockup--stacked`(세로). 태그라인이 있으면 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>` 추가. `.lockup*`·`.wordmark`는 tokens.css가 정의(재구현 금지). 이미지 모드 워드마크면 `<span class="wordmark">` 대신 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">`(워드마크 자체가 이미지). 심볼이 없으면 락업 생략하고 워드마크만.
```
교체:
```
  - **락업 패밀리 렌더(6종)**: §6에 다음을 모두 렌더한다 — ① 가로 `.lockup` · ② 세로 `.lockup.lockup--stacked` · ⑤ 심볼 단독(`<img src="../assets/logo/logo.png">`) · ⑥ 워드마크 단독(이미지 모드 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">` | 폰트 모드 `<span class="wordmark">브랜드명</span>`)은 **항상**. 태그라인이 있으면 ③ 가로+태그라인 · ④ 세로+태그라인도 추가. 가로/세로 구조: `<div class="lockup"><img class="lockup__mark" src="../assets/logo/logo.png"><div class="lockup__body"><span class="wordmark">브랜드명</span></div></div>`, 태그라인은 `.lockup__body` 안에 `<span class="lockup__tagline">태그라인</span>`. **이미지 모드 워드마크**는 `<span class="wordmark">` 대신 `<img class="wordmark-img" ...>` — 높이는 `.wordmark-img`(tokens.css, `--logo-wm-img-scale`)가, 심볼은 `--logo-mark-scale`이 잡는다(둘 다 토큰, 재구현 금지). 심볼이 없으면 락업·심볼단독 생략, 워드마크 단독만.
```

- [ ] **Step 2: favicon/app-icon 불릿을 전용 마크로 교체**

`  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**:` 로 시작하는 불릿(현재 line 24) 전체를 교체:

찾기(불릿 한 줄 전체, `  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**:` … `단색 자산이 아직 없으면(design-logo 미실행) 이 타일·스니펫은 생략한다.`):
```
  - **favicon/app-icon 실파일(스펙 B-🅱-ii)**: §6 변형 타일은 design-logo가 베이크한 실제 자산을 가리킨다 — 앱아이콘 `<img src="../assets/logo/app-icon.png">`, 파비콘 `<img src="../assets/logo/favicon-light.png">`. 페이지내 단색 마크 재색은 `.mark-mono`(tokens.css 정의)에 `style="-webkit-mask-image:url('../assets/logo/mark-mono.png');mask-image:url('../assets/logo/mark-mono.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로(어두운 타일 위 흰 마크는 `filter:brightness(0) invert(1)`). **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.** `<head>`에 다크 스왑 favicon을 넣는다: `<link rel="icon" href="../assets/logo/favicon-light.png" media="(prefers-color-scheme: light)">` 와 `<link rel="icon" href="../assets/logo/favicon-dark.png" media="(prefers-color-scheme: dark)">`. 단색 자산이 아직 없으면(design-logo 미실행) 이 타일·스니펫은 생략한다.
```
교체:
```
  - **favicon/app-icon 마크(전용 저작)**: favicon/app-icon 자리는 `assets/logo/favicon.svg`(brand-kit이 저작한 전용 마크)를 가리킨다 — `<img src="../assets/logo/favicon.svg">`(앱아이콘 자리도 같은 마크). 16px·32px 미리보기로 가독을 보여준다. `<head>`에 `<link rel="icon" href="../assets/logo/favicon.svg">`를 **무조건** 넣는다(로고에서 베이크하지 않고 마크 자체가 타일을 포함하므로 prefers-color-scheme 분기 불필요). 이 마크는 design-logo 미실행이어도 brand-kit이 이미 저작해 둔다.
  - **로고 단색 변형 표시**: 로고를 한 색으로 보여줄 땐 `.mark-mono`(tokens.css)에 `style="-webkit-mask-image:url('../assets/logo/logo.png');mask-image:url('../assets/logo/logo.png')"`를 주고 색은 `.mark-mono--primary` 등 modifier로 지정한다. 별도 파일 생성 없음. **mask 재색은 라이브 서버(http)에서만 렌더된다 — overview는 `serve-design.mjs`로 본다.**
```

- [ ] **Step 3: §4 autocrop 워드마크 단서는 유지(변경 없음).** favicon은 이제 컷아웃 자산이 아니므로 추가 편집 불필요.

- [ ] **Step 4: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); ['락업 패밀리 렌더(6종)','favicon.svg','로고 단색 변형 표시','--logo-wm-img-scale'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(s.includes('favicon-light.png')||s.includes('app-icon.png'))throw new Error('stale baked favicon ref'); console.log('html-direction OK')"`
Expected: `html-direction OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -F - <<'EOF'
feat(brand-kit): §6 락업 6종 + favicon.svg 전용 마크 무조건 렌더 지침

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase D — design-logo 정제 지침

### Task D1: design-logo SKILL.md

**Files:**
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: 자산 트리(assets/logo) 교체**

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
           favicon.svg               # 전용 favicon/app-icon 마크 (brand-kit 저작·design-logo 정제, gpt-image 없음)
           logo-dark.png             # 다크모드 변형 (remap-logo-dark 또는 생성 폴백)
```

- [ ] **Step 2: candidate 트리의 mark-mono 시안 → favicon 시안**

찾기(현재 line 47):
```
      mark-mono-candidate.png (+v2…) # 단색 마크 축약 시안(프리뷰 게이트)
```
교체:
```
      favicon-candidate.svg          # favicon/app-icon 마크 시안(정제 프리뷰 게이트)
```

- [ ] **Step 3: 락업 프리뷰 게이트에 wmImgScale 튜닝**

찾기(현재 line 136, 줄 일부):
```
어색하면 brand-tokens.json `lockup.markScale`/`gap`을 조정해 재렌더한 뒤
```
교체:
```
어색하면 brand-tokens.json `lockup.markScale`/`gap`(이미지 모드 워드마크면 `lockup.wmImgScale`도)을 조정해 재렌더한 뒤
```

- [ ] **Step 4: 흐름 11 재작성(단색 베이크 → favicon.svg 정제 저작)**

찾기(현재 line 140, `11. **단색 자산 suite(스펙 B-🅱-ii)**:` 로 시작하는 줄 **전체**):
```
11. **단색 자산 suite(스펙 B-🅱-ii)**: 심볼 lock 직후 — ⓐ 확정 `logo.png`를 첨부(`--image --input-fidelity high`)해 "single flat color, bold thick strokes, simplest silhouette, drop frame/text/accents, legible at 16px"로 `candidate/logo/mark-mono-candidate.png`를 축약 생성한다(하이브리드, `logo-art-direction.md` §7 단색 프레이밍). ⓑ **프리뷰 게이트**: `logos.html` 단색 프리뷰 섹션에 16/24/32px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 결과를 사용자에게 제시(평이한 승인만). ⓒ 승인 후 `assets/logo/mark-mono.png`로 lock하고, brand-tokens.json 색을 읽어 베이크한다: `node "<이 스킬 디렉터리>/scripts/bake-logo-assets.mjs" --mark <.design>/assets/logo/mark-mono.png --out-dir <.design>/assets/logo --ink "<brand text/ink HEX>" --tile "<brand primary HEX>"` → `favicon-light.png`·`favicon-dark.png`·`app-icon.png` 생성. **HTML은 편집하지 않는다**(overview §6이 이 경로들을 가리킴).
```
교체:
```
11. **favicon/app-icon 마크 정제(전용 저작)**: 심볼 lock 직후 — ⓐ 확정 `logo.png`의 형태에 맞게 `assets/logo/favicon.svg`를 **정제 저작**한다(brand-kit 임시본을 덮어씀). 로고를 재사용·단색화하거나 gpt-image로 생성하지 않는다 — §6 심볼 방향 + `brand-tokens.json` 색으로 16px 가독 우선의 단순 벡터를 직접 그린다(좌표·토큰 색으로 결정적, 같은 한 마크가 favicon·app-icon). 시안은 `candidate/logo/favicon-candidate.svg`. ⓑ **프리뷰 게이트**: `logos.html` favicon 프리뷰 섹션에 16/24/32/48px·light/dark로 렌더하고, **라이브 서버(http)** 로 `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 단순/굵게 다시 그려 제시(평이한 승인만, gpt-image·자동 단순화 폴백 없음). ⓒ 승인 후 `assets/logo/favicon.svg`로 lock. **HTML은 편집하지 않는다**(overview §6·`<head>`가 이 경로를 가리킴).
```

- [ ] **Step 5: footer 노트(흐름 말미) favicon 문구 교체**

찾기(현재 line 142, 줄 일부):
```
파비콘·앱 아이콘은 흐름 11(단색 자산 suite)에서 단색 마스터 `mark-mono.png`로부터 `bake-logo-assets.mjs`로 베이크한다(스펙 B-🅱-ii).
```
교체:
```
파비콘·앱 아이콘은 흐름 11에서 전용 마크 `favicon.svg`로 저작한다(로고 재사용·베이크 아님, gpt-image 없음).
```

- [ ] **Step 6: 같은 footer 줄의 산출 요약 교체**

찾기(현재 line 142, 줄 끝부):
```
확정 심볼 + 단색 자산 suite + 다크 변형을 산출한다.
```
교체:
```
확정 심볼 + favicon/app-icon 마크 + 다크 변형을 산출한다.
```

- [ ] **Step 7: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-logo/SKILL.md','utf8'); ['favicon.svg','favicon/app-icon 마크 정제(전용 저작)','lockup.wmImgScale'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(s.includes('bake-logo-assets.mjs')||s.includes('mark-mono.png'))throw new Error('stale bake/mark-mono ref'); console.log('logo SKILL OK')"`
Expected: `logo SKILL OK`

- [ ] **Step 8: 커밋**

```bash
git add skills/design-logo/SKILL.md
git commit -F - <<'EOF'
feat(design-logo): 흐름 11을 favicon.svg 전용 마크 정제 저작으로 재작성(베이크 제거)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task D2: logo-sheet-html-direction.md

**Files:**
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`

- [ ] **Step 1: 단색 마크 프리뷰 섹션 → favicon 마크 프리뷰로 교체**

찾기(현재 line 19, `- **단색 마크 가독 프리뷰 섹션(스펙 B-🅱-ii)**:` 로 시작하는 불릿 전체):
```
- **단색 마크 가독 프리뷰 섹션(스펙 B-🅱-ii)**: 시트 하단에 단색 마크 후보(`mark-mono`)를 16·24·32·48px로, light/dark 두 배경에 렌더한다 — `<img src="../candidate/logo/mark-mono-candidate.png" width="16" height="16">` 식. "favicon 크기에서 읽히나"를 보는 자리(스펙 B-🅱-ii 프리뷰 게이트). app-icon 미리보기는 브랜드색 정사각 타일 + `filter:brightness(0) invert(1)` 흰 마크로 보여준다. **이 시트는 `mask` 재색 데모를 포함하면 반드시 라이브 서버(http)로 열어 본다 — `file://`에서는 mask가 빈다.**
```
교체:
```
- **favicon 마크 가독 프리뷰 섹션**: 시트 하단에 favicon/app-icon 마크 후보(`../candidate/logo/favicon-candidate.svg`)를 16·24·32·48px로, light/dark 두 배경에 렌더한다 — `<img src="../candidate/logo/favicon-candidate.svg" width="16" height="16">` 식. "favicon 크기에서 읽히나"를 보는 자리. 이 마크는 로고에서 베이크한 게 아니라 §6 심볼 방향으로 저작한 **전용 SVG**다(gpt-image 없음, favicon·app-icon 같은 마크). SVG라 `file://`에서도 렌더되지만, 페이지에 `.mark-mono` mask 데모를 함께 넣으면 라이브 서버(http)로 열어 본다(`file://`에선 mask가 빈다).
```

- [ ] **Step 2: 락업 프리뷰 섹션에 이미지-모드 워드마크 + 6종 단서 추가**

찾기(현재 line 18, 줄 끝):
```
 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트).
```
교체:
```
 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트). 이미지 모드 워드마크면 `<span class="wordmark">` 대신 `<img class="wordmark-img" src="../assets/brand-kit/wordmark-base.png">`(높이는 `--logo-wm-img-scale`). 가로·세로 외 심볼 단독·워드마크 단독, 태그라인 변형까지 한자리에서 비교한다.
```

- [ ] **Step 3: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-logo/references/logo-sheet-html-direction.md','utf8'); ['favicon 마크 가독 프리뷰 섹션','favicon-candidate.svg','wordmark-img'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(s.includes('mark-mono-candidate.png'))throw new Error('stale mark-mono ref'); console.log('logo-sheet OK')"`
Expected: `logo-sheet OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-logo/references/logo-sheet-html-direction.md
git commit -F - <<'EOF'
feat(design-logo): logos.html favicon 마크 프리뷰 + 이미지-모드 락업 단서

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

---

## Phase E — 스펙 대체 표기 · 동기화 · 검증

### Task E1: favicon-monochrome(B-🅱-ii) 스펙에 대체 표기

**Files:**
- Modify: `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md`

- [ ] **Step 1: 문서 최상단에 대체 노트 추가**

파일 첫 줄(`# ...` 제목) **바로 다음**에 한 줄(인용 블록)을 삽입한다:

```md
> **⚠️ 대체됨(2026-06-07):** 이 스펙의 "단색 마스터 → `bake-logo-assets.mjs` 베이크" 경로는 `logo-asset-suite-and-lockups-design.md`로 대체되었다 — favicon·app-icon은 이제 전용 마크 `favicon.svg` 저작이며 `bake-logo-assets.mjs`는 제거됨. 단색 마크 가독 게이트의 취지(16px 가독)만 유효하다.
```

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md','utf8'); if(!s.includes('대체됨(2026-06-07)'))throw new Error('missing note'); console.log('spec note OK')"`
Expected: `spec note OK`

- [ ] **Step 3: 커밋**

```bash
git add docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md
git commit -F - <<'EOF'
docs(spec): B-🅱-ii favicon 베이크는 전용 마크 저작으로 대체됨 표기

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
```

### Task E2: 동기화 · 게이트 · 수동 통합 · reload

- [ ] **Step 1: 생성물 동기화**

Run: `npm run sync`
(루트 `skills/`·`agents/` 기준 Codex 번들 재생성 — gitignore라 커밋엔 안 보임. MCP 무변화.)

- [ ] **Step 2: 게이트 통과 확인**

Run: `npm test` → 전체 PASS.
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
확인: `--logo-wm-img-scale: 1.9`, `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); ... }`. 블록 없는 토큰으로 같은 명령 → `--logo-wm-img-scale: 1.5` 기본값 확인.

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

- **Spec 커버리지:** §2/§3 D5(이미지-모드 사이징)→A1; D7(bake 제거)→B1; D1·D2·D3(favicon 저작·통일·단계)→C1·C2·D1·D2; D4(락업 6종)→C2 Step1; D6(단색 마스크)→C2 Step2; §9 영향파일→전 Task; E1(B-🅱-ii 대체)→E1; §10 검증→E2. 누락 없음.
- **Placeholder 스캔:** A1은 완전한 테스트·구현 코드. 마크다운 Task는 정확한 찾기/교체 문자열 + grep 검증. "TBD/적절히" 없음.
- **타입/이름 일관성:** `wmImgScale`(토큰 키)·`--logo-wm-img-scale`(var)·`.lockup .wordmark-img`(클래스)·`favicon.svg`(경로)가 A1·C1·C2·D1·D2·E2에서 동일.
- **삭제 안전:** B1 Step1이 import 소비자 0을 git grep으로 확인한 뒤 삭제(SKILL.md 문서 참조는 D 단계에서 정리).
- **순서:** Phase B(삭제)가 D(SKILL의 bake 참조 제거)보다 먼저라 일시적으로 SKILL.md가 없는 스크립트를 가리키지만, 런타임 import가 아니라 문서 텍스트라 테스트/validate에 무해. D에서 정리됨.
