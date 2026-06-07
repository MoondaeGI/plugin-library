# §6 로고 섹션: 락업 패밀리 6종 + 이미지-모드 락업 사이징 + 전용 favicon/app-icon 마크 Design

> brand-kit overview §6에 락업 패밀리 6종을 렌더하고, 이미지-모드 워드마크의 락업 사이징을 토큰으로 잡으며, favicon·app-icon을 **로고 재사용/생성이 아니라 전용 단순 마크로 저작**한다(한 마크 통일). brand-kit이 저작해 overview에 표시하고 design-logo가 로고 lock 후 정제한다.

## 1. 배경 / 문제

1. **§6에 favicon이 안 뜬다.** favicon·app-icon은 design-logo가 굽기 전까지 §6에서 생략 → 온디맨드인 design-logo를 안 돌리면 빈다.
2. **favicon은 로고에서 만들면 안 된다.** 풀로고를 단색으로 눌러 만들면 16px에서 뭉개지고(데모 실증), gpt-image로 새로 생성하면 마크가 흔들린다. → favicon은 **로고를 재사용·재생성하지 않고, 16px 가독을 우선한 전용 단순 마크를 저작**해야 한다. 브랜드 §6 심볼 방향이 이미 단순(예: 아케이드 플레이 버튼)이라 벡터로 직접 저작 가능 — iconset이 gap 아이콘을 SVG로 저작하는 것과 같은 결.
3. **락업이 이미지-모드 워드마크에서 안 맞는다.** 락업 CSS는 `.lockup__mark`만 토큰(`--logo-mark-scale`)으로 잡고 이미지 워드마크(`wordmark-base.png`) 높이를 묶는 토큰이 없다 — 폰트 모드 전제. 이미지-모드 브랜드(심볼 716×578 vs 워드마크 1178×512 2줄)에서 균형이 안 잡힌다(데모 실증·수정 확인).
4. **락업을 한 곳에서 다 보고 싶다.** 현재 §6는 가로·세로 2종 → 6종 패밀리를 원함.

## 2. 목표 / 비목표

**목표**
- **§6 락업 패밀리 6종**: 1 가로 · 2 세로 · 5 심볼단독 · 6 워드마크단독(항상) + 3 가로+태그라인 · 4 세로+태그라인(태그라인 있을 때). 기존 `.lockup*`/`.wordmark` 재사용, 새 락업 레이아웃 CSS 없음.
- **락업 이미지-모드 사이징 토큰**(`--logo-wm-img-scale` + `.wordmark-img`). 에이전트가 프리뷰 게이트에서 심볼·워드마크 둘 다 튜닝(사용자는 승인만).
- **전용 favicon/app-icon 마크(한 마크 통일)**: 에이전트가 브랜드 §6 심볼 방향 + 토큰 색으로 **SVG를 직접 저작**. 로고 재사용·gpt-image 없음. **brand-kit이 저작해 overview에 표시**, **design-logo가 로고 lock 후 정제**.
- §6에 favicon/app-icon 마크 + `<head>` favicon `<link>`를 **무조건** 표시(design-logo 미실행이어도 채워짐).
- **로고 단색 변형 표시 유지**: 기존 `tokens.css` `.mark-mono` 마스크(로고 alpha 재색)로 §6에 로고의 단색 변형을 보여준다 — 파일 생성 없음.

**비목표 (YAGNI / 사용자 결정)**
- **로고에서 favicon 베이크 폐기.** `recolorMark`/`compositeAppIcon`로 favicon·app-icon을 굽는 경로 제거. `bake-logo-assets.mjs`는 고아가 되므로 제거(아래 D7).
- favicon 자동 단순화·gpt-image 생성 없음(저작은 에이전트 벡터 저작).
- 풀컬러 다크 로고 리맵(design-logo 흐름 12, `remap-logo-dark.mjs`)은 그대로 유지.
- apple-touch/PWA용 PNG 래스터 세트는 범위 밖(SVG favicon으로 브라우저 탭 충분, 필요 시 후속).

## 3. 핵심 결정

- **D1 — favicon/app-icon = 전용 저작 마크(SVG).** 로고 비파생, gpt-image 없음. 권위 = 브랜드 §6 심볼 방향 + `brand-tokens.json` 색. 좌표·색이 명시된 벡터라 재현 가능(흔들림 0).
- **D2 — 통일(한 마크).** 같은 마크가 favicon과 app-icon 양쪽. 산출 `assets/logo/favicon.svg`.
- **D3 — 저작 단계: brand-kit 저작 + design-logo 정제.** brand-kit이 §6 자산 생산에서 `favicon.svg`를 저작해 overview에 표시(임시 등급) → design-logo가 로고 lock 후 확정 심볼에 맞게 정제(덮어씀). `candidate/logo/logo-briefs.md` non-clobber 동일.
- **D4 — §6 락업 6종**(위 목표).
- **D5 — 락업 이미지-모드 사이징.** 심볼=`--logo-mark-scale`, 이미지 워드마크=`--logo-wm-img-scale`. 폰트 모드 `.wordmark`는 현행(변경 없음).
- **D6 — 로고 단색 변형 = `.mark-mono` 마스크**(로고 alpha, 파일 생성 없음). 기존 tokens.css 재사용.
- **D7 — `bake-logo-assets.mjs` + 테스트 제거.** favicon/app-icon 베이크가 폐기되어 소비자가 없다(다크 리맵은 별도 `remap-logo-dark.mjs`라 무관, mark-mono는 마스크라 파일 불요). `2026-06-07/design-logo-favicon-monochrome-design.md`(B-🅱-ii)의 베이크 흐름을 본 스펙이 대체 — 해당 SKILL 흐름·스펙 문구를 "전용 마크 저작"으로 갱신. (plan에서 잔존 소비자 0 재확인 후 제거.)

