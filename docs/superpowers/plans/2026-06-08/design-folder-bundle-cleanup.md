# `.design/` 번들 정리 (코드/참고 분리 + DESIGN.md·prototype 흡수) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08/design-folder-bundle-cleanup-design.md`

**Goal:** 디자인 스킬군의 `.design/` 레이아웃 규약을 "코드가 쓰는 것(assets/·루트 DESIGN.md) ↔ 비-코드 참고(reference/) ↔ 탐색(candidate/)"로 재정의하고, DESIGN.md·prototype을 번들 안으로 흡수한다.

**Architecture:** `.design/`는 저장소에 체크인되지 않는 다운스트림 작업 디렉터리라, 이 작업은 파일 이동이 아니라 **스킬 SKILL.md·reference 문서·에이전트·사용자 문서·스크립트 주석이 들고 있는 경로 문자열을 다시 쓰는 것**이다. 스크립트 로직은 경로를 CLI 인자로 받으므로 **코드 변경 없음** — 호출처(SKILL.md)와 문서·주석만 바뀐다. 따라서 TDD할 신규 로직이 없고, 검증은 **`npm test` 회귀 + 잔존 OLD 경로 grep 0건 + `npm run sync` 일관성**이다.

**Tech Stack:** Markdown(SKILL.md·references·agents·docs), Node `.mjs` 스크립트 주석, `npm test`(node:test), `npm run sync`(Codex 번들·codex-agents 생성), ripgrep(검증).

---

## 경로 치환 규칙 (전 과제 공통 참조)

각 과제는 아래 규칙의 부분집합을 **열거된 파일에만** 적용한다. 규칙은 경로 토큰 프리픽스 치환이며, 겹치는 프리픽스가 없어 순서 무관하다. **단, Task 4(DESIGN.md·prototype)는 prose 언급과 path 언급을 구분하는 판단이 필요하다 — 해당 과제 지침을 따른다.**

| # | OLD 토큰 | NEW 토큰 | 비고 |
|---|---|---|---|
| R1 | `assets/tokens.css` | `assets/css/tokens.css` | `../assets/tokens.css` 포함 |
| R2 | `assets/ui-kit/ui-kit.css` | `assets/css/ui-kit.css` | 죽은 `ui-kit/` 중첩 제거 |
| R3 | `assets/vendor/` | `assets/icon/vendor/` | 벤더 마크(색 보존) |
| R4 | `assets/brand-kit/` | `reference/brand-kit/` | `assets/brand-kit/icon/`(컨셉)도 프리픽스로 함께 이동 |
| R5 | `assets/page/` | `reference/page/` | 풀페이지 목업 PNG |
| R6 | `.design/BRAND_KIT.md` | `.design/reference/BRAND_KIT.md` | prefixed 형태만 |
| R7 | `.design/brand-tokens.json` | `.design/reference/brand-tokens.json` | prefixed 형태만 |
| R8 | `.design/manifest.json` | `.design/reference/manifest.json` | md-compiler 캡션/순서 메타(프로토타입 슬롯맵 `assets/manifest.json`과 별개 — **건드리지 않는다**) |
| R9 | `DESIGN.md`(=path 언급) | `.design/DESIGN.md` | **Task 4 판단 규칙** — prose 언급 제외 |
| R10 | `prototype/index.html`·`prototype.html`(=출력 path) | `.design/prototype/index.html`·`.design/prototype.html` | **Task 4 판단 규칙** |

**건드리지 않는 것:** `assets/icon/*.svg`(프로덕션 아이콘)·`assets/icon/icon-map.json`·`assets/logo/`·`assets/content/`·`assets/manifest.json`(프로토타입 슬롯맵)·`candidate/**`·prose의 "DESIGN.md"·"BRAND_KIT.md §N" 같은 문서/섹션 명칭 언급.

## 파일 인벤토리 (greps로 확인됨)

