# ppt-analyze-source 스킬 신설 + ppt-plan 게이트 1 슬림화 — 설계

- 날짜: 2026-06-15
- 대상: 신규 `skills/ppt-analyze-source/SKILL.md`, 수정 `skills/ppt-plan/SKILL.md`
- 선행: 같은 날짜 `ppt-plan-image-data-source-design.md`(이미지 데이터화)를 **흡수·확장**한다 — 이미지 분기·추출 수치 always 확인 로직이 ppt-plan에서 새 스킬로 이전된다.

## 배경·문제

ppt-plan 게이트 1(자료)은 자료 출처를 정해 읽고 소화하는 단계다. 직전 작업으로
이미지 데이터화를 게이트 1에 직접 넣었으나, 자료원이 늘수록(코드베이스·로컬
문서 폴더·URL·git 작업내역 등) 게이트 1에 분기를 계속 하드코딩하면 저마찰성이
훼손되고 비대해진다. 자료원별 "어떻게 분석하나"의 복잡도를 **전용 스킬로 분리**해
ppt-plan은 "자료원 식별 → 분석 위임"으로 가볍게 유지한다.

## 범위

1. **신규 스킬 `ppt-analyze-source`** — 자료원 하나(또는 여럿)를 받아 발표용
   핵심 주장·숫자·구조를 끌어내 요약·확인받고 `.slides/<덱>/sources.md`에 저장.
2. **`ppt-plan` 게이트 1 슬림화** — 자료원 메뉴·분석법·이미지 always 확인 블록을
   새 스킬로 이전하고, 게이트 1은 위임만 남긴다.

## 확정된 결정

1. **분석 산출물은 `.slides/<덱>/sources.md`로 영속.** outline.md 근거의 추적성을
   확보하고 ppt-create도 참조 가능.
2. **위임 원리는 포터블.** 전용 스킬 있으면 위임 → 없으면 세션 기본 도구 → 없으면
   사용자 요청. Claude/Codex 한쪽만 도는 경로를 만들지 않는다.
3. **코드베이스 기본값 = 직접 탐색**(Read/Grep/git log). understand-anything 류는
   "코드베이스가 너무 크거나 낯설어 구조 지도가 필요할 때"만 위임 — 기본 아님.
   (understand-anything은 무겁고 사람용 시각 산출물 중심이라 기본 위임은 비효율.)
4. **추출 수치는 always 사람 확인.** 이미지·OCR·비전 수치는 `원본 → 읽은 값`
   목록으로 따로 제시, 사용자 대조가 최종 권위. (직전 스펙 결정 계승.) — 실측에서
   per-fragment OCR이 햄릿 독백·인물 메모 같은 **환각**을 뱉고 `124 / 3명 / 18건`을
   `1243명`으로 **뭉개고** 유저-점수 매핑을 뒤섞었다. 따라서 OCR/비전 생출력은 신뢰
   금지: 거부·사과("I'm sorry…")·문서와 무관한 라인은 폐기하고 숫자는 사람이 대조한다.
5. **subagent 리뷰어·신뢰도 점수 없음.** (직전 스펙 결정 계승.)
6. **시각 자료는 "요소 단위"로 판별한다 — 네이티브는 추출, 래스터만 비전.**
   파일을 통째로 "시각적/텍스트" 판정하지 않고, 각 요소가 데이터를 XML에 텍스트로
   품은 **네이티브**(본문·`<w:tbl>` 표·`chartN.xml` 차트·PDF 텍스트 레이어)인지,
   픽셀로 구워진 **래스터**(붙여넣은 차트 PNG·스캔·스크린샷)인지로 가른다.
   - **네이티브 → 추출**: `markitdown`(있으면)이 본문·표·네이티브 차트를 정확·무료·
     결정적으로 뽑는다. 없으면 폴백(결정 7).
   - **래스터 → 비전 + always 확인**: 추출이 못 읽는 픽셀 수치만 비전으로 읽는다.
   - **판별 신호(결정적):**
     - zip 포맷(.docx/.pptx/.xlsx): 아카이브를 풀어 `word|ppt/media/`(래스터)·
       `charts/`(네이티브 차트)·`embeddings/`(OLE) 존재를 프로브하고 markitdown
       출력의 `![](…)` 마커를 센다. 깃발 꽂힌 래스터 바이트만 꺼내 비전에 넘긴다
       (full-page 렌더 불필요 — 임베드 이미지 자체가 이미 잘린 그림).
     - PDF: 쪽당 텍스트 글자수 vs 이미지 개수로 판별. 텍스트 충실하면 markitdown
       plain, 텍스트 희박+이미지 多(슬라이드/스캔형)면 **pymupdf로 페이지째 렌더 →
       full-page 비전**(per-fragment OCR보다 환각·오매핑이 없음 — 실측).
     - OLE 레거시(.doc/.xls): zip 프로브 불가 → `LibreOffice` headless로 docx/PDF
       정규화 후 위 프로브를 동일 적용. (`.xls`는 `markitdown[xls]`로 직접도 가능 — 실측.)
   - **per-fragment markitdown-ocr 플러그인은 폐기**한다. 이미지를 조각내 맥락 없이
     OCR해 환각·노이즈·숫자 뭉갬이 심했다(실측). 슬라이드 PDF는 full-page 렌더가,
     Office 임베드는 media 바이트 직접 비전이 모든 면에서 우월.
