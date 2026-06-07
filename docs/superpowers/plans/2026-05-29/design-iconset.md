# design-iconset 스킬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 확정된 brand kit를 바탕으로 각 아이콘 하단에 영어 kebab-case 라벨이 붙은 **아이콘 세트 그리드 시트 이미지**를 만드는 `design-iconset` 스킬을 추가한다.

**Architecture:** 신규 `skills/design-iconset/`는 (Phase 0) brand kit 감지/없으면 Q&A 폴백 → (Phase 1) md/tokens 최대 흡수 + brand-overview §11 아이코노그래피에서 스타일 시드 추출 + 목록 제안 + 승인 게이트 → (Phase 2) 라벨 그리드 시트 생성 → 시트 첨부 + 셀 번호로 수정 → `.design/final/iconset/iconset.png` 확정. `design-logo` 흐름을 아이콘용으로 재타겟하되, 로고 보드(한 마크 40변주·발산)와 달리 시트는 **서로 다른 여러 아이콘이 한 스타일로 수렴**(cross-icon 일관성)한다. 시트 레이아웃 지식은 스킬 폴더 내부 `references/iconset-sheet.md`, 아이콘 형태·시스템 규칙은 공유 `../references/design/icon/` 팩을 재사용한다. **전부 기본 모델 gpt-image-2 + 클린 단색 배경**으로 생성하므로 `image-gen.mjs`는 손대지 않는다.

**Tech Stack:** 마크다운 스킬/레퍼런스, 공유 `image-gen` 스킬(`gpt-image-2`, OpenAI Images API), `npm run sync`(Codex 번들), node:test(회귀).

**Spec:** `docs/superpowers/specs/2026-05-29/design-iconset-design.md`

---

## File Structure

| 파일 | 역할 | 작업 |
|---|---|---|
| `skills/design-iconset/references/iconset-sheet.md` | 라벨 아이콘 시트 레이아웃·그리드 산정·셀 참조·수정 스티어링·시트 프롬프트 청크 | Create |
| `skills/design-iconset/SKILL.md` | design-iconset 스킬 본문(전제·입출력·이미지 생성·Phase 0–2 흐름·품질/금지) | Create |

> **`design-brand-kit`·`image-gen.mjs`·`references/design/icon/` 팩은 변경하지 않는다.** brand-kit §11이 이미 아이콘 결정의 권위 소스로 배선돼 있고(commit f22cc2c), 아이콘 ref 팩 4파일도 이미 존재한다(commit 46aba57). design-iconset은 그것들을 *읽기*만 한다.
>
> 커밋 정책: `commit` 스킬을 사용. Codex 번들 `plugins/personal/`·`codex-agents/`는 gitignore된 로컬 생성물이라 커밋하지 않는다. 명령 실행(`npm test`·`npm run sync`)과 커밋은 **사용자 승인 후** 진행(CLAUDE.md).

---

## Task 1: iconset-sheet.md 레퍼런스 작성

**Files:**
- Create: `skills/design-iconset/references/iconset-sheet.md`

- [ ] **Step 1: 파일 작성**

Create `skills/design-iconset/references/iconset-sheet.md`:

````markdown
# 아이콘 세트 시트 아트 디렉션

## 0. 목적 / 사용법

`design-iconset`이 **라벨 아이콘 세트 시트**를 생성할 때 읽는 시트 전용 아트 디렉션이다. 아이콘 형태·시스템 규칙·스타일 선택·도메인 모티프·Avoid·검증 테스트는 공유 ref 팩 `../../references/design/icon/`(`icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`·`icon-reference-vendors.md`)을 따르고, 이 문서는 **시트 레이아웃·라벨·그리드 산정·셀 참조·수정 스티어링**만 다룬다.

목표 품질: "랜덤 AI 아이콘 모음"이 아니라 **진지한 디자인 시스템의 한 가족(one family)으로 읽히는 라벨 아이콘 시트**.

**핵심 차이(로고 보드와):** 로고 탐색 보드는 한 마크를 40가지로 **발산**한다. 아이콘 시트는 서로 다른 여러 아이콘이 하나의 고정 스타일로 **수렴**한다 — cross-icon 일관성이 전부다.

