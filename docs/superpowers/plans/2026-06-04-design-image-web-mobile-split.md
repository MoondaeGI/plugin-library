# design-image-web + design-image-mobile 분할 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **추가 REQUIRED SUB-SKILL:** SKILL.md·references 저작 태스크(Task 1~4)는 반드시 `superpowers:writing-skills`를 먼저 호출해 그 지침을 따른다(CLAUDE.md 규칙).

**Goal:** placeholder `design-page-image` 스킬을 제거하고, DESIGN.md를 시드로 바인딩하는 두 self-contained 스킬 `design-image-web`·`design-image-mobile`로 분할 구현한다.

**Architecture:** 두 스킬 모두 designer 소유의 *선택 다운스트림* 단계로, DESIGN.md frontmatter 토큰(실 HEX·실폰트)과 확정 자산(`assets/logo`·`assets/icon`·`assets/brand-kit`)에 바인딩해 공유 `image-gen`(gpt-image-2)으로 한 섹션/화면씩 생성한다. design-logo/iconset식 게이트 리뷰 루프(candidate→view 라이브 시트→외과 편집→`assets/page/` lock)를 따른다. 무거운 아트디렉션 안목은 각 스킬 자기 `references/art-direction-*.md`로 분리하고 SKILL.md는 프로세스 골격만 담는다.

**Tech Stack:** Markdown SKILL.md(frontmatter `name`/`description`), 공유 `image-gen` 스크립트(`scripts/image-gen.mjs`), 공유 라이브 서버(`scripts/lib/serve-design.mjs`), Node 동기화(`npm run sync`), 테스트(`node --test`).

**근거 스펙:** `docs/superpowers/specs/2026-06-04-design-image-web-mobile-split-design.md`

---

## 사전 메모 (모든 태스크 공통)

- **이 작업은 산문(스킬) 저작 + 교차참조 편집**이다. 새 `.mjs` 로직은 없다 — `image-gen`·`serve-design`·`autocrop`·auto-version은 이미 존재하므로 재사용만 한다. 따라서 "테스트"는 red-green TDD가 아니라 **검증 단계**(`npm test` 무회귀, `npm run validate` 통과, 죽은 참조 grep 0건, `npm run sync` clean)다.
- **참조 패턴 근거 파일(읽어두면 좋음):** `skills/design-logo/SKILL.md`(Phase 0·게이트·라이브 서버·lock 패턴의 본보기), `skills/design-iconset/SKILL.md`(목록 게이트·HTML 그리드 검수), `skills/design-md-compiler/SKILL.md`(DESIGN.md 구조·입력 경로), `skills/image-gen/SKILL.md`(생성기 CLI).
- **외부 참조 문서(있으면 참고, 없어도 됨):** `C:\Users\CIOT\Downloads\SKILL (2).md`(웹 아트디렉션 원본), `SKILL (3).md`(모바일 아트디렉션 원본). 이 계획의 Task 2·4가 채택할 내용을 이미 정제·열거하므로 원본이 없어도 저작 가능하다. 우리 목소리로 다시 쓰되 값은 DESIGN.md에 바인딩한다(원본의 "팔레트를 골라라"식 창작은 버린다).
- **출력 레이아웃(스펙 §5):** `view/page-<platform>-<slug>.html`(타깃별 라이브 시트), `candidate/page/page-briefs.md`(공통 산문 출처 로그), `candidate/page/<slug>-<platform>-<section>[-vN].png`(평면), `assets/page/<slug>-<platform>-<section>.png`(확정 평면).

---

## 파일 구조

**생성:**
- `skills/design-image-web/SKILL.md` — 웹 스킬 프로세스 골격
- `skills/design-image-web/references/art-direction-web.md` — 웹 아트디렉션 안목(doc2 정제)
- `skills/design-image-mobile/SKILL.md` — 모바일 스킬 프로세스 골격
- `skills/design-image-mobile/references/art-direction-mobile.md` — 모바일 아트디렉션 안목(doc3 정제)

**삭제:**
- `skills/design-page-image/` (폴더 전체 — `SKILL.md` 한 파일)

**수정(교차참조):**
- `agents/designer.md` — 다운스트림 절
- `skills/design-md-compiler/SKILL.md` — §8 이미지 에셋·흐름 안내
- `skills/image-gen/SKILL.md` — frontmatter description 호출자 예시
- `skills/design-brand-kit/SKILL.md` — description(line 3)·흐름 안내(line 353)
- `skills/design-ui-kit/SKILL.md` — line 14·77·80·120
- `scripts/sync-mcp.mjs` — line 18 주석(`.env.example` 생성 소스)
- `README.md` — line 60·72
- `docs/design/README.md` — line 19·32·36

