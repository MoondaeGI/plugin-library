---
name: ppt-create
description: Use when 발표 내용·구성이 정해진 뒤 실제 PPT 파일(.pptx)을 만들 때 — 합의된 outline.md가 있거나, "이 내용으로 PPT 만들어줘"처럼 무엇을 말할지는 정해졌고 슬라이드 생산만 남았을 때. 자료·전략·페이지 설계가 아직이면 ppt-plan, 기존 덱 수정은 ppt-edit.
---

# PPT Create

합의된 발표 기획(outline.md)을 실제 `.pptx`로 만드는 덱 프로듀서. 무게중심("무엇을 말할까")은 ppt-plan에서 끝났다 — 여기서는 기계적으로 만들고, 눈으로 검수한다.

## 전제

- `.slides/<덱-슬러그>/outline.md`가 있어야 한다. 없으면 **ppt-plan부터** 진행하도록 안내하고 멈춘다 (내용 없는 디자인은 안 만든다).
- 렌더·검수 스크립트는 이 플러그인의 `scripts/lib/ppt/`에 있다 (`pptxgenjs` 설치됨). **명령은 플러그인 루트에서 실행**하고, 덱 경로는 그 기준 상대경로(`.slides/<덱>`)로 준다.

## 진행

1. **테마 선택(1회)**: 테마는 모두 `skills/ppt-theme/themes/<이름>/`에 있다(기본 `default-corporate`, 커스텀이 있으면 같은 폴더에 함께). `availableThemes()` 목록과 기본 추천(`default-corporate`)을 보여주고 택1. 테마는 직교 액세서리 — 한 번 고르면 끝.
2. **내용 → spec.json**: outline.md의 페이지별 한 줄 메시지·근거를 슬라이드 내용으로 번역해 `.slides/<덱>/spec.json` 작성(아래 형식·필드 표). 레이아웃은 내용에 맞게 배정. 페이지 메시지는 해당 슬라이드 `notes`(발표자 노트)에 기본 탑재.
3. **렌더**: `node scripts/lib/ppt/render-deck.mjs .slides/<덱>`. 검증 실패 시 에러가 슬라이드 번호·필드를 짚어준다 — 그걸 보고 spec을 고친다.
4. **검수 게이트**: `powershell -File scripts/lib/ppt/export-png.ps1 -PptxPath .slides/<덱>/deck.pptx` → `review/slide-*.png`를 **먼저 직접 읽고** 오버플로·겹침·어색한 줄바꿈을 자가 수정한 뒤, 사용자에게 번호와 함께 제시.
5. **수정 루프**: 사용자의 "N번 ~게 고쳐"를 spec.json 수정으로 번역 → 재렌더 → **바뀐 슬라이드 PNG만** 다시 제시. 렌더는 결정적이라 안 고친 슬라이드는 변하지 않는다.
6. **lock**: 승인되면 완료. deck.pptx 경로를 알려준다.

## spec.json 형식

```json
{
  "theme": "default-corporate",
  "slides": [
    { "layout": "title",   "fields": { "title": "표지 제목", "subtitle": "부제" }, "notes": "발표자 노트(선택)" },
    { "layout": "bullets", "fields": { "title": "요약", "bullets": ["요점1", "요점2"] } }
  ]
}
```

- `theme`(필수, 문자열) + `slides`(필수, 비어있지 않은 배열).
- 슬라이드마다 `layout`·`fields`(필수), `notes`(선택, fields 밖 형제 키).
- **JSON 파일은 BOM 없이 저장**하라 — UTF-8 BOM이 붙으면 렌더 시 `JSON.parse`가 깨진다(Windows에서 `Out-File`/`Set-Content`는 BOM을 붙이니 직접 파일 쓰기 사용).

## 레이아웃 8종 · 필드

권위(필수/선택·글자 수 상한)는 `scripts/lib/ppt/validate-spec.mjs`의 `LAYOUTS`. 아래는 필드 이름 빠른 참조:

| layout | 필수 fields | 선택 fields |
|---|---|---|
| title | title | subtitle, date |
| section | title | subtitle |
| bullets | title, bullets[] | — |
| two-col | title, leftTitle, leftBullets[], rightTitle, rightBullets[] | — |
| chart | title, chartType(`bar`\|`line`\|`pie`), data[] | — |
| table | title, columns[], rows[][] | — |
| image | path | title, caption |
| closing | title | subtitle |

- `chart`의 `data`는 시리즈 배열: `[{ "name": "시리즈명", "labels": ["A","B"], "values": [1,2] }]` — `name`은 범례용이라 꼭 넣는다. labels와 values 길이는 같아야 한다.
- `table`의 `rows`는 각 행 길이가 `columns` 길이와 같아야 한다.
- `image`의 `path`는 덱 디렉터리 기준 상대경로 또는 절대경로. 렌더 시 파일이 없으면 실패한다.

## 산출물

```
.slides/<덱-슬러그>/
  outline.md   # ppt-plan 산출물 (입력)
  spec.json    # 단일 진실 소스
  deck.pptx    # 빌드 산출물 (손편집 금지)
  review/      # slide-NN.png 검수 이미지
```

## 주의

- PowerPoint COM이 없으면(비Windows·미설치) export는 exit 2로 안내 후 스킵 — deck.pptx는 정상 산출, 검수는 사용자가 직접 연다.
- 글자 수 상한을 넘는 내용은 박스를 키우지 말고 문장을 줄인다 — 짧은 문장이 좋은 슬라이드다.
- deck.pptx를 PowerPoint에서 손편집하지 않는다 — 모든 수정은 spec.json 경유(ppt-edit).
