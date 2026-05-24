# Design 스킬 협업형 이미지 생성 + 로고 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit`·`design-page-image`를 "한 개 생성 → 보여주고 피드백 → 한 가지 수정 → 다음" 디자이너 협업 루프로 바꾸고, brand-kit이 로고(필수)·무드보드·키 비주얼을 Codex 내장 `image_gen`으로 실제 생성하게 한다.

**Architecture:** 두 SKILL.md(마크다운 지시문)를 수정한다. 생성은 Codex 내장 `image_gen`이 구동하고(도구 없으면 사람이 드롭 — 에이전트 중립), 색·타이포 정밀 스펙은 이미지가 아니라 `BRAND_KIT.md`/`brand-tokens.json`에 둔다. 스킬을 고치면 `npm run sync`가 Codex 번들 `plugins/personal/`를 재생성하므로, 각 스킬 커밋에 재생성된 번들 사본을 함께 포함한다.

**Tech Stack:** 마크다운 `SKILL.md`(프론트매터 `name`·`description`만). 실행 코드/단위 테스트 없음 — 검증은 구조 체크리스트 + `npm run validate`(번들 동기화) + Codex 재설치 + `codex exec` 동작 확인.

**기준 스펙:** `docs/superpowers/specs/2026-05-24-design-image-generation-design.md`

---

## File Structure

수정할 파일 (둘 다 기존):
- `skills/design-brand-kit/SKILL.md` — 로고(필수)+무드보드+키비주얼 브리프, `## 이미지 생성` 절, 협업 루프.
- `skills/design-page-image/SKILL.md` — `## 이미지 생성` 절, 섹션별 협업 루프.

자동 생성(직접 편집 금지, 각 스킬 커밋에 포함): `plugins/personal/skills/design-brand-kit/SKILL.md`, `plugins/personal/skills/design-page-image/SKILL.md` (`npm run sync` 산출물).

변경 없음: `design-md-compiler`, `design-html-prototype`, 다운스트림은 `.design/generated/**` 이미지를 그대로 소비.

---

## Task 1: design-brand-kit — 로고 생성 + 협업 루프

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`
- Regenerate (via sync): `plugins/personal/skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: description에 로고/협업 반영**

`skills/design-brand-kit/SKILL.md`의 프론트매터 `description:` 줄을 아래로 교체:

```
description: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포그래피·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷을 만들고, 로고(필수)·무드보드·키 비주얼 같은 브랜드 이미지를 한 개씩 협업하며 생성·반복할 때 사용한다.
```

- [ ] **Step 2: 목적 절 교체**

`## 목적` 아래 문단을 아래로 교체:

```
제품 설명만 보고 바로 화면을 만들지 않는다. 먼저 브랜드의 성격·시각 방향·색상·타이포그래피·로고 방향·UI 분위기를 정리한 뒤, 로고·무드보드 같은 브랜드 이미지를 **실제 디자이너처럼 한 개씩 만들어 보여주고, 피드백을 받아 반복 수정**한다.
```

- [ ] **Step 3: 출력 파일 절 교체**

`## 출력 파일 (대상 프로젝트 cwd 기준)` 아래 4개 불릿(`.design/BRAND_KIT.md` ~ `.design/generated/brand-kit/ ...`)을 아래로 교체:

```
- `.design/BRAND_KIT.md` — 브랜드 방향(텍스트). 색 팔레트·타이포 스펙은 여기와 토큰에만 둔다(이미지에 넣지 않음).
- `.design/brand-tokens.json`
- `.design/image-briefs/brand-briefs.md` — 로고·무드보드·키 비주얼 브리프
- `.design/generated/logo/` — 로고 이미지 (필수)
- `.design/generated/brand-kit/` — 무드보드·키 비주얼 이미지

생성 폴더는 Codex 내장 `image_gen`이 채우거나 사람이 드롭한다 (아래 "이미지 생성"·"흐름" 참고).
```

- [ ] **Step 4: brand-briefs.md 구조 절을 로고+무드보드+키비주얼로 교체**

`## brand-briefs.md 구조 (무드보드)` 절 전체(헤딩 + 그 아래 ```md ... ``` 펜스, 3개 Moodboard 템플릿)를 아래로 교체:

````
## brand-briefs.md 구조

