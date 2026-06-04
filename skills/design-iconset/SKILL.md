---
name: design-iconset
description: 확정된 brand kit를 바탕으로 제품 아이콘 세트를 Iconify 단일 세트에서 fetch해 만든다. §11 스타일로 후보 세트를 점수화해 1개 lock하고(게이트2), 리스트 적중률을 측정한 뒤(게이트2.5), 적중분은 viewBox 0 0 24 24·currentColor로 정규화해 가져오고 부족분만 합성/저작한다(게이트3은 부족분 메타포만 합의). 모든 아이콘을 icon-map.json에 기록하고 .design/assets/icon/으로 lock한다. 저작 시 네트워크 필요(api.iconify.design, 키 불필요), OPENAI_API_KEY 불필요.
---

# Design Iconset

당신은 확정된 브랜드 킷에서 출발해 **제품 코드에 바로 쓰는 하나의 일관된 SVG 아이콘 가족**을 만드는 디자인 시스템 디자이너다.

## 목적

`design-brand-kit`(과 보통 `design-logo`)이 확정된 뒤 사용한다. brand kit의 §11 아이코노그래피는 스타일·폼 규칙·메타포·상태 규칙을 한 줄씩 박아둔 결정이므로, 여기서 그 결정을 따라 **Iconify 단일 세트에서 fetch해 `viewBox="0 0 24 24"`·`currentColor`로 정규화**하고, 세트에 없는 gap(도메인 전용) 아이콘만 §11 폼 규칙을 따라 합성·저작한다(처음부터 전량 저작은 이제 fallback이 아닌 gap에 한정). 각 SVG는 `viewBox="0 0 24 24"`·`currentColor`로 recolor·무한 scale 된다. 품질 기준은 "랜덤 AI 아이콘"이 아니라 **하나의 가족(one family)으로 읽히는 제품 아이콘 세트**다 — cross-icon 일관성이 전부다.

**역할 분리:** brand-kit의 `assets/brand-kit/icon/*.png`는 **브랜드 컨셉/정체성 전시용**(overview에만)이라 제품에 안 나간다. iconset은 그것을 시드로도 읽지 않는다 — 스타일 근거는 **§11 규칙 + tokens만**이며, 제품용 SVG 가족은 Iconify 세트 fetch(적중분)와 gap 합성/저작(미적중분)으로 완성한다.

> **파이프라인 비대칭(의도):** 로고는 확정 시 캐노니컬 파일(`assets/logo/logo.png`)을 덮어써 overview에서 base를 갈아치우지만, 아이콘은 이 역할 분리 때문에 컨셉 PNG(브랜드 전시)와 확정 SVG(제품)가 overview §11에 **병존**한다. lock 때 `<!-- design-iconset:slot -->` 사이를 확정 SVG로 치환하되 컨셉 PNG는 남긴다(아래 흐름 9). 이 비대칭은 빠뜨린 게 아니라 의도다.

**로고와 다르다:** 로고는 기억되는 한 개의 마크(발산 탐색), 아이콘은 같은 규칙으로 묶인 여러 신호(수렴 일관성)다. 아이콘은 로고보다 튀면 안 된다.

## 전제

- `design-brand-kit` 산출물 중 `.design/BRAND_KIT.md`·`.design/brand-tokens.json`이 있으면 그걸 쓴다. **없으면 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 / 아이콘용 최소 Q&A로 진행).
- **이미지 생성·`OPENAI_API_KEY` 불필요** — 아이콘은 Iconify 세트에서 fetch+정규화하고, gap(세트 미수록)만 LLM이 SVG 코드로 직접 저작한다. 검수 시트는 결정적 스크립트로 HTML 렌더한다. 네트워크 필요(api.iconify.design, 키 불필요).

## 입력 파일 (대상 프로젝트 cwd 기준)

권위 원본은 md/tokens다.

- `.design/BRAND_KIT.md` — §11 아이코노그래피(스타일·폼 규칙·메타포·상태 규칙)·§6·§1/에센스·§3·§4·§10·금지 패턴.
- `.design/brand-tokens.json` — 색 HEX(라인색·액센트·상태색·캔버스).
- **brand-kit `assets/brand-kit/icon/*`는 읽지 않는다**(컨셉용). 없으면 Phase 0 폴백.

## 출력 파일 (대상 프로젝트 cwd 기준)

```
.design/
  candidate/icon/             # 작업본 (저작·편집 루프)
    <name>.svg                # 제품 deliverable 초안 (currentColor, viewBox 0 0 24 24)
    iconset-briefs.md         # 읽은 md 근거·확정 목록·메타포 매핑·가족 계약·제약
  view/
    iconset-sheet.html        # 검수 시트(candidate/icon에서 결정적 렌더, SVG 인라인 임베드)
  assets/icon/                # 확정 — 순수 복사, 다운스트림이 읽음
    <name>.svg
    icon-map.json             # provenance/recipe 캐시, lock이 재생성
```

- 작업본 `candidate/icon/` → 확정 `assets/icon/` **순수 복사**. 버전 이력은 git.
- 시트는 SVG를 인라인 임베드한다. 색은 공유 `../assets/tokens.css`의 `var(--color-*)`로 참조하므로(시트가 link), 색 HEX 인라인 주입은 없다(전사 드리프트 방지). tokens.css는 brand-kit lock이 생성하며, 부재 시 var() 폴백값으로 degrade.
- `generated/`는 두지 않는다(SVG는 텍스트라 초안 누적 불필요).

## SVG 저작 방식

