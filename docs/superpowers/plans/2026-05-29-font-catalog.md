# 폰트 카탈로그 공유 reference Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모델이 지어내는 가짜 폰트명을 차단하기 위해, 실존·한글지원·검증가능한 큐레이션 폰트 카탈로그(공유 reference)를 만들고 `design-brand-kit`에 배선한다.

**Architecture:** 새 공유 ref `skills/references/design/font-catalog.md`(스킬 아님 — `SKILL.md` 없음)를 `logo-art-direction.md`·`icon-art-direction.md`와 형제로 둔다. `design-brand-kit`이 §8 타이포 선택 시 이 카탈로그에서만 고르고, specimen URL로 사용자가 확인하며, 실제 font-family+폴백을 토큰에 박는다. gpt-image는 폰트 파일을 로드하지 않으므로 카탈로그는 "실존 검증(메타데이터)" + "시각 성격 묘사(큐레이션)" 두 층으로 구성한다.

**Tech Stack:** Markdown reference 파일, Node sync 스크립트(`npm run sync`), Google Fonts 메타데이터/specimen URL(WebFetch 검증), `node --test`.

> **Git 주의:** 이 repo의 CLAUDE.md상 모든 git 커밋·`npm run sync` 같은 명령 실행은 **실행 전 사용자 확인**을 받는다. 아래 커밋/실행 스텝은 그 확인을 거쳐 수행한다. 커밋 메시지는 repo 관례(`docs(scope): 한국어 설명`)를 따른다.

> **테스트 성격:** 이 작업은 코드가 아니라 문서(ref + 스킬 md)다. 단위 테스트 대신 **검증 게이트**(URL 실존 확인 · 깨진-링크 확인 · 번들 확인 · 기존 `npm test` 회귀)가 그 역할을 한다. 환각 차단이 스펙의 핵심이라 **URL 실존 확인이 곧 "테스트"**다.

**관련 스펙:** `docs/superpowers/specs/2026-05-29-font-catalog-design.md`

---

## File Structure

| 파일 | 역할 | 동작 |
|---|---|---|
| `skills/references/design/font-catalog.md` | 폰트 카탈로그 (실존 검증 + 큐레이션) | **신규** |
| `skills/design-brand-kit/SKILL.md` | §8 타이포 절차 + 토큰 슬롯 의미 배선 | 수정 |
| `skills/design-brand-kit/references/brand-kit-image.md` | 보드 §8 프롬프트가 타입 스타일 묘사 + 카탈로그 참조 | 수정 |
| `skills/design-html-prototype/SKILL.md` | (선택) 토큰 폰트를 카탈로그 URL로 웹폰트 로드 | 수정 (선택) |
| `plugins/personal/skills/references/design/font-catalog.md` | Codex 번들 사본 | `npm run sync` 자동 생성 (gitignore, 커밋 안 함) |

상대경로(검증 대상):
- `design-brand-kit/SKILL.md` → `../references/design/font-catalog.md`
- `design-brand-kit/references/brand-kit-image.md` → `../../references/design/font-catalog.md`
- `design-html-prototype/SKILL.md` → `../references/design/font-catalog.md`

---

## Task 1: 후보 폰트 실존 검증 (환각 차단 게이트)

**Files:**
- 산출물 없음(작업용 검증) — 검증된 목록을 Task 2에서 카탈로그로 옮긴다.

이 Task의 목적은 **카탈로그에 들어갈 모든 폰트명이 실제로 존재하고 한글을 지원하는지** 확정하는 것이다. 아래 시드 목록은 후보일 뿐 — 각 항목의 URL을 WebFetch로 열어 (1) 해석되는지 (2) 한글(Korean) 지원/한글 글리프가 있는지 확인하고, **해석 안 되거나 한글 미지원이면 드롭**한다. 이 게이트를 통과한 것만 카탈로그에 넣는다.

- [ ] **Step 1: 무료/오픈소스(Google Fonts) 후보 specimen URL 검증**

