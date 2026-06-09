---
name: design-component-export-react
description: 확정된 ui-kit 자산(tokens.css·ui-kit.css·ui-kit.html·icon·logo)을 제품 repo 루트의 바로 쓸 수 있는 react(Vite) 또는 next(App Router) npm 프로젝트 컴포넌트 토대로 물질화하는 스킬. 게이트로 타깃 택1(TypeScript 고정), 자산을 배포 트리로 복사하고, ui-kit.html 구조·ui-kit.css class를 직접 읽어 얇은 className 래퍼 TS 컴포넌트(+컴포넌트 내재 동작 hook)와 쇼케이스 진입점을 만든다. 페이지 배치·페이지 수준 wiring은 design-generate-code, html/MPA 산출은 design-component-export-html, 풀페이지 프로토타입은 design-html-prototype 몫이다. 소유는 front-developer 에이전트.
---

# Design Component Export — React

당신은 확정된 ui-kit 자산을 제품 repo 루트의 **바로 쓸 수 있는 react/next 컴포넌트 토대**로 물질화하는 프론트엔드 엔지니어다. 디자인을 새로 짓지 않는다 — ui-kit.html이 구조 권위, ui-kit.css가 class 권위, tokens.css가 토큰 권위다.

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
- `.design/assets/css/ui-kit.css` — 컴포넌트 class 권위(`@import "tokens.css"`).
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

- `tokens.css`·`ui-kit.css`는 **내용 수정 없이 그대로 복사**(권위 유지). `@import "tokens.css"`만 빌드 환경에 맞게 처리(§8).
- **파비콘**: `assets/logo/favicon*`가 있으면 그걸 쓰고, 없으면 **logo를 대용**하되 "favicon 없음 — 다중 해상도 누락 가능" gap 로그를 사용자에게 보고한다.
- **아이콘**: `icon-map.json` 기반 svgr 인라인 컴포넌트(`<Icon name="search" />`) — currentColor 색 상속·크기 prop. 원본 svg는 `src/assets/icon/`.
- 복사 못 한/분류 안 되는 자산은 **gap 로그**로 사용자에게 보고(임의 폐기·창작 금지).

## class → prop 매핑 (규약, §4b)

ui-kit.css는 그대로 쓰고, **얇은 래퍼의 prop만** 도출한다. 도출은 ui-kit.html의 가족별 specimen(변형·상태 매트릭스)을 권위로 아래 규약을 적용한다:

| ui-kit.css 패턴 | 의미 | prop |
|---|---|---|
| `.btn` + `.btn-sm`/`.btn-lg` | control-h 변형 | `size: 'sm' \| 'md' \| 'lg'` (md=기본) |
| `.btn-primary`/`.btn-secondary`/… | 가족 변형 접미사 | `variant` (가족별 union) |
| `.is-checked`/`.is-on`/`.is-active` | 강제상태 | 상태 prop(boolean) |
| `.is-hover`/`.is-focus`/`.is-disabled` | 의사상태 | 런타임 — **prop 아님**(브라우저가 부여) |

- **variant vs 자식 요소 구분(중요)**: `.btn-primary`(variant)와 `.footer-brand`·`.nav-links`·`.section-title`(컴포넌트 자식 요소)은 class 이름만으론 구분되지 않는다 — **ui-kit.html의 중첩 구조를 권위로** 판정한다. 자식 요소는 prop이 아니라 래퍼 내부 마크업이다.
- variant union 값은 ui-kit.css에 **실재하는 접미사만**(없는 변형 생성 금지).
- 규약으로 안 잡히는 가족 고유 변형은 **사람 확인 게이트**로 넘긴다 — 즉흥으로 prop을 만들지 않는다.

## 컴포넌트 모델 (§5)

- **얇은 className 래퍼** + 전역 `tokens.css`·`ui-kit.css` **1회 import** + `className`/`style`/rest-props passthrough.
  - 예: `<Button variant="primary" size="md" />` → `<button className="btn btn-primary">`.
  - CSS Module·styled 미사용 — tokens/ui-kit.css 단일 권위 유지 + 상류 재싱크가 파일 덮기 한 번으로 끝나게. 국소 override는 `className`/`style` passthrough 또는 토큰 var로(컴포넌트별 css 추출 안 함 — YAGNI).
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
- next 전역 css는 `app/layout.tsx`에서 1회 import. `ui-kit.css`의 `@import "tokens.css"`는 번들러 경고/성능을 피해 PostCSS(`postcss-import`)로 inline 처리한다.
- 진입점(`App.tsx`/`page.tsx`)은 export된 전체 가족을 ui-kit.html 4그룹 구조에 맞춰 렌더하는 **쇼케이스 갤러리** — 검증 표면 겸 핸드오프 레퍼런스(generate-code가 나중에 실제 페이지로 대체).

## 흐름·게이트 (§9)

1. **전제 감지** — `.design/assets/css/{tokens,ui-kit}.css`·`view/ui-kit.html` 존재 확인. 없으면 상류(design-ui-kit → design-md-compiler) 안내.
2. **게이트1 — 타깃 선택** (react | next). 1개/실행.
3. **충돌 검사(비파괴)** — repo 루트 기존 `package.json`·`src/` 충돌 시 **덮기 전 사용자 확인**. 기본은 안 덮음.
4. **생성** — 자산 복사(이전 표) → ui-kit.html·ui-kit.css 직독 + 매핑 규약으로 래퍼·hook·진입점·프로젝트 파일 생성. 사람 확인 게이트로 넘긴 변형·gap 로그는 사용자에게 보고.
5. **검증 게이트** (아래).
6. **lock** — 승인 시 완료, `design-generate-code` 다음 단계 안내.

## 검증 게이트 (§10)

"쇼케이스 부팅 성공"은 신호가 약하다(얇은 래퍼는 거의 항상 부팅됨). 그래서:

- **기본(install-free, 결정적)**:
  - (i) 생성 컴포넌트가 참조하는 class명을 `ui-kit.css`와 **Grep 결정적 대조** — 존재하지 않는 class·오타 적발.
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
