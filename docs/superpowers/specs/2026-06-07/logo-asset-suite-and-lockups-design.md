# 로고 자산 suite(결정적 favicon·단색) + §6 락업 패밀리 + 이미지-모드 락업 사이징 Design

> brand-kit 단계에서 확정 로고 하나로부터 favicon·단색·app-icon을 **결정적으로** 굽고, §6에 락업 패밀리 6종을 렌더하며, 이미지-모드 워드마크의 락업 사이징을 토큰으로 잡는다. design-logo는 로고 lock 후 같은 베이크로 갱신한다.

## 1. 배경 / 문제

1. **brand-kit overview에 favicon이 안 뜬다.** §6는 wordmark·logo·lockup은 보여주지만 favicon·app-icon·단색은 **design-logo가 굽기 전까지 생략**된다(`brand-kit-html-direction.md` §6 "단색 자산이 아직 없으면 … 생략"). design-logo는 온디맨드라 안 돌리면 §6가 빈다 → "favicon 적용 안 됨"으로 보임.
2. **gpt-image 단색 생성은 흔들린다.** design-logo 흐름 11ⓐ가 gpt-image로 단색 실루엣(mark-mono)을 새로 생성하는데, 같은 마크가 재현되지 않는다(사용자 실증). 단, 이 흔들림은 *메인 로고 정체성* 문제이며 — favicon은 **로고 lock 후의 다운스트림**이라 별개로 다룰 수 있다.
3. **결정적 대안이 이미 있다.** `bake-logo-assets.mjs`의 `recolorMark`(alpha 보존, RGB만 교체)·`compositeAppIcon`은 **결정적 변환**이다 — 확정 로고(투명 컷아웃)만 있으면 gpt-image 없이 favicon-light/dark·app-icon·단색 마크를 항상 동일하게 만든다.
4. **락업이 이미지 모드 워드마크에서 안 맞는다.** 락업 CSS는 `.lockup__mark`만 토큰(`--logo-mark-scale`)으로 크기를 잡고 **이미지 워드마크(`wordmark-base.png`) 높이를 묶는 토큰이 없다** — 폰트 모드(`.wordmark` span, font-size 상속)를 전제했다. 이미지-모드 브랜드(예: Pixel Carnival: 심볼 716×578 vs 워드마크 1178×512 2줄)에선 심볼↔워드마크 균형이 안 잡혀 락업이 "제대로 안 맞는" 느낌(데모 실증·수정 확인).
5. **락업을 한 곳에서 다 보고 싶다.** 현재 §6는 가로·세로 2종만. 사용자는 6종 패밀리(가로·세로·심볼단독·워드마크단독 + 가로/세로+태그라인)를 §6에 모아 보고 싶다.

## 2. 목표 / 비목표

**목표**
- **단일 원칙(결정적)**: 로고가 정해지는 곳마다 그 투명 컷아웃에서 favicon·단색·app-icon을 결정적으로 굽는다. gpt-image 없음.
- **brand-kit 자동 베이크(임시 등급)** → overview §6의 favicon/단색/app-icon 타일 + `<head>` favicon `<link>`를 **무조건** 렌더(design-logo 미실행이어도 채워짐).
- **design-logo 갱신(확정 등급)**: 로고 lock 후 확정 로고에서 같은 결정적 베이크로 brand-kit 임시본을 덮어쓴다. gpt-image 단색 생성(11ⓐ) 제거.
- **락업 이미지-모드 사이징**: `--logo-wm-img-scale` 토큰 + `.wordmark-img` 규칙 추가. 에이전트가 프리뷰 게이트에서 심볼·워드마크 둘 다 튜닝(사용자는 승인만).
- **§6 락업 패밀리 6종** 렌더(1·2·5·6 항상, 3·4 태그라인 있을 때만). 기존 `.lockup*`/`.wordmark` 재사용 — 새 락업 레이아웃 CSS 없음.
- **bake 스크립트 공유 승격**: `scripts/lib/`로(두 스킬 공유, iconify-client 선례).
- **다크 테마 favicon ink 규칙**(결정적 대비 선택).

