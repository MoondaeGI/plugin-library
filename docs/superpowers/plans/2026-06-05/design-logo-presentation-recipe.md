# design-logo 제시용 레시피 (스펙 A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-logo`가 제시용 로고를 `--autocrop` 없이·`--quality high`로·"premium/finished" 프롬프트로 생성하게 바꿔, "너무 심플/유치" 문제를 해소한다.

**Architecture:** 코드(`image-gen.mjs`) 변경 없이 **스킬 가이드 md만 수정**한다 — (1) 프롬프트 프레이밍을 "reduced/minimal"에서 "premium/finished/풍부 허용"으로, (2) 생성 호출의 `--quality low→high`·`--autocrop` 제거, (3) 여백 포함(비-autocrop) 로고를 시트·보드가 `object-fit:contain`로 받게. 자산 토폴로지·HTML 계약·"design-logo는 HTML 무편집" 불변식은 **건드리지 않는다**(그건 스펙 B).

**Tech Stack:** 마크다운 스킬 가이드, `image-gen.mjs`(gpt-image-1.5, 플래그만 변경), `node --test`(회귀 기준선), `npm run validate`.

**Spec:** `docs/superpowers/specs/2026-06-05/design-logo-presentation-recipe-design.md`

---

## Prerequisites

- [ ] 기준선 확인. Run: `npm test` → 전체 PASS. Run: `npm run validate` → PASS. (코드 무변경이라 끝에서도 동일해야 한다.)
- [ ] `OPENAI_API_KEY`가 `.env`에 있어야 Task 1(경험적 검증)이 돈다. 없으면 Task 1만 건너뛰고 Task 2~4(문서)만 진행 후, 키 확보 시 Task 1 수행.

## File Structure (변경 대상)

| 파일 | 책임 | 변경 |
|---|---|---|
| `skills/references/design/logo-art-direction.md` | 로고 생성 프롬프트·형태 가이드(공유 ref) | §0 투명 주의·§3 품질어휘·§7 청크를 "premium/finished·autocrop off·high"로 |
| `skills/design-logo/SKILL.md` | 로고 스킬 흐름·image-gen 호출 예시 | 호출 예시 `--quality high`·`--autocrop` 제거·프롬프트 프레이밍 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | logos.html 시트 저작 가이드 | 카드 이미지 `object-fit:contain`(여백 포함 마크 수용) |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | overview.html 저작 가이드 | §4 autocrop 전제에 "제시용 로고 예외" 한 줄 |

코드/테스트 파일 변경 없음.

---

## Task 1: 경험적 레시피 게이트 (배경 투명 vs 불투명 확정)

**목적:** 새 레시피(autocrop off·high·premium 프롬프트)에서 **배경 = 투명**이 시스템 정합적이면서 충분히 풍부한지 확인한다. 기본값은 **투명**(보드·다운스트림이 투명 컷아웃 전제). 투명 엠블럼이 "속 빈" 느낌이면 불투명을 폴백으로 기록.

**Files:** 없음(생성·육안 판정만). 산출 이미지는 `design-test/SugarLoop/.design/candidate/logo/recipeA/`(임시).

- [ ] **Step 1: 투명 + 불투명 1장씩 생성 (동일 프롬프트)**

프롬프트 파일은 기존 실험의 콤비네이션 프롬프트를 재사용한다(`design-test/SugarLoop/.design/candidate/logo/experiment-types/08-combination.txt`). 두 배경으로 1장씩:

Run (cwd = `design-test/SugarLoop`):
```bash
GEN="<repo>/skills/image-gen/scripts/image-gen.mjs"
P=".design/candidate/logo/experiment-types/08-combination.txt"
mkdir -p .design/candidate/logo/recipeA
# 투명 (autocrop 없음, high)
node "$GEN" --prompt-file "$P" --out .design/candidate/logo/recipeA/transparent.png \
  --model gpt-image-1.5 --quality high --size 1024x1024 --background transparent
# 불투명 (autocrop 없음, high)
node "$GEN" --prompt-file "$P" --out .design/candidate/logo/recipeA/opaque.png \
  --model gpt-image-1.5 --quality high --size 1024x1024 --background opaque
```
Expected: 두 PNG 생성(경로 출력).

- [ ] **Step 2: 육안 판정 + 결정 기록**

