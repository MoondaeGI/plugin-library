# `design-ui-kit` + `tokens.css` 공유 토대 — 설계

- 날짜: 2026-06-02
- 상태: 승인 대기 (사용자 리뷰)
- 범위: 디자인 파이프라인에 **UI 컴포넌트 라이브러리(HTML/CSS) 저작 스킬 `design-ui-kit`** 추가 + 모든 `.design/` HTML이 공유하는 **`tokens.css` 토큰 레이어**를 brand-kit이 생성하도록 통합

## 1. 배경 / 문제

디자인 파이프라인의 **최종 목표는 폴더 안에 실제 구현 가능한 HTML/React·Next kit**다. 현재 단계:

```
brand-kit → logo → iconset → page-image → md-compiler → (html-prototype)
```

세 가지 공백·중복이 있다:

1. **컴포넌트 층 부재** — iconset(아톰)과 page-image(완성 페이지 이미지) 사이에 "재사용 컴포넌트(버튼·인풋·카드…)" 단계가 없다. page-image는 컴포넌트 룩 참조로 `ui-base.png` 한 장만 쓰고, 구현자는 컴포넌트를 매번 새로 만든다.
2. **토큰 CSS 중복 렌더** — `.design/` 안 HTML들(overview.html·logos.html·iconset-sheet.html)이 각자 `brand-tokens.json`의 HEX·폰트를 **인라인으로 재렌더**한다. 같은 데이터를 여러 번 손으로 옮겨 전사 드리프트 위험·중복이 있다.
3. **컴포넌트는 이미지로 만들 게 아니다** — 버튼 상태×변형 매트릭스, 컨트롤(checkbox/toggle/radio) 같은 구조적 UI는 이미지 생성 시 색·정렬·텍스트가 어긋난다. iconset이 PNG→SVG 저작으로 옮긴 것과 같은 이유로, 컴포넌트도 **토큰 기반 HTML/CSS 저작**이 맞다.

## 2. 목표

- `brand-tokens.json`을 **유일한 CSS 물질화 `tokens.css`**로 brand-kit이 한 번 생성하고, 모든 `.design/` HTML이 그것을 `<link>`로 재사용한다(전사 드리프트 0, 중복 제거).
- 확정 brand kit 위에 **UI 컴포넌트 라이브러리(`ui-kit.css` + `ui-kit.html` 쇼케이스)**를 HTML/CSS로 직접 저작하는 `design-ui-kit` 스킬을 추가한다 — 페이지·React kit가 그대로 import하는 토대.
- 컴포넌트 문서화는 신규 작업이 아니라 **기존 `design-md-compiler`를 호출**해 DESIGN.md에 반영한다(스킬 비대화 방지).

## 3. 의존성 / 전제

- **선행:** 폴더 재구성 스펙(`2026-06-02-design-folder-restructure-design.md`)이 먼저 머지돼 `assets/`·`view/` 표기가 확정돼 있어야 한다. 이 스펙의 모든 경로는 그 표기를 전제한다.
- `image-gen`·`OPENAI_API_KEY` 불필요 (iconset처럼 결정적 코드 저작).

## 4. `tokens.css` 공유 토대 (brand-kit 변경)

### 4.1 위치 · 생성

- **위치:** `.design/assets/tokens.css` (top-level — 모든 view HTML·다운스트림 페이지 코드가 import하는 공유 토대).
- **생성 주체:** `design-brand-kit`. lock 단계에서 `brand-tokens.json → assets/tokens.css`를 **결정적 스크립트 `skills/design-brand-kit/scripts/tokens-to-css.mjs`**로 생성한다(LLM 손 전사 금지 → 토큰 정확도 보장).
- **내용:** `:root` 안에 (a) **brand-tokens.json에서 매핑**한 color·typography(패밀리 + 타입 스케일)·radius(+pill)·shadow·페이지 spacing(`sectionY`/`containerX`/`cardPadding`)과, (b) **생성기가 고정 관례로 추가**하는 primitive 레이어를 CSS 커스텀 프로퍼티로.

### 4.2 관례 primitive 레이어 (brand-tokens.json 불변)

컴포넌트·페이지 코드가 쓰는 **마이크로 스페이싱 스케일**(`--space-1`…`--space-8` = 4/8/12/16/24/32/48/64)과 **tint**(`--tint-primary` 등 상태칩·알림 배경용 옅은 색)는 **브랜드 판단이 아니라 거의 보편 관례**다. 따라서 **brand-tokens.json에 넣지 않고**, `tokens-to-css.mjs`가 `tokens.css`에 **고정 관례 레이어로 추가**한다(tint는 brand color에서 알파 적용해 파생).

