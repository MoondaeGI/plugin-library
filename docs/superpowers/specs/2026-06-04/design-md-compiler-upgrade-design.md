# design-md-compiler 업그레이드 + typography 1급화 — 설계

작성일: 2026-06-04
대상 스킬: `skills/design-md-compiler/SKILL.md`, `skills/design-brand-kit/` (typography 스키마)

## 1. 배경 / 문제

현재 `design-md-compiler`가 만드는 `DESIGN.md`는 §1~9 골격이 헤더 나열 수준이라
구현자가 그대로 따라 칠 만큼 구체적이지 않다. 참조 기준은 사용자가 제공한
"awesome design md" 스타일의 Apple 분석 문서(`DESIGN (1).md`)로, 그 문서는 다음
5가지 장치로 구현 가능한 해상도를 얻는다.

1. **토큰 참조 frontmatter** — md 상단 `---` 블록에 색·타이포 등을 구조화 데이터로
   정의하고, 산문이 `{colors.primary}`처럼 이름으로 상호 참조.
2. **풍부한 타이포 스케일** — 명명 스타일마다 size/weight/lineHeight/letterSpacing.
3. **컴포넌트별 정밀 스펙** — bg/text/typo/radius/padding + 상태 + 용도.
4. **Do / Don't** — 토큰 참조로 박은 강제·금지.
5. **Responsive 절 + Provenance/Known Gaps 등 메타.**

격차의 원인은 둘로 나뉜다:
- **(A) 상류 입력 부족**: 특히 **typography 스케일이 파이프라인에 데이터로 존재하지
  않는다**(아래 §3 검증). 반응형 결정·토큰 의도도 미산출.
- **(B) 컴파일러 템플릿의 해상도 부족**: 토큰 참조 규약·컴포넌트 스펙·Do/Don't·
  Responsive·Provenance가 템플릿에 없다.

본 작업은 **(B) 컴파일러 템플릿 업그레이드**에 더해, 검증 과정에서 드러난 가장
치명적인 (A) 격차인 **typography 스케일 1급화**를 함께 묶는다. 나머지 (A)(반응형
breakpoint, 상류 의도 포착)는 후속 아이템으로 분리한다.

## 2. 범위

### 포함
- **`skills/design-md-compiler/SKILL.md`**: DESIGN.md 출력 구조·저작 규칙·degradation·
  frontmatter 재생성 트리거 업그레이드.
- **`skills/design-brand-kit/`**: typography 스키마 1급화 —
  - `brand-tokens.json` typography 스키마를 폰트명 문자열 → 구조화 객체로.
  - `scripts/tokens-to-css.mjs`: 구조화 typography를 CSS 변수로 emit.
  - 영향받는 소비자(`scripts/build-contact-sheet.mjs`, `references/*`) 호환 처리.

### 제외 (후속 아이템)
- brand-kit §1 폼팩터 필드 + lock의 `--bp-*` breakpoint 토큰 emit (→ §7 Responsive를
  실제 값으로 채움).
- 상류 의도(intent) 구조화 포착: brand-kit §7/§8 토큰별 의도, ui-kit 게이트2 →
  `ui-kit-briefs.md` 컴포넌트별 의도 구조화.
- design-ui-kit·design-html-prototype 등 다른 스킬 수정.

## 3. 검증으로 확정된 사실 (typography 데이터 부재)

실제 파일 확인 결과:
- `brand-tokens.json` typography 스키마(SKILL.md:198)는
  `{ "display": "", "heading": "", "body": "", "mono": "", "accent": "" }` — 값이 전부
  **폰트 패밀리 문자열**(CSS font-family 문법)이다.
- `scripts/tokens-to-css.mjs:41`은 `--font-<key>: <fontFamily>` 한 줄만 emit. size/
  weight/lineHeight/letterSpacing은 어디에도 없다.
- 유사 스케일은 두 곳에 있으나 **토큰이 아니다**: 브랜드 보드 이미지의
  "type scale (Display/H1/H2/Body/Caption/Label)"(`references/brand-kit-image.md:91`)은
  *시각 스펙시먼*, contact-sheet 템플릿의 `font-size`는 *쇼케이스 chrome 하드코딩*.

→ 컴파일러는 "전사만" 하므로(D3) 없는 데이터를 만들 수 없다. Apple식 typography
테이블을 내려면 그 데이터를 **1급 토큰으로 승격**해야 한다(D7).

## 4. 핵심 설계 결정 (확정)