## 4. 전용 favicon/app-icon 마크 (저작)

- **형태**: 브랜드 §6 심볼 방향을 16px 가독 우선으로 단순화한 벡터. Pixel Carnival 확정안 = **B 스퀘어클 버튼**(미드나잇 남색 라운드 타일 + 라임 둥근사각 캡 + 바이올렛 베이스 + 음각 플레이 삼각형).
- **산출**: `assets/logo/favicon.svg`(단일 마크). overview §6 favicon/app-icon 자리 + `<head><link rel="icon" href="../assets/logo/favicon.svg">`가 이 파일을 가리킨다.
- **저작 주체**: 에이전트. 좌표·`brand-tokens.json` 색(HEX)으로 결정적 저작, gpt-image 없음. 16px 프리뷰로 가독 자가판정(라이브 http).
- **일반화**: §6 심볼이 기하/단순하면 직접 저작. 회화적이면 핵심 요소만 추상화해 저작(품질은 에이전트 프리뷰 자가판정). 단순화 자동 폴백은 만들지 않는다(사용자: 단순 쪽).

## 5. brand-kit 흐름

- **§6 자산 생산(흐름 5)**: `logo-briefs.md`가 없으면 `favicon.svg`를 저작(임시 등급). overview §6에 favicon/app-icon 마크 + head favicon `<link>` **무조건** + 락업 6종.
- **non-clobber(흐름 8)**: `logo-briefs.md`가 있으면 favicon.svg를 건드리지 않는다(design-logo 정제본 보존).
- `brand-tokens.json` `lockup` 블록에 선택 키 `wmImgScale` 추가.
- SKILL.md line 224("단색 자산 베이크는 design-logo 소관") → "favicon/app-icon은 전용 마크 저작(brand-kit 임시 / design-logo 정제), 단색 자산 베이크 없음"으로 교체.

## 6. design-logo 흐름

- **흐름 11 재작성**: gpt-image 단색 생성·`bake-logo-assets` 호출 제거 → 로고 lock 후 `favicon.svg`를 확정 심볼에 맞게 **정제 저작**(brand-kit 임시본 덮어씀). 16px 가독 프리뷰는 인지용(폴백·재생성 없음). app-icon은 같은 마크.
- **흐름 12(다크 리맵) 유지.**
- bake import·참조 제거. 비대칭 노트·B-🅱-ii 참조를 새 모델로 갱신.

## 7. 락업 시스템 (이미지-모드 사이징)

- `tokens-to-css.mjs`: `--logo-wm-img-scale` var emit + `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }` emit. 기본값 합리값(예: 1.5).
- 폰트 모드 `.wordmark`는 현행(변경 없음). `brand-tokens.json` `lockup.wmImgScale`(선택)→var, 비면 기본값.

## 8. overview §6 렌더 (참조 가이드)

- 락업 6종(D4). 폰트/이미지 워드마크 모드 분기 유지(이미지=`<img class="wordmark-img">`, 폰트=`<span class="wordmark">`).
- favicon/app-icon = `favicon.svg`(같은 마크) 타일 + 16px/32px 가독 미리보기. `<head>` favicon `<link>` 무조건.
- 로고 단색 변형 행 = `.mark-mono` 마스크(로고 alpha, 토큰 색).

## 9. 영향 파일

| 파일 | 변경 |
|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `--logo-wm-img-scale` + `.lockup .wordmark-img` emit |
| `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` | 새 var·클래스·기본값 테스트 |
| `skills/design-brand-kit/SKILL.md` | §6 `favicon.svg` 저작 + 락업 6종, `lockup.wmImgScale` 스키마, line 224 교체, favicon/app-icon `<head>`·타일 무조건 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 락업 6종 + `favicon.svg`(head link·타일) 무조건 + `.wordmark-img` + 단색 마스크 행 |
| `skills/design-logo/SKILL.md` | 흐름 11 재작성(favicon.svg 정제 저작, bake 제거), 락업 프리뷰 워드마크 튜닝, 비대칭/B-🅱-ii 참조 갱신 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | 단색/락업·favicon 프리뷰 갱신(저작 마크·워드마크 사이징) |
| `skills/design-logo/scripts/bake-logo-assets.mjs` | **삭제**(고아 — favicon/app-icon 베이크 폐기) |
| `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs` | **삭제** |
| `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md` | B-🅱-ii: 베이크 → 전용 마크 저작으로 대체됨 표기 |

> `tokens.css` `.mark-mono`는 **유지**(로고 단색 변형 표시용). `remap-logo-dark.mjs`·흐름 12는 **무변경**.

## 10. 검증

- `npm test`: `tokens-to-css` 새 var/클래스/기본값 테스트 통과 + bake 테스트 제거 후 전체 PASS(무회귀).
- `npm run validate`: 생성물 일치.
- 수동(더미 `.design` over http): brand-kit이 `favicon.svg` 저작 → overview §6 표시·`<head>` 적용 확인. `logo-briefs.md` 두면 non-clobber. 락업 6종(태그라인 유/무)·**이미지-모드 워드마크 균형**·favicon 16px 가독·로고 단색 마스크 렌더 확인.
- `npm run sync` 후 `/reload-plugins`(Claude)·`npm run codex:reinstall`(Codex) 안내.

## 11. 범위 밖 / 파킹

- favicon 자동 단순화/gpt-image, apple-touch·PWA PNG 세트.
- 풀컬러 다크 리맵(흐름 12) 변경.
- PNG→SVG 트레이서, 진짜 융합 베이크 락업.
