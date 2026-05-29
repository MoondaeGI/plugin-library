# 폰트 카탈로그 (Font Catalog)

브랜드 킷·페이지 이미지의 타이포그래피를 정할 때 읽는 **실존 폰트 카탈로그**다. 도구 중립 — `design-brand-kit §8`이 직접 읽고, 그 결과(토큰)를 `design-html-prototype`·`design-md-compiler`가 소비한다.

## 왜 이 파일이 있나

모델이 폰트명을 지어내면(환각) 토큰에 가짜 font-family가 박혀 구현이 깨진다. **폰트는 반드시 이 카탈로그에서만 고른다.** 더 보고 싶으면 전체 한글 폰트 목록: https://fonts.google.com/?subset=korean

## 이미지 생성기 전제 (중요)

gpt-image는 **폰트 파일을 로드하지 않는다.** "Pretendard"라고 적어도 그 글리프를 그대로 렌더하지 않고 *타입 스타일*만 근사한다. 그래서:
- 보드 이미지의 폰트명은 **문서용 라벨**이고, 이미지 프롬프트엔 폰트명보다 **성격(아래 한 줄 묘사)**을 적어야 근사가 맞는다.
- 폰트가 **실제 쓰이는 곳은 토큰 다운스트림**(웹폰트 로드)이다 — 거기서 실존·로드 가능 여부가 기능적으로 중요.

## 두 층 원칙

- **검증 백본(기계)**: 이름·한글·라이선스는 Google Fonts/파운드리 출처로 실존 확인됨 → 환각 차단.
- **큐레이션(사람)**: 성격 한 줄·역할·폴백·페어링 — 선택·프롬프트 묘사에 쓰임.
- **specimen URL(눈)**: 사용자가 클릭해 실제 모양 보고 확정.

## 선택 가이드 (폰트 모를 때)

- body/UI → 중립 sans
- heading/display → 임팩트/성격 있는 display 또는 sans bold
- editorial 무드 → 명조/세리프
- mono/데이터 → 고정폭 (숫자는 라틴 모노 + 한글 sans 폴백 허용)
- 보통 display+body 2개 페어면 충분. 과하게 섞지 않는다.

---

## Sans (body / heading / UI)

항목 형식: **폰트명** — 역할 · 성격 한 줄 · 한글 Y · 라이선스 · URL · 폴백 스택

- **Pretendard** — body/heading · 저대비 기하 sans, 균일한 획 굵기, 모던 중립 · 한글 Y · OFL · https://github.com/orioncactus/pretendard · `"Pretendard", -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Noto Sans KR** — body/heading · 균등한 스트로크, 고중립 범용 sans, 화면·인쇄 모두 무난 · 한글 Y · OFL · https://fonts.google.com/specimen/Noto+Sans+KR · `"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **IBM Plex Sans KR** — body/heading · 날카로운 인크 트랩, 테크·기업 분위기 sans · 한글 Y · OFL · https://fonts.google.com/specimen/IBM+Plex+Sans+KR · `"IBM Plex Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Gothic A1** — body/heading · 전형적 한국 고딕, 균형 잡힌 줄기 굵기, 친숙한 가독성 · 한글 Y · OFL · https://fonts.google.com/specimen/Gothic+A1 · `"Gothic A1", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **SUIT** — heading/UI · 본문보다 살짝 각진 UI 최적화 sans, 숫자 가독성 우수 · 한글 Y · OFL · https://github.com/sun-typeface/SUIT · `"SUIT", "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Spoqa Han Sans Neo** — body/UI · Noto 기반 경량 커스텀 sans, 화면 가독성 개선, 얇은 획 · 한글 Y · OFL · https://spoqa.github.io/spoqa-han-sans/ · `"Spoqa Han Sans Neo", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Gowun Dodum** — body · 부드러운 곡선 말단, 저강도 대비, 친근하고 온화한 읽기용 · 한글 Y · OFL · https://fonts.google.com/specimen/Gowun+Dodum · `"Gowun Dodum", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Nanum Gothic** — body · 획 끝 약간의 붓 기운, 한국 화면 기본 sans, 폭넓은 지원 · 한글 Y · OFL · https://fonts.google.com/specimen/Nanum+Gothic · `"Nanum Gothic", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

---

## Display (heading / 임팩트)