**비목표 (YAGNI / 사용자 결정)**
- **favicon 단순화 마크 폴백 없음.** 16px 가독이 부족해도 단순화 마크를 따로 만들지 않는다 — 가독은 로고 디자인 단계의 책임. 가독 프리뷰는 *인지용*만(재생성·폴백 없음). (사용자: "단순한 쪽으로.")
- **풀컬러 다크 리맵 변경 없음.** design-logo 흐름 12(`remap-logo-dark.mjs`, 결정적 OKLab)는 그대로 유지.
- PNG→SVG 트레이서, 진짜 융합 베이크 락업.

## 3. 핵심 모델 결정

- **D1 — 결정적 단일 원칙.** favicon·단색·app-icon은 언제나 확정 로고의 투명 컷아웃에서 `recolorMark`/`compositeAppIcon`으로 파생. gpt-image 없음. favicon은 메인 로고 lock 후 다운스트림이라 정체성 위험 0.
- **D2 — brand-kit 임시 베이크 + non-clobber.** 자산 생산 시 자동 베이크하되, `candidate/logo/logo-briefs.md`가 있으면(design-logo 확정본 존재) 베이크를 건너뛴다(기존 logo.png 미러 규칙과 동일).
- **D3 — design-logo 확정 베이크.** 흐름 11ⓐ gpt-image 단색 생성 제거 → 확정 `logo.png`에서 같은 베이크(임시본 덮어씀). 16px 가독 프리뷰는 인지용(폴백/재생성 없음).
- **D4 — 락업 이미지-모드 사이징.** 심볼=`--logo-mark-scale`, 이미지 워드마크=`--logo-wm-img-scale`. 폰트 모드 `.wordmark`는 현행(font-size 상속). 에이전트가 게이트에서 둘 다 튜닝.
- **D5 — §6 락업 6종.** 1 가로 · 2 세로 · 5 심볼단독 · 6 워드마크단독 = 항상. 3 가로+태그라인 · 4 세로+태그라인 = 태그라인 있을 때만. 심볼단독=`<img>`(logo.png), 워드마크단독=`<img>`(이미지 모드) | `<span class="wordmark">`(폰트 모드). 새 CSS 없음.
- **D6 — mark-mono 마스터 = 확정 로고 투명 컷아웃.** 별도 단순화 생성 없음. bake suite가 `mark-mono.png`(passthrough = 마스크 소스)도 출력.
- **D7 — bake 스크립트 `scripts/lib/`로 승격.**
- **D8 — favicon ink 규칙(결정적 대비).** favicon-light ink = `{text, background}` 중 **더 어두운** 색(흰 탭에서 보이게), favicon-dark = 더 **밝은** 색(어두운 탭). app-icon 타일=`primary`(또는 §6 앱아이콘 방향색), 마크색=타일 대비 더 밝은/어두운 쪽 자동. 다크 테마(예: `text`가 거의 흰색)에서 favicon-light가 안 보이는 문제를 막는다. (호출 측이 토큰에서 hex를 산출해 스크립트에 넘긴다 — 스크립트는 범용 유지.)

## 4. 자산 suite (결정적 베이크)

- **입력**: 확정 로고(투명 RGBA PNG) + brand-tokens 색.
- **출력(`assets/logo/`)**: `favicon-light.png`(D8 ink) · `favicon-dark.png`(D8 밝은색) · `app-icon.png`(타일+마크) · `mark-mono.png`(투명 passthrough = `.mark-mono` 마스크 소스).
- `bakeAll` 확장: 기존 faviconLight/faviconDark/appIcon에 **markMono(입력 passthrough)** 추가. CLI도 `mark-mono.png` 출력.
- autocrop PNG 코덱(`decodePNG`/`encodePNG`) 의존 유지(현행 cross-skill import 선례대로 `scripts/lib/`에서도 `skills/image-gen/scripts/autocrop.mjs` 참조).

## 5. brand-kit 흐름

- **자산 생산(흐름 5)**: `logo-base.png`→`logo/logo.png` 미러 직후, `logo-briefs.md`가 없으면 bake suite 실행(임시 등급).
- **lock(흐름 8)**: 동일 non-clobber 보장(`logo-briefs.md` 있으면 confirmed 자산 보존).
- **§6 지침**: 락업 패밀리 6종 + favicon/단색/app-icon 타일 + head favicon **무조건** 렌더(현재 "design-logo 미실행이면 생략" 조건 제거).
- **SKILL.md line 224 수정**: "단색 자산 베이크는 design-logo 소관" → "로고 확정 위치가 결정적으로 굽는다(brand-kit=임시, design-logo=확정)".
- brand-tokens.json `lockup` 블록에 선택 키 `wmImgScale` 추가(이미지-모드 워드마크 스케일).

