# design-flow 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-09/design-flow-design.md`

**Goal:** 제품의 전체 페이지 흐름(화면 간 전이)과 화면 위 일시적 오버레이(모달·시트·선택 블록)를 정의하는 신규 `design-flow` 스킬을 추가하고, `design-md-compiler`·`design-html-prototype`이 그 산출을 소비하도록 편집한다.

**Architecture:** 신규 `skills/design-flow/`(SKILL.md + references/flow-board.md)는 DESIGN.md 확정 후 실행되는 designer 소유 선택 단계다. 게이트1(노드)·게이트2(전이)를 합의해 `candidate/flow/flow-brief.md`(산문)만 쓰고, `view/flow.html`(Mermaid 보드)은 web-publisher에 위임한다. DESIGN.md엔 직접 쓰지 않는다 — `design-md-compiler`가 flow-brief를 새 `## 흐름` 섹션으로 컴파일하는 유일 저작자다. `design-html-prototype`은 §흐름을 읽어 오버레이를 토글 상태로 렌더한다.

**Tech Stack:** Markdown(SKILL.md prose) · Mermaid(런타임 보드, web-publisher 저작) · 기존 공유 라이브 서버 `scripts/lib/serve-design.mjs`. **실행 가능 코드(.mjs) 추가 없음** — 전부 prose 스킬 저작.

**검증 방식:** 이 변경은 prose 스킬 저작이라 단위 테스트가 없다. 각 태스크는 (a) 파일 저작/편집 → (b) `Grep`으로 필수 앵커 존재 대조 → (c) 커밋. 마지막 태스크에서 `npm test`(기존 .mjs 테스트 깨짐 없음)와 `npm run sync`(Codex 번들 재생성)로 전체를 검증한다.

**커밋 주의:** 이 repo는 CLAUDE.md상 git 실행 전 사용자 승인이 필요하다. 각 커밋 스텝은 `commit` 스킬을 쓰거나 사용자 승인 후 실행한다.

---

## File Structure

| 파일 | 책임 | 종류 |
|---|---|---|
| `skills/design-flow/SKILL.md` | 신규 스킬 본문 — 목적·핵심 개념·입출력·게이트1/2·flow-brief 작성 규칙·보드 위임·금지 | 생성 |
| `skills/design-flow/references/flow-board.md` | flow-brief → Mermaid 보드 변환 규칙·토큰 테마(web-publisher 스펙) | 생성 |
| `skills/design-md-compiler/SKILL.md` | 입력에 flow-brief 추가 · 신규 `## 7. 흐름` 섹션 + §7~12 재번호 · flow 게이트 안내 | 편집 |
| `skills/design-html-prototype/SKILL.md` | §흐름·노드 정의 읽어 오버레이 토글 상태 렌더 + 완전성 체크리스트 항목 | 편집 |

> Codex 번들(`plugins/personal/`)은 gitignore된 생성물 — 직접 만들지 않고 마지막 태스크의 `npm run sync`가 재생성한다.

---

## Task 1: 신규 `design-flow` 스킬 본문 저작

