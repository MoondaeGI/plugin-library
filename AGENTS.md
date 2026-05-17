# 플러그인 개발

이 저장소는 Claude Code와 Codex CLI 모두를 위한 개인용 모노레포 플러그인입니다.
같은 디렉터리가 두 도구 모두에서 플러그인으로 인식됩니다.

## 작업 흐름

- **MCP 서버 추가**: `mcp.servers.json`을 수정하고 `npm run sync`를 실행한 뒤, 소스와 생성된 파일을 함께 커밋합니다.
- **비밀 값은 절대 커밋하지 않기**: `.env`는 gitignore되어 있으며, 실제 값은 그곳에만 둡니다. 커밋되는 모든 MCP 항목은 `${VAR_NAME}` 플레이스홀더로 변수를 참조합니다. `scripts/check-secrets.mjs`는 `mcp.servers.json` 안에 실제처럼 보이는 비밀 값이 감지되면 sync를 차단합니다.
- **생성된 파일은 직접 수정하지 않기**: `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, `.env.example`, `.claude-plugin/mcp.sync-state.json`은
  `scripts/sync-mcp.mjs`가 생성합니다. `mcp.servers.json`을 수정한 뒤 sync를
  다시 실행하세요.

## 스킬

- 스킬은 `skills/<name>/SKILL.md`에 위치하며 Claude와 Codex가 공유합니다.
- 공통 프론트매터(`name`, `description`)를 따르세요. 도구별 확장은 다른
  도구가 알 수 없는 키를 깔끔하게 무시하는 경우에만 추가합니다.
- 스킬 전용 스크립트는 `skills/<name>/scripts/`에 둡니다. 다른 곳(훅이나
  다른 스킬)에서도 사용하는 경우에만 최상위 `scripts/`로 승격하세요.

## 로컬 테스트

- Claude Code: 이 디렉터리 안에서 `claude --plugin-dir .` 실행.
- Codex CLI: `.agents/plugins/marketplace.json`을 통해 이 저장소를 마켓플레이스로
  등록한 뒤 `/plugins` → 설치. Codex 플러그인 설치에 문제가 있으면
  `~/.codex/config.toml`에 수동으로 MCP 항목을 작성하는 방식으로 폴백합니다.
- 스크립트 테스트는 언제든 실행 가능: `npm test` (또는 `node --test "tests/**/*.test.mjs"`).

## 업데이트 흐름

- 같은 머신, 세션 중: 수정 후 `/reload-plugins`.
- 다른 머신: `git pull` 후 `/reload-plugins` 또는 `/plugin update personal`
  (설치 방식에 따라 다름).
- "푸시 시 자동 업데이트"는 보장되지 않습니다 — 명시적인 `/plugin update`가
  신뢰할 수 있는 트리거입니다.
