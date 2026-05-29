# image-gen 버전 보존 + 확정본 final 폴더 설계

날짜: 2026-05-29

## 문제

이미지 생성 시 호출자(`design-brand-kit`·`design-page-image`)가 `--out`에 고정된
의미 이름(`brand-overview.png`, `section-1-hero.png`)을 넘긴다. 반복 작업에서
같은 이름을 재사용하면 기존 이미지를 잃는다(`--force`면 조용히 덮어쓰고, 아니면
"이미 존재합니다" 에러로 루프가 끊긴다). 시안 흔적이 남지 않아 되돌리기 어렵다.

현재 브랜드킷 흐름의 "정리" 단계는 **안 고른 루트·이전 버전을 삭제**하는 방식으로
확정본을 골라낸다 — 흔적을 지우는 방향.

## 목표

1. 생성 시 기존 이미지를 절대 잃지 않는다(시안 누적 보존).
2. 확정본만 따로 모아 다운스트림이 깔끔하게 참조한다.
3. 다른 호출자(범용 `image-gen` 직접 호출)의 기존 동작을 깨지 않는다.

## 설계

### 1. `image-gen.mjs` — `--auto-version` 플래그 추가

- 새 옵션 `--auto-version`: `--out` 대상(또는 `--n` 변형 세트 중 하나)이 이미
  존재하면 에러 대신 **다음 `-vN`으로 자동 증분**한다.
  - `brand-overview.png` 존재 → `brand-overview-v2.png` → `brand-overview-v3.png`
  - 기존 `-vN`을 스캔해 가장 높은 번호 + 1을 고른다. 첫 충돌이 `-v2`부터인 이유는
    원본 이름(접미 없음)을 v1로 간주하기 때문(기존 수동 `-v2` 컨벤션과 일치).
- 플래그를 **주지 않으면 현재 동작 그대로**(충돌 시 `--force` 없으면 die) — 범용
  호출자 영향 0.
- `--force`는 그대로 명시적 덮어쓰기로 유지. `--auto-version`과 `--force`를 함께
  주면 `--force`가 우선(지정 경로를 그대로 덮어씀, 증분 안 함).
- `--n` > 1과 조합: 변형 세트(`-1`,`-2`)의 베이스 이름에 버전을 적용한다.
  세트 중 하나라도 충돌하면 세트 전체를 다음 버전으로 민다.

### 2. 확정본 final 폴더 (미러형)

- 시안 보관소: `.design/generated/{brand-kit,logo,page}/` — 모든 시안 누적, 덮어쓰기 0.
- 확정본: `.design/final/{brand-kit,logo,page}/` — generated의 하위 구조를 미러.
- 확정(lock) 시점에 **수동 `cp`로 복사**한다. 이때 버전 접미를 떼고 의미 이름으로
  정리한다(`generated/brand-kit/brand-overview-v3.png` →
  `final/brand-kit/brand-overview.png`).
- 시안은 지우지 않는다(되돌리기·흔적 보존).

### 3. 다운스트림 배선

- `design-md-compiler`·`design-html-prototype`는 **`.design/final/`를 우선** 읽고,
  없으면 `.design/generated/`로 폴백한다.
- 브랜드킷 흐름의 "정리(삭제)" 단계를 "**복사(확정본을 final로)**" 단계로 바꾼다.

## 변경 범위

| 파일 | 변경 |
|------|------|
| `skills/image-gen/scripts/image-gen.mjs` | `--auto-version` 구현 |
| `tests/image-gen-auto-version.test.mjs` (신규) | 버전 증분 케이스 (TDD, dry-run 기반) |
| `skills/image-gen/SKILL.md` | `--auto-version` 옵션 문서화 |
| `skills/design-brand-kit/SKILL.md` | 생성 호출에 `--auto-version`, 정리→복사, final 경로 |
| `skills/design-page-image/SKILL.md` | 생성 호출에 `--auto-version`, final 경로 |
| `skills/design-md-compiler/SKILL.md` | 입력으로 `.design/final/` 우선 읽기 |
| `skills/design-html-prototype/SKILL.md` | 입력으로 `.design/final/` 우선 읽기 |

## 결정 사항(확정됨)

- 확정본 이동은 **수동 복사(A)** — 새 헬퍼 스크립트 없음(YAGNI).
- 시안 이름은 **자동 `-v` 증분** — 타임스탬프/UUID 대신(사람이 읽기 쉬움).
- final 폴더는 **미러형(가)** — generated 하위 구조 반영.
- `--auto-version`은 **플래그** — 디자인 스킬 호출에만 붙이고 기본은 off.

## 비목표

- 자동 확정/promote 스크립트(B안) — 대화형 루프라 불필요.
- 타임스탬프/UUID 네이밍.
- manifest.json 스키마 변경.
