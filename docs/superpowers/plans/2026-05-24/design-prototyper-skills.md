# Design Prototyper 스킬 세트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **추가 필수 서브스킬:** 각 SKILL.md 저작 시 `superpowers:writing-skills`를 사용한다 (플러그인 `AGENTS.md` 규약). 이 계획은 각 스킬의 목표 본문을 그대로 담고 있으니, writing-skills로 description 품질·토큰 효율·서술 군더더기 제거를 점검하며 저작한다.

**Goal:** Codex GPT Image 2.0 기반으로 "제품 설명 → 브랜드 킷(+무드보드) → 페이지 섹션 이미지 브리프 → DESIGN.md → HTML 프로토타입"을 단계별 리뷰 게이트로 잇는 4개 에이전트-중립 스킬을 만든다.

**Architecture:** 오케스트레이터 없이 4개 독립 스킬을 사람이 순서대로 호출한다. 스킬은 이미지를 생성하지 않고 **이미지 브리프(계약)** 만 만들며, 실제 PNG는 Codex 내장 생성 또는 수동 드롭으로 채워진다(pluggable). 다운스트림 스킬은 생성 방식과 무관하게 폴더의 PNG만 소비한다. 모든 산출물은 대상 프로젝트 cwd 기준 — 중간물은 숨김 `.design/`, 최종 `DESIGN.md`·`prototype/`은 루트.

**Tech Stack:** 마크다운 `SKILL.md`(프론트매터 공통 키 `name`·`description`만). 실행 스크립트·테스트 코드·MCP 항목 없음(스펙 5·9절). 검증은 구조 체크리스트 + description 트리거 + Claude/Codex 양쪽 로컬 테스트.

**기준 스펙:** `docs/superpowers/specs/2026-05-24/design-prototyper-skills-design.md`

---

## File Structure

생성할 파일 (전부 신규, 각 스킬 1책임):

- `skills/design-brand-kit/SKILL.md` — 브랜드 킷 텍스트·토큰·무드보드 브리프 생성 + 시각 검증 게이트.
- `skills/design-page-image/SKILL.md` — 페이지 섹션별 이미지 브리프 생성 + 시안 리뷰 게이트.
- `skills/design-md-compiler/SKILL.md` — 산출물을 구현 계약 `DESIGN.md`로 변환 + 리뷰 게이트.
- `skills/design-html-prototype/SKILL.md` — `DESIGN.md` 기반 단일 HTML 프로토타입 + 브라우저 확인 반복.

수정할 파일: 없음. 스크립트/테스트 디렉터리: 없음(스펙 5·9절 — 모든 단계가 모델의 파일 생성으로 수행됨).

공통 규약(모든 스킬):
- 프론트매터는 `name`, `description`만.
- 출력 경로는 cwd 기준 상대경로(`.design/…`, `DESIGN.md`, `prototype/…`).
- 본문은 Claude 도구명 기준 + 형식 인자 문법 비의존(자연어 호출).
- 각 스킬 끝에 "산출물 제시 → 리뷰/반복 대기 → 다음 스텝 안내" 게이트.

---

## Task 1: design-brand-kit 스킬

**Files:**
- Create: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: writing-skills 서브스킬 시작**

`superpowers:writing-skills`를 호출하고, 이 스킬은 마크다운 지시문(SKILL.md)이며 아래 목표 본문을 저작 기준으로 삼는다고 선언한다. writing-skills의 description-품질·토큰효율·서술군더더기 점검을 이 파일에 적용한다.

- [ ] **Step 2: SKILL.md 작성 (아래 전체 내용 그대로)**

`skills/design-brand-kit/SKILL.md`:

````md
---
name: design-brand-kit
description: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포그래피·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷과, 그 방향을 눈으로 검증할 무드보드 이미지 브리프를 만들 때 사용한다.
---

# Design Brand Kit

당신은 제품의 브랜드 정체성을 빠르게 구조화하는 브랜드 전략가다.

## 목적

제품 설명만 보고 바로 화면을 만들지 않는다. 먼저 브랜드의 성격·시각 방향·색상·타이포그래피·로고 방향·UI 분위기를 정리하고, 그 방향을 눈으로 검증할 무드보드 이미지 브리프를 만든다.

