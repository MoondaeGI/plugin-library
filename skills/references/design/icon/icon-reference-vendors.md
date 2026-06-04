# 아이콘 세트 선택 카탈로그 (Icon Set Selection Catalog)

이 문서는 **`design-iconset`의 세트 선택(G2)용 카탈로그**다. §11 스타일을 실제 Iconify set-id로 잇는다. 단일 세트 원칙(프로젝트당 1개)에 따라 여기서 후보를 좁혀 1개를 lock한다.

> **스코프 주의:** 아래 set-id는 **iconset이 fetch 대상으로 실제 사용**한다. 반면 `design-brand-kit`의 *이미지 생성* 보드 아이콘은 여전히 "벤더명을 프롬프트에 쓰지 않는다"(이미지 모델은 'Linear처럼'을 못 그림). 즉 **벤더명 금지 규칙은 brand-kit 이미지 생성에만** 적용되고, iconset의 라이브러리 fetch에는 적용되지 않는다.

## 스타일 → 후보 세트

| §11 스타일(catalog) | 후보 Iconify set-id | 특징 | 라이선스 |
|---|---|---|---|
| Line / Outline | `lucide`, `tabler`, `ph`(regular) | 얇은 stroke, 차분, 정보밀도↑ | ISC / MIT / MIT |
| Filled | `ph`(fill), `material-symbols`(filled) | 강한 식별성, 작은 크기 | MIT / Apache-2.0 |
| Duotone | `ph`(duotone) | currentColor + opacity 2톤(단색 계약 호환) | MIT |
| Solid Glyph | `material-symbols`, `mdi` | 단단·컴팩트 | Apache-2.0 / Apache-2.0 |
| Outline + Minimal Fill | `tabler`, `ph` | 기능적 강조 | MIT / MIT |

## 선택 기준 (정성 점수화)

후보 세트를 다음으로 비교해 1개 lock:
- **스타일 적합** — §11 폼 규칙(stroke/join/corner)과 일치하는가.
- **라이선스** — MIT/Apache/ISC 우선(attribution 부담 최소). CC-BY는 attribution이 다운스트림까지 전파됨.
- **밀도/커버리지** — 제품 리스트(특히 도메인)를 얼마나 담는가. (G2.5 적중률 측정으로 확정)

## 주의
- 아이콘 단위로 세트를 넘나들지 않는다(one-family 붕괴). **세트는 1개.**
- 세트에 없는 도메인 아이콘은 그 세트를 레퍼런스로 합성/저작(Plan 2 / 손저작).
