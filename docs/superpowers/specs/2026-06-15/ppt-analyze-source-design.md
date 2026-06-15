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
4. **추출 수치는 always 사람 확인.** 특히 이미지 OCR 수치는 `원본 → 읽은 값`
   목록으로 따로 제시, 사용자 대조가 최종 권위. (직전 스펙 결정 계승.)
5. **subagent 리뷰어·신뢰도 점수 없음.** (직전 스펙 결정 계승.)
6. **markitdown은 선택 가속기(전역 CLI), 하드 의존성 아님.** `.docx`/`.xlsx`/`.pptx`
   등 `Read`가 못 여는 포맷 변환에 `markitdown`이 있으면 쓰고 없으면 폴백. Python
   3.10+ 전역 설치이며 저장소 `package.json`에 넣지 않는다(범용 도구라 전역이
   적절). README에 권장 도구로 한 줄 안내만. 추출 수치 always 확인은 변환 결과에도
   동일 적용(표 추출 오차 가능).

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
  - 이 프로젝트/코드베이스 → **기본 직접 탐색**(구조·README·git log·핵심 모듈).
    크고 낯설면 understand-anything 류에 위임(있으면).
  - 로컬 문서 폴더 → `Read`가 여는 포맷(.md·txt·PDF·이미지)은 직접 읽는다.
    `.docx`·`.xlsx`·`.pptx` 등 Read가 못 여는 포맷은 `markitdown` CLI가 있으면
    마크다운으로 변환해 읽고(`markitdown <파일> -o <out>.md`), 없으면 지원
    포맷·텍스트로 요청한다. (선택 가속기 — 저장소 의존성 아님, 전역 설치 권장.)
  - URL·웹페이지 → 준 링크를 가져와 읽는다.
  - 내 작업내역 → git 커밋 이력으로 한 일을 정리(주간·분기 보고).
  - 외부 주제 조사 → deep-research 있으면 위임, 없으면 세션 웹검색 약식, 없으면
    자료 요청.
  - 머릿속에만 있다 → 인터뷰로 끌어낸다(핵심 주장·근거·예상 반론).
- **추출 수치 확인:** 이미지 등에서 뽑은 모든 수치는 sources.md/outline에 넣기 전
  always 확인. 산문에 섞지 말고 `원본 → 읽은 값` 목록으로 제시 — OCR은 자릿수·축
  보간에서 틀리기 쉬우니 사용자 대조가 최종 권위.
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
| 환각 수치 전파 | 추출 수치 always 확인(결정 4) |
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
