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
- `.design/generated/page/` — 섹션 이미지 PNG가 채워지는 폴더 (Codex 생성 또는 수동 드롭; 아래 흐름 2단계 참고)

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
## Section 3 — Product Mechanism
## Section 4 — Feature / Channel Grid
## Section 5 — Dashboard / Evidence
## Section 6 — CTA / Footer

> Section 2~6도 각각 위 Section 1과 동일한 8개 하위 항목(섹션 목적 / 레이아웃 구성 / 시각 계층 / 컴포넌트 사용 / 이미지 / 일러스트 사용 / 이미지 생성 Prompt / Negative Prompt / 구현 메모)을 가진다.
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

- 모든 섹션을 같은 레이아웃으로 만들지 않는다.
- 텍스트가 너무 작거나 읽기 어려운 디자인을 만들지 않는다.
- UI를 이미지로만 구현해야 하는 구조로 만들지 않는다.

## 흐름 (리뷰 게이트)

1. `.design/image-briefs/page-briefs.md` 작성 (섹션당 브리프 1개).
2. **이미지 채우기 (pluggable)**: Codex면 내장 gpt-image로 각 섹션 이미지를 `.design/generated/page/`에 생성. 그 외면 사람이 같은 폴더에 PNG를 드롭.
3. 사람이 섹션 시안을 검토한다.
4. 마음에 안 들면 브리프(1단계)를 고쳐 이미지를 다시 채우고(2단계) 재검토한다(3단계). 좋으면 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-md-compiler`"**.

이미지를 직접 생성하지 않는다 — 이 스킬의 계약은 섹션 브리프 작성과 산출물 안내까지다.
