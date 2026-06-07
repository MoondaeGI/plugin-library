# design-page-image → design-image-web + design-image-mobile 분할 재설계

- 최초: 2026-06-04 (섹션별 이미지 설계) — main에 v1 구현·머지 완료
- 개정: 2026-06-05 (**산출 단위를 'UI 섹션'에서 '풀페이지 목업'으로 전환**) — 이 문서가 살아있는 단일 소스. v1(섹션별)은 git 히스토리에 보존.
- 상태: 개정 설계 확정 (델타 구현 계획 대기)
- 소유: designer 에이전트의 선택 다운스트림 단계
- 대체 대상: `skills/design-page-image/` (placeholder · 제거됨)

## 개정 요약 (v1 → v2)

v1은 외부 참조(doc2/doc3)의 "섹션 1장 = 이미지 1장" 철학을 충실히 따라 **UI 섹션별 이미지**를 냈다. 그러나 실제 목적은 **HTML 구현(web-publisher/`design-html-prototype`) 전에 이미지로 페이지 룩을 탐색**하는 것이다(HTML만으로는 디자인 다양성에 한계가 있어, 이미지로 더 다양한 방향을 빠르게 본다). 섹션 조각은 이 목적에 맞지 않는다 — 페이지를 **한 맥락의 풀페이지 목업**으로 봐야 룩 판단이 된다.

핵심 변경: **산출 단위(섹션 → 풀페이지 목업)** · **포지셔닝(html-prototype 직전 탐색 단계)** · **발산(풀페이지 방향 3~4개 변주)** · **포맷(세로 ≤3:1 tall comp)** · **네이밍**. 유지: image-gen 배선 · DESIGN.md 바인딩 · 자산 `--image` 앵커 · Phase 0 · 라이브 프리뷰 · self-contained references · 분할 자체.

**검증 (2026-06-05 dry-run)**: 실제 DESIGN.md(SugarLoop 디저트 커머스)로 1:3 `1280×3840` `--quality low` 1장 생성 → ① 1:3 사이즈를 API가 수용 ② 한 장에 nav·히어로·카테고리탭·3열 제품그리드·풀쿼트·선물배너·푸터가 **하나의 일관된 페이지**로 ③ 제목·버튼·제품명·가격·풀쿼트 **한국어 가독**(푸터 잔글씨만 뭉갬 — 목업엔 충분, 최종 텍스트는 HTML) ④ 토큰 바인딩(웜 크림·딥로즈·소프트 카드) 반영. **풀페이지 전제 성립.** 비용: low 1:3 장당 ~$0.02–0.03, high ~$0.45–0.52(비표준 사이즈라 출력토큰≈픽셀면적 기준 추정; 공식 레이트 이미지출력 $30/1M).

## 1. 배경 / 동기

웹과 앱은 아트디렉션·포맷·리뷰 단위가 근본적으로 달라(세로 풀페이지 웹 컴프 vs 세로 폰 화면, 페이지 섹션 구성 vs 화면 플로우), 단일 스킬로 묶으면 두 도메인의 규칙이 섞여 흐려진다. 그래서 **두 self-contained 스킬로 분할**한다:

- `design-image-web` — 랜딩/대시보드/마케팅 등 **웹 페이지의 풀페이지 목업 이미지**(세로 ≤3:1 한 컴프)
- `design-image-mobile` — iOS/Android/크로스플랫폼 **앱 화면·플로우 목업 이미지**(화면=한 장)

**포지셔닝**: designer 핵심 파이프라인(`…md-compiler`) *이후*, **`design-html-prototype`(web-publisher) 직전**의 선택 탐색 단계. 확정 목업은 `assets/page/`에 lock되어 web-publisher가 html-prototype에서 **비주얼 타깃**으로 읽는다(이미지 = 탐색/레퍼런스, 풀길이 정밀본·구현은 HTML 몫).

**분할 vs 단일 트레이드오프**: 두 스킬은 프로세스(Phase 0·발산 리뷰 루프·lock·레이아웃)가 대부분 동일하고 생성 메커니즘도 둘 다 `image-gen` gpt-image-2로 같다. 그럼에도 분할하는 근거는 **아트디렉션 도메인 분리**다 — 웹 풀페이지 안목과 모바일 화면 안목(플랫폼 모드·세이프에어리어·목업)은 서로 무관해 한 스킬에 섞으면 인지부하가 크다. 도메인이 다른 art-direction을 각 스킬 references로 빼는 것도 이 분리를 따른다.

