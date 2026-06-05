# personal plugin

Claude Code + Codex CLI 양쪽에서 사용하는 개인용 플러그인. 저장소 하나에 매니페스트 두 개, MCP 소스와 스킬은 공유.

## 빠른 시작

```powershell
git clone <this-repo> plugin
cd plugin
npm install           # prepare 스크립트가 sync를 자동 실행
cp .env.example .env
# .env 열어서 실제 값 채우기
```

## 설치

### Claude Code

로컬 개발용:
```powershell
claude --plugin-dir .
```

마켓플레이스 install (최초 1회):
```
/plugin marketplace add <이 저장소 경로 또는 git URL>
/plugin install personal
```

### Codex CLI

Codex는 플러그인을 **마켓플레이스로 등록한 뒤 install**해야 한다 (`/plugins` 목록은 *이미 등록된* 마켓플레이스의 플러그인만 보여줌). 터미널에서:

```powershell
# 1) 마켓플레이스 등록 (머신당 한 번) — 로컬 경로
codex plugin marketplace add C:\Users\ansgu\work\plugin
# (다른 머신은 Git으로) codex plugin marketplace add MoondaeGI/plugin-library --ref main

# 2) 플러그인 설치 — PLUGIN@MARKETPLACE 형식 (둘 다 이름이 personal)
codex plugin add personal@personal

# 3) 확인
codex plugin list --marketplace personal   # personal@personal = installed, enabled
```

이후 Codex의 `/plugins`에도 뜨고, 스킬은 자연어로 발동한다.

**업데이트 (스킬/소스 수정 후):**
```powershell
npm run codex:reinstall   # sync(번들 재생성) → codex plugin remove → add
```
`codex plugin add`만 다시 돌리면 갱신되지 않으므로(기존 캐시 백업 실패) remove가 선행되어야 하며, 이 스크립트가 그 순서를 처리한다. 다른 머신에서 Git 마켓플레이스로 설치했다면 먼저 `codex plugin marketplace upgrade personal`로 스냅샷을 새로고침한 뒤 재설치한다.

> **Codex 번들 주의:** Codex는 플러그인 디렉터리를 자체 캐시로 **스냅샷 복사**해서 로드하므로, 루트 `skills/`를 직접 보지 못한다. 그래서 Codex용으로는 자체 완결형 번들 `plugins/personal/`(자기 `skills/` 포함)이 필요하다. 이 번들은 **`npm run sync`가 루트 `skills/`에서 생성**하는 **로컬 생성물이며 git에 커밋하지 않는다**(gitignore — 루트 `skills/`와의 중복 방지). 설치/사용 전 항상 sync를 돌리므로 추적할 필요가 없고, `npm install`의 `prepare` 훅도 자동으로 재생성한다. 스킬을 고치면 `npm run sync` 후 `codex plugin add personal@personal`로 재설치하면 갱신된다. (번들이 없으면 `npm run sync`로 생성.)
>
> 마켓플레이스 스키마: `.agents/plugins/marketplace.json`의 플러그인 `source`는 문자열이 아니라 객체(`{ "source": "local", "path": "./plugins/personal" }`)이고 `policy`/`category`가 필요하다. Claude용 `.claude-plugin/marketplace.json`은 `source: "./"`(루트)로 충분하다.

## 에이전트

`designer` 서브에이전트는 디자인 스킬 **핵심 파이프라인**(`design-brand-kit` → `design-logo`/`design-iconset` → `design-ui-kit` → `design-md-compiler`)을 협업하며 운전한다. 이후 다운스트림(component-export·image-web/mobile·html-prototype·generate-code)은 front-developer·designer·web-publisher가 나눠 맡으며 일부는 미구현이다.

