# design-flow — 페이지 흐름·오버레이 표현 설계

**날짜:** 2026-06-09
**상태:** 설계 합의 완료 (구현 전)
**소유 에이전트:** designer (신규 스킬) · front-developer/web-publisher (소비)

## 1. 배경 / 문제

현재 디자인 파이프라인은 **"한 화면 = 풀페이지 컴프 한 장 = DESIGN.md의 화면 기술 한 덩어리"** 구조다. `design-image-web`/`design-image-mobile`이 화면을 한 장씩 그리고, `design-html-prototype`이 그걸 구현하고, `design-generate-code`(미구현)가 코드로 옮긴다. 전부 **정적인 단일 화면**을 전제로 한다.

이 전제를 벗어나는 두 가지가 표현될 자리가 없다:

1. **페이지 흐름(flow)** — "랜딩 CTA → 가입 → 대시보드"처럼 화면들 *사이의* 전이. 컴프는 노드(화면)만 그리고 엣지(전이)는 어디에도 없다.
2. **화면 안의 일시적 블록** — 모달·드롭다운·폼 진입 전 선택 블록. 별도 페이지가 아니라 한 화면의 **상태(state)**다. 풀페이지 컴프로 그리기엔 애매하다.

`design-component-export-react`엔 이미 "transient 오버레이 provider 층"(§6.5)이 있다 — **출력 단은 모달/오버레이를 띄울 층이 준비됐는데, 디자인·이미지 단엔 그걸 정의하는 입력이 비어 있다.**

## 2. 결정 사항 (브레인스토밍 합의)

| 결정 | 선택 |
|---|---|
| 소비 주체 | 사람 + AI 둘 다 — **문서가 진실, 그림은 보조** |
| 오버레이 모델 | 호스트 화면의 **상태**이자 흐름 그래프의 **`화면#상태` 노드** (이중성) |
| 흐름 복잡도 | 중간 — 멀티스텝 플로우 + 약간의 조건분기, 풀 상태머신 아님 |
| 거처·저작 | **접근 1** — DESIGN.md 단일 거처 + 신규 `design-flow` 스킬 |
| DESIGN.md 진입 경로 | **A-1 브리프 패턴** — design-flow는 `flow-brief.md`만 쓰고 md-compiler가 컴파일 (md-compiler가 DESIGN.md 유일 저작자로 유지) |
| 보드 스타일 | A — 추상 박스 + 화살표 (컴프 썸네일 아님) |
| 보드 구현 | **Mermaid 자동 렌더** (§흐름 표 → flowchart 소스 → 클라이언트 렌더) |

## 3. 용어

- **screen(화면)** — 라우트가 있는 풀페이지. 기존 컴프의 대상. 노드 식별자 = 화면 slug(예: `대시보드`).
- **surface(오버레이)** — 화면 위에 뜨는 일시적 표면(모달·시트·드롭다운·선택 블록·팝오버·토스트). 생김새는 ui-kit 컴포넌트에서 온다. 식별자 = `종류:이름`(예: `block:플랜선택`), 호스트 한정 시 `화면#종류:이름`(예: `대시보드#block:플랜선택`).
- **edge(전이)** — `from` 노드에서 `트리거`로 `to` 노드로 가는 화살표, 선택적 `조건`.
- **journey(여정)** — 멀티스텝 흐름을 사람이 읽기 쉽게 묶은 엣지 체인(예: 온보딩 = 랜딩 → 가입 → 대시보드).

## 4. 핵심 의미 규칙

> 엣지의 `to`가 **`화면`**이면 = **라우트 이동(navigate)**.
> 엣지의 `to`가 **`화면#상태`**면 = **오버레이 열기(라우트 유지)**.

이 한 규칙이 "페이지 흐름"과 "모달·선택 블록"을 *하나의 메커니즘*으로 합친다. 코드 단에선 그대로 `router.push` vs `오버레이 provider.open`으로 갈린다(§6.5에 연결). 오버레이 생김새는 ui-kit 컴포넌트 참조이므로 **이미지로 또 그릴 필요가 없다**(중복 제거).

## 5. 스키마

### 5.1 `flow-brief.md` (design-flow가 저작하는 산문 로그)

`page-briefs.md`와 같은 결의 산문. md-compiler가 읽어 컴파일한다. 위치: `.design/candidate/flow/flow-brief.md`.

기록 항목:
- **화면 목록** — DESIGN.md에서 가져온 화면 slug(지어내지 않음).
- **화면별 오버레이** — 이름(`종류:이름`)·ui-kit 컴포넌트·내용 요약·트리거.
- **전이 목록** — from·트리거·to·조건.
- **여정 묶음** — 이름 + 엣지 순서.

