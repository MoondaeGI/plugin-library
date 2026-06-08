# personal plugin

Claude Code + Codex CLI 양쪽에서 쓰는 개인용 플러그인. 저장소 하나에 매니페스트 두 개, MCP 소스와 스킬은 공유한다.

---

## 설치

아래 블록을 위에서 아래로 그대로 복사해 붙여넣으면 된다.

### 1. 공통 준비 (어느 도구든 먼저)

```powershell
git clone https://github.com/MoondaeGI/plugin-library.git plugin
cd plugin
npm install                 # prepare 훅이 sync를 자동 실행
cp .env.example .env
notepad .env                # 실제 값 채우기 (디자인 이미지엔 OPENAI_API_KEY 필요)
```

### 2. Claude Code

```powershell
# A. 로컬 개발 — 디렉터리를 바로 플러그인으로 띄움
claude --plugin-dir .
```

```text
# B. 마켓플레이스 설치 (Claude 세션 안에서, 최초 1회)
/plugin marketplace add https://github.com/MoondaeGI/plugin-library.git
#   (로컬 경로로도 가능) /plugin marketplace add C:\Users\ansgu\work\plugin
/plugin install personal
```

수정 후 갱신: `/reload-plugins`

### 3. Codex CLI

```powershell
# 1) 마켓플레이스 등록 (머신당 한 번)
codex plugin marketplace add C:\Users\ansgu\work\plugin
#   (다른 머신은 Git으로)
#   codex plugin marketplace add MoondaeGI/plugin-library --ref main

# 2) 플러그인 설치 (PLUGIN@MARKETPLACE — 둘 다 이름이 personal)
codex plugin add personal@personal

# 3) 확인 — personal@personal = installed, enabled
codex plugin list --marketplace personal
```

수정 후 갱신:

```powershell
npm run codex:reinstall     # sync(번들 재생성) → codex plugin remove → add
```

> `codex plugin add`만 다시 돌리면 갱신되지 않으므로 remove가 선행돼야 하며, 위 스크립트가 그 순서를 처리한다. Git 마켓플레이스로 설치한 다른 머신은 `codex plugin marketplace upgrade personal`로 스냅샷을 새로고침한 뒤 재설치한다.

<details>
<summary>Codex 번들·마켓플레이스 스키마 주의사항 — 펼쳐 보기</summary>

Codex는 플러그인 디렉터리를 자체 캐시로 **스냅샷 복사**해서 로드하므로 루트 `skills/`를 직접 보지 못한다. 그래서 Codex용으로는 자체 완결형 번들 `plugins/personal/`(자기 `skills/` 포함)이 필요하다. 이 번들은 **`npm run sync`가 루트 `skills/`에서 생성**하는 **로컬 생성물이며 git에 커밋하지 않는다**(gitignore — 루트 `skills/`와의 중복 방지). 설치/사용 전 항상 sync를 돌리므로 추적할 필요가 없고, `npm install`의 `prepare` 훅도 자동으로 재생성한다.

마켓플레이스 스키마: `.agents/plugins/marketplace.json`의 플러그인 `source`는 문자열이 아니라 객체(`{ "source": "local", "path": "./plugins/personal" }`)이고 `policy`/`category`가 필요하다. Claude용 `.claude-plugin/marketplace.json`은 `source: "./"`(루트)로 충분하다.

</details>

---

## 레이아웃

- `mcp.servers.json` — MCP 서버 정의의 단일 소스 (편집은 여기만)
- `scripts/sync-mcp.mjs` — 소스로부터 `.claude-plugin/mcp.json`, `.codex-plugin/mcp.json`, `.env.example`를 재생성
- `scripts/sync-codex-plugin.mjs` — 루트 `skills/`에서 Codex 번들 `plugins/personal/`를 재생성
- `scripts/lib/load-env.mjs` (`loadEnv()`) — `.env`(비밀 단일 소스, gitignore됨)를 읽어 `process.env`와 병합한다(OS env 우선). 스크립트가 이걸로 `.env`를 직접 읽으므로 Claude는 `.env` 저장 즉시 반영된다. Codex 번들은 `npm run codex:reinstall`로 갱신
- `skills/` — Claude와 Codex가 공유하는 스킬의 **단일 소스** (Claude는 여기서 직접 읽음)
- `agents/` — Claude 서브에이전트 **소스** (`designer.md` 등; Claude가 직접 읽음)
- `codex-agents/` — **로컬 생성물**: `agents/*.md`에서 만든 Codex 에이전트 TOML (`npm run sync`가 생성, **gitignore — 커밋 안 함**, `codex:reinstall`이 `~/.codex/agents/`로 설치)
- `plugins/personal/` — **로컬 생성물**: Codex가 설치하는 자체 완결형 번들 (`npm run sync`가 생성, **gitignore — 커밋 안 함**, 직접 편집 금지)
- `.agents/plugins/marketplace.json` — Codex 마켓플레이스 정의 / `.claude-plugin/marketplace.json` — Claude 마켓플레이스 정의
- `hooks/hooks.json` — 세션 훅 (현재: mcp·codex-plugin stale-sync 검사)
- `tests/` — 스크립트 테스트 (`npm test`로 실행)

개발 가이드는 [AGENTS.md](./AGENTS.md) 참고.

---

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

