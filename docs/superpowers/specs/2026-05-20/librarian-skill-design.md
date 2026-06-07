# librarian skill 설계

**날짜**: 2026-05-20
**상태**: 설계 (skill 미작성 — 이 문서는 "어떻게 만들지"의 기준)
**작성 예정 위치**: `work/plugin/skills/librarian/SKILL.md` (Claude Code + Codex 공용 monorepo 플러그인)
**대상 vault**: `kb` (LLM 지식 베이스, LLM Wiki 패턴) — 경로는 `.env`의 `LIBRARIAN_VAULT_PATH`로 설정

---

## 1. 무엇 / 왜

`librarian`은 `kb` 지식 베이스를 **운영하는 skill**이다. 사서 업무 = 입수(ingest) → 목록화(index) → 교차참조 → 열람 서비스(query) → 장서 점검(lint).

역할 분담:
- **vault의 `AGENTS.md`** = "페이지가 어떻게 생겼나" (구조·페이지 계약·규약). 단일 진실원천.
- **`librarian` skill** = "어떻게 운영하나" (ingest/query/lint 절차 + 자동 저장). 구조를 **재기술하지 않고** vault의 `AGENTS.md`를 읽어 따른다.

## 2. 프로젝트 현실 (이 재작성이 반영하는 것)

이 스펙은 추상 설계가 아니라 현 저장소 상태를 반영한다.

- **플러그인은 스켈레톤**: `work/plugin`은 `skills/`에 `.gitkeep`만, `mcp.servers.json`은 `{}`. `librarian`이 이 저장소의 **첫 스킬**이 된다.
- **kb vault는 이미 존재**: `work/docs/kb`에 완성된 `AGENTS.md` 페이지 계약(sources/entities/concepts/syntheses) + `index.md`/`log.md` + `raw/`·`sources/`·`entities/`·`concepts/`·`syntheses/` + **자체 `.git`**. 스킬은 이 계약을 재기술하지 않고 읽어 따른다.
- **`보관함`은 별개**: `work/docs/보관함`이 실제 `.obsidian/`을 가진 **사람용 작업 vault**. `kb/AGENTS.md`가 명시하듯 kb와 독립이다. librarian은 **kb만** 운영한다. "obsidian vault"라는 표현은 *kb를 Obsidian 그래프뷰로 본다*는 의미일 뿐, 보관함을 가리키지 않는다.
- **env 기계장치는 루트에 집중**: `scripts/with-env.mjs`, `scripts/lib/parse-env.mjs`, `scripts/sync-mcp.mjs`, `scripts/check-secrets.mjs`가 모두 루트 `scripts/`에 있다. `.env`는 gitignore, `.env.example`은 `mcp.servers.json`에서 자동생성(MCP 전용).

## 3. 핵심 원칙

- **단일 진실원천**: 페이지 구조·계약은 vault의 `AGENTS.md`에만. skill은 참조만.
- **에이전트 중립**: Claude Code + Codex 공유. 형식 인자 파싱 등 특정 에이전트 기능에 의존하지 않는다.
- **사람 triage 유지**: ingest는 무인 발사가 아니라 핵심을 사람과 확인하는 단계를 거친다.
- **자동 저장**: 한 번 호출 → 여러 파일 갱신 + git 커밋까지 자동.
- **하드코딩 금지**: vault 경로를 머신 종속 절대경로로 박지 않는다 — `.env`에서 해석한다.

## 4. vault 경로 해석 (env 기반)

vault 위치는 `.env`의 **`LIBRARIAN_VAULT_PATH`**로 설정한다. 스킬은 markdown 절차라 `.env`를 직접 못 읽으므로, 전용 리졸버 스크립트를 둔다.

### `skills/librarian/scripts/resolve-vault.mjs` (신규)

현재 이 리졸버의 유일한 소비자는 librarian 스킬이다. AGENTS.md 규약("스킬 전용 스크립트는 skill 안에, 훅·다른 스킬에서도 실제로 쓰는 경우에만 루트로 승격")에 따라 **skill 디렉터리 안**에 둔다. 공용 env 파서(`scripts/lib/parse-env.mjs`)는 루트에 그대로 두고 리졸버가 상대경로(`../../../scripts/lib/parse-env.mjs`)로 import한다 — *공유 라이브러리는 루트, 스킬 전용 소비자는 스킬 안*. 향후 inbox-watcher 훅이나 다른 스킬이 vault 경로를 쓰게 되면 그때 루트로 승격한다.