**Files:**
- Create: `skills/design-flow/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

아래 내용을 그대로 `skills/design-flow/SKILL.md`에 쓴다.

````markdown
---
name: design-flow
description: 확정된 DESIGN.md를 시드로 제품의 전체 페이지 흐름(화면 간 전이)과 화면 위 일시적 오버레이(모달·시트·드롭다운·선택 블록)를 정의하는 designer 소유의 선택 다운스트림 단계. 화면 컴프(design-image-web/mobile)가 노드의 생김새라면 이 스킬은 노드 사이 연결과 화면 위 상태를 채운다. 게이트1에서 노드(화면+오버레이↔ui-kit 컴포넌트)를, 게이트2에서 전이(트리거·to·조건)·여정을 합의해 candidate/flow/flow-brief.md(산문)로 적고, view/flow.html(Mermaid 보드)은 web-publisher에 위임한다. DESIGN.md엔 직접 쓰지 않는다 — design-md-compiler가 flow-brief를 §흐름으로 컴파일한다. image-gen·OPENAI_API_KEY 불필요.
---

# Design Flow

당신은 확정된 디자인 시스템 위에서 제품의 화면들이 어떻게 이어지고 화면 위에 무엇이 뜨는지를 정의하는 흐름 설계자다.

## 목적 / 위치

이 스킬은 designer 핵심 파이프라인(`design-md-compiler`)이 끝난 뒤 실행되는 **선택 다운스트림**이다. DESIGN.md가 확정되면 "제품 전체 흐름 보드를 만들까요?"로 제안하고 사용자 동의 시 실행한다.

지금까지 `design-image-web`/`design-image-mobile`은 화면을 한 장씩 따로 그렸다 — 화면들이 *어떻게 이어지는지*(전이), 화면 *위에 무엇이 뜨는지*(오버레이)는 어디에도 없었다. 이 스킬이 그 **빠진 연결**을 채운다. 화면 그림(노드)은 이미 있고, 거기에 엣지를 얹는다.

산출은 두 가지다: `flow-brief.md`(산문 로그 — `design-md-compiler`가 읽어 DESIGN.md §흐름으로 컴파일)와 `view/flow.html`(Mermaid 보드 — 사람이 봄, web-publisher가 저작). **DESIGN.md엔 직접 쓰지 않는다**(단일 저작자는 md-compiler).

모든 소통은 한국어로 한다.

## 핵심 개념

- **screen(화면)** — 라우트가 있는 풀페이지. 노드 식별자 = 화면 slug(예: `대시보드`).
- **surface(오버레이)** — 화면 위에 뜨는 일시적 표면(모달·시트·드롭다운·선택 블록·팝오버·토스트). 생김새는 ui-kit 컴포넌트에서 온다. 식별자 = `종류:이름`(종류 = `modal`·`sheet`·`dropdown`·`block`·`popover`·`toast`), 호스트 한정 시 `화면#종류:이름`.
- **edge(전이)** — `from` 노드 → `트리거` → `to` 노드, 선택적 `조건`.
- **journey(여정)** — 멀티스텝 흐름을 사람이 읽기 쉽게 묶은 엣지 체인.

**핵심 의미 규칙 — 전체를 떠받친다:**

> 엣지의 `to`가 **`화면`**이면 = 라우트 이동(navigate). **`화면#상태`**면 = 오버레이 열기(라우트 유지).

이 한 규칙이 "페이지 흐름"과 "모달·선택 블록"을 *하나의 메커니즘*으로 합친다. 코드 단(`design-component-export-react` §6.5 오버레이 provider)에서 `router 이동` vs `provider.open`으로 갈린다. 오버레이 생김새는 ui-kit 컴포넌트 참조이므로 **이미지로 또 그리지 않는다**.

## 전제

- `.design/DESIGN.md`가 단일 시드다. 화면 목록·§6 페이지 섹션 규칙에서 노드를 도출한다. **화면·카피·컴포넌트를 지어내지 않는다.**
- 오버레이로 쓸 컴포넌트는 확정된 ui-kit(`components.css`·`ui-kit.html`)에서 고른다. ui-kit에 없는 컴포넌트가 필요하면 `design-ui-kit`로 먼저 추가하도록 안내한다.
- 이미지 생성을 하지 않는다(`OPENAI_API_KEY` 불필요).

## 입력 파일 (cwd 기준, 있는 것만 읽는다)

- `.design/DESIGN.md` — 화면 목록 / §6 페이지 섹션 규칙 (흐름 노드 출처)
- `.design/assets/css/components.css` (+ `parts/*.css`) — 오버레이로 쓸 컴포넌트 후보(Modal·Sheet·AlertDialog 등)
- `.design/view/ui-kit.html` — 컴포넌트 마크업·분류 참조
- `.design/assets/css/tokens.css` — 보드 스타일 토큰
- `.design/reference/page/*` — 노드 라벨 참고용(스타일 A라 썸네일은 박지 않음)

## 출력 파일 (cwd 기준 레이아웃)

```
.design/
  candidate/flow/
    flow-brief.md     # 산문 로그 (design-md-compiler가 읽음)
  view/
    flow.html         # Mermaid 보드 (web-publisher 저작, 라이브 프리뷰)
```

## 흐름 (게이트 루프)

### Phase 0 — DESIGN.md 부재 폴백 (시작 시 필수)

