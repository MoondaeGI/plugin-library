# 공유 로고/아이콘 아트 디렉션 reference 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-brand-kit`(및 미래 design-logo/icon)이 공유하는 로고/아이콘 생성용 아트 디렉션 reference 두 개를 `skills/references/design/`에 만들고, `brand-kit-image.md`·`SKILL.md`를 하이브리드로 연결해 로고/아이콘 출력 품질을 높인다.

**Architecture:** 두 markdown reference(`logo-art-direction.md`, `icon-art-direction.md`)는 `SKILL.md`가 없어 스킬로 등록되지 않고 `sync-codex-plugin.mjs`가 Codex 번들로 복사하는 공유 파일이다. 접근법 A(생성용 프롬프트-스펙) — 이미지 모델이 바로 렌더할 수 있는 구체 지시 + 떠넣을 수 있는 프롬프트 청크. `brand-kit-image.md`는 보드용 요약만 남기고 깊이는 ref로 링크한다.

**Tech Stack:** Markdown 문서, Node(`scripts/sync-codex-plugin.mjs`), `skills/image-gen/scripts/image-gen.mjs`(OpenAI Images API, `.env` 직접 로드).

**전제(읽는 이를 위한 컨텍스트):**
- repo 루트: `D:/기타 프로그램/plugin-library`. 스킬은 `skills/<name>/SKILL.md`로 발견된다. `SKILL.md` 없는 폴더는 스킬이 아니다.
- 관련 spec: `docs/superpowers/specs/2026-05-28/design-logo-icon-reference-design.md`.
- 상대경로: `SKILL.md`(`skills/design-brand-kit/`)→`../references/design/...`, `brand-kit-image.md`(`skills/design-brand-kit/references/`)→`../../references/design/...`.
- **CLAUDE.md 규칙**: 명령어 실행(`npm test`, `npm run sync`, image-gen 호출)·git 작업은 **실행 직전 사용자 확인**. 아래에서 `[확인 필요]`로 표시.
- **선행 주의**: 시작 시점에 `skills/design-brand-kit/SKILL.md`와 `references/brand-kit-image.md`에 **사용자의 기존 uncommitted 변경**이 있다. 본 플랜의 편집은 그 위에 얹힌다 → 커밋(Task 10)에서 처리 방침을 사용자와 정한다.

---

### Task 1: 테스트 baseline + 무영향 확인

**Files:** (읽기만) `tests/sync-codex-plugin.test.mjs`

- [ ] **Step 1: 새 폴더가 테스트에 영향 없음을 문서화**

확인 완료: `tests/sync-codex-plugin.test.mjs`는 실제 `skills/`가 아니라 임시 디렉터리(`tmp()`, `makeSkill()`)로 돈다. `skills/references/design/` 추가는 어떤 테스트도 깨지 않는다. 별도 코드 변경 불필요.

- [ ] **Step 2: green baseline 확보** `[확인 필요]`

Run: `npm test`
Expected: 모든 테스트 PASS (변경 전 상태가 green인지 확인).

---

### Task 2: baseline("before") 로고 이미지 생성 `[확인 필요 — .gitignore 편집 + API 호출]`

**목적:** reference 강화 *전* 현재 품질을 한 장 캡처해 after와 비교한다. **반드시 brand-kit-image.md 편집(Task 5) 전에 수행.**

