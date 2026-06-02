# `.design/` 폴더 구조 재구성 + overview 확정자산 누적 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 디자인 스킬군이 쓰는 `.design/` 레이아웃을 2축 모델(`view/`·`assets/`·`candidate/`+루트)로 재정의하고, design-logo·design-iconset이 확정 시 overview.html에 결과를 누적하도록 스킬·문서·에이전트·README를 다시 쓴다.

**Architecture:** 이 저장소엔 `.design/`이 없다 — 다운스트림 프로젝트의 작업 디렉터리 규약이다. 따라서 작업은 **경로 문자열을 들고 있는 마크다운/에이전트/README 재작성**이며, 공유 스크립트(`serve-design.mjs`·`build-iconset-sheet.mjs`)는 경로를 인자로 받으므로 기능 변경 없이 **주석 예시만** 고친다. 각 태스크는 한 스킬/문서를 일관되게 바꾸고, ripgrep으로 OLD 경로 잔존을 검증한 뒤 커밋한다. 마지막에 `npm run sync`로 Codex 번들을 재생성하고 `npm test`로 회귀를 확인한다.

**Tech Stack:** Markdown(SKILL.md·references·README), Node ESM 스크립트(주석만), ripgrep(검증), `npm run sync`/`npm test`.

---

## 권위 레퍼런스 — 타깃 레이아웃 (모든 태스크가 참조)

```
.design/
  BRAND_KIT.md  brand-tokens.json  DESIGN.md  manifest.json   # 데이터·스펙 (루트)
  index.html                       # → view/overview.html 리다이렉트 (서버 첫화면)

  view/                            # 브라우저로 여는 모든 HTML (같은 깊이)
    overview.html                  #   patch-on-lock으로 확정 로고/아이콘 누적
    logos.html  iconset-sheet.html  directions.html
    # 모든 <img>·링크는 ../assets/.. · ../candidate/.. (깊이 동일)

  assets/                          # 확정 deliverable (페이지 코드 import)
    brand-kit/  logo-base.png · wordmark-base.png · key-visual.png · ui-base.png · icon/<n>.png
    logo/       logo.png
    icon/       <n>.svg
    page/       section-*.png
  candidate/                       # raw 탐색 데이터 (비-HTML)
    logo/       concepts/round-N/*.png · seed.png · seed-user.png
    icon/       wip <n>.svg
    brand-kit/  brief.md · directions.json
    page/       page-briefs.md · generated *.png
```

### 핵심 OLD → NEW 매핑 (스펙 §4 요약)

| OLD | NEW |
|---|---|
| `final/brand-kit/BRAND_KIT.md` | `BRAND_KIT.md` (루트) |
| `final/brand-kit/brand-tokens.json` | `brand-tokens.json` (루트) |
| `final/brand-kit/overview.html` · 작업 `brand-kit/overview.html` | `view/overview.html` |
| `final/brand-kit/assets/{logo-base,wordmark-base,key-visual,ui-base}.png` · 작업 `brand-kit/assets/...` | `assets/brand-kit/...` |
| `final/brand-kit/assets/icons/<n>.png` · 작업 `brand-kit/assets/icons/` | `assets/brand-kit/icon/<n>.png` |
| `final/logo/assets/logo.png` | `assets/logo/logo.png` |
| 작업 `.design/logo/logos.html` | `view/logos.html` |
| 작업 `.design/logo/assets/{concepts,seed*}` | `candidate/logo/{concepts,seed*}` |
| `final/icon/<n>.svg` · 작업 `.design/icon/<n>.svg` | 확정 `assets/icon/<n>.svg` · 작업 `candidate/icon/<n>.svg` |
| 작업 `.design/icon/iconset-sheet.html` | `view/iconset-sheet.html` |
| `final/page/section-*.png` | `assets/page/section-*.png` |
| `.design/image-briefs/brand-briefs.md` | `candidate/brand-kit/brand-briefs.md` |
| `.design/image-briefs/page-briefs.md` | `candidate/page/page-briefs.md` |
| `.design/generated/page/*.png` | `candidate/page/*.png` |
| 작업 `.design/brand-kit/directions.{json,html}` | `candidate/brand-kit/directions.json` · `view/directions.html` |
| 라이브서버 타깃 `<cwd>/.design/<skill>` | `<cwd>/.design` (루트) |

### 라이브서버 규약 (모든 스킬 공통)

- 호출: `node ../../scripts/lib/serve-design.mjs <cwd>/.design` (루트를 served root로).
- 자동 오픈은 `/`(→ `index.html` 리다이렉트 → `/view/overview.html`). 다른 시트는 직접 URL로: `http://localhost:5500/view/logos.html`, `.../view/iconset-sheet.html`, `.../view/directions.html`.
- `index.html`이 없는 standalone(brand-kit 미실행)일 땐 자동 오픈이 `/` 디렉터리 리스팅이므로, 해당 시트 직접 URL을 사용자에게 안내한다.

### overview 마커 슬롯 계약 (Task 1·2·3 공유)

- brand-kit이 `view/overview.html` 저작 시 두 슬롯을 심는다:
  - §6 Logo Direction 안: `<!-- design-logo:slot -->` … `<!-- /design-logo:slot -->` (초기: "확정 로고 대기" 플레이스홀더)
  - §11 Imagery/Iconography 안(컨셉 아이콘 다음): `<!-- design-iconset:slot -->` … `<!-- /design-iconset:slot -->` (초기: "확정 아이콘셋 대기" 플레이스홀더)
- design-logo lock: 슬롯 사이를 `<img src="../assets/logo/logo.png" alt="확정 로고" style="height:64px">`로 외과 치환(멱등). 마커 없으면 §6 끝에 삽입.
- design-iconset lock: 슬롯 사이를 `assets/icon/*.svg` 인라인 그리드(currentColor, 토큰색 배경)로 외과 치환(멱등). 마커 없으면 §11 끝에 삽입.

---

## Task 1: design-brand-kit (앵커 스킬)

