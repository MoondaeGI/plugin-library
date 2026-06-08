# §6 로고 섹션: 락업 패밀리 6종 + 이미지-모드 락업 사이징 + favicon/app-icon(PNG, 로고 맥락 생성) Design

> brand-kit overview §6에 락업 패밀리 6종을 렌더하고, 이미지-모드 워드마크의 락업 사이징을 토큰으로 잡으며, favicon·app-icon을 **로고와 같은 맥락에서 만든 PNG 마크**로 산출한다(로고 이미지 + 캐싱한 로고 프롬프트로 단순화 생성, 단 레터마크/이미 단순한 심볼은 로고 그대로 재사용). 추가로 **마스코트 아키타입을 가드**한다(gpt-image가 캐릭터 일관성을 못 지킴).
>
> **개정 이력(2026-06-08):** 초안의 "전용 SVG 마크 저작" 방향을 폐기하고 **PNG + 로고-맥락 생성(접근 C)** 으로 전환. 근거는 §1.2·§4. (제자리 갱신 — 06-07 pair 유지.)

## 1. 배경 / 문제

1. **§6에 favicon이 안 뜬다.** favicon·app-icon은 design-logo가 만들기 전까지 §6에서 생략 → 온디맨드인 design-logo를 안 돌리면 빈다.
2. **favicon은 "로고 그대로 축소"로는 안 된다(복잡 로고).** 풀로고를 16px로 축소하면 뭉개진다(데모 실증 — 워드마크·마스코트·엠블럼 전부 16px에서 깨짐). 반대로 **로고를 `--image`로 주입하고 "핵심 모티프만 남겨 단순화"하라고 생성**하면 로고와 한 가족이면서 16px에 읽히는 마크가 나온다(데모 실증 — 6장 생성으로 확인). → favicon은 **로고 맥락에서 생성(접근 C)**. 단 **레터마크/이미 단순한 심볼**은 그대로 축소해도 읽히므로 재사용한다.
3. **포맷은 PNG로 통일.** 로고가 PNG(gpt-image 투명 산출)이고, 재사용 분기는 본질적으로 PNG다. SVG로 통일하려면 재사용 분기에서 PNG→SVG 트레이싱(손실)이 필요하고, gpt-image 생성도 PNG 네이티브다. app-icon은 어차피 래스터를 원한다. favicon 크기(16/32px)에서 SVG의 무한 확대 이점은 미미. → **favicon/app-icon = PNG.**
4. **마스코트 로고는 gpt-image 한계다.** diffusion 계열은 같은 캐릭터를 여러 생성·접점에서 일관되게 유지하지 못한다(favicon↔로고 토끼가 다른 캐릭터로 보이는 데모 실증). 마스코트는 단발 로고로 끝나므로 발산에서 **피하도록 가드**한다.
5. **락업이 이미지-모드 워드마크에서 안 맞는다.** 락업 CSS는 `.lockup__mark`만 토큰(`--logo-mark-scale`)으로 잡고 이미지 워드마크(`wordmark-base.png`) 높이를 묶는 토큰이 없다 — 폰트 모드 전제.
6. **락업을 한 곳에서 다 보고 싶다.** 현재 §6는 가로·세로 2종 → 6종 패밀리.

## 2. 목표 / 비목표

**목표**
- **§6 락업 패밀리 6종**: 1 가로 · 2 세로 · 5 심볼단독 · 6 워드마크단독(항상) + 3 가로+태그라인 · 4 세로+태그라인(태그라인 있을 때). 기존 `.lockup*`/`.wordmark` 재사용, 새 락업 레이아웃 CSS 없음.
- **락업 이미지-모드 사이징 토큰**(`--logo-wm-img-scale` + `.wordmark-img`). 에이전트가 프리뷰 게이트에서 심볼·워드마크 둘 다 튜닝(사용자는 승인만).
- **favicon/app-icon = PNG, 로고 맥락 생성(접근 C)**:
  - **재사용 분기** — 레터마크/이미 16px에 읽히는 단순 심볼: 확정 `logo.png`를 `autocrop`해 `favicon.png`로 재사용(생성 0).
  - **생성 분기** — 그 외(픽토리얼·엠블럼·콤비네이션·복잡 심볼·워드마크): 확정 `logo.png`를 `--image --input-fidelity high`로 주입 + **캐싱한 로고 프롬프트**(모티프·실 HEX·금지)를 의미 가이드로 더해 "핵심 모티프만, 텍스트/프레임/디테일 제거, 16px 가독"으로 단순화 생성.
