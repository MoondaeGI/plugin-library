# brand-kit 메인 보드 "3 시안 발산 → 수렴" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit`의 메인 오버뷰 보드 첫 생성 단계를 "3 시각 루트 발산 → (재시도) → 수렴" 흐름으로 바꾼다.

**Architecture:** 이 변경은 **스킬 지시문(마크다운) 편집만**이다. 새 실행 코드가 없고 `image-gen.mjs`도 손대지 않는다 — 3 시안은 `--n`이 아니라 같은 스크립트의 개별 호출 3번으로 만든다. 따라서 검증은 단위 테스트가 아니라 (a) `image-gen --dry-run`으로 기존 스크립트가 흐름을 지원하는지 확인, (b) `npm test`/`npm run sync` 무회귀, (c) 문서 내부 참조 일관성 읽기검토로 한다.

**Tech Stack:** Markdown 스킬 문서 (`skills/design-brand-kit/`), Node `image-gen.mjs`(무변경), npm scripts.

---

## File Structure

수정 대상 (모두 brand-kit 내부, 둘 다 기존 파일):

- `skills/design-brand-kit/SKILL.md` — 이미지 생성 호출 규칙·저장 경로·흐름·brand-briefs.md 구조 정의.
- `skills/design-brand-kit/references/brand-kit-image.md` — 아트 디렉션 가이드(3 루트 분기·프롬프트 템플릿·협업 루프).

무변경 (명시적으로 건드리지 않음): `skills/image-gen/scripts/image-gen.mjs`, `skills/image-gen/SKILL.md`, `design-page-image` 등 다른 스킬.

참고: brand-briefs.md는 런타임에 대상 프로젝트 `.design/`에 생성되는 산출물이고, 그 **구조 템플릿**은 `SKILL.md` 안(lines 171-210)에 정의돼 있다. 따라서 "brief 구조 변경" = `SKILL.md` 편집이다.

---

## Task 1: SKILL.md — 발산→수렴 흐름과 호출 규칙

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (품질 기준 `:217`, 이미지 생성 호출 규칙 `:231`, 저장 경로 `:241`, 흐름 `:247-257`)

- [ ] **Step 1: 품질 기준의 3 루트 문구를 시안 렌더와 연결**

Find:
```md
- 최소 3가지 시각 루트를 제안한다: ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형. 그중 최종 추천안 하나를 고른다.
```
Replace with:
```md
- 3가지 시각 루트를 제안한다: ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형. 이 3루트가 메인 보드의 발산 단계에서 **3개 초안 시안**으로 렌더되어 사용자가 시각적으로 방향을 고른다(아래 "흐름" 참고). 디스커버리에서 명시적으로 거부된 루트만 다른 방향으로 대체한다.
```

- [ ] **Step 2: "항목당 1회 호출" 규칙에 발산 예외 명시**

Find:
```md
- **항목당 1회 호출.** 한 번에 한 개만 만든다 (여러 장은 `--n`이 아니라 개별 호출). 메인은 종합 오버뷰 보드 한 장이다 — 로고만 따로 만들고 끝내지 않는다.
```
Replace with:
```md
- **여러 장은 항상 `--n`이 아니라 개별 호출.** (`--n`은 같은 프롬프트 샘플링이라 시안 용도로 부적합 — 비슷하게 나온다.)
- **메인 보드 첫 생성만 예외적으로 3장 발산**: 3 시각 루트를 각각 다른 프롬프트로 개별 호출(`--quality low` 초안). 그 외 — 방향 확정 후 재수정, (선택) 로고, 추가 탐색 — 는 모두 **1개씩**. 메인은 종합 오버뷰 보드다 — 로고만 따로 만들고 끝내지 않는다.
```

- [ ] **Step 3: 저장 경로/파일명 규칙에 루트·버전 파일명 추가**

