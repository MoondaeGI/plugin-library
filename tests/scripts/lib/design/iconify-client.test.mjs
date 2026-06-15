import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchIconSvg, iconExists, fetchSetInfo } from '../../../../scripts/lib/design/iconify-client.mjs'

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

test('fetchSetInfo는 실제 API 형태(data.info)를 파싱', async () => {
  const body = JSON.stringify({
    prefix: 'ph',
    title: 'Phosphor',
    info: { name: 'Phosphor Icons', license: { title: 'MIT', spdx: 'MIT', url: 'https://example.com/LICENSE' } }
  })
  const info = await fetchSetInfo('ph', { fetchFn: okFetch(body) })
  assert.equal(info.license, 'MIT')
  assert.equal(info.name, 'Phosphor Icons')
  assert.equal(info.licenseUrl, 'https://example.com/LICENSE')
})
