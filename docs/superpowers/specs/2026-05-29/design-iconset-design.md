# design-iconset 스킬 설계

작성일: 2026-05-29

## 목적

확정된 brand kit를 바탕으로 **아이콘 세트를 한눈에 보는 라벨 그리드 시트 이미지**를 만든다. 각 아이콘 하단에 영어 kebab-case 이름이 붙고, 모든 아이콘이 brand kit의 아이콘 스타일을 충실히 따라 **하나의 가족(one family)** 으로 읽혀야 한다.

`design-logo`의 그리드 보드 흐름(번호 칸, 보드 첨부 후 번호로 가리켜 수정)을 재타겟한다. 단, 핵심 차이가 있다:

- **로고 보드** = 하나의 마크를 40가지로 **발산**.
- **아이콘 시트** = 서로 다른 여러 아이콘이 하나의 고정 스타일로 **수렴**(cross-icon 일관성이 목표).

## 전제

- `design-brand-kit` 산출물(`.design/BRAND_KIT.md`·`.design/brand-tokens.json`·`.design/final/brand-kit/brand-overview.png`)이 있으면 그걸 쓴다.
- **없으면** Phase 0에서 감지해 선택을 제시한다(브랜드 킷 먼저 / 아이콘용 최소 Q&A로 진행) — `design-logo` Phase 0과 동일 패턴.
- 이미지는 공유 `image-gen` 스킬로 생성한다(`OPENAI_API_KEY` 필요; 키를 사전 점검하지 말고 바로 호출 — 부재 시 스크립트가 안내하며 즉시 실패).

## 참조 (이미 존재하는 ref 팩)

`skills/references/design/icon/` — 사용자가 제시한 "Icon System Rules"가 이미 이 4파일로 분할되어 있어 그대로 쓴다:

- `icon-rules.md` — 핵심 원칙 + 시스템 파라미터 + **§6 프롬프트 청크**(N개 아이콘 한 가족) + §3 cross-section 일관성 + §4 Avoid + §5 검증 테스트.
- `icon-style-catalog.md` — 스타일 하나 선택(line/filled/duotone/glyph/+minimal-fill).
- `icon-domain-examples.md` — 도메인별 추상 메타포 모티프.
- `icon-reference-vendors.md` — 눈 보정용(벤더명은 프롬프트·md에 쓰지 않음).

권위 원본은 `BRAND_KIT.md §11`(아이콘 스타일+근거 / 메타포 모티프 / 상태 아이콘 규칙)과 `brand-tokens.json`(색 HEX). icon-rules §0대로 **md/tokens가 이미지보다 우선**한다.

## 입력 파일 (대상 프로젝트 cwd 기준)

Phase 1에서 최대한 흡수한다 — 이미지뿐 아니라 작성된 md도 함께 읽는다.

- `.design/BRAND_KIT.md`
  - **§11** 아이코노그래피 3필드(스타일+근거 / 메타포 모티프 / 상태 아이콘 규칙) — 스타일 파라미터의 권위 소스.
  - **§6** 로고 방향 — 아이콘이 로고보다 튀지 않게.
  - **§1·에센스·타깃** — 아이콘 목록 제안 근거.
  - **§10** 비주얼/UI 방향 — 피해야 할 시각 요소.
  - **금지 패턴** 섹션.
- `.design/brand-tokens.json` — 색 HEX(라인색·액센트).
- `.design/final/brand-kit/brand-overview.png` — §11 Imagery/Iconography 영역 = **스타일 시드 출처**.

> brand kit가 없으면 위 입력 대신 Phase 0의 아이콘 Q&A로 최소 정보를 모은다 — 시드 이미지가 없으므로 첫 시트는 텍스트→이미지로 만든다.

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/generated/iconset/style-seed.png` — 추출한 아이콘 스타일 시드(클린 단색 배경).
- `.design/generated/iconset/iconset-board.png` (+`-v2`…) — 라벨 그리드 시트 시안(누적, 덮지 않음).
- `.design/final/iconset/iconset.png` — 확정 시트.
- `.design/image-briefs/iconset-briefs.md` — 시드 출처·**읽은 md 근거 요약**·확정 아이콘 목록·스타일 파라미터·상태 아이콘·색·제약 로그.

시안은 `generated/iconset/`에 `--auto-version`으로 누적. 확정본만 `final/iconset/`로 복사한다.

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`. `design-logo`와 동일 규약:

- **모델·배경**: 기본 `gpt-image-2` + 클린 단색 배경("plain near-white/near-black background, no scenery"). 투명 미지원.
- **충실도(고정)**: `--image`는 항상 high fidelity(`--input-fidelity` 미지원). 보존/참고는 프롬프트 문구로 표현.
- **셀 참조 = 보드 첨부 + 번호**: 사용자가 "N번"으로 가리키면 해당 시트를 `--image`로 첨부하고 프롬프트엔 번호만. 형태를 말로 번역하지 않는다.
- **버전 보존**: 모든 재생성은 `--auto-version`.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 시트 프롬프트는 `icon-rules.md §6` 청크의 [브래킷]을 §11/tokens로 채우고 §4 Avoid를 한 줄로 붙인 뒤 라벨/헤더 레이아웃 지시를 더한다.

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)

