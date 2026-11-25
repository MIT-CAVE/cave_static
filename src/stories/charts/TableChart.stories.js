import { expect, userEvent, within } from 'storybook/test'

import { TableChart } from '../../ui/charts'
import ChartContext from '../../ui/charts/chart-types/echarts/ChartContext'

const tableChartDecorator = (Story) => (
  <div
    style={{
      height: '500px',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Story />
  </div>
)

const tableChartStories = {
  title: 'Charts/TableChart',
  component: TableChart,
  decorators: [tableChartDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default tableChartStories

export const SimpleTable = {
  args: {
    data: [
      { name: 'Node Alpha', value: [1250, 42.5] },
      { name: 'Node Beta', value: [980, 31.0] },
      { name: 'Node Gamma', value: [1420, 58.2] },
      { name: 'Node Delta', value: [830, 24.8] },
    ],
    labelProps: [
      { label: 'Facility Name', key: 'name', type: 'string' },
      { label: 'Capacity (MW)', key: 'capacity', type: 'number' },
      { label: 'Efficiency (%)', key: 'efficiency', type: 'number' },
    ],
    numberFormat: {
      capacity: { precision: 0, unit: 'MW' },
      efficiency: { precision: 1, unit: '%' },
    },
  },
}

export const GroupedHierarchicalTable = {
  args: {
    data: [
      {
        name: 'Americas',
        children: [
          { name: 'USA', value: [450000, 120] },
          { name: 'Canada', value: [180000, 45] },
          { name: 'Brazil', value: [220000, 60] },
        ],
      },
      {
        name: 'Europe',
        children: [
          { name: 'Germany', value: [380000, 95] },
          { name: 'France', value: [290000, 75] },
          { name: 'UK', value: [310000, 80] },
        ],
      },
    ],
    labelProps: [
      { label: 'Region', key: 'region', type: 'string' },
      { label: 'Country', key: 'country', type: 'string' },
      { label: 'Revenue ($)', key: 'revenue', type: 'number' },
      { label: 'Sites', key: 'sites', type: 'number' },
    ],
    numberFormat: {
      revenue: { precision: 0, unit: '$' },
      sites: { precision: 0 },
    },
  },
}

// Raw boolean values are shown with their declared `valueNames`, or capitalized
export const BooleanValuesWithValueNames = {
  decorators: [
    (Story) => (
      <ChartContext.Provider
        value={{ title: 'Sales by Type', valueNames: { true: 'Organic' } }}
      >
        <Story />
      </ChartContext.Provider>
    ),
  ],
  args: {
    data: [
      { name: 'true', value: [320] },
      { name: 'false', value: [450] },
    ],
    labelProps: [
      { label: 'Type', key: 'name', type: 'string' },
      { label: 'Sales', key: 'sales', type: 'number' },
    ],
    numberFormat: { sales: { precision: 0 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText('Organic')).toBeInTheDocument()
    expect(await canvas.findByText('False')).toBeInTheDocument()
    expect(canvas.queryByText('true')).toBeNull()
  },
}

// The button sits on the footer row of the grid, so it must share its center
export const DownloadButtonIsCenteredInFooter = {
  args: SimpleTable.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = await canvas.findByRole('button', { name: /download csv/i })
    const footer = canvasElement.querySelector('.MuiDataGrid-footerContainer')
    const center = ({ top, height }) => top + height / 2
    expect(
      Math.abs(
        center(button.getBoundingClientRect()) -
          center(footer.getBoundingClientRect())
      )
    ).toBeLessThanOrEqual(1)
  },
}

// Runs `fn` while recording what the table downloads instead of saving files
const recordDownloads = async (fn) => {
  const { createObjectURL } = URL
  const { click } = HTMLAnchorElement.prototype
  const downloads = []
  URL.createObjectURL = (blob) => {
    downloads.push({ blob })
    return 'blob:recorded'
  }
  HTMLAnchorElement.prototype.click = function () {
    downloads[downloads.length - 1].name = this.download
  }
  try {
    await fn(downloads)
    return downloads
  } finally {
    URL.createObjectURL = createObjectURL
    HTMLAnchorElement.prototype.click = click
  }
}

// Downloads keep the raw values (`true`, not the display name `Organic`) and
// are named after the chart title
export const DownloadFormats = {
  decorators: [
    (Story) => (
      <ChartContext.Provider
        value={{ title: 'Sales by Type', valueNames: { true: 'Organic' } }}
      >
        <Story />
      </ChartContext.Provider>
    ),
  ],
  args: BooleanValuesWithValueNames.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await canvas.findByText('Organic')
    const iconOf = (name) =>
      canvas.getByRole('button', { name }).querySelector(':scope > svg')
    const csvIcon = iconOf('Download format: CSV').innerHTML

    const pickFormat = async (current, next) => {
      await userEvent.click(
        canvas.getByRole('button', { name: `Download format: ${current}` })
      )
      await userEvent.click(await body.findByRole('menuitem', { name: next }))
    }

    const [csv, json, markdown] = await recordDownloads(async (downloads) => {
      await userEvent.click(
        canvas.getByRole('button', { name: 'Download CSV' })
      )
      // Choosing a format doesn't download, only the main button does
      await pickFormat('CSV', 'JSON')
      await expect(downloads).toHaveLength(1)
      await userEvent.click(
        canvas.getByRole('button', { name: 'Download JSON' })
      )
      await pickFormat('JSON', 'Markdown')
      await expect(downloads).toHaveLength(2)
      await userEvent.click(canvas.getByRole('button', { name: 'Download MD' }))
    }).then((downloads) =>
      Promise.all(
        downloads.map(async ({ blob, name }) => ({
          name,
          text: await blob.text(),
        }))
      )
    )

    await expect(csv.name).toBe('Sales by Type.csv')
    await expect(csv.text).toBe('Type,Sales\ntrue,320\nfalse,450')
    await expect(json.name).toBe('Sales by Type.json')
    await expect(JSON.parse(json.text).rows).toEqual([
      { name: 'true', sales: 320 },
      { name: 'false', sales: 450 },
    ])
    await expect(markdown.name).toBe('Sales by Type.md')
    await expect(markdown.text).toBe(
      '| Type | Sales |\n| --- | ---: |\n| true | 320 |\n| false | 450 |'
    )
    // The menu part shows the icon of the chosen format, and is compact
    const formatButton = canvas.getByRole('button', {
      name: 'Download format: MD',
    })
    await expect(formatButton.querySelector(':scope > svg')).not.toBeNull()
    await expect(formatButton.querySelector(':scope > svg').innerHTML).not.toBe(
      csvIcon
    )
    const style = getComputedStyle(formatButton)
    await expect([style.paddingLeft, style.paddingRight]).toEqual([
      '8px',
      '8px',
    ])
    await expect(
      getComputedStyle(formatButton.querySelector('.MuiButton-endIcon'))
        .marginLeft
    ).toBe('0px')
  },
}
