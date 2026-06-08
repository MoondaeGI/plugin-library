# design-logo favicon / 단색마크 시스템 (스펙 B-🅱-ii) Design

> **⚠️ 대체됨(2026-06-08):** 이 스펙의 "단색 마스터 → `bake-logo-assets.mjs` 베이크" 경로는 `logo-asset-suite-and-lockups-design.md`로 대체되었다 — favicon·app-icon은 이제 **PNG**이며 로고 맥락에서 만든다(레터마크/단순=autocrop 재사용, 그 외=로고 `--image`+캐싱 프롬프트로 단순화 생성). `bake-logo-assets.mjs`는 제거됨. 16px 가독 게이트의 취지만 유효하다.

> Status: Draft (brainstorming 산출, 선검증 PASS). 다음 = writing-plans.
> Date: 2026-06-07
> 상위: `2026-06-05-design-logo-presentation-recipe-design.md` §6(스펙 B 백로그) → `2026-06-05-design-logo-lockup-system-design.md`(🅰, 완료·머지). 본 스펙은 🅱를 분해한 **🅱-ii**(favicon/단색마크). 풍부한 로고 light/dark 2장은 **🅱-i(이연)**.
> 선행(이미 머지): 제시용 레시피 A, 락업 시스템 🅰, 워드마크 폰트/이미지 분기.

## 0. 한 줄 요약

확정된 **풍부한 심볼**(`logo.png`)에서 작은 크기에 읽히는 **단색 마크 마스터**(`mark-mono.png`)를 생성으로 축약하고, 그 마스터에서 **favicon(light/dark)·app-icon 자산 파일을 무의존 재색 스크립트로 베이크**하며, **페이지내 런타임 재색**(CSS `mask` + `background-color`)을 `tokens.css` 유틸로 제공한다. 비율·가독은 🅰와 동형으로 **에이전트가 프리뷰 렌더·스크린샷·자가판정·미세조정**하고 사용자는 평이한 승인만 한다. 소유는 design-logo.

## 1. 동기 & 문제

- 제시용 레시피 A로 로고는 풍부해졌지만, **풍부한 엠블럼은 16~32px(favicon)에서 뭉개진다** — 원형 프레임·구운 워드마크·내부 디테일이 작은 크기에서 죽는다.
- favicon·app-icon·다크 UI의 마크는 **별도의 단색 축약 마크**가 필요한데, 지금은 그게 없다(§6 오버뷰는 `logo.png`를 CSS로 흉내 낸 *프리뷰 타일*만 보여줄 뿐 실제 자산이 없다).
- 트레이싱(PNG→SVG)은 ~192px 열화로 이미 탈락. 손저작 SVG도 회피(충실도 미검증 리스크).

## 2. 선검증 결과 (2026-06-07, PASS)

SugarLoop 더미 브랜드로 실증(`.scratch/b2-preverify/`, gitignore — 결론만 본 스펙에 기록):

| 검증 | 결과 |
|---|---|
| 풍부한 엠블럼 직접 축소 → favicon | ❌ 16~32px 뭉개짐 → **별도 단색 마크 필요 확정** |
| **생성으로 단색 마크 축약** | ✅ 두 경로 다 24px까지 또렷 |
| 경로 A (엠블럼 첨부 축약, `--image --input-fidelity high`) | 원 마크 S 모티프 **충실 보존**, 약간 얇음 → 16px 경계선 |
| 경로 B (컨셉서 별도 생성) | **볼드·진함 → 작은 크기 최강**, 단 원 마크와 다른 독립 해석 |
| CSS `mask` 임의색 재색 | ✅ **http 서빙에서** 캐러멜·그린·크림 전부 작동(롱핸드·숏핸드·`var()`) |
| `file://`에서 `mask` | ❌ 렌더 안 됨 → **프리뷰·QA는 http(라이브 서버) 필수** 불변식 |
| app-icon 타일 `filter:brightness(0) invert(1)` | ✅ light/dark 완벽(`file://`·http 둘 다) |
| 무의존 PNG 재색 가능성 | ✅ `image-gen/scripts/autocrop.mjs`에 `decodePNG`/`encodePNG`(node:zlib만) 존재 → 재사용 |

**결론**: 생산 경로 = **하이브리드**(경로 A 첨부 축약 + "굵게·단순·16px 가독" 프레이밍). 충실도(A) + 가독성(B 강점)을 합치고, 부족하면 에이전트가 프리뷰 게이트에서 "더 굵게" 재생성.

## 3. 목표 / 비목표