각 URL을 WebFetch로 열어 폰트가 실존하고 한글을 지원하는지 확인한다. (Google Fonts specimen 페이지는 한글 지원 시 "Korean" 또는 한글 샘플을 표시한다.)

| 폰트 | 역할 | 성격(시드) | URL |
|---|---|---|---|
| Noto Sans KR | body/heading | 중립적 grotesque, 넓은 weight | https://fonts.google.com/specimen/Noto+Sans+KR |
| IBM Plex Sans KR | body/heading | 약간 공학적·정밀 | https://fonts.google.com/specimen/IBM+Plex+Sans+KR |
| Gothic A1 | body/heading | 깔끔한 grotesque | https://fonts.google.com/specimen/Gothic+A1 |
| Gowun Dodum | body | 부드러운 휴머니스트 | https://fonts.google.com/specimen/Gowun+Dodum |
| Nanum Gothic | body | 표준적·읽기 편한 | https://fonts.google.com/specimen/Nanum+Gothic |
| Black Han Sans | display | 초굵은 임팩트 display | https://fonts.google.com/specimen/Black+Han+Sans |
| Do Hyeon | display | 굵은 라운드 display | https://fonts.google.com/specimen/Do+Hyeon |
| Jua | display | 친근한 라운드 | https://fonts.google.com/specimen/Jua |
| Gasoek One | display | 팻 임팩트 display | https://fonts.google.com/specimen/Gasoek+One |
| Noto Serif KR | serif/editorial | 중립적 명조 | https://fonts.google.com/specimen/Noto+Serif+KR |
| Nanum Myeongjo | serif/editorial | 전통 명조 | https://fonts.google.com/specimen/Nanum+Myeongjo |
| Gowun Batang | serif | 부드러운 바탕 | https://fonts.google.com/specimen/Gowun+Batang |
| Song Myung | serif/display | 얇고 우아한 명조 | https://fonts.google.com/specimen/Song+Myung |
| Hahmlet | serif | 현대적 고대비 세리프 | https://fonts.google.com/specimen/Hahmlet |
| Nanum Gothic Coding | mono | 한글 지원 고정폭 | https://fonts.google.com/specimen/Nanum+Gothic+Coding |

Expected: 각 URL이 200으로 열리고 specimen에 한글 글리프/Korean 표시. **열리지 않거나 한글 미지원이면 그 행을 드롭하고 메모.**

- [ ] **Step 2: GF 밖 오픈소스 후보 검증**

| 폰트 | 역할 | 성격 | 출처 URL |
|---|---|---|---|
| Pretendard | body/heading | 현대 중립 UI sans (한국 제품 사실상 표준) | https://github.com/orioncactus/pretendard |
| Spoqa Han Sans Neo | body/UI | 깔끔한 기하 UI sans | https://spoqa.github.io/spoqa-han-sans/ |
| SUIT | heading/UI | 기하학적 모던 sans | https://github.com/sun-typeface/SUIT |
| LINE Seed KR | display/UI | 둥글고 친근한 브랜드 sans | https://seed.line.me/index_kr.html |
| Gmarket Sans | display | 굵고 커머셜한 브랜드 display | https://corp.gmarket.com/fonts/ |

Expected: 각 출처가 열리고 OFL/무료 라이선스 + 한글 지원 확인. 라이선스가 "무료지만 커스텀"이면 그 사실을 메모(예: Gmarket Sans). 안 열리면 드롭.

- [ ] **Step 3: 상용(소수) 후보 검증**

상용은 공개 API가 없어 카탈로그 목록이 곧 진실 원본이다. **소수만** 두고 파운드리 URL을 WebFetch로 확인한다. 불확실하면 넣지 않는다.

| 폰트 | 역할 | 성격 | 출처/메모 |
|---|---|---|---|
| Apple SD Gothic Neo | body (system) | 애플 시스템 한글 sans | macOS/iOS 번들 — 별도 구매 아님, **폴백 스택용 system 폰트**로 표기 |
| Sandoll 고딕Neo | body/heading | 산돌 상용 고딕 | https://www.sandollcloud.com/ (URL·정확 제품명 WebFetch 확인) |

