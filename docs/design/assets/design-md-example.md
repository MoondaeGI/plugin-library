---
# generated from .design/assets/css/tokens.css — do not edit (regenerated on every compile)
meta: >
  Nooknote — 읽은 책과 마음에 남은 문장을 기록하고 다시 펼쳐 보는 독서 기록 모바일 앱.
  조용·따뜻·사려 깊은 저녁 독서 무드의 에디토리얼 라이트 디자인.
colors:
  primary: "#3F4D4A"        # 저녁 잉크 슬레이트틸 — 핵심 액션·헤더·심볼
  accent: "#C98A4B"         # 등불 앰버 — 저장·하이라이트·강조 포인트
  background: "#ECE5D8"     # 웜 그레이지 종이 — 앱 배경
  surface: "#F6F1E7"        # 밝은 종이 — 카드·시트
  surfaceAlt: "#E3DACB"     # 구분 면·비활성 배경
  text: "#2A2E2C"           # 본문
  textMuted: "#7C766B"      # 보조 텍스트·캡션
  border: "#D8CDBB"         # 헤어라인·경계
  success: "#6E8369"        # 완료·읽음 (세이지)
  warning: "#B5792F"        # 주의 (딥 앰버)
  danger: "#B05B47"         # 삭제·경고 (웜 테라코타)
  # 파생 틴트(tokens.css): tint-primary rgba(63,77,74,.08) · tint-accent rgba(201,138,75,.1)
  #   tint-success rgba(110,131,105,.14) · tint-warning rgba(181,121,47,.16) · tint-danger rgba(176,91,71,.12)
typography:
  display: { family: '"Gowun Batang", "Apple SD Gothic Neo", Georgia, serif', size: "44px", weight: "700", lineHeight: "1.15", letterSpacing: "-0.01em" }
  heading: { family: '"Gowun Batang", "Apple SD Gothic Neo", Georgia, serif', size: "26px", weight: "700", lineHeight: "1.35", letterSpacing: "-0.005em" }
  body:    { family: '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', size: "16px", weight: "400", lineHeight: "1.75", letterSpacing: "0" }
  caption: { family: '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', size: "13px", weight: "400", lineHeight: "1.5", letterSpacing: "0.01em" }
  label:   { family: '"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif', size: "12px", weight: "400", lineHeight: "1.3", letterSpacing: "0.06em" }
  mono:    { family: '"Nanum Gothic Coding", "D2Coding", "Courier New", monospace', size: "13px", weight: "400", lineHeight: "1.5", letterSpacing: "0" }
  accent:  { family: '"Gowun Batang", "Apple SD Gothic Neo", Georgia, serif' }   # 풀쿼트·인용 전용
spacing:
  sectionY: "96px"
  containerX: "24px"
  cardPadding: "20px"
  s1: "4px"
  s2: "8px"
  s3: "12px"
  s4: "16px"
  s5: "24px"
  s6: "32px"
  s7: "48px"
  s8: "64px"
controls:
  sm: "32px"
  md: "40px"
  lg: "48px"
radius:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "999px"
shadow:
  sm: "0 1px 2px rgba(58,50,40,0.06)"
  md: "0 4px 12px rgba(58,50,40,0.08)"
  lg: "0 12px 32px rgba(58,50,40,0.10)"
border:
  hairline: "1px solid #D8CDBB"   # {colors.border} — 기본 구획(그림자보다 우선)
breakpoints: {}   # tokens.css에 --bp-* 없음 — §7·§12 참조
---

# DESIGN.md — Nooknote

## 1. 제품 요약
- 제품명: Nooknote
- 대상 사용자: 책을 즐기는 20~40대, 독서 노트·기록을 남기기 좋아하는 사람.
- 핵심 가치: 인상 깊은 문장을 가볍게 저장하고, 나중에 따뜻하게 다시 꺼내 본다. 기록의 부담은 덜고 다시 읽는 즐거움을 준다.
- 화면 목적: 모바일 앱(iOS·Android, B2C). 읽은 책 기록 · 문장 저장 · 재발견.

## 2. 브랜드 성격
- 키워드: 차분 · 따뜻 · 사려 깊음 · 저녁 독서 · 아늑한 책방.
- 말투: 다정하고 조용함. 가르치거나 재촉하지 않음(§9 보이스).
- 사용자가 느껴야 할 감정: 편안함, 오래 곁에 두고 싶은 안정감.
- 피해야 할 인상: 무겁거나 고전적인 학습 앱, 딱딱함, 게임화된 강박.

