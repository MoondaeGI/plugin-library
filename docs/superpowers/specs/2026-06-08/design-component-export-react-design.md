# design-component-export-react 설계

- **날짜**: 2026-06-08
- **소유 에이전트**: front-developer
- **파이프라인 위치**: designer 핵심 파이프라인(`design-md-compiler`) 직후, `design-generate-code` 이전 다운스트림.
- **상태**: 설계 확정(brainstorming 종료) → writing-plans 대기.

## 배경 — placeholder 분리

기존 placeholder `design-component-export`(react/next 컴포넌트 export)는 타깃별로 **두 스킬로 분리**한다. HTML/MPA 타깃과 react/next 타깃은 산출 형태(css 클래스+블록+jQuery vs TS 컴포넌트 파일+npm 프로젝트)도 검증 방식(브라우저 QA vs tsc·grep)도 다르기 때문이다.

- **`design-component-export-react`** — react(Vite) + next(App Router). **본 문서가 설계하는 스킬.**
- **`design-component-export-html`** — html/MPA(jsp/php 블록). 별도 사이클에서 설계.

bare `design-component-export`는 위 둘로 갈라지며 사라진다. react·next는 컴포넌트 표면이 거의 동일해 한 스킬에 둔다("react"는 React 패밀리 약칭).

## §1. 목적·경계

확정된 ui-kit 자산을 제품 repo 루트의 **바로 쓸 수 있는 react 또는 next npm 프로젝트 컴포넌트 토대**로 물질화한다.

- **한다**: npm 프로젝트 스캐폴드, 자산 root 이전, ui-kit 전체 가족 → 얇은 TS 컴포넌트 래퍼(+컴포넌트 내재 동작 hook), 쇼케이스 진입점.
- **안 한다**: 실제 페이지 배치·페이지 수준 wiring(→ `design-generate-code`), 페이지 div 저작(→ `design-html-prototype`/web-publisher), 백엔드 연결.
- **입력**: ui-kit 자산만. 프로토타입(`.design/prototype/index.html`)은 읽지 않는다(그건 generate-code 입력).

### 경계 원칙 — "상태를 누가 소유하는가"

컴포넌트 내재 동작과 페이지 wiring의 경계는 **컴포넌트 종류가 아니라 상태 소유자**로 긋는다.

- 컴포넌트가 자기 상태를 소유(예: toggle 자체 on/off, password 보이기/숨기기) → **이 스킬**(uncontrolled 기본 + 내재 hook).
- 페이지가 외부에서 상태를 제어(예: "이 버튼이 저 모달을 연다", "이 탭을 강제로 연다") → **generate-code**(controlled prop으로 빠짐).

## §2. 타깃 — react(Vite) | next(App Router)

- 게이트로 **택1**, 1개/실행. TypeScript 고정.
- react = Vite(+`@vitejs/plugin-react`), next = App Router. (CRA는 deprecated라 미사용.)
- 두 타깃은 컴포넌트 표면이 동일하고, 차이는 **진입점·폰트 메커니즘·라우팅·전역 css import 위치**뿐이다 → 타깃 어댑터로 얇게 처리.

## §3. 입력 파일 (대상 프로젝트 cwd `.design/` 기준)

권위 입력:

- `.design/assets/css/tokens.css` — 토큰 변수(색·폰트·radius·shadow·spacing) 단일 권위.
- `.design/assets/css/ui-kit.css` — 컴포넌트 class 권위(`@import "tokens.css"`).
- `.design/view/ui-kit.html` — 정규 마크업 specimen(가족·변형·상태 매트릭스). 컴포넌트 중첩 구조·변형/상태 탐지의 권위 마크업.
- `.design/assets/icon/*.svg` + `.design/assets/icon/icon-map.json` — 아이콘(viewBox 0 0 24 24·currentColor).
- `.design/reference/brand-tokens.json` — 폰트 패밀리(typography) 원본.
- `.design/assets/logo/` — 로고·favicon 자산.
- (있으면) `.design/assets/content/`·`reference/brand-kit/` 이미지.

## §4. 산출 규약 (타깃 무관)

