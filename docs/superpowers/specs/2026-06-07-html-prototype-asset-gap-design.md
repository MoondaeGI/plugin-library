# design-html-prototype 자산 갭 해소 설계

날짜: 2026-06-07
대상 스킬: `design-html-prototype` (+ `web-publisher` 계약 한 줄, 공유 스크립트 1개 승격, 신규 스크립트 1개)

## 문제

`design-html-prototype`은 풀페이지 HTML 프로토타입의 스펙을 정하고 실제 저작을 `web-publisher`에 위임한다. web-publisher의 입력 자산은 `.design/assets/**`로 한정된다. 그런데 디자인 comp(예: `design-image-web`가 만든 로그인 화면 PNG — 케이크 hero 사진 + 카카오/네이버/Apple/Google 로그인 버튼)를 충실히 구현하려면 `.design/assets/`에 없는 자산이 필요하다:

- **타사 브랜드 마크** — GitHub·Google·Kakao·Naver·Apple 등 로그인 제공자 로고. 트레이드마크라 손으로 흉내내면 틀리고 부정확하다.
- **콘텐츠 이미지** — hero 사진·키비주얼·카드 썸네일 등. 어떤 상위 단계도 *추출 가능한 개별 자산*으로 내보내지 않는다(comp PNG 안에 평평하게 구워져 있을 뿐).

현재는 web-publisher가 이 갭을 손으로 대충 흉내낸다. web-publisher는 "이미 만들어진 자산만 소비"하고 충실도 판정을 명시적으로 거부하므로, 자산 조달은 그의 책임이 아니다.

## 핵심 원칙

1. **기준축은 DESIGN.md/브랜드 의도다. comp는 정답이 아니라 *불완전한 한 해석*이다.** comp는 image-gen `--image` 참고로만 쓰고(L38: 호출자 프롬프트가 "참고해 새로 그려라"를 표현), 프롬프트의 권위 기준은 DESIGN.md 토큰이다.
2. **종류가 아니라 "가용성"으로 분기한다.** 갈림 축은 "벤더 vs 콘텐츠"가 아니라 "Iconify에 있나 / 빌드 전에 슬롯을 읽을 수 있나"다.
3. **트레이드마크는 생성·손그림 절대 금지.** 못 구하면 사람에게 에스컬레이션한다(gpt-image로 로고를 환각시키지 않는다).
4. **자산 조달은 빌드 *전*에 한 번, 사람 검수 게이트를 거친다.** 빌드 후 비교 루프가 아니다(아래 "버린 대안" 참고).

## 흐름

```
design-html-prototype
  1. 스펙 확정 (기존: 출력 경로·섹션 구조)
  2. ★자산 갭 패스 (신규, 빌드 전):
       comp + DESIGN.md + 섹션 구조 → .design/assets에 없는 필요 자산 슬롯 열거
       → 슬롯별 해소(아래 cascade) → 매니페스트 기록
  3. ★검증 게이트 (신규): 조달된 자산을 사람이 검수
       (fetch된 로고 / 생성 이미지 / 플레이스홀더 / 에스컬레이션 목록)
  4. web-publisher 위임: 매니페스트(슬롯↔실제 파일 경로) + "없는 갭은 보고" 규칙
  5. web-publisher: 빌드 + 기존 layout-QA(web-publisher-qa)
  6. 사람이 브라우저로 최종 확인 (기존 게이트)
```

## 슬롯 해소 cascade (가용성 기반)

| 슬롯 종류 | 해소 |
|---|---|
| **제품 UI 글리프** | 이미 `.design/assets/icon/*.svg`에 있음 → 그대로 참조 |
| **벤더 브랜드 마크** | `iconExists`로 Iconify `logos`/`simple-icons` 가용성 확인 → 있으면 **색 보존** SVG fetch → `.design/assets/vendor/`. 없으면 → **사람 에스컬레이션**(직접 제공). gpt-image 로고 생성 금지 |
| **콘텐츠 이미지** (hero·키비주얼·카드 아트) | image-gen, 프롬프트 권위 기준 = DESIGN.md 토큰(comp는 `--image` 참고로만). 키 있으면 생성 → `.design/assets/content/`. 키 없으면 → 토큰 그라디언트 **라벨 플레이스홀더 + gap 로그** |

## 산출물 · 저장 경로

