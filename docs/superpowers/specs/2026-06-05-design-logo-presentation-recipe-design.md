# design-logo 제시용 레시피 수정 (스펙 A) Design

> Status: Draft (brainstorming 산출, 슬림-A로 축소). 다음 = writing-plans.
> Date: 2026-06-05
> 범위 결정: discussion-vs 2회 압박 결과, "로고 너무 심플"의 **검증된 최소 경로 = 생성 레시피 수정**만 본 스펙(A)으로 출하한다. 로고 시스템(타입 게이트·자산 suite·락업·favicon·다크)은 **별도 스펙 B로 이연**(§6).

## 0. 한 줄 요약

`design-logo`가 제시용 로고를 **`--autocrop` off · `--quality high` · 여백 유지**로 생성하도록 레시피만 바꾼다. "너무 심플/유치"의 근본 원인이 `투명+autocrop+quality low` 조합임이 실험으로 확정됐고(아래 §1), 이 파라미터 교체가 그 불만의 ~90%를 해소한다. 그 외 일체는 범위 밖.

## 1. 문제 & 검증된 근본 원인

- 현 `design-logo`는 `gpt-image-1.5 --background transparent --autocrop --quality low`로 생성 → 구조적으로 favicon급 결과("너무 심플").
- 사용자 레퍼런스(OpenAI "Field & Flour")는 불투명 캔버스·여백·여러 톤 → 현 파이프라인과 충돌(투명+autocrop은 여백을 죽임).
- **실험(2026-06-05, SugarLoop):** 같은 컨셉을 `불투명 + quality high + autocrop off`로 생성 → 프리미엄·완성형. 산출물 증거: `design-test/SugarLoop/.design/candidate/logo/experiment-types/`(8타입)·`experiment-15/`(모델 대조군). **레시피가 원인임이 실증됨.**
- **모델은 변수 아님**(gpt-image-2 vs 1.5 둘 다 양호) → 모델 변경 불필요, **gpt-image-1.5 유지**.

## 2. 목표 / 비목표

**목표(A)**
- `design-logo`가 "진짜 로고처럼 구체적인" 제시용 로고를 만든다 — *레시피 파라미터 교체로만*.
- 풍부한(여백 포함·비-autocrop) 로고가 기존 overview 보드·다운스트림과 깨지지 않게 공존.
- 기존 "design-logo는 HTML 무편집" 불변식을 **유지**한다.

**비목표(→ 스펙 B로 이연)**
- 8타입 추천 게이트 / 2축 자산 모델 / 분리 자산 suite / 락업 CSS / favicon SVG 전략 / 다크 변형 / PNG→SVG 트레이서.
- 워드마크 폰트·이미지 분기(이미 머지됨 — 본 스펙 무관).

## 3. 변경 (A)

### 3.1 레시피 파라미터
`design-logo`의 **제시용 로고 생성** 호출을 바꾼다:
- `--quality low` → **`--quality high`**.
- **`--autocrop` 제거**(여백 유지 — 마크가 캔버스를 꽉 채우지 않게).
- 프롬프트 프레이밍 추가: `premium, intentional, flat, no gradient, looks like a real shipped logo` + 브랜드 메타포 바인딩(BRAND_KIT §6).
- 모델·배경: **gpt-image-1.5 유지.** **배경 확정 = 투명 + "self-contained" 프롬프트 보강**(filled badge/mark가 투명 위에서 안 비게). 보드·다운스트림이 투명 컷아웃 전제라 정합적. **검증 PASS(2026-06-05)**: 새 레시피로 SugarLoop 엠블럼·콤비네이션·심볼 3장 생성 → 전부 풍부 + 투명 self-contained(속 안 빔) 확인(`design-test/SugarLoop/.design/candidate/logo/recipeA-test/`). 본 스펙은 "autocrop off + high + 투명 self-contained"를 핵심으로 고정.
- 발산/다듬기 루프·시드 앵커·`--auto-version` 등 나머지 흐름은 현행 유지.

### 3.2 보드/다운스트림 공존
- 비-autocrop 로고는 여백을 품으므로, overview §6 로고 자리가 `object-fit:contain` + `max-height`로 받게 한다(§6 line 22는 이미 그 방식 — 확인됨).
- `brand-kit-html-direction.md §4`(autocrop 전제)에 한 줄: **"제시용 로고는 autocrop 안 함(여백 포함) — `object-fit:contain`로 배치."**
- `logo-art-direction.md`에 §3.1 레시피(autocrop off·high·여백) 반영.

