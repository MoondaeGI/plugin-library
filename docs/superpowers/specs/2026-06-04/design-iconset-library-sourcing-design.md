# design-iconset 라이브러리 소싱 전환 — 설계 (Spec)

- 날짜: 2026-06-04
- 대상 스킬: `skills/design-iconset/`
- 상태: 설계 확정(구현 전)

## 1. 배경 / 문제

현재 `design-iconset`은 **LLM이 §11 규칙을 보고 제품 아이콘 SVG를 맨땅에서 저작**한다. 이 방식은 일관성·디테일이 LLM 손그림 수준에 묶여 품질 한계가 명확하다.

전환 목표: **Iconify를 접근 계층으로 단일 세트에서 아이콘을 fetch**하고, 세트에 없는 것만 합성·저작한다. 개별 품질은 "실제 디자이너가 만든 세트" 수준으로 올리고, one-family 일관성은 "단일 출처 세트"로 오히려 강화한다.

## 2. 범위

- **이번 라운드 대상은 `design-iconset`만.** `design-brand-kit`의 컨셉 아이콘 이미지 생성(`assets/brand-kit/icon/*.png`)은 **손대지 않는다.**
- 출력 계약 불변: `.design/assets/icon/*.svg`, `viewBox="0 0 24 24"`, `currentColor`, 아이콘당 개별 `.svg` 파일. 다운스트림 `design-ui-kit`(SVG 인라인 소비)은 영향 없음.
- `OPENAI_API_KEY` 불필요는 유지(Iconify는 키 없음). **저작 시 네트워크 필요**(api.iconify.design)라는 전제만 추가.

## 3. 핵심 원칙

### 3.1 단일 세트 원칙
프로젝트당 **Iconify 세트 1개**만 골라 그 세트에서만 아이콘을 뽑는다. 아이콘 단위로 세트를 넘나드는 "베스트매치 쇼핑"은 금지 — one-family가 깨진다. 세트에 없는 것만 그 세트를 레퍼런스로 합성·저작한다.

### 3.2 코어/도메인 분리 처리
- **코어·상태** → Iconify fetch가 잘 되는 영역(라이브러리 이득 큼).
- **도메인**(업종 전용) → 세트에 거의 없음. **그 세트의 base 글리프 위에 합성**(세트가 전경이 되게)하거나 hero만 저작. 순수 근사대체는 최후 수단으로 격리·플래그.

### 3.3 깊이는 두 번째 색 금지
깊이/구분은 stroke 굵기·간격·`currentColor` opacity로만 낸다(상태 아이콘만 §11 색 분기 허용). Phosphor duotone 계열은 `currentColor` + 배경 path `opacity`로 구현돼 이 원칙과 이미 호환된다(2색 아님).

## 4. 파이프라인 / 게이트 흐름

기존 "리스트→메타포 합의→저작"의 **메타포 게이트를 fetch 뒤로 이동·조건부화**한다. fetch 가능한 것에 메타포를 끼워맞추는 역류를 막기 위함이다.

```
Phase 0  brand kit 감지 (기존 유지)

G1  아이콘 리스트 확정 — 코어/도메인/상태 3분류 (기존 유지)

G2  세트 선택 (신규)
    §11 스타일 → style-catalog → 후보 Iconify set-id 2~3개
    후보들의 동일 대표 아이콘을 실제 fetch해 비교 시트로 제시
    스타일/라이선스/밀도로 후보 *세트*를 점수화 → 단일 세트 lock
    + 그 세트의 backbone 합성 문법 1개 합의

G2.5  fetch 적중률 측정 게이트 (신규) — §6 수정
    리스트를 세트에 대조해 probe. 각 아이콘에 fetched / ambiguous / gap 태그.
    분류별 적중률을 숫자로 제시:
      예) 코어 11/12, 도메인 3/9, 상태 4/4
    도메인 적중률이 낮으면 사용자에게 분기 제시:
      (a) 다른 세트 재선택  (b) 이 세트로 합성 진행  (c) 도메인은 맨땅 저작 유지
    → 세트 go/no-go 결정. 개별 아이콘 승인이 아니라 프로젝트 단위 체크포인트.

G3  메타포·모드 합의 (조건부) — §1 수정
    fetched(명백)        → 자동, 게이트 생략
    ambiguous(후보 여럿) → 가벼운 확인만
    gap                  → 정식 concept → metaphor → compose mode 합의
    (사용자는 "실제 세트에 뭐가 있는지 본 상태"에서 gap/ambiguous만 합의)

Phase 2  조립 → 정규화 → 합성 → 시트 검수 → 편집 → lock
```

## 5. 조립 단계 (Phase 2) 상세