**검증만(변경 없음 확인):**
- `skills/design-html-prototype/SKILL.md` — page-image 참조 0건(grep 확인)
- `tests/sync-codex-plugin.test.mjs` — `design-page-image`는 자가완결 합성 픽스처(line 106~116)라 실제 스킬과 무관 → 삭제해도 통과. 변경 불필요.

**생성물(직접 수정 금지, sync로 재생성):**
- `.env.example`(← `scripts/sync-mcp.mjs`), `plugins/personal/`·`codex-agents/`(gitignore)

---

## Task 1: design-image-web SKILL.md (프로세스 골격)

**Files:**
- Create: `skills/design-image-web/SKILL.md`

- [ ] **Step 1: writing-skills 호출**

`superpowers:writing-skills`를 Skill 도구로 호출하고 그 지침(frontmatter 규칙·구조·검증)을 따른다.

- [ ] **Step 2: SKILL.md 작성**

`skills/design-logo/SKILL.md`의 절 구조를 본보기로, 아래 frontmatter와 절 구조로 작성한다. frontmatter는 **그대로** 사용:

```markdown
---
name: design-image-web
description: 확정된 DESIGN.md를 시드로 웹 페이지(랜딩·대시보드·마케팅)의 섹션별 디자인 이미지를 가로 포맷으로 만드는 designer 소유의 선택 다운스트림 단계. DESIGN.md frontmatter 토큰(실 HEX·실폰트)과 확정 자산(logo·icon·ui-base)에 바인딩해 image-gen(gpt-image-2)으로 한 섹션씩 생성하고, 타깃 slug별 게이트 리뷰 시트로 검수·외과 편집해 assets/page/로 lock한다. DESIGN.md가 없으면 design.md 요청 또는 진도 감지 후 design-md-compiler/brand-kit로 유도. OPENAI_API_KEY 필요. 아트디렉션은 references/art-direction-web.md.
---
```

본문 절(각 절의 필수 내용):

1. **목적/위치** — designer 핵심 파이프라인(`…md-compiler`) *이후*의 선택 다운스트림. DESIGN.md 확정 후 "웹 페이지 이미지 만들까요?"로 제안·실행. 한국어 소통, 이미지 내 텍스트도 한국어.
2. **전제** — `DESIGN.md`(cwd 루트)가 시드. 이미지는 공유 `image-gen`(`OPENAI_API_KEY` 필요 — **키 사전 점검 금지, 바로 호출**, 부재 시 스크립트가 안내하며 실패). 라이브 시트는 LLM이 저작(생성기 아님).
3. **입력 파일(cwd 기준, 있는 것만)** — `DESIGN.md`(frontmatter 토큰: colors HEX·typography 실폰트 / §1 제품명 / §3 시각 방향 / §6 페이지 섹션 규칙 / §8 이미지 에셋 / §11 anti-slop), `.design/assets/logo/logo.png`·`.design/assets/icon/*.svg`·`.design/assets/brand-kit/{ui-base,key-visual}.png`(확정 자산 — `--image` 앵커), `.design/assets/tokens.css`(시트 `var()` 렌더용). candidate 시안·`brand-kit/icon/*`(컨셉)은 **읽지 않는다**.
4. **출력 파일(레이아웃)** — 스펙 §5 그대로:
   ```
   .design/
     view/page-web-<slug>.html
     candidate/page/page-briefs.md
     candidate/page/<slug>-web-<section>[-vN].png
     assets/page/<slug>-web-<section>.png
   ```
   파일명은 식별자일 뿐, 의미(섹션·순서·캡션)는 `page-briefs.md` 산문에 적는다(md-compiler가 읽음).
