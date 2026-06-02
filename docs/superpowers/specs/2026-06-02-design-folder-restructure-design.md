# `.design/` 폴더 구조 재구성 + overview 확정자산 누적 — 설계

- 날짜: 2026-06-02
- 상태: 승인 대기 (사용자 리뷰)
- 범위: 디자인 스킬군이 생성·소비하는 `.design/` 작업 디렉터리의 **레이아웃 규약** 재정의 + overview.html이 확정 로고/아이콘을 표시하도록 하는 기능

## 1. 배경 / 문제

`.design/`는 이 저장소에 체크인되지 않는다 — 다운스트림 프로젝트에서 디자인 스킬군이 만들어 쓰는 작업 디렉터리다. 그래서 이 작업은 파일 이동이 아니라 **스킬·문서·에이전트가 들고 있는 경로 규약을 다시 쓰는 것**이다.

현재 규약은 두 갈래로 흩어져 있다:

- **작업 디렉터리(in-progress)**: `.design/{brand-kit,logo,icon}/`, `.design/image-briefs/`, `.design/generated/page/`
- **확정(`final/`)**: `.design/final/brand-kit/`(BRAND_KIT.md·brand-tokens.json·overview.html·assets/), `.design/final/{logo,icon,page}/`

문제점:

1. `final/`이 **스펙 문서**(BRAND_KIT.md·brand-tokens.json·overview.html)와 **실제 deliverable**(logo.png·svg·page png)을 한 곳에 섞는다. "페이지 코드가 import하는 산출물"이라는 경계가 흐리다.
2. 확정 산출물이 타입별로 한곳에 모이지 않아(`final/logo/assets/`, `final/icon/`, …) 실제 페이지 코드가 끌어다 쓰기 번거롭다.
3. 로고·아이콘이 확정돼도 brand-kit의 overview.html(브랜드 한눈에 보기 문서)엔 반영되지 않는다 — overview는 brand-kit의 *base/concept* 자산만 보여준다.

## 2. 목표

- 확정 산출물을 **타입별 top-level `assets/`**로 모아 "페이지 코드가 import하는 것"이라는 경계를 또렷하게.
- 권위 스펙/토큰/오버뷰는 **루트 직속**으로 올려 경로를 짧고 안정적으로.
- 탐색물은 **`candidate/`** 한 버킷으로.
- 브라우저로 여는 모든 HTML을 **`view/`** 한 폴더(같은 깊이)로 모아 한 라이브서버로 다 보고, 경로 일관성도 확보.
- design-logo·design-iconset이 **확정되면** overview.html에 그 결과가 누적 표시되게.

## 3. 타깃 모델 (2축)

```
.design/
  BRAND_KIT.md  brand-tokens.json  DESIGN.md  manifest.json   # 데이터·스펙 (루트)
  index.html                       # → /view/overview.html 리다이렉트 (서버 첫화면)

  view/                            # presentation축: 브라우저로 여는 모든 HTML (같은 깊이)
    overview.html                  #   patch-on-lock으로 확정 로고/아이콘 누적
    logos.html                     #   로고 탐색 시트
    iconset-sheet.html             #   아이콘 리뷰 시트
    directions.html                #   (분위기 열림) 발산 컨택트 시트
    # 모든 <img>·링크는 ../assets/.. · ../candidate/.. (깊이 동일)

  assets/                          # lifecycle축(확정): 페이지 코드가 import하는 deliverable
    brand-kit/  logo-base.png · key-visual.png · ui-base.png · wordmark-base.png · icon/<name>.png
    logo/       logo.png
    icon/       <name>.svg
    page/       section-*.png
  candidate/                       # lifecycle축(탐색): raw 데이터 (비-HTML)
    logo/       concepts/round-N/*.png · seed.png · seed-user.png
    icon/       wip <name>.svg
    brand-kit/  brief.md · directions.json
    page/       page-briefs.md · generated *.png
```

**두 축의 의미:**

- **lifecycle 축** — `candidate/`(탐색 데이터) ↔ `assets/`+루트(확정 데이터·스펙). 한 줄 규칙: *확정 = `assets/`(타입별) + 루트(스펙/토큰/오버뷰)*, *탐색 = `candidate/`(스킬별)*.
- **presentation 축** — `view/`는 위 데이터를 렌더하는 **모든 HTML**을 phase 무관하게 모은다. HTML이 전부 같은 깊이(`view/`)라 `../assets/..`·`../candidate/..` 프리픽스가 통일된다.

**핵심 규약:**

- `view/`의 모든 HTML은 자산을 `../assets/..`, 탐색물을 `../candidate/..` **상대경로**로 참조한다. 상대경로라 `file://` 더블클릭으로도 동작한다.
- 라이브서버는 **루트 = `.design/`**로 띄운다(상위 디렉터리 traversal `../`가 served root 안에 머물도록). 루트 `index.html`이 `/view/overview.html`로 리다이렉트해 첫 화면을 잡는다.
- brand-kit은 overview.html을 **`view/`에서 제자리 저작**한다 — 확정 후 위치 이동이 없으므로 `<img>` 경로 재작성이 필요 없다.