7. **markitdown·LibreOffice·pymupdf는 선택 가속기(전역), 하드 의존성 아님.**
   저장소 `package.json`에 넣지 않는다(범용 파이썬 도구라 전역이 적절). 폴백 사다리:
   전용 변환/렌더 도구 있으면 쓰고 → 없으면 세션 기본 도구(Claude Read 등) → 그것도
   안 되면 지원 포맷·텍스트로 사용자에 요청. README에 권장 도구로 한 줄 안내.
   주의: **Claude Read의 PDF 경로는 `pdftoppm`(poppler)에 의존**해, 미설치 환경에선
   PDF를 통째 못 읽는다(실측) — 그래서 PDF 1차는 Read가 아니라 markitdown/pymupdf.

## 설계

### 신규: `skills/ppt-analyze-source/SKILL.md`

**frontmatter**
- `name: ppt-analyze-source`
- `description`: 발표 자료원(건넨 파일·이미지·코드베이스·로컬 문서 폴더·URL·git
  작업내역·외부 조사)을 분석해 핵심 주장·숫자·구조를 끌어내 `.slides/<덱>/sources.md`로
  남길 때 사용. ppt-plan 게이트 1이 위임하며 ppt-edit도 새 자료 추가 시 쓴다.
  전략·페이지 설계는 ppt-plan, 파일 제작은 ppt-create.

**본문 구조**
- **위임 원리(맨 위, 포터블):** 전용 스킬 있으면 위임 → 없으면 세션 기본 도구 →
  없으면 사용자 요청. 한쪽 도구에서만 도는 경로 금지.
- **자료원 메뉴(8) — 해당하는 것만 골라 처리:**
  - 건넨 파일·문서 → 받아서 읽는다.
  - 이미지(차트·표·스크린샷) → 데이터 소스로 읽어 수치·사실 추출(→ 추출 수치 확인).
    픽셀에 구워진 수치는 비전으로 읽되 환각·뭉갬 주의(결정 4·6).
  - 이 프로젝트/코드베이스 → **기본 직접 탐색**(구조·README·git log·핵심 모듈).
    크고 낯설면 understand-anything 류에 위임(있으면).
  - 로컬 문서 폴더 → 포맷별로 결정 6의 **요소 단위 판별**을 적용한다.
    - `.md`·`.txt`·이미지 → `Read`로 직접.
    - `.docx`·`.pptx`·`.xlsx`(zip) → `markitdown`으로 본문·표·네이티브 차트 추출
      (`markitdown <파일> -o <out>.md`), `media/` 래스터는 꺼내 비전 + always 확인.
    - PDF → 텍스트 충실하면 markitdown plain, 슬라이드/스캔형이면 pymupdf 페이지
      렌더 → full-page 비전.
    - `.doc`·`.xls`(OLE) → `markitdown[xls]`(xls) 또는 LibreOffice 정규화.
    도구가 없으면 폴백 사다리(결정 7)로 내려가고, 그래도 안 되면 텍스트로 요청한다.
  - URL·웹페이지 → 준 링크를 가져와 읽는다.
  - 내 작업내역 → git 커밋 이력으로 한 일을 정리(주간·분기 보고).
  - 외부 주제 조사 → deep-research 있으면 위임, 없으면 세션 웹검색 약식, 없으면
    자료 요청.
  - 머릿속에만 있다 → 인터뷰로 끌어낸다(핵심 주장·근거·예상 반론).
- **추출 수치 확인:** 이미지·OCR·비전에서 뽑은 모든 수치는 sources.md/outline에
  넣기 전 always 확인. 산문에 섞지 말고 `원본 → 읽은 값` 목록으로 제시 — 비전/OCR은
  자릿수·축 보간·환각에서 틀리기 쉬우니 사용자 대조가 최종 권위. **OCR/비전 생출력
  정제 규칙:** 거부·사과("I'm sorry…", "can't extract")·문서와 무관한 라인(인용문·
  인물 메모 등 환각)은 버리고, 인접 숫자가 뭉친 경우(`1243명` 등)는 레이아웃을 보고
  분리한다.
