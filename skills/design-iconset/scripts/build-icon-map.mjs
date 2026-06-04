// icon-map.json 객체를 결정 사이드카에서 결정적으로 생성한다(.svg가 소비 SSOT, map은 캐시).

/**
 * decisions 객체와 setInfo로 icon-map.json 객체를 생성한다.
 * @param {{ decisions: Record<string, object>, setInfo: { id: string, license: string } }} params
 * @returns {{ set: object, icons: Record<string, object> }}
 */
export function buildIconMap({ decisions, setInfo }) {
  const icons = {}
  for (const [name, d] of Object.entries(decisions)) {
    const entry = { source: d.source, path: `assets/icon/${name}.svg`, label: d.label }
    if (d.concept) entry.concept = d.concept
    if (d.source === 'iconify') {
      entry.icon = d.icon
      // 세트 라이선스는 set 블록에만 — 반복하지 않음
    } else if (d.source === 'custom') {
      entry.mode = d.mode
      entry.base = d.base
      if (d.overlay) entry.overlay = d.overlay
      entry.license = `${setInfo.license} (derived from ${setInfo.id})`
    }
    icons[name] = entry
  }
  return { set: { id: setInfo.id, license: setInfo.license }, icons }
}

/**
 * map 항목과 실제 .svg 파일이 1:1 정합인지 검사한다.
 * @param {{ icons: Record<string, { path: string }> }} map
 * @param {string[]} presentFiles - 실제 존재하는 .svg 파일명 배열 (예: ['search.svg'])
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateMap(map, presentFiles) {
  const errors = []
  const present = new Set(presentFiles)
  const expected = new Set()
  for (const [name, entry] of Object.entries(map.icons)) {
    const file = entry.path.split('/').pop()
    expected.add(file)
    if (!present.has(file)) errors.push(`map 항목 '${name}'에 대응하는 ${file} 없음`)
  }
  for (const f of present) {
    if (!expected.has(f)) errors.push(`.svg '${f}'에 대응하는 map 항목 없음`)
  }
  return { ok: errors.length === 0, errors }
}
