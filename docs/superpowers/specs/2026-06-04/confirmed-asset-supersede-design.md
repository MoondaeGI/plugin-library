# 확정 자산 표시 — 로고 캐노니컬 경로 덮어쓰기 + DESIGN.md 확정-전용

날짜: 2026-06-04
범위: `design-logo` · `design-brand-kit`(오버뷰 저작 지침) · `design-iconset`(한 줄) · `design-md-compiler`
상태: 설계 승인됨, 플랜 대기

## 문제

brand-kit이 만든 **base 자산**과 다운스트림이 만든 **확정 자산**이 오버뷰·DESIGN.md에
**둘 다** 나타난다.

- `overview.html` §6: `logo-base.png` 시리즈(심볼·락업·앱아이콘·파비콘)가 있고, 그 아래
  `<!-- design-logo:slot -->`에 design-logo 확정 로고가 **추가** 주입된다 → base + 확정이
  동시에 보여 stale 초안이 옆에 남는다.
- `DESIGN.md`: 구현자용 문서인데 컨셉 전용 자산(brand-kit 컨셉 아이콘 PNG)·candidate 시안까지
  읽어 "확정"처럼 섞일 수 있다.

## 설계 원리 — HTML을 편집하지 말고 파일을 덮어써라

초기 후보였던 "오버뷰 §6의 경로/마커를 외과 편집해 갈아치운다"는 **§6이 LLM 자유 저작
산출물**이라는 사실과 충돌한다(저장소에 고정 overview.html 없음 — 경로 표현·embed 방식·폰트
모드 분기가 런타임마다 달라 결정적 문자열 치환이 부분 치환/조용한 no-op으로 깨진다).

대신 **오버뷰는 고정된 캐노니컬 경로 하나를 가리키고, lock이 그 파일을 덮어쓴다.** 라이브
서버가 파일 교체를 감지해 자동 새로고침한다. 로고에 대한 HTML 외과 편집이 0이라 위 fragility
전체가 사라지고, `design-logo:slot` 마커도 로고에서는 불필요해진다.

## 핵심 구분 (왜 로고와 아이콘을 다르게 다루나)

| | base 자산 | 확정 자산 | 관계 | 오버뷰 처리 |
|---|---|---|---|---|
| 로고 | `assets/brand-kit/logo-base.png`(시드) | `assets/logo/logo.png` | **같은 종류의 마크** — 초안→최종 | **덮어쓰기**(갈아치움) |
| 아이콘 | `assets/brand-kit/icon/*.png` | `assets/icon/*.svg` | **다른 종류** — PNG는 브랜드 컨셉 전시, SVG는 제품 코드 아이콘 (`design-iconset` SKILL line 14 역할 분리) | **마커 슬롯 병존** |

→ 로고는 갈아치워도 손실 없음(시드는 별도 보존). 아이콘은 갈아치우면 "브랜드 컨셉 전시"가
사라지므로 병존.

## 결정

### D1 — 캐노니컬 로고 경로 + lock 시 덮어쓰기 (HTML 무수정)

- **캐노니컬 표시 경로 `assets/logo/logo.png` 정의.** 오버뷰 §6의 모든 로고 자리(심볼·락업의
  심볼·앱아이콘 타일·파비콘)가 이 한 경로를 가리킨다.
- **`assets/brand-kit/logo-base.png` = 불변 시드** — design-logo가 읽는 시드라 역할 유지.
- **design-logo lock**: 확정 마크를 `assets/logo/logo.png`에 **덮어쓴다**. HTML 편집 없음.
  시드(`logo-base.png`)는 불변이고, design-logo의 작업 시드는 이미 `candidate/logo/seed.png`에
  복사돼 있어(`design-logo` SKILL line 42) 손실 없음.
- **멱등**: 같은 결과로 다시 덮어써도 동일 상태. 마커 매칭에 의존하지 않으므로 거짓 음성 없음.
- **non-clobber (재-lock 안전, 중요)**: brand-kit은 `candidate/logo/logo-briefs.md`(design-logo
  실행 표식)가 **없을 때만** `logo/logo.png`를 시드/미러한다. 있으면 design-logo 결과를 보존해,
  brand-kit 재실행이 확정 로고를 날리지 않는다.
- **엣지(단일 커밋 옵션)**: 사용자가 `logo-base`를 그대로 확정하면 design-logo가 그 마크를
  `logo/logo.png`에 쓴다(`design-logo` line 113) — 동일 메커니즘, 무해.

### D2 — brand-kit 오버뷰 저작: 캐노니컬 경로 참조 + 시드, 로고 슬롯 폐기

`design-brand-kit` SKILL과 `brand-kit-html-direction.md:22`를 바꾼다.

- **§6 저작**: 로고 자리를 `../assets/brand-kit/logo-base.png`가 아니라
  **`../assets/logo/logo.png`**로 참조한다. 워드마크(`wordmark-base.png`)는 그대로.