## 입력

가능하면 다음을 확인한다. 부족하면 합리적 기본값으로 채우되, 추측한 항목은 명시한다.

- 제품명 / 분야 / 타깃 사용자 / 핵심 문제 / 핵심 가치 제안
- 원하는 분위기 / 피하고 싶은 분위기
- 기존 색상·로고 여부 / 경쟁 제품·참고 스타일

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- `.design/image-briefs/brand-briefs.md` (무드보드 이미지 브리프)

## BRAND_KIT.md 구조

```md
# BRAND_KIT.md

## 1. 제품 요약
- 제품명:
- 한 줄 설명:
- 타깃 사용자:
- 핵심 가치:
- 사용 맥락:

## 2. 브랜드 성격
- 브랜드 키워드:
- 말투:
- 신뢰감 수준:
- 기술적 인상:
- 감성적 인상:

## 3. 시각 방향
- 전체 분위기:
- 레이아웃 성향:
- 이미지/일러스트 성향:
- 아이콘 스타일:
- 피해야 할 시각 요소:

## 4. 로고 방향
- 워드마크 방향:
- 심볼 방향:
- 모노그램 방향:
- 앱 아이콘 방향:
- 금지 요소:

## 5. 색상 팔레트
- Primary:
- Accent:
- Background:
- Surface:
- Text:
- Muted text:
- Border:
- Success:
- Warning:
- Danger:

## 6. 타이포그래피
- 제목용 폰트 방향:
- 본문용 폰트 방향:
- 숫자/데이터용 폰트 방향:
- 한글 사용 시 주의점:

## 7. UI 분위기
- 버튼:
- 카드:
- 입력창:
- 테이블:
- 대시보드:
- 알림/상태 표현:

## 8. 금지 패턴
- 사용하지 않을 색상:
- 사용하지 않을 레이아웃:
- 사용하지 않을 클리셰:
- 사용하지 않을 이미지:
```

## brand-tokens.json 구조

```json
{
  "color": {
    "primary": "", "accent": "", "background": "", "surface": "",
    "surfaceAlt": "", "text": "", "textMuted": "", "border": "",
    "success": "", "warning": "", "danger": ""
  },
  "typography": { "display": "", "heading": "", "body": "", "mono": "" },
  "radius": { "sm": "6px", "md": "10px", "lg": "16px", "xl": "24px" },
  "shadow": { "sm": "", "md": "", "lg": "" },
  "spacing": { "sectionY": "", "containerX": "", "cardPadding": "" }
}
```

## brand-briefs.md 구조 (무드보드)

```md
# Brand Moodboard Briefs

## 공통 방향
- 브랜드 키워드:
- 무드보드 목적: 색상·타이포·질감·전체 분위기를 한눈에 검증
- 금지 패턴:

## Moodboard 1 — 추천안
### 분위기 / 키워드
### 색상 사용 (HEX 기반)
### 질감 / 형태 언어
### 이미지 생성 Prompt
### Negative Prompt

## Moodboard 2 — 대안 방향
(같은 항목)
```

## 품질 기준

- 색상은 감성어가 아니라 실제 HEX 값으로 제안한다.
- 보안 / B2B / SaaS 제품이라고 해서 무조건 파란색·보라색·네온을 쓰지 않는다.
- 로고 방향은 "고급스럽게" 같은 말로 끝내지 않고 형태 언어를 설명한다.
- 최소 3가지 시각 루트를 제안한다: ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형. 그중 최종 추천안 하나를 고른다.

## 금지 사항

- 의미 없는 AI glow·사이버 네온·해커 후드티·매트릭스 배경을 기본값으로 쓰지 않는다.
- 보안 제품이라고 방패·자물쇠·클라우드 아이콘만 반복하지 않는다.
- 색상 이름만 쓰고 실제 값을 쓰지 않는 것을 금지한다.

## 흐름 (리뷰 게이트)