**테스트 브랜드(고정):** Forge — 개발자용 CLI 빌드 도구. 타깃: 백엔드 엔지니어. 성격: 정밀·빠름·빌더 네이티브. 메타포: scaffold/frame(구축). 로고 아이디어: 모노그램 F + 스캐폴드/프레임 코너(네거티브 스페이스). 비주얼 모드: 다크 디벨로퍼/빌더. 팔레트: near-black(#0B0E14) + cyan 액센트(#22D3EE).

**Files:**
- Modify: `.gitignore` (스크래치 폴더 추가)
- Create: `.scratch/logo-validation/before-prompt.txt`
- Create(생성물): `.scratch/logo-validation/baseline.png`

- [ ] **Step 1: `.scratch/`를 .gitignore에 추가** `[확인 필요]`

`.gitignore` 끝에 추가:
```
# 검증용 스크래치 (로고 before/after 등) — 커밋하지 않음
/.scratch/
```
그다음 폴더 생성: `mkdir -p .scratch/logo-validation` (PowerShell: `New-Item -ItemType Directory -Force .scratch/logo-validation`).

- [ ] **Step 2: before 프롬프트 작성 (현재 가이드 수준)**

`.scratch/logo-validation/before-prompt.txt`에 — *현재 `brand-kit-image.md` §12 standalone 로고 지시(197행) 수준만* 반영(고의로 얇게):
```text
A clean standalone logo for "Forge", a developer CLI build tool. Single mark/wordmark, large on a clean dark background, monochrome (black/white) version considered, minimal text. Strategy: precise, fast, builder-native; metaphor: scaffold/frame.
```

- [ ] **Step 3: dry-run으로 인자 검증 (무료)**

Run:
```bash
node "skills/image-gen/scripts/image-gen.mjs" \
  --prompt-file .scratch/logo-validation/before-prompt.txt \
  --out .scratch/logo-validation/baseline.png \
  --size 1024x1024 --quality low --model gpt-image-2 --dry-run
```
Expected: 프롬프트/인자 출력, API 호출 없음, exit 0.

- [ ] **Step 4: 실제 생성** `[확인 필요 — 비용 발생]`

Step 3에서 `--dry-run`만 제거해 실행. Expected: `.scratch/logo-validation/baseline.png` 생성.

- [ ] **Step 5: baseline 확인**

`baseline.png`를 Read로 열어 "현재 품질"로 인지. 별도 커밋 없음(gitignore됨).

---

### Task 3: `skills/references/design/logo-art-direction.md` 작성

**Files:**
- Create: `skills/references/design/logo-art-direction.md`

> frontmatter 없음(브랜드 ref인 `brand-kit-image.md`처럼 plain md — 스킬 아님). 접근법 A: 모든 항목은 *이미지 모델이 렌더 가능한 구체 지시*로 쓴다. 추상 이론 금지.

- [ ] **Step 1: 파일 작성 — 아래 정확한 헤딩과 각 섹션 필수 내용**

헤딩(정확히 이 순서·이름):
```md
# 로고 아트 디렉션 (생성용 프롬프트-스펙)

## 0. 목적 / 사용법
## 1. 전략 → 마크 로직
## 2. 로고 컨셉 5방법
## 3. Construction Geometry 언어
## 4. 로고 유형 / 락업 / 단색·반전
## 5. 워드마크 타이포 방향
## 6. 절대 피할 것 (Avoid)
## 7. 프롬프트 청크 (그대로 떠넣기)
```

각 섹션 필수 내용(구체적으로 — 빈칸/“적절히” 금지):
- **§0**: 도구 중립 1~2문단. "이 문서는 `design-brand-kit`의 독립 단색 로고 생성과 미래 `design-logo` 스킬이 읽는 공유 ref다. 권위 원본(정확한 색/문구)은 `BRAND_KIT.md`/`brand-tokens.json`."
- **§1**: 카테고리→심볼 매핑 표(개발툴/AI/보안/보이스/럭셔리/컴플라이언스/생산성 등 최소 8행, `brand-kit-image.md` §1 표를 **로고 형태 관점**으로 심화 — 각 행에 "메타포→구체 형태 변환" 한 줄). "심볼을 랜덤하게 고르지 않는다" 원칙.
- **§2**: 5방법 각각 **이름 + 2~3문장 + 렌더 가능한 형태 지시 예시**: ①모노그램+의미(네거티브스페이스·컷·폴드·기하로, 지루한 글자 아이콘 금지) ②제품 액션(build→frame/scaffold/block/cursor 등, 추상·프리미엄) ③메타포 융합(두 의미를 하나 마크로, 미묘하고 읽히게) ④네거티브 스페이스(숨은 화살표·보호된 중심·컷아웃 등) ⑤구성 기하(원·대각컷·그리드·프레임·모듈·궤도·크로스헤어·측정선).
- **§3**: 모델이 그릴 수 있는 형태 시스템 어휘 목록 + "precise, intentional, balanced, looks researched and reduced" 같은 품질 유도 문구. 그리드/키라인 위에 구성된 느낌, 광학 균형, 강한 실루엣, 작은 크기(파비콘)에서도 읽힘.
- **§4**: 워드마크/레터마크(모노그램)/심볼/콤비네이션/엠블럼 — 각 1줄 설명 + 언제 쓰는지. 단색(pure black/pure white)·반전 버전이 항상 성립해야 함. 생성 관점: 깨끗한 배경, 큰 중앙 마크, 단일 색, 목업 없음.
- **§5**: 지오메트릭/휴머니스트/세리프/모노의 성격을 형태 언어로. 타이트한 커닝, 한 개의 커스텀 디테일(컷·리가처·터미널). 한글 워드마크 시 글리프 렌더 한계 주의.
- **§6**: Avoid 목록(negative prompt 재료) — 방패·자물쇠·지구본·기어·말풍선 클리셰, 랜덤 동물, 가짜 럭셔리 크레스트, 유명 마크 모방, 과복잡 심볼, 클립아트, 의미없는 sparkle/그라데이션/3D 베벨/드롭섀도, 일관성 없는 변형, 작아서 안 읽히는 디테일.
- **§7**: 아래 템플릿 블록을 그대로 넣는다:
```text
Create a single, clean, standalone logo for "[BRAND NAME]" on a plain [near-black/white] background.

Mark concept: [logo idea — monogram/symbol + metaphor, e.g. "monogram F fused with a scaffold/frame corner using negative space"].
Construction: built from clear geometry — [circle/grid/diagonal cut/module/frame/orbit] — precise, intentional, balanced. Looks researched and reduced, not decorative.
Form language: [geometric/organic, angular/rounded], consistent stroke weight, strong silhouette, recognizable at favicon size.
Wordmark (if shown): [geometric/humanist/serif/mono] character, tight kerning, one custom detail (cut/ligature/terminal).
Color: single brand color [HEX] on clean background; also valid as solid monochrome (pure black, pure white).
Presentation: large centered mark, generous clearspace, no mockup, no busy background, no extra UI.
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, fake luxury crest, copying famous marks, meaningless gradient/3D bevel/drop shadow/sparkle, clip-art icon feel, inconsistent variants, tiny illegible detail.
```

- [ ] **Step 2: 작성 검증**

파일이 위 8개 헤딩을 모두 포함하고 §7 템플릿 블록이 들어갔는지 Read로 확인. §1 표가 최소 8행인지 확인.

---

### Task 4: `skills/references/design/icon-art-direction.md` 작성

**Files:**
- Create: `skills/references/design/icon-art-direction.md`

- [ ] **Step 1: 파일 작성 — 정확한 헤딩과 필수 내용**

헤딩(정확히):
```md
# 아이콘 아트 디렉션 (생성용 프롬프트-스펙)

## 0. 목적 / 사용법
## 1. 아이콘 시스템 파라미터
## 2. 메타포 / 모티프 매핑
## 3. 아이콘 세트 구성
## 4. 절대 피할 것 (Avoid)
## 5. 프롬프트 청크 (그대로 떠넣기)
```

필수 내용:
- **§0**: "이 문서는 `design-brand-kit` 보드의 아이콘 세트·작은 아이콘 생성과 미래 `design-icon` 스킬이 읽는 공유 ref다."
- **§1**: 렌더 가능한 시스템 파라미터 — 일관 스트로크 두께(예: optically ~2px), 조인·터미널(둥근 vs 각진), 공유 그리드/키라인 정렬, 광학 사이징 균형, 코너 라운딩(예: ~2px), line vs two-tone vs filled, 차분한 톤.
- **§2**: 의미→아이콘 형태 매핑 예시 다수(build→frame, deploy→arrow-up-in-box, monitor→radar, protect→shield-but-non-cliché 등), 일관된 메타포 언어. "직설적이지 않고 상징적으로."
- **§3**: 세트가 한 가족처럼 보이게(동일 스트로크/조인/메타포/시각 무게). 상태 아이콘(성공/경고/위험)은 같은 구성, 액센트만 다름. 보드의 essence/value 섹션 작은 아이콘과 Imagery/Iconography 세트 모두 같은 시스템.
- **§4**: Avoid — 클립아트, 일반 스톡 아이콘, 스트로크 두께 불일치, 과밀, 클리셰 로봇, 무관한 이미지, 불필요한 3D/그라데이션.
- **§5**: 아래 템플릿 블록 그대로:
```text
Create a cohesive set of [N] minimal icons for "[BRAND NAME]" that read as one family.
System: consistent stroke weight (optically ~2px), [rounded/square] joins and terminals, aligned to a shared grid/keyline, balanced optical sizing, [~2px] corners, [line / two-tone / filled] style, calm tone.
Each icon maps a concept to a clear form: [concept→shape pairs, e.g. build→frame, deploy→arrow-up-in-box, monitor→radar]. Symbolic, not literal; one consistent metaphor language.
State icons (success/warning/danger) share the same construction; differ only by accent color.
Color: line in [text/HEX], single accent [HEX] used sparingly.
Presentation: even spacing, grid layout, generous negative space, no labels needed.
Avoid: clip-art, generic stock icons, mismatched stroke weights, overcrowding, cliché robots, unrelated imagery, 3D, gradients.
```

- [ ] **Step 2: 작성 검증**

6개 헤딩 + §5 템플릿 블록 포함 확인.

---

### Task 5: `brand-kit-image.md` 하이브리드 트림 + 링크

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

> 보드 섹션을 그리기에 충분한 최소 지시는 유지하고 깊이만 링크로 위임(spec §8 주의).

- [ ] **Step 1: §2를 요약 + 링크로 교체**

기존 §2 블록(현 60–74행, `## 2. 로고 생성 표준` ~ 5방법 리스트 끝까지)을 아래로 교체:
```md
## 2. 로고 생성 표준 (보드 섹션용 요약)

로고는 **단순·기억성·상징적·확장 가능·소유 가능(ownable)·시각적 균형**, 그리고 브랜드 아이디어와 연결되어야 한다. 아이콘·워드마크·배지·UI 마크·패턴으로 쓸 수 있어야 한다. 로고는 **리서치와 축약**에서 나온 느낌이어야 한다.

보드의 "로고 방향" 섹션에는 워드마크 · 모노그램/심볼 컨셉 · 앱 아이콘 · **구성·의미 노트**(왜 이 마크인지)를 함께 보여준다. 컨셉 방법 5가지: 모노그램+의미 · 제품 액션 · 메타포 융합 · 네거티브 스페이스 · 구성 기하.

> 독립 단색 로고 생성의 깊은 스펙·형태 언어·컨셉 방법 상세·프롬프트 청크·피해야 할 클리셰 전체 목록은 **`../../references/design/logo-art-direction.md`** 참조.
```

- [ ] **Step 2: §7 이미지/아이콘 bullet에 링크 추가**

현 134행 `- **이미지/아이콘**: ...` 줄 끝에 다음 문장 추가:
```md
 **아이콘 세트의 깊은 시스템 스펙(스트로크·그리드·상태)·프롬프트 청크는 `../../references/design/icon-art-direction.md` 참조.**
```

- [ ] **Step 3: §12 standalone 로고 단락(현 197행)에 프롬프트 청크 링크 추가**

해당 단락 끝에 추가:
```md
 **프롬프트는 `../../references/design/logo-art-direction.md`의 프롬프트 청크를 기반으로 구성한다.**
```

- [ ] **Step 4: 검증**

Read로 §2가 교체됐고, §7·§12에 링크가 들어갔는지 확인. 링크 텍스트의 상대경로 철자 확인(`../../references/design/...`).

---

### Task 6: `design-brand-kit/SKILL.md` 와이어링

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: "이미지 생성" 섹션의 참조 줄(현 243행) 보강**

현 `- 보드의 섹션 시스템·비주얼 모드·텍스트 규칙·프롬프트 템플릿은 \`references/brand-kit-image.md\` 참조.` 줄을 아래로 교체:
```md
- 보드의 섹션 시스템·비주얼 모드·텍스트 규칙·프롬프트 템플릿은 `references/brand-kit-image.md` 참조. **로고/아이콘의 깊은 생성 스펙·프롬프트 청크는 형제 공유 ref `../references/design/logo-art-direction.md`·`../references/design/icon-art-direction.md`에 있다** — 보드의 로고/아이콘 섹션·독립 로고·아이콘 세트 생성 시 끌어다 쓴다.
```

- [ ] **Step 2: standalone 로고 bullet(현 245행) 보강**

현 `- (선택) 단색 로고는 단색 버전을 고려하고 배경을 깨끗하게 둔다 (향후 로고 수정 단계의 입력이 되므로).` 줄 끝에 추가:
```md
 **프롬프트는 `../references/design/logo-art-direction.md`의 프롬프트 청크를 기반으로 구성한다.**
```

- [ ] **Step 3: 검증**

Read로 두 줄이 의도대로 바뀌었는지, 상대경로가 `../references/design/`(SKILL.md 기준 정확)인지 확인.

---

### Task 7: Codex 번들 재생성 + 포함 확인 `[확인 필요 — 스크립트 실행]`

**Files:** (생성물, gitignore됨) `plugins/personal/skills/references/design/*`

- [ ] **Step 1: sync 실행** `[확인 필요]`

Run: `npm run sync`
Expected: 에러 없이 완료, 번들 재생성 로그.

- [ ] **Step 2: 번들에 ref 두 파일 포함 확인**

Run: `ls plugins/personal/skills/references/design/`
Expected: `logo-art-direction.md`, `icon-art-direction.md` 두 파일 존재.

---

### Task 8: 링크 무결성 확인

- [ ] **Step 1: 모든 새 링크의 타깃 파일 존재 확인**

각 링크가 가리키는 실제 파일이 있는지 경로를 resolve해 확인:
- `brand-kit-image.md` 기준 `../../references/design/logo-art-direction.md` → `skills/references/design/logo-art-direction.md` 존재?
- 동 `../../references/design/icon-art-direction.md` → 존재?
- `SKILL.md` 기준 `../references/design/logo-art-direction.md` → 동일 파일 존재?

Run(예): `test -f skills/references/design/logo-art-direction.md && test -f skills/references/design/icon-art-direction.md && echo OK`
Expected: `OK`.

---

### Task 9: "after" 이미지 생성 + before/after 비교 `[확인 필요 — API 호출]`

**Files:**
- Create: `.scratch/logo-validation/after-prompt.txt`
- Create(생성물): `.scratch/logo-validation/after.png`

- [ ] **Step 1: after 프롬프트 작성 (새 logo-art-direction.md §7 청크 기반)**

`.scratch/logo-validation/after-prompt.txt`에 — `logo-art-direction.md` §7 템플릿을 Forge 브랜드로 채워서:
```text
Create a single, clean, standalone logo for "Forge" (a developer CLI build tool) on a plain near-black (#0B0E14) background.

Mark concept: monogram "F" fused with a scaffold/frame corner using negative space — suggests construction and precision.
Construction: built from clear geometry — grid + right-angle frame + one diagonal cut — precise, intentional, balanced. Looks researched and reduced, not decorative.
Form language: geometric, slightly angular, consistent stroke weight, strong silhouette, recognizable at favicon size.
Wordmark (if shown): geometric mono character, tight kerning, one custom detail in the F terminal.
Color: single cyan accent (#22D3EE) on clean background; also valid as solid monochrome (pure black, pure white).
Presentation: large centered mark, generous clearspace, no mockup, no busy background, no extra UI.
Avoid: shield/lock/globe/gear/speech-bubble clichés, random animals, fake luxury crest, copying famous marks, meaningless gradient/3D bevel/drop shadow/sparkle, clip-art icon feel, inconsistent variants, tiny illegible detail.
```

- [ ] **Step 2: dry-run (무료)**

Run:
```bash
node "skills/image-gen/scripts/image-gen.mjs" \
  --prompt-file .scratch/logo-validation/after-prompt.txt \
  --out .scratch/logo-validation/after.png \
  --size 1024x1024 --quality low --model gpt-image-2 --dry-run
```
Expected: 인자 출력, exit 0.

- [ ] **Step 3: 실제 생성** `[확인 필요 — 비용 발생]`

Step 2에서 `--dry-run` 제거 실행. Expected: `.scratch/logo-validation/after.png` 생성.

- [ ] **Step 4: before/after 제시**

`baseline.png`와 `after.png`를 Read로 열어 사용자에게 나란히 제시하고, 강화가 실제로 먹혔는지 평가받는다. 약하면 logo-art-direction.md §7 청크/§2~§6를 한 가지씩 보강해 재생성(반복).

---

### Task 10: 커밋 `[확인 필요 — git]`

> repo의 `commit` 스킬 사용(skills/·docs 변경 포함이라 해당). **선행 주의의 기존 uncommitted 변경 처리 방침을 먼저 사용자와 확정.**

- [ ] **Step 1: 기존 변경 처리 방침 확인** `[확인 필요]`

`git status`로 본 플랜 시작 전부터 있던 변경(`.claude-plugin/plugin.json`, `SKILL.md`, `brand-kit-image.md`, `AGENTS.md` 등)과 내 변경을 구분. 사용자에게: (a) 관련 design-brand-kit 작업이라 함께 커밋할지, (b) 분리할지 확인.

- [ ] **Step 2: `commit` 스킬로 커밋** `[확인 필요]`

스테이징 대상(방침에 따라):
- 신규: `skills/references/design/logo-art-direction.md`, `skills/references/design/icon-art-direction.md`
- 수정: `skills/design-brand-kit/references/brand-kit-image.md`, `skills/design-brand-kit/SKILL.md`, `.gitignore`
- 문서: `docs/superpowers/specs/2026-05-28/design-logo-icon-reference-design.md`, `docs/superpowers/plans/2026-05-28/design-logo-icon-reference.md`
- **제외**: `.scratch/`(gitignore), `plugins/personal/`(gitignore된 번들)

Expected: 커밋 성공, `git status`로 의도한 파일만 커밋됐는지 확인.

---

## Self-Review (작성자 점검)

**Spec coverage:**
- spec §3 결정(스킬 아님/위치/두 파일/하이브리드/접근법 A) → Task 3·4·5·6에서 구현. ✓
- spec §6 logo 내용 → Task 3. ✓ / spec §7 icon 내용 → Task 4. ✓
- spec §8 기존 파일 수정 → Task 5(brand-kit-image.md)·6(SKILL.md). ✓
- spec §9 sync → Task 7. ✓
- spec §10 검증(링크/번들/before-after) → Task 8·7·2·9. ✓
- spec §11 리스크(테스트 영향) → Task 1에서 무영향 확인. ✓
- spec §12 실행 순서 → Task 순서 일치(baseline 먼저, 편집, sync, after). ✓

**Placeholder scan:** 각 ref 섹션에 구체 필수 내용·실제 프롬프트 템플릿 블록 제공. "적절히/TBD" 없음. ✓

**Type/경로 consistency:** 상대경로 일관 — `brand-kit-image.md`→`../../references/design/`, `SKILL.md`→`../references/design/`. 파일명 `logo-art-direction.md`/`icon-art-direction.md` 전 Task 동일. ✓

**주의 사항:** ref 본문 산문은 실행 시 작성(창작 산출물) — 플랜은 정확한 헤딩·필수 내용·프롬프트 청크를 계약으로 제공하므로 placeholder 아님.
