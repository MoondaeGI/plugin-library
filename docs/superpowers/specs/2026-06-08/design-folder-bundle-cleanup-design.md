# `.design/` 자체완결 번들 정리 — 코드/참고 분리 + DESIGN.md·prototype 흡수 — 설계

- 날짜: 2026-06-08
- 상태: 승인 대기 (사용자 리뷰)
- 범위: 디자인 스킬군이 생성·소비하는 `.design/` 작업 디렉터리의 **레이아웃 규약** 재정의. 2026-06-02 재구성(`design-folder-restructure-design.md`)의 후속.

## 1. 배경 / 문제

`.design/`의 목적은 **추후 구현할 `export-component`(및 `design-generate-code`)가 읽어 대상 프로젝트 루트에 실제 코드를 생성하기 위한 재료 묶음**이다(코드·디자인 수정 시 참고 자료도 겸한다). 즉 `.design/`는 "코드 생성이 읽는 자체완결 번들"이어야 한다.

현재 규약(2026-06-02 이후, 실제 출하 상태)은 이 목적과 어긋난 지점이 있다:

1. **DESIGN.md·prototype/이 번들 밖(cwd 루트)에 있다.** designer 핵심 파이프라인의 종착 스펙(`DESIGN.md`)과 참고 구현(`prototype/index.html`)이 `.design/` 바깥에 떨어져 있어, "번들 하나만 읽으면 된다"는 경계가 깨진다.
2. **`assets/`가 코드용과 비-코드용을 섞는다.** `assets/`엔 코드가 import하는 것(`tokens.css`·`ui-kit.css`·아이콘 SVG·로고)과 **사람이 보는 브랜드 표시물**(`brand-kit/*.png` 정체성 base 아트, `page/*.png` 풀페이지 목업)이 한곳에 섞여 있다. export-component가 "assets/ = import 대상"으로 단순하게 읽을 수 없다.
3. **루트가 잡다하다.** `.design/` 루트에 스펙·토큰 소스·메타(`BRAND_KIT.md`·`brand-tokens.json`·`manifest.json`)가 흩어져 "코드가 쓰는 것"과 "사람이 보는 소스"가 구분되지 않는다.
4. `assets/ui-kit/ui-kit.css`는 폴더 안에 단일 파일만 들어 중복 중첩이고, `assets/vendor/`(벤더 브랜드 마크 SVG)는 아이콘과 형제로 떠 있어 역할이 흐리다.

`.design/`는 이 저장소에 체크인되지 않는다 — 다운스트림 프로젝트에서 디자인 스킬군이 만들어 쓰는 작업 디렉터리다. 그래서 이 작업은 파일 이동이 아니라 **스킬·문서·에이전트·스크립트가 들고 있는 경로 규약을 다시 쓰는 것**이다.

## 2. 목표

- **번들 자체완결화**: `DESIGN.md`·`prototype/`을 `.design/` 안으로 흡수해, export-component이 "`.design/`만 읽으면 끝"이 되게 한다.
- **코드/참고 2분할**: `assets/`와 루트는 **실제 코드가 쓰는 것만** 남긴다. 사람이 보는 비-코드 자료(브랜드 표시물·정체성 소스)는 **`reference/`** 한 버킷으로 모은다.
- **CSS 정리**: 두 전역 스타일시트를 `assets/css/`로 모으고, 죽은 `ui-kit/` 중첩을 없앤다.
- **벤더 마크 정리**: `assets/vendor/`를 `assets/icon/vendor/`로 옮겨 "레이아웃에서 아이콘처럼 쓰는 SVG 글리프"라는 역할로 묶는다(단, 색 보존 — 프로덕션 아이콘셋과 정규화가 다름).
- **DESIGN.md 단일 캐노니컬**: 위치 노브 없이 `.design/DESIGN.md` 한 곳. (근거는 §8.)

## 3. 타깃 모델

