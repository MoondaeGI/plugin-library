# read-file 스킬 신설 + ppt-plan 게이트1 슬림화 — 구현 계획

> **개정 (2026-06-16):** 구현 후 스킬을 범용 **`read-file`**로 개명하고 산출물을 호출자 지정으로
> 바꿨다(상세는 spec 개정 노트 참고). 이하 본문의 `ppt-analyze-source`·고정 `.slides/<덱>/sources.md`
> 표기는 실행 당시 기록이며, 현행 권위는 `skills/read-file/SKILL.md`다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-06-15/read-file-design.md`

**Goal:** 발표 자료원을 요소 단위로 분석(네이티브 추출 / 래스터만 비전)해 `.slides/<덱>/sources.md`로 남기는 새 스킬 `ppt-analyze-source`를 만들고, `ppt-plan` 게이트1을 그 위임으로 슬림화한다.

**Architecture:** 코드 없는 산문 스킬 2개. 새 스킬은 ① 포터블 위임 원리 ② 자료원 메뉴(8) ③ 시각 자료 요소 단위 판별(결정 6·7, 변환/프로브/렌더 명령 스니펫 포함) ④ 추출 수치 always 확인+생출력 정제+원본 모순 표면화 ⑤ sources.md 형식 ⑥ 경계를 담는다. `ppt-plan` 게이트1은 "자료원 식별 → ppt-analyze-source 위임 → (부재 시) 직접 읽기 폴백"으로 축소한다. 외부 도구(markitdown·pymupdf·LibreOffice)는 선택 가속기 — 저장소 의존성에 넣지 않는다.

**Tech Stack:** Markdown `SKILL.md`(Claude+Codex 공유), `superpowers:writing-skills`(저작 규칙), `npm run sync`(Codex 번들 재생성). 검증은 텍스트 리뷰 + DLD PDF 픽스처 리허설(실행 단위 테스트 없음 — 산문 스킬).

---

## File Structure

- **Create:** `skills/ppt-analyze-source/SKILL.md` — 자료원 분석 산문 스킬. 판별·변환·렌더·프로브 명령 스니펫을 본문에 인라인(별도 추적 .py 모듈 없음 — 결정 6·7의 "선택 가속기, 비번들" 방침 준수).
- **Modify:** `skills/ppt-plan/SKILL.md:16-30` — 게이트1 본문을 위임 블록으로 교체. frontmatter `description`은 유지(위임으로도 여전히 정확).
- **Regenerate:** `plugins/personal/`(Codex 번들 — gitignore, 커밋 안 함)을 `npm run sync`로 재생성.

검증 픽스처(이미 실측 완료, 리허설 기준):
`C:\Users\CIOT\Documents\카카오톡 받은 파일\DLD 보안 솔루션 고도화 전략 (1).pdf`
→ 슬라이드형 PDF(14쪽·텍스트 2,683자·이미지 124개)로 판별되어 페이지 렌더+full-page 비전 경로를 타야 한다.

---

## Task 1: 새 스킬 `skills/ppt-analyze-source/SKILL.md` 저작

**Files:**
- Create: `skills/ppt-analyze-source/SKILL.md`

- [ ] **Step 1: `superpowers:writing-skills` 스킬을 먼저 호출한다** (CLAUDE.md 규칙 — 새 스킬 저작 시 필수). frontmatter `name`/`description` 규칙·구조 가이드를 따른다.

- [ ] **Step 2: 아래 내용 그대로 `skills/ppt-analyze-source/SKILL.md`를 작성한다.**

````markdown
---
name: ppt-analyze-source
description: Use when 발표 자료원(건넨 파일·이미지·이 프로젝트/코드베이스·로컬 문서 폴더·URL·내 작업내역(git)·외부 조사·머릿속)을 분석해 핵심 주장·숫자·구조를 끌어내 `.slides/<덱>/sources.md`로 남길 때. ppt-plan 게이트1이 위임하고 ppt-edit도 새 자료 추가 시 쓴다. 전략·페이지 설계는 ppt-plan, 파일 제작은 ppt-create.
---

# PPT Analyze Source

발표 자료원을 받아 발표에 쓸 **핵심 주장·숫자·구조**를 끌어내 요약·확인받고 `.slides/<덱>/sources.md`에 남긴다. 전략·페이지 설계(ppt-plan)·파일 제작(ppt-create)은 하지 않는다.

## 위임 원리 (포터블 — 맨 먼저 읽어라)

전용 도구 있으면 위임 → 없으면 세션 기본 도구 → 그것도 없으면 사용자에 요청.
**Claude/Codex 한쪽에서만 도는 경로를 만들지 않는다.** 외부 도구(markitdown·pymupdf·LibreOffice)는 선택 가속기다 — 있으면 쓰고 없으면 사다리를 한 칸 내려간다.

## 자료원 메뉴 — 해당하는 것만 골라 처리

- **건넨 파일·문서** → 받아서 읽는다(아래 "시각 자료 판별" 적용).
- **이미지(차트·표·스크린샷)** → 데이터 소스로 읽어 수치·사실 추출. 픽셀 수치는 비전으로 읽되 환각·뭉갬 주의(→ 추출 수치 확인).
- **이 프로젝트/코드베이스** → 기본 직접 탐색(구조·README·git log·핵심 모듈). 크고 낯설어 구조 지도가 필요할 때만 understand-anything 류에 위임(있으면).
- **로컬 문서 폴더** → 포맷별로 "시각 자료 판별"을 적용한다.
- **URL·웹페이지** → 준 링크를 가져와 읽는다.
- **내 작업내역** → git 커밋 이력으로 한 일을 정리(주간·분기 보고).
- **외부 주제 조사** → deep-research 있으면 위임, 없으면 세션 웹검색 약식, 없으면 자료 요청.
- **머릿속에만 있다** → 인터뷰로 끌어낸다(핵심 주장·근거·예상 반론).

## 시각 자료 판별 — 네이티브는 추출, 래스터만 비전

파일을 통째로 "시각적/텍스트"로 판정하지 말고, **각 요소가 네이티브냐 래스터냐**를 가른다.

- **네이티브**(본문·`<w:tbl>` 표·`chartN.xml` 차트·PDF 텍스트 레이어) = 데이터가 텍스트로 있음 → **추출**(정확·무료·결정적).
- **래스터**(붙여넣은 차트 PNG·스캔·스크린샷) = 픽셀 → **비전 + always 확인**.

### Office (.docx/.pptx/.xlsx — zip)

`markitdown`으로 본문·표·네이티브 차트를 뽑는다:

```
markitdown <파일> -o <out>.md
```

그다음 래스터를 프로브한다 — 아카이브의 `word|ppt/media/`(래스터)·`charts/`(네이티브)·`embeddings/`(OLE)를 나열하고 markitdown 출력의 `![](…)` 마커를 센다:

```python
import zipfile
with zipfile.ZipFile("<파일>") as z:
    for n in z.namelist():
        if any(k in n for k in ("media/", "charts/", "embeddings/")):
            print(n, z.getinfo(n).file_size)
