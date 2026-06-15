# ppt-plan 이미지 데이터 소스 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** docs/superpowers/specs/2026-06-15/ppt-plan-image-data-source-design.md

**Goal:** ppt-plan 게이트 1이 이미지(차트·표·스크린샷)를 데이터 소스로 읽어 수치·사실을 추출하고, 추출 수치를 outline에 넣기 전 always 사용자 확인을 거치게 만든다.

**Architecture:** 단일 파일(`skills/ppt-plan/SKILL.md`) 산문 편집 3곳(frontmatter·게이트 1 본문·outline 형식) + Codex 번들 재생성(`npm run sync`). 새 코드·새 파일·subagent 없음.

**Tech Stack:** Markdown 산문 스킬. 실행 코드 없음 → 단위 테스트 대상 없음. 검증은 정확한 문자열 치환 성공과 `npm run sync` 무오류, 그리고 스킬 텍스트 리뷰.

---

## 파일 구조

- Modify: `skills/ppt-plan/SKILL.md` (frontmatter line 3, 게이트 1 line 20, outline 형식 절 line 57 부근)
- Regenerate (커밋 안 함): `plugins/personal/` Codex 번들 — `npm run sync` 산출물(gitignore)
- 함께 커밋: 본 plan + 짝 spec

---

### Task 1: description frontmatter에 이미지 언급 추가

**Files:**
- Modify: `skills/ppt-plan/SKILL.md:3`

- [ ] **Step 1: frontmatter description 끝에 한 문장 추가**

`skills/ppt-plan/SKILL.md`의 line 3을 찾아 `전략 상담만 받고 끝나도 된다.` 다음,
`파일 제작(.pptx)은 ppt-create.` 앞에 한 문장을 끼운다.

치환 전(정확히 이 문자열):
```
전략 상담만 받고 끝나도 된다. 파일 제작(.pptx)은 ppt-create.
```
치환 후:
```
전략 상담만 받고 끝나도 된다. 자료에 차트·표·스크린샷 같은 이미지가 섞여 있어도 데이터 소스로 읽어 수치·사실을 끌어낸다. 파일 제작(.pptx)은 ppt-create.
```

- [ ] **Step 2: 치환 검증**

`skills/ppt-plan/SKILL.md` line 3에 "이미지가 섞여 있어도 데이터 소스로 읽어"
문구가 들어갔는지 확인. frontmatter 구분자(`---`)·`name:` 줄은 그대로인지 확인.

---

### Task 2: 게이트 1 `자료가 있다` 가지에 이미지 처리 하위 항목 추가

**Files:**
- Modify: `skills/ppt-plan/SKILL.md:20`

- [ ] **Step 1: `자료가 있다` 한 줄을 하위 항목이 달린 블록으로 교체**

치환 전(정확히 이 한 줄, line 20):
```
- **자료가 있다** → 받아서 읽고 소화. 핵심 주장·숫자·구조를 요약해 보여주고 확인받는다.
```
치환 후:
```
- **자료가 있다** → 받아서 읽고 소화. 핵심 주장·숫자·구조를 요약해 보여주고 확인받는다.
  - **이미지(차트·표·스크린샷 캡처)가 섞여 있으면** 디자인 참고가 아니라 *데이터 소스*로 읽어 그 안의 수치·사실을 끌어낸다.
  - 이미지에서 뽑은 **모든 수치는 outline에 넣기 전 always 확인**받는다. 산문 요약에 섞지 말고 `원본 → 읽은 값` 목록으로 따로 제시한다:
    ```
    [매출차트.png] 2024 Q3 매출 → 12.4억 · Q4 → 15.1억  (단위·기간 원본대로)
    이 값들이 원본과 맞나요?
    ```
    OCR은 자릿수·축 보간에서 틀리기 쉬우니 **사용자 대조가 최종 권위**다.
  - **이미지를 볼 수 없는 환경(비전 미지원)이면** 추출을 시도하지 말고 "이 이미지의 핵심 수치를 텍스트로 알려주세요"로 요청한다 — 한쪽에서만 도는 안전장치를 만들지 않는다.
```

- [ ] **Step 2: 들여쓰기·중첩 코드펜스 검증**

