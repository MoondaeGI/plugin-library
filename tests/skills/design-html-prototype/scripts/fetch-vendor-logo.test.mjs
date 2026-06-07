import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveVendorLogo, VENDOR_CANDIDATES } from '../../../../skills/design-html-prototype/scripts/fetch-vendor-logo.mjs'

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