```
.design/
  index.html                  # → /view/overview.html 리다이렉트 (서버 첫 화면)
  DESIGN.md                   # ← cwd 루트에서 이동. 스펙·코드 권위 (designer 핵심 종착)

  view/                       # presentation: 브라우저로 여는 모든 HTML (같은 깊이)
    overview.html  logos.html  iconset-sheet.html  ui-kit.html  directions.html
    # <img>·링크는 ../assets/.. · ../reference/.. · ../candidate/.. (깊이 동일)

  assets/                     # ★ 코드 import 전용 — export-component이 읽는 deliverable
    css/
      tokens.css              #   디자인 토큰 (CSS 변수) — brand-tokens.json에서 재생성
      ui-kit.css              #   UI 컴포넌트 CSS — 손으로 저작 (§5 권위)
    icon/
      <name>.svg              #   프로덕션 아이콘셋 (currentColor, viewBox 0 0 24 24)
      icon-map.json           #   아이콘 1:1 매핑
      vendor/<name>.svg       #   벤더 브랜드 마크 (색 보존) — assets/vendor/에서 이동
    logo/logo.png             #   확정 로고 (실제 자산)
    content/<slot>.<ext>      #   프로토타입 조달 콘텐츠 이미지 (hero·카드 아트)
    manifest.json             #   프로토타입 자산 슬롯 맵 (슬롯↔파일)

  prototype/                  # ← cwd 루트에서 이동. 참고 구현 (버리는 프리뷰 아님)
    index.html                #   (단일 파일 요청 시 prototype.html)

  reference/                  # ★ 비-코드 자료 — 사람이 보는 것·소스
    BRAND_KIT.md              #   브랜드 정체성 문서 (§1–11)
    brand-tokens.json         #   tokens.css의 소스 (코드가 직접 import 안 함)
    manifest.json             #   md-compiler 캡션/순서 메타 (프로토타입 슬롯맵과 별개)
    brand-kit/                #   정체성 base PNG: logo-base·key-visual·ui-base·wordmark-base
      icon/<name>.png         #   컨셉 아이콘 (브랜드 전시물 — 제품 아이코노그래피 아님)
    page/section-*.png        #   풀페이지 목업 PNG

  candidate/                  # 탐색 스크래치 (유지 — 재시드·탐색 기록)
    logo/  icon/  brand-kit/  page/  ui-kit/
```

### 3.1 핵심 경계 (한 줄 규칙)

- **최종 코드 생성(export-component·design-generate-code)이 읽는 것** = `DESIGN.md` + `assets/`(+ 선택 `prototype/`). `view/`·`candidate/`는 사람·탐색용이라 최종 코드 생성이 무시한다. `reference/`는 **최종 코드 생성은 무시**하지만, 파이프라인 중간 단계(특히 design-md-compiler·design-html-prototype)는 `reference/`의 brand-kit·page 목업을 **컴파일/레이아웃 참고 입력**으로 읽는다 — "코드가 직접 import 하지 않는다"는 뜻이지 "아무도 안 읽는다"가 아니다.
- **확정·코드용** = `assets/`(타입별) + 루트 `DESIGN.md`. **비-코드 소스·표시물** = `reference/`. **탐색** = `candidate/`(스킬별).
- `view/`의 모든 HTML은 자산을 `../assets/..`, 비-코드를 `../reference/..`, 탐색물을 `../candidate/..` **상대경로**로 참조한다(`file://` 더블클릭으로도 동작).

### 3.2 브랜드 base vs 프로덕션 아이콘 (역할 구분 유지)

2026-06-02에서 정한 "출신·역할로 구분" 원칙은 유지하되 부모 폴더만 바뀐다:

- 컨셉 아이콘(PNG, 브랜드 전시물) → `reference/brand-kit/icon/<name>.png`
- 프로덕션 아이콘셋(SVG, currentColor, 코드 import) → `assets/icon/<name>.svg`
- 벤더 브랜드 마크(SVG, 색 보존, 코드 import) → `assets/icon/vendor/<name>.svg`

`reference/brand-kit/`은 design-brand-kit이 확정한 정체성 base 묶음 전체(로고/워드마크 base, 키비주얼, UI base, 컨셉 아이콘)를 담는 **비-코드** 네임스페이스다.

### 3.3 아이콘셋 글로브와 벤더 하위폴더 (충돌 없음)

