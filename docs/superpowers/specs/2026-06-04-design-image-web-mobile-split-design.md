# design-page-image → design-image-web + design-image-mobile 분할 재설계

- 날짜: 2026-06-04
- 상태: 설계 확정 (구현 계획 대기)
- 소유: designer 에이전트의 선택 다운스트림 단계
- 대체 대상: `skills/design-page-image/` (placeholder · 미구현)

## 1. 배경 / 동기

`design-page-image`는 전면 재작성을 위해 보류된 placeholder다. 웹과 앱은 아트디렉션·포맷·리뷰 단위가 근본적으로 달라(가로 섹션 vs 세로 폰 목업, 페이지 섹션 vs 화면 플로우), 단일 스킬로 묶으면 두 도메인의 규칙이 섞여 흐려진다. 그래서 **두 self-contained 스킬로 분할**한다:

- `design-image-web` — 랜딩/대시보드/마케팅 등 **웹 페이지의 섹션별 가로 이미지**
- `design-image-mobile` — iOS/Android/크로스플랫폼 **앱 화면·플로우 세로 이미지**

**분할 vs 단일 트레이드오프**: 두 스킬은 프로세스(Phase 0·리뷰 루프·lock·레이아웃)가 ~80% 동일하고, 생성 메커니즘도 둘 다 `image-gen` gpt-image-2로 같다(logo=PNG / iconset=SVG처럼 메커니즘이 갈리지는 않는다). 그럼에도 분할하는 근거는 **아트디렉션 도메인 분리**다 — 웹 가로 섹션 안목과 모바일 세로 화면 안목(플랫폼 모드·세이프에어리어·목업)은 서로 무관해, 한 스킬에 섞으면 인지부하가 크다. 중복 프로세스는 각 SKILL.md에 복제되지만(공유 references 미신설), 분기 게이트 하나로 묶는 단일 스킬보다 도메인별 가독성이 낫다는 판단. 도메인이 다른 art-direction을 각 스킬 references로 빼는 것도 이 분리를 따른다.

참조로 받은 3개 외부 문서를 평가해 채택 범위를 정한다.

## 2. 참조 문서 평가 (채택/버림)

| 문서 | 정체 | 판단 |
|---|---|---|
| SKILL(2) `imagegen-frontend-web` | 웹 섹션별 가로 이미지 아트디렉션(조합형 변주 엔진·히어로 구도 편향 차단·anti-AI-slop·팔레트 규율·"섹션 1장=이미지 1장") | **채택 — 안목만.** `design-image-web`의 아트디렉션 레퍼런스로 정제 추출. |
| SKILL(3) `imagegen-frontend-mobile` | 앱 화면·플로우 이미지 아트디렉션(플랫폼 모드·세이프에어리어·디바이스 목업 프레임·플로우 논리·가독성·아이코노그래피 규율) | **채택 — 안목만.** `design-image-mobile`의 아트디렉션 레퍼런스로 정제 추출. |
| SKILL(4) `gpt-taste` | **이미지 스킬 아님** — React/Tailwind/GSAP **코드 생성** 스킬(Python 의사난수 레이아웃·AIDA·gapless bento·메타라벨 금지) | **제외.** 도메인이 코드(우리 파이프라인의 web-publisher/front-developer 몫). 그 anti-slop 원칙은 이미 SKILL(2)가 커버. 이미지 스킬엔 넣지 않는다. |

### 2.1 채택할 것 (→ 각 스킬 `references/art-direction-*.md`로 정제)
- 조합형 변주 엔진(테마·타이포·히어로·섹션 시스템 등에서 1개씩 선택해 일관 적용)
- 히어로 구도 편향 차단(text-left/image-right 기본값 금지), 구도 다양성
- anti-AI-slop 카탈로그(레이아웃/비주얼/타이포/콘텐츠/밀도 slop)
- 섹션 리듬·여백 규율, 팔레트/그라데이션 규율
- (모바일 전용) 플랫폼 모드·세이프에어리어·디바이스 목업 프레임·화면 플로우 논리·텍스트 가독성·아이코노그래피 규율

