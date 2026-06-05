# design-image-web/mobile 풀페이지 목업 전환(v2 델타) 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **추가 REQUIRED SUB-SKILL:** SKILL.md·references 저작/개정 태스크는 반드시 `superpowers:writing-skills`를 먼저 호출해 그 지침을 따른다(CLAUDE.md 규칙).

**Goal:** 이미 main에 있는 design-image-web/mobile의 산출 단위를 "UI 섹션별 이미지"에서 "1:3 풀페이지 목업"으로 전환하고, html-prototype 직전 탐색 단계로 재포지셔닝한다.

**Architecture:** v1 산출물(SKILL.md·references·image-gen 배선·게이트 루프·DESIGN.md 바인딩·Phase 0)을 살리고 **델타만** 적용한다 — 산출 단위(섹션→풀페이지 컴프), 게이트1(웹=DESIGN.md §6에서 담을 섹션 선택), 발산(풀페이지 방향 3~4개, `--quality low`), 포맷(세로 ≤3:1, 예 `1280x3840`), 네이밍(`<slug>-<platform>[-<zone>].png` / 모바일 `<slug>-mobile-<screen>.png`), 비용 규율(발산 low·확정 high), 교차참조 문구. art-direction-web.md는 섹션-단위 골격이라 **재작성**한다.

**Tech Stack:** Markdown SKILL.md(frontmatter `name`/`description`), 공유 `image-gen`(`skills/image-gen/scripts/image-gen.mjs`, gpt-image-2 ≤3:1·최대 3840·변 16배수), 공유 라이브 서버(`scripts/lib/serve-design.mjs`), `npm run sync`/`validate`/`test`.

**근거 스펙:** `docs/superpowers/specs/2026-06-04-design-image-web-mobile-split-design.md` (v2 — "개정 요약"·dry-run 검증·§3·§5·§6·§7·§8 권위)

---

## 사전 메모 (모든 태스크 공통)

- **산문(스킬) 개정 작업**이다. 새 `.mjs` 로직 없음. "테스트" = `npm test` 무회귀 · `npm run validate` 통과 · frontmatter 유효 · 옛 표현(섹션별/가로/`<slug>-<platform>-<section>`) grep 0건.
- **dry-run으로 v2 전제는 이미 검증됨**(스펙 "개정 요약"): 1:3 `1280x3840` low로 한국어 풀페이지가 한 맥락·가독으로 생성됨. 비용: low 1:3 ~$0.02–0.03, high ~$0.5.
- **본보기 파일**: `skills/design-logo/SKILL.md`(발산 라운드·시트·lock 패턴), 현재 `skills/design-image-web/SKILL.md`·`references/art-direction-web.md`(v1 — 개정 대상), `skills/image-gen/SKILL.md`(CLI).
- **유지 원칙**: DESIGN.md 토큰 바인딩·자산 `--image` 앵커·Phase 0·라이브 프리뷰·self-contained references·한국어. 값(색·폰트·카피·브랜드) 창작 금지.
- 현재 브랜치: `feat/design-image-fullpage-mockup` (스펙 v2 커밋 `a4ce1b1` 위). 커밋은 이 브랜치에.

---

## 파일 구조 (모두 기존 파일 수정 — 신규/삭제 없음)

- `skills/design-image-web/references/art-direction-web.md` — **골격 재작성**(섹션-단위 → 풀페이지). 가장 큰 작업.
- `skills/design-image-web/SKILL.md` — frontmatter description + 본문(산출 단위·게이트1·발산 low·포맷 세로 ≤3:1·네이밍·포지셔닝·비용).
- `skills/design-image-mobile/SKILL.md` — 발산 라운드(low)·포지셔닝·description(저위험 델타).
- `skills/design-image-mobile/references/art-direction-mobile.md` — 포맷/발산/비용 문구 소폭(대부분 유지).
- `skills/design-md-compiler/SKILL.md` — 네이밍(섹션→페이지)·"풀페이지 목업" 표현 + anti-slop carve-out(목업=레퍼런스).
- `agents/designer.md` — 다운스트림 문구("풀페이지 목업, html-prototype 직전 탐색").
- `README.md`·`docs/design/README.md` — 산출물 설명("섹션별" → "풀페이지 목업").
- (생성물) `.env.example`·`plugins/personal/`·`codex-agents/` — `npm run sync` 재생성.

