# Customer 페르소나 평가 도구 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-09/customer-persona-eval-design.md`

**Goal:** 구현을 모르는 "고객" 페르소나로 UX·아이디어를 점검하는 발상/가설 생성 스킬 세트(create-customer / check-customer-ux / check-customer-idea + customer 서브에이전트 + 공유 코어)를 만든다.

**Architecture:** 메인 컨텍스트 "무대감독" 스킬이 페르소나를 로드/생성하고 "경험 표면"을 조립(구현=타입 A 제외 / 도메인 기대=타입 B 포함)한 뒤, 격리된 `customer` 서브에이전트(인간 채널 Playwright만 쥠)에 디스패치한다. 공유 규칙은 `skills/references/customer/customer-core.md` 한 곳에 둔다.

**Tech Stack:** Markdown 스킬/에이전트 정의(프롬프트 문서), Claude Code 서브에이전트, Playwright MCP(옵셔널), 저장소 sync 스크립트(`npm run sync`).

---

## 검증 방식에 대한 메모 (이 계획의 TDD 해석)

이 산출물은 실행 코드가 아니라 **프롬프트 문서(SKILL.md·에이전트 .md·레퍼런스 .md)**다. 저장소는 알고리즘적 `.mjs` 스크립트만 단위테스트하고(예: `image-gen` autocrop, `load-env`), 프롬프트 문서는 단위테스트하지 않는다. v1 페르소나 저장 로직은 "마크다운 파일 읽기/`## 헤더` 파싱/`.gitignore` 문자열 확인" 수준이라 별도 스크립트로 빼지 않는다(YAGNI — 공유 코어가 이미 DRY 단일 소스). 따라서 각 문서 산출물의 "테스트"는 다음 **두 단계 수용 검사**로 정의한다:

1. **정적 검사** — `npm run sync` 무오류 통과(frontmatter·번들 생성 정상) + `npm test`(기존 스크립트 테스트) 회귀 없음 + 필수 섹션 존재 체크리스트.
2. **리허설(행동 검사)** — `claude --plugin-dir .`로 스킬을 실제 호출해, 각 태스크에 명시된 **구체적 합격 기준**(behavioral acceptance criteria)을 충족하는지 확인.

리허설 합격 기준은 각 태스크에 빠짐없이 명시했다. "적절히 동작" 같은 모호한 기준은 쓰지 않는다.

---

## 사전: 브랜치

저장소가 `main`에 있다. 작업 전 피처 브랜치를 판다.

- [ ] **브랜치 생성**

```bash
cd "D:/기타 프로그램/plugin-library"
git checkout -b feat/customer-persona-eval
```

(spec은 이미 `docs/superpowers/specs/2026-06-09/customer-persona-eval-design.md`로 이동됨 — 첫 커밋에 함께 포함.)

---

## File Structure

**소스 of truth (커밋 대상):**
- Create: `agents/customer.md` — 격리 배우 서브에이전트 정의
- Create: `skills/references/customer/customer-core.md` — 공유 코어(무대감독 규칙)
- Create: `skills/create-customer/SKILL.md` — 페르소나 저작/수정/리스트
- Create: `skills/check-customer-idea/SKILL.md` — 아이디어 탐색 무대감독
- Create: `skills/check-customer-ux/SKILL.md` — UX 비평 무대감독

**생성물 (직접 수정/커밋 금지 — `npm run sync`가 만듦):**
- `plugins/personal/**`, `codex-agents/customer.toml`

**런타임 데이터 (소비 프로젝트 루트에 생성, 이 저장소 아님):**
- `.personal/customer/personas.md`

**역할 경계 (중복 방지):**
- `agents/customer.md` = **배우 측 규칙**(시스템 프롬프트): 캐릭터 유지, 인간 채널만 사용, 구현 추론 금지, 출력 계약, 안티-sycophancy.
- `customer-core.md` = **무대감독 측 규칙**(스킬이 읽음): 페르소나 로드/생성, 표면 조립 A/B, 디스패치 페이로드 구성, Playwright 가용성/폴백, 저장·gitignore.
- 세 스킬은 절차를 직접 품지 않고 **core를 참조**한다(`../references/customer/customer-core.md`).