## 3. 시각 방향
- 전체 분위기: 종이 질감의 따뜻한 라이트 모드. 저녁빛 에디토리얼.
- 레이아웃 원칙: 넉넉한 여백 + 헤어라인 구획({border.hairline}). 떠다니는 카드·그림자 남발 대신 차분한 면 분할.
- 이미지 사용 방식: 저녁빛·창가·종이·책의 정물(소프트 라이트, 웜 팔레트). 사람 얼굴 클로즈업·오피스 스톡 금지.
- 아이콘·일러스트 방향: Line/Outline rounded(2px, round join+cap) + 소량 앰버 fill로 저장·하이라이트만 포인트. lucide 단일 세트.
- Key Characteristics:
  - 단일 지배 액센트 = {colors.accent} 앰버(등불). 보조 액센트 추가 금지.
  - 핵심 인터랙션·심볼은 {colors.primary} 슬레이트틸.
  - 인용(저장한 문장)은 명조({typography.accent})가 주인공.
  - 구획은 그림자가 아니라 헤어라인 우선; 그림자는 떠야 하는 요소만.
  - 부드러운 라운드(컨트롤 {radius.md} / 카드 {radius.lg} / 칩·배지 {radius.pill}).
  - 상태는 색 + 아이콘 + 텍스트 병행(색만으로 구분 금지).
  - 네온·강한 그라데이션·다크 대시보드·빽빽한 테이블·게임화 뱃지 금지.

## 4. 디자인 토큰
> 값의 권위는 `assets/css/tokens.css`이며 frontmatter는 그 거울이다. 본문은 점 표기로 참조한다.

### Colors
- {colors.primary} `#3F4D4A` — 핵심 액션·버튼 채움·헤더·심볼·활성 네비. (BRAND_KIT §7)
- {colors.accent} `#C98A4B` — 저장·하이라이트·강조 점/배지. **primary 버튼색으로 쓰지 않음**(앰버=등불 포인트 한정). (ui-kit-briefs 앰버 규율)
- {colors.background} `#ECE5D8` — 앱 배경(웜 그레이지 종이).
- {colors.surface} `#F6F1E7` — 카드·입력·시트 표면.
- {colors.surfaceAlt} `#E3DACB` — 구분 면·비활성·세그먼트 트랙·footer 배경.
- {colors.text} `#2A2E2C` — 본문 텍스트.
- {colors.textMuted} `#7C766B` — 캡션·보조·placeholder.
- {colors.border} `#D8CDBB` — 헤어라인·카드/입력 테두리(기본 구획 수단).
- {colors.success} `#6E8369` — 완료·읽음. {colors.warning} `#B5792F` — 주의. {colors.danger} `#B05B47` — 삭제·경고.
- 파생 틴트(`--tint-*`): 배지·alert·hover 배경에 사용(예: 버튼 secondary hover = tint-primary).

### Typography
- {typography.display} — Gowun Batang 700 / 44 / 1.15 / -0.01em. 히어로·큰 슬로건. (BRAND_KIT §8)
- {typography.heading} — Gowun Batang 700 / 26 / 1.35 / -0.005em. 카드 제목·섹션 제목.
- {typography.body} — Gowun Dodum 400 / 16 / 1.75 / 0. 본문·UI 텍스트(온화한 sans, 장문 가독).
- {typography.caption} — Gowun Dodum 400 / 13 / 1.5 / 0.01em. 출처·날짜·힌트.
- {typography.label} — Gowun Dodum 400 / 12 / 1.3 / 0.06em. 라벨·버튼 텍스트·배지(자간 넓힘).
- {typography.mono} — Nanum Gothic Coding 400 / 13 / 1.5 / 0. 날짜·별점 등 숫자/데이터(탭ular).
- {typography.accent} — Gowun Batang(명조). 풀쿼트·저장한 문장 인용 전용(본문 아님). (BRAND_KIT §8 인용/액센트)
- 한글 주의: 명조(Gowun Batang)는 장문 본문에 쓰지 않고 제목·인용에만. 라틴 숫자·날짜는 mono 정렬.

### Spacing
- 페이지: {spacing.sectionY} 96 · {spacing.containerX} 24 · {spacing.cardPadding} 20.
- 미세 스케일: {spacing.s1}4 / {spacing.s2}8 / {spacing.s3}12 / {spacing.s4}16 / {spacing.s5}24 / {spacing.s6}32 / {spacing.s7}48 / {spacing.s8}64.
- 컨트롤 높이: {controls.sm}32 / {controls.md}40(기본) / {controls.lg}48. 단일행 컨트롤은 padding이 아니라 height 토큰으로 정렬.

