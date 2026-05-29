# 아이콘 ref 재구조화 + brand-kit 배선 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 단일 `icon-art-direction.md`를 목적별 4개 ref 팩(`skills/references/design/icon/`)으로 분할하고, `design-brand-kit`이 `BRAND_KIT.md §11`을 아이콘 결정의 단일 소스로 삼아 보드 전 섹션 아이콘을 한 시스템으로 묶도록 배선한다.

**Architecture:** ref는 수동적 지식이고 스킬 step이 시점·섹션·산출물을 지정해야 살아난다. `icon-rules.md`가 렌더 백본(시스템 파라미터 + 프롬프트 청크), 나머지 3파일(style-catalog·domain-examples·reference-vendors)이 스타일 선택·도메인 메타포·벤더 분석을 분담한다. `design-brand-kit` 흐름 1단계가 이 팩을 읽어 `BRAND_KIT.md §11`(3필드 확장)에 증류하고, 보드 프롬프트 템플릿이 §11 시스템을 전 섹션 아이콘에 전파한다.

**Tech Stack:** Markdown ref/skill 문서, Claude+Codex 플러그인 모노레포(`npm run sync`로 Codex 번들 재생성), 검증은 grep·정합성 확인.

**참조 spec:** `docs/superpowers/specs/2026-05-29-icon-reference-restructure-design.md`

---

## File Structure

- **Create:** `skills/references/design/icon/icon-rules.md` — 렌더 백본(원칙 + 시스템 파라미터 + 세트 구성 + Avoid + 프롬프트 청크 + 검증 테스트). 항상 읽힘.
- **Create:** `skills/references/design/icon/icon-style-catalog.md` — 5 스타일 아키타입 + 선택 규칙. 스타일 선택 시점.
- **Create:** `skills/references/design/icon/icon-domain-examples.md` — 8 도메인 메타포·스타일. 프로젝트 도메인 섹션만.
- **Create:** `skills/references/design/icon/icon-reference-vendors.md` — 벤더 분석, agent-facing, 프롬프트 인용 금지.
- **Delete:** `skills/references/design/icon-art-direction.md` — 내용 이관 완료 후 삭제.
- **Modify:** `skills/design-brand-kit/SKILL.md` — §11 템플릿 3필드 확장 + 흐름 1단계 step.
- **Modify:** `skills/design-brand-kit/references/brand-kit-image.md` — §7 포인터 경로 + §12 프롬프트 템플릿 cross-section 줄.

---

## Task 1: `icon-rules.md` 생성 (렌더 백본)

**Files:**
- Create: `skills/references/design/icon/icon-rules.md`

- [ ] **Step 1: 파일 작성**

아래 전체 내용을 그대로 쓴다.

````markdown
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
````

- [ ] **Step 2: 검증 — 프롬프트 청크가 §11 브래킷을 가리키는지 확인**

Run: `rg "BRAND_KIT.md §11" "skills/references/design/icon/icon-rules.md"`
Expected: §0·§6에서 최소 2건 매치(스타일·모티프를 §11에서 채운다는 명시).

---

## Task 2: `icon-style-catalog.md` 생성

**Files:**
- Create: `skills/references/design/icon/icon-style-catalog.md`

- [ ] **Step 1: 파일 작성**

````markdown
# 아이콘 스타일 카탈로그 (Icon Style Catalog)

`icon-rules.md` §1의 "스타일 하나를 고른다"를 실제 선택으로 만드는 ref다. 브랜드 성격과 **사용 환경**에 따라 아래 중 하나를 기본 스타일로 정한다. 아이콘은 반드시 line일 필요가 없다 — filled가 더 맞는 브랜드도 많다.

각 항목의 **[적용]** 태그: `보드 보조용`(brand-kit 보드의 작은 섹션 아이콘에 안전) / `풀 제품 시스템용`(제품 UI 아이콘 세트에 적합).

