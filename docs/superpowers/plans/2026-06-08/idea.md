# idea 스킬 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** docs/superpowers/specs/2026-06-08/idea-design.md

**Goal:** 날 것의 아이디어를 brainstorming으로 넘기기 전에 devils-advocate 라운드로 압박 검증·합의하는 `idea` 스킬을 신설한다.

**Architecture:** `skills/idea/SKILL.md` 마크다운 지시문 한 개. 비판은 `personal:devils-advocate` 에이전트를 디스패치/SendMessage로 조합하고(라운드 처리는 `discussion` 차용), 핸드오프는 `superpowers:brainstorming`에 graceful 조건부 의존. 실행 코드 없음 → 검증은 프론트매터 파싱·`npm run sync` 통과·Codex 번들 포함으로 한다(단위 테스트 없음).

**Tech Stack:** Markdown(SKILL.md), Node sync 스크립트(`scripts/sync-codex-plugin.mjs`).

---

## File Structure

- Create: `skills/idea/SKILL.md` — 스킬 본문 (단일 책임: idea 수렴 루프 오케스트레이션).
- Modify: `README.md:161` 부근 "그 외" 표 — `idea` 한 줄 추가.
- Generated (커밋 안 함): `plugins/personal/skills/idea/` — `npm run sync`가 생성하는 Codex 번들.

테스트 파일 없음: SKILL.md는 실행 코드가 아니므로 `tests/**/*.test.mjs` 대상이 아니다.

---

### Task 1: `idea` 스킬 본문 저작

**Files:**
- Create: `skills/idea/SKILL.md`

- [ ] **Step 1: writing-skills 서브스킬 호출**

CLAUDE.md 규칙 — `skills/` 아래 새 스킬 추가 시 `superpowers:writing-skills`를 사용한다. 본 Task 저작 전 해당 스킬을 invoke하고 그 가이드(프론트매터·구조·검증)를 따른다.

- [ ] **Step 2: `skills/idea/SKILL.md` 작성**

아래 내용을 그대로 작성한다(공통 프론트매터 `name`/`description`만 사용 — 도구별 확장 키 없음):

````markdown
---
name: idea
description: 날 것의 아이디어를 본격 설계(brainstorming)로 넘기기 전에 devils-advocate로 라운드를 돌며 단점을 압박 검증하고 합의에 도달하고 싶을 때 사용. 트리거 예 - "이 아이디어 같이 따져보자", "idea 스킬", "설계 들어가기 전에 딴지부터 받아보자", 새 기능·접근을 brainstorming 전에 검증하고 싶을 때.
---

# idea

## 개요

**설계 이전 단계** 스킬. 사용자가 날 것의 아이디어를 던지면 → 가볍게 이해하고 →
독립적 `devils-advocate`로 단점을 압박 검증하는 **라운드**를 돌며 → 사용자와 합의를
만들고 → 사용자가 "구현"을 선언하면 `brainstorming`으로 넘기고, "포기"하면 종료한다.

`discussion`과의 차이: `discussion`은 *이미 굳히려는 결정·설계*를 검증하고, `idea`는
*아직 설계 이전인 날 것의 아이디어*를 brainstorming 넘기기 전에 검증한다. 같은
`personal:devils-advocate`를 **조합**하지만 쓰는 *순간*이 다르다.

**핵심 규칙: 비판을 네가 직접 쓰지 마라. `personal:devils-advocate` 서브에이전트를
디스패치하고 그 결과를 전문 그대로 전달하라.** 자가 비판은 독립성을 깨므로 금지.

## 흐름 (수렴 루프)

```
진입: 사용자가 아이디어 제시
[루프]
 1. 이해 → 2. 딴지(라운드) → 3. 합의 → (합의 더 필요하면 1로)
[종료 — 3단계에서 사용자 선언 감지]
 · "포기/그만" 류 → 세션 종료 (산출물 수정 없음)
 · "구현/가자" 류 → brainstorming 핸드오프
```

## 단계 상세

### 1. 이해