### 2.2 버릴 것 (우리 파이프라인과 충돌)
- **자율 일괄 생성 워크플로** ("질문하지 말고 다 추론해 N장 한꺼번에 뱉어라") → 우리는 게이트 + 한 장씩.
- **브랜드/카피/팔레트 창작** ("팔레트를 골라라", 가짜 브랜드명·카피) → 우리는 DESIGN.md 토큰에 바인딩.
- 자기참조 문구("코드 쓰지 마라" 등) 및 doc4 전체.

## 3. 공통 설계 (두 스킬 공유 철학)

- **DESIGN.md를 단일 시드로 바인딩.** frontmatter의 진짜 HEX·실폰트, §1 제품명, §3 시각 방향, §6 페이지 섹션 규칙, §8 이미지 에셋 규칙, §11 anti-slop을 근거로 프롬프트를 구성. 값을 지어내지 않는다.
- **확정 자산을 `--image` 앵커로 주입.** `assets/logo/logo.png`·`assets/icon/*.svg`·`assets/brand-kit/{ui-base,key-visual}.png`를 레퍼런스로 첨부해 생성물이 실제 브랜드를 입게 한다. candidate 시안·컨셉 아이콘(`brand-kit/icon/*`)은 사용하지 않는다.
- **한 번에 하나.** design-logo/iconset식 게이트 루프. 자율 일괄 생성 금지.
- **생성기는 공유 `image-gen`** (gpt-image-2 불투명 사진/목업, 사전 키검증 금지 — 부재 시 스크립트가 안내하며 실패).
- **한국어**로 소통하고 이미지 안 텍스트도 한국어로 렌더.
- 각 스킬은 **self-contained**: 아트디렉션을 SKILL.md에 inline하지 않고 자기 폴더 `references/`에 둔다. SKILL.md는 프로세스 골격(Phase 0·리뷰 루프·lock)만 담는다. 근거는 **기존 디자인 스킬의 실제 배치 패턴** — brand-kit(`references/brand-kit-image.md` 등)·logo(`references/logo-sheet-html-direction.md`)·iconset(`references/iconset-sheet.md`)이 모두 *그 스킬만의* 아트디렉션을 자기 `references/`로 빼고 SKILL.md를 골격으로 유지한다(AGENTS.md에 적힌 규칙은 아니나 3개 스킬이 일관). 공유 `references/design/`로 승격하지 않는 이유는 **소비자가 각 스킬 하나씩**이기 때문(공유물인 logo-art-direction.md·font-catalog.md·icon/과 다름).

## 4. Phase 0 게이트 (DESIGN.md 부재 시 단계적 폴백)

design-logo Phase 0와 동형. 시작 시 필수:

1. `DESIGN.md`(cwd 루트) **있음** → 시드로 사용, 본 흐름 진행.
2. **없음** → "기존 `design.md`/디자인 문서가 있으면 주세요" 요청.
3. **그마저 없음** → `.design/` 진도 감지 후 다음 단계 추천:
   - `tokens.css`·`ui-kit.css`·`BRAND_KIT.md` 등은 있는데 `DESIGN.md`만 없음 → **"`design-md-compiler`를 먼저 돌리면 DESIGN.md가 나옵니다"** 안내.
   - `BRAND_KIT.md`까지만 있음 → 그 다음 단계(ui-kit→md-compiler) 추천.
   - 아무 진도 없음 → **`design-brand-kit` 권유**, 또는 사용자가 원하면 **최소 Q&A**(추측 금지, 수집분을 `candidate/page/page-briefs.md`에 기록)로 진행.

DESIGN.md 없이 최소 Q&A로 진행하는 경우, 토큰 바인딩이 약해지므로 §12(Known Gaps 상당)에 폴백임을 표시한다.

## 5. 산출물 레이아웃 (타깃 slug 네임스페이스)

서로 다른 타깃 페이지(예: `login`, `dashboard`)가 겹치지 않도록 **모든 산출물을 `<slug>-<platform>-<section>` 파일명으로 가른다.** 폴더 층 없이 파일명에 slug·플랫폼·섹션을 모두 인코딩하며, 버전 히스토리는 `--auto-version` 접미(`-v2`,`-v3`)로 평평하게 보존한다.

