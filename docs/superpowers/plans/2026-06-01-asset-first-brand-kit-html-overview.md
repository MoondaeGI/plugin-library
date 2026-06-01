# 자산 우선 브랜드 킷 + HTML 오버뷰 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** brand-kit이 정체성 자산(로고·키비주얼·UI·개별 투명 아이콘)을 안정적 파일로 생산하고, 오버뷰를 그 자산을 끼워넣는 HTML로 조합하도록 디자인 파이프라인을 전환한다.

**Architecture:** 세 층 SSOT — `BRAND_KIT.md`/`brand-tokens.json`(텍스트), `assets/*.png`(시각), `overview.html`(LLM 저작 조합). 투명이 필요한 컷아웃(로고·워드마크·아이콘)은 gpt-image-1.5, 불투명(키비주얼·UI)은 gpt-image-2. 다운스트림은 보드 재추출 없이 `assets/`를 직접 시드로 읽는다.

**Tech Stack:** Node ≥18 (의존성 없음), OpenAI Images API, node:test, 마크다운 스킬/레퍼런스, HTML/CSS(CDN 폰트).

**Spec:** `docs/superpowers/specs/2026-06-01-asset-first-brand-kit-html-overview-design.md`

**참고 — 이 계획의 변경 유형:** Task 1만 실제 코드(엄격 TDD). 나머지는 스킬/레퍼런스 **마크다운**(프롬프트·지시문)이라 단위 테스트 대상이 아니다 — 검증은 `npm test`(스크립트 회귀), `npm run sync`(Codex 번들 재생성·검증 통과), `image-gen --help`/`--dry-run` 스모크, 일관성 grep으로 한다. 각 Task 끝에 커밋.

**CLAUDE.md 준수:** 실행 단계에서 명령(`npm run sync`, `git commit`, 스크립트 실행 등) 전에 사용자 승인을 받는다. 코드/마크다운 변경 전 변경 이유·내용을 제시하고 승인 후 진행한다.

---

## File Structure

**Create**
- `tests/image-gen-background.test.mjs` — `--background` 페이로드 회귀 테스트.

**Modify (code)**
- `skills/image-gen/scripts/image-gen.mjs` — `--background` 옵션·검증·페이로드 필드.

**Modify (markdown)**
- `skills/image-gen/SKILL.md` — `--background` 문서화.
- `skills/design-brand-kit/SKILL.md` — 자산 우선 흐름·출력·이미지 생성·비용 통제로 개정.
- `skills/design-brand-kit/references/brand-kit-image.md` — HTML 오버뷰 레이아웃 스펙 추가·합성 보드 부분 대체.
- `skills/design-logo/SKILL.md` — 입력 `assets/logo-base.png` 직접·탐색 opt-in.
- `skills/design-iconset/SKILL.md` — 입력 `assets/icons/*` 직접.
- `skills/design-page-image/SKILL.md` — 입력 `assets/ui-base.png`+`key-visual.png`.
- `skills/design-md-compiler/SKILL.md` — `assets/`·`overview.html` 참조.
- `skills/references/design/logo-art-direction.md` — 투명 배경 주석.
- `skills/references/design/icon/icon-rules.md` — 투명 배경 주석.

---

## Phase 1 — image-gen `--background` (실제 코드 · TDD)

### Task 1: `image-gen.mjs`에 `--background` 추가

**Files:**
- Create: `tests/image-gen-background.test.mjs`
- Modify: `skills/image-gen/scripts/image-gen.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/image-gen-background.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(__dirname, '..', 'skills', 'image-gen', 'scripts', 'image-gen.mjs');

function run(args) {
  return spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8' });
}
function outPath(name = 'out.png') {
  return path.join(mkdtempSync(path.join(tmpdir(), 'img-bg-')), name);
}

test('--background transparent 가 페이로드에 background:"transparent" 를 넣는다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'transparent', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"background":\s*"transparent"/);
});

test('--background 미지정이면 페이로드에 background 키가 없다 (회귀 가드)', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.doesNotMatch(res.stdout, /"background"/);
});

test('--background opaque 도 페이로드에 그대로 전달된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'opaque', '--dry-run']);
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"background":\s*"opaque"/);
});

test('잘못된 --background 값은 비0 종료로 거부된다', () => {
  const res = run(['--prompt', 'x', '--out', outPath(), '--background', 'rainbow', '--dry-run']);
  assert.equal(res.status, 2);
  assert.match(res.stderr, /background/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/image-gen-background.test.mjs`
Expected: FAIL — `--background`가 "알 수 없는 인자"로 거부되어 transparent/opaque 케이스가 status 2로 떨어짐(현재 옵션 미존재).

- [ ] **Step 3: 최소 구현**

`skills/image-gen/scripts/image-gen.mjs`의 `parseArgs` switch에 케이스 추가 (`--output-format` 케이스 근처):

```js
      case '--background': opts.background = next(); break;
```

