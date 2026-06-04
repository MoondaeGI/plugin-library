# design-iconset 합성 엔진 (Plan 2: Composition Engine) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Plan 1의 정규화된 24그리드 SVG 위에서 부족(gap) 아이콘을 6모드 중 M1~M5로 결정적 합성하는 엔진과, 그 규율을 담은 skill-local reference를 추가하고 cascade ②에 배선한다.

**Architecture:** `compose.mjs`가 모드별로 base/overlay 24그리드 SVG를 받아 합성 SVG를 반환한다. 고정 스니펫(knockout mask·reticle corners)·헬퍼는 `compose-templates/index.mjs`. 합성물은 candidate에 기록되고 결정은 `build-icon-map.mjs`(Plan 1)의 custom 스키마(mode/base/overlay)로 흘러간다. 깊이는 currentColor opacity로만, 좌표계는 24그리드 통일.

**Tech Stack:** Node ESM(.mjs), `node --test`. Plan 1 산출물(`normalize.mjs`·`iconify-client.mjs`·`build-icon-map.mjs`)에 의존.

**선행:** Plan 1(소싱) 완료 — `skills/design-iconset/scripts/`에 `normalize.mjs`·`iconify-client.mjs`·`fetch-icons.mjs`·`build-icon-map.mjs` 존재, SKILL.md가 게이트 흐름으로 재작성됨.

---

## File Structure

**신규 스크립트** (`skills/design-iconset/scripts/`)
- `compose-templates/index.mjs` — 헬퍼(`innerSvg`·`wrap24`) + 고정 스니펫(`knockoutMask`·`reticleCorners`).
- `compose.mjs` — `compose({mode, baseSvg, overlaySvg, idSuffix}) -> svg`. 모드 디스패치(M1~M5).
- `compose-and-write.mjs` — gap 합성 오케스트레이터: base/overlay fetch→normalize→compose→candidate 기록 + custom 결정 반환.

**신규 문서**
- `skills/design-iconset/references/compose-modes.md` — 6모드·cascade·knockout 규칙·opacity 깊이·자동화 티어.

**수정**
- `skills/design-iconset/SKILL.md` — cascade ②를 "자동 합성(M1~M5)"으로 배선(Plan 1의 "Plan 2 예정" 주석 교체).

**테스트** (`tests/design-iconset/`) — `compose-templates.test.mjs`·`compose.test.mjs`·`compose-and-write.test.mjs`.

---

## Task 1: `compose-templates/index.mjs` — 헬퍼 + 고정 스니펫

**Files:**
- Create: `skills/design-iconset/scripts/compose-templates/index.mjs`
- Test: `tests/design-iconset/compose-templates.test.mjs`

`innerSvg(svg)`는 `<svg…>`와 `</svg>` 사이 콘텐츠를 반환. `wrap24(inner)`는 표준 root로 감쌈. `knockoutMask(id)`는 우하단 원을 도려내는 mask. `reticleCorners()`는 네 모서리 L자 마크 path 4개.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/compose-templates.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { innerSvg, wrap24, knockoutMask, reticleCorners } from '../../skills/design-iconset/scripts/compose-templates/index.mjs'

test('innerSvg는 루트 사이 콘텐츠만 반환', () => {
  assert.equal(innerSvg('<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>'), '<path d="M1 1"/>')
})

test('wrap24는 0 0 24 24 root로 감쌈', () => {
  const out = wrap24('<path/>')
  assert.match(out, /viewBox="0 0 24 24"/)
  assert.match(out, /<path\/>/)
  assert.match(out, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)
})

test('knockoutMask는 흰 rect + 검은 원(우하단)', () => {
  const m = knockoutMask('badge-x')
  assert.match(m, /<mask id="badge-x">/)
  assert.match(m, /<rect[^>]*fill="white"/)
  assert.match(m, /<circle[^>]*cx="19"[^>]*cy="19"[^>]*fill="black"/)
})

