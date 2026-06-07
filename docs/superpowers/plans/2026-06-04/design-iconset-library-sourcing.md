# design-iconset 라이브러리 소싱 (Plan 1: 소싱 인프라) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `design-iconset`이 Iconify 단일 세트에서 아이콘을 fetch·정규화하고, 적중률을 측정하며, 모든 아이콘을 `icon-map.json`에 기록하도록 전환한다(합성 엔진은 Plan 2).

**Architecture:** 결정적 Node 스크립트(`skills/design-iconset/scripts/`)가 fetch·정규화·probe·icon-map 생성을 담당하고, SKILL.md는 얇은 오케스트레이션으로 게이트(G2 세트선택 / G2.5 적중률 / G3 조건부 메타포)를 호출한다. fetch는 Iconify HTTP API, 색/최적화 정규화는 `@iconify/tools`. 출력 계약(viewBox 0 0 24 24·currentColor·개별 .svg)은 불변.

**Tech Stack:** Node ESM(.mjs), `node --test`, `@iconify/tools`, Iconify HTTP API(`https://api.iconify.design`).

**범위 밖 (Plan 2):** `compose.mjs`·`compose-templates/`·`references/compose-modes.md`·cascade의 합성(M1~M5) 단계. Plan 1에서 gap 아이콘은 기존처럼 손저작(M6)/근사대체로 처리한다.

---

## File Structure

**신규 스크립트** (`skills/design-iconset/scripts/`)
- `normalize.mjs` — SVG를 24그리드·currentColor로 정규화. `normalizeSvg(svg) -> svg`.
- `iconify-client.mjs` — Iconify HTTP 접근. `fetchIconSvg(setId, name)`, `iconExists(setId, name)`, `fetchSetInfo(setId)`.
- `probe-set.mjs` — 리스트를 세트에 대조 분류. `classifyIcons({names, iconExists}) -> {fetched, ambiguous, gap, report}`.
- `fetch-icons.mjs` — 적중 아이콘을 정규화해 candidate에 기록. `fetchAndWrite({setId, names, outDir, deps}) -> written[]`.
- `build-icon-map.mjs` — candidate + 결정 사이드카에서 `icon-map.json` 재생성 + 1:1 정합 린트. `buildIconMap({iconDir, decisions, setInfo})`, `validateMap(map, presentFiles)`.

**테스트** (`tests/design-iconset/`) — 스크립트마다 `*.test.mjs`.

**문서 편집**
- 수정: `skills/references/design/icon/icon-reference-vendors.md`(용도 전환), `icon-style-catalog.md`(set-id 예시), `icon-rules.md`(§1/§4 재해석)
- 수정: `skills/design-iconset/references/iconset-sheet.md`(세트 기반 계약·fetch 흐름)
- 수정: `skills/design-iconset/SKILL.md`(frontmatter·게이트 흐름)
- 수정: `package.json`(`@iconify/tools` devDependency)

---

## Task 1: `@iconify/tools` 의존성 추가

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 의존성 설치**

Run: `npm install --save-dev @iconify/tools`
Expected: `package.json`의 `devDependencies`에 `@iconify/tools`가 추가되고 설치 성공.

- [ ] **Step 2: 설치 확인**

Run: `node -e "import('@iconify/tools').then(m => console.log(Object.keys(m).slice(0,5)))"`
Expected: 모듈 export 키 일부가 출력됨(에러 없음). 출력된 export 이름(`SVG`·`parseColors`·`runSVGO` 등)을 메모 — Task 2에서 정확한 시그니처를 context7로 확인할 때 대조용.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build(design-iconset): add @iconify/tools dependency"
```

---

## Task 2: `normalize.mjs` — 24그리드·currentColor 정규화

**Files:**
- Create: `skills/design-iconset/scripts/normalize.mjs`
- Test: `tests/design-iconset/normalize.test.mjs`

정규화 규칙: ① viewBox가 24×24가 아니면 내부 콘텐츠를 `<g transform="scale(24/W)">`로 감싸고 viewBox를 `0 0 24 24`로 교체(정사각 세트 가정). ② `fill`/`stroke`의 명시 색(`none`·`currentColor` 제외)을 `currentColor`로 치환하되 `opacity`는 보존. ③ 가능하면 SVGO 최적화.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/normalize.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeSvg } from '../../skills/design-iconset/scripts/normalize.mjs'

test('256 viewBox를 0 0 24 24로 재스케일', () => {
  const input = '<svg viewBox="0 0 256 256"><path d="M0 0h256v256H0z" fill="#000"/></svg>'
  const out = normalizeSvg(input)
  assert.match(out, /viewBox="0 0 24 24"/)
  assert.match(out, /scale\(0\.09375\)/) // 24/256
})

test('명시 hex 색을 currentColor로, opacity 보존', () => {
  const input = '<svg viewBox="0 0 24 24"><path fill="#123456"/><path fill="#000" opacity="0.2"/></svg>'
  const out = normalizeSvg(input)
  assert.doesNotMatch(out, /#123456/)
  assert.match(out, /currentColor/)
  assert.match(out, /opacity="0\.2"/)
})

test('이미 24 viewBox·currentColor면 색·viewBox 유지', () => {
  const input = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M1 1"/></svg>'
  const out = normalizeSvg(input)
  assert.match(out, /viewBox="0 0 24 24"/)
  assert.match(out, /currentColor/)
  assert.doesNotMatch(out, /scale\(/) // 재스케일 불필요
})

test('fill="none"은 보존', () => {
  const input = '<svg viewBox="0 0 24 24"><path fill="none" stroke="#000"/></svg>'
  const out = normalizeSvg(input)
  assert.match(out, /fill="none"/)
  assert.match(out, /stroke="currentColor"/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/normalize.test.mjs`
