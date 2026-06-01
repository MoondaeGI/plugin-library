# Brand Kit HTML 레이아웃 아키타입 라이브러리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit`의 `overview.html` 저작이 단일 스켈레톤으로 수렴하던 것을, 4개 레이아웃 아키타입(제약된 스켈레톤 + 자유 존) 라이브러리로 바꿔 브랜드별로 골격이 갈리게 한다.

**Architecture:** 순수 문서 변경. `references/brand-kit-html-direction.md`를 "아키타입 선택 + 공통 렌더 규칙" 허브로 재작성하고, 개별 골격은 신규 `references/archetypes/<name>.md` 4개로 분리한다. `SKILL.md`는 brief의 레이아웃 메모가 아키타입을 커밋하도록 보강한다. 코드/스크립트 변경 없음 — 검증은 `npm run sync`(Codex 번들 재생성)·`npm test`(스크립트 회귀)·렌더 대조.

**Tech Stack:** Markdown 레퍼런스, 인라인 CSS 스켈레톤(HTML/CSS), Node 동기화 스크립트(`scripts/sync-codex-plugin.mjs`).

> **참고 산출물:** `D:\기타 프로그램\design-test\Nooknote2\.design\brand-kit\archetypes-preview.html`에 B/C/D 풀 렌더가, 같은 폴더 `overview.html`에 A 풀 렌더가 있다. 아키타입 파일의 압축 스켈레톤은 이 풀 렌더에서 토큰화·축약해 추출한다. 스펙: `docs/superpowers/specs/2026-06-01-brand-kit-html-archetypes-design.md`.

> **TDD 주석:** 이 작업은 산문 레퍼런스 편집이라 단위 테스트 대상이 아니다. "테스트" 자리에는 (1) 파일 존재·구조 점검, (2) `npm run sync` 무오류 + 번들에 파일 포함, (3) `npm test` 회귀 통과, (4) 렌더 대조를 둔다. 가짜 pytest를 만들지 않는다.

---

### Task 1: 아키타입 파일 A — 룰드 모듈 그리드

**Files:**
- Create: `skills/design-brand-kit/references/archetypes/a-ruled-grid.md`
- Source: `skills/design-brand-kit/references/brand-kit-html-direction.md:30-64` (기존 스켈레톤), `D:\기타 프로그램\design-test\Nooknote2\.design\brand-kit\overview.html` (풀 렌더)

- [ ] **Step 1: 파일 작성**

아래 내용으로 생성한다(압축 스켈레톤은 기존 html-direction.md 스켈레톤을 그대로 옮긴다):

````markdown
# 아키타입 A — 룰드 모듈 그리드 (Ruled Module Grid)

- **성격**: 시스템틱·정연·차분. 한 장의 종이에 짜인 모듈 그리드.
- **어울리는 브랜드 신호**: 테크·SaaS·도구·정밀·중립. 미감이 "구조/시스템" 쪽일 때.

## 구조
상단 스트립 + 풀폭 히어로(키비주얼 배경 + 워드마크) + 6열 헤어라인 모듈 그리드(카드 박스 없음, gap 1px가 line 색으로 비침) + 하단 스트립. 섹션을 span으로 배치.

## 압축 CSS 스켈레톤 (색·폰트·radius는 tokens에서)
```css
body{ background:radial-gradient(1100px 700px at 50% -10%, var(--mat1), var(--mat2) 70%); padding:44px 24px 70px; }
.sheet{ max-width:1180px; margin:0 auto; background:var(--paper); box-shadow:0 2px 6px rgba(0,0,0,.10), 0 40px 90px rgba(0,0,0,.22); }
.strip{ display:flex; justify-content:space-between; padding:13px 30px; border-bottom:1px solid var(--line);
        font-family:var(--mono); font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
.hero{ position:relative; min-height:400px; display:flex; align-items:flex-end; overflow:hidden; }
.hero img.bg{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.hero .scrim{ position:absolute; inset:0; background:linear-gradient(92deg, var(--paper) 0%, rgba(255,255,255,.16) 62%, transparent 100%); }
.hero .inner{ position:relative; padding:48px 50px; max-width:680px; }
.hero .mark{ height:108px; width:auto; }
.grid{ display:grid; grid-template-columns:repeat(6,1fr); gap:1px; background:var(--line); }
.mod{ background:var(--paper); padding:26px 28px; }
.c2{grid-column:span 2} .c3{grid-column:span 3} .c4{grid-column:span 4} .full{grid-column:1/-1}
```

