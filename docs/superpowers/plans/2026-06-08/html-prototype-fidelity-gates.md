# html-prototype 충실도 게이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08/html-prototype-fidelity-gates-design.md`

**Goal:** html-prototype → web-publisher 파이프라인에 컴포넌트·아이콘 재사용 규율과 자가검사 게이트, comp 충실도 사람 검토 게이트를 추가해 헤더 손저작·아이콘 불일치·comp divergence를 자동/반자동으로 잡는다.

**Architecture:** 실행자(`agents/web-publisher.md`)에 저작 규율 2개 + 신규 자가검사 단계를 넣고, 스펙 스킬(`skills/design-html-prototype/SKILL.md`)에 입력 보강 + 위임 스펙 항목 + comp 사람 게이트를 넣는다. 코드 로직 변경 없음 — 마크다운 편집만.

**Tech Stack:** Markdown(SKILL.md·agent.md), 검증은 Grep/Read + `npm test`(회귀 확인) + `npm run sync`(Codex 번들 재생성).

---

## File Structure

- Modify: `agents/web-publisher.md` — 입력 목록, HTML 품질 기준(재사용·아이콘), 흐름(신규 자가검사 단계)
- Modify: `skills/design-html-prototype/SKILL.md` — 입력 보강, 위임 스펙, comp 사람 게이트
- 생성 파일 없음. 테스트 파일 없음(프로즈 편집 — 검증은 Grep/Read).

> 주의: `agents/*.md`·`skills/*` 수정 후 `npm run sync`로 gitignore된 로컬 번들(`codex-agents/`·`plugins/personal/`)이 재생성된다. 이들은 커밋하지 않는다. 커밋 대상은 소스 md + 이 docs뿐이다.

---

## Task 1: web-publisher 입력 목록에 마크업·아이콘 권위 추가

**Files:**
- Modify: `agents/web-publisher.md` (입력 섹션, 현재 `.design/assets/ui-kit/ui-kit.css`·`.design/assets/icon/*.svg` 줄 부근)

- [ ] **Step 1: 입력 목록 보강**

