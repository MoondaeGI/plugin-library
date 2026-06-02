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
- `.design/candidate/brand-kit/brand-briefs.md`
- `.design/candidate/page/page-briefs.md`
- `.design/view/overview.html` (있으면 — 브랜드 오버뷰 룩·섹션 구조 참조)
- `.design/assets/brand-kit/*.png`, `.design/assets/brand-kit/icon/*.png` (확정 base 자산 — 로고·키비주얼·UI·컨셉 아이콘)
- `.design/assets/logo/*.png`, `.design/assets/icon/*.svg`, `.design/assets/page/*.{png,jpg,jpeg,webp}` (확정 deliverable)
- `.design/candidate/page/*.{png,jpg,jpeg,webp}` (확정 전 시안 폴백)
- `.design/manifest.json` (선택 — 있으면 캡션·순서·섹션 매핑 메타, 없으면 파일명 glob)

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
- 로고: / 배경: / 제품 목업: / UI 킷 레퍼런스: / 사용하지 말아야 할 방식:

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
- `brand-tokens.json`의 `typography` 토큰(`display`/`heading`/`body`/`mono`)을 그대로 기록한다. `typography.accent`(선택)는 인용/에디토리얼용 폰트로, 값이 있으면 함께 기록하고 풀쿼트·히어로 태그라인 등 소량 포인트 용도임을 명시한다.
- spacing·radius·shadow는 실제 CSS 값으로 작성한다.
- 컴포넌트 규칙은 class나 variant로 옮길 수 있게 쓴다.
- **이미지 레퍼런스의 살릴 점과 구현 시 버릴 점을 구분한다.**
- 최종 문구는 이미지가 아니라 코드에 있어야 한다고 명시한다.
- 모든 필드를 비워두지 않는다 — 입력 파일에서 추론 가능한 값을 채우고, 추측한 값은 표시한다.
- 이미지는 `assets/` 하위 폴더로 종류를 구분한다: `assets/brand-kit/`(키비주얼·UI·컨셉 아이콘 — 브랜드 base) · `assets/logo/`(확정 로고) · `assets/icon/`(프로덕션 SVG 아이콘셋) · `assets/page/`(페이지 섹션). `view/overview.html`은 브랜드 오버뷰 룩의 참조다.

## 금지 사항

- "고급스럽게"·"깔끔하게" 같은 추상 표현만 남기지 않는다.
- 이미지 결과를 무조건 정답으로 취급하지 않는다.
- 구현 불가능한 효과를 강제하지 않는다.

## 흐름 (리뷰 게이트)

1. 존재하는 입력 파일을 모두 읽고 `DESIGN.md`(cwd 루트)를 작성한다.
2. 사람이 DESIGN.md를 검토한다.
3. 마음에 안 들면 입력을 보강하거나 DESIGN.md를 고쳐(1단계) 다시 검토한다(2단계). 좋으면 안내한다: **"다음 단계: `design-html-prototype`"**.