### 3.3 불변식 유지 (명시)
- `design-logo`는 여전히 **`assets/logo/logo.png` 고정 경로만 덮어씀** → overview §6은 그 경로를 가리키므로 **HTML 무편집**. 새 자산·슬롯 추가 없음(그건 스펙 B).
- 즉 본 스펙은 *생성 파라미터*만 바꾸고 자산 토폴로지·HTML 계약은 **건드리지 않는다**.

## 4. 영향 파일 (A)

| 파일 | 변경 |
|---|---|
| `skills/design-logo/SKILL.md` | "이미지 생성" 호출 예시·흐름의 quality/autocrop 파라미터 + 프롬프트 프레이밍 |
| `skills/references/design/logo-art-direction.md` | §7 청크·생성 가이드에 autocrop off·high·여백·flat 반영 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §4 autocrop 전제에 "제시용 로고 예외(비-autocrop·object-fit:contain)" 한 줄 |

> 코드 스크립트(`image-gen.mjs`) 변경 없음 — 플래그 조합만 바뀜. 테스트 영향 없음(문서·스킬 가이드 위주).

## 5. 검증 (플랜에서)
- 배경 분기(투명 vs 불투명) 1~2장 비교 생성 → 보드 호환·풍부함 트레이드오프 확정.
- 바뀐 레시피로 SugarLoop 로고 1장 생성 → overview §6에 `object-fit:contain`로 얹어 깨짐 없는지 육안 확인(web-publisher-qa 선택).

## 6. 이연 — 스펙 B (로고 시스템, 별도 논의)

A 출하 후 별도 스펙으로 다룬다. **착수 전 선검증 필요 항목 포함:**
- 8타입 catalog·선택 게이트(시각 예시 기반).
- 분리 자산 suite(심볼·워드마크·락업·favicon·app-icon) + 캐노니컬 경로 + §6 슬롯 *추가*(brand-kit 저작 가이드 수정으로, 무편집 불변식 유지하며).
- 락업 = 토큰 CSS(소제목 포함) / 진짜 융합만 베이크 이미지. (소유 위치 미정.)
- favicon/단색마크 전략 (유력안 — SVG 회피):
  - **단색 마크 = 고해상도 PNG 마스터 + 재색**으로 간다(손저작 SVG·트레이싱 회피 → 그 충실도 미검증 리스크 제거). ① 페이지 내 사용은 **CSS `mask` + `background-color`로 런타임 재색**(repo 선례: §6 앱아이콘 `filter:brightness(0) invert(1)`). ② 브라우저 탭 favicon **파일**은 CSS 불가 → 단색 마스터에서 `favicon-light/dark.png`를 굽는 **작은 재색 스크립트**(`prefers-color-scheme`로 스왑). → 안 깨지고 색 2트랙.
  - 경계: **단색에만** 성립. 풍부한 다색 엠블럼 다크는 재색이 아니라 **디자인된 다크 2장**.
  - 여전히 선검증: "풍부한 엠블럼 → 작은 단색 마크로 모티프 축약" 가능성(트레이싱은 ~192px 열화로 탈락 — 손/생성 어느 경로로 축약할지).
- 다크 변형(풍부한 로고 light/dark 2장).
- brand-kit/design-logo 책임 경계(brand-kit 과적재 주의 — design-logo가 로고 시스템 소유 유지).
- PNG→SVG 트레이서: 거의 안 쓰이는 폴백 → 넣을지 자체 재검토.
- **design-logo `logo.png` = 심볼만(워드마크 안 구움) — 분리성 보장.** A에서 갱신한 `logo-art-direction.md §7`의 "Wordmark (if shown)" 줄이 심볼 자산에 글자를 굽도록 유인할 수 있으니, B에서 "기본 심볼만, 워드마크는 락업에서 별도"로 제약한다. production 콤비네이션 = 심볼(글자 없음) + 별도 워드마크(HTML `.wordmark` 또는 `wordmark-base.png`) + 락업 조합. 통째로 baked 콤비네이션은 "진짜 융합"일 때만(그때도 단독 워드마크 별도 emit). 근거: 2026-06-05 테스트에서 #2 콤비네이션이 baked 워드마크라 분리 불가 확인.

## 7. 비범위 재확인
A는 *생성 레시피 파라미터*만 바꾼다. 자산 토폴로지·HTML 계약·타입 게이트·자산 분류·락업·favicon은 전부 스펙 B.