`## 입력 (대상 프로젝트 cwd)` 목록에서 아래 줄
```md
- `.design/assets/ui-kit/ui-kit.css`, `.design/assets/icon/*.svg`
```
를 다음으로 교체:
```md
- `.design/assets/ui-kit/ui-kit.css`(컴포넌트 권위), `.design/view/ui-kit.html`(컴포넌트 마크업 레퍼런스 — 정규 중첩 구조 참조), `.design/assets/icon/*.svg` + `.design/assets/icon/icon-map.json`(아이콘 권위 — 인라인 currentColor)
```

- [ ] **Step 2: 반영 확인**

Run: Grep `ui-kit\.html` in `agents/web-publisher.md`
Expected: 입력 목록에 `ui-kit.html`·`icon-map.json`이 보인다.

- [ ] **Step 3: 커밋**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): 입력에 ui-kit.html·icon-map.json 권위 추가"
```

---

## Task 2: web-publisher HTML 품질 기준에 "컴포넌트 재사용 우선" 추가

**Files:**
- Modify: `agents/web-publisher.md` (`## HTML 품질 기준` 섹션, `**재사용 구조**` 항목 부근)

- [ ] **Step 1: 재사용 규율 항목 추가**

`## HTML 품질 기준`의 `**재사용 구조**` 불릿 **바로 다음**에 새 불릿 삽입:
```md
- **컴포넌트 재사용 우선**: 무엇을 저작하기 전에 `ui-kit.css`에 해당 컴포넌트(navbar·btn·btn-icon·card·badge·input·table·chip 등)가 있는지 **먼저 확인하고, 있으면 재사용**한다. 페이지 전용 CSS는 ui-kit가 덮지 않는 레이아웃(카우셀·페이지 그리드·섹션 리듬)에만 짠다. 컴포넌트를 페이지에 맞게 적응해야 하면(예: navbar → 풀블리드 sticky 헤더) **내부 요소(`.brand`·`.nav-links`·`.btn-icon`)는 재사용하고 컨테이너만 조립**한다 — 컴포넌트 CSS를 처음부터 다시 쓰지 않는다. 정규 중첩 구조는 `ui-kit.html`을 마크업 레퍼런스로 참조한다.
```

- [ ] **Step 2: 반영 확인**

Run: Grep `컴포넌트 재사용 우선` in `agents/web-publisher.md`
Expected: HTML 품질 기준 안에 한 항목으로 존재.

- [ ] **Step 3: 커밋**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): HTML 품질 기준에 컴포넌트 재사용 우선 규율 추가"
```

---

## Task 3: web-publisher HTML 품질 기준에 "아이콘 출처" 추가

**Files:**
- Modify: `agents/web-publisher.md` (`## HTML 품질 기준` 섹션, `**폰트 실렌더**` 항목 부근)

- [ ] **Step 1: 아이콘 출처 항목 추가**

`**폰트 실렌더**` 불릿 **바로 다음**에 새 불릿 삽입:
```md
- **아이콘 출처**: 아이콘은 `.design/assets/icon/*.svg`(+`icon-map.json`)에서만 **인라인 currentColor**로 쓴다. 자리마다 SVG 패스를 창작하지 않는다. 쌍 컨트롤(prev/next·±·펼치기/접기 등)은 **같은 글리프 패밀리를 미러**해 모양을 맞춘다.
```

- [ ] **Step 2: 반영 확인**

Run: Grep `아이콘 출처` in `agents/web-publisher.md`
Expected: HTML 품질 기준 안에 한 항목으로 존재.

- [ ] **Step 3: 커밋**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): HTML 품질 기준에 아이콘 출처 규율 추가"
```

---

## Task 4: web-publisher 흐름에 "컴포넌트·아이콘 재사용 자가 대조" 단계 추가

**Files:**
- Modify: `agents/web-publisher.md` (`## 흐름` 섹션, "완전성 자가 대조"가 3번, "수정 반복"이 4번인 번호 목록)

- [ ] **Step 1: 신규 단계 삽입 + 번호 재정렬**

현재 흐름의 3번("완전성 자가 대조")과 4번("수정 반복") 사이에 새 항목을 넣고 이후 번호를 +1 한다. "완전성 자가 대조" 항목 **다음**에 삽입:
```md
4. **컴포넌트·아이콘 재사용 자가 대조** — 빌드된 HTML을 **Read/Grep으로** 점검해 다음을 플래그한다: (a) `ui-kit.css`에 같은 역할의 클래스가 있는데 페이지 `<style>`에서 동등 컴포넌트를 새로 정의한 경우(헤더·버튼·카드·배지·입력 등), (b) `assets/icon/`에 대응 글리프가 있는데 임의 인라인 SVG 패스를 박은 경우, (c) 같은 컨트롤 쌍(prev/next 등)이 다른 글리프 패밀리를 쓴 경우. 이 대조는 존재·출처의 객관·기계적 판정이라 "미적 충실도는 판정 안 함" 경계와 충돌하지 않는다(완전성 자가 대조와 동일 논리).
```
그리고 기존 4번 "수정 반복"을 5번으로, 5번을 6번으로 변경한다. "수정 반복" 문구에 "레이아웃 깨짐이나 미충족 항목"을 "레이아웃 깨짐·미충족 항목·재사용 위반"으로 보강한다.

- [ ] **Step 2: 반영 확인**

Run: Grep `재사용 자가 대조` in `agents/web-publisher.md`
Expected: 흐름에 신규 단계로 존재. 흐름 번호가 1→6까지 연속인지 Read로 확인.

- [ ] **Step 3: 커밋**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): 흐름에 컴포넌트·아이콘 재사용 자가 대조 단계 추가"
```

---

## Task 5: design-html-prototype 입력 목록 보강

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md` (`## 입력 파일 (대상 프로젝트 cwd 기준)` 섹션)

- [ ] **Step 1: 입력 항목 추가**

입력 목록의 `DESIGN.md`·`brand-tokens.json` 항목 뒤, comp 폴백 줄 **앞**에 추가:
```md
- `.design/assets/ui-kit/ui-kit.css` (컴포넌트 권위)
- `.design/view/ui-kit.html` (컴포넌트 마크업 레퍼런스 — 정규 중첩 구조 참조)
- `.design/assets/icon/*.svg` + `.design/assets/icon/icon-map.json` (아이콘 권위 — 인라인 currentColor)
```

- [ ] **Step 2: 반영 확인**

Run: Grep `ui-kit\.html` in `skills/design-html-prototype/SKILL.md`
Expected: 입력 목록에 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): 입력에 ui-kit·아이콘 권위 명시"
```

---

## Task 6: design-html-prototype 위임 스펙에 재사용 대조 포함

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md` (`## HTML 산출 위임 (web-publisher)` 섹션)

- [ ] **Step 1: 위임 항목 추가**

`## HTML 산출 위임 (web-publisher)` 불릿 목록에서 "완전성 체크리스트도 스펙에 포함" 항목 **다음**에 새 불릿 삽입:
```md
- 위임 시 **컴포넌트·아이콘 재사용 대조도 스펙에 포함**해 넘긴다 — web-publisher가 빌드 후 Read/Grep으로 (a) ui-kit 컴포넌트 중복 재저작, (b) 아이콘셋 밖 인라인 SVG, (c) 쌍 아이콘 글리프 불일치를 자가 수정한다(web-publisher 흐름의 "컴포넌트·아이콘 재사용 자가 대조").
```

- [ ] **Step 2: 반영 확인**

Run: Grep `재사용 대조` in `skills/design-html-prototype/SKILL.md`
Expected: 위임 섹션에 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): 위임 스펙에 컴포넌트·아이콘 재사용 대조 추가"
```

---

## Task 7: design-html-prototype 흐름에 comp 충실도 사람 검토 게이트

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md` (`## 흐름 (리뷰 게이트)` 섹션, 현재 5번 "사람이 브라우저로 확인한다.")

- [ ] **Step 1: 사람 검토 게이트 보강**

흐름 5번 `사람이 브라우저로 확인한다.`를 다음으로 교체:
```md
5. **사람이 브라우저로 확인한다 — comp 충실도 게이트.** 확인 시 comp(`.design/assets/page/*.png`)를 **나란히** 두고 구조적 divergence(화살표 위치·패널 비율·헤더 형태 등)를 본다. comp는 비권위("불완전한 한 해석")이므로 **사람이 살릴 점/버릴 점을 판정**한다 — 자동 픽셀 복제는 강제하지 않는다. (자동 비전 대조는 향후 옵션.)
```

- [ ] **Step 2: 반영 확인**

Run: Grep `comp 충실도 게이트` in `skills/design-html-prototype/SKILL.md`
Expected: 흐름 5번에 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): 흐름에 comp 충실도 사람 검토 게이트 추가"
```

---

## Task 8: 회귀 확인 + Codex 번들 동기화

**Files:**
- 없음(검증·동기화만)

- [ ] **Step 1: 스크립트 테스트 회귀 확인**

Run: `npm test`
Expected: 기존 테스트 전부 PASS(프로즈 편집이라 영향 없음).

- [ ] **Step 2: Codex 번들 재생성**

> 사용자 확인 후 실행(CLAUDE.md: 명령 실행 전 확인).

Run: `npm run sync`
Expected: `codex-agents/web-publisher.toml`·`plugins/personal/skills/design-html-prototype/` 재생성. 이들은 gitignore라 커밋하지 않는다.

- [ ] **Step 3: git 상태 확인**

Run: `git status`
Expected: 추적 변경은 `agents/web-publisher.md`·`skills/design-html-prototype/SKILL.md`(이미 커밋됨)와 docs뿐. gitignore 번들은 안 보이거나 untracked로만.

---

## Self-Review

- **스펙 커버리지:** 변경1a→Task2, 1b→Task3, 1c→Task4, 입력보강→Task1·5, 2b→Task6, 2c→Task7. comp 게이트(①)→Task7. 모든 스펙 항목에 태스크 대응.
- **Placeholder:** 모든 스텝에 실제 삽입 텍스트 포함. TBD 없음.
- **일관성:** "컴포넌트·아이콘 재사용 자가 대조"(web-publisher 흐름)와 "컴포넌트·아이콘 재사용 대조"(위임 스펙)가 같은 게이트를 가리킴 — Task4·Task6에서 동일 명칭 교차 참조.