Find:
```md
- **저장 경로**: `--out`에 **대상 프로젝트 cwd 기준 절대 경로** — 종합 보드·추가 탐색은 `<cwd>/.design/generated/brand-kit/`, (선택) 단색 로고는 `<cwd>/.design/generated/logo/`. 파일명 식별 가능(`brand-overview-1.png`, `logo-concept-1.png`), 재생성 시 버전(`-v2`).
```
Replace with:
```md
- **저장 경로**: `--out`에 **대상 프로젝트 cwd 기준 절대 경로** — 종합 보드·추가 탐색은 `<cwd>/.design/generated/brand-kit/`, (선택) 단색 로고는 `<cwd>/.design/generated/logo/`.
- **파일명**: 발산 초안은 루트별 `brand-overview-route-a.png` · `-route-b.png` · `-route-c.png`. 재시도(가챠)는 버전 접미(`-route-a-v2.png` 등). 확정 후 고른 루트를 high로 재렌더하면 `brand-overview.png`. (선택) 로고는 `logo-concept-1.png`. 기존 확정본은 `--force` 없이 덮지 않으므로 재생성은 버전(`-v2`).
```

- [ ] **Step 4: 흐름 섹션을 발산→재시도→수렴→정리로 교체**

Find:
```md
3. **항목을 한 개씩** 진행한다. 순서: **종합 브랜드 오버뷰 보드(필수·메인) → (선택) 단색 클린 로고 → (선택) 추가 탐색 이미지**. 각 항목마다:
   - 이미지 1장 생성(`image-gen` 스크립트; 키 없으면 사람이 드롭) → 보여주고 피드백을 청한다 (예: "이 방향 어때요? 뭘 바꿀까요?").
   - 피드백을 받아 **한 번에 한 섹션/한 가지만** 고쳐 재생성한다. 만족(lock)할 때까지 반복.
   - 확정되면 해당 `.design/generated/<폴더>/`에 저장하고 다음 항목으로.
4. 메인 보드가 확정되면(필요 시 로고·추가 탐색까지) 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

전체를 한꺼번에 생성하지 않는다 — 한 개 만들고, 고치고, 다음으로 넘어간다.
```
Replace with:
```md
3. **종합 브랜드 오버뷰 보드(필수·메인)** — 발산 → (재시도) → 수렴으로 진행한다:
   - **3a · 발산**: 3 시각 루트(①안전한 SaaS형 ②프리미엄 에디토리얼형 ③대담한 실험형)를 각각 다른 프롬프트로 구성해 `--quality low` 초안 3장을 **개별 호출**로 생성(`brand-overview-route-a/b/c.png`). 루트별 프롬프트 분기는 `references/brand-kit-image.md`의 "발산 3 루트"를 따른다. 키가 없으면 사람이 드롭. 3장을 나란히 보여주고 **어느 방향이 좋은지** 묻는다.
   - **재시도(re-roll) 루프** — 3장 다 별로면 두 모드 중 사용자가 고른다:
     - (a) **그대로 다시(가챠)**: 같은 3 루트 프롬프트를 그대로 재호출, 파일명 버전업(`-route-a-v2.png` 등). 같은 방향 새 뽑기 — 같은 프롬프트라 같은 루트 안에선 결이 비슷하다고 미리 알린다.
     - (b) **방향 조정**: 뭐가 별로였는지 받아 루트를 교체하거나 팔레트·구도 축을 틀어 새 3장.
     - 마음에 드는 방향이 나올 때까지 반복(모두 `--quality low` 초안).
   - **3b · 수렴**: 고른 루트를 `--quality high`로 재렌더 → `brand-overview.png`. 이후 피드백을 받아 **한 번에 한 섹션/한 가지만** 고쳐 재생성, lock까지 반복.
   - **정리**: 방향이 lock되면 안 고른 루트·이전 버전 초안 파일을 삭제하고, 고른 보드의 high 버전만 남긴다.
4. **(선택) 단색 클린 로고 → (선택) 추가 탐색 이미지** — 각 항목을 **1개씩**: 1장 생성(키 없으면 드롭) → 보여주고 피드백 → 한 번에 한 가지만 고쳐 재생성 → 확정되면 해당 `.design/generated/<폴더>/`에 저장하고 다음으로.
5. 메인 보드가 확정되면(필요 시 로고·추가 탐색까지) 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

메인 보드는 첫 단계에서만 3장 발산하고 곧장 1개 루프로 수렴한다 — 그 외에는 한꺼번에 생성하지 않고 한 개 만들고, 고치고, 다음으로 넘어간다.
```