1. `.design/DESIGN.md` 있음 → 시드로 사용, 게이트1로.
2. 없음 → "기존 `design.md`·디자인 문서가 있으면 주세요" 요청.
3. 그마저 없음 → `.design/` 진도 감지: `tokens.css`·`components.css`·`BRAND_KIT.md`는 있는데 `DESIGN.md`만 없으면 "`design-md-compiler`를 먼저 돌리세요"; `BRAND_KIT.md`까지만 있으면 ui-kit→md-compiler 순서 추천; 아무 진도 없으면 `design-brand-kit` 권유.

### 게이트1 — 노드 확정

1. DESIGN.md에서 화면 목록을 도출해 제시한다(슬러그 — 한국어 요청이면 영문 슬러그 제안 가능).
2. 화면별로 그 위에 뜨는 **오버레이를 열거·합의**한다. 각 오버레이마다: 식별자(`종류:이름`), ui-kit 컴포넌트(`components.css`의 실제 class에서 고름), 내용 요약, 트리거.
3. ui-kit에 없는 컴포넌트가 필요하면 `design-ui-kit`를 먼저 돌리도록 안내한다(여기서 컴포넌트를 창작하지 않음).
4. 확정 전 산출 0.

### 게이트2 — 전이 합의

1. 노드 사이 전이를 합의한다: `from`·`트리거`·`to`·`조건`. `to`가 화면이면 navigate, `화면#상태`면 오버레이 열기.
2. 한 트리거가 조건에 따라 갈라지면 행을 2개로 둔다(예: 로그인 여부).
3. 멀티스텝 흐름은 **여정**으로 묶어 가독성을 준다.
4. 확정 전 산출 0.

### 산출

1. `candidate/flow/flow-brief.md`를 산문으로 저작한다(아래 작성 규칙). design-flow가 직접 쓴다.
2. `view/flow.html`(Mermaid 보드)은 **web-publisher 서브에이전트에 위임**한다(아래 "보드 산출 위임"). flow-brief의 노드·전이를 스펙으로 넘기고 `references/flow-board.md`를 변환 규칙으로 첨부한다.

### 검수

- 공유 라이브 서버로 보드를 보여준다(최초 1회 사용자 확인 후 기동). 고칠 게 있으면 flow-brief·보드를 갱신한다.

### 종료 안내

- "`design-md-compiler`를 재실행하면 flow-brief가 DESIGN.md `## 흐름` 섹션으로 컴파일됩니다."
- 다운스트림: `design-html-prototype`(오버레이 토글 렌더)·`design-component-export-react`(§6.5 provider)·`check-customer-ux`(여정 경로 재생)가 §흐름을 소비함을 알린다.

## flow-brief.md 작성 규칙

`design-md-compiler`가 파싱하기 쉽게 산문 + 표로 적는다. 권위는 DESIGN.md다(노드 이름·카피는 DESIGN.md에서 옮긴다).

- **노드**: 화면 목록 + 화면별 오버레이를 정의(식별자·ui-kit 컴포넌트·내용·트리거).
- **전이**: `from`·`트리거`·`to`·`조건` 표.
- **여정**: 이름 + 엣지 순서.
- 지어낸 화면·카피·컴포넌트 금지. ui-kit에 없는 컴포넌트 참조 금지.

예시(프로젝트 관리 SaaS):

```
## 화면
- 랜딩 (/) · 가입 (/signup) · 대시보드 (/app)

## 오버레이
- 대시보드#block:플랜선택 — 폼 진입 전 플랜 3종 택1. ui-kit `Sheet`. 트리거: "새 프로젝트".
- 대시보드#modal:프로젝트폼 — 새 프로젝트 입력 폼. ui-kit `Modal`. 트리거: 플랜 택1.
- 대시보드#modal:삭제확인 — 위험 작업 확인. ui-kit `AlertDialog`. 트리거: 항목 "삭제".

## 전이
| from                      | 트리거          | to                        | 조건     |
| ------------------------- | --------------- | ------------------------- | -------- |
| 랜딩                      | CTA "시작하기"  | 가입                      | 비로그인 |
| 랜딩                      | CTA "시작하기"  | 대시보드                  | 로그인됨 |
| 가입                      | 폼 제출 성공    | 대시보드                  | —        |
| 대시보드                  | "새 프로젝트"   | 대시보드#block:플랜선택   | —        |
| 대시보드#block:플랜선택   | 플랜 택1 + 다음 | 대시보드#modal:프로젝트폼 | —        |
| 대시보드#modal:프로젝트폼 | 생성 완료       | 대시보드                  | —        |
| 대시보드                  | 항목 "삭제"     | 대시보드#modal:삭제확인   | —        |

## 여정
- 온보딩: 랜딩 → 가입 → 대시보드
- 프로젝트 생성: 대시보드 → #block:플랜선택 → #modal:프로젝트폼 → 대시보드
```