1. `.design/BRAND_KIT.md` + `.design/brand-tokens.json` 작성.
2. `.design/image-briefs/brand-briefs.md`(무드보드 브리프) 작성.
3. **이미지 채우기 (pluggable)**: Codex면 내장 gpt-image로 브리프를 읽어 `.design/generated/brand-kit/`에 PNG 생성. 그 외(예: Claude)면 사람이 외부 도구로 만든 PNG를 같은 폴더에 드롭.
4. 사람이 무드보드를 보고 브랜드 방향을 시각으로 검증한다.
5. 마음에 안 들면 2~4단계를 반복. 좋으면 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

이미지를 직접 생성하지 않는다 — 이 스킬의 계약은 브리프 작성과 산출물 안내까지다.
````

- [ ] **Step 3: 구조 검증 (스펙 6.1 체크리스트)**

확인: 프론트매터는 `name`·`description`만 / 출력 3종 경로가 `.design/` 기준 / BRAND_KIT.md 8섹션 / brand-tokens.json 5그룹 / brand-briefs.md 무드보드 / 품질·금지 규칙 포함 / 흐름 5단계 게이트 + pluggable 생성 표현 / 끝에 다음 스텝 안내(`design-page-image`).

- [ ] **Step 4: description 트리거 검증**

description을 소리 내어 읽고 "언제 발동하는가"가 명확한지 확인한다. 예상 발동: "이 제품 브랜드 잡아줘", "브랜드 킷 만들어줘", "무드보드 보고 방향 정하자". 모호하면 writing-skills 지침대로 description을 다듬는다.

- [ ] **Step 5: Commit**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(design): add design-brand-kit skill"
```

---

## Task 2: design-page-image 스킬

**Files:**
- Create: `skills/design-page-image/SKILL.md`

- [ ] **Step 1: writing-skills 서브스킬 시작**

`superpowers:writing-skills`로 이 파일 저작을 시작한다.

- [ ] **Step 2: SKILL.md 작성 (아래 전체 내용 그대로)**

`skills/design-page-image/SKILL.md`:

````md
---
name: design-page-image
description: 브랜드 킷을 바탕으로 랜딩 페이지·대시보드·앱 화면의 섹션별 디자인 이미지 브리프를 만들 때 사용한다.
---

# Design Page Image

당신은 페이지 디자인 이미지 레퍼런스를 기획하는 프론트엔드 아트 디렉터다.

## 목적

하나의 긴 전체 페이지 이미지를 만들지 않는다. 각 섹션별로 별도의 이미지 브리프를 작성하여, 나중에 구현 모델이 레이아웃과 컴포넌트를 정확히 해석할 수 있게 한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- (있으면) `.design/generated/brand-kit/` 무드보드 이미지 참고

## 출력 파일

- `.design/image-briefs/page-briefs.md` (섹션당 브리프 1개)

## 핵심 규칙

- 섹션당 이미지 브리프 하나를 만든다.
- 전체 페이지를 하나의 긴 이미지로 합치지 않는다.
- 좌측 텍스트 / 우측 이미지 레이아웃을 반복하지 않는다.
- Hero 제목은 넓고 짧게(2~3줄) 유지한다.
- 의미 없는 glow·blob·가짜 대시보드 카드 남발을 피한다.
- 섹션마다 역할이 있어야 하고, 브랜드 일관성은 유지하되 구성은 달라야 한다.

## 기본 랜딩 페이지 섹션

요청이 없으면 다음 6개 섹션을 기본값으로 사용한다.

1. Navigation + Hero
2. Problem / Pain
3. Product Mechanism
4. Feature / Channel Grid
5. Dashboard / Evidence
6. CTA / Footer

## page-briefs.md 구조

```md
# Page Image Briefs

## 공통 디자인 방향
- 브랜드:
- 색상:
- 타이포그래피:
- 전체 리듬:
- 공통 컴포넌트:
- 금지 패턴:

## Section 1 — Navigation + Hero
### 섹션 목적
### 레이아웃 구성
### 시각 계층
### 컴포넌트 사용
### 이미지 / 일러스트 사용
### 이미지 생성 Prompt
### Negative Prompt
### 구현 메모

## Section 2 — Problem / Pain
(같은 8개 하위 항목 반복)

