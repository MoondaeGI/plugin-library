// gap 아이콘을 24그리드 base/overlay에서 결정적으로 합성한다.
// 입력 SVG는 normalize.mjs로 24그리드·currentColor 정규화돼 있다고 가정.
import { innerSvg, wrap24, knockoutMask, reticleCorners } from './compose-templates/index.mjs'

export function compose({ mode, baseSvg, overlaySvg, idSuffix = 'a' }) {
  const base = baseSvg ? innerSvg(baseSvg) : ''
  const over = overlaySvg ? innerSvg(overlaySvg) : ''

  switch (mode) {
    case 'M1-affix':     return wrap24(affix(base, over, idSuffix))
    case 'M2-container': return wrap24(container(base, over))
    case 'M3-depth':     return wrap24(depthPair(base, over))
    case 'M4-stack':     return wrap24(stack(base))
    case 'M5-reticle':   return wrap24(reticle(base))
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

// M2: base는 컨테이너 그대로, overlay를 중앙 50%로.
function container(baseInner, overInner) {
  return `${baseInner}<g transform="translate(6,6) scale(0.5)">${overInner}</g>`
}

// M3: base를 뒤(opacity 0.2·1.2배), overlay를 앞에 풀사이즈. 깊이는 색이 아니라 opacity.
function depthPair(backInner, frontInner) {
  return `<g opacity="0.2" transform="translate(-2.4,-2.4) scale(1.2)">${backInner}</g>${frontInner}`
}

// M4: 같은 글리프를 오프셋 복제. 앞 카피가 위에 와서 겹침이 깔끔히 가려짐.
function stack(baseInner) {
  return `<g transform="translate(3,-3)">${baseInner}</g>${baseInner}`
}

// M5: 탐지용 네 모서리 마크 + base 중앙 62%.
function reticle(baseInner) {
  return `${reticleCorners()}<g transform="translate(4.56,4.56) scale(0.62)">${baseInner}</g>`
}

export class ComposeModeError extends Error {
  constructor(mode) {
    super(`Unknown compose mode: ${mode}`)
    this.name = 'ComposeModeError'
  }
}
