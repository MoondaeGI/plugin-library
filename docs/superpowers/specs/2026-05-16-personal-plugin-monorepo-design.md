# Personal plugin monorepo design

**Date**: 2026-05-16
**Status**: Approved by user, ready for implementation planning

## 1. Goal

이 저장소는 개인용 Claude Code + Codex CLI 플러그인을 담는 단일 plugin monorepo이다. 같은 디렉토리가 두 도구 양쪽의 plugin으로 동시에 인식되며, MCP 서버는 한 곳에서만 정의되고, `.env`의 비밀 값은 자동으로 전달된다.

## 2. Requirements

요구 항목 (사용자 명시):

1. Claude Code와 Codex CLI 둘 다에서 사용 가능한 디렉토리 구조
2. 두 도구 모두에 plugin으로 등록 가능
3. 단일 MCP 정의로 양쪽이 사용
4. `.env` 값을 양쪽에서 사용 가능

추가 제약 (대화 중 합의):

- API 키 등 비밀은 절대 committed 파일에 포함되지 않음
- Node.js만 의존 (외부 npm 패키지 없음)
- Windows 우선이지만 코드는 cross-platform
- CI는 현재 도입 안 함 (push 전 검증은 로컬 자동화로 충분)

## 3. Architecture

### 3.1 디렉토리 레이아웃

```
plugin/
# ────── PLUGIN OUTPUT (install 대상) ──────
├── .claude-plugin/
│   ├── plugin.json              # Claude 매니페스트
│   └── mcp.json                 # 자동 생성: Claude 래퍼 형식
├── .codex-plugin/
│   ├── plugin.json              # Codex 매니페스트
│   └── mcp.json                 # 자동 생성: Codex 직접-맵 형식
├── skills/                      # 양쪽 도구가 공유 (SKILL.md)
│   └── <name>/SKILL.md
├── agents/                      # Claude subagent (선택, 초기엔 비어있음)
├── hooks/
│   └── hooks.json
├── scripts/                     # 인프라 + 훅·skill용 공유 스크립트
│   ├── with-env.mjs             # .env 로드 후 자식 spawn (MCP가 호출)
│   ├── sync-mcp.mjs             # 원본 → 두 형식 생성
│   ├── check-secrets.mjs        # 비밀 누출 검증
│   └── hooks/                   # 훅 전용 entry points (필요해지면)
├── mcp.servers.json             # MCP 단일 진실 소스 (사람이 편집)
│
# ────── DEV CONFIG (이 repo 작업 시) ──────
├── .claude/
│   ├── settings.json            # 팀 공유 dev 설정
│   ├── settings.local.json      # 개인 (gitignored)
│   └── rules/                   # (선택) 경로 한정 dev rules
├── .codex/
│   └── config.toml              # Codex 프로젝트 설정 (trusted 시 로드)
├── CLAUDE.md                    # `@AGENTS.md` import + Claude 전용 추가
├── AGENTS.md                    # 진실 소스 (Codex 자동, Claude import)
│
# ────── 공용 ──────
├── README.md
├── package.json                 # npm scripts (외부 의존성 없음)
├── .env                         # 실제 비밀 (gitignored)
├── .env.example                 # 자동 생성: 변수 이름만
└── .gitignore
```

**핵심 규칙**:

- `mcp.servers.json`만 사람이 편집. 두 `mcp.json`은 항상 sync 결과물.
- `.claude-plugin/`과 `.codex-plugin/`에는 매니페스트 + 자기 형식 MCP만. 다른 컴포넌트(skills, hooks, agents)는 루트.
- Skill에 부속 스크립트가 필요하면 `skills/<name>/scripts/`. 두 곳 이상에서 공유되면 `scripts/`로 승격.

### 3.2 매니페스트

**`.claude-plugin/plugin.json`**:

```json
{
  "$schema": "https://json.schemastore.org/claude-code-plugin-manifest.json",
  "name": "personal",
  "description": "Personal shared plugin for Claude Code and Codex CLI",
  "author": { "name": "ansgu" },
  "mcpServers": "./.claude-plugin/mcp.json"
}
```

- `version` 생략 → commit SHA가 cache key (개인용·자주 변경에 적합)
- `skills`, `agents`, `hooks` 생략 → 기본 위치(`skills/`, `agents/`, `hooks/hooks.json`) 자동 스캔
- `mcpServers`만 명시 — 루트 `.mcp.json` 자동 스캔을 피하기 위함 (Codex 형식 파일과 충돌 방지)

**`.codex-plugin/plugin.json`**:

```json
{
  "name": "personal",
  "description": "Personal shared plugin for Claude Code and Codex CLI",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.codex-plugin/mcp.json"
}
```

- Codex의 매니페스트 필드 자동 스캔 동작이 Claude만큼 명확하지 않으므로 모든 경로 명시

### 3.3 MCP 단일 소스 + 자동 sync

**원본 (`mcp.servers.json`)** — 직접-맵 형식 (Codex 네이티브 형식 채택):

```json
{
  "<server-name>": {
    "command": "node",
    "args": [
      "./scripts/with-env.mjs",
      "npx", "-y", "<actual-mcp-package>"
    ],
    "env": {
      "<VAR_NAME>": "${VAR_NAME}"
    }
  }
}
```

규칙:

- 모든 `command`는 `node ./scripts/with-env.mjs ...`로 래핑 (.env 로드 일관성)
- `env` 값은 `${VAR}` placeholder만. 실제 비밀 금지 (`check-secrets`가 검증)
- 초기엔 빈 객체 `{}` — 실제 MCP는 필요 시 추가

**`scripts/sync-mcp.mjs` 동작**:

1. `mcp.servers.json` 읽기
2. `check-secrets.mjs` 검증 — placeholder 외 의심 패턴 발견 시 abort
3. `.codex-plugin/mcp.json` 쓰기 — 원본 그대로
4. `.claude-plugin/mcp.json` 쓰기 — `{"mcpServers": <원본>}` 래퍼 추가
5. `.env.example` 재생성 — `${VAR}` 패턴 추출해 변수 이름만 나열
6. `.claude-plugin/mcp.sync-state.json` 갱신 — `{ "sourceHash": "sha256-...", "syncedAt": "..." }`

**검증 모드** (`--check`):

- 위 1·2 수행 후, 생성 파일이 disk의 현재 내용과 일치하는지 확인
- 불일치 시 비제로 종료 (CI에서 활용 가능, 로컬에선 알림)

### 3.4 sync 트리거 지점

| 시점 | 메커니즘 |
|---|---|
| 수동 | `npm run sync` |
| clone 직후 | `npm install`이 `prepare` script 호출 |
| 세션 시작 | SessionStart 훅이 sync-state stale 감지 시 자동 실행 |
| 검증 (CI 또는 로컬) | `npm run validate` |

**Stale 감지**: `mcp.servers.json`의 SHA-256을 계산해 `.claude-plugin/mcp.sync-state.json`의 `sourceHash`와 비교. 다르면 sync 실행 + stderr 경고.

### 3.5 `scripts/with-env.mjs`

책임: `.env`를 읽어 부모 env에 병합한 뒤 실제 MCP 서버를 spawn.

동작:

1. `import.meta.url`로 자기 위치 → plugin root 계산
2. `<root>/.env`가 있으면 단순 파서로 `KEY=VALUE` 파싱 (주석·따옴표·`export` 처리)
3. 병합: `{ ...fileEnv, ...process.env }` — 부모 env가 우선 (셸 export·CI 변수 우선)
4. `spawn(cmd, args, { env, stdio: 'inherit' })` — stdio 그대로 연결
5. SIGINT/SIGTERM forward, 자식 종료 코드 전파

