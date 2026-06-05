# 로고 탐색 시트 (logos.html) 저작 가이드

## 0. 목적 / 사용법

`design-logo`가 **한 라운드 3~4개 로고 컨셉**을 개별 투명 PNG로 만든 뒤, 그것들을 저작한 `logos.html` 탐색 시트에 담을 때 읽는다. 형태 언어·컨셉 5방법·construction geometry·품질 테스트·Avoid는 공유 ref `../../references/design/logo-art-direction.md`(§1–9)를 따르고, 이 문서는 **시트 레이아웃·카드 구성·발산 모드 스티어·수렴·컷아웃 프롬프트 청크**만 다룬다.

목표 품질: "괜찮은 AI 이미지"가 아니라 **진지한 브랜딩 스튜디오의 로고 탐색 시트**. 시트는 이미지가 아니라 `overview.html`처럼 **LLM이 저작하는 HTML**이다.

## 1. 시트 레이아웃 (logos.html)

- **단일 self-contained HTML**(CSS 인라인). 시트는 `.design/view/logos.html`에 두고, 모든 `<img>`는 `../candidate/logo/` 상대경로(`../candidate/logo/concepts/round-N/01.png`·`../candidate/logo/seed.png`).
- brand-kit의 A/B/C/D 아키타입을 쓰지 **않는다** — 목적이 다른 **전용 탐색 시트**(마크 비교 갤러리).
- **번호 카드 그리드**: 한 라운드 3~4개 + 베이스라인 타일. 카드 사이 넉넉한 거터, 절제된 밀도.
- **헤더**: 브랜드명 + "LOGO EXPLORATION" + 라운드·발산 모드 라벨(예: "Round 2 · 제로베이스 발산").
- **푸터**: 태그라인 + 작은 스튜디오 라벨.
- 캔버스 라이트/다크는 브랜드 비주얼 모드(BRAND_KIT)에 맞춘다. **실색**은 `brand-tokens.json`, **실폰트**는 `../../references/design/font-catalog.md`의 실존 family를 CDN `<link>`로 로드.
- 콘텐츠(브랜드명·태그라인·라벨)는 지어내지 않는다 — `BRAND_KIT.md`/tokens에서, 라벨은 그 라운드에서 실제 만든 컨셉 방향을 가리킨다.
- **락업 프리뷰 섹션(신규)**: 시트 하단에 lock 후보 심볼 + 워드마크를 합친 `.lockup`(가로)·`.lockup.lockup--stacked`(세로)을 렌더한다 — `<img class="lockup__mark" src="../candidate/logo/concepts/round-N/0X.png">` + `<span class="wordmark">브랜드명</span>`. `.lockup*`·`.wordmark`는 `../assets/tokens.css`가 정의(없으면 brand-tokens.json 값/폴백 인라인). 이게 "실제 로고가 어떻게 보일지"를 보여주는 자리다(스펙 B-🅰 프리뷰 게이트).

## 2. 카드 구성

