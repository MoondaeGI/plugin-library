# 브랜드 킷 이미지 아트 디렉션 가이드

`design-brand-kit`이 **이미지를 생성할 때 참조**하는 아트 디렉션 가이드다. 너는 엘리트 브랜드 아이덴티티 아트 디렉터·로고 디자이너·비주얼 시스템 전략가·프레젠테이션 디자이너다. 목표는 "괜찮은 AI 이미지"가 아니라 **진지한 아이덴티티 스튜디오가 만든 것 같은 프리미엄 브랜드 결과물**이다.

생성은 공유 `image-gen` 스킬의 스크립트(`../image-gen/scripts/image-gen.mjs`, OpenAI Images API 직접 호출, Codex 비의존)로 한다 — 키가 없으면 사람이 외부 도구로 만들어 드롭한다. 이 가이드는 도구 중립으로, 어느 경로든 결과물이 도달해야 할 품질·구성 기준을 정의한다.

## 산출물 (v3 레이아웃)

1. **base 시각 자산 (필수)** — 오버뷰가 끼워넣고 다운스트림이 시드로 쓰는 안정적 PNG 파일들.
   - 자산: `.design/assets/brand-kit/`(확정 캐노니컬 홈 — 제자리 작업).
   - `logo-base.png` — 로고 마크/심볼. **투명**(gpt-image-1.5 + `--background transparent`).
   - `wordmark-base.png` — 워드마크(브랜드명 로고타입). **투명**(gpt-image-1.5 + `--background transparent`). 짧고 또렷하게(한글 글리프 뭉갬 주의).
   - `key-visual.png` — 브랜드 히어로 이미지(단일). 불투명(gpt-image-2).
   - `ui-base.png` — UI 컴포넌트 룩(카드·배지·컨트롤). 불투명(gpt-image-2). **방향 확정 후에만 생산.**
   - `icon/<name>.png` — 오버뷰가 쓰는 개별 컨셉 아이콘(assets/brand-kit/icon/). **투명**(gpt-image-1.5 + `--background transparent`). §2·§4·§9 장식 + §11 쇼케이스 + design-iconset 가족 기준. **방향 확정 후에만 생산.**
2. **종합 브랜드 오버뷰 (필수 · 메인)** — 위 자산을 끼워넣고 데이터 섹션을 토큰에서 렌더한 **HTML 페이지** `overview.html`. AI 래스터 보드가 아니다.
   - 저작 위치: `.design/view/overview.html`(제자리, ../assets/brand-kit/ 참조).
3. **(선택) 추가 탐색 이미지** — 대안 무드·히어로 변형 등. → `.design/assets/brand-kit/`.

**워드마크도 이미지 자산이다**(`wordmark-base.png`, 투명) — 타입페이스/커스텀 레터링을 조건 없이 일관 처리. §1에선 `key-visual` 위에 `<img>`로 얹는다. 컷아웃은 `logo-base`·`wordmark-base`·아이콘.

## 결과물 품질 기준

결과물은 다음처럼 느껴져야 한다: 의도적(intentional)·프리미엄·미니멀·일관성 있음·전략적·시각적으로 비싸 보임·브랜드 시스템 기반·프레젠테이션 준비됨.

만들지 말 것: 평범한 로고, 랜덤 목업, 지저분한 AI 무드보드. **한 장 안에 완결된 브랜드 세계**를 만든다.

## 레퍼런스 스타일 DNA

원하는 시각 품질은 프리미엄 브랜드 가이드라인 덱/원페이저에서 영감을 받는다:

번호 매긴 섹션으로 구획된 클린 그리드 · 섹션 사이 명확한 거터(gutter)와 얇은 디바이더 · 절제된 시각 밀도 · 또렷한 위계(큰 워드마크 → 섹션 타이틀 → 라벨) · 넉넉한 네거티브 스페이스 · 단순하지만 기억되는 로고 마크 · 브랜드 적용으로 쓰인 UI 목업 조각 · 스와치/타입 스페시먼/아이콘 세트 같은 시스템 요소 · 작은 라벨과 섹션 번호 · 절제됐지만 강한 액센트 컬러 · 여러 터치포인트에 반복되는 로고와 액센트 · **보드 하나가 브랜드 전체를 한눈에 설명**.

