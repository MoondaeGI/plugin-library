# design-html-prototype 자산 갭 해소 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-html-prototype`이 빌드 전 자산 갭(타사 브랜드 마크·콘텐츠 이미지)을 가용성 기반으로 해소하고 사람 검수 게이트를 거쳐 web-publisher에 매니페스트로 넘기도록, 공유 Iconify 클라이언트 승격 + 벤더 로고 fetch 스크립트 + 스킬/에이전트 문서를 정비한다.

**Architecture:** Iconify HTTP 클라이언트(`iconify-client.mjs`)를 두 스킬이 공유하도록 `scripts/lib/`로 승격한다. 신규 `fetch-vendor-logo.mjs`가 그 클라이언트로 벤더 마크를 색 보존 SVG로 조달하고(없으면 escalate), `design-html-prototype` SKILL.md에 빌드 전 자산 갭 패스·검수 게이트·매니페스트 핸드오프를 명문화하고, web-publisher에 "갭은 지어내지 말고 보고" 계약을 추가한다.

**Tech Stack:** Node ESM(.mjs), `node --test`. 기존 `skills/design-iconset/scripts/iconify-client.mjs`(이동 대상)·`scripts/lib/`(공유 위치)·`scripts/sync-agents.mjs`·`scripts/sync-codex-plugin.mjs`.

**선행 사실:**
- `iconify-client.mjs`는 `fetchIconSvg(setId, name, deps)`·`iconExists(setId, name, deps)`·`fetchSetInfo(setId, deps)`를 export하고, `deps.fetchFn`으로 `fetch`를 주입받는다.
- import 사이트 3곳: `skills/design-iconset/scripts/fetch-icons.mjs:4`, `skills/design-iconset/scripts/compose-and-write.mjs:4`, `tests/design-iconset/iconify-client.test.mjs:3`.
- `scripts/lib/` 모듈의 테스트는 최상위 `tests/`에 둔다(예: `tests/load-env.test.mjs`).
- 스킬 스크립트 `skills/<skill>/scripts/X.mjs`에서 공유 lib까지의 상대경로는 `../../../scripts/lib/...`.

---

## Task 1: `iconify-client.mjs`를 `scripts/lib/`로 승격

**Files:**
- Move: `skills/design-iconset/scripts/iconify-client.mjs` → `scripts/lib/iconify-client.mjs`
- Modify: `skills/design-iconset/scripts/fetch-icons.mjs:4`
- Modify: `skills/design-iconset/scripts/compose-and-write.mjs:4`
- Move: `tests/design-iconset/iconify-client.test.mjs` → `tests/iconify-client.test.mjs`
- Modify (이동된 테스트의 import 경로)

- [ ] **Step 1: git mv로 모듈 이동 (히스토리 보존)**

```bash
git mv skills/design-iconset/scripts/iconify-client.mjs scripts/lib/iconify-client.mjs
git mv tests/design-iconset/iconify-client.test.mjs tests/iconify-client.test.mjs
```

- [ ] **Step 2: 이동된 테스트의 import 경로 수정**

`tests/iconify-client.test.mjs` 3번째 줄을 아래로 바꾼다.

```js
import { fetchIconSvg, iconExists, fetchSetInfo } from '../scripts/lib/iconify-client.mjs'
```

- [ ] **Step 3: 테스트 실행 — 이동 후 통과 확인**

Run: `node --test tests/iconify-client.test.mjs`
Expected: PASS (4 tests). 만약 모듈 경로 오류면 Step 1/2 경로를 재확인.

- [ ] **Step 4: iconset 의존 모듈 2곳 import 경로 수정**

`skills/design-iconset/scripts/fetch-icons.mjs` 4번째 줄:

```js
import { fetchIconSvg as realFetch } from '../../../scripts/lib/iconify-client.mjs'
```

`skills/design-iconset/scripts/compose-and-write.mjs` 4번째 줄:

```js
import { fetchIconSvg as realFetch } from '../../../scripts/lib/iconify-client.mjs'
```

