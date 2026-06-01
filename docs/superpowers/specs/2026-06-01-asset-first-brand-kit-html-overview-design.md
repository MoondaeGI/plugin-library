# 자산 우선(Asset-First) 브랜드 킷 + HTML 오버뷰 — 설계 문서

- 날짜: 2026-06-01
- 상태: 설계 확정(구현 계획 전)
- 대상 스킬: `design-brand-kit`, `design-logo`, `design-iconset`, `design-page-image`, `design-md-compiler`, `image-gen`

## 1. 문제 정의

현재 `design-brand-kit`은 11개 섹션을 한 장에 담은 **합성 래스터 보드**(`brand-overview.png`)를 생성한다. 로고·아이콘·UI는 그 보드의 한 칸으로만 존재한다. 다운스트림(`design-logo` 등)이 이 자산을 쓰려면 보드를 `--image`로 첨부해 해당 영역을 **재합성(re-synthesis)으로 추출**하는데, gpt-image의 `--image`는 픽셀 크롭이 아니라 입력을 조건으로 다시 그리는 것이라 **로고 모양이 원본과 다르게 흔들린다**. 게다가 로고는 보드 위에서 1/11 칸이라 애초에 고해상도로 또렷이 그려진 적이 없다 — 없던 디테일을 추출하니 더 어긋난다.

근본 원인: **정체성 자산을 합성물에서 다시 잘라 파생시키는 구조.** 래스터 재생성은 본질적으로 손실이 있어 정체성이 곧 형태인 자산(로고·아이콘)을 보존하지 못한다.

## 2. 목표 / 비목표

### 목표
- 다운스트림이 소비하는 base 자산(로고·아이콘·UI·키비주얼)이 **흔들림 없이 안정**될 것.
- 브랜드 오버뷰가 그 자산들을 **충실히(드리프트 0) 반영**할 것.
- 데이터 섹션(색·타이포·보이스 등)이 **AI 래스터가 아니라 정확한 HTML/CSS**로 렌더될 것(진짜 HEX·진짜 폰트·진짜 텍스트).
- 후속 단계(로고·아이콘·UI 킷·HTML/CSS)의 기반이 될 것.

### 비목표 (이번 범위 밖 / 미래)
- HTML→PNG 스크린샷(헤드리스 브라우저) — **하지 않음.** 산출물은 HTML 페이지 자체.
- 크로마키 배경 제거 — 투명 생성이 미덥지 않을 때의 **폴백으로만** 보류.
- 풀 아이콘 라이브러리 자동화 — `design-iconset`의 일.
- 구버전 `brand-overview.png`과의 양쪽 호환 — **깨끗한 전환**(아래 §11).

## 3. 핵심 아키텍처 — 세 층의 진실(SSOT)

| 층 | 내용 | 주인 | 상태 |
|---|---|---|---|
| 1. 텍스트/데이터 | 색 HEX·타이포·보이스·가치·태그라인·카피·금지 | `BRAND_KIT.md` + `brand-tokens.json` | 현행 유지 |
| 2. 시각 자산 | 로고·아이콘·UI·키비주얼 (AI가 상상해야 하는 것) | `.design/.../assets/*.png` | **신규** |
| 3. 오버뷰 | 위 둘을 조합한 한눈 보드 | `overview.html` (LLM 저작) | **신규** |

오버뷰가 source를 100% 반영하는 이유: 보드가 **AI 재생성이 아니라 진짜 파일을 끼워넣는 결정적 조합**이기 때문. 데이터는 층 1에서 HTML 렌더, 시각은 층 2를 `<img>`. → 드리프트 0.

## 4. base 자산 인벤토리

brand-kit이 생산하는 **오버뷰용 base 자산**. 풀 산출물(로고 시스템·풀 아이콘셋)은 다운스트림 몫.

| 자산 | 내용 | 모델/배경 | 다운스트림 소비자 |
|---|---|---|---|
| `logo-base.png` | 로고 마크/심볼 | **gpt-image-1.5 + 투명** | `design-logo` 시드 |
| `wordmark-base.png` | 워드마크(브랜드명 로고타입) | **gpt-image-1.5 + 투명** | §1·§6 워드마크 + `design-logo` 시드 |
| `key-visual.png` | 브랜드 히어로 이미지(단일) | gpt-image-2 불투명 | §1 히어로·페이지 배경·마케팅 |
| `ui-base.png` | UI 컴포넌트 룩(카드·배지·컨트롤) | gpt-image-2 불투명 | `design-page-image` 시드 |
| `icons/<name>.png` | 오버뷰가 쓰는 개별 아이콘 | **gpt-image-1.5 + 투명** | §2·§4·§9 장식 + §11 쇼케이스 + `design-iconset` 가족 기준 |

