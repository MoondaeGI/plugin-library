// fetched 목록을 정규화해 candidate/icon/<name>.svg로 기록한다.
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchIconSvg as realFetch } from '../../../scripts/lib/design/iconify-client.mjs'
import { normalizeSvg as realNormalize, optimizeSvg as realOptimize } from './normalize.mjs'

export async function fetchAndWrite({ setId, fetched, outDir, deps = {} }) {
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const normalizeSvg = deps.normalizeSvg || realNormalize
  const optimizeSvg = deps.optimizeSvg || realOptimize
  const written = []

  await mkdir(outDir, { recursive: true })

  for (const { name, icon } of fetched) {
    const iconName = icon.includes(':') ? icon.split(':')[1] : icon
    const raw = await fetchIconSvg(setId, iconName)
    const svg = await optimizeSvg(normalizeSvg(raw))
    const file = `${name}.svg`
    await writeFile(join(outDir, file), svg, 'utf8')
    written.push(file)
  }
  return written
}
