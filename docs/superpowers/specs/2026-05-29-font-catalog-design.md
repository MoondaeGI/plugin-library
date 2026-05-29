# 폰트 카탈로그 공유 reference 설계

- 날짜: 2026-05-29
- 상태: 설계 승인 대기
- 관련 스킬: `design-brand-kit` (주 소비자), `design-html-prototype`·`design-md-compiler` (토큰 소비자)

## 1. 배경 / 문제

`design-brand-kit`이 만드는 산출물에서 모델이 **실존하지 않는 폰트명**을 지어 넣는다. 폰트명이 나타나는 세 지점:

1. `BRAND_KIT.md §8 타이포그래피` — "폰트 방향"이라 적혀 있으나 실제로는 특정 폰트명이 채워진다.
2. `brand-tokens.json`의 `typography.{display,heading,body,mono}` — font-family 슬롯. **가장 치명적** — 가짜 family가 다운스트림 구현(`design-html-prototype`·`design-md-compiler`)으로 새어 실제 로드 불가.
3. 종합 오버뷰 보드 이미지의 Typography 섹션 — 폰트명이 텍스트 라벨로 렌더되어 오해를 부른다.

뿌리 원인은 모델이 폰트명을 **자기 지식만으로 지어내는** 것이다. 사용자는 폰트에 익숙하지 않아 직접 검증하기 어렵다.

## 2. 이미지 생성기의 현실 (설계 전제)

`image-gen`이 쓰는 OpenAI Images(gpt-image)는 **폰트 파일을 로드하지 않는다.** "Pretendard"라고 적어도 그 글리프를 실제로 렌더하지 않고, 학습된 *타입 스타일*(기하 산세리프·고대비 세리프·모노 등)을 픽셀로 근사할 뿐이다. 따라서:

- 보드 이미지에 박히는 폰트명은 사실상 **문서용 라벨**이며, 이미지가 그 폰트로 그려지는 게 아니다. (기존 ref가 "권위 원본은 이미지가 아니라 md/tokens"라고 못 박은 이유.)
- 폰트가 **실제로 쓰이는** 곳은 다운스트림 토큰 소비자(웹폰트 로드)다 — 거기서 실존·로드 가능 여부가 기능적으로 중요하다.

이 전제가 카탈로그를 "메타데이터 덤프"가 아니라 **두 층**으로 만들게 한다(§4).

## 3. 목표 / 비목표

**목표**
- 폰트 선택을 **실존·한글지원·검증가능한 큐레이션 카탈로그**로 제약해 환각을 뿌리에서 차단.
- 폰트 모르는 사용자가 **specimen URL로 눈으로 확인**하고 고를 수 있게(기존 승인 게이트 활용).
- 토큰에 **실제 로드 가능한 font-family + 폴백**이 들어가 다운스트림 구현이 깨지지 않게.

**비목표 (YAGNI — 지금 하지 않음)**
- 별도 `design-fonts` 선택 스킬. (폰트 선택은 한 스킬의 한 섹션 — 기존 Q&A·승인 게이트가 이미 선택 루프를 제공.)
- 프로그래매틱 검증 스크립트(토큰 폰트명이 카탈로그에 있는지 검사). 추후 필요시 별도 설계(접근법 C)로.
- raw 메타데이터 전량 덤프. 1500개 목록은 폰트 모르는 사용자에게 무용 — 큐레이션이 핵심 가치.

## 4. 핵심 결정 (확정)

