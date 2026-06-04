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

test('style 속성 안의 fill/stroke 색도 currentColor로, 다른 style prop 보존', () => {
  const input = '<svg viewBox="0 0 24 24"><path style="fill:#ff0000;stroke-width:2;opacity:0.2"/></svg>'
  const out = normalizeSvg(input)
  assert.doesNotMatch(out, /#ff0000/)
  assert.match(out, /fill:currentColor/)
  assert.match(out, /stroke-width:2/)
  assert.match(out, /opacity:0\.2/)
})

test('style 안 fill:none은 보존', () => {
  const out = normalizeSvg('<svg viewBox="0 0 24 24"><path style="fill:none;stroke:#000"/></svg>')
  assert.match(out, /fill:none/)
  assert.match(out, /stroke:currentColor/)
})