## Section 3 — Product Mechanism
## Section 4 — Feature / Channel Grid
## Section 5 — Dashboard / Evidence
## Section 6 — CTA / Footer
```

## Taste-adapted 규칙

- 일반적인 AI SaaS 느낌을 피한다.
- 보라/파랑 glow와 의미 없는 blob을 남발하지 않는다.
- Hero는 2~3줄 안에 들어오도록 넓은 폭과 적절한 글자 크기를 쓴다.
- 주요 섹션 간 여백을 충분히 둔다.
- cheap meta label을 피한다 (예: SECTION 01, QUESTION 05, ABOUT US).
- CTA 버튼은 배경과 충분한 대비를 가져야 한다.
- Bento grid를 쓸 경우 빈 공간이 생기지 않게 설계한다.
- 카드는 많이 만들기보다 3~5개의 의도적인 카드로 구성한다.
- 이미지 레퍼런스는 코드 구현이 가능할 정도로 명확해야 한다.

## 금지 사항

- 전체 페이지를 하나의 이미지로 압축하지 않는다.
- 모든 섹션을 같은 레이아웃으로 만들지 않는다.
- 텍스트가 너무 작거나 읽기 어려운 디자인을 만들지 않는다.
- UI를 이미지로만 구현해야 하는 구조로 만들지 않는다.

## 흐름 (리뷰 게이트)

1. `.design/image-briefs/page-briefs.md` 작성 (섹션당 브리프 1개).
2. **이미지 채우기 (pluggable)**: Codex면 내장 gpt-image로 각 섹션 이미지를 `.design/generated/page/`에 생성. 그 외면 사람이 같은 폴더에 PNG를 드롭.
3. 사람이 섹션 시안을 검토한다.
4. 마음에 안 들면 1~3단계를 반복. 좋으면 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-md-compiler`"**.

이미지를 직접 생성하지 않는다 — 이 스킬의 계약은 섹션 브리프 작성과 산출물 안내까지다.
````

- [ ] **Step 3: 구조 검증 (스펙 6.2 체크리스트)**

확인: 입력은 `.design/BRAND_KIT.md`·`brand-tokens.json` / 출력 `page-briefs.md` / 섹션당 브리프 1개 + 기본 6섹션 / 각 섹션 8개 하위 항목 / 핵심·taste·금지 규칙 포함 / 흐름 게이트가 `.design/generated/page/`에 pluggable 생성 / 끝에 다음 스텝 안내(`design-md-compiler`).

- [ ] **Step 4: description 트리거 검증**

예상 발동: "랜딩 페이지 이미지 브리프 만들어줘", "섹션별 디자인 시안 잡아줘". 명확한지 확인하고 필요하면 다듬는다.

- [ ] **Step 5: Commit**

```bash
git add skills/design-page-image/SKILL.md
git commit -m "feat(design): add design-page-image skill"
```

---

## Task 3: design-md-compiler 스킬

**Files:**
- Create: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: writing-skills 서브스킬 시작**

`superpowers:writing-skills`로 이 파일 저작을 시작한다.

- [ ] **Step 2: SKILL.md 작성 (아래 전체 내용 그대로)**

`skills/design-md-compiler/SKILL.md`:

````md
---
name: design-md-compiler
description: 브랜드 킷·페이지 이미지 브리프·생성 이미지 목록을 바탕으로 실제 구현자가 따를 수 있는 DESIGN.md를 만들 때 사용한다.
---

# Design MD Compiler

당신은 브랜드와 이미지 레퍼런스를 실제 구현 규칙으로 변환하는 디자인 시스템 정리자다.

## 목적

이미지 생성 결과와 브랜드 문서를 그대로 두지 않고, HTML/CSS/React 구현자가 따를 수 있는 `DESIGN.md`로 정리한다.

## 입력 파일 (있는 것만 읽는다, cwd 기준)

- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- `.design/image-briefs/brand-briefs.md`
- `.design/image-briefs/page-briefs.md`
- `.design/generated/**/*.png` (생성/드롭된 이미지)
- `.design/generated/manifest.json` (선택 — 있으면 캡션·순서·섹션 매핑 메타로 사용, 없으면 파일명 glob)