Expected: Apple SD Gothic Neo는 system 폴백으로만 표기. Sandoll 제품 페이지가 열리고 정확 제품명 확인되면 1개만 포함, 아니면 상용 섹션을 비우고 "GF 브라우즈/파운드리에서 직접" 안내만 둔다.

- [ ] **Step 4: 검증 결과 정리**

검증 통과한 폰트만 추려 Task 2에서 쓸 최종 목록을 만든다. 각 항목에 대해 확정: 실제 font-family 문자열 · 역할 · 성격 한 줄 · 한글 Y · 라이선스 · 출처 URL · 폴백 스택. (커밋 없음 — Task 2에서 함께 커밋.)

---

## Task 2: `font-catalog.md` 작성

**Files:**
- Create: `skills/references/design/font-catalog.md`

- [ ] **Step 1: 카탈로그 파일 작성**

Task 1에서 검증된 폰트만 사용. 아래 구조로 작성한다(섹션 제목 고정, 항목은 검증 결과로 채움):

````markdown
# 폰트 카탈로그 (Font Catalog)

브랜드 킷·페이지 이미지의 타이포그래피를 정할 때 읽는 **실존 폰트 카탈로그**다. 도구 중립 — `design-brand-kit §8`이 직접 읽고, 그 결과(토큰)를 `design-html-prototype`·`design-md-compiler`가 소비한다.

## 왜 이 파일이 있나
모델이 폰트명을 지어내면(환각) 토큰에 가짜 font-family가 박혀 구현이 깨진다. **폰트는 반드시 이 카탈로그에서만 고른다.** 더 보고 싶으면 전체 한글 폰트 목록: https://fonts.google.com/?subset=korean

## 이미지 생성기 전제 (중요)
gpt-image는 **폰트 파일을 로드하지 않는다.** "Pretendard"라고 적어도 그 글리프를 그대로 렌더하지 않고 *타입 스타일*만 근사한다. 그래서:
- 보드 이미지의 폰트명은 **문서용 라벨**이고, 이미지 프롬프트엔 폰트명보다 **성격(아래 한 줄 묘사)**을 적어야 근사가 맞는다.
- 폰트가 **실제 쓰이는 곳은 토큰 다운스트림**(웹폰트 로드)이다 — 거기서 실존·로드 가능 여부가 기능적으로 중요.

## 두 층 원칙
- **검증 백본(기계)**: 이름·한글·라이선스는 Google Fonts 메타데이터/파운드리 출처로 실존 확인됨 → 환각 차단.
- **큐레이션(사람)**: 성격 한 줄·역할·폴백·페어링 — 메타데이터에 없어 사람이 채움. 선택·프롬프트 묘사에 쓰임.
- **specimen URL(눈)**: 사용자가 클릭해 실제 모양 보고 확정(브랜드킷 승인 게이트).

## 선택 가이드 (폰트 모를 때)
- body/UI → 중립 sans (Pretendard·Noto Sans KR·IBM Plex Sans KR …)
- heading/display → 임팩트/성격 있는 display 또는 sans bold
- editorial/serif 무드 → 명조/세리프 (Noto Serif KR·Nanum Myeongjo …)
- mono/데이터 → 고정폭 (숫자는 라틴 모노 + 한글 sans 폴백 허용)
- 보통 **display+body 2개 페어**면 충분. 과하게 섞지 않는다.

## Sans (body / heading / UI)
각 항목: **폰트명** — 역할 · 성격 한 줄 · 한글 Y · 라이선스 · specimen/출처 URL · 폴백 스택.
(Task 1 검증 통과 항목으로 채운다. 예시 형식:)
- **Pretendard** — body/heading · 현대 중립 UI sans · 한글 Y · OFL · https://github.com/orioncactus/pretendard · `Pretendard, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
- **Noto Sans KR** — body/heading · 중립 grotesque, 넓은 weight · 한글 Y · OFL · https://fonts.google.com/specimen/Noto+Sans+KR · `"Noto Sans KR", sans-serif`
  …(검증된 나머지 sans)