### 3.1 브랜드 base vs 프로덕션 아이콘 (충돌 해소)

brand-kit이 만든 **컨셉 아이콘**(PNG, 브랜드 탐색물)과 design-iconset의 **프로덕션 아이콘셋**(SVG, currentColor, 페이지 코드가 import)은 포맷이 아니라 **출신·역할**이 다르다. 따라서:

- 컨셉 아이콘 → `assets/brand-kit/icon/<name>.png` (브랜드 base 묶음의 일부)
- 프로덕션 아이콘셋 → `assets/icon/<name>.svg`

부모 폴더(`brand-kit/icon` vs `icon`)가 역할을 구분한다. `assets/brand-kit/`은 design-brand-kit이 확정한 정체성 base 묶음 전체(로고/워드마크 base, 키비주얼, UI base, 컨셉 아이콘)를 담는 네임스페이스다.

## 4. 경로 매핑 (OLD → NEW)

| 관심사 | OLD | NEW |
|---|---|---|
| 브랜드 스펙 | `final/brand-kit/BRAND_KIT.md` | `BRAND_KIT.md` |
| 토큰 | `final/brand-kit/brand-tokens.json` | `brand-tokens.json` |
| 컴파일 산출 | `.design/DESIGN.md` · `manifest.json` | (동일, 루트) |
| 브랜드 base 자산 | `final/brand-kit/assets/{logo-base,wordmark-base,key-visual,ui-base}.png` | `assets/brand-kit/…` |
| 컨셉 아이콘 | `final/brand-kit/assets/icons/<n>.png` | `assets/brand-kit/icon/<n>.png` |
| 로고 확정 | `final/logo/assets/logo.png` | `assets/logo/logo.png` |
| 아이콘셋 확정 | `final/icon/<n>.svg` | `assets/icon/<n>.svg` |
| 페이지 확정 | `final/page/section-*.png` | `assets/page/section-*.png` |
| 브랜드 오버뷰 HTML | `final/brand-kit/overview.html` (작업: `brand-kit/overview.html`) | `view/overview.html` |
| 로고 탐색 시트 | `.design/logo/logos.html` | `view/logos.html` |
| 아이콘 리뷰 시트 | `.design/icon/iconset-sheet.html` | `view/iconset-sheet.html` |
| 발산 컨택트 시트 | `.design/brand-kit/directions.html` | `view/directions.html` |
| brand-kit 작업물 | `.design/brand-kit/{brief.md,directions.json,assets/}` | `candidate/brand-kit/{brief.md,directions.json}` + base assets는 `assets/brand-kit/` 제자리 |
| 로고 탐색물 | `.design/logo/assets/{concepts/round-N/*,seed*.png}` | `candidate/logo/{concepts/round-N/*,seed*.png}` |
| 아이콘 작업물 | `.design/icon/*.svg` (확정 전) | `candidate/icon/*.svg` |
| 이미지 브리프 | `.design/image-briefs/{brand,page}-briefs.md` | `candidate/{brand-kit,page}/…-briefs.md` |
| 생성 페이지 이미지 | `.design/generated/page/*.png` | `candidate/page/*.png` |

## 5. lock(확정) 의미 변화

`final/` 통째 복사 모델이 사라지고, 스킬별로 **확정 산출물을 캐노니컬 홈으로 승격**한다.

- **design-brand-kit**: overview.html·BRAND_KIT.md·brand-tokens.json·base assets를 처음부터 캐노니컬 홈(`view/`·루트·`assets/brand-kit/`)에 저작. lock = "승인" 의미(복사 거의 없음). 탐색물(brief.md·directions.json·directions.html)만 `candidate/brand-kit/`·`view/`에.
- **design-logo**: `candidate/logo/`에서 탐색 → 고른 로고를 `assets/logo/logo.png`로 승격 + overview §6 슬롯 patch.
- **design-iconset**: `candidate/icon/`에서 저작·리뷰 → 확정 세트를 `assets/icon/`로 승격 + overview §11 슬롯 patch.
- **design-page-image**: `candidate/page/`에서 생성 → 확정 이미지를 `assets/page/`로 승격.

## 6. overview 확정자산 누적 (patch-on-lock)

### 6.1 마커 슬롯 (brand-kit 저작)

brand-kit이 overview.html을 저작할 때, 멱등 외과편집이 가능하도록 **HTML 주석 마커 슬롯**을 둔다:

- 로고 슬롯 — §6 Logo Direction 안:
  `<!-- design-logo:slot --> … <!-- /design-logo:slot -->`
- 아이콘셋 슬롯 — §11 Imagery/Iconography 안(컨셉 아이콘 다음):
  `<!-- design-iconset:slot --> … <!-- /design-iconset:slot -->`

초기엔 "확정 대기" 플레이스홀더 내용으로 둔다.

