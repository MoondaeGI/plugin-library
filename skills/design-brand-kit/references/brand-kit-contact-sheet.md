# 브랜드 킷 컨택트 시트 가이드 (directions.html)

`design-brand-kit`이 **발산 게이트(directions.html)를 생성할 때** 읽는 가이드다.

## 책임 경계

이 파일은 **`directions.html` 컨택트 시트 생성** 전담이다. 아래 두 파일과 겹치지 않는다:

- **`brand-kit-html-direction.md`** — `overview.html` 자유 저작 규칙(포스터 원칙·섹션 매핑·레이아웃). overview.html은 LLM이 브랜드별로 저작하는 풀 브랜드 원페이저다. 이 파일은 그 저작을 다루지 않는다.
- **`brand-kit-image.md`** — 이미지 자산(`logo-base.png`·`key-visual.png` 등) 생성 아트 디렉션. 이 파일은 이미지 생성을 다루지 않는다.

## 자유 저작 금지 — 결정적 생성

`directions.html` 컨택트 시트는 LLM이 HTML을 직접 쓰지 않는다. 반드시 스크립트가 생성한다.

**이유**: 3열이 바이트 단위로 동일한 레이아웃이라야 색·폰트 차이가 또렷이 비교된다. 열마다 레이아웃이 조금씩 다르면 "어느 방향이 더 좋아 보이는지"가 아니라 "어느 레이아웃이 더 좋아 보이는지"를 비교하게 된다.

생성 도구: `scripts/build-contact-sheet.mjs`
- **입력**: `directions.json` (3개 방향 데이터)
- **고정 템플릿**: `scripts/contact-sheet.template.html` (레이아웃 변경 불가)
- **출력**: `directions.html` (토큰 치환 결과)

## `directions.json` 스키마

스크립트 `REQUIRED_DIR_FIELDS`와 `render()` / `buildColumn()` / `buildSwatches()`에서 실제 사용하는 필드:

```json
{
  "product": "제품명",
  "directions": [
    {
      "id": "a",
      "label": "안전한 SaaS형",
      "mood": "신뢰 · 명료 · 접근 가능",
      "wordmark": "제품명",
      "headline": "짧은 헤드카피",
      "body": "한두 줄 본문 카피. 브랜드 약속을 간결하게.",
      "tagline": "핵심 태그라인",
      "palette": {
        "primary": "#HEX",
        "accent": "#HEX",
        "background": "#HEX",
        "surface": "#HEX",
        "text": "#HEX",
        "textMuted": "#HEX",
        "border": "#HEX"
      },
      "typography": {
        "display": "\"IBM Plex Sans KR\", sans-serif",
        "body": "\"Noto Sans KR\", sans-serif"
      }
    },
    { ... },
    { ... }
  ]
}
```

**필드 상세**:

| 경로 | 타입 | 설명 |
|---|---|---|
| `product` | string | 제품명. `<title>` 및 헤더 `{{PRODUCT}}` 치환에 사용. |
| `directions` | array(3) | 정확히 3개. 1개 부족하거나 4개면 스크립트가 오류 종료. |
| `directions[n].id` | string | 열 머리 `"방향 A · ..."` 레이블에서 `toUpperCase()`로 표시. |
| `directions[n].label` | string | id 뒤에 붙는 방향 이름. |
| `directions[n].mood` | string | 무드 한 줄 요약. 워드마크 아래 작은 줄로 표시. |
| `directions[n].wordmark` | string | 이 방향의 워드마크 텍스트. |
| `directions[n].headline` | string | 큰 헤드카피. 방향의 핵심 목소리를 대표. |
| `directions[n].body` | string | 본문 카피 1–2문장. |
| `directions[n].tagline` | string | 태그라인. 열 하단 따옴표로 감싸 표시. |
| `directions[n].palette.primary` | string(HEX) | 주색. 열 상단 **헤더 밴드** 배경(`--primary`)으로 themed — 배경색이 비슷한 방향끼리도 또렷이 구분. 밴드 위 워드마크 색은 primary 명도로 흑/백 자동 대비(`--on-primary`). |
| `directions[n].palette.accent` | string(HEX) | 강조색. 열 CSS 변수 `--accent`로 주입. |
| `directions[n].palette.background` | string(HEX) | 배경. 열 CSS 변수 `--bg`로 주입. |
| `directions[n].palette.surface` | string(HEX) | 표면(카드·입력 등). 스와치만 표시. |
| `directions[n].palette.text` | string(HEX) | 본문 색. 열 CSS 변수 `--text`로 주입. |
| `directions[n].palette.textMuted` | string(HEX) | 흐린 본문. 스와치만 표시. |
| `directions[n].palette.border` | string(HEX) | 경계선. 스와치만 표시. |
| `directions[n].typography.display` | string | 디스플레이 폰트 스택(CSS font-family 문법). 따옴표 안 family를 추출해 CDN 로드. |
| `directions[n].typography.body` | string | 본문 폰트 스택. |

