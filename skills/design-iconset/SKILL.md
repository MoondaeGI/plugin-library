---
name: design-iconset
description: 확정된 brand kit를 바탕으로 제품에서 실제로 쓰는 아이콘 세트를 SVG 코드로 직접 저작하는 스킬. BRAND_KIT.md §11(아이콘 스타일·폼 규칙·메타포·상태 규칙)·brand-tokens.json을 권위 근거로(brand-kit의 PNG 아이콘은 안 읽음 — 그건 브랜드 컨셉용), 아이콘 목록을 코어/도메인/상태 3분류로 제안·확정하고(게이트1), 각 아이콘의 concept→metaphor를 승인받은 뒤(게이트2), viewBox 0 0 24 24·currentColor 개별 .svg를 .design/icon/에 저작한다. 폴더를 HTML 그리드로 결정적 렌더해 번호·라벨로 검수·외과 편집하고, 확정 세트를 .design/final/icon/으로 lock한다. image-gen·OPENAI_API_KEY 불필요.
---

# Design Iconset

당신은 확정된 브랜드 킷에서 출발해 **제품 코드에 바로 쓰는 하나의 일관된 SVG 아이콘 가족**을 만드는 디자인 시스템 디자이너다.

## 목적

`design-brand-kit`(과 보통 `design-logo`)이 확정된 뒤 사용한다. brand kit의 §11 아이코노그래피는 스타일·폼 규칙·메타포·상태 규칙을 한 줄씩 박아둔 결정이므로, 여기서 그 결정을 따라 **제품에서 실제로 쓸 아이콘 세트를 개별 SVG 파일로 직접 저작**한다. 각 SVG는 `viewBox="0 0 24 24"`·`currentColor`로 recolor·무한 scale 된다. 품질 기준은 "랜덤 AI 아이콘"이 아니라 **하나의 가족(one family)으로 읽히는 제품 아이콘 세트**다 — cross-icon 일관성이 전부다.

**역할 분리:** brand-kit의 `assets/icons/*.png`는 **브랜드 컨셉/정체성 전시용**(overview에만)이라 제품에 안 나간다. iconset은 그것을 시드로도 읽지 않는다 — 스타일 근거는 **§11 규칙 + tokens만**이며, 제품용 SVG 가족을 처음부터 직접 저작한다.

**로고와 다르다:** 로고는 기억되는 한 개의 마크(발산 탐색), 아이콘은 같은 규칙으로 묶인 여러 신호(수렴 일관성)다. 아이콘은 로고보다 튀면 안 된다.

## 전제

- `design-brand-kit` 산출물 중 `.design/final/brand-kit/BRAND_KIT.md`·`.design/final/brand-kit/brand-tokens.json`이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 아이콘용 최소 Q&A로 진행).
- **이미지 생성·`OPENAI_API_KEY` 불필요** — 아이콘은 LLM이 SVG 코드를 직접 저작한다. 검수 시트만 결정적 스크립트로 HTML 렌더한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

권위 원본은 md/tokens다.