## 출력 파일

- `DESIGN.md` (대상 프로젝트 cwd 루트)

## DESIGN.md 구조

```md
# DESIGN.md

## 1. 제품 요약
- 제품명: / 대상 사용자: / 핵심 가치: / 화면 목적:

## 2. 브랜드 성격
- 키워드: / 말투: / 사용자가 느껴야 할 감정: / 피해야 할 인상:

## 3. 시각 방향
- 전체 분위기: / 레이아웃 원칙: / 이미지 사용 방식: / 아이콘·일러스트 방향:

## 4. 디자인 토큰
### Colors
### Typography
### Spacing
### Radius
### Shadow
### Border

## 5. 컴포넌트 규칙
### Button
### Input
### Card
### Badge
### Navigation
### Table
### Dashboard Panel
### Alert / Toast
### Empty State

## 6. 페이지 섹션 규칙
### Hero
### Problem
### Product Mechanism
### Feature Grid
### Dashboard / Evidence
### CTA / Footer

## 7. 이미지 에셋 사용 규칙
- 로고: / 배경: / 제품 목업: / UI kit reference: / 사용하지 말아야 할 방식:

## 8. 구현 제약
- HTML/CSS: / React 이식: / 접근성: / 반응형: / 성능:

## 9. Anti-slop checklist
- Hero가 2~3줄 안에 들어오는가?
- 버튼 대비가 충분한가?
- 의미 없는 blob이나 glow가 없는가?
- 섹션 간 레이아웃이 반복되지 않는가?
- UI 텍스트가 이미지에 박혀 있지 않은가?
- 컴포넌트가 재사용 가능한 구조인가?
```

## 작성 규칙

- 감성적인 설명만 쓰지 말고 구현 가능한 규칙으로 바꾼다.
- 색상은 HEX 값으로 작성한다.
- spacing·radius·shadow는 실제 CSS 값으로 작성한다.
- 컴포넌트 규칙은 class나 variant로 옮길 수 있게 쓴다.
- **이미지 레퍼런스의 살릴 점과 구현 시 버릴 점을 구분한다.**
- 최종 문구는 이미지가 아니라 코드에 있어야 한다고 명시한다.

## 금지 사항

- "고급스럽게"·"깔끔하게" 같은 추상 표현만 남기지 않는다.
- 이미지 결과를 무조건 정답으로 취급하지 않는다.
- 구현 불가능한 효과를 강제하지 않는다.

## 흐름 (리뷰 게이트)

1. 존재하는 입력 파일을 모두 읽고 `DESIGN.md`(cwd 루트)를 작성한다.
2. 사람이 DESIGN.md를 검토한다.
3. 마음에 안 들면 1~2단계를 반복. 좋으면 안내한다: **"다음 단계: `design-html-prototype`"**.
````

- [ ] **Step 3: 구조 검증 (스펙 6.3 체크리스트)**

확인: 입력은 "있는 것만" + manifest 선택 + PNG glob / 출력 `DESIGN.md`는 cwd 루트 / 9섹션(Anti-slop checklist 포함) / 작성규칙에 "살릴/버릴 점 구분"과 "최종 문구는 코드에" 명시 / 금지 사항 / 흐름 게이트 끝에 `design-html-prototype` 안내.

- [ ] **Step 4: description 트리거 검증**

예상 발동: "DESIGN.md로 정리해줘", "구현자가 따를 디자인 문서 만들어줘". 명확한지 확인.