`${EXAMPLE_API_KEY}`는 MCP 런타임이 **OS 환경변수**에서 치환한다. 한편 일반 스크립트는 공용 `loadEnv()`로 `.env`를 직접 읽으므로, 비밀은 `.env`에 적기만 하면 된다.

이후:

```powershell
npm run sync                # 생성 파일 갱신
# .env에 비밀을 적으면 스크립트가 바로 읽음
```

그다음 `/reload-plugins`(Claude) 또는 `npm run codex:reinstall`(Codex).

---

## 에이전트

이 플러그인이 제공하는 서브에이전트. 소스는 모두 `agents/*.md`(Claude 네이티브)이고, Codex용 TOML은 `npm run sync`가 생성한다.

| 에이전트 | 역할 |
|---|---|
| **designer** | 브랜드 킷·UI 킷·`DESIGN.md`를 디자인 스킬 파이프라인으로 만드는 디자인 주체. 핵심 파이프라인(`design-brand-kit` → `design-logo`/`design-iconset` → `design-ui-kit` → `design-md-compiler`)을 협업 루프로 운전한다. HTML 구현은 web-publisher에 위임. |
| **web-publisher** | designer 산출물(브랜드 킷·`DESIGN.md`·이미지·확정 CSS)을 디자인 의도대로 HTML/CSS로 충실히 구현하고, OS 브라우저 스크린샷으로 레이아웃 깨짐을 자가 검사하는 퍼블리셔. |
| **devils-advocate** | 의견·결정·설계를 압박 검증하는 악마의 변호인. 모든 허점을 빠짐없이 들추되 심각도 등급을 붙인다. |
| **front-developer** | *(미구현 — 호출 금지)* 확정 디자인 산출물을 대상 프로젝트의 컴포넌트 세트·페이지 코드로 변환할 프론트엔드 에이전트. |

> **호출**: Claude는 `agents/`를 직접 읽어 `@agent-personal:designer`로 자동 노출한다. Codex는 에이전트를 플러그인 번들에 못 넣어, `agents/*.md`에서 생성한 TOML이 `~/.codex/agents/`로 들어간다(스킬은 번들로, 에이전트는 여기로 — 위치만 다름). `model`/`tools`는 Claude 전용 frontmatter라 Codex로 옮기지 않는다.
>
> **갱신은 스킬·에이전트 공통**으로 위 [설치](#설치)의 "수정 후 갱신"과 같다 — Claude `/reload-plugins`, Codex `npm run codex:reinstall` 후 세션 재시작.

---

## 스킬

자연어로 발동하거나(`/스킬명`으로 명시 호출도 가능) 에이전트가 `Skill` 도구로 호출한다.

### 디자인 파이프라인 (designer 소유)

제품 설명 한 줄에서 **브랜드 정체성 → 자산 → UI 킷 → 구현 문서(`DESIGN.md`)**까지 잇는 스킬 묶음. 각 단계는 앞 단계의 `.design/` 산출물을 시드로 받는다.

| 스킬 | 한 줄 |
|---|---|
| **design-brand-kit** | 브랜드 정체성·색·타이포·로고 방향·UI 분위기 정리 + base 자산(투명 PNG) + HTML 오버뷰. lock 시 공유 `tokens.css` 생성. |
| **design-logo** | brand-kit 로고를 더 다듬을 때. 라운드당 3~4 방향을 탐색 시트로 보여주고 단독 로고 확정. |
| **design-iconset** | Iconify 단일 세트에서 제품 아이콘 세트를 fetch·정규화해 lock. |
| **design-ui-kit** | 토큰 위에 제품 UI 컴포넌트 라이브러리를 HTML/CSS로 저작. |
| **design-md-compiler** | 위 산출물을 구현자가 따를 `DESIGN.md`로 컴파일. **핵심 파이프라인 종착.** |
| design-image-web / -mobile | *(선택)* `DESIGN.md` 시드로 웹/앱 풀페이지 목업 이미지 — HTML 전 룩 탐색. |
| design-html-prototype | `DESIGN.md`로 풀페이지 HTML 프로토타입 빌드+QA (web-publisher). |
| design-component-export / -generate-code | *(미구현)* 확정 디자인 → 컴포넌트 세트 → 실제 코드 (front-developer). |
| image-gen | 공유 이미지 생성기 (OpenAI Images API). 위 이미지 스킬들이 호출. `OPENAI_API_KEY` 필요. |
| web-publisher-qa | 구현 HTML/CSS를 OS 브라우저 스크린샷으로 자가 검사. |

> 핵심 파이프라인 흐름·예시·각 스킬 산출물은 **[docs/design/README.md](docs/design/README.md)** 참고.

### 그 외

| 스킬 | 한 줄 |
|---|---|
| **librarian** | kb 지식 베이스(LLM Wiki)에 소스 입수·질의·무결성 점검. vault 경로는 `.env`의 `LIBRARIAN_VAULT_PATH`. |
| **idea** | 날 것의 아이디어를 brainstorming 전에 devils-advocate 라운드로 압박 검증·합의. superpowers 있으면 brainstorming으로 핸드오프(없으면 일반 안내). |
| **discussion** | 결정·설계·초안을 굳히기 전 Claude 의견 + 독립적 반대 의견을 함께 본다. |
| **commit** | 이 모노레포 컨벤션에 맞춰 커밋. |
