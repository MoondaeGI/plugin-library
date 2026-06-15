---
name: ppt-edit
description: Use when 이전에 만든 PPT 덱(.slides/<덱>/spec.json이 있는)을 다시 열어 수정할 때 — "그 보고서 3번 슬라이드 숫자 바꿔줘", "차트를 선그래프로" 같은 재진입. 새 덱을 처음부터 만드는 거라면 ppt-plan/ppt-create.
---

# PPT Edit

기존 덱의 수정 재진입. 모든 수정은 spec.json을 거친다 — deck.pptx는 빌드 산출물이라 손편집하지 않는다.

## 진행

1. **덱 찾기**: cwd의 `.slides/` 아래 덱 목록을 보여주고 대상 확정. `spec.json`이 없으면 "이 덱은 이 파이프라인 산출물이 아니다"라고 안내한다(역가져오기는 비범위).
2. **수정 번역**: 사용자의 요청("3번 제목 바꿔", "차트를 선그래프로")을 `spec.json`의 해당 슬라이드 필드 수정으로 번역. 내용 추가/삭제/순서 변경도 `slides` 배열 조작으로. 필드 이름·계약은 `scripts/lib/ppt/validate-spec.mjs`의 `LAYOUTS`가 권위(자세한 형식은 ppt-create 참조).
3. **재렌더·검수**: `node scripts/lib/ppt/render-deck.mjs .slides/<덱>` → `powershell -File scripts/lib/ppt/export-png.ps1 -PptxPath .slides/<덱>/deck.pptx` → **바뀐 슬라이드의 PNG만** 제시. 추가 수정은 2로 루프.
4. **완료**: 승인 시 deck.pptx 경로 안내.

## 주의

- 렌더는 결정적이라 안 고친 슬라이드는 변하지 않는다 — 바뀐 슬라이드만 다시 보면 된다.
- 사용자가 pptx를 PowerPoint에서 직접 고쳤을 가능성이 보이면(파일 수정 시각이 spec보다 최신) 경고한다: 재렌더가 손편집을 덮어쓴다. 진행 전 확인받는다.
- spec.json은 BOM 없이 저장한다(UTF-8 BOM은 렌더 시 JSON 파싱을 깨뜨린다).