- [ ] **Step 5: 의존 모듈 테스트 실행 — import 체인 검증**

Run: `node --test tests/design-iconset/fetch-icons.test.mjs tests/design-iconset/compose-and-write.test.mjs`
Expected: PASS. (두 테스트는 각각 `fetch-icons.mjs`·`compose-and-write.mjs`를 import하므로, 새 경로가 틀리면 모듈 로드 단계에서 실패한다.)

- [ ] **Step 6: 잔여 참조 확인 — 옛 경로가 코드/테스트에 남아있지 않은지**

Run: `node --test "tests/**/*.test.mjs"`
Expected: 전체 PASS. (옛 `skills/design-iconset/scripts/iconify-client.mjs`를 가리키는 import가 남아있으면 여기서 실패한다. `docs/`의 과거 plan 문서 언급은 무시 — 실행 코드 아님.)

- [ ] **Step 7: 커밋**

```bash
git add scripts/lib/iconify-client.mjs tests/iconify-client.test.mjs skills/design-iconset/scripts/fetch-icons.mjs skills/design-iconset/scripts/compose-and-write.mjs
git commit -m "refactor(scripts): iconify-client를 scripts/lib로 승격(두 스킬 공유)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `fetch-vendor-logo.mjs` — 벤더 마크 조달

벤더명을 받아 Iconify `logos`/`simple-icons`에서 **색 보존** SVG를 조달한다. 흔한 로그인 제공자는 별칭 후보 목록으로, 그 외는 `set:name` 오버라이드로 해소하고, Iconify에 없으면 `escalate`를 반환한다(트레이드마크는 절대 생성하지 않는다). 후보는 다색 `logos`를 먼저, 단색 `simple-icons`를 폴백으로 둔다.

**Files:**
- Create: `skills/design-html-prototype/scripts/fetch-vendor-logo.mjs`
- Test: `tests/design-html-prototype/fetch-vendor-logo.test.mjs`

- [ ] **Step 1: 실패하는 테스트 작성**

`tests/design-html-prototype/fetch-vendor-logo.test.mjs`:

```js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveVendorLogo, VENDOR_CANDIDATES } from '../../skills/design-html-prototype/scripts/fetch-vendor-logo.mjs'

// iconExists/fetchIconSvg를 주입해 네트워크 없이 테스트한다.
const fakeDeps = (existing, svgBody = '<svg>logo</svg>') => ({
  iconExists: async (setId, name) => existing.has(`${setId}:${name}`),
  fetchIconSvg: async (setId, name) => svgBody,
})

test('별칭 맵의 첫 후보가 있으면 그것을 색 보존으로 resolve', async () => {
  const deps = fakeDeps(new Set(['logos:google-icon']), '<svg>google</svg>')
  const r = await resolveVendorLogo({ vendor: 'google', deps })
  assert.equal(r.status, 'resolved')
  assert.equal(r.source, 'logos:google-icon')
  assert.equal(r.svg, '<svg>google</svg>')
})

test('첫 후보가 없으면 다음 후보(simple-icons)로 폴백', async () => {
  const deps = fakeDeps(new Set(['simple-icons:naver']))
  const r = await resolveVendorLogo({ vendor: 'naver', deps })
  assert.equal(r.status, 'resolved')
  assert.equal(r.source, 'simple-icons:naver')
})

test('대소문자 무시', async () => {
  const deps = fakeDeps(new Set(['logos:github-icon']))
  const r = await resolveVendorLogo({ vendor: 'GitHub', deps })
  assert.equal(r.status, 'resolved')
})

test('override(set:name)가 별칭 맵보다 우선', async () => {
  const deps = fakeDeps(new Set(['logos:toss']))
  const r = await resolveVendorLogo({ vendor: 'toss', override: 'logos:toss', deps })
  assert.equal(r.status, 'resolved')
  assert.equal(r.source, 'logos:toss')
})