Expected: FAIL — `Cannot find module .../normalize.mjs`.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/normalize.mjs
// SVG를 출력 계약(viewBox 0 0 24 24, currentColor)으로 정규화한다.
// 색/최적화는 @iconify/tools가 본업이나, 재스케일·테스트 가능성을 위해
// 결정적 문자열 변환으로 구현한다. (SVGO 최적화는 선택적으로 적용)

const VIEWBOX_RE = /viewBox\s*=\s*"([\d.\-\s]+)"/i

export function normalizeSvg(svg) {
  let out = svg.trim()

  // ① 재스케일: 정사각 viewBox W가 24가 아니면 scale 래핑
  const vb = out.match(VIEWBOX_RE)
  if (vb) {
    const parts = vb[1].split(/\s+/).map(Number)
    const w = parts[2]
    if (w && w !== 24) {
      const factor = +(24 / w).toFixed(5)
      out = out
        .replace(VIEWBOX_RE, 'viewBox="0 0 24 24"')
        .replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/i,
          (_, open, inner, close) => `${open}<g transform="scale(${factor})">${inner}</g>${close}`)
    } else {
      out = out.replace(VIEWBOX_RE, 'viewBox="0 0 24 24"')
    }
  }

  // ② 색 → currentColor (none·currentColor 제외, opacity는 별도 속성이라 영향 없음)
  out = out.replace(/(fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|[a-zA-Z]+)"/g,
    (m, attr, val) => {
      const low = val.toLowerCase()
      if (low === 'none' || low === 'currentcolor') return m
      return `${attr}="currentColor"`
    })

  return out
}