모든 소비처가 프로덕션 아이콘셋을 `assets/icon/*.svg`(단일 `*`, **비재귀**)로 글로브하고, `build-icon-map.mjs`는 아이콘셋 소스 목록에서만 매핑을 만든다. 따라서 `assets/icon/vendor/*.svg`(하위폴더)는 프로덕션 글로브·icon-map 검증에 잡히지 않는다 — 정규화(currentColor) 차이를 깨지 않는다. **불변식:** 아이콘셋 글로브는 비재귀를 유지한다.

## 4. 경로 매핑 (OLD → NEW)

| 관심사 | OLD (현재) | NEW |
|---|---|---|
| 스펙 문서 | `DESIGN.md` (cwd 루트) | `.design/DESIGN.md` |
| 프로토타입 | `prototype/index.html` (cwd 루트) | `.design/prototype/index.html` |
| 브랜드 스펙 | `.design/BRAND_KIT.md` | `.design/reference/BRAND_KIT.md` |
| 토큰 소스 | `.design/brand-tokens.json` | `.design/reference/brand-tokens.json` |
| 컴파일 메타 | `.design/manifest.json` | `.design/reference/manifest.json` |
| 디자인 토큰 CSS | `.design/assets/tokens.css` | `.design/assets/css/tokens.css` |
| UI 킷 CSS | `.design/assets/ui-kit/ui-kit.css` | `.design/assets/css/ui-kit.css` |
| 브랜드 base 자산 | `.design/assets/brand-kit/{logo-base,wordmark-base,key-visual,ui-base}.png` | `.design/reference/brand-kit/…` |
| 컨셉 아이콘 | `.design/assets/brand-kit/icon/<n>.png` | `.design/reference/brand-kit/icon/<n>.png` |
| 풀페이지 목업 | `.design/assets/page/section-*.png` | `.design/reference/page/section-*.png` |
| 벤더 마크 | `.design/assets/vendor/<n>.svg` | `.design/assets/icon/vendor/<n>.svg` |
| 로고 확정 | `.design/assets/logo/logo.png` | (동일) |
| 아이콘셋 확정 | `.design/assets/icon/<n>.svg` · `icon-map.json` | (동일) |
| 콘텐츠 이미지 | `.design/assets/content/<slot>.<ext>` | (동일) |
| 프로토타입 슬롯맵 | `.design/assets/manifest.json` | (동일) |
| view·candidate·index.html | (동일 위치) | 내부 `<img>`·링크 상대경로만 갱신 |

### 4.1 부수 효과 (이득)

프로토타입이 `.design/` 안으로 들어오면서 자산 참조가 짧고 깨끗해진다: `prototype/index.html`(cwd 루트) → `.design/prototype/index.html`이 되어, 자산 참조가 `../.design/assets/…` → `../assets/…`로 단축된다.

`view/` HTML의 내부 참조 갱신: `../assets/brand-kit/*` → `../reference/brand-kit/*`, `../assets/page/*` → `../reference/page/*`, `../assets/tokens.css` → `../assets/css/tokens.css`, `../assets/ui-kit/ui-kit.css` → `../assets/css/ui-kit.css`. overview.html의 patch 슬롯(로고 `../assets/logo/logo.png`, 아이콘 `../assets/icon/*.svg`)은 경로 불변.

## 5. lock(확정) 의미 — 변화 없음, 목적지만 갱신

스킬별 "확정 산출물을 캐노니컬 홈으로 승격" 모델은 그대로다. 승격 목적지만 새 트리에 맞춘다:

- **design-brand-kit**: `BRAND_KIT.md`·`brand-tokens.json`을 `reference/`에, base 자산을 `reference/brand-kit/`에 저작. `tokens.css`는 lock 시 `assets/css/tokens.css`로 물질화. overview.html은 `view/`에 제자리 저작.
- **design-logo**: 고른 로고를 `assets/logo/logo.png`로 승격 + overview §6 슬롯 patch(경로 불변).
- **design-iconset**: 확정 세트를 `assets/icon/`로 승격, `assets/icon/icon-map.json` 재생성 + overview §11 슬롯 patch.
- **design-ui-kit**: `assets/css/ui-kit.css` 저작.
- **design-md-compiler**: `.design/DESIGN.md`로 컴파일(이전 cwd 루트 → 번들 안). frontmatter는 `assets/css/tokens.css`에서 재생성.
- **design-html-prototype / web-publisher**: 확정 comp(풀페이지 목업) **읽기 경로**가 `assets/**` → `reference/page/**`로 바뀐다(없으면 `candidate/page/**` 폴백 유지). 조달분은 코드가 import하므로 그대로 `assets/icon/vendor/`(벤더 마크)·`assets/content/`(콘텐츠 이미지)에 기록(`assets/manifest.json`) — 즉 **comp는 reference/에서 읽고, 조달 자산은 assets/에 쓴다**(혼동 금지). 산출물은 `.design/prototype/index.html` 빌드.
- **design-image-web / -mobile**: 풀페이지·화면 목업을 `assets/page/`가 아닌 — (현행대로 `assets/page/`에 쓰면 코드/참고 경계가 깨지므로) **`reference/page/`로 승격**. 입력 앵커는 `assets/icon/*.svg`·`assets/logo/logo.png`·`assets/css/tokens.css`.

## 6. 마이그레이션 범위 (소스 — 직접 수정)

`.design/`는 체크인 대상이 아니므로 **경로 문자열을 들고 있는 소스**를 고친다.

1. **스킬 SKILL.md + references (경로 문자열):**
   - `design-brand-kit/` — SKILL.md, `references/brand-kit-image.md`, `references/brand-kit-contact-sheet.md`, (있으면) `references/archetypes/*`
   - `design-logo/` — SKILL.md, `references/logo-sheet-html-direction.md`
   - `design-iconset/` — SKILL.md, `references/iconset-sheet.md`
   - `design-ui-kit/SKILL.md`
   - `design-md-compiler/SKILL.md`
   - `design-html-prototype/SKILL.md`
   - `design-image-web/SKILL.md`, `references/art-direction-web.md`
   - `design-image-mobile/SKILL.md`, `references/art-direction-mobile.md`
   - `design-component-export/SKILL.md`, `design-generate-code/SKILL.md` (placeholder — 입력 경로 기술)
   - `web-publisher-qa/SKILL.md`, `image-gen/SKILL.md` (`.design` 예시 경로 있으면)
2. **스크립트 (기본 경로 인자·주석):**
   - `skills/design-html-prototype/scripts/fetch-vendor-logo.mjs` — `--out` 기본/예시 `assets/icon/vendor/`
   - `skills/design-iconset/scripts/build-iconset-sheet.mjs`, `build-icon-map.mjs` — 경로 주석·기본값
   - `scripts/lib/serve-design.mjs` — 주석 예시 경로
3. **에이전트:** `agents/designer.md`, `agents/web-publisher.md`, `agents/front-developer.md`
4. **사용자 문서:** `README.md`, `docs/design/README.md`(산출물 레이아웃·파이프라인 표·심화 흐름)
5. **테스트:** `tests/skills/design-html-prototype/scripts/fetch-vendor-logo.test.mjs`(vendor 경로 기대값) 외, `assets/tokens.css`·`assets/ui-kit/ui-kit.css`·`.design/BRAND_KIT.md` 등 OLD 경로를 기대하는 테스트가 있으면 갱신.
6. **재생성:** `npm run sync`(Codex 번들 `plugins/personal/` + `codex-agents/` 갱신).

### 6.1 코드 영향 (낮음 — 확인 필요)

- `serve-design.mjs`는 디렉터리를 root 인자로 받으므로 API 변경 없음(루트 = `.design/` 유지). 주석 예시만 갱신.
- `fetch-vendor-logo.mjs`의 출력 기본 경로가 `assets/vendor/` → `assets/icon/vendor/`로 바뀐다 — 인자로 받으면 호출처(html-prototype 스펙)만, 하드코딩이면 스크립트도 갱신. 테스트 기대값 동기화.
- `build-icon-map.mjs`는 `assets/icon/${name}.svg`를 쓴다 — 아이콘셋 소스 목록 기반이라 `vendor/` 하위폴더 무영향. 비재귀 글로브 불변식(§3.3) 확인.

