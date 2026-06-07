# 워드마크 font-vs-image 결정 + design-logo 역할 재정의 Design

> 디자인 파이프라인의 워드마크 산출 방식을 brand-kit에서 "폰트 / 이미지"로 분기하고, design-logo의 역할을 온디맨드 로고 제작/교체로 재정의한다.

## 1. 배경 / 문제

`designer` 파이프라인 점검 중 발견한 워드마크 품질·일관성 갭:

1. **워드마크가 래스터 PNG로만 존재한다.** brand-kit이 `assets/brand-kit/wordmark-base.png`(gpt-image)를 만들지만, 이는 deliverable로 승격되지도, 컴포넌트가 일관되게 쓸 형태도 아니다. 헤더/네비가 가장 자주 쓰는 자산인데 스케일·recolor가 안 된다.
2. **AI 로고/워드마크 이미지는 재저작하면 형태가 흔들린다.** iconset처럼 "컨셉 PNG → 클린 SVG 재저작" 패턴을 로고에 그대로 적용할 수 없다 — 아이콘은 기하·스트로크라 LLM이 SVG로 재저작 가능하지만, 회화적 AI 로고를 손으로 벡터화하면 원본이 망가진다.
3. **워드마크는 "그냥 폰트 텍스트"로 충분한 경우가 많다.** 브랜드명을 display 폰트로 조판만 하는 워드마크(가장 흔한 형태)는 이미지로 만들 이유가 없다 — 텍스트면 무한 스케일·recolor·테마가 공짜다. 반대로 커스텀 레터링·비스포크는 이미지가 맞다.

핵심 통찰: **워드마크 형태(폰트 기반이냐 커스텀 이미지냐)는 brand-kit §6 로고 방향·§8 타이포가 이미 결정하는 정보**다. 그 결정을 명시화해 폰트 경로면 이미지를 아예 안 만들고, 이미지 경로면 래스터를 그대로(재저작 없이) production으로 쓰면 된다.

## 2. 목표 / 비목표

**목표**
- brand-kit이 워드마크를 **폰트 모드 / 이미지 모드**로 명시 분기. 기본 바이어스는 폰트, **단 도메인 역게이트**(커스텀/엠블럼/콤비네이션 마크는 이미지 권장)로 정체성 품질 보호.
- 폰트 모드: 워드마크 이미지 생성 스킵, 다운스트림이 텍스트로 렌더.
- 워드마크 **폰트 + 레터링(case·tracking·weight·color)을 tokens.css의 단일 `.wordmark` 클래스로** 묶어 전사 드리프트 차단(폰트만 토큰화하지 않는다).
- 이미지 모드: `wordmark-base.png`를 재저작 없이 production 워드마크로 선언.
- 폰트 경로를 최대한 당기도록 font-catalog에 **로고타입급 서브셋** 추가. 전용 폰트면 그 폰트 **CDN 로딩**까지 책임 명시.
- `design-logo`의 역할을 명확히 재정의(온디맨드 로고 제작/교체).

**비목표 (YAGNI / 파킹)**
- 로고/워드마크 SVG 재저작 (형태 왜곡으로 기각).
- 파비콘·앱아이콘 생성 (이번 범위 아님).
- 심볼 마크 산출 방식 변경 (logo는 래스터 탐색 그대로 유지).
- component-export·프레임워크/스타일링·폰트 번들·page-image↔DESIGN.md 2패스 (별도 논의로 파킹).

## 3. 핵심 모델 결정

- **로고/워드마크 이미지 재저작 없음.** AI 래스터(회화적 마크)는 래스터로 둔다 — 손 벡터화는 형태를 망가뜨린다.
- **워드마크 = brand-kit §6에서 모드 결정** (도메인 역게이트 포함, §4.3):
  - **폰트 모드(기본 바이어스, 조판형 워드마크 한정)**: 워드마크 이미지 생성 안 함. 브랜드명을 선택 폰트로 텍스트 렌더.
  - **이미지 모드(커스텀 레터링·엠블럼·콤비네이션 마크)**: `wordmark-base.png` 생성(현행), 재저작 없이 그대로 = production 워드마크.
- **폰트 경로 = C안**: 기본은 `display` 폰트 재사용, 원하면 전용 로고타입 폰트로 오버라이드.
- **이미지→폰트 강등 검토(§4.5)**: 이미지 모드라도 단순 타입 조판이면 폰트 모드 재분류를 검토한다(특히 한글 워드마크 — 글리프 뭉갬 때문에 폰트화가 더 안전).

## 4. 워드마크 표현 (단일 소스, downstream 일관 소비)

워드마크의 **폰트 패밀리만이 아니라 레터링 속성(case·tracking·weight·color) 전체를 tokens.css의 단일 `.wordmark` 클래스로** 묶는다. 이것이 핵심 — 폰트만 토큰화하고 레터링을 §6 산문에 흩어두면 overview·ui-kit masthead가 각자 재구현해 tokens.css가 없애려던 전사 드리프트가 워드마크에서 부활한다.