### Radius / Shapes
- {radius.sm}8(미세 요소·태그) / {radius.md}12(버튼·입력) / {radius.lg}16(카드) / {radius.xl}24 / {radius.pill}999(칩·배지·토글·search·avatar).
- 기하 규칙: 부드러운 라운드 일관. 직각 그리드·날카로운 모서리 회피.

### Elevation
- {shadow.sm} — 기본(살짝 떠야 하는 카드). {shadow.md} — toast·tooltip·raised 카드. {shadow.lg} — 큰 오버레이.
- 원칙: 그림자보다 {border.hairline} 우선. 그림자는 절제.

### Border
- 헤어라인 {border.hairline}({colors.border})이 기본 구획·카드/입력/테이블 행 경계. 강조 경계는 {colors.text} 2px(테이블 헤더·마스트헤드).

## 5. 컴포넌트 규칙
> 권위: `assets/css/ui-kit.css`의 실제 class·variant·강제상태. 구현자는 그대로 복사해 쓴다. 토큰은 점 표기 참조.

### Button — `.btn` (+ `.btn-primary` `.btn-secondary` `.btn-ghost` `.btn-danger`, 크기 `.btn-sm` `.btn-lg`)
- 형태: height {controls.md}(sm {controls.sm}/lg {controls.lg}), radius {radius.md}, 가로 padding {spacing.s5}, 텍스트 {typography.label} 700.
- primary = {colors.primary} 채움 + {colors.surface} 텍스트 / secondary = {colors.surface} + {border.hairline} + {colors.primary} 텍스트 / ghost = 투명 + {colors.primary} / danger = {colors.danger} 채움.
- 상태(강제상태 class 공유): `:hover/.is-hover`(primary·danger=brightness .94, secondary·ghost=tint-primary 배경) · `:active/.is-active`(brightness .88) · `:focus-visible/.is-focus`(2px {colors.primary} outline) · `:disabled/.is-disabled`(opacity .45).
- 용도: primary=핵심 액션 1개, secondary=보조, ghost=낮은 위계, danger=파괴적. 앰버는 버튼색 아님.

### Icon Button — `.btn-icon`
- {controls.md} 정사각, 투명 배경, hover=tint-primary. 아이콘 {spacing.s5}. `assets/icon/*.svg` 인라인(currentColor).

### Input / Select / Textarea / Search
- `.input` `.select`: height {controls.md}, {colors.surface} 배경, {border.hairline}, radius {radius.md}, body 타이포. focus=2px tint-primary + {colors.primary} 테두리. error=`.is-error`({colors.danger} 테두리). disabled={colors.surfaceAlt}.
- `.textarea`(멀티라인): height 토큰 대신 min-height, padding {spacing.s3}/{spacing.s4}, resize vertical.
- `.search`: height {controls.md}, radius {radius.pill}, search 아이콘 인라인 + `.search-input`(투명). focus-within=2px tint-primary.
- 래퍼 `.field` + `.label`({typography.label} 600) + `.field-hint`({typography.caption} muted) / `.field-error`({colors.danger}).

### Checkbox / Radio / Toggle
- `.checkbox`/`.radio`: `.box`({spacing.s5}, surface+border) 안에 check.svg(checkbox) 또는 점(radio). checked/`.is-checked` = {colors.primary} 채움. radio `.box`는 radius.pill.
- `.toggle`: `.track`(pill, surfaceAlt) + `.thumb`. on/`.is-on` = {colors.primary} 트랙. focus=2px tint-primary.

### Badge — `.badge` (+ `.badge-saved` `.badge-success` `.badge-warning` `.badge-danger`, `.badge-dot`)
- pill, {typography.label} 600. 기본=tint-primary/{colors.primary}. saved=tint-accent/{colors.warning}(저장 앰버 점). success/warning/danger=각 틴트/색. 색 + 점 + 텍스트 병행.

### Chip / Filter Chip — `.chip` · `.chip-filter`
- `.chip`(태그형, 제거 가능): {controls.sm}, pill, surfaceAlt + border + close.svg.
- `.chip-filter`(토글): 기본=surface+border, hover=tint-primary, 활성 `.is-active` = {colors.primary} 채움 + {colors.surface} 텍스트.