- 근거: brand-tokens.json은 브랜드 정체성 결정만 담는다(색·타입의 느낌·페이지 리듬). 4/8/16 스텝은 brand-kit이 정할 판단이 아님 → 스키마 보강 0(YAGNI).
- 공유 위치: ui-kit만이 아니라 page·React kit 코드도 `--space-*`를 쓰므로 ui-kit 안이 아니라 **공유 `tokens.css`**에 둔다.
- 후속 여지: 특정 브랜드가 커스텀 스텝을 원하면 그때 brand-tokens.json로 승격.

### 4.3 기존 HTML 마이그레이션 (완전 통합)

`view/`의 HTML들이 토큰값 인라인 대신 `<link href="../assets/tokens.css">` + `var(--token)`을 쓰도록 갱신한다:

- `view/overview.html` (design-brand-kit)
- `view/logos.html` (design-logo)
- `view/iconset-sheet.html` / `build-iconset-sheet.mjs` (design-iconset)
- `view/directions.html` (design-brand-kit, 분위기 열림 시)

> 데이터는 여전히 `brand-tokens.json`이 SoT. `tokens.css`는 그 **유일한 CSS 뷰**이고, 각 HTML은 값을 다시 쓰지 않고 변수를 참조한다.

## 5. `design-ui-kit` 스킬

### 5.1 정체성 · 위치

- 역할: 확정 brand kit 위에 **제품 UI 컴포넌트 라이브러리를 HTML/CSS로 직접 저작**(iconset의 결정적 저작 패턴을 컴포넌트로 확장).
- 파이프라인 위치: `iconset` 다음, `page-image` 앞.

### 5.2 권위 근거 (읽기)

- **BRAND_KIT.md §10 비주얼 & UI 방향** — 카드/컴포넌트·상태 표현·컨트롤·피해야 할 요소 (핵심)
- §7 색상 · §8 타이포 (보조)
- `assets/tokens.css` (+ `brand-tokens.json`) — 모든 컴포넌트가 참조할 변수
- `assets/icon/*.svg` — 버튼·인풋·nav·alert에 박는 실제 아이콘 (iconset 산출물, currentColor)
- `assets/brand-kit/ui-base.png` — 룩 *참조* 시드 (저작 가드, 픽셀 복제 아님)

### 5.3 산출물 (lock)

- `assets/ui-kit/ui-kit.css` — 컴포넌트 class. **토큰 변수만 참조(하드코딩 HEX·px 0)**. 상단에 `@import "../tokens.css";` → `<link href="ui-kit.css">` 한 줄로 자족(페이지·React kit가 그대로 사용).
- `view/ui-kit.html` — 쇼케이스/개발자 핸드오프 보드(ui-kit.css link). 번호·라벨로 검수.
- 컴포넌트가 ~800줄 넘으면 family별 CSS로 분리.

### 5.3.1 저작 / 템플릿 / 주입 3분할 (핵심 규약)

ui-kit 산출물을 **변하는 정도**로 쪼개 각기 다르게 다룬다 (iconset과 동형 철학 — chrome은 결정적 렌더, 내용은 저작):

| 구성요소 | 변하나 | 방식 | 무엇 |
|---|---|---|---|
| **토큰 값** | 브랜드별 | **주입** | `tokens.css` — 저작/전사 안 함(§4) |
| **쇼케이스 chrome** | 안 변함(제품 무관 배관) | **템플릿** | `view/ui-kit.html`의 *껍데기* — 보드/패널/매트릭스 골격, 4그룹 섹션 스켈레톤, 번호 라벨, 헤더 밴드, **쇼케이스 전용 CSS**(`.board`·`.panel`·`.matrix`·`.swatches` 등 — `ui-kit.css` 아님) |
| **컴포넌트 specimen** | 브랜드별(§10·게이트) | **저작** | chrome 슬롯에 끼우는 실제 인스턴스(`<button class="btn …">`, quote-card 인용 등) |
| **`ui-kit.css` 컴포넌트 class** | 브랜드별(§10·게이트) | **저작** | 진짜 deliverable. 버튼 형태·radius 깊이·brand 고유 컴포넌트(quote-card·accent 토글) |

- chrome는 스킬 안 스캐폴드 `skills/design-ui-kit/templates/ui-kit-sheet.html`(슬롯 마커 포함)로 제공 → 매번 같은 보드 골격(일관성·토큰 절감).
- 컴포넌트(specimen + class)는 §10·게이트로 **저작** → 브랜드 적응성 유지. 고정 템플릿으로 박지 않는다(적응성을 죽임).
- chrome CSS도 색은 토큰 변수(`var(--color-*)`)를 쓰되 **구조는 고정**.