## 불변 (must-hold)
- 헤어라인 모듈 그리드(gap 1px + line 배경). **카드 박스·그림자 남발 금지.**
- 전체가 한 장의 종이로 읽힌다.

## 자유 존 (브랜드별로 결정)
- 그리드 열 수(6 ↔ 4)와 모듈 span 배치·섹션 순서.
- 히어로 높이·스크림 방향·워드마크 크기.
- 라이트/다크, 매트 배경 톤, 밀도(airy ↔ packed).
- 상·하단 스트립 유무·내용.
````

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/archetypes/a-ruled-grid.md','utf8'); if(!/압축 CSS 스켈레톤/.test(s)||!/불변/.test(s)||!/자유 존/.test(s)) throw new Error('섹션 누락'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: 커밋은 Task 4에서 4개 파일을 함께** (다음 태스크로)

---

### Task 2: 아키타입 파일 B — 에디토리얼 스프레드

**Files:**
- Create: `skills/design-brand-kit/references/archetypes/b-editorial.md`
- Source: `archetypes-preview.html` `.arc-b` 스코프 CSS

- [ ] **Step 1: 파일 작성**

````markdown
# 아키타입 B — 에디토리얼 스프레드 (Editorial Spread)

- **성격**: 잡지 표지+속지. 비대칭·여백·세리프 인용 중심. 따뜻하고 사려 깊은 결.
- **어울리는 브랜드 신호**: 럭셔리·문학·에디토리얼·따뜻함·라이프스타일. accent(세리프) 폰트가 있을 때 특히.

## 구조
마스트헤드(2px 룰) + 비대칭 2단 히어로(좌: 워드마크+큰 세리프 풀쿼트 / 우: 세로 키비주얼) + 드롭캡 2단 본문(에센스) + 12열 에디토리얼 모듈 행(가치·타깃·로고·색·타이포·보이스·UI·아이콘).

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ max-width:1200px; margin:0 auto; background:var(--paper); box-shadow:var(--lg); }
.pg{ padding:60px 68px; }
.masthead{ display:flex; justify-content:space-between; align-items:baseline; border-bottom:2px solid var(--text); padding-bottom:14px; }
.spread{ display:grid; grid-template-columns:1.15fr .85fr; gap:48px; align-items:center; padding-top:46px; }  /* 비대칭 */
.spread .pull{ font-family:var(--accentf); font-size:40px; line-height:1.32; color:var(--primary); }          /* 세리프 풀쿼트 = 주연 */
.spread .ph{ aspect-ratio:3/4; overflow:hidden; } .spread .ph img{ width:100%; height:100%; object-fit:cover; }
.prose{ columns:2; column-gap:48px; border-top:1px solid var(--line); padding-top:30px; }
.prose p:first-child::first-letter{ font-family:var(--display); font-size:58px; float:left; line-height:.82; padding:6px 12px 0 0; color:var(--accent); } /* 드롭캡 */
.erow{ display:grid; grid-template-columns:repeat(12,1fr); gap:38px 44px; border-top:2px solid var(--text); padding-top:38px; }
.col4{grid-column:span 4} .col6{grid-column:span 6} .col12{grid-column:span 12}
```

## 불변 (must-hold)
- 비대칭 2단 히어로 + **세리프(accent) 풀쿼트가 주연**.
- 넉넉한 여백, 2px 룰 마스트헤드/디바이더. 카드 박스 아님.

## 자유 존 (브랜드별로 결정)
- 드롭캡 사용 여부·색.
- 히어로 좌우 비율·키비주얼 종횡비(3/4 ↔ 1/1).
- 모듈 행 열 배분(col4/col6/col12 조합)과 섹션 순서.
- 라이트/다크, 본문 단 수(1 ↔ 2), 밀도.

> accent 폰트가 토큰에 없으면 이 아키타입은 부적합 — A/C/D 중에서 고른다.
````

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/archetypes/b-editorial.md','utf8'); if(!/압축 CSS 스켈레톤/.test(s)||!/불변/.test(s)||!/자유 존/.test(s)) throw new Error('섹션 누락'); console.log('OK')"`
Expected: `OK`

