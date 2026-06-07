# 로고 아트 디렉션 — 보드 배선 수정 + md 알짜 병합 (설계)

작성일: 2026-05-28

## 1. 문제 / 동기

브랜드 킷 메인 보드 **초안**(`brand-overview-route-a/b/c.png`)의 로고 섹션이 못생기게 나온다. 원인을 추적한 결과 **"md 내용"이 아니라 "배선"이 문제**다:

- 메인 보드 프롬프트는 `brand-kit-image.md §12 템플릿`에서 나온다. 거기서 로고는 두 줄뿐 — 섹션 목록의 `6. Logo Direction (...)` 한 줄 + 끝의 generic `Logo: professional, symbolic, simple, ownable...` 한 줄.
- `logo-art-direction.md`의 깊은 스펙(§1 전략→형태, §2 5방법, §3 기하 어휘, §7 청크)은 **보드 프롬프트에 전혀 주입되지 않는다.**
- `logo-art-direction.md`는 오직 **(선택) 단색 독립 로고 단계**(`logo/`)에서만, 그것도 "프롬프트 청크를 기반으로 구성한다"는 **강제력 없는 산문 지시**로만 참조된다.

→ 그래서 md를 만들고도 "별 차이가 안 난다." 보드만 뽑으면 md 효과는 0이고, 독립 로고를 뽑아도 산문 지시라 약하다. 추가로 보드 로고는 12섹션 중 1칸을 `--quality low`로 그리는 구조라 본질적 한계가 있다(진짜 로고 품질은 독립 로고 단계에서 나온다).

## 2. 목표

1. 보드 프롬프트가 실제로 로고 아트 디렉션을 **끌어오게** 배선 수정(근본 원인).
2. 독립 로고 단계의 산문 지시를 **강제**로 격상.
3. `logo-art-direction.md`에 평가 도구(품질 테스트·체크리스트)와 "독립 심볼 필수" 의무 흡수.

## 3. 비목표 (Non-goals)

- 보드 로고를 "완벽한 로고"로 만드는 것 — 12섹션 중 1칸 저화질이라 구조적 한계가 있다. 보드 로고는 *방향을 읽히게* 하는 게 목표지 최종 마크가 아니다.
- 붙여준 "Logo Rules"의 추상 이론(환경 나열·일반 원칙)을 통째로 이식하는 것 — 이미지 모델이 렌더할 수 없는 문장은 가져오지 않는다.
- `icon-art-direction.md` 수정 — 이번 범위 밖.

## 4. 설계 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| 스코프 | 배선 + md 둘 다 | 못생긴 초안의 근본 원인은 배선. md만 고치면 보드는 그대로 generic. |
| md 다루는 법 | 생성 지향 골격 유지 + 알짜만 이식 | 기존 md가 이미 렌더 가능한 형태 지시로 우수. 추상 이론은 이미지 모델에 무효. |
| 붙여준 Logo Rules 활용 | §5 품질 테스트·§8 체크리스트·"독립 심볼 필수"만 | 나머지는 기존 md가 더 구체적으로 커버. |
| 보드 로고 주입량 | **압축 블록 3줄 고정** | 로고는 12섹션 중 1칸 — 길게 넣으면 과대표집돼 보드가 일그러진다. |
| 평가 도구 위치 | md의 새 §8·§9 (프롬프트엔 미포함) | 품질 테스트·체크리스트는 결과물 판정 기준이지 프롬프트 재료가 아니다. |

## 5. 변경 상세

### 5.1 `skills/references/design/logo-art-direction.md`

기존 §0~§7은 **유지**. 다음만 추가/보강:

- **§4 (로고 유형/락업) 의무 한 줄 추가**: "독립 심볼 필수 — 워드마크만으로 끝내지 않는다. 글자만 있는 로고는 실패로 간주한다." (붙여준 §3.1 핵심 흡수)
- **§7에 "보드 주입용 압축 블록" 변형 추가**: 기존 풀 청크는 독립 로고용으로 두고, 보드용 3줄 블록을 별도로 명시. 형태(채울 [브래킷] 포함):
  ```text
  Logo Direction section: wordmark + standalone monogram/symbol + app-icon tile.
  Mark concept: [BRAND_KIT.md §6 구성·의미에서 채움], built on [grid/diagonal cut/orbit/frame], single consistent stroke weight, strong silhouette, legible at small size, valid in solid monochrome; the symbol reads on its own without the name.
  Avoid: shield/lock/globe/gear clichés, meaningless gradient/3D bevel/sparkle, letters-only logo.
  ```