동작:
1. 루트 `scripts/lib/parse-env.mjs`를 재사용해 플러그인 root의 `.env`(`../../../.env`)를 파싱한다.
2. 해석 우선순위: `process.env.LIBRARIAN_VAULT_PATH` → `.env` 파일의 `LIBRARIAN_VAULT_PATH`. (`with-env.mjs`의 `{ ...fileEnv, ...process.env }` 정신 — 실제 환경변수가 파일을 덮어쓴다.) 마켓플레이스 캐시 설치처럼 `.env`가 없는 경우엔 실제 환경변수로 동작.
3. **검증**: 해석한 경로가 존재하고 *kb vault처럼 생겼는지* 확인한다 — `AGENTS.md`와 `index.md`가 있어야 한다. 아니면 실패. (잘못된 vault, 예컨대 보관함을 실수로 건드리지 않게.)
4. 성공 → 절대경로를 **stdout**으로 출력, exit 0.
5. 실패(미설정·경로 없음·구조 불일치) → **stderr**에 명확한 에러 + `.env`에 `LIBRARIAN_VAULT_PATH=...`를 설정하라는 안내, **non-zero exit**.

스킬은 `node <plugin-root>/skills/librarian/scripts/resolve-vault.mjs`를 실행해 stdout의 절대경로를 받는다 (에이전트 중립 — shell 실행만 필요).

### `tests/librarian-resolve-vault.test.mjs` (신규)

`npm test`가 `tests/**/*.test.mjs`를 글로빙하므로 테스트 파일은 (스크립트가 스킬 안에 있어도) 루트 `tests/`에 둔다. 스킬 안의 리졸버를 상대경로로 import해 검사한다: 미설정 시 에러, `.env`/`process.env` 우선순위, kb 구조 검증 통과/실패, 절대경로 출력.

## 5. `.env` 문서화 / `.env.example` 처리

- `.env.example`은 `mcp.servers.json`에서 자동생성(MCP 전용)이므로 **건드리지 않는다** (생성 파일 직접 수정 금지 규약).
- `LIBRARIAN_VAULT_PATH`는 세 곳에서 문서화한다:
  1. 리졸버 실패 시 stderr 안내 메시지 (가장 발견성이 높음).
  2. `skills/librarian/SKILL.md`.
  3. 플러그인 `AGENTS.md` 한 줄 (예: "librarian용 vault 경로는 `.env`의 `LIBRARIAN_VAULT_PATH`로 설정").
- 실제 값은 gitignore된 `.env`에만 둔다 (MCP 비밀과 동일 패턴, 머신별로 로컬 유지).

## 6. 호출 인터페이스

**표준(이식 가능)**: skill 호출 + 메시지 안에 소스 **path 또는 URL**을 자연어로 전달.
- 어떤 에이전트든 "메시지의 path를 읽는" 건 되므로 형식 인자 문법에 묶이지 않는다.
- 예: "librarian으로 이거 ingest해줘: `raw/2026-05-20-rag-survey.md`"

**Claude Code 단축(선택)**: `/librarian ingest <path|url>`, `/librarian query <질문>`, `/librarian lint`.

**소스 인자 규칙** (raw 불변 원칙 유지):
- path가 `raw/` 안 → 그대로 소스로 사용.
- path가 `raw/` 밖이거나 URL → skill이 먼저 `raw/`에 clip·저장 후 ingest (원본을 영구 보존).
- 소스 미지정 ingest → `raw/`에서 대응 source 페이지가 없는 미처리 파일을 스캔.

## 7. Operations

모든 operation은 먼저 리졸버로 vault 절대경로를 얻고, 그 vault의 `AGENTS.md` 규약을 로드한 뒤 진행한다. 절차의 세부 구조(섹션·frontmatter)는 vault의 `AGENTS.md`를 따른다. skill은 흐름을 조율한다.

### ingest
1. `resolve-vault.mjs`로 vault 경로 확보 → vault `AGENTS.md` 규약 로드.
2. 소스 읽기 (필요시 `raw/`에 저장; 이미지 있으면 보고 글로 변환 — text-only).
3. **triage**: 핵심 takeaway를 사람과 확인.
4. `sources/`에 요약 페이지 작성.
5. 건드린 `entities/`·`concepts/`·`syntheses/` 페이지 생성·갱신·교차링크. 새 데이터가 기존 주장과 충돌하면 모순 표시. 고립 노드 금지(최소 1 outbound link).
6. `index.md` 갱신, `log.md`에 `## [날짜] ingest | 제목` 추가.
7. **vault 저장소에서 자동 커밋**.