---

## Task 1: art-direction-web.md 골격 재작성 (섹션-단위 → 풀페이지)

**Files:**
- Modify(재작성): `skills/design-image-web/references/art-direction-web.md`

- [ ] **Step 1: writing-skills 호출** — `superpowers:writing-skills` 후 지침 준수.

- [ ] **Step 2: 현재 파일 읽고 보존/전환 분리**

`skills/design-image-web/references/art-direction-web.md`를 읽는다. **보존**: 조합형 안목·anti-AI-slop 카탈로그·히어로 규칙·팔레트/그라데이션 규율·DESIGN.md 바인딩 대원칙. **전환(섹션→풀페이지)**: "1섹션=1이미지", Section System, 섹션별 구도 앵커, "섹션 간 리듬/여백", "다른 섹션 이미지와 일관" → 모두 *한 페이지 안*의 개념으로.

- [ ] **Step 3: 아래 골격으로 재작성**

§0 대원칙(유지): 값(색·폰트·카피·브랜드)은 DESIGN.md 토큰에서. 이 문서는 `design-image-web`이 프롬프트 구성 시 읽는 가드레일.

1. **핵심 디렉티브** — generic AI 아트가 아니라 awwwards급 **풀페이지 목업 레퍼런스**. 용도: **HTML 구현 전 룩 탐색**(개발자가 보고 HTML로 재구축 가능해야 함). 한 페이지를 한 맥락으로.
2. **브리프→방향 매핑** — minimalist/editorial/cinematic/SaaS/agency/ecommerce별 **페이지 무드**(히어로 스케일·배경 모드·구도 바이어스). DESIGN.md §3 시각 방향이 항상 우선.
3. **조합형 변주 엔진(페이지 단위)** — 각 카테고리 1개씩 골라 **페이지 전체에 일관**: Theme Paradigm / Background Character / Hero Architecture / **Page Rhythm System**(구 Section System — 한 페이지 내 섹션 배열/밀도 리듬) / Signature Component ×4 / Motion-implied ×2 / Hero Scale(giant/mid/mini) / Narrative Spine / Second-read ×1. **Typography·Palette는 DESIGN.md 토큰**(카테고리에서 안 고름) — 목록 끝에 1줄 반복.
4. **풀페이지 구성 규칙**(구 "1섹션=1이미지" 대체) — 한 1:3 컴프 안에 **nav→hero→…→footer가 위→아래 자연스러운 스크롤 내러티브**로. 사용자가 게이트1에서 고른 섹션만 담되, 섹션 간 **리듬·여백·정렬·밀도 변주**는 *한 페이지 안에서* 적용(단조로운 슬랩 금지). 히어로 구도 편향 차단(text-left/image-right 기본값 금지 — 대안 구도 목록). 전 구간 **하나의 팔레트·타입 스케일·CTA 패밀리**.
5. **anti-AI-slop 카탈로그**(보존) — layout/visual(purple·blue glow·blob)/typography/content(클리셰·가짜 브랜드 — 카피·브랜드는 DESIGN.md §1)/density slop.
6. **히어로 규칙**(보존) — 좌우분할 기본 차단·H1 2~3줄·그래픽 절제·강한 대비·여백.
7. **팔레트·머티리얼·그라데이션**(보존) — DESIGN.md 토큰 팔레트 일관, 그라데이션 허용/금지.
8. **포맷·발산·길이** — **세로 ≤3:1**(예 `1280x3840`), **한 페이지 = 한 컴프**(섹션을 따로 N장 내지 않음). **발산은 `--quality low`로 3~4 방향, 확정만 `--quality high`**. **긴 페이지**(히어로+5섹션 초과)는 상단 핵심으로 캡하고, 하단 존이 꼭 필요하면 **독립 1:3 존 컴프**(연속 슬라이스 체이닝 금지). 풀길이 정밀본은 HTML 몫.
9. **품질 체크리스트**(풀페이지 기준) — 한 맥락으로 읽히나? 위→아래 스크롤 내러티브 자연스럽나? 계층 명확? 히어로 청결(2~3줄)? AI tell 없음? 팔레트 DESIGN.md 토큰과 일관? 히어로가 반사적 좌우분할 아님? 한국어 제목·버튼·라벨 가독?