- 한 번에 질문 **하나**. 딴지가 구체적으로 공격할 수 있을 만큼의 **최소 이해만** 확보한다.
- 풀 요구사항·설계 질문은 하지 않는다 — 그건 brainstorming 몫이다(역할 분담, 중복 방지).
- 2라운드 이후엔 직전 라운드의 합의/수정을 반영해 아이디어를 한 문장으로 다시 정련한다.

### 2. 딴지 (devils-advocate)

비판을 직접 쓰지 말고 **반드시** `personal:devils-advocate`를 디스패치한다. 라운드
처리(반론 재탕 방지)는 다음을 따른다:

- **첫 라운드 / 새 주제** — `Agent` 도구로 `personal:devils-advocate`를 **새로
  디스패치**한다. 검증 대상 = 정련된 아이디어(필요하면 사용자 프레이밍도). **그
  에이전트의 ID/이름을 기억해 둔다.**
- **이어지는 라운드(같은 주제)** — 새로 띄우지 말고 그 에이전트에 **`SendMessage`로
  이어 호출**한다. 이미 다룬·해소한 논점은 재론하지 말고 바뀐 부분·새 각도에 집중하라고
  지시한다(백지 재디스패치 시 해소된 반론이 되돌아오는 문제 방지).
- **주제가 크게 바뀌면** — 이어가지 말고 새로 디스패치한다(낡은 프레이밍 차단).

**Agent 결과는 옮겨야만 사용자에게 보인다.** 에이전트 응답을 **전문 그대로** 출력한다
(steelman / 심각도순 반론 / 인정하는 부분 / 가장 위험한 단일 허점 / 종합 판정).
요약·발췌·심각도 희석 금지.

### 3. 합의

- **기본 자세 = 중립 진행자.** 자발적으로 판정을 내리지 않고 "이 반론들 어떻게
  보세요?"로 사용자의 판단을 끌어낸다. 평가는 사용자 몫.
- **반응형.** 단, 사용자가 합의 과정에서 질문하거나 의견을 내면 수동 릴레이로 멈추지
  말고 실질적으로 응답한다 — 본인 의견을 제시하거나 반론으로 밀어붙인다.
- 합의가 더 필요하면 1단계로 돌아가 다음 라운드를 돈다.
- **이 단계에서 산출물(코드·파일)을 직접 수정하지 않는다.** brainstorming 전까지 구현 없음.

### 종료 분기

매 라운드 합의 단계에서 사용자의 종료 선언을 감지한다.

- **포기** ("그만", "접자", "포기" 류) → 스킬 종료. 산출물 수정 없음.
- **구현** ("가자", "구현하자", "설계로 넘어가자" 류) → 아래 핸드오프.

## brainstorming 핸드오프 (graceful 조건부)

`superpowers`에 하드 의존하지 않는다. idea의 핵심(이해→딴지 루프)은 그것 없이도
자체 완결이며 brainstorming은 마지막 출구 램프일 뿐이다.

- 사용 가능한 스킬 목록에 `superpowers:brainstorming`이 **있으면** → 그것으로
  핸드오프하고, **누적된 이해 + 합의점 + 살아남은 우려(미해소 🔴/🟡)**를 컨텍스트로
  넘겨 brainstorming이 기초를 다시 묻지 않게 한다.
- **없으면** → "이제 설계 단계입니다. 설계/brainstorming 워크플로로 진행하세요"라는
  일반 핸드오프로 폴백한다.

## Red flags — 멈춰라

| 떠오른 생각 | 현실 |
|---|---|
| "내가 직접 딴지 써주면 되지" | 핵심은 독립성. 반드시 `personal:devils-advocate` 디스패치. |
| "풀 요구사항까지 다 캐자" | 그건 brainstorming 몫. idea는 딴지용 최소 이해만. |
| "딴지 출력 좀 요약해서 보여주자" | 전문 그대로. 요약·심각도 희석 금지. |
| "라운드마다 새로 디스패치하면 되지" | 백지라 해소된 반론이 돌아온다. 같은 주제면 SendMessage로 이어라. |
| "합의됐으니 내친김에 바로 고치자" | 구현은 brainstorming 이후. idea 안에서 산출물 수정 금지. |
| "brainstorming 무조건 호출" | 있으면 호출, 없으면 일반 핸드오프로 폴백(graceful). |