- [ ] **Step 5: 편집한 4곳을 읽어 일관성 확인**

Run: `grep -n "route-a\|발산\|--n\|brand-overview" skills/design-brand-kit/SKILL.md`
Expected: 발산/재시도/수렴 문구가 보이고, 파일명이 `brand-overview-route-a/b/c.png`·`brand-overview.png`로 일관되며, 더 이상 `brand-overview-1.png` 표현이 남아있지 않음.

- [ ] **Step 6: Commit**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): 메인 보드 첫 생성을 3 루트 발산→수렴으로"
```

---

## Task 2: SKILL.md — brand-briefs.md 구조에 발산 3 루트 반영

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (brand-briefs.md 구조 `:182-191`, 임시 파일 규칙 `:233`)

- [ ] **Step 1: 보드 브리프의 단일 프롬프트를 발산 3 루트로 교체**

Find:
```md
## 종합 브랜드 오버뷰 보드 (필수 · 메인)
### 캔버스 / 레이아웃 (라이트/다크, 기본 12섹션 그리드)
### 비주얼 모드 (references/brand-kit-image.md의 모드 중 선택)
### 섹션 구성 메모
Brand Overview · Brand Essence · Target Audience · Value Pillars · Tagline Options · Logo Direction · Color System · Typography · Voice & Tone · Visual & UI Direction · Imagery/Iconography · Next Decisions — 로고 외 최소 8개 이상의 섹션이 한눈에.
### 태그라인 (짧고 구체적으로)
### 이미지 생성 Prompt
### Negative Prompt
(텍스트는 읽히고 위계 또렷하게. 정확한 색/폰트 스펙의 권위 원본은 BRAND_KIT.md/tokens — 보드는 그 시각화)
```
Replace with:
```md
## 종합 브랜드 오버뷰 보드 (필수 · 메인)
### 캔버스 / 레이아웃 (라이트/다크, 기본 12섹션 그리드)
### 섹션 구성 메모
Brand Overview · Brand Essence · Target Audience · Value Pillars · Tagline Options · Logo Direction · Color System · Typography · Voice & Tone · Visual & UI Direction · Imagery/Iconography · Next Decisions — 로고 외 최소 8개 이상의 섹션이 한눈에.
### 태그라인 (짧고 구체적으로)
### 발산 3 루트 (메인 보드 첫 생성용)
12섹션 구조·콘텐츠는 공통, 루트마다 **비주얼 모드 · 팔레트 방향 · 구도 에너지 · 이미지 생성 Prompt(루트별 델타)** 로만 분기. 모드/매핑은 references/brand-kit-image.md "발산 3 루트".
- 루트 A — 안전한 SaaS형:
- 루트 B — 프리미엄 에디토리얼형:
- 루트 C — 대담한 실험형:
### Negative Prompt (공통)
(텍스트는 읽히고 위계 또렷하게. 정확한 색/폰트 스펙의 권위 원본은 BRAND_KIT.md/tokens — 보드는 그 시각화)
```

- [ ] **Step 2: 임시 파일 규칙이 루트 프롬프트를 가리키도록 수정**

Find:
```md
- **임시 파일에는 `### 이미지 생성 Prompt` 섹션 내용만 쓴다.** 캔버스/레이아웃·비주얼 모드·섹션 구성 메모·태그라인 설명·로고 유형·형태 언어 등 다른 서브섹션은 포함하지 않는다. Negative Prompt는 프롬프트 마지막에 `Avoid: ...` 한 줄로 합친다.
```
Replace with:
```md
- **임시 파일에는 해당 호출의 프롬프트 본문만 쓴다** — 메인 보드 발산은 `### 발산 3 루트`의 해당 루트 프롬프트(루트별 델타를 12섹션 공통 구조에 적용), 로고·추가 탐색은 각 `### 이미지 생성 Prompt`. 캔버스/레이아웃·섹션 구성 메모·태그라인 설명·로고 유형·형태 언어 등 다른 서브섹션은 포함하지 않는다. Negative Prompt는 프롬프트 마지막에 `Avoid: ...` 한 줄로 합친다.
```

- [ ] **Step 3: 보드 브리프가 더 이상 단일 프롬프트를 참조하지 않는지 확인**

Run: `grep -n "발산 3 루트\|### 이미지 생성 Prompt\|### 비주얼 모드" skills/design-brand-kit/SKILL.md`
Expected: 보드 섹션엔 "### 발산 3 루트"가 있고, 남은 "### 이미지 생성 Prompt"는 로고·추가 탐색 브리프(2곳)뿐. 보드 섹션 안의 "### 비주얼 모드" 단독 줄은 사라짐(공통 방향 섹션의 "비주얼 모드:" 줄은 그대로 OK).

- [ ] **Step 4: Commit**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): brand-briefs 보드 브리프에 발산 3 루트 추가"
```

