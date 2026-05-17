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

Codex 안에서: `/plugins` → `.agents/plugins/marketplace.json`에 정의된 마켓플레이스에서 install.

## 레이아웃

- `mcp.servers.json` — MCP 서버 정의의 단일 소스 (편집은 여기만)
- `scripts/sync-mcp.mjs` — 소스로부터 `.claude-plugin/mcp.json`, `.codex-plugin/mcp.json`, `.env.example`를 재생성
- `scripts/with-env.mjs` — 모든 MCP 커맨드를 감싸 `.env` 값을 주입
- `skills/` — Claude와 Codex가 공유하는 스킬
- `hooks/hooks.json` — 세션 훅 (현재: stale-sync 검사)
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