### 5.3.2 쇼케이스 헤더 — key-visual (선택)

- `assets/brand-kit/key-visual.png`를 **헤더 밴드에만 은은히** 블리드 가능(마스크 그라데이션, 제목 쪽은 불투명 surface로 가독 보호). brand-kit overview §1의 코너 블리드 하우스 스타일과 동형.
- **컴포넌트 패널 뒤에는 깔지 않는다** — 스와치 색·버튼 대비·상태 매트릭스 검수의 **토큰 충실도·대비를 보호**(보드의 본분). 헤더 chrome 템플릿에 key-visual 슬롯으로 둔다.

### 5.4 컴포넌트 분류 (IN / 예시 / OUT)

레퍼런스 보드의 4-그룹을 쇼케이스 최상위 섹션으로 사용: **Foundations / Core Interactive / Informational / Structural.**

| 그룹 / 항목 | 처리 |
|---|---|
| Foundations (color·typo·spacing·radius·shadow) | ✅ 포함 — `tokens.css`에서 렌더(overview와 같은 데이터의 또 다른 뷰, SoT 중복 아님) |
| Core Interactive (buttons·inputs/selects/textarea·controls checkbox/toggle/radio) | ✅ 포함 |
| Informational (badges/status chips·alerts/toasts·empty state) | ✅ 포함 |
| Structural — cards · navigation/header · table/list | ✅ 포함 |
| Dashboard Panel | ⚠️ **예시 패널로만**(컴포넌트 맥락 데모). 안의 stat 카드·table은 컴포넌트(포함), 조립된 패널은 데모. **차트/그래프 제외**(데이터·차트 영역 → 정적 플레이스홀더) |
| 마케팅 CTA 히어로 + 키비주얼 | ❌ 제외 → `design-page-image` 몫(완성 페이지 컴포지션) |

- **게이트1:** family별 컴포넌트 목록을 **넉넉하게** 제안 → 제품이 안 쓰는 것만 빼서 확정(과다 생성 방지 규율은 살리되 기본 풍성).
- **게이트2:** 핵심 스타일 방향(버튼 형태·radius·그림자 깊이)을 §10 근거로 합의.

### 5.5 상태 매트릭스 + 강제상태 class (핵심 규약)

- 쇼케이스는 **행=상태 / 열=변형** 매트릭스로 밀도 높게 배치.
- hover·focus는 의사상태(pseudo-state)라 정적으로 나란히 보이려면 **강제상태 class**가 필요. 중복을 피해 **한 규칙을 공유**한다:
  ```css
  .btn-primary:hover, .btn-primary.is-hover { ... }   /* 실동작 + 보드표시 한 소스 */
  ```
  컨트롤도 `.is-checked`·`.is-focus`·`.is-disabled`·`.is-on`(toggle) 동형.
- 인터랙티브 컴포넌트는 default/hover/focus/active/disabled(+loading/error/success 해당 시)를 모두 정의.

### 5.6 흐름 (iconset과 동형)

1. 게이트1(목록) → 게이트2(스타일 방향).
2. chrome는 `templates/ui-kit-sheet.html` 스캐폴드에서 시작(저작 안 함) → 슬롯에 컴포넌트 specimen 채우고 `assets/ui-kit/ui-kit.css` 클래스를 §10·게이트로 저작(§5.3.1).
3. 라이브서버(`serve-design.mjs`, 루트=`.design/`)로 결정적 렌더 → 번호·라벨로 외과 편집(한 번에 하나).
4. **lock** — `assets/ui-kit/` 승격 + overview §10 슬롯에 한 줄 링크 patch(§7).
5. **`design-md-compiler` 호출** — DESIGN.md를 (재)생성해 컴포넌트를 구현 규칙으로 문서화(§6).

### 5.7 품질 기준 (SKILL 내 섹션)

- **토큰 준수** — 하드코딩 HEX·폰트·radius·spacing 금지, `var(--token)`만.
- **시맨틱·접근성** — label·alt·role, focus 가시 상태, 키보드 동작.
- **대비** — 브랜드 색 조합이 본문 가독·버튼 대비를 만족.
- **반응형** — 컴포넌트는 좁은 폭에서 깨지지 않음(보드 자체는 데스크톱 핸드오프 문서라 넓어도 됨).
- **§10 "피해야 할 시각 요소" 위반 금지.**

## 6. DESIGN.md 통합 (md-compiler 호출 + 입력 변경)