품질 편차는 "결정적 스캐폴드"와 "비결정적 가족별 코드젠"이 섞일 때 생긴다. 비결정성을 줄이려고 두 가지를 **명시 규약**으로 고정한다. 단 이 규약은 파서·이전 도구(mjs)가 아니라 **SKILL 산문**이다 — ui-kit 자산이 권위이므로 LLM이 `ui-kit.html`·`ui-kit.css`를 직접 읽어 규약을 적용한다. class를 정규식으로 추출하는 도구는 두지 않는다(아래 (b) 참조: variant와 자식 요소는 이름만으론 구분되지 않아 ui-kit.html 구조를 봐야 하고, 그건 래퍼 저작 LLM이 어차피 하는 일이다). `scripts/lib`는 이 repo에서 LLM이 못 하는 것(이미지 합성·네트워크·브라우저·SVG 정규화)만 두는 자리라 여기 해당 없음.

### (a) 자산 이전 — 복사 규칙

`.design/assets/*`를 repo 루트의 배포용 트리로 **복사·이전**하고 참조 경로를 실배포 경로로 재작성한다(아래 §7). `tokens.css`·`ui-kit.css`는 내용 수정 없이 그대로 복사(권위 유지). 복사 못 한/분류 안 되는 자산은 gap 로그로 보고.

### (b) class → prop 매핑 테이블

ui-kit.css의 class 명명 규약을 **명시 매핑 테이블**로 고정해, 가족 prop 인터페이스 도출을 가족별 즉흥이 아닌 규약 적용으로 만든다. 도출은 ui-kit.html의 가족별 specimen을 권위로 적용한다.

| ui-kit.css 패턴 | prop |
|---|---|
| `.btn` + `.btn-sm`/`.btn-lg` (control-h 변형) | `size: 'sm' \| 'md' \| 'lg'` |
| `.btn-primary`/`.btn-secondary`/… (가족 변형 접미사) | `variant` (가족별 union) |
| 강제상태 `.is-checked`/`.is-on`/`.is-active` | 상태 prop(boolean) |
| 의사상태 `.is-hover`/`.is-focus`/`.is-disabled` | 런타임 상태 — **prop 아님**(브라우저가 부여) |

- **variant vs 자식 요소 구분(중요)**: `.btn-primary`(variant)와 `.footer-brand`·`.nav-links`·`.section-title`(컴포넌트 자식 요소)은 class 이름만으론 구분되지 않는다 — **ui-kit.html의 중첩 구조를 권위로** 판정한다(자식 요소는 prop이 아니라 래퍼 내부 마크업). 정규식 추출 도구를 두지 않는 이유.
- 매핑 테이블로 안 잡히는 변형(가족 고유 class)은 **사람 확인 게이트**로 넘긴다 — 즉흥으로 prop을 만들지 않는다.
- variant union 값은 ui-kit.css에 실재하는 class 접미사에서만 뽑는다(없는 변형 생성 금지).

## §5. 컴포넌트 모델

- **얇은 className 래퍼** + 전역 `tokens.css`·`ui-kit.css` **1회 import** + `className`/`style`/rest-props passthrough.
  - 예: `<Button variant="primary" size="md" />` → `<button className="btn btn-primary">`.
  - CSS Module·styled 미사용 — tokens/ui-kit.css 단일 권위 유지 + 상류 재싱크가 파일 덮기 한 번으로 끝나게.
  - 국소 override는 `className`/`style` passthrough 또는 토큰 var로 해결(컴포넌트별 css 추출 안 함 — YAGNI).
- **커버리지**: ui-kit.html에 있는 재사용 가능 전체 가족(button·input·textarea·select·checkbox·radio·toggle·badge/chip·filter chip·card·alert·toast·tooltip·tag·navbar·tabs·breadcrumb·table·pagination·list·footer·section header 등). Foundations(색 스와치·타이포 스케일 등 토큰 시연)는 컴포넌트화 제외.
- **상태 컴포넌트**(checkbox·radio·toggle·tabs 등): **uncontrolled 기본 + 선택적 controlled prop**. 내재 토글은 이 스킬, 외부 제어가 필요하면 controlled로 generate-code가 wiring.

