import PropTypes from 'prop-types'
import { Fragment, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeKatex from 'rehype-katex'
import rehypeSanitize from 'rehype-sanitize'
import remarkMath from 'remark-math'

import InlineCode from './InlineCode'
import sanitizeSchema from './sanitizeSchema'

import { mayContainRichText } from '../../utils/richText'

// Large enough to hold the labels of big option lists (e.g. 1000 options)
export const MAX_CACHE_SIZE = 2000
// Math labels are much heavier than other labels (KaTeX renders about 60
// elements for a short formula, against 1 to 5 for markdown), so the cache is
// also bounded by the number of elements it holds. This is roughly proportional
// to its memory (about 0.5 KB per element), so it is capped at about 15 MB.
export const MAX_CACHE_WEIGHT = 30000

// Block-level elements are unwrapped so a label always stays inline.
// NOTE: `rehype-raw` is intentionally not used, so raw HTML in a label
// is shown as text instead of being rendered.
const BLOCK_ELEMENTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'pre',
  'blockquote',
  'ul',
  'ol',
  'li',
  'table',
  'hr',
  'img',
]

// Links open in a new tab. Their clicks must not reach the control that
// contains the label (e.g. selecting a menu option or toggling a radio).
const RichLink = ({ children, ...props }) => (
  <a
    {...props}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(event) => event.stopPropagation()}
  >
    {children}
  </a>
)

const components = { p: Fragment, a: RichLink, code: InlineCode }
const remarkPlugins = [remarkMath]
// Labels do not parse raw HTML, so this is just a second layer of defense
const rehypePlugins = [[rehypeSanitize, sanitizeSchema], rehypeKatex]

// Rendered labels, keyed by their source text. Labels are mounted often
// (legends, option lists, marquee duplicates) but rarely change.
const cache = new Map()
let cacheWeight = 0

const countElements = (node) =>
  Array.isArray(node)
    ? node.reduce((total, child) => total + countElements(child), 0)
    : node?.props
      ? 1 + countElements(node.props.children)
      : 0

/**
 * Get the element tree of a rich label, parsing its markdown (and math)
 * only the first time a text is seen.
 *
 * NOTE: `ReactMarkdown` is a pure function that returns a plain element tree,
 * so it is called directly instead of being rendered as a component. Rendering
 * it as an element would parse the text again on every mount.
 * @param {string} text
 * @returns {import('react').ReactNode}
 */
export const getRichNode = (text) => {
  const cached = cache.get(text)
  if (cached !== undefined) {
    // Move it to the end, so the least recently used label is evicted first
    cache.delete(text)
    cache.set(text, cached)
    return cached.node
  }
  const node = ReactMarkdown({
    children: text,
    components,
    remarkPlugins,
    rehypePlugins,
    disallowedElements: BLOCK_ELEMENTS,
    unwrapDisallowed: true,
  })
  const weight = countElements(node)
  // A `Map` iterates in insertion order, so its first key is the oldest
  while (
    cache.size > 0 &&
    (cache.size >= MAX_CACHE_SIZE || cacheWeight + weight > MAX_CACHE_WEIGHT)
  ) {
    const [oldestText, oldest] = cache.entries().next().value
    cache.delete(oldestText)
    cacheWeight -= oldest.weight
  }
  cache.set(text, { node, weight })
  cacheWeight += weight
  return node
}

/**
 * Inline label with markdown (bold, italic, code, links) and math support.
 * Plain strings skip the parser entirely.
 */
const RichLabel = ({ text, rich = true }) =>
  rich && mayContainRichText(text) ? getRichNode(text) : (text ?? null)
RichLabel.propTypes = {
  text: PropTypes.string,
  rich: PropTypes.bool,
}

export default memo(RichLabel)