## 2. 참조 문서 평가 (채택/버림)

| 문서 | 정체 | 판단 |
|---|---|---|
| SKILL(2) `imagegen-frontend-web` | 웹 이미지 아트디렉션(조합형 변주 엔진·히어로 구도 편향 차단·anti-AI-slop·팔레트 규율) | **채택 — 안목만.** 단 **"섹션 1장=이미지 1장" 규칙은 반전**해 채택한다 — 우리는 한 페이지를 한 컴프로 본다(아래 2.2). |
| SKILL(3) `imagegen-frontend-mobile` | 앱 화면·플로우 아트디렉션(플랫폼 모드·세이프에어리어·디바이스 목업 프레임·플로우 논리·가독성·아이코노그래피) | **채택 — 안목만.** 모바일은 원래 화면=한 장이라 이 철학과 정합. |
| SKILL(4) `gpt-taste` | **이미지 스킬 아님** — React/Tailwind/GSAP **코드 생성** 스킬 | **제외.** 도메인이 코드(web-publisher/front-developer 몫). anti-slop은 이미 SKILL(2)가 커버. |

### 2.1 채택할 것 (→ 각 스킬 `references/art-direction-*.md`로 정제)
- 조합형 변주 엔진(테마·타이포·히어로·섹션 시스템 등에서 1개씩 선택해 일관 적용)
- 히어로 구도 편향 차단(text-left/image-right 기본값 금지), 구도 다양성
- anti-AI-slop 카탈로그(레이아웃/비주얼/타이포/콘텐츠/밀도 slop)
- 섹션 리듬·여백 규율, 팔레트/그라데이션 규율
- (모바일 전용) 플랫폼 모드·세이프에어리어·디바이스 목업 프레임·화면 플로우 논리·텍스트 가독성·아이코노그래피 규율

### 2.2 버릴 것 / 반전할 것
- **반전 — "섹션 1장 = 이미지 1장" / "풀페이지를 한 장에 담지 마라"**: doc2는 구현-레퍼런스 충실도를 위해 섹션 분할을 강제했다. 우리 목적은 *탐색 목업*이라 충실도보다 **한 맥락의 풀페이지**가 중요하다. → **주의: `art-direction-web.md`는 §1~§9가 통째로 "섹션 단위" 골격**(Section System·섹션별 구도 앵커·섹션 간 리듬·"다른 섹션 이미지와 일관")이라, 포맷 절 두 개만 고치는 게 아니라 **문서 골격을 풀페이지 기준으로 재작성**해야 한다. 보존: 조합형 안목·anti-AI-slop·히어로 규칙·팔레트/그라데이션 규율·DESIGN.md 바인딩. 전환: 섹션-단위 구성/리듬/일관성 시스템 → **한 페이지 안의 구성/리듬/일관성**.
- **버림 — 자율 일괄 생성 워크플로** ("질문 없이 N장 뱉어라") → 우리는 게이트 + 발산 라운드.
- **버림 — 브랜드/카피/팔레트 창작** ("팔레트를 골라라"·가짜 브랜드/카피) → DESIGN.md 토큰 바인딩.
- 자기참조 문구 및 doc4 전체.

## 3. 공통 설계 (두 스킬 공유 철학)

