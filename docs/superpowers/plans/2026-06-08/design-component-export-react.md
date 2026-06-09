# design-component-export-react 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-08/design-component-export-react-design.md`

**Goal:** 확정된 ui-kit 자산을 제품 repo 루트의 바로 쓸 수 있는 react(Vite) 또는 next(App Router) 컴포넌트 토대로 물질화하는 `design-component-export-react` 스킬을 작성한다.

**Architecture:** 이 스킬은 **산문 지시문**이다(파서·이전 도구 mjs 없음). ui-kit 자산은 권위이므로 `tokens.css`·`components.css`는 내용 수정 없이 복사하고, 얇은 래퍼의 prop은 **ui-kit.html(구조 권위)·components.css(class 권위)를 LLM이 직접 읽어** 매핑 규약으로 도출한다. class를 정규식으로 추출하는 도구는 두지 않는다 — `.btn-primary`(variant)와 `.footer-brand`(자식 요소)는 이름만으론 구분되지 않아 ui-kit.html 구조를 봐야 하고, 그건 래퍼 저작 LLM이 어차피 하는 일이다. `scripts/lib`는 이 repo에서 LLM이 못 하는 것(이미지 합성·네트워크·브라우저·SVG 정규화)만 두는 자리라 여기 해당 없음. 작업은 SKILL.md 작성 + placeholder·에이전트·README 참조 갱신 + `npm run sync`다.

**Tech Stack:** 스킬 산출 대상은 TypeScript + React(Vite `@vitejs/plugin-react`) / Next(App Router). 스킬 본문은 마크다운 산문.

---

## File Structure

- **Create** `skills/design-component-export-react/SKILL.md` — 스킬 본문(§1–§14를 운영 지시문으로). class→prop 매핑은 산문 테이블, 자산 이전은 복사 규칙 테이블.
- **Delete** `skills/design-component-export/SKILL.md`(+ 빈 디렉터리) — placeholder 대체.
- **Modify** `agents/front-developer.md` — 소유 스킬 목록을 `-react`(구현)/`-html`(예정)로 갱신.
- **Modify** `docs/design/README.md` — 파이프라인 다이어그램·표 행 갱신.
- **Regenerate** `npm run sync` → `plugins/personal/`·`codex-agents/`(gitignore된 로컬 생성물, 커밋 안 함).

신규 mjs·테스트 없음 — 다른 design-* 스킬과 동일하게 산문 + 권위 파일 직독 방식.

---

## Task 1: SKILL.md 작성 + placeholder 대체

**Files:**
- Create: `skills/design-component-export-react/SKILL.md`
- Delete: `skills/design-component-export/SKILL.md`(+ 빈 디렉터리)

- [ ] **Step 1: SKILL.md 작성**

`skills/design-component-export-react/SKILL.md` 전문:

````markdown
---
name: design-component-export-react
description: 확정된 ui-kit 자산(tokens.css·components.css·ui-kit.html·icon·logo)을 제품 repo 루트의 바로 쓸 수 있는 react(Vite) 또는 next(App Router) npm 프로젝트 컴포넌트 토대로 물질화하는 스킬. 게이트로 타깃 택1(TypeScript 고정), 자산을 배포 트리로 복사하고, ui-kit.html 구조·components.css class를 직접 읽어 얇은 className 래퍼 TS 컴포넌트(+컴포넌트 내재 동작 hook)와 쇼케이스 진입점을 만든다. 페이지 배치·페이지 수준 wiring은 design-generate-code, html/MPA 산출은 design-component-export-html, 풀페이지 프로토타입은 design-html-prototype 몫이다. 소유는 front-developer 에이전트.
---

# Design Component Export — React

당신은 확정된 ui-kit 자산을 제품 repo 루트의 **바로 쓸 수 있는 react/next 컴포넌트 토대**로 물질화하는 프론트엔드 엔지니어다. 디자인을 새로 짓지 않는다 — ui-kit.html이 구조 권위, components.css가 class 권위, tokens.css가 토큰 권위다.

## 목적·경계 (§1)