### 5.1 fetch + 정규화 — §2·§4 수정
- **fetch·currentColor 통일·24그리드 정규화·optimize는 `@iconify/tools`에 위임**(검증된 표준 경로).
- **정규화를 정식 단계로 명시**한다. 세트마다 원본 좌표계가 다르므로(예: Phosphor `0 0 256 256`) 단순 viewBox 속성 교체가 아니라 `transform` scale 래핑/path 재계산 + stroke 광학 두께(~1.75–2px @24grid) 재보정이 필요하다.
- 정규화 결과: 모든 .svg가 동일 24그리드·동일 `currentColor`.

### 5.2 합성 cascade
```
① 세트에 있음            → fetch (정규화)
② 없지만 본체+수정자 분해 → 합성 (M1~M5, 결정적 템플릿)
③ 단일 새 개념 / hero    → M6 저작 융합 (2~3개 한정)
④ 어느 쪽도 안 읽힘       → 가장 가까운 세트 아이콘 대체 + 플래그
```

### 5.3 합성 6개 모드
| 모드 | 정체 | 난이도 |
|---|---|---|
| M1 접사(affix) | 본체 + 작은 수정자(배지/슬래시/화살표/펄스), 우하단 등 | 쉬움 |
| M2 컨테이너 | 본체 안에 보조 글리프(프레임=그룹 통일 버전 포함) | 보통 |
| M3 깊이쌍 | 뒤(일부)+앞, opacity로 깊이 | 쉬움~보통 |
| M4 스택/다중 | 같은 글리프 오프셋 복제(copy/layers) | 쉬움 |
| M5 레티클 | 대상 주위 네 모서리 마크(scan/detect) | 쉬움~보통 |
| M6 저작 융합 | 일부 path/네거티브/모프 — hero 한정 | 어려움 |

규율:
- **세트마다 backbone 1개 강제** + 접사(M1) 보조. M6은 hero 2~3개만. (one-family 보호)
- **합성은 자체 compose 스크립트**가 담당(@iconify/tools에 overlay/badge/knockout 기능 없음).
- 배지 **knockout 링**(우하단·~45%·clear-space 마스크)은 **고정 템플릿 스니펫**으로 결정적화.
- M6 네거티브 스페이스는 even-odd fill-rule로 제한(LLM boolean 연산 회피).
- 합성 base는 반드시 **정규화 후 24그리드 좌표계**여야 좌표 계산이 맞는다(5.1 의존).

### 5.4 검수 / lock (기존 재사용)
- 검수 시트 `build-iconset-sheet.mjs` 그대로(소스 무관, 결국 다 `.svg`).
- One-Color·Small UI 테스트(rules §5) + 구조 린트 + cross-icon 일관성.
- lock: `candidate/icon/*.svg` → `assets/icon/*.svg` 순수 복사 + overview 슬롯 주입(기존). **lock 시 `icon-map.json` 재생성**(아래).

## 6. icon-map.json — §3·§5 수정

### 6.1 권위 관계
| 파일 | 역할 | 권위 |
|---|---|---|
| `assets/icon/*.svg` | ui-kit이 인라인 소비하는 실제 산출물 | **소비 SSOT** |
| `assets/icon/icon-map.json` | provenance + 합성 레시피 캐시 | **재생성물(lock이 재작성)** |

- **모든** 아이콘(iconify·custom)을 기록한다(캐싱 목적 — 미래 수정 세션이 재검색 없이 출처·제작법 확인).
- **lock 때 결정적으로 재생성**한다(md-compiler의 재컴파일 패턴). 사람이 수기 유지하지 않으므로 드리프트·유지부담 0. 자동 복원 불가한 정보(선택한 iconify id / base+overlay+mode)만 결정 시점에 기록 → 그게 map의 입력.
- 라이선스는 **세트 1줄**(`set.license`)만. fetched마다 반복하지 않음. custom은 base 세트 라이선스를 상속("derived" 표시). CC-BY 세트면 attribution이 다운스트림까지 전파됨을 주석.
- lock 정합 린트: map의 모든 키 ↔ `.svg` 파일 1:1 대응 확인. 어긋나면 경고.

### 6.2 스키마
```json
{
  "set": { "id": "ph", "license": "MIT" },
  "icons": {
    "search":           { "source": "iconify", "icon": "ph:magnifying-glass", "path": "assets/icon/search.svg", "label": "검색" },
    "leak-detection":   { "source": "iconify", "icon": "ph:radar-duotone", "concept": "퍼지는 신호로 탐지", "path": "assets/icon/leak-detection.svg", "label": "유출 탐지" },
    "policy-violation": { "source": "custom", "mode": "M1-affix", "base": "ph:file-text", "overlay": "ph:warning-circle-fill", "concept": "문서 + 경고 배지", "path": "assets/icon/policy-violation.svg", "label": "정책 위반" }
  }
}
```