### 4.1 토큰 + `.wordmark` 클래스 (드리프트 차단)
brand-tokens.json에 선택 `wordmark` **스타일 블록**을 둔다(모드·브랜드명 같은 결정·콘텐츠는 토큰이 아니라 BRAND_KIT §6에). 전부 선택, 합리적 기본값:
```jsonc
// brand-tokens.json (최상위)
"wordmark": {
  "font": "",          // "" = display 재사용. 채우면 카탈로그 Logotype 서브셋의 전용 폰트(폴백 스택 포함)
  "tracking": "",      // letter-spacing (예: "-0.01em"). 비면 normal
  "weight": "700",
  "case": "none",      // none | uppercase | lowercase
  "color": "primary"   // color 토큰 키 → var(--color-primary). 비면 text
}
```
- `tokens-to-css.mjs` **변경**(TDD): `wordmark` 블록에서 **단일 `.wordmark` 클래스**를 tokens.css에 emit한다:
  ```css
  .wordmark{ font-family:var(--font-wordmark,var(--font-display)); letter-spacing:<tracking|normal>;
    font-weight:<weight|700>; text-transform:<case|none>; color:var(--color-<color|text>); }
  ```
  `wordmark.font`가 있으면 `--font-wordmark`도 함께 emit(없으면 생략 → display 폴백). `wordmark` 블록 자체가 없으면 기본값으로 `.wordmark`를 emit(전부 무난한 기본).
- 결과: 워드마크 레터링이 **tokens.css 한 곳**에 산다. overview·ui-kit masthead는 `<span class="wordmark">브랜드명</span>`만 쓰면 됨(case/tracking/weight/color 재구현 0 = 드리프트 차단). tokens.css는 brand-kit lock이 생성하므로 overview(brand-kit 단계)·ui-kit 양쪽이 동일 클래스를 공유.

### 4.2 소비 + 전용 폰트 로딩
- overview §1·ui-kit masthead: 폰트 모드면 `<span class="wordmark">브랜드명</span>`. ui-kit 템플릿 `.board-head .wm`을 제거하고 `.wordmark`를 쓴다.
- **전용 로고타입 폰트 CDN 로딩(필수):** `wordmark.font`가 전용 폰트(카탈로그 Logotype 서브셋)이면 **그 폰트의 실폰트 CDN `<link>`도 주입**돼야 한다. overview의 폰트 `<link>` 세트와 ui-kit `slot:font-links` 주입이 **wordmark 폰트까지 포함**하도록 명시(누락 시 `var(--font-wordmark)`가 시스템 폴백으로 조용히 깨짐).

### 4.3 BRAND_KIT §6 모드 결정 + 도메인 역게이트
§6 로고 방향 "워드마크 방향"에 명시:
- **모드**: `폰트`(기본 바이어스) | `이미지`
- **도메인 역게이트(필수):** §6 로고 방향이 **콤비네이션 마크·엠블럼·커스텀 레터마크**이거나 `references/brand-kit-image.md`가 그 도메인에 커스텀/세리프 워드마크를 처방하면(럭셔리·뷰티·패션·컬처럴·실험) **이미지 모드를 권장**한다. 폰트 바이어스는 "조판형 워드마크" 한정 — 정체성이 커스텀 레터링인 브랜드를 폰트로 평준화하지 않는다.
- 폰트 모드면: `텍스트(브랜드명)` · `폰트(display 재사용 | 전용 로고타입 폰트명)` 명시. case/tracking/weight/color는 `wordmark` 스타일 블록(4.1)에 둔다(§6엔 산문 중복 금지 — 토큰이 권위).
- 이미지 모드면: `wordmark-base.png가 production 워드마크` 명시.

### 4.4 brand-kit 산출 분기 + 아키타입 골격
- **폰트 모드**: `wordmark-base.png`를 **생성하지 않는다**. overview §1 워드마크를 `<img>` 대신 `<span class="wordmark">`로 렌더.
- **이미지 모드**: 현행대로 `wordmark-base.png` 생성, overview §1은 `<img src="../assets/brand-kit/wordmark-base.png">`.
- **아키타입 골격 분기(필수 — 누락 시 비결정):** `references/brand-kit-html-direction.md`의 §1·§6 워드마크 매핑과 4개 `references/archetypes/*.md`(a-ruled-grid·b-editorial·c-sidebar·d-stacked-bands)의 워드마크 슬롯을 **`<img class="wm">`(이미지 모드) | `<span class="wordmark">`(폰트 모드) 양쪽**으로 명시한다. 특히 `c-sidebar`의 `filter:brightness(0) invert(1)`은 이미지 전용 트릭이라, 폰트 모드에선 `.wordmark`를 흰/surface 색(`color`)으로 대체함을 명시. 두 권위(텍스트/이미지)가 충돌하지 않도록 각 아키타입이 모드별 슬롯을 갖는다.

### 4.5 이미지→폰트 강등 검토
이미지 모드로 분류됐더라도 워드마크가 **단순 타입 조판**(gpt-image가 폰트를 로드 못 하고 타입 스타일만 근사한 글자)이면 폰트 모드로 재분류를 검토한다. 특히 **한글 워드마크는 글리프 뭉갬 때문에 폰트화가 더 안전**해 강등 실익이 크다.