- **app-icon = favicon 마크를 브랜드 타일에 얹은 CSS 프리뷰**(overview §6). 별도 베이크 파일 없음.
- §6에 favicon/app-icon 마크 + `<head>` favicon `<link>`를 **무조건** 표시(design-logo 미실행이어도 brand-kit 임시본으로 채워짐).
- **마스코트 가드**: 발산에서 마스코트/캐릭터/의인화 마크를 피하도록 `logo-art-direction.md` Avoid에 명시(스트레이 언급 1곳 제거).
- **로고 단색 변형 표시 유지**: 기존 `tokens.css` `.mark-mono` 마스크(로고 alpha 재색)로 §6에 로고의 단색 변형을 보여준다 — 파일 생성 없음.

**비목표 (YAGNI / 사용자 결정)**
- **로고에서 favicon 베이크 폐기.** `bake-logo-assets.mjs`(`recolorMark`/`compositeAppIcon`/`bakeAll`) 제거 — favicon은 재사용/생성 PNG, app-icon은 CSS 프리뷰라 소비자 0(아래 D7).
- **전용 SVG 마크 저작 폐기**(초안 방향). 손저작 SVG는 마크 품질이 떨어지고 PNG→SVG 변환도 손실이라, PNG 생성/재사용으로 간다.
- **마스코트 아키타입 정식 추가 안 함**(애초에 없음 — 가드만 명문화).
- 풀컬러 다크 로고 리맵(design-logo 흐름 12, `remap-logo-dark.mjs`)은 그대로 유지.
- apple-touch/PWA용 PNG 래스터 사이즈 세트는 범위 밖(브라우저 탭·overview 프리뷰엔 단일 PNG로 충분, 필요 시 후속).

## 3. 핵심 결정

- **D1 — favicon/app-icon = PNG.** 로고가 PNG고 재사용 분기가 PNG 네이티브, app-icon도 래스터. 포맷 단일화로 소비처(overview·`<head>`)는 항상 `favicon.png` 하나만 가리킨다.
- **D2 — 로고 맥락 생성(접근 C).** 비주얼 락은 **로고 이미지**(`--image --input-fidelity high`)가, 의미 가이드는 **캐싱한 로고 프롬프트**가 잡는다 — 둘을 합쳐 favicon↔로고 매칭을 최대화. 텍스트만(프롬프트 캐싱 단독)은 드리프트, 동시 생성은 "로고가 늦게 확정"되는 탐색→lock 플로우와 안 맞아 둘 다 기각.
- **D3 — 레터마크/단순 심볼 예외 = 재사용.** 이미 16px에 읽히는 마크는 `autocrop`해 그대로 favicon. 생성 비용·드리프트 0.
- **D4 — 캐싱 위치 = `candidate/logo/logo-prompt.txt`.** design-logo가 로고 lock 시 그 확정 컨셉의 최종 생성 프롬프트를 이 파일에 저장. favicon 생성 분기가 읽어 재료로 쓴다. (없으면 `logo-briefs.md`·`BRAND_KIT.md §6`에서 모티프·색을 재구성.)
- **D5 — 저작 주체: brand-kit 임시 + design-logo 정제.** brand-kit은 §6 자산 생산에서 `logo-base.png`를 `autocrop`해 **임시 `favicon.png`**(무API·§6 안 빔)를 둔다. design-logo가 로고 lock 후 확정 `logo.png` 기준으로 재사용/생성해 덮어쓴다. `candidate/logo/logo-briefs.md` non-clobber 동일.
- **D6 — app-icon = CSS 프리뷰.** overview §6에서 `favicon.png`를 브랜드색 라운드 타일에 얹어 보여준다(마크 색 보존). 별도 `app-icon.png` 파일 없음.
- **D7 — `bake-logo-assets.mjs` + 테스트 제거.** favicon 재사용/생성 + app-icon CSS라 베이크 소비자 0. `2026-06-07/design-logo-favicon-monochrome-design.md`(B-🅱-ii)의 베이크 흐름을 본 스펙이 대체 — 해당 스펙에 대체 표기.
- **D8 — 마스코트 가드.** `logo-art-direction.md` §6 Avoid(line 75) + §7 프롬프트 청크 Avoid(line 88) + 7.1 보드 블록 Avoid(line 102)에 "마스코트·캐릭터·의인화 마크 회피(gpt-image 캐릭터 일관성 한계)" 추가. `brand-kit-image.md`의 스트레이 "심볼릭 마스코트"(line 116) 제거.
- **D9 — 락업 6종 + 이미지-모드 사이징.** (초안과 동일 — 변경 없음.)
- **D10 — `.mark-mono` 유지.** 로고 단색 변형 표시용(로고 alpha 마스크, 파일 불요).

