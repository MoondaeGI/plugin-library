# design-logo 스킬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-kit 확정 후 로고를 탐색·확정하는 `design-logo` 스킬을 추가하고, brand-kit이 `final/logo`를 만들지 않도록(자기 로고를 `generated/logo/brand-kit-logo.png` 시드로만) 변경한다.

**Architecture:** 신규 `skills/design-logo/`는 brand-overview 보드에서 로고만 깨끗이 추출(시드) → 40컨셉 정사각 보드 1장 생성 → 보드 첨부 + 셀 번호로 수정 → 단독 로고 확정 → (선택) wordmark·favicon·app-icon을 `.design/final/logo/`에 만든다. 보드 레이아웃 지식은 스킬 폴더 내부 `references/logo-exploration-board.md`, 형태 언어는 공유 `skills/references/design/logo-art-direction.md`를 재사용한다. **전부 기본 모델 gpt-image-2 + 클린 단색 배경**으로 생성한다 — gpt-image-2가 `background:transparent`를 지원하지 않으므로(OpenAI 공식 문서 확인) 투명은 쓰지 않고, 따라서 `image-gen.mjs`는 손대지 않는다.

**Tech Stack:** 마크다운 스킬/레퍼런스, 공유 `image-gen` 스킬(`gpt-image-2`, OpenAI Images API), `npm run sync`(Codex 번들), node:test(회귀).

**Spec:** `docs/superpowers/specs/2026-05-29-design-logo-design.md`

---

## File Structure

| 파일 | 역할 | 작업 |
|---|---|---|
| `skills/design-brand-kit/SKILL.md` | 로고를 final로 잠그지 않음, 파일명 `brand-kit-logo.png` | Modify |
| `skills/design-brand-kit/references/brand-kit-image.md` | 위와 동일(산출물·저장 절) | Modify |
| `skills/design-logo/references/logo-exploration-board.md` | 40컨셉 보드 레이아웃 아트 디렉션 | Create |
| `skills/design-logo/SKILL.md` | design-logo 스킬 본문 | Create |

> **image-gen.mjs는 변경하지 않는다.** 당초 `--background` 옵션을 더하려 했으나 gpt-image-2가 transparent를 지원하지 않고 design-logo는 클린 단색 배경(opaque, gpt-image-2 기본 동작)으로 가므로 새 옵션이 무의미하다(spec §5).
>
> 커밋 정책: `commit` 스킬을 사용. Codex 번들 `plugins/personal/`·`codex-agents/`는 gitignore된 로컬 생성물이라 커밋하지 않는다. 명령 실행(`npm test`·`npm run sync`)과 커밋은 **사용자 승인 후** 진행(CLAUDE.md).

---

## Task 1: design-brand-kit — 로고를 final로 잠그지 않음

> brand-kit은 자기 (선택) 로고를 `generated/logo/brand-kit-logo.png` 시드로만 둔다. `final/logo` 권위는 design-logo로 단일화. **아래 old_string은 현재 파일과 정확히 일치해야 한다 — 다른 세션이 동시에 수정 중일 수 있으니, 매칭 실패 시 해당 줄을 다시 읽어 현재 문구로 맞춘다.**

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

- [ ] **Step 1: SKILL.md 출력 파일 목록(현 61–62행)**

old:
```markdown
- `.design/generated/logo/` — 단색 클린 로고 이미지 (선택)
- `.design/final/{brand-kit,logo}/` — 확정본(다운스트림이 우선 읽음); 시안은 `.design/generated/`에 보존
```
new:
```markdown
- `.design/generated/logo/brand-kit-logo.png` — 단색 클린 로고 시드 (선택; design-logo의 입력)
- `.design/final/brand-kit/` — 보드 확정본(다운스트림이 우선 읽음); 시안은 `.design/generated/`에 보존. **로고는 final로 잠그지 않는다** — `generated/logo/brand-kit-logo.png` 시드로만 두고, 확정 로고는 design-logo가 `.design/final/logo/`에 만든다.
```

- [ ] **Step 2: SKILL.md 저장 경로 절(현 263행)**