```

`media/`에 래스터가 있으면 그 바이트만 꺼내 비전으로 읽고(full-page 렌더 불필요 — 임베드 이미지가 이미 잘린 그림), 수치는 always 확인.

### PDF

쪽당 텍스트량 vs 이미지 수로 분기한다:

```python
import fitz
doc = fitz.open("<파일>")
chars = sum(len(p.get_text("text")) for p in doc)
imgs = sum(len(p.get_images()) for p in doc)
print(doc.page_count, chars, imgs)
```

- **텍스트 충실**(쪽당 글자 많고 이미지 적음) → `markitdown <파일> -o <out>.md`(plain). 래스터화 금지 — 완벽한 텍스트를 비전이 망친다.
- **텍스트 희박 + 이미지 多**(슬라이드·스캔형) → **페이지째 렌더 후 full-page 비전**:

```python
import fitz
doc = fitz.open("<파일>")
mat = fitz.Matrix(2.5, 2.5)  # ~180dpi, 작은 글씨 대비
for i in range(doc.page_count):
    doc[i].get_pixmap(matrix=mat).save(f"page{i+1}.png")
```

렌더한 PNG를 비전(Read 등)으로 읽는다. **per-fragment OCR(이미지 조각별 OCR)은 쓰지 않는다** — 맥락이 없어 환각·노이즈·숫자 뭉갬이 심하다(실측).

### 레거시 .doc/.xls (OLE)

zip 프로브 불가. `.xls`는 `markitdown`(xls extra 설치 시 — `pip install "markitdown[xls]"`)으로 직접 추출하되 명령은 `markitdown <파일> -o <out>.md` 그대로다. `.doc` 등은 `LibreOffice`로 PDF 정규화 후 위 PDF 경로로:

```
soffice --headless --convert-to pdf --outdir <출력폴더> <파일>
```

**주의(Claude):** Claude의 PDF Read는 `pdftoppm`(poppler)에 의존해 미설치 환경에선 실패한다 — 그래서 PDF 1차는 Read가 아니라 markitdown/pymupdf 렌더다.

## 추출 수치 확인 (always)

이미지·OCR·비전에서 뽑은 **모든 수치**는 sources.md/outline에 넣기 전 사용자에게 확인받는다. 산문에 섞지 말고 `원본 → 읽은 값` 목록으로 제시 — 비전/OCR은 자릿수·축 보간·환각에서 틀리기 쉬우니 **사용자 대조가 최종 권위**.

```
[deck p9] 총 탐지 대상 → 124명 · 위험 평균 → 42.5pt · TOP User_99(IT) → 98.5pt
이 값들이 원본과 맞나요?
```

**생출력 정제:** OCR/비전 출력 중 거부·사과("I'm sorry…", "can't extract")·문서와 무관한 라인(인용문·인물 메모 등 환각)은 버린다. 인접 숫자가 뭉친 경우(`1243명` 등)는 레이아웃을 보고 분리한다.

**원본 모순 표면화:** 같은 값이 자료 안에서 어긋나면(예: 한 인물의 부서가 페이지마다 다름) 임의로 고르지 말고 모순을 사용자에게 올려 확정받는다.

## 산출물: `.slides/<덱>/sources.md`

자료원별 블록으로 남긴다:

```markdown
## [S1] <출처 파일/URL> — <종류·판별 결과>
- 출처/메타: 단위·기간·출처
### 핵심 주장
1. …
### 핵심 숫자 (→ 확인됨)
- …
### 구조
…
```

outline.md의 근거가 이 블록을 가리킨다.

## 경계

전략·페이지 설계 안 함(ppt-plan). 차트 `data` 배열 구조화·검증 안 함(ppt-create). 출처 표시까지가 이 스킬의 끝.
````

- [ ] **Step 3: 스펙 대조 자가 점검.** 작성한 SKILL.md가 스펙 `ppt-analyze-source-design.md`의 결정 1~7과 본문 구조를 모두 덮는지 확인한다:
  - 결정1 산출물 sources.md ✓ · 결정2 포터블 위임 ✓ · 결정3 코드베이스 기본 직접탐색 ✓ ·
    결정4 추출 수치 always 확인+정제+모순 표면화 ✓ · 결정5 (리뷰어/점수 없음 — 본문에 그런 게 없어야 함) ✓ ·
    결정6 요소 단위 판별(zip 프로브/PDF 텍스트밀도/OLE 정규화/per-fragment 폐기) ✓ · 결정7 도구 사다리+poppler 주의 ✓
  누락이 있으면 본문에 추가한다.

- [ ] **Step 4: frontmatter 유효성 확인.** `name: ppt-analyze-source`, `description`가 "Use when…" 형태로 시작하는지(writing-skills 규칙) 확인한다.

- [ ] **Step 5: Commit**

```bash
git add skills/ppt-analyze-source/SKILL.md
git commit -m "feat(ppt-analyze-source): 자료원 요소 단위 분석 스킬 신설"
```

---

## Task 2: `ppt-plan` 게이트1 슬림화

**Files:**
- Modify: `skills/ppt-plan/SKILL.md:16-30`

- [ ] **Step 1: 게이트1 본문(18-30행)을 위임 블록으로 교체한다.**

교체 대상 (현재 18-30행, `### 게이트 1: 자료` 헤더 바로 아래):