## 1. 시트 레이아웃

- **캔버스**: 정사각 기본(`--size 1024x1024`). 아이콘이 많으면 더 큰 정사각.
- **번호 + 라벨 그리드** — 각 칸 좌상단에 작은 인덱스 번호(`01`–), 칸 **하단에 영어 kebab-case 라벨**(예: `leak-detection`). 수정 시 사용자가 번호로 가리킨다.
- 칸 사이 얇은 디바이더, 넉넉한 거터, 균일한 셀 크기, 절제된 밀도.
- 아이콘이 라벨을 침범하지 않게 셀 하단에 라벨 영역을 확보한다.
- **헤더**: 브랜드명 + "ICON SET" + 한 줄 라벨.
- 라이트/다크 캔버스는 브랜드 비주얼 모드(BRAND_KIT)에 맞춘다.

## 2. 가족 일관성 (전 칸 동일 규칙)

`icon-rules.md` §2·§3을 시트 전체에 강제한다 — 개별 아이콘이 예뻐도 규칙이 어긋나면 가족이 아니다:

- **같은 스트로크 굵기**(optically ~1.75–2px), **같은 join/cap**, **같은 그리드/키라인**(24px artboard), **같은 코너 반경**, **같은 시각 무게·밀도**.
- **하나의 스타일** — `BRAND_KIT.md §11`에서 확정한 line / filled / duotone / solid-glyph / outline+minimal-fill 중 하나. 섞지 않는다.
- **같은 메타포 언어** — 전부 기하 / 전부 흐름 등 하나로 통일.
- **상태 아이콘**(success / warning / danger)은 구성(형태·굵기·그리드) 동일, **액센트 색만 분기**.

## 3. 그리드 산정 (개수 N에 맞춰 자동 1장)

- 확정 목록 개수 N을 한 장에 읽히게 담는 열×행을 정사각에 가깝게 산정한다 — 예: N=12 → 4×3, N=16 → 4×4, N=20 → 5×4, N=24 → 6×4.
- 너무 빽빽해 작은 크기에서 안 읽히면(대략 **28개 초과** 권장 상한) **자동 분할**한다: 기능 그룹/알파벳 순으로 시트를 나눠 별도 시트로 생성하고 사용자에게 알린다(`-v2` 버전 누적이 아니라 별도 시트).

## 4. 스타일 시드 사용

- 시드 PNG(`style-seed.png` — `brand-overview.png`의 §11 아이코노그래피 영역에서 추출, 클린 단색 배경)를 `--image`로 첨부해 **가족 룩 앵커**로 쓴다. 시트는 이 룩을 따르는 **새 아이콘 N개**를 한 그리드에 담는다.
- gpt-image-2는 입력을 **항상 high fidelity로 처리**한다(`--input-fidelity` 미지원). 서로 다른 N개 아이콘은 **프롬프트 문구**("이 룩을 따르되 아래 목록의 서로 다른 아이콘을 그린다")로 유도한다 — 시드는 룩 출발점이지 복제 대상이 아니다.
- **시드가 없으면**(brand kit 없이 진행) 시드를 첨부하지 않고, Q&A로 얻은 스타일 파라미터를 §6 청크에 채워 **텍스트→이미지**로 첫 시트를 만든다.

## 5. 셀 참조 = 시트 첨부 + 번호 (말로 번역 금지)

사용자가 칸을 번호로 가리키면(예: "7번 아이콘 다시", "3·9번 스타일 안 맞음"):

- **직전 시트를 `--image`로 첨부**하고, 프롬프트엔 **번호만** 쓴다. 형태를 말로 풀어쓰지 않는다 — 모델이 번호 셀을 직접 본다.
- 가족 일관성을 유지하며 지목 칸만 옮긴다:
  - 방향: `이 시트 기준으로 다시 만들되 #N 아이콘만 <요청>으로 다시 그리고, 나머지 칸·스타일·라벨·번호는 유지한다.`
  - 회피: `#M, #K 아이콘은 같은 가족 안에서 다른 메타포로 대체한다.`
