import React from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'

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
 * @deprecated Use `getSvgMarkup` instead for better performance
 * @see https://react.dev/reference/react-dom/server/renderToString#removing-rendertostring-from-the-client-code
 */
export const buildSvgElementFromIconTree = (rootNode, fillColor, size) => {
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

/**
 * High-performance AST to SVG string converter (microsecond execution).
 * Bypasses React DOM tree mounting and flushSync overhead entirely.
 */
export const renderIconTreeToSvg = (node, fillColor, size) => {
  if (!node || typeof node !== 'object') return ''

  const renderNode = (childNode) => {
    if (!childNode || typeof childNode !== 'object') return ''
    const { tag, attr = {}, child = [] } = childNode
    const attrEntries = Object.entries(attr)
    const attrs = attrEntries.length
      ? ` ${attrEntries.map(([k, v]) => `${k}="${v}"`).join(' ')}`
      : ''
    const children = Array.isArray(child) ? child.map(renderNode).join('') : ''
    return `<${tag}${attrs}>${children}</${tag}>`
  }

  if (node.tag === 'svg') {
    const attr = { ...node.attr }
    if (size != null) {
      attr.width = size
      attr.height = size
    }
    attr.fill =
      fillColor ??
      (attr.fill && attr.fill !== 'currentColor' ? attr.fill : '#000000')
    if (!attr.color) {
      attr.color = '#000000'
    }
    if (!attr.xmlns) {
      attr.xmlns = SVG_NAMESPACE
    }
    const attrEntries = Object.entries(attr)
    const attrs = attrEntries.length
      ? ` ${attrEntries.map(([k, v]) => `${k}="${v}"`).join(' ')}`
      : ''
    const children = Array.isArray(node.child)
      ? node.child.map(renderNode).join('')
      : ''
    return `<svg${attrs}>${children}</svg>`
  }

  return renderNode(node)
}

let sharedDiv = null
let sharedRoot = null

const getSharedRoot = () => {
  if (typeof document === 'undefined') return null
  if (!sharedDiv) {
    sharedDiv = document.createElement('div')
    sharedRoot = createRoot(sharedDiv)
  }
  return { div: sharedDiv, root: sharedRoot }
}

export const getSvgMarkup = (RootNode, fillColor, size) => {
  if (!RootNode) return ''

  // Fast path: raw AST icon tree
  if (typeof RootNode === 'object' && RootNode.tag) {
    return renderIconTreeToSvg(RootNode, fillColor, size)
  }

  // Fast path: if RootNode is a function returning an element or icon tree
  if (typeof RootNode === 'function') {
    try {
      const res = RootNode({ style: { color: fillColor }, size })
      if (res && res.props) {
        // Fast SVG element to XML serializer
        const elementToXml = (elem) => {
          if (!elem) return ''
          if (typeof elem === 'string' || typeof elem === 'number') {
            return String(elem)
          }
          const { type, props = {} } = elem
          if (typeof type !== 'string') return null
          const { children, style, ...rest } = props
          const attrList = Object.entries(rest).map(([k, v]) => `${k}="${v}"`)
          if (type === 'svg' && !rest.xmlns) {
            attrList.push(`xmlns="${SVG_NAMESPACE}"`)
          }
          if (style && typeof style === 'object') {
            const styleStr = Object.entries(style)
              .map(
                ([k, v]) => `${k.replace(/([A-Z])/g, '-$1').toLowerCase()}:${v}`
              )
              .join(';')
            if (styleStr) attrList.push(`style="${styleStr}"`)
          }
          const attrs = attrList.length ? ` ${attrList.join(' ')}` : ''
          const childXml = Array.isArray(children)
            ? children.map(elementToXml).join('')
            : children
              ? elementToXml(children)
              : ''
          return `<${type}${attrs}>${childXml}</${type}>`
        }
        const xml = elementToXml(res)
        if (xml) return xml
      }
    } catch (e) {
      // Fall back to React root render
    }

    const dom = getSharedRoot()
    if (dom) {
      flushSync(() => {
        dom.root.render(
          React.createElement(RootNode, {
            style: { color: fillColor },
            size,
          })
        )
      })
      return dom.div.innerHTML
    }
  }

  return ''
}

export const getIconSvgDataUri = (rootNode, fillColor, size) => {
  const svgMarkup = getSvgMarkup(rootNode, fillColor, size)
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`
}
