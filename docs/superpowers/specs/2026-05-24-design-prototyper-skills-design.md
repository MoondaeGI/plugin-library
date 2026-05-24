# design prototyper 스킬 세트 설계

**날짜**: 2026-05-24
**상태**: 설계 (스킬 미작성 — 이 문서는 "어떻게 만들지"의 기준)
**작성 예정 위치**: `skills/design-brand-kit|design-page-image|design-md-compiler|design-html-prototype/SKILL.md` (Claude Code + Codex 공용 monorepo 플러그인)
**원본 plan**: `work/import/taste_gpt_image_design_skill_agent_plan.md` (8 스킬 + 5 에이전트 + 5 스크립트 + 4 스키마 제안)
**이 문서가 하는 일**: 원본 plan을 현 플러그인 규약과 실제 도구 현실에 맞게 **얇은 수직 슬라이스**(4 스킬)로 줄여 재설계한다.

---

## 1. 무엇 / 왜

GPT Image 2.0(Codex 내장) 기반으로 **디자인 레퍼런스를 빠르게 만들어 구현으로 잇는** 스킬 세트다. 파이프라인:

```
제품 설명 → ① 브랜드 킷(+무드보드 이미지) → ② 페이지 섹션 이미지 브리프
         → (이미지 생성: pluggable) → ③ DESIGN.md(구현 계약) → ④ HTML 프로토타입
```

핵심은 **자동화가 아니라 단계별 사람 리뷰 게이트**다. 각 단계는 산출물을 제시하고, 사람이 시안을 보고 반복/승인한 뒤 다음 단계로 넘어간다. 한 번에 HTML까지 쏟아내지 않는다.

원본 plan과의 관계:
- **유지**: 디자인 철학(이미지 = 시각 레퍼런스이지 최종 UI가 아님 / 최종 텍스트는 코드에 / DESIGN.md = 구현 계약 / anti-slop·taste 규칙) 및 각 스킬 본문의 규칙 텍스트.
- **버림**: 오케스트레이터(단일 진입점), 별도 에이전트 5종, 이미지 생성 스크립트(`generate-image.ts`)·API 키·JSON 스키마 파일·강제 manifest.

## 2. 프로젝트 현실 (이 설계가 반영하는 것)

- **에이전트 중립 모노레포 플러그인**: 스킬은 `skills/<name>/SKILL.md`, 프론트매터는 공통 키(`name`, `description`)만. Claude Code + Codex 양쪽에서 동작해야 한다.
- **Node `.mjs` 스크립트만** (TypeScript 빌드 없음). `npm test`는 `tests/**/*.test.mjs`를 글로빙. → 원본 plan의 `.ts` 스크립트는 채택하지 않는다.
- **MCP는 `mcp.servers.json` 단일 진실원천**, 현재 `{}`. → 이 세트는 MCP 항목을 추가하지 않는다(생성은 Codex 내장이므로 불필요).
- **이미지 생성 도구 현실**: 실제 GPT Image 호출은 **Codex 내장 gpt-image**만 가능. Claude에는 동등 기능이 없다. 이 비대칭이 설계의 핵심 제약이다(5절).
- **librarian 선례**: 머신별 경로는 `.env` + 리졸버 스크립트 패턴. → 이 세트는 **머신별 경로가 없다**(출력은 항상 대상 프로젝트 cwd 기준). 따라서 리졸버·`.env` 항목 불필요.
- **문서/스펙/프론트매터 설명은 한국어.**

## 3. 핵심 원칙

- **단계 분리 + 리뷰 게이트**: 오케스트레이터 없음. 4개 스킬을 사람이 순서대로 호출. 각 스킬은 끝에서 "산출물 제시 → 리뷰/반복 대기 → 다음 스텝 안내"를 직접 수행한다.
- **생성은 교체 가능(pluggable)**: 스킬은 이미지를 *생성하지 않는다*. **이미지 브리프(계약)** 만 만든다. 실제 PNG는 Codex 내장 생성 또는 사람이 수동으로 채운다. 다운스트림 스킬은 *어떻게 생성됐든* 폴더의 PNG만 소비한다.
- **에이전트 중립**: 스킬 계약에 "생성기"가 등장하지 않는다. 비대칭(생성)은 계약 밖으로 격리.
- **이미지는 레퍼런스, 코드가 진실**: 최종 카피라이팅·UI 텍스트는 이미지에 박지 않고 코드에 둔다.
- **취향 규칙 내장**: SaaS 클리셰(무조건 파랑/보라/네온, 방패·자물쇠, glow·blob, 좌텍스트-우이미지 반복, 단일 거대 페이지 이미지) 회피를 각 스킬 본문에 명시.

