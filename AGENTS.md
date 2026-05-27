# 플러그인 개발

이 저장소는 Claude Code와 Codex CLI 모두를 위한 개인용 모노레포 플러그인입니다.
같은 디렉터리가 두 도구 모두에서 플러그인으로 인식됩니다.

## 작업 흐름

- **MCP 서버 추가**: `mcp.servers.json`을 수정하고 `npm run sync`를 실행한 뒤, 소스와 생성된 파일을 함께 커밋합니다.
- **비밀 값은 절대 커밋하지 않기**: `.env`는 gitignore되어 있으며, 실제 값은 그곳에만 둡니다. 커밋되는 모든 MCP 항목은 `${VAR_NAME}` 플레이스홀더로 변수를 참조합니다. `scripts/check-secrets.mjs`는 `mcp.servers.json` 안에 실제처럼 보이는 비밀 값이 감지되면 sync를 차단합니다.
- **`.env` 값을 OS 환경변수로 (`npm run env:apply`)**: `.env`는 비밀의 단일 소스이고, `scripts/apply-env.mjs`가 그 값을 OS 사용자 환경변수로 등록합니다(Windows `setx`). 그러면 MCP 서버(`${VAR}`는 런타임이 OS env에서 치환)와 일반 스크립트(예: 디자인 스킬 `image-gen.mjs`가 읽는 `OPENAI_API_KEY`)가 모두 `process.env`로 읽습니다. `.env`를 수정하면 `npm run env:apply` 후 세션을 재시작하세요. 특히 Codex 설치 캐시엔 `.env`가 없으므로 OS 환경변수가 유일한 경로입니다.
- **생성된 파일은 직접 수정하지 않기**: `.claude-plugin/mcp.json`,
  `.codex-plugin/mcp.json`, `.env.example`, `.claude-plugin/mcp.sync-state.json`은
  `scripts/sync-mcp.mjs`가 생성하고(이들은 **커밋되는** 생성물), Codex 번들
  `plugins/personal/`(자기 `skills/` 포함)은 `scripts/sync-codex-plugin.mjs`가
  루트 `skills/`에서 생성합니다. 둘 다 `npm run sync` 한 번에 돌아갑니다.
  소스(`mcp.servers.json`, `skills/`)를 수정한 뒤 sync를 다시 실행하세요.
  단, **Codex 번들 `plugins/personal/`는 gitignore된 로컬 생성물이라 커밋하지
  않습니다** — 루트 `skills/`와의 바이트 단위 중복을 피하기 위함이며, 설치/사용
  전 항상 sync를 돌리므로(`npm install`의 `prepare` 훅도 자동 재생성) 추적할
  필요가 없습니다.

## 스킬

- 스킬은 `skills/<name>/SKILL.md`에 위치하며 Claude와 Codex가 공유합니다.
  Claude는 루트 `skills/`를 직접 읽지만, Codex는 자체 완결형 번들에서
  로드하므로 스킬을 추가·수정한 뒤 **`npm run sync`로 `plugins/personal/`를
  재생성**해야 Codex가 반영합니다 (로컬 생성물 — gitignore되어 커밋하지 않음).
- 공통 프론트매터(`name`, `description`)를 따르세요. 도구별 확장은 다른
  도구가 알 수 없는 키를 깔끔하게 무시하는 경우에만 추가합니다.
- 스킬 전용 스크립트는 `skills/<name>/scripts/`에 둡니다. 다른 곳(훅이나
  다른 스킬)에서도 사용하는 경우에만 최상위 `scripts/`로 승격하세요.
- `librarian` 스킬은 운영 대상 vault(kb) 경로를 `.env`의 `LIBRARIAN_VAULT_PATH`에서
  읽습니다 (gitignore된 머신별 로컬 값 — `.env.example`에는 없음). 설정이 없거나
  잘못되면 `skills/librarian/scripts/resolve-vault.mjs`가 안내와 함께 실패합니다.

## 로컬 테스트

- Claude Code: 이 디렉터리 안에서 `claude --plugin-dir .` 실행.
- Codex CLI: 마켓플레이스 등록 후 설치 — `codex plugin marketplace add <repo 경로>`
  그다음 `codex plugin add personal@personal`. (`/plugins` 목록은 이미 등록된
  마켓플레이스만 보여주므로 marketplace add가 선행되어야 함.) 설치 대상은 생성
  번들 `plugins/personal/`이다. 자세한 명령은 README의 "Codex CLI" 절 참고.
- 스크립트 테스트는 언제든 실행 가능: `npm test` (또는 `node --test "tests/**/*.test.mjs"`).

## 업데이트 흐름

- 같은 머신, 세션 중 (Claude): 수정 후 `/reload-plugins`.
- 같은 머신 (Codex): 스킬/소스 수정 후 `npm run codex:reinstall`
  (sync로 번들 재생성 → `codex plugin remove` → `add`. `add`만으론 갱신 안 됨).
- 다른 머신: `git pull` 후 `/reload-plugins` 또는 `/plugin update personal`
  (설치 방식에 따라 다름). Codex Git 설치면 `codex plugin marketplace upgrade personal`
  후 `npm run codex:reinstall`.
- "푸시 시 자동 업데이트"는 보장되지 않습니다 — 명시적인 `/plugin update`가
  신뢰할 수 있는 트리거입니다.
