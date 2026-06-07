# 공유 로고/아이콘 아트 디렉션 reference 설계

- 날짜: 2026-05-28
- 상태: 설계 승인 대기
- 관련 스킬: `design-brand-kit` (현재 소비자), 미래 `design-logo`/`design-icon` (잠재 소비자)

## 1. 배경 / 문제

`design-brand-kit`이 만드는 산출물 중 **종합 오버뷰 보드의 로고/아이콘 섹션**과 **독립 단색 클린 로고**가 빈약하게 나온다. 원인은 생성을 이끄는 아트 디렉션 reference(`skills/design-brand-kit/references/brand-kit-image.md`)의 로고(§2)·아이콘(§7) 지시가 얕아서, 이미지 모델이 구체적 형태/시스템을 그릴 근거가 부족하기 때문이다.

추후 로고·아이콘을 전용으로 뽑는 스킬(`design-logo`/`design-icon`)을 만들 계획이라, 그 스킬과 `design-brand-kit`이 **공통으로 읽는 아트 디렉션 reference**가 필요하다.

## 2. 목표 / 비목표

**목표**
- 보드의 로고/아이콘 섹션 + 독립 단색 로고의 **생성 품질을 직접 끌어올린다**.
- 미래 `design-logo`/`design-icon` 스킬이 그대로 읽을 수 있는 공유 reference 기반을 만든다.

**비목표 (YAGNI — 지금 하지 않음)**
- `design-logo`/`design-icon` 스킬 신설.
- 디자이너용 deliverable 스펙(px 클리어스페이스 다이어그램, 익스포트 포맷 매트릭스 등). 이미지 모델이 렌더할 수 없어 생성 품질을 고치지 못하므로, 미래 스킬 단계에서 그 스킬 문서에 덧붙인다.

## 3. 핵심 결정 (확정)

| 항목 | 결정 | 근거 |
|---|---|---|
| 형태 | invocable 스킬 아님, 공유 **reference 파일** | 로고/아이콘 아트 디렉션은 *행위*가 아니라 *지식*. 스킬화하면 스킬 목록 오염·오발동 위험. repo도 `image-gen`(행위=스킬) vs `brand-kit-image.md`(지식=ref)로 구분 중. |
| 위치 | `skills/references/design/` | `skills/` 아래여야 `sync-codex-plugin.mjs`가 Codex 번들로 복사하고 상대경로가 안 깨짐. `references/`라는 이름이 "스킬 아님"을 명확히 신호. 향후 design 외 공유 ref(`references/api/` 등)로 확장 여지. |
| 스킬 오인 | 안 됨 | 스킬은 디렉터리의 `SKILL.md` 유무로 발견. 이 폴더엔 `SKILL.md` 없음. 매니페스트도 스킬을 명시 열거하지 않음(자동 발견). |
| 파일 분할 | **두 파일** — `logo-art-direction.md`, `icon-art-direction.md` | 로고/아이콘은 관련되나 산출물·스펙이 구분됨. 미래 두 스킬이 각자 읽음. "작은 파일·높은 응집도" 원칙. |
| `brand-kit-image.md`와의 관계 | **하이브리드** | 보드는 한눈에 보는 12섹션 원페이저 — 로고/아이콘은 그 중 한 섹션이라 보드용은 **짧은 요약 유지**. 깊은 생성 스펙은 공유 ref에 두고 독립 로고 생성·미래 스킬이 끌어다 씀. |
| reference 성격 | **접근법 A — 생성용 프롬프트-스펙** | 1차 목표가 생성 품질이라, 이미지 모델이 바로 렌더할 수 있는 구체 지시·프롬프트 청크에 집중. |

## 4. 파일 구조

```
skills/references/design/
  logo-art-direction.md     (신규)
  icon-art-direction.md     (신규)
```

`SKILL.md` 없음 → 스킬로 등록되지 않고 파일로만 번들된다.

## 5. 상대경로 (검증 완료)

- `skills/design-brand-kit/SKILL.md` 기준: `../references/design/logo-art-direction.md` (기존 `../image-gen/` 형제 참조 패턴과 동일)
- `skills/design-brand-kit/references/brand-kit-image.md` 기준: `../../references/design/logo-art-direction.md`

## 6. `logo-art-direction.md` 내용 (접근법 A)

1. **목적/사용법** — 도구 중립. `design-brand-kit`의 독립 로고 생성과 미래 `design-logo`가 읽는다.
2. **전략→마크 로직** — 카테고리→심볼, 메타포→형태 변환을 구체적·렌더 가능한 언어로 (현 `brand-kit-image.md` §1 표를 로고 관점으로 심화).
3. **로고 컨셉 5방법** — 모노그램+의미 / 제품 액션 / 메타포 융합 / 네거티브 스페이스 / 구성 기하. 각 방법에 렌더 가능한 구체 지시 추가.
4. **construction geometry 언어** — 원·그리드·대각컷·모듈·궤도·크로스헤어 등 모델이 그릴 수 있는 형태 시스템 + "정밀하게 구성된" 느낌 유도 문구.
5. **로고 유형/락업 + 단색·반전** — 워드마크/레터마크/심볼/콤비/엠블럼, 단색(흑/백)·반전 버전. 생성 관점(깨끗한 배경, 큰 마크, 단일 색).
6. **워드마크 타이포 방향** — 지오메트릭/휴머니스트/세리프/모노 등 성격을 형태 언어로 + 커스텀 디테일(컷·리가처·터미널).
7. **강한 `Avoid:` 목록** — negative prompt 재료. 방패·자물쇠·지구본·기어·말풍선 클리셰, 의미없는 그라데이션·3D 베벨·드롭섀도·sparkle, 스톡 아이콘, 유명 마크 모방, 일관성 없는 변형.
8. **프롬프트 청크** — 독립 단색 로고 생성에 그대로 떠넣는 템플릿.

