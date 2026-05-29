# 아이콘 규칙 (Icon Rules · 생성용 렌더 백본)

## 0. 목적 / 사용법

이 문서는 아이콘 ref 팩의 **렌더 백본**이다. `design-brand-kit` 보드의 아이콘(에센스·타깃·가치 등 섹션 아이콘 + Imagery/Iconography 세트)과 미래 아이콘 작업이 읽는 공유 ref로, 추상 디자인 이론이 아니라 **이미지 모델이 바로 그릴 수 있는 구체적·렌더 가능한 시스템 지시**만 담는다. 목표 품질은 "랜덤 AI 아이콘"이 아니라 **진지한 디자인 시스템의 한 가족(one family)으로 읽히는 아이콘 세트**다. 아이콘은 로고와 다른 분야다 — 로고는 한 개의 기억되는 마크, 아이콘은 같은 규칙으로 묶인 여러 개의 일관된 신호다.

권위 원본(정확한 색·HEX·문구)은 `BRAND_KIT.md`/`brand-tokens.json`이고, 이 문서는 **아이콘 형태·시스템 규칙**을 정의한다. 둘이 어긋나면 md/tokens가 정답이다.

**팩 사용 순서:** ① 이 문서로 핵심 원칙·시스템 파라미터를 고정 → ② `icon-style-catalog.md`에서 브랜드 성격에 맞는 스타일 하나를 고르고 → ③ `icon-domain-examples.md`에서 프로젝트 도메인 섹션만 읽어 메타포 모티프를 끌어오고 → ④ (선택) `icon-reference-vendors.md`로 눈을 보정하고(벤더명은 프롬프트에 쓰지 않음) → ⑤ 아래 §6 프롬프트 청크의 [브래킷]을 `BRAND_KIT.md §11`로 채워 떠넣는다.

## 1. 핵심 원칙 (범용)

- 하나의 아이콘 세트는 **하나의 시각 언어**에서 나와야 한다.
- 브랜드 성격에 맞는 아이콘 스타일을 **먼저 선택**한다(`icon-style-catalog.md`).
- line / fill / duotone / glyph / illustrative 중 **하나를 기본 스타일로 정한다**.
- 같은 세트 안에서 스타일을 무작위로 섞지 않는다.
- 아이콘은 기능을 설명하되 **유치하게 직역하지 않는다**.
- 작은 크기에서도 의미가 읽혀야 한다.
- **로고보다 튀면 안 된다.**
- 무료 아이콘팩을 그대로 붙인 것처럼 보이면 안 된다.

## 2. 시스템 파라미터

세트 전체에 **한 번 정하고 끝까지 고정**하는 렌더 가능한 규칙들.

- **일관된 스트로크 굵기** — 모든 아이콘이 광학적으로 동일한 선 굵기(optically ~1.75–2px). 큰 도형이라고 굵게, 작은 디테일이라고 가늘게 가지 않는다. "consistent stroke weight across the whole set."
- **조인 & 터미널 스타일** — round join + round cap **또는** square/miter join + butt cap 중 **하나만 골라 전 세트에 통일**. 섞지 않는다. (친근·소프트면 rounded, 정밀·테크면 square.)
- **공유 그리드 / 키라인 정렬** — 같은 그리드(예: 24px artboard, 2px 패딩, 20px live area)와 keyline shape(원·정사각·세로 직사각·가로 직사각)에 맞춘다.
- **광학적 크기 균형** — 정사각형 아이콘과 넓적한 아이콘이 같은 시각 무게로 보이게. 원은 정사각 키라인보다 살짝 넘치고, 가로로 넓은 형태는 세로를 줄여 면적을 맞춘다.
- **코너 라운딩** — 외곽·내부 코너 반경을 하나로 통일(예: ~2px radius). 직각과 둥근 코너를 한 세트에 섞지 않는다.
- **스타일은 하나만** — 세트당 하나(§1·catalog 참조). 섞으면 즉시 잡탕처럼 보인다.
- **차분하고 일관된 톤** — 장식 디테일 최소, 같은 시각 밀도. 한 아이콘만 화려하지 않게.

