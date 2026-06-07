// gap 합성 결정을 실행해 candidate에 기록하고 build-icon-map용 custom 결정을 반환한다.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchIconSvg as realFetch } from '../../../scripts/lib/iconify-client.mjs'
import { normalizeSvg as realNormalize } from './normalize.mjs'
import { compose as realCompose } from './compose.mjs'

const refName = (ref) => (ref && ref.includes(':') ? ref.split(':')[1] : ref)

export async function composeAndWrite({ setId, items, outDir, deps = {} }) {
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const normalizeSvg = deps.normalizeSvg || realNormalize
  const compose = deps.compose || realCompose
  const decisions = []

  for (const item of items) {
    const baseSvg = normalizeSvg(await fetchIconSvg(setId, refName(item.base)))
    const overlaySvg = item.overlay
      ? normalizeSvg(await fetchIconSvg(setId, refName(item.overlay)))
      : undefined
    const svg = compose({ mode: item.mode, baseSvg, overlaySvg, idSuffix: item.name })
    await writeFile(join(outDir, `${item.name}.svg`), svg, 'utf8')

    const decision = { name: item.name, source: 'custom', mode: item.mode, base: item.base }
    if (item.overlay) decision.overlay = item.overlay
    if (item.concept) decision.concept = item.concept
    decision.label = item.label
    decisions.push(decision)
  }
  return decisions
}
