---
name: commit
description: Use when committing changes in this Claude+Codex plugin monorepo — any commit touching skills/, agents/, mcp.servers.json, hooks/, scripts, or docs.
---

# commit

이 저장소(Claude + Codex 플러그인 모노레포)에서 커밋할 때의 절차. 생성물을 먼저 맞추고, 커밋하고, 플러그인에 영향이 있으면 Codex를 재설치한 뒤, Claude `/reload-plugins`를 안내한다.

## 절차

1. **생성물 동기화 후 스테이징**
   - `npm run sync` — `.claude-plugin/mcp.json`·`.codex-plugin/mcp.json`·`.env.example` 등 커밋되는 생성물을 소스 기준으로 최신화. (`codex-agents/*.toml`·`plugins/personal/`도 함께 재생성되지만 둘 다 gitignore라 커밋 안 함.)
   - `npm run validate` 통과 확인(생성물이 소스와 일치하는지 게이트).
   - 소스와 생성물을 **함께** 스테이징. `git status`로 의도한 파일만 들어갔는지 확인.

2. **커밋**
   - 메시지는 한국어 권장(이 repo 문서 방침). 제목 한 줄 + 필요시 본문.
   - **멀티라인 메시지는 `.git/`에 임시 파일로 쓰고 `git commit -F <파일>`로 넘긴다.** Bash 툴에서 `@'...'@`(PowerShell here-string)은 리터럴로 파싱돼 제목 앞에 `@`가 붙는다. 짧은 한 줄이면 `-m` 사용.
   - 메시지 끝에 트레일러: `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.

3. **플러그인 영향 파일이 바뀌었으면 Codex 재설치**
   - 영향 경로: `skills/`, `agents/`, `mcp.servers.json`, `hooks/`, `.claude-plugin/`, `.codex-plugin/`. (`agents/` 변경이 곧 `codex-agents/` 재생성 트리거 — 후자는 gitignore라 커밋엔 안 보임.)
   - 그 중 하나라도 이번 커밋에 포함됐으면 `npm run codex:reinstall` 실행(번들 재생성 → 플러그인 remove/add → 에이전트 TOML을 `~/.codex/agents/`로 복사). 문서/테스트만 바뀐 커밋이면 생략.

4. **reload 안내 (직접 실행 불가)**
   - `/reload-plugins`는 슬래시 명령이라 스킬이 실행할 수 없다. 사용자에게 안내한다: **"이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."**

## 주의

- 생성물(`.claude-plugin/mcp.json`, `codex-agents/*.toml` 등)을 직접 수정하지 않는다 — 소스를 고치고 `npm run sync`.
- `plugins/personal/`·`codex-agents/`는 gitignore된 로컬 생성물 — 스테이징하지 않는다.
- 비밀은 `.env`(gitignore)에만. 실제 비밀 값을 스테이징하지 않는다.
- 푸시는 사용자가 요청할 때만 한다.