## 4. 파이프라인 & 디렉터리 레이아웃

산출물은 **플러그인 저장소가 아니라 대상 프로젝트의 cwd**에 쓴다. 중간 산출물은 숨김 `.design/`에, 최종 개발자용 산출물은 cwd 루트에.

```
<cwd>/
  .design/                      # 중간 산출물 (숨김 — 기존 design/ 와 충돌 회피)
    BRAND_KIT.md                # ① design-brand-kit
    brand-tokens.json           # ① design-brand-kit
    image-briefs/
      brand-briefs.md           # ① 무드보드 브리프 (브랜드 방향 시각 검증용)
      page-briefs.md            # ② design-page-image (섹션당 브리프 1개)
    generated/                  # PNG가 채워지는 곳 (Codex 생성 또는 수동 드롭)
      brand-kit/                # ① 무드보드 이미지 (이번 슬라이스에서 사용)
      page/                     # ② 페이지 섹션 이미지 (이번 슬라이스에서 사용)
      ui-kit/                   # 예약 (이번 슬라이스 범위 밖)
      logo/                     # 예약 (이번 슬라이스 범위 밖)
      manifest.json             # 선택 — 있으면 캡션/순서 메타, 없으면 PNG glob
  DESIGN.md                     # ③ design-md-compiler (cwd 루트, 개발자용 최종 계약)
  prototype/
    index.html                  # ④ design-html-prototype (cwd 루트)
```

원본 plan은 `design/`(비숨김)을 썼다. 대상 저장소에 이미 `design/`이 흔히 존재하므로 **`.design/`(숨김)** 으로 바꿔 충돌을 피한다. `generated/`는 카테고리 하위 폴더로 분리한다.

## 5. 생성 경계 (가장 중요한 결정)

스킬은 이미지를 만들지 않는다. **이미지 브리프**가 계약이다. PNG가 채워지는 두 경로:

| 경로 | 누가 | 방식 |
|------|------|------|
| **A. Codex 네이티브** | Codex CLI | 내장 gpt-image가 브리프를 읽고 `.design/generated/<category>/`에 PNG 저장 |
| **B. 수동 드롭** | 사람 (Claude 사용 시 포함) | 외부 도구로 만든 PNG를 같은 폴더에 직접 넣음 |

- 다운스트림(③ md-compiler, ④ html-prototype)은 **생성 방식과 무관하게** 폴더에 존재하는 PNG만 읽는다.
- `manifest.json`은 **선택**: 있으면 캡션·순서·섹션 매핑 메타로 사용, 없으면 파일명 glob.
- 결과: OpenAI API 키, `generate-image.mjs`, `.env` 이미지 설정, 강제 manifest, MCP 항목이 **전부 불필요**.

## 6. 4개 스킬 계약

각 스킬은 끝에서 동일한 게이트를 수행한다: **산출물 제시 → 리뷰/반복 대기 → 다음 스텝 안내.** (오케스트레이터의 조율 역할을 각 스킬이 흡수.)

### 6.1 `design-brand-kit`

- **description(트리거)**: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷과, 그 방향을 눈으로 검증할 무드보드 이미지 브리프를 만들 때.
- **입력**: 제품명/분야/타깃/핵심 문제/가치 제안/원하는·피하는 분위기/기존 색상·로고/참고 스타일. 부족하면 합리적 기본값으로 채우되 추측 항목을 명시.
- **출력**:
  - `.design/BRAND_KIT.md` — 8개 섹션(제품 요약 / 브랜드 성격 / 시각 방향 / 로고 방향 / 색상 팔레트 / 타이포 / UI 분위기 / 금지 패턴). 원본 plan 6.2의 구조 그대로.
  - `.design/brand-tokens.json` — color/typography/radius/shadow/spacing 토큰. 원본 plan 6.2 구조.
  - `.design/image-briefs/brand-briefs.md` — **무드보드 이미지 브리프**(신규). 브랜드 방향을 시각으로 검증하기 위한 1~N장 무드보드 brief.