5. **이미지 생성(공유 image-gen)** — 스크립트 경로 `../image-gen/scripts/image-gen.mjs`. 모델 `gpt-image-2` **불투명**(투명/autocrop 안 씀 — 사진/목업). 포맷 **가로**(`--size`는 16의 배수 16:9/21:9, 예 `1536x864`). 확정 자산을 `--image`로 첨부해 브랜드 바인딩. 재생성은 `--auto-version`. 서로 다른 섹션은 개별 호출(병렬 백그라운드 가능). 프롬프트는 임시 파일 `--prompt-file`. 프롬프트의 색·폰트·카피는 **DESIGN.md에서** 가져오고 지어내지 않는다.
6. **아트디렉션 인용** — 프롬프트 구성·구도·anti-slop 판단은 `references/art-direction-web.md`를 가드레일로 따른다(SKILL.md에 규칙을 중복 기술하지 않는다).
7. **라이브 프리뷰** — 시트 최초 제시 시 `node ../../scripts/lib/serve-design.mjs <cwd>/.design`를 **사용자 확인 후 1회 백그라운드** 기동. 직접 URL `http://localhost:5500/view/page-web-<slug>.html`. lock/세션 종료 시 서버 종료.
8. **흐름(게이트 루프)** — Phase 0(Task 공통, 아래 §Phase0) → **게이트1**(타깃 slug + 섹션 목록을 DESIGN.md §6에 바인딩해 제시·확정; 확정 전 이미지 0장) → **게이트2**(art-direction-web 기반 조합형 방향 제시·합의) → **한 장씩 생성**(섹션 1개 → 시트 렌더 → 라이브) → **수정 루프**("#N 다시/다르게"=재생성 `--auto-version`, 직전 후보 `--image` 첨부해 한 번에 한 가지만; "좋다→다음") → **lock**(확정본 `assets/page/<slug>-web-<section>.png` 복사, `page-briefs.md`에 산문 기록) → 서버 종료 + 다음 단계 안내.
9. **Phase 0(DESIGN.md 부재 폴백, 스펙 §4)** — ① `DESIGN.md` 있음→시드 사용 ② 없음→"기존 design.md/디자인 문서 주세요" ③ 그마저 없음→`.design/` 진도 감지: `tokens.css`/`ui-kit.css`/`BRAND_KIT.md`만 있고 DESIGN.md 없음→"`design-md-compiler` 먼저 돌리세요" / `BRAND_KIT.md`까지만→다음 단계 추천 / 진도 없음→`design-brand-kit` 권유 또는 최소 Q&A(추측 금지, `candidate/page/page-briefs.md`에 기록). 최소 Q&A 경로는 토큰 바인딩 약함을 명시.
10. **품질 기준/금지** — art-direction-web의 anti-slop 준수, 자율 일괄 생성 금지(한 장씩), 브랜드/카피/팔레트 창작 금지(DESIGN.md 바인딩), candidate를 확정처럼 참조 금지.

- [ ] **Step 3: frontmatter 검증**

Run: `node -e "const fs=require('fs');const t=fs.readFileSync('skills/design-image-web/SKILL.md','utf8');const m=t.match(/^---\n([\s\S]*?)\n---/);if(!m||!/name:\s*design-image-web/.test(m[1])||!/description:/.test(m[1]))process.exit(1);console.log('frontmatter OK')"`
Expected: `frontmatter OK`

- [ ] **Step 4: Commit**

