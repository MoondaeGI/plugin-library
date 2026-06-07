import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIconMap, validateMap } from '../../../../skills/design-iconset/scripts/build-icon-map.mjs'

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
