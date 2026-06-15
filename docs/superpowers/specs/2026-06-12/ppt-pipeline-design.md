# ppt 파이프라인 설계 (PPT 생성 스킬 가족)

날짜: 2026-06-12
상태: 구현됨 (v1 — potx 이식 제외)

> **이 문서는 전체 파이프라인 초안이다.** 스킬 가족의 골격·산출물·흐름을 확정하는 것이
> 목적이며, 각 스킬의 상세(게이트 문구·산문 구성 등)는 구현 시 `writing-skills`에서
> 다듬는다. 여기 적힌 스킬 간 세부는 방향 제시 수준으로 읽는다.

## 1. 목적과 배경

"나는 xxx 주제로 PPT를 만들고 싶어"에서 출발해, **자료 → 발표 전략 → 페이지 설계 → 제작 → 검수**를
빠른 논의로 진행하는 파이프라인. designer 파이프라인처럼 게이트 기반 협업으로 진행하되,
무게중심은 디자인이 아니라 **내용 개발(무엇을 말할 것인가)**에 둔다.

조사 결과에 따른 기술 선택:

- **PptxGenJS를 스킬 스크립트로 직접 사용** (MCP 서버 불채용).
  - GongRzhe/Office-PowerPoint-MCP-Server는 2026-03 아카이브됨(읽기 전용). MCP 상주 도구 34개의
    컨텍스트 비용도 불리.
  - PptxGenJS: 5.5k★, 활발히 유지보수, ESM·런타임 의존성 0 → 이 repo의 Node/.mjs 스크립트
    패턴에 그대로 들어맞음. 네이티브 OOXML 출력이라 결과물이 PowerPoint에서 완전 편집 가능.
- **쓰기 전용 제약을 선언적 구조로 흡수**: PptxGenJS는 기존 pptx를 못 읽는다. 따라서
  덱 스펙(spec.json)을 단일 진실 소스로 두고 매번 전체 재렌더한다. 렌더는 결정적이라
  스펙에서 안 고친 슬라이드는 픽셀 하나 안 바뀜(drift 없음). 생성된 .pptx는 빌드 산출물 —
  손편집 금지, 모든 수정은 스펙 경유.
- **검수는 PowerPoint COM `Slide.Export`** (스크린샷 아님): 창 없이 슬라이드별 PNG를
  결정적으로 내보내는 공식 API. 이 머신에서 PowerPoint 16.0 COM 작동 확인됨.

## 2. 파이프라인 (내용 개발이 본체)

```
"xxx에 대해 PPT 만들고 싶어"
  ↓
[1. 자료]   셋 중 하나 — ①기존 자료 읽고 소화 ②세션 자체 웹 검색으로 약식 조사
            ③인터뷰식으로 머릿속 내용 끌어내기
  ↓
[2. 전략]   청중·목적(발표 후 청중이 뭘 하게 만들 것인가)·핵심 메시지 한 문장·
            설득 구조(두괄식 보고/문제→해결/비교/연대기…)·시간·분량
  ↓
[3. 내용 설계]  담을 것/버릴 것, 페이지 수, 페이지별 한 줄 메시지 + 근거·데이터
            → outline.md 확정  (게이트 — 여기까지가 작업의 8할)
  ↓
[4. 제작]   outline → 슬라이드별 내용 초안 → spec.json → 렌더(.pptx)   ← 기계적
  ↓
[5. 검수]   COM PNG export → 번호 그리드 검수 시트 → "3번 고쳐" → 스펙 수정 →
            재렌더 → lock
```

- 테마/디자인은 이 흐름과 **직교** — 4단계 진입 시 1회 선택(내장 기본 / 내 커스텀 / potx 이식).
- 1단계 조사는 외부 research 스킬에 **하드 의존하지 않는다**. deep-research는 Claude Code
  빌트인이라 Codex에 없음(확인됨). 추후 양쪽에서 쓸 research 플러그인이 생기면 ②를
  위임하는 확장 지점으로만 표시.

## 3. 스킬 가족 (4개)

스킬은 "단계"가 아니라 **재진입점** 단위로 나눈다. 한 대화 안의 합의는 스킬 내부 게이트로 처리.

