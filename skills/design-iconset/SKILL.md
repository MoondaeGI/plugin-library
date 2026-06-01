---
name: design-iconset
description: 확정된 brand kit를 바탕으로 아이콘 세트를 한눈에 보는 라벨 그리드 시트 이미지를 만드는 스킬. BRAND_KIT.md §11(아이콘 스타일·메타포·상태 규칙)·tokens·assets/icons 개별 투명 아이콘을 시드로 삼아, 필요한 아이콘 목록을 제안·확정한 뒤, 각 아이콘 하단에 영어 kebab-case 라벨이 붙은 정사각 Icon Set 시트를 만든다. 시트를 첨부하고 셀 번호로 가리켜 수정해 모든 아이콘이 한 가족으로 읽히게 좁히고, 확정 시트를 .design/final/iconset/에 저장할 때 사용한다.
---

# Design Iconset

당신은 확정된 브랜드 킷에서 출발해 **하나의 일관된 아이콘 언어**를 만드는 디자인 시스템 디자이너다.

## 목적

`design-brand-kit`(과 보통 `design-logo`)이 확정된 뒤 사용한다. brand kit의 §11 아이코노그래피는 스타일·모티프·상태 규칙을 한 줄씩만 박아둔 결정이므로, 여기서 그 결정을 따라 **제품에서 실제로 쓸 아이콘 세트**를 한 장의 시트로 그려낸다. 각 아이콘 하단에 영어 kebab-case 라벨이 붙고, 사용자가 번호로 칸을 고치며 좁힌다. 품질 기준은 "랜덤 AI 아이콘"이 아니라 **하나의 가족(one family)으로 읽히는 아이콘 세트**다 — cross-icon 일관성이 전부다. 아이콘 형태·시스템 규칙은 `../references/design/icon/` 팩, 시트 레이아웃은 `references/iconset-sheet.md`를 따른다.

**로고와 다르다:** 로고는 기억되는 한 개의 마크(발산 탐색), 아이콘은 같은 규칙으로 묶인 여러 신호(수렴 일관성)다. 아이콘은 로고보다 튀면 안 된다.

## 전제

- `design-brand-kit` 산출물(`.design/BRAND_KIT.md`·`.design/brand-tokens.json`·`.design/final/brand-kit/assets/icons/`)이 있으면 그걸 쓴다. **없으면 흐름 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 만들기 / 아이콘용 최소 Q&A로 바로 진행).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패). 키가 없으면 사람이 직접 드롭하는 폴백.

## 입력 파일 (대상 프로젝트 cwd 기준)

Phase 1에서 **이미지뿐 아니라 작성된 md도 최대한 흡수**한다. 권위 원본은 md/tokens — 시드 이미지와 어긋나면 md/tokens가 정답이다(`icon-rules.md` §0).

- `.design/final/brand-kit/assets/icons/` — **brand-kit이 만든 개별 투명 아이콘.** 이 가족을 **권위 기준(스타일 시드)**으로 삼아 풀 product 세트를 확장한다(보드 재추출 안 함).
- `.design/BRAND_KIT.md` — §11 아이코노그래피(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§10·금지 패턴.
- `.design/brand-tokens.json` — 색 HEX.

> `assets/icons/`가 **없으면** Phase 0의 아이콘 Q&A로 최소 정보를 모은다.

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/generated/iconset/style-seed.png` — assets/icons 가족 앵커(투명).
- `.design/generated/iconset/iconset-board.png` (+`-v2`…) — 라벨 그리드 시트 시안(누적, 덮지 않음).
- `.design/final/iconset/iconset.png` — 확정 시트.
- `.design/image-briefs/iconset-briefs.md` — 시드 출처·읽은 md 근거 요약·확정 아이콘 목록·스타일 파라미터·상태 아이콘·색·제약 로그.

시안은 `generated/iconset/`에 `--auto-version`으로 누적한다. 확정본만 `final/iconset/`로 복사한다.

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: **아이콘은 `gpt-image-1.5` + `--background transparent`(투명 PNG)**로 생성한다. gpt-image-2는 투명 배경을 지원하지 않으므로 불투명 폴백이 꼭 필요한 경우에만 사용한다.
- **충실도(고정)**: gpt-image-2는 `--image`를 **항상 high fidelity**로 처리한다(`--input-fidelity` 미지원). "룩 따르되 새 아이콘"은 프롬프트 문구로 표현한다.
- **셀 참조 = 시트 첨부 + 번호**: 사용자가 "N번"으로 가리키면 **해당 시트를 `--image`로 첨부**하고 프롬프트엔 번호만 쓴다. 형태를 말로 번역하지 않는다.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 `-v2`·`-v3`… 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 시트 프롬프트는 `references/iconset-sheet.md` §6 청크.
- 호출 예(시트 생성):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <시트 프롬프트 파일> \
    --image "<cwd>/.design/generated/iconset/style-seed.png" \
    --out "<cwd>/.design/generated/iconset/iconset-board.png" \
    --auto-version --size 1024x1024 --quality low --model gpt-image-1.5 --background transparent
  ```

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/BRAND_KIT.md`와 `.design/final/brand-kit/assets/icons/` 존재를 확인한다.
- **있으면** → Phase 1로.
- **없으면** → 두 길을 제시하고 고르게 한다:
  - **(1) 브랜드 킷 먼저** — "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·아이콘 스타일·모티프까지 갖춰 근거가 탄탄)". 고르면 design-brand-kit을 안내하고 종료.
  - **(2) 아이콘용 최소 Q&A** — 여기서 바로 진행. 한 번에 하나씩 묻는다: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`../references/design/icon/icon-style-catalog.md` 참고) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지 — 답으로 스타일·모티프·색·목록을 정할 수 있을 때까지 파고든다. 수집분을 `iconset-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). **시드 추출(Phase 1 2단계)은 건너뛰고** Phase 2의 시트 생성을 **텍스트→이미지**(시드 미첨부)로 한다. 끝에 design-brand-kit을 안내.