---

## Task 1: Playwright MCP 조사 → 인간 채널 화이트리스트 확정

표면 조립의 타입 A 차단을 **툴 권한 레벨에서** 강제하려면, 실제 Playwright MCP 툴 이름과 클릭 메커니즘을 알아야 한다(spec §4 미해결 항목).

**Files:** 없음(조사). 산출 = 확정된 툴 이름 목록(Task 2·3에서 사용).

- [ ] **Step 1: Playwright MCP 등록 여부·툴 목록 확인**

Run:
```bash
claude mcp list
```
Expected: `playwright` 항목 존재 여부 확인. 없으면 Task 7의 셋업 노트로 등록 후 재시도(또는 조사만 공식 문서로 대체).

- [ ] **Step 2: 노출 툴 이름 수집**

세션에서 ToolSearch로 `playwright` 조회하거나, 등록돼 있으면 사용 가능한 `mcp__playwright__*` 툴 이름을 나열한다. 다음을 각각 어느 이름이 담당하는지 확정:
- 스크린샷(눈), 네비게이트, 클릭, 타이핑, 스크롤/키 → **허용**
- DOM/HTML 덤프, `evaluate`, 네트워크 요청, 콘솔 메시지 → **금지**
- a11y 스냅샷 → **그레이존**

- [ ] **Step 3: 클릭 메커니즘 판정 (그레이존 결정)**

판정 질문: Playwright MCP가 **순수 스크린샷 + 좌표 클릭**을 지원하는가, 아니면 클릭이 a11y 스냅샷의 ref를 요구하는가?
- 좌표 클릭 가능 → a11y 스냅샷 **금지**(가장 깨끗).
- ref 클릭만 가능 → a11y 스냅샷을 "스크린리더 사용자가 듣는 것(=인간 지각 표면)"으로 간주해 **제한 허용**. (DOM/네트워크/콘솔/evaluate는 어떤 경우에도 금지.)

- [ ] **Step 4: 화이트리스트 기록**

확정된 **허용 툴 이름 목록**과 **금지 목록**, 그리고 a11y 결정 사유 한 줄을 이 계획서 Task 1 하단에 적어둔다(Task 2·3이 그대로 복사). 합격 기준: 허용/금지 각 툴이 *정확한 MCP 툴 이름*으로 적혀 있을 것(추상 표현 금지).

- [ ] **Step 5: 커밋** (조사 결과를 spec/plan에 반영했다면)

```bash
git add docs/superpowers/
git commit -m "docs: lock playwright human-channel tool whitelist for customer agent"
```

### Task 1 결과 (LOCKED — 2026-06-09, context7 `/microsoft/playwright-mcp` 공식문서 기준)

Playwright MCP는 현재 미등록 → 실측 대신 공식문서로 확정. 등록 시 툴 prefix는 등록명에 따름(예: 등록명 `playwright` → `mcp__playwright__browser_*`). 미등록이면 check-customer-ux는 스크린샷/추정 폴백으로 degrade(스킬은 정상 로드).

**허용(인간 채널 — 눈·손):**
`browser_navigate`, `browser_navigate_back`, `browser_take_screenshot`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_press_key`, `browser_hover`, `browser_select_option`, `browser_wait_for`, `browser_resize`, `browser_tabs`, `browser_handle_dialog`, `browser_file_upload`, `browser_drag`, `browser_drop`, `browser_fill_form`

**금지(타입 A 구현 X-ray — agent `tools`에 절대 넣지 않음):**
`browser_evaluate`, `browser_run_code_unsafe`, `browser_console_messages`, `browser_network_request`, `browser_network_requests`

**a11y 스냅샷 결정:** 허용(Approach A). 접근성 트리=역할·이름·라벨(사용자 제시 의미층, 스크린리더 지각)이라 구현 내부 아님. 기본 모드(`browser_click`이 snapshot ref 요구)라 신뢰성·설정 단순성 우선. 더 엄격한 대안=`--caps=vision`(스냅샷 제외+좌표 클릭 `browser_mouse_click_xy`)은 후속 옵션으로 노트.

---

## Task 2: 공유 코어 `customer-core.md`

**Files:**
- Create: `skills/references/customer/customer-core.md`

- [ ] **Step 1: 코어 작성 — 아래 필수 섹션을 모두 포함**

`# customer-core` 아래 다음 7개 섹션을 실제 내용으로 채운다(무대감독 측 규칙):

