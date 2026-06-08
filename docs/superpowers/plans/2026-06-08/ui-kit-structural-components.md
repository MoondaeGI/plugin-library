# ui-kit 구조 컴포넌트 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08/ui-kit-structural-components-design.md`

**Goal:** design-ui-kit이 footer·필터칩 변형·navbar 풀블리드 변형·섹션 헤더를 어휘로 인지하고(섹션헤더는 조건부 사용), sidebar를 조건부 어휘로 제안하며, "ui-kit = 조건부 어휘" 원칙을 명문화한다. md-compiler §5도 이들을 기술 대상으로 포함한다.

**Architecture:** 마크다운 편집만. design-ui-kit의 컴포넌트 분류(4그룹)·게이트1 원칙·신규 컴포넌트 저작 가이드·슬롯 스펙을 갱신하고, md-compiler §5 예시 목록을 넓힌다. 쇼케이스 템플릿(`ui-kit-sheet.html`)은 4패널 고정 chrome이라 구조 변경 불필요 — 신규 컴포넌트는 기존 패널 슬롯에 런타임 specimen으로 들어간다.

**Tech Stack:** Markdown(SKILL.md). 검증은 Grep/Read + `npm test`(회귀) + `npm run sync`(Codex 번들).

---

## File Structure

- Modify: `skills/design-ui-kit/SKILL.md` — 컴포넌트 분류, 게이트1 원칙, 신규 컴포넌트 저작 가이드, 슬롯 스펙
- Modify: `skills/design-md-compiler/SKILL.md` — §5 컴포넌트 예시 목록
- 변경 없음: `skills/design-ui-kit/templates/ui-kit-sheet.html` (4패널 고정 chrome — 신규 컴포넌트는 기존 슬롯에 매핑)
- 생성/테스트 파일 없음(프로즈 편집 — 검증은 Grep/Read).

> 주의: `skills/*` 수정 후 `npm run sync`로 gitignore된 `plugins/personal/`가 재생성된다. 커밋 대상은 소스 SKILL.md + docs뿐.

---

## Task 1: 컴포넌트 분류(4그룹) 갱신

**Files:**
- Modify: `skills/design-ui-kit/SKILL.md` (`## 컴포넌트 분류 (4그룹)` 표)

- [ ] **Step 1: 그룹2·그룹4 항목 보강**

표 그룹2(Core Interactive)의 IN/예시 칸에 **필터 칩 변형**을 추가한다(`badge/chip` 옆):
```
filter chip(필터 토글 — 태그형 .chip과 구분)
```
표 그룹4(Structural)의 IN 칸에 **footer·section header·navbar 풀블리드 변형**을 추가하고, 예시(조건부) 칸의 `sidebar`를 유지·강조한다. 그룹4 행을 다음 취지로 갱신:
```
IN: navbar/topbar·navbar 풀블리드 변형(app bar)·tabs·breadcrumb·table·pagination·list·footer·section header
예시(조건부): sidebar·dashboard 패널(예시 1개, 차트 제외)
```

- [ ] **Step 2: footer 경계 주석 추가**

그룹4 표 **아래 설명 불릿**에 한 줄 추가:
```md
- footer·app bar·section header는 **반복되는 구조 chrome**이라 IN. 단 "마케팅 히어로·풀페이지 레이아웃"은 여전히 제외(→ `design-image-web`). footer는 chrome이지 마케팅 히어로가 아니다.
```

- [ ] **Step 3: 반영 확인**

Run: Grep `footer` in `skills/design-ui-kit/SKILL.md`
Expected: 컴포넌트 분류 그룹4에 footer·section header·navbar 풀블리드 변형이 보인다.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(design-ui-kit): 4그룹 분류에 footer·필터칩·navbar변형·섹션헤더 어휘 추가"
```

---

## Task 2: "ui-kit = 조건부 어휘" 원칙 명문화 + 셸 향후 표기

**Files:**
- Modify: `skills/design-ui-kit/SKILL.md` (`### Phase 1` 게이트1 설명, `## 컴포넌트 분류 (4그룹)` 서두)