- **§8 신설 — 품질 테스트 (결과물 평가용, 프롬프트 미포함)**: Silhouette / Small-Size(16·24·32px) / No-Text / One-Color / System / Meaning. 각 테스트의 실패 예시 1~2개.
- **§9 신설 — 로고 체크리스트 (평가용)**: 워드마크만 있나 / 독립 심볼 있나 / 심볼만으로 방향 느껴지나 / 작은 크기 읽히나 / 단색 작동하나 / UI·문서·앱아이콘 반복 가능하나 / 전략·메타포 연결되나 / 흔한 방패·눈·반짝임·번개 의존 안 하나 / 실제 브랜드 로고 연상 안 시키나 / 효과 없이 형태 유지되나.

### 5.2 `skills/design-brand-kit/references/brand-kit-image.md`

- **§2 (로고 생성 표준 — 보드 섹션용 요약)**: "보드의 로고 섹션은 `logo-art-direction.md §7 보드 주입용 압축 블록`을 BRAND_KIT.md §6로 채워 프롬프트에 넣는다"고 명시. 평가 시 `§8 품질 테스트`로 판정한다고 추가.
- **§12 템플릿**: 끝의 generic `Logo: professional, symbolic, simple, ownable, brand-purpose based, consistent across the board.` 줄을 **§7 보드 주입용 압축 블록(BRAND_KIT.md §6로 채운 것)**으로 교체. 섹션 목록의 `6. Logo Direction (...)` 줄은 유지(섹션 존재 표시).
- **§199~201 (발산 3 루트 / 독립 로고)**: 독립 로고 항목의 "프롬프트 청크를 기반으로 구성한다"를 강제로 격상 — "§7 풀 청크를 BRAND_KIT.md로 채워 쓰고, **독립 심볼을 반드시 포함**, 보여주기 전 `§8 품질 테스트`로 자가 판정한다."

### 5.3 `skills/design-brand-kit/SKILL.md`

- **247행**: 보드 로고 섹션이 압축 블록을 주입한다는 점, 평가에 `§8`을 쓴다는 점 반영.
- **249행**: 독립 로고는 풀 청크 + 독립 심볼 필수 + §8 자가 판정으로 문구 강화.

### 5.4 동기화

- skills/ 변경이므로 `npm run sync` 실행해 Codex 번들(`plugins/personal/`) 재생성. (AGENTS.md 규칙 — 단 번들은 gitignore라 커밋 대상 아님.) **명령 실행 전 사용자 확인.**

## 6. 검증

- **정적**: 상대경로 참조 안 깨짐 확인 — `brand-kit-image.md`→`../../references/design/logo-art-direction.md`, `SKILL.md`→`../references/design/logo-art-direction.md`. §7/§8/§9 신설 후에도 §번호 참조 일관.
- **sync**: `npm run sync` 클린 통과(비밀값 검사 포함).
- **(선택, OPENAI_API_KEY 필요) 실측 before/after**: 테스트 브랜드로 보드 1장씩 — (a) 현재 generic `Logo:` 줄, (b) 채운 압축 블록 — 로고 섹션 차이를 Read로 나란히 비교. "별 차이 안 남" 불만의 직접 반증. 키 없으면 스킵.

## 7. 영향 받는 파일

- 수정: `skills/references/design/logo-art-direction.md`
- 수정: `skills/design-brand-kit/references/brand-kit-image.md`
- 수정: `skills/design-brand-kit/SKILL.md`
- 재생성(커밋 안 함): `plugins/personal/` (npm run sync)

## 8. 리스크 / 주의

- **과대표집**: 보드 주입 블록이 길어지면 로고가 보드를 지배한다 → 3줄 고정 엄수.
- **BRAND_KIT.md §6 미작성 시**: 주입할 "구성·의미"가 비면 블록이 generic으로 회귀 → §6를 logo-art-direction.md §1/§2로 채우도록 흐름에서 보장(이미 입력 스키마에 존재).
- **§번호 재배치 없음**: 기존 §0~§7 번호 유지, §8·§9만 append → 기존 외부 참조 안 깨짐.