## 보드 산출 위임 (web-publisher)

`flow.html` 저작과 레이아웃 QA는 **web-publisher 서브에이전트**가 한다. 이 스킬에서 직접 저작하지 않는다.

- 변환 규칙·Mermaid 매핑·토큰 테마는 `references/flow-board.md`를 스펙으로 넘긴다.
- web-publisher를 부를 도구가 없으면(서브에이전트로 실행 중) 보드를 직접 만들지 말고 스펙을 메인 세션에 넘긴다.

## 라이브 프리뷰

보드를 처음 제시할 때 공유 라이브 서버를 **사용자 확인 후 1회 백그라운드로** 기동한다:

```bash
node ../../scripts/lib/serve-design.mjs <cwd>/.design
```

직접 URL: `http://localhost:5500/view/flow.html`. lock·세션 종료 시 서버를 종료한다.

## 금지 사항

- DESIGN.md를 직접 수정하지 않는다(→ `flow-brief.md`, md-compiler가 컴파일).
- 화면·카피·컴포넌트를 지어내지 않는다(DESIGN.md·ui-kit이 권위).
- 오버레이를 이미지로 생성하지 않는다(생김새 = ui-kit 컴포넌트).
- ui-kit에 없는 컴포넌트를 흐름에서 참조하지 않는다(`design-ui-kit`로 먼저 추가).
- 보드 HTML을 이 스킬에서 직접 저작하지 않는다(→ web-publisher).
````

- [ ] **Step 2: 필수 앵커 검증**

Run: `rg -n "name: design-flow|핵심 의미 규칙|게이트1 — 노드 확정|게이트2 — 전이 합의|flow-brief.md 작성 규칙|보드 산출 위임" skills/design-flow/SKILL.md`
Expected: 6개 앵커 모두 매치.

- [ ] **Step 3: 커밋** (`commit` 스킬 또는 승인 후)

```bash
git add skills/design-flow/SKILL.md
git commit -m "feat(design-flow): 페이지 흐름·오버레이 정의 스킬 본문 추가"
```

---

## Task 2: `design-flow` 보드 변환 레퍼런스 저작

**Files:**
- Create: `skills/design-flow/references/flow-board.md`

- [ ] **Step 1: references/flow-board.md 작성**

아래 내용을 그대로 쓴다.

````markdown
# Flow Board (flow.html) — Mermaid 변환 규칙

`design-flow`가 web-publisher에 넘기는 보드 스펙. `flow-brief.md`의 노드·전이를 Mermaid flowchart로 렌더하는 규칙이다. **"문서가 진실, 보드는 파생"** — 표가 바뀌면 보드를 다시 생성한다.

## 산출

- 경로: `.design/view/flow.html`
- 단일 HTML. Mermaid를 CDN으로 로드해 클라이언트에서 렌더. `../assets/css/tokens.css`를 링크해 테마 변수를 가져온다.

## flow-brief → Mermaid 매핑