| # | 결정 | 내용 |
|---|---|---|
| D1 | **frontmatter = 토큰만 (컴파일된 거울)** | DESIGN.md 상단 `---`에 color/typography/spacing/radius/shadow/(bp) 토큰을 컴파일러가 `tokens.css`에서 긁어 자동 생성. `generated — do not edit` 명시. `tokens.css`가 단일 권위, frontmatter는 거울. 산문은 `{token.ref}`로 참조. tokens.css 없으면 `brand-tokens.json` 폴백. |
| D2 | **컴포넌트는 frontmatter가 아니라 §5 산문** | 컴포넌트는 구조화 YAML로 frontmatter에 넣지 않는다(임의 CSS→YAML 변환이 깨지기 쉽고 ui-kit.css와 이중 관리·드리프트). 대신 §5에 **의미 이름 + 토큰 참조 스펙 + 실제 ui-kit.css class명**의 풍부한 산문으로 기술. 포터빌리티는 토큰 frontmatter + self-contained 산문으로 달성(아래 D-Portability). |
| D3 | **rationale = 전사, 창작 금지** | 토큰/컴포넌트별 "왜/어디"는 ① `BRAND_KIT.md` §7/§8/§10·금지 패턴 + `ui-kit-briefs.md`의 의도를 그대로 옮긴다 → ② 근거 없으면 사실만(어디 쓰이는지) → 시적 의도 창작 금지. 얇으면 §12 Provenance에 "근거 부족" 표시. |
| D4 | **degradation = 이전 단계 먼저 안내** | 입력 없으면 조용히 추론으로 때우지 않고 이전 단계를 먼저 돌리라고 권장. 사용자가 그래도 진행하면 폴백 + Known Gaps. |
| D5 | **상류 의도 포착은 후속 아이템** | 컴파일러는 기존 입력의 의도를 전사만. brand-kit/ui-kit에 구조화 의도 기록 추가는 별도. |
| D6 | **frontmatter 재생성 트리거 명시** | 컴파일러는 호출될 때마다 `tokens.css`에서 frontmatter를 **항상 재컴파일**한다(매번 거울을 다시 닦음). `tokens.css`가 `DESIGN.md`보다 최신이면 "stale — 재생성 필요" 경고. "한 번 생성 후 방치"로 인한 drift 방지. |
| D7 | **typography 스케일 1급화** | brand-kit이 typography를 구조화 토큰으로 산출하도록 스키마·emit·소비자를 확장(아래 §6). |

### D-Portability — 포터빌리티 근거

목표: DESIGN.md를 이 플러그인 파이프라인 **밖의 다른 AI/프로젝트**가 단독으로
받아 쓸 수 있게 한다. 이를 위해 컴포넌트를 구조화 frontmatter로 박을 필요는 없다.
포터빌리티는 두 가지로 충분하다:
- **토큰 frontmatter**(D1): 가장 재사용 빈도가 높은 값(색·타이포·스페이싱 등)을
  기계가 읽는 구조로 self-contained 제공.
- **풍부한 산문**(§3 시각방향·§4 토큰 rationale·§5 컴포넌트): 마크다운 산문은
  어떤 AI든 읽는다. 컴포넌트의 의미 이름·스펙·용도가 산문에 다 담긴다.

`button-pearl-capsule` 같은 구조 YAML 블록은 nice-to-have였을 뿐이며, 그 대가(CSS→
YAML 변환의 취약성·이중 관리·drift)가 편익을 초과한다. 따라서 D2로 축소한다.

## 5. 업그레이드된 DESIGN.md 구조

### A. Frontmatter (컴파일러 자동 생성 · `do not edit` · 매 호출 재컴파일)

```yaml
---
# generated from .design/assets/tokens.css — do not edit (regenerated on every compile)
meta:          # 제품 에센스 한 문단
colors:        # 의미키 → HEX                         (tokens.css --color-*)
typography:    # 명명 스케일 → {family,size,weight,lineHeight,letterSpacing}  (D7 이후 채워짐)
spacing:       # (tokens.css --space-*)
radius:        # (tokens.css --radius-*)
shadow:        # (tokens.css --shadow-*)
border:        # (tokens.css)
breakpoints:   # (후속 아이템 --bp-* — 없으면 생략 + Known Gaps)
---
```

- 참조 문법은 점 표기(`{colors.primary}` ← `--color-primary`). 변수 네이밍은
  `design-ui-kit` SKILL.md "변수 네이밍 계약"과 일치.
- **컴포넌트는 frontmatter에 없음**(D2) — §5 산문에만.

### B. 본문 (산문 · 전부 `{token.ref}` 상호 참조)

| § | 섹션 | 변화 |
|---|---|---|
| 1 | 제품 요약 | 유지 |
| 2 | 브랜드 성격 | 유지 |
| 3 | 시각 방향 + **Key Characteristics 불릿** | 보강 |
| 4 | 디자인 토큰 — 토큰별 **값 + 왜/어디** 산문 (Colors / Typography / Spacing / Radius / **Elevation** / **Shapes** / Border) | 대폭 보강. Elevation·Shapes는 §4 하위로 통합. |
| 5 | 컴포넌트 규칙 — **컴포넌트별 산문 스펙**: 의미이름 + 실제 ui-kit class + bg/text/typo/radius/padding + **상태**(ui-kit.css 강제상태 그대로) + 용도 + **살릴점/버릴점** | 대폭 보강 |
| 6 | 페이지 섹션 규칙 | 유지 (page briefs) |
| 7 | **Responsive Behavior** — breakpoint 표·터치타깃·collapsing. bp 토큰 없으면 "고정폭 데스크톱 전용" | **신설** |
| 8 | 이미지 에셋 사용 규칙 | 유지 |
| 9 | **Do's & Don'ts** — 토큰 참조로 박은 강제·금지 | **신설** |
| 10 | 구현 제약 (HTML/CSS·React·접근성·반응형·성능) | 유지 |
| 11 | Anti-slop checklist | 유지 (기존 §9) |
| 12 | **Provenance & Known Gaps** — 읽은 입력·추측값·누락 입력·근거 부족 항목·재생성 메모 | **신설** |