test('미지의 벤더(별칭 없음, override 없음)는 escalate', async () => {
  const deps = fakeDeps(new Set())
  const r = await resolveVendorLogo({ vendor: 'daangn', deps })
  assert.equal(r.status, 'escalate')
  assert.equal(r.reason, 'unknown-vendor')
})

test('후보는 있으나 Iconify에 전부 없으면 escalate + tried 목록', async () => {
  const deps = fakeDeps(new Set())
  const r = await resolveVendorLogo({ vendor: 'google', deps })
  assert.equal(r.status, 'escalate')
  assert.equal(r.reason, 'not-on-iconify')
  assert.deepEqual(r.tried, VENDOR_CANDIDATES.google)
})
```

- [ ] **Step 2: 테스트 실행 — 실패 확인**

Run: `node --test tests/design-html-prototype/fetch-vendor-logo.test.mjs`
Expected: FAIL (모듈 `fetch-vendor-logo.mjs` 없음 → ERR_MODULE_NOT_FOUND).

- [ ] **Step 3: 구현 작성**

`skills/design-html-prototype/scripts/fetch-vendor-logo.mjs`:

```js
// 벤더 브랜드 마크를 Iconify(logos/simple-icons)에서 색 보존 SVG로 조달한다.
// 흔한 로그인 제공자는 별칭 후보로, 그 외는 set:name 오버라이드로 해소하고,
// Iconify에 없으면 escalate를 반환한다(트레이드마크는 생성하지 않는다).
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  fetchIconSvg as realFetch,
  iconExists as realExists,
} from '../../../scripts/lib/iconify-client.mjs'

// 우선순위: 다색 logos 먼저, 단색 simple-icons 폴백.
export const VENDOR_CANDIDATES = {
  google: ['logos:google-icon', 'simple-icons:google'],
  github: ['logos:github-icon', 'simple-icons:github'],
  apple: ['logos:apple', 'simple-icons:apple'],
  kakao: ['logos:kakaotalk', 'simple-icons:kakaotalk'],
  naver: ['logos:naver', 'simple-icons:naver'],
  facebook: ['logos:facebook', 'simple-icons:facebook'],
  x: ['logos:x', 'simple-icons:x'],
  microsoft: ['logos:microsoft-icon', 'simple-icons:microsoft'],
}

const parseRef = (ref) => {
  const [setId, name] = ref.split(':')
  return { setId, name }
}

export async function resolveVendorLogo({ vendor, override, deps = {} }) {
  const iconExists = deps.iconExists || realExists
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const key = (vendor || '').toLowerCase()
  const candidates = override ? [override] : VENDOR_CANDIDATES[key] || []
  if (candidates.length === 0) {
    return { status: 'escalate', vendor: key, reason: 'unknown-vendor', tried: [] }
  }
  for (const ref of candidates) {
    const { setId, name } = parseRef(ref)
    if (await iconExists(setId, name, deps)) {
      const svg = await fetchIconSvg(setId, name, deps)
      return { status: 'resolved', vendor: key, source: ref, svg }
    }
  }
  return { status: 'escalate', vendor: key, reason: 'not-on-iconify', tried: candidates }
}

export async function writeVendorLogo({ vendor, override, outPath, deps = {} }) {
  const result = await resolveVendorLogo({ vendor, override, deps })
  if (result.status === 'resolved') {
    await mkdir(dirname(outPath), { recursive: true })
    await writeFile(outPath, result.svg, 'utf8')
    result.path = outPath
  }
  return result
}

// CLI: node fetch-vendor-logo.mjs --vendor google --out <abs path> [--ref set:name]
// 결과를 JSON 한 줄로 stdout에 출력(스킬이 manifest로 수집). escalate면 exit 3.
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i]?.replace(/^--/, '')
    if (k) out[k] = argv[i + 1]
  }
  return out
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]
if (isCli) {
  const a = parseArgs(process.argv.slice(2))
  const result = await writeVendorLogo({ vendor: a.vendor, override: a.ref, outPath: a.out })
  const { svg, ...meta } = result
  process.stdout.write(JSON.stringify(meta) + '\n')
  if (result.status !== 'resolved') process.exit(3)
}
```

- [ ] **Step 4: 테스트 실행 — 통과 확인**

Run: `node --test tests/design-html-prototype/fetch-vendor-logo.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: 커밋**

