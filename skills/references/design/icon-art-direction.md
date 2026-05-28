# 아이콘 아트 디렉션 (생성용 프롬프트-스펙)

## 0. 목적 / 사용법

이 문서는 `design-brand-kit` 보드의 아이콘 세트(Imagery/Iconography 섹션)·작은 섹션 아이콘(에센스·타깃·가치 등) 생성과 미래 `design-icon` 스킬이 읽는 공유 ref다. 추상적 디자인 이론이 아니라 **이미지 모델이 바로 그릴 수 있는 구체적·렌더 가능한 시스템 지시**만 담는다. 목표 품질 기준은 "랜덤 AI 아이콘"이 아니라 **진지한 디자인 시스템의 한 가족(one family)으로 읽히는 아이콘 세트**다. 아이콘은 로고와 다른 분야다 — 로고는 한 개의 기억되는 마크, 아이콘은 같은 규칙으로 묶인 여러 개의 일관된 신호다.

권위 원본(정확한 색·HEX·문구)은 `BRAND_KIT.md`/`brand-tokens.json`이고, 이 문서는 **아이콘 형태·시스템 규칙**을 정의한다. 둘이 어긋나면 md/tokens가 정답이다. 사용법: §1에서 시스템 파라미터를 한 번 고정하고(굵기·조인·그리드·스타일) → §2에서 컨셉을 형태로 매핑하고 → §3으로 세트가 한 가족으로 읽히게 묶고 → §4 Avoid를 네거티브로 붙이고 → §5 청크를 그대로 떠넣어 [브래킷]을 채운다.

## 1. 아이콘 시스템 파라미터

세트 전체에 **한 번 정하고 끝까지 고정**하는 렌더 가능한 규칙들. 각 줄은 모델이 바로 따를 수 있는 지시로 쓴다.

- **일관된 스트로크 굵기** — 모든 아이콘이 광학적으로 동일한 선 굵기(optically ~2px). 큰 도형이라고 굵게, 작은 디테일이라고 가늘게 가지 않는다. "consistent stroke weight across the whole set."
- **조인 & 터미널 스타일** — round join + round cap **또는** square/miter join + butt cap 중 **하나만 골라 전 세트에 통일**. 섞지 않는다. (브랜드가 친근·소프트면 rounded, 정밀·테크면 square.)
- **공유 그리드 / 키라인 정렬** — 모든 아이콘을 같은 그리드(예: 24px artboard, 2px 패딩, 20px live area)와 keyline shape(원·정사각·세로 직사각·가로 직사각)에 맞춘다. "aligned to a shared grid/keyline."
- **광학적 크기 균형** — 정사각형 아이콘과 넓적한 아이콘이 **같은 시각 무게**로 보이게. 원은 정사각 키라인보다 살짝 넘치고, 가로로 넓은 형태는 세로를 줄여 면적을 맞춘다. "balanced optical sizing — a square icon and a wide icon feel the same weight."
- **코너 라운딩** — 외곽·내부 코너 반경을 하나로 통일(예: ~2px radius). 직각과 둥근 코너를 한 세트에 섞지 않는다.
- **스타일은 하나만** — line(아웃라인) / two-tone(라인 + 한 톤 채움) / filled(솔리드) **중 세트당 하나**. 가장 안전한 기본값은 line. 섞으면 즉시 잡탕처럼 보인다.
- **차분하고 일관된 톤** — 장식 디테일 최소, 같은 시각 밀도. 한 아이콘만 화려하지 않게. "calm, restrained, system-like tone."

## 2. 메타포 / 모티프 매핑

개념을 **상징적 형태**로 변환한다 — 직역(literal) 그림이 아니라 축약된 기호. 세트 전체가 **한 가지 일관된 메타포 언어**를 쓴다(예: 모두 기하 도형 기반, 또는 모두 path/흐름 기반).