## 6. D7 — typography 1급화 상세

### 닮을 스케일은 이미 존재한다
브랜드 보드 이미지가 이미 `Display / H1 / H2 / Body / Caption / Label` 6단 스케일을
렌더한다(`references/brand-kit-image.md:91`). 이를 *지어내지 않고* 구조화 토큰으로
**승격**한다. (Apple식 15단까지 잘게 가지 않는다 — 정량 스펙을 *갖는 것*이 핵심이지
스타일 개수가 아니다. 6단 + mono + accent로 충분.)

### 스키마 변경 (`brand-tokens.json`)
`typography.<role>`을 문자열에서 객체로:
```json
"typography": {
  "display": { "family": "...", "size": "...", "weight": 0, "lineHeight": 0, "letterSpacing": "..." },
  "h1":      { ... }, "h2": { ... }, "body": { ... }, "caption": { ... }, "label": { ... },
  "mono":    { ... }, "accent": { ... }
}
```
- `family`는 기존 폰트 패밀리 문자열(`font-catalog.md` 실존 폰트). 나머지 4개 숫자
  스펙이 신규.

### emit 변경 (`scripts/tokens-to-css.mjs`)
- `--font-<role>`(family) 유지 + `--text-<role>-size`·`--text-<role>-weight`·
  `--text-<role>-leading`·`--text-<role>-tracking` emit (정확한 변수명·shorthand 여부는
  구현 계획에서 확정).
- `--font-wordmark` 등 기존 동작 보존.

### 소비자 마이그레이션 (호환성 — 깨지기 쉬움, 주의)
- `scripts/build-contact-sheet.mjs`·lock 전 탐색용 `directions.json`은 현재
  `typography.display`/`body`를 **문자열로** 읽는다(`build-contact-sheet.mjs:166-167`,
  `references/brand-kit-contact-sheet.md:79-88`).
- 방침: **lock된 `brand-tokens.json`만 객체화**하고, lock 전 3방향 탐색용
  `directions.json`은 가벼운 문자열 스키마 유지. 두 스키마가 갈리는 지점과
  contact-sheet가 객체에서 `family`를 뽑는 처리(`d.typography.display.family` 등)는
  구현 계획에서 상세화·테스트.
- `references/brand-kit-contact-sheet.md`·`brand-kit-image.md`·`brand-kit-html-direction.md`
  의 typography 기술도 새 스키마에 맞춰 갱신.

## 7. 호환성 / 영향

- `design-ui-kit` lock → `design-md-compiler` 호출 계약 불변. 컴파일러는 여전히
  `ui-kit.css`를 §5 권위 입력으로 읽는다(§5 산문 스펙으로 활용).
- 출력 경로(`DESIGN.md`, 대상 cwd 루트) 불변. 입력 파일 목록 불변.
- typography 스키마 변경은 **기존 brand-tokens.json을 만든 프로젝트와 비호환**일 수
  있다(문자열→객체). 마이그레이션/폴백(문자열도 읽어 family로 승격) 여부를 구현
  계획에서 결정.

## 8. 검증 / 완료 기준

- 업그레이드된 `design-md-compiler` SKILL.md가 §5 구조·D1~D6 규칙·degradation을 명시.
- 참조 문서의 5장치(frontmatter·typography 스케일·컴포넌트 스펙·Do/Don't·Responsive+
  Provenance)가 템플릿에 대응 항목으로 존재.
- D3(창작 금지)·D4(이전 단계 먼저)·D6(재생성 트리거)가 규칙/흐름 절에 박혀 있다.
- brand-kit typography 스키마가 6단+mono+accent 구조화 객체를 산출하고,
  `tokens-to-css.mjs`가 `--text-*` 변수를 emit하며, contact-sheet 등 소비자가 깨지지
  않는다(테스트 통과).
- ui-kit.css 없는 상태에서도 컴파일러가 폴백 + Known Gaps로 동작.

## 9. 미해결 / 후속

- **폼팩터/breakpoint** (후속): brand-kit §1 폼팩터 필드 + `--bp-*` emit → §7 Responsive
  실제 값.
- **상류 의도 포착** (후속): brand-kit §7/§8 토큰별 의도, ui-kit 게이트2 →
  `ui-kit-briefs.md` 컴포넌트별 의도 → 컴파일러 전사 품질 상승.
- typography 정량 스펙(size/weight/...)의 **실제 값을 누가 정하나**: 1급화는 *슬롯*을
  만들 뿐, 값은 brand-kit 저작 단계에서 폰트 방향에 맞춰 채워야 한다. 그 저작 UX는
  구현 계획에서 다룬다(자동 기본 스케일 제안 vs 수동 입력).