- **소유자 유지:** DESIGN.md는 계속 `design-md-compiler`가 단독 생성. ui-kit은 직접 쓰지 않고 lock 후 md-compiler를 **호출**(파이프라인 핸드오프).
- **md-compiler 입력 추가:** `assets/ui-kit/ui-kit.css` · `view/ui-kit.html` · `assets/tokens.css`.
- **md-compiler §4 토큰** = `tokens.css`/`brand-tokens.json`에서, **§5 컴포넌트 규칙** = 확정된 `ui-kit.css`(권위)에서 뽑는다 — 이미지 추론이 아니라 실제 class·variant를 기록.
- md-compiler는 "있는 것만" 읽으므로 ui-kit 직후(page 단계 전)에 호출돼도 동작(페이지 섹션은 비거나 후속 보강). 재실행 시 DESIGN.md 재생성 — 자체 리뷰 게이트로 반복.

## 7. overview 통합 (§10 한 줄 링크)

- 전체 컴포넌트를 overview에 인라인하지 않는다(비대화 방지). 풀 보드는 `view/ui-kit.html`이 소유.
- overview.html §10 비주얼 & UI 방향에 마커 슬롯 `<!-- design-ui-kit:slot --> … <!-- /design-ui-kit:slot -->`을 두고, ui-kit lock 시 **"UI Kit 전체 보기 → ui-kit.html" 한 줄 링크**를 patch(folder-restructure의 patch-on-lock·멱등 규약 재사용).

## 8. 범위 밖 (Out of Scope)

- **다크 모드** — 현재 `brand-tokens.json` 단일 팔레트. 토큰이 라이트/다크로 확장되면 후속.
- **`design-html-prototype` 연동** — 지금은 없는 것으로 취급. ui-kit.css를 prototype/React가 소비하는 연결은 그 스킬을 쓸 때 별도로.
- **HTML 품질검사 subagent** — §11 후속 참조.

## 9. 변경 대상 파일

1. **신규 스킬:** `skills/design-ui-kit/SKILL.md` + **`templates/ui-kit-sheet.html`**(chrome 스캐폴드 — 보드/패널/매트릭스 골격·슬롯 마커·헤더 key-visual 슬롯·쇼케이스 전용 CSS) (+ 필요 시 `references/`, `scripts/`)
2. **design-brand-kit:** SKILL.md(tokens.css 생성 단계·spacing 스키마), `scripts/tokens-to-css.mjs`(신규), overview.html 저작이 tokens.css 소비 + §10 마커 슬롯
3. **design-logo / design-iconset:** `view/*.html`(+ `build-iconset-sheet.mjs`)가 tokens.css 소비
4. **design-md-compiler:** SKILL.md 입력에 ui-kit.css·ui-kit.html·tokens.css 추가, §4/§5 근거 변경
5. **에이전트·문서:** `agents/designer.md`(파이프라인에 ui-kit 추가), `README.md`·`docs/design/README.md`
6. **재생성:** `npm run sync` (Codex 번들 `plugins/personal/`·`codex-agents/` 갱신)

## 10. 검증

- `npm test` — 스크립트 회귀 없음(특히 `tokens-to-css.mjs` 신규 테스트, `build-iconset-sheet.mjs` 갱신 시).
- `tokens-to-css.mjs`: `brand-tokens.json` 입력 → 기대 `:root` 출력 단위 테스트.
- 수동: 더미 `.design/`로 라이브서버(루트=`.design/`) 기동 → `view/ui-kit.html` 오픈 → tokens.css 변수 렌더·매트릭스 강제상태·iconset 아이콘 인라인 확인. lock 후 overview §10 링크 patch + 자동 새로고침 확인.
- 잔존 점검: `view/` HTML에 하드코딩 HEX·폰트·px가 (토큰 대신) 남지 않았는지 grep.

## 11. 관련 / 후속

- **HTML 품질검사 subagent (후속 별도 brainstorm):** `.design/`가 산출하는 HTML(overview·logos·iconset-sheet·ui-kit) 전반을 **디자인 품질 렌즈**(토큰 준수·시맨틱/접근성·대비·반응형·§10 위반)로 자문(advisory) 검수하는 공유 subagent. 범용 `code-review`(버그·정리)와 렌즈가 다름. 처음엔 판단형 subagent, 기계 체크(대비·하드코딩)는 필요해지면 스크립트로 분리(YAGNI). 통합 지점 = HTML 산출 스킬의 lock 게이트(비차단). 후보명: `html-reviewer` / `html-checker` / `html-qa`(파이프라인 prefix 없음 — 한 스킬 전용이 아니므로). ui-kit이 첫 "진짜 CSS" 산출물이라, ui-kit 완성 후 설계하면 검사 대상이 또렷해짐 → **순서: design-ui-kit 먼저 → 그다음 subagent.**
