# 진행상황 핸드오프 — design-logo (제시용 레시피 + 락업 시스템)

> 작성: 2026-06-05 세션 중단 시점. 다음 세션(집)에서 이 문서로 재개.

## 큰 그림

"로고가 너무 심플" 문제에서 출발 → 두 갈래로 작업.

- **스펙 A (제시용 레시피)** — `design-logo`가 `--autocrop off · --quality high · premium 프롬프트`로 풍부한 로고 생성. **✅ 완료·main 머지됨** (fast-forward, HEAD `3f0ff27` 계열). 검증 PASS(SugarLoop 엠블럼·콤비·심볼 3장, 투명 self-contained 확인).
- **스펙 B (로고 시스템)** — §6 백로그로 분해. 하위프로젝트:
  - **🅰 락업 시스템** — **← 지금 작업 중(아래)**.
  - 🅱 favicon/app-icon + 다크모드 — 미착수(검증 가정 선행 필요).
  - 🅲 타입 게이트(8종) — 보류(YAGNI 후보).

관련 정본 문서:
- 스펙 A: `docs/superpowers/specs/2026-06-05-design-logo-presentation-recipe-design.md` (§6에 B 백로그)
- 스펙 B-🅰: `docs/superpowers/specs/2026-06-05-design-logo-lockup-system-design.md`
- 플랜 B-🅰: `docs/superpowers/plans/2026-06-05-design-logo-lockup-system.md` ← **재개 시 이 플랜의 Task 5·6를 이어서**

## 현재 브랜치: `feat/design-logo-lockup` (main에서 분기)

작업트리 **깨끗**. 커밋(최신순):
```
2f1846a Task 4: 심볼-only + logos.html 락업 프리뷰 게이트
a39bda1 Task 3: overview §6 .lockup 렌더 지침
6db04f5 Task 2: brand-tokens.json lockup 블록 + 스키마
b97feda Task 1: tokens.css .lockup 클래스 + --logo-* 토큰 (코드+테스트)
8476707 (플랜)
6b1eaf6 (스펙)
```
테스트: **193/193 PASS** (Task 1에서 +4).

## 플랜 진행 상태 (Subagent-Driven 실행 중)

| Task | 내용 | 상태 |
|---|---|---|
| 1 | tokens-to-css `.lockup` + `--logo-*` (TDD 코드) | ✅ 완료. 스펙리뷰 PASS + 코드품질 **승인** |
| 2 | brand-tokens.json `lockup` 블록 + brand-kit SKILL | ✅ 완료. 스펙리뷰 PASS |
| 3 | brand-kit-html-direction §6 `.lockup` 렌더 | ✅ 완료(커밋·verify pass). **리뷰는 Task 6 최종 종합으로 모음** |
| 4 | design-logo 심볼-only + logos.html 락업 프리뷰 게이트 (3파일) | ✅ 커밋 완료. **⚠️ 스펙리뷰 미완(중단됨) — 재개 시 먼저 리뷰** |
| 5 | ui-kit masthead `.lockup` (템플릿+SKILL) | ⬜ 미착수 |
| 6 | sync·게이트·통합검증·최종 코드리뷰 | ⬜ 미착수 |

## 재개 시 할 일 (순서)

1. **Task 4 스펙 리뷰** (중단된 것). 확인 포인트: ① 5개 edit(A1·A2·B1·C1·C2) 존재, ② **§7 청크 coherence** — 스펙A premium 프레이밍(autocrop off·"finished premium logo"·flat no gradient) 유지되며 새 "Wordmark = symbol-only" 줄이 모순 없는지, ③ design-logo SKILL의 심볼-only/프리뷰 게이트가 기존 흐름과 충돌 없는지.
2. **Task 5** 실행(플랜 그대로): `ui-kit-sheet.html` masthead가 심볼 있으면 `.lockup`, 없으면 `.wordmark` 폴백 + SKILL 지침. (먼저 `ui-kit-sheet.html` Read 필요 — 현재 masthead `.wordmark` 패턴 확인.)
3. **Task 6**: `npm run sync` → `npm test`(193+) → `npm run validate` → 플랜 Step 3 통합검증(더미 tokens.css grep) → **최종 코드리뷰 서브에이전트**(전체 diff `main..HEAD`).
4. **finishing-a-development-branch**: main으로 fast-forward 머지 예상(브랜치가 main 조상 위). 머지 후 브랜치 삭제. push는 사용자 지시 시.

## 실행 방식 메모

- **Subagent-Driven**: 태스크마다 implementer(sonnet) → 스펙리뷰 → (코드는)코드품질리뷰. 템플릿은 `superpowers:subagent-driven-development`.
- 효율 조정: **단순 1줄 markdown append(Task 3 등)는 per-task 리뷰 생략하고 Task 6 최종 종합 리뷰로 모음**. 코드(Task 1)·다파일(Task 4)은 per-task 리뷰함.
- 커밋 메시지 끝: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

## 핵심 설계 결정 (락업)

- 레이아웃: `.lockup--horizontal`(심볼 좌+워드마크 우) + `.lockup--stacked`(세로). 태그라인 = `.lockup__tagline` on/off 옵션.
- 토큰(brand-tokens.json `lockup` 블록 → tokens.css): `--logo-mark-scale`(기본 **1.8**, 마크높이=워드마크 font-size 배수)·`--logo-gap`(0.5em)·`--logo-tagline-size/tracking`·taglineColor. `tokens-to-css.mjs`가 `.wordmark`와 같은 패턴으로 생성.
- **비율은 마크 모양마다 달라 고정 불가** → 기본값 + 브랜드 override + **에이전트가 프리뷰 렌더·스크린샷(web-publisher-qa)·markScale 조정 → 사용자는 평이한 승인만**(수치 직접 안 만짐).
- **design-logo `logo.png` = 심볼만**(워드마크 안 구움). 워드마크는 `.lockup`에서 별도 조합 → 분리성 보장.
- 프리뷰 렌더 위치 3곳: design-logo `logos.html` + brand-kit `overview.html §6` + ui-kit `view/ui-kit.html` masthead. 같은 `.lockup` CSS consume. **HTML 무편집 불변식 유지**(design-logo는 심볼 파일만 제공).

## 잡다 메모

- 비주얼 컴패니언 서버: 포트 61706(자동 종료됨/될 것). 재개 시 필요하면 재기동.
- 테스트 이미지(남겨둠): `design-test/SugarLoop/.design/candidate/logo/recipeA-test/`(새 레시피 3장)·`experiment-types/`·`experiment-15/`. plugin-library repo 밖.
- 동시 세션 해저드: 공유 git 인덱스 때문에 다른 세션의 `git add`가 내 `git commit`에 딸려갈 수 있음(이전에 9b0da2f에 discussion rename이 딸려갔던 사례). 재개 시 커밋 전 `git status` 확인.
- spec A §3.1에 배경 결정(투명+self-contained, 검증 PASS) 기록됨. spec A §6에 "design-logo logo.png=심볼만" B 노트 기록됨.
