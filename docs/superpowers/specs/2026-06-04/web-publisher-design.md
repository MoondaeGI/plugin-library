# `web-publisher` 에이전트 — HTML 충실 구현 + 기계적 레이아웃 자가 QA — 설계

- 날짜: 2026-06-04
- 상태: 승인 대기 (사용자 리뷰)
- 범위: 디자인 파이프라인에 **HTML/CSS 구현 전담 에이전트 `web-publisher`** 추가. designer가 만든 디자인(이미지·요청사항)을 확정 CSS/토큰 위에 **충실히 HTML로 구현**하고, 구현 결과를 **OS 브라우저 스크린샷으로 자가 검사(기계적 레이아웃 깨짐만)**한다. 신규 npm 의존성 0.

## 1. 배경 / 문제

디자인 파이프라인이 HTML 산출물을 점점 많이 만든다(`overview.html`·`ui-kit.html`·`logos.html`·icon 그리드·`prototype/index.html`). 현재 HTML 저작은 `designer` 에이전트가 `design-html-prototype` 스킬을 호출해 수행한다.

두 가지 공백이 있다:

1. **구현 역할의 부재.** designer는 본질적으로 "어떻게 보여야 하나"(브랜드·토큰·이미지·DESIGN.md)를 정하는 디자인 권위다. 그 디자인을 받아 **표준 HTML/CSS로 실재화**하는 일은 성격이 다른 작업(퍼블리싱)인데, 지금은 designer가 겸한다. 실제 팀의 디자이너 ↔ 퍼블리셔 분업이 한 역할에 뭉쳐 있다.
2. **구현 결과의 검사 부재.** 만든 HTML이 디자인을 해치지 않았는지, `div` 밖으로 `input`이 튀어나오거나 grid 칸 높이가 들쑥날쑥한 **명백한 레이아웃 깨짐**이 없는지를 확인하는 단계가 없다. `design-html-prototype`의 "품질 기준"은 산문 체크리스트일 뿐 실제 렌더를 보고 검증하지 않는다.

## 2. 목표 (이번 spec 범위)

- **`web-publisher` 에이전트 신설.** 역할: designer 산출물(이미지·DESIGN.md·`tokens.css`·`ui-kit.css`·아이콘)을 입력으로, **디자인 의도를 해치지 않고** HTML/CSS로 **최대한 비슷하게 구현**한다.
- **기계적 레이아웃 자가 QA.** 구현 결과를 OS 브라우저로 breakpoint별 스크린샷 찍어, **눈에 보이는 레이아웃 깨짐**(요소 overflow·정렬 어긋남·grid 불균일·깨진 이미지)을 web-publisher 본인이 잡아 고치고 반복한다.
- **의존성 0.** 스크린샷은 OS에 설치된 브라우저를 커맨드로 호출(설치·번들 불필요). playwright·axe·lint 등 **신규 npm 의존성을 도입하지 않는다.**
- **HTML 저작 단계를 designer → web-publisher로 이관.** designer 파이프라인에서 `design-html-prototype` 호출 지점을 web-publisher로 옮긴다.

## 3. 비목표 (명시적 범위 밖)

- **접근성·대비비·시맨틱·SEO 정밀 검사.** axe-core/html-validate 류 결정적 도구가 필요한 항목은 이번 범위가 아니다(드라이버·신규 의존성 유발). 필요해지면 후속 spec.
- **미적 판정.** "보기 좋은가" 같은 주관 판단은 web-publisher의 일이 아니다. 디자인 충실도의 최종 심판은 자연히 designer/사람 몫이며, 강제 게이트를 두지 않는다(QA 범위가 객관적 레이아웃 깨짐이라 자가 검사로 충분).
- **실제 코드 구현(component export·React/Next·페이지 코드).** 미래 `front-developer` 에이전트 몫(§9). 이번에 만들지 않는다.
- **자동 수정 차단 게이트.** web-publisher는 저작자이므로 자기 발견을 자기가 고친다. 외부를 차단하는 게이트는 두지 않는다.

## 4. 전략적 타깃 아키텍처 (맥락 — 이번에 다 만들지 않음)

실제 팀을 모사한 3-역할 분업이 최종 그림이다:

```
designer            web-publisher           front-developer
"어떻게 보이나"   →   "웹에서 실재화"      →   "코드로 구현"
brand-kit·tokens     충실한 HTML/CSS 구현      공통 컴포넌트 추출
DESIGN.md·이미지      + 기계적 레이아웃 QA       React/Next 래퍼·페이지 코드
ui-kit.css·아이콘
파이프라인 오케스트레이션
```

- **designer**: 이미 존재. 이번 spec에서 HTML 저작 단계만 web-publisher로 이관.
- **web-publisher**: 이번 spec에서 신설. 현재 단계(실제 코드 구현 없이 디자인 확인용 HTML 제작)의 주인.
- **front-developer**: 미래 별도 spec. 미구현 placeholder `design-component-export`가 노리던 "확정 CSS → plain CSS 컴포넌트 + 얇은 React/Next 래퍼"가 이 에이전트 몫이 된다. 이번엔 **표기만** 하고 손대지 않는다.

## 5. 구조

### 5.1 에이전트

- **단일 소스**: `agents/web-publisher.md` (Claude 네이티브 frontmatter — `name`·`description`·`tools`·`model`). designer와 동형.
- **tools**: `Read, Write, Edit, Bash, Glob, Grep, Skill` (designer와 동일 — Bash로 스크린샷 스크립트 실행, Skill로 저작·QA 스킬 호출).
- **Codex 동기화**: `scripts/sync-agents.mjs`가 `codex-agents/web-publisher.toml` 생성(gitignore된 로컬 생성물 — 커밋 안 함). `model`·`tools`는 Claude 전용이라 TOML로 옮기지 않음(기존 designer 관례와 동일).
- **페르소나**: "디자인을 해치지 않는 충실한 구현자". 즉흥 디자인 변경 금지 — designer가 정한 토큰·레이아웃 의도를 그대로 따른다.
- **에이전트 형태 선택 근거**: 분리된 context가 *기술적으로* 필요해서가 아니다 — 핸드오프는 수동이고(§5.3), 오히려 디자인 맥락을 새 context에 다시 로드해야 하는 비용이 있다. §4의 3-역할 팀(designer → web-publisher → front-developer)으로 가는 **전방 호환**을 위해 지금부터 역할을 에이전트로 세우는 **의도적 선택**이며, front-developer가 생기기 전까지 수동 핸드오프를 감수한다. (스킬만으로도 기능은 같으나, 역할 경계를 미리 굳히는 것이 목적.)

### 5.2 스킬

- **저작 스킬**: 기존 `design-html-prototype`을 **web-publisher 소유로 전환**. SKILL.md 내용 변경은 최소(호출 주체가 designer → web-publisher로 바뀌는 맥락 반영, 산출물 성격을 "버리는 프리뷰"에서 "디자인 확인용 충실 구현"으로 명확화). 저작 로직 자체는 유지.
- **QA 스킬(신규)**: `skills/web-publisher-qa/` — 확정 HTML을 breakpoint별로 스크린샷 찍고 기계적 레이아웃 깨짐을 점검하는 스킬. 스크린샷 스크립트는 `skills/web-publisher-qa/scripts/`에 둔다(Codex 번들 포함 보장 — librarian의 `resolve-vault.mjs` 관례와 동일).

> **결정됨**: QA는 **별도 스킬 `skills/web-publisher-qa/`로 둔다**(저작과 검사의 관심사 분리, QA 단독 재사용 가능). web-publisher 에이전트가 저작 스킬(`design-html-prototype`)로 구현한 뒤 QA 스킬을 호출해 점검·반복한다.

### 5.3 designer → web-publisher 핸드오프

`designer`의 tools에는 `Agent`가 없어(`Read, Write, Edit, Bash, Glob, Grep, Skill`) **에이전트가 에이전트를 직접 호출하지 못한다.** 따라서 핸드오프는 **사용자 주도**다:

- designer가 디자인 산출물(brand-kit·tokens·ui-kit·이미지·DESIGN.md)까지 완료 → 사용자가 `web-publisher`를 호출해 HTML 구현 단계 진행.
- designer 파이프라인 문서(`agents/designer.md`)의 7단계(`design-html-prototype`)는 "이 단계는 web-publisher가 담당"으로 갱신.