확정된 ui-kit 자산을 react 또는 next npm 프로젝트의 컴포넌트 토대로 옮긴다.

- **한다**: npm 프로젝트 스캐폴드, 자산 root 복사·이전, ui-kit 전체 가족 → 얇은 TS 컴포넌트 래퍼(+컴포넌트 내재 동작 hook), 쇼케이스 진입점.
- **안 한다**: 실제 페이지 배치·페이지 수준 wiring(→ `design-generate-code`), 페이지 div 저작·풀페이지 프로토타입(→ `design-html-prototype`/web-publisher), html/MPA 산출(→ `design-component-export-html`), 백엔드 연결.

### 경계 원칙 — "상태를 누가 소유하는가"

컴포넌트 내재 동작과 페이지 wiring의 경계는 **컴포넌트 종류가 아니라 상태 소유자**로 긋는다.

- 컴포넌트가 자기 상태를 소유(toggle 자체 on/off, password 보이기/숨기기) → **이 스킬**(uncontrolled 기본 + 내재 hook).
- 페이지가 외부에서 상태를 제어("이 버튼이 저 모달을 연다", "이 탭을 강제로 연다") → **generate-code**(controlled prop으로 빠짐).

## 입력 파일 (대상 프로젝트 cwd `.design/` 기준, §3)

- `.design/assets/css/tokens.css` — 토큰 변수 단일 권위.
- `.design/assets/css/components.css` — 컴포넌트 class 권위(`@import "tokens.css"`).
- `.design/view/ui-kit.html` — 정규 마크업 specimen(가족·변형·상태 매트릭스). **중첩 구조·변형/상태 탐지의 권위 마크업.**
- `.design/assets/icon/*.svg` + `icon-map.json` — 아이콘(viewBox 0 0 24 24·currentColor).
- `.design/reference/brand-tokens.json` — 폰트 패밀리 원본.
- `.design/assets/logo/` — 로고·favicon 자산. (있으면) `.design/assets/content/`·`reference/brand-kit/` 이미지.

프로토타입(`.design/prototype/index.html`)은 **읽지 않는다**(generate-code 입력).

## 자산 이전 — 복사 규칙 (§4a·§7·§8)

`.design/assets/*`를 repo 루트 배포 트리로 복사하고 참조 경로를 실배포 경로로 재작성한다. 추출 도구 없이 아래 표대로 옮긴다:

| `.design/` 원본 | repo 루트 목적지 |
|---|---|
| `assets/css/*.css` | `src/assets/css/*.css` |
| `assets/icon/*.svg` + `icon-map.json` | `src/assets/icon/*` |
| `assets/logo/favicon*` | `public/favicon.*` |
| `assets/logo/*`(그 외)·`assets/content/*`·`reference/brand-kit/*` 이미지 | `public/image/*` |

- `tokens.css`·`components.css`는 **내용 수정 없이 그대로 복사**(권위 유지). `@import "tokens.css"`만 빌드 환경에 맞게 처리(§8).
- **파비콘**: `assets/logo/favicon*`가 있으면 그걸 쓰고, 없으면 **logo를 대용**하되 "favicon 없음 — 다중 해상도 누락 가능" gap 로그를 사용자에게 보고한다.
- **아이콘**: `icon-map.json` 기반 svgr 인라인 컴포넌트(`<Icon name="search" />`) — currentColor 색 상속·크기 prop. 원본 svg는 `src/assets/icon/`.
- 복사 못 한/분류 안 되는 자산은 **gap 로그**로 사용자에게 보고(임의 폐기·창작 금지).

## class → prop 매핑 (규약, §4b)

components.css는 그대로 쓰고, **얇은 래퍼의 prop만** 도출한다. 도출은 ui-kit.html의 가족별 specimen(변형·상태 매트릭스)을 권위로 아래 규약을 적용한다:

