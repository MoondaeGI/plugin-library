# 로고 아트 디렉션 (생성용 프롬프트-스펙)

## 0. 목적 / 사용법

이 문서는 `design-logo`가 로고를 만들 때 읽고, `design-brand-kit`이 보드 §6 로고 방향 섹션을 채울 때(§7.1 압축 블록) 참조하는 공유 ref다. 추상적 디자인 이론이 아니라 **이미지 모델이 바로 그릴 수 있는 구체적·렌더 가능한 형태 지시**만 담는다. 목표 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다.

권위 원본(정확한 색·문구·폰트 스펙)은 `BRAND_KIT.md`/`brand-tokens.json`이고, 이 문서는 **형태·생성 방향**을 정의한다. 둘이 어긋나면 md/tokens가 정답이다. 사용법: §1에서 카테고리 의미를 형태로 끌어내고 → §2에서 컨셉 방법을 고르고 → §3 기하 언어와 §4 유형/락업으로 다듬고 → §6 Avoid를 네거티브로 붙이고 → 독립 로고는 §7 풀 청크를, 종합 보드의 로고 섹션은 §7.1 압축 블록을 떠넣어 [브래킷]을 채운다 → 생성물은 §8 품질 테스트·§9 체크리스트로 판정한다.

> **투명 배경 주의**: gpt-image-2는 투명 배경을 지원하지 않는다(API 에러). 투명 컷아웃(로고 마크·워드마크·아이콘)은 `--model gpt-image-1.5 --background transparent --output-format png`로 생성한다. 불투명 사진/목업은 gpt-image-2.

## 1. 전략 → 마크 로직

심볼은 미관이 아니라 **카테고리 의미**에서 나온다. "가능한 심볼"을 나열하는 데서 멈추지 말고, 그 의미를 **렌더 가능한 구체 형태로 변환**한다.

| 카테고리 | 핵심 아이디어 | 메타포 → 구체 형태 변환 (렌더 가능) |
|---|---|---|
| 개발자 도구 | 구축·정밀·제어 | right-angle frame + diagonal cut + module grid, 또는 cursor caret를 모노그램에 음각 |
| AI 어시스턴트 | 위임·지능·명료 | 4점 spark를 keyline 원 안에 정렬, 또는 노드 3개를 잇는 single orbit path |
| 보안 | 보호·경계·감시 | 닫힌 hexagon boundary + 중심에 protected dot, 또는 두 호가 만드는 음각 eye |
| 게이밍/베팅 | 운·보상·속도 | isometric cube(주사위) 한 모서리를 cut, 또는 다이아몬드 gem facet 그리드 |
| 보이스 AI | 소리·리듬·흐름 | 굵기 변하는 3~4 bar waveform을 원 안에 inscribe, 또는 동심 pulse ring 2개 |
| 컴플라이언스 | 신뢰·질서·규칙 | concentric notched seal(둥근 톱니 1겹) + 중앙 모노그램, 또는 stacked document edge |
| 드론/로보틱스 | 비행·시야·미션 | 좌우 대칭 chevron wing pair + 중심 crosshair dot, 또는 viewport corner bracket 4개 |
| 럭셔리/에디토리얼 | 취향·절제·의례 | 두 글자 interlock 모노그램 + 얇은 hairline rule, 또는 emboss-feel 음각 seal |
| 생산성 | 집중·모멘텀·명료 | forward arrow를 path notch로 음각, 또는 채워진 block + checkmark 음각 |
| 핀테크/결제 | 흐름·교환·신뢰 | 두 화살표가 만드는 circular swap loop, 또는 stacked coin/card edge offset |

원칙: **심볼을 랜덤하게 고르지 않는다 — 카테고리 의미에서 형태를 끌어낸다.**

## 2. 로고 컨셉 5방법

각 방법은 하나만 쓰거나 최대 둘만 조합한다. 직설적이지 않게, 추상·프리미엄하게.

1. **모노그램 + 의미** — 브랜드 이니셜에 메타포를 형태로 녹인다. 네거티브 스페이스·컷·폴드·기하를 사용하고, **글자를 도형 안에 그냥 넣는 지루한 아이콘은 금지**. 예: `F`의 두 가로획을 frame corner로 확장하고 사이를 음각 처리.
2. **제품 액션** — 제품의 핵심 동작 하나를 심볼로 매핑한다: build→frame/scaffold/block/cursor, protect→shield/boundary, convert→switch/arrow, speak→waveform/mic/pulse. 동사를 추상화하되 읽히게, 직역하지 않는다. 예: convert = 맞물린 두 화살표 90° loop.
3. **메타포 융합** — 의미 있는 두 아이디어를 하나의 축약된 마크로 융합한다. 미묘하고 legible하게 — 두 형태가 한 실루엣을 공유한다. 예: path + leaf = 잎맥처럼 갈라지는 single stroke.
4. **네거티브 스페이스** — 빈 공간으로 두 번째 의미를 만든다: hidden arrow, protected center, cut-out initial, inner path, folded corner. 음각이 또렷하게 읽혀야 한다. 예: 둥근 사각 안에 음각으로 떠오르는 화살표.
5. **구성 기하 / construction geometry** — 명확한 시스템에서 마크를 만든다: circle, diagonal cut, grid, frame, module block, orbit, crosshair, measured lines. 형태가 keyline 위에 올라간 듯 정밀하게.