- **CSS(R1·R2)** — `agents/web-publisher.md`, `skills/design-brand-kit/SKILL.md`, `skills/design-logo/{SKILL.md,references/logo-sheet-html-direction.md}`, `skills/design-ui-kit/SKILL.md`, `skills/design-md-compiler/SKILL.md`, `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`, `skills/design-iconset/{SKILL.md,references/iconset-sheet.md}`, `skills/design-generate-code/SKILL.md`, `skills/design-component-export/SKILL.md`, `skills/design-brand-kit/scripts/tokens-to-css.mjs`(주석), `skills/design-iconset/scripts/build-iconset-sheet.mjs`(주석)
- **brand-kit/page/vendor(R3·R4·R5)** — `agents/{web-publisher,designer}.md`, `skills/design-html-prototype/SKILL.md`, `skills/design-brand-kit/{SKILL.md,references/brand-kit-image.md,references/brand-kit-html-direction.md}`, `skills/design-logo/{SKILL.md,references/logo-sheet-html-direction.md}`, `skills/design-ui-kit/SKILL.md`, `skills/design-md-compiler/SKILL.md`, `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`, `skills/design-iconset/SKILL.md`
- **루트 스펙·토큰·메타(R6·R7·R8)** — `agents/{web-publisher,designer}.md`, `skills/design-html-prototype/SKILL.md`, `skills/design-brand-kit/SKILL.md`, `skills/design-logo/SKILL.md`, `skills/design-ui-kit/SKILL.md`, `skills/design-md-compiler/SKILL.md`, `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`, `skills/design-iconset/SKILL.md`, `skills/design-generate-code/SKILL.md`, `skills/web-publisher-qa/SKILL.md`
- **DESIGN.md·prototype(R9·R10)** — `skills/design-md-compiler/SKILL.md`, `skills/design-html-prototype/SKILL.md`, `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`, `agents/{web-publisher,designer,front-developer}.md`
- **사용자 문서** — `README.md`, `docs/design/README.md`
- **스크립트 주석** — `scripts/lib/serve-design.mjs`(L7)

> 참고: `tests/skills/design-html-prototype/scripts/fetch-vendor-logo.test.mjs`는 import 경로에 `prototype/`가 들어 grep에 잡혔을 뿐 OLD 자산 경로를 단언하지 않는다 — **수정 불필요**. 현재 스캔상 OLD 경로를 하드코딩한 테스트는 없다(Task 6에서 재확인).

---

### Task 0: 베이스라인 확보

**Files:** (없음 — 측정만)

- [ ] **Step 1: 현재 테스트 통과 확인 (회귀 기준선)**

Run: `npm test`
Expected: PASS (전부 통과). 통과 수를 기록해 둔다.

- [ ] **Step 2: 마이그레이션 대상 OLD 경로 현황 스냅샷**

Run:
```
rg -n "assets/tokens\.css|assets/ui-kit/ui-kit\.css|assets/vendor/|assets/brand-kit/|assets/page/|\.design/BRAND_KIT\.md|\.design/brand-tokens\.json" skills agents scripts README.md docs/design
```
Expected: 다수 매치(이 매치들이 Task 1–5에서 0이 되어야 함). 출력은 참고용.

---

### Task 1: CSS 경로 이동 (R1·R2)

`assets/tokens.css` → `assets/css/tokens.css`, `assets/ui-kit/ui-kit.css` → `assets/css/ui-kit.css`. 인벤토리의 **CSS(R1·R2)** 파일 전부.

**Files (Modify):**
- `agents/web-publisher.md`
- `skills/design-brand-kit/SKILL.md`
- `skills/design-logo/SKILL.md`, `skills/design-logo/references/logo-sheet-html-direction.md`
- `skills/design-ui-kit/SKILL.md`
- `skills/design-md-compiler/SKILL.md`
- `skills/design-image-web/SKILL.md`
- `skills/design-image-mobile/SKILL.md`
- `skills/design-iconset/SKILL.md`, `skills/design-iconset/references/iconset-sheet.md`
- `skills/design-generate-code/SKILL.md`
- `skills/design-component-export/SKILL.md`
- `skills/design-brand-kit/scripts/tokens-to-css.mjs` (주석 L1)
- `skills/design-iconset/scripts/build-iconset-sheet.mjs` (주석 L6)

- [ ] **Step 1: 각 파일에서 R1·R2 치환**

각 파일에서 다음 문자열을 모두 치환한다(상대형 `../assets/tokens.css` 포함):
- `assets/tokens.css` → `assets/css/tokens.css`
- `assets/ui-kit/ui-kit.css` → `assets/css/ui-kit.css`

