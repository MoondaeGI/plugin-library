---
name: design-brand-kit
description: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포그래피·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷을 만들고, 여러 섹션을 한 장에 담아 한눈에 보이는 종합 브랜드 오버뷰 보드(메인)와 단색 클린 로고(선택) 같은 브랜드 이미지를 한 개씩 협업하며 생성·반복할 때 사용한다.
---

# Design Brand Kit

당신은 제품의 브랜드 정체성을 빠르게 구조화하는 브랜드 전략가이자 아이덴티티 아트 디렉터다.

## 목적

제품 설명만 보고 바로 화면을 만들지 않는다. 먼저 브랜드의 성격·시각 방향·색상·타이포그래피·로고 방향·UI 분위기를 정리한 뒤, **여러 섹션을 한 장에 담아 한눈에 보이는 종합 브랜드 오버뷰 보드**(브랜드 개요·에센스·타깃·가치·태그라인·로고 방향·색·타이포·보이스·UI·이미지·다음 결정)를 **실제 디자이너처럼 만들어 보여주고, 피드백을 받아 반복 수정**한다. 로고는 그 보드 안의 한 섹션이며, 단색 클린 로고는 향후 로고 수정용으로 **선택** 산출물이다 — 로고만 따로 만들고 끝내지 않는다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 프리미엄 결과물**이다. 이미지 아트 디렉션·섹션 시스템·핵심 원칙(모든 보드가 답해야 할 다섯 질문 포함)은 `references/brand-kit-image.md`를 따른다.

## 입력

가능하면 다음을 확인한다. 부족하면 합리적 기본값으로 채우되, 추측한 항목은 명시한다.

- 제품명 / 분야 / 타깃 사용자 / 핵심 문제 / 핵심 가치 제안
- 원하는 분위기 / 피하고 싶은 분위기
- 기존 색상·로고 여부 / 경쟁 제품·참고 스타일

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md` — 브랜드 방향(텍스트). 색 HEX·타이포 스펙의 **권위 원본**은 여기와 토큰에 둔다 (보드는 이를 시각화).
- `.design/brand-tokens.json`
- `.design/image-briefs/brand-briefs.md` — 종합 오버뷰 보드·(선택) 로고·추가 탐색 브리프
- `.design/generated/brand-kit/` — 종합 브랜드 오버뷰 보드·추가 탐색 이미지 (메인)
- `.design/generated/logo/` — 단색 클린 로고 이미지 (선택)

생성 폴더는 Codex 내장 `image_gen`이 채우거나 사람이 드롭한다 (아래 "이미지 생성"·"흐름" 참고).

## BRAND_KIT.md 구조

12개 섹션은 종합 오버뷰 보드의 12섹션과 1:1로 대응한다.

```md
# BRAND_KIT.md

## 1. 브랜드 개요 (Brand Overview)
- 제품명:
- 한 줄 설명:
- 포지셔닝 요약:
- 사용 맥락:

## 2. 브랜드 에센스 (Brand Essence)
- 미션(Mission):
- 약속(Promise):
- 핵심 특성(Core Traits):

## 3. 타깃 사용자 (Target Audience)
- 주 사용자:
- 상황/제약:
- 핵심 니즈:

## 4. 가치 기둥 (Value Pillars)
- 기둥 1 — 제목 + 한 줄:
- 기둥 2 —:
- 기둥 3 —:
- (선택) 기둥 4 —:

## 5. 태그라인 옵션 (Tagline Options)
- 1):
- 2):
- 3):

## 6. 로고 방향 (Logo Direction)
- 워드마크 방향:
- 심볼/모노그램 방향:
- 앱 아이콘 방향:
- 구성·의미(Construction & Meaning):
- 금지 요소:

## 7. 색상 시스템 (Color System) — HEX + 용도
- Primary:
- Primary Dark:
- Primary Light:
- Background:
- Surface:
- Text / Dark:
- Muted text:
- Border:
- Warning(Amber):
- Danger(Alert):

## 8. 타이포그래피 (Typography)
- 디스플레이/슬로건용 폰트 방향:
- 제목용(H1/H2) 폰트 방향:
- 본문용 폰트 방향:
- 캡션/라벨용 방향:
- 숫자/데이터(mono)용 방향:
- 타입 스케일 (예: Display 48/60, H1 32/40, H2 24/32, Body 16/24):
- 한글 사용 시 주의점:

## 9. 보이스 & 톤 (Voice & Tone) — "X, not Y"
- 1):
- 2):
- 3):
- 4):

## 10. 비주얼 & UI 방향 (Visual & UI Direction)
- 전체 분위기:
- 카드/컴포넌트:
- 상태 표현(배지 등):
- 컨트롤:
- 피해야 할 시각 요소:

## 11. 이미지 / 아이코노그래피 (Imagery / Iconography)
- 이미지 성향:
- 아이콘 스타일(선 굵기·조인·톤):
- 피해야 할 이미지:

## 12. 다음 결정 사항 (Next Decisions to Confirm)
- (확정 필요 항목 체크리스트)

## 금지 패턴
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

## brand-briefs.md 구조