## 1. Line / Outline
- 느낌: 정밀·차분. 정보량 많은 UI에서 부담이 적음.
- 추천: SaaS·대시보드·B2B·생산성·개발자 도구.
- 주의: 너무 귀엽지 않게 디테일 절제.
- [적용] 보드 보조용 + 풀 제품 시스템용. **밀집 보조 용도의 안전한 기본값.**

## 2. Filled
- 느낌: 더 강한 식별성. 작은 크기에서 잘 보임.
- 추천: 모바일 앱·사이드바·탭바·앱 아이콘.
- 주의: 모든 아이콘에 과하게 쓰면 무거워짐.
- [적용] 풀 제품 시스템용(특히 모바일·탭바).

## 3. Duotone
- 느낌: 기능 그룹 구분·브랜드 컬러 강조에 좋음.
- 추천: 카테고리 구분이 필요한 대시보드·기능 그룹.
- 주의: 너무 많이 쓰면 산만. One-Color Test 통과 필수(색 빠져도 의미 유지).
- [적용] 풀 제품 시스템용. 보드엔 제한적으로.

## 4. Solid Glyph
- 느낌: 단단·명확. 컴팩트 UI에서 안정적.
- 추천: 내비게이션·상태 표시·favicon·앱 아이콘·collapsed sidebar.
- 주의: 일반 UI 아이콘 전체를 glyph로 만들면 답답해질 수 있음. 메인 세트와 충돌 않게 제한적으로.
- [적용] 풀 제품 시스템용(컴팩트·상태·앱 아이콘).

## 5. Outline + Minimal Fill
- 느낌: 기능적·시각 강조 가능. 대시보드에 적합.
- 추천: 상태 표시·알림·위험도 배지·카드/주요 메뉴 아이콘.
- 주의: 모든 아이콘에 fill을 과하게 쓰면 무거워짐.
- [적용] 보드 보조용 + 풀 제품 시스템용.

## (특수) Illustrative
- 느낌: 풍부·서사적. 랜딩·온보딩·빈 상태에 좋음.
- 주의: 제품 UI의 기본 아이콘으로는 과함.
- [적용] 랜딩·온보딩·빈 상태 **특수 용도로만 제한**. 기본 세트 스타일로 쓰지 않는다.

## 선택 규칙

- 세트당 **기본 스타일 하나로 통일**한다.
- Line과 Filled를 함께 쓸 경우엔 **명확한 역할 구분**이 있어야 한다. 예:
  - Navigation: line
  - Active navigation: filled
  - Empty state: illustrative
  - Status badge: solid glyph
- 고른 스타일과 근거를 `BRAND_KIT.md §11 아이콘 스타일` 필드에 한 줄로 박는다.
````

- [ ] **Step 2: 검증**

Run: `rg -c "\[적용\]" "skills/references/design/icon/icon-style-catalog.md"`
Expected: 5 (5개 기본 아키타입에 적용 태그). Illustrative는 특수라 별도.

---

## Task 3: `icon-domain-examples.md` 생성

**Files:**
- Create: `skills/references/design/icon/icon-domain-examples.md`

- [ ] **Step 1: 파일 작성**

````markdown
# 아이콘 도메인 예시 (Icon Domain Examples)

이 문서는 특정 프로젝트에 종속되지 않는 **업종별 아이콘 메타포 예시**다. agent는 **프로젝트 카테고리에 맞는 섹션만** 참고한다.

> **추상화 캐벗:** 아래 명사형(lock·heart·cross·shield 등)은 **출발점일 뿐**이다. 그대로 그리면 `icon-rules.md §4`가 경고하는 클리셰가 된다. 반드시 **추상 모티프(경계·흐름·신호·노드·궤도·경로)로 환원**한다. 예: lock → protected boundary, heart → care signal, shield → enclosed core.

## B2B SaaS
- 권장 메타포: dashboard · workflow · document · automation · team · status · analytics · approval · notification
- 어울리는 스타일: line · outline+minimal fill · geometric outline

## Developer Tools
- 권장 메타포: terminal · cursor · branch · node · package · deploy · log · API · webhook
- 어울리는 스타일: geometric line · mono-like stroke · compact glyph