---

## Task 3: references/brand-kit-image.md — 3 루트 분기 가이드

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md` (산출물 루프 `:12`, §3 허용 변형 뒤 `:98`, 파이프라인 저장/루프 `:157-158`, §12 템플릿 `:195` 뒤)

- [ ] **Step 1: §3 "허용 변형" 뒤에 "발산 3 루트" 가이드 추가**

Find:
```md
콘텐츠가 적거나 무드보드성 결과를 원하면 더 미니멀·시네마틱한 레이아웃도 가능: `3×3` 풀 아이덴티티 / `2×3` 시네마틱 덱 개요 / `2×2` 컴팩트 컨셉 보드 / `1×3` 가로 브랜드 스트립. 단 **기본값은 위 종합 12섹션 보드**이며, 사용자가 명시적으로 요청할 때만 변형으로 간다.
```
Replace with:
```md
콘텐츠가 적거나 무드보드성 결과를 원하면 더 미니멀·시네마틱한 레이아웃도 가능: `3×3` 풀 아이덴티티 / `2×3` 시네마틱 덱 개요 / `2×2` 컴팩트 컨셉 보드 / `1×3` 가로 브랜드 스트립. 단 **기본값은 위 종합 12섹션 보드**이며, 사용자가 명시적으로 요청할 때만 변형으로 간다.

### 발산 3 루트 (메인 보드 첫 생성)

메인 보드의 첫 생성은 **3개 초안 시안**으로 발산한다(SKILL.md "흐름" 3a). 12섹션 구조·콘텐츠는 셋 다 동일하게 유지하고, **비주얼 모드 · 팔레트 · 구도 에너지** 세 축으로만 분기해 서로 또렷이 다른 방향이 되게 한다:

- **루트 A — 안전한 SaaS형**: §4의 "라이트 클린/SaaS" 모드. warm white/mist 배경, 채도 있는 single 액센트, soft rounded 카드, 절제된 그리드. 무드: 신뢰·명료·접근 가능.
- **루트 B — 프리미엄 에디토리얼형**: §4의 "라이트 에디토리얼/컴플라이언스" 또는 "럭셔리/에디토리얼" 모드. ivory/stone, 세리프 워드마크, 종이 그레인, 절제된 액센트, 큰 네거티브 스페이스. 무드: 성숙·고급·취향.
- **루트 C — 대담한 실험형**: §4의 "컬처럴/실험적" 또는 "다크 디벨로퍼/빌더" 모드. 볼드 액센트·하프톤/CRT 텍스처 또는 near-black 패널, 예상 밖 크롭, 강한 위계. 무드: 기억성·자신감(통제된 범위 안에서).

