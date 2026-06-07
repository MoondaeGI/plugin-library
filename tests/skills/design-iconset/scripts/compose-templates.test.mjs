import { test } from 'node:test'
import assert from 'node:assert/strict'
import { innerSvg, wrap24, knockoutMask, reticleCorners } from '../../../../skills/design-iconset/scripts/compose-templates/index.mjs'

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
