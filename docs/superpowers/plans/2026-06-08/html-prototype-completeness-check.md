# html-prototype 완전성 체크리스트 게이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** [docs/superpowers/specs/2026-06-08/html-prototype-completeness-check-design.md](../../specs/2026-06-08/html-prototype-completeness-check-design.md)

**Goal:** web-publisher가 DESIGN.md에 정의된 섹션·요소를 통째로 빠뜨리는 구현 누락을, 빌드 후 결정적 Read/Grep 대조로 자동 탐지·자동 수정하게 한다.

**Architecture:** `design-html-prototype`(스펙 스킬)이 빌드 전 DESIGN.md(권위)에서 *완전성 체크리스트*(필수 섹션 + 핵심 문구 앵커 + 핵심 요소)를 만들어 빌드 스펙에 인라인으로 실어 넘긴다. `web-publisher`(서브에이전트)는 빌드·레이아웃 QA에 더해 그 체크리스트를 Read/Grep으로 대조하고, 미충족 항목을 자기 맥락 내부 루프로 채운다. 신규 에이전트·비전·comp·재디스패치 핸드오프 없음.

**Tech Stack:** Markdown(스킬 SKILL.md·에이전트 .md 스펙). 빌드 도구: `npm run sync`(에이전트 본문 → `codex-agents/*.toml` 재생성), `npm run validate`, `npm test`.

**작업 성격:** 이 plan은 실행 가능한 코드가 아니라 **스킬·에이전트 지침(프로즈) 편집**이다. 실패 테스트를 먼저 쓸 대상이 없으므로, 각 Task의 검증은 (1) 의도한 문안이 파일에 들어갔는지 grep 확인, (2) `npm run validate`·`npm test` 회귀 통과로 한다.

---

## File Structure

- **Modify** `skills/design-html-prototype/SKILL.md` — 인트로 한 줄 + 신규 "완전성 체크리스트" 절 + "흐름(리뷰 게이트)" 절 재작성 + "HTML 산출 위임" 절에 체크리스트 전달 명시. (책임: *무엇을* 만들지의 스펙 — 체크리스트 생성 주체)
- **Modify** `agents/web-publisher.md` — "입력" 목록에 완전성 체크리스트 추가 + "흐름"에 완전성 자가 대조 단계 추가. (책임: HTML *저작·검수* — 체크리스트 대조 주체)
- **Regenerate (커밋 안 함, gitignore)** `codex-agents/web-publisher.toml` — `agents/web-publisher.md` 본문이 바뀌면 `npm run sync`가 자동 재생성. 직접 수정 금지.

두 소스 파일은 독립적으로 의미가 있다(스킬 편집 / 에이전트 편집). Task 1·2로 나눈다.

---

## Task 1: design-html-prototype SKILL.md — 체크리스트 생성 스펙 추가

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 인트로에 완전성 체크리스트 언급 추가**

`skills/design-html-prototype/SKILL.md` 둘째 문단(현재):

```markdown
**이 스킬은 HTML을 직접 저작하지 않는다.** 무엇을 만들지(입력·출력 경로·섹션 구조)만 정하고, 실제 마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 맡는다(아래 "HTML 산출 위임"). 이렇게 해야 모든 HTML이 web-publisher의 빌드+QA 루프를 거쳐 깨진 div가 그대로 나오지 않는다.
```

를 다음으로 교체:

```markdown
**이 스킬은 HTML을 직접 저작하지 않는다.** 무엇을 만들지(입력·출력 경로·섹션 구조·완전성 체크리스트)만 정하고, 실제 마크업 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 맡는다(아래 "HTML 산출 위임"). 이렇게 해야 모든 HTML이 web-publisher의 빌드+QA 루프를 거쳐 깨진 div가 그대로 나오지 않는다.
```

- [ ] **Step 2: "완전성 체크리스트" 절 신규 추가**

`## 섹션 구조` 절 바로 **앞에** 다음 절을 삽입한다(현재 `## 섹션 구조` 라인 위):