- `.design/BRAND_KIT.md`와 `.design/final/brand-kit/brand-overview.png` 존재를 확인한다.
- **있으면** → Phase 1.
- **없으면** → 두 길을 제시하고 고르게 한다:
  - **(1) 브랜드 킷 먼저** — "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·아이콘 스타일·모티프까지 갖춰 근거가 탄탄)". 고르면 design-brand-kit 안내하고 종료.
  - **(2) 아이콘용 최소 Q&A** — 여기서 바로 진행. 한 번에 하나씩 묻는다: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`icon-style-catalog.md` 참고) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지. 수집분을 `iconset-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). **시드 추출(Phase 1 2단계)은 건너뛰고** Phase 2의 시트 생성을 **텍스트→이미지**(시드 미첨부)로 한다. 끝에 design-brand-kit을 안내.

### Phase 1 — md+이미지 흡수 → 시드 → 목록 → 승인 게이트 (brand kit가 있을 때)

1. **md/tokens 최대 흡수**: §11 3필드·§6·§1/에센스·§10 피할요소·금지패턴·tokens 색 HEX를 읽어 스타일 파라미터를 확정한다(추측 없음).
2. **스타일 시드 추출**: `--image <brand-overview.png>` + 프롬프트 "이 보드의 아이코노그래피(아이콘) 부분만 깨끗이 재현, 같은 스타일의 아이콘 몇 개만, plain near-white 단색 배경(no scenery), 보드의 텍스트·다른 섹션 제외" → `style-seed.png`(`--quality low`). 보여주고 "이 아이콘 룩 맞아요?" 확인.
3. **아이콘 목록 초안 제안**: §1/에센스/도메인(`icon-domain-examples.md`의 해당 도메인 섹션) 근거로 기능 아이콘 목록(영어 kebab-case 라벨)을 제안 → 사용자가 추가/제거/직접요청으로 편집.
4. `iconset-briefs.md` 작성(시드 출처·읽은 md 근거 요약·목록·스타일 파라미터·상태 아이콘·색·제약).
5. **승인 게이트 (시트 생성 전 필수)**: 시드 + 확정 목록 + 스타일 파라미터를 텍스트로 제시·확정. 이미지는 실비가 들고 목록/스타일이 어긋나면 시트를 통째로 날리므로 텍스트 단계에서 잡는다. 승인 전엔 시트를 생성하지 않는다.

### Phase 2 — 라벨 시트 → 확정

6. **그리드 산정**: 확정 목록 개수 N에 맞춰 열×행을 자동 산정(읽힘 우선). N이 많아 작아져 안 읽히면 자동 분할(시트 여러 장)하거나 사용자에게 알린다.
7. **시트 생성**: `icon-rules.md §6` 청크의 [브래킷]을 §11/tokens로 채움(N·rounded/square·코너 반경·스타일·concept→shape 모티프·라인색·액센트 HEX) + §4 Avoid 한 줄. **각 셀 하단에 영어 kebab-case 라벨**, 헤더(브랜드명 + "ICON SET"). **시드를 `--image`로 첨부**(가족 앵커). `--auto-version`. brand kit 없이 진행한 경우(Phase 0의 (2))는 `--image` 없이 Q&A 모티프를 청크에 채워 텍스트→이미지로 생성.
8. **수정 루프**: 사용자가 "N번 아이콘 다시" / "N·M 스타일 안 맞음"이라고 하면 — **직전 시트를 `--image`로 첨부** + 프롬프트엔 번호만. 가족 일관성을 유지하며 지목한 칸만 옮긴다. 더 과감한 결과를 원하면 시트 대신 **시드만 첨부**. `--auto-version`. 원하는 결과가 나올 때까지 반복.
9. **자가 테스트** (보여주기 전, `icon-rules.md` §5·§3): One-Color Test / Small UI Test / cross-section 일관성(같은 굵기·조인·그리드·메타포 언어·시각 무게). 떨어지면 §1·§2·§6을 보강해 재시도.
10. **확정(복사)**: 확정 시트를 `.design/final/iconset/iconset.png`로 복사. 시안은 `generated/iconset/`에 보존.
11. **다음 단계 안내**: `design-page-image` 또는 `design-md-compiler`.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 stroke/join/grid/메타포 언어·시각 무게) — `icon-rules.md` §3.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6 참고).
- 시트엔 **라벨·헤더만** — 가짜 본문 텍스트·번호 누락/중복·한 칸에 여러 아이콘 금지.
- `icon-rules.md` §4 Avoid 전부: clip-art·일반 스톡 아이콘·세트 내 굵기 불일치·디테일 과밀·클리셰(방패/눈/자물쇠/지구본/톱니)·불필요한 3D/bevel·gradient·drop shadow·섞인 스타일(line/fill/duotone 혼용)·작아지면 안 읽히는 디테일·사진처럼 사실적인 렌더.
- 배경은 클린 단색(투명 아님) — gpt-image-2 제약.
- 권위 원본은 md/tokens — 시드 이미지와 어긋나면 md/tokens가 정답.

## 파일 구성 (스킬 자체)

- `skills/design-iconset/SKILL.md` — 위 흐름.
- 별도 보드 레이아웃 ref가 필요하면 `skills/design-iconset/references/iconset-sheet.md`로 분리(라벨 그리드 레이아웃·셀 참조·수정 스티어링). `design-logo`가 `references/logo-exploration-board.md`를 두는 패턴과 동일. 아이콘 형태·시스템 규칙은 공유 `../references/design/icon/` 팩을 그대로 끌어 쓴다.
- 추가·수정 후 `npm run sync`로 Codex 번들(`plugins/personal/`) 재생성(로컬 생성물 — 커밋 안 함).
</content>
</invoke>