test('reticleCorners는 모서리 마크 4개', () => {
  const r = reticleCorners()
  assert.equal((r.match(/<path/g) || []).length, 4)
  assert.match(r, /stroke="currentColor"/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/compose-templates.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/compose-templates/index.mjs
// 합성용 헬퍼 + 고정 SVG 스니펫. 모든 좌표는 24그리드 기준.

const SVG_OPEN_RE = /<svg[^>]*>/i

export function innerSvg(svg) {
  const open = svg.match(SVG_OPEN_RE)
  if (!open) return svg.trim()
  const start = svg.indexOf(open[0]) + open[0].length
  const end = svg.lastIndexOf('</svg>')
  return svg.slice(start, end === -1 ? undefined : end).trim()
}

export function wrap24(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`
}

// 우하단 배지 자리를 base에서 도려내는 mask. (white=보임, black=숨김)
export function knockoutMask(id) {
  return `<mask id="${id}"><rect width="24" height="24" fill="white"/><circle cx="19" cy="19" r="6" fill="black"/></mask>`
}

// 탐지 느낌의 네 모서리 L자 마크.
export function reticleCorners() {
  const w = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  return [
    `<path d="M3 8V4a1 1 0 0 1 1-1h4" ${w}/>`,   // 좌상
    `<path d="M16 3h4a1 1 0 0 1 1 1v4" ${w}/>`,  // 우상
    `<path d="M21 16v4a1 1 0 0 1-1 1h-4" ${w}/>`,// 우하
    `<path d="M8 21H4a1 1 0 0 1-1-1v-4" ${w}/>`, // 좌하
  ].join('')
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/compose-templates.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/scripts/compose-templates/index.mjs tests/design-iconset/compose-templates.test.mjs
git commit -m "feat(design-iconset): add compose templates + helpers"
```

---

## Task 2: `compose.mjs` — M1 접사(배지) + 디스패치 골격

**Files:**
- Create: `skills/design-iconset/scripts/compose.mjs`
- Test: `tests/design-iconset/compose.test.mjs`

`compose({mode, baseSvg, overlaySvg, idSuffix})`. M1: base에 knockout mask 적용 + overlay를 우하단 ~42%로 배치.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/compose.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compose } from '../../skills/design-iconset/scripts/compose.mjs'

const BASE = '<svg viewBox="0 0 24 24"><path id="base" d="M4 3h12v18H4z"/></svg>'
const OVER = '<svg viewBox="0 0 24 24"><path id="over" d="M12 7v6"/></svg>'

test('M1-affix: knockout mask + 우하단 배지', () => {
  const out = compose({ mode: 'M1-affix', baseSvg: BASE, overlaySvg: OVER, idSuffix: 'x' })
  assert.match(out, /viewBox="0 0 24 24"/)
  assert.match(out, /<mask id="ko-x">/)            // knockout 적용
  assert.match(out, /mask="url\(#ko-x\)"/)
  assert.match(out, /id="base"/)                    // base 콘텐츠 포함
  assert.match(out, /id="over"/)                    // overlay 콘텐츠 포함
  assert.match(out, /scale\(0\.42\)/)               // 배지 스케일
  assert.match(out, /translate\(13\.92,13\.92\)/)   // 우하단 배치
})

test('알 수 없는 모드는 에러', () => {
  assert.throws(() => compose({ mode: 'M9', baseSvg: BASE }), /Unknown compose mode/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/compose.mjs
// gap 아이콘을 24그리드 base/overlay에서 결정적으로 합성한다.
// 입력 SVG는 normalize.mjs로 24그리드·currentColor 정규화돼 있다고 가정.
import { innerSvg, wrap24, knockoutMask, reticleCorners } from './compose-templates/index.mjs'

export function compose({ mode, baseSvg, overlaySvg, idSuffix = 'a' }) {
  const base = baseSvg ? innerSvg(baseSvg) : ''
  const over = overlaySvg ? innerSvg(overlaySvg) : ''

  switch (mode) {
    case 'M1-affix':   return wrap24(affix(base, over, idSuffix))
    default:
      throw new ComposeModeError(mode)
  }
}

// M1: base를 우하단 원으로 도려내고, overlay를 ~42%로 우하단에 배치.
function affix(baseInner, overInner, idSuffix) {
  const id = `ko-${idSuffix}`
  return [
    knockoutMask(id),
    `<g mask="url(#${id})">${baseInner}</g>`,
    `<g transform="translate(13.92,13.92) scale(0.42)">${overInner}</g>`,
  ].join('')
}

export class ComposeModeError extends Error {
  constructor(mode) {
    super(`Unknown compose mode: ${mode}`)
    this.name = 'ComposeModeError'
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/scripts/compose.mjs tests/design-iconset/compose.test.mjs
git commit -m "feat(design-iconset): add compose engine with M1 affix mode"
```

---

## Task 3: `compose.mjs` — M2 컨테이너 + M3 깊이쌍

**Files:**
- Modify: `skills/design-iconset/scripts/compose.mjs`
- Test: `tests/design-iconset/compose.test.mjs`

M2: base(컨테이너) + overlay(내부 글리프) 중앙 50%. M3: base(뒤, opacity 0.2·확대) + overlay(앞, 풀사이즈).

- [ ] **Step 1: 실패 테스트 추가**

`tests/design-iconset/compose.test.mjs`에 추가:
```js
test('M2-container: 내부 글리프 중앙 50%', () => {
  const out = compose({ mode: 'M2-container', baseSvg: BASE, overlaySvg: OVER })
  assert.match(out, /id="base"/)
  assert.match(out, /id="over"/)
  assert.match(out, /translate\(6,6\) scale\(0\.5\)/)
})

test('M3-depth: 뒤 글리프 opacity 0.2, 앞 글리프 풀', () => {
  const out = compose({ mode: 'M3-depth', baseSvg: BASE, overlaySvg: OVER })
  assert.match(out, /opacity="0\.2"/)
  assert.match(out, /id="base"/)  // 뒤
  assert.match(out, /id="over"/)  // 앞
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: FAIL — M2/M3 케이스가 Unknown mode로 throw.

- [ ] **Step 3: 구현 추가**

`compose.mjs`의 `switch`에 케이스 추가하고 함수 정의:
```js
    case 'M2-container': return wrap24(container(base, over))
    case 'M3-depth':     return wrap24(depthPair(base, over))
```
```js
// M2: base는 컨테이너 그대로, overlay를 중앙 50%로.
function container(baseInner, overInner) {
  return `${baseInner}<g transform="translate(6,6) scale(0.5)">${overInner}</g>`
}

// M3: base를 뒤(opacity 0.2·1.2배), overlay를 앞에 풀사이즈. 깊이는 색이 아니라 opacity.
function depthPair(backInner, frontInner) {
  return `<g opacity="0.2" transform="translate(-2.4,-2.4) scale(1.2)">${backInner}</g>${frontInner}`
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/scripts/compose.mjs tests/design-iconset/compose.test.mjs
git commit -m "feat(design-iconset): add M2 container + M3 depth-pair modes"
```

---

## Task 4: `compose.mjs` — M4 스택 + M5 레티클

**Files:**
- Modify: `skills/design-iconset/scripts/compose.mjs`
- Test: `tests/design-iconset/compose.test.mjs`

M4: base를 오프셋 복제(뒤+앞). M5: 네 모서리 reticle + base 중앙 62%.

- [ ] **Step 1: 실패 테스트 추가**

```js
test('M4-stack: base를 오프셋 복제(뒤+앞)', () => {
  const out = compose({ mode: 'M4-stack', baseSvg: BASE })
  assert.equal((out.match(/id="base"/g) || []).length, 2) // 두 번 등장
  assert.match(out, /translate\(3,-3\)/)
})

test('M5-reticle: 모서리 마크 4 + base 중앙 62%', () => {
  const out = compose({ mode: 'M5-reticle', baseSvg: BASE })
  assert.equal((out.match(/<path d="M3 8V4/g) || []).length, 1) // reticle 좌상 마크
  assert.match(out, /translate\(4\.56,4\.56\) scale\(0\.62\)/)
  assert.match(out, /id="base"/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: FAIL — M4/M5 Unknown mode.

- [ ] **Step 3: 구현 추가**

`switch`에 추가:
```js
    case 'M4-stack':   return wrap24(stack(base))
    case 'M5-reticle': return wrap24(reticle(base))
```
```js
// M4: 같은 글리프를 오프셋 복제. 앞 카피가 위에 와서 겹침이 깔끔히 가려짐.
function stack(baseInner) {
  return `<g transform="translate(3,-3)">${baseInner}</g>${baseInner}`
}

// M5: 탐지용 네 모서리 마크 + base 중앙 62%.
function reticle(baseInner) {
  return `${reticleCorners()}<g transform="translate(4.56,4.56) scale(0.62)">${baseInner}</g>`
}
```
`reticleCorners`는 이미 상단에서 import됨(Task 2의 import 줄에 포함). 누락 시 import에 추가.

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/compose.test.mjs`
Expected: PASS (6 tests).

- [ ] **Step 5: 전체 회귀**

Run: `npm test`
Expected: 전부 PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/design-iconset/scripts/compose.mjs tests/design-iconset/compose.test.mjs
git commit -m "feat(design-iconset): add M4 stack + M5 reticle modes"
```

---

## Task 5: `compose-and-write.mjs` — gap 합성 오케스트레이터

**Files:**
- Create: `skills/design-iconset/scripts/compose-and-write.mjs`
- Test: `tests/design-iconset/compose-and-write.test.mjs`

합성 결정 목록(`{name, mode, base, overlay?}`)을 받아 base/overlay를 fetch→normalize→compose→`candidate/icon/<name>.svg` 기록, build-icon-map용 custom 결정 배열 반환. fetch/normalize/compose는 주입.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/compose-and-write.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { composeAndWrite } from '../../skills/design-iconset/scripts/compose-and-write.mjs'

test('합성물을 <name>.svg로 기록하고 custom 결정 반환', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'compose-'))
  const decisions = await composeAndWrite({
    setId: 'ph',
    items: [{ name: 'policy-violation', mode: 'M1-affix', base: 'ph:file-text', overlay: 'ph:warning', concept: '문서+경고', label: '정책 위반' }],
    outDir: dir,
    deps: {
      fetchIconSvg: async (set, n) => `<svg viewBox="0 0 24 24"><path id="${n}"/></svg>`,
      normalizeSvg: (s) => s,
      compose: ({ mode }) => `<svg viewBox="0 0 24 24"><!-- ${mode} --></svg>`,
    },
  })
  const out = await readFile(join(dir, 'policy-violation.svg'), 'utf8')
  assert.match(out, /M1-affix/)
  assert.deepEqual(decisions[0], {
    name: 'policy-violation', source: 'custom', mode: 'M1-affix',
    base: 'ph:file-text', overlay: 'ph:warning', concept: '문서+경고', label: '정책 위반',
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/compose-and-write.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/compose-and-write.mjs
// gap 합성 결정을 실행해 candidate에 기록하고 build-icon-map용 custom 결정을 반환한다.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchIconSvg as realFetch } from './iconify-client.mjs'
import { normalizeSvg as realNormalize } from './normalize.mjs'
import { compose as realCompose } from './compose.mjs'

const refName = (ref) => (ref && ref.includes(':') ? ref.split(':')[1] : ref)

export async function composeAndWrite({ setId, items, outDir, deps = {} }) {
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const normalizeSvg = deps.normalizeSvg || realNormalize
  const compose = deps.compose || realCompose
  const decisions = []

  for (const item of items) {
    const baseSvg = normalizeSvg(await fetchIconSvg(setId, refName(item.base)))
    const overlaySvg = item.overlay
      ? normalizeSvg(await fetchIconSvg(setId, refName(item.overlay)))
      : undefined
    const svg = compose({ mode: item.mode, baseSvg, overlaySvg, idSuffix: item.name })
    await writeFile(join(outDir, `${item.name}.svg`), svg, 'utf8')

    const decision = { name: item.name, source: 'custom', mode: item.mode, base: item.base }
    if (item.overlay) decision.overlay = item.overlay
    if (item.concept) decision.concept = item.concept
    decision.label = item.label
    decisions.push(decision)
  }
  return decisions
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/compose-and-write.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: build-icon-map 연동 확인**

`build-icon-map.mjs`(Plan 1)의 `buildIconMap`은 `decisions`를 `{name: {...}}` 맵으로 받는다. `composeAndWrite` 반환은 배열이므로, SKILL.md 흐름에서 `Object.fromEntries(decisions.map(d => [d.name, d]))`로 합쳐 fetch 결정과 함께 넘긴다(Task 7에서 문서화). 별도 코드 변경 없음 — 인터페이스 호환 확인만.

- [ ] **Step 6: Commit**

```bash
git add skills/design-iconset/scripts/compose-and-write.mjs tests/design-iconset/compose-and-write.test.mjs
git commit -m "feat(design-iconset): add gap composition orchestrator"
```

---

## Task 6: `references/compose-modes.md` — 6모드·cascade·규율 문서

**Files:**
- Create: `skills/design-iconset/references/compose-modes.md`

- [ ] **Step 1: 파일 작성**

````markdown
# 합성 모드 (Composition Modes) — design-iconset 전용

세트(fetch)에 없는 **gap 아이콘**을 만들 때의 규율·모드·cascade. 모든 합성은 **정규화된 24그리드 base/overlay**(`normalize.mjs`) 위에서 `compose.mjs`가 결정적으로 수행한다. 권위 근거: `../references/design/icon/icon-rules.md §2/§3/§5`.

## 절대 규율

- **세트마다 backbone 1개**(주 합성 문법) + 접사(M1) 보조. M6은 hero 2~3개만. (one-family 보호)
- **깊이는 두 번째 색 금지** — stroke 굵기·간격·`currentColor` opacity로만(상태 아이콘 색 분기 제외).
- **합성 base는 반드시 그 세트의 글리프** — "세트가 전경"이 되게. 외부 형태를 끌어오지 않는다.
- 좌표계는 **24그리드 통일**(정규화 선행). 합성 후에도 viewBox `0 0 24 24`·`currentColor`.

## cascade (gap 처리 정책)

```
① 세트에 있음            → fetch (정규화)            [Plan 1]
② 없지만 본체+수정자 분해 → 합성 M1~M5 (compose.mjs)  [이 문서]
③ 단일 새 개념 / hero    → M6 저작 융합 (손저작, 2~3개)
④ 어느 쪽도 안 읽힘       → 가장 가까운 세트 아이콘 대체 + 플래그
```

## 6모드

| 모드 | id | 정체 | 자동화 | compose 입력 |
|---|---|---|---|---|
| M1 접사 | `M1-affix` | base + 우하단 배지(knockout) | 쉬움 | base + overlay |
| M2 컨테이너 | `M2-container` | base(틀) 안에 글리프 중앙 50% | 보통 | base + overlay |
| M3 깊이쌍 | `M3-depth` | 뒤(opacity 0.2·확대) + 앞 풀 | 쉬움~보통 | base(뒤) + overlay(앞) |
| M4 스택 | `M4-stack` | 같은 글리프 오프셋 복제 | 쉬움 | base |
| M5 레티클 | `M5-reticle` | 네 모서리 마크 + base 중앙 62% | 쉬움~보통 | base |
| M6 저작 융합 | (스크립트 없음) | 일부 path/네거티브/모프 — 손저작 | 어려움 | — |

- **모드 선택은 게이트3에서 gap마다 합의**해 `icon-map.json`의 `mode`로 기록된다.
- M6은 자동화 대상이 아니다 — `compose.mjs`에 없고, 세트를 레퍼런스로 손저작한다. 네거티브 스페이스는 even-odd fill-rule로 제한(boolean 연산 회피).

## knockout(배지 분리)

M1 배지는 base 위에 그냥 얹으면 stroke가 겹쳐 안 읽힌다. `compose-templates/knockoutMask`가 우하단 원(cx19·cy19·r6)을 base에서 도려내 clear-space를 만든다. mask id는 아이콘명으로 유니크화(시트에 여러 개 인라인해도 충돌 없음).

## 검증

합성물도 `icon-rules.md §5`의 One-Color·Small UI 테스트를 통과해야 한다. 특히 16px에서 배지·내부 글리프가 뭉개지지 않는지 시트로 확인.
````

- [ ] **Step 2: 회귀 확인**

Run: `npm test`
Expected: 통과 유지(문서).

- [ ] **Step 3: Commit**

```bash
git add skills/design-iconset/references/compose-modes.md
git commit -m "docs(design-iconset): add composition modes reference"
```

---

## Task 7: `SKILL.md` — cascade ② 자동 합성 배선

**Files:**
- Modify: `skills/design-iconset/SKILL.md`

Plan 1에서 cascade ②에 남긴 "자동 합성 엔진은 Plan 2 예정" 주석을 실제 배선으로 교체한다.

- [ ] **Step 1: cascade ② 항목 교체**

Phase 2의 cascade에서 아래 줄을
```markdown
   - ② **없으면 합성(M1~M5)** — *자동 합성 엔진은 Plan 2 예정.* 그전까지는 ③/④로 처리.
```
다음으로 교체:
```markdown
   - ② **없으면 합성(M1~M5)** — 게이트3에서 gap마다 합의한 `mode`로 `scripts/compose-and-write.mjs`가 base/overlay를 fetch→정규화→`compose.mjs` 합성→`candidate/icon/<name>.svg` 기록. 모드·규율은 `references/compose-modes.md`.
```

- [ ] **Step 2: 게이트3에 모드 합의 명시**

게이트3 줄에 mode 합의를 추가:
```markdown
5. **게이트3 — 조건부 메타포·모드**: `fetched`는 자동(생략), `ambiguous`는 가벼운 확인, `gap`만 concept→metaphor→**합성 모드(M1~M5 중) 합의**(`references/compose-modes.md`). hero는 M6 손저작.
```

- [ ] **Step 3: lock 단계에 결정 병합 명시**

lock(9번) 단계에 한 줄 추가:
```markdown
   - icon-map 입력 = fetch 결정 + `composeAndWrite` custom 결정을 `Object.fromEntries(decisions.map(d => [d.name, d]))`로 병합해 `build-icon-map.mjs`에 전달.
```

- [ ] **Step 4: 회귀 확인**

Run: `npm test`
Expected: 통과 유지.

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/SKILL.md
git commit -m "feat(design-iconset): wire automatic composition into cascade ②"
```

---

## Task 8: sync + 번들 반영 + 최종 검증

- [ ] **Step 1: sync 실행 (사용자 승인 후)**

> 사용자 승인 필요. 승인 후:
Run: `npm run sync`
Expected: `plugins/personal/`에 `compose.mjs`·`compose-templates/`·`compose-and-write.mjs`·`compose-modes.md`·갱신 SKILL.md 반영. 에러 없음.

- [ ] **Step 2: 번들 포함 확인**

Glob로 `plugins/personal/skills/design-iconset/scripts/compose.mjs`·`compose-templates/index.mjs`·`compose-and-write.mjs`와 `references/compose-modes.md` 존재 확인.
Expected: 전부 존재.

- [ ] **Step 3: 전체 테스트**

Run: `npm test`
Expected: Plan 1·2 테스트 전부 PASS.

- [ ] **Step 4: 합성 스모크 (조립 end-to-end, 네트워크)**

Run:
```bash
node -e "import('./skills/design-iconset/scripts/compose.mjs').then(async m => { const { fetchIconSvg } = await import('./skills/design-iconset/scripts/iconify-client.mjs'); const { normalizeSvg } = await import('./skills/design-iconset/scripts/normalize.mjs'); const base = normalizeSvg(await fetchIconSvg('ph','file-text')); const over = normalizeSvg(await fetchIconSvg('ph','warning-circle')); const out = m.compose({mode:'M1-affix', baseSvg:base, overlaySvg:over, idSuffix:'demo'}); console.log(out.slice(0,200)); console.log('hasMask', out.includes('<mask'), 'vb24', out.includes('0 0 24 24')); })"
```
Expected: 합성 SVG 출력, `hasMask true`, `vb24 true`. (브라우저/시트에서 시각 확인 권장)

- [ ] **Step 5: Commit (커밋되는 생성물만)**

```bash
git add -A
git commit -m "chore(design-iconset): sync committed artifacts for composition engine"
```

---

## Self-Review

**Spec coverage (Plan 2 범위):**
- 6모드(M1~M5 자동·M6 손저작) → Task 2~4·6. ✓
- backbone 규율·currentColor opacity 깊이·세트 base 위 합성 → Task 6(compose-modes.md). ✓
- knockout 템플릿 → Task 1·2. ✓
- cascade ② 배선 → Task 7. ✓
- 모드를 게이트3에서 합의·icon-map `mode` 기록 → Task 5·7. ✓
- skill-local 배치(references/scripts) → 전 task 경로 준수. ✓
- M6 네거티브 even-odd 제한 → Task 6 문서. ✓

**Placeholder scan:** 모든 코드 step에 실제 코드/테스트. 추상 지시 없음.

**Type consistency:** `compose({mode, baseSvg, overlaySvg, idSuffix})`(Task2~4) ↔ `composeAndWrite`의 주입 `compose` 시그니처(Task5) 일치. `composeAndWrite` 반환 custom 결정 `{name, source:'custom', mode, base, overlay?, concept?, label}` ↔ Plan 1 `buildIconMap`의 custom 스키마(`source/mode/base/overlay/concept/label`) 일치. 모드 id 문자열(`M1-affix`·`M2-container`·`M3-depth`·`M4-stack`·`M5-reticle`)이 compose.mjs·compose-modes.md·테스트에서 동일. `innerSvg`/`wrap24`/`knockoutMask`/`reticleCorners`(Task1) ↔ compose.mjs import(Task2~4) 일치.

**Plan 1 의존 정합:** `normalize.mjs`·`iconify-client.mjs`·`build-icon-map.mjs`를 import/연동 — Plan 1 선행 필수(plan 헤더 명시).