- **워드마크도 이미지 자산이다**(`wordmark-base.png`, 투명) — 타입페이스/커스텀 레터링을 조건 없이 일관 처리하려고 항상 이미지로 둔다. §1에선 `key-visual` 위에 `<img>`로 얹는다(투명 확보됨). 컷아웃은 `logo-base`·`wordmark-base`·아이콘. 단 **워드마크는 짧고 또렷하게**(한글 브랜드명은 글리프 뭉갬 위험).
- **아이콘은 개별 투명 파일**(접근 B). 시트 한 장으로는 §2·§4·§9의 섹션별 장식 아이콘을 빼낼 수 없고(AI 그리드는 셀 정렬이 안 돼 슬라이싱이 깨짐), 개별 파일이면 HTML이 어디든 배치 + §11은 같은 파일들의 CSS 그리드 + 나중 UI 킷에 그대로 재사용된다.

## 5. 자산 간 일관성(cohesion)

자산을 따로 생성하면 "한 가족"으로 안 보일 위험이 있다(자산 우선의 최대 품질 리스크). 글루:

- **스타일 앵커 먼저** — 팔레트·질감·선 느낌을 담은 작은 레퍼런스 1장(또는 key-visual을 앵커로 지정)을 먼저 만든다.
- 각 자산을 그 앵커를 `--image`로 첨부 + **공통 스타일 프리앰블**(BRAND_KIT.md/tokens에서 구성)로 생성 → 로고·아이콘·UI가 따로 놀지 않게.
- **아이콘 내부 일관성**도 동일 — 아이콘 가족 앵커(또는 첫 아이콘) 기준으로 나머지를 시드.

## 6. 흐름

- **A. 디스커버리 & 텍스트** (현행 유지) — Q&A → `BRAND_KIT.md` + `brand-tokens.json`. 분위기 열림 → 3방향 / 고정 → 1방향.
- **B. 발산 (분위기 열림일 때만)** — 루트별 **풀 `overview.html`까지** 만들어 비교(key image만으론 감이 안 잡힘). 데이터 섹션(§2·3·4·5·7·8·9)은 그 루트의 tokens/md에서 **공짜 HTML**, §1·§6은 루트별 `key-visual`(gpt-image-2 low)+`logo-base`·`wordmark-base`(gpt-image-1.5 transparent low)로 채움. `ui-base`·`icons/*`는 **고른 루트만**(§10·§11은 "확정 후 생성" 플레이스홀더). 3개 풀 오버뷰를 나란히 비교 → 한 방향 선택 → `.design/brand-kit/`로 순수 복사 승격. (분위기 고정이면 건너뛰고 `brand-kit/`에서 바로 작업.)
- **C. 자산 생산 (고른 루트)** — 확정 route에서 나머지 `ui-base`·`icons/*` 생성(발산 때 만든 key-visual·logo·wordmark는 승격됨). **초안 low → 사진류(key-visual·ui)만 high 락, 로고·워드마크·아이콘은 low/medium**. 자산은 해당 `assets/`에 `--auto-version` 누적 → 다듬기 → lock 시 `final/brand-kit/`로 세트 복사.
- **D. 오버뷰 저작 (HTML)** — LLM이 `overview.html`을 레이아웃 스펙 + `BRAND_KIT.md` + tokens + 자산 경로 + 폰트 CDN으로 작성. §1 워드마크는 `wordmark-base.png`를 `<img>`로, 시각 자산은 `<img>`, 데이터 섹션은 HTML 렌더, 아이콘은 개별 배치 + §11 CSS 그리드.
- **E. 반복 (결정적)** — 데이터/레이아웃 수정 = HTML 외과 편집(**이미지 비용 0**) / 시각 수정 = 해당 자산만 재롤 후 `<img>` 교체. "한 칸 고치면 전체 흔들림" 소멸.
- **F. 다운스트림** — `design-logo`/`iconset`/`page-image`가 보드 재추출 없이 `assets/`를 직접 시드.

## 7. HTML 오버뷰 — 스펙 가이드 LLM 저작