```markdown
## 완전성 체크리스트 (빌드 전)

`DESIGN.md`를 읽어 섹션 구조를 정할 때, 함께 **완전성 체크리스트**를 만들어 빌드 스펙에 실어 web-publisher에 넘긴다. web-publisher는 빌드 후 이 체크리스트를 결정적으로(Read/Grep) 대조해 *구현 누락*(DESIGN.md에 정의됐는데 통째로 빠진 섹션·요소)을 스스로 잡는다 — 사람이 매번 수동으로 발견해 재수정을 요청할 필요가 없게.

- **권위는 `DESIGN.md`다.** 앵커는 `DESIGN.md`의 실제 카피·섹션 정의에서만 뽑는다. comp 이미지(gpt-image 산출물 = 불완전한 한 해석)는 앵커 출처로 쓰지 않는다 — 정확한 자산을 comp의 틀린 자산에 맞춰 되돌리는 함정을 피하기 위함.
- 항목 종류:
  - **필수 섹션** — `DESIGN.md`가 기술한 섹션 목록(랜딩이면 hero·problem·…·footer; 다른 화면이면 그에 맞게).
  - **핵심 헤딩·문구 앵커** — 섹션별로 `DESIGN.md`의 *실제 카피*에서 뽑은 distinctive 문자열(섹션 제목·핵심 CTA 문구 등). `DESIGN.md`가 권위이므로 web-publisher는 이 카피를 그대로 써야 하고, 따라서 verbatim 대조가 공정하다. 섹션이 present-but-empty면 앵커가 안 잡혀 미충족으로 드러난다.
  - **핵심 요소** — 그 화면에 반드시 있어야 하는 인터랙티브·구조 요소(CTA 버튼·내비 링크·플랜 카드 N개·폼 필드 등).
- **인라인 전달**: 별도 파일을 만들지 않고 빌드 스펙 안에 적어 web-publisher에 넘긴다.
```

- [ ] **Step 3: "흐름 (리뷰 게이트)" 절 재작성**

현재 `## 흐름 (리뷰 게이트)` 절의 1~6 목록 전체를 다음으로 교체:

```markdown
1. `DESIGN.md`·`.design/brand-tokens.json`·생성 이미지(comp)를 읽어 위 스펙(출력 경로·섹션 구조)을 정한다.
2. **자산 갭 해소(빌드 전)** — 위 "자산 갭 해소" 절대로 슬롯을 열거·조달하고 `.design/assets/manifest.json`을 기록한다. 검수 게이트에서 사람이 확인하고, escalate가 있으면 자산을 제공받는다.
3. **완전성 체크리스트 생성(빌드 전)** — 위 "완전성 체크리스트" 절대로 `DESIGN.md`에서 필수 섹션·핵심 문구 앵커·핵심 요소를 뽑는다.
4. web-publisher에 위임해 `prototype/index.html`을 빌드+QA한다 — **매니페스트(슬롯↔파일 경로)와 완전성 체크리스트를 함께** 넘긴다. web-publisher는 빌드·레이아웃 QA에 더해 체크리스트를 Read/Grep으로 대조해 미충족 항목을 자기 맥락 내부 루프로 채운다.
5. 사람이 브라우저로 확인한다.
6. 마음에 안 들면 스펙·자산·체크리스트를 고쳐 web-publisher로 다시 빌드한다(4~5 반복).
7. 더 손볼 게 있으면 `DESIGN.md`나 토큰을 고쳐 `design-md-compiler`·이 스킬을 다시 돌리거나, 만족하면 **실제 구현으로 진행**하도록 안내한다.
```

- [ ] **Step 4: "HTML 산출 위임" 절에 체크리스트 전달 명시**

현재 `## HTML 산출 위임 (web-publisher)` 절의 첫 두 불릿(현재):

```markdown
- web-publisher를 직접 디스패치할 수 있으면(메인 세션) 위 입력·출력 경로·섹션 구조를 **스펙으로 넘겨** 빌드+QA를 맡긴다.
- 위임 시 **`.design/assets/manifest.json`을 함께 넘겨** "어느 슬롯을 어느 파일로 채울지" 알린다. web-publisher가 매니페스트 밖 자산 갭을 만나면 손으로 지어내지 말고 보고하게 한다(아래 web-publisher 계약).
```

를 다음으로 교체(둘째 불릿 뒤에 새 불릿 추가):

```markdown
- web-publisher를 직접 디스패치할 수 있으면(메인 세션) 위 입력·출력 경로·섹션 구조·완전성 체크리스트를 **스펙으로 넘겨** 빌드+QA를 맡긴다.
- 위임 시 **`.design/assets/manifest.json`을 함께 넘겨** "어느 슬롯을 어느 파일로 채울지" 알린다. web-publisher가 매니페스트 밖 자산 갭을 만나면 손으로 지어내지 말고 보고하게 한다(아래 web-publisher 계약).
- 위임 시 **완전성 체크리스트도 스펙에 포함**해 넘긴다 — web-publisher가 빌드 후 Read/Grep으로 대조해 구현 누락을 자가 수정한다(web-publisher 흐름의 "완전성 자가 대조").
```