## 4. favicon/app-icon (PNG, 접근 C)

- **포맷**: PNG 투명. 산출 `assets/logo/favicon.png`(단일 마크). overview §6 favicon/app-icon 자리 + `<head><link rel="icon" href="../assets/logo/favicon.png">`가 이 파일을 가리킨다.
- **재사용 분기(레터마크/단순 심볼)**: `node ../image-gen/scripts/autocrop.mjs --in <logo.png> --out <favicon.png> --pad-pct 6` (또는 image-gen autocrop). 생성 없음.
- **생성 분기(그 외)**:
  - 프롬프트 = 캐싱한 로고 프롬프트의 브랜드/모티프/팔레트/금지 줄 + favicon 단순화 지시("single bold flat mark of the core motif only, drop text/frame/fine detail, legible at 16px, transparent").
  - 호출: `--image <logo.png> --input-fidelity high --model gpt-image-1.5 --background transparent --quality high --autocrop` → `candidate/logo/favicon-candidate.png`(`--auto-version`).
  - 프리뷰 게이트: 16/24/32/48px·light/dark로 렌더(라이브 http) → `web-publisher-qa` 스크린샷 → 가독 자가판정 → 부족하면 더 굵게·단순하게 재생성 → 사용자 승인(평이).
- **app-icon**: 별도 파일 없이 overview §6에서 `favicon.png`를 `--color-primary`(또는 surfaceAlt) 라운드 타일에 얹어 프리뷰. 마크는 자기 색 보존(어두운 타일이면 흰 실루엣 옵션).
- **일반화**: 레터마크/단순 심볼이면 재사용, 그 외엔 생성. "단순한가"는 에이전트가 16px 프리뷰로 자가판정.

## 5. brand-kit 흐름

- **§6 자산 생산(흐름 5)**: `logo-briefs.md`가 없으면 `logo-base.png`를 `autocrop`해 **임시 `favicon.png`**(무API)를 둔다. overview §6에 favicon/app-icon 마크 + head favicon `<link>` **무조건** + 락업 6종.
- **non-clobber(흐름 8)**: `logo-briefs.md`가 있으면 favicon.png를 건드리지 않는다(design-logo 정제본 보존).
- `brand-tokens.json` `lockup` 블록에 선택 키 `wmImgScale` 추가.
- SKILL.md line 224(베이크 노트) → "favicon/app-icon은 PNG(brand-kit 임시 autocrop / design-logo 재사용·생성 정제), 베이크 없음"으로 교체.

## 6. design-logo 흐름

- **흐름 11 재작성**: gpt-image 단색 생성·`bake-logo-assets` 호출 제거 → 로고 lock 후 favicon **재사용(레터마크/단순) 또는 생성(접근 C, 그 외)** → `assets/logo/favicon.png` lock. 시안 `candidate/logo/favicon-candidate.png`. app-icon은 같은 마크(CSS 프리뷰).
- **흐름 10**: lock 시 확정 컨셉의 최종 생성 프롬프트를 `candidate/logo/logo-prompt.txt`에 저장(favicon 생성 분기 재료).
- **흐름 12(다크 리맵) 유지.**
- bake import·참조·자산트리(`mark-mono.png`·`favicon-light/dark.png`·`app-icon.png`) 제거 → `favicon.png` 1개로. 비대칭 노트·B-🅱-ii 참조를 새 모델로 갱신.

## 7. 락업 시스템 (이미지-모드 사이징)