## Security / Compliance
- 권장 메타포: boundary · protected core · audit trail · evidence · policy · detection · access · identity · risk state
- 어울리는 스타일: geometric outline · solid status glyph · restrained duotone

## Fintech
- 권장 메타포: transaction · wallet · chart · card · verification · balance · lock(→secure boundary) · exchange · receipt
- 어울리는 스타일: filled · duotone · clean line

## Healthcare
- 권장 메타포: care · record · appointment · signal · checkup · patient · heart(→care signal) · cross(→care marker) · shielded data
- 어울리는 스타일: rounded line · soft filled · friendly duotone

## Education
- 권장 메타포: book · path · progress · quiz · certificate · note · mentor · classroom · badge
- 어울리는 스타일: rounded line · filled · playful but controlled

## E-commerce
- 권장 메타포: cart · package · delivery · payment · discount · review · store · inventory · return
- 어울리는 스타일: filled · rounded line · duotone

## AI / Automation
- 권장 메타포: node · spark(절제) · path · agent · loop · handoff · model · prompt · decision
- 어울리는 스타일: line · duotone · abstract glyph
````

- [ ] **Step 2: 검증 — 8 도메인 + 캐벗 존재 확인**

Run: `rg -c "^## " "skills/references/design/icon/icon-domain-examples.md"`
Expected: 8 (8개 도메인 섹션).

Run: `rg "추상 모티프" "skills/references/design/icon/icon-domain-examples.md"`
Expected: 캐벗 1건 매치.

---

## Task 4: `icon-reference-vendors.md` 생성

**Files:**
- Create: `skills/references/design/icon/icon-reference-vendors.md`

- [ ] **Step 1: 파일 작성**

````markdown
# 아이콘 벤더 레퍼런스 (Icon Reference Vendors)

이 문서는 **아이콘 스타일 분석용 agent-facing 레퍼런스**다. 특정 벤더의 아이콘을 복제하지 않는다. 추출할 것은 **스타일 원칙·밀도·stroke·corner·filled/line 사용 방식·상태 표현 방식**뿐이다.

> **인용 금지:** 이미지 모델은 "Linear처럼"을 그리지 못한다. 이 문서는 agent가 `icon-style-catalog.md`에서 파라미터를 고를 때 쓰는 보정용이며, **벤더명을 `BRAND_KIT.md §11`이나 이미지 프롬프트에 절대 쓰지 않는다.** 추출한 *원칙*만 프롬프트에 반영한다.

## Apple SF Symbols
- 시스템 UI에 최적화된 glyph 중심. line과 filled 변형이 체계적으로 존재. 작은 크기 식별성 좋음.
- 참고 포인트: size별 안정성, active/inactive 변형.

## Material Symbols
- outlined / rounded / sharp / filled 등 스타일 축이 명확. 대규모 제품 전반에 쓰기 좋음.
- 참고 포인트: 스타일 variant 관리, 상태별 icon family.

## Atlassian
- 협업/업무툴에 맞는 실용적 아이콘 언어. 과하게 장식적이지 않고 기능 이해가 빠름.
- 참고 포인트: B2B SaaS 기능 아이콘의 명확성.

## Linear
- 미니멀하고 정밀한 제품 UI 아이콘. 개발자/프로덕트 도구에 잘 맞음.
- 참고 포인트: 작은 UI 안에서의 절제된 디테일.

## Stripe
- 문서·결제·인프라 느낌을 깔끔하게 표현. line과 simple shape의 균형이 좋음.
- 참고 포인트: 복잡한 개념을 단순 아이콘으로 줄이는 방식.

## 주의
- 특정 벤더의 형태를 그대로 따라 하지 않는다.
- 브랜드 고유 아이콘처럼 보이도록 메타포와 스타일을 재해석한다.
````

- [ ] **Step 2: 검증 — 인용 금지 규칙 존재 확인**

Run: `rg "인용 금지|절대 쓰지 않는다" "skills/references/design/icon/icon-reference-vendors.md"`
Expected: 1건 이상 매치.