- **목록 자체**를 바꾸려면(아이콘 추가/제거) 라벨 목록을 갱신해 시트를 다시 생성한다.
- 더 과감히 새로운 룩을 원하면 시트 대신 **시드(`style-seed.png`)만 첨부**한다.

## 6. 시트 프롬프트 청크 (그대로 떠넣기)

`icon-rules.md` §6 청크를 라벨 그리드 레이아웃으로 확장한 형태다:

```text
Create a square "Icon Set" sheet for "[BRAND NAME]" — a cohesive icon family that reads as ONE design system, NOT a random icon pack.

Layout: a clean grid of [N] icons, [COLS] columns x [ROWS] rows, each cell with a small index number in the corner and an English kebab-case label centered below the icon (labels in order: [label list]). Thin dividers, generous gutters, even cell sizes, restrained density. Header: "[BRAND NAME] / ICON SET". [light/dark] canvas per brand.
System (apply to EVERY icon identically): consistent stroke weight (optically ~[1.75-2]px), [rounded/square] joins and terminals, aligned to a shared 24px grid/keyline, balanced optical sizing, [~2px] corners, [line / filled / duotone / solid-glyph / outline+minimal-fill] style, one calm consistent tone — all icons one family.
Each icon maps its label to a clear form: [concept->shape pairs from BRAND_KIT.md §11 motifs]. Symbolic, not literal; one consistent metaphor language; legible at small UI size; valid in solid monochrome.
State icons (success/warning/danger) share the same construction; differ only by accent color.
Color: line/glyph in [text/HEX], single accent [HEX] used sparingly.
Avoid: clip-art, generic stock icons, mismatched stroke weights, overcrowding, cliché shields/eyes/locks/globes/gears, unrelated imagery, 3D, gradients, drop shadows, mixed styles, illegible tiny detail, photorealistic devices, missing/duplicate numbers or labels.
```

위 [브래킷]은 `BRAND_KIT.md §11`/`brand-tokens.json`/확정 목록에서 채운다(N·COLS·ROWS·label list·rounded/square·코너 반경·스타일·concept→shape 모티프·라인색·액센트 HEX). 수정 재생성 시에는 위 청크에 §5 스티어링 델타("#N만 다시 / #M·#K 대체")를 더하고 직전 시트를 `--image`로 첨부한다.

## 7. 금지 사항

- 칸마다 다른 스타일/굵기 난립(가족 상실), 번호·라벨 누락/중복/뒤섞임, 한 칸에 여러 아이콘.
- 라벨이 영어 kebab-case가 아니거나 아이콘 의미와 어긋남.
- 읽히지 않는 미세 디테일, 빽빽한 밀도, 가짜 본문 텍스트.
- `icon-rules.md` §4 Avoid 전부(클리셰 방패/눈/자물쇠/지구본/톱니, 3D·gradient·drop shadow, 섞인 스타일, 사진풍 디바이스).
````

- [ ] **Step 2: 상대경로 검증**

`skills/design-iconset/references/iconset-sheet.md` 기준 `../../references/design/icon/` 팩 4파일이 실재하는지 확인.

Run (Glob): `skills/references/design/icon/*.md`
Expected: `icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`·`icon-reference-vendors.md` 4건 일치.

- [ ] **Step 3: 커밋** (*사용자 승인 후*)

```bash
git add skills/design-iconset/references/iconset-sheet.md
git commit -m "docs(design-iconset): 라벨 아이콘 시트 레퍼런스 추가"
```

---

## Task 2: design-iconset SKILL.md 작성

**Files:**
- Create: `skills/design-iconset/SKILL.md`

- [ ] **Step 1: 파일 작성**

Create `skills/design-iconset/SKILL.md`:

````markdown
---
name: design-iconset
description: 확정된 brand kit를 바탕으로 아이콘 세트를 한눈에 보는 라벨 그리드 시트 이미지를 만드는 스킬. BRAND_KIT.md §11(아이콘 스타일·메타포·상태 규칙)·tokens·brand-overview 보드를 읽어 아이콘 스타일 시드를 추출하고, 필요한 아이콘 목록을 제안·확정한 뒤, 각 아이콘 하단에 영어 kebab-case 라벨이 붙은 정사각 Icon Set 시트를 만든다. 시트를 첨부하고 셀 번호로 가리켜 수정해 모든 아이콘이 한 가족으로 읽히게 좁히고, 확정 시트를 .design/final/iconset/에 저장할 때 사용한다.
---

# Design Iconset

당신은 확정된 브랜드 킷에서 출발해 **하나의 일관된 아이콘 언어**를 만드는 디자인 시스템 디자이너다.

## 목적

`design-brand-kit`(과 보통 `design-logo`)이 확정된 뒤 사용한다. brand kit의 §11 아이코노그래피는 스타일·모티프·상태 규칙을 한 줄씩만 박아둔 결정이므로, 여기서 그 결정을 따라 **제품에서 실제로 쓸 아이콘 세트**를 한 장의 시트로 그려낸다. 각 아이콘 하단에 영어 kebab-case 라벨이 붙고, 사용자가 번호로 칸을 고치며 좁힌다. 품질 기준은 "랜덤 AI 아이콘"이 아니라 **하나의 가족(one family)으로 읽히는 아이콘 세트**다 — cross-icon 일관성이 전부다. 아이콘 형태·시스템 규칙은 `../references/design/icon/` 팩, 시트 레이아웃은 `references/iconset-sheet.md`를 따른다.

**로고와 다르다:** 로고는 기억되는 한 개의 마크(발산 탐색), 아이콘은 같은 규칙으로 묶인 여러 신호(수렴 일관성)다. 아이콘은 로고보다 튀면 안 된다.

## 전제

- `design-brand-kit` 산출물(`.design/BRAND_KIT.md`·`.design/brand-tokens.json`·`.design/final/brand-kit/brand-overview.png`)이 있으면 그걸 쓴다. **없으면 흐름 Phase 0에서 감지해 선택을 제시**한다(브랜드 킷 먼저 만들기 / 아이콘용 최소 Q&A로 바로 진행).
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패). 키가 없으면 사람이 직접 드롭하는 폴백.

## 입력 파일 (대상 프로젝트 cwd 기준)

Phase 1에서 **이미지뿐 아니라 작성된 md도 최대한 흡수**한다. 권위 원본은 md/tokens — 시드 이미지와 어긋나면 md/tokens가 정답이다(`icon-rules.md` §0).

- `.design/BRAND_KIT.md` — **§11** 아이코노그래피(아이콘 스타일+근거 / 메타포 모티프 / 상태 아이콘 규칙) · **§6** 로고 방향(로고보다 안 튀게) · **§1·에센스·타깃**(아이콘 목록 제안 근거) · **§10** 비주얼/UI(피할 시각 요소) · **금지 패턴**.
- `.design/brand-tokens.json` — 색 HEX(라인색·액센트).
- `.design/final/brand-kit/brand-overview.png` — §11 Imagery/Iconography 영역 = 스타일 시드 출처.

> brand kit가 **없으면** 위 입력 대신 Phase 0의 아이콘 Q&A로 최소 정보를 모은다 — 시드 이미지가 없으므로 첫 시트는 텍스트→이미지로 만든다.

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/generated/iconset/style-seed.png` — 추출한 아이콘 스타일 시드(클린 단색 배경).
- `.design/generated/iconset/iconset-board.png` (+`-v2`…) — 라벨 그리드 시트 시안(누적, 덮지 않음).
- `.design/final/iconset/iconset.png` — 확정 시트.
- `.design/image-briefs/iconset-briefs.md` — 시드 출처·읽은 md 근거 요약·확정 아이콘 목록·스타일 파라미터·상태 아이콘·색·제약 로그.

시안은 `generated/iconset/`에 `--auto-version`으로 누적한다. 확정본만 `final/iconset/`로 복사한다.

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 전부 기본 `gpt-image-2` + **클린 단색 배경**으로 생성한다. gpt-image-2는 투명 배경을 지원하지 않으므로 투명은 쓰지 않고, 배경은 프롬프트로 "plain near-white/near-black background, no scenery"라고 지시한다.
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
    --auto-version --size 1024x1024 --quality low --model gpt-image-2
  ```

