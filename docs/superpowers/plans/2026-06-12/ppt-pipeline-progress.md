# ppt 파이프라인 — 진행 상황 인수인계

작성: 2026-06-12 (세션 중단, 집에서 이어서 진행 예정)

> **2026-06-15 갱신**: 파이프라인은 v1으로 구현 완료됐고, 이후 테마 저장 방식이 바뀌었다.
> 커스텀 테마용 `PPT_THEME_DIR` env와 `resolve-theme-dir.mjs`는 **제거**됐고, 모든 테마는
> `skills/ppt-theme/themes/<이름>/`에 커밋된다(아래 Task 9·35–37·52줄의 env 관련 서술은 폐기).
> 근거는 `docs/superpowers/specs/2026-06-12/ppt-pipeline-design.md`의 theme.json 절 참고.

## 한 줄 요약

`docs/superpowers/plans/2026-06-12/ppt-pipeline.md`(태스크 10개)를 **서브에이전트 구동 방식**으로
실행 중. **Task 1~3 구현·커밋 완료**, Task 4부터 남음. main 브랜치에 직접 커밋하는 중(이 repo 관례).

## 재개 방법

집 PC에서 새 세션을 열고 이렇게 말하면 된다:

> "docs/superpowers/plans/2026-06-12/ppt-pipeline.md 계획을 subagent-driven-development로 이어서 실행해.
> 진행 상황은 ppt-pipeline-progress.md 참고. Task 3 리뷰부터 다시 하고 Task 4로 진행."

- 실행 스킬: `superpowers:subagent-driven-development` (태스크마다 새 서브에이전트 + 2단계 리뷰: 스펙 준수 → 코드 품질).
- 커밋 트레일러: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` (빈 줄 뒤).
- 브랜치: main에 직접 커밋(별도 분기 안 함 — repo 관례, 사용자 승인됨).
- 커밋 전 사용자 확인 규칙이 있으나, 이번 실행은 "1번으로 진행" 승인으로 서브에이전트가 태스크 단위 커밋 진행 중.

## 완료된 태스크

| Task | 내용 | 커밋 | 상태 |
|---|---|---|---|
| 1 | pptxgenjs 의존성 추가 | `c0241c6` | ✅ 완료 (4.0.1 설치, 스모크 통과) |
| 2 | 덱 스펙 검증 모듈 `scripts/lib/ppt/validate-spec.mjs` | `d4bf0e6` + `f4ac0f1` | ✅ 완료 (12/12 테스트, 스펙·품질 리뷰 통과) |
| 3 | 기본 테마 + 로더 `scripts/lib/ppt/load-theme.mjs`, `skills/ppt-theme/themes/default-corporate/theme.json` | `a24e2a5` | ⚠️ **구현·커밋됨, 리뷰 미완** |

### Task 3 리뷰 미완 (재개 시 가장 먼저 할 일)

Task 3은 구현·테스트(5/5 통과)·커밋까지 됐지만, **스펙 준수 리뷰와 코드 품질 리뷰를 돌리던 중
세션이 중단**됐다. 재개하면 `a24e2a5`(base `f4ac0f1`)에 대해 두 리뷰를 먼저 돌릴 것.

알려진 minor 1건 (리뷰에서 판단할 것):
- `load-theme.mjs`의 `loadTheme()`가 `loadEnv()`를 두 번 호출한다(한 번은 `availableThemes()`
  경유, 한 번은 직접 `merged.PPT_THEME_DIR` 읽기). 동작은 정상. DRY 관점에서 정리할지 리뷰에서 결정.

Task 2 코드 품질 리뷰가 남긴 수용된 설계 결정(참고):
- M2: image `path`의 존재/확장자 검증 안 함 → **의도적**(존재는 렌더 단계 책임).
- M3: chartData/tableData의 리프 문자열 길이·숫자 타입 검증 안 함 → **의도적**(v1 계약 관대).

## 남은 태스크 (계획 문서에 전문 있음)

| Task | 내용 | 모델 권장 |
|---|---|---|
| 4 | 렌더러 `scripts/lib/ppt/render-deck.mjs` (spec+theme → pptx) + 테스트 + **PowerPoint 눈 확인 수동 스텝** | 표준 |
| 5 | `.gitignore`에 `.slides/` + 검수 스크립트 `scripts/lib/ppt/export-png.ps1` (COM PNG) | 표준 |
| 6 | `skills/ppt-create/SKILL.md` (writing-skills 사용) | 표준 |
| 7 | `skills/ppt-plan/SKILL.md` (writing-skills 사용) | 표준 |
| 8 | `skills/ppt-edit/SKILL.md` (writing-skills 사용) | 표준/빠른 |
| 9 | `skills/ppt-theme/` 나머지 — `resolve-theme-dir.mjs` + SKILL.md + 테스트 (**potx 이식 제외**) | 표준 |
| 10 | E2E 수동 검증(실사용 1회) + 스펙 문서 상태 갱신 | 메인 세션 |

주의:
- Task 4·5의 **수동 검증 스텝**(PowerPoint로 .pptx 열어 눈 확인, COM PNG export)은 사용자가 직접
  돌려야 함 — 서브에이전트는 자동 테스트까지만, 눈 확인은 메인 세션/사용자.
- 스킬 추가(Task 6~9) 뒤에는 `npm run sync`로 Codex 번들 재생성 필요(gitignore, 커밋 안 함).
- potx 이식(`import-potx.mjs`)은 이번 계획 범위 밖 — 별도 후속 계획.

## 핵심 설계 메모 (빠른 복기용)

- 단일 진실 소스: `.slides/<덱>/spec.json`. 렌더는 결정적 → 안 고친 슬라이드는 안 바뀜(drift 없음).
- `deck.pptx`는 빌드 산출물 — 손편집 금지, 수정은 spec 경유.
- 레이아웃 8종 필드 계약 권위 = `validate-spec.mjs`의 `LAYOUTS`. 테마의 `LAYOUT_NAMES`와 일치해야 함.
- 검수 = PowerPoint COM `Slide.Export`(이 머신 16.0 작동 확인). COM 없으면 .pptx는 정상, 검수만 스킵.
- 스킬 가족: `ppt-plan`(자료·전략·페이지 설계, 본체) → `ppt-create`(생산) / `ppt-edit`(수정 재진입) / `ppt-theme`(테마).
- 스펙 문서: `docs/superpowers/specs/2026-06-12/ppt-pipeline-design.md`.

## 테스트 현황

```
node --test "tests/scripts/lib/ppt/**/*.test.mjs"   # validate-spec 12개 + load-theme 5개 = 17개 통과
npm test                                            # 전체(기존 포함) — 재개 후 회귀 확인용
```