- **시드/미러**: brand-kit이 `logo-base.png`를 생성/갱신할 때(자산 생산 흐름 5)·lock할 때
  (흐름 8) `logo/logo.png`로 **미러 복사**한다 — 단 non-clobber 규칙(D1) 적용. 이로써 §6이
  가리키는 파일이 brand-kit 작업 중에도 항상 존재한다.
- **`design-logo:slot` 마커(로고) 폐기** — HTML 편집이 없으니 불필요. 대신 정적 안내 한 줄
  허용("전용 로고는 design-logo로 탐색 가능").
- **종횡비 견고성**: §6 로고 자리를 `max-height` + `object-fit:contain`으로 저작해, 확정 마크가
  base와 종횡비가 달라도 graceful하게 degrade(락업 정렬·앱아이콘 타일 깨짐 완화). 앱아이콘
  `filter:brightness(0) invert(1)` 가정은 design-logo의 **단색-유효 품질 기준**
  (`logo-art-direction.md §8`)으로 안전.
- **아이콘 슬롯(§11)·ui-kit 슬롯(§10)은 무변경.**

### D3 — 아이콘셋 무변경 + 비대칭 명시

- `overview.html` §11은 컨셉 PNG + 확정 SVG 슬롯 그대로(역할 분리 보존).
- 비대칭(로고는 덮어쓰기, 아이콘은 병존)이 **의도**임을 `design-logo`·`design-iconset`에 한 줄
  명시 — "빠뜨린 것"으로 오인 방지.

### D4 — design-md-compiler: DESIGN.md는 확정 제품 자산만 (단순화)

DESIGN.md는 구현자용 문서이므로 **락된 확정 제품 자산만** 참조한다.

| 종류 | 담는 것 | 안 담는 것 |
|---|---|---|
| 로고 | `assets/logo/logo.png` — brand-kit lock 후 **항상 존재**하므로 폴백 분기 없이 이 경로만 읽음 | candidate 시안 |
| 아이콘 | `assets/icon/*.svg`(확정 제품 아이콘셋). 없으면 §12 Known Gaps | `brand-kit/icon/*.png`(컨셉 전용 — 제품 아이코노그래피 아님) |
| 페이지 | 확정 페이지 이미지 | `candidate/page/*` 시안 — 확정으로 참조하지 않음 |

구체 변경(`design-md-compiler` SKILL):
- 입력 목록(line 25–28)에서 `brand-kit/icon/*.png`를 "확정 base 자산"에서 빼고 **"컨셉 전용 —
  DESIGN.md 제품 아이코노그래피로 쓰지 않음"**으로 재라벨. 로고 입력은 `assets/logo/logo.png`
  단일 경로로 정리("logo-base 폴백" 문구 제거 — D1·D2로 항상 존재).
- `candidate/page/*` "확정 전 시안 폴백"(line 28) 제거 — 확정 페이지 이미지가 없으면 §6은 가능
  범위만, 누락은 §12.
- **(선택) 출처 표시**: `candidate/logo/logo-briefs.md`가 있으면 "전용 로고 탐색됨", 없으면
  §12에 "전용 로고 미탐색 — brand-kit base 마크 사용(design-logo 권장)" 한 줄. 덮어쓰기라
  파일만으론 출처 구분이 안 되므로 이 표식으로 판별.
- §8·§12에 "DESIGN.md는 락된 확정 자산만 참조" 원칙 한 줄.

### degrade (확정 deliverable 부재 시)

- **로고**: `assets/logo/logo.png`가 brand-kit lock 후 항상 존재(D1) → 늘 표시 가능. design-logo
  미실행이면 base 마크가 그 경로에 있다(확정으로 인정).
- **아이콘**: 컨셉 PNG로 폴백하지 않는다 — §12 Known Gaps로만 표시.
- 로고·아이콘 비대칭 허용(로고는 늘 존재, 아이콘은 gap 가능).

## 영향 파일

- `skills/design-logo/SKILL.md` — 흐름 10(덮어쓰기·HTML 무수정으로 변경), 비대칭 명시(D3)
- `skills/design-brand-kit/SKILL.md` — 자산 생산 흐름 5·lock 흐름 8(`logo/logo.png` 미러+
  non-clobber), §6 슬롯 저작 지침(슬롯 폐기·캐노니컬 경로)
- `skills/design-brand-kit/references/brand-kit-html-direction.md` — §6 매핑(line 22: 로고 경로·
  종횡비 견고성)
- `skills/design-iconset/SKILL.md` — 비대칭 명시(D3, 한 줄)
- `skills/design-md-compiler/SKILL.md` — 입력 목록 라벨(line 25–28)·§8·§12(D4)

생성물 동기화: 스킬 수정 후 `npm run sync`로 Codex 번들 재생성(AGENTS.md).

## 비범위

- ui-kit 슬롯(§10)·iconset 슬롯(§11) 주입 메커니즘 무변경.
- design-page-image·design-ui-kit 동작 무변경.
- 자산 폴더 구조·파일명 규약 무변경(`assets/logo/logo.png`·`assets/brand-kit/logo-base.png`는
  현행 경로 그대로 — 역할 정의만 명확화).