> **대안**: designer tools에 `Agent`를 추가해 designer가 web-publisher를 서브에이전트로 띄우게 할 수도 있으나, 현재 repo에 에이전트→에이전트 호출 선례가 없어 **이번 범위 밖**으로 둔다. 사용자가 자동 핸드오프를 원하면 후속 검토.

## 6. 입력 / 출력

**입력** (대상 프로젝트 cwd 기준):
- `DESIGN.md`
- `.design/brand-tokens.json` · `.design/assets/tokens.css`
- `.design/assets/ui-kit/ui-kit.css` · `.design/assets/icon/*.svg`
- `.design/assets/**`(확정 이미지) → 없으면 `.design/candidate/**` 폴백
- 사용자 요청사항(어떤 화면·섹션을 만들지)

**출력**:
- `prototype/index.html`(단일 파일 요청 시 `prototype.html`) — 기존 `design-html-prototype` 출력 규약 유지.
- QA 스크린샷·리포트: **시스템 임시 폴더(OS temp) 사용 — 확정.** repo·대상 프로젝트를 오염시키지 않아, CLAUDE.md "상태폴더 `.gitignore`·승인 먼저" 절차를 QA 실행마다 끼울 필요가 없다(자동 QA 흐름 유지). 대상 프로젝트 안 `prototype/.qa/`에 보존하길 원하는 경우에만 그때 해당 경로 gitignore 갱신+승인 — 기본 아님.

## 7. 자가 QA (스크린샷 기반)

### 7.1 흐름

1. web-publisher가 HTML/CSS를 구현한다(저작 스킬).
2. QA 스킬이 OS 브라우저를 해결(§8)해 **breakpoint별 스크린샷**을 찍는다.
3. web-publisher가 스크린샷을 보고 **기계적 레이아웃 깨짐**을 찾는다:
   - 요소가 컨테이너 밖으로 튀어나옴(`input`이 `div` 밖으로 등)
   - grid/flex 칸 높이·정렬 불균일
   - 가로로 잘려나가는 콘텐츠(뷰포트 초과)
   - 깨진 이미지(빈 자리·broken icon)
   - 요소 겹침
4. 발견하면 **저작 스킬로 돌아가 고치고** 2–3을 반복한다.
5. 깨짐이 없으면 완료. 사람(또는 designer)이 디자인 충실도를 보는 건 그다음, 별개.

> **알려진 한계**: 부모에 `overflow:hidden`이 걸려 *잘린* overflow는 스크린샷에 거의 드러나지 않아 놓칠 수 있다(부록 실증 B = △). 스크린샷 QA는 *보이는* 깨짐을 잡는 도구이며, 클리핑된 overflow는 명시적으로 범위 밖이다(잘려서 화면 피해도 작음). 결정적 검출이 필요해지면 후속 spec(드라이버 도입).

### 7.2 breakpoint 해결 순서

레이아웃이 반응형일 때만 다중 폭으로 검사한다. 폭은 하드코딩하지 않고:

1. **호출 인자** — 사용자가 지정한 폭(예: 390·1440)
2. **기본값** — `375 / 768 / 1280`

> 현재 `brand-tokens.json` 스키마·`DESIGN.md` 템플릿에는 **기계 판독 가능한 breakpoint 필드가 없다.** 따라서 "디자인 소스에서 breakpoint를 읽는" 경로는 두지 않는다(dead path 회피). 필요해지면 후속으로 `brand-tokens.json`에 breakpoint 필드를 추가한 뒤 이 우선순위 사이에 끼운다.

반응형이 아닌 화면(고정폭)은 단일 폭만 찍는다. 반응형 여부는 **사용자 지시, 또는 대상이 일반 페이지(prototype)인지**로 판단한다.

## 8. 브라우저 해결 + 폴백

스크린샷은 **OS에 설치된 브라우저를 커맨드로 호출**한다(npm 의존성·번들 없음). 특정 브라우저를 하드코딩하지 않고 실행 시점에 해결한다:

1. 설치된 브라우저 탐색 — Edge / Chrome / Chromium / Brave(전부 Chromium 계열, `--headless=new --screenshot` 동일 지원). Windows는 Edge가 기본 탑재라 설치 0으로 거의 항상 1개 잡힘.
2. 하나도 없으면 → **스크린샷 단계를 건너뛰고**, HTML/CSS 코드 기반 점검(가능한 범위)만 수행한 뒤 "스크린샷 검사는 건너뛰었다"고 보고. (드라이버·다운로드 폴백 없음 — 의존성 0 원칙.)

- `.env` 사용 안 함. 드물게 엔진을 바꾸려면 **호출 인자**로 지정.
- OS별 설치 경로 분기는 QA 스크립트가 흡수(`scripts/`).

> **실증 확인됨**: 이 머신(Windows 11)에서 `msedge --headless=new --screenshot --window-size=375,900 file://…`이 **설치 0으로 즉시** PNG를 생성했다(§부록).

## 9. 경계 조정

- **designer**: `agents/designer.md` 파이프라인에서 HTML 저작(7단계 `design-html-prototype`)을 "web-publisher 담당"으로 갱신. 디자인 산출물 생성까지가 designer 범위.
- **front-developer / `design-component-export`**: 손대지 않음. §4 타깃 아키텍처에 미래 역할로 표기만.

## 10. 미해결 / 후속

- (§7) 스크린샷+눈이 사용자 버그류(input overflow·grid 불균일)를 잡는지 — **검증 완료**(부록 2차 테스트: 보이는 overflow·불균일 grid ✅, 클리핑 overflow △=한계로 §7.1 명시). 구현 시 이 케이스들을 TDD 회귀 케이스로 고정한다.
- 접근성·시맨틱 정밀 검사(결정적 도구) 필요 시 후속 spec.
- breakpoint를 디자인 소스에서 읽기 — 후속(현 스키마에 필드 없음, §7.2).

## 부록 — 실증 테스트 결과 (설계 검증용, 2026-06-04)

모든 테스트는 OS 설치 Edge를 `--headless=new --screenshot`로 호출(설치·번들 0)해 PNG를 만들고, 그 PNG를 멀티모달로 판독했다. 스크린샷 메커니즘 자체가 이 머신(Windows 11)에서 설치 0으로 동작함을 함께 확인.

### 1차 — 일반 시각 결함 (375px)

| 심은 결함 | 잡힘 |
|---|---|
| hero 제목 과대 → 답답한 다줄 줄바꿈 + 우측 잘림 | ✅ |
| 본문 저대비 → 흐림 | ✅ |
| CTA 버튼 텍스트색≈배경 → 안 읽힘 | ✅ |
| 깨진 이미지 | ✅ |
| 620px 고정폭 박스 → 가로 오버플로 | △ (잘림만 보임, 양은 모름) |
| 미로드 폰트 → 폴백 렌더 | ✗ (의도 모르면 판별 불가) |

### 2차 — 사용자 명시 핵심 버그류 (1000px) ← QA 존재 이유 검증

| 심은 결함 | 잡힘 |
|---|---|
| **A. `input`이 카드(`div`) 밖으로 튀어나옴 (overflow 보임)** | ✅ 명확 — input이 카드 박스를 한참 벗어남 |
| **C. grid 칸 높이 들쑥날쑥** (`align-items:start` + 내용 길이 제각각) | ✅ 명확 — 바닥선 확연히 어긋남 |
| C-비교. 균일 grid (`min-height` 일치) | ✅ 정상으로 올바르게 안 잡음 (false positive 없음) |
| **B. `input` overflow + 부모 `overflow:hidden`** | △ 애매 — 가장자리 잘림으로만 보여 의도된 것과 혼동 가능 |

**결론**: QA의 존재 이유(사용자가 말한 버그류를 스크린샷으로 잡는다)가 **2차 테스트로 검증됨** — 흔한 경우인 *보이는* overflow와 grid 불균일은 확실히 잡히고, 균일 grid는 오탐 없음. 유일한 약점은 `overflow:hidden`으로 *잘린* overflow(△)이며, 이는 §7.1에 **알려진 한계**로 명시(잘려서 화면 피해도 작음, 결정적 검출은 후속). 1차의 가로 오버플로 양·폰트 로드 같은 수치/비가시 항목은 이번 QA 범위 밖이라 손실 아님.
