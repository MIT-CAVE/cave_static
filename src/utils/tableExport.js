import { escapeRichText } from './richText'

export const TABLE_EXPORT_FORMATS = {
  csv: { label: 'CSV', mime: 'text/csv', extension: 'csv' },
  json: { label: 'JSON', mime: 'application/json', extension: 'json' },
  md: { label: 'Markdown', mime: 'text/markdown', extension: 'md' },
}

// Quotes a value only when it would otherwise break the row (RFC 4180)
const toCsvCell = (value) => {
  if (value == null) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const toCsv = (columns, rows) =>
  [
    columns.map(({ label }) => label),
    // Rows follow the columns, whatever their own length is
    ...rows.map((row) => columns.map((_, i) => row[i])),
  ]
    .map((row) => row.map(toCsvCell).join(','))
    .join('\n')

// Escapes what would turn a value into markup, or break out of its cell
const toMarkdownCell = (value) =>
  value == null
    ? ''
    : escapeRichText(String(value))
        .replace(/\|/g, '\\|')
        .replace(/\r?\n/g, '<br>')

// A GitHub-flavored table, with the numbers aligned to the right
const toMarkdown = (columns, rows) =>
  [
    columns.map(({ label }) => toMarkdownCell(label)),
    columns.map(({ type }) => (type === 'number' ? '---:' : '---')),
    ...rows.map((row) => columns.map((_, i) => toMarkdownCell(row[i]))),
  ]
    .map((cells) => `| ${cells.join(' | ')} |`)
    .join('\n')

// Rows keyed by the column `key`, with the `label` and `type` of each column
const toJson = (columns, rows) =>
  JSON.stringify(
    {
      columns: columns.map(({ key, label, type }) => ({ key, label, type })),
      rows: rows.map((row) =>
        Object.fromEntries(columns.map(({ key }, i) => [key, row[i] ?? null]))
      ),
    },
    null,
    2
  )

/**
 * Builds the contents of a table download from its raw (unformatted) values.
 * @param {'csv'|'json'|'md'} format The format of the download.
 * @param {Object[]} columns The `key`, `label` and `type` of each column.
 * @param {Array[]} rows The raw values of each row, in the order of `columns`.
 * @returns {string}
 */
export const buildTableExport = (format, columns, rows) =>
  format === 'json'
    ? toJson(columns, rows)
    : format === 'md'
      ? toMarkdown(columns, rows)
      : toCsv(columns, rows)

/**
 * The file name of a table download: the chart title when there is one.
 * @param {string} title The plain text title of the chart.
 * @param {'csv'|'json'|'md'} format The format of the download.
 * @returns {string}
 */
export const getTableExportFileName = (title, format) => {
  const name = (title ?? '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  return `${name || 'data'}.${TABLE_EXPORT_FORMATS[format].extension}`
}

export const downloadTableExport = ({ format, columns, rows, title }) => {
  const { mime } = TABLE_EXPORT_FORMATS[format]
  const blob = new Blob([buildTableExport(format, columns, rows)], {
    type: `${mime};charset=utf-8;`,
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', getTableExportFileName(title, format))
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