레이아웃·view/ 저작·candidate 분리·assets/brand-kit/·마커 슬롯·lock 의미·라이브서버 루트·index.html을 모두 도입한다.

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`
- Modify: `skills/design-brand-kit/references/brand-kit-html-direction.md`
- Modify: `skills/design-brand-kit/references/brand-kit-contact-sheet.md`

- [ ] **Step 1: SKILL.md frontmatter description 갱신**

`description:` 안의 다운스트림 시드 문구를 바꾼다:
- OLD: `다운스트림(design-logo·iconset·page-image)은 보드 재추출 없이 assets/를 직접 시드로 읽는다.`
- NEW: `다운스트림(design-logo·iconset·page-image)은 보드 재추출 없이 assets/brand-kit/를 직접 시드로 읽는다.`

- [ ] **Step 2: SKILL.md "출력 파일" 블록(현재 라인 59–81) 전체 교체**

OLD 코드펜스(`.design/ brand-kit/ … final/ brand-kit/ …`)와 그 아래 "레이아웃 규칙" 불릿을 아래로 교체:

````md
## 출력 파일 (대상 프로젝트 cwd 기준, v3 2축 레이아웃)

```
.design/
  BRAND_KIT.md         # 확정 스펙 (루트) = 작업 SSOT
  brand-tokens.json    # 확정 토큰 (루트)
  index.html           # → view/overview.html 리다이렉트
  view/
    overview.html      # 제자리 저작 — 자산은 ../assets/brand-kit/ 상대경로 <img>
    directions.html    # 분위기 열림일 때만 — 3열 컨택트 시트 (= 발산 게이트)
  assets/
    brand-kit/  logo-base.png · wordmark-base.png · key-visual.png · ui-base.png · icon/<name>.png
  candidate/
    brand-kit/  brief.md · directions.json · brand-briefs.md   # 탐색 데이터
```

**레이아웃 규칙**:
- `overview.html`은 `view/`에서 **제자리 저작**한다. 모든 `<img>`는 `../assets/brand-kit/...`(예: `../assets/brand-kit/key-visual.png`, `../assets/brand-kit/icon/x.png`) 상대경로 — 확정 후 위치 이동이 없어 경로 재작성이 필요 없다.
- **확정 = 캐노니컬 홈에 이미 있음**: BRAND_KIT.md·brand-tokens.json(루트) · overview.html(view/) · base 자산(assets/brand-kit/)을 처음부터 그 위치에 쓴다. lock은 "승인" 의미이며 별도 복사 단계가 없다.
- `--auto-version`은 `assets/brand-kit/` 안에서 누적(예: `assets/brand-kit/logo-base.png` → `-v2`). 롤백은 git.
- **분위기 고정** → 곧바로 캐노니컬 홈에 작업(컨택트 시트 없음). **분위기 열림** → `candidate/brand-kit/directions.json` → `view/directions.html` 컨택트 시트 게이트 → 고른 방향만 캐노니컬 홈에 전개.
- `index.html`은 루트에 두는 한 줄 리다이렉트(아래 "라이브 프리뷰" 참조).

**로고/UI/아이콘은 base 자산으로 생산**하며, 풀 산출물(로고·풀 아이콘셋·페이지)은 다운스트림 몫이다.
````

- [ ] **Step 3: SKILL.md 이미지 생성 예시 경로 교체 (라인 264–281 부근)**

`--out`·`--image` 경로의 `.design/brand-kit/assets/` → `.design/assets/brand-kit/`로 4곳 교체:
- `<cwd>/.design/brand-kit/assets/key-visual.png` → `<cwd>/.design/assets/brand-kit/key-visual.png` (2곳: key-visual 예시 `--out`, 로고/ui 예시 `--image` 앵커)
- `<cwd>/.design/brand-kit/assets/logo-base.png` → `<cwd>/.design/assets/brand-kit/logo-base.png`
- `<cwd>/.design/brand-kit/assets/ui-base.png` → `<cwd>/.design/assets/brand-kit/ui-base.png`

투명 라우팅 불릿(라인 253)의 `icons/<name>.png` 산출 경로 언급도 `assets/brand-kit/icon/<name>.png` 의미로 읽히게: 라인 258 "락된 자산만 `final/brand-kit/assets/`로 복사"를 `확정 자산은 `assets/brand-kit/`에 제자리(별도 복사 없음)`로 교체.

- [ ] **Step 4: SKILL.md "overview.html 저작"(라인 284–286) 갱신 + 마커 슬롯**

해당 문단을 아래로 교체:

````md
### overview.html 저작 (이미지 아님)

`overview.html`은 생성기로 만들지 않는다 — `references/brand-kit-html-direction.md`의 레이아웃 규칙을 가드레일로 **LLM이 `view/overview.html`에 제자리 저작**한다: 자산은 `<img src="../assets/brand-kit/...">`(상대경로), 데이터는 `BRAND_KIT.md`/tokens에서 렌더, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`, §1 워드마크는 `../assets/brand-kit/wordmark-base.png`를 `<img>`로. 콘텐츠를 지어내지 않는다(변주는 레이아웃만). 저작 전 `candidate/brand-kit/brief.md`의 레이아웃 메모에서 **고른 아키타입**을 확인하고 해당 `references/archetypes/<name>.md`를 따른다.

**다운스트림 누적용 마커 슬롯 (필수):** 저작 시 두 곳에 멱등 외과편집용 HTML 주석 슬롯을 심는다 —
- §6 Logo Direction 안: `<!-- design-logo:slot --><p class="muted">확정 로고 대기 (design-logo)</p><!-- /design-logo:slot -->`
- §11 Imagery/Iconography 안(컨셉 아이콘 다음): `<!-- design-iconset:slot --><p class="muted">확정 아이콘셋 대기 (design-iconset)</p><!-- /design-iconset:slot -->`

design-logo·design-iconset이 lock 때 이 슬롯 사이를 확정 자산으로 치환한다.
````

- [ ] **Step 5: SKILL.md "라이브 프리뷰"(라인 288–297) 갱신 + index.html**

라이브 서버 명령과 안내를 아래로 교체:

````md
### 라이브 프리뷰 (자동 새로고침)

`overview.html`을 **처음 피드백용으로 제시할 때**, 먼저 루트 `index.html`(리다이렉트)을 쓰고 공유 런처로 **루트=`.design/`** 라이브 서버를 **한 번 백그라운드로** 띄운다.

루트 `index.html` 내용(한 줄 리다이렉트):

```html
<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=view/overview.html"><title>.design</title><a href="view/overview.html">overview</a>
```

```
node ../../scripts/lib/serve-design.mjs <cwd>/.design
```