// 선택적 SVGO 최적화(설치돼 있으면 적용, 아니면 그대로).
// @iconify/tools의 runSVGO 시그니처는 context7 mcp(@iconify/tools 문서)로 확인 후 사용.
export async function optimizeSvg(svg) {
  try {
    const { SVG, runSVGO } = await import('@iconify/tools')
    const obj = new SVG(svg)
    runSVGO(obj)
    return obj.toMinifiedString()
  } catch (ignored) {
    // @iconify/tools 미설치/시그니처 불일치 시 정규화만 적용 (최적화는 선택적)
    // 이 경로가 정상 흐름에 영향 없음을 확인 (2026-06-04)
    return svg
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/normalize.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: @iconify/tools 시그니처 확인**

context7 mcp로 `@iconify/tools`의 `SVG`·`runSVGO`·`parseColors` 정확한 import/시그니처를 확인하고 `optimizeSvg`의 호출부를 실제 API에 맞춘다. 확인 후 `node --test tests/design-iconset/normalize.test.mjs` 재실행 — Expected: PASS 유지(optimizeSvg는 테스트 대상 아님, 회귀 없음 확인).

- [ ] **Step 6: Commit**

```bash
git add skills/design-iconset/scripts/normalize.mjs tests/design-iconset/normalize.test.mjs
git commit -m "feat(design-iconset): add SVG normalize (24-grid + currentColor)"
```

---

## Task 3: `iconify-client.mjs` — Iconify HTTP 접근

**Files:**
- Create: `skills/design-iconset/scripts/iconify-client.mjs`
- Test: `tests/design-iconset/iconify-client.test.mjs`

네트워크 호출은 주입 가능한 `fetchFn`으로 감싸 테스트한다.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/iconify-client.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchIconSvg, iconExists, fetchSetInfo } from '../../skills/design-iconset/scripts/iconify-client.mjs'

const okFetch = (body, status = 200) => async () => ({
  status, ok: status >= 200 && status < 300,
  text: async () => body, json: async () => JSON.parse(body),
})

test('fetchIconSvg는 SVG 본문을 반환', async () => {
  const svg = await fetchIconSvg('ph', 'radar', { fetchFn: okFetch('<svg>radar</svg>') })
  assert.equal(svg, '<svg>radar</svg>')
})

test('iconExists는 200이면 true, 404면 false', async () => {
  assert.equal(await iconExists('ph', 'radar', { fetchFn: okFetch('<svg/>', 200) }), true)
  assert.equal(await iconExists('ph', 'nope', { fetchFn: okFetch('404', 404) }), false)
})

test('fetchSetInfo는 라이선스를 파싱', async () => {
  const body = JSON.stringify({ ph: { name: 'Phosphor', license: { title: 'MIT', spdx: 'MIT' } } })
  const info = await fetchSetInfo('ph', { fetchFn: okFetch(body) })
  assert.equal(info.license, 'MIT')
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/iconify-client.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/iconify-client.mjs
// Iconify 공개 HTTP API 접근(키 불필요). 네트워크는 fetchFn 주입으로 테스트.
const BASE = 'https://api.iconify.design'

const getFetch = (deps) => (deps && deps.fetchFn) || fetch

export async function fetchIconSvg(setId, name, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/${setId}/${name}.svg`)
  if (!res.ok) throw new IconNotFoundError(setId, name)
  return await res.text()
}

export async function iconExists(setId, name, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/${setId}/${name}.svg`)
  // 존재하지 않는 아이콘은 404. (Iconify는 미존재 시 404 반환)
  return res.ok
}

export async function fetchSetInfo(setId, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/collection?prefix=${setId}&info=true`)
  if (!res.ok) throw new Error(`set info fetch failed: ${setId}`)
  const data = await res.json()
  const entry = data[setId] || {}
  return {
    id: setId,
    name: entry.name || setId,
    license: (entry.license && (entry.license.spdx || entry.license.title)) || 'UNKNOWN',
    licenseUrl: entry.license && entry.license.url,
  }
}

export class IconNotFoundError extends Error {
  constructor(setId, name) {
    super(`Icon not found: ${setId}:${name}`)
    this.name = 'IconNotFoundError'
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/iconify-client.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: 실제 API 1회 확인 (수동)**

Run: `node -e "import('./skills/design-iconset/scripts/iconify-client.mjs').then(m=>m.iconExists('ph','radar')).then(console.log)"`
Expected: `true` (네트워크 필요). `collection?prefix=...&info=true` 응답 형태가 코드의 파싱과 맞는지 확인 — 다르면 `fetchSetInfo` 파싱 보정 후 Step 4 재실행.

- [ ] **Step 6: Commit**

```bash
git add skills/design-iconset/scripts/iconify-client.mjs tests/design-iconset/iconify-client.test.mjs
git commit -m "feat(design-iconset): add Iconify HTTP client"
```

---

## Task 4: `probe-set.mjs` — 적중률 분류 (G2.5)

**Files:**
- Create: `skills/design-iconset/scripts/probe-set.mjs`
- Test: `tests/design-iconset/probe-set.test.mjs`

각 아이콘 항목 `{name, candidates}`(candidates = 이름으로 만든 검색어/후보 id 배열)를 받아, `iconExists`로 대조해 분류한다: 후보 1개 적중→`fetched`, 2개 이상 적중→`ambiguous`, 0개→`gap`. 분류별 카운트 리포트 반환.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/probe-set.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyIcons } from '../../skills/design-iconset/scripts/probe-set.mjs'

// 존재하는 (set,name) 집합을 가진 가짜 iconExists
const fakeExists = (present) => async (setId, name) => present.has(name)

test('후보 1개만 적중하면 fetched', async () => {
  const exists = fakeExists(new Set(['magnifying-glass']))
  const r = await classifyIcons({
    setId: 'ph',
    items: [{ name: 'search', candidates: ['magnifying-glass', 'search'] }],
    iconExists: exists,
  })
  assert.equal(r.fetched.length, 1)
  assert.equal(r.fetched[0].icon, 'ph:magnifying-glass')
})

test('후보 2개 적중하면 ambiguous', async () => {
  const exists = fakeExists(new Set(['trash', 'x']))
  const r = await classifyIcons({
    setId: 'ph',
    items: [{ name: 'delete', candidates: ['trash', 'x'] }],
    iconExists: exists,
  })
  assert.equal(r.ambiguous.length, 1)
  assert.deepEqual(r.ambiguous[0].matches, ['ph:trash', 'ph:x'])
})

test('적중 0개면 gap', async () => {
  const exists = fakeExists(new Set())
  const r = await classifyIcons({
    setId: 'ph',
    items: [{ name: 'leak-detection', candidates: ['radar-leak'] }],
    iconExists: exists,
  })
  assert.equal(r.gap.length, 1)
})

test('report는 분류별 카운트', async () => {
  const exists = fakeExists(new Set(['a']))
  const r = await classifyIcons({
    setId: 'ph',
    items: [
      { name: 'x', candidates: ['a'] },        // fetched
      { name: 'y', candidates: ['none1'] },     // gap
    ],
    iconExists: exists,
  })
  assert.deepEqual(r.report, { total: 2, fetched: 1, ambiguous: 0, gap: 1 })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/probe-set.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/probe-set.mjs
// 리스트를 단일 세트에 대조해 fetched/ambiguous/gap으로 분류한다(G2.5).
// items: [{ name, candidates: string[] }]  (candidates = 라벨/메타포로 만든 후보 아이콘명)
export async function classifyIcons({ setId, items, iconExists }) {
  const fetched = [], ambiguous = [], gap = []

  for (const item of items) {
    const matches = []
    for (const cand of item.candidates) {
      if (await iconExists(setId, cand)) matches.push(`${setId}:${cand}`)
    }
    if (matches.length === 1) fetched.push({ name: item.name, icon: matches[0] })
    else if (matches.length > 1) ambiguous.push({ name: item.name, matches })
    else gap.push({ name: item.name })
  }

  return {
    fetched, ambiguous, gap,
    report: { total: items.length, fetched: fetched.length, ambiguous: ambiguous.length, gap: gap.length },
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/probe-set.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/scripts/probe-set.mjs tests/design-iconset/probe-set.test.mjs
git commit -m "feat(design-iconset): add set probe / hit-rate classifier"
```

---

## Task 5: `fetch-icons.mjs` — 적중분 정규화 기록

**Files:**
- Create: `skills/design-iconset/scripts/fetch-icons.mjs`
- Test: `tests/design-iconset/fetch-icons.test.mjs`

`fetched` 목록을 받아 각 아이콘 SVG를 fetch→`normalizeSvg`→`<outDir>/<name>.svg`로 기록. fetch/정규화는 주입.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/fetch-icons.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fetchAndWrite } from '../../skills/design-iconset/scripts/fetch-icons.mjs'

test('각 아이콘을 정규화해 <name>.svg로 기록', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'iconset-'))
  const written = await fetchAndWrite({
    setId: 'ph',
    fetched: [{ name: 'search', icon: 'ph:magnifying-glass' }],
    outDir: dir,
    deps: {
      fetchIconSvg: async () => '<svg viewBox="0 0 256 256"><path fill="#000" d="M1 1"/></svg>',
      normalizeSvg: (s) => s.replace('256 256', '24 24').replace('#000', 'currentColor'),
    },
  })
  assert.deepEqual(written, ['search.svg'])
  const out = await readFile(join(dir, 'search.svg'), 'utf8')
  assert.match(out, /viewBox="0 0 24 24"/)
  assert.match(out, /currentColor/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/fetch-icons.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/fetch-icons.mjs
// fetched 목록을 정규화해 candidate/icon/<name>.svg로 기록한다.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchIconSvg as realFetch } from './iconify-client.mjs'
import { normalizeSvg as realNormalize } from './normalize.mjs'

export async function fetchAndWrite({ setId, fetched, outDir, deps = {} }) {
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const normalizeSvg = deps.normalizeSvg || realNormalize
  const written = []

  for (const { name, icon } of fetched) {
    const iconName = icon.includes(':') ? icon.split(':')[1] : icon
    const raw = await fetchIconSvg(setId, iconName)
    const svg = normalizeSvg(raw)
    const file = `${name}.svg`
    await writeFile(join(outDir, file), svg, 'utf8')
    written.push(file)
  }
  return written
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/fetch-icons.test.mjs`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/scripts/fetch-icons.mjs tests/design-iconset/fetch-icons.test.mjs
git commit -m "feat(design-iconset): add fetch+normalize writer"
```

---

## Task 6: `build-icon-map.mjs` — icon-map 재생성 + 정합 린트

**Files:**
- Create: `skills/design-iconset/scripts/build-icon-map.mjs`
- Test: `tests/design-iconset/build-icon-map.test.mjs`

`decisions`(아이콘별 결정: iconify는 `{source:'iconify', icon, concept?, label}`, custom은 `{source:'custom', mode, base, overlay?, concept, label}`)와 `setInfo`로 `icon-map.json` 객체를 생성하고, 디렉터리의 실제 `.svg`와 1:1 정합을 검사한다.

- [ ] **Step 1: 실패 테스트 작성**

```js
// tests/design-iconset/build-icon-map.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIconMap, validateMap } from '../../skills/design-iconset/scripts/build-icon-map.mjs'

const setInfo = { id: 'ph', license: 'MIT' }
const decisions = {
  'search': { source: 'iconify', icon: 'ph:magnifying-glass', label: '검색' },
  'policy-violation': { source: 'custom', mode: 'M1-affix', base: 'ph:file-text', overlay: 'ph:warning-circle-fill', concept: '문서+경고', label: '정책 위반' },
}

test('set 1줄 라이선스 + 아이콘별 path 부여', () => {
  const map = buildIconMap({ decisions, setInfo })
  assert.deepEqual(map.set, { id: 'ph', license: 'MIT' })
  assert.equal(map.icons['search'].path, 'assets/icon/search.svg')
  assert.equal(map.icons['search'].source, 'iconify')
  assert.equal(map.icons['policy-violation'].mode, 'M1-affix')
})

test('iconify 항목엔 세트 라이선스를 반복하지 않음', () => {
  const map = buildIconMap({ decisions, setInfo })
  assert.equal('license' in map.icons['search'], false)
})

test('custom 항목엔 derived 라이선스 표기', () => {
  const map = buildIconMap({ decisions, setInfo })
  assert.match(map.icons['policy-violation'].license, /derived/i)
})

test('validateMap: map 키와 .svg 파일이 1:1이면 ok', () => {
  const map = buildIconMap({ decisions, setInfo })
  const r = validateMap(map, ['search.svg', 'policy-violation.svg'])
  assert.equal(r.ok, true)
})

test('validateMap: svg 누락이면 에러', () => {
  const map = buildIconMap({ decisions, setInfo })
  const r = validateMap(map, ['search.svg']) // policy-violation.svg 없음
  assert.equal(r.ok, false)
  assert.match(r.errors[0], /policy-violation/)
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/design-iconset/build-icon-map.test.mjs`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: 구현 작성**

```js
// skills/design-iconset/scripts/build-icon-map.mjs
// icon-map.json 객체를 결정 사이드카에서 결정적으로 생성한다(.svg가 소비 SSOT, map은 캐시).
export function buildIconMap({ decisions, setInfo }) {
  const icons = {}
  for (const [name, d] of Object.entries(decisions)) {
    const entry = { source: d.source, path: `assets/icon/${name}.svg`, label: d.label }
    if (d.concept) entry.concept = d.concept
    if (d.source === 'iconify') {
      entry.icon = d.icon
      // 세트 라이선스는 set 블록에만 — 반복하지 않음
    } else if (d.source === 'custom') {
      entry.mode = d.mode
      entry.base = d.base
      if (d.overlay) entry.overlay = d.overlay
      entry.license = `${setInfo.license} (derived from ${setInfo.id})`
    }
    icons[name] = entry
  }
  return { set: { id: setInfo.id, license: setInfo.license }, icons }
}

export function validateMap(map, presentFiles) {
  const errors = []
  const present = new Set(presentFiles)
  const expected = new Set()
  for (const [name, entry] of Object.entries(map.icons)) {
    const file = entry.path.split('/').pop()
    expected.add(file)
    if (!present.has(file)) errors.push(`map 항목 '${name}'에 대응하는 ${file} 없음`)
  }
  for (const f of present) {
    if (!expected.has(f)) errors.push(`.svg '${f}'에 대응하는 map 항목 없음`)
  }
  return { ok: errors.length === 0, errors }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `node --test tests/design-iconset/build-icon-map.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: 전체 테스트 회귀 확인**

Run: `npm test`
Expected: 신규 5개 파일 포함 전부 PASS.

- [ ] **Step 6: Commit**

```bash
git add skills/design-iconset/scripts/build-icon-map.mjs tests/design-iconset/build-icon-map.test.mjs
git commit -m "feat(design-iconset): add icon-map builder + 1:1 validator"
```

---

## Task 7: `icon-reference-vendors.md` → 세트 선택 카탈로그로 전환

**Files:**
- Modify: `skills/references/design/icon/icon-reference-vendors.md`

기존 "벤더명 쓰지 마, 눈 보정용"에서 "스타일↔실제 Iconify set-id↔라이선스 매핑"으로 용도를 바꾼다. 단 옛 "이미지 프롬프트에 벤더명 금지"는 brand-kit 이미지 생성에만 적용됨을 명시(삭제하지 않고 스코프 한정).

- [ ] **Step 1: 파일 전체를 아래 내용으로 교체**

````markdown
# 아이콘 세트 선택 카탈로그 (Icon Set Selection Catalog)

이 문서는 **`design-iconset`의 세트 선택(G2)용 카탈로그**다. §11 스타일을 실제 Iconify set-id로 잇는다. 단일 세트 원칙(프로젝트당 1개)에 따라 여기서 후보를 좁혀 1개를 lock한다.

> **스코프 주의:** 아래 set-id는 **iconset이 fetch 대상으로 실제 사용**한다. 반면 `design-brand-kit`의 *이미지 생성* 보드 아이콘은 여전히 "벤더명을 프롬프트에 쓰지 않는다"(이미지 모델은 'Linear처럼'을 못 그림). 즉 **벤더명 금지 규칙은 brand-kit 이미지 생성에만** 적용되고, iconset의 라이브러리 fetch에는 적용되지 않는다.

## 스타일 → 후보 세트

| §11 스타일(catalog) | 후보 Iconify set-id | 특징 | 라이선스 |
|---|---|---|---|
| Line / Outline | `lucide`, `tabler`, `ph`(regular) | 얇은 stroke, 차분, 정보밀도↑ | ISC / MIT / MIT |
| Filled | `ph`(fill), `material-symbols`(filled) | 강한 식별성, 작은 크기 | MIT / Apache-2.0 |
| Duotone | `ph`(duotone) | currentColor + opacity 2톤(단색 계약 호환) | MIT |
| Solid Glyph | `material-symbols`, `mdi` | 단단·컴팩트 | Apache-2.0 / Apache-2.0 |
| Outline + Minimal Fill | `tabler`, `ph` | 기능적 강조 | MIT / MIT |

## 선택 기준 (정성 점수화)

후보 세트를 다음으로 비교해 1개 lock:
- **스타일 적합** — §11 폼 규칙(stroke/join/corner)과 일치하는가.
- **라이선스** — MIT/Apache/ISC 우선(attribution 부담 최소). CC-BY는 attribution이 다운스트림까지 전파됨.
- **밀도/커버리지** — 제품 리스트(특히 도메인)를 얼마나 담는가. (G2.5 적중률 측정으로 확정)

## 주의
- 아이콘 단위로 세트를 넘나들지 않는다(one-family 붕괴). **세트는 1개.**
- 세트에 없는 도메인 아이콘은 그 세트를 레퍼런스로 합성/저작(Plan 2 / 손저작).
````

- [ ] **Step 2: 참조 무결성 확인**

Run: `node --test "tests/**/*.test.mjs"` 또는 `npm test`
Expected: 회귀 없음(이 문서는 코드 참조 없음 — 통과 유지).

다른 파일에서 옛 제목/문구를 참조하지 않는지 확인:
Run: grep으로 `icon-reference-vendors` 참조 위치 점검(Grep 툴 사용).
Expected: `icon-rules.md §0 ④`·`SKILL.md`·`iconset-sheet.md`가 이 파일을 가리킴 — Task 8/9/10에서 함께 갱신.

- [ ] **Step 3: Commit**

```bash
git add skills/references/design/icon/icon-reference-vendors.md
git commit -m "docs(design-iconset): repurpose vendors ref into set selection catalog"
```

---

## Task 8: `icon-style-catalog.md` — set-id 예시 주석 추가

**Files:**
- Modify: `skills/references/design/icon/icon-style-catalog.md`

각 스타일 항목에 실제 Iconify set-id 예시 한 줄을 덧붙여 §11→세트선택 다리를 만든다.

- [ ] **Step 1: 각 스타일 섹션 끝에 `[세트]` 줄 추가**

`## 1. Line / Outline` 섹션의 `- [적용]` 줄 **다음**에 추가:
```markdown
- [세트] `lucide` · `tabler` · `ph`(regular) — 후보는 `icon-reference-vendors.md` 카탈로그 참조.
```

`## 2. Filled` 섹션에 추가:
```markdown
- [세트] `ph`(fill) · `material-symbols`(filled).
```

`## 3. Duotone` 섹션에 추가:
```markdown
- [세트] `ph`(duotone) — currentColor + opacity라 단색 계약과 호환.
```

`## 4. Solid Glyph` 섹션에 추가:
```markdown
- [세트] `material-symbols` · `mdi`.
```

`## 5. Outline + Minimal Fill` 섹션에 추가:
```markdown
- [세트] `tabler` · `ph`.
```

- [ ] **Step 2: 회귀 확인**

Run: `npm test`
Expected: 통과 유지(문서 변경).

- [ ] **Step 3: Commit**

```bash
git add skills/references/design/icon/icon-style-catalog.md
git commit -m "docs(design-iconset): map catalog styles to Iconify set-ids"
```

---

## Task 9: `icon-rules.md` §1/§4 재해석 (라이브러리 허용)

**Files:**
- Modify: `skills/references/design/icon/icon-rules.md`

iconset이 라이브러리를 쓰므로 "무료 아이콘팩처럼 보이면 안 됨" 모순을 정정한다. brand-kit 이미지 생성용 규칙(§0/§6)은 건드리지 않는다.

- [ ] **Step 1: §1의 모순 줄 정정**

`## 1. 핵심 원칙 (범용)`에서 아래 줄을
```markdown
- 무료 아이콘팩을 그대로 붙인 것처럼 보이면 안 된다.
```
다음으로 교체:
```markdown
- (이미지 생성 시) 무료 아이콘팩을 그대로 붙인 것처럼 보이면 안 된다. **단 `design-iconset`은 라이브러리(Iconify) fetch를 정식 소스로 쓴다** — 이때 규칙은 "스톡처럼 보이지 마라"가 아니라 **"§11에 맞는 좋은 단일 세트를 고르고 도메인 아이콘만 커스텀하라"**로 적용한다.
```

- [ ] **Step 2: §4 Avoid에 스코프 주석 추가**

`## 4. 절대 피할 것 (Avoid)` 첫 줄(괄호 설명) 다음에 한 줄 추가:
```markdown
> **iconset 스코프:** 아래 Avoid는 **합성/저작하는 아이콘**에 적용한다. 라이브러리에서 fetch한 아이콘은 이미 일관된 세트라 대상이 아니다(단 세트 선택 시 클리셰·과밀 세트를 피하는 잣대로는 쓴다).
```

- [ ] **Step 3: 회귀 확인**

Run: `npm test`
Expected: 통과 유지.

- [ ] **Step 4: Commit**

```bash
git add skills/references/design/icon/icon-rules.md
git commit -m "docs(design-iconset): reinterpret rules §1/§4 for library sourcing"
```

---

## Task 10: `iconset-sheet.md` — 세트 기반 계약·fetch 흐름 반영

**Files:**
- Modify: `skills/design-iconset/references/iconset-sheet.md`

이 파일은 "가족 계약(§1)·시트 렌더(§3)·편집(§4)"을 담는다. §1 가족 계약을 "맨땅 저작 목표"에서 "fetch한 세트 + 정규화 + (합성) 계약"으로 바꾼다.

- [ ] **Step 1: 현재 내용 확인**

Read: `skills/design-iconset/references/iconset-sheet.md` 전체를 읽어 §1/§3/§4 구조 파악(이미 읽었으면 생략).

- [ ] **Step 2: §1(가족 계약)에 세트·정규화 항목 추가**

§1 가족 계약 설명 끝에 아래 블록을 추가(기존 불변/스타일 분기 규칙은 유지):
```markdown
### 세트 기반 계약 (라이브러리 소싱)
- **단일 세트 출처**: 모든 fetch 아이콘은 한 Iconify 세트(`icon-map.json`의 `set.id`)에서 온다.
- **정규화 불변**: 모든 .svg는 `normalize.mjs`로 viewBox `0 0 24 24`·`currentColor`로 통일된다(원본 좌표계 무관). 합성/저작 아이콘도 동일 24그리드에서 만들어 세트와 좌표·광학 무게를 맞춘다.
- **깊이**: 두 번째 색 금지 — stroke 굵기·간격·`currentColor` opacity로만(상태 아이콘 색 분기 제외).
```

- [ ] **Step 3: §3/§4 시트·편집 절에 출처 표기 추가**

§3(시트 렌더) 또는 §4(편집) 적절한 위치에 한 줄:
```markdown
- 시트는 `candidate/icon/*.svg`를 글롭 렌더하므로 **fetch·합성·저작 출처와 무관**하게 동일하게 동작한다. 출처는 `icon-map.json`이 기록한다.
```

- [ ] **Step 4: 회귀 확인**

Run: `npm test`
Expected: 통과 유지.

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/references/iconset-sheet.md
git commit -m "docs(design-iconset): set-based family contract + normalization in sheet ref"
```

---

## Task 11: `SKILL.md` — frontmatter·게이트 흐름 재작성

**Files:**
- Modify: `skills/design-iconset/SKILL.md`

흐름을 "리스트→메타포→맨땅저작"에서 "리스트→세트선택(G2)→적중률(G2.5)→조건부 메타포(G3)→fetch+정규화→(gap은 손저작/대체)→lock+icon-map"으로 바꾼다. 합성 자동화(M1~M5)는 **Plan 2** 예정이므로 cascade ②는 "현재 손저작/대체, 자동 합성은 후속"으로 명시한다.

- [ ] **Step 1: frontmatter description 갱신**

`description:`을 아래로 교체(요지: 라이브러리 소싱·단일 세트·정규화·icon-map·네트워크 전제):
```markdown
description: 확정된 brand kit를 바탕으로 제품 아이콘 세트를 Iconify 단일 세트에서 fetch해 만든다. §11 스타일로 후보 세트를 점수화해 1개 lock하고(게이트2), 리스트 적중률을 측정한 뒤(게이트2.5), 적중분은 viewBox 0 0 24 24·currentColor로 정규화해 가져오고 부족분만 합성/저작한다(게이트3은 부족분 메타포만 합의). 모든 아이콘을 icon-map.json에 기록하고 .design/assets/icon/으로 lock한다. 저작 시 네트워크 필요(api.iconify.design, 키 불필요), OPENAI_API_KEY 불필요.
```

- [ ] **Step 2: "흐름" 절을 새 게이트로 교체**

`## 흐름 (디자이너 협업 루프)` 절의 Phase 1/Phase 2를 아래로 교체(Phase 0 brand kit 감지는 유지):
```markdown
### Phase 1 — 리스트 → 세트 선택 → 적중률 → 조건부 메타포
1. **md/tokens 흡수**: §11·§6·§3·§4·§10·금지패턴 + tokens 색을 읽어 art direction 백본 고정.
2. **게이트1 — 목록**: 코어/도메인/상태 3분류로 아이콘 목록 확정(기존 유지).
3. **게이트2 — 세트 선택**: §11 스타일 → `references/design/icon/icon-style-catalog.md`·`icon-reference-vendors.md`로 후보 set-id 2~3개 → 후보의 동일 대표 아이콘을 `scripts/fetch-icons.mjs`로 가져와 비교 시트로 제시 → 스타일/라이선스/밀도로 점수화해 **단일 세트 lock**. backbone 합성 문법 1개 합의.
4. **게이트2.5 — 적중률 측정**: `scripts/probe-set.mjs`로 리스트를 세트에 대조 → 분류별 카운트 제시(코어/도메인/상태). 도메인 적중률이 낮으면 분기 제시: (a) 다른 세트 (b) 합성 진행 (c) 도메인 손저작 유지. **세트 go/no-go.**
5. **게이트3 — 조건부 메타포**: `fetched`는 자동(생략), `ambiguous`는 가벼운 확인, `gap`만 concept→metaphor(→mode) 합의.

### Phase 2 — fetch+정규화 → (부족분 처리) → 시트 검수 → lock
6. **fetch+정규화**: `scripts/fetch-icons.mjs`가 `fetched`/확정된 `ambiguous`를 가져와 `normalize.mjs`로 24그리드·currentColor 정규화해 `candidate/icon/*.svg`로 기록.
7. **부족분(gap) 처리 — cascade**:
   - ① 세트에 있음 → fetch (위)
   - ② **없으면 합성(M1~M5)** — *자동 합성 엔진은 Plan 2 예정.* 그전까지는 ③/④로 처리.
   - ③ 단일 새 개념/hero → 세트를 레퍼런스로 손저작(`viewBox 0 0 24 24`·`currentColor`, 24그리드).
   - ④ 안 읽힘 → 가장 가까운 세트 아이콘 대체 + 플래그.
8. **시트 검수·편집**: `build-iconset-sheet.mjs`로 렌더 → `serve-design.mjs` 라이브 프리뷰 → 번호/이름 지목 외과 편집(기존). One-Color·Small UI·cross-icon 검사.
9. **lock**: `candidate/icon/*.svg` → `assets/icon/*.svg` 순수 복사. `scripts/build-icon-map.mjs`로 `assets/icon/icon-map.json` **재생성** + `validateMap`로 1:1 정합 확인(어긋나면 경고). overview 슬롯 주입(기존). 다운스트림(`design-ui-kit` 등)은 `assets/icon/*.svg`를 읽음. 라이브 서버 종료.
```

- [ ] **Step 3: "입력/출력 파일"·"SVG 저작 방식" 절 갱신**

출력 파일 트리에 `assets/icon/icon-map.json` 추가, "SVG 저작 방식"을 "fetch+정규화(@iconify/tools·`scripts/`) + 부족분 저작"으로 한 줄 수정. "이미지 생성·OPENAI_API_KEY 불필요"는 유지하고 "**저작 시 네트워크 필요**(api.iconify.design)" 한 줄 추가.

- [ ] **Step 4: 회귀 확인**

Run: `npm test`
Expected: 통과 유지.

- [ ] **Step 5: Commit**

```bash
git add skills/design-iconset/SKILL.md
git commit -m "feat(design-iconset): rewrite flow for library sourcing (G2/G2.5/G3)"
```

---

## Task 12: sync + 번들 반영 + 최종 검증

**Files:**
- (생성물) `plugins/personal/`·`codex-agents/` 등 — 직접 수정 금지, sync로 재생성

- [ ] **Step 1: sync 실행 (사용자 승인 후)**

> 사용자 승인 필요(명령 실행 규칙). 승인 후:
Run: `npm run sync`
Expected: `plugins/personal/`에 design-iconset 신규 `scripts/`·갱신 `SKILL.md`·refs가 반영됨. 에러 없음.

- [ ] **Step 2: 번들에 신규 스크립트 포함 확인**

Glob/Read로 `plugins/personal/skills/design-iconset/scripts/`에 `normalize.mjs`·`iconify-client.mjs`·`probe-set.mjs`·`fetch-icons.mjs`·`build-icon-map.mjs`가 있는지 확인.
Expected: 5개 모두 존재. (없으면 sync 스크립트의 글롭 범위 점검)

- [ ] **Step 3: 전체 테스트**

Run: `npm test`
Expected: 전부 PASS.

- [ ] **Step 4: 실제 1회 스모크 (네트워크)**

Run:
```bash
node -e "import('./skills/design-iconset/scripts/iconify-client.mjs').then(async m => { console.log('exists', await m.iconExists('ph','radar')); console.log('info', await m.fetchSetInfo('ph')); })"
```
Expected: `exists true` + `info { id:'ph', license:'MIT', ... }`. 라이선스 spdx가 코드 가정과 다르면 `fetchSetInfo` 보정.

- [ ] **Step 5: Commit (커밋되는 생성물만)**

```bash
git add -A
git commit -m "chore(design-iconset): sync committed generated artifacts for library sourcing"
```
> 주의: `plugins/personal/`·`codex-agents/`는 gitignore된 로컬 생성물이라 커밋되지 않음(정상). `.claude-plugin/mcp.json` 등 커밋되는 생성물만 스테이징됨.

---

## Self-Review

**Spec coverage (Plan 1 범위):**
- 단일 세트 원칙 → Task 7(카탈로그)·11(게이트2). ✓
- Iconify fetch(키 불필요) → Task 3·5. ✓
- viewBox 24·currentColor 정규화 → Task 2·5. ✓
- 적중률 측정 게이트(§6) → Task 4·11(G2.5). ✓
- 게이트 순서(메타포 fetch 뒤로, §1) → Task 11(G3). ✓
- icon-map(.svg=SSOT, lock 재생성, 전체기록, 세트 1줄 라이선스) → Task 6·11. ✓
- references 처리(vendors 전환·style-catalog·rules §1/§4·iconset-sheet) → Task 7~10. ✓
- @iconify/tools 활용 → Task 1·2. ✓
- **합성 엔진(6모드·compose.mjs·compose-modes.md·cascade ②)** → **Plan 2** (의도적 분리, Task 11에서 자리만 표시). 
- brand-kit 불변(§2 범위) → 어떤 task도 brand-kit·icon-rules §0/§6 건드리지 않음. ✓

**Placeholder scan:** 모든 코드 step에 실제 코드/테스트 포함. "@iconify/tools 시그니처 context7 확인"은 외부 라이브러리 검증 지시(동작은 테스트로 고정)이며 placeholder 아님.

**Type consistency:** `normalizeSvg`(Task2)→fetch-icons 주입(Task5) 일치. `iconExists`/`fetchIconSvg`/`fetchSetInfo`(Task3)→probe(Task4)·fetch(Task5)·build-map(Task6 setInfo) 시그니처 일치. `classifyIcons` 반환 `fetched[{name,icon}]`→`fetchAndWrite`의 `fetched` 입력 일치. `buildIconMap`/`validateMap` 일치.