특히 확인할 지점:
- `skills/design-brand-kit/SKILL.md` — `tokens-to-css.mjs` 호출의 out 인자가 `assets/tokens.css` → `assets/css/tokens.css`로 바뀌어야 한다(lock 시 tokens.css 물질화 경로).
- `skills/design-iconset/references/iconset-sheet.md` — 시트가 거는 `<link rel="stylesheet" href="../assets/tokens.css">` → `../assets/css/tokens.css`.
- `skills/design-brand-kit/scripts/tokens-to-css.mjs` L1 주석 `→ assets/tokens.css` → `→ assets/css/tokens.css` (로직은 outPath를 인자로 받으므로 불변).
- `skills/design-iconset/scripts/build-iconset-sheet.mjs` L6 주석 `../assets/tokens.css` → `../assets/css/tokens.css`.

- [ ] **Step 2: 잔존 검증**

Run: `rg -n "assets/tokens\.css|assets/ui-kit/ui-kit\.css|assets/ui-kit\b" skills agents scripts README.md docs/design`
Expected: 매치 0건 (`assets/css/...` 와 `assets/ui-kit/ui-kit.css`가 모두 사라짐). 단 `docs/superpowers/`는 범위 밖이라 검색에서 제외했다.

- [ ] **Step 3: 회귀 확인**