| 스킬 | 역할 | 호출 시점 |
|---|---|---|
| `ppt-plan` | 파이프라인 1·2·3단계 전부 소유. **가장 큰 스킬.** 산출 `outline.md`. 발표 전략 상담만 받고 끝나도 됨 | 덱 시작, 또는 구성 상담 단독 |
| `ppt-create` | 4·5단계. outline.md 필수 — 없으면 ppt-plan으로 유도(design-image-web이 DESIGN.md 없으면 상류로 보내는 패턴) | 덱 생산 |
| `ppt-edit` | 기존 `.slides/<덱>/` 감지 → spec 수정 → 재렌더 → 바뀐 슬라이드만 검수. create의 기계 재사용 (image-gen↔image-edit-region과 같은 생성/수정 분리 선례) | 시간이 지나 재진입 |
| `ppt-theme` | 내장 테마 열람·커스텀 저장·potx 이식 | 가끔, 덱 작업과 별개 주기 |

스킬 이름은 `design-*` 가족처럼 `ppt-*` 접두사로 묶는다. 작업 폴더가 `.slides/`인 것은
별개 결정 — `.ppt`는 파일 확장자와 같은 문자열이라 혼동 여지가 있어 피했다.

### 서브에이전트 (v1 없음)

designer가 design-* 가족을 소유하듯 ppt-* 전담 서브에이전트를 둘지 검토했고, **v1에서는
두지 않는다.** 이 파이프라인의 본체(1~3단계)는 사용자와의 게이트 대화라 메인 세션에서
돌아야 하고, 기계적인 부분(렌더·export)은 결정적 스크립트라 위임할 판단 노동이 없다.
단, 검수 자가 점검(PNG를 보고 오버플로·겹침·깨진 레이아웃을 잡는 일)이 반복·토큰 부담이
커지면 web-publisher-qa 패턴의 **`ppt-publisher` 서브에이전트**(렌더→export→자가 검수→
검수 시트 반환)로 분리한다 — v2 확장 지점.

## 4. 산출물과 파일 레이아웃

실행 위치(cwd) 기준 — 업무 보고는 코드 프로젝트와 무관한 폴더에서도 실행한다:

```
.slides/
  <덱-슬러그>/
    outline.md     # 1~3단계 합의 결과 (사람이 읽는 기획 문서)
    spec.json      # 덱 스펙 — 단일 진실 소스
    deck.pptx      # 빌드 산출물 (손편집 금지)
    review/        # 슬라이드별 PNG + 검수 시트
```

### spec.json (Claude가 쓰고 렌더러가 읽음)

```json
{
  "theme": "default-corporate",
  "slides": [
    { "layout": "title",   "fields": { "title": "2026 2분기 실적 보고", "subtitle": "경영진 보고" } },
    { "layout": "bullets", "fields": { "title": "핵심 요약", "bullets": ["매출 12% 성장", "신규 고객 34곳"] },
      "notes": "발표자 노트(선택) — outline의 페이지 메시지를 기본값으로" },
    { "layout": "chart",   "fields": { "title": "월별 매출", "chartType": "bar",
        "data": [{ "name": "매출", "labels": ["4월","5월","6월"], "values": [120, 135, 152] }] } }
  ]
}
```

- v1 내장 레이아웃 8종: `title · section · bullets · two-col · chart · table · image · closing`
- 렌더 전 **스키마 검증**(시스템 경계 유효성 검증): 필수 필드, 필드별 글자 수 상한, 레이아웃별
  허용 필드. 실패 시 "슬라이드 3, fields.title 누락" 식으로 빠르게 실패.
- 오버플로 2중 방어: 스펙 글자 수 상한 + 텍스트 `fit: "shrink"` 안전망.

### theme.json (내장이든 potx 이식이든 같은 포맷으로 수렴 — 파이프라인은 출처를 모름)

```json
{
  "colors": { "primary": "1A3E6E", "text": "2B2B2B", "background": "FFFFFF" },
  "fonts":  { "heading": "맑은 고딕", "body": "맑은 고딕" },
  "layouts": {
    "title": { "background": "bg-title.png",
               "placeholders": { "title": { "x": 0.8, "y": 2.5, "w": 11.7, "h": 1.4, "fontSize": 40 } } }
  }
}
```

- **내장 테마**: 스킬 번들 안 (`skills/ppt-theme/themes/` — create가 읽기만 함).
- **커스텀·이식 테마**: `.env`의 `PPT_THEME_DIR`(librarian의 `LIBRARIAN_VAULT_PATH` 패턴,
  머신별 로컬 값). 어느 폴더에서 실행해도 회사 테마 재사용.
- `PPT_THEME_DIR` 미설정 시: 내장 테마만 사용 가능. 커스텀 저장·potx 이식을 시도하면
  설정 안내와 함께 실패(resolve-vault.mjs와 같은 방식).

## 5. 스크립트 아키텍처

create·edit가 공유하는 스크립트는 `scripts/lib/`에 둔다(Codex 번들 포함 경로 — 최상위
`scripts/`는 번들 제외라는 기존 규칙).