- [ ] **Step 4: 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-image-web/references/art-direction-web.md','utf8');if(/DESIGN\.md/.test(t)&&/풀페이지|한 맥락/.test(t)&&/세로|≤3:1|3840/.test(t)&&!/1섹션\s*=\s*1이미지/.test(t)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK` (풀페이지·세로 포맷 반영 + "1섹션=1이미지" 잔재 제거)

- [ ] **Step 5: Commit**

```bash
git add skills/design-image-web/references/art-direction-web.md
git commit -m "refactor(design-image-web): art-direction을 풀페이지 목업 기준으로 재작성

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: design-image-web/SKILL.md 개정 (풀페이지 목업)

**Files:**
- Modify: `skills/design-image-web/SKILL.md`

- [ ] **Step 1: frontmatter description 정정**

v1 description의 "**섹션별** 디자인 이미지를 **가로 포맷**으로", "**한 섹션씩** 생성" 문구를 아래로 교체(나머지 유지):

```
description: 확정된 DESIGN.md를 시드로 웹 페이지(랜딩·대시보드·마케팅)의 풀페이지 목업 이미지를 세로 1:3 한 컴프로 만드는 designer 소유의 선택 다운스트림 단계 — HTML 구현(design-html-prototype) 전 룩 탐색용. DESIGN.md 토큰(실 HEX·실폰트)과 확정 자산(logo·icon·ui-base)에 바인딩해 image-gen(gpt-image-2)으로 풀페이지 방향을 발산(저품질)→확정(고품질)하고, 타깃 slug별 게이트 리뷰 시트로 검수·외과 편집해 assets/page/로 lock한다. DESIGN.md가 없으면 design.md 요청 또는 진도 감지 후 design-md-compiler/brand-kit로 유도. OPENAI_API_KEY 필요. 아트디렉션은 references/art-direction-web.md.
```

- [ ] **Step 2: 본문 절 개정**

기존 절을 아래로 갱신(스펙 §3·§5·§6·§7 권위):

- **목적/위치**: md-compiler 이후, **`design-html-prototype`(web-publisher) 직전**의 선택 탐색 단계. 확정 목업이 html-prototype의 **비주얼 타깃**(이미지=탐색/레퍼런스, 풀길이 정밀본은 HTML). designer가 md-compiler 후 "웹 페이지 목업 만들까요?"로 제안.
- **산출 단위**: 한 타깃 = 히어로+사용자가 고른 섹션이 이어진 **세로 ≤3:1 풀페이지 컴프 한 장**.
- **입력**(유지): DESIGN.md(frontmatter 토큰·§1·§3·§6·§8·§11), `assets/logo/logo.png`·`assets/icon/*.svg`·`assets/brand-kit/{ui-base,key-visual}.png`(`--image` 앵커), `tokens.css`. candidate·`brand-kit/icon/*` 제외.
- **출력 레이아웃**(네이밍 변경):
  ```
  view/page-web-<slug>.html                         # 발산 시트(방향 변주 나열 → 확정)
  candidate/page/page-briefs.md                     # 산문 출처 로그
  candidate/page/<slug>-web[-<zone>]-r<N>-<NN>.png  # 발산/수렴 변주(--auto-version, low)
  assets/page/<slug>-web[-<zone>].png               # 확정 풀페이지 목업(high)
  ```
  파일명은 식별자, 의미(고른 섹션·방향)는 page-briefs.md 산문.
- **이미지 생성**: `../image-gen/scripts/image-gen.mjs`, `gpt-image-2` 불투명, **세로 `--size 1280x3840`(또는 ≤3:1·변 16배수·최대 3840)**. 자산 `--image` 앵커, `--auto-version`. **발산·수렴 `--quality low`, 확정 직전 1장만 `--quality high`.** 프롬프트는 `--prompt-file` 임시파일, 색·폰트·카피·브랜드는 DESIGN.md에서. 호출 예시 코드블록(발산 low 1개 + 확정 high 1개).
- **아트디렉션 인용**: `references/art-direction-web.md`(가드레일).
- **라이브 프리뷰**(유지): `serve-design.mjs` 사용자 확인 후 1회, URL `…/view/page-web-<slug>.html`, `<img>` 상대경로·`tokens.css` var() 렌더.
- **흐름(발산 게이트 루프, 스펙 §7)**: Phase 0 → **게이트1**(타깃 slug + **DESIGN.md §6에서 이 컴프에 담을 섹션을 사용자가 선택**; 1:3 초과분은 필요시 독립 존 컴프; 확정 전 0장) → **게이트2**(art-direction 조합형 방향 합의) → **발산 라운드**(풀페이지 방향 3~4개 `--quality low` 병렬 → 시트 번호 나열 → 라이브) → **선택·수렴**("#N 좋다"→수렴 라운드[#N을 `--image` 앵커] 또는 바로 확정 / "더 다르게"→발산 재생성·시트 교체) → **다듬기**(한 번에 한 가지, `--image`+`--auto-version`; 확정 직전 high 1장) → **lock**(`assets/page/<slug>-web[-<zone>].png` 복사, page-briefs 산문) → 서버 종료 + **"확정 목업이 design-html-prototype의 비주얼 타깃"** 안내.
- **Phase 0**(유지): DESIGN.md 있음→시드 / 없음→design.md 요청 / 진도 감지→md-compiler·brand-kit·최소 Q&A.
- **품질/금지**: art-direction anti-slop, 자율 일괄 금지, 값 창작 금지, candidate 확정참조 금지, **긴 페이지를 이미지로 완전 재현하려 하지 않음**(상단 핵심 캡, 풀길이는 HTML).

- [ ] **Step 3: 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-image-web/SKILL.md','utf8');const m=t.match(/^---\n([\s\S]*?)\n---/);if(m&&/name:\s*design-image-web/.test(m[1])&&/풀페이지/.test(t)&&/1280x3840|≤3:1|세로/.test(t)&&/--quality low/.test(t)&&/design-html-prototype/.test(t)&&!/<slug>-<platform>-<section>/.test(t)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add skills/design-image-web/SKILL.md
git commit -m "refactor(design-image-web): 풀페이지 목업 단위·발산 low/확정 high·html-prototype 직전 포지셔닝

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: design-image-mobile 개정 (발산·포지셔닝 — 저위험 델타)

**Files:**
- Modify: `skills/design-image-mobile/SKILL.md`
- Modify: `skills/design-image-mobile/references/art-direction-mobile.md`

- [ ] **Step 1: SKILL.md 개정**

화면=한 장이라 단위는 유지. 아래만 반영:
- **frontmatter description**: "한 화면씩 생성"을 "화면 방향을 발산(저품질)→확정(고품질)"으로, 끝에 "HTML 구현(design-html-prototype) 전 룩 탐색용" 추가.
- **포지셔닝**: 목적/위치 절에 "md-compiler 이후 **html-prototype 직전** 탐색 단계, 확정 화면이 html-prototype 비주얼 타깃" 추가.
- **흐름**: 기존 "한 장씩 생성"을 **발산 라운드**로 — 화면마다 방향 3~4개 `--quality low` 발산 → 시트 → #N 선택 → 수렴/확정 → 확정 직전 high 1장 → lock `assets/page/<slug>-mobile-<screen>.png`. 게이트1(화면 플로우 사용자 협업 확정)·세이프에어리어·디바이스 프레임·Phase 0는 유지.
- **비용 규율**: 발산 low / 확정 high 한 줄.
- 출력 네이밍 확인: 확정 `<slug>-mobile-<screen>.png`, 발산 `<slug>-mobile-<screen>-r<N>-<NN>.png`.

- [ ] **Step 2: art-direction-mobile.md 소폭 보강**

대부분 유지. 포맷/품질 절에 한 줄: "발산은 `--quality low`, 확정만 `--quality high`. 화면=한 장(세로 폰 목업)." (이미 세로 목업·1화면=1이미지이므로 구조 변경 없음.)

- [ ] **Step 3: 검증**

Run: `node -e "const a=require('fs').readFileSync('skills/design-image-mobile/SKILL.md','utf8');const b=require('fs').readFileSync('skills/design-image-mobile/references/art-direction-mobile.md','utf8');if(/design-html-prototype/.test(a)&&/--quality low/.test(a)&&/발산|방향/.test(a)&&/--quality low/.test(b)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add skills/design-image-mobile/SKILL.md skills/design-image-mobile/references/art-direction-mobile.md
git commit -m "refactor(design-image-mobile): 발산 low/확정 high·html-prototype 직전 포지셔닝

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: 교차참조 갱신 (md-compiler carve-out·designer·README)

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`
- Modify: `agents/designer.md`
- Modify: `README.md`
- Modify: `docs/design/README.md`

- [ ] **Step 1: design-md-compiler/SKILL.md**

- v1에서 추가된 흐름 안내 문장(페이지 이미지 경로를 `assets/page/<slug>-<platform>-<section>.png`로 언급)을 **`assets/page/<slug>-<platform>.png`(풀페이지 목업, 선택 `-<zone>`)**로 정정. "섹션" 표현 → "풀페이지 목업".
- **anti-slop carve-out 추가**: md-compiler가 생성하는 DESIGN.md의 §11 Anti-slop 체크리스트 항목 "UI 텍스트가 이미지에 박혀 있지 않은가"에 단서를 단다 — **"단, `assets/page/`의 풀페이지 목업은 *탐색 레퍼런스*라 텍스트가 박혀도 위반 아님(최종 텍스트는 HTML/코드)"**. §8 이미지 에셋 규칙 설명에도 동일 취지 1줄.

- [ ] **Step 2: agents/designer.md**

다운스트림 web/mobile 두 줄을 "**풀페이지 목업**(세로 1:3, HTML 구현 전 룩 탐색) — `design-html-prototype` 직전 단계"로 문구 갱신. "섹션별 이미지" 표현 제거.

- [ ] **Step 3: README.md**

다운스트림 설명의 design-image-web/mobile을 "풀페이지 목업(html-prototype 직전 탐색)"으로. "섹션별" 표현 제거. 파이프라인 순서에 `… → (선택) design-image-web/mobile → design-html-prototype` 관계가 드러나게.

- [ ] **Step 4: docs/design/README.md**

표 행을 갱신: `design-image-web` = "웹 풀페이지 목업(세로 1:3) — HTML 전 룩 탐색" / `design-image-mobile` = "앱 화면 목업 — HTML 전 룩 탐색". 산출물 칸 "섹션별 이미지" → "풀페이지/화면 목업". 다운스트림 목록·다이어그램에서 html-prototype 직전임을 명시.

- [ ] **Step 5: 옛 표현 잔재 확인**

Run: `node --eval "const cp=require('child_process');const out=cp.execSync('git grep -n -E \"섹션별 (가로 )?(디자인 )?이미지|<slug>-<platform>-<section>\" -- skills agents README.md docs/design || true',{encoding:'utf8'});console.log(out.trim()===''?'no stale':('STALE: '+out))"`
Expected: `no stale`

- [ ] **Step 6: Commit**

```bash
git add skills/design-md-compiler/SKILL.md agents/designer.md README.md docs/design/README.md
git commit -m "docs(design): 풀페이지 목업 전환 교차참조 갱신 + md-compiler anti-slop carve-out

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 동기화·검증·번들 재생성

**Files:** (생성물) `.env.example`·`plugins/personal/`·`codex-agents/`

- [ ] **Step 1: sync**

Run: `npm run sync`
Expected: 에러 없이 완료(skills 변경 → `plugins/personal/` 재생성).

- [ ] **Step 2: validate**

Run: `npm run validate`
Expected: `sync-mcp: all generated files are up to date.`

- [ ] **Step 3: 테스트 무회귀**

Run: `npm test`
Expected: 전부 pass (예: `# pass 189` / `# fail 0`).

- [ ] **Step 4: 최종 잔재 확인**

Run: `node --eval "const cp=require('child_process');const out=cp.execSync('git grep -l design-page-image -- skills agents scripts README.md docs/design || true',{encoding:'utf8'});console.log(out.trim()===''?'clean':('STILL: '+out))"`
Expected: `clean` (v1에서 이미 제거 — 무회귀 확인)

- [ ] **Step 5: 생성물 커밋(변경분 있으면)**

```bash
git add .env.example .claude-plugin/mcp.sync-state.json
git commit -m "chore(sync): 생성물 재생성 (풀페이지 목업 전환)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(변경 없으면 생략. `plugins/personal/`·`codex-agents/`는 gitignore — 스테이징 안 함.)

- [ ] **Step 6: Codex 재설치 안내 (플러그인 영향 파일 변경됨)**

`skills/`·`agents/` 변경 → 사용자에게 안내(자동 실행 금지):
> "`npm run codex:reinstall` 실행 후, 이 Claude 세션에서 `/reload-plugins` 실행하세요. 열려 있는 Codex 세션은 재시작."

---

## Self-Review (작성자 점검)

**1. 스펙 커버리지(v2):**
- 산출 단위 풀페이지(스펙 §3) → Task 1·2. ✓
- 게이트1 섹션 선택(§6 web) → Task 2 흐름. ✓
- 발산 low/확정 high 비용(§3·§7) → Task 1 §8·Task 2·Task 3. ✓
- 포맷 세로 ≤3:1(§6) → Task 1·2. ✓
- 네이밍 `<slug>-<platform>[-<zone>]` / 모바일 `-<screen>`(§5) → Task 2·3·4. ✓
- 포지셔닝 html-prototype 직전(§1·§7) → Task 2·3·4. ✓
- art-direction-web 골격 재작성(§2.2·§8) → Task 1. ✓
- md-compiler carve-out(§8) → Task 4 Step 1. ✓
- description 정정·"한 맥락 한계"(§6·§8) → Task 2 Step 1·Task 1 §8(긴 페이지 캡). ✓
- 모바일 저위험 델타(§6·§8) → Task 3. ✓

**2. Placeholder 스캔:** TBD/TODO 없음. 각 개정 태스크는 절별 내용·검증 명령·기대출력 명시. ✓

**3. 타입/이름 일관성:** 네이밍 `<slug>-web[-<zone>].png`·`<slug>-mobile-<screen>.png`·발산 `-r<N>-<NN>`가 Task 1·2·3·4에서 동일. 포맷 `1280x3840`/≤3:1·`--quality low/high`·`design-html-prototype` 표기 일관. ✓