`main()`의 인자 검증부(예: `--n` 검증 줄 다음)에 추가:

```js
  if (opts.background && !['transparent', 'opaque', 'auto'].includes(opts.background)) {
    die('오류: --background 는 transparent | opaque | auto 중 하나여야 합니다.');
  }
```

`fields` 객체 생성 직후에 조건부 필드 추가:

```js
  if (opts.background) fields.background = opts.background;
```

`HELP` 문자열의 옵션 줄에 `[--background transparent]` 추가, 상단 옵션 주석 블록에 한 줄 추가:

```
//   --background      transparent | opaque | auto   (미지정이면 필드 미전송; gpt-image-2는 transparent 미지원 → 1.5와 페어링)
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/image-gen-background.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: 전체 회귀 + 커밋**

Run: `npm test`
Expected: 모든 기존 테스트 PASS(특히 `image-gen-image-input`·`image-gen-auto-version` 회귀 가드).

```bash
git add tests/image-gen-background.test.mjs skills/image-gen/scripts/image-gen.mjs
git commit -m "feat(image-gen): --background 옵션 추가 (투명 배경 라우팅용)"
```

### Task 2: image-gen SKILL.md에 `--background` 문서화

**Files:**
- Modify: `skills/image-gen/SKILL.md`

- [ ] **Step 1: 옵션 설명 추가**

`## 사용`의 옵션 목록에서 `- **이미지 입력(레퍼런스/편집)**` 항목 **앞**에 추가:

```md
- **투명 배경**: `--background transparent|opaque|auto`. 미지정이면 페이로드에 `background`를 넣지 않는다(현행 동작). **`gpt-image-2`는 `transparent`를 지원하지 않는다(요청 시 API 에러)** — 투명이 필요하면 `--model gpt-image-1.5 --background transparent`로 호출한다(`--output-format png`/`webp`). 불투명 사진/목업은 `gpt-image-2` 그대로.
```

- [ ] **Step 2: 스모크 검증**

Run: `node skills/image-gen/scripts/image-gen.mjs --help`
Expected: 도움말 출력에 `--background` 가 보임(Task 1에서 HELP 갱신됨), 종료 코드 0.

- [ ] **Step 3: 커밋**

```bash
git add skills/image-gen/SKILL.md
git commit -m "docs(image-gen): --background 옵션 문서화"
```

---

## Phase 2 — brand-kit 생산자 전환

### Task 3: brand-kit-image.md에 HTML 오버뷰 레이아웃 스펙 추가

**Files:**
- Modify: `skills/design-brand-kit/references/brand-kit-image.md`

이 파일은 현재 "종합 래스터 보드" 아트 디렉션이다. 자산 우선 모델에서 이 가이드는 **(a) base 자산 생성 아트 디렉션 + (b) HTML 오버뷰 레이아웃 스펙** 둘로 역할이 갈린다. 합성 보드를 한 장으로 생성하는 지시는 폐기하고, 섹션 시스템·비주얼 모드·색 규율 등 **품질/아트 디렉션 지식은 자산·HTML 양쪽에 재사용**한다.

- [ ] **Step 1: 현재 파일을 읽는다**

Run: `node -e "process.stdout.write(require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-image.md','utf8').length+' chars\n')"`
그리고 파일을 통독해 섹션 구조(산출물 / 레퍼런스 DNA / 핵심 원칙 / §1 전략 / §2 로고 / §3 보드 섹션 시스템 / §4 비주얼 모드 / §5 색 규율 / 이하)를 파악한다.

- [ ] **Step 2: "## 산출물" 섹션을 자산 우선으로 교체**

기존 "## 산출물"의 1·2 항목(종합 래스터 보드 / 추가 탐색)을 아래로 교체:

```md
## 산출물

1. **base 시각 자산 (필수)** — 오버뷰가 끼워넣고 다운스트림이 시드로 쓰는 안정적 PNG 파일들. → `.design/generated/brand-kit/assets/`(시안) → `.design/final/brand-kit/assets/`(락).
   - `logo-base.png` — 로고 마크/심볼. **투명**(gpt-image-1.5 + `--background transparent`).
   - `wordmark-base.png` — 워드마크(브랜드명 로고타입). **투명**(gpt-image-1.5 + `--background transparent`). 짧고 또렷하게(한글 글리프 뭉갬 주의).
   - `key-visual.png` — 브랜드 히어로 이미지(단일). 불투명(gpt-image-2).
   - `ui-base.png` — UI 컴포넌트 룩(카드·배지·컨트롤). 불투명(gpt-image-2).
   - `icons/<name>.png` — 오버뷰가 쓰는 개별 아이콘. **투명**(gpt-image-1.5 + `--background transparent`). §2·§4·§9 장식 + §11 쇼케이스 + design-iconset 가족 기준.
2. **종합 브랜드 오버뷰 (필수 · 메인)** — 위 자산을 끼워넣고 데이터 섹션을 토큰에서 렌더한 **HTML 페이지** `overview.html`. AI 래스터 보드가 아니다. → `.design/final/brand-kit/overview.html`.
3. **(선택) 추가 탐색 이미지** — 대안 무드·히어로 변형 등. → `.design/generated/brand-kit/`.

**워드마크도 이미지 자산이다**(`wordmark-base.png`, 투명) — 타입페이스/커스텀을 조건 없이 일관 처리. §1에선 `key-visual` 위에 `<img>`로 얹는다. 컷아웃은 `logo-base`·`wordmark-base`·아이콘.
```