기본은 위 매핑이되, 디스커버리에서 명시적으로 거부된 루트(예: "절대 다크 X")는 그 루트만 §4의 다른 모드로 대체한다. 셋의 차이는 **모드·팔레트·에너지**에서 나오고 같은 브랜드 콘텐츠·같은 12섹션을 공유하므로, "다른 제품"이 아니라 **"같은 브랜드의 세 해석"**으로 읽혀야 한다.
```

- [ ] **Step 2: 산출물 루프 설명(§ 상단)에 발산→수렴 반영**

Find:
```md
두 산출물 모두 한 개씩 만들고 → 보여주고 → 한 번에 한 가지(또는 한 섹션)만 고쳐 재생성하는 협업 루프로 진행한다(SKILL.md "흐름" 참고).
```
Replace with:
```md
종합 보드는 첫 생성에서 3 루트로 **발산**(3 초안 시안)했다가 고른 방향으로 **수렴**한 뒤 한 섹션씩 고치고, (선택) 로고·추가 탐색은 한 개씩 만들고 → 보여주고 → 한 번에 한 가지만 고쳐 재생성하는 협업 루프로 진행한다(SKILL.md "흐름" 참고).
```

- [ ] **Step 3: §11 저장 파일명과 협업 루프 갱신**

Find:
```md
- **저장**: `image-gen` 스크립트의 `--out`에 **프로젝트 cwd 기준 절대 경로**를 직접 지정한다(스크립트가 거기 바로 씀) — 종합 오버뷰 보드 → `<cwd>/.design/generated/brand-kit/`, (선택) 단색 클린 로고 → `<cwd>/.design/generated/logo/`. 파일명 식별 가능(`brand-overview-1.png`, `logo-concept-1.png`), 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다(`--force` 없이는 덮지 않음).
- **협업 루프**: 보드 한 장 생성 → 보여주고 피드백 → 한 번에 한 섹션/한 가지만 고쳐 재생성 → 확정 → (선택) 단색 로고 → 다음.
```
Replace with:
```md
- **저장**: `image-gen` 스크립트의 `--out`에 **프로젝트 cwd 기준 절대 경로**를 직접 지정한다(스크립트가 거기 바로 씀) — 종합 오버뷰 보드 → `<cwd>/.design/generated/brand-kit/`, (선택) 단색 클린 로고 → `<cwd>/.design/generated/logo/`. 파일명 식별 가능 — 발산 초안 `brand-overview-route-a/b/c.png`(재시도 `-v2`), 확정본 `brand-overview.png`, 로고 `logo-concept-1.png`. 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다(`--force` 없이는 덮지 않음).
- **협업 루프**: 메인 보드는 3 루트 발산(초안 3장) → 방향 선택(또는 재시도) → 고른 루트 high 재렌더 → 한 섹션씩 고쳐 재생성 → 확정 → (선택) 단색 로고 → 다음. 로고·추가 탐색은 한 장씩.
```

- [ ] **Step 4: §12 프롬프트 템플릿에 발산 인스턴스화 노트 추가**

Find:
```md
(선택) 단색 클린 로고는 **별도 호출**로(스크립트 재실행, `--out`은 `logo/`): 같은 전략·메타포·팔레트를 쓰되 단일 마크/워드마크를 깨끗한 단색 배경에 크게, 단색(흑/백) 버전 고려, 텍스트 최소.
```
Replace with:
```md
**발산 3 루트**: 위 템플릿을 루트마다 한 번씩, `Visual mode`·`Palette`·구도 에너지 줄만 루트별로 바꿔 3개 프롬프트로 인스턴스화한다(§3 "발산 3 루트" 매핑). `Sections`·`Brand strategy`·`Language` 등 나머지는 공통. 각 프롬프트를 별도 임시 파일에 써서 `--out`을 `brand-overview-route-a/b/c.png`로 개별 호출(`--quality low` 초안).