## 3. 세트 구성 + cross-section 일관성

세트가 **하나의 가족으로 읽히게** 하는 결합 규칙 — 개별 아이콘이 예뻐도 규칙이 어긋나면 가족이 아니다:

- **같은 스트로크 굵기** — §2의 ~1.75–2px를 전 아이콘 동일하게.
- **같은 조인/터미널 스타일** — round면 전부 round, square면 전부 square.
- **같은 메타포 언어** — 도메인 모티프 문법 하나로 통일(전부 기하 / 전부 흐름 등 섞지 않기).
- **같은 시각 무게 & 밀도** — 어떤 아이콘도 혼자 굵거나 비거나 빽빽하지 않게.
- **같은 그리드 / 키라인** — 모두 동일 artboard·padding·live area에 정렬.
- **상태 아이콘(success / warning / danger)** — 구성(형태·굵기·그리드)은 완전히 동일하게 두고 **액센트 색만 다르게**(예: success=green check, warning=amber triangle, danger=red octagon/dot — 같은 조인·굵기·코너).

**보드 적용:** **에센스·타깃·가치 섹션의 작은 아이콘**과 **Imagery/Iconography 섹션의 아이콘 세트**는 **하나의 동일한 시스템**을 쓴다 — 같은 굵기·조인·그리드·메타포 언어. 보드 안 두 위치가 서로 다른 아이콘 룩이면 시스템이 아니라 우연이다.

## 4. 절대 피할 것 (Avoid)

(아래는 네거티브 프롬프트 재료다 — §6 청크의 `Avoid:` 줄에 붙인다.)
clip-art 느낌 · 일반 스톡 아이콘 · 세트 내 굵기 불일치 · 디테일 과밀 · 클리셰 로봇 · 무관한 스톡 이미지 · 자물쇠/지구본/톱니 같은 의미 없는 클리셰 · 불필요한 3D / bevel / extrude · gradient · drop shadow · 아이콘마다 다른 메타포 문법(섞인 스타일) · 작아지면 안 읽히는 tiny illegible 디테일 · 사진처럼 사실적인 렌더 · 모든 기능을 방패/눈으로 표현 · 너무 사실적인 USB·디바이스 그림.

## 5. 검증 테스트 (보여주기 전 자가 판정)

- **One-Color Test** — 단색으로도 의미가 유지되는가? 실패: 색이 없으면 의미가 사라짐 / duotone 효과에만 의존 / 그라데이션이 사라지면 형태가 무너짐.
- **Small UI Test** — 16px·20px·24px에서도 의미가 읽히는가? 실패: 내부 선이 너무 많음 / 작은 크기에서 의미가 사라짐 / 다른 아이콘과 구분 안 됨.

## 6. 프롬프트 청크 (그대로 떠넣기)

```text
Create a cohesive set of [N] minimal icons for "[BRAND NAME]" that read as one family.
System: consistent stroke weight (optically ~[1.75–2]px), [rounded/square] joins and terminals, aligned to a shared grid/keyline, balanced optical sizing, [~2px] corners, [line / filled / duotone / solid-glyph / outline+minimal-fill] style, calm tone.
Each icon maps a concept to a clear form: [concept→shape pairs from BRAND_KIT.md §11 metaphor motifs]. Symbolic, not literal; one consistent metaphor language.
State icons (success/warning/danger) share the same construction; differ only by accent color.
Color: line in [text/HEX], single accent [HEX] used sparingly.
Presentation: even spacing, grid layout, generous negative space, no labels needed.
Avoid: clip-art, generic stock icons, mismatched stroke weights, overcrowding, cliché robots/shields/eyes, unrelated imagery, 3D, gradients, photorealistic devices.
```

위 [브래킷]은 `BRAND_KIT.md §11`/`brand-tokens.json`에서 채우고(아이콘 개수 N·rounded/square·코너 반경·스타일·concept→shape 모티프·라인 색·액센트 HEX), 실제 프롬프트에는 §4의 항목을 `Avoid: ...` 한 줄로 이어 붙인다.
