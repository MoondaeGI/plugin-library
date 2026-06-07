# 아이콘 ref 재구조화 + brand-kit 배선 — 설계

날짜: 2026-05-29

## 배경 / 문제

`skills/references/design/icon-art-direction.md`는 현재 단일 파일로, 이미지 모델이 바로 그릴 수 있는 **렌더 가능한 스펙**(시스템 파라미터·메타포 매핑·프롬프트 청크)을 담는다. `design-brand-kit` 스킬이 보드 아이콘 생성 시 이를 소비한다.

세 가지 한계가 있다.

1. **벤더 종속 유입 위험** — 별도 출처에서 보안/DLD 도메인 메타포(유출 탐지·정책 위반 등)를 합치자는 논의가 있었으나, 이 ref는 모든 브랜드 킷이 공유하는 **범용** 문서다. 특정 도메인 메타포를 본문에 박으면 스킬이 그 업종에 갇힌다.
2. **스타일 경직** — 현 문서는 `line`을 사실상 기본값으로 둔다. 브랜드 성격에 따라 filled·duotone·solid glyph·illustrative가 더 맞는 경우가 많다.
3. **cross-section 일관성 미배선** — 보드의 §2 에센스·§3 타깃·§4 가치 섹션 아이콘과 §11 아이콘 세트가 "하나의 시스템"이어야 한다는 원칙은 `icon-art-direction.md §3`에 있으나, 정작 `brand-kit-image.md`의 보드 프롬프트 템플릿이 이를 강제하지 않는다.

## 목표

- 단일 `icon-art-direction.md`를 목적별 4개 ref 팩(`skills/references/design/icon/`)으로 분할한다.
- 렌더 가능한 코어(시스템 파라미터 + 프롬프트 청크)는 `icon-rules.md`(렌더 백본)에 보존한다.
- 스타일을 `line` 고정에서 5 아키타입 선택제로 확장한다.
- 도메인 메타포는 별도 파일에 두되 추상 모티프 중심으로 anti-cliché를 유지한다.
- 벤더 분석은 "복제 금지·agent-facing" 분석 파일로 분리한다(프롬프트 인용 금지).
- `BRAND_KIT.md §11`을 아이콘 결정의 단일 소스로 확장하고, `design-brand-kit`이 ref 팩을 1단계에서 읽어 §11에 증류한 뒤 보드/다운스트림이 §11을 소비하도록 배선한다.
- 보드의 모든 섹션 아이콘이 §11 시스템을 따르도록 프롬프트 템플릿에 cross-section 일관성 지시를 추가한다.

## 비목표 (보류)

- `design-icon` 스킬(제품 전체 아이콘 세트 실제 생성)은 만들지 않는다. `BRAND_KIT.md §11`이 단일 소스가 되므로, 제품 UI 아이콘 세트를 실제로 뽑는 단계가 필요해질 때 별도로 설계한다.
- `docs/superpowers/specs`·`plans` 안의 과거 기록은 `icon-art-direction` 참조를 그대로 둔다(히스토리 기록이므로 갱신 대상 아님).

## 설계

### A. 새 ref 팩 — `skills/references/design/icon/`

**A.1 `icon-rules.md`** (렌더 백본 · 항상 읽힘)

기존 `icon-art-direction.md`의 render-actionable 코어를 보존하며 범용 원칙을 흡수한다.

- **목적/사용법** — 기존 §0 이관(팩 구조 반영하도록 사용법 갱신: rules→스타일 catalog→도메인 examples→avoid→프롬프트 청크 순).
- **핵심 원칙** (범용) — 하나의 시각 언어, 브랜드 성격에 맞는 스타일 선택, 세트 내 스타일 무작위 혼용 금지, 기능 설명하되 직역 금지, 작은 크기 가독, 로고보다 튀지 않기, 무료 아이콘팩 느낌 금지.
- **시스템 파라미터** (기존 §1) — 광학 스트로크 1.75–2px / 조인·터미널 통일 / 공유 그리드·키라인 / 광학 크기 균형 / 코너 라운딩 통일 / 세트당 단일 스타일 / 차분한 톤.
- **세트 구성 + cross-section 일관성** (기존 §3) — 한 가족으로 읽기, 상태 아이콘 규칙(형태 동일·색만 분기), "보드의 에센스·타깃·가치 작은 아이콘과 §11 세트는 하나의 동일한 시스템" 원칙.
- **Avoid** (기존 §4 + 도메인 추출 신규) — clip-art·일반 스톡·굵기 불일치·과밀·클리셰(방패/눈/톱니)·3D/bevel·gradient·drop shadow·사진 사실적 렌더 + 신규: 사실적 USB 그림, 모든 기능을 방패/눈으로 표현.
- **프롬프트 청크** (기존 §5) — [브래킷]은 `BRAND_KIT.md §11`/`brand-tokens.json`에서 채운다. `Avoid:` 한 줄로 Avoid 항목 이어 붙임.
- **검증 테스트** (신규 · 원문 §7에서) — One-Color Test(단색에서 의미 유지), Small UI Test(16/20/24px 가독). 짧은 QA 블록.

**A.2 `icon-style-catalog.md`** (스타일 선택 시점에 읽음)