- 자동 오픈은 `/` → `index.html` → `/view/overview.html`. 이후 자산 재생성·HTML 외과 편집 때마다 자동 새로고침.
- 명령 실행이므로 **최초 1회만 사용자 확인** 후 백그라운드 기동(이후 같은 서버 유지).
- lock 후 또는 세션 종료 시 서버를 종료한다(포트 점유 방지).
````

- [ ] **Step 6: SKILL.md "흐름" 단계 경로·lock 갱신 (라인 301–308)**

- 흐름 1(라인 301): `.design/brand-kit/`에 … 직행 → `루트(BRAND_KIT.md·brand-tokens.json)`에, `directions.json`(3방향) → `candidate/brand-kit/directions.json`.
- 흐름 2(라인 302): `.design/brand-kit/brief.md` → `candidate/brand-kit/brief.md`.
- 흐름 3(라인 303): `build-contact-sheet.mjs`로 `directions.html` → `view/directions.html`; data-only `overview.html` → `view/overview.html`.
- 흐름 4(라인 304): "고른 열의 방향을 `.design/brand-kit/`에 풀 …" → "고른 열의 방향을 캐노니컬 홈(루트 BRAND_KIT.md·brand-tokens.json · `view/overview.html`)에 인스턴스화".
- 흐름 5(라인 305): `.design/brand-kit/assets/` → `assets/brand-kit/`; `icons/*` → `icon/*`.
- 흐름 6(라인 306): 이미지 슬롯을 `../assets/brand-kit/...`로 채워 `view/overview.html` 마무리.
- 흐름 8 lock(라인 308) 전체 교체:

````md
8. **lock (승인)** — 산출물이 이미 캐노니컬 홈에 있다(루트 `BRAND_KIT.md`·`brand-tokens.json` · `view/overview.html` · `assets/brand-kit/`). 별도 복사가 없으므로 lock은 "확정 승인"이다. 탐색물(`candidate/brand-kit/brief.md`·`directions.json`·`brand-briefs.md`)은 그대로 보존. 확정되면 산출 경로를 제시하고 안내: **"다음 단계: `design-logo` → `design-iconset` → `design-page-image`"** (각자 `assets/brand-kit/`를 시드로 읽음). 라이브 프리뷰 서버가 떠 있으면 종료한다.
````

- [ ] **Step 7: brand-kit-image.md "산출물"(라인 7–22) 경로 교체**

- 라인 10: `작업 자산: .design/brand-kit/assets/(작업 SSOT).` → `자산: .design/assets/brand-kit/(확정 캐노니컬 홈 — 제자리 작업).`
- 라인 11: `lock 자산: .design/final/brand-kit/assets/(최종 확정 복사본).` 삭제(별도 lock 복사 없음).
- 라인 16: `icons/<name>.png — 오버뷰가 쓰는 개별 아이콘.` → `icon/<name>.png — 오버뷰가 쓰는 개별 컨셉 아이콘(assets/brand-kit/icon/).`
- 라인 18: `작업: .design/brand-kit/overview.html(작업 SSOT...).` → `저작 위치: .design/view/overview.html(제자리, ../assets/brand-kit/ 참조).`
- 라인 19: `lock: .design/final/brand-kit/overview.html.` 삭제.
- 라인 20: `→ .design/brand-kit/assets/(확정 작업 영역).` → `→ .design/assets/brand-kit/.`

- [ ] **Step 8: brand-kit-image.md "11. 우리 파이프라인"(라인 170–173) 경로 교체**

- 라인 171: `이미지를 <cwd>/.design/brand-kit/assets/에 --auto-version` → `<cwd>/.design/assets/brand-kit/에 --auto-version`.
- 라인 172 전체 교체: `- **락**: 확정 자산은 .design/assets/brand-kit/에 제자리(logo-base.png·wordmark-base.png·key-visual.png·ui-base.png·icon/<name>.png) — 별도 복사 없음, --auto-version으로 시안 누적.`
- 라인 173 교체: `- **오버뷰**: overview.html을 .design/view/overview.html에 LLM이 제자리 저작(이미지 생성 아님).`

- [ ] **Step 9: brand-kit-html-direction.md 경로·매핑·마커 갱신**

- 라인 6: `자산은 형제 assets/... <img> — .design/brand-kit/든 .design/final/brand-kit/든 동일 HTML이 동작.` → `자산은 ../assets/brand-kit/... <img>(view/에서 제자리 저작).`
- §섹션→자산 매핑(라인 21–27)의 모든 자산 파일명을 `../assets/brand-kit/` 접두로: `key-visual.png`→`../assets/brand-kit/key-visual.png`, `wordmark-base.png`→`../assets/brand-kit/wordmark-base.png`, `logo-base.png`→`../assets/brand-kit/logo-base.png`, `ui-base.png`→`../assets/brand-kit/ui-base.png`, `icons/*.png`→`../assets/brand-kit/icon/*.png`.
- 라인 22(§6) 끝에 추가: ` 이 §6 안에 \`<!-- design-logo:slot -->…<!-- /design-logo:slot -->\` 마커 슬롯을 넣어 design-logo가 확정 로고를 주입할 자리를 만든다.`
- 라인 26(§11) 끝에 추가: ` 컨셉 아이콘 다음에 \`<!-- design-iconset:slot -->…<!-- /design-iconset:slot -->\` 마커 슬롯을 넣어 design-iconset이 확정 SVG 세트를 주입할 자리를 만든다.`

- [ ] **Step 10: brand-kit-contact-sheet.md 경로 갱신**

- §생성 명령(라인 150–154): `--in "<cwd>/.design/brand-kit/directions.json"` → `--in "<cwd>/.design/candidate/brand-kit/directions.json"`; `--out "<cwd>/.design/brand-kit/directions.html"` → `--out "<cwd>/.design/view/directions.html"`.
- §게이트 사용(라인 173–177): `directions.json 작성` 위치 `candidate/brand-kit/`, `directions.html` 위치 `view/`, 라인 176 `선택된 방향만 .design/brand-kit/에 풀 킷으로 전개` → `…캐노니컬 홈(루트 BRAND_KIT.md·brand-tokens.json·view/overview.html)에 전개`.
- 라인 158 `--out : 출력 directions.html 절대경로 (디렉터리는 미리 존재해야 함)` 유지하되 디렉터리 = `view/` 임을 명시.

- [ ] **Step 11: OLD 경로 잔존 검증**

