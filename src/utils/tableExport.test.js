import { describe, expect, it } from 'vitest'

import { buildTableExport, getTableExportFileName } from './tableExport'

const columns = [
  { key: 'grouping0', label: 'Site', type: 'string' },
  { key: 'sales', label: 'Sales [$, thousands]', type: 'number' },
]

describe('buildTableExport', () => {
  it('writes the labels as the header of a CSV', () => {
    expect(buildTableExport('csv', columns, [['A', 1.5]])).toBe(
      'Site,"Sales [$, thousands]"\nA,1.5'
    )
  })

  it('quotes values with commas, quotes and line breaks', () => {
    const rows = [
      ['Acme, Inc.', 1],
      ['say "hi"', 2],
      ['two\nlines', 3],
    ]
    expect(buildTableExport('csv', columns, rows).split('\nA')[0]).toContain(
      '"Acme, Inc.",1\n"say ""hi""",2\n"two\nlines",3'
    )
  })

  it('leaves missing values empty', () => {
    expect(buildTableExport('csv', columns, [['A', null], ['B']])).toBe(
      'Site,"Sales [$, thousands]"\nA,\nB,'
    )
  })

  it('keeps the types of the values of a JSON file', () => {
    expect(
      JSON.parse(buildTableExport('json', columns, [['A', 2], ['B']]))
    ).toEqual({
      columns,
      rows: [
        { grouping0: 'A', sales: 2 },
        { grouping0: 'B', sales: null },
      ],
    })
  })
})

describe('buildTableExport as Markdown', () => {
  it('aligns numbers to the right', () => {
    expect(buildTableExport('md', columns, [['A', 1.5]])).toBe(
      '| Site | Sales \\[\\$, thousands\\] |\n| --- | ---: |\n| A | 1.5 |'
    )
  })

  it('keeps pipes, line breaks and markup inside their cell', () => {
    expect(
      buildTableExport('md', columns, [
        ['a|b\nc', 1],
        ['*bold* `x`', null],
      ])
    ).toContain('| a\\|b<br>c | 1 |\n| \\*bold\\* \\`x\\` |  |')
  })
})

describe('getTableExportFileName', () => {
  it('uses the title of the chart', () => {
    expect(getTableExportFileName('Sales by Type', 'json')).toBe(
      'Sales by Type.json'
    )
  })

  it('drops characters that are not allowed in file names', () => {
    expect(getTableExportFileName(' Q1/Q2: "Sales"?  ', 'csv')).toBe(
      'Q1Q2 Sales.csv'
    )
  })

  it('uses the extension of the format', () => {
    expect(getTableExportFileName('Sales', 'md')).toBe('Sales.md')
  })

  it('falls back to `data` without a usable title', () => {
    expect(getTableExportFileName('', 'json')).toBe('data.json')
    expect(getTableExportFileName(undefined, 'csv')).toBe('data.csv')
    expect(getTableExportFileName('///', 'csv')).toBe('data.csv')
  })
})