- [ ] **Step 5: Commit**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(design): add design-md-compiler skill"
```

---

## Task 4: design-html-prototype 스킬

**Files:**
- Create: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: writing-skills 서브스킬 시작**

`superpowers:writing-skills`로 이 파일 저작을 시작한다.

- [ ] **Step 2: SKILL.md 작성 (아래 전체 내용 그대로)**

`skills/design-html-prototype/SKILL.md`:

````md
---
name: design-html-prototype
description: DESIGN.md와 brand tokens를 바탕으로 빠르게 확인 가능한 단일 HTML/CSS 프로토타입을 만들 때 사용한다.
---

# Design HTML Prototype

당신은 DESIGN.md를 바탕으로 빠르게 확인 가능한 HTML 프로토타입을 만드는 프론트엔드 프로토타입 엔지니어다.

## 목적

프로덕션 수준의 React 앱을 바로 만들지 않는다. 먼저 브랜드 방향·레이아웃·컴포넌트 톤을 확인할 수 있는 간단한 HTML 프로토타입을 만든다.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `DESIGN.md`
- `.design/brand-tokens.json`
- `.design/generated/**/*.png` (+ 선택 `.design/generated/manifest.json`)

## 출력 파일

- `prototype/index.html` (사용자가 단일 파일을 원하면 `prototype.html`)

## 구현 규칙

- HTML·CSS·JS를 한 파일에 넣어도 된다.
- CSS variables를 사용한다.
- 텍스트는 실제 HTML 텍스트로 작성한다 (이미지로 대체하지 않는다).
- 버튼·카드·입력창·배지·테이블은 재사용 가능한 class로 만든다.
- 복잡한 이미지는 `<img>` 또는 배경 이미지로 쓰되, UI 전체를 이미지로 대체하지 않는다.
- React로 옮기기 쉽도록 section과 component 구조를 명확히 나눈다.

## 기본 HTML 구조

```html
<header class="site-header"></header>
<main>
  <section class="hero"></section>
  <section class="problem"></section>
  <section class="mechanism"></section>
  <section class="features"></section>
  <section class="dashboard-preview"></section>
  <section class="cta"></section>
</main>
<footer class="site-footer"></footer>
```

## CSS 구조

```css
:root {
  --color-primary: ;
  --color-background: ;
  --color-surface: ;
  --color-text: ;
  --radius-md: ;
  --shadow-md: ;
}
.container {}
.btn {}
.btn-primary {}
.card {}
.badge {}
.section {}
```

## 품질 기준

- 첫 화면의 핵심 문구가 명확해야 한다.
- Hero 제목은 너무 좁게 줄바꿈되지 않아야 한다.
- CTA 버튼은 명확하고 대비가 충분해야 한다.
- 섹션 간 리듬이 있어야 한다.
- 카드와 컴포넌트는 재사용 가능한 구조여야 한다.
- 가로 스크롤이 생기지 않아야 한다.
- 모바일에서도 기본적으로 깨지지 않아야 한다.

## 금지 사항

- 인라인 스타일을 남발하지 않는다.
- 모든 컴포넌트를 이미지로 대체하지 않는다.
- 이미지 생성 결과를 픽셀 단위로 억지 복제하지 않는다.
- 의미 없는 애니메이션을 과하게 넣지 않는다.
- 프로토타입 단계에서 과도한 빌드 시스템을 만들지 않는다.

## 흐름 (리뷰 게이트)

1. `DESIGN.md`·`brand-tokens.json`·생성 이미지를 읽고 `prototype/index.html`을 작성한다.
2. 사람이 브라우저로 확인한다.
3. 마음에 안 들면 1~2단계를 반복한다.
4. 더 손볼 게 있으면 `DESIGN.md`/토큰을 고쳐 `design-md-compiler`·`design-html-prototype`을 다시 돌리거나, 만족하면 실제 구현으로 진행하도록 안내한다. (이 스킬이 파이프라인의 마지막 단계다.)
````

- [ ] **Step 3: 구조 검증 (스펙 6.4 체크리스트)**

확인: 입력은 `DESIGN.md`·`.design/brand-tokens.json`·생성 PNG / 출력 `prototype/index.html`(또는 단일 `prototype.html`) / 구현·품질·금지 규칙 포함 / 흐름이 마지막 단계로서 "다음 스텝 안내" 대신 "DESIGN.md 고쳐 반복 또는 실제 구현" 안내.

- [ ] **Step 4: description 트리거 검증**

예상 발동: "HTML 프로토타입 만들어줘", "DESIGN.md로 시안 페이지 뽑아줘". 명확한지 확인.

- [ ] **Step 5: Commit**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design): add design-html-prototype skill"
```

---

## Task 5: 교차 일관성 + 양쪽 도구 로컬 테스트