old:
```markdown
- **저장 경로**: `--out`에 **대상 프로젝트 cwd 기준 절대 경로** — 종합 보드·추가 탐색은 `<cwd>/.design/generated/brand-kit/`, (선택) 단색 로고는 `<cwd>/.design/generated/logo/`. 확정본은 lock 시 `<cwd>/.design/final/{brand-kit,logo}/`로 복사하고 시안은 그대로 둔다.
```
new:
```markdown
- **저장 경로**: `--out`에 **대상 프로젝트 cwd 기준 절대 경로** — 종합 보드·추가 탐색은 `<cwd>/.design/generated/brand-kit/`, (선택) 단색 로고는 `<cwd>/.design/generated/logo/`. 보드·추가 탐색 확정본은 lock 시 `<cwd>/.design/final/brand-kit/`로 복사하고 시안은 그대로 둔다. **로고는 final로 복사하지 않는다** — `generated/logo/brand-kit-logo.png` 시드로만 두고, 확정 로고는 design-logo가 `final/logo/`에 만든다.
```

- [ ] **Step 3: SKILL.md 파일명 절(현 264행) 끝부분**

old:
```markdown
(선택) 로고는 `logo-concept-1.png`. lock되면 최종 편집본을 `.design/final/brand-kit/brand-overview.png`(로고는 `.design/final/logo/`)로 복사한다.
```
new:
```markdown
(선택) 로고는 `brand-kit-logo.png`(design-logo 시드 — final로 복사하지 않음). lock되면 최종 보드 편집본을 `.design/final/brand-kit/brand-overview.png`로 복사한다.
```

- [ ] **Step 4: SKILL.md 흐름 5단계(현 283행)**

old:
```markdown
5. **(선택) 단색 클린 로고 → (선택) 추가 탐색 이미지** — 각 항목을 **1개씩**: 1장 생성(키 없으면 드롭) → 보여주고 피드백 → 한 번에 한 가지만 — 직전 이미지를 `--image`로 첨부한 증분 편집으로 — 고쳐 재생성 → 확정되면 그 시안을 `.design/final/<폴더>/`로 복사(버전 접미 뗀 이름)하고 다음으로. 시안은 `.design/generated/<폴더>/`에 그대로 둔다.
```
new:
```markdown
5. **(선택) 단색 클린 로고 → (선택) 추가 탐색 이미지** — 각 항목을 **1개씩**: 1장 생성(키 없으면 드롭) → 보여주고 피드백 → 한 번에 한 가지만 — 직전 이미지를 `--image`로 첨부한 증분 편집으로 — 고쳐 재생성. **로고**는 `generated/logo/brand-kit-logo.png` 시드로만 두고 **final로 복사하지 않는다**(확정 로고는 design-logo가 `final/logo/`에 만든다). **추가 탐색**은 확정되면 그 시안을 `.design/final/brand-kit/`로 복사(버전 접미 뗀 이름)하고 다음으로. 시안은 `.design/generated/<폴더>/`에 그대로 둔다.
```

- [ ] **Step 5: brand-kit-image.md 산출물 절(현 10행)**

old:
```markdown
2. **단색 클린 로고 (선택)** — 독립된 깨끗한 로고 이미지. 단색(흑/백) 버전 고려, 배경 깔끔. → `.design/generated/logo/`. 향후 `design-logo` 수정 스킬의 입력이 되므로 **보드에 박힌 형태가 아니라 단독**으로 만든다. 메인은 어디까지나 종합 보드이며, 로고만 따로 만들고 끝내지 않는다.
```
new:
```markdown
2. **단색 클린 로고 (선택)** — 독립된 깨끗한 로고 이미지. 단색(흑/백) 버전 고려, 배경 깔끔. → `.design/generated/logo/brand-kit-logo.png`. **`design-logo` 스킬의 시드 입력**이 되므로 **보드에 박힌 형태가 아니라 단독**으로 만든다. **final로 잠그지 않는다** — 확정 로고는 design-logo가 `.design/final/logo/`에 만든다. 메인은 어디까지나 종합 보드이며, 로고만 따로 만들고 끝내지 않는다.
```

- [ ] **Step 6: brand-kit-image.md 저장 절(현 164행)**