1. **페르소나 스키마** — 한 페르소나의 필드: `slug`, 한 줄 정체성(나이·역할·조직 유형), 가장 큰 걱정 1~2, 맥락(어떤 상황에서 이 제품을 접했나), **타입 B 도메인 기대**(이 부류 제품에 당연히 기대하는 것), 회의 지점(뭘 의심하며 보나). `personas.md`에 `## <slug> — <한 줄 정체성>` 헤더 + 본문 섹션으로 저장.
2. **페르소나 소스 정책** — 저장된 것 있으면 사용. 없으면 생성. 창작 절차는 두 모드:
   - **꼼꼼 모드**(create-customer): 인터뷰식으로 스키마 전 필드를 한 번에 하나씩 캐묻는다. 추측 금지.
   - **빠른 모드**(check-* 인라인): 진행에 필요한 최소(정체성·핵심 걱정·도메인 기대)만 1~2 질문으로 확보 후 진행, 끝나고 저장 제안.
3. **표면 조립 규칙(A/B)** — 디스패치 전 무대감독이 customer에게 줄 "표면"을 만들 때:
   - 타입 A(빼기): 코드·아키텍처·내부 함수 호출·성능 근거·DOM·HTML·네트워크·셀렉터.
   - 타입 B(넣기): "이건 X류 앱이다" + 그 부류 고객이 당연히 갖는 기대. 페르소나의 도메인 기대도 명시.
   - 한 줄 원칙: "어떻게 만들었나(A)는 빼고, 무슨 부류라 뭘 기대하나(B)는 넣는다."
4. **Playwright 가용성·폴백** — URL+MCP 있으면 실사용 / 스크린샷 있으면 그걸로 / 둘 다 없으면 "시각 디테일은 추정" 경고. 인간 채널 화이트리스트(Task 1 결과)를 여기에 명시하고, customer 디스패치 시 이 툴만 허용하라고 지시.
5. **디스패치 페이로드 구성** — customer 서브에이전트에 넘기는 것: [페르소나] + [조립된 표면(A 제외/B 포함)] + [task(영역 또는 컨셉)] + [출력 계약 참조]. 사용자의 유도 질문을 그대로 넘기지 말 것(영역만).
6. **저장·gitignore** — 경로 `.personal/customer/personas.md`. `.personal/`이 **없어서 새로 만들 때만** 1회 prompt: "`.personal/`을 `.gitignore`에 추가할까요? (y/N)". 답대로, 재nag 없음. (`.gitignore`에 `.personal/` 라인 있는지 grep으로 확인.)
7. **출력 계약(요약)** — 최종 사용자 출력은 `[답변] → [안 물어본 인접 각도 역제기 1~2] → [실고객 아님·가설용 라벨]`. (배우 측 강제는 `agents/customer.md`가, 무대감독의 전달 형식은 여기가 소유.)

- [ ] **Step 2: 정적 검사**

Run:
```bash
cd "D:/기타 프로그램/plugin-library" && npm run sync && npm test
```
Expected: sync 무오류, `npm test` 통과(회귀 없음). `skills/references/customer/customer-core.md`에 위 7개 섹션 헤더가 모두 존재(육안 체크리스트).

- [ ] **Step 3: 커밋**

```bash
git add skills/references/customer/customer-core.md
git commit -m "feat(customer): add shared customer-core reference (stage-manager rules)"
```

---

## Task 3: `customer` 서브에이전트 정의

**Files:**
- Create: `agents/customer.md`

- [ ] **Step 1: frontmatter 작성**