## 7. references 처리 (공유 자산 — brand-kit과 분리)

`skills/references/design/icon/`은 `design-brand-kit`(보드 이미지 생성)와 공유한다. **공통 교리는 그대로 두고, iconset 생산 방식만 분리**한다.

| 파일 / 섹션 | 처리 |
|---|---|
| `icon-rules.md §2`(stroke·join·grid·corner) | 재활용, 역할 전환 → 세트 *선택 기준* + 합성/저작 *계약* |
| `icon-rules.md §3`(cross-section 일관성) | 거의 그대로 → backbone 규율 근거 |
| `icon-rules.md §5`(One-Color·Small UI) | 그대로(배지 knockout 16px 검증에 더 중요) |
| `icon-rules.md §1·§4`(원칙·Avoid) | 재해석 — "라이브러리 허용; 좋은 세트+도메인 커스텀"으로 수정. "무료 아이콘팩처럼 보이지 마" 모순 줄 정정. 나머지 금지(클리셰·3D 등) 유지 |
| `icon-rules.md §0·§6`(이미지 프롬프트 청크) | **불변** — brand-kit 보드 이미지 생성 전용, 손대지 않음 |
| `icon-style-catalog.md` | 재활용+업그레이드 → 각 스타일에 실제 Iconify set-id 예시 주석(line→Lucide/Tabler, duotone→Phosphor…) |
| `icon-domain-examples.md` | 그대로 → 메타포·합성 분해 소스 |
| `icon-reference-vendors.md` | **용도 전환** → "세트 선택 카탈로그"(스타일↔set-id↔라이선스). 옛 "벤더명 금지"는 brand-kit 이미지 생성 스코프로 격리 |
| (신설) **skill-local** `skills/design-iconset/references/compose-modes.md` | 6모드·cascade·배지 knockout 규칙·opacity 깊이·자동화 티어. iconset 전용이라 공유 `references/design/icon/`이 아닌 skill-local. (다른 스킬이 합성을 실제 사용하게 되면 그때 최상위 승격) |

## 8. 도구 / 의존성

- `@iconify/tools` — fetch·파싱·currentColor 변환·24그리드 정규화·optimize. (Node 의존성 추가)
- 자체 compose 스크립트 — 합성(overlay/knockout/컨테이너/레티클). @iconify/tools에 없는 기능만. skill-local 배치:
  - `skills/design-iconset/scripts/compose.mjs` — 합성 실행기
  - `skills/design-iconset/scripts/compose-templates/` — 배지 슬롯 등 고정 SVG 스니펫
- **SKILL.md는 얇은 오케스트레이션 유지** — cascade 호출·게이트만. 합성 디테일은 `references/compose-modes.md`(on-demand 로드), 실행은 `scripts/`에 둔다.
- fetch는 **저작 시 1회** → `.svg` lock. 런타임/빌드 네트워크 의존 없음. `source:iconify`는 출처 표기일 뿐.
- 오프라인이면 author-only로 degrade + 안내.

## 9. 비범위 (Out of Scope)

- `design-brand-kit` 아이콘 이미지 생성 전환(별도 라운드, 잠정 보류).
- 점수화 함수의 정량 공식(세트 후보가 소수라 LLM 정성 비교로 충분 — 추후 필요 시).
- Iconify 외 소스(Font Awesome Pro·Noun Project 등)는 도입하지 않음.

## 10. 리스크 / 미해결

- **도메인 커버리지 공백**(가장 큰 리스크): 세트에 도메인 아이콘이 적으면 합성 비율이 높아져 "fetch 가족 + 합성 가족" 분열 위험. → G2.5 측정 게이트 + 코어/도메인 분리 + base 위 합성으로 완화. 측정 후 분기로 프로젝트별 degrade.
- 합성 모드 자동 선택 신뢰도: G3에서 compose 건마다 `mode`까지 합의해 보정. 검수 시트로 최종 확인.
- `@iconify/tools` 의존성 무게: 정규화 정확성 이득이 손저작 버그 위험보다 크다고 판단해 수용.

## 11. 검증 기준

- 코어 아이콘은 세트에서 fetch되어 24그리드·currentColor로 정규화됨.
- 합성 아이콘이 fetch 아이콘과 한 가족으로 읽힘(One-Color·Small UI·cross-icon 통과).
- `icon-map.json`이 lock 때 재생성되고 `.svg`와 1:1 정합.
- 출력 계약(viewBox 0 0 24 24·currentColor·개별 .svg) 유지 → ui-kit 무수정 동작.