| 항목 | 결정 | 근거 |
|---|---|---|
| 형태 | invocable 스킬 아님, 공유 **reference 파일** | 폰트 선택 지식은 *행위*가 아니라 *지식*. `logo-art-direction.md`·`icon-art-direction.md`와 같은 결. 별도 스킬은 간접층·오발동 위험. |
| 위치 | `skills/references/design/font-catalog.md` | 기존 design ref와 형제. `skills/` 아래라야 `sync-codex-plugin.mjs`가 번들 복사하고 상대경로 안 깨짐. `SKILL.md` 없어 스킬로 등록 안 됨. |
| 폰트 범위 | 무료/오픈소스 우선 + **상용 소수 라이선스·출처 표기** | 무료는 토큰에 박으면 바로 로드 가능. 상용은 고급 선택지로 두되 구현 시 폴백 필요함을 표기. |
| 한글 지원 | **필수 제약** | 보드·페이지 모두 한국어 텍스트 렌더. |
| 리스트 형태 | **하이브리드** | 큐레이션 카탈로그가 메인(좋은 추천·성격 주석·상용 포함), GF 브라우즈 페이지(`?subset=korean`)는 "전체 더 보기" 링크로. |
| 검증 수준 | **가이드 + specimen URL** (프로그래매틱 체크 없음) | 환각 차단은 카탈로그 제약 + URL 확인으로 충분. 기존 승인 게이트가 사람 확인 루프 제공. |

## 5. 두 층 원칙 (카탈로그 핵심 구조)

- **검증 백본 (기계)** = GF 공식 메타데이터에서 가져온 실존 이름 · 한글 subset · 라이선스 → 환각 차단.
- **큐레이션 값 (사람이 검증해 작성)** = 항목당 시각 성격 한 줄 + 역할 + 폴백 스택 + 페어링. 메타데이터에 없어 사람이 채워야 하며, 폰트 모르는 사용자·이미지 프롬프트 스타일 묘사에 쓰이는 실질 가치.
- **specimen URL (사람 눈)** = 사용자가 클릭해 실제 모양 보고 확정 → 기존 승인 게이트와 합쳐짐.

## 6. 소싱 방법 (1회 구축 — 빌드 의존성 아님)

- **무료/한글 다수**: Google Fonts 공식 메타데이터(`google/fonts` repo의 `ofl/<family>/METADATA.pb` 또는 webfonts Developer API)에서 `korean` subset만 추림 → 이름·한글·라이선스가 출처 보장. specimen 페이지를 WebFetch로 실존 확인.
- **GF 밖 오픈소스**: Pretendard(`github.com/orioncactus/pretendard`)·Spoqa Han Sans(`spoqa.github.io/spoqa-han-sans/`) 등은 GitHub/파운드리 URL로 검증.
- **상용 소수**: 파운드리 제품 페이지 URL과 라이선스를 명시해 수기 추가.
- 결과: 정적 마크다운으로 커밋. 빌드 때 다시 fetch하지 않는다.

## 7. `font-catalog.md` 내용

1. **목적/사용법** — 도구 중립. `design-brand-kit §8`이 읽고, 토큰을 통해 다운스트림이 소비. §2 이미지 생성기 전제 요약.
2. **두 층 원칙** (§5) 명시.
3. **카탈로그 항목** — 역할(display/heading/body/mono)×성격으로 ~30개. 항목당:
   - 실존 폰트명 (GF 메타데이터 검증)
   - 역할 / 시각 성격 한 줄 (이미지 프롬프트 스타일 묘사용)
   - 한글 지원 / 라이선스 / 출처(specimen) URL
   - CSS 폴백 스택 (예: `Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif`)
   - 페어링 메모 (이 폰트와 어울리는 역할별 조합)
4. **상용 섹션** — 소수, 파운드리 URL·라이선스 명시, "구현 시 폴백 필요" 표기.
5. **전체 더 보기** — `https://fonts.google.com/?subset=korean` (하이브리드 see-all).
6. **선택 가이드** — 브랜드 성격→폰트 역할 매핑 힌트(폰트 모르는 사용자/모델용).

## 8. 기존 파일 수정 (배선)

- **`skills/design-brand-kit/SKILL.md`**
  - `BRAND_KIT.md §8` 구조 + 타이포 절차: **폰트는 `../references/design/font-catalog.md`에서만** 고르고, 성격에 맞는 후보 2~3개를 **specimen URL과 함께** 제시 → 승인 게이트에서 확정 → **실제 font-family + 폴백**을 `brand-tokens.json`·`BRAND_KIT.md §8`에 박는다.
  - `brand-tokens.json` 구조 주석: `typography` 슬롯은 실제 로드 가능한 family + 폴백 스택임을 명시.