## 5. font-catalog 로고타입 서브셋

`skills/references/design/font-catalog.md`에 **`## Logotype (워드마크용)`** 섹션을 추가한다 — 폰트 경로를 최대한 당기기 위한 로고타입급 페이스 큐레이션.
- 선정 기준: 큰 크기에서 개성·균형이 사는 display/로고타입급, 실존·로드 가능(검증 백본 원칙 유지), 한글 지원 여부 표기.
- 기존 항목 형식(이름 — 역할·성격 한 줄·한글 Y/N·라이선스·URL·폴백 스택)을 그대로 따른다.
- brand-kit §8 워드마크 폰트 선택 시 **이 서브셋 우선**(전용 로고타입 폰트를 쓸 때).

## 6. design-logo 역할 재정의

- `description`·목적을 다음으로 재정의: **"brand-kit의 로고 이미지가 마음에 들지 않거나, 단순히 프로젝트 로고를 만들 때 쓰는 온디맨드 단계."**
- 산출 방식은 변경 없음(심볼 마크 래스터 탐색 그대로 — 재저작 없음 원칙과 일치).
- 선택성 등급을 문서에 명시: **logo-skip = 단일 마크 한정 충분**(brand-kit `logo-base.png`가 단일 컷아웃 마크를 대체 — 단 락업·변형 같은 로고 *시스템*은 없음), **iconset-skip = degrade**(core 아이콘 없으면 ui-kit이 유니코드 폴백) — 둘을 같은 "선택"으로 뭉뚱그리지 않는다.

## 7. 영향 파일

| 파일 | 변경 |
|---|---|
| `skills/references/design/font-catalog.md` | Logotype 서브셋 섹션 추가 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens.json 구조에 `wordmark` 스타일 블록(선택), §6 워드마크 **모드 결정 + 도메인 역게이트**, 폰트 모드면 wordmark 이미지 생성 스킵, overview §1 이미지/텍스트 분기 + 폰트 `<link>`에 wordmark 폰트 포함, §8 워드마크 폰트는 카탈로그 Logotype 서브셋 우선, 이미지→폰트 강등 검토(§4.5) |
| `skills/design-brand-kit/references/brand-kit-html-direction.md` | **(신규 영향)** §1·§6 워드마크 슬롯을 `<img class="wm">`(이미지) \| `<span class="wordmark">`(폰트) 양쪽으로 명시 |
| `skills/design-brand-kit/references/archetypes/{a-ruled-grid,b-editorial,c-sidebar,d-stacked-bands}.md` | **(신규 영향)** 각 워드마크 슬롯을 모드별(img/span)로 분기. c-sidebar의 `brightness(0) invert(1)`은 폰트 모드 시 `.wordmark` color 대체 명시 |
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | **코드 변경(TDD).** `wordmark` 블록에서 `--font-wordmark`(있으면) + 단일 `.wordmark` 클래스(font-family·letter-spacing·font-weight·text-transform·color) emit. 블록 없으면 기본값 `.wordmark` |
| `tests/tokens-to-css.test.mjs` | `.wordmark` 클래스 emit + `wordmark.font`→`--font-wordmark` + 기본값 동작 테스트 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | `.board-head .wm` 제거, masthead가 `<span class="wordmark">` 사용 |
| `skills/design-ui-kit/SKILL.md` | masthead 저작 규칙을 `.wordmark` 사용으로, `slot:font-links` 주입에 wordmark 폰트 포함 명시 |
| `skills/design-logo/SKILL.md` | description·목적 재정의, 선택성 등급 명시 |

## 8. 검증

- `npm test` — `tokens-to-css.test.mjs` 신규 테스트(`.wordmark` 클래스·`--font-wordmark`·기본값) 포함 전체 PASS(회귀 없음).
- `npm run validate` — 생성물·소스 일치.
- 수동:
  - 더미 `brand-tokens.json`에 `wordmark` 블록(전용 font + tracking + uppercase + color) 채워 `tokens-to-css.mjs` 실행 → `--font-wordmark` + 해당 값의 `.wordmark` 클래스 포함 확인. 블록 없을 때 기본값 `.wordmark` 확인.
  - 폰트 모드 더미 overview/ui-kit masthead가 `<span class="wordmark">`로 렌더되고 전용 폰트 `<link>`가 주입되는지, 아키타입 골격(특히 c-sidebar)이 텍스트 슬롯으로 깨지지 않는지 확인.
- `npm run sync` 후 `/reload-plugins` 안내(skills 변경).

## 9. 범위 밖 / 파킹 (재확인)

- component-export 스킬 설계 (placeholder만 존재).
- 타깃 프레임워크/스타일링 전략, 폰트 self-host/번들.
- page-image가 DESIGN.md 코어를 읽는 2패스 구조(md-compiler 1패스=ui-kit 직후 §1–5, 2패스=page-image 후 §6–7).
- 파비콘·앱아이콘, 심볼 마크 SVG화.