- [ ] **Step 5: 삽입 확인 (grep)**

Run:
```bash
grep -n "완전성 체크리스트" "skills/design-html-prototype/SKILL.md"
```
Expected: 최소 5개 라인 매치(인트로 1 + 신규 절 제목/본문 + 흐름 step 3·4 + 위임 불릿). "완전성 체크리스트 (빌드 전)" 절 제목과 흐름 step 3·4가 포함돼야 한다.

- [ ] **Step 6: Commit**

`commit` 스킬을 사용한다(이 repo 규약). `skills/`만 바뀌었으므로 sync 후 스테이징·커밋하고, `agents/` 미변경이라 이 커밋만으론 `codex:reinstall` 불필요(Task 2에서 함께).

```bash
npm run sync && npm run validate
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): 빌드 전 완전성 체크리스트 생성 스펙 추가" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
Expected: `validate`가 "all generated files are up to date" 출력, 커밋 성공.

---

## Task 2: web-publisher.md — 완전성 자가 대조 단계 추가

**Files:**
- Modify: `agents/web-publisher.md`
- Regenerate: `codex-agents/web-publisher.toml` (via `npm run sync`, 커밋 안 함)

- [ ] **Step 1: "입력" 목록에 완전성 체크리스트 추가**

`agents/web-publisher.md`의 `## 입력 (대상 프로젝트 cwd)` 목록에서 현재 마지막 불릿(빌드 스펙):

```markdown
- **빌드 스펙**: 어떤 화면·아티팩트를 만들지(출력 경로·섹션/패널 구조·채울 내용·쓸 템플릿). 위임한 스킬이 넘겨주거나 사용자가 지정한다.
```

뒤에 새 불릿을 추가:

```markdown
- **완전성 체크리스트**(상위 스킬이 빌드 스펙으로 전달, 있으면) — 빌드 후 Read/Grep으로 대조할 필수 섹션·핵심 문구 앵커·핵심 요소 목록. 권위는 `DESIGN.md`다.
```

- [ ] **Step 2: "흐름" 절에 완전성 자가 대조 단계 추가**

`agents/web-publisher.md`의 `## 흐름` 절 1~4 목록 전체를 다음으로 교체:

```markdown
1. **구현** — 받은 스펙대로 HTML/CSS를 직접 저작한다. 아래 **HTML 품질 기준**을 지킨다. 템플릿이 지정되면 그걸 복사해 slot만 채운다. 토큰 변수(`tokens.css`)·`ui-kit.css` 클래스를 쓰고 색·폰트를 하드코딩하지 않는다.
2. **자가 QA(레이아웃)** — `web-publisher-qa` 스킬을 `Skill` 도구로 호출해 구현 결과를 breakpoint별 스크린샷으로 점검한다. 보이는 레이아웃 깨짐(요소 overflow·정렬·grid 불균일·깨진 이미지·겹침)을 찾는다.
3. **완전성 자가 대조** — 완전성 체크리스트를 받았으면, 빌드된 HTML을 **Read/Grep으로** 각 항목(필수 섹션·핵심 문구 앵커·핵심 요소)의 존재를 대조한다. 권위는 `DESIGN.md`다. (존재 대조는 미적·충실도 판정이 아니라 객관·기계적 판정이라 아래 "보기 좋은가는 판정 안 함" 경계와 충돌하지 않는다.)
4. **수정 반복** — 레이아웃 깨짐이나 미충족 항목을 찾으면 1로 돌아가 **외과적으로** 고치고 2·3을 다시 돈다. 둘 다 없으면 완료. 최종 메시지에 완전성 **충족/미충족 표**를 보고한다. 만들 수 없는 항목(필요 자산 부족 등)은 손으로 지어내지 말고 "매니페스트 밖 갭은 멈춰 보고" 규칙으로 에스컬레이션한다.
5. 사람(또는 designer)이 디자인 충실도를 보는 건 그다음, 별개 단계다.
```

- [ ] **Step 3: 삽입 확인 (grep)**