Run: `npm test`
Expected: PASS (Task 0과 동일 — 로직 무변).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(design): tokens.css·ui-kit.css를 assets/css/로 이동 (R1·R2)"
```

---

### Task 2: 벤더 마크 이동 (R3)

`assets/vendor/` → `assets/icon/vendor/`. 색 보존 SVG라 프로덕션 아이콘셋 글로브(`assets/icon/*.svg`, 비재귀)에 잡히지 않는다(불변식 유지).

**Files (Modify):**
- `skills/design-html-prototype/SKILL.md` (자산 갭 해소 표 — `fetch-vendor-logo.mjs --out … assets/vendor/…`, `vendor/` 전용 폴더 언급)
- `agents/web-publisher.md` (자산 소비 경로에 `assets/vendor` 언급 있으면)
- 인벤토리의 brand-kit/page/vendor 그룹 중 `assets/vendor` 매치 파일 전부

- [ ] **Step 1: R3 치환**

각 파일에서 `assets/vendor/` → `assets/icon/vendor/` 치환. `--out <cwd>/.design/assets/vendor/<name>.svg` → `…/.design/assets/icon/vendor/<name>.svg`. "조달분은 `vendor/`·`content/` 전용 하위 폴더에만 쓴다" 류 산문도 `icon/vendor/`로 갱신.

> `fetch-vendor-logo.mjs`는 `--out`을 인자로 받으므로 스크립트 수정 불필요(호출 예시 경로만 갱신).

- [ ] **Step 2: 잔존 검증**

Run: `rg -n "assets/vendor/" skills agents scripts README.md docs/design`
Expected: 매치 0건.

- [ ] **Step 3: 회귀 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(design): 벤더 마크를 assets/icon/vendor/로 이동 (R3)"
```

---

### Task 3: reference/ 버킷 신설 — 비-코드 자료 이동 (R4·R5·R6·R7·R8)

브랜드 base·컨셉 아이콘·풀페이지 목업·BRAND_KIT.md·brand-tokens.json·컴파일 메타를 `reference/`로.

**Files (Modify):** 인벤토리의 **brand-kit/page/vendor(R4·R5)** + **루트 스펙·토큰·메타(R6·R7·R8)** 그룹 합집합:
- `agents/web-publisher.md`, `agents/designer.md`
- `skills/design-html-prototype/SKILL.md`
- `skills/design-brand-kit/SKILL.md`, `skills/design-brand-kit/references/brand-kit-image.md`, `skills/design-brand-kit/references/brand-kit-html-direction.md`
- `skills/design-logo/SKILL.md`, `skills/design-logo/references/logo-sheet-html-direction.md`
- `skills/design-ui-kit/SKILL.md`
- `skills/design-md-compiler/SKILL.md`
- `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`
- `skills/design-iconset/SKILL.md`
- `skills/design-generate-code/SKILL.md`, `skills/web-publisher-qa/SKILL.md`

- [ ] **Step 1: R4·R5 치환 (assets → reference)**

각 파일에서:
- `assets/brand-kit/` → `reference/brand-kit/` (상대형 `../assets/brand-kit/` 포함; `assets/brand-kit/icon/`도 프리픽스로 함께 이동)
- `assets/page/` → `reference/page/`

주의: `assets/icon/`(프로덕션)·`assets/logo/`·`assets/content/`는 **그대로 둔다**. `candidate/brand-kit/`·`candidate/page/`도 **그대로**(R4·R5는 `assets/` 프리픽스에만 적용).

- [ ] **Step 2: R6·R7·R8 치환 (루트 → reference)**

각 파일에서:
- `.design/BRAND_KIT.md` → `.design/reference/BRAND_KIT.md`
- `.design/brand-tokens.json` → `.design/reference/brand-tokens.json`
- `.design/manifest.json` → `.design/reference/manifest.json`

주의: prose의 `BRAND_KIT.md §10` 같은 **섹션·문서 명칭 언급은 바꾸지 않는다**(경로가 아님). `.design/` 프리픽스가 붙은 path 형태만 치환. `assets/manifest.json`(프로토타입 슬롯맵)은 **건드리지 않는다**.

- [ ] **Step 3: view/ 상대경로 의도 확인 (산문 기술 갱신)**

`design-brand-kit`·`design-logo`·`design-iconset`의 시트 산출 기술에서 "overview.html은 `../assets/brand-kit/`를 참조" 류 문장이 `../reference/brand-kit/`로, "목업은 `../assets/page/`" 류가 `../reference/page/`로 바뀌었는지 확인(Step 1에서 이미 처리됐으면 통과). overview.html의 patch 슬롯 경로(`../assets/logo/logo.png`·`../assets/icon/*.svg`)는 **불변**임을 확인.

- [ ] **Step 4: 잔존 검증**

Run:
```
rg -n "assets/brand-kit/|assets/page/|\.design/BRAND_KIT\.md|\.design/brand-tokens\.json|\.design/manifest\.json" skills agents README.md docs/design
```
Expected: 매치 0건. (`reference/...`·`assets/manifest.json` 만 남음)

- [ ] **Step 5: 회귀 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(design): 비-코드 자료를 reference/ 버킷으로 분리 (R4·R5·R6·R7·R8)"
```

---

### Task 4: DESIGN.md·prototype을 `.design/` 안으로 흡수 (R9·R10) + comp 읽기 경로 전환

**판단 규칙:** "DESIGN.md"/"prototype" 언급 중 **path로 쓰이는 것만** 바꾼다. *권위·문서 명칭*으로 쓰인 prose(예: "권위는 DESIGN.md다", "DESIGN.md §1")는 **그대로 둔다**.

**Files (Modify) + 바꿀 구체 지점:**

- `skills/design-md-compiler/SKILL.md`
  - 출력 기술 `DESIGN.md (대상 프로젝트 cwd 루트)` / `DESIGN.md(cwd 루트)` → `.design/DESIGN.md` (cwd 루트 표기 제거)
  - `# generated from .design/assets/tokens.css …` 류는 R1에서 이미 `assets/css/tokens.css`로 갱신됐는지 확인
- `skills/design-html-prototype/SKILL.md`
  - 입력 목록 `- DESIGN.md` (L18) → `- .design/DESIGN.md`
  - 본문 `DESIGN.md`·`.design/brand-tokens.json` 읽기 기술(L97 등)에서 DESIGN.md path → `.design/DESIGN.md`
  - **comp 읽기 경로(L22·L32 맥락)**: 확정 comp(풀페이지 목업)는 이제 `reference/page/`에 있으므로 `.design/assets/**`(comp) → `.design/reference/page/**`, 폴백은 `.design/candidate/page/**` 유지. 단 L32·L39의 "`.design/assets/`에 없는 필요 자산을 슬롯으로" / `--out …/.design/assets/content/…`는 **조달 자산(코드용) 경로라 그대로** — comp(reference) vs 조달(assets) 구분 유지
  - 출력 `prototype/index.html`(L26·L100)·`prototype.html` → `.design/prototype/index.html`·`.design/prototype.html`
- `skills/design-image-web/SKILL.md`, `skills/design-image-mobile/SKILL.md`
  - `DESIGN.md(cwd 루트)` / `**DESIGN.md**(cwd 루트)` (예: image-mobile L18·L149) → `.design/DESIGN.md`
  - Phase 0 부재 폴백 기술의 `DESIGN.md` path 언급 → `.design/DESIGN.md` (단 "DESIGN.md만 없음" 같은 prose는 의미 보존하며 path 부분만)
  - 풀페이지/화면 목업 lock 경로가 `assets/page/`였다면 R5에서 `reference/page/`로 갱신됐는지 확인
- `agents/web-publisher.md`
  - 입력 목록 L12 `- DESIGN.md, .design/brand-tokens.json, .design/assets/tokens.css` → `- .design/DESIGN.md, .design/reference/brand-tokens.json, .design/assets/css/tokens.css` (R1·R7과 합치)
  - 나머지 "권위는 DESIGN.md다" 류 prose는 **불변**
- `agents/designer.md`, `agents/front-developer.md`
  - "`DESIGN.md`로 컴파일", "`DESIGN.md`를 시드로" 류는 **문서 명칭 prose라 불변**. path로 쓰인 곳이 없으면 변경 없음(확인만).

- [ ] **Step 1: 위 지점들을 파일별로 정밀 편집**

각 파일을 열어 위 "바꿀 구체 지점"만 편집한다. prose 명칭 언급은 건드리지 않는다.

- [ ] **Step 2: comp 읽기 경로 전환 확인**

`skills/design-html-prototype/SKILL.md`에서 comp(확정 풀페이지 목업) 읽기 글로브가 `reference/page/`(폴백 `candidate/page/`)를 가리키고, 조달 자산 쓰기는 여전히 `assets/icon/vendor/`·`assets/content/`임을 Read로 확인.

- [ ] **Step 3: path 잔존 검증**

Run: `rg -n "cwd 루트|\(cwd 루트\)|\bprototype/index\.html|\bprototype\.html" skills agents`
Expected: `prototype/...` 가 전부 `.design/prototype/...`로 바뀌어 bare `prototype/index.html` 매치 0건; `cwd 루트` 표기 잔존 0건.

Run: `rg -n "^\s*-\s*DESIGN\.md\s*$|DESIGN\.md\s*\(cwd" skills agents`
Expected: 매치 0건 (입력 목록·출력 표기의 path형 DESIGN.md가 `.design/DESIGN.md`로 전환됨).

- [ ] **Step 4: 회귀 확인**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(design): DESIGN.md·prototype을 .design/ 안으로 흡수, comp 읽기를 reference/page/로 (R9·R10)"
```

---

### Task 5: 사용자 문서 갱신 (README.md · docs/design/README.md)

산출물 레이아웃 트리·파이프라인 표·심화 흐름의 경로를 새 모델로.

**Files (Modify):**
- `docs/design/README.md` — "산출물 레이아웃" 코드블록(현재 `assets/ tokens.css(공유 토큰)·brand-kit/·logo/·icon/·ui-kit/·page/` / `candidate/`), 파이프라인 표의 주요 산출물 칸, 심화 §흐름 lock 기술
- `README.md` — `.design`·`DESIGN.md`·`prototype/` 언급 절

- [ ] **Step 1: docs/design/README.md 레이아웃 블록 교체**

"산출물 레이아웃" 코드블록을 스펙 §3 타깃 트리와 일치시킨다:
```
.design/
  index.html · DESIGN.md           # 엔트리 + 스펙
  view/    overview.html · logos.html · iconset-sheet.html · ui-kit.html · directions.html
  assets/  css/{tokens.css,ui-kit.css} · icon/{*.svg,icon-map.json,vendor/*.svg} · logo/ · content/ · manifest.json   # 코드 import 전용
  prototype/ index.html            # 참고 구현
  reference/ BRAND_KIT.md · brand-tokens.json · manifest.json · brand-kit/ · page/   # 비-코드 자료
  candidate/ logo/ · icon/ · brand-kit/ · page/ · ui-kit/                            # 탐색
```
그리고 "`overview.html`은 `view/`에서 `../reference/brand-kit/`를 상대경로로 참조한다"로 문장 갱신.

- [ ] **Step 2: 파이프라인 표·심화 흐름 경로 갱신**

표의 "주요 산출물" 칸에서 `assets/tokens.css`→`assets/css/tokens.css`, `assets/ui-kit/ui-kit.css`→`assets/css/ui-kit.css`, base 자산 `assets/brand-kit/`→`reference/brand-kit/`, DESIGN.md "(cwd 루트)"→"(.design/ 루트)". 심화 §"산출물 레이아웃"·§lock 기술도 동일하게.

- [ ] **Step 3: README.md 갱신**

루트 README의 디자인 절에서 `.design/` 레이아웃·DESIGN.md·prototype 위치 언급을 새 모델로 갱신.

- [ ] **Step 4: 잔존 검증**

Run:
```
rg -n "assets/tokens\.css|assets/ui-kit/ui-kit\.css|assets/vendor/|assets/brand-kit/|assets/page/|cwd 루트" README.md docs/design
```
Expected: 매치 0건.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "docs(design): README·docs/design을 새 .design/ 레이아웃으로 갱신"
```

---

### Task 6: 스크립트 주석 + 전역 검증 + sync

**Files (Modify):**
- `scripts/lib/serve-design.mjs` (L7 주석 — `../assets/·../candidate/` 예시에 `../reference/` 추가, 의미 보존)

- [ ] **Step 1: serve-design.mjs 주석 갱신**

L7 주석을 `../assets/·../reference/·../candidate/ 상대경로로 동작하고, 루트 index.html이 /view/overview.html로 리다이렉트.`로 갱신. (로직은 root 디렉터리를 인자로 받으므로 불변.)

- [ ] **Step 2: 전역 OLD 경로 스윕 (기록물 제외)**

Run:
```
rg -n "assets/tokens\.css|assets/ui-kit/ui-kit\.css|assets/vendor/|assets/brand-kit/|assets/page/|\.design/BRAND_KIT\.md|\.design/brand-tokens\.json|\.design/manifest\.json|cwd 루트|\bprototype/index\.html" skills agents scripts README.md docs/design
```
Expected: 매치 0건. (남으면 해당 파일로 돌아가 치환)

- [ ] **Step 3: 테스트가 OLD 경로를 하드코딩하지 않는지 확인**

Run: `rg -n "assets/tokens\.css|assets/vendor/|assets/brand-kit/|assets/page/|\.design/BRAND_KIT\.md" tests`
Expected: 매치 0건. (있으면 그 테스트의 기대 경로를 NEW로 갱신하고 `npm test` 재실행.)

- [ ] **Step 4: Codex 번들·codex-agents 재생성**

Run: `npm run sync`
Expected: 성공 종료(check-secrets 통과). 생성물(`plugins/personal/`·`codex-agents/`)은 gitignore라 커밋 안 함 — 소스만 커밋됨을 `git status`로 확인.

- [ ] **Step 5: 최종 회귀**

Run: `npm test`
Expected: PASS (Task 0 기준선과 동일 수).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore(design): serve-design 주석 갱신 + sync, OLD 경로 스윕 0건 확인"
```

---

## Self-Review (작성자 점검 완료)

- **스펙 커버리지:** §2 목표 5개 → Task 4(번들 자체완결화·DESIGN.md 단일)·Task 3(코드/참고 2분할)·Task 1(CSS 정리)·Task 2(벤더 마크)·Task 4(comp 경로). §4 매핑표 11행 → R1–R10 + view 상대경로(Task 3 Step 3). §6 마이그레이션 범위(스킬·스크립트·에이전트·문서·테스트·sync) → Task 1–6. §10 검증(npm test·sync·grep 스윕) → Task 0·6.
- **플레이스홀더:** 각 Step에 실제 치환 규칙·구체 파일·정확한 grep 명령·기대 출력 명시. "적절히 처리" 류 없음.
- **타입/이름 일관성:** R1–R10 토큰이 전 과제에서 동일하게 참조됨. "comp는 reference/에서 읽고 조달은 assets/에 쓴다" 구분이 Task 4와 스펙 §5에서 일치.
- **알려진 비-TDD 성격:** 신규 로직이 없어 실패 테스트→구현 사이클 대신 grep-0건 + npm test 회귀로 검증(Architecture에 명시).
