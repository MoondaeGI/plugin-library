// fetched 목록을 정규화해 candidate/icon/<name>.svg로 기록한다.
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fetchIconSvg as realFetch } from './iconify-client.mjs'
import { normalizeSvg as realNormalize } from './normalize.mjs'

export async function fetchAndWrite({ setId, fetched, outDir, deps = {} }) {
  const fetchIconSvg = deps.fetchIconSvg || realFetch
  const normalizeSvg = deps.normalizeSvg || realNormalize
  const written = []

  for (const { name, icon } of fetched) {
    const iconName = icon.includes(':') ? icon.split(':')[1] : icon
    const raw = await fetchIconSvg(setId, iconName)
    const svg = normalizeSvg(raw)
    const file = `${name}.svg`
    await writeFile(join(outDir, file), svg, 'utf8')
    written.push(file)
  }
  return written
}
