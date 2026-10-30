/**
 * `richText` is a tri-state generic key (see `richText` in the `cave_utils.api` docs):
 * - Labels (name, subtitle, unit, option names) are plain unless `richText` is `true`.
 * - `help` is markdown unless `richText` is explicitly `false`.
 *
 * NOTE: Planned breaking change for the next major version: `richText` will default
 * to `false` everywhere, so `help` will also need `richText: true` to be rendered as
 * markdown. `warnIfHelpNeedsRichText` helps to find the layouts that need updating.
 */

/**
 * Characters that can trigger inline markdown (emphasis, code, links,
 * escapes) or math. Labels without any of these skip the parser entirely.
 */
const RICH_TEXT_PATTERN = /[*_`[\]$\\]/

/**
 * Cheap check used to skip the markdown pipeline for plain labels.
 * @param {string} text
 * @returns {boolean}
 */
export const mayContainRichText = (text) =>
  typeof text === 'string' && RICH_TEXT_PATTERN.test(text)

const isWordChar = (char) => char !== undefined && /[\p{L}\p{N}]/u.test(char)

const stripMarkers = (text) =>
  text
    // Code, bold and italic markers (unescaped only)
    .replace(/(?<!\\)(\*\*|\*|`)/g, '')
    // Like in markdown, underscores inside a word (`snake_case`) are not markers
    .replace(/(?<!\\)_+/g, (run, offset, string) =>
      isWordChar(string[offset - 1]) && isWordChar(string[offset + run.length])
        ? run
        : ''
    )
    // Backslash escapes: \* -> *
    .replace(/\\([\\`*_[\]$()#+\-.!>~|{}])/g, '$1')

/**
 * Strip inline markdown/math syntax from a label, keeping its readable text.
 * Use it wherever the label is not rendered as a React node: filtering,
 * sorting, `aria-label`, CSV headers, document titles, etc.
 * @param {string} text
 * @returns {string}
 */
export const toPlainText = (text) => {
  if (!mayContainRichText(text)) return text
  return (
    text
      // Links and images: [label](url) -> label
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Math is kept as is, as its symbols are not markers: $x_{i}^2$ -> x_{i}^2
      .split(/((?<!\\)\$\$?[^$]+\$\$?)/)
      .map((part, index) =>
        index % 2 === 1
          ? part.replace(/^\$\$?|\$\$?$/g, '')
          : stripMarkers(part)
      )
      .join('')
  )
}

/**
 * Resolve a cascading `richText` flag: the closest defined value wins.
 * @param {...(boolean|undefined|null)} levels - From most to least specific
 * @returns {boolean|undefined} `undefined` when no level defines the flag
 */
export const resolveRichText = (...levels) =>
  levels.find((level) => level != null)

/**
 * Plain-text version of a label that is only rich when `richText` is `true`.
 * Labels that are not rich are returned as is, so characters like `_` or `*`
 * in ordinary labels are never stripped.
 * @param {string} text
 * @param {boolean|undefined} richText
 * @returns {string}
 */
export const labelText = (text, richText) =>
  richText === true ? toPlainText(text) : text

// Rough check for block and inline markdown (headings, lists, quotes, code,
// bold, links, html tags, math and tables) that is common in `help` text
const HELP_MARKDOWN_PATTERN =
  /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```)|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|`[^`]+`|<\/?[a-z][^>]*>|\$[^$]+\$|\|.+\|/i

const warnedHelp = new Set()

/**
 * Whether a `help` text looks like it uses markdown syntax.
 * @param {string} help
 * @returns {boolean}
 */
export const helpLooksLikeMarkdown = (help) =>
  typeof help === 'string' && HELP_MARKDOWN_PATTERN.test(help)

/**
 * Development aid for the planned breaking change in which `help` will only be
 * rendered as markdown when `richText` is `true`. Logs (once per prop) a warning
 * for `help` text that looks like markdown while `richText` is not set.
 * @param {string} id - The id of the prop, used to identify it in the warning
 * @param {string} help
 * @param {boolean|undefined} richText
 */
export const warnIfHelpNeedsRichText = (id, help, richText) => {
  if (!import.meta.env.DEV || richText != null) return
  if (!helpLooksLikeMarkdown(help) || warnedHelp.has(id)) return
  warnedHelp.add(id)
  console.warn(
    `The \`help\` of "${id}" looks like markdown. In the next major version, ` +
      'markdown in `help` will only be rendered when `richText` is `true`. ' +
      'Set `richText: true` on the prop (or a parent layout grid) to keep it.'
  )
}