### 5.2 md-compiler가 DESIGN.md에 컴파일하는 모습

각 화면 섹션 안:
```
### 상태 (states)
- `block:플랜선택` — 폼 진입 전 플랜 3종 택1. ui-kit `Sheet`. 트리거: "새 프로젝트".
- `modal:프로젝트폼` — 새 프로젝트 입력 폼. ui-kit `Modal`. 트리거: 플랜 택1.
- `modal:삭제확인` — 위험 작업 확인. ui-kit `AlertDialog`. 트리거: 항목 "삭제".
```

최상위 흐름 그래프:
```
## 흐름 (flow)

### 노드
- screen:  랜딩 · 가입 · 대시보드
- surface: 대시보드#block:플랜선택 · 대시보드#modal:프로젝트폼 · 대시보드#modal:삭제확인

### 전이
| from                      | 트리거          | to                        | 조건     |
| ------------------------- | --------------- | ------------------------- | -------- |
| 랜딩                      | CTA "시작하기"  | 가입                      | 비로그인 |
| 랜딩                      | CTA "시작하기"  | 대시보드                  | 로그인됨 |
| 가입                      | 폼 제출 성공    | 대시보드                  | —        |
| 대시보드                  | "새 프로젝트"   | 대시보드#block:플랜선택   | —        |
| 대시보드#block:플랜선택   | 플랜 택1 + 다음 | 대시보드#modal:프로젝트폼 | —        |
| 대시보드#modal:프로젝트폼 | 생성 완료       | 대시보드                  | —        |
| 대시보드                  | 항목 "삭제"     | 대시보드#modal:삭제확인   | —        |

### 여정 (멀티스텝 가독성)
- **온보딩**: 랜딩 → 가입 → 대시보드
- **프로젝트 생성**: 대시보드 → #block:플랜선택 → #modal:프로젝트폼 → 대시보드
```

### 5.3 컨벤션

- surface 이름 = `종류:이름`. 종류 = `modal`·`sheet`·`dropdown`·`block`·`popover`·`toast`.
- 조건은 **자유 산문 한 줄**(비로그인·권한 등). 가드 형식주의 없음(중간 복잡도).
- 한 트리거가 조건에 따라 갈라지면 같은 from·트리거로 행을 2개 둔다.
- 오버레이 닫기(ESC·바깥 클릭)는 암묵적으로 호스트 복귀 — 표에 일일이 안 적는다(YAGNI). 닫을 때 *부수효과*(예: 생성 완료 → 갱신)가 있을 때만 엣지로 명시한다.

## 6. `design-flow` 스킬 (신규)

**소유:** designer 에이전트. **위치:** DESIGN.md 확정 후 · ui-kit·image 뒤 · html-prototype 앞. `design-image-web`처럼 DESIGN.md가 확정되면 "전체 흐름 보드를 만들까요?"로 **제안하는 선택 다운스트림**.

### 6.1 입력 (cwd 기준, 있는 것만)
- `.design/DESIGN.md` — 화면 목록·§6 섹션 규칙(흐름의 노드 출처)
- `.design/assets/css/components.css` + `.design/view/ui-kit.html` — 오버레이로 쓸 컴포넌트 후보(Modal·Sheet·AlertDialog 등)
- `.design/assets/css/tokens.css` — 보드 스타일 토큰
- `.design/reference/page/*` — 노드 *라벨* 참고용(스타일 A라 썸네일은 박지 않음)

DESIGN.md에 없는 화면·카피·컴포넌트는 지어내지 않는다.

### 6.2 흐름 (게이트 루프)
1. **Phase 0 — DESIGN.md 부재 폴백**: image-web과 동일 패턴(없으면 design.md 요청 → 진도 감지 → md-compiler/brand-kit 유도).
2. **게이트1 — 노드 확정**: DESIGN.md 화면 목록 확인 + 화면별 **오버레이 열거·합의**, 각 오버레이 ↔ ui-kit 컴포넌트 매핑. 확정 전 산출 0.
3. **게이트2 — 전이 합의**: 트리거·to·조건 + 여정 묶음을 합의.
4. **산출 저작**:
   - `.design/candidate/flow/flow-brief.md`(산문 로그) — design-flow가 직접 저작.
   - `.design/view/flow.html`(Mermaid 보드) — **web-publisher 서브에이전트에 위임**(아래 §7).
