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