| components.css 패턴 | 의미 | prop |
|---|---|---|
| `.btn` + `.btn-sm`/`.btn-lg` | control-h 변형 | `size: 'sm' \| 'md' \| 'lg'` (md=기본) |
| `.btn-primary`/`.btn-secondary`/… | 가족 변형 접미사 | `variant` (가족별 union) |
| `.is-checked`/`.is-on`/`.is-active` | 강제상태 | 상태 prop(boolean) |
| `.is-hover`/`.is-focus`/`.is-disabled` | 의사상태 | 런타임 — **prop 아님**(브라우저가 부여) |

- **variant vs 자식 요소 구분(중요)**: `.btn-primary`(variant)와 `.footer-brand`·`.nav-links`·`.section-title`(컴포넌트 자식 요소)은 class 이름만으론 구분되지 않는다 — **ui-kit.html의 중첩 구조를 권위로** 판정한다. 자식 요소는 prop이 아니라 래퍼 내부 마크업이다.
- variant union 값은 components.css에 **실재하는 접미사만**(없는 변형 생성 금지).
- 규약으로 안 잡히는 가족 고유 변형은 **사람 확인 게이트**로 넘긴다 — 즉흥으로 prop을 만들지 않는다.

## 컴포넌트 모델 (§5)

- **얇은 className 래퍼** + 전역 `tokens.css`·`components.css` **1회 import** + `className`/`style`/rest-props passthrough.
  - 예: `<Button variant="primary" size="md" />` → `<button className="btn btn-primary">`.
  - CSS Module·styled 미사용 — tokens/components.css 단일 권위 유지 + 상류 재싱크가 파일 덮기 한 번으로 끝나게. 국소 override는 `className`/`style` passthrough 또는 토큰 var로(컴포넌트별 css 추출 안 함 — YAGNI).
- **커버리지**: ui-kit.html에 있는 재사용 가능 전체 가족(button·input·textarea·select·checkbox·radio·toggle·badge/chip·filter chip·card·alert·toast·tooltip·tag·navbar·tabs·breadcrumb·table·pagination·list·footer·section header 등). Foundations(색 스와치·타이포 스케일 등 토큰 시연)는 컴포넌트화 제외.
- **상태 컴포넌트**(checkbox·radio·toggle·tabs 등): **uncontrolled 기본 + 선택적 controlled prop**. API: `defaultChecked`(uncontrolled, 내부 state) / `checked`+`onChange`(controlled). 둘 다 받고 `checked`가 주어지면 controlled로 동작. 내재 토글은 이 스킬, 외부 제어가 필요하면 controlled로 generate-code가 wiring.

## 컴포넌트 내재 동작 hooks (§6)

- `src/hooks/`에 컴포넌트 내재 동작 hook을 저작한다. 단 **ui-kit.html에 실제 존재하는 인터랙티브 컴포넌트만** 탐지해 작성한다.
- ui-kit에 없는 컴포넌트(예: 모달이 산출물에 없으면)는 **지어내지 않는다** — export 원본이 없으면 그 동작도 없다.
- 예시(존재할 때만): password 보이기/숨기기 토글, toast dismiss, tabs 패널 전환(uncontrolled), filter chip 활성 토글.
- 페이지가 컴포넌트를 여닫는 식의 wiring은 작성하지 않는다(→ generate-code).

## 폰트 (§7)

자가호스팅 기본.

- next: `next/font/google`(빌드 시 자동 자가호스팅).
- Vite: `@fontsource/<font>`(npm). 없으면 `public/font/` 로컬 woff2 + `@font-face` 폴백.
- **재배포 불가 라이선스**·fetch 불가 시 CDN `<link>` 폴백 + gap 로그(상용 폰트 woff2 재배포 위반 방지).
- 파비콘 wiring: next=`metadata`/`app/icon`, Vite=`index.html` `<link>`.

## 스캐폴드 레이아웃 (repo 루트, §8)