```bash
git add skills/design-image-web/SKILL.md
git commit -m "feat(design-image-web): 웹 페이지 이미지 스킬 골격 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: design-image-web references/art-direction-web.md (doc2 정제)

**Files:**
- Create: `skills/design-image-web/references/art-direction-web.md`

- [ ] **Step 1: 아트디렉션 문서 작성**

`skills/references/design/logo-art-direction.md`와 같은 *가드레일 산문* 성격으로 작성한다. **값(색·폰트·카피)은 고르지 말고 DESIGN.md 토큰에서 가져오라고 명시**한다. 아래 절을 모두 포함:

1. **핵심 디렉티브** — generic AI 아트가 아니라 awwwards급 프리미엄 웹 디자인 *레퍼런스 이미지*. 개발자/코딩 모델이 보고 구현 가능해야 함(레이아웃·계층·간격·타이포 스케일·CTA 우선순위가 읽혀야 함).
2. **브리프→방향 매핑** — minimalist/editorial/cinematic/SaaS/agency/ecommerce 별 히어로 스케일·배경 모드·구도 바이어스. 단 사용자의 DESIGN.md §3 시각 방향이 항상 우선.
3. **조합형 변주 엔진** — 각 카테고리에서 1개씩 골라 *일관* 적용: Theme Paradigm / Background Character / Hero Architecture / Section System / Signature Component ×4 / Motion-implied ×2 / (섹션별)Composition Anchor / (섹션별)Background Mode / CTA Variation / (페이지)Hero Scale(giant/mid/mini) / Narrative Spine / Second-read moment ×1. **단 Typography·Palette는 DESIGN.md 토큰의 폰트·색을 따른다**(임의 폰트명·팔레트 선택 금지).
4. **히어로 규칙** — text-left/image-right 기본값 차단(대안 구도 목록 제시), H1 2~3줄(6줄 금지), 그래픽 절제(의미없는 큰 숫자·blob·orb 금지), 강한 대비·여백.
5. **anti-AI-slop 카탈로그** — layout slop(반복 중앙정렬·동일 카드행·클론 좌우블록), visual slop(purple/blue AI 그라데이션·glow·floating blob·무의미 glassmorphism), typography slop(거대헤딩+약소 서브·그라데이션 헤드라인 단축·all-caps 남발), content slop(unleash/elevate/revolutionize 등 클리셰·Acme/Nexus 등 가짜 브랜드 — **카피·브랜드는 DESIGN.md §1에서**), density slop(과밀·카드 과부하).
6. **섹션 리듬·여백 규율** — 섹션 간 일정한 넓은 여백, 밀도/이미지비율/정렬/스케일 변주로 단조로움 회피, 작은 섹션도 충분한 주변 여백.
7. **팔레트·머티리얼·그라데이션 규율** — DESIGN.md 토큰 팔레트 *일관*(섹션마다 테마 교체 금지). 그라데이션 허용(저채도 팔레트-매치 톤·히어로 뒤 단일색 분위기)·금지(레인보우 메시·purple→blue·neon glow·그라데이션 텍스트).
8. **포맷·이미지 카운트** — **가로 16:9/21:9, 1섹션=1이미지**(여러 섹션을 한 프레임에 합치지 않음). 멀티섹션 일관성(같은 브랜드 월드·타입 스케일·CTA 패밀리·이미지 트리트먼트).
9. **품질 체크리스트** — 계층 명확? 히어로 청결(2~3줄)? AI tell 없음? 코드 가능? 이미지들이 한 사이트로 읽힘? 구도 다양(앵커·배경모드 섞임)? 팔레트 일관? 히어로가 반사적 좌우분할 아님?

- [ ] **Step 2: 자기참조·창작 금지 문구 확인**

Run: `node -e "const t=require('fs').readFileSync('skills/design-image-web/references/art-direction-web.md','utf8');if(/DESIGN\.md/.test(t)&&/가로|16:9|21:9/.test(t)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK` (DESIGN.md 바인딩 언급 + 가로 포맷 명시 확인)

- [ ] **Step 3: Commit**

```bash
git add skills/design-image-web/references/art-direction-web.md
git commit -m "feat(design-image-web): 웹 아트디렉션 레퍼런스(doc2 정제) 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: design-image-mobile SKILL.md (프로세스 골격)

**Files:**
- Create: `skills/design-image-mobile/SKILL.md`

- [ ] **Step 1: writing-skills 호출** (Task 1 Step 1과 동일 — 이미 호출됐으면 생략)

- [ ] **Step 2: SKILL.md 작성**

Task 1과 동일한 절 구조를 쓰되 **모바일 차이**(스펙 §6)를 반영한다. frontmatter는 **그대로** 사용:

```markdown
---
name: design-image-mobile
description: 확정된 DESIGN.md를 시드로 모바일 앱(iOS·Android·크로스플랫폼)의 화면·플로우 디자인 이미지를 세로 폰 목업 포맷으로 만드는 designer 소유의 선택 다운스트림 단계. DESIGN.md엔 앱 화면 정의가 없어 화면 플로우는 사용자와 협업 확정(게이트1)하되 색·폰트·자산 값은 DESIGN.md 토큰에 바인딩한다. image-gen(gpt-image-2)으로 한 화면씩 생성, 게이트 리뷰 시트로 검수·외과 편집해 assets/page/로 lock. DESIGN.md가 없으면 design.md 요청 또는 진도 감지 후 design-md-compiler/brand-kit로 유도. OPENAI_API_KEY 필요. 아트디렉션은 references/art-direction-mobile.md.
---
```

Task 1의 1~10 절을 그대로 쓰되 아래만 다르게:

- **절 4 출력 레이아웃**: 파일명 `<slug>-mobile-<screen>[-vN].png`, 시트 `view/page-mobile-<slug>.html`.
- **절 5 이미지 생성**: 포맷 **세로 폰 목업**(`--size 1024x1536`), **디바이스 프레임 기본 on**. 모델 `gpt-image-2` 불투명. 나머지(`--image` 앵커·`--auto-version`·`--prompt-file`) 동일.
- **절 6 아트디렉션 인용**: `references/art-direction-mobile.md`.
- **절 7 라이브 URL**: `http://localhost:5500/view/page-mobile-<slug>.html`.
- **절 8 흐름 — 게이트1 차이(핵심)**: DESIGN.md §6은 *웹 섹션*이라 앱 화면 정의가 없다. 따라서 게이트1은 **화면 플로우를 사용자와 협업 창작·확정**한다(예: 온보딩→인증→홈→상세). 이는 §3 "지어내지 않는다" 대원칙의 **명시적 예외** — 단 LLM 단독 창작 금지, 사용자 확정 필수(강제 게이트). 색·폰트·자산 *값*은 여전히 DESIGN.md 바인딩. art-direction-mobile의 플로우 논리(왜 화면2가 화면1 뒤?)를 따른다.
- **절 10 품질**: 추가로 "웹 같은 레이아웃 금지(폰 안의 웹사이트 아님)", "세이프에어리어·목업 프레임 균등 여백", "텍스트 가독성(작으면 미완성)".