- `tokens-to-css.mjs`: `--logo-wm-img-scale` var emit + `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }` emit. 기본값 `1.5`.
- 폰트 모드 `.wordmark`는 현행(변경 없음). `brand-tokens.json` `lockup.wmImgScale`(선택)→var, 비면 기본값.

## 8. overview §6 렌더 (참조 가이드)

- 락업 6종(D9). 폰트/이미지 워드마크 모드 분기 유지(이미지=`<img class="wordmark-img">`, 폰트=`<span class="wordmark">`).
- favicon/app-icon = `favicon.png`(같은 마크) — favicon 타일(16/32px 가독 미리보기) + app-icon 타일(primary 라운드 위 favicon). `<head>` favicon `<link rel="icon" href="../assets/logo/favicon.png">` 무조건.
- 로고 단색 변형 행 = `.mark-mono` 마스크(로고 alpha, 토큰 색).

## 9. 마스코트 가드

- `skills/references/design/logo-art-direction.md`:
  - §6 Avoid(line 75): "정당화 없는 랜덤 동물" 뒤에 "· 마스코트/캐릭터/의인화 마크(gpt-image가 여러 생성·접점에서 캐릭터 일관성을 못 지킴)" 추가.
  - §7 프롬프트 청크 Avoid(line 88) 영어 줄: "random animals" → "random animals, mascot/character/anthropomorphic marks (no character consistency across renders)".
  - §7.1 보드 블록 Avoid(line 102): "letters-only logo" 뒤에 "mascot/character marks" 추가.
- `skills/design-brand-kit/references/brand-kit-image.md` line 116: "심볼릭 마스코트" 토막 제거(나머지 나열 유지).

## 10. 영향 파일

| 파일 | 변경 |
|---|---|
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `--logo-wm-img-scale` + `.lockup .wordmark-img` emit |
| `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` | 새 var·클래스·기본값 테스트 |
| `skills/design-logo/scripts/bake-logo-assets.mjs` | **삭제**(고아) |
| `tests/skills/design-logo/scripts/bake-logo-assets.test.mjs` | **삭제** |
| `skills/design-logo/SKILL.md` | 흐름 11 재작성(favicon PNG 재사용/C 생성), 흐름 10 프롬프트 캐싱, 자산트리·footer·품질기준·락업 프리뷰 튜닝 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | favicon PNG 프리뷰(단색 마크 프리뷰 교체) + 락업 이미지-모드 단서 |
| `skills/references/design/logo-art-direction.md` | §7 단색/다크 프레이밍 갱신(PNG 맥락 생성) + 마스코트 가드(Avoid ×3) |
| `skills/design-brand-kit/SKILL.md` | §6 임시 favicon.png + 락업 6종, `lockup.wmImgScale` 스키마, line 224 교체 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 락업 6종 + `favicon.png`(head link·타일·app-icon CSS) + `.wordmark-img` + 단색 마스크 행 |
| `skills/design-brand-kit/references/brand-kit-image.md` | 스트레이 "심볼릭 마스코트" 제거 |
| `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md` | B-🅱-ii: 베이크 → favicon PNG(맥락 생성)로 대체됨 표기 |

> `tokens.css` `.mark-mono`는 **유지**(로고 단색 변형 표시용). `remap-logo-dark.mjs`·흐름 12는 **무변경**.

## 11. 검증

- `npm test`: `tokens-to-css` 새 var/클래스/기본값 테스트 통과 + bake 테스트 제거 후 전체 PASS(무회귀).
- `npm run validate`: 생성물 일치.
- 수동(더미 `.design` over http): brand-kit이 임시 `favicon.png`(autocrop) → overview §6 표시·`<head>` 적용 확인. `logo-briefs.md` 두면 non-clobber. 락업 6종(태그라인 유/무)·**이미지-모드 워드마크 균형**·favicon 16px 가독·app-icon 타일·로고 단색 마스크 렌더 확인.
- `npm run sync` 후 `/reload-plugins`(Claude)·`npm run codex:reinstall`(Codex) 안내.

## 12. 범위 밖 / 파킹

- favicon 자동 단순화 폴백, apple-touch·PWA PNG 사이즈 세트.
- 풀컬러 다크 리맵(흐름 12) 변경.
- PNG→SVG 트레이서, 진짜 융합 베이크 락업, 마스코트 일관성(다른 도구 영역).