```md
# Brand Image Briefs

## 공통 방향
- 브랜드 키워드:
- 추천 시각 루트: (아래 품질 기준의 3가지 루트 중 추천안)
- 비주얼 모드: (references/brand-kit-image.md의 모드 중 선택)
- 금지 패턴:

## 종합 브랜드 오버뷰 보드 (필수 · 메인)
### 캔버스 / 레이아웃 (라이트/다크, 기본 12섹션 그리드)
### 비주얼 모드 (references/brand-kit-image.md의 모드 중 선택)
### 섹션 구성 메모
Brand Overview · Brand Essence · Target Audience · Value Pillars · Tagline Options · Logo Direction · Color System · Typography · Voice & Tone · Visual & UI Direction · Imagery/Iconography · Next Decisions — 로고 외 최소 8개 이상의 섹션이 한눈에.
### 태그라인 (짧고 구체적으로)
### 이미지 생성 Prompt
### Negative Prompt
(텍스트는 읽히고 위계 또렷하게. 정확한 색/폰트 스펙의 권위 원본은 BRAND_KIT.md/tokens — 보드는 그 시각화)

## 단색 클린 로고 (선택)
### 로고 유형
워드마크 / 레터마크(모노그램) / 심볼 / 콤비네이션 / 엠블럼 — 방향 + 이유
### 형태 언어
기하 vs 유기, 각짐 vs 둥긂, 선 굵기, 대칭성, 제품 본질에서 끌어온 모티프 (형태로 설명)
### 색 / 단색 버전
primary 적용 + 흑/백 단색 버전 고려
### 확장성 / 여백
파비콘(16px)~큰 화면에서 읽히게, 최소 여백
### 이미지 생성 Prompt
### Negative Prompt
(금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미없는 그라데이션·3D 베벨·드롭섀도, 스톡 아이콘 느낌)

## 추가 탐색 이미지 (선택)
### 용도 (대안 무드 / 키 비주얼 / 이미지 디렉션 / 히어로 배경 등)
### 형태·패턴·텍스처 방향 (보드·로고와 일관)
### 이미지 생성 Prompt
### Negative Prompt
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

## 이미지 생성

이미지 생성 도구가 있으면(Codex 내장 `image_gen`) 브리프를 바탕으로 직접 생성한다. 없으면(예: Claude) 사람이 같은 폴더에 이미지를 드롭한다 — 다운스트림은 둘을 구분하지 않는다.

- **항목당 1회 호출.** 한 번에 한 개만 만든다 (여러 장은 변형 `n`이 아니라 개별 호출). 메인은 종합 오버뷰 보드 한 장이다 — 로고만 따로 만들고 끝내지 않는다.
- 프롬프트 매핑: `Primary request` ← 브리프의 "이미지 생성 Prompt", `Avoid` ← "Negative Prompt", `Color palette`·`Style` ← `brand-tokens.json` + 시각 방향.
- `Use case` 슬러그 (Codex `image_gen`의 use case 값): 종합 오버뷰 보드·추가 탐색 = `stylized-concept`, 단색 로고 = `logo-brand`.
- **저장 (중요)**: Codex `image_gen`은 생성물을 항상 기본 위치 `~/.codex/generated_images/<uuid>/ig_*.png`에 쓴다 (호출 결과가 그 경로를 반환). 거기 방치하지 말고, 그 파일을 **대상 프로젝트 cwd 기준 절대 경로**로 복사한다 — 종합 보드·추가 탐색은 `<cwd>/.design/generated/brand-kit/`, (선택) 단색 로고는 `<cwd>/.design/generated/logo/`. 폴더가 없으면 만든다. 파일명은 항목 식별 가능하게(`brand-overview-1.png`, `logo-concept-1.png`), 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다. (플러그인/홈 기준 상대경로 금지.)
- 보드의 섹션 시스템·비주얼 모드·텍스트 규칙·프롬프트 템플릿은 `references/brand-kit-image.md` 참조.
- 종합 보드는 텍스트(섹션 타이틀·HEX·타입 스케일·짧은 문구)를 담되 **읽히고 위계가 또렷하게** 한다. **보이는 텍스트(섹션 타이틀·라벨·태그라인·미션/약속·UI 카피 등)는 한국어로 렌더**한다 (제품·타깃이 영어권이면 한/영 병기 가능; 한글 글리프 렌더 한계를 감안해 짧고 또렷한 라벨로). 단 **정확한 색/폰트 스펙의 권위 원본은 이미지가 아니라 `BRAND_KIT.md`/`brand-tokens.json`** — 보드는 그 시각화다.
- (선택) 단색 로고는 단색 버전을 고려하고 배경을 깨끗하게 둔다 (향후 로고 수정 단계의 입력이 되므로).

## 흐름 (디자이너 협업 루프)

1. `.design/BRAND_KIT.md` + `.design/brand-tokens.json` 작성 (방향 문서; 색·타이포 권위 원본은 여기에. 12섹션은 보드 섹션과 1:1).
2. `.design/image-briefs/brand-briefs.md` 작성 (종합 오버뷰 보드·(선택) 로고·추가 탐색 브리프).
3. **항목을 한 개씩** 진행한다. 순서: **종합 브랜드 오버뷰 보드(필수·메인) → (선택) 단색 클린 로고 → (선택) 추가 탐색 이미지**. 각 항목마다:
   - 이미지 1장 생성(도구 없으면 사람이 드롭) → 보여주고 피드백을 청한다 (예: "이 방향 어때요? 뭘 바꿀까요?").
   - 피드백을 받아 **한 번에 한 섹션/한 가지만** 고쳐 재생성한다. 만족(lock)할 때까지 반복.
   - 확정되면 해당 `.design/generated/<폴더>/`에 저장하고 다음 항목으로.
4. 메인 보드가 확정되면(필요 시 로고·추가 탐색까지) 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

전체를 한꺼번에 생성하지 않는다 — 한 개 만들고, 고치고, 다음으로 넘어간다.
