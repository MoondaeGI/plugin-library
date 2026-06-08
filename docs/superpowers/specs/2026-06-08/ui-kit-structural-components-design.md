# ui-kit 구조 컴포넌트 확장 — 설계

**상태:** 설계(검토 대기)
**대상 파일:** `skills/design-ui-kit/SKILL.md`(+ `templates/ui-kit-sheet.html` 슬롯),
`skills/design-md-compiler/SKILL.md` §5
**짝 스펙:** `html-prototype-fidelity-gates-design.md` (같은 날짜 폴더 — 프로토타입 재사용 규율)

## 배경

SugarLoop 프로토타입이 헤더를 손저작한 건 **재사용 규율** 문제였지만(짝 스펙이 처리),
**footer·카우셀은 ui-kit에 아예 없어** 손저작할 수밖에 없던 진짜 어휘 공백이었다.
재사용 규율만으로는 footer가 페이지마다 새로 짜여 drift가 계속된다.

ui-kit은 현재 "마케팅 히어로·풀페이지 레이아웃은 design-image-web 몫"으로 선을 긋고 있다.
footer·app bar·sidebar는 마케팅이 아니라 **반복되는 구조 chrome**이므로 이 경계를 침범하지 않고
ui-kit 어휘로 들일 수 있다.

## 설계 원칙 — ui-kit = 조건부 어휘

핵심: **두 층을 분리한다.**

- **1층 ui-kit = 어휘(à la carte).** ui-kit은 "쓸 수 있는 블록"을 정의만 한다. 어떤 블록을
  *그 제품의* ui-kit에 저작할지는 **제품 화면이 결정**하며, 이는 이미 게이트1("넉넉히 제안 →
  안 쓸 것만 뺀다")이 하는 일이다. **강제 포함은 없다.**
- **2층 페이지 = 셸 조립.** header만 / sidebar만 / 둘 다 / 둘 다 없음 같은 셸 조합은
  화면 아키타입의 문제다 — **이번 스코프 밖**(향후 설계).

따라서 이 스펙은 ui-kit의 **어휘 목록(분류)**과 **각 컴포넌트의 권위 스펙**을 넓히고,
조건부 멤버십 원칙을 명문화한다. SugarLoop 파일은 건드리지 않는다(증거 사례).

## 추가 컴포넌트

### 어휘로 정식 추가 (분류·스펙·쇼케이스 슬롯·md §5에 반영)

| 컴포넌트 | 그룹(4분류) | 비고 |
|---|---|---|
| **Footer** | 4 Structural | 페이지 반복 chrome. 브랜드 컬럼 + 링크 컬럼 + (선택)뉴스레터 + 하단 바. |
| **필터 칩 변형** | 2 Core Interactive | 기존 `.chip`(태그/제거형)과 **구분되는 필터 토글** 변형(`.chip` + 상태 클래스). |
| **navbar 풀블리드 변형** | 4 Structural | 기존 `.navbar`(카드형 specimen)에 풀블리드 sticky 헤더 변형 추가. 새 컴포넌트 아님 — 변형. |
| **섹션 헤더** | 4 Structural | 제목 + 액션 링크("전체보기 →") 패턴. **추가하되 페이지에서 조건부 사용**(강제 아님). |

### 조건부 어휘로 인지 (게이트1 제안 메뉴에만, 제품 필요 시 저작)

| 컴포넌트 | 그룹 | 비고 |
|---|---|---|
| **Sidebar** | 4 Structural | 게이트1 제안 메뉴에 명시. *app/console 화면이 있는 제품만* 저작(SugarLoop엔 없음). 그룹4가 이미 sidebar를 조건부 예시로 언급 — 이를 정식 어휘로 승격. |

### out of scope (향후 설계)

- **명명된 셸**(site / app / minimal 등 header·sidebar·footer 조합 레이아웃). 이번엔 제외하고
  스펙에 "향후"로만 표기.

## 변경 1 — `skills/design-ui-kit/SKILL.md`

### 1a. 컴포넌트 분류(4그룹) 갱신

- 그룹2 Core Interactive: 필터 칩 변형을 명시.
- 그룹4 Structural: **footer·섹션 헤더·navbar 풀블리드 변형**을 IN(기본 포함 후보)으로,
  **sidebar**를 조건부 어휘로 명시. footer가 "마케팅 히어로"와 다른 chrome임을 경계에 적어둔다.

### 1b. 조건부 어휘 원칙 명문화

게이트1 설명에 "ui-kit = 조건부 어휘 — 강제 포함 없음, 제품 화면이 멤버십 결정"을 한 줄 박는다.
셸은 향후 설계임을 표기.

### 1c. 각 신규 컴포넌트의 토큰 기반 스펙

기존 규약대로 **토큰 변수만**(하드코딩 HEX·px 0), tokens.css가 내보내는 변수명만 사용.
아이콘은 `assets/icon/*.svg` 인라인. footer/sidebar/섹션헤더/필터칩/navbar변형의 class·상태를
스펙으로 정의(실제 저작은 스킬 실행 시 제품 ui-kit.css에).

### 1d. 쇼케이스 슬롯 반영 (`templates/ui-kit-sheet.html`)

신규 컴포넌트를 대응 패널 슬롯에 specimen으로 노출:
- `slot:core`: 필터 칩 변형.
- `slot:structural`: footer·섹션 헤더·navbar 풀블리드 변형·(제품에 있으면) sidebar.
- 매트릭스(변형×상태) 규약과 번호/라벨 검수 가능성 유지.

## 변경 2 — `skills/design-md-compiler/SKILL.md` §5

§5 컴포넌트 규칙 예시 목록에 **Footer·Sidebar(조건부)·Section Header·Filter Chip·App Bar(navbar 변형)**를
추가해, ui-kit.css에 있으면 §5 산문으로 기술되도록 한다(권위는 ui-kit.css, 이중 관리 금지 원칙 유지).

## 비목표 (out of scope)

- 명명된 셸(레이아웃 조합)의 정의·구현 — 향후 별도 설계.
- SugarLoop의 ui-kit.css·프로토타입 수정.
- 카우셀/히어로 배너의 ui-kit 편입(마케팅·페이지별 편차 → design-image-web/페이지 조립 유지).

## 영향 / 후속

- 스킬 md(+쇼케이스 템플릿) 수정 → 스크립트 로직 변경 없음(테스트 영향 없음).
- 수정 후 `npm run sync`로 Codex 번들 재생성 필요. Claude `/reload-plugins`, Codex `npm run codex:reinstall`.
- 짝 스펙(html-prototype 재사용 규율)과 함께 적용해야 "footer가 어휘로 존재 + 프로토타입이 재사용"이
  성립한다.
