# 컨트롤 높이 토큰화 — 설계

**상태:** 설계(검토 대기)
**대상 파일:** `skills/design-brand-kit/scripts/tokens-to-css.mjs`(+ 미러 테스트),
`skills/design-ui-kit/SKILL.md`, `skills/design-md-compiler/SKILL.md`
**관련:** `html-prototype-fidelity-gates-design.md`(같은 세션 — QA·예방 안전망). 이 스펙은 그 안전망을 구조적 보장으로 보완.

## 배경

같은 행에 놓인 `.input`과 `.btn`의 높이가 어긋난다(테스트 중 발견 — 입력이 버튼보다 ~5–6px 큼).
원인은 구조적이다: ui-kit.css에서 두 컨트롤이 같은 세로 padding(`--space-3`)을 쓰지만 line-height가
다르다(`.btn`=1, `.input`=1.4). padding 기반 높이라 line-height만 달라도 콘텐츠 높이가 벌어진다.

```
.btn   ≈ 12(pad) + 12 + 14(font×1)   + 2(border) = 40px
.input ≈ 12(pad) + 12 + 19.6(font×1.4) + 2(border) ≈ 45.6px
```

직전 작업에서 web-publisher-qa에 "같은 행 컨트롤 높이 일치" **탐지** 항목과 web-publisher에 **예방**
구절을 넣었지만, 이는 사람이 매번 확인해야 하는 안전망이다. 토큰화는 **구성만으로 정렬을 보장**한다 —
어떤 컨트롤 조합이든 자동으로 맞는다(성숙한 디자인 시스템의 표준 패턴).

## 파이프라인 사실

`tokens.css`는 `tokens-to-css.mjs`가 **brand-tokens.json 매핑 + 고정 관례 primitive 레이어**로 생성한다.
고정 관례 레이어엔 `--space-1..8`(MICRO_SPACE)·`--radius-pill`·tints가 들어간다(브랜드 가변 아님).
따라서 컨트롤 높이는 `--space-1..8`처럼 **고정 관례 primitive로 추가**하면 되고 brand-tokens.json은
건드리지 않는다.

> 동시 세션 주의: 다른 세션이 `.design` 경로를 재구성 중이다(`assets/tokens.css`→`assets/css/tokens.css`,
> `brand-tokens.json`→`reference/`, `ui-kit/ui-kit.css`→`assets/css/ui-kit.css`). 이 스펙은 토큰 *내용*만
> 바꾸고 경로는 바꾸지 않는다. `tokens-to-css.mjs`는 출력 경로를 CLI 인자로 받으므로 경로 재구성과 무관하다.
> `design-ui-kit`/`design-md-compiler` SKILL.md는 양쪽이 편집하나 라인이 겹치지 않는다(경로 vs 높이 가이드).

## 설계

### 1. 토큰 primitive — `tokens-to-css.mjs` (코드 + TDD)

- `MICRO_SPACE` 옆에 상수 추가: `CONTROL_HEIGHT = { sm: "32px", md: "40px", lg: "48px" }`.
- 고정 관례 레이어 emit 루프에 추가: 각 키를 `--control-h-<key>`로 emit(`--control-h-sm/md/lg`).
- 값 근거: 현재 버튼 변형 실측에 맞춤 — `.btn-sm`≈32 / `.btn` 기본≈40 / `.btn-lg`≈48.
  "시각 변화 없이 정렬만 보장"이 목표.
- **TDD:** 미러 테스트(`tests/skills/design-brand-kit/scripts/tokens-to-css*.test.mjs`)에
  `generateTokensCss` 출력이 `--control-h-sm: 32px`·`--control-h-md: 40px`·`--control-h-lg: 48px`를
  포함하는지 검증을 추가한다. 기존 테스트가 있으면 확장, 없으면 미러 규약대로 생성.

### 2. ui-kit 소비 — `design-ui-kit/SKILL.md` (저작 규칙)

- **변수 네이밍 계약**에 `--control-h-{sm,md,lg}` 추가(고정 관례 — `--space-*`·`--radius-pill`과 같은 층).
  "tokens.css에 없는 키 신설 금지"의 예외가 아니라, tokens.css가 이제 이 키를 내보내므로 정식 참조 대상.
- **저작 규칙:** 단일행 인터랙티브 컨트롤 — `.input`·`.select`·`.btn`(+`.btn-sm`/`.btn-lg`)·`.stepper`·
  search field — 는 세로 크기를 padding이 아니라 **`height: var(--control-h-md)`**(기본)로 잡고,
  변형은 `--control-h-sm`/`--control-h-lg`를 쓴다. 콘텐츠는 세로 센터링(flex 또는 line-height)으로 맞춘다.
  세로 padding은 높이 계산에서 빼고(또는 box-sizing 안에서 흡수), **가로 padding은 그대로** 유지.
- **메커니즘:** 고정 `height`(단일행은 줄바꿈이 없어 클리핑 위험 없음 — 정렬 100% 보장). `min-height` 아님.
- **제외:** `textarea`(멀티라인 — 기존 min-height/padding 유지), checkbox/radio/toggle(자체 고정 크기).

### 3. md-compiler frontmatter — `design-md-compiler/SKILL.md`

- §4 frontmatter 거울(tokens.css 투영)에 `--control-h-*`를 포함하도록 명시한다. spacing 인접에 두거나
  `controls:` 키로 노출(D1 거울 규칙 따름 — 손으로 쓰지 않고 tokens.css에서 긁음). DESIGN.md 포터빌리티 확보.

## 성공 기준

- `generateTokensCss`가 `--control-h-sm/md/lg`를 emit하고 테스트가 이를 검증(PASS).
- design-ui-kit 저작 규칙이 단일행 컨트롤에 `--control-h-*` 높이를 쓰도록 명시(textarea 제외 명문화).
- md-compiler가 frontmatter 거울에 `--control-h-*`를 포함하도록 명시.
- 기존 `npm test` 회귀 없음.

## 비목표 (out of scope)

- SugarLoop 등 기존 프로젝트의 tokens.css·ui-kit.css 재생성·수정(각 프로젝트가 다음 실행 시 반영).
- 컨트롤 높이를 brand-tokens.json 브랜드 가변으로 노출(YAGNI — 필요 시 후속에서 override 도입).
- `.design` 경로 재구성(다른 세션 소관).
- 직전에 넣은 web-publisher-qa 탐지·web-publisher 예방 구절(이미 적용 — 안전망으로 유지).

## 영향 / 후속

- `tokens-to-css.mjs`는 코드 변경 → TDD + `npm test`. 나머지 2개는 SKILL.md 프로즈.
- 수정 후 `npm run sync`로 Codex 번들 재생성(gitignore — 커밋 안 함).
- Claude `/reload-plugins`, Codex `npm run codex:reinstall`.