- **fetch+정규화(@iconify/tools·`scripts/`) + 부족분만 저작**: 세트에서 가져온 아이콘은 `scripts/normalize.mjs`로 24그리드·currentColor 정규화해 사용. gap(세트에 없는 아이콘)만 §11 폼 규칙 + tokens를 따라 LLM이 SVG로 직접 저작한다. 가족 계약(스타일·viewBox·stroke/fill·join/cap·코너·색)은 `references/iconset-sheet.md §1`, 형태·일관성·메타포·회피의 권위는 `../references/design/icon/`(`icon-rules.md §1–§5`·`icon-style-catalog.md`·`icon-domain-examples.md`)다. **`icon-rules.md §6` 이미지 청크는 쓰지 않는다.**
- **검수 시트는 결정적 스크립트**: `scripts/build-iconset-sheet.mjs`가 `candidate/icon/*.svg`를 글롭→번호+kebab 라벨 HTML 그리드 렌더. `references/iconset-sheet.md §3`.
- **라이브 프리뷰**: `node ../../scripts/lib/serve-design.mjs <cwd>/.design` (five-server watch·자동 새로고침). 시트 직접 URL: `http://localhost:5500/view/iconset-sheet.html`. 처음 제시할 때 **최초 1회만 사용자 확인** 후 백그라운드 기동, lock/종료 시 닫는다.
- **image-gen·OPENAI_API_KEY 불필요.** **저작 시 네트워크 필요**(api.iconify.design, 키 불필요).

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/BRAND_KIT.md`·`.design/brand-tokens.json` 존재 확인.
- **있으면** → Phase 1.
- **없으면** → 두 길 제시:
  - **(1) 브랜드 킷 먼저**(권장) — design-brand-kit 안내 후 종료.
  - **(2) 아이콘용 최소 Q&A** — 한 번에 하나씩: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`../references/design/icon/icon-style-catalog.md`) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지. 수집분을 `iconset-briefs.md`에 기록(가짜 `BRAND_KIT.md` 만들지 않음). 끝에 design-brand-kit 안내.

### Phase 1 — 리스트 → 세트 선택 → 적중률 → 조건부 메타포
1. **md/tokens 흡수**: §11·§6·§3·§4·§10·금지패턴 + tokens 색을 읽어 art direction 백본 고정.
2. **게이트1 — 목록**: 코어/도메인/상태 3분류로 아이콘 목록 확정(기존 유지).
3. **게이트2 — 세트 선택**: §11 스타일 → `../references/design/icon/icon-style-catalog.md`·`icon-reference-vendors.md`로 후보 set-id 2~3개 → 후보의 동일 대표 아이콘을 `scripts/fetch-icons.mjs`로 가져와 비교 시트로 제시 → 스타일/라이선스/밀도로 점수화해 **단일 세트 lock**. backbone 합성 문법 1개 합의.
4. **게이트2.5 — 적중률 측정**: `scripts/probe-set.mjs`로 리스트를 세트에 대조 → 분류별 카운트 제시(코어/도메인/상태). 도메인 적중률이 낮으면 분기 제시: (a) 다른 세트 (b) 합성 진행 (c) 도메인 손저작 유지. **세트 go/no-go.**
5. **게이트3 — 조건부 메타포**: `fetched`는 자동(생략), `ambiguous`는 가벼운 확인, `gap`만 concept→metaphor(→mode) 합의.

### Phase 2 — fetch+정규화 → (부족분 처리) → 시트 검수 → lock
6. **fetch+정규화**: `scripts/fetch-icons.mjs`가 `fetched`/확정된 `ambiguous`를 가져와 `scripts/normalize.mjs`로 24그리드·currentColor 정규화해 `candidate/icon/*.svg`로 기록.
7. **부족분(gap) 처리 — cascade**:
   - ① 세트에 있음 → fetch (위)
   - ② **없으면 합성(M1~M5)** — *자동 합성 엔진은 Plan 2 예정.* 그전까지는 ③/④로 처리.
   - ③ 단일 새 개념/hero → 세트를 레퍼런스로 손저작(`viewBox 0 0 24 24`·`currentColor`, 24그리드).
   - ④ 안 읽힘 → 가장 가까운 세트 아이콘 대체 + 플래그.
8. **시트 검수·편집**: `build-iconset-sheet.mjs`로 렌더 → `serve-design.mjs` 라이브 프리뷰 → 번호/이름 지목 외과 편집(기존). One-Color·Small UI·cross-icon 검사.
9. **lock**: `candidate/icon/*.svg` → `assets/icon/*.svg` 순수 복사. `scripts/build-icon-map.mjs`로 `assets/icon/icon-map.json` **재생성** + `validateMap`로 1:1 정합 확인(어긋나면 경고). overview 슬롯 주입(기존). 다운스트림(`design-ui-kit` 등)은 `assets/icon/*.svg`를 읽음. 라이브 서버 종료.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 스타일 앵커·그리드·메타포 언어·시각 무게) — `../references/design/icon/icon-rules.md §3`.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6).
- 라벨은 영어 kebab-case + 아이콘 의미와 일치. 한 파일에 여러 마크 금지.
- 루트 `<svg>`에 width/height·색 하드코딩 금지(상태 아이콘 색 제외) — `currentColor`로 recolor 유지.
- `icon-rules.md §4` Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 디테일 과밀, 3D/bevel, gradient, drop shadow, 섞인 스타일, 작아지면 안 읽히는 디테일, 사진풍 렌더).
- 권위 원본은 md/tokens — 계약·가이드와 어긋나면 md/tokens가 정답.