old:
```markdown
- **저장**: `image-gen` 스크립트의 `--out`에 **프로젝트 cwd 기준 절대 경로**를 직접 지정한다(스크립트가 거기 바로 씀) — 종합 오버뷰 보드 → `<cwd>/.design/generated/brand-kit/`, (선택) 단색 클린 로고 → `<cwd>/.design/generated/logo/`. 파일명 식별 가능 — 발산 초안 `brand-overview-route-a/b/c.png`(재시도 `-v2`), 확정본 `brand-overview.png`, 로고 `logo-concept-1.png`. 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다(`--force` 없이는 덮지 않음).
```
new:
```markdown
- **저장**: `image-gen` 스크립트의 `--out`에 **프로젝트 cwd 기준 절대 경로**를 직접 지정한다(스크립트가 거기 바로 씀) — 종합 오버뷰 보드 → `<cwd>/.design/generated/brand-kit/`, (선택) 단색 클린 로고 → `<cwd>/.design/generated/logo/`. 파일명 식별 가능 — 발산 초안 `brand-overview-route-a/b/c.png`(재시도 `-v2`), 확정본 `brand-overview.png`, 로고 `brand-kit-logo.png`(design-logo 시드 — final로 복사하지 않음). 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다(`--force` 없이는 덮지 않음).
```

- [ ] **Step 7: 잔여 참조 확인**

Run (Grep): `logo-concept|final/\{brand-kit,logo\}` 를 `skills/**/*.md` 에서 검색.
Expected: 일치 0건(모든 라이브 참조 갱신됨). docs/ 의 과거 spec/plan 은 손대지 않는다.

- [ ] **Step 8: 커밋** (*사용자 승인 후*)

```bash
git add skills/design-brand-kit/SKILL.md skills/design-brand-kit/references/brand-kit-image.md
git commit -m "docs(design-brand-kit): 로고를 final로 잠그지 말고 brand-kit-logo.png 시드로만 둠"
```

---

## Task 2: logo-exploration-board.md 레퍼런스 작성

**Files:**
- Create: `skills/design-logo/references/logo-exploration-board.md`

- [ ] **Step 1: 파일 작성**

Create `skills/design-logo/references/logo-exploration-board.md`:

````markdown
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
````

- [ ] **Step 2: 커밋** (*사용자 승인 후*)

```bash
git add skills/design-logo/references/logo-exploration-board.md
git commit -m "docs(design-logo): 로고 탐색 보드 레퍼런스 추가"
```

---

## Task 3: design-logo SKILL.md 작성

**Files:**
- Create: `skills/design-logo/SKILL.md`

- [ ] **Step 1: 파일 작성**

Create `skills/design-logo/SKILL.md`:

````markdown
---
name: design-logo
description: 확정된 brand kit를 바탕으로 로고를 탐색·확정하는 스킬. brand-overview 보드에서 로고만 깨끗이 추출해 시드로 쓰고, 40개 컨셉이 한 장에 담긴 정사각 Logo Exploration Board를 만든 뒤, 보드를 첨부하고 셀 번호로 가리켜 수정해 고른 컨셉을 단독 로고로 만들고 (선택) wordmark·favicon·app-icon까지 .design/final/logo/에 확정할 때 사용한다.
---

# Design Logo

당신은 확정된 브랜드 킷에서 출발해 실제로 쓸 수 있는 로고를 좁혀가는 아이덴티티 디자이너다.

## 목적

`design-brand-kit`이 확정된 뒤 사용한다. 보드의 "로고 방향"은 한 칸짜리 제시일 뿐이라, 여기서 **브랜딩 스튜디오의 로고 탐색 시트**처럼 40개 컨셉을 한 장에 담아 보여주고, 사용자가 번호로 컨셉을 고르거나 배제하며 보드를 다시 그려 좁힌다. 고른 컨셉을 깨끗한 단독 로고로 다시 렌더해 다듬고, 확정 로고와 (선택) 로고 시스템(wordmark·favicon·app-icon)을 `.design/final/logo/`에 확정한다. 품질 기준은 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 마크**다. 형태 언어·컨셉 방법·품질 테스트는 `../references/design/logo-art-direction.md`, 보드 레이아웃은 `references/logo-exploration-board.md`를 따른다.

## 전제