레퍼런스는 고정된 스타일이 아니다 — **품질 기준·절제·프레젠테이션 논리**를 정의할 뿐이다. (라이트/다크 캔버스, 색, 타이포는 브랜드에 맞게 고른다.)

## 핵심 원칙

프리미엄 브랜드 킷은 장식이 아니다. **이 브랜드가 왜 존재하는지에 대한 시각적 논증**이다.

생성하는 모든 보드는 다음 다섯 질문에 답해야 한다:

1. 이 브랜드는 무엇을 대표하는가?
2. 핵심 메타포는 무엇인가?
3. 로고는 그것을 어떻게 표현하는가?
4. 그 시스템은 UI·프린트·이미지·디테일에 걸쳐 어떻게 확장되는가?
5. 전체가 왜 소유 가능(ownable)하게 느껴지는가?

## 1. 전략 먼저 (의미 기반 디자인)

생성 전에 브랜드 전략을 추론한다: 카테고리 / 타깃 / 제품 기능 / 감정적 약속 / 문화적 위치 / 신뢰 수준 / 시각 세계 / **상징 메타포** / 피해야 할 것. 시각 시스템은 미관이 아니라 **의미**에서 나온다.

카테고리 → 심볼 논리 예시:

| 카테고리 | 핵심 아이디어 | 가능한 심볼 논리 |
|---|---|---|
| 개발자 도구 | 구축·속도·정밀·제어 | 커서, 프레임, 볼트, 스캐폴드, 그리드 |
| AI 어시스턴트 | 위임·지능·명료 | 스파크, 궤도, 시그널, 패스, 노드 |
| 보안 | 보호·경계·감시 | 실드, 눈, 씰, 보호된 코어 |
| 게이밍/베팅 | 운·보상·긴장·속도 | 주사위, 젬, 카드, 시그널, 트로피 |
| 보이스 AI | 소리·리듬·명령·흐름 | 웨이브폼, 마이크, 오브, 스피치 패스 |
| 컴플라이언스 | 신뢰·질서·규칙 | 씰, 배지, 문서, 실드 |
| 드론/로보틱스 | 비행·제어·시야·미션 | 윙, 아울, 크로스헤어, 패스, 존 |
| 럭셔리/에디토리얼 | 취향·소재·의례·절제 | 모노그램, 씰, 종이, 엠보스, 마크 |
| 생산성 | 집중·모멘텀·명료 | 패스, 체크, 블록, 라이트 |

심볼을 랜덤하게 고르지 않는다.

## 2. 로고 생성 표준 (보드 섹션용 요약)

로고는 **단순·기억성·상징적·확장 가능·소유 가능(ownable)·시각적 균형**, 그리고 브랜드 아이디어와 연결되어야 한다. 아이콘·워드마크·배지·UI 마크·패턴으로 쓸 수 있어야 한다. 로고는 **리서치와 축약**에서 나온 느낌이어야 한다.

보드의 "로고 방향" 섹션에는 워드마크 · 모노그램/심볼 컨셉 · 앱 아이콘 · **구성·의미 노트**(왜 이 마크인지)를 함께 보여준다. 컨셉 방법 5가지: 모노그램+의미 · 제품 액션 · 메타포 융합 · 네거티브 스페이스 · 구성 기하.

**보드 프롬프트의 로고 줄은 generic하게 두지 않는다.** `../../references/design/logo-art-direction.md` §7.1 "보드 주입용 압축 블록"(3줄)을 `BRAND_KIT.md §6`의 구성·의미로 채워 §12 템플릿의 `Logo:` 자리에 넣는다. 보드 로고가 떨어지면 같은 ref의 §8 품질 테스트로 판정한다.

> 보드 §6 로고 마크의 형태 언어·컨셉 방법 상세·보드용 압축 블록(§7.1)·품질 테스트(§8)·체크리스트(§9)·피해야 할 클리셰 전체 목록은 **`../../references/design/logo-art-direction.md`** 참조. (독립 로고용 풀 청크 §7은 design-logo가 쓴다 — brand-kit은 보드 §6만 채운다.)

## 3. 종합 오버뷰 보드 — 섹션 시스템 (기본 · 메인)