### Card (Book card) — `.card` (+ `.card-raised`, `.card-header` `.card-title` `.card-body` `.card-footer`)
- **책 카드 = 서가/보관함의 책 항목.** {colors.surface} + {border.hairline} + radius {radius.lg} + padding {spacing.cardPadding}. `.card-raised`만 {shadow.sm}.
- 구조: `.card-header`(제목 {typography.heading} **위에 크게** + **상태 배지 우상단**) → `.card-body`(본문) → `.card-footer`(액션, 우측, 상단 헤어라인).
- **리본 없음.** 상태는 우상단 배지(읽음/저장됨).

### Record / Quote Card (signature) — `.record-card` (+ `.record-bookmark` `.record-quote` `.record-meta`)
- **인용 카드 = 저장한 문장.** 책 카드와 **다른 타입**(용도: 책 항목 vs 저장한 문장).
- 구조: **문장이 주인공** — `.record-quote`({typography.accent} 명조, {colors.primary}, 따옴표 자동) 가운데 → `.record-meta`(출처 「제목」 · 날짜, {typography.caption}, dot 구분) **하단**.
- `.record-bookmark` = 앰버({colors.accent}) 책갈피 리본 **좌상단**(저장한 문장 마커). padding-top {spacing.s7}로 문장이 리본에 안 가림.
- **상태 배지 없음.** 코너 규칙: 우상단=상태 배지(책 카드), 좌상단=리본(인용 카드). 리본과 "저장됨" 배지를 함께 쓰지 않음(의미 중복).

### Alert / Banner — `.alert` (`.alert-info` `.alert-success` `.alert-warning` `.alert-danger`) · `.banner`
- `.alert`: 아이콘 + `.alert-title` + `.alert-body`. 변형별 틴트 배경 + 해당 상태색 테두리/제목. 상태 아이콘(success/warning/danger.svg) 인라인.
- `.banner`: tint-primary 배경, 좌 메시지 + 우 액션.

### Toast / Tooltip — `.toast` · `.tooltip` `.tooltip-bubble`
- `.toast`: {colors.primary} 배경 + {colors.surface} 텍스트 + {shadow.md}, 아이콘 인라인.
- `.tooltip-bubble`: {colors.text} 배경 + {colors.background} 텍스트, {typography.caption}.

### Empty State — `.empty` (`.empty-icon` `.empty-title` `.empty-text`)
- 점선 {colors.border} 테두리 + {colors.surface} 배경, 중앙 정렬. empty-icon(bookshelf.svg 등) + 제목 {typography.heading} + 설명 muted + 액션 버튼. 카피는 §9 톤(다정·재촉 안 함).

### Tag / Avatar / Rating — `.tag` · `.avatar` · `.rating`
- `.tag`: 정적 라벨, radius {radius.sm}, tint-primary/{colors.primary}, {typography.label}.
- `.avatar`: pill, surfaceAlt/{colors.primary}, 이니셜 또는 img. sm/md/lg.
- `.rating`: star.svg, 채움={colors.accent}, 빈 별 `.is-empty`={colors.border}.

### Navigation
- **Navbar(top bar) — `.navbar`**: 기본 = **풀블리드 헤더**({colors.surface} + 하단 {border.hairline}만, 좌우/상단 테두리·radius 없음). `.brand`(display, {colors.primary}) + `.nav-links`(활성 `.is-active`=primary 700) + `.btn-icon`.
  - 변형: `.navbar-card`(둥근 카드 헤더 — 떠 있는 헤더 필요 시) · `.navbar-bar`(sticky 앱바, position:sticky).
- **Bottom Tab Bar(모바일) — `.tabbar` `.tabbar-item`**: 상단 {border.hairline}, 아이콘({spacing.s5}) + 라벨({typography.label}), 활성 `.is-active`={colors.primary} / 비활성 textMuted. 홈/보관함/노트/마이.
- **Sidebar(조건부·app/console) — `.sidebar` `.sidebar-nav` `.sidebar-link`**: 우측 {border.hairline}, 링크 아이콘+텍스트, 활성 `.is-active`=tint-primary 배경 + primary 700. (모바일 메인엔 탭바 사용; sidebar는 넓은 화면·콘솔용.)

### Tabs — `.tabs` `.tab` (+ `.tabs-underline`)
- 세그먼트: surfaceAlt 트랙 + 활성 `.tab.is-active`={colors.surface} + {shadow.sm}. 변형 `.tabs-underline`=하단 헤어라인 + 활성 2px {colors.primary} 밑줄.

