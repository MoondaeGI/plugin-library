# 로고 탐색 보드 아트 디렉션

## 0. 목적 / 사용법

`design-logo`가 **40개 컨셉 로고 탐색 보드**(브랜딩 스튜디오 아이덴티티 컨셉 시트)를 생성할 때 읽는 보드 전용 아트 디렉션이다. 형태 언어·컨셉 5방법·construction geometry·품질 테스트·Avoid 목록은 공유 ref `../../references/design/logo-art-direction.md`(§1–9)를 따르고, 이 문서는 **보드 레이아웃·시트 미감·셀 참조·수정 스티어링**만 다룬다.

목표 품질: "괜찮은 AI 이미지"가 아니라 **진지한 브랜딩 스튜디오의 로고 탐색 시트**.

## 1. 보드 레이아웃

- **정사각 캔버스**(`--size 1024x1024`). 콘텐츠가 많으면 더 큰 정사각.
- **번호 매긴 모듈러 그리드** — 기본 **40칸(8열 × 5행)**, 각 칸 좌상단에 `01`–`40` 작은 번호. 사용자가 다른 수를 요청하면 그에 맞춘다.
- 칸 사이 얇은 디바이더와 넉넉한 거터, 절제된 시각 밀도.
- **헤더**: 브랜드명 + "LOGO EXPLORATION" + 한 줄 라벨(예: "Identity concept study").
- **푸터**: 태그라인 + "EXPLORATION BOARD" / 작은 스튜디오 라벨.
- 라이트/다크 캔버스는 브랜드 비주얼 모드(BRAND_KIT)에 맞춘다.

## 2. 컨셉 분포 (40칸을 다양하게)

40칸을 `logo-art-direction.md`의 축에 걸쳐 분포시킨다 — 한 형태의 미세 변주만 반복하지 않는다:
- **컨셉 5방법**(§2): 모노그램+의미 / 제품 액션 / 메타포 융합 / 네거티브 스페이스 / 구성 기하.
- **유형**(§4): 워드마크 / 레터마크(모노그램) / 심볼 / 콤비네이션 / 엠블럼.
- **construction geometry**(§3): 원·그리드·대각컷·모듈·궤도·크로스헤어·프레임 등.
- 모두 **시드 모티브의 코어 아이디어**(브랜드 메타포)를 공유하되 형태를 발산한다 — "같은 브랜드의 40가지 해석"이지 무관한 마크 40개가 아니다.

## 3. 시드 모티브 사용

- 시드 PNG(`seed.png`, 클린 단색 배경)를 `--image`로 첨부해 모티브로 쓴다 — 보드는 이 마크의 변주 40개를 한 그리드에 담는다.
- gpt-image-2는 입력 이미지를 **항상 high fidelity로 처리**한다(`--input-fidelity` 미지원). 40개의 서로 다른 변주는 **프롬프트 문구**("이 마크를 모티브로 서로 다른 40개 컨셉을 그린다")로 유도한다. 시드는 출발점이지 그대로 복제할 대상이 아니다.
- **시드가 없으면**(brand kit 없이 진행) 시드를 첨부하지 않고, Q&A로 얻은 마크 DNA를 §7 청크의 `[core metaphor / construction]`에 채워 **텍스트→이미지**로 첫 보드를 만든다.

## 4. 셀 참조 = 보드 첨부 + 번호 (말로 번역 금지)

사용자가 칸을 번호로 가리키면(예: "12번 기준으로", "5·8번 모양은 별로"):
- **직전 보드를 `--image`로 첨부**하고, 프롬프트에는 **번호만** 쓴다. 형태를 말로 풀어쓰지 않는다 — 모델이 번호 셀을 직접 본다.
- gpt-image-2는 첨부 이미지를 **항상 high fidelity**로 처리하므로(`--input-fidelity` 없음), 번호 기준 수정은 **직전 보드를 편집**하는 셈이다 — 좋은 칸은 유지되고 지목한 방향으로 옮겨간다. 프롬프트 문구로 지시한다:
  - 방향: `이 보드를 기준으로 다시 만들되, #N 칸의 방향을 살려 전체 40칸을 다시 그린다.`
  - 회피: `#M, #K 칸 같은 형태 계열은 빼고 다른 마크로 대체한다.`
- 더 과감히 새로운 결과를 원하면 보드 대신 **시드(`seed.png`)만 첨부**해 §3처럼 새 40그리드를 생성한다(직전 보드를 안 붙이면 결과에 덜 묶인다).

## 5. 단독 로고 만들기 (고른 #N → 단독 로고)

사용자가 최종 컨셉 #N을 고르면, 보드를 `--image`로 첨부하고:
`첨부 보드 #N 칸의 마크만 크고 깨끗한 단독 로고로 재현 — 중앙 정렬, plain 단색 배경, 형태·기하 유지, 단일 마크만(보드/그리드 아님).`
- 형태 보존은 gpt-image-2 기본(항상 high fidelity)이라 별도 플래그가 필요 없다.
- 품질 프레이밍·Avoid는 `../../references/design/logo-art-direction.md` §3·§6·§7, 판정은 §8.

## 6. 금지 사항

- 칸마다 완전히 다른 스타일 난립(브랜드 일관성 상실).
- 번호 누락·중복·뒤섞임, 한 칸에 여러 마크.
- 읽히지 않는 미세 디테일, 빽빽한 밀도, 가짜 본문 텍스트.
- `logo-art-direction.md` §6 클리셰(방패·자물쇠·기어·말풍선·의미 없는 그라데이션/3D/sparkle, 유명 마크 모방).

## 7. 보드 프롬프트 청크 (그대로 떠넣기)

```text
Create a square "Logo Exploration Board" for "[BRAND NAME]" — a professional branding-studio identity concept sheet.

Layout: numbered modular grid of 40 logo concepts (8 columns x 5 rows), each cell with a small index number 01-40 in the corner, thin dividers, generous gutters, restrained density. Header: "[BRAND NAME] / LOGO EXPLORATION" + one-line label. Footer: tagline + "EXPLORATION BOARD". [light/dark] canvas per brand.
Concepts: spread the 40 marks across monogram+meaning / product-action / metaphor-fusion / negative-space / construction-geometry methods and wordmark/lettermark/symbol/combination/emblem types. All share the brand's core metaphor — "40 interpretations of ONE brand", not 40 unrelated marks.
Mark DNA (from the attached seed): [core metaphor / construction], single consistent stroke weight per mark, strong silhouettes, legible at small size, valid in solid monochrome.
Style: precise, intentional, premium identity concept sheet; clean; NOT decorative; plain background, no scenery.
Avoid: shield/lock/globe/gear/speech-bubble cliches, meaningless gradient/3D bevel/drop shadow/sparkle, copying famous marks, inconsistent per-cell styles, illegible tiny detail, missing/duplicate numbers.
```

위 [브래킷]은 `BRAND_KIT.md`/시드에서 채운다. 수정 재생성 시에는 위 청크에 §4 스티어링 델타("#N 방향으로 새 40컨셉 / #M·#K 회피")를 더하고 직전 보드를 `--image`로 첨부한다.