각 카드 = **투명 로고 PNG**(제시용 — autocrop 없이 여백 포함) + **인덱스 번호**(`01`–`04`) + **한 줄 방향 라벨** + **컨셉 방법/유형 태그**(예: "negative-space / symbol"). 카드 이미지는 `max-height:Npx; width:auto; object-fit:contain`으로 받아 여백 포함 마크도 균일하게 보이게 한다.
- `logo-base.png` = **베이스라인 타일(#0 "brand-kit 기준")** 고정. 비교·즉시 선택용.
- 모든 마크 `object-fit:contain`(여백 정규화).

## 3. 발산 모드 (A / B / C)

탐색 시작 시 발산 앵커를 고른다. **라운드마다 다시 고를 수 있다**.

| 모드 | 앵커 | `--image` | 특성 |
|---|---|---|---|
| A 기준 발산 | `logo-base.png` | 첨부 | 그 마크 계열 변주. 일관성↑ 다양성↓ |
| B 제로베이스 완전 발산 | 없음 | 미첨부 | `BRAND_KIT.md` §6·메타포·색·금지·성격을 프롬프트에. 다양성 최대 |
| C 첨부 이미지 기준 | 사용자 첨부 이미지(`seed-user.png`) | 첨부 | 사용자 레퍼런스를 앵커로 |

- **근거**: 컷아웃은 `gpt-image-1.5`로 만든다. `image-gen`이 `input_fidelity`를 안 보내면 입력 이미지를 **기본 low로 느슨하게** 참조하므로, 모드 A·C(앵커 첨부)는 `--input-fidelity high`를 함께 줘야 마크에 단단히 묶인다. "메타포까지 완전 발산"을 원하면 시드를 붙이지 않는 B가 맞다. 모드 A에서 변주 폭이 좁아지는 건 **의도된 트레이드오프**.

## 4. 컨셉 분포 (3~4개를 다르게)

- 3~4개를 `logo-art-direction.md`의 축에 걸쳐 분포 — 한 형태의 미세 변주 반복 금지.
- 컨셉 5방법(§2): 모노그램+의미 / 제품 액션 / 메타포 융합 / 네거티브 스페이스 / 구성 기하. 유형(§4): 워드마크 / 레터마크 / 심볼 / 콤비네이션 / 엠블럼.
- 발산 모드 B·C는 **메타포·심볼 자체가 다른** 큰 스윙(추상 기하 vs 구체 상징 vs 레터마크). 브랜드 **성격·금지·색**만 공유 — "한 브랜드의 3~4가지 해석".

## 5. 수렴 (고른 #N → 좁히기)

- 사용자가 #N을 고르면 그 **PNG를 `--image --input-fidelity high`로 첨부** + "이 방향을 유지하며 서로 조금씩 다른 3~4 변주". high fidelity가 방향을 단단히 묶는다.
- 새 라운드는 시트를 **교체**한다. 이전 PNG는 `candidate/logo/concepts/round-N/`에 `--auto-version`으로 남는다.

## 6. 단독 로고 만들기 (고른 #N → 단독 로고)

- 고른 PNG는 이미 깨끗한 투명 단독 컷아웃이므로 **보드 셀 재추출이 없다**. 만족스러우면 그 PNG를 `candidate/logo/logo-candidate.png`로 승격해 다듬는다.
- 더 다듬고 싶으면 그 PNG를 `--image --input-fidelity high`로 첨부 + "중앙 정렬, plain 단색/투명 배경, 형태·기하 유지, 단일 마크만". 품질 프레이밍·Avoid는 `../../references/design/logo-art-direction.md` §3·§6·§7, 판정은 §8.

## 7. 금지 사항

- 카드마다 완전히 다른 스타일 난립으로 브랜드 일관성 상실(발산은 메타포 발산이지 품질 난립이 아님).
- 번호 누락·중복, 한 카드에 여러 마크, 읽히지 않는 미세 디테일, 시트에 가짜 본문 텍스트.
- `logo-art-direction.md` §6 클리셰(방패·자물쇠·기어·말풍선·의미 없는 그라데이션/3D/sparkle, 유명 마크 모방).

## 8. 컷아웃 생성 프롬프트 청크 (그대로 떠넣기)

**발산 모드 B(제로베이스) — 컨셉 1개당 1콜**:
```text
Create ONE clean logo mark for "[BRAND NAME]" — a single centered mark on a transparent background, no grid, no text labels, no scenery.
Concept: [this card's method/type — e.g. negative-space symbol of (core metaphor)]. Single consistent stroke weight, strong silhouette, legible at small size, valid in solid monochrome. Brand color [HEX].
Brand DNA: [core metaphor / construction from BRAND_KIT §6], [personality adjectives].
Avoid: shield/lock/globe/gear/speech-bubble cliches, meaningless gradient/3D bevel/drop shadow/sparkle, copying famous marks, text-only logo.
```
- 모드 A·C: 위 청크 + `logo-base.png`(A) 또는 `seed-user.png`(C)를 `--image`로 첨부, "이 마크를 모티브로 한 새 해석" 문구 추가. 호출에 `--input-fidelity high` 를 더한다.
- 수렴: 고른 #N PNG를 `--image --input-fidelity high`로 첨부 + "이 방향을 유지하며 서로 조금씩 다른 변주, 단일 마크, 투명 배경".

위 [브래킷]은 `BRAND_KIT.md`/tokens/Q&A에서 채운다. 한 라운드 3~4콜은 **병렬 백그라운드**로 호출하고, `--model gpt-image-1.5 --background transparent --quality high --auto-version`. 앵커(A·C·수렴)는 여기에 `--input-fidelity high` 추가.
