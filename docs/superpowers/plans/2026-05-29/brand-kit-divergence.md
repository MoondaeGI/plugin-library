# design-brand-kit 전략 단위 발산 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-kit 메인 보드 발산을 "비주얼 모드 델타"에서 "전략 전체가 다른 3개 풀 BRAND_KIT 방향"으로 끌어올리고, 발산 시점을 분위기 결정 단계로 옮긴다(분위기 열림→3, 고정→1).

**Architecture:** 마크다운 스킬 콘텐츠 편집만. 코드/테스트 없음. 검증은 편집 후 재독·grep 일관성·`npm run validate`. 두 파일(`skills/design-brand-kit/SKILL.md`, `skills/design-brand-kit/references/brand-kit-image.md`)이 의미적으로 결합돼 있어 한 논리 단위로 보고 마지막에 단일 커밋.

**Tech Stack:** Markdown(스킬), Edit 툴, `npm run sync`/`npm run validate`.

**Spec:** `docs/superpowers/specs/2026-05-29/brand-kit-divergence-design.md`

---

## File Structure

- Modify: `skills/design-brand-kit/SKILL.md` — description·Q&A 로직·출력 파일·brand-briefs 구조·품질 기준·이미지 생성·흐름.
- Modify: `skills/design-brand-kit/references/brand-kit-image.md` — §3 "발산 3 루트" 의미 전환 + 템플릿 인스턴스화 노트.

발산 산출물 파일 레이아웃(런타임 대상 프로젝트의 `.design/`)은 스킬 텍스트로만 정의 — 이 스킬 repo엔 디렉터리를 만들지 않는다.

---

### Task 1: SKILL.md frontmatter description 갱신

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (line 3, description)

- [ ] **Step 1: description 발산 문구 교체**

old (해당 부분):
```
(메인 보드는 3개 시안으로 발산해 고른 방향으로 수렴).
```
new:
```
(분위기가 열려 있으면 전략이 다른 3개 브랜드 방향—각 풀 BRAND_KIT—으로 발산해 하나로 수렴; 분위기를 정하면 1개 직행).
```

- [ ] **Step 2: 검증** — 해당 줄 재독, "3개 시안으로 발산" 잔존 없는지 grep.

---

