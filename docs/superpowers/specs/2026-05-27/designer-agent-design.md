# Designer 서브에이전트 설계

작성일: 2026-05-27

## 배경 / 목적

디자인 스킬 4개가 하나의 파이프라인을 이룬다:

1. `design-brand-kit` — 브랜드 킷(BRAND_KIT.md + brand-tokens.json) + 종합 오버뷰 보드 이미지
2. `design-page-image` — 섹션별 페이지 이미지 브리프 + 섹션 이미지
3. `design-md-compiler` — 구현자가 따를 DESIGN.md
4. `design-html-prototype` — DESIGN.md/토큰 기반 단일 HTML/CSS 프로토타입

이미지 생성은 `design-brand-kit`·`design-page-image`가 공유 `image-gen` 스크립트를 호출한다.

이 파이프라인을 **운전하는 단일 `designer` 서브에이전트**를 추가한다. "디자인 해줘" 수준의 요청에서 에이전트가 맥락에 맞는 스킬을 골라 호출하고, 스킬이 강조하는 "한 장씩 보여주고 피드백 받는" 협업 루프를 굴린다.

## 두 도구 지원 — 비대칭 전제

- **Claude Code**: 플러그인이 `agents/` 디렉터리로 서브에이전트를 **번들**할 수 있다. `agents/designer.md`는 플러그인이 설치된 곳에서 `personal:designer`로 자동 노출된다.
- **Codex CLI**: 커스텀 에이전트 기능은 있으나(`~/.codex/agents/`·프로젝트 `.codex/agents/`의 **TOML**), **플러그인이 에이전트를 번들하지 못한다**(공식 "Build plugins" 문서 기준 플러그인은 skills/hooks/mcp/apps만 번들). 따라서 디자인 스킬은 플러그인으로 같이 가지만, 에이전트 정의는 별도 TOML로 `~/.codex/agents/`에 설치해야 한다.

이 비대칭이 본 설계의 형태를 결정한다.

## 단일 소스 + 생성

repo의 기존 패턴("단일 소스 → sync로 도구별 생성")을 따른다.

- **소스(진실)**: `agents/designer.md` — Claude 네이티브 포맷(frontmatter + 프롬프트 본문). Claude가 **직접** 읽는다.
- **생성**: `scripts/sync-agents.mjs`가 `agents/designer.md`를 파싱해 `codex-agents/designer.toml`을 생성한다.
- `npm run sync` 체인에 추가하고, `npm run validate`에 `sync-agents --check`를 추가한다.

## 산출물 위치 / 커밋 대상

| 경로 | 종류 | 비고 |
| --- | --- | --- |
| `agents/designer.md` | 소스(커밋) | Claude가 직접 사용 |
| `codex-agents/designer.toml` | 생성물(커밋) | `validate`로 소스와 동기화 검증. `agents/` **밖**에 둬서 Claude가 잘못 로드하지 않게 함 |
| `scripts/sync-agents.mjs` | 소스(커밋) | 변환 로직(순수 함수 분리) |
| `tests/sync-agents.test.mjs` | 소스(커밋) | 변환 단위 테스트 |

> `codex-agents/designer.toml`은 커밋한다(번들 `plugins/personal/`과 달리). 작아서 리뷰 가능하고, `validate`가 소스와의 동기화를 강제할 수 있기 때문이다. 설치 단계는 이 파일을 `~/.codex/agents/`로 **복사**할 뿐이다.

## 필드 매핑 (도구별 필드 분리 — 핵심)

| 소스 (`agents/designer.md`) | Claude `.md` | Codex `.toml` |
| --- | --- | --- |
| `name` (frontmatter) | `name` | `name` |
| `description` (frontmatter) | `description` | `description` |
| 본문(프롬프트) | 본문 그대로 | `developer_instructions` |
| `tools` (frontmatter) | `tools` | **제외** — Codex는 tool 허용목록 개념이 다름(sandbox_mode 등) |
| `model` (frontmatter) | `model` | **제외** — `opus`/`sonnet`은 Anthropic 슬러그라 Codex(OpenAI 모델)에 무의미 |

- **`model`·`tools`는 Claude 전용.** 생성기는 이 둘을 Codex TOML로 옮기지 않는다.
- Codex TOML은 `model`을 생략 → Codex 세션의 OpenAI 모델을 상속한다.
- 기본 `model`은 양쪽 다 상속(Claude `model: inherit`, Codex 생략). Claude에서 opus 고정을 원하면 `model: opus` 한 줄로 바꾸며, Codex엔 영향 없다.
- 향후 도구별 모델 고정이 필요하면 소스에 `codex_model` 키를 추가해 Codex `model`에만 매핑한다(현재 YAGNI — 미구현).

## Claude 소스 형태 — `agents/designer.md`

```
---
name: designer
description: 브랜드 킷·페이지 이미지·DESIGN.md·HTML 프로토타입을 디자인 스킬
  파이프라인으로 만들 때 사용. 디자인 작업 전반을 협업하며 진행한다.
tools: Read, Write, Edit, Bash, Glob, Grep, Skill
model: inherit
---

<프롬프트 본문>
```