## 3. Construction Geometry 언어

이미지 모델이 실제로 그릴 수 있는 기하 시스템 어휘 — 마크를 이 위에 세운다:
circle / arc / concentric rings · square frame / rounded square · diagonal 45° cut · module grid (3×3, 4×4) · stacked blocks · single continuous stroke · orbit path / ellipse · crosshair / center dot · corner bracket · chevron / arrow notch · interlock / overlap · hairline keyline · measured tick marks.

품질을 끌어올리는 표현(프롬프트에 그대로 붙임): "precise, intentional, balanced; built on a grid/keyline; geometrically constructed; optically balanced; consistent stroke weight; strong, instantly recognizable silhouette; reads clearly at favicon size (16px); looks researched and reduced, not decorative; reduced to its essential form; high contrast against background."

## 4. 로고 유형 / 락업 / 단색·반전

**독립 심볼 필수.** 로고 방향을 워드마크만으로 끝내지 않는다 — 제품명 없이 단독으로 쓸 수 있는 심볼/마크를 반드시 포함한다. **글자만 있는 로고는 실패로 간주한다.** (워드마크는 심볼과 함께 쓰는 요소다.)

- **워드마크** — 브랜드명 전체를 커스텀 타입으로. 이름이 짧고 기억성 있을 때.
- **레터마크(모노그램)** — 1~2 이니셜. 이름이 길거나 이니셜이 강할 때, 작은 공간용.
- **심볼** — 글자 없는 추상/구상 마크. 인지도가 쌓였거나 다국어·아이콘 용도가 클 때.
- **콤비네이션** — 심볼 + 워드마크 락업. 가장 안전한 기본값, 신생 브랜드에 권장.
- **엠블럼** — 텍스트가 형태 안에 갇힌 배지/씰. 전통·기관·의례 톤일 때만(작은 크기에서 뭉개짐 주의).

**단색·반전은 항상 성립해야 한다**: pure black 버전과 pure white 버전 모두 단색으로 또렷이 읽혀야 하고(그라데이션·디테일에 의존 금지), 어두운/밝은 배경 양쪽에서 reversed로 작동해야 한다. 생성 프레이밍: clean한 단색 배경, 큰 중앙 정렬 마크, 단일 색, no mockup, no busy background.

## 5. 워드마크 타이포 방향

타이포 personality를 **형태 언어**로 지시한다:
- **지오메트릭 산세리프** — 원·정사각 기반, 균일한 굵기, 닫힌 형태. 모던·테크·중립.
- **휴머니스트 산세리프** — 미세한 굵기 대비, 열린 어퍼처, 펜 흐름의 흔적. 친근·신뢰·읽기 쉬움.
- **세리프** — 또렷한 세리프와 굵기 대비. 에디토리얼·럭셔리·기관.
- **모노스페이스** — 균등 폭, 기계적 정밀. 개발툴·데이터·빌더 톤.

공통: tight하지만 충돌 없는 kerning, 일관된 굵기, 그리고 **단 하나의 커스텀 디테일**(letter cut / ligature / 독특한 terminal) — 두 개 이상은 과하다.

한글 캐비엇: 모델은 한글 글리프를 부정확하게 렌더한다. 한국어 커스텀 워드마크는 **짧고 단순하게** 유지하고, 정확한 글자형의 권위 원본은 `BRAND_KIT.md`에 둔다. 복잡한 한글 자형을 마크로 강제하지 않는다.

## 6. 절대 피할 것 (Avoid)

(아래는 네거티브 프롬프트 재료다 — §7 청크의 `Avoid:` 줄에 붙인다.)
shield / lock / globe / gear / speech-bubble 클리셰 · 정당화 없는 랜덤 동물 · 가짜 럭셔리 크레스트 · 유명 마크 모방 · 과도하게 복잡한 심볼 · 클립아트 아이콘 느낌 · 의미 없는 sparkle/반짝임 · 의미 없는 gradient · 3D bevel · drop shadow · 일관성 없는 변형(variant마다 다른 비율·굵기) · 작아지면 안 읽히는 tiny illegible 디테일 · 스톡 템플릿 로고 느낌.