> **참고:** `directions.json`의 `typography`는 발산 탐색용이라 **폰트 스택 문자열만** 쓴다(`display`/`body`). lock된 `brand-tokens.json`의 `typography.<role>` 정량 객체(`tokens-to-css.mjs` 입력)와는 **다른 스키마**다 — 컨택트 시트는 색·폰트 *방향* 비교가 목적이므로 정량 스펙을 받지 않는다.

**palette 스와치 표시 순서**: primary → accent → background → surface → text → textMuted → border (스크립트 `PALETTE_ROLES` 순).

**palette 키 누락 처리**: 값이 없는 키는 스와치에서 조용히 제외됨(오류 아님). 단 `REQUIRED_DIR_FIELDS`의 `palette` 자체가 없으면 오류.

### 폰트 스택 규칙

`typography.display`·`typography.body`는 **CSS font-family 문법** 그대로 작성한다:

```json
"display": "\"IBM Plex Sans KR\", sans-serif",
"body": "\"Noto Sans KR\", sans-serif"
```

스크립트는 첫 따옴표 안 family를 추출해 CDN `<link>`를 생성한다. 매핑된 CDN 목록(스크립트 `FONT_CDN`):

| family | CDN |
|---|---|
| Pretendard | jsdelivr CDN |
| IBM Plex Sans KR | Google Fonts |
| Noto Sans KR | Google Fonts |
| Gothic A1 | Google Fonts |
| Gowun Dodum | Google Fonts |
| Gowun Batang | Google Fonts |
| Nanum Myeongjo | Google Fonts |
| Noto Serif KR | Google Fonts |
| Song Myung | Google Fonts |
| Diphylleia | Google Fonts |
| Black Han Sans | Google Fonts |
| Gasoek One | Google Fonts |
| Do Hyeon | Google Fonts |
| Jua | Google Fonts |
| LINE Seed KR | jsdelivr CDN |

> **폰트는 `../../references/design/font-catalog.md`의 실존 폰트만 고른다.** 폰트명을 지어내지 않는다. 위 매핑에 없는 family는 Google Fonts best-effort로 로드되고 `[warn]`이 출력된다.

## 발산 3 방향 가이드

컨택트 시트는 **분위기가 열렸을 때**만 생성한다(분위기 고정이면 아래 "게이트 사용" 참조). 발산 시 3개 방향은 아래 아키타입을 **출발점**으로 하되, 디스커버리 Q4–6에서 확인한 제품 무드로 구체화한다.

### 3 아키타입

**방향 A — 안전한 라이트 SaaS형**
- 출발 모드: `brand-kit-image.md §4` "라이트 클린/SaaS"
- 무드: 신뢰 · 명료 · 접근 가능
- 팔레트 특성: warm white / mist 배경, 채도 있는 single 액센트(teal / green / blue 계열), soft rounded 카드
- 타이포 특성: 저대비 geometric sans(예: IBM Plex Sans KR, Noto Sans KR), 깔끔한 그리드