세부 사항:

- `shell: process.platform === 'win32'` — Windows의 `.cmd` shim 호환
- `.env` 부재 시 조용히 진행 (에러 아님)
- `${VAR}` 치환은 안 함 — Claude/Codex 런타임이 `env` 객체 안의 `${VAR}`를 부모 env에서 치환해줌. with-env는 단순히 `.env`를 부모 env에 올림.

### 3.6 `scripts/check-secrets.mjs`

`mcp.servers.json`을 재귀적으로 walk하면서 문자열 값마다 검사:

- `^\${[A-Z_][A-Z0-9_]*}$` 패턴 일치 → placeholder, OK
- 알려진 secret prefix (`ghp_`, `sk-`, `xoxb-`, `glpat-`, 등) 매치 → ERROR, abort
- 충분히 긴 base64-ish/hex-ish 문자열 → WARN

sync-mcp.mjs 내부에서 import해 사용. `node scripts/check-secrets.mjs` 단독 실행도 가능.

### 3.7 Skills, Hooks, AGENTS.md 공유 전략

**Skills** (`skills/<name>/SKILL.md`): 양쪽이 같은 디렉토리·형식을 읽음. 안전 공통 frontmatter만 사용:

```yaml
---
name: <skill-name>
description: <when to invoke>
---
```

도구별 확장 필드는 인식 못 하는 쪽이 무시해주면 그대로. 충돌 발견 시 분리.

**Hooks** (`hooks/hooks.json`): Claude 스키마로 작성. Codex 인식 못 하는 이벤트는 무시되리라 가정. 핵심 안전망: 우리의 유일한 필수 훅(sync stale-check)이 Codex에서 실패해도 `npm install`의 `prepare`로 fallback. 초기 hooks.json:

```json
{
  "hooks": {
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "node \"${CLAUDE_PLUGIN_ROOT:-.}/scripts/sync-mcp.mjs\" --check-stale"
      }]
    }]
  }
}
```

`${CLAUDE_PLUGIN_ROOT:-.}` — Claude에서는 변수 채워지고, Codex에서는 `.`로 fallback.

**AGENTS.md ↔ CLAUDE.md**: Claude Code 공식 문서 권장 패턴 채택. `AGENTS.md`가 단일 소스. `CLAUDE.md`는:

```markdown
@AGENTS.md

## Claude-specific
- <Claude 전용 지침이 생기면 여기>
```

**중요**: 이 두 파일은 **플러그인 컴포넌트가 아님**. 플러그인이 install된 사용자의 Claude/Codex에 적용되지 않고, 이 repo를 cwd로 작업할 때만 의미 있음. 즉 plugin OUTPUT가 아니라 DEV CONFIG.

### 3.8 DEV config (`.claude/`, `.codex/`)

이 repo에서 작업할 때만 적용되는 도구 설정. plugin install 대상 아님.