### List — `.list` `.list-item` (`.list-icon` `.list-body` `.list-title` `.list-sub` `.list-meta`)
- 행 구분 {border.hairline}(마지막 행 없음). 좌 아이콘({colors.primary}) + 본문(title/sub) + 우 meta(chevron-right 등).

### Section Header — `.section-head` `.section-title` `.section-action`
- 제목 {typography.heading} + 우측 액션 링크("전체보기 →", chevron-right.svg, {colors.primary}).

### Pagination — `.pagination` `.page`
- {controls.sm} 셀, radius {radius.sm}, 활성 `.is-active`={colors.primary} 채움. chevron-left/right.svg.

### Table — `.table` (`.num`)
- **zebra 없이 행 헤어라인 + 넉넉한 셀 padding**({spacing.s3}/{spacing.s4}). thead={typography.label} uppercase muted + 하단 2px {colors.text}. 행 hover=tint-primary. `.num`=mono 우측정렬. (§10 빽빽한 테이블 회피)

### Footer — `.footer` (`.footer-cols` `.footer-brand` `.footer-col` `.footer-bottom`)
- {colors.surfaceAlt} 배경 + 상단 {border.hairline}. 브랜드 컬럼(brand + 한 줄 소개) + 링크 컬럼들 + `.footer-bottom`(© + 태그라인, {typography.caption}).

## 6. 페이지 섹션 규칙
> page-briefs·페이지 이미지 미생성 — 섹션 규칙은 ui-kit 어휘 + §3 원칙에서 도출 가능한 범위만. 풀 페이지 디자인은 `design-image-mobile`/`design-image-web` 후 보강(§12).
- 일반 화면 골격(모바일): `.navbar`(또는 풀블리드) 상단 + 콘텐츠(`.section-head` → 카드/리스트) + `.tabbar` 하단.
- 피드/홈: `.section-head`("최근 기록") + 인용 카드(`.record-card`) 스트림 + 책 카드(`.card`) 그리드. `.chip-filter`로 필터.
- 보관함(서가): 책 카드 그리드 + `.tabs`/`.chip-filter` + 빈 상태 `.empty`.
- 문장/노트 작성: `.field`(`.input`/`.textarea`) + primary 버튼. 저장 시 `.toast`.
- 상세: 인용 카드 + `.rating` + `.tag` + 액션.

## 7. Responsive Behavior
- **breakpoint 토큰 없음**(tokens.css에 `--bp-*` 미정의). 컴포넌트는 컨테이너 폭에 유동(매트릭스 grid는 좁아지면 1열). 모바일 우선 앱.
- 터치 타깃: 컨트롤 기본 {controls.md}=40px. 주요 탭/버튼은 {controls.lg}=48px 권장(40px는 최소선 — 44px 미만이라 핵심 터치 요소는 lg 사용 권장, §12 표시).
- 반응형 정식 정의가 필요하면 `design-brand-kit`에서 폼팩터·breakpoint를 정해 tokens에 추가.

## 8. 이미지 에셋 사용 규칙
> 락된 확정 제품 자산만 참조. candidate 시안·컨셉 전시물 제외.
- 로고: `assets/logo/logo.png`(확정 심볼 = brand-kit base 마크) · favicon/app-icon: `assets/logo/favicon.png`(autocrop 재사용).
- 아이콘셋: `assets/icon/*.svg`(lucide 단일 세트 29종, currentColor, viewBox 0 0 24 24) — 제품 아이코노그래피 권위. 인라인 사용, color로 recolor. 상태 3종(success/warning/danger)은 색 박힘.
- 탐색 레퍼런스(코드 값 추출 금지, 룩 참조만): `reference/brand-kit/key-visual.png`(저녁 독서 정물) · `reference/brand-kit/ui-base.png`(모바일 UI 룩) · `view/overview.html`(브랜드 오버뷰) · `view/ui-kit.html`(컴포넌트 쇼케이스).
- **제품 아이코노그래피로 쓰지 않음**: `reference/brand-kit/icon/*.png`(브랜드 컨셉 전시용 PNG). 워드마크는 폰트 모드(Gowun Batang)라 `wordmark-base.png` 없음 — `.wordmark` 클래스로 조판.
- 사용 금지: candidate 시안(logo concepts·iconset 후보)을 확정처럼 참조하는 것.