## 흔한 실수

- 이해 없이 바로 딴지 → 에이전트가 물어뜯을 구체가 없다.
- 같은 주제 다음 라운드를 또 새로 디스패치 → 해소된 반론 재탕.
- 합의 단계에서 항상 침묵(완전 수동) → 사용자가 의견·질문을 던지면 응답해야 한다.
- 종료 선언을 못 읽고 루프만 돌거나, 반대로 합의도 없이 조기 핸드오프.
````

- [ ] **Step 3: 프론트매터 파싱 검증**

Run: `node -e "const f=require('fs').readFileSync('skills/idea/SKILL.md','utf8'); const m=f.match(/^---\n([\s\S]*?)\n---/); if(!m) throw new Error('no frontmatter'); if(!/name:\s*idea/.test(m[1])) throw new Error('name missing'); if(!/description:/.test(m[1])) throw new Error('description missing'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: 커밋**

```bash
git add skills/idea/SKILL.md
git commit -m "feat(idea): 설계 전 devils-advocate 검증 수렴 루프 스킬 신설"
```

---

### Task 2: README에 `idea` 등재 + 의존성 한 줄

**Files:**
- Modify: `README.md` ("그 외" 표, discussion 줄 근처)

- [ ] **Step 1: 표에 한 줄 추가**

`README.md`의 "그 외" 표에서 `discussion` 줄 바로 위에 다음 줄을 추가한다:

```markdown
| **idea** | 날 것의 아이디어를 brainstorming 전에 devils-advocate 라운드로 압박 검증·합의. superpowers 있으면 brainstorming으로 핸드오프(없으면 일반 안내). |
```

- [ ] **Step 2: 표시 확인**

Run: `grep -n "idea" README.md`
Expected: 새로 추가한 idea 줄이 출력된다.

- [ ] **Step 3: 커밋**

```bash
git add README.md
git commit -m "docs(readme): idea 스킬 등재 + superpowers 선택 의존 명시"
```

---

### Task 3: Codex 번들 재생성 + 검증

**Files:**
- Generated: `plugins/personal/skills/idea/SKILL.md` (gitignore — 커밋 안 함)

- [ ] **Step 1: sync 실행**

Run: `npm run sync`
Expected: 에러 없이 완료(check-secrets 통과 포함).

- [ ] **Step 2: 번들에 idea 포함 확인**

Run: `node -e "require('fs').accessSync('plugins/personal/skills/idea/SKILL.md'); console.log('bundled')"`
Expected: `bundled`

- [ ] **Step 3: 기존 테스트 회귀 확인**

Run: `npm test`
Expected: 전체 통과 (기존 스크립트 테스트에 영향 없음).

- [ ] **Step 4: 커밋 불필요**

번들(`plugins/personal/`)은 gitignore된 로컬 생성물이라 커밋하지 않는다. Task 1·2의
소스 커밋으로 충분하다. (다른 머신/Codex는 설치 시 sync로 재생성.)

---

## Self-Review

**1. Spec coverage**
- 수렴 루프(이해→딴지→합의) → Task 1 Step 2 본문 ✓
- 라운드 처리(첫 디스패치/SendMessage/주제 변경) → Task 1 §2 ✓
- 합의 기본 중립 + 반응형 → Task 1 §3 ✓
- 종료 분기(포기/구현) → Task 1 종료 분기 ✓
- graceful 조건부 brainstorming 핸드오프 → Task 1 핸드오프 ✓
- devils-advocate 필수 의존 → Task 1 핵심 규칙·§2 ✓
- superpowers 선택 의존 문서화 → Task 2 ✓
- sync 재생성/번들 미커밋 → Task 3 ✓
- discussion 불변(비목표) → 어떤 Task도 discussion 수정 안 함 ✓

**2. Placeholder scan:** TBD/TODO/"적절히" 류 없음. SKILL.md 본문은 전문 포함 ✓

**3. Type consistency:** 스킬명 `idea`, 에이전트 `personal:devils-advocate`, 핸드오프 `superpowers:brainstorming` 표기 전 Task 일관 ✓