- **`skills/design-brand-kit/references/brand-kit-image.md`**
  - §6 텍스트 규칙 / §8 Typography 섹션·§12 프롬프트 템플릿: 보드 §8엔 실제 폰트명을 라벨로 적되 **타입 스타일을 묘사**(카탈로그 성격 노트)해 근사 렌더하도록. 폰트 출처는 `../../references/design/font-catalog.md` 참조. 기존 "권위 원본은 md/tokens" 단서 유지.
- **(선택 · 고가치) `skills/design-html-prototype/SKILL.md`**
  - 토큰 폰트가 카탈로그 웹폰트면 그 URL로 `@import`/`<link>` 로드 → 프로토타입에서 고른 폰트가 실제 렌더. **이 항목은 범위에서 빼도 무방**(스펙 핵심은 ①~③ 환각 차단).

## 9. 상대경로 (검증 필요)

- `skills/design-brand-kit/SKILL.md` 기준: `../references/design/font-catalog.md`
- `skills/design-brand-kit/references/brand-kit-image.md` 기준: `../../references/design/font-catalog.md`
- `skills/design-html-prototype/SKILL.md` 기준: `../references/design/font-catalog.md`

(기존 `logo-art-direction.md` 참조 패턴과 동일 — plan 단계에서 실파일 가리키는지 확인.)

## 10. 동기화

`font-catalog.md` 작성·기존 파일 수정 후 `npm run sync`로 Codex 번들(`plugins/personal/skills/references/design/`) 재생성. 번들은 gitignore된 로컬 생성물이라 커밋 안 하고, 소스(`skills/`)만 커밋한다.

## 11. 검증

코드가 아니라 문서(ref + 스킬 md)라 단위 테스트 없음. 대신:

1. **실존 확인** — 카탈로그의 모든 폰트명이 실제 specimen/출처 URL로 해석되는지 구축 중 WebFetch로 확인. (이 스펙의 핵심 — "실존 폰트만"이 깨지면 의미 없음.)
2. **깨진-링크 확인** — `SKILL.md`·`brand-kit-image.md`의 새 링크 상대경로가 실제 파일을 가리키는지.
3. **번들 확인** — `npm run sync` 후 `plugins/personal/skills/references/design/`에 `font-catalog.md`가 복사됐는지.
4. **실효 검증 (선택)** — 가짜 테스트 브랜드로 §8 타이포 선택을 돌려, 후보가 카탈로그 실존 폰트 + specimen URL로 제시되고 토큰에 실제 family+폴백이 박히는지 확인.

## 12. 리스크

- **기존 테스트 영향** — `tests/`가 번들 내용·스킬/파일 개수를 단언하면 새 파일로 깨질 수 있다. plan 단계에서 `tests/` 확인 후 필요 시 갱신. (sync는 `skills/` 전체 복사라 새 파일 자동 포함.)
- **상용 폰트 검증 한계** — 상용은 공개 API가 없어 카탈로그 목록이 곧 진실 원본. 소수로 제한하고 파운드리 URL로 사람이 확인 가능하게.
- **카탈로그 노후** — GF 메타데이터는 변하지만 정적 파일이라 자동 갱신 안 됨. "전체는 GF 브라우즈" 링크가 보완. 큐레이션은 주기적 수기 갱신.

## 13. 실행 순서 (개요 — 상세는 plan에서)

1. GF 메타데이터·specimen URL로 실존 한글 폰트 수집·검증 (*WebFetch 사용*).
2. `skills/references/design/font-catalog.md` 작성 (역할×성격 큐레이션 + 상용 소수 + see-all 링크).
3. `design-brand-kit/SKILL.md` §8·토큰 배선.
4. `brand-kit-image.md` §6/§8/§12 배선.
5. (선택) `design-html-prototype/SKILL.md` 웹폰트 로드 한 줄.
6. `npm run sync` — *실행 전 확인*.
7. 실존·깨진-링크·번들 확인.