## 흐름 (디자이너 협업 루프)

### Phase 0 — brand kit 감지 (시작 시 필수)
- `.design/BRAND_KIT.md`와 `.design/final/brand-kit/brand-overview.png` 존재를 확인한다.
- **있으면** → Phase 1로.
- **없으면** → 두 길을 제시하고 고르게 한다:
  - **(1) 브랜드 킷 먼저** — "design-brand-kit으로 브랜드 킷부터 만들까요? (권장 — 색·아이콘 스타일·모티프까지 갖춰 근거가 탄탄)". 고르면 design-brand-kit을 안내하고 종료.
  - **(2) 아이콘용 최소 Q&A** — 여기서 바로 진행. 한 번에 하나씩 묻는다: 제품명·한 줄 소개 / 분야 / 아이콘 스타일 방향(`../references/design/icon/icon-style-catalog.md` 참고) / 도메인 메타포 모티프 / 색(HEX 또는 방향) / 상태 아이콘 필요 여부 / 아이콘 목록 초안 / 피할 클리셰. 추측 금지 — 답으로 스타일·모티프·색·목록을 정할 수 있을 때까지 파고든다. 수집분을 `iconset-briefs.md`에 적는다(가짜 `BRAND_KIT.md`를 만들지 않음). **시드 추출(Phase 1 2단계)은 건너뛰고** Phase 2의 시트 생성을 **텍스트→이미지**(시드 미첨부)로 한다. 끝에 design-brand-kit을 안내.

### Phase 1 — md+이미지 흡수 → 시드 → 목록 → 승인 게이트 (brand kit가 있을 때)
1. **md/tokens 최대 흡수**: BRAND_KIT §11 3필드·§6·§1/에센스·§10 피할요소·금지패턴·tokens 색 HEX를 읽어 스타일 파라미터(스타일·굵기·join/cap·코너·라인색·액센트·메타포 모티프·상태 규칙)를 확정한다(추측 없음). `../references/design/icon/icon-rules.md`·`icon-style-catalog.md`·`icon-domain-examples.md`로 보정.
2. **스타일 시드 추출**: `--image <brand-overview.png>` + 프롬프트 "이 브랜드 보드의 아이코노그래피(아이콘) 부분만 깨끗이 재현, 같은 스타일의 아이콘 몇 개만, plain near-white 단색 배경(no scenery), 보드의 텍스트·다른 섹션 제외" → `.design/generated/iconset/style-seed.png`(gpt-image-2, `--quality low`). 보여주고 "이 아이콘 룩 맞아요?" 확인.
3. **아이콘 목록 초안 제안**: §1/에센스/도메인(`icon-domain-examples.md` 해당 도메인 섹션) 근거로 기능 아이콘 목록(영어 kebab-case 라벨)을 제안 → 사용자가 추가/제거/직접요청으로 편집한다.
4. `iconset-briefs.md` 작성(시드 출처·읽은 md 근거 요약·확정 목록·스타일 파라미터·상태 아이콘·색·제약).
5. **승인 게이트 (시트 생성 전 필수)**: 시드 + 확정 목록 + 스타일 파라미터를 텍스트로 제시하고 확정. 이미지는 실비가 들고 목록/스타일이 어긋나면 시트를 통째로 날리므로 텍스트 단계에서 잡는다. 승인 전엔 시트를 생성하지 않는다.