- **고정 템플릿/콘텐츠 JSON 없음.** LLM이 매번 `overview.html`을 저작해 **브랜드별 맞춤 디자인**으로 출력한다(다양성). 자산은 진짜 `<img>`라 드리프트 0은 유지된다(LLM이 HTML을 써도 자산 충실도는 그대로).
- **SSOT는 `BRAND_KIT.md` + `brand-tokens.json`.** HTML은 파생 산출물 — 콘텐츠를 지어내지 않고 SSOT에서 가져온다. 변주는 **레이아웃**에서만.
- **레이아웃 스펙**(가드레일)을 `skills/design-brand-kit/references/`의 브랜드 킷 이미지 가이드 md에 둔다(픽셀 템플릿 아님): 필수 섹션 인벤토리 + 각 섹션의 콘텐츠/자산 매핑 + 자산 규칙(`<img>`, §1 워드마크=`wordmark-base.png`) + 가독성·위계·품질 기준 + 레이아웃 아키타입 2~3개.
- **폰트**: `references/design/font-catalog.md`의 실존 family + specimen을 CDN `<link>`(Google Fonts, 한글 Pretendard jsdelivr)로 로드. §8 타이포가 살아 있는 스펙시먼이 된다.
- **반복 규율**: 작은 값(HEX 한 개·카피 한 줄)은 기존 HTML 외과 Edit(레이아웃 보존), "디자인 다르게"는 재저작.
- CSS는 단일 `overview.html` 인라인 또는 형제 `overview.css` — LLM 저작이므로 자유.

## 8. 투명 배경 전략

확인 사실(현행 OpenAI Images API): **gpt-image-2는 투명 배경 미지원** — `background: "transparent"` 요청은 에러. 투명은 **gpt-image-1.5로 라우팅**. (출처: OpenAI Images 문서, 2026.)

- **컷아웃(`logo-base`, `wordmark-base`, `icons/*`)**: `gpt-image-1.5` + `background: transparent` → 진짜 알파 PNG.
- **불투명(`key-visual`, `ui-base`)**: `gpt-image-2`.
- `image-gen.mjs`에 `--background <transparent|opaque|auto>` 옵션 추가(페이로드 `background` 필드). 미지정 시 현행 동작(필드 미전송) 유지 — 범용 호출자 영향 0. 투명은 호출자가 1.5와 페어링할 책임.
- **폴백(Path 2)**: 1.5 컷아웃 품질이 미덥지 않으면 gpt-image-2 불투명 + 후처리 크로마키. 의존성/코드가 붙으므로 1.5가 멀쩡하면 채택 안 함.

## 9. 비용 모델 & 통제

1024 기준 가격(러프; 세로 ×1.5, 편집 ~1.5×): gpt-image-2 low ~$0.006 / medium ~$0.053 / high ~$0.211. gpt-image-1.5 low ~$0.009 / high ~$0.20. **모델(1.5 vs 2) 차이는 노이즈, 진짜 변수는 품질 티어 × 장수 × 반복.**

대략 비교(분위기 열림·3루트):

| 단계 | 현재(합성 보드) | 신규(자산+HTML) |
|---|---|---|
| 발산 | 보드 low×3 ≈ $0.03 | 루트당 key-visual+logo+wordmark low ×3 ≈ $0.08 (풀 HTML은 공짜) |
| 수렴(high 락) | 보드 high 편집 ≈ $0.5 | key-visual+ui high + 로고/아이콘 low ≈ $0.8 |
| 반복 수정 | 보드 통째 high 재편집 ≈ $0.5×4 ≈ $2 | 데이터·레이아웃 HTML 편집 **$0** / 이미지만 재롤 ≈ $0.2 |
| **합계(러프)** | **~$1.5–3.0** | **~$0.8–1.5** |

**route ×3은 "싼 초안 단계"만 ×3 하지 비싼 락을 ×3 하지 않는다**(풀 자산은 고른 1루트만). 신규가 더 비싸지 않고 오히려 비슷~약간 저렴 — 현재의 진짜 비용은 "수정마다 합성 보드 통째 high 재편집"인데, 신규는 보드 이미지가 없고 데이터·레이아웃 수정이 0원이기 때문.

**비용 통제 기본값(스펙에 명시):**
1. 발산 = 루트별 풀 overview.html + key-visual·logo·wordmark(low) ×3. `ui-base`·`icons/*`는 고른 루트만(풀 자산 ×3 금지).
2. high 락은 고른 루트의 사진류만, 로고·워드마크·아이콘 low/medium.
3. 아이콘은 오버뷰 용도 **low로 충분**(작게 표시). UI 킷 재사용분만 medium 락.
4. 데이터·레이아웃 반복은 HTML 편집(0원).

## 10. 다운스트림 변경(인터페이스)

다운스트림(logo·iconset·page-image·md-compiler·html-prototype)은 모두 **lock된 `.design/final/brand-kit/`**에서 읽는다 — `BRAND_KIT.md`·`brand-tokens.json`·`overview.html`·`assets/`(에셋 경로 `.design/final/brand-kit/assets/`는 v1과 동일).