**`.claude/settings.json`** — 팀 공유:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm run sync:*)",
      "Bash(npm run validate:*)",
      "Bash(node scripts/sync-mcp.mjs:*)"
    ]
  }
}
```

효과: 이 repo cwd 시 sync 관련 명령 매번 승인 없이 실행.

**`.claude/settings.local.json`** — gitignored, 초기엔 빈 파일.

**`.codex/config.toml`** — Codex 프로젝트 설정. 초기엔 placeholder 주석만. trusted project로 등록되어야 로드됨.

### 3.9 plugin OUTPUT skill vs DEV skill 구분

| 위치 | 용도 |
|---|---|
| `skills/<name>/SKILL.md` | plugin 사용자에게 의미 있는 skill (대부분 여기) |
| `.claude/skills/<name>/SKILL.md` | 이 repo 작업 시에만 의미 있는 skill (예: 빌드 검증) |

초기엔 `.claude/skills/`는 만들지 않음. 필요 시 추가.

## 4. Install & Update Flow

### 4.1 초기 셋업 (clone 직후)

```powershell
git clone <repo> plugin
cd plugin
npm install                  # prepare → sync 자동 실행 → 생성 파일 만들어짐
cp .env.example .env
# .env 열어 실제 비밀 값 채움
```

### 4.2 Claude Code에서 사용

**개발 중**: `claude --plugin-dir .` — 즉시 반영, push 없이 테스트.

**영구 install**: self-marketplace 등록 후 `claude plugin install personal`. 변경 받으려면 `git pull` 또는 `/plugin update personal`. 진행 중 세션은 `/reload-plugins`.

### 4.3 Codex CLI에서 사용

- `.agents/plugins/marketplace.json`에 self-marketplace entry 추가
- Codex 내 `/plugins` UI에서 install
- 변경 시 동일 UI의 update 사용

### 4.4 변경 전파

- 다중 기기 사용 시: push 후 다른 기기에서 `git pull` 또는 `/plugin update`
- 완전 자동 update는 marketplace 모드에서 이론적으로 지원되나 정확한 트리거 미문서화 → **명시적 호출이 신뢰성 높음**

## 5. Out of Scope

다음 항목들은 의도적으로 제외:

- **CI 파이프라인**: 현재 단계에서 불필요. SessionStart hook + `prepare` script + 로컬 `npm run sync`로 충분. 다중 기여자 또는 잦은 sync 누락이 문제될 때 도입.
- **자동 버전 번프 / 릴리즈 자동화**: `version` 미설정으로 commit SHA 사용. semver 관리 불필요.
- **마켓플레이스 공개 발행**: 개인용이므로 self-marketplace 또는 `--plugin-dir`로 충분.
- **양방향 sync (생성 파일 → 원본)**: 단방향만. 양방향은 충돌 모드 위험.
- **외부 dotenv·ajv 라이브러리**: 30~50줄로 직접 구현 가능.
- **여러 `.env` 파일 우선순위 (.env.local 등)**: YAGNI.
- **`.env` 안의 변수 보간 (`${OTHER}`)**: YAGNI.
- **자동 마이그레이션 도구**: 빈 디렉토리에서 시작.

## 6. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Codex의 hook 이벤트 미인식으로 stale-check 안 동작 | `npm install`의 `prepare` script로 fallback |
| 사용자가 `mcp.servers.json` 편집 후 sync 누락 | SessionStart hook + `prepare` script 두 겹 |
| 비밀이 실수로 commit | `check-secrets.mjs`가 sync 단계에서 abort. 추가로 `.gitignore`에 `.env` 명시. |
| Windows `npx` PATH 문제 | `with-env.mjs`에서 `shell: process.platform === 'win32'`로 처리 |
| Claude의 `mcpServers` 자동 스캔이 root `.mcp.json` 찾으면 충돌 | `.mcp.json`을 루트에 두지 않음. 양 매니페스트가 명시적으로 자기 형식 파일 가리킴. |
| 두 도구의 SKILL.md frontmatter 차이로 한쪽이 거부 | 공통 안전 필드만 사용. 도구별 필드는 인식 못 하면 무시되리라 가정. 첫 skill 추가 시 양쪽 smoke test. |

## 7. Glossary

- **plugin OUTPUT**: 플러그인이 install된 사용자의 도구에 적용되는 파일들 (`.claude-plugin/`, `.codex-plugin/`, `skills/`, `hooks/`, MCP 등)
- **DEV CONFIG**: 이 repo를 cwd로 작업할 때만 의미 있는 파일들 (`.claude/`, `.codex/`, `AGENTS.md`, `CLAUDE.md`)
- **단일 진실 소스 (single source of truth)**: 사람이 직접 편집하는 한 곳. `mcp.servers.json`이 MCP에 대한 SSOT.
- **stale**: 원본 변경 후 생성물이 갱신되지 않은 상태.