```
주제를 들으면 먼저 자료의 출처를 정한다:

- **자료가 있다** → 받아서 읽고 소화. 핵심 주장·숫자·구조를 요약해 보여주고 확인받는다.
  - **이미지(차트·표·스크린샷 캡처)가 섞여 있으면** 디자인 참고가 아니라 *데이터 소스*로 읽어 그 안의 수치·사실을 끌어낸다.
  - 이미지에서 뽑은 **모든 수치는 outline에 넣기 전 always 확인**받는다. 산문 요약에 섞지 말고 `원본 → 읽은 값` 목록으로 따로 제시한다:
    ```
    [매출차트.png] 2024 Q3 매출 → 12.4억 · Q4 → 15.1억  (단위·기간 원본대로)
    이 값들이 원본과 맞나요?
    ```
    OCR은 자릿수·축 보간에서 틀리기 쉬우니 **사용자 대조가 최종 권위**다.
  - **이미지를 볼 수 없는 환경(비전 미지원)이면** 추출을 시도하지 말고 "이 이미지의 핵심 수치를 텍스트로 알려주세요"로 요청한다 — 한쪽에서만 도는 안전장치를 만들지 않는다.
- **조사가 필요하다** → 깊은 조사 스킬(예: deep-research)이 세션에 있으면 위임, 없으면 세션 웹 검색으로 약식 조사. 그것도 안 되면 자료를 요청한다.
- **머릿속에 있다** → 인터뷰로 끌어낸다: "핵심 주장이 뭔가요? 근거는? 예상 반론은?"
```