```markdown
---
name: customer
description: 주어진 페르소나의 실제 고객이 되어, 보여준 화면·정보만 가지고 제품을 사용·평가하는 격리 배우. 무대감독 스킬(check-customer-ux·check-customer-idea)이 페르소나와 경험 표면을 조립해 디스패치한다. 직접 호출보다 그 스킬들을 통해 쓰인다.
tools: <Task 1에서 확정한 인간 채널 Playwright 툴 이름들만. 예: mcp__playwright__browser_navigate, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_press_key>
model: inherit
---
```
주의: `tools`에 DOM/evaluate/네트워크/콘솔 계열은 **절대 넣지 않는다**. 목록은 Task 1 Step 4의 허용 목록을 정확한 이름으로 복사.

- [ ] **Step 2: 본문(배우 규칙) 작성 — 아래 요소 모두 포함**

1. 정체성: "너는 디스패치 메시지에 주어진 페르소나의 **실제 고객**이다. 너는 이 제품이 **어떻게 만들어졌는지 전혀 모른다.**"
2. 앎의 경계: "너는 ① 네 페르소나와 ② 화면에서 *보이는 것/직접 해본 것*만 안다. 코드·내부 동작·성능 이유를 추론하지 마라(그건 고객이 모르는 것이다)."
3. 인간 채널: "너는 눈(스크린샷)과 손(클릭·타이핑·스크롤·이동)으로만 제품을 쓴다. 주어진 도구 외의 방법으로 내부를 들여다보려 하지 마라."
4. 능동 탐색: "네 페르소나의 관심사대로 직접 돌아다니며 써봐라. 시키지 않은 화면도 궁금하면 가봐라."
5. 출력 계약: "[너의 반응/불편 지점] → [안 물어본 인접 각도 1~2개 역제기] → [맨 끝에 한 줄: '※ 실제 고객이 아니라 페르소나 시뮬레이션 — 가설용']".
6. 안티-sycophancy: "무대감독이나 사용자의 결론에 동조하지 마라. 좋게 말하려 하지 말고 이 페르소나가 진짜 느낄 법한 대로 말해라."

- [ ] **Step 3: 정적 검사**

Run:
```bash
cd "D:/기타 프로그램/plugin-library" && npm run sync
```
Expected: 무오류. `codex-agents/customer.toml`이 생성됨(생성물 — 커밋 안 함). `claude --plugin-dir .`로 로드 시 `customer` 에이전트가 목록에 보이고 frontmatter 파싱 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add agents/customer.md
git commit -m "feat(customer): add isolated customer subagent (human-channel actor)"
```

---

## Task 4: `create-customer` 스킬

**Files:**
- Create: `skills/create-customer/SKILL.md`

- [ ] **Step 1: 작성 — frontmatter + 흐름**

frontmatter:
```markdown
---
name: create-customer
description: 제품의 고객 페르소나를 작정하고 저작·수정·열람할 때 사용. "고객 페르소나 만들어줘/추가/수정", check-customer-* 쓰기 전에 진한 페르소나를 미리 준비하고 싶을 때. .personal/customer/personas.md에 저장한다.
---
```
본문 흐름:
1. `../references/customer/customer-core.md`의 **페르소나 스키마 + 꼼꼼 모드** 절차를 따른다고 명시.
2. 모드 분기: 신규 저작 / 기존 수정 / 리스트. 리스트·읽기는 `personas.md`의 `## <slug>` 헤더 파싱.
3. 신규 저작 = 꼼꼼 모드 인터뷰(한 번에 하나씩, 추측 금지) → 스키마 전 필드 채움 → `personas.md`에 append.
4. `.personal/`을 새로 만들면 core의 gitignore 1회 prompt 규칙 적용.
5. 저장 후 "이제 `/check-customer-ux` 또는 `/check-customer-idea`로 이 페르소나에게 물어볼 수 있다" 안내.

- [ ] **Step 2: 정적 검사**

Run: `cd "D:/기타 프로그램/plugin-library" && npm run sync && npm test`
Expected: 무오류·회귀 없음.

- [ ] **Step 3: 리허설 (합격 기준)**

`claude --plugin-dir .`에서 임시 디렉터리를 cwd로 두고 `/create-customer`로 페르소나 1개 저작. **합격 기준:**
- 한 번에 하나씩 질문하며 스키마 필드(정체성·걱정·맥락·도메인 기대·회의 지점)를 캐묻는다.
- `.personal/`이 없던 상태면 gitignore 추가 여부를 **딱 한 번** 묻는다.
- 종료 시 `.personal/customer/personas.md`에 `## <slug> — <정체성>` 섹션이 생성돼 있다.