- **소스**: `agents/designer.md` (Claude 네이티브 — 단일 진실 소스).
- **Claude**: 플러그인이 `agents/`를 번들하므로 자동 노출된다 (`@agent-personal:designer`). 수정 후 `/reload-plugins`.
- **Codex**: 플러그인이 에이전트를 번들하지 못한다. `npm run sync`가 `agents/designer.md` → `codex-agents/designer.toml`을 생성하고, `npm run codex:reinstall`이 이를 `~/.codex/agents/`로 복사한다. (수동: `copy codex-agents\designer.toml %USERPROFILE%\.codex\agents\`.) 열려 있던 Codex 세션은 재시작해야 반영된다.
- **`model`/`tools`는 Claude 전용** frontmatter라 Codex TOML로 옮기지 않는다(`opus`/`sonnet`은 Anthropic 슬러그). Codex는 세션 모델을 상속한다.

<details>
<summary>🎨 <b>디자인 스킬 파이프라인 (designer)</b> — 펼쳐 보기</summary>

**핵심 파이프라인**: `design-brand-kit`(브랜드 정체성·base 자산·HTML 오버뷰·공유 `tokens.css`) → `design-logo` / `design-iconset` → `design-ui-kit`(토큰 기반 UI 컴포넌트 라이브러리 HTML/CSS) → `design-md-compiler`(→ `DESIGN.md`). 여기까지가 designer 핵심.

**다운스트림** (주체·구현 상태): `design-component-export`(front-developer·미구현) → (선택) `design-image-web`·`design-image-mobile`(designer, `DESIGN.md` 시드 — 풀페이지 목업, html-prototype 직전 탐색) → `design-html-prototype`(web-publisher) → `design-generate-code`(front-developer·미구현).

`designer`가 핵심 파이프라인을 협업 루프로 운전하고, 각 단계는 앞 단계의 `.design/` 산출물을 시드로 받는다. `tokens.css`는 brand-kit이 만들어 모든 view HTML이 공유하는 토큰 토대다.

전체 흐름·`design-brand-kit` 심화·Nooknote 예시는 **[docs/design/README.md](docs/design/README.md)** 참고.

</details>

## 레이아웃

- `mcp.servers.json` — MCP 서버 정의의 단일 소스 (편집은 여기만)
- `scripts/sync-mcp.mjs` — 소스로부터 `.claude-plugin/mcp.json`, `.codex-plugin/mcp.json`, `.env.example`를 재생성
- `scripts/sync-codex-plugin.mjs` — 루트 `skills/`에서 Codex 번들 `plugins/personal/`를 재생성
- `scripts/lib/load-env.mjs` (`loadEnv()`) — `.env`(비밀 단일 소스, gitignore됨)를 읽어 `process.env`와 병합한다(OS env 우선). 스크립트(예: 디자인 스킬 `image-gen.mjs`)가 이걸로 `.env`를 직접 읽으므로, Claude는 `.env` 저장 즉시 반영된다. Codex 번들은 `npm run codex:reinstall`로 갱신
- `skills/` — Claude와 Codex가 공유하는 스킬의 **단일 소스** (Claude는 여기서 직접 읽음)
- `agents/` — Claude 서브에이전트 **소스** (`designer.md` 등; Claude가 직접 읽음)
- `codex-agents/` — **로컬 생성물**: `agents/*.md`에서 만든 Codex 에이전트 TOML (`npm run sync`가 생성, **gitignore — 커밋 안 함**, `codex:reinstall`이 `~/.codex/agents/`로 설치)
- `plugins/personal/` — **로컬 생성물**: Codex가 설치하는 자체 완결형 번들 (`npm run sync`가 생성, **gitignore — 커밋 안 함**, 직접 편집 금지)
- `.agents/plugins/marketplace.json` — Codex 마켓플레이스 정의 / `.claude-plugin/marketplace.json` — Claude 마켓플레이스 정의
- `hooks/hooks.json` — 세션 훅 (현재: mcp·codex-plugin stale-sync 검사)
- `tests/` — 스크립트 테스트 (`npm test`로 실행)

개발 가이드는 [AGENTS.md](./AGENTS.md) 참고.

## MCP 서버 추가하기

`mcp.servers.json` 편집:

```json
{
  "example": {
    "command": "npx",
    "args": ["-y", "@example/mcp-server"],
    "env": { "EXAMPLE_API_KEY": "${EXAMPLE_API_KEY}" }
  }
}
```

`${EXAMPLE_API_KEY}`는 MCP 런타임이 **OS 환경변수**에서 치환한다(MCP 서버가 있을 경우). 한편 일반 스크립트는 공용 `loadEnv()`로 `.env`를 직접 읽으므로, 비밀은 `.env`에 적기만 하면 된다.

이후:
```powershell
npm run sync          # 생성 파일 갱신
# .env에 비밀을 적으면 스크립트가 바로 읽음 (Claude 즉시 / Codex는 npm run codex:reinstall)
```

그다음 `/reload-plugins`(Claude) 또는 세션 재시작(Codex).