### Task 2: Q&A 질문 로직에 발산 트리거 추가

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (### 질문 로직, lines 31-37)

- [ ] **Step 1: "모호한 답변은 파고든다" 범위 한정**

old:
```
- **모호한 답변은 파고든다**: "분위기 있게요" 같은 추상적 답변은 구체화될 때까지 후속 질문을 이어간다. 횟수 제한 없음.
  - 기준: **이 답변으로 HEX 값이나 타이포 방향을 결정할 수 있는가?**
```
new:
```
- **모호한 답변은 파고든다 (제품 사실·결정 가능 정보)**: "분위기 있게요" 같은 추상적 답변은 구체화될 때까지 후속 질문을 이어간다. 횟수 제한 없음. 단 **미감/시각 방향**은 아래 "발산 트리거"의 예외를 따른다 — 하나로 좁히지 않고 발산할 수 있다.
  - 기준: **이 답변으로 HEX 값이나 타이포 방향을 결정할 수 있는가?**
```

- [ ] **Step 2: 발산 트리거 불릿 추가** ("위임 처리" 불릿 뒤, "종료" 앞에 삽입)

추가할 불릿:
```
- **발산 트리거 (미감 축)**: Q&A가 끝나면 미감/시각 방향이 하나로 **고정**됐는지 판정한다.
  - **고정 → 1개 직행**: 명확한 무드·레퍼런스·스타일로 단일 방향이 정해짐(예: "미니멀 에디토리얼, Linear 같은 느낌").
  - **열림 → 3개 발산**: 미감을 명시 위임("AI한테 맡길게요"/"모르겠어요")했거나 기능 정보만 주고 미감 스티어가 없음. 이때 미감을 하나로 파고들어 좁히는 대신 **전략이 다른 3개 브랜드 방향으로 발산**한다(흐름 4) — 반응으로 고르는 게 명세로 짜내는 것보다 쉽다.
  - 제품 사실(Q1–3)은 발산 여부와 무관하게 항상 확정한다. 페르소나·기대 감정·피해야 할 분위기(Q4–6)는 항상 수집해 **3방향의 발산 폭을 앵커링**한다 — 특히 Q6(피해야 할 분위기)는 세 방향 **모두**의 제약이다.
```

- [ ] **Step 3: 검증** — 질문 로직 섹션 재독, 불릿 순서(맥락추론·한번에하나·파고든다·위임처리·발산트리거·종료) 확인.

---

### Task 3: 출력 파일에 발산 후보 레이아웃 추가

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (## 출력 파일, lines 55-63)

- [ ] **Step 1: candidates 레이아웃 불릿 추가** (`.design/generated/brand-kit/` 불릿 뒤, `.design/final/brand-kit/` 앞)

추가할 불릿:
```
- `.design/generated/brand-kit/candidates/direction-{a,b,c}/` — **발산 시(분위기 열림)** 후보 방향별 풀 `BRAND_KIT.md` + `brand-tokens.json` + `brief.md`. 보드는 `.design/generated/brand-kit/brand-overview-route-{a,b,c}.png`(route-X ↔ direction-X 매핑 고정). 고른 방향만 canonical(`.design/BRAND_KIT.md`·`brand-tokens.json`·`image-briefs/brand-briefs.md`)로 승격하고 안 고른 후보는 시안으로 보존한다. **분위기 고정이면 후보 없이 canonical 1벌을 직접 작성**한다(발산 안 함).
```

- [ ] **Step 2: 검증** — 출력 파일 섹션 재독, route-X↔direction-X 매핑·승격 규칙 명시 확인.

---

### Task 4: brand-briefs.md 구조의 "발산 3 루트" 의미 전환

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (## brand-briefs.md 구조 → ### 발산 3 루트, lines 198-202)

- [ ] **Step 1: 발산 3 루트 본문 교체**

old:
```
### 발산 3 루트 (메인 보드 첫 생성용)
11섹션(§1–11) 구조·콘텐츠는 공통, 루트마다 **비주얼 모드 · 팔레트 방향 · 구도 에너지 · 이미지 생성 Prompt(루트별 델타)** 로만 분기. 모드/매핑은 references/brand-kit-image.md "발산 3 루트".
- 루트 A — 안전한 SaaS형:
- 루트 B — 프리미엄 에디토리얼형:
- 루트 C — 대담한 실험형:
```
new:
```
### 발산 3 루트 (메인 보드 첫 생성용 · 분위기 열림일 때만)
발산 시 각 루트는 자기 **후보 BRAND_KIT 전문**에서 인스턴스화한다 — 성격·팔레트·타이포·보이스·UI가 **모두** 방향별로 다르다(비주얼 모드 델타가 아니라 전략 전체 발산). 방향별 brief는 `candidates/direction-{a,b,c}/brief.md`에 둔다. 셋은 같은 제품 사실(§1·타깃·문제)과 Q6 회피 제약만 공유한다. 아래 3 아키타입은 **발산 스프레드의 출발점**이되 제품 무드(Q4–6)에 맞춰 또렷이 다른 세 방향으로 구체화한다. 모드/스프레드 매핑은 references/brand-kit-image.md "발산 3 루트". (분위기 고정이면 이 서브섹션을 건너뛰고 단일 방향 보드 brief만.)
- 루트 A — 안전한 SaaS형 (출발점):
- 루트 B — 프리미엄 에디토리얼형 (출발점):
- 루트 C — 대담한 실험형 (출발점):
```

- [ ] **Step 2: 검증** — brand-briefs 구조 재독, "11섹션 구조·콘텐츠는 공통" 잔존 없는지 확인.

---

### Task 5: 품질 기준의 3 루트 항목 갱신

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (## 품질 기준, line 218)

- [ ] **Step 1: 3 루트 불릿 교체**

old:
```
- 3가지 시각 루트를 제안한다: ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형. 이 3루트가 메인 보드의 발산 단계에서 **3개 초안 시안**으로 렌더되어 사용자가 시각적으로 방향을 고른다(아래 "흐름" 참고). 디스커버리에서 명시적으로 거부된 루트만 다른 방향으로 대체한다.
```
new:
```
- 분위기가 열려 있으면 **전략이 다른 3개 브랜드 방향**(각 풀 BRAND_KIT — 성격·팔레트·타이포·보이스·UI 전체가 다름)을 제안해 각각 초안 보드로 렌더하고, 사용자가 보고 하나를 고른다(아래 "흐름" 참고). ① 안전한 SaaS형 ② 프리미엄 에디토리얼형 ③ 대담한 실험형은 **발산 스프레드의 출발점**이되 제품 무드(Q4–6)에 맞춰 또렷이 다른 세 방향으로 구체화한다 — 비주얼만 다른 "같은 브랜드의 세 해석"이 아니다. 분위기가 고정이면 1개 방향만 만든다. 디스커버리에서 명시적으로 거부된 방향만 다른 것으로 대체한다.
```

- [ ] **Step 2: 검증** — 품질 기준 재독.

---

### Task 6: 이미지 생성 규칙의 발산 항목 갱신

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (## 이미지 생성, lines 234, 236)

- [ ] **Step 1: "메인 보드 첫 생성만 예외적으로 3장 발산" 불릿 교체** (line 234)

old:
```
- **메인 보드 첫 생성만 예외적으로 3장 발산**: 3 시각 루트를 각각 다른 프롬프트로 개별 호출(`--quality low` 초안). 그 외 — 방향 확정 후 재수정, 추가 탐색 — 는 모두 **1개씩**. 메인은 종합 오버뷰 보드이며, 로고는 그 안의 §6 섹션으로만 들어간다(독립 로고 이미지는 만들지 않음).
```
new:
```
- **메인 보드 첫 생성: 분위기 열림이면 3장 발산, 고정이면 1장**: 열림이면 **후보 킷별로**(direction-a/b/c) 각각 자기 BRAND_KIT 전문에서 구성한 다른 프롬프트로 개별 호출(`--quality low` 초안, route-a/b/c) — 비주얼 델타가 아니라 방향별 전체 분기. 고정이면 단일 방향 1장. 그 외 — 방향 확정 후 재수정, 추가 탐색 — 는 모두 **1개씩**. 메인은 종합 오버뷰 보드이며, 로고는 그 안의 §6 섹션으로만 들어간다(독립 로고 이미지는 만들지 않음).
```

- [ ] **Step 2: 임시 파일 프롬프트 본문 노트 갱신** (line 236)

old (해당 부분):
```
메인 보드 발산은 `### 발산 3 루트`의 해당 루트 프롬프트(루트별 델타를 11섹션 §1–11 공통 구조에 적용), 추가 탐색은 `### 이미지 생성 Prompt`.
```
new:
```
메인 보드 발산은 해당 후보 킷(direction-X)에서 구성한 루트 프롬프트(방향별 전체 전략 반영), 추가 탐색은 `### 이미지 생성 Prompt`.
```

- [ ] **Step 3: 검증** — 이미지 생성 섹션 재독, "3 시각 루트" 잔존 없는지 grep.

---

### Task 7: 흐름(디자이너 협업 루프) 재구성

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (## 흐름, lines 261-275)

- [ ] **Step 1: Step 1(킷 작성)을 분위기 분기로 교체**

old(line 261 첫 문장):
```
1. `.design/BRAND_KIT.md` + `.design/brand-tokens.json` 작성 (방향 문서; 색·타이포 권위 원본은 여기에. §1–11은 보드 섹션과 1:1, §12 다음 결정 사항은 md 전용·보드 제외).
```
new:
```
1. **킷 작성 (분위기 분기)** — 색·타이포 권위 원본은 여기에. §1–11은 보드 섹션과 1:1, §12 다음 결정 사항은 md 전용·보드 제외.
   - **분위기 고정**: canonical `.design/BRAND_KIT.md` + `.design/brand-tokens.json` 1벌 작성.
   - **분위기 열림**: `.design/generated/brand-kit/candidates/direction-{a,b,c}/`에 풀 `BRAND_KIT.md` + `brand-tokens.json` **3벌** 작성 — 셋 다 §1–12 완전히 채우고, 성격·팔레트·타이포·보이스·UI가 방향별로 다르다. Q4–6이 발산 폭을 앵커링하고 셋 다 Q6 회피 제약을 지킨다. (canonical은 아직 없음 — 고른 것이 곧 canonical.)
```
(line 261의 나머지 — §8 타이포/§11 아이코노그래피 안내 — 는 그대로 두되 "각 킷(또는 단일 킷)" 기준으로 읽는다. 문장 끝에 다음을 덧붙임: " 발산 시 이 §8·§11 작업은 후보 킷마다 수행한다.")

- [ ] **Step 2: Step 2(brief) 분기 주석 추가**

old:
```
2. `.design/image-briefs/brand-briefs.md` 작성 (종합 오버뷰 보드·(선택) 추가 탐색 브리프).
```
new:
```
2. brief 작성 — 분위기 고정이면 `.design/image-briefs/brand-briefs.md` 1벌(종합 오버뷰 보드·(선택) 추가 탐색). 분위기 열림이면 방향별 `candidates/direction-{a,b,c}/brief.md` 3벌(고른 것이 승격됨).
```

- [ ] **Step 3: Step 3(승인 게이트) 분기로 교체**

old:
```
3. **승인 게이트 (이미지 생성 전 필수)** — 세 문서(`BRAND_KIT.md`·`brand-tokens.json`·`brand-briefs.md`)를 사용자에게 제시하고 방향이 맞는지 확인받는다. **승인 전에는 초안 한 장도 생성하지 않는다** — 이미지는 OpenAI API 실비가 들고, brief가 어긋나면 발산 3장을 통째로 날리므로 가장 싼 텍스트 단계에서 잡는다. 수정 요청은 문서를 고쳐 다시 확인받고, 명시적으로 승인되면 다음으로.
```
new:
```
3. **승인 게이트 (이미지 생성 전 필수)** — **승인 전에는 초안 한 장도 생성하지 않는다**(이미지는 OpenAI API 실비; 가장 싼 텍스트 단계에서 잡는다).
   - **분위기 고정**: 세 문서(`BRAND_KIT.md`·`brand-tokens.json`·`brand-briefs.md`)를 제시하고 방향 확인 → 승인 → 단일 보드 렌더.
   - **분위기 열림**: 후보 3 방향을 **각 몇 줄 요약**(성격·팔레트 시드·타이포 결·보이스 톤·UI 무드)으로 제시한다 — 풀 킷 전문을 강독하도록 강요하지 않는다. "이 세 방향 스프레드가 렌더해볼 만한가" 확인받고, 사용자는 렌더 전에 텍스트로 한 방향을 빼거나/교체/조정할 수 있다. 승인되면 3 보드 렌더. (최종 방향 결정은 4a에서 보드를 보고 고르는 것.)
   - 수정 요청은 문서를 고쳐 다시 확인받고, 명시적으로 승인되면 다음으로.
```

- [ ] **Step 4: Step 4a(발산) 교체**

old:
```
   - **4a · 발산**: 3 시각 루트(①안전한 SaaS형 ②프리미엄 에디토리얼형 ③대담한 실험형)를 각각 다른 프롬프트로 구성해 `--quality low` 초안 3장을 **개별 호출**로 생성(`brand-overview-route-a/b/c.png`). 루트별 프롬프트 분기는 `references/brand-kit-image.md`의 "발산 3 루트"를 따른다. 키가 없으면 사람이 드롭. 3장을 나란히 보여주고 **어느 방향이 좋은지** 묻는다.
   - **재시도(re-roll) 루프** — 3장 다 별로면 두 모드 중 사용자가 고른다:
     - (a) **그대로 다시(가챠)**: 같은 3 루트 프롬프트를 그대로 재호출, 파일명 버전업(`-route-a-v2.png` 등). 같은 방향 새 뽑기 — 같은 프롬프트라 같은 루트 안에선 결이 비슷하다고 미리 알린다.
     - (b) **방향 조정**: 뭐가 별로였는지 받아 루트를 교체하거나 팔레트·구도 축을 틀어 새 3장.
     - 마음에 드는 방향이 나올 때까지 반복(모두 `--quality low` 초안).
```
new:
```
   - **4a · 발산 (분위기 열림일 때만; 고정이면 건너뛰고 단일 보드 1장 생성 후 4b로)**: 후보 킷별로(direction-a/b/c) 각각 자기 BRAND_KIT 전문에서 구성한 프롬프트로 `--quality low` 초안 3장을 **개별 호출** 생성(`brand-overview-route-a/b/c.png`, route-X↔direction-X). 방향별 프롬프트 구성은 `references/brand-kit-image.md`의 "발산 3 루트"를 따른다. 키가 없으면 사람이 드롭. 3장을 나란히 보여주고 **어느 방향이 좋은지** 묻는다.
   - **재시도(re-roll) 루프** — 3장 다 별로면 두 모드 중 사용자가 고른다:
     - (a) **그대로 다시(가챠)**: 같은 후보 킷 프롬프트를 그대로 재호출, 파일명 버전업(`-route-a-v2.png` 등). 같은 방향 새 뽑기 — 같은 프롬프트라 결이 비슷하다고 미리 알린다.
     - (b) **방향 조정**: 뭐가 별로였는지 받아 해당 **후보 킷(텍스트)을 교체·수정**한 뒤 그 방향만 재렌더(비주얼만 트는 게 아니라 킷 자체를 바꾼다).
     - 마음에 드는 방향이 나올 때까지 반복(모두 `--quality low` 초안).
```

- [ ] **Step 5: Step 4b(수렴)에 승격 추가**

old:
```
   - **4b · 수렴**: 고른 루트 초안을 `--image`로 첨부해 `--quality high`로 편집 렌더 → `brand-overview.png`(고른 구도를 보존해 고품질화). 이후 피드백을 받아 **한 번에 한 섹션/한 가지만** — 직전 보드를 `--image`로 첨부한 증분 편집으로 — 고쳐 재생성(`-v2`·`-v3` …), lock까지 반복.
```
new:
```
   - **4b · 수렴**: 고른 방향 초안을 `--image`로 첨부해 `--quality high`로 편집 렌더 → `brand-overview.png`(고른 구도를 보존해 고품질화). **발산이었으면 고른 후보를 canonical로 승격**: `candidates/direction-X/`의 `BRAND_KIT.md`→`.design/BRAND_KIT.md`, `brand-tokens.json`→`.design/brand-tokens.json`, `brief.md`→`.design/image-briefs/brand-briefs.md`. 이후 피드백을 받아 **한 번에 한 섹션/한 가지만** — 직전 보드를 `--image`로 첨부한 증분 편집으로 — 고쳐 재생성(`-v2`·`-v3` …), lock까지 반복.
```

- [ ] **Step 6: 확정(복사) 줄에 후보 시안 보존 명시**

old:
```
   - **확정(복사)**: 방향이 lock되면 최종 편집본을 `<cwd>/.design/final/brand-kit/brand-overview.png`로 복사한다. 시안(`.design/generated/brand-kit/`의 안 고른 루트·이전 버전)은 지우지 않고 보존한다 — 다운스트림은 `.design/final/`을 우선 읽는다.
```
new:
```
   - **확정(복사)**: 방향이 lock되면 최종 편집본을 `<cwd>/.design/final/brand-kit/brand-overview.png`로 복사한다. 시안(`.design/generated/brand-kit/`의 안 고른 루트·이전 버전, 그리고 `candidates/`의 안 고른 후보 킷)은 지우지 않고 보존한다 — 다운스트림은 `.design/final/`을 우선 읽는다.
```

- [ ] **Step 7: 마지막 줄(line 275) 조건부 문구로 교체**

old:
```
메인 보드는 첫 단계에서만 3장 발산하고 곧장 1개 루프로 수렴한다 — 그 외에는 한꺼번에 생성하지 않고 한 개 만들고, 고치고, 다음으로 넘어간다.
```
new:
```
메인 보드는 분위기가 열렸을 때만 첫 단계에서 3장 발산하고 곧장 1개 루프로 수렴한다(분위기 고정이면 1장 직행). 그 외에는 한꺼번에 생성하지 않고 한 개 만들고, 고치고, 다음으로 넘어간다.
```

- [ ] **Step 8: 검증** — 흐름 전체 재독, 분위기 고정/열림 두 경로가 step 1~4b·확정·마지막 줄에서 일관되는지 확인. "3 시각 루트" 잔존 없는지 grep.

---

### Task 8: brand-kit-image.md §3 "발산 3 루트" 의미 전환

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md` (§3 발산 3 루트, lines 94-102; 템플릿 노트 line ~213)

- [ ] **Step 1: §3 도입 문장(line 96) 교체**

old:
```
메인 보드의 첫 생성은 **3개 초안 시안**으로 발산한다(SKILL.md "흐름" 4a). 11섹션(§1–11) 구조·콘텐츠는 셋 다 동일하게 유지하고, **비주얼 모드 · 팔레트 · 구도 에너지** 세 축으로만 분기해 서로 또렷이 다른 방향이 되게 한다:
```
new:
```
메인 보드의 첫 생성은 **분위기가 열렸을 때만** 3개 초안 시안으로 발산한다(SKILL.md "흐름" 4a; 분위기 고정이면 단일 방향 1장). 발산 시 셋은 각각 **자기 후보 BRAND_KIT 전문**으로 인스턴스화한다 — 성격·팔레트·타이포·보이스·UI가 **모두** 방향별로 다르다(비주얼 모드 델타가 아니라 전략 전체 발산). 아래 3 아키타입은 **발산 스프레드의 출발점**이다:
```

- [ ] **Step 2: §3 마무리 문장(line 102) 교체**

old:
```
기본은 위 매핑이되, 디스커버리에서 명시적으로 거부된 루트(예: "절대 다크 X")는 그 루트만 §4의 다른 모드로 대체한다. 셋의 차이는 **모드·팔레트·에너지**에서 나오고 같은 브랜드 콘텐츠·같은 11섹션(§1–11)을 공유하므로, "다른 제품"이 아니라 **"같은 브랜드의 세 해석"**으로 읽혀야 한다.
```
new:
```
기본은 위 매핑이되, 디스커버리에서 명시적으로 거부된 방향(예: "절대 다크 X")은 그 방향만 §4의 다른 모드로 대체한다. 셋은 각자 다른 전략(성격·팔레트·타이포·보이스·UI)을 가진 **세 가지 다른 브랜드 방향**이다 — "같은 브랜드의 세 해석"이 아니라 서로 또렷이 다른 후보. 단 셋 다 같은 제품 사실(§1·타깃·문제)과 디스커버리 Q6 회피 제약은 공유한다.
```

- [ ] **Step 3: 템플릿 인스턴스화 노트(line ~213) 교체**

old:
```
**발산 3 루트**: 위 템플릿을 루트마다 한 번씩, `Visual mode`·`Palette`·`Layout`(구도·에너지) 줄만 루트별로 바꿔 3개 프롬프트로 인스턴스화한다(§3 "발산 3 루트" 매핑). `Sections`·`Brand strategy`·`Language` 등 나머지는 공통. 각 프롬프트를 별도 임시 파일에 써서 `--out`을 `brand-overview-route-a/b/c.png`로 개별 호출(`--quality low` 초안).
```
new:
```
**발산 3 루트**: 발산 시 각 루트 프롬프트는 **해당 후보 BRAND_KIT 전문**(direction-X)에서 채운다 — `Brand strategy`·`Palette`·`Typography`·`Voice`·`Visual mode`가 **모두 방향별로 다르다**(한 킷에 비주얼 델타를 입히는 게 아니라 방향마다 다른 전략). `Sections`·`Language` 같은 포맷 규칙만 공통. 각 프롬프트를 별도 임시 파일에 써서 `--out`을 `brand-overview-route-a/b/c.png`로 개별 호출(`--quality low` 초안). (분위기 고정이면 단일 방향 1장만.)
```

- [ ] **Step 4: 검증** — §3·템플릿 노트 재독, "같은 브랜드의 세 해석"·"구조·콘텐츠는 셋 다 동일" 잔존 없는지 grep.

---

### Task 9: 통합 검증 + 커밋

**Files:**
- 변경 없음(검증/커밋)

- [ ] **Step 1: 전역 일관성 grep** — 두 파일에서 stale 표현 잔존 확인:

Run(개념): `Grep "같은 브랜드의 세 해석|3 시각 루트|3개 시안으로 발산|구조·콘텐츠는 공통|루트별 델타"` (대상: `skills/design-brand-kit/`)
Expected: 발산 재설계 후 매치 없음(또는 의도적으로 남긴 "출발점" 문맥만).

- [ ] **Step 2: 생성물 검증** — Run: `npm run sync --silent && npm run validate --silent`
Expected: `all generated files are up to date.` (스킬 텍스트 변경은 plugins/personal 재생성에만 영향, 커밋 대상 생성물 변화 없음.)

- [ ] **Step 3: SKILL.md 두 경로 정합 최종 확인** — 분위기 "고정"과 "열림"이 description·Q&A 트리거·출력 파일·brand-briefs·품질 기준·이미지 생성·흐름 전반에서 모순 없이 일관되는지 통독.

- [ ] **Step 4: 커밋** (커밋 스킬 절차 — 메시지는 `.git/` 임시 파일 + `git commit -F`)

```bash
git add skills/design-brand-kit/SKILL.md skills/design-brand-kit/references/brand-kit-image.md
git commit -F .git/COMMIT_MSG_DIVERGENCE.txt
```
메시지(예):
```
feat(design-brand-kit): 발산을 전략 단위로 — 분위기 열림 시 풀 BRAND_KIT 3방향

- 발산을 비주얼 모드 델타에서 전략 전체(성격·팔레트·타이포·보이스·UI)로 끌어올림.
- 분위기 열림 → candidates/direction-{a,b,c}에 풀 BRAND_KIT 3벌 발산 → 보드 픽 → canonical 승격. 분위기 고정 → 1개 직행.
- Q&A에 발산 트리거(미감 축) 추가, brand-kit-image §3 "같은 브랜드의 세 해석" → "세 가지 다른 브랜드 방향"으로 전환.
```

- [ ] **Step 5: reload 안내** — 사용자에게: "이 Claude 세션에서 `/reload-plugins` 실행, Codex는 `npm run codex:reinstall`."

---

## Self-Review

- **Spec coverage**: 트리거 규칙(T2)·산출물 레이아웃(T3)·게이트 재구성(T7 S3)·brand-kit-image §3 전환(T8)·SKILL 7 touch point(T1·2·3·4·5·6·7)·brand-kit-image 2곳(T8) 모두 태스크에 매핑됨. 보드 경로 안 1(루트 평면 명명)은 T3에서 반영.
- **Placeholder scan**: 모든 편집 태스크에 정확한 old/new 텍스트 포함. "적절히"/"TBD" 없음.
- **일관성**: "분위기 고정/열림" 용어를 전 태스크에서 동일하게 사용. route-X↔direction-X 매핑은 T3·T6·T7에서 동일.