- **DESIGN.md를 단일 시드로 바인딩.** frontmatter의 진짜 HEX·실폰트, §1 제품명, §3 시각 방향, §6 페이지 섹션 규칙, §8 이미지 에셋 규칙, §11 anti-slop을 근거로 프롬프트를 구성. 값을 지어내지 않는다.
- **확정 자산을 `--image` 앵커로 주입.** `assets/logo/logo.png`·`assets/icon/*.svg`·`assets/brand-kit/{ui-base,key-visual}.png`를 레퍼런스로 첨부해 생성물이 실제 브랜드를 입게 한다. candidate 시안·컨셉 아이콘(`brand-kit/icon/*`)은 사용하지 않는다.
- **산출 단위 = 풀페이지 목업.** 한 타깃 = 히어로+사용자가 고른 섹션이 한 맥락으로 이어진 **세로 ≤3:1 컴프 한 장**(웹) / **화면 한 장**(모바일).
- **발산으로 다양성 확보.** design-logo처럼 한 라운드에 **풀페이지 방향 3~4개를 개별 컴프로** 만들어 고르게 한다(자율 일괄 생성 아님 — 게이트 안의 발산).
- **비용 규율.** 발산·수렴 라운드는 `--quality low`(1:3 장당 ~$0.02–0.03), **확정본만 `--quality high`**(~$0.5). 한 타깃 총 ~$1–1.5. 존 컴프는 정말 필요할 때만(곱셈 비용 억제).
- **생성기는 공유 `image-gen`** (gpt-image-2 불투명 사진/목업, 사전 키검증 금지 — 부재 시 스크립트가 안내하며 실패).
- **한국어**로 소통하고 이미지 안 텍스트도 한국어로 렌더.
- 각 스킬은 **self-contained**: 아트디렉션을 SKILL.md에 inline하지 않고 자기 폴더 `references/`에 둔다(SKILL.md는 프로세스 골격만). 근거는 기존 디자인 스킬의 실제 배치 패턴 — brand-kit·logo·iconset이 모두 *그 스킬만의* 아트디렉션을 자기 `references/`로 뺀다. 공유 `references/design/`로 승격하지 않는 이유는 **소비자가 각 스킬 하나씩**이기 때문.

## 4. Phase 0 게이트 (DESIGN.md 부재 시 단계적 폴백)

design-logo Phase 0와 동형. 시작 시 필수 (v1 그대로 유지):

1. `DESIGN.md`(cwd 루트) **있음** → 시드로 사용, 본 흐름 진행.
2. **없음** → "기존 `design.md`/디자인 문서가 있으면 주세요" 요청.
3. **그마저 없음** → `.design/` 진도 감지 후 추천: `tokens.css`/`ui-kit.css`/`BRAND_KIT.md`만 있고 DESIGN.md 없음 → "`design-md-compiler` 먼저" / `BRAND_KIT.md`까지만 → 다음 단계 추천 / 진도 없음 → `design-brand-kit` 권유 또는 최소 Q&A(추측 금지, `candidate/page/page-briefs.md`에 기록).

DESIGN.md 없이 최소 Q&A로 진행 시 토큰 바인딩이 약해지므로 그 점을 명시한다.

## 5. 산출물 레이아웃 (타깃 slug 네임스페이스)

서로 다른 타깃 페이지(예: `login`, `dashboard`)가 겹치지 않도록 **모든 산출물을 slug·플랫폼 파일명으로 가른다.** 폴더 층 없이 평면.

```
.design/
  view/
    page-web-<slug>.html         # 타깃별 발산 시트(방향 변주 나열 → 확정 컴프). 예: page-web-landing.html
    page-mobile-<slug>.html      # 예: page-mobile-onboarding.html
  candidate/page/
    page-briefs.md               # 모든 타깃 공통 출처 로그(타깃·고른 섹션·확정 방향). md-compiler가 읽는 산문 단일 출처
    landing-web-r1-01.png  landing-web-r1-02.png …   # 발산 라운드 변주 (--auto-version)
    onboarding-mobile-home-r1-01.png …               # 모바일은 화면별 발산
  assets/page/
    landing-web.png              # 확정 풀페이지 목업 (타깃당 1장)
    landing-web-pricing.png      # (선택) 독립 존 컴프 (1:3 초과분만)
    onboarding-mobile-home.png   # 모바일 확정 화면
```

- **확정 파일명**: 웹 = `<slug>-web[-<zone>].png` (메인 페이지 목업 + 선택 존 컴프). 모바일 = `<slug>-mobile-<screen>.png` (화면별).
- **발산 변주 파일명**: `<slug>-<platform>[-<screen>]-r<N>-<NN>.png` (라운드 N, 변주 NN). `--auto-version`으로 누적.
- **slug**: 사용자가 페이지 요청 시 스킬이 제안·확정(게이트1). 한국어 요청이면 영문 slug 제안. 기존 파일 충돌 시 경고하고 "덮어쓸까/새 이름?" 확인.
- **깊이는 한 층** — 폴더 네임스페이스 없이 파일명으로 가른다. 두 스킬이 같은 `candidate/page/`·`assets/page/`에 쓰지만 플랫폼이 파일명에 박혀 안 겹친다.
- **라이브 URL은 타깃당 하나**(`page-<platform>-<slug>.html`).
- **md-compiler 호환**: `assets/page/` 평면 → 기존 `assets/page/*.{png,…}` glob 그대로. **md-compiler는 파일명을 파싱하지 않는다**(산문 컴파일러). 의미는 `candidate/page/page-briefs.md` 산문에서 읽는다. 그룹핑 메커니즘 신설 없음.
- `view/`의 `<img>`는 `../candidate/page/...` 상대경로. 시트는 tokens.css `var(--token)` 렌더.