```
react (Vite)                          next (App Router)
package.json                          package.json
vite.config.ts                        next.config.ts
tsconfig.json                         tsconfig.json
index.html                            (app/ 진입)
public/{image/, favicon.*}            public/{image/, favicon.*}
src/main.tsx       ← 전역 css import   src/app/layout.tsx ← next/font·전역 css·metadata
src/App.tsx        ← 쇼케이스 갤러리    src/app/page.tsx   ← 쇼케이스 갤러리
src/assets/css/{tokens,ui-kit}.css    src/assets/css/{tokens,ui-kit}.css
src/assets/icon/{*.svg, icon-map}     src/assets/icon/{*.svg, icon-map}
src/components/*.tsx ← 래퍼            src/components/*.tsx ← 래퍼
src/hooks/*.ts       ← 내재 동작       src/hooks/*.ts       ← 내재 동작
```

- `package.json`은 의존성·스크립트를 **작성**하되 **`npm install`은 자동 실행하지 않는다**(옵션·사람 확인 — 전역 CLAUDE.md "명령 전 확인").
- next 전역 css는 `app/layout.tsx`에서 1회 import. `components.css`의 `@import "tokens.css"`는 번들러 경고/성능을 피해 PostCSS(`postcss-import`)로 inline 처리한다.
- 진입점(`App.tsx`/`page.tsx`)은 export된 전체 가족을 ui-kit.html 4그룹 구조에 맞춰 렌더하는 **쇼케이스 갤러리** — 검증 표면 겸 핸드오프 레퍼런스(generate-code가 나중에 실제 페이지로 대체).

## 흐름·게이트 (§9)

1. **전제 감지** — `.design/assets/css/{tokens,ui-kit}.css`·`view/ui-kit.html` 존재 확인. 없으면 상류(design-ui-kit → design-md-compiler) 안내.
2. **게이트1 — 타깃 선택** (react | next). 1개/실행.
3. **충돌 검사(비파괴)** — repo 루트 기존 `package.json`·`src/` 충돌 시 **덮기 전 사용자 확인**. 기본은 안 덮음.
4. **생성** — 자산 복사(이전 표) → ui-kit.html·components.css 직독 + 매핑 규약으로 래퍼·hook·진입점·프로젝트 파일 생성. 사람 확인 게이트로 넘긴 변형·gap 로그는 사용자에게 보고.
5. **검증 게이트** (아래).
6. **lock** — 승인 시 완료, `design-generate-code` 다음 단계 안내.

## 검증 게이트 (§10)

"쇼케이스 부팅 성공"은 신호가 약하다(얇은 래퍼는 거의 항상 부팅됨). 그래서:

- **기본(install-free, 결정적)**:
  - (i) 생성 컴포넌트가 참조하는 class명을 `components.css`와 **Grep 결정적 대조** — 존재하지 않는 class·오타 적발.
  - (ii) 구조 완전성 — **ui-kit.html 가족 목록** 대비 생성 래퍼 누락 적발(Read/Grep).
- **옵션(사람 확인 후)**: `tsc --noEmit`, dev 서버 부팅. `npm install` 필요라 기본 아님.
- **시각 동등성**은 ui-kit.html이 이미 권위 쇼케이스 — 두 번째 쇼케이스를 픽셀 대조하지 않는다.

## 에이전트·위임 (§11)

- `front-developer`가 소유. 부를 수 있으면 디스패치, 서브에이전트로 실행 중이면 스펙을 메인 세션에 인계.
- 진입점 갤러리 레이아웃 깨짐 점검이 필요하면 `web-publisher-qa`(브라우저 스크린샷 자가 검사) 재사용.

## 비범위 (§12)

- 실제 페이지 조립·페이지 수준 wiring → `design-generate-code`.
- html/MPA(jsp/php 블록) 산출 → `design-component-export-html`.
- 페이지 div 저작·풀페이지 프로토타입 → `design-html-prototype`/web-publisher.
- 백엔드 연결 hook.
````

- [ ] **Step 2: placeholder 스킬 삭제**

```bash
git rm skills/design-component-export/SKILL.md
```

(디렉터리가 비면 git이 자동 정리한다. 남으면 `Remove-Item skills/design-component-export -Recurse -Force`.)

- [ ] **Step 3: 생성·삭제 확인**

Run: `node -e "console.log(require('fs').existsSync('skills/design-component-export-react/SKILL.md'), require('fs').existsSync('skills/design-component-export/SKILL.md'))"`
Expected: `true false`