Run: `rg -n "final/brand-kit|\.design/brand-kit/|/assets/icons/|image-briefs" skills/design-brand-kit`
Expected: 매칭 없음(0 결과). 남으면 해당 라인을 매핑대로 마저 고친다.

- [ ] **Step 12: Commit**

```bash
git add skills/design-brand-kit
git commit -m "refactor(design-brand-kit): .design 2축 레이아웃(view·assets·candidate)로 재구성 + overview 마커 슬롯·index.html"
```

---

## Task 2: design-logo

입력 시드 `assets/brand-kit/`, 작업 `candidate/logo/`, 시트 `view/logos.html`, 확정 `assets/logo/logo.png`, lock 때 overview §6 슬롯 patch.

**Files:**
- Modify: `skills/design-logo/SKILL.md`
- Modify: `skills/design-logo/references/logo-sheet-html-direction.md`

- [ ] **Step 1: SKILL.md frontmatter + 전제/입력 경로**

- description(라인 3): `assets/logo-base.png(투명)를 시드로` 유지, 끝의 `.design/final/logo/assets/에 확정` → `assets/logo/에 확정`.
- 전제(라인 16): `.design/final/brand-kit/assets/logo-base.png·BRAND_KIT.md·brand-tokens.json` → `.design/assets/brand-kit/logo-base.png · .design/BRAND_KIT.md · .design/brand-tokens.json`.
- 입력 파일(라인 22–24): `.design/final/brand-kit/assets/logo-base.png` → `.design/assets/brand-kit/logo-base.png`; `.design/final/brand-kit/BRAND_KIT.md` → `.design/BRAND_KIT.md`; `.design/final/brand-kit/brand-tokens.json` → `.design/brand-tokens.json`.

- [ ] **Step 2: SKILL.md "출력 파일" 블록(라인 30–45) 교체**

````md
## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  view/
    logos.html                       # 현재 라운드 시트 (교체, ../candidate/logo/ 상대경로 <img>)
  candidate/
    logo/
      logo-briefs.md                 # 시드 출처·발산 모드·라운드 로그·확정 컨셉
      seed.png                       # logo-base 복사/참조 (모드 A·C 앵커)
      seed-user.png                  # (선택) 사용자 첨부 이미지
      concepts/round-N/01..04.png    # 라운드별 개별 투명 PNG (--auto-version)
      logo-candidate.png (+v2…)      # 고른 #N 단독 다듬기
  assets/
    logo/  logo.png                  # 확정 (단일 로고)
```

- `logos.html`(view/)의 모든 `<img>`는 `../candidate/logo/concepts/round-N/01.png`·`../candidate/logo/seed.png` 상대경로.
- 탐색 시트·시안은 `candidate/logo/`에 `--auto-version`으로 누적. 확정 단일 로고만 `assets/logo/logo.png`로 승격하고, **lock 때 `view/overview.html` §6 슬롯에 주입한다**(아래 흐름 10).
````

- [ ] **Step 3: SKILL.md 이미지 생성 예시 + 라이브 프리뷰 경로 교체**

- 이미지 예시(라인 61·68·69): `<cwd>/.design/logo/assets/concepts/round-1/01.png` → `<cwd>/.design/candidate/logo/concepts/round-1/01.png`; `<cwd>/.design/logo/assets/seed.png` → `<cwd>/.design/candidate/logo/seed.png`; round-2 동일.
- logos.html 저작(라인 75): `자산은 <img>(상대경로)` → `자산은 <img>(../candidate/logo/ 상대경로)`, `BRAND_KIT.md`/`brand-tokens.json`은 루트 경로.
- 라이브 프리뷰(라인 82): `node ../../scripts/lib/serve-design.mjs <cwd>/.design/logo` → `node ../../scripts/lib/serve-design.mjs <cwd>/.design` (+ "시트 직접 URL: `http://localhost:5500/view/logos.html`" 한 줄 추가).

- [ ] **Step 4: SKILL.md 흐름 Phase 0·1·2 경로 교체**

- Phase 0(라인 91·92): `.design/final/brand-kit/BRAND_KIT.md`·`logo-base.png` → `.design/BRAND_KIT.md`·`.design/assets/brand-kit/logo-base.png`; `.design/logo/assets/seed-user.png` → `.design/candidate/logo/seed-user.png`.
- Phase 1(라인 102·103·105): `assets/logo-base.png` → `assets/brand-kit/logo-base.png`; `.design/logo/assets/seed.png` → `.design/candidate/logo/seed.png`; `logo-briefs.md` → `candidate/logo/logo-briefs.md`.
- Phase 2 단독/다듬기(라인 113·116·117·118): `assets/concepts/round-N/...` → `candidate/logo/concepts/round-N/...`; `assets/logo-candidate.png` → `candidate/logo/logo-candidate.png`.

- [ ] **Step 5: SKILL.md 흐름 10(확정) 교체 — assets/logo + overview §6 patch**

라인 119–120 교체:

````md
10. **확정(승격 + overview 주입)**: 확정본을 `.design/assets/logo/logo.png`로 복사. 시안은 `candidate/logo/`에 보존. 이어 `view/overview.html`의 `<!-- design-logo:slot -->…<!-- /design-logo:slot -->` 사이를 `<img src="../assets/logo/logo.png" alt="확정 로고" style="height:64px">`로 **외과 치환**한다(멱등 — 재실행 안전; 마커가 없으면 §6 Logo Direction 끝에 삽입). 라이브 서버가 떠 있으면 자동 새로고침된다. `candidate/logo/logo-briefs.md`에 확정 컨셉을 기록.
11. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-iconset`"**. 라이브 프리뷰 서버가 떠 있으면 종료한다.
````

- [ ] **Step 6: logo-sheet-html-direction.md 경로 교체**

- 라인 11: `시트는 .design/logo/logos.html에 두고, 모든 <img>는 형제 assets/ 상대경로(assets/concepts/round-N/01.png·assets/seed.png) — .design/logo/든 복사본이든` → `시트는 .design/view/logos.html에 두고, 모든 <img>는 ../candidate/logo/ 상대경로(../candidate/logo/concepts/round-N/01.png·../candidate/logo/seed.png)`.
- 라인 46: `이전 PNG는 assets/concepts/round-N/에 --auto-version으로 남는다.` → `…candidate/logo/concepts/round-N/에 …`.
- 라인 50: `그 PNG를 logo-candidate.png로 승격` 위치를 `candidate/logo/logo-candidate.png`로 명시.

- [ ] **Step 7: OLD 경로 잔존 검증**

Run: `rg -n "final/logo|final/brand-kit|\.design/logo/|assets/logo-base" skills/design-logo`
Expected: 매칭 없음. (단 `assets/brand-kit/logo-base.png`는 OK — 정규식이 `assets/logo-base`만 잡도록 확인.)

- [ ] **Step 8: Commit**

```bash
git add skills/design-logo
git commit -m "refactor(design-logo): 입력 assets/brand-kit·작업 candidate/logo·확정 assets/logo + lock 때 overview §6 patch"
```

---

## Task 3: design-iconset

입력 루트 스펙/토큰, 작업 `candidate/icon/`, 시트 `view/iconset-sheet.html`, 확정 `assets/icon/`, lock 때 overview §11 슬롯 patch. 스크립트 주석도 갱신.

**Files:**
- Modify: `skills/design-iconset/SKILL.md`
- Modify: `skills/design-iconset/references/iconset-sheet.md`
- Modify: `skills/design-iconset/scripts/build-iconset-sheet.mjs` (주석만)

- [ ] **Step 1: SKILL.md frontmatter + 전제/입력 경로**

- description(라인 3): `개별 .svg를 .design/icon/에 저작` → `…candidate/icon/에 저작`; `확정 세트를 .design/final/icon/으로 lock` → `확정 세트를 .design/assets/icon/으로 lock`.
- 전제(라인 20): `.design/final/brand-kit/BRAND_KIT.md·.design/final/brand-kit/brand-tokens.json` → `.design/BRAND_KIT.md·.design/brand-tokens.json`.
- 입력(라인 27·28): `.design/final/brand-kit/BRAND_KIT.md` → `.design/BRAND_KIT.md`; `.design/final/brand-kit/brand-tokens.json` → `.design/brand-tokens.json`. 라인 29 `brand-kit assets/icons/*` → `assets/brand-kit/icon/*`(읽지 않음 명시 유지).

- [ ] **Step 2: SKILL.md "출력 파일" 블록(라인 33–45) 교체**

````md
## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  candidate/icon/             # 작업본 (저작·편집 루프)
    <name>.svg                # 제품 deliverable 초안 (currentColor, viewBox 0 0 24 24)
    iconset-briefs.md         # 읽은 md 근거·확정 목록·메타포 매핑·가족 계약·제약
  view/
    iconset-sheet.html        # 검수 시트(candidate/icon에서 결정적 렌더, SVG 인라인 임베드)
  assets/icon/                # 확정 — 순수 복사, 다운스트림이 읽음
    <name>.svg
```

- 작업본 `candidate/icon/` → 확정 `assets/icon/` **순수 복사**. 버전 이력은 git.
- 시트는 SVG를 인라인 임베드하므로 `view/`에 둬도 상대경로 의존이 없다.
- `generated/`는 두지 않는다(SVG는 텍스트라 초안 누적 불필요).
````

- [ ] **Step 3: SKILL.md 저작/시트/프리뷰 경로(라인 49–51) 교체**

- 라인 50: `build-iconset-sheet.mjs가 .design/icon/*.svg를 글롭` → `…candidate/icon/*.svg를 글롭`.
- 라인 51: `node ../../scripts/lib/serve-design.mjs <cwd>/.design/icon` → `node ../../scripts/lib/serve-design.mjs <cwd>/.design` (+ "시트 직접 URL: `http://localhost:5500/view/iconset-sheet.html`").

- [ ] **Step 4: SKILL.md 흐름 Phase 0·2 경로 교체**

- Phase 0(라인 56): `.design/final/brand-kit/BRAND_KIT.md·brand-tokens.json` → `.design/BRAND_KIT.md·.design/brand-tokens.json`.
- Phase 2 저작(라인 74): `.design/icon/<name>.svg` → `.design/candidate/icon/<name>.svg`.
- Phase 2 시트(라인 75): `.design/icon/iconset-sheet.html` → `.design/view/iconset-sheet.html`.

- [ ] **Step 5: SKILL.md 흐름 9(lock) 교체 — assets/icon + overview §11 patch**

라인 78 교체:

````md
9. **lock (승격 + overview 주입)**: 확정 `*.svg`를 `.design/assets/icon/`로 순수 복사. `iconset-briefs.md`는 작업 참조용이라 복사하지 않는다(`candidate/icon/`에만 두고 git 추적). 이어 `view/overview.html`의 `<!-- design-iconset:slot -->…<!-- /design-iconset:slot -->` 사이를 `assets/icon/*.svg`를 인라인한 그리드(`<div>`에 각 SVG를 currentColor로, 토큰색 배경)로 **외과 치환**한다(멱등 — 재실행 안전; 마커 없으면 §11 끝에 삽입). 라이브 서버가 떠 있으면 자동 새로고침. 다운스트림(`design-page-image`·`design-md-compiler`)은 `.design/assets/icon/`를 읽는다. 산출 경로 제시 후 안내: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**. 라이브 프리뷰 서버가 떠 있으면 종료.
````

- [ ] **Step 6: iconset-sheet.md §3 그리드 렌더 경로 교체**

- 라인 41: `.design/icon/의 *.svg를` → `candidate/icon/의 *.svg를`.
- 호출 예(라인 45–50): `--in "<cwd>/.design/icon"` → `--in "<cwd>/.design/candidate/icon"`; `--out "<cwd>/.design/icon/iconset-sheet.html"` → `--out "<cwd>/.design/view/iconset-sheet.html"`; `--tokens "<cwd>/.design/final/brand-kit/brand-tokens.json"` → `--tokens "<cwd>/.design/brand-tokens.json"`.
- 라인 51: `serve-design.mjs <cwd>/.design/icon` → `serve-design.mjs <cwd>/.design`.
- §4 라인 55: `해당 .svg 파일만` 편집 위치가 `candidate/icon/`임을 명시.

- [ ] **Step 7: build-iconset-sheet.mjs 헤더 주석(라인 2) 교체**

- OLD: `// design-iconset 시트 생성기 (.design/icon/*.svg → iconset-sheet.html)`
- NEW: `// design-iconset 시트 생성기 (.design/candidate/icon/*.svg → .design/view/iconset-sheet.html)`

(기능 변화 없음 — 경로는 인자로 받는다. 예시 주석만 갱신.)

- [ ] **Step 8: OLD 경로 잔존 검증**

Run: `rg -n "final/icon|final/brand-kit|\.design/icon/" skills/design-iconset`
Expected: 매칭 없음.

- [ ] **Step 9: Commit**

```bash
git add skills/design-iconset
git commit -m "refactor(design-iconset): 작업 candidate/icon·시트 view·확정 assets/icon + lock 때 overview §11 patch"
```

---

## Task 4: design-page-image

입력 `assets/brand-kit/`·루트 스펙, 브리프 `candidate/page/`, 생성 `candidate/page/`, 확정 `assets/page/`.

**Files:**
- Modify: `skills/design-page-image/SKILL.md`

- [ ] **Step 1: 입력 파일(라인 16–20) 경로 교체**

- `.design/final/brand-kit/BRAND_KIT.md` → `.design/BRAND_KIT.md`
- `.design/final/brand-kit/brand-tokens.json` → `.design/brand-tokens.json`
- `.design/final/brand-kit/assets/ui-base.png` → `.design/assets/brand-kit/ui-base.png`
- `.design/final/brand-kit/assets/key-visual.png` → `.design/assets/brand-kit/key-visual.png`
- `.design/final/brand-kit/overview.html` → `.design/view/overview.html`

- [ ] **Step 2: 출력 파일(라인 24–25) 교체**

- `.design/image-briefs/page-briefs.md` → `.design/candidate/page/page-briefs.md`
- `.design/generated/page/` → `.design/candidate/page/` (섹션 이미지 PNG 폴더)

- [ ] **Step 3: 이미지 생성/저장 경로(라인 106·111·114·115) 교체**

- 라인 106: `assets/ui-base.png`·`assets/key-visual.png` → `../assets/brand-kit/ui-base.png`·`../assets/brand-kit/key-visual.png` 의미로(브랜드 자산 참조). `assets/의 투명 PNG` → `assets/brand-kit/의 투명 PNG`.
- 라인 111: `--out "<cwd>/.design/generated/page/section-1-hero.png"` → `--out "<cwd>/.design/candidate/page/section-1-hero.png"`.
- 라인 114: `<cwd>/.design/generated/page/` → `<cwd>/.design/candidate/page/`.
- 라인 115: `섹션을 lock하면 그 시안을 <cwd>/.design/final/page/로 복사` → `…<cwd>/.design/assets/page/로 복사`; `final/page/section-1-hero.png` → `assets/page/section-1-hero.png`; `다운스트림…은 .design/final/을 우선 읽는다` → `…은 .design/assets/를 읽는다`.

- [ ] **Step 4: 흐름(라인 119·123) 경로 교체**

- 라인 119: `.design/image-briefs/page-briefs.md` → `.design/candidate/page/page-briefs.md`.
- 라인 123: `.design/final/page/로 복사` → `.design/assets/page/로 복사`; `시안은 .design/generated/page/에` → `시안은 .design/candidate/page/에`.

- [ ] **Step 5: OLD 경로 잔존 검증**

Run: `rg -n "final/page|final/brand-kit|image-briefs|generated/page" skills/design-page-image`
Expected: 매칭 없음.

- [ ] **Step 6: Commit**

```bash
git add skills/design-page-image
git commit -m "refactor(design-page-image): 입력 assets/brand-kit·브리프/생성 candidate/page·확정 assets/page"
```

---

## Task 5: design-md-compiler

입력: 루트 스펙/토큰, `view/overview.html`, `assets/**`, 루트 manifest. 출력 DESIGN.md(루트).

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: 입력 파일(라인 16–24) 블록 교체**

````md
- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- `.design/candidate/brand-kit/brand-briefs.md`
- `.design/candidate/page/page-briefs.md`
- `.design/view/overview.html` (있으면 — 브랜드 오버뷰 룩·섹션 구조 참조)
- `.design/assets/brand-kit/*.png`, `.design/assets/brand-kit/icon/*.png` (확정 base 자산 — 로고·키비주얼·UI·컨셉 아이콘)
- `.design/assets/logo/*.png`, `.design/assets/icon/*.svg`, `.design/assets/page/*.{png,jpg,jpeg,webp}` (확정 deliverable)
- `.design/candidate/page/*.{png,jpg,jpeg,webp}` (확정 전 시안 폴백)
- `.design/manifest.json` (선택 — 있으면 캡션·순서·섹션 매핑 메타, 없으면 파일명 glob)
````

- [ ] **Step 2: 출력 파일(라인 28) 확인**

`DESIGN.md (대상 프로젝트 cwd 루트)` 유지 — 변경 없음(루트). (참고: `.design/DESIGN.md`가 아니라 cwd 루트 `DESIGN.md`. designer.md·README의 `.design/DESIGN.md` 표기와 일치시키는 건 Task 7·8에서 처리.)

- [ ] **Step 3: 작성 규칙 이미지 구분 노트(라인 96) 교체**

- OLD: `이미지는 경로의 서브디렉터리 이름으로 종류를 구분한다: brand-kit/assets/(로고·키비주얼·UI·아이콘 — 1급 재사용 자산) vs page/(페이지 섹션). overview.html은 브랜드 오버뷰 룩의 참조다.`
- NEW: `이미지는 assets/ 하위 폴더로 종류를 구분한다: assets/brand-kit/(키비주얼·UI·컨셉 아이콘 — 브랜드 base) · assets/logo/(확정 로고) · assets/icon/(프로덕션 SVG 아이콘셋) · assets/page/(페이지 섹션). view/overview.html은 브랜드 오버뷰 룩의 참조다.`

- [ ] **Step 4: OLD 경로 잔존 검증**

Run: `rg -n "final/|image-briefs|generated/|brand-kit/assets" skills/design-md-compiler`
Expected: 매칭 없음.

- [ ] **Step 5: Commit**

```bash
git add skills/design-md-compiler
git commit -m "refactor(design-md-compiler): 입력 루트 스펙·view/overview·assets/** 로 갱신"
```

---

## Task 6: design-html-prototype

입력: 루트 `brand-tokens.json`, `assets/**` 확정.

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 입력 파일(라인 17–18) 교체**

- 라인 17: `.design/final/brand-kit/brand-tokens.json` → `.design/brand-tokens.json`.
- 라인 18: `.design/final/**/*.{png,jpg,jpeg,webp} (확정본 — 있으면 우선) → 없으면 .design/generated/**/*...폴백` → `.design/assets/**/*.{png,jpg,jpeg,webp} (확정본) → 없으면 .design/candidate/**/*.{png,jpg,jpeg,webp} 폴백 (+ 선택 manifest.json)`.

- [ ] **Step 2: CSS 구조 폰트 주석(라인 52·75·97) 교체**

`.design/final/brand-kit/brand-tokens.json` 3곳 모두 → `.design/brand-tokens.json`.

- [ ] **Step 3: OLD 경로 잔존 검증**

Run: `rg -n "final/brand-kit|final/\*\*|generated/" skills/design-html-prototype`
Expected: 매칭 없음.

- [ ] **Step 4: Commit**

```bash
git add skills/design-html-prototype
git commit -m "refactor(design-html-prototype): 입력 루트 brand-tokens·assets/** 로 갱신"
```

---

## Task 7: agents/designer.md

파이프라인 단계 설명의 경로를 새 레이아웃으로.

**Files:**
- Modify: `agents/designer.md`

- [ ] **Step 1: 파이프라인 1단계(라인 12) 교체**

- OLD: `… 브랜드 킷(.design/brand-kit/BRAND_KIT.md, .design/brand-kit/brand-tokens.json)과 정체성 base 자산(assets/logo-base.png·…·icons/*), … HTML 오버뷰(overview.html)를 만든다. … 확정 시 .design/final/brand-kit/로 lock.`
- NEW: `… 브랜드 킷(.design/BRAND_KIT.md, .design/brand-tokens.json)과 정체성 base 자산(.design/assets/brand-kit/{logo-base,wordmark-base,key-visual,ui-base}.png·icon/*), 그리고 그것들을 끼워넣은 HTML 오버뷰(.design/view/overview.html)를 만든다. 로고는 logo-base 자산으로 생산하며, 단독 로고 확정은 design-logo 몫. 산출물은 처음부터 캐노니컬 홈에 저작되며 lock은 "승인" 의미다.`

- [ ] **Step 2: 파이프라인 2·3단계(라인 13·14) 교체**

- 라인 13: `assets/logo-base.png를 시드로 로고를 탐색·확정해 .design/final/logo/에 만든다.` → `.design/assets/brand-kit/logo-base.png를 시드로 로고를 탐색·확정해 .design/assets/logo/에 만든다.`
- 라인 14: `BRAND_KIT.md §11과 assets/icons/*를 시드로 … .design/final/iconset/에 확정한다.` → `.design/BRAND_KIT.md §11과 .design/brand-tokens.json을 근거로 … .design/assets/icon/에 확정한다.`(brand-kit PNG 아이콘은 시드로 읽지 않음 — iconset 스킬 규칙과 일치.)

- [ ] **Step 3: 파이프라인 5단계 + 입력 흐름(라인 16·19·27) 교체**

- 라인 16: `.design/DESIGN.md로 정리한다.` 유지(루트 DESIGN.md — md-compiler 출력은 cwd 루트 `DESIGN.md`이므로 `.design/DESIGN.md` 표기를 `DESIGN.md`(cwd 루트)로 교체).
- 라인 19: `다운스트림은 보드를 다시 분석하지 않고 .design/brand-kit/assets/를 직접 시드로 읽는다.` → `….design/assets/brand-kit/를 직접 시드로 읽는다.`
- 라인 27: `.design/brand-kit/BRAND_KIT.md가 없는 상태에서` → `.design/BRAND_KIT.md가 없는 상태에서`.

- [ ] **Step 4: OLD 경로 잔존 검증**

Run: `rg -n "final/|brand-kit/BRAND_KIT|brand-kit/brand-tokens|assets/logo-base|assets/icons|final/iconset" agents/designer.md`
Expected: 매칭 없음.

- [ ] **Step 5: Commit**

```bash
git add agents/designer.md
git commit -m "refactor(designer): 파이프라인 경로를 .design 2축 레이아웃으로 갱신"
```

---

## Task 8: README.md + docs/design/README.md

사용자 문서의 파이프라인 표·경로 갱신.

**Files:**
- Modify: `README.md`
- Modify: `docs/design/README.md`

- [ ] **Step 1: docs/design/README.md 파이프라인 다이어그램(라인 10–16) 교체**

````
design-brand-kit
   ├─ (선택) design-logo      ← assets/brand-kit/logo-base.png 시드
   ├─ (선택) design-iconset   ← BRAND_KIT.md §11 + brand-tokens.json 근거
   └─ design-page-image
          └─ design-md-compiler
                 └─ design-html-prototype
````

- [ ] **Step 2: docs/design/README.md 표(라인 20–25) 경로 교체**

- design-brand-kit 산출물 셀: `.design/brand-kit/ (...), lock 시 .design/final/brand-kit/` → `.design/{BRAND_KIT.md·brand-tokens.json}(루트) · view/overview.html · assets/brand-kit/`.
- design-logo 입력 `assets/logo-base.png` → `assets/brand-kit/logo-base.png`; 산출물 `.design/final/logo/` → `.design/assets/logo/`. (설명의 "40개 컨셉 탐색 보드"는 현재 SKILL과 어긋나므로 "라운드 3~4개 탐색 시트 → 단독 로고 확정"으로 함께 정정.)
- design-iconset 입력 `assets/icons/*` → `brand-tokens.json 근거`; 산출물 `.design/final/iconset/` → `.design/assets/icon/`.
- design-md-compiler 산출물 `.design/DESIGN.md` → `DESIGN.md (cwd 루트)`.

- [ ] **Step 3: docs/design/README.md 본문 경로(라인 27·55·59–70) 교체**

- 라인 27: `.design/brand-kit/assets/를 직접 시드로 읽는다` → `.design/assets/brand-kit/를 직접 시드로 읽는다`.
- 라인 55 lock 설명: `.design/brand-kit/를 .design/final/brand-kit/로 순수 복사` → `산출물은 캐노니컬 홈(루트·view/·assets/brand-kit/)에 제자리 — lock은 승인 의미`.
- 산출물 레이아웃 코드펜스(라인 59–68)를 권위 레퍼런스 트리(이 플랜 상단)의 축약본으로 교체.
- 라인 70: `overview.html의 모든 <img>는 형제 assets/를 상대경로로 참조하므로, 작업 폴더든 final이든` → `overview.html은 view/에서 ../assets/brand-kit/를 상대경로로 참조한다`.

- [ ] **Step 4: README.md 디자인 관련 경로 점검·교체**

Run(먼저 위치 파악): `rg -n "\.design/|final/|brand-kit/assets|image-briefs|generated/" README.md`
나온 각 줄을 권위 매핑대로 교체한다(디자인 파이프라인 설명 부분). 디자인과 무관한 줄은 건드리지 않는다.

- [ ] **Step 5: OLD 경로 잔존 검증**

Run: `rg -n "final/brand-kit|final/logo|final/iconset|final/page|brand-kit/assets|image-briefs|generated/page" README.md docs/design/README.md`
Expected: 매칭 없음.

- [ ] **Step 6: Commit**

```bash
git add README.md docs/design/README.md
git commit -m "docs: 디자인 파이프라인 문서를 .design 2축 레이아웃으로 갱신"
```

---

## Task 9: 공유 스크립트 주석

`serve-design.mjs`의 예시 주석을 새 흐름에 맞게(기능 변화 없음).

**Files:**
- Modify: `scripts/lib/serve-design.mjs` (주석만)

- [ ] **Step 1: serve-design.mjs 헤더 주석(라인 6–7) 갱신**

- OLD: `//   파일 watch·자동 새로고침·브라우저 오픈·OS 분기는 전부 five-server에 위임한다 — / 이 스크립트는 그 로직을 구현하지 않는다. (overview.html은 형제 assets/ 상대경로라 / 서빙 루트만 맞으면 그대로 동작.)`
- NEW: `…이 스크립트는 그 로직을 구현하지 않는다. (.design/ 을 루트로 서빙하면 view/*.html이 ../assets/·../candidate/ 상대경로로 동작하고, 루트 index.html이 /view/overview.html로 리다이렉트.)`

(build-iconset-sheet.mjs 주석은 Task 3 Step 7에서 이미 처리.)

- [ ] **Step 2: 스크립트 회귀 테스트**

Run: `node --test tests/serve-design.test.mjs tests/build-iconset-sheet.test.mjs`
Expected: PASS (주석만 바꿨으므로 기존 테스트 그대로 통과). 만약 테스트가 OLD `.design/` 경로 문자열을 단언하면(가능성 낮음 — temp 경로 사용) 해당 단언을 새 경로로 갱신한다.

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/serve-design.mjs
git commit -m "docs(serve-design): 주석을 .design 루트 서빙·view/ 리다이렉트 흐름으로 갱신"
```

---

## Task 10: sync + 전역 검증

Codex 번들 재생성 후 전역 잔존 경로·테스트·sync 무결성 확인.

**Files:**
- Generated: `plugins/personal/**`, `codex-agents/*.toml` (gitignore — 커밋 안 함)
- Generated(커밋됨): `.claude-plugin/mcp.json` 등 — 이번 작업은 MCP 무변경이라 변화 없어야 함.

- [ ] **Step 1: 전역 OLD 경로 잔존 검증 (기록물 제외)**

Run: `rg -n "final/brand-kit|final/logo|final/icon|final/page|final/iconset|\.design/brand-kit/|\.design/logo/|\.design/icon/|image-briefs|generated/page|brand-kit/assets/icons" -g '!docs/superpowers/**' -g '!plugins/personal/**'`
Expected: 매칭 없음. (남으면 해당 소스 파일을 매핑대로 고치고 그 파일의 Task로 돌아가 커밋.)

- [ ] **Step 2: Codex 번들 재생성**

Run: `npm run sync`
Expected: 성공 종료(0). `scripts/check-secrets.mjs` 통과. `plugins/personal/`·`codex-agents/`가 새 소스로 재생성됨(gitignore — 커밋 대상 아님).

- [ ] **Step 3: 전체 테스트 회귀**

Run: `npm test`
Expected: 모든 테스트 PASS.

- [ ] **Step 4: 생성된 커밋 대상 파일 변화 확인**

Run: `git status --porcelain`
Expected: 추적 대상(소스) 변경은 이미 Task 1–9에서 커밋됨. `plugins/personal/`·`codex-agents/`는 gitignore라 나타나지 않아야 한다(나타나면 .gitignore 점검). MCP 생성물(`.claude-plugin/mcp.json` 등) 변화는 없어야 한다.

- [ ] **Step 5: (변경분 있으면) Commit**

```bash
# git status에 커밋 대상 변경이 남아 있을 때만
git add -A
git commit -m "chore: design 스킬 재구성 후 sync 산출물 정리"
```

(보통 Step 1–4가 깨끗하면 이 단계는 생략 — 커밋할 추적 대상이 없다.)

---

## Self-Review (작성자 점검 — 실행 전 완료)

**1. Spec 커버리지** (스펙 각 절 → 태스크):
- §3 타깃 모델/2축 → Task 1(앵커) + 전 태스크 경로.
- §3.1 brand-kit/icon vs icon → Task 1(assets/brand-kit/icon) · Task 3(assets/icon) · Task 5(구분 노트).
- §4 경로 매핑 → Task 1–8 per-file.
- §5 lock 의미 → Task 1 Step 6 · Task 2 Step 5 · Task 3 Step 5 · Task 4 Step 3.
- §6 overview 누적(마커·patch) → Task 1 Step 4·9(슬롯 저작) · Task 2 Step 5(§6) · Task 3 Step 5(§11).
- §7 마이그레이션 범위 → Task 1–9; §7.1 라이브서버/index.html → Task 1 Step 5 · 라이브서버 규약 절 · Task 9.
- §8 기본값(§6 로고·index.html·candidate 보존·assets/brand-kit·patch-on-lock) → Task 1·2 반영.
- §9 범위 밖(docs/superpowers 미수정) → Task 10 Step 1 `-g '!docs/superpowers/**'`.
- §10 검증 → Task 10(grep·sync·test) + 각 태스크 grep.

**2. Placeholder 스캔:** 모든 Step에 구체 경로·교체문·명령·기대값 명시. "적절히 처리" 류 없음. ✅

**3. 타입/명칭 일관성:** 마커 슬롯 이름이 전 태스크 동일(`design-logo:slot`·`design-iconset:slot`). 폴더명 `view/`·`assets/brand-kit/`·`assets/{logo,icon,page}/`·`candidate/{brand-kit,logo,icon,page}/` 전 태스크 일관. 라이브서버 타깃 `<cwd>/.design` 일관. ✅