| 스크립트 | 역할 |
|---|---|
| `scripts/lib/ppt/render-deck.mjs` | spec+theme 검증 → PptxGenJS 렌더. theme.layouts를 `defineSlideMaster`로 등록, 슬라이드 루프에서 플레이스홀더 채움. 차트·표는 플레이스홀더 불가라 좌표 기반 채움 함수로 처리 |
| `scripts/lib/ppt/export-png.ps1` | PowerPoint COM으로 창 없이(`WithWindow=False`) 열고 `Slide.Export`로 슬라이드별 PNG(해상도 지정). Windows + PowerPoint 전용 |
| `skills/ppt-theme/scripts/import-potx.mjs` | potx(zip)에서 theme1.xml 색·폰트, slideLayouts 좌표, media 추출 + **COM으로 레이아웃 배경을 PNG 1회 export해 마스터 배경 이미지로 보존**(장식 충실도 트릭) → theme.json 생성 |

- 의존성 추가: `pptxgenjs` 1개 (`package.json`).
- 발표자 노트: spec의 `notes` 필드(선택) → `slide.addNotes()`. 비어 있으면 outline의
  페이지별 한 줄 메시지를 기본값으로 넣는다.

## 6. 도구 호환 (Claude / Codex)

- 스킬 산문·스크립트는 공통. 스킬 추가 후 `npm run sync`로 Codex 번들 재생성(기존 규칙).
- **조사 폴백**: research 스킬이 세션에 있으면 위임, 없으면 세션 자체 웹 검색, 그것도
  안 되면 자료 요청/인터뷰 모드. SKILL.md에 "사용 가능하면" 조건부로 기술.
- **검수 폴백**: PowerPoint COM 불가 환경(비Windows·미설치)에서는 .pptx는 정상 산출하고
  PNG 검수만 "수동 확인 안내"로 degrade. 파이프라인은 죽지 않는다.

## 7. 에러 처리

- 스펙 검증 실패: 슬라이드 번호·필드를 명시한 커스텀 에러로 즉시 실패.
- pptxgenjs 미설치: `npm install` 안내.
- PowerPoint 없음: export 단계만 스킵 + 안내 (위 6절).
- potx 파싱 실패(비표준 템플릿): 추출 가능한 것(색·폰트)만 가져오고 누락 항목을 보고,
  레이아웃은 내장 기본으로 폴백.

## 8. 테스트

`tests/` 미러 규칙을 따른다:

- `tests/scripts/lib/ppt/render-deck.test.mjs` — 스펙 검증 단위 테스트(필수 필드·글자 수·
  레이아웃별 허용 필드), 렌더 스모크(spec→pptx 생성, zip 구조에 슬라이드 수 확인).
- `tests/skills/ppt-theme/scripts/import-potx.test.mjs` — 고정 샘플 potx에서 색·폰트 추출 검증.
- COM export(ps1)는 환경 의존이라 자동 테스트 제외 — 수동 검증.

## 9. 구현 순서

1. `render-deck.mjs` + 기본 테마 1종 + 스펙 스키마 (TDD) — 손으로 spec 써서 pptx 확인 가능
2. `export-png.ps1` 검수 스크립트
3. `ppt-create` SKILL.md — 코어 루프 완성 (**여기까지가 쓸 수 있는 최소 파이프라인**)
4. `ppt-plan` SKILL.md — 자료·전략·내용 설계 (산문 위주)
5. `ppt-edit` — create 기계 재사용하는 얇은 스킬
6. `ppt-theme` — 내장 테마 관리 → potx 이식(가장 복잡, 가장 덜 급함)

각 스킬 작성 시 `superpowers:writing-skills` 사용(프로젝트 규칙).

## 10. 비범위 (v1)

- 애니메이션·전환 효과, 동영상 삽입.
- 발표 리허설/대본 생성 (outline·notes가 일부 커버).
- 기존 pptx 역가져오기(읽기) — PptxGenJS 제약. 필요해지면 별도 논의.
- deep-research 수준의 다각도 조사 — 외부 플러그인 확보 시 1단계 ②에 연결.

## 11. 미해결 / 추후 결정

- "발표 구성 상담만" 수요가 잦으면 plan에서 전략 상담을 더 분리할지 (지금은 plan 하나로).
- 내장 기본 테마의 시각 방향(v1은 보고용 무난한 1종으로 시작, 종수 확장은 사용하며).
- 덱 슬러그 네이밍 규칙(주제 기반 kebab-case, create 시작 시 합의).
- `ppt-publisher` 서브에이전트 신설 여부 — 검수 자가 점검 부담이 커지면 (§3 참고).