## 7. `icon-art-direction.md` 내용 (접근법 A)

1. **목적/사용법** — 보드의 아이콘 세트·작은 아이콘과 미래 `design-icon`이 읽는다.
2. **아이콘 시스템 파라미터** — 일관 스트로크 두께, 조인·터미널(둥근/각진), 그리드/키라인 느낌, optical sizing, 코너 라운딩, 채움 vs 라인, 톤. (렌더 가능한 언어로)
3. **메타포/모티프 매핑** — 의미→아이콘 형태, 일관된 시각 언어.
4. **아이콘 세트 구성** — 세트가 한 가족처럼(동일 스트로크/메타포). 상태 아이콘(성공/경고/위험) 톤.
5. **강한 `Avoid:` 목록** — 클립아트, 일반 스톡 아이콘, 스트로크 불일치, 과밀, 무관한 이미지, 클리셰 로봇.
6. **프롬프트 청크** — 보드 Imagery/Iconography 섹션·작은 아이콘용.

## 8. 기존 파일 수정 (하이브리드 트림 + 링크)

- **`brand-kit-image.md`**
  - §2 "로고 생성 표준"(현 60–74행): 보드의 "로고 방향" 섹션을 그리기에 충분한 **최소 요약**(핵심 원칙 + 5방법 이름)만 남기고, 깊은 스펙은 `../../references/design/logo-art-direction.md`로 링크.
  - §7 "이미지·목업 디렉션"의 아이콘 부분(현 134행): 보드용 요약 유지 + 깊은 아이콘 시스템은 `../../references/design/icon-art-direction.md`로 링크.
  - §12 독립 로고 단락(현 197행): `logo-art-direction.md`의 프롬프트 청크를 사용하도록 명시.
- **`design-brand-kit/SKILL.md`**
  - "이미지 생성"·"흐름" 섹션: 독립 단색 로고 생성 시 `../references/design/logo-art-direction.md`, 보드 아이콘 세트는 `../references/design/icon-art-direction.md`를 참조하도록 한 줄씩 추가.

> 주의: §2/§7을 과하게 비우면 보드 생성 시 해당 섹션 지시가 약해진다. 요약은 "보드 섹션을 그리기에 충분한 최소 지시"를 유지하고, 깊이/독립 로고만 링크로 위임한다.

## 9. 동기화

두 ref 생성·수정 후 `npm run sync`로 Codex 번들(`plugins/personal/skills/references/design/`) 재생성. 번들은 gitignore된 로컬 생성물이라 커밋하지 않고, 소스(`skills/references/design/`)만 커밋한다.

## 10. 검증

자동 테스트 없음(마크다운 reference라 핵심 아님). 대신:

1. **깨진-링크 확인** — `brand-kit-image.md`·`SKILL.md`의 새 링크 상대경로가 실제 파일을 가리키는지 확인.
2. **번들 확인** — `npm run sync` 후 `plugins/personal/skills/references/design/`에 두 파일이 복사됐는지 확인.
3. **실효 검증 (before/after 2장)** — 가짜 테스트 브랜드 하나로 독립 단색 로고를 **수정 전 1장(baseline)** → **수정 후 1장** 생성해 나란히 비교. `--quality low` 초안으로 비용 최소화. `image-gen.mjs`가 `.env`를 직접 로드하므로 이 repo에서 바로 생성 가능. **baseline은 reference 수정 전에 먼저 떠야 비교가 성립**한다. API 호출(키 사용·비용) 직전엔 사용자에게 다시 확인받고 실행한다.

## 11. 리스크

- **기존 테스트 영향** — `tests/`가 sync 번들 내용이나 스킬 개수를 단언하면, 새 폴더로 깨질 수 있다. 플랜 단계에서 `tests/`를 확인하고 필요 시 갱신한다. (sync는 `skills/` 전체를 복사하므로 새 폴더는 자동 포함됨.)
- **요약 과소** — 8번 주의 참고. 보드 섹션 품질이 떨어지지 않게 최소 지시는 유지.

## 12. 실행 순서 (개요 — 상세는 plan에서)

1. (검증 baseline) 수정 전 테스트 브랜드 독립 로고 1장 생성 — *API 호출 전 확인*.
2. `skills/references/design/logo-art-direction.md` 작성.
3. `skills/references/design/icon-art-direction.md` 작성.
4. `brand-kit-image.md` §2·§7·§12 트림 + 링크.
5. `design-brand-kit/SKILL.md` 와이어링 한 줄씩 추가.
6. `npm run sync` — *실행 전 확인*.
7. 깨진-링크·번들 확인.
8. (검증 after) 수정 후 같은 조건 로고 1장 생성 + before/after 비교 — *API 호출 전 확인*.