## 9. Do's & Don'ts
- ✅ 모든 인터랙티브 기본색은 {colors.primary}. 앰버 {colors.accent}는 저장·하이라이트·강조에만 — **2번째 일반 액센트 금지**.
- ✅ 구획은 {border.hairline} 우선, 그림자는 떠야 하는 것만.
- ✅ 저장한 문장 인용은 {typography.accent} 명조; 본문은 {typography.body} sans.
- ✅ 상태는 색 + 아이콘 + 텍스트 병행. 코너 규칙: 책 카드 상태 배지=우상단 / 인용 카드 리본=좌상단.
- ❌ 네온·강한 그라데이션·다크 대시보드·빽빽한 데이터 테이블·게임화 뱃지·진척률 강박 UI.
- ❌ 명조를 장문 본문에 사용. ❌ 인용 카드에 상태 배지 + 리본 동시 사용(중복).
- ❌ 스톡 인물·오피스 사진·클립아트·자물쇠/톱니/지구본 클리셰·3D 베벨.

## 10. 구현 제약
- HTML/CSS: `assets/css/tokens.css` + `assets/css/ui-kit.css`를 그대로 사용. ui-kit.css는 토큰 변수만 참조(하드코딩 0). 색·폰트·radius·shadow는 `var(--token)`.
- React 이식: ui-kit class를 얇은 컴포넌트 래퍼로 감싸 사용(예정: `design-component-export`). 토큰은 CSS 변수로 유지.
- 접근성: 폼 컨트롤 `<label>` 연결, 아이콘 `aria-hidden`/`aria-label`, focus 가시(`:focus-visible`), 색만으로 상태 구분 금지(아이콘·텍스트 병행).
- 반응형: 컨테이너 유동. 핵심 터치 요소 48px 권장. breakpoint 미정의(§7·§12).
- 성능: SVG 인라인(아이콘), 웹폰트는 Gowun Batang/Gowun Dodum/Nanum Gothic Coding CDN.

## 11. Anti-slop checklist
- ✅ 히어로/제목이 2~3줄에 들어오는가 — display/heading 스케일로 제어.
- ✅ 버튼 대비 충분 — primary {colors.primary} on {colors.surface} 텍스트.
- ✅ 의미 없는 blob·glow 없음 — 키비주얼은 도메인 정물, 장식 금지.
- ✅ 섹션 레이아웃 반복 회피 — 카드/리스트/인용 카드 리듬 구분.
- ✅ UI 텍스트가 이미지에 박혀 있지 않음 — 최종 텍스트는 HTML/코드. (단 `reference/`의 ui-base·overview는 탐색 레퍼런스)
- ✅ 컴포넌트 재사용 구조 — 전부 토큰 기반 class.

## 12. Provenance & Known Gaps
- 읽은 입력: `reference/BRAND_KIT.md` · `reference/brand-tokens.json` · `assets/css/tokens.css`(frontmatter 권위) · `assets/css/ui-kit.css`(§5 권위) · `candidate/ui-kit/ui-kit-briefs.md`(§5 의도) · `view/ui-kit.html` · `view/overview.html` · `candidate/brand-kit/brief.md` · 확정 자산(`assets/logo/logo.png`·`assets/icon/*.svg` 29) · 탐색 레퍼런스(`reference/brand-kit/key-visual.png`·`ui-base.png`·`logo-base.png`).
- **frontmatter**: `tokens.css`에서 재컴파일됨(거울, do not edit). tokens.css가 단일 권위.
- **확정 자산 출처**:
  - 로고: `candidate/logo/logo-briefs.md` 존재 — 전용 로고 4안 탐색 후 **brand-kit base 마크로 단일 확정**(사용자 선택). 다크 변형 미생성(필요 시 design-logo 흐름 12).
  - 아이콘셋: **확정됨** — `design-iconset`으로 lucide(ISC) 29종 lock(`assets/icon/icon-map.json` 1:1 검증). gap 0.
- **누락/Gap**:
  - 페이지 브리프·풀페이지 이미지 없음 → §6은 ui-kit 어휘 기반 골격만. 풀 페이지 디자인은 `design-image-mobile`(앱) 후 보강.
  - breakpoint 토큰(`--bp-*`) 없음 → §7 "유동·고정 정의 없음". 정식 반응형은 brand-kit에서 폼팩터 추가 필요.
  - 컨트롤 기본 높이 40px는 권장 터치타깃 44px 미만 — 핵심 터치 요소는 {controls.lg} 48px 권장(근거: tokens.css 관례값).
- 추측 없음 — 모든 값은 tokens.css/ui-kit.css/BRAND_KIT 전사. 근거 얇은 항목 없음.