메인 산출물은 **브랜드 전체를 한눈에 보여주는 HTML 오버뷰 페이지**다. 아래 섹션 시스템은 그 페이지의 정보 구조이고, 각 섹션은 `BRAND_KIT.md` §1–11과 1:1 매핑된다(§12는 md 전용·렌더 안 함). 시각 섹션(§1 히어로·§6 로고·§10 UI·§11 아이콘)은 `assets/*.png`를 `<img>`로 끼워넣고, 데이터 섹션(§2·3·4·5·7·8·9)은 `BRAND_KIT.md`/`brand-tokens.json`에서 HTML/CSS로 렌더한다.

기본 11섹션 (보드용; 각 섹션은 `BRAND_KIT.md`의 §1–11과 1:1 매핑된다 — `BRAND_KIT.md §12 다음 결정 사항`은 작업용 텍스트라 **보드에 렌더하지 않으므로 아래 목록에 없다**):

1. **Brand Overview** — 큰 워드마크/제품명, 한 줄 설명, 포지셔닝 요약. **+ 코너/엣지에서 살짝 블리드되는 대표 분위기 키 비주얼을 항상 포함**(앰비언트 — 텍스트가 주인공, 워드마크와 겹치거나 가독성 해치지 않게). 피사체/모티프는 `BRAND_KIT.md §1 커버 키 비주얼`에서 가져오며 브랜드 도메인·core metaphor에 묶인다. **로고 마크가 아니고**(§6과 중복 금지) **의미 없는 장식 blob도 아니다**(§9 anti-generic 유지). 매체는 비주얼 모드 따라 적응(§7 참조).
2. **Brand Essence** — 미션 / 약속 / 핵심 특성. 각 항목에 작은 아이콘 + 짧은 문구.
3. **Target Audience** — 주 사용자 · 상황/제약 · 니즈. 아이콘 + 짧은 라벨.
4. **Value Pillars** — 3~4개 가치 기둥 카드. 각 카드: 아이콘 + 제목 + 한 줄 설명.
5. **Tagline Options** — 번호 매긴 태그라인 2~3개.
6. **Logo Direction** — 워드마크 + 모노그램/심볼 컨셉 + 앱 아이콘 + 구성·의미 노트.
7. **Color System** — 스와치 그리드 + 각 색 HEX + 용도 라벨.
8. **Typography** — 타입 스케일(Display / H1 / H2 / Body / Caption / Label)과 폰트, 짧은 샘플 문장.
9. **Voice & Tone** — 원칙 3~4개. 각 원칙은 "X, not Y" 라벨 + 그 아래 짧은 O/X 예시 한 쌍(do/don't). 예: "명료하게, 모호하지 않게" 아래 O "유출이 감지되었습니다." / X "유출이 확인된 것 같습니다.".
10. **Visual & UI Direction** — 카드 / 상태 배지 / 컨트롤 같은 미니 UI 목업 조각으로 분위기 제시.
11. **Imagery / Iconography** — 아이콘 세트 + 스타일 노트(선 굵기, 조인, 톤).

**§12 '다음 결정 사항(Next Decisions to Confirm)'은 의도적으로 보드 이미지에 넣지 않는다 — `BRAND_KIT.md` 전용 작업 섹션이며 보드는 위 §1–11만 그린다.** 섹션 수·순서·이름은 제품에 맞게 조정 가능하지만, **로고 외에 최소 8개 이상의 의미 있는 섹션**이 한눈에 들어오게 한다. 모든 섹션이 똑같이 시끄럽지 않게 리듬을 둔다: 큰 커버(개요) → 기능적(에센스·가치) → 시스템(색·타이포) → 적용(UI·아이콘).

### 허용 변형

콘텐츠가 적거나 무드보드성 결과를 원하면 더 미니멀·시네마틱한 레이아웃도 가능: `3×3` 풀 아이덴티티 / `2×3` 시네마틱 덱 개요 / `2×2` 컴팩트 컨셉 보드 / `1×3` 가로 브랜드 스트립. 단 **기본값은 위 종합 11섹션(§1–11) 보드**이며, 사용자가 명시적으로 요청할 때만 변형으로 간다.

### HTML 오버뷰 레이아웃 스펙 → `references/brand-kit-html-direction.md`

`overview.html` 저작 규칙(포스터 원칙·섹션 매핑·고정 로고·autocrop 전제·CSS 스켈레톤)은 **`brand-kit-html-direction.md`**로 분리했다. 오버뷰를 만들 땐 그 파일을 읽는다. (이 가이드는 이미지 자산의 아트 디렉션을 담당.)

## 4. 비주얼 모드 (브랜드에 맞게 선택)

- **다크 디벨로퍼/빌더** (개발툴·코딩 에이전트·인프라·자동화): near-black 패널, 모노스페이스 액센트, 커맨드 라인/터미널/프롬프트 바, 미묘한 그리드, cyan/blue/coral/lime 액센트, 필요 시 픽셀/CRT 텍스처. 로고: cursor+frame, bolt+속도, scaffold+모노그램, 터미널 글리프+심볼. 무드: 정밀·날카로움·자신감·빌더 네이티브.
- **다크 프로덕트/오퍼레이터** (비즈/그로스/세일즈/생산성): black/dark red/amber, 글로우 UI 칩, 카드 시스템, 세그먼트 플로우, 아이콘 행, 리워드/진행 모티프, 미니멀 히어로 텍스트. 로고: signal/gift/path/switch/loop/오퍼레이터 마크. 무드: 빠름·운영적·전술적·프리미엄.
- **라이트 클린/SaaS** (생산성·보안·B2B SaaS·핀테크): warm white/mist 배경, 또렷한 섹션 그리드, 채도 있는 single 액센트(teal/green/blue 등), soft rounded 카드, 깔끔한 데이터 시각화, 라이트 모드 UI 목업. (WEASEL 예시 계열.) 무드: 신뢰·명료·접근 가능·전문적.
- **다크 네이처/캄 시스템** (전략·트래블·웰니스·기후·조용한 프리미엄 SaaS): deep green + lime 액센트, 안개 낀 풍경, 이미지 UI 원, 소프트 오버레이, 차분한 페이지 라벨, 다크 에디토리얼 그리드. 로고: path/leaf/moon/horizon/compass/portal/folded mark. 무드: 차분·신뢰·집중.
- **다크 시큐리티/위협 인텔** (보안·컴플라이언스·모니터링·네트워크): black/navy, 실드 폼, 레이더 라인, 위협 라벨, 미묘한 모션 트레이스, red/blue 알림 칩, 통제된 그라데이션. 로고: shield/raptor/eye/watch/boundary/protected core. 무드: 진지·경계·정밀.
- **라이트 에디토리얼/컴플라이언스** (법률·프라이버시·문서·신뢰): warm ivory, 종이 텍스처, 작은 세리프 라벨, 씰/배지, 컬러 휠/팔레트 오브젝트, 차분한 스테이셔너리, deep blue/red/gold 액센트. 로고: seal/badge/document/stamp/monogram. 무드: 신뢰·세련·기관적이되 모던.
- **럭셔리/뷰티/패션** (뷰티·패션·호스피탈리티·프리미엄 서비스): ivory/stone/espresso, 세리프 워드마크, 엘레강트 모노그램, 종이 그레인, 엠보싱, 제품 라벨, 에디토리얼 크롭, 소프트 섀도. 로고: monogram/seal/petal/vessel/refined typographic mark. 무드: 고급·성숙·비싸 보임.
- **보이스/커뮤니케이션** (보이스 AI·챗·어시스턴트·오디오): dark indigo, lilac glow, 웨이브폼, 마이크 모티프, 폰 크롭, 커맨드 인풋, 앱 아이콘. 로고: wave+이니셜/sound orb/speech path/마이크 추상/pulse ring. 무드: 유려·지적·친밀.
- **컬처럴/실험적** (음악·창작툴·이벤트·게이밍 인접): 하프톤, CRT 텍스처, 아날로그 프린트, 볼드 액센트, 포스터형 패널, 예상 밖 크롭. 로고: 커스텀 워드마크/태도 있는 아이콘/심볼릭 마스코트/프린트 마크. 무드: 기억성·창의적이되 통제됨.

## 5. 색 규율

하나의 지배적 팔레트: base + primary accent + secondary accent + neutrals. 액센트는 섹션 전반에 **반복**된다. 랜덤 무지개·싸구려 네온 금지, 정당화 없는 보라-파랑 AI glow 금지. 액센트 하나가 전체 시스템을 끌고 갈 수 있다.

Color System 섹션에는 스와치마다 **HEX 값과 용도**를 함께 적는다 (예: `Primary 500 #13B8A5 — 핵심 액션·링크·하이라이트`, `Amber — 경고`, `Alert Red — 고위험 알림`). 권위 있는 값은 `brand-tokens.json`에 있고, 보드는 그것을 시각화한다.

참고 팔레트: black+cyan+muted coral / black+red+cream+blue / forest green+lime+fog gray / navy+white+steel / ivory+deep blue+red+gold / black+lilac+soft purple / black+amber+red / teal+navy+mist gray.

## 6. 텍스트 규칙

> 이 종합 보드는 **텍스트를 담는 브랜드 원페이저**다. 기존 "이미지에 텍스트 최소" 규칙은 이 보드에 한해 완화한다 — 단, **읽히고 위계가 또렷할 때만**.

**언어: 보드의 보이는 텍스트(섹션 타이틀·라벨·태그라인·미션/약속·UI 카피 등)는 한국어로 렌더한다.** 제품·타깃이 영어권이면 한/영 병기도 가능. 단 한글 글리프는 모델이 부정확하게 렌더할 수 있으니 **짧고 또렷한 한국어 라벨**을 쓰고, 정확한 문구의 권위 원본은 `BRAND_KIT.md`에 둔다.

- 담아야 할 것: 섹션 번호·타이틀, 워드마크/제품명, 한 줄 설명, 미션/약속/특성 짧은 문구, 태그라인 옵션, 가치 기둥 한 줄 설명, 색 HEX + 용도, 타입 스케일(예: `Display 48/60`), 보이스 원칙 "X, not Y" + 각 원칙의 짧은 O/X 예시 문구. (다음 결정 체크리스트는 `BRAND_KIT.md §12` 전용 — 보드에는 넣지 않는다.)
- **보이스 O/X 예시는 authored 짧은 한국어 문구**(`BRAND_KIT.md §9`)를 그대로 렌더한다 — 모델이 지어내지 않는다. 원칙당 한 줄, 3~4개로 제한해 섹션이 빽빽해지지 않게.
- 피할 것: 긴 문단, 가짜 본문(lorem ipsum), 안 읽히는 작은 텍스트, 빽빽한 밀도. 각 줄은 **짧고 또렷하게**.
- 태그라인은 짧고 구체적으로 (예: "Quiet security for small teams.", "See the leak. Keep the workflow.", "Evidence-first DLD."). 일반 기업 슬로건·버즈워드·가짜 영감 문구 금지.
- 보드 전체가 한 타입 시스템: UI 목업·HEX·숫자 등 데이터 텍스트도 선언한 폰트로, 숫자는 mono/탭ular numerals로 — 단 한글 라벨·본문은 본문 서체 유지(한글을 모노로 만들지 않는다).

> **권위 원본은 이미지가 아니라 `BRAND_KIT.md`/`brand-tokens.json`이다.** 보드는 그 내용을 시각화한 한눈에 보는 원페이저일 뿐 — 보드 텍스트와 md/tokens가 어긋나면 md/tokens가 정답이다. 정확한 HEX·폰트 스펙은 항상 md/tokens에서 확정한다.

> **폰트는 `../../references/design/font-catalog.md`의 실존 폰트만.** 보드 Typography 섹션엔 실제 폰트명을 라벨로 적되, 이미지 프롬프트엔 폰트명이 아니라 **타입 스타일**(카탈로그의 성격 한 줄: 예 "low-contrast geometric sans", "high-contrast modern serif")을 묘사한다 — gpt-image는 폰트 파일을 로드하지 않고 스타일만 근사하므로 이름만 적으면 반영되지 않는다.

## 7. 이미지·목업 디렉션

- **§1 커버 키 비주얼 (강제)**: §1 Brand Overview에는 항상 브랜드 대표 분위기 비주얼을 **코너/엣지에서 부드럽게 블리드**시킨다 — 앰비언트로, 워드마크·설명·포지셔닝 텍스트가 주인공이고 비주얼은 가독성을 해치지 않는다. 피사체는 `BRAND_KIT.md §1 커버 키 비주얼`(도메인·core metaphor에 묶인 것). **매체는 비주얼 모드에 따라 적응한다** — 라이트 클린/SaaS·네이처/캄·럭셔리/뷰티·에디토리얼·보이스 모드는 **큐레이트된 도메인 피사체 사진**(소프트 라이트, 팔레트 일치)으로, 다크 디벨로퍼/빌더·컬처럴/실험·다크 시큐리티처럼 사진이 안 맞는 모드는 **분위기 그래픽/렌더 모티프**(텍스처 패널·메타포 추상 폼)로 같은 코너 앰비언트 처리를 한다. **로고 마크가 아니고**(§6과 중복 금지) generic 스톡 인물·오피스 사진·의미 없는 장식 blob이 아니다. 아래 "스톡 사진 금지"의 의도된 큐레이트 예외다.
- **이미지/아이콘**: 의미 있고 일관된 시각 — **아이콘 스타일은 `BRAND_KIT.md §11`이 확정한 하나를 그대로 따른다** (line / filled / duotone / solid glyph / outline+minimal-fill 중). line이라고 가정하지 않는다 — 형태 규칙은 그 스타일에 맞춰 묘사한다(line이면 일관된 스트로크·둥근 조인, filled면 일관된 fill·코너 반경, solid glyph면 단단한 실루엣). 도메인 메타포를 전달하는 심볼. 금지: 일반 스톡 인물, 랜덤 오피스 사진, 클리셰 로봇, 과밀 씬, 무관한 이미지. 팔레트·메타포와 일치. **아이콘 세트의 깊은 시스템 스펙(스타일별 형태·그리드·상태)·프롬프트 청크는 `../../references/design/icon/icon-rules.md` 참조.** 스타일 선택은 `icon/icon-style-catalog.md`, 도메인 메타포는 `icon/icon-domain-examples.md`(도메인 섹션만) — 결정은 `BRAND_KIT.md §11`에 증류돼 있다.
- **목업**: 미니멀하고 믿을 만하게 — 브라우저 크롬, URL 바, 앱 아이콘, soft rounded 카드, 상태 배지, 미니멀 컨트롤, 활동 리스트 조각, 대시보드 조각. 금지: 데이터 과밀 가짜 대시보드, 싸구려 글로시 목업, 디바이스 과잉, 빽빽한 앱 화면, 아이콘 과잉. **목업은 기능 데모가 아니라 아이덴티티 적용이다.**

## 8. 프리미엄 디테일 언어

작은 섹션 번호, 작은 푸터 라벨, 정렬 마크, 얇은 디바이더 룰, 미묘한 그리드, 브라우저 바, 라운드 사각형, 이미지 마스크, 소프트 섀도, 저투명 텍스처, 강조 단어 하나, 액센트 칩 하나, 강한 아이콘 상태 하나. **남용 금지** — 디테일은 가까이 봤을 때 보상이 되어야 한다.

## 9. anti-generic (절대 만들지 말 것)

랜덤 떠다니는 아이콘, 일반 스타트업 그라데이션, 과설계 로고, 의미 없는 blob, 지저분한 콜라주, 가짜 작은 UI, 일관성 없는 로고 변형, 색 과다, 싸구려 네온, 스톡 템플릿 보드, 기업 파워포인트 슬라이드, 영혼 없는 SaaS 대시보드. → 더 조용하고, 더 날카롭고, 더 의도적으로.

## 10. 레퍼런스 사용 (사용자가 참고 이미지를 줄 때)

추출할 것: 레이아웃 리듬, 그리드 스타일, 간격, 타이포 스케일, 시각 밀도, 로고 배치, 텍스트 양, 이미지 처리, 액센트 컬러 논리, 브랜드 시스템 동작.

복제하지 말 것: 정확한 로고, 정확한 브랜드명, 정확한 구성, 정확한 슬로건, 고유 비주얼 에셋.

레퍼런스는 **품질 훈련용**이지 템플릿이 아니다.

## 11. 우리 파이프라인 연결

- **입력**: `BRAND_KIT.md`(개요·에센스·타깃·가치·태그라인·로고 방향·보이스·금지 패턴)와 `brand-tokens.json`(색·타이포 토큰)에서 전략·콘텐츠·팔레트·타이포를 읽어 보드 각 섹션에 반영한다. 보드는 `BRAND_KIT.md`의 §1–11을 렌더하며 1:1로 대응한다 — **§12 다음 결정 사항은 md 전용이라 보드에 렌더하지 않는다.**
- **권위**: 색 HEX·폰트 스펙·문구의 정답은 md/tokens. 보드는 그것을 한눈에 보는 시각 원페이저로 렌더한다. 폰트 스펙의 실존 출처는 `../../references/design/font-catalog.md`이며, 토큰의 font-family는 거기서 고른 실존값이다.
- **저장**: `image-gen` 스크립트의 `--out`에 **프로젝트 cwd 기준 절대 경로**를 직접 지정한다(스크립트가 거기 바로 씀).
  - **작업 자산**: 이미지를 `<cwd>/.design/assets/brand-kit/`에 `--auto-version`으로 저장(예: `logo-base.png` → `logo-base-v2.png` 누적).
  - **락**: 확정 자산은 `.design/assets/brand-kit/`에 제자리(`logo-base.png`·`wordmark-base.png`·`key-visual.png`·`ui-base.png`·`icon/<name>.png`) — 별도 복사 없음, `--auto-version`으로 시안 누적.
  - **오버뷰**: `overview.html`을 `.design/view/overview.html`에 LLM이 제자리 저작(이미지 생성 아님).
- **협업 루프**: 방향 확정(발산·방향 선택은 SKILL.md 흐름 + `references/brand-kit-contact-sheet.md`) 후, 확정 방향의 자산을 한 장씩 생산한다 — **첫 생성만 텍스트→이미지, 이후 모든 수정·수렴은 직전 이미지를 `--image`로 첨부한 증분 편집으로 한 가지씩** 고쳐 재생성(gpt-image-2 는 입력 이미지를 항상 high fidelity로 처리 — 나머지 보존, 한 가지만 변경). 추가 탐색은 한 장씩. (로고는 보드 §6 섹션으로만 들어가고, 독립 로고는 design-logo가 만든다.)

## 12. 프롬프트 템플릿 (내부 구조)

`image-gen` 스크립트에 `--prompt-file`로 넘길 프롬프트를 다음 구조로 구성한다(브리프의 "이미지 생성 Prompt"에 반영):

```text
Create a comprehensive brand-kit overview board ("brand guidelines one-pager") for "[BRAND NAME]".

Brand strategy:
- category: [category]
- audience: [audience]
- personality: [traits]
- core metaphor: [metaphor]
- logo idea: [symbol + name + category meaning를 어떻게 결합하는지]

Layout: single board, [light/dark] canvas, clean numbered-section grid with strong gutters and thin dividers, generous whitespace, clear hierarchy. At-a-glance, scannable.

Sections (each labeled and legible):
1. Brand Overview (large wordmark + one-line description + positioning) WITH a brand-representative atmospheric cover key visual bleeding softly from one corner/edge — [BRAND_KIT.md §1 커버 키 비주얼: subject/motif], rendered as [curated domain subject photography | atmospheric textured graphic/rendered motif] to match the visual mode, palette-consistent, ambient and low-key so it never overlaps the wordmark or hurts legibility. NOT the logo mark, NOT a meaningless decorative blob, NOT generic stock people/office.
2. Brand Essence (mission / promise / core traits, small icons)
3. Target Audience
4. Value Pillars (3–4 cards with icon + title + one line)
5. Tagline Options (2–3, numbered)
6. Logo Direction (wordmark + monogram concept + app icon + construction/meaning note)
7. Color System (swatches with HEX + usage)
8. Typography (type scale: Display/H1/H2/Body/Caption/Label)
9. Voice & Tone — for each of 3-4 principles show the "X, not Y" label AND a short do/don't example beneath: a good line (O / ✓) and a bad line (X / ✗). Render the authored Korean phrases [from BRAND_KIT.md §9] exactly as given; do NOT invent copy. Keep each example to one short line.
10. Visual & UI Direction (mini UI mockups: cards, status badges, controls)
11. Imagery / Iconography (icon set + style note)
All section icons (Essence, Target, Value Pillars, Imagery) follow ONE icon system defined in BRAND_KIT.md §11 — the SAME style chosen there (line / filled / duotone / solid glyph / outline+fill — do NOT default to line), with consistent form rules for that style (line → uniform stroke weight + join/terminal [round OR square per §11 — do NOT default to rounded]; filled → uniform fill + corner radius; glyph → solid silhouette), a shared grid, and one metaphor language. No section uses a different icon look.

Do NOT render a "Next Decisions" / "다음 결정" section, nor any checklist of pending or to-confirm decisions, on the board — that lives only in BRAND_KIT.md, never on the image.

Visual mode: [모드]
Palette: [절제된 팔레트 — brand-tokens.json 기반, single dominant accent]
Style: premium, clean, intentional, polished brand-guidelines one-pager, no clutter, no copied real-world logos.
Typography: readable, organized, high hierarchy; render labels/HEX/type-scale legibly; for each typeface show its name as a label AND render text in its described style (e.g. "geometric low-contrast sans", "high-contrast modern serif") per the font catalog — the model approximates the style, not a literal font file; no tiny fake body text, no lorem ipsum.
Type consistency: all sections (UI mockups, HEX values, type-scale figures, numeric/data text) use the same declared type system; render numbers as tabular/monospaced figures — but keep Hangul labels/body in the body face (do NOT monospace Korean text).
Language: render visible text in Korean (Hangul) — short, legible labels; bilingual KR/EN only if the brand is English-facing.
Logo Direction section: show ONE well-crafted mark in a few clean placements only — (1) symbol + wordmark lockup, (2) the standalone symbol on its own, (3) favicon + app-icon tile (small size), (4) a one-line construction/meaning note. Restrained — NOT an exploration sheet, NOT a row of many logo variants.
Mark concept: [BRAND_KIT.md §6 구성·의미], built on [grid / diagonal cut / orbit / frame], single consistent stroke weight, strong silhouette, legible at favicon size, valid in solid monochrome; the symbol reads on its own without the name.
Avoid (logo): shield/lock/globe/gear clichés, meaningless gradient/3D bevel/sparkle, letters-only logo, a grid/sheet of many logo variations.
```

> 위 마지막 3줄(`Logo Direction section:` ~ `Avoid (logo):`)은 `../../references/design/logo-art-direction.md` §7.1 압축 블록이다 — `[BRAND_KIT.md §6 구성·의미]`·`[grid / ...]` 브래킷을 이 브랜드의 실제 마크 컨셉·기하로 채워 넣는다. 비워두거나 generic 문구로 두지 않는다.

발산 오케스트레이션·3방향 가이드는 SKILL.md 흐름과 `references/brand-kit-contact-sheet.md` 참조.

**증분 편집(수정·수렴)**: 첫 생성 이후의 모든 수정은 직전 이미지를 `--image`로 첨부해 보낸다(SKILL.md "이미지 생성" 참고; gpt-image-2 는 입력 이미지를 항상 high fidelity로 처리). 이때 프롬프트는 위 풀 템플릿이 아니라 **바꿀 한 가지만** 기술한다 — 예: "9번 Voice & Tone 섹션의 O/X 예시 문구만 …로 교체, 나머지 섹션·색·레이아웃은 그대로 유지". 풀 템플릿을 다시 넣으면 편집이 아니라 재생성이 되어 나머지까지 바뀐다.

> 로고는 보드 §6 "Logo Direction" 섹션으로만 그린다 — 독립 로고 이미지는 brand-kit에서 만들지 않는다. 확정 로고는 design-logo가 이 보드 §6을 읽어 만든다.

## 최종 기준

결과물은 **프리미엄 브랜드 가이드라인 원페이저 / 시니어 디자이너의 프레젠테이션 보드 / 브랜드 시스템 케이스 스터디**처럼 보여야 한다 — 깔끔·전략적·상징적·일관·프리미엄·아트 디렉션됨·구현 친화적, 그리고 **로고를 포함한 브랜드 전체가 한눈에 들어오게**, 일반 AI 브랜드 비주얼보다 강하게.
