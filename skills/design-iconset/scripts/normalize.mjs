// SVG를 출력 계약(viewBox 0 0 24 24, currentColor)으로 정규화한다.
// 색/최적화는 @iconify/tools가 본업이나, 재스케일·테스트 가능성을 위해
// 결정적 문자열 변환으로 구현한다. (SVGO 최적화는 선택적으로 적용)

const VIEWBOX_RE = /viewBox\s*=\s*"([\d.\-\s]+)"/i

/** 재스케일 목표 크기 (px) */
const TARGET_SIZE = 24

/** style 속성 안의 fill 또는 stroke 색 값만 매칭 (none·currentColor는 보존) */
const STYLE_COLOR_RE = /\b(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|(?!none\b)(?!currentcolor\b)[a-zA-Z]+)/gi

/**
 * SVG 문자열을 24×24 viewBox + currentColor 계약으로 정규화한다.
 *
 * 정사각 viewBox 가정(Iconify 세트는 사실상 정사각).
 * 비정사각이면 width 기준으로만 스케일되어 부정확할 수 있음.
 *
 * @param {string} svg - 원본 SVG 문자열
 * @returns {string} - 정규화된 SVG 문자열
 */
export function normalizeSvg(svg) {
  let out = svg.trim()

  // ① 재스케일: 정사각 viewBox W가 TARGET_SIZE가 아니면 scale 래핑
  const vb = out.match(VIEWBOX_RE)
  if (vb) {
    const parts = vb[1].split(/\s+/).map(Number)
    const w = parts[2]
    if (w && w !== TARGET_SIZE) {
      const factor = +(TARGET_SIZE / w).toFixed(5)
      out = out
        .replace(VIEWBOX_RE, `viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}"`)
        .replace(/(<svg[^>]*>)([\s\S]*)(<\/svg>)/i,
          (_, open, inner, close) => `${open}<g transform="scale(${factor})">${inner}</g>${close}`)
    } else {
      out = out.replace(VIEWBOX_RE, `viewBox="0 0 ${TARGET_SIZE} ${TARGET_SIZE}"`)
    }
  }

  // ② 속성 색 → currentColor (none·currentColor 제외, opacity는 별도 속성이라 영향 없음)
  out = out.replace(/(fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8}|rgb\([^)]*\)|[a-zA-Z]+)"/g,
    (m, attr, val) => {
      const low = val.toLowerCase()
      if (low === 'none' || low === 'currentcolor') return m
      return `${attr}="currentColor"`
    })

  // ③ style 속성 안의 fill:/stroke: 색 → currentColor (none·currentColor는 보존)
  out = out.replace(/style\s*=\s*"([^"]*)"/gi, (m, styleVal) => {
    const replaced = styleVal.replace(STYLE_COLOR_RE, (_, prop, val) => {
      const low = val.toLowerCase()
      if (low === 'none' || low === 'currentcolor') return `${prop}:${val}`
      return `${prop}:currentColor`
    })
    return `style="${replaced}"`
  })

  return out
}

/**
 * 선택적 SVGO 최적화: @iconify/tools의 SVG·runSVGO를 사용한다.
 * - API 확인 (context7 @iconify/tools 문서, 2026-06-04):
 *   new SVG(string) → SVG 인스턴스
 *   runSVGO(svg) → void (SVG 인스턴스를 in-place 변환, async 가능)
 *   svg.toMinifiedString() → string
 * - 미설치·시그니처 불일치 시 원본 그대로 반환 (최적화는 선택적 단계).
 *
 * @param {string} svg - 정규화된 SVG 문자열
 * @returns {Promise<string>} - SVGO 최적화된 문자열 (실패 시 입력 그대로)
 */
export async function optimizeSvg(svg) {
  try {
    const { SVG, runSVGO } = await import('@iconify/tools')
    const obj = new SVG(svg)
    await runSVGO(obj)
    return obj.toMinifiedString()
  } catch (ignored) {
    // @iconify/tools 미설치/시그니처 불일치 시 정규화만 적용 (최적화는 선택적)
    // 이 경로가 정상 흐름에 영향 없음을 확인 (2026-06-04)
    return svg
  }
}