### Phase 1 — md+이미지 흡수 → 시드 → 목록 → 승인 게이트 (brand kit가 있을 때)
1. **md/tokens 최대 흡수**: BRAND_KIT §11 4필드(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§10 피할요소·금지패턴·tokens 색 HEX를 읽어 스타일 파라미터(스타일·굵기·join/cap·코너·라인색·액센트·메타포 모티프·상태 규칙)를 확정한다(추측 없음). **§11 폼 규칙에 박힌 조인/터미널(round/square)·코너·굵기를 그대로 따른다 — 기본 round로 흘려보내지 않는다.** `../references/design/icon/icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`로 보정.
2. **스타일 시드 = `assets/icons/*` 직접.** brand-kit이 만든 개별 투명 아이콘을 가족 앵커로 쓴다(보드 재추출 안 함). 추가 아이콘은 이 앵커를 `--image`로 첨부 + 동일 스타일 파라미터로 생성해 한 가족 유지. 투명 컷아웃은 `--model gpt-image-1.5 --background transparent`.
3. **아이콘 목록 초안 제안**: §1/에센스/도메인(`icon-domain-examples.md` 해당 도메인 섹션) 근거로 기능 아이콘 목록(영어 kebab-case 라벨)을 제안 → 사용자가 추가/제거/직접요청으로 편집한다.
4. `iconset-briefs.md` 작성(시드 출처·읽은 md 근거 요약·확정 목록·스타일 파라미터·상태 아이콘·색·제약).
5. **승인 게이트 (시트 생성 전 필수)**: 시드 + 확정 목록 + 스타일 파라미터를 텍스트로 제시하고 확정. 이미지는 실비가 들고 목록/스타일이 어긋나면 시트를 통째로 날리므로 텍스트 단계에서 잡는다. 승인 전엔 시트를 생성하지 않는다.

### Phase 2 — 라벨 시트 → 확정

> 개별 아이콘 파일(`assets/icons/*` + 본 스킬이 확장한 것)이 1급 자산이다. 라벨 그리드 시트는 **사람이 한눈에 보는 쇼케이스/검수용**이며, 개별 파일을 대체하지 않는다(오버뷰·UI 킷은 개별 파일을 CSS로 배열).

6. **그리드 산정**: 확정 목록 개수 N에 맞춰 열×행을 자동 산정(읽힘 우선, `references/iconset-sheet.md` §3). N이 많아 작아져 안 읽히면 자동 분할(시트 여러 장)하고 사용자에게 알린다.
7. **시트 생성**: `references/iconset-sheet.md` §6 청크의 [브래킷]을 §11/tokens/확정 목록으로 채움(N·COLS·ROWS·label list·rounded/square·코너·스타일·concept→shape 모티프·라인색·액센트 HEX) + `icon-rules.md` §4 Avoid 한 줄. **각 셀 하단에 영어 kebab-case 라벨**, 헤더(브랜드명 + "ICON SET"). brand kit 경로는 **시드를 `--image`로 첨부**(가족 앵커), brand kit 없이 진행하는 경우(Phase 0의 (2))는 `--image` 없이 Q&A 스타일 파라미터를 청크에 채워 텍스트→이미지로 생성. `--model gpt-image-1.5 --background transparent --size 1024x1024`, `--quality low`, `--auto-version` → `iconset-board.png`.
8. **수정 루프**: 사용자가 "N번 아이콘 다시" / "N·M 스타일 안 맞음"이라고 하면 — **직전 시트를 `--image`로 첨부** + 프롬프트엔 번호만(`references/iconset-sheet.md` §5): "이 시트 기준으로 #N만 다시 그리고 나머지 칸·스타일·라벨·번호는 유지 / #M·#K는 같은 가족 안에서 다른 메타포로 대체". 목록 자체를 바꾸려면 라벨 목록을 갱신해 다시 생성. 더 과감한 룩을 원하면 시트 대신 **시드만 첨부**. `--auto-version`. 원하는 결과까지 반복.
9. **자가 테스트** (보여주기 전, `../references/design/icon/icon-rules.md` §5·§3): One-Color Test / Small UI Test / cross-section 일관성(같은 굵기·조인·그리드·메타포 언어·시각 무게). 떨어지면 §1·§2·§6을 보강해 재시도.
10. **확정(복사)**: 확정 시트를 `.design/final/iconset/iconset.png`로 복사. 시안은 `generated/iconset/`에 보존.
11. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 stroke/join/grid/메타포 언어·시각 무게) — `../references/design/icon/icon-rules.md` §3.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6 참고).
- 시트엔 **라벨·헤더만** — 가짜 본문 텍스트·번호 누락/중복·한 칸에 여러 아이콘 금지.
- `icon-rules.md` §4 Avoid 전부: clip-art·일반 스톡 아이콘·세트 내 굵기 불일치·디테일 과밀·클리셰(방패/눈/자물쇠/지구본/톱니)·불필요한 3D/bevel·gradient·drop shadow·섞인 스타일(line/fill/duotone 혼용)·작아지면 안 읽히는 디테일·사진처럼 사실적인 렌더.
- 아이콘 배경은 투명(gpt-image-1.5 `--background transparent`) — gpt-image-2는 투명 미지원이라 불투명 폴백 시에만 사용.
- 권위 원본은 md/tokens — 시드 이미지와 어긋나면 md/tokens가 정답.