## Display (heading / 임팩트)
- **Black Han Sans** — display · 초굵은 임팩트 · 한글 Y · OFL · https://fonts.google.com/specimen/Black+Han+Sans · `"Black Han Sans", sans-serif`
  …(검증된 나머지 display)

## Serif / 명조 (editorial)
- **Noto Serif KR** — serif · 중립 명조 · 한글 Y · OFL · https://fonts.google.com/specimen/Noto+Serif+KR · `"Noto Serif KR", serif`
  …(검증된 나머지 serif)

## Mono / 데이터
- **Nanum Gothic Coding** — mono · 한글 지원 고정폭 · 한글 Y · OFL · https://fonts.google.com/specimen/Nanum+Gothic+Coding · `"Nanum Gothic Coding", monospace`
- (숫자/데이터는 라틴 모노 + 한글 sans 폴백 허용 — 예: `"IBM Plex Mono", "Noto Sans KR", monospace`)

## 상용 (소수 · 라이선스 주의)
공개 API 없음 — 아래는 출처에서 확인된 소수. **구현 시 라이선스·폴백 필요.**
- (Task 1에서 확인된 것만; Apple SD Gothic Neo는 system 폴백으로만)

## 추천 페어링
- 모던 SaaS: Pretendard(body) + Pretendard Bold/SUIT(heading)
- 에디토리얼/프리미엄: Noto Serif KR(heading) + Noto Sans KR(body)
- 임팩트/대담: Black Han Sans(display) + Noto Sans KR(body)
  …(검증된 폰트 내에서)
````

Expected: 모든 항목이 Task 1 검증을 통과한 실존 폰트. 미검증 폰트 없음.

- [ ] **Step 2: 깨진 항목 자가 확인**

작성한 카탈로그를 다시 읽으며 모든 URL이 Task 1 검증 목록에 있는지, 폴백 스택 문자열에 오타가 없는지 확인한다.

- [ ] **Step 3: Commit**

```bash
git add skills/references/design/font-catalog.md docs/superpowers/specs/2026-05-29-font-catalog-design.md docs/superpowers/plans/2026-05-29-font-catalog.md
git commit -m "docs(design): 실존 폰트 큐레이션 카탈로그 추가"
```
(스펙·플랜이 아직 미커밋이면 함께 커밋. git은 실행 전 사용자 확인.)

---

## Task 3: `design-brand-kit/SKILL.md` 배선

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: §8 타이포그래피 템플릿에 카탈로그 제약 추가**

현재 `## 8. 타이포그래피 (Typography)` 블록(118–125행)은 "…용 폰트 방향:" 항목들로 끝난다. 이 블록 **바로 아래**에 다음 한 줄을 추가한다:

```md
> 폰트는 `../references/design/font-catalog.md`에서만 고른다 — 각 역할에 실존 폰트명 + CSS 폴백 스택을 적고, 후보 2~3개는 specimen URL과 함께 사용자에게 제시한다. 모델이 폰트명을 지어내지 않는다.
```

- [ ] **Step 2: `brand-tokens.json` 슬롯 의미 명시**

현재 `## brand-tokens.json 구조` 블록의 `"typography"` 줄(170행)은 빈 슬롯이다. 코드블록 바로 아래에 다음 한 줄을 추가한다:

```md
> `typography`의 각 값은 **카탈로그에서 고른 실존 font-family + 폴백 스택**이다 (예: `"body": "Pretendard, -apple-system, \"Apple SD Gothic Neo\", sans-serif"`). 폰트명만 단독으로 두지 않는다.
```

- [ ] **Step 3: 흐름 1단계에 카탈로그 참조 추가**

현재 `## 흐름 (디자이너 협업 루프)` 1번(269행)은 `BRAND_KIT.md`·`brand-tokens.json` 작성을 말한다. 그 문장 끝에 다음을 덧붙인다:

```md
(§8 타이포는 `../references/design/font-catalog.md`에서 실존 폰트를 골라 토큰에 실제 family+폴백을 박고, 승인 게이트에서 specimen URL로 확인받는다.)
```

- [ ] **Step 4: 금지 사항에 환각 금지 추가**

현재 `## 금지 사항` 목록(229–231행) 끝에 한 줄 추가:

```md
- 카탈로그에 없는/실존하지 않는 폰트명을 지어내지 않는다 — 폰트는 `../references/design/font-catalog.md`에서만.
```

- [ ] **Step 5: Commit**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "docs(brand-kit): 타이포 선택을 폰트 카탈로그로 제약"
```

---

## Task 4: `brand-kit-image.md` 배선

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

- [ ] **Step 1: §6 텍스트 규칙에 폰트 출처 한 줄 추가**

현재 §6 끝의 권위 원본 인용구(135행, "권위 원본은 이미지가 아니라 …") 바로 아래에 추가:

```md
> **폰트는 `../../references/design/font-catalog.md`의 실존 폰트만.** 보드 §8엔 실제 폰트명을 라벨로 적되, 이미지 프롬프트엔 폰트명이 아니라 **타입 스타일**(카탈로그의 성격 한 줄: 예 "low-contrast geometric sans")을 묘사한다 — gpt-image는 폰트 파일을 로드하지 않고 스타일만 근사하므로.
```

- [ ] **Step 2: §12 프롬프트 템플릿 Typography 줄 보강**

현재 §12 템플릿의 `8. Typography (type scale: ...)` 줄(189행)과 `Typography: readable, organized, ...` 줄(199행)은 폰트 스타일 묘사가 없다. 199행 `Typography:` 줄을 다음으로 교체한다:

```text
Typography: readable, organized, high hierarchy; render labels/HEX/type-scale legibly; for each typeface show its name as a label AND render text in its described style (e.g. "geometric low-contrast sans", "high-contrast modern serif") per the font catalog — the model approximates the style, not a literal font file; no tiny fake body text, no lorem ipsum.
```

- [ ] **Step 3: §11 우리 파이프라인 연결의 폰트 권위 줄 보강**

현재 §11 "권위" 줄(161행, "색 HEX·폰트 스펙·문구의 정답은 md/tokens.")에 다음을 덧붙인다:

```md
폰트 스펙의 실존 출처는 `../../references/design/font-catalog.md`이며, 토큰의 font-family는 거기서 고른 실존값이다.
```

- [ ] **Step 4: Commit**

```bash
git add skills/design-brand-kit/references/brand-kit-image.md
git commit -m "docs(brand-kit): 보드 타이포 프롬프트가 카탈로그 스타일 묘사를 쓰도록"
```

---

## Task 5 (선택): `design-html-prototype/SKILL.md` 웹폰트 로드

> **선택 Task.** 스펙 핵심(환각 차단)은 Task 1–4로 끝난다. 이 Task는 고른 폰트가 프로토타입에서 **실제로 렌더**되게 하는 부가가치다. 범위에서 빼도 무방 — 넣을지 실행 전 확인.

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 현재 폰트 처리 확인**

Read로 `skills/design-html-prototype/SKILL.md`를 열어 토큰 `typography`를 어떻게 쓰는지·웹폰트 로드 지시가 있는지 확인한다. (현재 폰트 관련 지시 없음으로 파악됨 — 실행 시 재확인.)

- [ ] **Step 2: 웹폰트 로드 지시 추가**

토큰을 CSS에 반영하는 절차 근처에 다음 취지의 한 줄을 추가한다(현재 문구에 맞게 위치 조정):

```md
- `brand-tokens.json`의 폰트가 카탈로그(`../references/design/font-catalog.md`)의 웹폰트면 그 출처에서 `@import`/`<link>`로 로드한다 (Google Fonts는 `<link>`, Pretendard 등은 jsDelivr/CDN). 그래야 고른 폰트가 프로토타입에서 실제로 렌더된다. 상용/system 폰트는 폴백 스택에 의존.
```

- [ ] **Step 3: Commit**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "docs(html-prototype): 카탈로그 웹폰트를 프로토타입에서 로드"
```