- **흐름(리뷰 게이트)**: ① md+tokens 작성 → ② 무드보드 브리프 작성 → ③ (pluggable) `.design/generated/brand-kit/`에 이미지 생성/드롭 → ④ 사람이 시각으로 방향 검증 → 마음에 안 들면 ②~④ 반복, 좋으면 "다음: `design-page-image`" 안내.
- **품질/금지 규칙**(원본 plan 6.2): 색상은 감성어 아닌 HEX 값. 보안/B2B/SaaS라고 무조건 파랑·보라·네온 금지. 로고는 형태 언어로 기술. 최소 3개 시각 루트(안전 SaaS / 프리미엄 에디토리얼 / 대담 실험) 제안 후 1개 추천. AI glow·사이버 네온·해커 후드·매트릭스 배경·방패·자물쇠 클리셰 금지.

### 6.2 `design-page-image`

- **description(트리거)**: 브랜드 킷을 바탕으로 랜딩 페이지·대시보드·앱 화면의 **섹션별** 디자인 이미지 브리프를 만들 때.
- **입력**: `.design/BRAND_KIT.md`, `.design/brand-tokens.json` (있으면 `.design/generated/brand-kit/`의 무드보드 참고).
- **출력**: `.design/image-briefs/page-briefs.md`. 섹션당 브리프 1개. 각 브리프: 섹션 목적 / 레이아웃 구성 / 시각 계층 / 컴포넌트 사용 / 이미지·일러스트 사용 / 생성 Prompt / Negative Prompt / 구현 메모.
- **기본 섹션**(요청 없으면): Navigation+Hero / Problem·Pain / Product Mechanism / Feature·Channel Grid / Dashboard·Evidence / CTA·Footer.
- **흐름(리뷰 게이트)**: 브리프 작성 → (pluggable) `.design/generated/page/`에 섹션 이미지 생성/드롭 → 사람이 시안 검토 → 반복 또는 "다음: `design-md-compiler`" 안내.
- **핵심·taste 규칙**(원본 plan 6.5): 전체 페이지를 하나의 긴 이미지로 합치지 않음. 좌텍스트-우이미지 반복 금지. Hero는 2~3줄. glow·blob·가짜 대시보드 카드 남발 금지. cheap meta label(SECTION 01 등) 금지. CTA 대비 충분. 카드는 3~5개 의도적으로. 브리프는 코드 구현 가능할 만큼 명확히.

### 6.3 `design-md-compiler`

- **description(트리거)**: 브랜드 킷·페이지 브리프·생성 이미지 목록을 바탕으로 구현자가 따를 `DESIGN.md`를 만들 때.
- **입력**(있는 것만): `.design/BRAND_KIT.md`, `.design/brand-tokens.json`, `.design/image-briefs/*.md`, `.design/generated/**/*.png`, `.design/generated/manifest.json`(선택).
- **출력**: `DESIGN.md` (cwd 루트). 9개 섹션: 제품 요약 / 브랜드 성격 / 시각 방향 / 디자인 토큰(Colors·Typography·Spacing·Radius·Shadow·Border) / 컴포넌트 규칙 / 페이지 섹션 규칙 / 이미지 에셋 사용 규칙 / 구현 제약 / **Anti-slop checklist**. 원본 plan 6.6 구조.
- **흐름(리뷰 게이트)**: DESIGN.md 작성 → 사람 검토 → 반복 또는 "다음: `design-html-prototype`" 안내.
- **작성/금지 규칙**(원본 plan 6.6): 감성 설명을 구현 가능한 규칙으로 변환. 색상 HEX, spacing/radius/shadow는 실제 CSS 값. 컴포넌트 규칙은 class/variant로 옮길 수 있게. **이미지 레퍼런스의 살릴 점/버릴 점 구분.** 최종 문구는 이미지가 아니라 코드에 있어야 함을 명시. "고급스럽게/깔끔하게" 추상 표현만 남기지 않음. 이미지 결과를 무조건 정답 취급 금지.

### 6.4 `design-html-prototype`