```
.design/
  view/
    page-web-<slug>.html        # 타깃별 라이브 시트 (예: page-web-landing.html)
    page-mobile-<slug>.html     # (예: page-mobile-onboarding.html)
  candidate/page/
    page-briefs.md              # 모든 타깃 공통 출처 로그 (md-compiler가 읽는 단일 출처)
    landing-web-hero.png  landing-web-hero-v2.png  landing-web-features.png …
    onboarding-mobile-welcome.png  onboarding-mobile-auth.png …
  assets/page/
    landing-web-hero.png  landing-web-features.png …   # 확정 deliverable (flat)
```

- **파일명 = `<slug>-<platform>-<section>[-vN].png`.** 한 타깃이 여러 섹션/화면을 낳으므로 섹션명까지 넣어야 충돌하지 않는다(웹 섹션 / 모바일 화면). `<platform>`은 `web`·`mobile`.
- **slug**: 사용자가 페이지를 요청할 때 스킬이 제안·확정(게이트1). 한국어 요청이면 영문 slug 제안(`login`·`dashboard`·`landing`). 기존 파일과 충돌하면 경고하고 "덮어쓸까/새 이름?" 확인.
- **깊이는 `candidate/page/<파일>` 한 층** — 폴더 네임스페이스 없이 파일명으로 가른다. 두 스킬이 같은 `candidate/page/`·`assets/page/`에 쓰지만 플랫폼이 파일명에 박혀 안 겹친다.
- **라이브 URL은 타깃당 하나**(`page-<platform>-<slug>.html`) → 그 타깃 반복 중엔 고정이라 라이브 프리뷰 자동 새로고침 유지, 다른 페이지는 다른 파일이라 안 겹친다.
- **md-compiler 호환**: `assets/page/`가 평면이라 기존 `assets/page/*.{png,…}` glob이 그대로 동작 — 재귀 glob 변경 불필요. **md-compiler는 파일명을 파싱하지 않는다**(산문 컴파일러이지 파일명 파서가 아니다). 파일명은 사람이 알아보는 식별자일 뿐이고, 섹션·순서·캡션 같은 의미는 page-image 스킬이 `candidate/page/page-briefs.md`에 **산문으로** 적는다(md-compiler가 이미 읽는 입력). 즉 그룹핑 메커니즘을 새로 만들지 않는다.
- `view/`의 모든 `<img>`는 `../candidate/page/...` 상대경로. 시트는 tokens.css `var(--token)`으로 색·폰트·radius 렌더(전사 드리프트 방지).

## 6. 웹 vs 모바일 차이 (여기만 갈라짐)

| | **design-image-web** | **design-image-mobile** |
|---|---|---|
| 섹션/화면 출처 | DESIGN.md §6 페이지 섹션(Hero/Feature/CTA 등)에 **바인딩** | DESIGN.md엔 앱 화면 정의가 **구조적으로 없음**(§6은 웹 섹션) → **화면 플로우는 사용자 협업 창작**(게이트1 필수). §3 "지어내지 않는다" 대원칙의 **명시적 예외** — 단, 시드 없이 LLM이 단독 창작하지 않고 사용자와 플로우를 확정한 뒤 진행한다(프리셋은 generic-slop 위험이라 강제 게이트). 색·폰트·자산 등 *값*은 여전히 DESIGN.md 바인딩 |
| 포맷 | 가로(16:9 / 21:9), **섹션 1개 = 이미지 1장** | 세로 폰 목업(1024x1536), **화면 1개 = 이미지 1장**, **디바이스 프레임 기본 on** |
| 아트디렉션 ref | `skills/design-image-web/references/art-direction-web.md` (doc2 정제) | `skills/design-image-mobile/references/art-direction-mobile.md` (doc3 정제) |
| 모델 | gpt-image-2 불투명 | gpt-image-2 불투명 |

## 7. 리뷰 루프 (양쪽 공통)

