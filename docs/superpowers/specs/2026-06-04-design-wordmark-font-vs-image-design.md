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
- brand-kit이 워드마크를 **폰트 모드 / 이미지 모드**로 명시 분기. 기본 바이어스는 폰트.
- 폰트 모드: 워드마크 이미지 생성 스킵, 다운스트림이 텍스트로 렌더(일관 표현).
- 이미지 모드: `wordmark-base.png`를 재저작 없이 production 워드마크로 선언.
- 폰트 경로를 최대한 당기도록 font-catalog에 **로고타입급 서브셋** 추가.
- `design-logo`의 역할을 명확히 재정의(온디맨드 로고 제작/교체).

**비목표 (YAGNI / 파킹)**
- 로고/워드마크 SVG 재저작 (형태 왜곡으로 기각).
- 파비콘·앱아이콘 생성 (이번 범위 아님).
- 심볼 마크 산출 방식 변경 (logo는 래스터 탐색 그대로 유지).
- component-export·프레임워크/스타일링·폰트 번들·page-image↔DESIGN.md 2패스 (별도 논의로 파킹).

## 3. 핵심 모델 결정

- **로고/워드마크 이미지 재저작 없음.** AI 래스터는 래스터로 둔다.
- **워드마크 = brand-kit §6에서 모드 결정**:
  - **폰트 모드(기본)**: 워드마크 이미지 생성 안 함. 브랜드명을 선택 폰트로 텍스트 렌더.
  - **이미지 모드**: `wordmark-base.png` 생성(현행), 재저작 없이 그대로 = production 워드마크.
- **폰트 경로 = C안**: 기본은 `display` 폰트 재사용, 원하면 전용 로고타입 폰트로 오버라이드.

## 4. 워드마크 표현 (downstream 일관 소비)

기존 `typography.accent`(선택 토큰) 선례를 그대로 따른다.

### 4.1 토큰
```jsonc
// brand-tokens.json
"typography": {
  "display": "...", "heading": "...", "body": "...", "mono": "...",
  "accent": "...",
  "wordmark": ""   // 신규(선택). 비면 display 재사용, 채우면 전용 로고타입 폰트(카탈로그 로고타입 서브셋에서)
}
```
- `tokens-to-css.mjs`는 **변경 불필요** — 이미 `typography`의 모든 키를 `if(v)`로 순회해 `--font-<kebab(k)>`를 emit하고 빈 값은 생략한다. 따라서 `wordmark`가 있으면 `--font-wordmark`가 자동 생성되고, 비면 생략된다. **이 동작을 잠그는 특성화 테스트만 추가**한다(있으면 emit / 비면 생략).

### 4.2 소비
- ui-kit masthead·워드마크를 쓰는 컴포넌트: `font-family: var(--font-wordmark, var(--font-display))` — 토큰 없으면 display로 자동 폴백.
- ui-kit 템플릿 `.board-head .wm`을 위 패턴으로 변경.

### 4.3 BRAND_KIT §6 명시
§6 로고 방향의 "워드마크 방향" 항목에 결정을 명시한다:
- **모드**: `폰트` | `이미지`
- 폰트 모드면: `텍스트(브랜드명)` · `폰트(display 재사용 | 전용 로고타입 폰트명)` · `case` · `tracking` · `weight` · `color(토큰)`
- 이미지 모드면: `wordmark-base.png가 production 워드마크` 명시.

### 4.4 brand-kit 산출 분기
- **폰트 모드**: `wordmark-base.png`를 **생성하지 않는다**. overview.html §1 워드마크를 `<img>` 대신 **텍스트**(`var(--font-wordmark, var(--font-display))` + §6 스타일)로 렌더.
- **이미지 모드**: 현행대로 `wordmark-base.png` 생성, overview §1은 `<img src="../assets/brand-kit/wordmark-base.png">`.

## 5. font-catalog 로고타입 서브셋

`skills/references/design/font-catalog.md`에 **`## Logotype (워드마크용)`** 섹션을 추가한다 — 폰트 경로를 최대한 당기기 위한 로고타입급 페이스 큐레이션.
- 선정 기준: 큰 크기에서 개성·균형이 사는 display/로고타입급, 실존·로드 가능(검증 백본 원칙 유지), 한글 지원 여부 표기.
- 기존 항목 형식(이름 — 역할·성격 한 줄·한글 Y/N·라이선스·URL·폴백 스택)을 그대로 따른다.
- brand-kit §8 워드마크 폰트 선택 시 **이 서브셋 우선**(전용 로고타입 폰트를 쓸 때).

## 6. design-logo 역할 재정의

- `description`·목적을 다음으로 재정의: **"brand-kit의 로고 이미지가 마음에 들지 않거나, 단순히 프로젝트 로고를 만들 때 쓰는 온디맨드 단계."**
- 산출 방식은 변경 없음(심볼 마크 래스터 탐색 그대로 — 재저작 없음 원칙과 일치).
- 선택성 등급을 문서에 명시: **logo-skip은 무손실**(brand-kit `logo-base.png`가 대체), **iconset-skip은 degrade**(core 아이콘 없으면 ui-kit이 유니코드 폴백) — 둘을 같은 "선택"으로 뭉뚱그리지 않는다.

## 7. 영향 파일

| 파일 | 변경 |
|---|---|
| `skills/references/design/font-catalog.md` | Logotype 서브셋 섹션 추가 |
| `skills/design-brand-kit/SKILL.md` | brand-tokens.json 구조에 `typography.wordmark`(선택), §6 워드마크 모드 결정, 폰트 모드면 wordmark 이미지 생성 스킵, overview §1 이미지/텍스트 분기, §8 워드마크 폰트는 카탈로그 Logotype 서브셋 우선 |
| `skills/design-brand-kit/scripts/tokens-to-css.mjs` | **코드 변경 없음.** 특성화 테스트만 추가(`tests/tokens-to-css.test.mjs`): wordmark 있으면 `--font-wordmark` emit, 비면 생략 |
| `skills/design-ui-kit/templates/ui-kit-sheet.html` | `.board-head .wm` → `font-family: var(--font-wordmark, var(--font-display))` |
| `skills/design-ui-kit/SKILL.md` | masthead 저작 규칙에 워드마크 폰트 폴백 패턴 명시 |
| `skills/design-logo/SKILL.md` | description·목적 재정의, 선택성 등급 명시 |

## 8. 검증

- `npm test` — `tokens-to-css.test.mjs` 신규 특성화 테스트 포함 전체 PASS(회귀 없음).
- `npm run validate` — 생성물·소스 일치.
- 수동: 더미 `brand-tokens.json`에 `typography.wordmark` 채워 `tokens-to-css.mjs` 실행 → `--font-wordmark` 포함 확인. 빈/누락 시 생략 확인. ui-kit 템플릿 masthead가 폴백으로 display 렌더하는지 확인.
- `npm run sync` 후 `/reload-plugins` 안내(skills 변경).

## 9. 범위 밖 / 파킹 (재확인)

- component-export 스킬 설계 (placeholder만 존재).
- 타깃 프레임워크/스타일링 전략, 폰트 self-host/번들.
- page-image가 DESIGN.md 코어를 읽는 2패스 구조(md-compiler 1패스=ui-kit 직후 §1–5, 2패스=page-image 후 §6–7).
- 파비콘·앱아이콘, 심볼 마크 SVG화.