- **`design-logo`**: 입력을 `brand-overview.png` 재추출 → **`assets/logo-base.png` 직접 시드**. Phase 1 시드 추출 제거. 로고는 **(I) 단일 커밋** — `logo-base`를 그대로 확정 가능, **40컨셉 탐색은 opt-in**(더 보고 싶을 때만). Phase 3 시스템: `wordmark-base.png`를 시드로 워드마크 확정/다듬기, favicon·app-icon은 생성.
- **`design-iconset`**: 입력을 `assets/icons/*` + 아이콘 스타일 직접. 풀 product 세트는 brand-kit 아이콘을 **가족 기준**으로 확장.
- **`design-page-image`**: 입력을 `assets/ui-base.png` + `key-visual.png` + tokens.
- **`design-md-compiler`**: `BRAND_KIT.md` + tokens + `assets/` + `overview.html` 참조.

## 11. 마이그레이션

**깨끗한 전환(가).** 스킬을 새 구조(assets + HTML)로만 갱신. 구버전 `brand-overview.png`을 가진 기존 `.design`은 brand-kit 재실행으로 새 구조를 얻는다. 다운스트림에 옛/새 분기 코드를 두지 않는다.

## 12. 파일/폴더 구조 (대상 프로젝트 cwd)

```
.design/
  brand-kit/                           # 작업 루트 (generated/ 중첩 폐지)
    routes/route-{a,b,c}/              # 발산: 각 route 자기완결(self-contained)
      BRAND_KIT.md
      brand-tokens.json
      overview.html
      brief.md
      assets/  logo-base.png · wordmark-base.png · key-visual.png · ui-base.png · icons/<name>.png
    BRAND_KIT.md                       # 확정 route 승격 (작업 SSOT)
    brand-tokens.json
    overview.html
    brief.md
    assets/                            # 확정 세트 이미지 (동일 파일명)
  final/brand-kit/                     # lock 세트 — 다운스트림이 읽음
    BRAND_KIT.md · brand-tokens.json · overview.html · assets/
```

- **자기완결 route**: `overview.html`의 `<img>`는 항상 형제 `assets/`를 참조 → route/확정/final 어디서나 동일 HTML. **확정·lock = 경로 재작성 없는 순수 복사.**
- 분위기 고정이면 `routes/` 없이 `brand-kit/`에서 바로 작업. 버전 이력은 각 `assets/`의 `--auto-version`, 전체 롤백은 git.

## 13. 영향 받는 레포 파일

- `skills/image-gen/scripts/image-gen.mjs` — `--background` 추가.
- `skills/image-gen/SKILL.md` — `--background` 문서화.
- `skills/design-brand-kit/SKILL.md` — 대규모 개정(자산 우선 흐름·HTML 오버뷰·발산 변경·비용 통제).
- `skills/design-brand-kit/references/`(브랜드 킷 이미지 가이드 md) — HTML 오버뷰 레이아웃 스펙으로 개정/추가.
- `skills/design-logo/SKILL.md` — 입력 `assets/logo-base`, 탐색 opt-in.
- `skills/design-iconset/SKILL.md` — 입력 `assets/icons`.
- `skills/design-page-image/SKILL.md` — 입력 `assets/ui-base` + `key-visual`.
- `skills/design-md-compiler/SKILL.md` — `assets/` + `overview.html` 참조.
- `references/design/*`(logo-art-direction·icon-rules) — 투명 배경 주석 보정.
- 스킬 수정 후 `npm run sync`로 Codex 번들 재생성(AGENTS.md).

## 14. 리스크 / 검증 항목

- **자산 간 일관성** — 분리 생성이 한 가족으로 안 보일 수 있음(최대 품질 리스크). 완화: 스타일 앵커 + 공통 프리앰블. 구현 후 실제 출력으로 검증.
- **gpt-image-1.5 투명 컷아웃 품질** — 로고·아이콘이 충분히 깨끗한지 구현 시 확인. 미달이면 Path 2(크로마키) 폴백.
- **LLM 저작 HTML의 다양성 ↔ 품질** — 레이아웃 스펙 가드레일 + 자가 리뷰로 "프리미엄 보드" 기준 유지.
- **§11 아이콘 개수/목록** — 프로젝트 도메인에 따라 brand-kit 단계에서 확정(과다 생성 비용 주의).
- 한글 글리프 — 데이터 섹션이 실폰트 HTML로 가면서 렌더 한계 문제 **해소(이득)**.

## 15. 미해결 / 후속

- 레이아웃 아키타입 세부(아키타입 몇 개·각 성격)는 references 개정 시 구체화.
- 워드마크는 항상 `wordmark-base.png`(투명) 자산으로 통일(조건 분기 없음). 한글 브랜드명 렌더가 거칠면 짧게 유지; 필요 시 후속에 텍스트 폴백 검토.
- UI 킷·HTML/CSS 구현 단계는 별도 spec.
