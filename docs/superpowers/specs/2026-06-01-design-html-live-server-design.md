# design HTML 라이브 프리뷰 (serve-design) 설계

> 2026-06-01 · 브랜치: feat/asset-first-brand-kit

## 배경 / 문제

`design-brand-kit`은 `overview.html`을, `design-html-prototype`은 단일 HTML 프로토타입을
산출한다. 둘 다 현재는 끝맺음이 "사람이 직접 브라우저로 연다"이다. 반복 수정 루프(자산
재생성·HTML 외과 편집)에서 매번 수동으로 새로고침해야 해서 피드백 사이클이 느리다.

원하는 것: HTML이 만들어지면 **자동으로 브라우저가 열리고**, 이후 파일이 바뀌면 **자동
새로고침**(Live Server 류). reload·크로스플랫폼 오픈 로직을 직접 구현하지 않고 **기존
라이브러리에 위임**한다. 이 런처는 이후 여러 design 스킬이 공유한다.

## 결정 사항

- **라이브러리: `five-server`** (Live Server의 유지보수 후속 포크, 2026-05 갱신). 정적 dir
  서빙 + 파일 watch + WebSocket 자동 reload + 브라우저 오픈 + OS 분기를 모두 내장 →
  우리는 reload/크로스플랫폼 오픈을 구현하지 않는다. (대안 검토: live-server=원조이나 정체,
  browser-sync=오버킬, vite=정적 self-contained HTML엔 오버킬.)
- **위치: 최상위 `scripts/serve-design.mjs`** (스킬 전용 아님 — `AGENTS.md` 규칙대로 여러
  스킬이 공유하므로 승격). 첫 질문의 "크로스플랫폼 node 오픈 헬퍼"는 five-server가 흡수해
  **불필요** → 얇은 런처 하나로 대체.
- **의존성: `five-server`를 `package.json`의 `devDependency`로 추가.** 이 저장소는
  `npm install`의 `prepare` 훅이 이미 도는 구조라 머신마다 설치됨 → `npx` 네트워크 페치
  없이 `node_modules/.bin`에서 결정적으로 해결.

## 구성 요소

### 1. `scripts/serve-design.mjs` (얇은 런처)

책임: 인자 검증/경로 해석 후 `five-server`를 해당 디렉터리 대상으로 **spawn**한다.
reload·watch·브라우저 오픈은 전부 five-server에 위임 — **이 스크립트는 그 로직을 구현하지
않는다.**

사용:

```
node scripts/serve-design.mjs <dir|html경로> [--port N] [--no-open]
```

- `<dir|html경로>`: 서빙할 디렉터리. HTML 파일 경로를 주면 그 부모 dir을 루트로, 해당
  파일을 오픈 대상으로 잡는다. (overview.html은 형제 `assets/` 상대경로라 dir 루트만
  맞으면 그대로 동작.)
- `--port N`: 기본 포트(예: 5500). 점유 시 five-server가 다음 포트로 폴백.
- `--no-open`: 브라우저 자동 오픈 끄기(서버만).

오류 처리: 존재하지 않는 경로/알 수 없는 인자는 커스텀 에러(`ServeDesignError`)로 깔끔한
stderr + 종료코드 2 (`build-contact-sheet.mjs`·image-gen 규약과 일치). spawn 실패(바이너리
부재 등)는 "`npm install` 했는지" 안내 포함.

내부 분리: 순수 로직(인자 파싱·경로 해석·five-server CLI 인자 조립)과 부수효과(spawn)를
분리한다. spawn은 주입 가능한 spawner로 받아 테스트에서 가짜로 대체.

### 2. `package.json`

`devDependencies`에 `five-server` 추가. 다른 변경 없음(`prepare` 훅은 이미 sync 실행).

### 3. 스킬 배선 — `design-brand-kit/SKILL.md`

- **반복 수정 루프 진입 시 1회** 서버를 **백그라운드(`run_in_background`)로** 기동하도록
  단계 명시. 이후 자산 재생성·HTML 편집 때마다 브라우저 자동 새로고침.
- **발산 route 비교 시** 해당 route 폴더(또는 routes 상위)를 루트로 띄워 3개 overview를
  나란히 본다.
- **lock/세션 종료 시** 서버 중단(포트 점유 방지) 안내.
- 호출 경로는 스킬에서 `../../scripts/serve-design.mjs` (top-level scripts 참조 관례).
- 실행은 명령이므로 **전역 규칙대로 최초 1회 사용자 확인** 후 기동(이후 같은 서버 유지).

> `design-html-prototype` 등 다른 HTML 산출 스킬도 같은 런처를 재사용한다(이번 범위는
> 배선까지 하지 않고, 런처를 공유 가능하게만 둔다 — YAGNI).

## 데이터 흐름

```
스킬 → node scripts/serve-design.mjs <output-dir> (백그라운드)
      → five-server: dir watch + WS reload + 브라우저 오픈
      → 이후 Claude가 assets/*.png 재생성 or overview.html 편집
      → five-server가 변경 감지 → 브라우저 자동 reload
```

## 테스트 (TDD)

`tests/serve-design.test.mjs` — 순수 부분만 단위 테스트, 실제 서버는 안 띄움:

- 인자 파싱: `--port`, `--no-open`, 위치 인자 1개.
- 경로 해석: dir 입력 → 그 dir 루트 / html 파일 입력 → 부모 dir 루트 + open 대상.
- 검증 실패: 존재하지 않는 경로 → `ServeDesignError` + exit 2; 알 수 없는 플래그.
- 기본값: 포트 미지정 시 기본 포트, `--no-open` 미지정 시 오픈 on.
- spawn 호출: 주입한 가짜 spawner가 **올바른 five-server 인자**(루트 dir, 포트, open/no-open)
  로 호출됐는지 검증(프로세스 실제 기동 안 함).

## 범위 밖 (YAGNI)

- `design-html-prototype` 등 타 스킬의 실제 배선(런처만 공유 가능하게 둠).
- HTTPS·프록시·SPA 폴백 등 five-server 고급 옵션.
- 서버 라이프사이클 자동 종료 자동화(세션 종료 시 안내로 충분).