(선택) 단색 클린 로고는 **별도 호출**로(스크립트 재실행, `--out`은 `logo/`): 같은 전략·메타포·팔레트를 쓰되 단일 마크/워드마크를 깨끗한 단색 배경에 크게, 단색(흑/백) 버전 고려, 텍스트 최소.
```

- [ ] **Step 5: 가이드 내부 참조 일관성 확인**

Run: `grep -n "발산 3 루트\|route-a\|brand-overview-1\|세 해석" skills/design-brand-kit/references/brand-kit-image.md`
Expected: "발산 3 루트" 섹션과 협업 루프·템플릿 노트가 보이고, 파일명이 `brand-overview-route-a/b/c.png`·`brand-overview.png`로 일관되며 `brand-overview-1.png` 표현이 남아있지 않음.

- [ ] **Step 6: Commit**

```bash
git add skills/design-brand-kit/references/brand-kit-image.md
git commit -m "docs(brand-kit): 이미지 가이드에 발산 3 루트 분기·협업 루프 반영"
```

---

## Task 4: 검증 (기존 메커니즘이 흐름을 지원하는지 + 무회귀)

**Files:** (없음 — 검증만)

- [ ] **Step 1: image-gen 무변경 확인**

Run: `git status --short skills/image-gen/`
Expected: 출력 없음 (image-gen은 손대지 않았다).

- [ ] **Step 2: 발산 3 호출이 의도한 경로를 만드는지 dry-run**

Run:
```bash
node "skills/image-gen/scripts/image-gen.mjs" --prompt "route A draft" --out ".design/generated/brand-kit/brand-overview-route-a.png" --size 1024x1536 --quality low --dry-run
node "skills/image-gen/scripts/image-gen.mjs" --prompt "route B draft" --out ".design/generated/brand-kit/brand-overview-route-b.png" --size 1024x1536 --quality low --dry-run
node "skills/image-gen/scripts/image-gen.mjs" --prompt "route C draft" --out ".design/generated/brand-kit/brand-overview-route-c.png" --size 1024x1536 --quality low --dry-run
```
Expected: 각 호출이 `[dry-run] out:`에 해당 route 절대 경로를 출력하고 `quality: "low"` 페이로드를 보여줌. 에러 없음. (dry-run이라 파일·API 호출 없음.)

- [ ] **Step 3: 테스트 스위트 무회귀**

Run: `npm test`
Expected: 기존과 동일하게 통과 (이 변경은 마크다운만 건드리므로 테스트에 영향 없음).

- [ ] **Step 4: Codex 번들 재생성 성공**

Run: `npm run sync`
Expected: sync 성공. brand-kit 스킬 변경이 gitignored `plugins/personal/` 번들로 반영됨.

- [ ] **Step 5: 커밋되는 산출물이 의도치 않게 바뀌지 않았는지 확인**

Run: `git status --short`
Expected: 추적되는 변경은 이 작업의 커밋들뿐. `plugins/personal/`(gitignored)은 status에 안 보이거나 무시됨. `.claude-plugin/mcp.json` 등 MCP 생성물·`codex-agents/`는 변경 없음(스킬 편집은 이들과 무관).

---

## Self-Review

**1. Spec coverage** (스펙 `2026-05-28-brand-kit-3-concept-drafts-design.md` 대비):
- 발산 3a → Task 1 Step 4, Task 3 Step 1. ✓
- 재시도 (a)(b) 루프 → Task 1 Step 4. ✓
- 수렴 3b → Task 1 Step 4. ✓
- 정리(cleanup) → Task 1 Step 4. ✓
- 호출 규칙(--n 아님, 개별 호출) → Task 1 Step 2. ✓
- 파일명·버전 규칙 → Task 1 Step 3, Task 3 Step 3. ✓
- brand-briefs 3 루트 → Task 2. ✓
- 3 루트 분기 가이드(모드/팔레트/에너지) → Task 3 Step 1, Step 4. ✓
- 비용(low 초안 → high 확정) → Task 1 Step 4 문구. ✓
- image-gen 무변경 → Task 4 Step 1. ✓
- 검증(dry-run + suite + sync + 일관성) → Task 4 전체 + 각 Task의 grep step. ✓

**2. Placeholder scan:** 모든 편집 단계가 실제 교체 마크다운을 포함, "TBD/TODO/적절히" 없음. ✓

**3. Type/naming consistency:** 파일명 토큰이 전 태스크에서 일관 — `brand-overview-route-a/b/c.png`, 재시도 `-route-a-v2.png`, 확정 `brand-overview.png`. 옛 표기 `brand-overview-1.png`는 Task 1·3에서 모두 제거. 루트 라벨 A/B/C와 ①②③ 매핑이 SKILL.md·가이드에서 동일. ✓