```bash
git add skills/design-html-prototype/scripts/fetch-vendor-logo.mjs tests/design-html-prototype/fetch-vendor-logo.test.mjs
git commit -m "feat(design-html-prototype): 벤더 마크 색 보존 조달 스크립트" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `design-html-prototype` SKILL.md — 빌드 전 자산 갭 패스 명문화

스킬이 빌드 전에 자산 갭을 해소하도록 입력/흐름/위임/금지 항목을 갱신한다. 코드 테스트는 없고 문서 편집이다.

**Files:**
- Modify: `skills/design-html-prototype/SKILL.md`

- [ ] **Step 1: 입력 파일 절에 comp 기준 + 매니페스트 산출 추가**

`## 입력 파일 (대상 프로젝트 cwd 기준)` 섹션의 마지막(`manifest.json` 줄) 바로 뒤에 아래 단락을 추가한다.

```markdown

권위 기준은 `DESIGN.md`/브랜드 토큰이다. 생성 comp(`.design/assets/**` 또는 `candidate/**`의 풀페이지 목업 PNG)는 gpt-image 산출물이라 **정답이 아니라 불완전한 한 해석**이다 — 레이아웃·자산 위치의 *참고*로만 쓰고, 충실 기준은 항상 `DESIGN.md`다.
```

- [ ] **Step 2: 자산 갭 해소 섹션 신규 추가**

`## 섹션 구조` 섹션 바로 앞에 아래 섹션을 통째로 삽입한다.

```markdown
## 자산 갭 해소 (빌드 전)

comp를 충실히 구현하려면 `.design/assets/`에 없는 자산이 필요할 수 있다(타사 브랜드 마크·hero/카드 등 콘텐츠 이미지). web-publisher는 "이미 만들어진 자산만 소비"하므로, 조달은 **이 스킬이 빌드 전에** 끝낸다. 갈림 축은 자산 *종류*가 아니라 **가용성**이다.

1. **슬롯 열거** — comp + `DESIGN.md` + 섹션 구조를 읽어 `.design/assets/`에 없는 필요 자산을 슬롯으로 나열한다.
2. **슬롯별 해소(cascade):**

   | 슬롯 종류 | 해소 |
   |---|---|
   | 제품 UI 글리프 | 이미 `.design/assets/icon/*.svg`에 있음 → 그대로 참조 |
   | 벤더 브랜드 마크 | `scripts/fetch-vendor-logo.mjs --vendor <name> --out <cwd>/.design/assets/vendor/<name>.svg` (필요 시 `--ref <set:name>`). `resolved`면 색 보존 SVG 저장, `escalate`면 **사람에게 직접 제공 요청**(gpt-image로 로고 생성 금지) |
   | 콘텐츠 이미지 (hero·키비주얼·카드 아트) | `image-gen`으로 생성, 프롬프트 권위 기준은 `DESIGN.md` 토큰(comp는 `--image` 참고로만). `--out <cwd>/.design/assets/content/<slot>.<ext>`. `OPENAI_API_KEY`가 없으면 → 토큰 그라디언트 **라벨 플레이스홀더 + gap 로그** |

3. **매니페스트 기록** — `.design/assets/manifest.json`에 슬롯별 `{ id, type, source, path, status }`를 기록한다.
   - `type`: `vendor` | `content` | `glyph`
   - `source`: `iconify:<set>:<name>` | `image-gen` | `placeholder` | `escalate`
   - `status`: `resolved` | `placeholder` | `escalate`
4. **검수 게이트** — 조달된 자산(fetch된 로고·생성 이미지·플레이스홀더·에스컬레이션)을 사람이 확인한다. 미해결(escalate)이 있으면 진행 전에 사람이 자산을 제공한다.

> `.design/assets/`엔 designer가 *저작한* 자산(brand-kit·logo·icon·page)이 있다. 조달분은 `vendor/`·`content/` **전용 하위 폴더에만** 쓰고, 저작 자산을 덮어쓰지 않는다.
```

- [ ] **Step 3: 흐름(리뷰 게이트) 절을 갱신**

`## 흐름 (리뷰 게이트)`의 번호 목록 전체를 아래로 교체한다.

```markdown
1. `DESIGN.md`·`.design/brand-tokens.json`·생성 이미지(comp)를 읽어 위 스펙(출력 경로·섹션 구조)을 정한다.
2. **자산 갭 해소(빌드 전)** — 위 "자산 갭 해소" 절대로 슬롯을 열거·조달하고 `.design/assets/manifest.json`을 기록한다. 검수 게이트에서 사람이 확인하고, escalate가 있으면 자산을 제공받는다.
3. web-publisher에 위임해 `prototype/index.html`을 빌드+QA한다 — **매니페스트(슬롯↔파일 경로)와 함께** 넘긴다.
4. 사람이 브라우저로 확인한다.
5. 마음에 안 들면 스펙·자산을 고쳐 web-publisher로 다시 빌드한다(3~4 반복).
6. 더 손볼 게 있으면 `DESIGN.md`나 토큰을 고쳐 `design-md-compiler`·이 스킬을 다시 돌리거나, 만족하면 **실제 구현으로 진행**하도록 안내한다.
```

- [ ] **Step 4: HTML 산출 위임 절에 매니페스트 핸드오프 한 줄 추가**

`## HTML 산출 위임 (web-publisher)`의 첫 번째 불릿(`web-publisher를 직접 디스패치할 수 있으면…`) 바로 뒤에 아래 불릿을 추가한다.

```markdown
- 위임 시 **`.design/assets/manifest.json`을 함께 넘겨** "어느 슬롯을 어느 파일로 채울지" 알린다. web-publisher가 매니페스트 밖 자산 갭을 만나면 손으로 지어내지 말고 보고하게 한다(아래 web-publisher 계약).
```

- [ ] **Step 5: 금지 사항에 한 줄 추가**

`## 금지 사항`의 마지막 불릿 뒤에 아래를 추가한다.

```markdown
- 타사 브랜드 마크를 손으로 흉내내거나 image-gen으로 생성하지 않는다 — Iconify fetch, 없으면 사람 에스컬레이션.
```

- [ ] **Step 6: 변경 확인**

Run: `node --test "tests/**/*.test.mjs"`
Expected: 전체 PASS (문서 편집이라 회귀 없음 — 더해진 테스트만 통과 유지). 그리고 `skills/design-html-prototype/SKILL.md`를 Read로 훑어 삽입한 4개 섹션이 의도대로 들어갔는지 눈으로 확인.