## §6. 컴포넌트 내재 동작 (hooks)

- `src/hooks/`에 컴포넌트 내재 동작 hook을 저작한다. 단 **ui-kit에 실제 존재하는 인터랙티브 컴포넌트만** 탐지해 작성한다.
- ui-kit에 없는 컴포넌트(예: 모달이 ui-kit 산출물에 없으면)는 **지어내지 않는다** — export 원본이 없으면 그 동작도 없다.
- 예시(존재할 때만): password 보이기/숨기기 토글, toast dismiss, tabs 패널 전환(uncontrolled), filter chip 활성 토글.
- 페이지가 컴포넌트를 여닫는 식의 wiring은 작성하지 않는다(→ generate-code).

## §7. 자산 물질화 상세

- **아이콘**: 원본 svg는 `src/assets/icon/`에 두고, `src/components/common/icons.tsx` 한 모듈이 svgr(`?react`)로 인라인해 **개별 named 컴포넌트**(`SearchIcon`·`ChevronLeftIcon`… = icon-map 이름 PascalCase+`Icon`)로 export한다 — currentColor 상속·`size` prop. 같은 모듈이 **내부 name 레지스트리**도 export해 `IconButton`·`Search`가 `name`으로 참조(`<IconButton name="search" />` — 아이콘을 children으로 조합시키지 않음). 범용 공개 `<Icon name>`은 두지 않는다.
- **폰트**: 자가호스팅 기본.
  - next: `next/font/google`(빌드 시 자동 자가호스팅).
  - Vite: `@fontsource/<font>`(npm). 패키지가 없으면 `public/font/` 로컬 woff2 + `@font-face` 폴백.
  - **재배포 불가 라이선스**이거나 fetch 불가 시 CDN `<link>` 폴백 + gap 로그(상용 폰트 woff2 재배포 위반 방지).
- **파비콘**: 기존 favicon 자산 소비, 없으면 logo 대용(다중 해상도 누락은 gap 로그). next=`metadata`/`app/icon`, Vite=`index.html` `<link>`.
- **로고·워드마크·key-visual·content 이미지**: `public/image/`로 복사.

## §8. 스캐폴드 레이아웃 (repo 루트)

```
react (Vite)                          next (App Router)
─────────────────────────────────    ─────────────────────────────────
package.json                          package.json
vite.config.ts                        next.config.ts
tsconfig.json                         tsconfig.json
index.html                            (app/ 진입)
public/{image/, favicon.*}            public/{image/, favicon.*}
src/main.tsx       ← 전역 css import   src/app/layout.tsx ← next/font·전역 css·metadata
src/App.tsx        ← 쇼케이스 갤러리    src/app/page.tsx   ← 쇼케이스 갤러리
src/assets/css/{tokens,ui-kit}.css    src/assets/css/{tokens,ui-kit}.css
src/assets/icon/{*.svg, icon-map}     src/assets/icon/{*.svg, icon-map}
src/components/common/*.tsx ← 래퍼     src/components/common/*.tsx ← 래퍼
src/components/common/icons.tsx        src/components/common/icons.tsx   ← 개별 아이콘 + registry
src/components/common/index.ts ← barrel src/components/common/index.ts ← barrel
src/hooks/*.ts       ← 내재 동작       src/hooks/*.ts       ← 내재 동작
src/utils/*.ts       ← cx 등 유틸       src/utils/*.ts       ← cx 등 유틸
```

- **디렉터리 규약**: ui-kit 가족 래퍼·barrel은 `src/components/common/`(루트 `components/` flat 금지). 페이지 컴포넌트는 추후 `src/components/<page>/`(예: `components/login/LoginForm.tsx` — generate-code 몫). 유틸은 `src/utils/`(`lib/` 아님).
- `package.json`은 의존성과 스크립트를 포함해 **작성**하되, **`npm install`은 자동 실행하지 않는다**(옵션·사람 확인 — 전역 CLAUDE.md "명령 전 확인").
- next 전역 css는 `app/layout.tsx`에서 1회 import. `ui-kit.css`의 `@import "tokens.css"`는 번들러 경고/성능을 피해 PostCSS로 inline 처리한다.
- 진입점(`App.tsx`/`page.tsx`)은 export된 전체 가족을 ui-kit.html 4그룹 구조에 맞춰 렌더하는 **쇼케이스 갤러리** — 검증 표면 겸 핸드오프 레퍼런스. (generate-code가 나중에 실제 페이지로 대체·추가.)