조달 자산은 캐노니컬 위치인 `.design/assets/`에 둔다(web-publisher가 이미 `.design/assets/**`를 읽으므로 입력 경로가 안 늘고, 다운스트림 ui-kit·실제 구현에서도 재사용된다). 단 designer가 *저작한* 자산(brand-kit·logo·icon·page)을 흉내내거나 덮어쓰지 않도록 전용 하위 폴더로 네임스페이스한다.

- `.design/assets/vendor/<name>.svg` — fetch된 타사 마크(외부 출처임이 명확)
- `.design/assets/content/<slot>.<ext>` — 생성/플레이스홀더 콘텐츠 이미지
- `.design/assets/manifest.json` — 슬롯별 `{ id, type, source, path, status }`
  - `type`: `vendor` | `content` | `glyph`
  - `source`: `iconify:<set>:<name>` | `image-gen` | `placeholder` | `escalate`
  - `status`: `resolved` | `placeholder` | `escalate`
- **designer 저작 자산(brand-kit·logo·icon·page)은 절대 덮어쓰지 않는다** — 위 신규 하위 폴더에만 쓴다.
- web-publisher에는 별도 입력 경로를 새로 넘기지 않고, **매니페스트로 "어느 슬롯을 어느 파일로 채울지"만** 전달한다.

## web-publisher 계약 추가 (한 줄)

> 매니페스트 밖 자산 갭을 만나면 **손으로 지어내거나 트레이드마크를 흉내내지 말고 멈춰 보고**한다 → 스킬의 자산 갭 패스로 되돌아간다.

이는 web-publisher의 기존 헌장("이미 만들어진 자산만 소비", 충실도 거부)과 일관된다 — 발견·보고만 하고 조달은 하지 않는다.

## 스크립트

- **`iconify-client.mjs` 승격**: 현재 `skills/design-iconset/scripts/iconify-client.mjs` 전용. 이제 두 스킬이 쓰므로 AGENTS.md 규칙("다른 곳에서도 쓰면 최상위 `scripts/`로 승격")대로 `scripts/lib/iconify-client.mjs`로 옮기고 design-iconset도 거기서 import한다.
  - iconset의 fetch는 `currentColor`로 정규화하므로 다색 로고에 부적합하다. 프로토타입은 **색 보존 raw fetch**(`fetchIconSvg` 결과를 정규화 없이) 경로를 쓴다.
- **`skills/design-html-prototype/scripts/fetch-vendor-logo.mjs` (신규)**: 공유 client로 색 보존 SVG fetch + **벤더 별칭 맵**. 흔한 로그인 제공자를 큐레이션(예: `google → logos:google-icon`, `github → logos:github-icon` 또는 `simple-icons:github`, `kakao`, `naver`, `apple`), 맵에 없으면 수동 `set:name` 오버라이드를 받는다. `iconExists`로 먼저 가용성을 확인하고, 없으면 에스컬레이션 신호를 낸다.

## 버린 대안 (명시)

토론(`/personal:discussion`)에서 다음을 검토 후 폐기했다:

- ❌ **빌드 후 "렌더 스크린샷 ↔ 원본 comp" vision-diff 게이트.** 두 가지 치명적 결함: (1) comp는 gpt-image 생성물이라 *정답이 아니다* — 거기 맞추면 잘못된 comp를 충실히 베껴 오류를 증폭하고, upfront로 fetch한 *정확한* 벤더 마크를 comp의 *틀린* 마크와 다르다고 되돌릴 위험이 있다. (2) 비전 판정 신뢰도가 낮다 — 같은 저장소의 `web-publisher-qa`가 이미 "비전으론 미묘한 시각 항목을 신뢰성 있게 못 본다"며 그 영역을 의도적으로 범위 밖에 둔다. "대략 맞으면 통과"라는 느슨한 기준은 false-negative를 구조적으로 보장한다.
- ❌ **fidelity-verify 신규 스킬 / 라운드 루프.** 자산 *존재·주제* 판정은 빌드 전 comp 읽기로 충분하므로(빌드 후에만 보이는 갭은 비율 문제뿐이고 그건 layout-QA 영역) post-hoc 루프·라운드 상한·신규 스킬·재전달 핸드오프가 통째로 불필요하다.

## 범위 밖

- 토스·당근·배민 등 Iconify 미수록 벤더 마크의 자동 조달 — 에스컬레이션으로 처리(사람이 직접 제공).
- 콘텐츠 이미지의 미적 충실도 자동 판정 — 빌드 전 게이트에서 사람이 검수한다.
- web-publisher의 layout-QA(web-publisher-qa) 변경 — 그대로 둔다.