- [ ] **Step 3: Task 1–4 커밋**

```bash
git add skills/references/design/icon/
git commit -m "docs(icon): icon-art-direction을 icon/ 팩 4파일로 분할

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: `design-brand-kit/SKILL.md` — §11 템플릿 확장 + 흐름 1단계 step

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md:147-150` (§11 템플릿), `:266` (포인터), `:272` (흐름 1단계)

- [ ] **Step 1: §11 템플릿 3필드 확장**

`SKILL.md`의 §11 블록을 찾는다(현재):
```md
## 11. 이미지 / 아이코노그래피 (Imagery / Iconography)
- 이미지 성향:
- 아이콘 스타일(선 굵기·조인·톤):
- 피해야 할 이미지:
```
다음으로 교체:
```md
## 11. 이미지 / 아이코노그래피 (Imagery / Iconography)
- 이미지 성향:
- 아이콘 스타일: (icon-style-catalog에서 고른 하나 + 근거 한 줄)
- 아이콘 메타포 모티프: (icon-domain-examples의 도메인 추상 모티프)
- 상태 아이콘 규칙: (형태 동일·색만 분기)
- 피해야 할 이미지:
```

- [ ] **Step 2: 흐름 1단계에 아이콘 팩 읽기 step 추가**

`SKILL.md` 흐름 1단계(현재 `:272`, "1. `.design/BRAND_KIT.md` ... 박고, 승인 게이트(3)에서 specimen URL로 확인받는다.")의 끝에 다음 문장을 이어 붙인다:

```md
§11 아이코노그래피는 `../references/design/icon/icon-rules.md`(핵심 원칙·시스템 파라미터)를 읽고, `icon-style-catalog.md`에서 브랜드 성격·사용 환경에 맞는 스타일 하나를 확정하며, `icon-domain-examples.md`에서 프로젝트 도메인 섹션만 읽어 추상 메타포 모티프를 끌어와 §11 3필드(스타일·모티프·상태 규칙)에 증류한다. (선택) `icon-reference-vendors.md`로 스타일을 보정하되 벤더명은 §11·프롬프트에 쓰지 않는다.
```

- [ ] **Step 3: 포인터 경로 갱신 (`:266`)**

`SKILL.md:266`에서 `../references/design/icon-art-direction.md`를 찾아 `../references/design/icon/icon-rules.md`로 교체한다. (해당 줄의 "아이콘 세트는 icon-art-direction.md를 끌어다 쓴다" → "아이콘 세트는 icon/icon-rules.md를 끌어다 쓴다".)

- [ ] **Step 4: 검증**

Run: `rg "icon-art-direction" "skills/design-brand-kit/SKILL.md"`
Expected: 0건(매치 없음).

Run: `rg "icon/icon-rules.md|아이콘 메타포 모티프|상태 아이콘 규칙" "skills/design-brand-kit/SKILL.md"`
Expected: 3건 이상(포인터 + §11 신규 필드 2개 + 흐름 step).

---