- [ ] **Step 3: "## 3. 종합 오버뷰 보드 — 섹션 시스템" 제목·도입부를 HTML 오버뷰용으로 조정하고, 그 끝에 레이아웃 스펙 블록을 추가**

§3의 "메인 산출물은 …종합 보드다" 문장을 다음으로 교체:

```md
메인 산출물은 **브랜드 전체를 한눈에 보여주는 HTML 오버뷰 페이지**다. 아래 섹션 시스템은 그 페이지의 정보 구조이고, 각 섹션은 `BRAND_KIT.md` §1–11과 1:1 매핑된다(§12는 md 전용·렌더 안 함). 시각 섹션(§1 히어로·§6 로고·§10 UI·§11 아이콘)은 `assets/*.png`를 `<img>`로 끼워넣고, 데이터 섹션(§2·3·4·5·7·8·9)은 `BRAND_KIT.md`/`brand-tokens.json`에서 HTML/CSS로 렌더한다.
```

§3의 "### 허용 변형" 섹션 **뒤**에 새 서브섹션 추가:

```md
### HTML 오버뷰 레이아웃 스펙 (LLM 저작)

`overview.html`은 고정 템플릿이 아니라 **이 스펙을 가드레일 삼아 LLM이 브랜드별로 저작**한다. 콘텐츠는 SSOT(`BRAND_KIT.md`/`brand-tokens.json`)에서 가져오고 **지어내지 않는다** — 변주는 레이아웃에서만.

- **필수 섹션 인벤토리**: 위 §1–11. 로고 외 최소 8개가 한눈에. §12는 렌더 안 함.
- **콘텐츠/자산 매핑**:
  - §1 — `key-visual.png`를 히어로 배경 `<img>`로, 그 위에 `wordmark-base.png`를 `<img>`로 얹고 + 한 줄 설명·포지셔닝은 HTML 텍스트. CSS 스크림으로 가독성 확보.
  - §6 — `logo-base.png`(심볼)·`wordmark-base.png`(워드마크)를 `<img>`로(락업은 둘 조합), 구성·의미 노트는 텍스트.
  - §10 — `ui-base.png`를 `<img>`로.
  - §11 — `icons/*.png`를 **CSS 그리드**로 배열 + 스타일 노트 텍스트.
  - §2·§4·§9 — 장식 아이콘은 `icons/*.png`에서 개별 배치. 데이터(미션·가치·O/X)는 HTML 텍스트.
  - §7 — `brand-tokens.json` 색을 **진짜 CSS 스와치 + HEX 라벨**로.
  - §8 — `font-catalog.md`의 실폰트를 CDN `<link>`로 로드(한글 Pretendard jsdelivr 등), 타입 스케일을 **살아있는 스펙시먼**으로.
  - §3·§5 — HTML 텍스트.
- **폰트 로드**: `../../references/design/font-catalog.md`의 family·specimen을 `<link>`로. 폰트명을 지어내지 않는다.
- **품질 가드레일**: 또렷한 위계(큰 워드마크 → 섹션 타이틀 → 라벨), 넉넉한 네거티브 스페이스, 절제된 액센트(§5 색 규율), 섹션 리듬. 프리미엄 가이드라인 원페이저 품질.
- **레이아웃 아키타입 (변주 유도, 택1)**: ① 포스터형(세로 1컬럼, 큰 히어로) ② 시스템 그리드(다컬럼 카드) ③ 에디토리얼(비대칭, 큰 여백). 브랜드 성격(Q4–6·비주얼 모드)에 맞춰 고른다.
- **반복 규율**: 작은 값(HEX·카피)은 기존 HTML 외과 편집(레이아웃 보존), "디자인 다르게"는 재저작.
```

- [ ] **Step 4: "### 발산 3 루트" 도입부에 비용 통제 한 줄 추가**

"### 발산 3 루트" 첫 문단 끝에 추가:

```md
**비용 통제**: 발산은 루트당 **key-visual 초안 1장(`--quality low`)** + 루트별 텍스트 요약으로 비교한다 — 풀 자산 세트(로고·UI·아이콘)를 ×3 만들지 않는다. 풀 자산은 고른 루트에서만 생산한다(흐름 C).
```

- [ ] **Step 5: 일관성 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-brand-kit/references/brand-kit-image.md','utf8'); for (const s of ['assets/','overview.html','logo-base.png','wordmark-base.png','HTML 오버뷰 레이아웃 스펙','gpt-image-1.5']) if(!t.includes(s)) throw new Error('missing: '+s); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/references/brand-kit-image.md
git commit -m "docs(brand-kit): HTML 오버뷰 레이아웃 스펙 추가·산출물 자산 우선 전환"
```

### Task 4: design-brand-kit SKILL.md 자산 우선 개정

**Files:**
- Modify: `skills/design-brand-kit/SKILL.md`

- [ ] **Step 1: frontmatter `description` 갱신**

기존 description(보드 한 장·§6 로고 중심)을 교체:

```md
description: 제품 설명을 바탕으로 브랜드 정체성·톤·색상·타이포그래피·로고 방향·UI 분위기·금지 패턴을 정리한 브랜드 킷을 만들고, 정체성 base 자산(로고·키비주얼·UI·개별 투명 아이콘)을 안정적 PNG로 생산한 뒤 그것들을 끼워넣은 HTML 오버뷰(overview.html)를 협업하며 만든다. 데이터 섹션은 토큰에서 HTML 렌더(진짜 HEX·실폰트). 다운스트림(design-logo·iconset·page-image)은 보드 재추출 없이 assets/를 직접 시드로 읽는다.
```

- [ ] **Step 2: "## 출력 파일" 섹션 교체**

기존 출력 파일 목록을 교체:

```md
## 출력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md` — 브랜드 방향(텍스트). 색 HEX·타이포 스펙의 **권위 원본**.
- `.design/brand-tokens.json` — 토큰(권위 원본).
- `.design/image-briefs/brand-briefs.md` — 자산·HTML 오버뷰·(선택) 추가 탐색 브리프.
- `.design/generated/brand-kit/assets/` — base 자산 시안(`--auto-version` 누적).
- `.design/generated/brand-kit/candidates/direction-{a,b,c}/` — 발산 시 후보별 풀 `BRAND_KIT.md`+`brand-tokens.json`+`brief.md`. 고른 방향만 canonical로 승격.
- `.design/final/brand-kit/assets/` — 락된 base 자산: `logo-base.png`·`wordmark-base.png`·`key-visual.png`·`ui-base.png`·`icons/<name>.png`.
- `.design/final/brand-kit/overview.html` — 자산을 끼워넣은 HTML 오버뷰(+선택 `overview.css`). 다운스트림이 우선 읽음.

**로고/UI/아이콘은 base 자산으로 생산**하며, 풀 산출물(로고 시스템·풀 아이콘셋·페이지)은 다운스트림 몫이다.
```

- [ ] **Step 3: "## 이미지 생성 (공유 `image-gen` 스킬)" 섹션 교체**

이 섹션 전체(합성 보드 발산/증분 편집 지시)를 자산 우선 지시로 교체:

```md
## 이미지 생성 (공유 `image-gen` 스킬)

이미지는 공유 `image-gen` 스킬 스크립트로 생성한다. `OPENAI_API_KEY` 필요(`.env`). **키 사전 점검 없이 바로 호출** — 없으면 스크립트가 안내하며 실패. 생성은 승인 게이트(흐름 3) 통과 후에만.

스크립트 경로: `<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs`.

- **자산별 개별 호출** (한 프롬프트의 변형이 아님 — `--n` 금지).
- **투명 라우팅 (중요)**: 컷아웃 자산은 투명 PNG가 필요하다.
  - `logo-base.png`·`wordmark-base.png`·`icons/<name>.png` → `--model gpt-image-1.5 --background transparent --output-format png`.
  - `key-visual.png`·`ui-base.png` → `--model gpt-image-2`(불투명). (gpt-image-2는 `transparent` 미지원.)
- **자산 간 일관성**: 먼저 **스타일 앵커**(또는 `key-visual`)를 만들고, 이후 각 자산을 그 앵커를 `--image`로 첨부 + 공통 스타일 프리앰블(BRAND_KIT/tokens)로 생성해 한 가족이 되게 한다. 아이콘은 가족 앵커(또는 첫 아이콘)를 `--image`로 시드.
- **품질/비용**: 초안 `--quality low`. **사진류(key-visual·ui)만 `--quality high` 락**, 로고·아이콘은 low(필요 시 medium). 아이콘은 오버뷰 표시 크기엔 low로 충분.
- **버전 보존**: 모든 재생성 `--auto-version`(`generated/brand-kit/assets/`에 `-v2`… 누적). 락된 자산만 `final/brand-kit/assets/`로 복사.
- 프롬프트는 임시 파일에 써서 `--prompt-file`로. 자산 아트 디렉션·로고/아이콘 청크는 `references/brand-kit-image.md`·`../references/design/logo-art-direction.md`·`../references/design/icon/icon-rules.md`.
- 호출 예(투명 로고 마크):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <로고 프롬프트 파일> \
    --image "<cwd>/.design/generated/brand-kit/assets/style-anchor.png" \
    --out "<cwd>/.design/generated/brand-kit/assets/logo-base.png" \
    --auto-version --model gpt-image-1.5 --background transparent --quality low
  ```
- 호출 예(불투명 키비주얼):
  ```bash
  node "<이 스킬 디렉터리>/../image-gen/scripts/image-gen.mjs" \
    --prompt-file <키비주얼 프롬프트 파일> \
    --out "<cwd>/.design/generated/brand-kit/assets/key-visual.png" \
    --auto-version --model gpt-image-2 --size 1536x1024 --quality low
  ```

### overview.html 저작 (이미지 아님)

`overview.html`은 생성기로 만들지 않는다 — `references/brand-kit-image.md`의 "HTML 오버뷰 레이아웃 스펙"을 가드레일로 **LLM이 저작**한다: 자산은 `<img>`(상대 경로), 데이터는 `BRAND_KIT.md`/tokens에서 렌더, 폰트는 `../references/design/font-catalog.md`의 실폰트 CDN `<link>`, §1 워드마크는 `wordmark-base.png`를 `<img>`로. 콘텐츠를 지어내지 않는다(변주는 레이아웃만).
```

- [ ] **Step 4: "## 흐름 (디자이너 협업 루프)" 섹션 교체**

기존 흐름(1 킷 → 2 brief → 3 승인 → 4 보드 발산/수렴/증분 → 5 추가탐색 → 6 다음)을 자산 우선 흐름으로 교체:

```md
## 흐름 (디자이너 협업 루프)

1. **킷 작성 (분위기 분기)** — §1–11은 오버뷰 섹션과 1:1, §12는 md 전용. 분위기 고정→canonical 1벌 / 열림→`candidates/direction-{a,b,c}/` 3벌. §8 폰트는 `../references/design/font-catalog.md`에서, §11 아이코노그래피는 `../references/design/icon/icon-rules.md`로 확정(폼 규칙 명시).
2. **brief 작성** — `brand-briefs.md`(자산·HTML 오버뷰·선택 추가탐색). 발산이면 방향별 `brief.md`.
3. **승인 게이트 (생성 전 필수)** — 문서(킷·tokens·brief)를 제시하고 방향 확인. 승인 전 한 장도 생성하지 않는다. 발산이면 후보 3방향을 몇 줄 요약으로.
4. **발산 (분위기 열림일 때만; 고정이면 건너뜀)** — 루트당 **key-visual 초안 1장(`--quality low`)** + 텍스트 요약으로 비교 → 한 방향 선택. 풀 자산 ×3 금지. 재시도(가챠/방향 조정) 루프는 key-visual 초안으로만. 고른 후보를 canonical로 승격.
5. **자산 생산 (고른 방향)** — 스타일 앵커 → `key-visual`·`logo-base`·`wordmark-base`·`ui-base`·`icons/*`를 각각 생성(투명 라우팅·앵커 일관성·품질/비용 규율은 "이미지 생성" 참조). 자산별로 보여주고 → 한 번에 한 가지 증분 편집 → lock 시 `final/brand-kit/assets/`로 복사. §11 아이콘 목록(개수·라벨)은 도메인 근거로 제안·확정(과다 생성 주의).
6. **overview.html 저작** — 락된 자산 + BRAND_KIT/tokens + 레이아웃 스펙으로 LLM이 작성 → `final/brand-kit/overview.html`. 보여주고 피드백: 데이터/레이아웃은 HTML 외과 편집(0콜), 시각은 해당 자산만 재롤 후 `<img>` 교체.
7. **(선택) 추가 탐색 이미지** — 1개씩 생성→피드백→증분 편집→lock.
8. 확정되면 산출물 경로를 제시하고 안내: **"다음 단계: `design-logo` → `design-iconset` → `design-page-image`"** (각자 `assets/`를 시드로 읽음).
```

- [ ] **Step 5: 잔여 합성 보드 참조 제거 확인**

Run: `node -e "const t=require('fs').readFileSync('skills/design-brand-kit/SKILL.md','utf8'); for (const s of ['brand-overview-route','brand-overview.png']) if(t.includes(s)) throw new Error('잔존 합성보드 참조: '+s); for (const s of ['assets/','overview.html','gpt-image-1.5','logo-base.png','wordmark-base.png']) if(!t.includes(s)) throw new Error('missing: '+s); console.log('ok')"`
Expected: `ok`. (`-route`/`brand-overview.png` 잔존 시 본문/예시에서 제거.)

> 참고: 본문 다른 곳(목적·BRAND_KIT.md 구조 헤더 설명 등)에 "종합 오버뷰 보드"를 "HTML 오버뷰"로 일관되게 바꾼다. §1–11 ↔ 오버뷰 섹션 매핑 설명은 유지.

- [ ] **Step 6: 커밋**

```bash
git add skills/design-brand-kit/SKILL.md
git commit -m "refactor(brand-kit): 자산 우선 생산 + HTML 오버뷰로 흐름 전환"
```

---

## Phase 3 — 다운스트림 인터페이스 전환

### Task 5: design-logo — assets/logo-base 직접 시드·탐색 opt-in

**Files:**
- Modify: `skills/design-logo/SKILL.md`

- [ ] **Step 1: "## 입력 파일" 교체**

```md
## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/final/brand-kit/assets/logo-base.png` — **확정 로고 마크 시드(투명).** 보드 재추출 없이 이 파일을 직접 시드로 쓴다.
- `.design/final/brand-kit/assets/wordmark-base.png` — 확정 워드마크 시드(투명). 로고 시스템(Phase 3) 워드마크를 이걸로 시드.
- `.design/BRAND_KIT.md` — §6 로고 방향(구성·의미·금지), §1 개요, 금지 패턴, §8 타이포(워드마크용).
- `.design/brand-tokens.json` — 색 HEX·타이포.

> `logo-base.png`가 **없으면** Phase 0의 로고 Q&A로 최소 정보를 모은다 — 시드 없이 첫 보드는 텍스트→이미지.
```

- [ ] **Step 2: Phase 0 감지 대상 교체**

Phase 0의 존재 확인 대상을 `.design/final/brand-kit/assets/logo-base.png`(+`BRAND_KIT.md`)로 바꾼다. "있으면 → Phase 1로" 유지.

- [ ] **Step 3: Phase 1 시드 추출 단계 교체**

기존 "2. 시드 추출(보드 통째 첨부 §6 영역 재현)"을 교체:

```md
2. **시드 = `assets/logo-base.png` 직접.** brand-kit이 이미 깨끗한 투명 로고 마크를 생산했으므로 **보드에서 재추출하지 않는다**(재추출이 드리프트의 원인이었다). 그대로 `generated/logo/seed.png`로 복사하거나 경로를 그대로 시드로 쓴다. 보여주고 "이 마크 맞아요?" 확인.
   - **로고 (I) 단일 커밋**: 사용자가 `logo-base`를 그대로 확정할 수 있다. 더 탐색하고 싶을 때만 40컨셉 보드로 간다(아래 **탐색 opt-in**).
```

- [ ] **Step 4: Phase 2 탐색을 opt-in으로 명시**

Phase 2 도입부에 추가:

```md
**탐색은 opt-in.** `logo-base`가 만족스러우면 Phase 2의 탐색 보드를 건너뛰고 바로 단독 로고 확정(7단계)→로고 시스템(Phase 3)으로 간다. "다른 방향도 보고 싶다"일 때만 40컨셉 탐색 보드를 만든다. 탐색·단독 로고 생성 시 컷아웃은 `--model gpt-image-1.5 --background transparent`(투명).
```

- [ ] **Step 5: 일관성 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-logo/SKILL.md','utf8'); if(!t.includes('assets/logo-base.png')) throw new Error('logo-base 미참조'); if(t.includes('§6 로고 방향(Logo Direction) 영역에 있는 로고 마크')) throw new Error('보드 재추출 잔존'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 6: 커밋**

```bash
git add skills/design-logo/SKILL.md
git commit -m "refactor(logo): assets/logo-base 직접 시드·탐색 opt-in (보드 재추출 제거)"
```

### Task 6: design-iconset — assets/icons 직접

**Files:**
- Modify: `skills/design-iconset/SKILL.md`

- [ ] **Step 1: "## 입력 파일" 교체**

```md
## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/final/brand-kit/assets/icons/` — **brand-kit이 만든 개별 투명 아이콘.** 이 가족을 **권위 기준(스타일 시드)**으로 삼아 풀 product 세트를 확장한다(보드 재추출 안 함).
- `.design/BRAND_KIT.md` — §11 아이코노그래피(스타일·폼 규칙·모티프·상태 규칙)·§6·§1/에센스·§10·금지 패턴.
- `.design/brand-tokens.json` — 색 HEX.

> `assets/icons/`가 **없으면** Phase 0의 아이콘 Q&A로 최소 정보를 모은다.
```

- [ ] **Step 2: Phase 0 감지 + Phase 1 시드 단계 교체**

Phase 0 존재 확인 대상에 `.design/final/brand-kit/assets/icons/` 추가. Phase 1의 "스타일 시드 추출(보드 아이코노그래피 영역 재현)"을 교체:

```md
2. **스타일 시드 = `assets/icons/*` 직접.** brand-kit이 만든 개별 투명 아이콘을 가족 앵커로 쓴다(보드 재추출 안 함). 추가 아이콘은 이 앵커를 `--image`로 첨부 + 동일 스타일 파라미터로 생성해 한 가족 유지. 투명 컷아웃은 `--model gpt-image-1.5 --background transparent`.
```

- [ ] **Step 3: 시트 vs 개별 명시**

기존 라벨 그리드 "시트 한 장" 산출은 **사람이 한눈에 보는 쇼케이스용**으로 유지하되, 도입부에 한 줄 추가:

```md
> 개별 아이콘 파일(`assets/icons/*` + 본 스킬이 확장한 것)이 1급 자산이다. 라벨 그리드 시트는 **사람이 한눈에 보는 쇼케이스/검수용**이며, 개별 파일을 대체하지 않는다(오버뷰·UI 킷은 개별 파일을 CSS로 배열).
```

- [ ] **Step 4: 일관성 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-iconset/SKILL.md','utf8'); if(!t.includes('assets/icons')) throw new Error('assets/icons 미참조'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 5: 커밋**

```bash
git add skills/design-iconset/SKILL.md
git commit -m "refactor(iconset): assets/icons 가족 기준 직접 시드"
```

### Task 7: design-page-image — assets/ui-base + key-visual

**Files:**
- Modify: `skills/design-page-image/SKILL.md`

- [ ] **Step 1: "## 입력 파일" 교체**

```md
## 입력 파일 (대상 프로젝트 cwd 기준)

- `.design/BRAND_KIT.md`
- `.design/brand-tokens.json`
- `.design/final/brand-kit/assets/ui-base.png` — UI 컴포넌트 룩 시드(있으면 섹션 목업 생성 시 `--image`로 첨부).
- `.design/final/brand-kit/assets/key-visual.png` — 히어로/배경 자산(있으면 §1 등에서 활용·참조).
- (있으면) `.design/final/brand-kit/overview.html` — 오버뷰 룩 참조.
```

- [ ] **Step 2: 이미지 생성 호출에 자산 활용 한 줄 추가**

"## 이미지 생성"의 호출 규칙에 추가:

```md
- **brand-kit 자산 활용**: UI 목업 섹션은 `assets/ui-base.png`를, 히어로/배경은 `assets/key-visual.png`를 `--image`로 첨부해 룩 일관성을 잡는다(있을 때). 투명 로고/아이콘을 섹션에 얹을 땐 `assets/`의 투명 PNG를 활용.
```

- [ ] **Step 3: 일관성 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-page-image/SKILL.md','utf8'); for (const s of ['ui-base.png','key-visual.png']) if(!t.includes(s)) throw new Error('missing: '+s); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-page-image/SKILL.md
git commit -m "refactor(page-image): brand-kit ui-base·key-visual 자산 입력 추가"
```

### Task 8: design-md-compiler — assets/ + overview.html 참조

**Files:**
- Modify: `skills/design-md-compiler/SKILL.md`

- [ ] **Step 1: "## 입력 파일" 갱신**

기존 입력 목록의 `image-briefs/brand-briefs.md` 줄 **뒤**에 추가, 그리고 final glob 줄 위에:

```md
- `.design/final/brand-kit/overview.html` (있으면 — 브랜드 오버뷰 룩·섹션 구조 참조)
- `.design/final/brand-kit/assets/*.png`, `.design/final/brand-kit/assets/icons/*.png` (확정 base 자산 — 로고·키비주얼·UI·아이콘)
```

- [ ] **Step 2: "## 7. 이미지 에셋 사용 규칙" 안내 보강**

"## 작성 규칙"의 "이미지는 경로의 서브디렉터리 이름…" 줄을 교체:

```md
- 이미지는 경로의 서브디렉터리 이름으로 종류를 구분한다: `brand-kit/assets/`(로고·키비주얼·UI·아이콘 — 1급 재사용 자산) vs `page/`(페이지 섹션). `overview.html`은 브랜드 오버뷰 룩의 참조다.
```

- [ ] **Step 3: 일관성 검증**

Run: `node -e "const t=require('fs').readFileSync('skills/design-md-compiler/SKILL.md','utf8'); for (const s of ['overview.html','brand-kit/assets']) if(!t.includes(s)) throw new Error('missing: '+s); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: 커밋**

```bash
git add skills/design-md-compiler/SKILL.md
git commit -m "refactor(md-compiler): brand-kit assets·overview.html 입력 참조 추가"
```

---

## Phase 4 — 공유 레퍼런스 + 마무리

### Task 9: 공유 레퍼런스 투명 배경 주석

**Files:**
- Modify: `skills/references/design/logo-art-direction.md`
- Modify: `skills/references/design/icon/icon-rules.md`

- [ ] **Step 1: 경로 확인**

Run: `node -e "const fs=require('fs'); for (const p of ['skills/references/design/logo-art-direction.md','skills/references/design/icon/icon-rules.md']) console.log(p, fs.existsSync(p))"`
Expected: 둘 다 `true`. (false면 실제 경로를 `git ls-files | findstr design` 로 찾아 교정.)

- [ ] **Step 2: 두 파일 각각에 투명 배경 주석 1줄 추가**

각 파일의 "배경" 관련 줄(또는 문서 상단 생성 규칙 근처)에 추가:

```md
> **투명 배경 주의**: gpt-image-2는 투명 배경을 지원하지 않는다(API 에러). 투명 컷아웃(로고 마크·워드마크·아이콘)은 `--model gpt-image-1.5 --background transparent --output-format png`로 생성한다. 불투명 사진/목업은 gpt-image-2.
```

- [ ] **Step 3: 일관성 검증**

Run: `node -e "const fs=require('fs'); for (const p of ['skills/references/design/logo-art-direction.md','skills/references/design/icon/icon-rules.md']) if(!fs.readFileSync(p,'utf8').includes('gpt-image-1.5')) throw new Error('missing note: '+p); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: 커밋**

```bash
git add skills/references/design/logo-art-direction.md skills/references/design/icon/icon-rules.md
git commit -m "docs(design-refs): 투명 배경 라우팅(gpt-image-1.5) 주석 추가"
```

### Task 10: 동기화 + 전체 검증

**Files:** (없음 — 검증/생성)

- [ ] **Step 1: Codex 번들 재생성**

Run: `npm run sync`
Expected: 종료 0. `plugins/personal/`·`codex-agents/` 재생성, MCP 검증 통과. (AGENTS.md: 소스 수정 후 sync 필수. gitignore된 로컬 생성물이므로 커밋 대상 아님.)

- [ ] **Step 2: 스크립트 회귀 테스트**

Run: `npm test`
Expected: 모든 테스트 PASS(신규 `image-gen-background` 포함).

- [ ] **Step 3: image-gen 투명 라우팅 스모크 (드라이런, 키 불필요)**

Run:
```bash
node skills/image-gen/scripts/image-gen.mjs --prompt "logo mark" --out /tmp/logo.png --model gpt-image-1.5 --background transparent --dry-run
```
Expected: 종료 0, payload에 `"model": "gpt-image-1.5"` 와 `"background": "transparent"`.

- [ ] **Step 4: 파이프라인 일관성 grep (보드 재추출 잔존 점검)**

Run:
```bash
node -e "const fs=require('fs'); const files=['design-logo','design-iconset'].map(s=>'skills/'+s+'/SKILL.md'); for(const f of files){const t=fs.readFileSync(f,'utf8'); if(/보드 .*통째.*첨부|§6 로고 방향\(Logo Direction\) 영역에 있는 로고 마크/.test(t)) throw new Error('보드 재추출 잔존: '+f);} console.log('ok')"
```
Expected: `ok`.

- [ ] **Step 5: 최종 검토 + 안내**

스펙(`docs/superpowers/specs/2026-06-01-...-design.md`)의 각 섹션을 훑어 Task 매핑을 확인하고, 사용자에게 다음 사용 흐름을 안내: brand-kit이 `assets/` + `overview.html`을 생산 → logo/iconset/page-image가 `assets/`를 직접 시드 → md-compiler가 DESIGN.md로 정리.

---

## Self-Review (작성자 체크)

**Spec coverage:**
- §3 세 층 SSOT → Task 4(출력)·Task 3(오버뷰 레이아웃). ✓
- §4 자산 인벤토리(로고·워드마크·키비주얼·UI·개별 투명 아이콘) → Task 3 산출물·Task 4 이미지 생성. ✓
- §5 자산 일관성(스타일 앵커) → Task 4 "자산 간 일관성". ✓
- §6 흐름 A–F → Task 4 흐름. ✓
- §7 스펙 가이드 LLM 저작 HTML → Task 3 레이아웃 스펙·Task 4 overview.html 저작. ✓
- §8 투명 전략 → Task 1(코드)·Task 2(문서)·Task 9(레퍼런스 주석)·Task 4·5·6(라우팅). ✓
- §9 비용 통제 → Task 3 발산 비용 줄·Task 4 품질/비용 규율. ✓
- §10 다운스트림 인터페이스 → Task 5·6·7·8. ✓
- §11 마이그레이션(깨끗한 전환) → 다운스트림이 옛 경로 분기 없이 새 경로만 참조(Task 5–8), Task 10 Step 4 잔존 점검. ✓
- §12 폴더 구조 → Task 4 출력 파일. ✓
- §13 영향 파일 → 전 Task가 1:1 커버. ✓
- §14 리스크(일관성·1.5 품질·HTML 다양성) → 스펙 §14에 검증 항목으로 기록, 실행 중 실물 확인. ✓

**Placeholder scan:** 코드 스텝(Task 1)은 실제 테스트·구현 코드 포함. 마크다운 스텝은 저작 콘텐츠를 직접 제공(read-then-apply는 기존 프로즈 통합용이며 변경 내용은 구체적으로 명시). "적절히 처리" 류 없음. ✓

**Type/계약 일관성:** 경로·옵션 표기 통일 — `assets/logo-base.png`·`assets/icons/<name>.png`·`overview.html`·`--model gpt-image-1.5 --background transparent`·`--quality low|high` 가 전 Task 동일. ✓