- `tools`: 파일 생성/편집(`Read`,`Write`,`Edit`) + 스크립트 실행(`Bash`) + 탐색(`Glob`,`Grep`) + 스킬 호출(`Skill`). `Agent`·`AskUserQuestion`은 서브에이전트에서 사용 불가하므로 제외.
- frontmatter는 단순하게 유지한다(단일 라인 값 위주, `description`은 폴드 가능). 복잡한 YAML을 피해 외부 의존성 없이 파싱한다.

### 프롬프트 본문 요지

- 역할: 협업형 디자이너. 디자인 파이프라인을 운전한다.
- 단계별 스킬 사용 규칙: brand-kit → page-image → md-compiler → html-prototype. 각 단계에서 `Skill` 도구로 해당 스킬을 호출하고, 스킬의 지시를 따른다.
- 이미지 단계는 `OPENAI_API_KEY`가 필요하다(없으면 사람이 직접 이미지를 드롭하는 폴백).
- 한 번에 한 장 / 한 가지 변경만, 보여주고 피드백 받는 루프.
- 산출물은 대상 프로젝트 `.design/`에. 출력 텍스트·이미지 텍스트는 한국어.

## Codex 출력 형태 — `codex-agents/designer.toml` (생성)

```toml
name = "designer"
description = "..."            # md frontmatter description에서
developer_instructions = """
<md 본문 그대로>
"""
# model 생략 → Codex 세션 모델 상속
# Codex는 스킬을 기본 상속하므로 skills.config 불필요
```

- TOML 멀티라인 기본 문자열(`"""..."""`)로 본문을 담는다. 본문에 `"""`가 들어가면 깨지므로 변환 함수가 이스케이프/검출을 처리하고 테스트로 보장한다(디자인 프롬프트엔 통상 없음).

## 생성기 — `scripts/sync-agents.mjs`

- `agents/designer.md`를 읽어 frontmatter와 본문을 분리하고, 위 매핑으로 `codex-agents/designer.toml` 텍스트를 만든다.
- 순수 변환 함수(`agentMdToCodexToml(mdText)` 등)를 별도 모듈로 분리해 테스트 가능하게 한다(기존 `transform-mcp.mjs` 패턴).
- 모드: `write`(기본, 파일 생성) / `--check`(소스와 생성물 불일치 시 비정상 종료).
- `package.json`: `sync` 스크립트 체인에 추가, `validate`에 `--check` 추가, `prepare`에도 추가(설치 시 생성).

## Codex 설치 흐름

- 생성된 TOML을 `~/.codex/agents/designer.toml`로 복사해야 Codex가 인식한다(플러그인 번들 불가).
- `scripts/codex-reinstall.mjs`에 "`codex-agents/*.toml` → `~/.codex/agents/` 복사" 단계를 추가한다. 그러면 `npm run codex:reinstall` 한 번으로 스킬(번들 재설치)과 에이전트(TOML 복사)가 함께 갱신된다.
- 수동 대안도 문서화: `copy codex-agents\designer.toml %USERPROFILE%\.codex\agents\`.
- 열려 있던 Codex 세션은 재시작해야 새 에이전트를 읽는다.

## 문서(한국어)

- README.md / AGENTS.md에 "에이전트" 섹션 신설:
  - designer 에이전트 소개와 사용법.
  - 두 도구 메커니즘 차이(Claude는 `agents/` 번들 자동 노출, Codex는 `~/.codex/agents/` TOML 설치 필요).
  - 갱신 흐름(`npm run sync` 후 Claude는 `/reload-plugins`, Codex는 `npm run codex:reinstall`).
- AGENTS.md "생성된 파일" 목록에 `codex-agents/designer.toml` 추가.

## 검증 / 테스트

- 단위 테스트(`tests/sync-agents.test.mjs`):
  - frontmatter 파싱(name/description/tools/model 추출).
  - 본문 → `developer_instructions` 매핑.
  - `tools`·`model`이 Codex TOML에서 제외되는지.
  - TOML 문자열 처리(따옴표/멀티라인) 정상.
- `npm run validate`에 `sync-agents --check` 포함 → 소스 수정 후 sync 누락을 잡는다.
- `npm test` 통과.

## 명시적 제약 / 비대칭

- Claude 플러그인 `agents/`는 `hooks`/`mcpServers`/`permissionMode` 필드를 보안상 무시한다. designer는 이 필드를 쓰지 않는다.
- Codex 에이전트는 기본 전역(`~/.codex/agents/`)이다. 프로젝트별(`.codex/agents/`)로도 둘 수 있으나 기본은 전역 설치로 한다.
- Codex 번들 `plugins/personal/`에는 에이전트가 들어가지 않는다(번들 미지원). 디자인 스킬만 번들로 간다.

## 범위 밖(YAGNI)

- 도구별 모델 고정(`codex_model`) — 필요해질 때 추가.
- designer 외 추가 에이전트(스킬별 전문 에이전트) — 단일 designer로 시작.
- 프로젝트 스코프 Codex 에이전트 설치 — 전역 설치로 충분.
