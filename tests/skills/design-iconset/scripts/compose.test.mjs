import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compose } from '../../../../skills/design-iconset/scripts/compose.mjs'

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

test('overlay 필요한 모드에 overlay 없으면 에러', () => {
  assert.throws(() => compose({ mode: 'M1-affix', baseSvg: BASE }), /MissingOverlayError|overlay/i)
})