## 6. 웹 vs 모바일 차이

| | **design-image-web** | **design-image-mobile** |
|---|---|---|
| 산출 단위 | **풀페이지 목업 한 컴프**(히어로+고른 섹션이 한 맥락) | **화면 한 장**(원래 화면=목업) |
| 게이트1 | 타깃 slug + **DESIGN.md §6에서 이 컴프에 담을 섹션을 사용자가 선택**(1:3 분량). 1:3 초과 하단(가격표·푸터 등)은 **필요시 독립 1:3 존 컴프**로 따로(연속 슬라이스 체이닝 안 함 — §9) | 타깃 slug + **화면 플로우를 사용자와 협업 확정**. DESIGN.md엔 앱 화면 정의가 구조적으로 없어(§6은 웹 섹션) §3 "지어내지 않는다"의 **명시적 예외** — LLM 단독 창작 금지·사용자 확정 필수 |
| 포맷 | 세로 ≤3:1 풀페이지 컴프(예 `1536x3840`) | 세로 폰 목업(`1024x1536`), **디바이스 프레임 기본 on** |
| 아트디렉션 ref | `references/art-direction-web.md` (포맷·구성 절을 풀페이지로 반전) | `references/art-direction-mobile.md` (대부분 유지 — 이미 풀화면) |
| 모델 | gpt-image-2 불투명, 변 16의 배수·최대 3840·≤3:1 | gpt-image-2 불투명 |

**"한 맥락"의 정직한 한계**: dry-run에서 1:3 한 컴프에 **히어로+5섹션이 일관되게** 들어갔다. 그 분량까지는 "한 맥락" 가치가 완전히 성립한다. 그러나 더 긴 마케팅 페이지(6~8섹션 이상)는 1:3로도 넘쳐 **독립 존 컴프로 분절**되고, 그 경우 "한 맥락"은 *부분적으로만* 성립한다(존 간 일관성은 발산 방향·토큰으로 잡되 이음새는 없음). 즉 이미지는 **상단 핵심 룩 탐색**에 집중하고, 풀길이 정밀본은 HTML(`design-html-prototype`)이 만든다 — 이미지로 8섹션을 완전 재현하려 하지 않는다(§9).

## 7. 리뷰 루프 (발산 방식, design-logo 동형)

