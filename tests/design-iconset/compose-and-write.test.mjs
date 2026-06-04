import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { composeAndWrite } from '../../skills/design-iconset/scripts/compose-and-write.mjs'
import { compose } from '../../skills/design-iconset/scripts/compose.mjs'

test('여러 아이템 합성 시 mask id가 충돌하지 않음', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'compose-uniq-'))
  await composeAndWrite({
    setId: 'ph',
    items: [
      { name: 'alpha', mode: 'M1-affix', base: 'ph:a', overlay: 'ph:warn', label: 'A' },
      { name: 'beta',  mode: 'M1-affix', base: 'ph:b', overlay: 'ph:warn', label: 'B' },
    ],
    outDir: dir,
    deps: {
      fetchIconSvg: async (set, n) => `<svg viewBox="0 0 24 24"><path id="${n}"/></svg>`,
      normalizeSvg: (s) => s,
      // compose NOT stubbed → real compose runs, real ko-<name> mask ids
    },
  })
  const a = await readFile(join(dir, 'alpha.svg'), 'utf8')
  const b = await readFile(join(dir, 'beta.svg'), 'utf8')
  assert.match(a, /id="ko-alpha"/)
  assert.match(b, /id="ko-beta"/)
})

test('합성물을 <name>.svg로 기록하고 custom 결정 반환', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'compose-'))
  const decisions = await composeAndWrite({
    setId: 'ph',
    items: [{ name: 'policy-violation', mode: 'M1-affix', base: 'ph:file-text', overlay: 'ph:warning', concept: '문서+경고', label: '정책 위반' }],
    outDir: dir,
    deps: {
      fetchIconSvg: async (set, n) => `<svg viewBox="0 0 24 24"><path id="${n}"/></svg>`,
      normalizeSvg: (s) => s,
      compose: ({ mode }) => `<svg viewBox="0 0 24 24"><!-- ${mode} --></svg>`,
    },
  })
  const out = await readFile(join(dir, 'policy-violation.svg'), 'utf8')
  assert.match(out, /M1-affix/)
  assert.deepEqual(decisions[0], {
    name: 'policy-violation', source: 'custom', mode: 'M1-affix',
    base: 'ph:file-text', overlay: 'ph:warning', concept: '문서+경고', label: '정책 위반',
  })
})