하위 `-` 항목이 2칸 들여쓰기로 `자료가 있다`에 종속됐는지, 안쪽 ```` ``` ````
블록이 4칸 들여쓰기 안에서 정상 여닫히는지 확인. `조사가 필요하다`·`머릿속에
있다` 가지는 변경 없이 그대로인지 확인.

---

### Task 3: outline.md 형식 절에 이미지 출처·메타 표기 줄 추가

**Files:**
- Modify: `skills/ppt-plan/SKILL.md:57` 부근 (`## outline.md 형식` 절)

- [ ] **Step 1: 레이아웃 안내 문단 다음에 출처 표기 안내 추가**

치환 전(정확히 이 한 줄, line 57):
```
페이지의 `[레이아웃]`은 ppt-create의 레이아웃 8종(title·section·bullets·two-col·chart·table·image·closing)을 쓴다 — 미정이면 비워두고 create에서 배정.
```
치환 후:
```
페이지의 `[레이아웃]`은 ppt-create의 레이아웃 8종(title·section·bullets·two-col·chart·table·image·closing)을 쓴다 — 미정이면 비워두고 create에서 배정.

이미지에서 끌어온 근거는 `근거: <이미지파일>에서 추출 (단위·기간·출처)`로 출처와 메타를 남긴다. 차트 `data` 배열 구조화·검증은 ppt-create(`validate-spec.mjs`) 몫 — plan은 출처 표시까지만 한다.
```

- [ ] **Step 2: 치환 검증**

outline 형식 절에 "출처와 메타를 남긴다" 문장이 들어갔고, `## 끝나는 방식 두 가지`
절은 그대로인지 확인.

---

### Task 4: Codex 번들 재생성

**Files:**
- Regenerate: `plugins/personal/` (gitignore — 커밋 안 함)

- [ ] **Step 1: 사용자 승인 후 sync 실행**

CLAUDE.md 규칙상 명령 실행 전 사용자 확인을 받는다. 승인되면 플러그인 루트에서:
```
npm run sync
```
Expected: 오류 없이 완료. `plugins/personal/skills/ppt-plan/SKILL.md`가 루트
변경분을 반영했는지 확인.

- [ ] **Step 2: 무오류 확인**

sync 출력에 에러가 없고 종료 코드 0인지 확인. (check-secrets·sync-mcp 등 다른
sync 단계도 통과해야 한다.)

---

### Task 5: 스펙·플랜·스킬 변경 커밋

**Files:**
- Commit: `skills/ppt-plan/SKILL.md`, `docs/superpowers/specs/2026-06-15/ppt-plan-image-data-source-design.md`, `docs/superpowers/plans/2026-06-15/ppt-plan-image-data-source.md`

- [ ] **Step 1: 사용자 승인 후 커밋**

CLAUDE.md 규칙상 커밋 전 사용자 확인을 받는다. 승인되면:
```
git add skills/ppt-plan/SKILL.md docs/superpowers/specs/2026-06-15/ppt-plan-image-data-source-design.md docs/superpowers/plans/2026-06-15/ppt-plan-image-data-source.md
git commit
```
커밋 메시지(예): `feat(ppt-plan): 이미지를 데이터 소스로 읽어 수치 추출·always 확인`
- `plugins/personal/`는 gitignore라 스테이징 대상 아님(AGENTS.md). 커밋 전
  `git status`로 의도치 않은 추적 파일이 없는지 확인.

- [ ] **Step 2: 커밋 확인**

`git log -1 --stat`으로 3개 파일(skill·spec·plan)만 커밋됐는지 확인.

---

## Self-Review

**1. Spec coverage**
- 설계 §1(게이트 1 확장) → Task 2 ✓
- 설계 §2(outline 출처·메타) → Task 3 ✓
- 설계 §3(description) → Task 1 ✓
- 설계 §4(저마찰성, "이미지 있을 때만" 분기) → Task 2 본문이 조건부 가지에만 추가되어 충족 ✓
- 확정 결정 1(always 확인) → Task 2 Step 1 ✓
- 확정 결정 2(subagent 없음) → 어느 Task에도 추가 안 함 ✓ (의도적 부재)
- Codex 폴백 → Task 2 마지막 하위 항목 ✓
- 구현 노트(npm run sync) → Task 4 ✓

**2. Placeholder scan:** TBD·TODO·"적절히 처리" 류 없음. 모든 치환 전/후 문자열 명시 ✓

**3. Type consistency:** 코드 없음 — 시그니처 불일치 해당 없음. 파일 경로는 전 Task
동일(`skills/ppt-plan/SKILL.md`) ✓
