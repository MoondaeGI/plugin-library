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