- [ ] **Step 4: 커밋**

```bash
git add skills/design-component-export-react/SKILL.md
git commit -m "feat(component-export): design-component-export-react SKILL.md 작성 + placeholder 대체"
```

---

## Task 2: front-developer 에이전트 소유 스킬 갱신

**Files:**
- Modify: `agents/front-developer.md`

- [ ] **Step 1: frontmatter description 교체**

`agents/front-developer.md`의 frontmatter `description:` 한 줄을 다음으로 교체:

```
description: 확정된 디자인 산출물(components.css·tokens.css·DESIGN.md·프로토타입)을 대상 프로젝트의 실제 컴포넌트 세트·페이지 코드로 변환하는 프론트엔드 개발 에이전트. design-component-export-react(구현됨)를 소유하며, design-component-export-html·design-generate-code는 설계·구현 예정이라 아직 호출하지 말 것.
```

- [ ] **Step 2: 본문 갱신**

`# Front Developer (계획 중 — 미구현)` 제목과 그 아래 `> **상태: placeholder.** …` 블록을 다음으로 교체:

```markdown
# Front Developer

디자인 파이프라인의 **코드 생성** 주체. designer(디자인·이미지)·web-publisher(HTML 충실 구현 + 레이아웃 QA)와 분리되어, 확정 산출물을 실제 코드로 옮긴다.

> **상태:** `design-component-export-react`만 구현됨. `design-component-export-html`·`design-generate-code`는 설계·구현 예정 — 호출하지 말 것.
```

그리고 `## 의도 (확정 전 메모)` 아래 "소유 스킬" 목록을 다음으로 교체:

```markdown
소유 스킬:
- **design-component-export-react** *(구현됨)* — 확정 ui-kit 자산 → 대상 repo 루트의 react(Vite)/next(App Router) 컴포넌트 토대(얇은 className 래퍼 + 내재 동작 hook). designer 핵심 파이프라인 직후.
- **design-component-export-html** *(예정)* — 같은 입력 → html/MPA(jsp/php 블록). 별도 사이클 설계.
- **design-generate-code** *(예정)* — 프로토타입 + export된 컴포넌트 세트 → 대상 프로젝트의 실제 페이지·앱 코드. 다운스트림 최종.
```

마지막 줄 `설계가 시작되면 이 파일을 정식 지시문으로 대체한다.`는 삭제한다.

- [ ] **Step 3: 확인**

Run: `node -e "const t=require('fs').readFileSync('agents/front-developer.md','utf8'); console.log(t.includes('design-component-export-react'), !t.includes('placeholder'))"`
Expected: `true true`

- [ ] **Step 4: 커밋**

```bash
git add agents/front-developer.md
git commit -m "docs(agent): front-developer 소유 스킬을 component-export-react로 갱신"
```

---

## Task 3: 디자인 README 파이프라인 갱신

**Files:**
- Modify: `docs/design/README.md`

- [ ] **Step 1: 파이프라인 다이어그램 행 교체**

`docs/design/README.md`의 다운스트림 블록에서

```
   design-component-export   (front-developer · 미구현)
```

을 다음으로 교체:

```
   design-component-export-react   (front-developer)
   design-component-export-html    (front-developer · 미구현)
```

- [ ] **Step 2: 표 행 교체**

표에서 아래 행

```
| **design-component-export** *(front-developer·미구현)* | 확정 components.css·tokens.css를 대상 프로젝트 컴포넌트 세트로 export | components.css·tokens.css | (예정) 컴포넌트 세트 |
```

을 다음 두 행으로 교체:

```
| **design-component-export-react** *(front-developer)* | 확정 ui-kit 자산을 repo 루트의 react(Vite)/next(App Router) 컴포넌트 토대로 물질화(얇은 className 래퍼 + 내재 동작 hook + 쇼케이스) | tokens.css·components.css·ui-kit.html·icon·logo | repo 루트 npm 프로젝트 컴포넌트 토대 |
| **design-component-export-html** *(front-developer·미구현)* | 같은 입력 → html/MPA(jsp/php 블록) 산출 | 동일 ui-kit 자산 | (예정) html/MPA 블록 |
```

