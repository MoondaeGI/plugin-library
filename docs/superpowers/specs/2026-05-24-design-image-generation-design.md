# design 스킬 이미지 자동 생성 설계

**날짜**: 2026-05-24
**상태**: 설계 (구현 전 — 이 문서가 "어떻게 바꿀지"의 기준)
**대상 스킬**: `skills/design-brand-kit/SKILL.md`, `skills/design-page-image/SKILL.md`
**선행 스펙**: `docs/superpowers/specs/2026-05-24-design-prototyper-skills-design.md` (4 스킬 파이프라인 — 이 문서는 그 위의 증분 변경)

---

## 1. 무엇 / 왜

현재 `design-brand-kit`·`design-page-image`는 **이미지 브리프(계약)만** 만들고, 실제 이미지 생성은 "pluggable"로 빼뒀다 (Codex 내장 생성 또는 사람이 수동 드롭). 사용자는 **스킬이 브랜드 킷/브리프를 바탕으로 실제 이미지까지 만들어주길** 원한다.

Codex에는 내장 이미지 생성 도구 `image_gen`(시스템 스킬 `imagegen`)이 있고 **API 키 없이** 동작한다. 브리프의 "이미지 생성 Prompt / Negative Prompt"가 `image_gen`의 입력에 그대로 매핑되므로, 두 스킬의 생성 단계를 **실제 동작**하도록 강화한다.

## 2. 핵심 제약 (왜 인라인인가)

- **이미지 생성 능력은 Codex 전용**: Codex 내장 `image_gen`. Claude에는 이미지 생성 도구가 없다.
- **Codex의 `agents/` 디렉터리는 서브에이전트 정의가 아니라 UI 메타데이터**(`openai.yaml`: display name/아이콘/default_prompt)다. "agent md + 서브에이전트 dispatch" 패턴은 Codex의 이 구조와 다르다.
- "스킬이 서브에이전트를 dispatch" 패턴은 사실상 Claude 쪽 구조인데, **Claude는 이미지를 생성하지 못한다.**
- 따라서 별도 생성 에이전트 파일은 양쪽 어디서도 동작하는 생성을 주지 못한다. **실제로 동작하는 경로는 "스킬이 Codex 내장 `image_gen`을 직접 구동"뿐**이라 인라인으로 둔다.
- **에이전트 중립 유지**: 생성 단계는 "도구가 있으면 `image_gen`, 없으면 수동 드롭"으로 **조건부**. 스킬 계약에 특정 도구를 박지 않는다.

## 3. 변경 범위

- **대상**: `design-brand-kit`(무드보드), `design-page-image`(페이지 섹션) 두 스킬만.
- **다운스트림 불변**: `design-md-compiler`, `design-html-prototype`은 변경하지 않는다 — 생성 방식과 무관하게 `.design/generated/**`의 이미지를 그대로 소비.
- **별도 스킬/에이전트/스크립트 신규 없음.** API 키·CLI 폴백 없음(기본 `image_gen`만; 투명 배경 등 특수 케이스는 `imagegen` 스킬 자체 정책에 위임).

## 4. 각 스킬 변경 내용

### 4.1 흐름(리뷰 게이트)의 생성 단계 교체 — 확인 게이트

생성 단계를 다음 절차로 명시한다(두 스킬 공통 골격):

1. 브리프 작성 → 사용자에게 **항목 수(N)와 함께 제시**.
2. **"이대로 이미지를 생성할까요?" 확인.** 거절 시 브리프를 수정하고 1~2 반복.
3. 승인 시 — **이미지 생성 도구가 있으면**(Codex 내장 `image_gen`): 브리프 항목당 1회 생성 → 결과를 `.design/generated/<category>/`로 복사. **도구가 없으면**(Claude 등): 사람이 같은 폴더에 PNG 드롭.
4. 생성/드롭된 이미지를 검토 → 마음에 안 들면 브리프(또는 프롬프트)를 고쳐 재생성, 좋으면 다음 단계 안내.

> 비용/시간이 드는 호출이므로 2단계(확인)는 필수다. 무인 자동 생성하지 않는다.

### 4.2 `## 이미지 생성` 절 신규 (브리프 → `image_gen` 매핑)

각 스킬에 아래 내용을 담은 절을 추가한다:

- **항목당 1회 호출**: 무드보드 N장·섹션 N개는 각각 별도 `image_gen` 호출로 만든다 (한 프롬프트의 변형 `n`이 아니라 개별 자산이므로 개별 호출).
- **프롬프트 매핑**:
  - `Primary request` ← 브리프의 "이미지 생성 Prompt"
  - `Avoid` ← 브리프의 "Negative Prompt"
  - `Color palette` / `Style/medium` ← `brand-tokens.json` + BRAND_KIT의 시각 방향
  - `Use case`: `design-brand-kit` = `stylized-concept`(무드보드), `design-page-image` = `ui-mockup`(섹션 시안)
- **저장 규칙**: `image_gen` 기본 저장 위치($CODEX_HOME)에 방치하지 말고 **`.design/generated/<category>/`로 복사**한다. 카테고리: brand-kit → `brand-kit/`, page-image → `page/`.
- **파일명**: 항목 식별 가능하게 (`moodboard-1-saas.png`, `moodboard-2-editorial.png`, `section-1-hero.png` …). 기존 파일은 덮어쓰지 말고 버전 파일명(`-v2`)으로.
- **도구 미가용 폴백**: Claude 등 생성 도구가 없으면 같은 폴더에 사람이 PNG를 드롭(파일명 규칙 동일 권장).

## 5. 산출물 경계 (변경 없음)

- 중간물·생성 이미지: `.design/generated/brand-kit/`, `.design/generated/page/` (기존 레이아웃 그대로).
- `image_gen`이 채우든 사람이 드롭하든 결과는 같은 폴더 → 다운스트림 소비는 불변.

## 6. 빌드/배포 영향

- 스킬 본문이 바뀌므로 **`npm run sync`로 Codex 번들 `plugins/personal/` 재생성** 필요(생성물 커밋). dev 세션에선 SessionStart 훅이 stale 번들을 자동 갱신.
- Codex 재설치(`codex plugin add personal@personal`)로 갱신 반영.

## 7. 비범위 / 후속

- `ui-kit`/`logo` 카테고리 생성은 여전히 범위 밖.
- CLI(`scripts/image_gen.py`)·API 키·`gpt-image-1.5` 투명배경 경로는 기본 사용 안 함(필요 시 `imagegen` 스킬 정책이 사용자에게 확인).
- `design-md-compiler`/`design-html-prototype` 변경 없음.

## 8. 구현 체크리스트 (나중에)

- [ ] `design-brand-kit`: 흐름 생성 단계를 "확인 게이트"로 교체 + `## 이미지 생성` 절 추가(무드보드, `stylized-concept`, `brand-kit/`).
- [ ] `design-page-image`: 동일 패턴(섹션, `ui-mockup`, `page/`).
- [ ] 두 스킬 모두 조건부 생성(도구 있으면 `image_gen`, 없으면 수동 드롭) 명시 — 에이전트 중립 유지.
- [ ] 항목당 1회 호출·`.design/generated/<category>/` 복사·버전 파일명 규칙 명시.
- [ ] `npm run sync`로 `plugins/personal/` 재생성, 커밋.
- [ ] Codex 재설치 후 `codex exec`로 "브리프 확인 → 생성 → `.design/generated/`에 PNG 저장"이 실제로 되는지 검증.
- [ ] 다운스트림 스킬 미변경 확인.
