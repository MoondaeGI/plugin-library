// gap 아이콘을 24그리드 base/overlay에서 결정적으로 합성한다.
// 입력 SVG는 normalize.mjs로 24그리드·currentColor 정규화돼 있다고 가정.
import { innerSvg, wrap24, knockoutMask, reticleCorners } from './compose-templates/index.mjs'

export function compose({ mode, baseSvg, overlaySvg, idSuffix = 'a' }) {
  const base = baseSvg ? innerSvg(baseSvg) : ''
  const over = overlaySvg ? innerSvg(overlaySvg) : ''

  switch (mode) {
    case 'M1-affix':   return wrap24(affix(base, over, idSuffix))
    default:
      throw new ComposeModeError(mode)
  }
}

// M1: base를 우하단 원으로 도려내고, overlay를 ~42%로 우하단에 배치.
function affix(baseInner, overInner, idSuffix) {
  const id = `ko-${idSuffix}`
  return [
    knockoutMask(id),
    `<g mask="url(#${id})">${baseInner}</g>`,
    `<g transform="translate(13.92,13.92) scale(0.42)">${overInner}</g>`,
  ].join('')
}

export class ComposeModeError extends Error {
  constructor(mode) {
    super(`Unknown compose mode: ${mode}`)
    this.name = 'ComposeModeError'
  }
}