- `design-brand-kit`이 확정돼 `.design/final/brand-kit/brand-overview.png`·`.design/BRAND_KIT.md`·`.design/brand-tokens.json`이 있어야 한다. 없으면 먼저 `design-brand-kit`을 안내한다.
- 이미지는 공유 `image-gen` 스킬로 생성한다 (`OPENAI_API_KEY` 필요; **키를 사전 점검하지 말고 바로 호출** — 부재 시 스크립트가 고치는 법을 안내하며 즉시 실패). 키가 없으면 사람이 직접 드롭하는 폴백.

## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴, §8 타이포(워드마크용).
- `.design/brand-tokens.json` — 색 HEX·타이포.
- `.design/final/brand-kit/brand-overview.png` — 시드 출처(로고만 추출).
- (있으면) `.design/generated/logo/brand-kit-logo.png` — brand-kit이 만든 단독 로고 시드. 있으면 추출 대신 우선 사용.

## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/generated/logo/seed.png` — 추출한 로고 시드(클린 단색 배경).
- `.design/generated/logo/exploration-board.png` (+`-v2`…) — 40컨셉 정사각 탐색 보드.
- `.design/generated/logo/logo-candidate.png` (+`-v2`…) — 고른 컨셉의 단독 로고 렌더.
- `.design/final/logo/logo.png` — 확정 단일 로고.
- `.design/final/logo/wordmark.png` · `favicon.png` · `app-icon.png` — (선택) 로고 시스템.
- `.design/image-briefs/logo-briefs.md` — 시드 출처·탐색 방향·제약 로그·확정 컨셉·로고 시스템 스펙.

시안은 `generated/logo/`에 `--auto-version`으로 누적(덮지 않음). 확정본만 `final/logo/`로 복사한다. **`final/logo`는 이 스킬이 단독으로 채운다** (brand-kit은 로고를 final로 잠그지 않는다).

## 이미지 생성 (공유 `image-gen` 스킬)

스크립트 경로(형제 스킬): `../image-gen/scripts/image-gen.mjs`.