- [ ] **Step 4: 커밋**

```bash
git add skills/create-customer/SKILL.md
git commit -m "feat(customer): add create-customer skill (persona authoring)"
```

---

## Task 5: `check-customer-idea` 스킬 (Playwright 불필요 — 먼저 구현)

**Files:**
- Create: `skills/check-customer-idea/SKILL.md`

- [ ] **Step 1: 작성 — frontmatter + 흐름**

frontmatter:
```markdown
---
name: check-customer-idea
description: 제품 고객 입장에서 아이디어·방향을 탐색받고 싶을 때 사용. "고객이라면 이 대시보드에 뭘 원할까", "우리 컨셉을 고객 관점에서 어떻게 볼까" 같은 발산형 질문. 실제 고객이 아니라 페르소나 시뮬레이션이며 가설 생성용이다.
---
```
본문 흐름(core 참조):
1. 페르소나 로드(없으면 core 빠른 모드 생성·주입·저장).
2. 입력 = 사용자가 준 **컨셉 + 가용 데이터**(영역). 유도 질문이 아니라 탐색 주제만 받는다.
3. core의 **표면 조립(A 제외/B 포함)** — 코드·구현은 빼고, "이건 X류 앱 + 가용 데이터"와 페르소나 도메인 기대를 넣는다.
4. `customer` 서브에이전트 디스패치(Playwright 불필요): [페르소나 + 표면 + "이 고객이 원할 것 발산"].
5. 결과를 **전문 그대로** 전달(출력 계약대로 끝에 가설 라벨 포함).

- [ ] **Step 2: 정적 검사**

Run: `cd "D:/기타 프로그램/plugin-library" && npm run sync && npm test`
Expected: 무오류·회귀 없음.

- [ ] **Step 3: 리허설 (합격 기준)**

저장된 페르소나가 있는 임시 cwd에서 `/check-customer-idea <컨셉>` 호출. **합격 기준:**
- 디스패치 전 코드/구현 언급을 표면에 넣지 않는다(타입 A 누설 없음).
- `customer` 서브에이전트를 호출한다(직접 자문자답 아님).
- 최종 출력이 `[발산] → [역제기 1~2] → [가설 라벨]` 구조다.
- 저장 페르소나가 없으면 먼저 최소 구체화 질문을 한다.

- [ ] **Step 4: 커밋**

```bash
git add skills/check-customer-idea/SKILL.md
git commit -m "feat(customer): add check-customer-idea skill (idea exploration stage)"
```

---

## Task 6: `check-customer-ux` 스킬 (Playwright 인간 채널)

**Files:**
- Create: `skills/check-customer-ux/SKILL.md`

- [ ] **Step 1: 작성 — frontmatter + 흐름**

frontmatter:
```markdown
---
name: check-customer-ux
description: 제품 고객 입장에서 UX 불편을 점검받고 싶을 때 사용. "이 페이지/플로우 고객이 써보면 어디서 막힐까". 영역만 지정하면 페르소나가 직접 화면을 조작하며 불편을 짚는다. URL+Playwright MCP면 실사용, 없으면 스크린샷, 둘 다 없으면 추정. 가설 생성용.
---
```
본문 흐름(core 참조):
1. 페르소나 로드(없으면 빠른 모드).
2. **입력 모드 결정**(core §4):
   - URL 제공 + Playwright MCP 등록 → 실사용 탐색.
   - 스크린샷 첨부 → 그걸로.
   - 둘 다 없음 → "시각 디테일은 추정" 경고 후 진행.
3. 영역만 받는다(예: "결제 플로우"). 유도 질문 금지.
4. core 표면 조립(A 제외/B 포함).
5. `customer` 서브에이전트 디스패치 — 실사용 모드면 **인간 채널 Playwright 툴만** 허용(core 화이트리스트), URL 전달, "직접 조작하며 영역을 써보고 불편을 짚어라".
6. 결과 전문 전달(역제기 + 가설 라벨 포함).

- [ ] **Step 2: 정적 검사**

