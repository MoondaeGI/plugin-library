# 로고 락업 시스템 (스펙 B-🅰) Design

> Status: Draft (brainstorming 산출). 다음 = writing-plans.
> Date: 2026-06-05
> 상위: `2026-06-05-design-logo-presentation-recipe-design.md` §6(스펙 B 백로그)의 하위프로젝트 🅰. favicon/다크(🅱)·타입 게이트(🅲)는 별도.
> 선행(이미 머지): 워드마크 폰트/이미지 분기 + `.wordmark` 토큰(`2026-06-04-design-wordmark-font-vs-image`), 제시용 레시피 A(`...presentation-recipe`).

## 0. 한 줄 요약

심볼과 워드마크를 **토큰 기반 락업 CSS**(`.lockup--horizontal/.stacked` + 옵션 `.tagline`)로 조합하고, 그 락업을 **기존 리뷰 HTML**(design-logo `logos.html` + brand-kit `overview.html §6`)에 렌더해 사용자가 "실제 로고가 어떻게 보일지" 판단·승인하게 한다. design-logo는 **심볼만** emit해 분리성을 보장한다. 비율 등 optical 균형은 **에이전트가 렌더·스크린샷·자가판정·미세조정**하고 사용자는 승인만 한다.

## 1. 동기 & 문제

- 사용자 원통증: "HTML에서 워드마크와 로고를 이쁘게 배치 못 한다 / 어울리는지 모르겠다." 현재는 심볼·워드마크가 *설계된 관계 없이* 대충 배치된다.
- 근본: **락업(심볼↔워드마크의 설계된 공간 관계)이 정의·검수된 적이 없다.** 고정 수치 하드코딩은 마크 모양마다 시각 무게·종횡비·여백이 달라 실패한다(brainstorming에서 시각 실증).

## 2. 목표 / 비목표

**목표**
- 심볼 + 워드마크(+선택 태그라인)를 2개 레이아웃으로 조합하는 **토큰 기반 락업 CSS**.
- 그 락업을 **리뷰 HTML에 통합**해 production 모습으로 검수·승인.
- design-logo `logo.png` = **심볼만**(워드마크 분리 보장).
- optical 균형은 **에이전트 구동 조정 + 사용자 승인**(사용자가 수치 안 만짐).
- 기존 "design-logo는 HTML 무편집" 불변식 유지.

**비목표(→ 별도)**
- favicon/app-icon/다크모드(🅱), 타입 게이트(🅲), 진짜 융합 baked 락업, PNG→SVG 트레이서.
- 워드마크 폰트/이미지 분기 재설계(이미 머지 — 재사용만).

## 3. 결정 (brainstorming 합의)

### 3.1 레이아웃
- **`.lockup--horizontal`**: 심볼 좌 + 워드마크 우. 헤더·내비.
- **`.lockup--stacked`**: 심볼 위 + 워드마크 아래. 히어로·푸터·정사각.
- **`.tagline`**: 두 레이아웃의 **on/off 옵션 슬롯**(워드마크 아래 소제목 + 헤어라인 룰). → "2 레이아웃 × 태그라인 on/off" = 4조합을 토큰 폭증 없이 커버.

### 3.2 토큰 (per-brand override)
brand-tokens.json의 선택 `lockup` 블록 → `tokens-to-css.mjs`가 `.lockup*` 클래스로 emit(`.wordmark`와 동일 경로·패턴):
- `--logo-mark-scale` — 마크 높이 = 워드마크 대문자높이의 N배. **기본 ~1.8.**
- `--logo-gap` — 심볼-워드마크 간격(마크 높이 비례, 기본 ~0.4).
- 수직 정렬(광학 중심), 태그라인 자간·크기·룰.
- 비우면 합리적 기본값. 브랜드가 마크에 맞게 한 값만 덮어쓰면 그 브랜드만 조정.

### 3.3 구성 입력
- **심볼** = design-logo 확정 자산(고정 경로, 심볼-only).
- **워드마크** = 폰트 모드 `.wordmark`(HTML) 또는 이미지 모드 `wordmark-base.png`(기존 분기 재사용).
- **태그라인** = `BRAND_KIT.md`의 태그라인 텍스트(CSS 렌더 — 굽지 않음, 한글 안전).