| 개념 | 아이콘 형태 (렌더 가능, 상징적) |
|---|---|
| build (구축) | 모서리만 그린 right-angle frame, 또는 쌓인 module block |
| deploy (배포) | arrow-up inside a box(상자 밖으로 솟는 화살표) |
| monitor (모니터링) | radar/scope — 동심 호 + 중심 dot + 스윕 라인 |
| secure (보안) | keyline shield — 닫힌 윤곽 + 중심 protected dot (자물쇠 클리셰 금지) |
| sync (동기화) | 두 개의 circular arrow가 만드는 loop |
| search (검색) | keyline lens — 원 + 짧은 45° handle |
| alert (경고) | triangle + 중앙 dot (또는 짧은 느낌표 stem) |
| data (데이터) | stacked bars — 굵기 같은 막대 3개 높이 차 |
| connect (연결) | linked nodes — dot 2~3개를 잇는 short edge |
| time (시간) | clock-arc — 원 + 12·3시 방향 hand, 또는 호 한 조각 |

원칙: **랜덤하게 고르지 않는다 — 개념 의미에서 형태를 끌어내고, 세트 전반에 같은 메타포 문법을 유지한다.** 한 아이콘만 사진처럼 사실적이면 가족이 깨진다.

## 3. 아이콘 세트 구성

세트가 **하나의 가족으로 읽히게** 하는 결합 규칙 — 개별 아이콘이 예뻐도 규칙이 어긋나면 가족이 아니다:

- **같은 스트로크 굵기** — §1의 ~2px를 전 아이콘 동일하게.
- **같은 조인/터미널 스타일** — round면 전부 round, square면 전부 square.
- **같은 메타포 언어** — §2의 문법 하나로 통일(전부 기하 / 전부 흐름 등 섞지 않기).
- **같은 시각 무게 & 밀도** — 어떤 아이콘도 혼자 굵거나 비거나 빽빽하지 않게.
- **같은 그리드 / 키라인** — 모두 동일 artboard·padding·live area에 정렬.
- **상태 아이콘(success / warning / danger)** — **구성(형태·굵기·그리드)은 완전히 동일**하게 두고 **액센트 색만 다르게** 한다(예: success=green check, warning=amber triangle, danger=red octagon/dot — 단, 같은 조인·굵기·코너). 형태 시스템이 흔들리면 안 된다.

보드 적용: **에센스·타깃·가치 섹션의 작은 아이콘**과 **Imagery/Iconography 섹션의 아이콘 세트**는 **하나의 동일한 시스템**을 쓴다 — 같은 굵기·조인·그리드·메타포 언어. 보드 안 두 위치가 서로 다른 아이콘 룩이면 시스템이 아니라 우연이다.

## 4. 절대 피할 것 (Avoid)

(아래는 네거티브 프롬프트 재료다 — §5 청크의 `Avoid:` 줄에 붙인다.)
clip-art 느낌 · 일반 스톡 아이콘(generic stock icons) · 세트 내 굵기 불일치(mismatched stroke weights) · 디테일 과밀(overcrowding) · 클리셰 로봇 · 무관한 스톡 이미지(unrelated stock imagery) · 자물쇠/지구본/톱니 같은 의미 없는 클리셰 · 불필요한 3D / bevel / extrude · gradient · drop shadow · 아이콘마다 다른 메타포 문법(섞인 스타일) · 작아지면 안 읽히는 tiny illegible 디테일 · 사진처럼 사실적인 렌더.

## 5. 프롬프트 청크 (그대로 떠넣기)

```text
Create a cohesive set of [N] minimal icons for "[BRAND NAME]" that read as one family.
System: consistent stroke weight (optically ~2px), [rounded/square] joins and terminals, aligned to a shared grid/keyline, balanced optical sizing, [~2px] corners, [line / two-tone / filled] style, calm tone.
Each icon maps a concept to a clear form: [concept→shape pairs, e.g. build→frame, deploy→arrow-up-in-box, monitor→radar]. Symbolic, not literal; one consistent metaphor language.
State icons (success/warning/danger) share the same construction; differ only by accent color.
Color: line in [text/HEX], single accent [HEX] used sparingly.
Presentation: even spacing, grid layout, generous negative space, no labels needed.
Avoid: clip-art, generic stock icons, mismatched stroke weights, overcrowding, cliché robots, unrelated imagery, 3D, gradients.
```

위 [브래킷]은 `BRAND_KIT.md`/`brand-tokens.json`에서 채우고(아이콘 개수 N·rounded/square·코너 반경·line/two-tone/filled·concept→shape 쌍·라인 색·액센트 HEX), 실제 프롬프트에는 §4의 항목을 `Avoid: ...` 한 줄로 이어 붙인다.
