import { defaultSchema } from 'rehype-sanitize'

// `rehype-sanitize` adds this prefix to ids, so authors can't shadow globals of
// the page (DOM clobbering) with elements like `<img id="location">`
const CLOBBER_PREFIX = defaultSchema.clobberPrefix ?? 'user-content-'

const MATH_CLASSES = ['language-math', 'math-inline', 'math-display']

const withMathClasses = (tagName) => [
  ...(defaultSchema.attributes?.[tagName] ?? []),
  ['className', ...MATH_CLASSES],
]

/**
 * Schema for `rehype-sanitize`, based on the default (GitHub-like) schema, which
 * removes scripts, iframes, event handlers, inline styles, classes and unsafe
 * URL protocols from the HTML of a (rich) text.
 *
 * It also keeps the classes that `remark-math` adds to formulas, as
 * `rehype-katex` needs them to find the formulas to render.
 *
 * NOTE: `rehype-sanitize` must run before `rehype-katex`, which outputs
 * elements with classes and inline styles that the schema does not allow.
 */
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: withMathClasses('code'),
    span: withMathClasses('span'),
    div: withMathClasses('div'),
  },
}

/**
 * Points an in-page link (`#id`) to the id that the sanitizer gave to its
 * target, as sanitized ids get an extra prefix but links to them do not.
 * @param {string|undefined} href
 * @returns {string|undefined}
 */
export const getSanitizedHref = (href) =>
  typeof href === 'string' && href.startsWith('#')
    ? `#${CLOBBER_PREFIX}${href.slice(1)}`
    : href

export default sanitizeSchema