## 6. design-logo 흐름

- **흐름 11 재작성**: gpt-image 단색 생성(ⓐ) 제거. 확정 `logo.png`에서 §4 bake suite 호출(brand-kit 임시본 덮어씀). 16px 가독 프리뷰는 인지용(폴백·재생성·단순화 마크 없음).
- **흐름 12(다크 리맵) 유지**.
- 락업 프리뷰 게이트: 심볼(`--logo-mark-scale`) + 이미지 워드마크(`--logo-wm-img-scale`) 둘 다 튜닝.
- 비대칭 노트·스펙 B-🅱-ii 참조를 새 원칙(결정적, 단순화 폴백 없음)으로 갱신. bake import 경로를 `scripts/lib/`로.

## 7. 락업 시스템 (이미지-모드 사이징)

- `tokens-to-css.mjs`: `--logo-wm-img-scale` var emit + `.lockup .wordmark-img { height: calc(var(--logo-wm-img-scale) * 1em); width: auto; display: block; }` emit. 기본값 합리값(예: 1.5).
- 폰트 모드 `.wordmark`는 현행(font-size 상속, 변경 없음). 이미지 모드만 새 규칙 추가.
- brand-tokens `lockup.wmImgScale`(선택) → var. 비면 기본값.

## 8. overview §6 렌더 (참조 가이드)

- 락업 6종(D5). 폰트/이미지 워드마크 모드 분기 유지(이미지 모드=`<img class="wordmark-img">`, 폰트 모드=`<span class="wordmark">`).
- 자산 타일: favicon-light(밝은 카드 위)·favicon-dark(어두운 카드 위)·app-icon(라운드 타일) + 단색 마스크 행(`.mark-mono`, 라이브 http에서 렌더).
- `<head>`: `favicon-light/dark` `<link media="(prefers-color-scheme: …)">` 무조건.

## 9. 영향 파일

| 파일 | 변경 |
|---|---|
| `scripts/lib/bake-logo-assets.mjs` | **이동**(design-logo/scripts → lib) + `bakeAll`/CLI에 `markMono` 추가 |
| `tests/scripts/lib/bake-logo-assets.test.mjs` | **이동** + `markMono` 테스트 |
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `--logo-wm-img-scale` + `.lockup .wordmark-img` emit |
| `tests/skills/design-brand-kit/scripts/tokens-to-css.test.mjs` | 새 var·클래스·기본값 테스트 |
| `skills/design-brand-kit/SKILL.md` | 흐름 5·8 bake suite + non-clobber, §6 락업 6종·favicon 무조건, `lockup.wmImgScale` 스키마, line 224, D8 ink 규칙 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 락업 6종 + favicon/단색 무조건 + `.wordmark-img` |
| `skills/design-logo/SKILL.md` | 흐름 11 재작성(gpt-image 단색 제거·결정적 베이크), 락업 프리뷰 워드마크 튜닝, 비대칭/스펙 참조, bake import 경로 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | 단색/락업 프리뷰 갱신(결정적·워드마크 사이징) |
| `docs/superpowers/specs/2026-06-07/design-logo-favicon-monochrome-design.md` | B-🅱-ii 갱신: gpt-image 단색 → 결정적, 단순화 폴백 없음 명시 |

## 10. 검증

- `npm test`: bake `markMono` + tokens-to-css 새 var/클래스/기본값 테스트 + 전체 회귀(무회귀).
- `npm run validate`: 생성물 일치.
- 수동(더미 `.design`): brand-kit 베이크 → `assets/logo/`에 favicon-light/dark·app-icon·mark-mono 생성 확인. `logo-briefs.md` 두면 스킵 확인. overview §6를 http로 서빙해 락업 6종(태그라인 유/무)·favicon 타일·head link·**이미지-모드 워드마크 균형**·단색 마스크 렌더 확인.
- `npm run sync` 후 `/reload-plugins`(Claude)·`npm run codex:reinstall`(Codex) 안내.

## 11. 범위 밖 / 파킹

- favicon 단순화 마크 폴백(사용자 결정: 단순하게).
- 풀컬러 다크 리맵(흐름 12) 변경.
- PNG→SVG 트레이서, 진짜 융합 베이크 락업.
- component-export·page-image 등 다른 다운스트림.