교체 후:

```
주제를 들으면 자료가 어디 있는지 식별하고 **`ppt-analyze-source`로 분석**해 핵심 주장·숫자·구조를 요약·확인받는다(결과는 `.slides/<덱>/sources.md`). 자료원은 건넨 파일·이미지·이 프로젝트/코드베이스·로컬 문서 폴더·URL·내 작업내역(git)·외부 조사·머릿속 등 — 분석법·시각 자료 판별·위임·추출 수치 확인은 그 스킬이 맡는다.

`ppt-analyze-source`가 세션에 없으면 ppt-plan이 직접 자료를 읽고 소화한다(현행 동작) — 한쪽에서만 도는 경로를 만들지 않는다.

분석이 끝나면 게이트 2로.
```

- [ ] **Step 2: frontmatter `description`은 건드리지 않는다.** "자료에 차트·표·스크린샷 같은 이미지가 섞여 있어도 데이터 소스로 읽어 수치·사실을 끌어낸다"는 위임으로도 여전히 정확하므로 유지한다.

- [ ] **Step 3: 잔여 참조 점검.** `ppt-plan/SKILL.md`의 게이트2·3·outline 형식·끝맺음 절에서 게이트1의 옛 이미지 블록을 가리키는 문장이 없는지 확인한다(현재 67행 "이미지에서 끌어온 근거는 …"는 outline 출처 표기라 유지 — 분석 위임과 무관). 변경 불필요.

- [ ] **Step 4: Commit**

```bash
git add skills/ppt-plan/SKILL.md
git commit -m "refactor(ppt-plan): 게이트1을 ppt-analyze-source 위임으로 슬림화"
```

---

## Task 3: Codex 번들 재생성

**Files:**
- Regenerate: `plugins/personal/`(gitignore — 커밋 안 함)

- [ ] **Step 1: sync 실행** (CLAUDE.md: 명령 실행 전 사용자 승인 — 리뷰 체크포인트에서 확인).