### 3.4 프리뷰 게이트 (에이전트 구동)
- **렌더 위치**: design-logo `logos.html`(심볼 lock 후 락업 표시) + brand-kit `overview.html §6` + **ui-kit `view/ui-kit.html` masthead**(심볼 있으면 락업, 없으면 `.wordmark` 폴백). 같은 `.lockup` CSS를 셋이 소비.
- **조정 주체 = 에이전트**: 락업 렌더 → `web-publisher-qa`로 스크린샷 → 균형 자가판정 → 토큰(`--logo-mark-scale` 등) 미세조정·재렌더 → 결과 제시. **사용자는 평이한 말로 승인/지시**("심볼 더 크게"), 수치·CSS 직접 편집 없음.
- **마크 정규화**: 심볼 자산을 일관된 시각 경계로(투명 여백 트림 등) → 기본값이 더 자주 그냥 맞아 조정은 예외.

### 3.5 design-logo 심볼-only
`logo.png`는 심볼만. `logo-art-direction.md §7`의 "Wordmark (if shown)" 줄을 "기본 심볼만; 워드마크는 락업에서 별도(스펙 B)"로 제약. production 콤비네이션 = 심볼 + 별도 워드마크 + 락업 조합(굽지 않음).

## 4. 아키텍처 / 소유 · 불변식

- **락업 CSS·토큰** = `tokens-to-css.mjs` 생성(브랜드킷 토큰 레이어 — `.wordmark`와 같은 집). 단일 소스.
- **design-logo** = 심볼 자산만 고정 경로 제공 + `logos.html`에 락업 렌더(자기 뷰 저작).
- **brand-kit** = `overview.html §6`에 `.lockup` 마크업 저작(consume).
- **ui-kit** = `view/ui-kit.html` masthead가 `.lockup` consume(심볼 있으면 락업, 없으면 `.wordmark` 폴백) + `slot:font-links`에 락업/워드마크 폰트 포함. tokens.css 재생성(`.lockup` 추가)은 ui-kit에 무해(추가 클래스일 뿐).
- **HTML 무편집 불변식 유지**: design-logo는 심볼 파일만 덮어쓰고, 락업 마크업은 brand-kit/logos.html/ui-kit이 저작·shared CSS 소비. design-logo가 남의 HTML을 편집하지 않는다.

## 5. 영향 파일 (예상)

| 파일 | 변경 |
|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `lockup` 블록 → `.lockup--horizontal/.stacked`·`.tagline`·토큰 emit | 
| `tests/tokens-to-css.test.mjs` | 락업 클래스·토큰·기본값 테스트 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens.json `lockup` 블록 + 기본값 설명 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6에 `.lockup` 렌더 지침 |
| `skills/design-logo/SKILL.md` | 심볼-only + `logos.html` 락업 렌더 + 프리뷰 게이트(에이전트 조정·승인) |
| `skills/design-logo/references/logo-sheet-html-direction.md` | logos.html에 락업 섹션 |
| `skills/references/design/logo-art-direction.md` | §7 "Wordmark (if shown)" 심볼-only 제약 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | masthead가 `.lockup` 렌더(심볼 있으면), 폴백 `.wordmark` |
| `skills/design-ui-kit/SKILL.md` | masthead 락업 지침 + `slot:font-links` 락업/워드마크 폰트 |

## 6. 열린 구현 질문 (플랜에서 확정)

1. 토큰 정확 이름·기본값(`--logo-mark-scale` 등) + `lockup` 블록 스키마.
2. `.lockup` CSS 구조(정렬을 flex baseline vs 광학 중심으로 어떻게) + 태그라인 룰 마크업.
3. 마크 정규화 방법(autocrop/트림을 어디서 — 심볼 자산 생성 시 vs 렌더 시 object-fit).
4. `logos.html` 락업 섹션이 폰트/이미지 워드마크 모드를 어떻게 분기 렌더하는지.
5. 에이전트 조정 루프를 SKILL에 어떻게 게이트로 명문화(web-publisher-qa 호출 시점·승인 문구).

## 7. 성공 기준
확정 심볼 + 워드마크가 `.lockup`으로 조합돼 logos.html·overview §6에 production 모습으로 보이고, 에이전트가 균형을 맞춰 제시하면 사용자가 평이한 승인만으로 락업을 확정할 수 있다. 마크 모양이 달라도 토큰 한 값 조정으로 어울리게 된다.
