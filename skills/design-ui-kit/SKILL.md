---
name: design-ui-kit
description: 확정된 brand kit 위에 제품에서 바로 쓰는 UI 컴포넌트 라이브러리를 HTML/CSS 코드로 직접 저작하는 스킬. BRAND_KIT.md §10(비주얼·UI 방향)·§7 색·§8 타이포·assets/css/tokens.css·assets/icon/*.svg를 권위 근거로, 컴포넌트 목록을 4그룹(Foundations/Core Interactive/Informational/Structural)으로 제안·확정하고(게이트1), 스타일 방향을 합의한 뒤(게이트2), 토큰 변수만 참조하는 assets/css/ui-kit.css를 저작한다. 쇼케이스 view/ui-kit.html 마크업 저작·레이아웃 QA는 web-publisher 서브에이전트에 위임한다. lock 후 design-md-compiler를 호출해 DESIGN.md에 반영한다. image-gen·OPENAI_API_KEY 불필요.
---

# Design UI Kit

당신은 확정된 브랜드 킷에서 출발해 **제품 코드에 바로 붙이는 일관된 UI 컴포넌트 라이브러리**를 HTML/CSS로 저작하는 디자인 시스템 엔지니어다.

## 목적

`design-brand-kit`(과 보통 `design-logo`·`design-iconset`)이 확정된 뒤 사용한다. brand kit의 §10은 비주얼·UI 방향을, §7·§8은 색·타이포를 결정으로 박아둔 상태다. 여기서 그 결정을 따라 **제품에서 실제로 쓸 버튼·입력·카드·배지·네비·테이블·알림 등 컴포넌트를 토큰 기반 CSS class로 직접 저작**하고, 개발자 핸드오프용 **쇼케이스(view/ui-kit.html)**로 한눈에 보여준다. 품질 기준은 "예쁜 목업 이미지"가 아니라 **그대로 복사해 쓰는 진짜 코드**다 — 하드코딩 값 0, 토큰 변수만 참조한다.

**이미지가 아니다:** 컴포넌트는 PNG로 만들지 않는다. `design-image-web`은 마케팅/페이지 레이아웃 이미지를, 이 스킬은 재사용 CSS 컴포넌트를 만든다. 둘은 보완 관계다.

## 전제

- `design-brand-kit` 산출물 중 `.design/BRAND_KIT.md`·`.design/brand-tokens.json`·`.design/assets/css/tokens.css`가 있으면 그걸 쓴다. **tokens.css가 없으면** brand-kit lock이 생성하므로, brand-kit을 먼저 lock하라고 안내한다(또는 `tokens-to-css.mjs`로 생성).
- **이미지 생성·`OPENAI_API_KEY` 불필요** — 컴포넌트는 LLM이 HTML/CSS를 직접 저작한다. 쇼케이스만 chrome 템플릿 + serve-design로 결정적 렌더한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

권위 원본은 md/tokens/icon이다.

- `.design/BRAND_KIT.md` — **§10 비주얼·UI 방향(권위)**: 전체 분위기·카드/컴포넌트·상태 표현·컨트롤·피해야 할 시각 요소. + §7 색·§8 타이포·§1/에센스·금지 패턴.
- `.design/assets/css/tokens.css` — **컴포넌트가 참조할 토큰 변수의 단일 권위**(색·폰트·radius·shadow·spacing·tint). (+ `brand-tokens.json` 원본.)
- `.design/assets/icon/*.svg` — 컴포넌트 안 아이콘은 이 확정 SVG를 **인라인**(currentColor)으로 쓴다. 없으면 텍스트/유니코드로 대체하거나 design-iconset 먼저 안내.
- 참조 시드(분위기 확인용, 값 추출 아님): `.design/assets/brand-kit/ui-base.png`·`key-visual.png`.

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  assets/
    css/
      ui-kit.css                 # 컴포넌트 class — 토큰 변수만(하드코딩 HEX·px 0). 상단 @import "tokens.css";
  view/
    ui-kit.html                  # chrome 템플릿 기반 쇼케이스(개발자 핸드오프). ../assets/ 상대경로.
  candidate/
    ui-kit/
      ui-kit-briefs.md           # 읽은 §10 근거·확정 컴포넌트 목록·스타일 방향·제약
```

- `ui-kit.css`는 `assets/css/`에 처음부터 제자리 저작(별도 승격 복사 없음 — lock은 승인). `~800줄` 초과 시 family별 파일로 분리하고 `ui-kit.css`가 `@import`로 모은다.
- `ui-kit.html`은 `view/`에서 chrome 템플릿(`templates/ui-kit-sheet.html`)을 복사해 시작하고 slot을 채워 저작한다.

## 3분할 규약 (중요)

UI 킷은 세 층으로 나뉜다 — **무엇을 저작하고 무엇을 주입받는지** 혼동하지 않는다:

| 층 | 출처 | 저작 여부 |
|---|---|---|
| **토큰값**(실 HEX·실 px·실 폰트) | `assets/css/tokens.css` 주입 (`var(--token)`) | 저작 안 함 — 참조만 |
| **chrome**(보드/패널/매트릭스 골격·쇼케이스 CSS·헤더 key-visual 슬롯) | `templates/ui-kit-sheet.html` | 저작 안 함 — 복사 후 slot만 채움 |
| **컴포넌트 class**(`ui-kit.css`) | LLM(이 스킬)이 저작 | **저작함** |
| **쇼케이스 마크업**(`view/ui-kit.html` slot 채우기) | web-publisher 서브에이전트가 저작·QA | **위임** — 이 스킬은 슬롯 스펙만 정의 |

**변수 네이밍 계약:** tokens.css가 내보내는 이름이 권위다. ui-kit.css는 **정확히 그 이름만** 쓴다.
- color `--color-<kebab(key)>` (예: `--color-surface-alt`·`--color-text-muted`·`--color-background`)
- typography `--font-<key>` (display/heading/body/mono/accent)
- radius `--radius-<key>` + `--radius-pill: 999px`
- shadow `--shadow-<key>`
- page spacing `--space-section-y`·`--space-container-x`·`--space-card-padding`
- micro spacing(고정 관례) `--space-1`…`--space-8` = 4/8/12/16/24/32/48/64
- tint(파생) `--tint-primary|accent|success|warning|danger`
- **tokens.css에 없는 키는 만들지 않는다**(`--color-primary-dark/-light`·`--color-bg` 금지). 버튼 active 등 음영은 `filter:brightness()` 또는 tint로 처리.

## 컴포넌트 분류 (4그룹)

쇼케이스 4패널과 1:1 대응한다. 게이트1에서 이 분류로 목록을 제안·확정한다.

| 그룹 | IN(기본 포함) | 예시(조건부) | OUT(이 스킬 아님) |
|---|---|---|---|
| **1 Foundations** | 색 스와치·타이포 스케일·radius·shadow·spacing 시연 | — | 토큰 정의 자체(tokens.css 소관) |
| **2 Core Interactive** | button(variant×state)·input·textarea·select·checkbox·radio·toggle·badge/chip·filter chip(필터 토글 — 태그형 .chip과 구분) | slider·stepper·search field | 폼 검증 로직 |
| **3 Informational** | card·alert/banner·toast·tooltip·empty state·tag | stat tile·avatar | 차트(데이터 시각화) |
| **4 Structural** | navbar/topbar·navbar 풀블리드 변형(app bar)·tabs·breadcrumb·table·pagination·list·footer·section header | sidebar·dashboard 패널(예시 1개, 차트 제외) | 마케팅 히어로/CTA 섹션 → design-image-web |

- table·nav·card·empty·toast는 **기본 포함**(IN). dashboard 패널은 레이아웃 예시 1개만(내부 차트는 제외).
- 마케팅 히어로·풀 페이지 레이아웃은 만들지 않는다 → `design-image-web` 몫.
- footer·app bar·section header는 **반복되는 구조 chrome**이라 IN. 단 "마케팅 히어로·풀페이지 레이아웃"은 여전히 제외(→ `design-image-web`). footer는 chrome이지 마케팅 히어로가 아니다.
- **셸(site/app/minimal 등 header·sidebar·footer 조합 레이아웃)은 이 스킬 범위 밖**이다 — 페이지 조립(프로토타입·페이지 코드)의 몫이며 별도 설계로 다룬다. 이 스킬은 셸을 이루는 *블록*만 어휘로 제공한다.

## 흐름 (디자이너 협업 루프)

### Phase 0 — 전제 감지
- `.design/BRAND_KIT.md`·`brand-tokens.json`·`assets/css/tokens.css` 존재 확인. tokens.css 없으면 brand-kit lock 안내(또는 생성). icon 없으면 design-iconset 안내(아이콘 쓰는 컴포넌트 한정).

### Phase 1 — 흡수 → 게이트1(목록) → 게이트2(스타일 방향)
1. **§10 흡수**: §10(분위기·카드·상태·컨트롤·피해야 할 요소)·§7·§8·tokens.css를 읽어 **컴포넌트 가족 계약**(버튼 형태·radius 깊이·그림자·상태 색 매핑)을 메모(`candidate/ui-kit/ui-kit-briefs.md`).
2. **게이트1 — 목록**: 4그룹으로 컴포넌트 목록을 **넉넉히** 제안하고 "안 쓸 것만 빼자"로 좁혀 **확정(잠금)**. 추측으로 과다 추가 금지. ui-kit은 **조건부 어휘**다 — 강제 포함 컴포넌트는 없고, *그 제품 화면이 필요로 하는 것*만 저작한다. sidebar는 app/console 화면이 있을 때만, footer는 site/landing 화면이 있을 때만, section header는 제목+액션 섹션이 있는 화면에서만 포함한다.
3. **게이트2 — 스타일 방향**: 핵심 스타일 결정(버튼 형태·기본 radius·그림자 깊이·테두리 유무)을 §10 근거로 합의한 뒤 저작 시작. *"왜 이 형태인가"를 먼저 합의.*

### Phase 2 — 저작 → 쇼케이스 검수 → 편집 → lock
4. **ui-kit.css 저작**: 확정 목록을 토큰 변수만으로 작성. 상단 `@import "tokens.css";`. **하드코딩 HEX·px 0**(spacing도 `--space-*`). 매트릭스용 강제상태 class를 의사상태와 **규칙 공유**:
   ```css
   .btn-primary:hover, .btn-primary.is-hover { filter:brightness(.94); }
   .input:focus, .input.is-focus { outline:2px solid var(--tint-primary); }
   ```
   컨트롤은 `.is-checked`·`.is-on` 등.

   **신규 구조 컴포넌트 저작 가이드**(해당 제품 화면이 필요로 할 때만):
   - **footer**(`.footer` + `.footer-brand`·`.footer-col`·`.footer-bottom`): 브랜드 컬럼 + 링크 컬럼 + (선택)뉴스레터(`.field`·`.input`·`.btn` 재사용) + 하단 바. surface/틴트 배경 + 상단 헤어라인. 마케팅 히어로 아님.
   - **navbar 풀블리드 변형**(`.navbar-bar`): 기존 `.navbar` 내부요소(`.brand`·`.nav-links`·`.btn-icon`)는 그대로, 컨테이너만 풀블리드 sticky·테두리/radius 제거·하단 헤어라인. 새 컴포넌트가 아니라 변형.
   - **section header**(`.section-head` + `.section-title`·`.section-action`): 제목 + 액션 링크("전체보기 →"). 액션 아이콘은 `assets/icon/chevron-right.svg` 인라인.
   - **filter chip**(`.chip-filter` + `.is-active`): 태그형 `.chip`과 구분되는 토글 필터. 기본=surface/테두리, 활성=primary-dark/surface 텍스트. 의사상태·강제상태(`.is-active`) 규칙 공유.
   - **sidebar**(`.sidebar` + `.sidebar-nav`·`.sidebar-link`·`.sidebar-link.is-active`): app/console 화면 전용. 세로 네비, 활성 링크 강조. **SugarLoop류 스토어프론트엔 저작하지 않는다.**
5. **쇼케이스 스펙 정의 → web-publisher 위임**: `view/ui-kit.html`의 마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 맡는다. 이 스킬은 *무엇을 넣을지*(아래 슬롯 스펙)를 정해 넘긴다 — 직접 div를 저작하지 않는다. web-publisher를 직접 부를 수 없으면(서브에이전트로 실행 중) 이 스펙과 "쇼케이스는 web-publisher로 빌드해야 한다"는 점을 메인 세션에 넘긴다. 넘길 스펙: `templates/ui-kit-sheet.html`을 `view/ui-kit.html`로 복사해 slot을 채운다 —
   - `slot:font-links`: brand-tokens.json typography(display/heading/body/mono) **+ `wordmark.font`(있으면)**의 실폰트 CDN `<link>`를 모두 주입(`../references/design/font-catalog.md` 기준 — 전용 로고타입 폰트 누락 시 시스템 폴백으로 깨짐).
   - `slot:masthead`: 심볼 자산(`../assets/logo/logo.png`)이 있으면 `.lockup`(심볼 + `.wordmark`)으로, 없으면 `.wordmark` 단독으로 저작한다 — 폰트 모드면 `<span class="wordmark">브랜드명</span>`(`.wordmark`는 tokens.css 정의 — 레터링 재구현 금지), 이미지 모드면 `<img src="../assets/brand-kit/wordmark-base.png">`. `.lockup*`도 tokens.css가 정의(재구현 금지)이며 `slot:font-links`의 워드마크 폰트 포함(기존)을 유지한다. **key-visual `--kv` 주입은 현행 유지** — `.board-head`에 `style="--kv:url('../assets/brand-kit/key-visual.png')"`로 은은히 주입(헤더 밴드 한정).
   - `slot:foundations|core|informational|structural`: 각 그룹 specimen. **매트릭스(행=상태×열=변형)**로 변형·상태를 한눈에. 번호/라벨로 검수 가능하게. 신규 구조 컴포넌트는 대응 패널에 specimen으로 노출 — **core**: filter chip(`.chip-filter` 기본/활성), **structural**: footer·navbar 풀블리드 변형·section header·(제품에 있으면) sidebar. 템플릿은 4패널 고정 chrome이므로 새 패널을 만들지 않고 기존 슬롯에 채운다.
   - 아이콘은 `assets/icon/*.svg`를 **인라인**(currentColor).
   - **key-visual은 헤더 밴드에만**(패널 뒤 금지 — 토큰 충실도·대비 보호).
6. **라이브 프리뷰**: `node ../../scripts/lib/serve-design.mjs <cwd>/.design`(루트=`.design/`). 시트 직접 URL `http://localhost:5500/view/ui-kit.html`. 처음 제시 시 **최초 1회만 사용자 확인** 후 백그라운드 기동, lock/종료 시 닫는다.
7. **편집 루프**: 번호/이름 지목 → 외과 편집 → 자동 새로고침. **`ui-kit.css` class 편집은 이 스킬**이, **`ui-kit.html` specimen 마크업 편집·레이아웃 깨짐 수정은 web-publisher**가 한다(쇼케이스 저작자가 일관되게 고치도록).
8. **lock (승인 + overview 슬롯 + md-compiler 호출)**:
   - `assets/css/ui-kit.css`·`view/ui-kit.html`이 이미 캐노니컬 홈에 있다(별도 복사 없음). `ui-kit-briefs.md`는 `candidate/ui-kit/`에 git 추적.
   - `view/overview.html`의 `<!-- design-ui-kit:slot -->…<!-- /design-ui-kit:slot -->` 사이를 **UI 킷 한 줄 링크**(`<a href="ui-kit.html">UI Kit →</a>`)로 멱등 외과 치환(마커 없으면 §10 끝에 삽입). overview를 컴포넌트로 부풀리지 않는다.
   - **`design-md-compiler`를 호출**해 DESIGN.md를 만든다/갱신한다. 이 스킬은 DESIGN.md를 직접 쓰지 않는다 — md-compiler가 단일 소유자이며, ui-kit.css를 §5 컴포넌트 규칙의 권위 입력으로 읽는다.
   - 라이브 프리뷰 서버가 떠 있으면 종료.

## 품질 기준 / 금지 사항

- **토큰 준수**: ui-kit.css에 하드코딩 HEX·px·폰트명 0. 전부 `var(--token)`. tokens.css에 없는 변수 신설 금지.
- **시맨틱/접근성**: 폼 컨트롤에 `<label>`·아이콘 `aria-hidden` 또는 `aria-label`·인터랙티브에 `role`·focus 가시(`:focus-visible`). 색만으로 상태 구분 금지(아이콘·텍스트 병행).
- **대비**: 텍스트/배경 대비 확보(§10 분위기 안에서). key-visual 헤더 밴드는 제목 쪽 불투명 surface로 가독 보호.
- **반응형**: 컴포넌트는 컨테이너 폭에 깨지지 않게(매트릭스 grid는 좁아지면 1열).
- **§10 "피해야 할 시각 요소" 금지**를 그대로 지킨다.
- 컴포넌트를 이미지로 만들지 않는다(마케팅 페이지 → design-image-web). DESIGN.md를 직접 쓰지 않는다(→ design-md-compiler).
- 권위 원본은 md/tokens/icon — 계약과 어긋나면 그쪽이 정답.