**방향 B — 프리미엄 에디토리얼형**
- 출발 모드: "라이트 에디토리얼/컴플라이언스" 또는 "럭셔리/뷰티/패션"
- 무드: 성숙 · 고급 · 취향
- 팔레트 특성: ivory / stone 배경, 절제된 액센트, 큰 네거티브 스페이스
- 타이포 특성: 세리프 워드마크(예: Nanum Myeongjo, Gowun Batang, Noto Serif KR), 종이 그레인 느낌

**방향 C — 대담한 실험형**
- 출발 모드: "컬처럴/실험적" 또는 "다크 디벨로퍼/빌더"
- 무드: 기억성 · 자신감 (통제된 범위 안에서)
- 팔레트 특성: 볼드 액센트, near-black 패널 또는 하프톤/CRT 텍스처
- 타이포 특성: 강한 위계, 예상 밖 크롭(예: Black Han Sans, Gothic A1, Gasoek One)

### 발산 원칙

- **셋은 "같은 브랜드의 세 해석"이 아니다** — 성격·팔레트·타이포·보이스·UI가 모두 방향별로 다른, **서로 또렷이 다른 세 후보**다.
- **공유하는 것**: 같은 제품 사실(§1 제품명·타깃·문제)과 디스커버리 Q6 회피 제약만 공유한다.
- **거부된 방향 대체**: 디스커버리에서 명시적으로 거부된 방향(예: "절대 다크 X")은 그 방향만 `§4`의 다른 모드로 대체한다. 단, 셋이 서로 충분히 달라야 한다는 원칙은 유지.
- **구체화**: 아키타입은 출발점이다. 실제 방향은 Q4(브랜드 키워드)·Q5(분위기 레퍼런스)·Q6(회피 패턴)으로 구체화한다 — 제품이 "신뢰·정밀" 무드라면 A가 teal SaaS보다 navy/precision으로 기울 수 있고, C가 CRT보다 엔지니어링 그리드로 기울 수 있다.

## 생성 명령

```bash
node "<이 스킬 디렉터리>/scripts/build-contact-sheet.mjs" \
  --in "<cwd>/.design/candidate/brand-kit/directions.json" \
  --out "<cwd>/.design/view/directions.html"
```

**인자**:
- `--in` : `directions.json` 절대경로
- `--out` : 출력 `directions.html` 절대경로 (디렉터리 `view/`는 미리 존재해야 함)

**성공 출력** (stdout):
```
컨택트 시트 생성: <출력 경로>
```

**오류 종료코드**: 2 (JSON 파싱 실패 / 필드 누락 / 인자 오류). 오류 메시지는 stderr로 출력.

> 스킬 디렉터리는 `SKILL.md`가 위치한 폴더다. Claude에서는 보통 `~/.claude/plugins/personal/design-brand-kit/` 또는 플러그인 레포의 `skills/design-brand-kit/`이다.

## 게이트 사용

컨택트 시트는 **발산 → 방향 선택**을 위한 시각 승인 게이트다.

1. `candidate/brand-kit/directions.json`을 작성하고 위 명령으로 `view/directions.html` 생성.
2. `view/directions.html`을 사용자에게 제시 (브라우저로 열거나 파일 경로 안내).
3. 사용자가 열 하나(방향 A / B / C)를 선택.
4. 선택된 방향만 캐노니컬 홈(루트 `BRAND_KIT.md`·`brand-tokens.json`·`view/overview.html`)에 전개 (SKILL.md 흐름 4 참조 — BRAND_KIT 작성 → overview.html 저작 → 이미지 자산 생성).
5. 안 고른 두 방향은 `candidate/brand-kit/directions.json`·`view/directions.html`에 기록으로 남는다(별도 보관 폴더 없음).

**분위기 고정 시 건너뜀**: 디스커버리에서 분위기가 명시적으로 확정된 경우(Q4–6에서 단일 방향으로 수렴된 경우), 컨택트 시트 단계 자체를 건너뛴다. `directions.json`·`directions.html`은 생성하지 않으며 곧바로 단일 방향 풀 킷 작성으로 진행한다.