- [ ] **Step 1: 게이트1 원칙 한 줄 추가**

게이트1 설명(`**게이트1 — 목록**`) 항목 끝에 추가:
```md
ui-kit은 **조건부 어휘**다 — 강제 포함 컴포넌트는 없고, *그 제품 화면이 필요로 하는 것*만 저작한다. sidebar는 app/console 화면이 있을 때만, footer는 site/landing 화면이 있을 때만, section header는 제목+액션 섹션이 있는 화면에서만 포함한다.
```

- [ ] **Step 2: 셸 향후 표기 추가**

`## 컴포넌트 분류 (4그룹)` 표 아래 설명에 한 줄 추가:
```md
- **셸(site/app/minimal 등 header·sidebar·footer 조합 레이아웃)은 이 스킬 범위 밖**이다 — 페이지 조립(프로토타입·페이지 코드)의 몫이며 별도 설계로 다룬다. 이 스킬은 셸을 이루는 *블록*만 어휘로 제공한다.
```

- [ ] **Step 3: 반영 확인**

Run: Grep `조건부 어휘` in `skills/design-ui-kit/SKILL.md`
Expected: 게이트1에 원칙, 분류에 셸 향후 표기 존재.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(design-ui-kit): 조건부 어휘 원칙 명문화 + 셸 향후 표기"
```

---

## Task 3: 신규 컴포넌트 저작 가이드 추가

**Files:**
- Modify: `skills/design-ui-kit/SKILL.md` (`### Phase 2` 4단계 "ui-kit.css 저작" 부근 — 신규 컴포넌트 저작 가이드 소절 추가)

- [ ] **Step 1: 저작 가이드 소절 삽입**

`4. **ui-kit.css 저작**` 항목 아래에 신규 구조 컴포넌트 가이드를 추가(토큰 변수만, 아이콘은 `assets/icon/*.svg` 인라인):
```md
   **신규 구조 컴포넌트 저작 가이드**(해당 제품 화면이 필요로 할 때만):
   - **footer**(`.footer` + `.footer-brand`·`.footer-col`·`.footer-bottom`): 브랜드 컬럼 + 링크 컬럼 + (선택)뉴스레터(`.field`·`.input`·`.btn` 재사용) + 하단 바. surface/틴트 배경 + 상단 헤어라인. 마케팅 히어로 아님.
   - **navbar 풀블리드 변형**(`.navbar-bar`): 기존 `.navbar` 내부요소(`.brand`·`.nav-links`·`.btn-icon`)는 그대로, 컨테이너만 풀블리드 sticky·테두리/ radius 제거·하단 헤어라인. 새 컴포넌트가 아니라 변형.
   - **section header**(`.section-head` + `.section-title`·`.section-action`): 제목 + 액션 링크("전체보기 →"). 액션 아이콘은 `assets/icon/chevron-right.svg` 인라인.
   - **filter chip**(`.chip-filter` + `.is-active`): 태그형 `.chip`과 구분되는 토글 필터. 기본=surface/테두리, 활성=primary-dark/surface 텍스트. 의사상태·강제상태(`.is-active`) 규칙 공유.
   - **sidebar**(`.sidebar` + `.sidebar-nav`·`.sidebar-link`·`.sidebar-link.is-active`): app/console 화면 전용. 세로 네비, 활성 링크 강조. **SugarLoop류 스토어프론트엔 저작하지 않는다.**
```

- [ ] **Step 2: 반영 확인**

Run: Grep `navbar-bar` in `skills/design-ui-kit/SKILL.md`
Expected: 저작 가이드 소절에 5개 컴포넌트 모두 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(design-ui-kit): footer·navbar변형·섹션헤더·필터칩·sidebar 저작 가이드 추가"
```

---

## Task 4: 쇼케이스 슬롯 스펙에 신규 컴포넌트 명시

**Files:**
- Modify: `skills/design-ui-kit/SKILL.md` (`### Phase 2` 5단계 슬롯 스펙 `slot:foundations|core|informational|structural` 불릿)