두 이미지를 Read로 본다. 판정 규칙:
- 투명본이 마크/엠블럼으로 충분히 완성돼 보이고(배지·심볼이 자기완결), 페이지 배경 위에 얹어도 자연스러우면 → **배경 = 透明 확정**(기본값).
- 투명본이 "속이 비어" 어색하고 불투명본만 완성돼 보이면 → 본 스펙 A 범위에선 **투명 유지하되 프롬프트에 "self-contained filled badge/mark on transparent" 보강**으로 해결(불투명은 보드 깨짐 위험이라 A에서 채택 안 함). 그래도 부족하면 "불투명 채택은 스펙 B(자산 토폴로지 변경)로 이연"이라고 기록하고 A는 투명+보강으로 마감.

결정을 `docs/superpowers/specs/2026-06-05/design-logo-presentation-recipe-design.md` §3.1의 "배경" 항목에 한 줄로 확정 기입(예: "확정: 투명 + self-contained 보강").

- [ ] **Step 3: 임시 산출물 정리**

Run: `rm -rf "design-test/SugarLoop/.design/candidate/logo/recipeA"`

- [ ] **Step 4: 커밋(스펙 배경 확정 반영)**

```bash
git add docs/superpowers/specs/2026-06-05/design-logo-presentation-recipe-design.md
git commit -m "docs(design-logo): A 레시피 배경 결정 확정(투명) 반영"
```

---

## Task 2: logo-art-direction.md — 프롬프트 프레이밍을 premium/finished로

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`

> 이게 가장 큰 레버다(round-1이 유치했던 핵심은 "reduced/minimal" 프롬프트). "축약 금지"가 아니라 "완성된·프리미엄·필요시 풍부한 엠블럼 허용"으로 바꾸되, 단순 마크 자체를 금지하진 않는다.

- [ ] **Step 1: §0 투명 주의 단락에 autocrop/quality 한 줄 추가**

`## 0. 목적 / 사용법`의 `> **투명 배경 주의**:` 블록 끝에 다음 줄을 잇는다:

```text
> **제시용 레시피(중요)**: 로고는 favicon급 축약이 아니라 *완성된 제시용 마크*다. 컷아웃 생성 시 **`--autocrop`을 쓰지 않고**(여백 유지) **`--quality high`**로 굽는다. 작은 favicon·축소 마크는 별도(스펙 B)이며, 이 가이드의 로고는 "큰 화면용 완성 로고"를 전제한다.
```

- [ ] **Step 2: §3 품질 표현 문장 교체**

`## 3. Construction Geometry 언어`의 "품질을 끌어올리는 표현" 줄에서 `"... looks researched and reduced, not decorative; reduced to its essential form; ..."`를 다음으로 교체(과환원 어휘 제거, 완성도 어휘 추가):

```text
품질을 끌어올리는 표현(프롬프트에 그대로 붙임): "precise, intentional, balanced; built on a grid/keyline; geometrically constructed; optically balanced; consistent stroke weight; strong, recognizable silhouette; premium, finished, looks like a real shipped logo, not a wireframe glyph; flat, no gradient; high contrast against background."
```

- [ ] **Step 3: §7 프롬프트 청크 교체**

`## 7. 프롬프트 청크 (그대로 떠넣기)`의 코드블록을 다음으로 교체:

```text
Create a single, finished, premium logo for "[BRAND NAME]", presented centered with generous padding — looks like a real, shipped brand logo, not a sketch or a wireframe glyph.

Mark concept: [logo idea — monogram/symbol + metaphor].
Construction: built from clear geometry — [circle/grid/diagonal cut/module/frame/orbit] — precise, intentional, optically balanced.
Form language: [geometric/organic, angular/rounded], consistent stroke weight, strong silhouette. May be a richer emblem/badge if the direction calls for it (still clean and intentional).
Wordmark (if shown): [geometric/humanist/serif/mono] character, tight kerning, one custom detail.
Color: brand palette [HEX...] — flat, no gradient; tasteful 1–3 tones.
Presentation: large centered mark, generous clearspace, NOT autocropped to the edges, no mockup, no busy scenery behind, no extra UI.
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, fake luxury crest, copying famous marks, meaningless gradient/3D bevel/drop shadow/sparkle, clip-art feel, inconsistent variants, tiny illegible detail.
```

> 주: `also valid as solid monochrome (pure black, pure white)` 줄은 삭제(단색 강제가 풍부함을 죽임 — 단색 적합성은 스펙 B의 축소 마크에서 따진다). favicon 16px 가독 요구도 이 청크에선 뺀다(축소 마크는 B).

- [ ] **Step 4: §7 청크 직후 설명 문장 보정**

§7 청크 아래 `위 [브래킷]은 ...` 문장에서 `near-black/white·logo idea·기하·form·타이포·HEX`를 그대로 두되, 끝에 한 줄 추가:

```text
제시용 로고는 **autocrop 없이 high quality**로 굽는다(§0 제시용 레시피). 단색·favicon 가독 판정은 이 단계가 아니라 축소 마크(스펙 B)에서 한다.
```

- [ ] **Step 5: 구조 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/references/design/logo-art-direction.md','utf8'); ['제시용 레시피','NOT autocropped','premium, finished'].forEach(m=>{if(!s.includes(m))throw new Error('missing '+m)}); if(/reduced to its essential form/.test(s)) throw new Error('과환원 어휘 잔존'); console.log('logo-art-direction OK')"
```
Expected: `logo-art-direction OK`

- [ ] **Step 6: 커밋**

```bash
git add skills/references/design/logo-art-direction.md
git commit -m "feat(design-logo): 로고 프롬프트를 premium/finished·autocrop off·high로 전환"
```

---

## Task 3: design-logo SKILL.md — 호출 예시·흐름 파라미터

**Files:**
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: "이미지 생성" 모델·배경 항목 교체**

`## 이미지 생성 (공유 \`image-gen\` 스킬)`의 `**모델·배경**` 불릿을 다음으로 교체:

```text
- **모델·배경**: 로고 마크는 `gpt-image-1.5 --background transparent`(투명 PNG). **제시용 로고는 `--autocrop`을 쓰지 않는다**(여백 유지 — favicon급 꽉참 금지). 작은 축소 마크·favicon은 별도(스펙 B).
```

(기존 "투명 컷아웃은 `--autocrop`을 붙여 마크가 캔버스를 꽉 채우게 한다." 문장을 위로 대체.)

- [ ] **Step 2: 품질 기본값 항목 추가/교체**

같은 절의 충실도/버전 불릿 근처에 한 줄 추가(없으면 `**버전 보존**` 위에):

```text
- **품질**: 제시용 로고는 `--quality high`로 굽는다(과거 `low`가 유치함의 원인 중 하나였다). 발산·다듬기 모두 high.
```

- [ ] **Step 3: 호출 예시 2개의 플래그 교체**

두 `node ... image-gen.mjs` 예시 블록에서 `--autocrop --quality low` → `--quality high`로 교체(즉 `--autocrop` 제거, `low`→`high`). 발산 예시·앵커 예시 둘 다.

변경 후 발산 예시(모드 B):
```bash
node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
  --prompt-file <컨셉 프롬프트 파일> \
  --out "<cwd>/.design/candidate/logo/concepts/round-1/01.png" \
  --auto-version --model gpt-image-1.5 --background transparent --quality high
```
변경 후 앵커 예시(모드 A/C·수렴)도 동일하게 `--autocrop` 제거·`--quality high`:
```bash
node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
  --prompt-file <컨셉 프롬프트 파일> \
  --image "<cwd>/.design/candidate/logo/seed.png" --input-fidelity high \
  --out "<cwd>/.design/candidate/logo/concepts/round-2/01.png" \
  --auto-version --model gpt-image-1.5 --background transparent --quality high
```

- [ ] **Step 4: 흐름 6(발산 라운드) 파라미터 문구 교체**

`### Phase 2`의 항목 6에서 `(\`gpt-image-1.5 --background transparent --autocrop --quality low\`)`를 `(\`gpt-image-1.5 --background transparent --quality high\`, autocrop 없음)`로 교체.

- [ ] **Step 5: 구조 검증**

Run:
```bash
node -e "const s=require('fs').readFileSync('skills/design-logo/SKILL.md','utf8'); if(/--autocrop/.test(s)) throw new Error('autocrop 잔존'); if(/--quality low/.test(s)) throw new Error('quality low 잔존'); if(!/--quality high/.test(s)) throw new Error('quality high 없음'); console.log('design-logo SKILL OK')"
```
Expected: `design-logo SKILL OK`

- [ ] **Step 6: 커밋**

```bash
git add skills/design-logo/SKILL.md
git commit -m "feat(design-logo): 호출 예시·흐름을 autocrop off·quality high로"
```

---

## Task 4: 시트·보드가 여백 포함 마크를 받게 (object-fit:contain)

**Files:**
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`

> 비-autocrop 로고는 투명 여백을 품으므로, 카드/슬롯이 `height:Npx` 대신 `max-height + object-fit:contain`로 받아야 마크가 콩알이 안 된다.

- [ ] **Step 1: logo-sheet-html-direction.md §2 카드 구성 보정**

`## 2. 카드 구성`의 첫 불릿(투명 로고 PNG …)에서 "autocrop으로 마크가 캔버스를 꽉 채운 상태라 `height:Npx`가 곧 마크 크기" 부분을 다음으로 교체:

```text
각 카드 = **투명 로고 PNG**(제시용 — autocrop 없이 여백 포함) + **인덱스 번호** + **한 줄 방향 라벨** + **컨셉 방법/유형 태그**. 카드 이미지는 `max-height:Npx; width:auto; object-fit:contain`으로 받아 여백 포함 마크도 균일하게 보이게 한다.
```

그리고 같은 절의 "비정사각 마크는 `object-fit:contain`" 줄은 "모든 마크 `object-fit:contain`(여백 정규화)"로 일반화.

- [ ] **Step 2: logo-sheet §8 컷아웃 청크 모델 플래그 교체**

`## 8. 컷아웃 생성 프롬프트 청크`의 맨 끝 문장 `--model gpt-image-1.5 --background transparent --autocrop --auto-version`을 `--model gpt-image-1.5 --background transparent --quality high --auto-version`(autocrop 제거)로 교체. 그리고 그 윗줄 "앵커(A·C·수렴)는 여기에 `--input-fidelity high` 추가."는 유지.

- [ ] **Step 3: brand-kit-html-direction.md §4 autocrop 전제에 예외 한 줄**

`## 원칙` 4번(autocrop 전제) 끝에 다음을 잇는다:

```text
**예외 — 제시용 로고**: `design-logo`의 제시용 로고는 autocrop을 쓰지 않아 여백을 품는다. §6 로고 자리는 이미 `max-height`+`object-fit:contain`이라 그대로 graceful하게 받는다(고정 height 강제 금지).
```

- [ ] **Step 4: 구조 검증**

Run:
```bash
node -e "const fs=require('fs'); const a=fs.readFileSync('skills/design-logo/references/logo-sheet-html-direction.md','utf8'); if(/--autocrop/.test(a)) throw new Error('sheet autocrop 잔존'); if(!/object-fit:contain/.test(a)) throw new Error('sheet object-fit 없음'); const b=fs.readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); if(!/예외 — 제시용 로고/.test(b)) throw new Error('board 예외 없음'); console.log('sheets OK')"
```
Expected: `sheets OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/design-logo/references/logo-sheet-html-direction.md skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -m "feat(design-logo): 시트·보드가 여백 포함(비-autocrop) 로고를 object-fit:contain로 수용"
```

---

## Task 5: 동기화 · 게이트 · 통합 확인

- [ ] **Step 1: Codex 번들 동기화**

Run: `npm run sync` (루트 `skills/` 기준 `plugins/personal/` 재생성 — gitignore라 커밋 안 보임. MCP·agents 변경 없음.)

- [ ] **Step 2: 게이트**

Run: `npm test` → 전체 PASS(코드 무변경이라 기준선과 동일).
Run: `npm run validate` → PASS.

- [ ] **Step 3: 통합 확인 (Task 1에서 키 있었으면)**

새 레시피로 SugarLoop 콤비네이션 1장 생성(투명·autocrop 없음·high·새 §7 프롬프트)해 round-1 산출물보다 확실히 풍부한지 육안 확인. 부족하면 Task 2 §7 프롬프트를 보강해 재생성.

- [ ] **Step 4: reload 안내**

사용자에게: **"이 Claude 세션에서 `/reload-plugins` 실행. Codex는 `npm run codex:reinstall`."** (skills·references 변경.)

---

## Self-Review (작성자 점검)

- **Spec 커버리지:** §3.1 레시피(autocrop off·high·프롬프트)→Task 2·3; §3.1 배경 결정→Task 1; §3.2 보드 공존(object-fit)→Task 4; §3.3 불변식 유지(자산·HTML 무변경)→Task 2~4가 자산 토폴로지·HTML 계약을 안 건드림으로 충족; §4 영향 파일 3개 + logo-sheet(여백 수용에 필요)→Task 2~4. 누락 없음.
- **Placeholder 스캔:** Task 1은 "decide"가 아니라 *기본값 투명 + 구체 폴백 규칙*을 가진 경험적 게이트(명령·판정규칙 명시). 나머지는 정확한 교체 문자열 포함. "TBD/적절히" 없음.
- **일관성:** 전 Task에서 `--autocrop` 제거·`--quality high`·`object-fit:contain` 용어 일치. 모델 `gpt-image-1.5` 일관. "축소 마크·favicon·단색 판정 = 스펙 B"로 일관 이연.