- 5 아키타입: **Line/Outline · Filled · Duotone · Solid Glyph · Outline+Minimal Fill** (+ Illustrative는 랜딩·온보딩·빈 상태 특수 용도로만 제한).
- 각 항목: 느낌 한 줄 + 추천 사용처 + **보드 보조용 / 풀 제품 시스템용 태깅** + 주의.
- 선택 규칙: 세트당 기본 스타일 하나로 통일; 혼용 시 명확한 역할 분리(예: nav=line / active nav=filled / empty state=illustrative / status badge=solid glyph).

**A.3 `icon-domain-examples.md`** (프로젝트 도메인 섹션만 읽음)

- 8 도메인: B2B SaaS · Developer Tools · Security/Compliance · Fintech · Healthcare · Education · E-commerce · AI/Automation.
- 각 도메인: 권장 메타포 + 어울리는 스타일.
- 상단 캐벗: "명사형(lock·heart·cross·shield)은 출발점일 뿐, 추상 모티프(경계·흐름·신호·노드)로 환원한다."
- "agent는 프로젝트 카테고리에 맞는 섹션만 참고한다" 명시.

**A.4 `icon-reference-vendors.md`** (agent-facing · 프롬프트 인용 금지)

- SF Symbols · Material Symbols · Atlassian · Linear · Stripe — 각 벤더의 스타일 원칙·밀도·stroke·corner·filled/line 사용·상태 표현 분석 포인트만.
- 헤더 규칙: 특정 벤더 형태 복제 금지, 추출하는 것은 원칙뿐, **벤더명을 §11·이미지 프롬프트에 인용하지 않는다**(이미지 모델은 "Linear처럼"을 못 그린다 — agent의 파라미터 선택용).

### B. `BRAND_KIT.md §11` 확장 (`design-brand-kit/SKILL.md` 템플릿)

`## 11. 이미지 / 아이코노그래피`를 다음 3필드 추가로 확장한다.

```md
## 11. 이미지 / 아이코노그래피 (Imagery / Iconography)
- 이미지 성향:
- 아이콘 스타일:        (icon-style-catalog에서 고른 하나 + 근거 한 줄)
- 아이콘 메타포 모티프:  (icon-domain-examples의 도메인 추상 모티프)
- 상태 아이콘 규칙:      (형태 동일·색만 분기)
- 피해야 할 이미지:
```

보드에 렌더되는 §11 내용은 컴팩트하게 유지한다(스타일 + 모티프 몇 개 + 상태 규칙). 풍부한 결정의 재사용 가치는 보드가 아니라 다운스트림(design-page-image·html-prototype·미래 제품 UI)에 있다.

### C. `design-brand-kit/SKILL.md` 흐름 1단계 step

흐름 1단계(`BRAND_KIT.md` 작성)에 다음을 읽어 §11에 증류하는 지시를 추가한다.

- `icon/icon-rules.md` — 핵심 원칙(항상).
- `icon/icon-style-catalog.md` — 브랜드 성격 + 사용 환경 → **스타일 하나 확정**.
- `icon/icon-domain-examples.md` — **프로젝트 도메인 섹션만** → 추상 모티프 후보.
- (선택) `icon/icon-reference-vendors.md` — 스타일 보정. **벤더명은 §11·프롬프트에 쓰지 않는다.**

### D. `brand-kit-image.md` 갱신

- **포인터 갱신** — §7(line 142) 및 `SKILL.md:266`의 `../../references/design/icon-art-direction.md` → `../../references/design/icon/icon-rules.md`. catalog·domain을 읽는 시점(1단계·§11 증류)도 명시.
- **§12 프롬프트 템플릿에 cross-section 일관성 줄 추가** — Sections 블록 인근에:
  > "All section icons (Essence, Target, Value Pillars, Imagery) follow ONE icon system defined in `BRAND_KIT.md §11` — identical stroke weight, join/terminal, grid, and metaphor language. No section uses a different icon look."

### E. 삭제 / 이관

- 기존 `skills/references/design/icon-art-direction.md` **삭제**. 내용은 A.1–A.4로 이관.
- 라이브 소비처(`design-brand-kit/SKILL.md`·`brand-kit-image.md`)의 포인터만 갱신.

## 검증

코드가 아닌 문서/ref 작업이므로 동작 테스트 대신 일관성 검증으로 확인한다.

1. **댕글링 참조 0건** — 라이브 스킬(`skills/**`)에서 `icon-art-direction` grep 결과 0건(`docs/` 히스토리는 제외).
2. **프롬프트 청크 정합** — `icon-rules.md`의 프롬프트 청크 [브래킷]이 확장된 `BRAND_KIT.md §11` 필드와 1:1로 채워지는지 확인.
3. **배선 정합** — `design-brand-kit/SKILL.md` 1단계가 올바른 파일을 올바른 시점에 가리키고, §12 템플릿에 cross-section 줄이 들어갔는지 확인.
4. **Codex 번들 재생성** — `skills/` 변경이므로 마지막에 `npm run sync` 실행(실행 전 사용자 승인). `references/design/icon/`이 `plugins/personal/`에 반영되는지 확인.

## 영향 파일

- 신규: `skills/references/design/icon/icon-rules.md`, `icon-style-catalog.md`, `icon-domain-examples.md`, `icon-reference-vendors.md`
- 삭제: `skills/references/design/icon-art-direction.md`
- 수정: `skills/design-brand-kit/SKILL.md`(§11 템플릿 + 흐름 1단계), `skills/design-brand-kit/references/brand-kit-image.md`(§7 포인터 + §12 cross-section 줄)
- 생성물(자동): `npm run sync`로 `plugins/personal/` 재생성(커밋 안 함)