---

### Task 3: 아키타입 파일 C — 사이드바 + 캔버스

**Files:**
- Create: `skills/design-brand-kit/references/archetypes/c-sidebar.md`
- Source: `archetypes-preview.html` `.arc-c` 스코프 CSS

- [ ] **Step 1: 파일 작성**

````markdown
# 아키타입 C — 사이드바 + 캔버스 (Sidebar + Canvas)

- **성격**: 프로덕트 UI 같은 좌측 인덱스 + 넓은 작업면. 색 대비가 강해 분위기가 또렷.
- **어울리는 브랜드 신호**: 프로덕트·도구·대시보드·앱. "쓰는 물건" 느낌이 필요할 때.

## 구조
좌측 어두운 고정 사이드바(워드마크[흰 반전]·컬러 레전드·타이포 미니 스펙시먼·섹션 목차[하단 고정]) + 우측 캔버스(상단 와이드 키비주얼 히어로 + 2열 콘텐츠 셀 + 풀폭 UI + 아이콘 행).

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ display:grid; grid-template-columns:268px 1fr; }
.side{ background:var(--primary-dark); color:#E7DECF; padding:34px 26px; display:flex; flex-direction:column; gap:26px; }
.side img.wm{ height:46px; filter:brightness(0) invert(1); }   /* 어두운 바탕 → 흰 워드마크 */
.side .idx{ margin-top:auto; }                                  /* 섹션 목차는 하단 고정 */
.canvas{ background:var(--paper); }
.chero{ position:relative; height:300px; overflow:hidden; } .chero img{ width:100%; height:100%; object-fit:cover; }
.chero .ov{ position:absolute; inset:0; background:linear-gradient(80deg, rgba(54,73,95,.78), transparent 70%); }
.cgrid{ display:grid; grid-template-columns:1fr 1fr; gap:1px; background:var(--line); }
.cell{ background:var(--paper); padding:26px 30px; } .cell.full{ grid-column:1/-1; }
```

## 불변 (must-hold)
- 좌측 **어두운 고정 사이드바 인덱스**(주색/주색-dark 바탕 + 밝은 텍스트).
- 우측은 넓은 캔버스가 주인공(히어로·UI 크게).

## 자유 존 (브랜드별로 결정)
- 사이드바 폭·바탕(주색 ↔ 주색-dark ↔ sand)·담는 항목 순서.
- 캔버스 셀 그리드(2열 ↔ 3열), 히어로 높이·오버레이 방향.
- 사이드바 좌/우 배치(좌측 기본, 우측도 가능).
- 밀도.
````

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/archetypes/c-sidebar.md','utf8'); if(!/압축 CSS 스켈레톤/.test(s)||!/불변/.test(s)||!/자유 존/.test(s)) throw new Error('섹션 누락'); console.log('OK')"`
Expected: `OK`

---

### Task 4: 아키타입 파일 D — 스택 밴드 + 커밋

**Files:**
- Create: `skills/design-brand-kit/references/archetypes/d-stacked-bands.md`
- Source: `archetypes-preview.html` `.arc-d` 스코프 CSS

- [ ] **Step 1: 파일 작성**

````markdown
# 아키타입 D — 스택 밴드 (Stacked Bands)

- **성격**: 풀폭 수평 밴드를 위→아래로 쌓기. 밴드별 배경색 대비, 큰 타입. 대담·하이에너지.
- **어울리는 브랜드 신호**: 마케팅·대담·실험·강한 퍼스낼리티. 차분/미니멀과는 반대.

## 구조
밴드 시퀀스: §1 풀폭 히어로(키비주얼 풀블리드 + 워드마크 오버레이) → §5 태그라인 밴드(주색 바탕, 초대형 세리프) → 트리오 밴드(에센스·타깃·가치 3열) → §7 풀폭 컬러 바 → 스플릿 밴드(타이포 | 보이스) → 로고 밴드(어두움) → UI 밴드 → 아이콘 밴드. 밴드 배경색 교대.

## 압축 CSS 스켈레톤 (색·폰트는 tokens에서)
```css
.sheet{ max-width:1200px; margin:0 auto; }
.band{ padding:46px 60px; }
.bn{ font-family:var(--mono); font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; }
.b-hero{ position:relative; height:380px; padding:0; overflow:hidden; } .b-hero img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.b-tag{ background:var(--primary); color:#fff; text-align:center; padding:62px 60px; }
.b-tag .big{ font-family:var(--accentf); font-size:46px; line-height:1.3; }          /* 초대형 인용/태그라인 */
.colorbar{ display:flex; height:140px; }                                              /* 풀폭 컬러 바 */
.colorbar .c{ flex:1; display:flex; flex-direction:column; justify-content:flex-end; padding:14px; }
/* 밴드 배경 교대 예: paper → primary → paper → sand → primary-dark → bg */
```

## 불변 (must-hold)
- 풀폭 수평 밴드 스택 + **밴드 간 배경색 대비**.
- §7은 풀폭 컬러 바로.

## 자유 존 (브랜드별로 결정)
- 밴드 순서·개수, 배경색 교대 패턴.
- 태그라인 밴드 타입 크기·폰트(세리프 ↔ 디스플레이).
- 트리오/스플릿 열 수, 히어로 높이·오버레이.
- 밀도.

> 차분·미니멀 브랜드엔 과할 수 있다 — 신호가 "대담/마케팅"이 아니면 A/B/C를 우선 검토.
````

- [ ] **Step 2: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/archetypes/d-stacked-bands.md','utf8'); if(!/압축 CSS 스켈레톤/.test(s)||!/불변/.test(s)||!/자유 존/.test(s)) throw new Error('섹션 누락'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: 커밋 (4개 아키타입 파일)**

```bash
git add skills/design-brand-kit/references/archetypes/
git commit -m "feat(brand-kit): overview 레이아웃 아키타입 4종 추가(룰드 그리드·에디토리얼·사이드바·스택 밴드)"
```

---

### Task 5: `brand-kit-html-direction.md`를 선택 허브로 재작성

**Files:**
- Modify (전면 재작성): `skills/design-brand-kit/references/brand-kit-html-direction.md`

기존 "레퍼런스 스켈레톤(권장 출발점·강제 아님)" 섹션(30-64줄)을 삭제하고, 그 자리에 "아키타입 선택"을 둔다. 원칙 1~7과 섹션→자산 매핑·생성 효율은 유지한다.

- [ ] **Step 1: "원칙" 섹션 위 인트로 교체**

기존 인트로(1-9줄)의 "아래 레퍼런스 스켈레톤은 ... 검증된 좋은 출발점" 문구를 제거하고 다음으로 대체한다:

```markdown
# HTML 오버뷰 작성 가이드 (overview.html)

`design-brand-kit`이 `overview.html`을 저작할 때 읽는 허브. 이 파일은 **(1) 어떤 레이아웃 아키타입을 고를지**와 **(2) 모든 아키타입 공통의 출력·렌더 규칙·원칙**만 담는다. 개별 골격(구조·CSS 스켈레톤·불변·자유 존)은 `references/archetypes/<name>.md`에 있다.

## 산출물
- 단일 self-contained `overview.html`(CSS 인라인). 자산은 **형제 `assets/...` 상대경로** `<img>`.
- 데이터(색·타이포·보이스·가치·카피)는 `BRAND_KIT.md`/`brand-tokens.json`에서 가져온다 — **지어내지 않는다**. 변주는 레이아웃에서만.
```

- [ ] **Step 2: "아키타입 선택" 섹션 추가** (기존 30-64줄 스켈레톤 자리)

```markdown
## 레이아웃 아키타입 선택 (기본값 없음)

단일 모범답안이 아니라 **동등한 4개 메뉴**다. 브랜드 성격에 맞는 하나를 고르거나 블렌딩한다 — A로 흘려보내지 말 것.

| 아키타입 | 성격 | 어울리는 브랜드 신호 | 파일 |
|---|---|---|---|
| A 룰드 모듈 그리드 | 시스템틱·정연 | 테크·SaaS·도구·정밀·중립 | `archetypes/a-ruled-grid.md` |
| B 에디토리얼 스프레드 | 비대칭·여백·세리프 인용 | 럭셔리·문학·에디토리얼·따뜻함 | `archetypes/b-editorial.md` |
| C 사이드바 + 캔버스 | 프로덕트 UI·강한 대비 | 프로덕트·도구·대시보드·앱 | `archetypes/c-sidebar.md` |
| D 스택 밴드 | 풀폭 밴드·큰 타입·대담 | 마케팅·대담·실험·강한 퍼스낼리티 | `archetypes/d-stacked-bands.md` |

**선택 규칙:**
- 브랜드 신호(미감·페르소나·무드)로 고른다. accent 세리프가 있고 따뜻/에디토리얼이면 B, 차분/미니멀이면 D는 피한다.
- **고른 아키타입과 한 줄 근거를 `brief.md`의 "레이아웃 메모"에 먼저 적고**(HTML 저작 전), 그 아키타입 파일의 스켈레톤·불변·자유 존을 따라 저작한다. 블렌딩 허용(예: "C 골격 + B의 세리프 풀쿼트") — 근거에 명시.
- **분위기 열림(3방향)**이면 방향마다 **다른 아키타입**을 배정해 구조까지 갈라지게 한다(안전한 SaaS형→A · 프리미엄 에디토리얼형→B · 대담한 실험형→D 등).
```

- [ ] **Step 3: 원칙 섹션 유지 확인** (기존 "원칙 (반드시 지킬 것)" 1~7은 공통 불변이므로 그대로 둔다. "섹션 → 자산/데이터 매핑", "생성 효율"도 유지.)

- [ ] **Step 4: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-html-direction.md','utf8'); if(/검증된 좋은 출발점/.test(s)) throw new Error('단일 스켈레톤 프레이밍 잔존'); if(!/레이아웃 아키타입 선택/.test(s)||!/archetypes\/a-ruled-grid.md/.test(s)) throw new Error('아키타입 선택 섹션 누락'); if(!/원칙 \(반드시 지킬 것\)/.test(s)) throw new Error('공통 원칙 유실'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-html-direction.md
git commit -m "refactor(brand-kit): html-direction을 아키타입 선택 허브로 재작성(단일 스켈레톤 제거)"
```

---

### Task 6: `SKILL.md` 보강 (브리프 메모·저작·흐름)

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md` (brand-briefs.md 구조 213줄 부근, "overview.html 저작" 285줄 부근, 흐름 Step 4·6)

- [ ] **Step 1: brand-briefs.md 레이아웃 메모 보강**

`### 레이아웃 메모 (라이트/다크, 기본 11섹션 §1–11 그리드 — §12 다음 결정은 제외)` 줄을 다음으로 교체:

```markdown
### 레이아웃 메모 (아키타입 + 라이트/다크 + §1–11 — §12 다음 결정은 제외)
**고른 레이아웃 아키타입(A/B/C/D 또는 블렌드) + 한 줄 근거(브랜드 성격에 묶어)**를 여기 먼저 적는다. 아키타입 메뉴·선택 규칙은 `references/brand-kit-html-direction.md`, 개별 골격은 `references/archetypes/<name>.md`.
```

- [ ] **Step 2: "overview.html 저작" 절 보강**

`### overview.html 저작 (이미지 아님)` 본문의 "레이아웃 규칙을 가드레일로 LLM이 저작" 문장에 아키타입 가드레일을 추가한다. 기존 문장 끝에 다음을 잇는다:

```markdown
 저작 전 `brief.md`의 레이아웃 메모에서 **고른 아키타입**을 확인하고, `references/brand-kit-html-direction.md`(선택·공통 규칙)와 해당 `references/archetypes/<name>.md`(스켈레톤·불변·자유 존)를 따른다. 단일 아키타입으로 흘려보내지 말고 브랜드 신호에 맞춰 고른다.
```

- [ ] **Step 3: 흐름 Step 4·6에 아키타입 언급 추가**

흐름 Step 4(`발산 → 전개`)의 "data-only `overview.html`을 저작한다" 앞에 `(brief의 레이아웃 메모에서 고른 아키타입에 따라)`를 삽입. Step 6(`overview.html 마무리`)의 "재저작 또는 외과 편집"에 `(아키타입 불변은 유지, 자유 존만 조정)`를 덧붙인다.

- [ ] **Step 4: 검증**

Run: `node -e "const s=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); if(!/고른 레이아웃 아키타입/.test(s)||!/archetypes\/<name>.md/.test(s)) throw new Error('SKILL.md 아키타입 배선 누락'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 5: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "feat(brand-kit): brief 레이아웃 메모·저작·흐름에 아키타입 선택 배선"
```

---

### Task 7: 동기화·회귀·렌더 검증

**Files:**
- 없음(검증만). `scripts/sync-codex-plugin.mjs`가 `references/`(하위 `archetypes/` 포함)를 번들에 복사하는지 확인.

- [ ] **Step 1: Codex 번들 재생성** *(명령 실행 — 사용자 확인 후)*

Run: `npm run sync`
Expected: 무오류 종료(check-secrets 통과, 번들 재생성).

- [ ] **Step 2: 번들에 아키타입 파일 포함 확인**

Run: `node -e "const fs=require('fs'); const d='plugins/personal/skills/design-brand-kit/references/archetypes'; const f=fs.readdirSync(d); const need=['a-ruled-grid.md','b-editorial.md','c-sidebar.md','d-stacked-bands.md']; for(const n of need) if(!f.includes(n)) throw new Error('번들 누락: '+n); console.log('bundle OK', f)"`
Expected: `bundle OK [ 'a-ruled-grid.md', 'b-editorial.md', 'c-sidebar.md', 'd-stacked-bands.md' ]`

- [ ] **Step 3: 스크립트 회귀 테스트**

Run: `npm test`
Expected: 전체 통과(이 변경은 스크립트 미수정 — 그대로 PASS).

- [ ] **Step 4: 렌더 대조 (수동)**

`docs/superpowers/specs/...` 대신 참조 산출물로 확인: B/C/D 스켈레톤이 `archetypes-preview.html` 렌더와 구조적으로 일치하는지(브라우저로 열어 A=overview.html, B/C/D=preview 대조). 일치하면 통과. (자동화 대상 아님 — 시각 확인.)

- [ ] **Step 5: 최종 상태 보고**

`git log --oneline -5`로 4개 커밋(아키타입·허브·SKILL·없음) 확인. 번들은 gitignore라 커밋되지 않음(소스 .md만 커밋). 사용자에게 산출물·다음 검증법(실제 브랜드 2개로 design-brand-kit 돌려 서로 다른 아키타입 선택되는지) 안내.

---

## Self-Review

**1. Spec coverage:**
- 단일→4 아키타입 라이브러리 → Task 1-4 ✓
- 제약된 스켈레톤+자유 존(각 파일에 스켈레톤·불변·자유 존) → Task 1-4 ✓
- "검증된 출발점(단수)" 프레이밍 제거 → Task 5 Step 1·4 ✓
- 4개 메뉴+선택 규칙+열림 3방향 매핑 → Task 5 Step 2 ✓
- brief 레이아웃 메모 아키타입 커밋 → Task 6 Step 1 ✓
- 공통 출력·렌더 규칙·원칙 1~7 유지 → Task 5 Step 3 ✓
- 파일 분리(허브 + archetypes/ 4) → Task 1-5 ✓
- SKILL.md 저작·흐름 배선 → Task 6 ✓
- Codex 번들에 archetypes/ 포함 → Task 7 Step 1-2 ✓
- 스코프 밖(preview 비커밋·컨택트시트 무변경) → 계획에서 건드리지 않음 ✓

**2. Placeholder scan:** 모든 파일 작성 스텝에 실제 내용(CSS 스켈레톤·문구) 포함. TBD/TODO 없음.

**3. Type consistency:** 파일 경로·아키타입 슬러그(`a-ruled-grid`/`b-editorial`/`c-sidebar`/`d-stacked-bands`)가 Task 1-7에서 일관. 검증 스크립트의 경로·정규식이 작성 내용과 일치.