5. **검수**: 공유 라이브 서버로 보드를 보여주고(최초 1회 기동 확인) 사람이 확인. 고칠 게 있으면 brief·보드 갱신.
6. **종료 안내**: "`design-md-compiler`를 재실행하면 §흐름·화면별 상태가 DESIGN.md에 컴파일됩니다."

### 6.3 출력 파일
```
.design/
  candidate/flow/flow-brief.md   # 산문 로그 (md-compiler가 읽음)
  view/flow.html                 # Mermaid 보드 (web-publisher 저작, 라이브 프리뷰)
```

## 7. 보드 (`flow.html`)

- **렌더:** Mermaid `flowchart`. §흐름 표 → Mermaid 소스는 거의 기계적 변환("문서가 진실, 보드는 파생").
- **노드:** screen = 실선 박스, surface = 점선/틴트 박스(서브그래프로 호스트에 묶어도 됨).
- **엣지:** navigate = 실선 화살표, overlay-open = 점선 화살표. 트리거를 엣지 라벨로.
- **스타일:** Mermaid 테마 CSS를 `tokens.css` 브랜드 토큰으로 덮어 색·폰트·radius 일관성 확보(제한적).
- **저작 주체:** web-publisher 서브에이전트(파이프라인이 HTML 산출을 web-publisher에 위임하는 기존 규약과 일관). 의존: Mermaid CDN 1개.
- **라이브 프리뷰:** `scripts/lib/serve-design.mjs`로 기동, `http://localhost:5500/view/flow.html`.

## 8. 기존 스킬 변경

### 8.1 `design-md-compiler`
- **입력 추가:** `.design/candidate/flow/flow-brief.md`.
- **출력 추가:** 각 화면 섹션에 `### 상태`, 최상위 `## 흐름`(노드·전이·여정).
- flow-brief가 없으면 §흐름·상태를 생략(하위 호환).

### 8.2 `design-html-prototype`
- §흐름·`### 상태`를 읽어 **호스트 화면을 토글 가능한 오버레이 상태로 렌더**(모달·블록 열린 모습 미리보기). ui-kit 컴포넌트 재사용.
- 완전성 체크리스트에 "정의된 surface가 토글로 존재하는가"를 추가.

## 9. 다운스트림 계약

| 단계 | §흐름 소비 | 상태 |
|---|---|---|
| `design-html-prototype` | 호스트 화면 + 토글 오버레이 상태 렌더 | 이번에 스펙 한 줄 추가 |
| `design-component-export-react` §6.5 | surface를 오버레이 provider 층에 등록(입력만 연결) | 기존 구조, 입력 계약만 명시 |
| `design-generate-code`(미구현) | §흐름 → 라우트 테이블 + `트리거→오버레이 open` wiring | **미래 계약만 예약**, 지금 설계 안 함 |
| `check-customer-ux`(기존) | 여정을 Playwright 경로 대본으로 재생해 흐름 검증 | 선택·미래 연결 |
| `design-image-web/mobile` | 오버레이는 별도 이미지 생성 안 함(생김새=ui-kit). 화면 컴프만 | 변경 없음(규칙만 명문화) |

## 10. 전체 파이프라인

```
brand-kit → ui-kit → md-compiler → DESIGN.md(화면)
                                      ├─ image-web/mobile  (화면 컴프, 선택)
                                      └─ design-flow ──→ flow-brief.md + flow.html(Mermaid)
                                              ↓
                              md-compiler 재실행 → DESIGN.md에 §흐름 + 화면별 상태
                                              ↓
            html-prototype(오버레이 토글) · component-export(§6.5 provider) · generate-code(라우팅, 미구현)
```

## 11. 비목표 / YAGNI

- 풀 상태머신·가드 DSL — 조건은 산문 한 줄로 충분.
- 오버레이의 이미지 생성 — 생김새는 ui-kit에서 온다.
- 컴프 썸네일 노드(스타일 B) — 이번엔 추상 박스(A)만.
- `design-generate-code`의 라우팅·wiring 구현 — 미래 계약만 예약.
- 보드를 손저작 SVG로 — Mermaid 자동 렌더로 대체.

## 12. 열린 질문 (구현 시 확정)

- Mermaid 테마를 브랜드 토큰으로 덮는 범위(어디까지 일관 가능한지)는 web-publisher 구현 때 측정.
- `flow-brief.md` 산문 포맷의 구체 템플릿(md-compiler 파싱 안정성)은 plan 단계에서 확정.
- 한 제품에 화면이 많을 때 보드 가독성(서브그래프·여정별 분할 뷰 필요 여부)은 실제 규모에서 재검토.
