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

- **스타일 시드는 `.design/final/brand-kit/assets/icons/*`의 개별 투명 아이콘을 직접 사용한다**(보드에서 §11 영역을 추출하지 않는다). 투명 컷아웃은 `gpt-image-1.5 --background transparent`로 생성된 것. 해당 아이콘 PNG 중 하나(또는 여러 개 중 가장 대표적인 것)를 `--image`로 첨부해 **가족 룩 앵커**로 쓴다. 시트는 이 룩을 따르는 **새 아이콘 N개**를 한 그리드에 담는다.
- gpt-image-2는 입력을 **항상 high fidelity로 처리**한다(`--input-fidelity` 미지원). 서로 다른 N개 아이콘은 **프롬프트 문구**("이 룩을 따르되 아래 목록의 서로 다른 아이콘을 그린다")로 유도한다 — 시드는 룩 출발점이지 복제 대상이 아니다.
- **시드가 없으면**(brand kit 없이 진행) 시드를 첨부하지 않고, Q&A로 얻은 스타일 파라미터를 §6 청크에 채워 **텍스트→이미지**로 첫 시트를 만든다.

## 5. 셀 참조 = 시트 첨부 + 번호 (말로 번역 금지)

사용자가 칸을 번호로 가리키면(예: "7번 아이콘 다시", "3·9번 스타일 안 맞음"):

- **직전 시트를 `--image`로 첨부**하고, 프롬프트엔 **번호만** 쓴다. 형태를 말로 풀어쓰지 않는다 — 모델이 번호 셀을 직접 본다.
- 가족 일관성을 유지하며 지목 칸만 옮긴다:
  - 방향: `이 시트 기준으로 다시 만들되 #N 아이콘만 <요청>으로 다시 그리고, 나머지 칸·스타일·라벨·번호는 유지한다.`
  - 회피: `#M, #K 아이콘은 같은 가족 안에서 다른 메타포로 대체한다.`
- **목록 자체**를 바꾸려면(아이콘 추가/제거) 라벨 목록을 갱신해 시트를 다시 생성한다.
- 더 과감히 새로운 룩을 원하면 시트 대신 **`assets/icons/*` 시드 아이콘만 첨부**한다.

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