- `.design/final/brand-kit/BRAND_KIT.md` — §11 아이코노그래피(스타일·폼 규칙·메타포·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지 패턴.
- `.design/final/brand-kit/brand-tokens.json` — 색 HEX(라인색·액센트·상태색·캔버스).
- **brand-kit `assets/icons/*`는 읽지 않는다**(컨셉용). 없으면 Phase 0 폴백.

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  icon/                       # 작업본 (저작·편집 루프)
    <name>.svg                # 제품 deliverable (currentColor, viewBox 0 0 24 24)
    iconset-sheet.html        # 검수 시트(폴더에서 결정적 렌더, 항상 일치)
    iconset-briefs.md         # 읽은 md 근거·확정 목록·메타포 매핑·가족 계약·제약
  final/icon/                 # lock — 순수 복사, 다운스트림이 읽음
    <name>.svg
    iconset-sheet.html
```

- 작업본 `.design/icon/` → lock `.design/final/icon/` **순수 복사**(brand-kit의 `final/brand-kit/` 패턴과 일관). 버전 이력은 git.
- `generated/`는 두지 않는다(SVG는 텍스트라 초안 누적 불필요).

## SVG 저작 방식

- **LLM이 §11 폼 규칙 + tokens를 따라 각 아이콘을 깨끗한 SVG로 직접 작성**한다. 가족 계약(스타일·viewBox·stroke/fill·join/cap·코너·색)은 `references/iconset-sheet.md §1`, 형태·일관성·메타포·회피의 권위는 `../references/design/icon/`(`icon-rules.md §1–§5`·`icon-style-catalog.md`·`icon-domain-examples.md`)다. **`icon-rules.md §6` 이미지 청크는 쓰지 않는다.**
- **검수 시트는 결정적 스크립트**: `scripts/build-iconset-sheet.mjs`가 `.design/icon/*.svg`를 글롭→번호+kebab 라벨 HTML 그리드 렌더. `references/iconset-sheet.md §3`.
- **라이브 프리뷰**: `node ../../scripts/lib/serve-design.mjs <cwd>/.design/icon` (five-server watch·자동 새로고침). 처음 제시할 때 **최초 1회만 사용자 확인** 후 백그라운드 기동, lock/종료 시 닫는다.

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/final/brand-kit/BRAND_KIT.md`·`brand-tokens.json` 존재 확인.
- **있으면** → Phase 1.
- **없으면** → 두 길 제시:
  - **(1) 브랜드 킷 먼저**(권장) — design-brand-kit 안내 후 종료.
  - **(2) 아이콘용 최소 Q&A** — 한 번에 하나씩: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`../references/design/icon/icon-style-catalog.md`) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지. 수집분을 `iconset-briefs.md`에 기록(가짜 `BRAND_KIT.md` 만들지 않음). 끝에 design-brand-kit 안내.

### Phase 1 — 흡수 → 목록 게이트 → 메타포 게이트
1. **md/tokens 흡수 + art direction 백본 고정**: §11(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지패턴 + tokens 색을 읽어 **SVG 가족 계약**을 확정(`references/iconset-sheet.md §1`). 권위는 `icon-rules.md §1–§5`·`icon-style-catalog.md`·`icon-domain-examples.md`.
2. **게이트 1 — 목록**: 아이콘 목록을 3분류로 유도해 제시하고 "더 받을 거?"를 묻는다.
   - **① 코어/시스템**(거의 모든 앱; 근거 §1 사용 맥락): 예 `search`·`settings`·`add`·`edit`·`delete`·`close`·`menu`·`filter`·`sort`·`chevron`·`check`·`more`.
   - **② 도메인/기능**(이 제품만; 근거 §1·§2·§3·§4·§11 + `icon-domain-examples.md` 해당 도메인): 제품이 하는 일을 동사/명사로 분해해 매핑.
   - **③ 상태**(근거 §11 상태 규칙): `status-success`·`status-warning`·`status-danger`·`status-info`. 구성 동일, 색만 분기.
   - 규율: **추측 금지**(근거 약하면 임의 추가 말고 물어서 넣음), **과다 생성 방지**(기본은 실제 쓸 것만; ~28개 초과 시 기능 그룹 분할 안내).
   - 사용자가 추가/제거/직접지정(영어 kebab-case)으로 편집 → **라벨 목록 확정(잠금)**.
3. **게이트 2 — 메타포 (저작 전 필수)**: 확정 라벨마다 **concept → metaphor(shape)** 매핑을 표(`# | label | concept | metaphor(shape) | category`)로 제시해 승인받는다. 직역(`icon-rules.md §4 Avoid`)·메타포 언어 불일치(`§3` 전부 기하/전부 흐름)를 여기서 검수한다. *단순 라벨이 아니라 "왜 이 형태인가"를 먼저 합의.* 짚인 행만 고쳐 재승인.
4. `iconset-briefs.md` 작성(읽은 md 근거·확정 목록·메타포 매핑·가족 계약·색·제약).

### Phase 2 — SVG 저작 → 시트 검수 → 편집 → lock
5. **SVG 저작**: 확정 목록을 가족 계약에 따라 개별 `.svg`로 작성(`.design/icon/<name>.svg`). 모든 SVG가 공통 불변 + 스타일별 분기(`references/iconset-sheet.md §1`)를 따른다. 모호하면 `icon-rules.md §1–§5`로 해소.
6. **시트 렌더**: `build-iconset-sheet.mjs`로 `.design/icon/iconset-sheet.html` 생성 → `serve-design.mjs` 라이브 프리뷰로 검수.
7. **편집 루프**: 번호/이름 지목 → **해당 `.svg`만 외과 편집**(`references/iconset-sheet.md §4`) → 자동 새로고침. 목록 변경이면 파일 추가/삭제 후 재렌더.
8. **일관성 검사**: 구조 린트(viewBox·스타일 앵커 균일) + 시각 자가 검수(One-Color/Small UI/cross-icon, `icon-rules.md §5`).
9. **lock**: 확정 `*.svg` + `iconset-sheet.html`을 `.design/final/icon/`로 순수 복사. 산출 경로 제시 후 안내: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**. 라이브 프리뷰 서버가 떠 있으면 종료.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 스타일 앵커·그리드·메타포 언어·시각 무게) — `../references/design/icon/icon-rules.md §3`.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6).
- 라벨은 영어 kebab-case + 아이콘 의미와 일치. 한 파일에 여러 마크 금지.
- 루트 `<svg>`에 width/height·색 하드코딩 금지(상태 아이콘 색 제외) — `currentColor`로 recolor 유지.
- `icon-rules.md §4` Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 디테일 과밀, 3D/bevel, gradient, drop shadow, 섞인 스타일, 작아지면 안 읽히는 디테일, 사진풍 렌더).
- 권위 원본은 md/tokens — 계약·가이드와 어긋나면 md/tokens가 정답.
