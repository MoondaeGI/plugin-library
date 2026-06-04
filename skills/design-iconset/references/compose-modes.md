# 합성 모드 (Composition Modes) — design-iconset 전용

세트(fetch)에 없는 **gap 아이콘**을 만들 때의 규율·모드·cascade. 모든 합성은 **정규화된 24그리드 base/overlay**(`normalize.mjs`) 위에서 `compose.mjs`가 결정적으로 수행한다. 권위 근거: `../../references/design/icon/icon-rules.md §2/§3/§5`.

## 절대 규율

- **세트마다 backbone 1개**(주 합성 문법) + 접사(M1) 보조. M6은 hero 2~3개만. (one-family 보호)
- **깊이는 두 번째 색 금지** — stroke 굵기·간격·`currentColor` opacity로만(상태 아이콘 색 분기 제외).
- **합성 base는 반드시 그 세트의 글리프** — "세트가 전경"이 되게. 외부 형태를 끌어오지 않는다.
- 좌표계는 **24그리드 통일**(정규화 선행). 합성 후에도 viewBox `0 0 24 24`·`currentColor`.

## cascade (gap 처리 정책)

```
① 세트에 있음            → fetch (정규화)            [Plan 1]
② 없지만 본체+수정자 분해 → 합성 M1~M5 (compose.mjs)  [이 문서]
③ 단일 새 개념 / hero    → M6 저작 융합 (손저작, 2~3개)
④ 어느 쪽도 안 읽힘       → 가장 가까운 세트 아이콘 대체 + 플래그
```

## 6모드

| 모드 | id | 정체 | 자동화 | compose 입력 |
|---|---|---|---|---|
| M1 접사 | `M1-affix` | base + 우하단 배지(knockout) | 쉬움 | base + overlay |
| M2 컨테이너 | `M2-container` | base(틀) 안에 글리프 중앙 50% | 보통 | base + overlay |
| M3 깊이쌍 | `M3-depth` | 뒤(opacity 0.2·확대) + 앞 풀 | 쉬움~보통 | base(뒤) + overlay(앞) |
| M4 스택 | `M4-stack` | 같은 글리프 오프셋 복제 | 쉬움 | base |
| M5 레티클 | `M5-reticle` | 네 모서리 마크 + base 중앙 62% | 쉬움~보통 | base |
| M6 저작 융합 | (스크립트 없음) | 일부 path/네거티브/모프 — 손저작 | 어려움 | — |

- **모드 선택은 게이트3에서 gap마다 합의**해 `icon-map.json`의 `mode`로 기록된다.
- M6은 자동화 대상이 아니다 — `compose.mjs`에 없고, 세트를 레퍼런스로 손저작한다. 네거티브 스페이스는 even-odd fill-rule로 제한(boolean 연산 회피).

## knockout(배지 분리)

M1 배지는 base 위에 그냥 얹으면 stroke가 겹쳐 안 읽힌다. `compose-templates/knockoutMask`가 우하단 원(cx19·cy19·r6)을 base에서 도려내 clear-space를 만든다. mask id는 아이콘명으로 유니크화(시트에 여러 개 인라인해도 충돌 없음).

## 검증

합성물도 `icon-rules.md §5`의 One-Color·Small UI 테스트를 통과해야 한다. 특히 16px에서 배지·내부 글리프가 뭉개지지 않는지 시트로 확인.