### Phase 2 — 라벨 시트 → 확정
6. **그리드 산정**: 확정 목록 개수 N에 맞춰 열×행을 자동 산정(읽힘 우선, `references/iconset-sheet.md` §3). N이 많아 작아져 안 읽히면 자동 분할(시트 여러 장)하고 사용자에게 알린다.
7. **시트 생성**: `references/iconset-sheet.md` §6 청크의 [브래킷]을 §11/tokens/확정 목록으로 채움(N·COLS·ROWS·label list·rounded/square·코너·스타일·concept→shape 모티프·라인색·액센트 HEX) + `icon-rules.md` §4 Avoid 한 줄. **각 셀 하단에 영어 kebab-case 라벨**, 헤더(브랜드명 + "ICON SET"). brand kit 경로는 **시드를 `--image`로 첨부**(가족 앵커), brand kit 없이 진행하는 경우(Phase 0의 (2))는 `--image` 없이 Q&A 스타일 파라미터를 청크에 채워 텍스트→이미지로 생성. `--size 1024x1024`, `--quality low`, `--auto-version` → `iconset-board.png`.
8. **수정 루프**: 사용자가 "N번 아이콘 다시" / "N·M 스타일 안 맞음"이라고 하면 — **직전 시트를 `--image`로 첨부** + 프롬프트엔 번호만(`references/iconset-sheet.md` §5): "이 시트 기준으로 #N만 다시 그리고 나머지 칸·스타일·라벨·번호는 유지 / #M·#K는 같은 가족 안에서 다른 메타포로 대체". 목록 자체를 바꾸려면 라벨 목록을 갱신해 다시 생성. 더 과감한 룩을 원하면 시트 대신 **시드만 첨부**. `--auto-version`. 원하는 결과까지 반복.
9. **자가 테스트** (보여주기 전, `../references/design/icon/icon-rules.md` §5·§3): One-Color Test / Small UI Test / cross-section 일관성(같은 굵기·조인·그리드·메타포 언어·시각 무게). 떨어지면 §1·§2·§6을 보강해 재시도.
10. **확정(복사)**: 확정 시트를 `.design/final/iconset/iconset.png`로 복사. 시안은 `generated/iconset/`에 보존.
11. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image` 또는 `design-md-compiler`"**.

## 품질 기준 / 금지 사항

- 모든 아이콘이 **한 가족으로 읽혀야** 한다(같은 stroke/join/grid/메타포 언어·시각 무게) — `../references/design/icon/icon-rules.md` §3.
- **로고보다 과하게 튀지 않게** (BRAND_KIT §6 참고).
- 시트엔 **라벨·헤더만** — 가짜 본문 텍스트·번호 누락/중복·한 칸에 여러 아이콘 금지.
- `icon-rules.md` §4 Avoid 전부: clip-art·일반 스톡 아이콘·세트 내 굵기 불일치·디테일 과밀·클리셰(방패/눈/자물쇠/지구본/톱니)·불필요한 3D/bevel·gradient·drop shadow·섞인 스타일(line/fill/duotone 혼용)·작아지면 안 읽히는 디테일·사진처럼 사실적인 렌더.
- 배경은 클린 단색(투명 아님) — gpt-image-2 제약.
- 권위 원본은 md/tokens — 시드 이미지와 어긋나면 md/tokens가 정답.
````

- [ ] **Step 2: 상대경로 검증**

`skills/design-iconset/SKILL.md` 기준 다음 경로가 실재하는지 확인:
- `references/iconset-sheet.md` → `skills/design-iconset/references/iconset-sheet.md` ✓ (Task 1에서 생성)
- `../references/design/icon/icon-rules.md` 등 → `skills/references/design/icon/*.md` ✓ (기존)
- `../image-gen/scripts/image-gen.mjs` → `skills/image-gen/scripts/image-gen.mjs` ✓ (기존)

Run (Glob): `skills/references/design/icon/icon-style-catalog.md` 와 `skills/image-gen/scripts/image-gen.mjs` 가 존재하는지.
Expected: 둘 다 일치.

- [ ] **Step 3: 커밋** (*사용자 승인 후*)

```bash
git add skills/design-iconset/SKILL.md
git commit -m "feat(design-iconset): 아이콘 세트 라벨 시트 생성 스킬 추가"
```

---

## Task 3: 동기화 + 전체 검증

**Files:** (소스 변경 없음 — 번들 재생성·검증)

- [ ] **Step 1: Codex 번들 재생성** (*사용자 승인 후*)

Run: `npm run sync`
Expected: 성공. `plugins/personal/skills/design-iconset/`(+`references/`)가 번들에 반영된다. (번들은 gitignore — 커밋하지 않음.)

- [ ] **Step 2: 번들 확인**

Run (Glob): `plugins/personal/skills/design-iconset/**`
Expected: `SKILL.md`와 `references/iconset-sheet.md`가 복사돼 있음.

- [ ] **Step 3: 전체 테스트** (*사용자 승인 후*)

Run: `npm test`
Expected: 전체 PASS. (소스 변경이 마크다운뿐이라 코드 테스트에 영향 없음. sync-codex-plugin 테스트는 합성 임시 디렉터리만 쓰므로 새 스킬 폴더로 깨지지 않음.)

- [ ] **Step 4: (선택) 실효 검증 — API 비용**

키가 있고 사용자가 원하면, 실제 `.design/final/brand-kit/brand-overview.png`(또는 가짜 테스트 브랜드 보드 + 임시 BRAND_KIT.md §11)로 Phase 1–2 한 사이클(시드 추출 → 라벨 시트 1장, `--quality low`)을 돌려 흐름이 실제로 도는지 본다. **API 호출 직전 사용자 확인 후 실행.**

---

## Self-Review

**1. Spec coverage** (spec 섹션 대조):
- 목적(라벨 그리드 시트·영어 kebab-case·한 가족) → Architecture + Task 2 목적/품질 절. ✓
- 전제(brand kit 있으면 사용·없으면 Phase 0) → Task 2 전제 + Phase 0. ✓
- 참조(icon/ 팩 4파일 재사용, 변경 안 함) → File Structure 주석 + Task 1/2 경로. ✓
- 입력(§11·§6·§1·§10·금지패턴·tokens·brand-overview, md 우선) → Task 2 입력 파일 절. ✓
- 출력(style-seed/iconset-board/final iconset/iconset-briefs) → Task 2 출력 파일 절. ✓
- 이미지 생성(gpt-image-2·클린 단색·high fidelity·셀 참조·auto-version·prompt-file) → Task 2 이미지 생성 절. ✓
- Phase 0(감지/2길 Q&A) → Task 2 Phase 0. ✓
- Phase 1(md 흡수→시드→목록→게이트) → Task 2 Phase 1. ✓
- Phase 2(그리드 산정→시트→수정→자가테스트→확정→다음 안내) → Task 2 Phase 2. ✓
- 품질/금지 → Task 2 품질 절 + Task 1 §7. ✓
- 스킬 파일 구성(SKILL.md + references/iconset-sheet.md + sync) → Task 1·2·3. ✓

**2. Placeholder scan:** `[BRAND NAME]`·`[N]`·`[COLS]`·`[label list]`·`[concept->shape pairs]`·`<요청>`·`<cwd>`·`<제품명>`은 프롬프트/명령 템플릿의 의도된 런타임 치환 변수(스킬이 BRAND_KIT/tokens/목록으로 채움)이며 미완성 플랜 항목이 아니다. TBD/TODO 없음. Task 1·2 모두 완전한 파일 본문을 포함.

**3. Type/이름 일관성:** 파일명·경로가 태스크 간 일치 — `style-seed.png`·`iconset-board.png`·`final/iconset/iconset.png`·`iconset-briefs.md`·`references/iconset-sheet.md`. SKILL.md가 가리키는 `references/iconset-sheet.md`의 §3(그리드 산정)·§5(셀 참조)·§6(프롬프트 청크) 번호가 Task 1 파일의 실제 섹션 번호와 일치. 전 단계가 `gpt-image-2` + 클린 단색 배경으로 일관(image-gen 미변경).

> 주의(동시 세션): 신규 파일만 생성하므로 기존 파일 매칭 충돌은 없다. 단 `skills/design-brand-kit/SKILL.md`가 다른 세션에서 수정 중일 수 있으니(현재 워킹트리에 M 표시), §11 필드명을 인용할 때는 생성 시점의 현재 문구를 확인한다.