- **모델·배경**: 전부 기본 `gpt-image-2` + **클린 단색 배경**으로 생성한다. gpt-image-2는 투명 배경을 지원하지 않으므로 투명은 쓰지 않고, 배경은 프롬프트로 "plain near-white/near-black background, no scenery"라고 지시한다.
- **충실도(고정)**: gpt-image-2는 `--image`를 **항상 high fidelity**로 처리한다(`--input-fidelity` 미지원 — 스크립트에서 제거됨). "편집(보존)이냐 참고(새로)냐"는 **프롬프트 문구**로 표현한다 — 추출·번호 수정·다듬기·로고시스템은 "보존", 더 새로운 보드를 원하면 시드만 첨부.
- **셀 참조 = 보드 첨부 + 번호**: 사용자가 "N번"으로 가리키면 **해당 보드를 `--image`로 첨부**하고 프롬프트엔 번호만 쓴다. 형태를 말로 번역하지 않는다 — 모델이 번호 셀을 직접 본다.
- **버전 보존**: 모든 재생성은 `--auto-version`으로 `-v2`·`-v3`… 누적, 기존 시안을 덮지 않는다.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로 넘긴다. 보드 프롬프트는 `references/logo-exploration-board.md` 템플릿, 단독 로고는 `../references/design/logo-art-direction.md` §7 풀 청크.
- 호출 예(보드 생성):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <보드 프롬프트 파일> \
    --image "<cwd>/.design/generated/logo/seed.png" \
    --out "<cwd>/.design/generated/logo/exploration-board.png" \
    --auto-version --size 1024x1024 --quality low --model gpt-image-2
  ```

## 흐름 (디자이너 협업 루프)

### Phase 1 — 시드 + 승인 게이트
1. 입력 읽기(BRAND_KIT.md §6·tokens·확정 보드).
2. **시드 추출**: `--image <brand-overview.png>` + 프롬프트 "이 브랜드 보드에서 로고 마크만 깨끗이 중앙에 재현, plain near-white 단색 배경(no scenery), 보드의 텍스트·다른 섹션 제외, 단일 마크만" → `.design/generated/logo/seed.png`(gpt-image-2, `--quality low`). 보여주고 "이 마크 맞아요?" 확인. (`brand-kit-logo.png`가 있으면 추출 생략하고 그걸 시드로.)
3. `logo-briefs.md` 작성(시드 출처·탐색 방향·컨셉 방법 분포·제약).
4. **승인 게이트 (보드 생성 전 필수)**: 시드 + brief를 제시하고 방향 확인. 이미지는 실비가 들고 brief가 어긋나면 보드를 통째로 날리므로 텍스트 단계에서 잡는다. 승인 전엔 보드를 생성하지 않는다.

### Phase 2 — 탐색 보드 → 단독 로고 확정
5. **보드 생성**: `--image seed.png`(모티브) + 보드 프롬프트(`--size 1024x1024`, `--quality low`) → `exploration-board.png`. 40개 번호 컨셉을 보여준다.
6. **수정 루프**: 사용자가 "N번 기준 다시" / "N·M 모양 별로"라고 하면 — **직전 보드를 `--image`로 첨부** + 프롬프트엔 번호만: "이 보드 기준으로 다시 만들되 #N 방향을 살려 40칸을 다시 그리고, #M·#K 계열은 빼고 대체". gpt-image-2는 항상 high fidelity라 좋은 칸은 유지되고 지목 방향으로 옮겨간다. 더 과감한 새 보드를 원하면 보드 대신 **시드만 첨부**. `--auto-version`. 원하는 컨셉이 보일 때까지 반복.
7. **단독 로고**: 사용자가 #N을 고르면 — **그 보드를 `--image`로 첨부** + "첨부 보드 #N 칸의 마크만 크고 깨끗한 단독 로고로 재현, 중앙 정렬, plain 단색 배경, 형태·기하 유지, 브랜드 컬러 <HEX>, 단일 마크만(보드 아님)". `--quality high` → `logo-candidate.png`. `logo-art-direction.md` §7 품질 프레이밍 문구를 덧붙이고 §8 품질 테스트로 자가 판정(떨어지면 §1·§2·§7 보강해 재시도).
8. **다듬기 루프**: 직전 후보를 `--image`로 첨부해 한 번에 한 가지만 증분 편집(gpt-image-2가 나머지를 보존), `--auto-version`. lock까지.
9. **확정(복사)**: 확정본을 `.design/final/logo/logo.png`로 복사. 시안은 `generated/logo/`에 보존.

### Phase 3 — (선택) 로고 시스템
10. logo.png lock 후 "워드마크 / 파비콘 / 앱 아이콘도 만들까요?"라고 제안한다. 원하는 것만, **확정 logo.png를 `--image`로 첨부**해 한 개씩 생성→보여줌→다듬기→lock:
    - **wordmark**: "<제품명>을 BRAND_KIT §8 타입 방향으로 워드마크화, 심볼+워드마크 락업 또는 워드마크 단독, plain 단색 배경" → `wordmark.png`.
    - **favicon**: "이 마크를 16/24/32px에서 읽히게 단순화, 단색, 정사각, plain 단색 배경" → `favicon.png`.
    - **app-icon**: "이 마크를 라운드 사각 앱 아이콘 타일에 배치, 브랜드 컬러 배경, iOS/Android 앱 아이콘 스타일, 넉넉한 패딩" → `app-icon.png`.
    - 각 확정본을 `final/logo/`로 복사, `logo-briefs.md`에 로고 시스템 스펙을 기록.
11. 산출 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

## 품질 기준 / 금지 사항

- 보드는 한 장에 40개 번호 컨셉이 또렷이 읽혀야 한다 — `references/logo-exploration-board.md` 따름.
- 단독 로고는 `../references/design/logo-art-direction.md` §8 품질 테스트(실루엣·작은 크기·무텍스트·단색·시스템·의미)를 통과해야 한다.
- 배경은 클린 단색(투명 아님) — gpt-image-2 제약. 진짜 투명이 필요하면 그 단계만 transparent-지원 모델로 재생성.
- 금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미 없는 그라데이션·3D 베벨·드롭섀도·sparkle, 글자만 있는 로고, 보드 셀마다 다른 스타일 난립, 유명 마크 모방 (§6·§9).
- 한글 워드마크는 짧고 단순하게, 정확한 문구의 권위 원본은 `BRAND_KIT.md`.
````

- [ ] **Step 2: 상대경로 검증**

`skills/design-logo/SKILL.md` 기준 다음 경로가 실재하는지 확인:
- `references/logo-exploration-board.md` → `skills/design-logo/references/logo-exploration-board.md` ✓ (Task 2에서 생성)
- `../references/design/logo-art-direction.md` → `skills/references/design/logo-art-direction.md` ✓ (기존)
- `../image-gen/scripts/image-gen.mjs` → `skills/image-gen/scripts/image-gen.mjs` ✓ (기존)

Run (Glob): `skills/references/design/logo-art-direction.md` 와 `skills/image-gen/scripts/image-gen.mjs` 가 존재하는지.
Expected: 둘 다 일치.

- [ ] **Step 3: 커밋** (*사용자 승인 후*)

```bash
git add skills/design-logo/SKILL.md
git commit -m "feat(design-logo): 로고 탐색·확정 스킬 추가"
```

---

## Task 4: 동기화 + 전체 검증

**Files:** (소스 변경 없음 — 번들 재생성·검증)

- [ ] **Step 1: Codex 번들 재생성** (*사용자 승인 후*)

Run: `npm run sync`
Expected: 성공. `plugins/personal/skills/design-logo/`(+`references/`)와 갱신된 `design-brand-kit`이 번들에 반영된다. (번들은 gitignore — 커밋하지 않음.)

- [ ] **Step 2: 번들 확인**

Run (Glob): `plugins/personal/skills/design-logo/**`
Expected: `SKILL.md`와 `references/logo-exploration-board.md`가 복사돼 있음.

- [ ] **Step 3: 전체 테스트** (*사용자 승인 후*)

Run: `npm test`
Expected: 전체 PASS. (소스 변경이 마크다운뿐이라 코드 테스트에 영향 없음. sync-codex-plugin 테스트는 합성 임시 디렉터리만 쓰므로 새 스킬 폴더로 깨지지 않음 — 확인됨.)

- [ ] **Step 4: (선택) 실효 검증 — API 비용**

키가 있고 사용자가 원하면, 실제 `.design/final/brand-kit/brand-overview.png`(또는 가짜 테스트 브랜드 보드)로 Phase 1–2 한 사이클(시드 추출 → 보드 1장, `--quality low`)을 돌려 흐름이 실제로 도는지 본다. **API 호출 직전 사용자 확인 후 실행.**

---

## Self-Review

**1. Spec coverage** (spec §1–13 대조):
- §3 배경 결정(전부 gpt-image-2 + 클린 단색, image-gen 미변경) → 본 플랜 Architecture + Task 3 이미지 생성 절. ✓
- §5 image-gen 변경 드롭 → 본 플랜에 image-gen 태스크 없음. ✓
- §5.1 brand-kit final/logo 비생성 + 파일명 → Task 1. ✓
- §6 SKILL.md 구조 → Task 3. ✓
- §7 산출물·네이밍(seed.png, 클린 단색) → Task 3 출력 파일 절. ✓
- §8 Phase 1–3 흐름 → Task 3 흐름 절. ✓
- §9 보드 ref 내용 → Task 2. ✓
- §10 동기화 → Task 4. ✓
- §11 검증(링크·회귀·번들·실효) → Task 1 Step 7, Task 3 Step 2, Task 4. ✓
- §12 리스크(보드 셀 추출 신뢰도) → Task 3 흐름 7단계 "단일 마크만(보드 아님)" + 다듬기 루프 흡수. ✓

**2. Placeholder scan:** `<HEX>`·`<제품명>`·`[BRAND NAME]`·`[core metaphor]`은 프롬프트 템플릿의 의도된 런타임 치환 변수(스킬이 BRAND_KIT/tokens로 채움)이며 미완성 플랜 항목이 아니다. TBD/TODO 없음.

**3. Type/이름 일관성:** 파일명·경로가 태스크 간 일치 — `seed.png`(투명 흔적 제거), `exploration-board.png`, `logo-candidate.png`, `final/logo/logo.png`, `brand-kit-logo.png`. `--background` 언급은 전부 제거됨(spec §5 드롭과 일치). 전 단계가 `gpt-image-2` + 클린 단색 배경으로 일관.

> 주의(동시 세션): Task 1의 old_string은 다른 세션이 brand-kit 파일을 동시에 수정 중일 수 있어 매칭이 어긋날 수 있다. 매칭 실패 시 해당 줄을 다시 읽어 현재 문구로 old_string을 맞춘 뒤 진행한다.