Run: `cd "D:/기타 프로그램/plugin-library" && npm run sync && npm test`
Expected: 무오류·회귀 없음.

- [ ] **Step 3: 리허설 (3개 입력 모드 각각 합격 기준)**

- **URL 모드**(Playwright MCP 등록 상태, 로컬 데모 URL): `/check-customer-ux <URL> 영역=…` → customer가 인간 채널 툴로 네비게이트·클릭·스크린샷하며 탐색하고, DOM/네트워크/evaluate 호출을 **시도하지 않는다**. 출력에 불편 지점 + 역제기 + 라벨.
- **스크린샷 모드**: URL 없이 스크린샷 첨부 → Playwright 없이 그 이미지 기반 반응.
- **추정 모드**: URL·스크린샷 둘 다 없음 → 출력에 "시각 디테일은 추정" 경고가 포함된다.
- 공통: 표면에 타입 A(코드/구현) 누설 없음.

- [ ] **Step 4: 커밋**

```bash
git add skills/check-customer-ux/SKILL.md
git commit -m "feat(customer): add check-customer-ux skill (interactive UX critique stage)"
```

---

## Task 7: 통합 검증 + Playwright 셋업 노트

**Files:**
- Create: `docs/superpowers/specs/2026-06-09/`에 짧은 셋업 노트 추가하거나 spec §8 보강(선택).

- [ ] **Step 1: 전체 sync + 테스트**

Run:
```bash
cd "D:/기타 프로그램/plugin-library" && npm run sync && npm test && git status
```
Expected: sync 무오류, `npm test` 통과, `git status`에 생성물(`plugins/personal/`, `codex-agents/`)이 gitignore되어 **추적되지 않음** 확인(스테이징에 안 보여야 정상).

- [ ] **Step 2: 플러그인 로드 스모크 테스트**

`claude --plugin-dir .`로 로드 후: `create-customer`·`check-customer-ux`·`check-customer-idea` 스킬과 `customer` 에이전트가 모두 보이고 frontmatter 파싱 에러가 없다.

- [ ] **Step 3: Playwright MCP 등록 안내 (사용자에게 위임)**

Playwright MCP는 옵셔널 의존성이다. 등록 절차를 spec/README에 적되, **실제 등록 명령(`claude mcp add …`)은 context7로 Claude Code 공식문서를 확인한 뒤** 사용자에게 안내한다(사용자 글로벌 규칙). 등록 후 `.claude.json` mcpServer 변경이므로 **`sync-mcp` 스킬**을 돌린다. 이 단계는 사용자 승인 없이는 실행하지 않는다.

- [ ] **Step 4: 최종 커밋 + 브랜치 마무리**

```bash
git add docs/
git commit -m "docs(customer): add playwright MCP setup note"
```
이후 `superpowers:finishing-a-development-branch`로 머지/PR 방식을 사용자와 결정한다.

---

## Self-Review (작성자 체크 결과)

- **Spec 커버리지:** §1 목적→전 스킬 description·라벨, §2 구성요소→Task 2~6, §3 A/B 표면조립→Task 2 Step1-③·각 스킬 흐름, §4 Playwright 인간채널→Task 1·3·6, §5 데이터흐름→Task 4~6, §6 출력구조→Task 2 Step1-⑦·Task 3, §7 저장/gitignore→Task 2 Step1-⑥, §8 셋업→Task 7, §9 설계노트→spec에 보존(구현 불필요), §10 범위(YAGNI)→v1 5산출물로 한정. 누락 없음.
- **Placeholder 스캔:** 모든 코드/문서 스텝에 실제 frontmatter·섹션 내용·합격 기준 명시. `tools:` 목록만 Task 1 산출에 의존(의도된 선행 조사) — placeholder 아님, 선행 태스크가 채움.
- **타입 일관성:** 경로(`.personal/customer/personas.md`)·에이전트명(`customer`)·스킬명 3종·core 경로(`skills/references/customer/customer-core.md`)가 전 태스크에서 동일.
- **검증 방식:** 프롬프트 문서라 단위테스트 대신 정적검사(sync/test) + 리허설 합격기준으로 정의(상단 메모). 저장소 패턴(스크립트만 단위테스트)과 정합.