```md
# Brand Image Briefs

## 공통 방향
- 브랜드 키워드:
- 추천 시각 루트: (BRAND_KIT의 3가지 루트 중 추천안)
- 금지 패턴:

## 로고 (필수)
### 로고 유형
워드마크 / 레터마크(모노그램) / 심볼 / 콤비네이션 / 엠블럼 — 방향 + 이유
### 형태 언어
기하 vs 유기, 각짐 vs 둥긆, 선 굵기, 대칭성, 제품 본질에서 끌어온 모티프 (형태로 설명)
### 타이포 (워드마크·레터마크면)
글자 성격(세리프/산세리프/커스텀), 자간·굵기
### 색 / 단색 버전
primary 적용 + 흑/백 단색 버전 고려
### 확장성 / 여백
파비콘(16px)~큰 화면에서 읽히게, 최소 여백
### 이미지 생성 Prompt
### Negative Prompt
(금지: 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미없는 그라데이션·3D 베벨·드롭섀도, 스톡 아이콘 느낌)

## 무드보드
### 분위기 / 키워드
### 색 분위기 / 질감·소재
### 이미지 성향 (사진/추상/일러스트) / 조명·톤 / 구도
### 이미지 생성 Prompt
### Negative Prompt
(텍스트가 중요한 요소를 넣지 않는다)

## 키 비주얼 (선택)
### 용도 (히어로 배경 / 섹션 악센트 등)
### 형태·패턴·텍스처 방향 (로고·무드보드와 일관)
### 이미지 생성 Prompt
### Negative Prompt
```
````

- [ ] **Step 5: `## 이미지 생성` 절 신규 추가**

`## 금지 사항` 절과 `## 흐름 ...` 절 사이에 아래 절을 삽입:

```
## 이미지 생성

이미지 생성 도구가 있으면(Codex 내장 `image_gen`) 브리프를 바탕으로 직접 생성한다. 없으면(예: Claude) 사람이 같은 폴더에 이미지를 드롭한다 — 다운스트림은 둘을 구분하지 않는다.

- **항목당 1회 호출.** 한 번에 한 개만 만든다 (여러 장은 변형 `n`이 아니라 개별 호출).
- 프롬프트 매핑: `Primary request` ← 브리프의 "이미지 생성 Prompt", `Avoid` ← "Negative Prompt", `Color palette`·`Style` ← `brand-tokens.json` + 시각 방향.
- `Use case` 슬러그: 로고 = `logo-brand`, 무드보드·키 비주얼 = `stylized-concept`.
- **저장**: 생성 기본 위치에 방치하지 말고 워크스페이스로 복사 — 로고는 `.design/generated/logo/`, 무드보드·키 비주얼은 `.design/generated/brand-kit/`. 파일명은 항목 식별 가능하게(`logo-concept-1.png`, `moodboard-1.png`), 재생성 시 버전(`-v2`)으로 기존 확정본을 덮지 않는다.
- 로고는 단색 버전을 고려하고 배경을 깨끗하게 둔다 (향후 로고 수정 단계의 입력이 되므로).
- 색 팔레트·폰트 스펙처럼 정확한 텍스트가 필요한 것은 이미지로 만들지 않는다 — `BRAND_KIT.md`/`brand-tokens.json`에 둔다.
```

- [ ] **Step 6: 흐름 절을 협업 루프로 교체**

`## 흐름 (리뷰 게이트)` 절 전체(헤딩 + 1~5단계 + 마지막 "이미지를 직접 생성하지 않는다 …" 문장)를 아래로 교체:

```
## 흐름 (디자이너 협업 루프)

1. `.design/BRAND_KIT.md` + `.design/brand-tokens.json` 작성 (방향 문서; 색·타이포는 여기에).
2. `.design/image-briefs/brand-briefs.md` 작성 (로고·무드보드·키 비주얼 브리프).
3. **항목을 한 개씩** 진행한다. 순서: **로고(필수) → 무드보드 → (선택) 키 비주얼**. 각 항목마다:
   - 이미지 1장 생성(도구 없으면 사람이 드롭) → 보여주고 "이 방향 어때요? 뭘 바꿀까요?" 라고 묻는다.
   - 피드백을 받아 **한 번에 한 가지만** 고쳐 재생성한다. 만족(lock)할 때까지 반복.
   - 확정되면 해당 `.design/generated/<폴더>/`에 저장하고 다음 항목으로.
4. 모든 항목이 확정되면 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-page-image`"**.