- **산출물 `sources.md` 형식:** 자료원별 블록 — 출처·종류, 핵심 주장·숫자·구조
  요약, 메타(단위·기간·출처), (이미지면) 확인된 추출 수치. outline.md 근거가 이걸
  가리킨다.
- **경계:** 전략·페이지 설계 안 함(ppt-plan). 차트 `data` 배열 구조화·검증 안 함
  (ppt-create). plan은 출처 표시까지.

### 수정: `skills/ppt-plan/SKILL.md` 게이트 1

직전 작업으로 들어간 이미지 분기·always 확인 블록을 제거하고, 게이트 1을 위임
형태로 축소:

> ### 게이트 1: 자료
> 주제를 들으면 자료가 어디 있는지 식별하고 **`ppt-analyze-source`로 분석**해
> 핵심 주장·숫자·구조를 요약·확인받는다(결과는 `.slides/<덱>/sources.md`).
> 자료원은 건넨 파일·이미지·이 프로젝트/코드베이스·로컬 문서 폴더·URL·내
> 작업내역(git)·외부 조사·머릿속 등 — 분석법·위임·추출 수치 확인은 그 스킬이
> 맡는다. 분석이 끝나면 게이트 2로.

(`ppt-analyze-source`가 세션에 없을 때의 폴백: ppt-plan이 직접 자료를 읽고 소화—
현행 동작—로 내려간다. 한쪽만 도는 경로 방지.)

## 미해소 우려 → 해소 매핑

| 우려 | 해소 |
|---|---|
| 게이트 1 비대화·저마찰성 훼손 | 분석 복잡도를 새 스킬로 분리, 게이트 1은 위임만 |
| Codex 포터블 | 위임 원리(있으면 위임/없으면 기본 도구/없으면 요청), 코드베이스·문서·URL·git는 파일/세션 도구라 양쪽 가용 |
| understand-anything 기본 위임 비효율 | 코드베이스 기본=직접 탐색, understand-anything은 큰/낯선 repo 예외(결정 3) |
| 환각 수치 전파 | 추출 수치 always 확인 + 생출력 정제 규칙(결정 4) |
| 시각 요소(표·차트·그림) 판별 | 요소 단위 프로브: 네이티브 추출 / 래스터만 비전(결정 6) |
| Claude Read PDF 실패(poppler 없음) | PDF 1차는 markitdown/pymupdf 렌더(결정 7) |
| 무거운 의존성(LibreOffice 등) | 전역 선택 가속기, 레거시 OLE에만 등장, 없으면 폴백(결정 7) |
| plan/create 경계 | 새 스킬은 출처 표시까지, data 배열화는 create |
| ppt-analyze-source 부재 환경 | ppt-plan이 직접 읽기로 폴백 |

## 범위 밖

- 신뢰도 점수, subagent 리뷰어.
- 차트 `data` 배열 구조화·검증(ppt-create).
- ppt-create/ppt-edit 본문 변경(ppt-edit 재사용은 호출만, 이번엔 ppt-edit 미수정).

## 검증·구현 노트

- 코드 없는 산문 스킬 2개 → 실행 단위 테스트 없음. 검증은 텍스트 리뷰.
- 변경: 신규 `skills/ppt-analyze-source/SKILL.md`, 수정 `skills/ppt-plan/SKILL.md`.
- 새 스킬 저작은 `superpowers:writing-skills` 사용(CLAUDE.md 규칙).
- 수정 후 `npm run sync`로 Codex 번들 재생성.
- **실측 근거(2026-06-16, 합성·실파일 테스트):**
  - XLSX/PPTX 표·네이티브 차트: markitdown 숫자 정확 추출. 레거시 `.xls`(OLE2)도
    `markitdown[xls]`로 정확 추출.
  - docx 프로브: 네이티브 표는 추출, 픽셀 PNG는 `![]` 깃발 + `word/media/`로 결정적
    검출(픽셀 숫자 `77.7`은 추출 안 됨 → 비전 대상).
  - 실 PDF(슬라이드 14쪽·텍스트 희박·이미지 124개): Claude Read는 poppler 없어 실패;
    markitdown plain은 표·피드 추출; per-fragment OCR은 환각(햄릿)·노이즈·숫자 뭉갬;
    **pymupdf 페이지 렌더 → full-page 비전이 수식·점수를 환각 없이 정확** 복원(최선).