1. **게이트1 — 목록 확정**: 타깃 slug + 섹션 목록(웹: DESIGN.md §6에 바인딩해 도출 / 모바일: 화면 플로우를 사용자와 협업 확정 — §6 표의 예외 규정 적용). 사용자 확정 전엔 이미지 0장.
2. **게이트2 — 방향 합의**: 아트디렉션 ref 기반으로 조합형 방향(테마·구도·히어로 스케일 등)을 제시·합의.
3. **한 장씩 생성**: 섹션/화면 1개를 생성 → `view/` 시트에 렌더 → 라이브 프리뷰(최초 1회 서버 기동, 사용자 확인 후 백그라운드).
4. **수정 루프(한 번에 한 가지)**: "#N 다시/다르게" → 재생성(`--auto-version`), 직전 후보를 `--image`로 첨부해 한 번에 한 가지만 외과 편집. "좋다 → 다음".
5. **lock**: 전체 확정 시 확정본을 `assets/page/<slug>-<platform>-<section>.png`(평면 — §5와 일치)로 복사. 시안은 candidate에 보존. `page-briefs.md`에 타깃·섹션·순서·캡션·확정 컨셉을 **산문으로** 기록(md-compiler가 이 산문을 읽음).
6. lock 후 라이브 서버 종료. 다음 단계 안내.

## 8. 교차참조 갱신 (구현 시)

- `skills/design-page-image/` **폴더 제거**, 신규 `skills/design-image-web/`·`skills/design-image-mobile/` 생성(각 SKILL.md + references/).
- `agents/designer.md` — 다운스트림 절에서 page-image를 web+mobile 둘로 교체. **designer가 자기 몫으로 도는 단계가 page-image 하나에서 web/mobile 둘로 늘어남** 명시.
- `skills/design-md-compiler/SKILL.md` — §8 이미지 에셋·흐름 안내에서 page-image 단수 참조를 web/mobile 둘로 갱신. **입력 glob은 변경 불필요**(`assets/page/`가 평면 유지). **파일명 파싱을 요구하지 않음** — 의미는 `candidate/page/page-briefs.md` 산문에서 읽는다(이미 참조 중). 
- `skills/image-gen/SKILL.md` — description의 호출자 예시 `design-page-image`를 `design-image-web·design-image-mobile`로 갱신(폴더 제거 시 죽은 참조 방지).
- `skills/design-html-prototype/SKILL.md` — **page-image 참조 없음 확인됨(grep 0건) → 실제 변경 없음**(목록엔 확인용으로만 남김).
- `README.md`, `docs/design/README.md` — 스킬 목록·파이프라인 다이어그램 갱신.
- `npm run sync` — Codex 번들(`plugins/personal/`)·`codex-agents/` 재생성(로컬 생성물, 커밋 안 함).

## 9. 비범위 (YAGNI)

- doc4(gpt-taste)의 코드 생성 도입 — 범위 밖(web-publisher/front-developer 도메인).
- 워드마크·파비콘 등 로고 시스템 — design-logo 몫.
- 외부 MCP(Stitch 등) 이미지 백엔드 — 현 설계는 공유 `image-gen` 단일 백엔드. 추후 별도 논의.
- 공유 references 디렉터리 신설 — 각 스킬 self-contained 유지.

## 10. 열린 항목 / 확인 필요

- 모바일 화면 플로우 게이트의 기본 플로우 팩(온보딩/인증/커머스 등) 프리셋을 references에 둘지 — 구현 단계에서 art-direction-mobile.md 작성 시 결정.
- 한국어 타깃 요청의 영문 slug 자동 도출 규칙(예: "로그인" → `login`) — 단순 매핑/사용자 확정으로 충분한지 구현 시 확정.
- **(파킹) 스킬 내부 `manifest.json` 메커니즘** — 이미지 외과 편집 추적·HTML 시트 생성을 위해 스킬이 자기 산출물을 구조화 기록하는 용도. **md-compiler와 무관**(md-compiler는 page-briefs.md 산문만 읽음). 구현 단계에서 필요성·스키마 검토.