- [ ] **Step 3: 확인**

Run: `node -e "const t=require('fs').readFileSync('docs/design/README.md','utf8'); console.log(t.includes('design-component-export-react'), t.includes('design-component-export-html'))"`
Expected: `true true`

- [ ] **Step 4: 커밋**

```bash
git add docs/design/README.md
git commit -m "docs(design): README 파이프라인을 component-export-react/-html로 갱신"
```

---

## Task 4: 동기화 + 리로드

**Files:** (생성물 — 커밋 안 함) `plugins/personal/`, `codex-agents/`

- [ ] **Step 1: 동기화 (사용자 확인 후 실행 — 전역 CLAUDE.md "명령 전 확인")**

Run: `npm run sync`
Expected: 성공. `plugins/personal/skills/design-component-export-react/SKILL.md` 생성, placeholder `design-component-export` 번들 제거 확인. (생성물은 gitignore — 스테이징하지 않는다.)

- [ ] **Step 2: 스테이징 정합 확인**

Run: `git status --short`
Expected: `plugins/personal/`·`codex-agents/` 변경은 추적 목록에 없음(gitignore). 추적 변경 없음(앞 태스크에서 모두 커밋됨).

- [ ] **Step 3: (이 머신 Claude) 플러그인 리로드 안내**

세션 중 반영은 `/reload-plugins`. Codex 반영은 `npm run codex:reinstall`(사용자 확인 후).

---

## Self-Review

**1. Spec coverage:**
- §1 목적·경계 → SKILL "목적·경계". ✅
- §2 타깃 → SKILL 게이트1 + 스캐폴드(react=Vite/next=App Router, TS 고정). ✅
- §3 입력 파일 → SKILL "입력 파일". ✅
- §4(a) 자산 물질화 → SKILL "자산 이전 — 복사 규칙"(산문 표, 모듈 없음). §4(b) class→prop → SKILL "class → prop 매핑"(산문 규약 + variant/자식 구분, ui-kit.html 권위). ✅
- §5 컴포넌트 모델 → SKILL "컴포넌트 모델"(controlled/uncontrolled API 확정). ✅
- §6 내재 동작 hooks → SKILL "컴포넌트 내재 동작 hooks". ✅
- §7 자산 물질화 상세 → SKILL "자산 이전"(아이콘·파비콘) + "폰트". ✅
- §8 스캐폴드 레이아웃 → SKILL "스캐폴드 레이아웃"(`postcss-import` 확정). ✅
- §9 흐름·게이트 → SKILL "흐름·게이트". ✅
- §10 검증 게이트 → SKILL "검증 게이트"(구조 완전성=ui-kit.html 가족 목록). ✅
- §11 에이전트·위임 → SKILL "에이전트·위임" + Task 2. ✅
- §12 비범위 → SKILL "비범위". ✅
- §13 구현 시 갱신할 참조 → Task 1(placeholder 대체)·Task 2(front-developer)·Task 3(README)·Task 4(sync). **scripts/lib 모듈은 제거 결정으로 비해당** — 스펙 §4·§13도 산문 방식으로 정정. ✅
- §14 미해결: controlled/uncontrolled API → SKILL §5에서 `checked`+`onChange`/`defaultChecked`로 확정. next `@import` inline → SKILL §8 `postcss-import`. specimen→prop 잔여 비결정성 → ui-kit.html 구조 권위 + 사람 확인 게이트로 처리. ✅

**2. Placeholder scan:** SKILL.md 전문·문서 교체 문자열 모두 구체. "TBD"·"적절히 처리" 없음. ✅

**3. Type consistency:** SKILL 내 prop 명명 일관(`size`/`variant`/상태 boolean prop, controlled=`checked`+`onChange`, uncontrolled=`defaultChecked`). 자산 이전 표의 목적지 경로가 스캐폴드 레이아웃과 일치(`src/assets/...`·`public/image/...`·`public/favicon.*`). ✅
