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

> **Codex 번들 주의:** Codex는 플러그인 디렉터리를 자체 캐시로 **스냅샷 복사**해서 로드하므로, 루트 `skills/`를 직접 보지 못한다. 그래서 Codex용으로는 자체 완결형 번들 `plugins/personal/`(자기 `skills/` 포함)이 필요하다. 이 번들은 **`npm run sync`가 루트 `skills/`에서 생성**한다 (직접 편집 금지). 스킬을 고치면 `npm run sync` 후 `codex plugin add personal@personal`로 재설치하면 갱신된다.
>
> 마켓플레이스 스키마: `.agents/plugins/marketplace.json`의 플러그인 `source`는 문자열이 아니라 객체(`{ "source": "local", "path": "./plugins/personal" }`)이고 `policy`/`category`가 필요하다. Claude용 `.claude-plugin/marketplace.json`은 `source: "./"`(루트)로 충분하다.

## 레이아웃

- `mcp.servers.json` — MCP 서버 정의의 단일 소스 (편집은 여기만)
- `scripts/sync-mcp.mjs` — 소스로부터 `.claude-plugin/mcp.json`, `.codex-plugin/mcp.json`, `.env.example`를 재생성
- `scripts/sync-codex-plugin.mjs` — 루트 `skills/`에서 Codex 번들 `plugins/personal/`를 재생성
- `scripts/with-env.mjs` — 모든 MCP 커맨드를 감싸 `.env` 값을 주입
- `skills/` — Claude와 Codex가 공유하는 스킬의 **단일 소스** (Claude는 여기서 직접 읽음)
- `plugins/personal/` — **생성물**: Codex가 설치하는 자체 완결형 번들 (`npm run sync`가 생성, 직접 편집 금지)
- `.agents/plugins/marketplace.json` — Codex 마켓플레이스 정의 / `.claude-plugin/marketplace.json` — Claude 마켓플레이스 정의
- `hooks/hooks.json` — 세션 훅 (현재: mcp·codex-plugin stale-sync 검사)
- `tests/` — 스크립트 테스트 (`npm test`로 실행)

개발 가이드는 [AGENTS.md](./AGENTS.md) 참고.

## MCP 서버 추가하기

`mcp.servers.json` 편집:

```json
{
  "example": {
    "command": "node",
    "args": ["./scripts/with-env.mjs", "npx", "-y", "@example/mcp-server"],
    "env": { "EXAMPLE_API_KEY": "${EXAMPLE_API_KEY}" }
  }
}
```

이후:
```powershell
npm run sync
```

생성 파일들이 갱신됨. 새 변수는 `.env`에 추가하고 `/reload-plugins`.