1. **게이트1 — 구성 확정**: 타깃 slug + (웹) 컴프에 담을 섹션 선택 / (모바일) 화면 플로우 협업 확정. 확정 전 이미지 0장.
2. **게이트2 — 방향 합의**: art-direction ref의 조합형 방향(테마·구도·히어로 스케일 등)을 제시·합의.
3. **발산 라운드**: 풀페이지 방향 **3~4개를 개별 컴프로** `--quality low`로 생성(서로 다른 방향은 병렬 백그라운드) → `view/` 시트에 번호로 나열 → 라이브 프리뷰(최초 1회 서버 기동, 사용자 확인 후 백그라운드).
4. **선택·수렴**: "#N 좋다" → (a) **수렴 라운드**(그 방향 3~4 변주, #N을 `--image` 앵커로 첨부, 시트 교체) 또는 (b) **바로 확정**. "다시 더 다르게" → 발산 재생성, 시트 교체.
5. **다듬기(한 번에 한 가지)**: 확정 후보를 `--image`로 첨부해 한 번에 한 가지만 외과 편집(`--auto-version`). 확정 직전 1장만 `--quality high`로 다시 떠 잔글씨 품질을 올린다.
6. **lock**: 확정 컴프를 `assets/page/<slug>-<platform>[-<zone>|-<screen>].png`로 복사. 시안은 candidate 보존. `page-briefs.md`에 타깃·고른 섹션·확정 방향을 **산문 기록**. (웹 긴 페이지의 독립 존 컴프는 같은 루프를 별 타깃처럼 반복.)
7. lock 후 라이브 서버 종료 + 안내: **확정 목업이 `design-html-prototype`의 비주얼 타깃**임을 알린다.

## 8. 교차참조 (v1에서 이미 반영됨 — v2 델타만)

v1 머지로 아래 파일들의 `design-page-image` 참조는 이미 web/mobile로 갱신됐다. v2는 **"섹션별 이미지" 문구 → "풀페이지 목업" 문구 + html-prototype 직전 포지셔닝**으로 재손질한다.

- `skills/design-image-web/SKILL.md` — 산출 단위·게이트1(섹션 선택)·발산(low)·포맷(세로 ≤3:1)·네이밍·포지셔닝으로 개정. **frontmatter description의 v1 문구("가로 포맷", "한 섹션씩 생성")를 "세로 풀페이지 목업"으로 반드시 정정**(안 하면 에이전트가 잘못 호출).
- `skills/design-image-web/references/art-direction-web.md` — **골격 재작성**(§2.2): §1~§9가 섹션 단위라 두 절 수정이 아니라 풀페이지 기준 재작성. 안목·anti-slop·히어로·팔레트는 보존.
- `skills/design-image-mobile/SKILL.md` + `references/art-direction-mobile.md` — 발산 라운드(low) 추가·포지셔닝 문구. 화면=목업이라 단위 변경은 작음(저위험 델타). description도 발산·포지셔닝 반영.
- `agents/designer.md` — 다운스트림에서 web/mobile을 "풀페이지 목업, html-prototype 직전 탐색"으로 기술.
- `skills/design-md-compiler/SKILL.md` — §8/흐름의 표현을 "풀페이지 목업"으로. glob·파싱 정책은 그대로(파일명 파싱 안 함, page-briefs 산문). **+ carve-out**: md-compiler가 생성하는 DESIGN.md의 anti-slop 체크리스트 "UI 텍스트가 이미지에 박혀 있지 않은가"가 풀페이지 목업과 충돌하므로, **"`assets/page/` 풀페이지 목업은 *탐색 레퍼런스* — 텍스트가 박혀도 됨, 최종 텍스트는 HTML/코드"** 단서를 명시(목업을 anti-slop 위반으로 읽지 않게). §8 이미지 에셋 규칙에도 동일 취지 반영.
- `skills/design-ui-kit/SKILL.md`·`skills/design-brand-kit/SKILL.md` — "페이지 이미지" 문구가 풀페이지 목업과 모순 없게 점검(대부분 그대로).
- `README.md`·`docs/design/README.md` — 산출물 설명을 "풀페이지 목업"으로, 파이프라인에서 html-prototype 직전임을 명시.
- `npm run sync` — Codex 번들·`codex-agents/` 재생성(로컬 생성물, 커밋 안 함).

## 9. 비범위 (YAGNI)

- **연속 슬라이스 체이닝**(긴 페이지를 이어붙인 이미지로) — 채택 안 함. 1:3 한 컴프로 캡하고, 초과분은 독립 존 컴프. (이음새 리스크·복잡도·발산×슬라이스 비용 폭발 회피.)
- doc4(gpt-taste) 코드 생성 — 범위 밖.
- 워드마크·파비콘 등 로고 시스템 — design-logo 몫.
- 외부 MCP 이미지 백엔드 — 현 설계는 공유 `image-gen` 단일 백엔드.
- 공유 references 디렉터리 신설 — 각 스킬 self-contained.
- 8섹션 풀길이를 이미지로 완전 재현 — 불필요(풀길이 정밀본은 HTML 몫). 이미지는 룩 탐색용.

## 10. 열린 항목 / 확인 필요

- 웹 "1:3에 몇 섹션이 들어가나"의 실무 감 — 구현 후 실제 생성으로 캘리브레이션(게이트1에서 사용자가 분량 조절하므로 치명적이지 않음).
- 모바일 화면 플로우 기본 팩(온보딩/인증/커머스) 프리셋을 references에 둘지 — art-direction-mobile.md 작성 시 결정.
- 한국어 타깃 요청의 영문 slug 자동 도출 규칙 — 단순 매핑/사용자 확정으로 충분한지 구현 시 확정.
- **(파킹) 스킬 내부 `manifest.json`** — 외과 편집 추적·시트 생성용 구조화 기록(이미지 편집·발산 관리). **md-compiler와 무관**. 구현 단계에서 필요성·스키마 검토.
