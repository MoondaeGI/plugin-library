---
name: read-file
description: Use when 받은 파일·자료(문서·이미지·표·차트·코드베이스·로컬 폴더·URL·git 이력 등)를 데이터로 정확히 읽어 핵심 주장·숫자·구조를 끌어낼 때. 포맷마다 네이티브(텍스트·표·차트 데이터)는 추출하고 래스터(그림에 구워진 값)만 비전으로 읽으며, 추출한 수치는 사람이 확인한다. 결과는 호출자가 지정한 경로에 남기고 지정이 없으면 그대로 제시한다. 발표 기획(ppt-plan)·보고 등 어디서든 호출.
---

# Read File

받은 파일·자료를 **데이터로 정확히** 읽어 핵심 주장·숫자·구조를 끌어낸다. 자료가 무엇을 말하는지 끌어내는 데까지가 이 스킬의 일이고, 그걸로 무엇을 만들지(발표·보고·결정)는 호출자 몫이다.

## 위임 원리 (포터블 — 맨 먼저 읽어라)

전용 도구 있으면 위임 → 없으면 세션 기본 도구 → 그것도 없으면 사용자에 요청.
**Claude/Codex 한쪽에서만 도는 경로를 만들지 않는다.** 외부 도구(markitdown·pymupdf·LibreOffice)는 선택 가속기다 — 있으면 쓰고 없으면 사다리를 한 칸 내려간다.

## 자료원 메뉴 — 해당하는 것만 골라 처리

- **건넨 파일·문서** → 받아서 읽는다(아래 "시각 자료 판별" 적용).
- **이미지(차트·표·스크린샷)** → 데이터 소스로 읽어 수치·사실 추출. 픽셀 수치는 비전으로 읽되 환각·뭉갬 주의(→ 추출 수치 확인).
- **이 프로젝트/코드베이스** → 기본 직접 탐색(구조·README·git log·핵심 모듈). 크고 낯설어 구조 지도가 필요할 때만 understand-anything 류에 위임(있으면).
- **로컬 문서 폴더** → 포맷별로 "시각 자료 판별"을 적용한다.
- **URL·웹페이지** → 준 링크를 가져와 읽는다.
- **작업 이력** → git 커밋 이력으로 한 일을 정리(주간·분기 보고 등).
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

이미지·OCR·비전에서 뽑은 **모든 수치**는 결과로 내보내기 전 사용자에게 확인받는다. 산문에 섞지 말고 `원본 → 읽은 값` 목록으로 제시 — 비전/OCR은 자릿수·축 보간·환각에서 틀리기 쉬우니 **사용자 대조가 최종 권위**.

```
[deck p9] 총 탐지 대상 → 124명 · 위험 평균 → 42.5pt · TOP User_99(IT) → 98.5pt
이 값들이 원본과 맞나요?
```

**생출력 정제:** OCR/비전 출력 중 거부·사과("I'm sorry…", "can't extract")·문서와 무관한 라인(인용문·인물 메모 등 환각)은 버린다. 인접 숫자가 뭉친 경우(`1243명` 등)는 레이아웃을 보고 분리한다.

**원본 모순 표면화:** 같은 값이 자료 안에서 어긋나면(예: 한 인물의 부서가 페이지마다 다름) 임의로 고르지 말고 모순을 사용자에게 올려 확정받는다.

## 산출물

기본은 끌어낸 결과를 **그대로 제시**한다(핵심 주장·숫자·구조 + 추출 수치 대조표). **호출자가 저장 경로를 지정하면 거기에 남긴다** — 예: ppt-plan은 `.slides/<덱>/sources.md`로 받는다. 지정이 없으면 파일을 임의로 만들지 않는다.

자료원별 블록 형식(저장할 때):

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

## 경계

자료를 읽어 핵심을 끌어내는 데까지. 그걸로 전략을 짜거나(예: ppt-plan) 산출물을 만드는(예: ppt-create) 일은 호출자 몫이다. 차트 `data` 배열 구조화·검증도 하지 않는다.