- [ ] **Step 3: frontmatter 검증**

Run: `node -e "const fs=require('fs');const t=fs.readFileSync('skills/design-image-mobile/SKILL.md','utf8');const m=t.match(/^---\n([\s\S]*?)\n---/);if(!m||!/name:\s*design-image-mobile/.test(m[1])||!/description:/.test(m[1]))process.exit(1);console.log('frontmatter OK')"`
Expected: `frontmatter OK`

- [ ] **Step 4: Commit**

```bash
git add skills/design-image-mobile/SKILL.md
git commit -m "feat(design-image-mobile): 모바일 앱 화면 이미지 스킬 골격 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: design-image-mobile references/art-direction-mobile.md (doc3 정제)

**Files:**
- Create: `skills/design-image-mobile/references/art-direction-mobile.md`

- [ ] **Step 1: 아트디렉션 문서 작성**

Task 2와 같은 가드레일 산문 성격. **값은 DESIGN.md 바인딩**. 아래 절을 모두 포함:

1. **핵심 디렉티브** — generic 목업이 아니라 app-native 프리미엄 화면·플로우 이미지. 코드 모드로 전환하지 않음(이미지만).
2. **플랫폼 모드** — iOS-native / Android-native / 크로스플랫폼 중 1개 결정, 각 바이어스(iOS 청결·탭바·세이프에어리어 / Android 컴포넌트 리듬·앱바·바텀내비 / 크로스 보편 패턴). 섞지 않는다.
3. **화면-우선·충분한 화면 수·크롭 금지** — 요청 화면 수만큼 개별 생성, 이전 큰 이미지에서 크롭하지 말고 새 화면 생성(가독성 우선).
4. **앱 디자인 바이블(일관성)** — 멀티 화면 시 플랫폼·디바이스 프레임·팔레트·타입·간격·radius·아이콘·이미지 트리트먼트를 고정.
5. **논리적 플로우** — 화면 순서가 믿을 만한 사용자 여정(왜 화면2가 화면1 뒤에?). 게이트1에서 확정한 플로우를 따른다.
6. **디바이스 목업 프레임 규칙** — 한 시리즈 동일 디바이스·동일 스케일, 캔버스 균등 여백(상하좌우), 폰이 캔버스 끝에 닿지 않음, 소프트 섀도, **콘텐츠가 주인공**(프레임이 압도 금지).
7. **온보딩·첫 화면 청결** — 온보딩은 동일 템플릿 슬라이드 반복 금지, 첫 화면은 한 초점·짧은 헤드라인·명확한 1 CTA.
8. **세이프에어리어·시스템 영역** — 상태바·탑바·바텀내비·홈 인디케이터·제스처 공간 인지. 포스터가 아니라 진짜 앱 화면.
9. **내비게이션** — 탭바/스택/시트/세그먼트 등 친숙 패턴, 과적재 금지.
10. **클린 레이아웃** — box-in-box·중첩 카드 스택·과밀 위젯 금지, 더 적고 명확한 컨테이너.
11. **이미지·텍스처·이미지-뒤-텍스트** — 카테고리에 맞는 이미지 사용, 텍스트 뒤 이미지엔 페이드/마스크/스크림으로 가독성 보호, 과한 그레인 금지.
12. **아이코노그래피** — generic Lucide/개발자툴 아이콘 느낌 회피. **확정 `assets/icon/*.svg`가 있으면 그 패밀리를 우선** 반영(없으면 브랜드 적합 커스텀 느낌). 일관 stroke/fill.
13. **anti-mobile-AI-tells** — purple-blue fintech 그라데이션·랜덤 glass 카드·ambient blob·가짜 차트 대시보드·폰 모양 웹사이트·과한 corner radius·필러 카피(elevate/unlock 등 — 카피는 DESIGN.md)·가짜 브랜드(NovaCore 등)·pill/badge 남발.
14. **스타일 변주 엔진** — Theme/Structure Bias/Image Art Direction/Texture/Signature Component ×4/Decorative Asset ×2/Motion-implied ×2 중 1개씩 골라 일관. **Typography·Palette는 DESIGN.md 토큰 사용**.
15. **텍스트 가독성·타이포·여백** — 텍스트가 작으면 미완성, 제목/본문/라벨 대비, 넉넉한 간격·터치 친화.
16. **카테고리별 바이어스** — fintech(신뢰·차분·차트 절제) / health(차분 구조·메트릭 계층) / productivity(리스트·카드 규율) / social(프로필·피드 리듬·이미지 표현) / commerce(브라우즈·상세·카트 명확·제품 이미지) / wellness(부드러운 머티리얼·여백).
17. **포맷·품질 체크리스트** — **세로 폰 목업 1024x1536, 1화면=1이미지, 디바이스 프레임 기본**. 체크: 폰 안의 웹사이트 아님? 세이프에어리어? 첫 화면 청결? 텍스트 가독? 화면 수 충분? AI tell 없음? 한 앱으로 읽힘? 플로우 논리? 목업 프레임 균등?

- [ ] **Step 2: 바인딩·포맷 확인**

Run: `node -e "const t=require('fs').readFileSync('skills/design-image-mobile/references/art-direction-mobile.md','utf8');if(/DESIGN\.md/.test(t)&&/1024x1536|세로|목업/.test(t)&&/세이프|safe/i.test(t)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add skills/design-image-mobile/references/art-direction-mobile.md
git commit -m "feat(design-image-mobile): 모바일 아트디렉션 레퍼런스(doc3 정제) 추가

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: 기존 design-page-image 폴더 제거

**Files:**
- Delete: `skills/design-page-image/SKILL.md` (및 폴더)

- [ ] **Step 1: 폴더 삭제**

```bash
git rm -r skills/design-page-image
```

- [ ] **Step 2: 삭제 확인**

Run: `node -e "console.log(require('fs').existsSync('skills/design-page-image')?'STILL EXISTS':'removed')"`
Expected: `removed`

- [ ] **Step 3: Commit**

```bash
git commit -m "refactor(design): placeholder design-page-image 제거 (web/mobile로 분할)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: 스킬·스크립트 교차참조 갱신

**Files:**
- Modify: `skills/image-gen/SKILL.md:3`
- Modify: `skills/design-md-compiler/SKILL.md` (§8 line 93 부근·흐름 line 139 부근)
- Modify: `skills/design-brand-kit/SKILL.md:3,353`
- Modify: `skills/design-ui-kit/SKILL.md:14,77,80,120`
- Modify: `scripts/sync-mcp.mjs:18`

- [ ] **Step 1: image-gen description 갱신**

`skills/image-gen/SKILL.md` frontmatter description의 `design-brand-kit·design-page-image 등` → `design-brand-kit·design-image-web·design-image-mobile 등`로 교체.

- [ ] **Step 2: design-md-compiler 갱신**

`skills/design-md-compiler/SKILL.md`에서:
- §8 이미지 에셋 규칙: page 이미지 참조를 web/mobile 둘로. 파일명 규칙 `<slug>-<platform>-<section>.png`을 명시하되 **"md-compiler가 파일명을 파싱하지 않고 `candidate/page/page-briefs.md` 산문에서 의미를 읽는다"**를 적는다. `assets/page/*.{png,jpg,jpeg,webp}` 평면 glob 유지(변경 없음).
- 흐름 안내(맨 끝): "페이지 디자인이 필요하면 `design-page-image`(미구현)" → "웹은 `design-image-web`, 앱은 `design-image-mobile`"로 교체.

- [ ] **Step 3: design-brand-kit 갱신**

`skills/design-brand-kit/SKILL.md`:
- line 3 description 끝: `다운스트림(design-logo·iconset·page-image)은` → `다운스트림(design-logo·iconset·image-web/mobile)은`.
- line 353: `페이지 이미지는 핵심 이후 선택 단계 \`design-page-image\` — 현재 미구현·재작성 예정` → `페이지 이미지는 핵심 이후 선택 단계 \`design-image-web\`·\`design-image-mobile\``.

- [ ] **Step 4: design-ui-kit 갱신**

`skills/design-ui-kit/SKILL.md`의 4곳(line 14·77·80·120) `design-page-image` → 문맥상 웹 마케팅/페이지 이미지를 가리키므로 `design-image-web`으로 교체(앱 언급이 아니므로 web만).

- [ ] **Step 5: sync-mcp.mjs 주석 갱신 (.env.example 생성 소스)**

`scripts/sync-mcp.mjs:18` 주석 `(design-brand-kit·design-page-image 공유)` → `(design-brand-kit·design-image-web·design-image-mobile 공유)`. **`.env.example`은 직접 고치지 않는다**(Task 8 sync가 재생성).

- [ ] **Step 6: 라이브 스킬/스크립트 죽은 참조 0건 확인**

Run: `node --eval "const cp=require('child_process');const out=cp.execSync('git grep -l design-page-image -- skills scripts || true',{encoding:'utf8'});console.log(out.trim()===''?'no live refs':('STILL: '+out))"`
Expected: `no live refs`

- [ ] **Step 7: Commit**

```bash
git add skills/image-gen/SKILL.md skills/design-md-compiler/SKILL.md skills/design-brand-kit/SKILL.md skills/design-ui-kit/SKILL.md scripts/sync-mcp.mjs
git commit -m "refactor(design): page-image 참조를 image-web/mobile로 갱신 (스킬·스크립트)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: 에이전트·문서 교차참조 갱신

**Files:**
- Modify: `agents/designer.md` (다운스트림 절 line 22~27 부근)
- Modify: `README.md:60,72`
- Modify: `docs/design/README.md:19,32,36`

- [ ] **Step 1: designer.md 갱신**

`agents/designer.md` 다운스트림 절에서 `design-page-image` 줄을 두 줄로 교체:
```markdown
- **design-image-web** (designer) — `DESIGN.md`를 시드로 웹 페이지의 섹션별 가로 이미지를 만드는 *선택* 단계.
- **design-image-mobile** (designer) — `DESIGN.md`를 시드로 모바일 앱 화면·플로우 세로 이미지를 만드는 *선택* 단계(화면 플로우는 사용자 협업 확정).
```
그리고 "designer가 자기 몫으로 실행하는 건 (재작성 후의) page-image뿐" 문장을 "designer가 자기 몫으로 실행하는 건 design-image-web·design-image-mobile"로 갱신(미구현 표기 제거).

- [ ] **Step 2: README.md 갱신**

`README.md`:
- line 60: `component-export·page-image·html-prototype·generate-code` → `component-export·image-web/mobile·html-prototype·generate-code`.
- line 72: `(선택) \`design-page-image\`(designer·미구현·재작성 예정, \`DESIGN.md\` 시드)` → `(선택) \`design-image-web\`·\`design-image-mobile\`(designer, \`DESIGN.md\` 시드)`.

- [ ] **Step 3: docs/design/README.md 갱신**

`docs/design/README.md`:
- line 19: 다운스트림 목록의 `design-page-image (designer · 미구현 · 재작성 예정 · 선택, DESIGN.md 시드)` → 두 줄 `design-image-web`·`design-image-mobile (designer · 선택, DESIGN.md 시드)`.
- line 32: 표 행 `design-page-image` → `design-image-web`/`design-image-mobile` 두 행(웹=섹션별 가로 이미지 / 모바일=앱 화면 세로 이미지, 둘 다 `DESIGN.md` 시드).
- line 36: `(재작성될 \`design-page-image\`는 \`DESIGN.md\`를 시드로 받는 방향이다.)` → `(\`design-image-web\`·\`design-image-mobile\`은 \`DESIGN.md\`를 시드로 받는다.)`.

- [ ] **Step 4: 라이브 문서 죽은 참조 0건 확인** (docs/superpowers 히스토리는 제외)

Run: `node --eval "const cp=require('child_process');const out=cp.execSync('git grep -l design-page-image -- agents README.md docs/design || true',{encoding:'utf8'});console.log(out.trim()===''?'no live refs':('STILL: '+out))"`
Expected: `no live refs`

- [ ] **Step 5: Commit**

```bash
git add agents/designer.md README.md docs/design/README.md
git commit -m "docs(design): page-image 참조를 image-web/mobile로 갱신 (에이전트·README)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: 동기화·검증·번들 재생성

**Files:**
- (생성물) `.env.example`, `plugins/personal/`, `codex-agents/`

- [ ] **Step 1: sync 실행 (생성물 재생성)**

Run: `npm run sync`
Expected: 에러 없이 완료. `.env.example`의 OPENAI_API_KEY 주석이 image-web/mobile로 갱신됨. `plugins/personal/`에 `design-image-web`·`design-image-mobile`가 생기고 `design-page-image`는 사라짐(gitignore라 커밋엔 안 보임).

- [ ] **Step 2: .env.example 갱신 확인**

Run: `node -e "const t=require('fs').readFileSync('.env.example','utf8');if(/image-web/.test(t)&&!/design-page-image/.test(t)){console.log('OK')}else{process.exit(1)}"`
Expected: `OK`

- [ ] **Step 3: validate (생성물·소스 일치 게이트)**

Run: `npm run validate`
Expected: 통과(생성물이 소스와 일치).

- [ ] **Step 4: 테스트 무회귀**

Run: `npm test`
Expected: 모든 테스트 통과(`sync-codex-plugin.test.mjs`의 `design-page-image` 합성 픽스처는 자가완결이라 영향 없음).

- [ ] **Step 5: 전체 죽은 참조 최종 확인 (히스토리 문서 제외)**

Run: `node --eval "const cp=require('child_process');const out=cp.execSync('git grep -l design-page-image -- skills agents scripts README.md docs/design .env.example || true',{encoding:'utf8'});console.log(out.trim()===''?'clean':('STILL: '+out))"`
Expected: `clean`

- [ ] **Step 6: 생성물 스테이징·커밋**

```bash
git add .env.example
git commit -m "chore(sync): .env.example 재생성 (image-web/mobile 반영)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```
(`plugins/personal/`·`codex-agents/`는 gitignore라 스테이징하지 않는다.)

- [ ] **Step 7: Codex 재설치 안내 (플러그인 영향 파일 변경됨)**

`skills/`·`agents/`가 바뀌었으므로 사용자에게 안내한다:
> "`npm run codex:reinstall`을 실행하세요. 그리고 이 Claude 세션에서 `/reload-plugins`를 실행하세요. 열려 있던 Codex 세션은 재시작하세요."
(명령 실행은 사용자 확인 후 — 자동 실행하지 않는다.)

---

## Self-Review (작성자 점검 결과)

**1. 스펙 커버리지:**
- §2 참조 평가 → Task 2·4(doc2/3 정제), Task 1·3(doc4 제외 — 코드 생성 안 함). ✓
- §3 공통 설계(DESIGN.md 바인딩·자산 앵커·한 장씩·image-gen·한국어·self-contained references) → Task 1·3 절 2·5·6·8. ✓
- §4 Phase 0 폴백 → Task 1 절 9, Task 3 동일. ✓
- §5 레이아웃(평면 slug 네이밍·page-briefs 산문) → Task 1 절 4, lock 절 8. ✓
- §6 웹/모바일 차이 → Task 1(웹) vs Task 3(모바일 게이트1 협업 창작·세로 목업). ✓
- §7 리뷰 루프 → Task 1·3 절 8. ✓
- §8 교차참조 → Task 6·7·8. **스펙 §8이 누락한 design-ui-kit·design-brand-kit·sync-mcp.mjs를 Task 6에 추가**(plan이 더 완전). ✓
- §9 비범위 → 계획에 코드 생성·MCP 백엔드·공유 references 없음. ✓
- §10 열린 항목(플로우 팩·slug 도출·manifest) → art-direction-mobile/스킬에 기본 동작만, manifest 미도입(파킹). ✓

**2. Placeholder 스캔:** TBD/TODO 없음. 각 저작 태스크는 절별 필수 내용을 열거(빈 "적절히 처리" 없음). 검증 단계는 실제 명령+기대출력. ✓

**3. 타입/이름 일관성:** 파일명 규칙 `<slug>-<platform>-<section>.png`·시트 `page-<platform>-<slug>.html`·`page-briefs.md`가 Task 1·3·5·6 전반에서 동일. frontmatter `name`이 description·교차참조와 일치(`design-image-web`/`design-image-mobile`). ✓