**목표(🅱-ii)**
- `logo.png`에서 **단색 마크 마스터** `mark-mono.png`를 하이브리드 생성으로 축약(에이전트 프리뷰 게이트로 16/24/32px 가독 자가판정·미세조정, 사용자 승인).
- 마스터에서 **favicon-light/dark.png·app-icon.png**를 **무의존 재색 스크립트**로 베이크.
- **페이지내 런타임 재색**: `tokens.css`에 `.mark-mono` 유틸(임의 브랜드색 mask 재색) + 흰 마크용 `filter` 병기.
- **favicon 스왑 스니펫**: `prefers-color-scheme` media 분기 `<link>` 2줄을 brand-kit overview head 지침에 문서화.
- 기존 "design-logo는 자기 자산 파일만 생산, 남의 HTML 무편집" 불변식 유지.

**비목표(→ 별도)**
- **풍부한 다색 로고의 다크 변형(🅱-i)** — 본 스펙(🅱-ii)은 **단색 레이어의 다크만** mask 재색으로 커버. 다색 풀로고 다크는 **[2026-06-07] 스펙 B-🅱-i**에서 결정론 팔레트 리맵으로 처리(생성 폴백). ※ "다색은 재색 불가" 가정은 🅱-i 선검증에서 반증됨.
- 타입 게이트 8종(🅲), 진짜 융합 baked 락업, PNG→SVG 트레이서.
- 락업 시스템(🅰, 완료).

## 4. 결정 (brainstorming 합의)

### 4.1 소유 · 흐름
- **소유 = design-logo**(스펙 A §6 "design-logo가 로고 시스템 소유 유지"). brand-kit 과적재 안 함.
- design-logo 흐름 **심볼 lock 직후 새 단계**: "단색 마크 + 자산 suite 생산".
  1. 하이브리드 생성: 확정 `logo.png` 첨부(`--image --input-fidelity high`) + "단일 색, 굵고 단순한 실루엣, 프레임·텍스트·장식 제거, 16px 가독" 프레이밍 → `candidate/logo/mark-mono-candidate.png`.
  2. **에이전트 프리뷰 게이트(🅰와 동형)**: 16/24/32px·light/dark 시트를 **http 서빙**으로 web-publisher-qa 스크린샷 → 가독 자가판정 → 부족하면 "더 굵게/단순하게" 재생성 → 사용자에게 제시(평이한 승인만).
  3. 승인 → `assets/logo/mark-mono.png` lock → 재색 스크립트로 favicon·app-icon 베이크.

### 4.2 자산 토폴로지 (`.design/assets/logo/`)
| 파일 | 내용 | 신규 |
|---|---|---|
| `logo.png` | 풍부한 심볼(기존) | — |
| `mark-mono.png` | 단색 마스터(단일 flat color + alpha, 투명 배경) | **신규** |
| `favicon-light.png` | 라이트 탭용(진한 마크 = brand text/primary 색) | **신규** |
| `favicon-dark.png` | 다크 탭용(흰 마크) | **신규** |
| `app-icon.png` | 브랜드색 **정사각** 타일 + 흰 마크 합성(OS가 라운딩) | **신규** |

### 4.3 재색 스크립트
- `skills/design-logo/scripts/bake-logo-assets.mjs` — `../../image-gen/scripts/autocrop.mjs`의 `decodePNG`/`encodePNG` 재사용(의존성 0, node:zlib).
- 입력: `mark-mono.png` + brand-tokens.json 색(text/primary/surface 등).
- 동작:
  - **favicon 재색**: alpha 보존, 불투명 픽셀 RGB를 타깃색으로 교체 → `favicon-light.png`(진한 색)·`favicon-dark.png`(흰색). 리사이즈 없음(브라우저 스케일 — 깨끗한 볼드 마크는 다운스케일 잘 됨, 선검증 확인).
  - **app-icon 합성**: 정사각 캔버스를 브랜드색(불투명)으로 채우고 흰 마크를 중앙 합성 → `app-icon.png`. OS가 라운딩하므로 라운드 코너는 굽지 않는다.
- CLI + 라이브러리 양형(테스트 가능).

### 4.4 페이지내 런타임 재색 (tokens.css)
- `tokens-to-css.mjs`가 `.lockup`·`.wordmark`처럼 **`.mark-mono` 유틸 클래스 emit**: `display:inline-block; mask-size:contain; mask-repeat:no-repeat; mask-position:center; background-color:var(--color-text);`(+`-webkit-` 프리픽스). 사용처가 `mask-image:url('../assets/logo/mark-mono.png')`만 인라인으로 준다(경로가 토큰이 아니므로).
- 임의 브랜드색은 modifier로: `.mark-mono--primary{background-color:var(--color-primary)}` 등(존재하는 색 토큰 키 기준, 폴백 text).
- **흰 마크**(어두운 타일·헤더)는 검증된 `filter:brightness(0) invert(1)` 병기(기존 §6 앱아이콘 선례) — mask보다 견고.
- **불변식**: `mask` 재색은 **http에서만** 렌더. 프리뷰·QA·실사용 모두 라이브 서버로 본다(repo `serve-design.mjs` 정합). `file://`로 열면 mask가 빈다.