---

## Task 6: 동기화 + 검증

**Files:**
- 변경 없음(생성물 재생성·검증).

- [ ] **Step 1: 깨진-링크 확인**

Task 2–5에서 추가한 상대경로가 실제 파일을 가리키는지 확인한다:
- `skills/design-brand-kit/SKILL.md`의 `../references/design/font-catalog.md` → `skills/references/design/font-catalog.md` 존재?
- `skills/design-brand-kit/references/brand-kit-image.md`의 `../../references/design/font-catalog.md` → 같은 파일 존재?
- (Task 5 했으면) `skills/design-html-prototype/SKILL.md`의 `../references/design/font-catalog.md` → 같은 파일 존재?

Run(검증): 위 세 경로를 Read 또는 `node -e "console.log(require('fs').existsSync('skills/references/design/font-catalog.md'))"`
Expected: `true`, 세 참조 모두 동일 실파일 지시.

- [ ] **Step 2: `npm run sync` (실행 전 사용자 확인)**

Run: `npm run sync`
Expected: 에러 없이 완료. Codex 번들 `plugins/personal/skills/references/design/font-catalog.md` 생성됨.

- [ ] **Step 3: 번들 포함 확인**

Run(검증): `node -e "console.log(require('fs').existsSync('plugins/personal/skills/references/design/font-catalog.md'))"`
Expected: `true`

- [ ] **Step 4: 기존 테스트 회귀 확인**

Run: `npm test`
Expected: 전체 PASS. (`tests/`는 임시 디렉터리 기반 hermetic 테스트라 새 ref 파일에 영향받지 않음.)

- [ ] **Step 5: (선택) 실효 검증**

가짜 테스트 브랜드 하나로 `design-brand-kit §8` 타이포 선택 흐름을 돌려, 후보가 카탈로그 실존 폰트 + specimen URL로 제시되고 토큰에 실제 family+폴백이 박히는지 확인한다. (이미지 생성 비용 없이 §8 텍스트 단계만으로 확인 가능.)

- [ ] **Step 6: Commit (생성된 커밋 대상물만)**

`npm run sync`는 `mcp.servers.json`·`agents/`를 안 건드렸으면 커밋 대상 생성물(`.claude-plugin/mcp.json` 등)을 바꾸지 않는다. Codex 번들(`plugins/personal/`)은 gitignore라 커밋하지 않는다. `git status`로 변경 생성물이 있으면만 커밋:

```bash
git status
# (변경된 커밋 대상 생성물이 있으면)
git add <변경된 생성물>
git commit -m "chore: sync 재생성물 반영"
```

---

## Self-Review (작성자 체크 — 완료)

**1. Spec coverage:**
- 스펙 §4 결정(공유 ref·위치·범위·한글·하이브리드·가이드) → Task 2 카탈로그 구조에 반영.
- §5 두 층 원칙 → 카탈로그 본문 + Task 1 검증 게이트.
- §6 소싱(GF 메타·specimen·상용 소수) → Task 1 Step 1–3.
- §8 배선(brand-kit SKILL·brand-kit-image·선택 html-prototype) → Task 3·4·5.
- §10 동기화 → Task 6.
- §11 검증(실존·깨진링크·번들·실효) → Task 6 Step 1–5.
- §12 리스크(테스트 영향) → hermetic 확인(Task 6 Step 4)으로 해소.

**2. Placeholder scan:** 카탈로그 항목은 "Task 1 검증 통과분으로 채움"으로 명시 — 추측 폰트 박제 금지. 시드 목록은 검증 후보로 제시(드롭 가능). 통과.

**3. Type consistency:** 상대경로 3종이 Task 3/4/5와 Task 6 검증에서 동일 문자열 사용. 폴백 스택 예시 일관. 통과.
