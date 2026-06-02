# 아이콘 세트 SVG 저작 + 시트 디렉션

## 0. 목적 / 사용법

`design-iconset`이 **제품용 SVG 아이콘을 직접 저작**하고 그것을 **HTML 그리드 시트**로 렌더할 때 읽는 문서다. 아이콘 형태·시스템 규칙·스타일 선택·도메인 모티프·Avoid·검증 테스트는 공유 ref 팩 `../../references/design/icon/`(`icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`·`icon-reference-vendors.md`)을 따른다. 이 문서는 **SVG 가족 계약·currentColor 규칙·그리드 렌더·셀 참조·편집 스티어링·구조 린트**만 다룬다.

> **중요:** `icon-rules.md §6`·이 문서의 이전 §6은 **image-gen 프롬프트 청크**였다. iconset은 더 이상 래스터를 생성하지 않으므로 그 청크를 쓰지 않는다 — 그건 brand-kit 컨셉 아이콘용이다. iconset은 SVG 코드를 직접 저작한다.

목표 품질: "랜덤 AI 아이콘 모음"이 아니라 **하나의 가족(one family)으로 읽히고 제품 코드에 바로 쓰는 SVG 세트**(recolor·scale 가능). cross-icon 일관성이 전부다.

## 1. SVG 가족 계약 (스타일 인지)

§11의 **아이콘 스타일** 필드가 계약 스타일을 결정한다. Illustrative는 기본 세트에서 제외(특수 용도만).

**모든 스타일 공통 불변:**
- `viewBox="0 0 24 24"` — 24px artboard, 2px 패딩, 20px live area.
- 루트 `<svg>`에 `width`/`height`를 박지 않는다 — CSS·호출부가 크기 제어(시트 스크립트가 방어적으로 제거하기도 함).
- 공유 키라인/그리드 정렬 · 광학 크기 균형 · 코너 반경 통일 · 하나의 메타포 언어 · 차분한 밀도.

**스타일별 분기:**

| 스타일 | 일관성 앵커 | recolor 규칙 | 구조 린트 |
|---|---|---|---|
| Line/Outline | 균일 stroke-width, join/cap | `stroke="currentColor"` `fill="none"` | 전 SVG stroke-width 동일 |
| Filled | 면 채움·시각 무게 | `fill="currentColor"` | stray stroke 0, 단색 |
| Solid Glyph | 단단한 단색 글리프 | `fill="currentColor"` | 단색, 과밀 없음 |
| Duotone | base+accent 2톤 | `currentColor` + 보조 `fill-opacity=".4"` → One-Color Test 통과 | 정확히 2톤 |
| Outline+Min Fill | stroke + 절제된 fill | `stroke="currentColor"` + 액센트 토큰 최소 fill | stroke 균일 + fill 절제 |

- **상태 아이콘**(success/warning/danger)은 어느 스타일이든 구성 동일, `brand-tokens.json`의 **토큰 색만 분기**.
- 저작 중 형태·일관성·메타포·회피의 권위는 계약이 아니라 `icon-rules.md §1–§5` + `icon-domain-examples.md`다 — 충돌·모호 시 원 팩으로 해소.

## 2. currentColor / recolor

- 일반 아이콘은 `currentColor`로 — 호출부의 `color`(또는 CSS `color`)를 상속해 recolor된다.
- Duotone도 보조 톤을 `currentColor` + `fill-opacity`로 묶어 **한 색으로 recolor** 가능하게 유지(One-Color Test 통과). 별도 색 하드코딩 금지.
- 색이 의미인 상태 아이콘만 토큰 색을 박는다.

## 3. 그리드 렌더 (build-iconset-sheet.mjs)

- 검수 시트는 `scripts/build-iconset-sheet.mjs`가 `.design/icon/`의 `*.svg`를 **파일명 정렬**로 글롭해 결정적으로 렌더한다 — 항상 폴더와 일치(별도 생성 이미지 없음).
- 각 셀: 좌상단 인덱스 번호(`01`–) + 인라인 SVG + 하단 영어 kebab-case 라벨(= 파일명). 하단에 16px accent strip(Small UI Test + recolor 시연).
- 호출:
  ```bash
  node "<스킬 디렉터리>/scripts/build-iconset-sheet.mjs" \
    --in "<cwd>/.design/icon" \
    --out "<cwd>/.design/icon/iconset-sheet.html" \
    --tokens "<cwd>/.design/final/brand-kit/brand-tokens.json" \
    --brand "<브랜드명>"
  ```
- 라이브 프리뷰: `node ../../scripts/lib/serve-design.mjs <cwd>/.design/icon` (five-server가 watch·자동 새로고침).

## 4. 셀 참조 = 번호/이름 → 해당 .svg 외과 편집

- 사용자가 "7번" 또는 "search 아이콘"으로 지목하면 **해당 `.svg` 파일만** 외과 편집한다. 다른 파일은 건드리지 않는다(SVG는 파일 단위라 다른 칸 무손상이 보장된다 — 래스터 시트와 달리 통째 재생성이 아니다).
- 목록 자체를 바꾸면(추가/삭제) 파일을 추가/삭제한 뒤 시트를 다시 렌더한다.

## 5. 구조 린트 + 시각 자가 검수

- **구조 린트(결정적)**: 모든 `.svg`가 같은 `viewBox`인가, 스타일 앵커를 지키는가(line=stroke-width 균일, duotone=정확히 2톤, 루트 width/height 없음). 어긋난 파일을 고친다.
- **시각 자가 검수(라이브 프리뷰)**: `icon-rules.md §5` — One-Color Test(단색에서 의미 유지)·Small UI Test(16/20/24px 가독)·cross-icon 메타포/무게 일관성을 눈으로 판정.

## 6. 금지 사항

- 파일마다 다른 스타일/굵기(가족 상실), 라벨이 영어 kebab-case 아님/의미 불일치, 한 파일에 여러 마크.
- 루트 `<svg>`에 width/height 하드코딩, 색 하드코딩(상태 아이콘 제외), 읽히지 않는 미세 디테일.
- `icon-rules.md §4` Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 3D·gradient·drop shadow, 섞인 스타일, 사진풍 디바이스).