Run: `npm run sync`
Expected: 에러 없이 완료. `plugins/personal/skills/ppt-analyze-source/SKILL.md`가 생성되고 `plugins/personal/skills/ppt-plan/SKILL.md`가 갱신됨.

- [ ] **Step 2: 기존 스크립트 회귀 없음 확인** (이번 변경은 문서 전용이라 통과해야 함).

Run: `npm test`
Expected: PASS (기존 `tests/**/*.test.mjs` 전부).

- [ ] **Step 3: 생성물 확인.** `plugins/personal/skills/ppt-analyze-source/SKILL.md`가 루트 `skills/ppt-analyze-source/SKILL.md`와 바이트 일치하는지 확인. (커밋하지 않는다 — gitignore된 로컬 생성물.)

---

## Task 4: 인수 리허설 — DLD PDF 픽스처로 dry-run

**Files:** 없음(스킬 동작 검증). 산문 스킬이라 실행 단위 테스트 대신 리허설로 검증.

- [ ] **Step 1: 판별 프로브 재현.** 픽스처 PDF에 PDF 분기 스니펫을 돌려 `14쪽 / 텍스트 ~2,683자 / 이미지 124개`가 나오고 **"슬라이드형"으로 분기**되는지 확인.

Run(예): `python -c "import fitz;d=fitz.open(r'C:\Users\CIOT\Documents\카카오톡 받은 파일\DLD 보안 솔루션 고도화 전략 (1).pdf');import sys;print(d.page_count,sum(len(p.get_text('text')) for p in d),sum(len(p.get_images()) for p in d))"`
Expected: `14 2683 124` 부근 → 텍스트 희박+이미지 多 → 페이지 렌더 경로.

- [ ] **Step 2: 페이지 렌더 + full-page 비전.** 렌더 스니펫으로 14쪽 PNG 생성 후 비전(Read)으로 읽어 다음이 **환각 없이** 잡히는지 확인:
  - 수식 `Risk_total = (W_day × S_now) + (W_week × S_avg) + (W_month × S_accum)`
  - 대시보드 `124명 / 3명 / 18건 / 42.5pt`, TOP `User_99(IT) 98.5pt · User_01(연구) 92.1pt`
  - per-fragment OCR식 쓰레기(햄릿·`1243명`)가 **없어야** 통과.

- [ ] **Step 3: 게이트 작동 확인.** 산출 sources.md 초안에서
  - 추출 수치가 `원본 → 읽은 값` 대조표로 제시되는가(always 확인),
  - **원본 모순**(`User_01` 부서가 연구소/연구/개발본부로 엇갈림)이 임의 선택 없이 사용자에게 올려지는가
  를 확인한다. 둘 다 충족하면 스킬이 스펙대로 동작.

- [ ] **Step 4: 리허설 결과를 커밋 메시지/PR 노트에 한 줄로 기록**(아티팩트는 임시 폴더라 커밋 안 함).

---

## Self-Review (작성자 체크)

- **스펙 커버리지:** 결정1~7 + 본문 구조 6항 → Task1 Step3에서 1:1 대조. 게이트1 슬림화 → Task2. Codex 반영 → Task3. 실효 검증 → Task4. 누락 없음.
- **플레이스홀더 스캔:** "TBD/적절히/등등" 없음 — SKILL.md 전문·교체 전후 텍스트·스니펫 모두 실제 내용.
- **타입/명칭 일관성:** 스킬명 `ppt-analyze-source`, 산출물 `.slides/<덱>/sources.md`, 외부 도구 `markitdown`/`pymupdf(fitz)`/`LibreOffice(soffice)` — 전 태스크에서 동일 표기.

---

## 범위 밖 (스펙 계승)

- 신뢰도 점수·subagent 리뷰어 없음.
- 차트 `data` 배열 구조화·검증(ppt-create).
- ppt-create/ppt-edit 본문 변경 없음(ppt-edit는 호출만, 이번 미수정).
- 외부 도구를 저장소 `package.json` 의존성으로 추가하지 않음(전역 선택 가속기).
