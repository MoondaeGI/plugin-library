// Iconify 공개 HTTP API 접근(키 불필요). 네트워크는 fetchFn 주입으로 테스트.
const BASE = 'https://api.iconify.design'

const getFetch = (deps) => (deps && deps.fetchFn) || fetch

export async function fetchIconSvg(setId, name, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/${setId}/${name}.svg`)
  if (!res.ok) throw new IconNotFoundError(setId, name)
  return await res.text()
}

export async function iconExists(setId, name, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/${setId}/${name}.svg`)
  // 존재하지 않는 아이콘은 404. (Iconify는 미존재 시 404 반환)
  return res.ok
}

export async function fetchSetInfo(setId, deps = {}) {
  const res = await getFetch(deps)(`${BASE}/collection?prefix=${setId}&info=true`)
  if (!res.ok) throw new Error(`set info fetch failed: ${setId}`)
  const data = await res.json()
  // 실제 API: { prefix, title, info: { name, license: { title, spdx, url }, ... } }
  // 테스트 픽스처는 구형 { [setId]: { name, license } } 형태를 유지하므로 양쪽 모두 지원
  const entry = data.info || data[setId] || {}
  return {
    id: setId,
    name: entry.name || data.title || setId,
    license: (entry.license && (entry.license.spdx || entry.license.title)) || 'UNKNOWN',
    licenseUrl: entry.license && entry.license.url,
  }
}

export class IconNotFoundError extends Error {
  constructor(setId, name) {
    super(`Icon not found: ${setId}:${name}`)
    this.name = 'IconNotFoundError'
  }
}