## 7. 프롬프트 청크 (그대로 떠넣기)

```text
Create a single, clean, standalone logo for "[BRAND NAME]" on a plain [near-black/white] background.

Mark concept: [logo idea — monogram/symbol + metaphor, e.g. "monogram F fused with a scaffold/frame corner using negative space"].
Construction: built from clear geometry — [circle/grid/diagonal cut/module/frame/orbit] — precise, intentional, balanced. Looks researched and reduced, not decorative.
Form language: [geometric/organic, angular/rounded], consistent stroke weight, strong silhouette, recognizable at favicon size.
Wordmark (if shown): [geometric/humanist/serif/mono] character, tight kerning, one custom detail (cut/ligature/terminal).
Color: single brand color [HEX] on clean background; also valid as solid monochrome (pure black, pure white).
Presentation: large centered mark, generous clearspace, no mockup, no busy background, no extra UI.
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, fake luxury crest, copying famous marks, meaningless gradient/3D bevel/drop shadow/sparkle, clip-art icon feel, inconsistent variants, tiny illegible detail.
```

위 [브래킷]은 `BRAND_KIT.md`/`brand-tokens.json`에서 채우고(이름·near-black/white·logo idea·기하·form·타이포·HEX), 실제 프롬프트에는 §6의 항목을 `Avoid: ...` 한 줄로 이어 붙인다.

### 7.1 보드 주입용 압축 블록 (3줄 고정)

위 풀 청크는 **독립 단색 로고용**이다. 종합 보드의 "Logo Direction" 섹션은 로고가 12섹션 중 1칸이라 풀 청크를 떠넣으면 과대표집돼 보드가 일그러진다. 보드 프롬프트에는 아래 **3줄만** `BRAND_KIT.md §6`(구성·의미)로 채워 넣는다 — 빈 generic 줄로 두지 않는다.

```text
Logo Direction section: show ONE well-crafted mark in a few clean placements only — (1) symbol + wordmark lockup, (2) the standalone symbol on its own, (3) favicon + app-icon tile (small size), (4) a one-line construction/meaning note. Restrained — NOT an exploration sheet, NOT a row of many logo variants.
Mark concept: [BRAND_KIT.md §6 구성·의미 — 예: "monogram F fused with a scaffold-frame corner via negative space"], built on [grid / diagonal cut / orbit / frame], single consistent stroke weight, strong silhouette, legible at favicon size, valid in solid monochrome; the symbol reads on its own without the name.
Avoid: shield/lock/globe/gear clichés, meaningless gradient/3D bevel/sparkle, letters-only logo, a grid/sheet of many logo variations.
```

## 8. 품질 테스트 (결과물 평가용 — 프롬프트 재료 아님)

생성된 로고를 사용자에게 보여주기 전 아래로 자가 판정한다. 떨어지면 §1·§2·§7을 한 가지씩 보강해 재생성한다.

- **Silhouette** — 단색 실루엣으로도 형태가 기억되나? (실패: 그라데이션 사라지면 무너짐, 내부 디테일 과다)
- **Small-Size** — 16·24·32px에서 핵심 형태가 읽히나? (실패: favicon에서 뭉개짐, 얇은 선 소실)
- **No-Text** — 브랜드명을 지워도 심볼만으로 작동하나? (실패: 글자 없으면 의미 없음, 심볼이 일반 도형)
- **One-Color** — 그라데이션·그림자·질감 없이 작동하나? (실패: 단색 버전이 복잡, 음영 없이 형태 구분 불가)
- **System** — UI 헤더·사이드바·파비콘·앱 아이콘·문서·배지에 반복 적용되나?
- **Meaning** — 형태가 브랜드 전략·핵심 메타포와 연결되나? (실패: 예쁘지만 왜 이 형태인지 설명 못 함; 보안이라 방패, AI라 반짝임, 동물명이라 동물 얼굴을 그대로)

## 9. 로고 체크리스트

- [ ] 워드마크만 있는 게 아니라 독립 심볼이 있나?
- [ ] 심볼만으로도 브랜드 방향이 느껴지나?
- [ ] 작은 크기(16px)에서 읽히나?
- [ ] 단색(흑/백)으로 작동하나?
- [ ] UI·문서·앱 아이콘에 반복 사용 가능하나?
- [ ] 브랜드 전략/핵심 메타포와 연결되나?
- [ ] 흔한 방패·눈·반짝임·번개에 의존하지 않나?
- [ ] 실제 브랜드 로고를 연상시키지 않나?
- [ ] 그라데이션·효과 없이도 형태가 유지되나?