## §9. 흐름·게이트

1. **전제 감지** — `.design/assets/css/{tokens,ui-kit}.css`·`view/ui-kit.html` 존재 확인. 없으면 상류 스킬(design-ui-kit → design-md-compiler) 안내.
2. **게이트1 — 타깃 선택** (react | next).
3. **충돌 검사(비파괴)** — repo 루트에 기존 `package.json`·`src/` 등 충돌 시 **덮기 전 사용자 확인**. 기본은 안 덮음.
4. **생성** — 결정적 코어(자산 이전 + 매핑 테이블 적용) → 타깃 어댑터로 래퍼·hook·진입점·프로젝트 파일 생성.
5. **검증 게이트** (§10).
6. **lock** — 승인 시 완료, `design-generate-code` 다음 단계 안내.

## §10. 검증 게이트 (재설계)

"쇼케이스 부팅 성공"은 신호가 약하다(얇은 래퍼는 거의 항상 부팅됨 → 잘못된 prop·class 오타·시각 회귀를 못 잡음, LLM 자기검수 함정). 그래서:

- **기본(install-free, 결정적)**:
  - (i) 생성된 컴포넌트가 참조하는 class명을 `ui-kit.css`와 **Grep으로 결정적 대조** — 존재하지 않는 class·오타 적발.
  - (ii) 구조 완전성 체크 — ui-kit.html 가족 목록 대비 생성 래퍼 누락 적발(Read/Grep).
- **옵션(사람 확인 후)**: `tsc --noEmit` 타입체크, dev 서버 부팅. `npm install`이 필요하므로 기본 아님(부수효과·비가역성).
- **시각 동등성**은 ui-kit.html이 이미 권위 쇼케이스이므로 거기에 기댄다 — 두 번째 쇼케이스를 픽셀 대조하지 않는다.

## §11. 에이전트·위임

- `front-developer`가 소유. 메인 세션에서 디스패치 가능하면 위임, 서브에이전트로 실행 중이면 스펙을 메인 세션에 인계(다른 에이전트와 통일된 패턴).
- 진입점 갤러리의 레이아웃 깨짐 점검이 필요하면 `web-publisher-qa` 재사용(브라우저 스크린샷 자가 검사).

## §12. 비범위 (명시적 위임)

- 실제 페이지 조립·페이지 수준 wiring → `design-generate-code`.
- html/MPA(jsp/php 블록) 산출 → `design-component-export-html`(별도 사이클).
- 페이지 div 저작·풀페이지 프로토타입 → `design-html-prototype`/web-publisher.
- 백엔드 연결 hook.

## §13. 구현 시 갱신할 참조 (plan에 포함)

- `skills/design-component-export/SKILL.md`(placeholder) → `skills/design-component-export-react/SKILL.md`로 대체(+ 추후 `-html`).
- `agents/front-developer.md` — 소유 스킬 목록을 `-react`/`-html`로 갱신.
- `docs/design/README.md` — 파이프라인 표·다운스트림 목록 갱신.
- (신규 mjs 없음) class→prop·자산 이전은 SKILL 산문 규약 — `scripts/lib` 모듈을 두지 않는다.
- `npm run sync`로 Codex 번들·codex-agents 재생성.

## §14. 미해결·리스크

- **specimen → prop 도출의 잔여 비결정성**: 매핑 테이블이 공통 규약은 잡지만, 가족 고유 변형은 사람 확인에 의존. 테이블 커버리지가 plan에서 ui-kit.css를 실제로 읽어 더 구체화돼야 함.
- **상태 컴포넌트 controlled/uncontrolled API**: uncontrolled 기본 + 선택 controlled의 구체 prop 형태(`defaultChecked`/`checked`+`onChange` 등)는 plan에서 가족별로 확정.
- **next `@import` inline**: PostCSS 설정의 구체 방식은 plan에서 확정.