### 6.2 patch 동작 (다운스트림 lock 단계)

- **design-logo lock**: `assets/logo/logo.png` 승격 후, `view/overview.html`의 로고 슬롯 사이를 `<img src="../assets/logo/logo.png" …>`로 치환.
- **design-iconset lock**: `assets/icon/*.svg` 승격 후, §11 아이콘 슬롯 사이를 확정 SVG 인라인 그리드(currentColor·토큰색, iconset-sheet 렌더 방식 재사용)로 치환.

**계약:** 마커 주석 쌍 사이만 교체 → 멱등(재-lock 안전). 마커가 없으면(구버전 overview) 해당 섹션에 삽입. 자산 경로는 `../assets/..` 상대(= view/ 깊이 기준).

**자동 새로고침:** lock이 `view/overview.html`을 디스크에서 수정하므로 five-server가 자동 새로고침한다. 별도 런타임/JS 로더 없음.

## 7. 마이그레이션 범위 (소스 — 직접 수정)

1. **스킬 SKILL.md + references (경로 문자열):**
   - `skills/design-brand-kit/` — SKILL.md, `references/brand-kit-image.md`, `references/brand-kit-html-direction.md`, `references/brand-kit-contact-sheet.md`
   - `skills/design-logo/` — SKILL.md, `references/logo-sheet-html-direction.md`
   - `skills/design-iconset/` — SKILL.md, `references/iconset-sheet.md`
   - `skills/design-page-image/SKILL.md`
   - `skills/design-md-compiler/SKILL.md`
   - `skills/design-html-prototype/SKILL.md`
2. **에이전트:** `agents/designer.md`
3. **사용자 문서:** `README.md`, `docs/design/README.md`
4. **스크립트 주석(기능 무관 예시 경로):** `scripts/lib/serve-design.mjs` L6–7, `skills/design-iconset/scripts/build-iconset-sheet.mjs` L2
5. **재생성:** `npm run sync` (Codex 번들 `plugins/personal/` + `codex-agents/` 갱신)

### 7.1 코드 영향 (낮음 — 확인 필요)

- `serve-design.mjs`·`build-iconset-sheet.mjs`는 경로를 **하드코딩하지 않는다**(인자로 받음). 기능 변경 없음, 주석 예시만 갱신.
- **라이브서버 호출 변경**: brand-kit은 이제 `node ../../scripts/lib/serve-design.mjs <cwd>/.design`로 **루트=`.design/`**를 띄우고, 루트 `index.html`이 `/view/overview.html`로 리다이렉트. (현재는 `<cwd>/.design/brand-kit`을 띄움.) `serve-design.mjs`는 디렉터리를 root로 그대로 받으므로 API 변경 불필요 — 단, "특정 파일 자동 오픈"은 안 되므로 루트 `index.html` 리다이렉트로 첫 화면을 잡는다.
- `tests/serve-design.test.mjs`, `tests/build-iconset-sheet.test.mjs`는 자체 temp 경로를 쓰므로 `.design/` 규약에 의존하지 않을 것으로 보인다 — 구현 시 확인하고, 깨지면 갱신.

## 8. 결정·기본값

- 확정 로고 표시 위치 = overview **§6 Logo Direction**(방향 텍스트 옆 실제 확정 로고).
- 루트 **`index.html` 리다이렉트** 추가(서버 루트가 `.design/`라 첫 화면을 overview로 보냄).
- **`candidate/` 보존**(확정 후에도 삭제하지 않음 — 재시드·탐색 기록용).
- 브랜드 base 네임스페이스 = **`assets/brand-kit/`**(BRAND_KIT.md·스킬명과 일치).
- overview 갱신 = **patch-on-lock + 마커 주석**(동적 JS 로드 안 씀).

## 9. 범위 밖 (Out of Scope)

- `docs/superpowers/{specs,plans}/*` 과거 기록물 — 건드리지 않는다(당시 결정의 기록).
- 디자인 스킬의 *내용/품질 로직* 변경 — 이번 작업은 경로 규약 + overview 누적 기능에 한정.
- `assets/` 산출물의 실제 페이지 코드 import 방식(번들러·프레임워크별) — 다운스트림 프로젝트 몫.

## 10. 검증

- `npm test`(또는 `node --test "tests/**/*.test.mjs"`) — 스크립트 테스트 회귀 없음 확인.
- `scripts/check-secrets.mjs`/sync 무결성 — `npm run sync` 후 생성물 일관성.
- 수동: 더미 `.design/` 트리로 라이브서버 루트=`.design/` 기동 → `/view/overview.html` 오픈 → `../assets` 상대경로 렌더 + 형제 시트 링크 동작 확인. logo/icon lock patch 후 §6·§11 누적 + 자동 새로고침 확인.
- 잔존 경로 점검: 소스 트리에서 `final/`·`image-briefs/`·`generated/`·`brand-kit/assets/icons/` 등 OLD 경로 문자열이 (기록물 제외하고) 남지 않았는지 grep.