## Task 6: `brand-kit-image.md` — §7 포인터 + §12 cross-section 줄

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md:142` (§7 포인터), `:184-197` (§12 Sections 블록)

- [ ] **Step 1: §7 포인터 경로 갱신 (`:142`)**

`brand-kit-image.md:142`에서 `../../references/design/icon-art-direction.md`를 찾아 `../../references/design/icon/icon-rules.md`로 교체한다. 같은 문장 끝에 다음을 덧붙인다: "스타일 선택은 `icon/icon-style-catalog.md`, 도메인 메타포는 `icon/icon-domain-examples.md`(도메인 섹션만) — 결정은 `BRAND_KIT.md §11`에 증류돼 있다."

- [ ] **Step 2: §12 프롬프트 템플릿에 cross-section 일관성 줄 추가**

`brand-kit-image.md` §12 프롬프트 템플릿의 `11. Imagery / Iconography (icon set + style note)` 줄 바로 아래(같은 코드블록 내, `Do NOT render a "Next Decisions"...` 줄 위)에 다음 줄을 추가한다:

```text
All section icons (Essence, Target, Value Pillars, Imagery) follow ONE icon system defined in BRAND_KIT.md §11 — identical stroke weight, join/terminal, grid, and metaphor language. No section uses a different icon look.
```

- [ ] **Step 3: 검증**

Run: `rg "icon-art-direction" "skills/design-brand-kit/references/brand-kit-image.md"`
Expected: 0건.

Run: `rg "All section icons|icon/icon-style-catalog" "skills/design-brand-kit/references/brand-kit-image.md"`
Expected: 2건(cross-section 줄 + catalog 포인터).

---

## Task 7: 기존 파일 삭제 + 댕글링 참조 전역 검증

**Files:**
- Delete: `skills/references/design/icon-art-direction.md`

- [ ] **Step 1: 기존 파일 삭제**

```bash
git rm skills/references/design/icon-art-direction.md
```

- [ ] **Step 2: 라이브 스킬 전역에 댕글링 참조 0건 확인**

Run: `rg "icon-art-direction" skills/`
Expected: 0건(매치 없음 — `skills/` 하위 라이브 ref·스킬에 잔존 참조 없음).

> 참고: `docs/` 하위 specs·plans의 `icon-art-direction` 참조는 히스토리 기록이므로 갱신/삭제하지 않는다.

---

## Task 8: Codex 번들 동기화 + 최종 커밋

**Files:**
- (자동 생성물) `plugins/personal/` — gitignore, 커밋 안 함.

- [ ] **Step 1: 생성물 동기화 (실행 전 사용자 승인)**

Run: `npm run sync`
Expected: 에러 없이 완료. `plugins/personal/references/design/icon/`에 4파일 반영(gitignore라 git엔 안 보임).

- [ ] **Step 2: validate 게이트 통과 확인**

Run: `npm run validate`
Expected: "sync-mcp: all generated files are up to date."

- [ ] **Step 3: 변경 스테이징 확인**

Run: `git status --short`
Expected: `skills/design-brand-kit/SKILL.md`(M), `skills/design-brand-kit/references/brand-kit-image.md`(M), `skills/references/design/icon-art-direction.md`(D)만. `plugins/personal/`·`codex-agents/`는 안 보임.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md skills/design-brand-kit/references/brand-kit-image.md skills/references/design/icon-art-direction.md
git commit -m "docs(brand-kit): §11을 아이콘 결정 단일 소스로 확장 + 보드 전 섹션 아이콘 시스템 배선

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 5: 플러그인 재설치·reload 안내**

`skills/` 변경이므로 `npm run codex:reinstall` 실행(실행 전 사용자 승인). 그 뒤 사용자에게 안내: "이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."

---

## Self-Review

**1. Spec coverage:**
- A.1 icon-rules → Task 1 ✓ / A.2 style-catalog → Task 2 ✓ / A.3 domain-examples → Task 3 ✓ / A.4 reference-vendors → Task 4 ✓
- B §11 3필드 확장 → Task 5 Step 1 ✓ / C 흐름 1단계 step → Task 5 Step 2 ✓ / D 포인터+§12 cross-section → Task 5 Step 3 + Task 6 ✓ / E 삭제+갱신 → Task 5–7 ✓
- 검증 1(댕글링) → Task 7 Step 2 ✓ / 검증 2(청크 정합) → Task 1 Step 2 ✓ / 검증 3(배선) → Task 5–6 검증 ✓ / 검증 4(sync) → Task 8 ✓
- 비목표(design-icon 보류, docs 미수정) → Task 7 Step 2 참고문에 반영 ✓

**2. Placeholder scan:** [브래킷]은 프롬프트 청크의 의도적 채움자리(§6에서 채우는 법 명시) — placeholder 아님. TBD/TODO 없음. ✓

**3. Type consistency:** 파일명·경로 일관(`icon/icon-rules.md` 등), §11 필드명(`아이콘 스타일`/`아이콘 메타포 모티프`/`상태 아이콘 규칙`)이 Task 5·6에서 동일. ✓