전체를 한꺼번에 생성하지 않는다 — 한 개 만들고, 고치고, 다음으로 넘어간다.
```

- [ ] **Step 7: 구조 검증**

확인: 프론트매터는 `name`·`description`만 / 출력에 `.design/generated/logo/`(필수) 포함 / brand-briefs.md에 "로고 (필수)"·"무드보드"·"키 비주얼 (선택)" 3블록 / `## 이미지 생성` 절에 `logo-brand`·`stylized-concept`·`logo/`·`brand-kit/`·"항목당 1회" 포함 / 흐름이 "로고(필수) → 무드보드 → 키 비주얼" 한 개씩 루프 + 끝에 `design-page-image` / 색·타이포는 md·tokens 유지 명시 / 마크다운 펜스 균형.

- [ ] **Step 8: 번들 재생성 + 동기화 검증**

Run: `npm run sync`
Expected: `sync-codex-plugin: wrote plugins/personal/ ...` (또는 already in sync면 변경 없음)
Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.` 와 `sync-codex-plugin: Codex bundle is up to date.`

- [ ] **Step 9: Commit**

```bash
git add skills/design-brand-kit/SKILL.md plugins/personal/skills/design-brand-kit/SKILL.md
git commit -m "feat(design): brand-kit generates logo + collaborative per-item image loop"
```

---

## Task 2: design-page-image — 섹션별 협업 루프 + 생성

**Files:**
- Modify: `skills/design-page-image/SKILL.md`
- Regenerate (via sync): `plugins/personal/skills/design-page-image/SKILL.md`

- [ ] **Step 1: `## 이미지 생성` 절 신규 추가**

`## 금지 사항` 절과 `## 흐름 ...` 절 사이에 아래 절을 삽입:

```
## 이미지 생성

이미지 생성 도구가 있으면(Codex 내장 `image_gen`) 브리프를 바탕으로 직접 생성한다. 없으면(예: Claude) 사람이 같은 폴더에 드롭한다.

- **섹션당 1회 호출.** 한 번에 한 섹션만 만든다.
- 프롬프트 매핑: `Primary request` ← 섹션의 "이미지 생성 Prompt", `Avoid` ← "Negative Prompt", `Color palette`·`Style` ← `brand-tokens.json` + 공통 디자인 방향.
- `Use case` 슬러그: `ui-mockup`.
- **저장**: 워크스페이스로 복사 — `.design/generated/page/`. 파일명 `section-1-hero.png` 식, 재생성 시 버전(`-v2`).
```

- [ ] **Step 2: 흐름 절을 섹션별 협업 루프로 교체**

`## 흐름 (리뷰 게이트)` 절 전체(헤딩 + 1~4단계 + 마지막 "이미지를 직접 생성하지 않는다 …" 문장)를 아래로 교체:

```
## 흐름 (디자이너 협업 루프)

1. `.design/image-briefs/page-briefs.md` 작성 (섹션 계획; 섹션당 브리프 1개).
2. **섹션을 하나씩** 진행한다. 각 섹션마다:
   - 이미지 1장 생성(도구 없으면 사람이 드롭) → 보여주고 "이 섹션 어때요? 뭘 바꿀까요?" 라고 묻는다.
   - 피드백을 받아 **한 번에 한 가지만** 고쳐 재생성한다. 만족(lock)할 때까지 반복.
   - 확정되면 `.design/generated/page/`에 저장하고 다음 섹션으로.
3. 필요한 섹션이 다 확정되면 산출물 경로를 제시하고 안내한다: **"다음 단계: `design-md-compiler`"**.

전체 섹션을 한꺼번에 생성하지 않는다 — 한 섹션 만들고, 고치고, 다음으로.
```

- [ ] **Step 3: 구조 검증**

확인: 프론트매터 `name`·`description`만 / `## 이미지 생성` 절에 `ui-mockup`·`page/`·"섹션당 1회" 포함 / 흐름이 "섹션 하나씩" 루프 + 끝에 `design-md-compiler` / 기존 핵심 규칙·taste·금지·기본 6섹션·page-briefs 템플릿은 유지 / 마크다운 펜스 균형.