- **description(트리거)**: `DESIGN.md`와 brand tokens를 바탕으로 빠르게 확인 가능한 단일 HTML/CSS 프로토타입을 만들 때.
- **입력**: `DESIGN.md`, `.design/brand-tokens.json`, `.design/generated/**/*.png`(+ 선택 manifest).
- **출력**: `prototype/index.html` (cwd 루트; 사용자가 원하면 단일 `prototype.html`).
- **흐름(리뷰 게이트)**: 프로토타입 작성 → 사람이 브라우저로 확인 → 반복. (마지막 단계 — 다음 스텝 안내 대신 "DESIGN.md/토큰을 고쳐 ③④ 반복하거나 실제 구현으로 진행" 안내.)
- **구현/품질/금지 규칙**(원본 plan 6.7): HTML/CSS/JS 한 파일 허용, CSS variables 사용, 텍스트는 실제 HTML 텍스트(이미지로 대체 금지), 버튼·카드·입력·배지·테이블은 재사용 class, 이미지는 `<img>`/배경으로 쓰되 UI 전체를 이미지로 대체 금지, React 이식 쉽게 section/component 구조 분리. 인라인 스타일 남발·과한 애니메이션·생성 이미지 픽셀 복제·과도한 빌드 시스템 금지. 가로 스크롤 없음, 모바일에서 기본 안 깨짐.

## 7. 에이전트 중립성

- **중립(Claude+Codex 공통)**: ① 브랜드 킷 텍스트·토큰·브리프, ③ DESIGN.md, ④ HTML — 전부 텍스트 생성·파일 조작이라 양쪽 동일.
- **비대칭은 생성 단계에만**: 실제 이미지 생성은 Codex 전용. Claude에서는 경로 B(수동 드롭)로 폴백. 이 비대칭은 스킬 *계약*에 새어 들지 않는다 — 스킬은 "브리프를 쓴다 / 폴더의 PNG를 읽는다"까지만 책임.
- Claude 도구명 사용 + Codex 매핑(`references/codex-tools.md`) 전제. 형식 인자 문법에 의존하지 않고 자연어 호출.

## 8. 호출 인터페이스

- **표준(이식 가능)**: 스킬 호출 + 메시지로 제품 설명/요청을 자연어 전달. 예: "design-brand-kit으로 이 제품 브랜드 킷 잡아줘: …".
- **Claude Code 단축(선택)**: `/design-brand-kit`, `/design-page-image`, `/design-md-compiler`, `/design-html-prototype`.
- 모든 산출물 경로는 cwd 기준 상대경로(`.design/…`, `DESIGN.md`, `prototype/…`).

## 9. 비범위 / 후속

- **이 단계에선 스킬을 실제로 작성하지 않는다** — 이 문서가 작성 기준.
- `generated/ui-kit/`, `generated/logo/`: 폴더만 예약, 이번엔 채우지 않음(향후 `design-ui-kit`, `design-logo` 스킬 자리).
- 오케스트레이터/단일 진입점, 별도 에이전트 5종: 채택 안 함(확정 제거).
- 이미지 생성 스크립트·API 키·JSON 스키마 파일·MCP 항목: 불필요(5절).
- `visual-audit` 스킬(원본 plan 6.8): 후속 고려, 이번 슬라이스 밖.
- 실제 작성은 `superpowers:writing-skills`로(플러그인 AGENTS.md 규약).

## 10. 작성 시 체크리스트 (나중에)

- [ ] `skills/design-brand-kit/SKILL.md` — BRAND_KIT.md + brand-tokens.json + brand-briefs.md(무드보드) 출력, 4단계 리뷰 게이트, 품질·금지 규칙 내장.
- [ ] `skills/design-page-image/SKILL.md` — 섹션당 브리프 1개, 기본 6섹션, taste 규칙 내장, 리뷰 게이트.
- [ ] `skills/design-md-compiler/SKILL.md` — DESIGN.md 9섹션(anti-slop checklist 포함), 살릴/버릴 점 구분, 리뷰 게이트.
- [ ] `skills/design-html-prototype/SKILL.md` — 단일 HTML, CSS variables, 재사용 class, 구현/금지 규칙, 리뷰 반복.
- [ ] 모든 스킬: 프론트매터 공통 키(`name`, `description`)만. 산출물 경로는 cwd 기준 `.design/`.
- [ ] 생성 경계: 스킬 계약에 "생성기" 등장 금지. 다운스트림은 PNG glob(+선택 manifest)만 소비.
- [ ] 각 스킬 끝에 "산출물 제시 → 리뷰/반복 대기 → 다음 스텝 안내" 게이트.
- [ ] 최종 텍스트는 코드에, 이미지는 시각 레퍼런스라는 원칙을 ③④에 명시.
- [ ] Claude(경로 B 폴백) + Codex(경로 A 네이티브) 양쪽에서 로컬 테스트.