- `flowchart TD`(세로) 또는 `LR`(가로) 한 장.
- **screen 노드** = 사각형 `id["라벨"]`. **surface 노드** = 라운드 형태 `id(["라벨"])`로 구분.
- surface는 호스트 화면의 `subgraph`로 묶어 "화면 위"임을 시각화한다.
- **navigate 엣지**(`to`=화면) = 실선 `A -->|트리거| B`.
- **overlay-open 엣지**(`to`=화면#상태) = 점선 `A -.->|트리거| B`.
- 조건이 있으면 라벨에 덧붙인다: `|트리거 · 조건|`.

## 토큰 테마

- Mermaid `%%{init}%%` 디렉티브의 `themeVariables` 또는 노드 `classDef`를 `tokens.css` 값으로 맞춘다: 노드 배경·테두리·폰트는 `--color-*`, radius는 `--radius-*`.
- `screen` classDef = 실선 테두리·표면색. `surface` classDef = 점선 테두리·틴트색.
- 완벽한 브랜드 일관성은 어렵다(Mermaid 한계) — 색·폰트·테두리 수준에서 맞추고, 안 되는 항목은 보드 상단 주석으로 남긴다.

## QA

- 모든 flow-brief 노드·엣지가 보드에 1:1로 있는지 대조한다(누락 = 미충족).
- 라벨이 잘리거나 화살표가 겹쳐 읽기 어려운지 `web-publisher-qa`로 스크린샷 점검.
````

- [ ] **Step 2: 필수 앵커 검증**

Run: `rg -n "flowchart TD|navigate 엣지|overlay-open 엣지|classDef" skills/design-flow/references/flow-board.md`
Expected: 4개 앵커 모두 매치.

- [ ] **Step 3: 커밋**

```bash
git add skills/design-flow/references/flow-board.md
git commit -m "feat(design-flow): Mermaid 보드 변환 레퍼런스 추가"
```

---

## Task 3: `design-md-compiler`에 flow-brief 입력 + `## 흐름` 섹션 컴파일

`design-md-compiler/SKILL.md`를 3곳 편집한다. 정확한 `old → new` 문자열을 그대로 적용한다.

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: 입력 목록에 flow-brief 추가**

찾기:
```
- `.design/candidate/page/page-briefs.md`
```
바꾸기:
```
- `.design/candidate/page/page-briefs.md`
- `.design/candidate/flow/flow-brief.md` (있으면 — §흐름·오버레이 노드 정의의 출처; `design-flow` 산출)
```

- [ ] **Step 2: `## 6. 페이지 섹션 규칙` 다음에 `## 7. 흐름` 섹션 삽입**

찾기:
```
## 6. 페이지 섹션 규칙
### Hero / Problem / Product Mechanism / Feature Grid / Dashboard·Evidence / CTA·Footer

## 7. Responsive Behavior
```
바꾸기:
```
## 6. 페이지 섹션 규칙
### Hero / Problem / Product Mechanism / Feature Grid / Dashboard·Evidence / CTA·Footer

## 7. 흐름 (flow)
`candidate/flow/flow-brief.md`(있으면)를 컴파일한다. 없으면 이 섹션을 생략하고 §13에 표시한다.
### 노드
- screen: 화면 slug 목록(라우트 있으면 함께).
- surface: `화면#종류:이름` + ui-kit 컴포넌트 + 내용 + 트리거. **오버레이 정의는 여기 한 곳**에 둔다(생김새는 §5 ui-kit 컴포넌트 참조).
### 전이
`from`·`트리거`·`to`·`조건` 표. **`to`가 화면이면 navigate(라우트 이동), `화면#상태`면 오버레이 열기(라우트 유지)** — 이 구분이 코드 단의 router 이동 vs §6.5 오버레이 provider.open을 가른다.
### 여정
멀티스텝 흐름을 엣지 체인으로 묶어 가독성을 준다(예: 온보딩 = 랜딩 → 가입 → 대시보드).
> flow-brief가 권위. 노드 이름·트리거 카피는 flow-brief에서 옮기고 지어내지 않는다.

## 8. Responsive Behavior
```

- [ ] **Step 3: 나머지 섹션 헤딩 재번호 (§8→§9 … §12→§13)**

아래 4개 헤딩을 순서대로 바꾼다(§7 Responsive는 Step 2에서 이미 §8로 바뀜).

찾기 `## 8. 이미지 에셋 사용 규칙` → 바꾸기 `## 9. 이미지 에셋 사용 규칙`
찾기 `## 9. Do's & Don'ts` → 바꾸기 `## 10. Do's & Don'ts`
찾기 `## 10. 구현 제약` → 바꾸기 `## 11. 구현 제약`
찾기 `## 11. Anti-slop checklist` → 바꾸기 `## 12. Anti-slop checklist`
찾기 `## 12. Provenance & Known Gaps` → 바꾸기 `## 13. Provenance & Known Gaps`

- [ ] **Step 4: 본문 내 §-교차참조 갱신**

DESIGN.md 섹션을 가리키는 참조만 바꾼다. **BRAND_KIT의 §7/§8/§10 참조(D3 줄의 "BRAND_KIT §10")는 건드리지 않는다.**

찾기 `breakpoints:   # (--bp-* 있으면 — 없으면 생략 + §12에 표시)`
바꾸기 `breakpoints:   # (--bp-* 있으면 — 없으면 생략 + §13에 표시)`

찾기 `breakpoint 표·터치타깃·collapsing 전략. (breakpoint 토큰 없으면 "고정폭 데스크톱 전용"으로 적고 §12에 표시)`
바꾸기 `breakpoint 표·터치타깃·collapsing 전략. (breakpoint 토큰 없으면 "고정폭 데스크톱 전용"으로 적고 §13에 표시)`

찾기 `없으면 BRAND_KIT §10·이미지에서 추론(폴백)하되 §12에 폴백임을 표시.`
바꾸기 `없으면 BRAND_KIT §10·이미지에서 추론(폴백)하되 §13에 폴백임을 표시.`

찾기 `근거 얇은 항목은 얇은 채로 두고 §12에 "근거 부족" 표시.`
바꾸기 `근거 얇은 항목은 얇은 채로 두고 §13에 "근거 부족" 표시.`

찾기 `breakpoint 토큰 없음 → "반응형이 필요하면 `design-brand-kit`에서 폼팩터를 정하고 다시 시도하세요" 안내. 진행 시 §7은 "고정폭 데스크톱 전용".`
바꾸기 `breakpoint 토큰 없음 → "반응형이 필요하면 `design-brand-kit`에서 폼팩터를 정하고 다시 시도하세요" 안내. 진행 시 §8은 "고정폭 데스크톱 전용".`

찾기 `page-briefs.md`/page 이미지 없음 → §6은 가능한 범위만, 누락은 §12.`
바꾸기 `page-briefs.md`/page 이미지 없음 → §6은 가능한 범위만, 누락은 §13.`

- [ ] **Step 5: 흐름(리뷰 게이트)에 flow-brief 안내 추가**

찾기:
```
   - `page-briefs.md`/page 이미지 없음 → §6은 가능한 범위만, 누락은 §13.
```
바꾸기:
```
   - `page-briefs.md`/page 이미지 없음 → §6은 가능한 범위만, 누락은 §13.
   - `candidate/flow/flow-brief.md` 없음 → §7 흐름을 생략하고 §13에 "흐름 미정의 — `design-flow` 필요"를 적는다. 있으면 노드·전이·여정을 §7로 컴파일한다.
```

- [ ] **Step 6: 검증 — 재번호·교차참조 일관성**

Run: `rg -n "^## [0-9]+\. " skills/design-md-compiler/SKILL.md`
Expected: §1~§13이 빠짐·중복 없이 순서대로(§7 흐름 포함).

Run: `rg -n "§12" skills/design-md-compiler/SKILL.md`
Expected: 매치 없음(모든 DESIGN.md §12 참조가 §13으로 갱신됨).

Run: `rg -n "흐름 \(flow\)|flow-brief|to.*화면#상태" skills/design-md-compiler/SKILL.md`
Expected: 흐름 섹션·입력·의미 규칙 앵커 매치.

- [ ] **Step 7: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "feat(design-md-compiler): flow-brief를 §7 흐름 섹션으로 컴파일"
```

---

## Task 4: `design-html-prototype`에 오버레이 토글 렌더 추가

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 입력에 §흐름 읽기 추가**

찾기:
```
- `.design/DESIGN.md`
- `.design/reference/brand-tokens.json`
```
바꾸기:
```
- `.design/DESIGN.md` (§흐름·노드 정의 포함 시 오버레이 상태를 읽는다)
- `.design/reference/brand-tokens.json`
```

- [ ] **Step 2: `## 섹션 구조` 다음에 오버레이 렌더 절 삽입**

찾기:
```
## 페이지 수준 목표
```
바꾸기:
```
## 오버레이 상태 (DESIGN.md §흐름이 있으면)

DESIGN.md에 `## 흐름` 섹션이 있으면, 그 화면의 surface(`화면#종류:이름`)를 **토글 가능한 오버레이 상태**로 렌더한다 — 모달·시트·선택 블록이 열린 모습을 사람이 미리볼 수 있게.

- 각 surface는 §흐름 노드 정의가 가리키는 **ui-kit 컴포넌트를 재사용**해 렌더한다(인라인 재저작 금지). 생김새 권위는 `components.css`다.
- 호스트 화면 위에 오버레이를 띄우고, 작은 상태 스위처(버튼군)나 `?state=종류:이름` 쿼리로 default ↔ 각 surface를 전환할 수 있게 한다.
- 트리거(예: "새 프로젝트")는 §흐름 전이 표에서 가져온다 — 그 버튼이 해당 오버레이를 연다.

## 페이지 수준 목표
```

- [ ] **Step 3: 완전성 체크리스트에 surface 항목 추가**

찾기:
```
  - **핵심 요소** — 그 화면에 반드시 있어야 하는 인터랙티브·구조 요소(CTA 버튼·내비 링크·플랜 카드 N개·폼 필드 등).
```
바꾸기:
```
  - **핵심 요소** — 그 화면에 반드시 있어야 하는 인터랙티브·구조 요소(CTA 버튼·내비 링크·플랜 카드 N개·폼 필드 등).
  - **오버레이 상태** — DESIGN.md §흐름이 정의한 그 화면의 surface가 각각 토글로 존재하는가(모달·시트·선택 블록이 present-but-missing이면 미충족으로 드러난다).
```

- [ ] **Step 4: 검증**

Run: `rg -n "오버레이 상태|화면#종류:이름|토글 가능한 오버레이|ui-kit 컴포넌트를 재사용" skills/design-html-prototype/SKILL.md`
Expected: 오버레이 절·체크리스트 앵커 매치.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): §흐름 오버레이를 토글 상태로 렌더"
```

---

## Task 5: 전체 검증 — sync + 기존 테스트

**Files:** (없음 — 검증 전용)

- [ ] **Step 1: 기존 .mjs 테스트 깨짐 없음 확인**

Run: `npm test`
Expected: 전체 PASS(이번 변경은 .mjs를 건드리지 않았으므로 기존 그린 유지).

- [ ] **Step 2: Codex 번들·에이전트 재생성**

Run: `npm run sync`
Expected: 성공 종료. `plugins/personal/skills/design-flow/`가 새로 생성됨(gitignore된 로컬 생성물 — 커밋하지 않음).

- [ ] **Step 3: 번들에 design-flow 반영 확인**

Run: `rg -n "name: design-flow" plugins/personal/skills/design-flow/SKILL.md`
Expected: 매치(Codex 번들이 신규 스킬을 포함).

- [ ] **Step 4: git 상태 확인 — 생성물 누출 없음**

Run: `git status --porcelain`
Expected: `plugins/personal/`·`codex-agents/` 등 gitignore 생성물이 스테이징/추적되지 않음. 커밋 대상은 `skills/` 소스뿐.

- [ ] **Step 5: 세션 갱신 안내**

구현 완료 후 사용자에게: Claude는 `/reload-plugins`, Codex는 `npm run codex:reinstall`로 신규 `design-flow`를 반영하라고 안내한다.

---

## 완료 기준

- `skills/design-flow/SKILL.md` + `references/flow-board.md`가 존재하고 필수 앵커를 모두 포함한다.
- `design-md-compiler`가 §1~§13 순서로 재번호되고 flow-brief 입력·§7 흐름 컴파일·게이트 안내를 포함한다.
- `design-html-prototype`가 오버레이 토글 렌더·완전성 체크리스트 항목을 포함한다.
- `npm test` 그린, `npm run sync` 성공, gitignore 생성물 누출 없음.
- (범위 밖) 실제 `flow.html` Mermaid 렌더 품질·`design-generate-code` 라우팅 wiring은 별도 단계에서 검증한다(spec §9·§12).