Run:
```bash
grep -n "완전성" "agents/web-publisher.md"
```
Expected: 최소 3개 라인 매치(입력 불릿 + 흐름 step 3 "완전성 자가 대조" + step 4 "충족/미충족 표").

- [ ] **Step 4: 생성물 동기화 + 일치 확인**

Run:
```bash
npm run sync
grep -n "완전성 자가 대조" "codex-agents/web-publisher.toml"
```
Expected: `sync-agents`가 `codex-agents/web-publisher.toml` 1개 재작성, grep이 본문 미러링을 확인(매치 있음). `codex-agents/`는 gitignore라 커밋하지 않는다.

- [ ] **Step 5: 검증 게이트 (validate + test)**

Run:
```bash
npm run validate && npm test
```
Expected: `validate` "all generated files are up to date", `npm test`의 기존 `tests/**/*.test.mjs` 전부 PASS(회귀 없음 — 이 변경은 프로즈라 테스트 영향 없음).

- [ ] **Step 6: Commit**

`commit` 스킬을 사용한다. `agents/`가 바뀌었으므로 커밋 후 **`npm run codex:reinstall`** 까지 한다(플러그인 영향 경로).

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): 빌드 후 완전성 자가 대조 단계 추가" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
Expected: 커밋 성공. `codex-agents/web-publisher.toml`은 gitignore라 커밋에 안 보임(정상).

---

## Task 3: 마무리 — 갱신 안내

- [ ] **Step 1: Codex 재설치 (agents 변경 반영)**

Run:
```bash
npm run codex:reinstall
```
Expected: 번들 재생성 → `codex plugin remove`/`add` → 에이전트 TOML이 `~/.codex/agents/`로 복사. (Codex 미사용 환경이면 생략 가능 — 사용자 확인.)

- [ ] **Step 2: 사람에게 reload 안내**

`/reload-plugins`는 슬래시 명령이라 자동 실행 불가. 사용자에게 안내: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."**

- [ ] **Step 3: 수동 동작 확인 권고 (선택)**

이 변경의 실제 행동(체크리스트 생성·grep 대조·자가 수정)은 런타임 LLM 행동이라 단위 테스트가 없다. 실사용 검증은 다음 번 `design-html-prototype` 실행에서 web-publisher가 충족/미충족 표를 보고하는지로 확인한다("써보고 부족하면 수정"). 별도 테스트 작성은 범위 밖.

---

## Self-Review

**1. Spec coverage** (spec 각 절 → Task 매핑):
- 문제(구현 누락 자동 탐지 부재) → Task 1·2 전체.
- 원칙 1(권위 = DESIGN.md, comp 아님) → Task 1 Step 2(앵커 출처 명시), Task 2 Step 2(권위 = DESIGN.md).
- 원칙 2(결정적 Read/Grep, 비전 아님) → Task 2 Step 2(흐름 step 3).
- 원칙 3(web-publisher 자기 맥락 내부 루프) → Task 2 Step 2(흐름 step 4 "1로 돌아가").
- 원칙 4(기준 ≠ 빌더 독립성) → Task 1(체크리스트는 스킬이 생성) + Task 2(web-publisher는 대조만).
- 완전성 체크리스트 절(필수 섹션·앵커·핵심 요소·인라인) → Task 1 Step 2.
- web-publisher 자가 대조(대조→미충족 수정→표 보고→에스컬레이션) → Task 2 Step 2.
- 바뀌는 파일(SKILL.md·web-publisher.md·sync 필요·web-publisher-qa 무변경·신규 에이전트 없음) → Task 1·2·3. (web-publisher-qa·신규 에이전트는 손대지 않음 = 자동 충족.)
- 경계 일관성(존재 대조 ≠ 미적 판정) → Task 2 Step 2(흐름 step 3 괄호).
→ 갭 없음.

**2. Placeholder scan:** "TBD"/"TODO"/"적절히"/"비슷하게" 류 없음. 모든 편집 Step에 실제 교체 문안 전체를 담음.

**3. Type/명칭 consistency:** 용어 통일 확인 — "완전성 체크리스트", "완전성 자가 대조", "충족/미충족 표", "앵커", "권위 = DESIGN.md"가 spec·Task 1·Task 2에서 동일하게 쓰임. 흐름 step 번호(Task 2: 1~5)와 본문 참조("2·3을 다시", "1로 돌아가")가 일치. SKILL.md 흐름(1~7)에서 "4~5 반복" 참조가 새 번호와 일치.