**Files:**
- (검증만 — 새 파일 없음)

- [ ] **Step 1: 4개 스킬 교차 일관성 점검**

4개 SKILL.md를 나란히 놓고 확인한다:
- 파이프라인 다음-스텝 체인이 끊김 없이 연결되는가: brand-kit → page-image → md-compiler → html-prototype.
- 경로 표기가 전부 cwd 기준으로 동일한가: `.design/` 중간물, `DESIGN.md`·`prototype/`은 루트.
- `.design/generated/<category>/` 카테고리명이 일치하는가: brand-kit이 `brand-kit/`에, page-image가 `page/`에 쓰고, md-compiler·html-prototype이 `**/*.png`로 읽는다.
- 모든 스킬이 "이미지를 직접 생성하지 않는다 / pluggable"를 일관되게 말하는가 (계약에 생성기 미등장).
- 프론트매터가 전부 `name`·`description`만인가.

불일치가 있으면 해당 SKILL.md를 수정하고 다시 커밋한다.

- [ ] **Step 2: Claude Code 로컬 테스트**

Run: `claude --plugin-dir .` (플러그인 루트에서)
확인: 4개 스킬이 목록에 뜨고, 각 description으로 트리거되며, 경로 B(수동 드롭) 폴백 안내가 자연스러운지. 임의의 제품 설명으로 `design-brand-kit`을 호출해 `.design/BRAND_KIT.md`·`brand-tokens.json`·`image-briefs/brand-briefs.md`가 cwd에 생기는지 확인.

- [ ] **Step 3: Codex CLI 로컬 테스트**

`.agents/plugins/marketplace.json`으로 이 저장소를 마켓플레이스 등록 → `/plugins` → 설치 (문제 시 폴백 경로는 AGENTS.md 참고).
확인: 같은 4개 스킬이 Codex에서도 트리거되고, 경로 A(내장 gpt-image)로 `.design/generated/brand-kit/`에 무드보드 PNG가 생성되는지.

- [ ] **Step 4: 결과 기록 / 마무리**

양쪽 도구 테스트 결과를 사용자에게 보고한다. 스킬 자체는 코드가 아니라 마크다운이므로 `npm test`(스크립트 테스트) 대상이 아니다 — 테스트 스위트 변경 없음. 필요시 `/reload-plugins`로 같은 머신 세션에 반영.

---

## Self-Review

**1. Spec coverage** (스펙 각 절 → 태스크 대응):
- 스펙 4절(레이아웃): Task 1~4의 출력 경로 + Task 5 Step 1 교차 점검. ✓
- 스펙 5절(생성 경계 pluggable): Task 1·2 흐름 게이트에 경로 A/B 명시, Task 5 Step 1에서 "계약에 생성기 미등장" 점검. ✓
- 스펙 6.1~6.4(4개 스킬 계약): Task 1~4 각각. ✓
- 스펙 7절(에이전트 중립): Task 5 Step 2·3 양쪽 도구 테스트(Claude=경로 B, Codex=경로 A). ✓
- 스펙 8절(호출 인터페이스): 각 스킬 description + Task 1~4 Step 4 트리거 검증. ✓
- 스펙 9절(비범위): `ui-kit/`·`logo/`는 생성하지 않음(Task에 미포함), 오케스트레이터·스크립트·MCP 없음(File Structure에서 명시). ✓
- 스펙 10절(작성 체크리스트): Task 1~5 단계에 흡수. ✓

**2. Placeholder scan:** 각 SKILL.md 본문은 "최종 산출물의 템플릿 구조"를 담고 있으며(BRAND_KIT.md/DESIGN.md 등 마크다운 양식), 이는 스킬이 채울 양식이지 계획의 빈칸이 아니다. 계획 단계 자체에는 TODO/TBD/"나중에 구현" 없음. ✓

**3. Type consistency:** 스킬명 4개가 description·흐름 안내·파일 경로에서 일관(`design-brand-kit`/`design-page-image`/`design-md-compiler`/`design-html-prototype`). 카테고리 폴더명 일관(`brand-kit/`·`page/`). 다음-스텝 체인 일관. ✓