- [ ] **Step 1: 슬롯 스펙 보강**

`slot:foundations|core|informational|structural` 불릿을 다음으로 교체:
```md
   - `slot:foundations|core|informational|structural`: 각 그룹 specimen. **매트릭스(행=상태×열=변형)**로 변형·상태를 한눈에. 번호/라벨로 검수 가능하게. 신규 구조 컴포넌트는 대응 패널에 specimen으로 노출 — **core**: filter chip(`.chip-filter` 기본/활성), **structural**: footer·navbar 풀블리드 변형·section header·(제품에 있으면) sidebar. 템플릿은 4패널 고정 chrome이므로 새 패널을 만들지 않고 기존 슬롯에 채운다.
```

- [ ] **Step 2: 반영 확인**

Run: Grep `chip-filter` in `skills/design-ui-kit/SKILL.md`
Expected: 슬롯 스펙에 신규 컴포넌트 매핑 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-ui-kit/SKILL.md
git commit -m "feat(design-ui-kit): 쇼케이스 슬롯 스펙에 신규 구조 컴포넌트 매핑"
```

---

## Task 5: md-compiler §5 컴포넌트 예시 목록 확장

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md` (`## 5. 컴포넌트 규칙` 예시 줄 — `### Button / Input / Card / …`)

- [ ] **Step 1: §5 예시 목록 보강**

다음 줄
```md
### Button / Input / Card / Badge / Navigation / Table / Dashboard Panel / Alert·Toast / Empty State …(ui-kit.css에 있는 것)
```
을 다음으로 교체:
```md
### Button / Input / Card / Badge / Navigation / App Bar(navbar 변형) / Filter Chip / Section Header / Footer / Sidebar(조건부) / Table / Dashboard Panel / Alert·Toast / Empty State …(ui-kit.css에 있는 것)
```

- [ ] **Step 2: 반영 확인**

Run: Grep `Footer` in `skills/design-md-compiler/SKILL.md`
Expected: §5 예시 목록에 App Bar·Filter Chip·Section Header·Footer·Sidebar 존재.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(design-md-compiler): §5 컴포넌트 예시에 footer·sidebar·섹션헤더·필터칩·app bar 추가"
```

---

## Task 6: 회귀 확인 + Codex 번들 동기화

**Files:**
- 없음(검증·동기화만)

- [ ] **Step 1: 스크립트 테스트 회귀 확인**

Run: `npm test`
Expected: 기존 테스트 전부 PASS(프로즈 편집이라 영향 없음).

- [ ] **Step 2: Codex 번들 재생성**

> 사용자 확인 후 실행(CLAUDE.md: 명령 실행 전 확인).

Run: `npm run sync`
Expected: `plugins/personal/skills/design-ui-kit/`·`design-md-compiler/` 재생성. gitignore라 커밋하지 않는다.

- [ ] **Step 3: git 상태 확인**

Run: `git status`
Expected: 추적 변경은 `skills/design-ui-kit/SKILL.md`·`skills/design-md-compiler/SKILL.md`(이미 커밋됨)와 docs뿐.

---

## Self-Review

- **스펙 커버리지:** 변경1a→Task1, 1b→Task2, 1c→Task3, 1d→Task4, 변경2(md §5)→Task5. sidebar 조건부→Task1·2·3. 셸 out of scope 표기→Task2. 모든 스펙 항목에 태스크 대응.
- **Placeholder:** 모든 스텝에 실제 삽입/교체 텍스트 포함. TBD 없음.
- **일관성:** 클래스명(`.chip-filter`·`.navbar-bar`·`.section-head`·`.footer`·`.sidebar`)이 Task3(가이드)·Task4(슬롯)·Task5(§5 명칭)에서 동일하게 쓰임. 템플릿 미변경을 Task4·File Structure에서 동일하게 명시.