### 4.5 favicon 스왑 스니펫 (문서화)
brand-kit overview/제품 `<head>` 지침에 추가:
```html
<link rel="icon" href="../assets/logo/favicon-light.png" media="(prefers-color-scheme: light)">
<link rel="icon" href="../assets/logo/favicon-dark.png"  media="(prefers-color-scheme: dark)">
```

### 4.6 다크 경계 (명시)
- 🅱-ii는 **단색 레이어**(favicon·app-icon·페이지내 마크)의 다크를 **재색**으로 커버.
- **풍부한 다색 풀로고의 다크**는 mask 단색 재색으론 안 됨 → **결정론 팔레트 리맵 = 🅱-i** (영역별 다색 재색, OKLab·엣지 보간; 생성은 폴백). **[2026-06-07] "다크 2장 디자인뿐"이라던 가정은 🅱-i 선검증에서 반증됨.**

## 5. 아키텍처 / 소유 · 불변식

- **단색 마크 생성·자산 베이크** = design-logo 소유(자기 흐름 + 자기 스크립트 + 자기 프리뷰 뷰).
- **`.mark-mono` 유틸 CSS** = `tokens-to-css.mjs` 생성(브랜드킷 토큰 레이어 — `.lockup`/`.wordmark`와 같은 집, 단일 소스).
- **favicon 스왑 스니펫 문서** = brand-kit overview head 지침(consume).
- **HTML 무편집 불변식**: design-logo는 `assets/logo/` 자산 파일만 생산·덮어쓰기. overview §6은 이미 그 경로를 가리키므로 HTML 편집 없음. `.mark-mono` 추가는 tokens.css에 클래스만 더하므로 기존 소비처에 무해.
- **http 서빙 불변식**: mask 재색 렌더 조건.

## 6. 영향 파일 (예상)

| 파일 | 변경 | 신규/수정 |
|---|---|---|
| `skills/design-logo/scripts/bake-logo-assets.mjs` | 마스터→favicon×2·app-icon 재색/합성(autocrop 코덱 재사용) | **신규** |
| `tests/bake-logo-assets.test.mjs` | 재색(alpha 보존·RGB 교체)·합성·CLI 테스트 | **신규** |
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | `.mark-mono` 유틸 + modifier emit | 수정 |
| `tests/tokens-to-css.test.mjs` | `.mark-mono` 클래스·modifier·기본색 테스트 | 수정 |
| `skills/design-logo/SKILL.md` | 단색 마크 단계·하이브리드 생성·프리뷰 게이트·자산 토폴로지·베이크 호출 | 수정 |
| `skills/design-logo/references/logo-sheet-html-direction.md` | logos.html에 단색 마크 가독 프리뷰 섹션(16/24/32 시트) | 수정 |
| `skills/references/design/logo-art-direction.md` | 단색 마크 축약 프롬프트 프레이밍(굵게·단순·16px) | 수정 |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | §6 favicon/app-icon 실파일 소비 + `.mark-mono` 재색 + head 스왑 스니펫 | 수정 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens 색 → 베이크 입력 흐름 한 줄 | 수정 |

## 7. 열린 구현 질문 (플랜에서 확정)

1. `mark-mono.png` 정확 사양(캔버스 크기·단일 색 = text vs primary·패딩) + 하이브리드 프롬프트 정확 문구.
2. 재색 스크립트 CLI 인자·출력 경로 규약(brand-tokens.json 경로를 받는지, 색 키를 플래그로 받는지) + app-icon 합성 시 마크 비율·여백.
3. favicon 리사이즈 정책 최종(마스터 해상도 그대로 vs 박스 다운샘플 — 선검증상 브라우저 스케일로 충분).
4. `.mark-mono` modifier 색 범위(어떤 색 토큰까지 modifier로 emit할지) + `filter` 흰 마크 가이드 위치.
5. 단색 마크 프리뷰 게이트를 SKILL에 게이트로 명문화(web-publisher-qa 호출 시점·http 서빙 전제·승인 문구).
6. logos.html 단색 프리뷰 섹션이 락업 프리뷰(🅰)와 한 시트에 공존하는 배치.

## 8. 성공 기준

확정 심볼에서 단색 마크가 생성으로 축약돼 16/24/32px에서 또렷이 읽히고, 그 마스터에서 favicon(light/dark)·app-icon이 무의존 스크립트로 베이크되며, 페이지내에서 `.mark-mono`로 임의 브랜드색 재색이 (http 서빙에서) 작동한다. 에이전트가 가독을 맞춰 제시하면 사용자는 평이한 승인만으로 단색 자산 suite를 확정한다.
