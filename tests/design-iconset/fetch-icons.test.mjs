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
