---
name: design-page-image
description: （placeholder · 미구현 — 아직 호출하지 말 것）DESIGN.md를 시드로 랜딩/대시보드/앱 화면의 섹션별 디자인 이미지를 만드는 designer 소유의 선택 다운스트림 단계. 전면 재작성 예정 — 범위·입력·산출물은 별도 논의에서 확정한다.
---

# Design Page Image (재작성 중 — 미구현)

> **상태: placeholder.** 기존 구현(브랜드 킷 기반 섹션별 이미지 브리프 + `image-gen` 생성)은 전면 재작성을 위해 보류됐다. 호출하지 말 것 — 기존 내용은 git 히스토리에 남아 있다(복구·참조 가능).

## 의도 (재작성 전 메모)

디자인 핵심 파이프라인(`…ui-kit → md-compiler`)에서 **유리된 선택 다운스트림 단계**. 소유: **designer** 에이전트. 핵심 파이프라인의 일부가 아니라, `DESIGN.md`가 확정된 *뒤* 필요할 때만 실행한다.

- 입력(예정): `DESIGN.md`(단일 시드 계약) + `.design/assets/`(브랜드·로고·아이콘 등 시각 앵커). 기존처럼 `BRAND_KIT.md`·`ui-base.png` 등을 여러 갈래로 직접 읽는 대신 **DESIGN.md 중심**으로 재설계한다 — 외부 도구도 DESIGN.md 하나로 받아 쓰게.
- 산출(예정): 랜딩/대시보드/앱 화면의 섹션별 디자인 이미지.
- 위치: md-compiler 뒤 *선택*. designer가 핵심 파이프라인을 마친 후 "page-image 만들까요?"로 제안·실행.
- 검토 중: Stitch 등 외부 MCP를 이미지/UI 생성 백엔드로 쓰는 옵션.

재설계가 시작되면 이 파일을 정식 SKILL.md로 대체한다.