## 7. 결정·기본값

- **새 버킷 이름 = `reference/`** (비-코드 소스·표시물). 사용자가 `source/`·`brand/` 등으로 바꾸길 원하면 교체.
- **DESIGN.md = `.design/DESIGN.md` 단일 캐노니컬.** 위치 설정 노브 없음(근거 §8). 루트 발행본이 필요한 프로젝트가 생기면 그때 명시적 override를 좁게 문서화한다 — 파이프라인이 두 위치를 더듬게 하지 않는다.
- **CSS = `assets/css/{tokens.css, ui-kit.css}`.** 이름 유지(§4·§5 권위 참조 불변). 죽은 `ui-kit/` 중첩 제거.
- **벤더 마크 = `assets/icon/vendor/`.** 색 보존, 프로덕션 글로브 비포함.
- **`page/` 목업 = `reference/page/`.** 코드가 import 안 하는 표시물.
- **컴파일 메타 `manifest.json` = `reference/manifest.json`.** 프로토타입 슬롯맵(`assets/manifest.json`)과 이름은 같지만 폴더로 구분(컴파일 캡션/순서 vs 자산 슬롯). 혼동 우려 시 `reference/compile-manifest.json` 리네임 가능 — 기본은 유지.
- **`candidate/` 보존**(확정 후에도 삭제하지 않음).
- 라이브서버는 **루트 = `.design/`**로 기동, 루트 `index.html`이 `/view/overview.html`로 리다이렉트(2026-06-02 결정 유지).

## 8. DESIGN.md를 안에 두는 근거 (노브 미도입)

- "portable·standalone"은 **파일 내용**(frontmatter 토큰 + 산문이 self-contained)의 속성이지 위치의 속성이 아니다 — `.design/DESIGN.md`도 복사해 외부 도구에 넘기면 동일하게 동작.
- export-component 계약이 가장 단순해진다("`.design/`만 읽으면 끝"). 루트에 한 파일이 떠 있으면 읽기 분기가 둘로 갈린다.
- 번들을 한 폴더로 통째 이동/보관 가능.
- 위치 설정 노브는 DESIGN.md를 읽고 쓰는 ~6개 스킬에 "양쪽 더듬기" 분기를 강제해 이번 작업의 단순화 목표와 정면으로 충돌한다(YAGNI).

## 9. 범위 밖 (Out of Scope)

- `docs/superpowers/{specs,plans}/*` 과거 기록물 — 건드리지 않는다(당시 결정의 기록).
- 디자인 스킬의 *내용/품질 로직* 변경 — 이번 작업은 경로 규약에 한정.
- `assets/` 산출물의 실제 페이지 코드 import 방식(번들러·프레임워크별) — 다운스트림 프로젝트 몫.
- 다운스트림에서 `.design/`의 gitignore/커밋 정책 — DESIGN.md·prototype이 안으로 들어가며 "커밋되는 참고 번들"로 보는 셈이지만, 정책 판단은 다운스트림 몫.

## 10. 검증

- `npm test`(또는 `node --test "tests/**/*.test.mjs"`) — 스크립트 테스트 회귀 없음 확인(특히 vendor 경로·icon-map).
- `npm run sync` 후 생성물 일관성(Codex 번들·codex-agents) + `scripts/check-secrets.mjs` 무결성.
- 수동: 더미 `.design/` 트리로 라이브서버 루트=`.design/` 기동 → `/view/overview.html` 오픈 → `../assets/css`·`../reference/brand-kit` 상대경로 렌더 + 형제 시트 링크 동작 확인. logo/icon lock patch 후 §6·§11 누적 확인.
- 잔존 OLD 경로 grep(기록물 제외): `assets/tokens.css`·`assets/ui-kit/ui-kit.css`·`assets/vendor/`·`assets/brand-kit/`·`assets/page/`·루트 `.design/BRAND_KIT.md`·`.design/brand-tokens.json`·cwd 루트 `DESIGN.md`·`prototype/`가 소스에 남지 않았는지.