- **Black Han Sans** — display · 단일 웨이트 초고딕, 극도로 좁고 굵은 블록형 stroke, 강한 임팩트 · 한글 Y · OFL · https://fonts.google.com/specimen/Black+Han+Sans · `"Black Han Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Do Hyeon** — display · 둥근 코너 고딕, 획 끝이 원형으로 마감, 캐주얼하고 경쾌한 분위기 · 한글 Y · OFL · https://fonts.google.com/specimen/Do+Hyeon · `"Do Hyeon", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Jua** — display · 두툼하고 유기적 곡선, 손맛 느낌의 볼드 sans, 어린이·친근 콘셉트 · 한글 Y · OFL · https://fonts.google.com/specimen/Jua · `"Jua", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Gasoek One** — display · 초광폭 단일 블랙, 획이 꽉 찬 full-width 수직 압축 고딕 · 한글 Y · OFL · https://fonts.google.com/specimen/Gasoek+One · `"Gasoek One", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **LINE Seed KR** — display/UI · 라운드 기하 sans, 영문과 동일 DNA 디자인 시스템 패밀리, 부드럽고 현대적 · 한글 Y · OFL · https://seed.line.me/index_kr.html · `"LINE Seed KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

- **Gmarket Sans** — display · 가변 웨이트 3종, 획 말단이 약간 직선으로 마감된 친근 고딕 · 한글 Y · OFL · https://corp.gmarket.com/fonts/ · `"Gmarket Sans", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`

---

## Serif / 명조 (editorial)

- **Noto Serif KR** — serif · 고대비 명조, 균형 잡힌 세리프 삐침, 전통 편집 인쇄 느낌 · 한글 Y · OFL · https://fonts.google.com/specimen/Noto+Serif+KR · `"Noto Serif KR", "Apple SD Gothic Neo", Georgia, serif`

- **Nanum Myeongjo** — serif · 붓 기반 전통 명조, 획 대비 뚜렷, 격조 있는 문학·에세이 분위기 · 한글 Y · OFL · https://fonts.google.com/specimen/Nanum+Myeongjo · `"Nanum Myeongjo", "Apple SD Gothic Neo", Georgia, serif`

- **Gowun Batang** — serif · 세리프 끝단이 부드럽게 처리된 현대 명조, 온라인 장문 가독성 개선 · 한글 Y · OFL · https://fonts.google.com/specimen/Gowun+Batang · `"Gowun Batang", "Apple SD Gothic Neo", Georgia, serif`

- **Hahmlet** — serif · 굵기 대비 중간, 클래식 비례의 현대 명조, 에세이·소설 레이아웃 적합 · 한글 Y · OFL · https://fonts.google.com/specimen/Hahmlet · `"Hahmlet", "Apple SD Gothic Neo", Georgia, serif`

- **Song Myung** — serif/display · 고전 송조체 스타일, 획 말단이 뾰족하게 각지고 묵직한 수직 줄기 · 한글 Y · OFL · https://fonts.google.com/specimen/Song+Myung · `"Song Myung", "Apple SD Gothic Neo", Georgia, serif`

---

## Mono / 데이터

- **Nanum Gothic Coding** — mono · 한글 지원 고정폭, 코드 편집기·터미널 가독성 최적화, 균일 셀 폭 · 한글 Y · OFL · https://fonts.google.com/specimen/Nanum+Gothic+Coding · `"Nanum Gothic Coding", "D2Coding", "Courier New", monospace`

---

## 상용 (소수 · 라이선스 주의)

**Apple SD Gothic Neo**는 macOS/iOS 시스템 폰트로, 구매·다운로드 불가. CSS 폴백 스택에서 시스템 폴백으로만 사용하고 브랜드 토큰의 primary font-family로 지정하지 않는다.

> 검증 가능한 상용 폰트 제품이 적으므로, 추가 상용 한글 폰트가 필요하면 산돌(https://www.sandollcloud.com/), 윤디자인(https://www.yoondesign-m.com/), 또는 [Google Fonts 한글 목록](https://fonts.google.com/?subset=korean)에서 직접 확인한다.

---

## 추천 페어링

모두 이 카탈로그 안에서 검증된 폰트끼리의 조합이다.

| 무드 | Display / Heading | Body | 비고 |
|---|---|---|---|
| 현대 제품·SaaS | **SUIT** Bold | **Pretendard** Regular | 기하 sans 통일, 차분하고 클린 |
| 테크·데이터 | **IBM Plex Sans KR** SemiBold | **Noto Sans KR** Regular | IBM Plex 계열의 코드 친화 분위기 |
| 편집·에세이 | **Black Han Sans** | **Nanum Myeongjo** Regular | 강한 헤드라인 + 전통 명조 본문 대비 |
| 친근·라이프스타일 | **LINE Seed KR** Bold | **Gowun Dodum** Regular | 둥근 라인 통일, 소프트하고 따뜻한 톤 |
| 브랜드·커머스 | **Gmarket Sans** Bold | **Gothic A1** Regular | 가독성 중심, 범용 친숙 |