- [ ] **Step 4: 번들 재생성 + 동기화 검증**

Run: `npm run sync`
Run: `npm run validate`
Expected: 두 sync 모두 up to date.

- [ ] **Step 5: Commit**

```bash
git add skills/design-page-image/SKILL.md plugins/personal/skills/design-page-image/SKILL.md
git commit -m "feat(design): page-image per-section collaborative image loop"
```

---

## Task 3: Codex 재설치 + 동작 검증

**Files:** (검증만 — 새 파일 없음)

- [ ] **Step 1: 전체 테스트 회귀 확인**

Run: `npm test`
Expected: 모든 테스트 통과(45 pass / 0 fail) — 스킬은 마크다운이라 테스트 수 불변.

- [ ] **Step 2: Codex 재설치**

```bash
codex plugin remove personal@personal
codex plugin add personal@personal
```
Expected: `Added plugin 'personal' ...`. 캐시(`~/.codex/plugins/cache/personal/personal/local/skills/`)에 갱신된 design-brand-kit·design-page-image SKILL.md가 포함됨.

- [ ] **Step 3: 스킬 로드 스모크 체크**

Run:
```bash
codex exec --skip-git-repo-check "사용 가능한 스킬 중 design으로 시작하는 이름만 한 줄에 하나씩 출력해."
```
Expected: `design-brand-kit`, `design-html-prototype`, `design-md-compiler`, `design-page-image` 4개가 보임.

- [ ] **Step 4: 동작 확인 (사람이 인터랙티브로)**

`codex exec`는 비대화형이라 협업 루프 전체를 자동 검증하기 어렵다. 사람이 임시 프로젝트 폴더에서 Codex로 `design-brand-kit`을 호출해 다음을 확인한다:
- 먼저 `BRAND_KIT.md`/`brand-tokens.json`/`brand-briefs.md`를 쓰고,
- **로고를 한 장 먼저** 생성해 보여주고 피드백을 묻는지,
- 한 번에 한 가지 수정으로 재생성하는지,
- 확정 이미지가 `.design/generated/logo/`(로고)·`.design/generated/brand-kit/`(무드보드)에 저장되는지.
결과를 사용자에게 보고한다. (수정 필요 시 해당 스킬 Task로 돌아가 고치고 sync·커밋 반복.)

---

## Self-Review

**1. Spec coverage** (스펙 → 태스크):
- §3 협업 루프: Task1 Step6, Task2 Step2 (둘 다 "한 개씩 → 피드백 → 한 가지 수정 → 다음"). ✓
- §4 brand-kit 로고(필수)+무드보드+키비주얼: Task1 Step3·4·5·6. ✓
- §5 page-image 섹션별: Task2. ✓
- §6 image_gen 매핑/저장/use case: Task1 Step5, Task2 Step1 (`logo-brand`/`stylized-concept`/`ui-mockup`, `logo/`·`brand-kit/`·`page/`, 항목당 1회, 버전 파일명). ✓
- §2 이미지 텍스트 한계(색/타이포는 md·tokens): Task1 Step3·5. ✓
- §2 에이전트 중립(도구 없으면 드롭): Task1 Step5, Task2 Step1. ✓
- §7 다운스트림 불변: File Structure에 명시(변경 없음). ✓
- §8 로고 핸드오프(단색·깨끗한 배경): Task1 Step5. ✓
- §9 sync 번들 재생성: Task1 Step8, Task2 Step4. ✓
- §10 design-logo/ui-kit 범위 밖: 태스크에 미포함. ✓

**2. Placeholder scan:** SKILL.md 본문의 `### 이미지 생성 Prompt` 등은 스킬이 채울 양식(브리프 템플릿)이지 계획의 빈칸이 아니다. 계획 단계엔 TODO/TBD 없음. ✓

**3. Type consistency:** 카테고리 폴더(`logo/`·`brand-kit/`·`page/`), use case 슬러그(`logo-brand`·`stylized-concept`·`ui-mockup`), 다음-스텝 포인터(`design-page-image`→`design-md-compiler`)가 태스크 전반에서 일관. brand-briefs 블록명(로고/무드보드/키 비주얼)이 흐름 진행 순서와 일치. ✓
