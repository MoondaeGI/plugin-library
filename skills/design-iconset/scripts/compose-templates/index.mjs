// 합성용 헬퍼 + 고정 SVG 스니펫. 모든 좌표는 24그리드 기준.

const SVG_OPEN_RE = /<svg[^>]*>/i

export function innerSvg(svg) {
  const open = svg.match(SVG_OPEN_RE)
  if (!open) return svg.trim()
  const start = svg.indexOf(open[0]) + open[0].length
  const end = svg.lastIndexOf('</svg>')
  return svg.slice(start, end === -1 ? undefined : end).trim()
}

export function wrap24(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${inner}</svg>`
}

// 우하단 배지 자리를 base에서 도려내는 mask. (white=보임, black=숨김)
export function knockoutMask(id) {
  return `<mask id="${id}"><rect width="24" height="24" fill="white"/><circle cx="19" cy="19" r="6" fill="black"/></mask>`
}

// 탐지 느낌의 네 모서리 L자 마크.
export function reticleCorners() {
  const w = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
  return [
    `<path d="M3 8V4a1 1 0 0 1 1-1h4" ${w}/>`,   // 좌상
    `<path d="M16 3h4a1 1 0 0 1 1 1v4" ${w}/>`,  // 우상
    `<path d="M21 16v4a1 1 0 0 1-1 1h-4" ${w}/>`,// 우하
    `<path d="M8 21H4a1 1 0 0 1-1-1v-4" ${w}/>`, // 좌하
  ].join('')
}
