# Designer Brand Q&A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit` 스킬이 파일 생성 전에 브랜드 디스커버리 Q&A를 직접 수행하도록 하고, `designer` 에이전트에서 기본값 추측 동작을 제거한다.

**Architecture:** Q&A 로직을 `design-brand-kit` 스킬 안에 자기완결형으로 두어 스킬이 입력 수집부터 파일·이미지 생성까지 전부 책임진다. `designer` 에이전트는 단계 선택과 스킬 위임만 담당한다.

**Tech Stack:** Markdown 편집, `npm run sync` (scripts/sync-agents.mjs, scripts/sync-codex-plugin.mjs)

---

### Task 1: `design-brand-kit` 스킬 — 입력 섹션 계약 명세로 교체

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (lines 16–21)

- [ ] **Step 1: 기존 `입력` 섹션을 계약 명세로 교체**

`skills/design-brand-kit/SKILL.md`의 `## 입력` 섹션 전체를 아래로 교체한다.

교체 전:
```markdown
## 입력

가능하면 다음을 확인한다. 부족하면 합리적 기본값으로 채우되, 추측한 항목은 명시한다.

- 제품명 / 분야 / 타깃 사용자 / 핵심 문제 / 핵심 가치 제안
- 원하는 분위기 / 피하고 싶은 분위기
- 기존 색상·로고 여부 / 경쟁 제품·참고 스타일
```

교체 후:
```markdown
## 입력

아래 항목은 `브랜드 디스커버리 Q&A` 단계에서 수집한다. 추측으로 채우지 않는다 — 사용자가 명시적으로 위임한 항목만 '미확인'으로 처리한다.

- 제품명 / 분야 / 타깃 사용자 / 핵심 문제 / 핵심 가치 제안
- 브랜드 성격 형용사 / 사용 후 기대 감정 / 피해야 할 분위기
- 레퍼런스 브랜드·스타일 / 기존 색상·로고 여부
- 사용 맥락 (웹앱·모바일·마케팅 등) / B2B·B2C 구분
```

- [ ] **Step 2: `입력` 섹션 바로 뒤에 `브랜드 디스커버리 Q&A` 섹션 추가**

교체한 `## 입력` 섹션과 `## 출력 파일` 섹션 사이에 아래를 삽입한다.

```markdown
## 브랜드 디스커버리 Q&A

파일을 생성하기 전에 아래 질문 뱅크를 바탕으로 입력을 수집한다.

### 질문 로직

- **맥락 추론**: 사용자의 첫 메시지에서 이미 알 수 있는 항목은 스킵한다.
- **한 번에 하나**: 한 메시지에 하나의 질문만 한다.
- **모호한 답변은 파고든다**: "분위기 있게요" 같은 추상적 답변은 구체화될 때까지 후속 질문을 이어간다. 횟수 제한 없음.
  - 기준: **이 답변으로 HEX 값이나 타이포 방향을 결정할 수 있는가?**
  - 예: "신뢰감" → "전문성·권위 쪽인가요, 아니면 따뜻하고 친근한 신뢰인가요?"
  - 예: "미니멀" → "여백·타이포 중심인가요, 아이콘·일러스트는 아예 없애는 건가요?"
  - 예: "분위기 있게" → "에디토리얼한 느낌인가요, 아니면 럭셔리 쪽인가요?"
- **위임 처리**: 사용자가 "모르겠어요" / "AI한테 맡길게요"라고 명시적으로 위임한 항목만 '미확인'으로 처리하고 브리프 상단에 명시한다.
- **종료**: 큐가 비면 Q&A를 끝내고 파일 생성 단계로 진행한다.

### 질문 뱅크 (우선순위 순)

| 우선순위 | 질문 | 스킵 조건 |
|---|---|---|
| 1 | 제품명과 한 줄 소개 — 무엇을 하는 제품인가요? | 이미 명시된 경우 |
| 2 | 주 타깃 사용자 — 누가, 어떤 상황에서 씁니까? | 명시된 경우 |
| 3 | 핵심 문제와 가치 제안 — 왜 이 제품을 써야 하나요? | 명시된 경우 |
| 4 | "이 브랜드를 한 사람으로 표현하면 어떤 사람이에요? 직업·말투·옷차림으로 설명해주세요." | 거의 항상 질문 |
| 5 | "이 제품을 쓰고 나서 사용자가 어떤 기분을 느꼈으면 해요?" | 거의 항상 질문 |
| 6 | "절대 이런 느낌은 아니에요 — 가장 피하고 싶은 분위기나 브랜드가 있나요?" | 거의 항상 질문 |
| 7 | "좋아하는 브랜드나 디자인 3개를 꼽는다면? 업계 무관, 이유도 짧게." | 레퍼런스 있으면 스킵 |
| 8 | 기존 색상·로고 여부 — 유지할 부분이 있다면? | 명시된 경우 |
| 9 | 사용 맥락 (웹앱·모바일·마케팅 사이트 등) + B2B/B2C 구분 | 명시된 경우 |
```

- [ ] **Step 3: 내용 확인**

편집 후 파일을 열어 다음을 확인한다:
- `## 입력` — "추측으로 채우지 않는다" 문구 포함, "합리적 기본값" 문구 없음
- `## 브랜드 디스커버리 Q&A` — `## 입력`과 `## 출력 파일` 사이에 위치
- 질문 뱅크 표 9행 모두 존재

---

### Task 2: `designer` 에이전트 — 작업 원칙 정리

**Files:**
- Modify: `agents/designer.md` (작업 원칙 마지막 bullet)

- [ ] **Step 1: "기본값 추측" 문구 교체**

`agents/designer.md`의 `## 작업 원칙` 마지막 bullet을 교체한다.

교체 전:
```markdown
- 시작할 때 어느 단계부터 할지, 입력(제품 설명 등)이 충분한지 먼저 확인한다. 부족하면 합리적 기본값을 쓰되 추측한 부분을 밝힌다.
```

교체 후:
```markdown
- 시작할 때 어느 단계부터 할지 확인한다. `.design/BRAND_KIT.md`가 없는 상태에서 2단계 이후를 요청하면 먼저 1단계(`design-brand-kit`) 작성을 권유한다.
```

- [ ] **Step 2: 내용 확인**

편집 후 파일을 열어 다음을 확인한다:
- "합리적 기본값" 문구 없음
- `.design/BRAND_KIT.md` 경로 참조 포함

---

### Task 3: sync 및 커밋

**Files:**
- Generated: `codex-agents/designer.toml` (sync-agents.mjs 재생성)
- Generated: `plugins/personal/` (sync-codex-plugin.mjs 재생성, gitignore)

- [ ] **Step 1: sync 실행**

```bash
npm run sync
```

Expected: 에러 없이 완료. `codex-agents/designer.toml` 재생성됨.

- [ ] **Step 2: validate 실행**

```bash
npm run validate
```

Expected: 에러 없이 완료.

- [ ] **Step 3: 변경 파일 확인**

```bash
git diff --name-only
```

Expected 목록:
```
agents/designer.md
codex-agents/designer.toml
skills/design-brand-kit/SKILL.md
```

- [ ] **Step 4: 커밋**

```bash
git add agents/designer.md skills/design-brand-kit/SKILL.md codex-agents/designer.toml docs/superpowers/specs/2026-05-28-designer-brand-qa-design.md docs/superpowers/plans/2026-05-28-designer-brand-qa.md
git commit -m "feat(design): brand discovery Q&A in design-brand-kit skill"
```
