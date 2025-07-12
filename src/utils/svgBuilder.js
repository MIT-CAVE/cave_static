// REVIEW: We should consider using `createRoot` from `react-dom/client` and read HTML from the DOM, for better performance.
// Similarly, we should do the same with `renderToStaticMarkup` imports to avoid unnecessarily increasing the bundle size.
// See: https://react.dev/reference/react-dom/server/renderToString#removing-rendertostring-from-the-client-code
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'

const SVG_TAGS = new Set([
  'svg',
  'g',
  'path',
  'circle',
  'rect',
  'ellipse',
  'line',
  'polyline',
  'polygon',
  'defs',
  'symbol',
  'use',
  'view',
  'marker',
  'mask',
  'pattern',
  'clipPath',
  'linearGradient',
  'radialGradient',
  'stop',
  'filter',
  'text',
  'tspan',
  'textPath',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feFlood',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMorphology',
  'feOffset',
  'feSpecularLighting',
  'feTile',
  'feTurbulence',
])

const FILL_AND_STROKE_SUPPORTING_TAGS = new Set([
  'path',
  'circle',
  'rect',
  'polygon',
  'ellipse',
  'text',
  'line',
  'polyline',
  'g',
  'use',
  'symbol',
  'svg',
])

const isExplicitColor = (value) =>
  value && value !== 'none' && value !== 'currentColor'

// const hasExplicitFill = (node) => {
//   const { attr = {}, child = [] } = node
//   if (isExplicitColor(attr.fill)) return true
//   return child.some(hasExplicitFill)
// }

/**
 * Builds a DOM SVG element from a `react-icons` icon tree.
 *
 * @param {Object} rootNode - Icon tree root node
 * @param {string} fillColor - Fallback fill color
 * @param {number|string} size - Width and height to apply to the root <svg>
 * @returns {SVGElement} - A fully constructed <svg> DOM element
 */
const buildSvgElementFromIconTree = (rootNode, fillColor, size) => {
  // const applyFallbackFill = !hasExplicitFill(rootNode)
  const createElement = ({ tag, attr = {}, child = [] }) => {
    const shouldUseSvgNamespace = SVG_TAGS.has(tag)
    const element = shouldUseSvgNamespace
      ? document.createElementNS(SVG_NAMESPACE, tag)
      : document.createElement(tag)

    // Apply base attributes
    Object.entries(attr).forEach(([key, value]) => {
      element.setAttribute(key, value)
    })

    // Special handling for root SVG element
    if (tag === 'svg') {
      element.setAttribute('xmlns', SVG_NAMESPACE)
      element.setAttribute('width', size)
      element.setAttribute('height', size)
      //   if (applyFallbackFill) {
      element.setAttribute('fill', encodeURIComponent(fillColor))
      //   }
    }

    // Apply fill color if appropriate
    if (FILL_AND_STROKE_SUPPORTING_TAGS.has(tag)) {
      // (except root SVG element)
      if (isExplicitColor(attr.fill) && tag !== 'svg') {
        element.setAttribute('fill', encodeURIComponent(attr.fill))
      }
      if (isExplicitColor(attr.stroke)) {
        element.setAttribute('stroke', encodeURIComponent(attr.stroke))
      }
    }

    // Recursively process children
    child.forEach((childNode) => {
      const childElement = createElement(childNode)
      element.appendChild(childElement)
    })

    return element
  }

  return createElement(rootNode)
}

export default buildSvgElementFromIconTree