- [ ] **Step 7: 커밋**

```bash
git add skills/design-html-prototype/SKILL.md
git commit -m "feat(design-html-prototype): 빌드 전 자산 갭 해소 패스·검수 게이트 명문화" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: web-publisher.md — "갭은 지어내지 말고 보고" 계약 추가

**Files:**
- Modify: `agents/web-publisher.md`

- [ ] **Step 1: 입력 절에 조달 자산 + 매니페스트 추가**

`## 입력 (대상 프로젝트 cwd)`에서 `- \`.design/assets/**\`(확정 이미지) → 없으면 \`.design/candidate/**\`` 줄 바로 뒤에 아래 두 줄을 추가한다.

```markdown
- `.design/assets/vendor/*.svg`·`.design/assets/content/*`(상위 스킬이 빌드 전 조달한 타사 마크·콘텐츠 이미지)
- `.design/assets/manifest.json`(있으면) — 어느 슬롯을 어느 파일로 채울지의 권위 매핑
```

- [ ] **Step 2: "하지 않을 것" 절에 계약 불릿 추가**

`## 하지 않을 것`의 마지막 불릿 뒤에 아래를 추가한다.

```markdown
- 매니페스트 밖 자산 갭을 만나면 손으로 지어내거나 트레이드마크를 흉내내지 않는다 — **멈춰 보고**해 상위 스킬의 자산 갭 패스로 되돌린다.
```

- [ ] **Step 3: 생성물(codex-agents) 재생성**

Run: `npm run sync`
Expected: 성공. `scripts/sync-agents.mjs`가 `codex-agents/web-publisher.toml`을 재생성한다(gitignore된 로컬 생성물 — 커밋하지 않음).

- [ ] **Step 4: 커밋 (소스만)**

```bash
git add agents/web-publisher.md
git commit -m "feat(web-publisher): 매니페스트 밖 자산 갭은 보고(지어내기 금지) 계약" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: 전체 검증 + 번들 동기화

**Files:** (없음 — 검증/동기화)

- [ ] **Step 1: 전체 테스트 스위트 실행**

Run: `npm test`
Expected: 전체 PASS. 실패 시 해당 Task로 돌아가 수정.

- [ ] **Step 2: Codex 번들 재생성 검증 (로컬 생성물)**

Run: `npm run sync`
Expected: 성공. 이동된 `scripts/lib/iconify-client.mjs`가 번들(`plugins/personal/scripts/lib/`)에 복사되고, `plugins/personal/skills/design-iconset/scripts/`의 import(`../../../scripts/lib/...`)가 번들 내에서 해소되는지 확인. `plugins/personal/`·`codex-agents/`는 gitignore라 커밋하지 않는다.

- [ ] **Step 3: 작업 트리 클린 확인**

Run: `git status --short`
Expected: 추적 대상 변경 없음(생성물은 gitignore). 남은 추적 변경이 있으면 의도된 것인지 확인 후 커밋.

---

## Self-Review

**1. Spec coverage** (스펙 `2026-06-07-html-prototype-asset-gap-design.md` 대조):
- 핵심 원칙 1(comp=참고, DESIGN.md=권위) → Task 3 Step 1·2(cascade 콘텐츠 행). ✓
- 원칙 2(가용성 기반 분기) → Task 2 `resolveVendorLogo` 후보 probe + Task 3 cascade. ✓
- 원칙 3(트레이드마크 생성 금지·에스컬레이션) → Task 2 `escalate` + Task 3 Step 5 금지. ✓
- 원칙 4(빌드 전 1회·검수 게이트) → Task 3 Step 2(4. 검수 게이트)·Step 3 흐름. ✓
- 흐름(갭 패스→게이트→매니페스트 위임) → Task 3 Step 2·3·4. ✓
- cascade 표(글리프/벤더/콘텐츠) → Task 3 Step 2 표. ✓
- 저장 경로(vendor/·content/·manifest.json, 저작자산 비훼손) → Task 3 Step 2 표·인용구. ✓
- web-publisher 계약 → Task 4. ✓
- 스크립트 G(iconify-client 승격 + fetch-vendor-logo) → Task 1·2. ✓
- 버린 대안(post-hoc vision-diff) → 계획에 해당 작업 없음(의도적 부재). ✓

**2. Placeholder scan:** TBD/TODO 없음. 모든 코드 스텝에 실제 코드 포함. 문서 편집 스텝은 삽입할 실제 markdown 포함. ✓

**3. Type consistency:** `resolveVendorLogo`/`writeVendorLogo` 반환 `{ status, vendor, source?, svg?, tried?, reason?, path? }` — 테스트(Step 1)와 구현(Step 3)·매니페스트 `source`/`status` 명칭 일치. `VENDOR_CANDIDATES` export명 테스트·구현 일치. import 경로 `../../../scripts/lib/iconify-client.mjs`가 Task 1 이동 결과와 일치. ✓