### query
1. `index.md`로 관련 페이지 탐색 → 읽기.
2. 출처 인용해 답변.
3. 가치 있는 답(비교·연결·분석)은 `syntheses/`·`concepts/` 페이지로 되먹임 → `index`·`log` 갱신 → 커밋.

### lint
- 모순·낡은 주장·고아 페이지(인바운드 0)·페이지 없는 핵심 개념·누락 교차링크·`index.md` 정합성 점검.
- 리포트 + 다음에 조사할 질문/소스 제안. (수정 적용 시 커밋)

## 8. 자동화 저장 메커니즘 (3겹)

1. **내용 다중 쓰기** — 한 호출이 source + entity/concept/synthesis + index + log를 한 번에 갱신.
2. **git 자동 커밋** — 작업 끝에 **vault 저장소에서** `git -C <vault> add -A && git commit` (플러그인 repo가 아니라 kb의 자체 `.git`). 로컬 커밋(원격 없음), 되돌리기 쉬움. *(기본: 자동 커밋. 원하면 "확인 후 커밋"으로 조정 가능)*
3. **트리거 자동화** — deferred. 지금은 사람이 호출. 추후 `/loop`나 inbox watcher(`claude -p`)로 무인화 옵션.

## 9. 파일 구조

```
work/plugin/
├─ scripts/
│  └─ lib/parse-env.mjs                 # 기존 — 재사용 (변경 없음)
├─ tests/
│  └─ librarian-resolve-vault.test.mjs  # 신규 단위 테스트 (루트 tests/ — npm test 글로빙)
└─ skills/librarian/
   ├─ SKILL.md                          # frontmatter(name, description) + ingest/query/lint 흐름 + 리졸버 호출
   ├─ scripts/
   │  └─ resolve-vault.mjs              # 신규: LIBRARIAN_VAULT_PATH 해석 + kb 구조 검증 + 절대경로 출력
   └─ references/                       # (선택) ingest.md / query.md / lint.md 로 분리 — 길어지면
```

- frontmatter는 공통 키(`name`, `description`)만 (plugin 규약 — Claude·Codex 공유).
- `description`은 트리거가 잘 걸리게: "kb 지식 베이스에 소스를 ingest / 질의 / 점검(lint)할 때".

## 10. 멀티 에이전트 고려

- Claude 도구명 사용 + Codex 매핑(`references/codex-tools.md`) 전제.
- **vault 위치**: `.env`의 `LIBRARIAN_VAULT_PATH`에서 해석 (4절). 머신 종속 절대경로 하드코딩 회피.
- 작성 시 **`superpowers:writing-skills` 사용** (plugin AGENTS.md 규약).

## 11. 비범위 / 후속

- **이 단계에선 skill을 실제로 작성하지 않는다** — 이 문서가 작성 기준.
- 트리거 무인 자동화(watcher / `/loop`)는 후속.
- 보관함(사람용 vault) 운영은 범위 밖.
- 실제 작성은 plugin에서 `superpowers:writing-skills`로.

## 12. 작성 시 체크리스트 (나중에)

- [ ] `skills/librarian/scripts/resolve-vault.mjs` 생성 (루트 `parse-env.mjs` 재사용, `process.env` → `.env` 우선순위, kb 구조 검증, 절대경로 stdout/에러 stderr).
- [ ] `tests/librarian-resolve-vault.test.mjs` 생성, `npm test` 통과.
- [ ] `work/plugin/skills/librarian/SKILL.md` 생성 (`superpowers:writing-skills`).
- [ ] 페이지 계약 재기술 금지 — vault `AGENTS.md` 참조만.
- [ ] 자연어 path 인터페이스 (형식 인자 의존 X).
- [ ] ingest triage 단계 명시.
- [ ] vault 저장소에서 자동 커밋 단계 포함.
- [ ] `LIBRARIAN_VAULT_PATH` 문서화: SKILL.md + 플러그인 AGENTS.md + 리졸버 에러 메시지.
- [ ] Claude + Codex 양쪽에서 로컬 테스트.
