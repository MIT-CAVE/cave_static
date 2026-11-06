import { expect, waitFor, within } from 'storybook/test'

import { TableChart } from '../../ui/charts'
import ChartContext from '../../ui/charts/chart-types/echarts/ChartContext'

const decorator = (Story) => (
  <div
    style={{
      height: '400px',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Story />
  </div>
)

const tableRichTextStories = {
  title: 'Charts/TableChart/RichText',
  decorators: [decorator],
  parameters: { layoutWidth: 'full' },
}

export default tableRichTextStories

const data = [{ name: 'Alpha', value: [10, 20] }]
const numberFormat = { a: { precision: 0 }, b: { precision: 0 } }

const renderTable =
  ({ labelProps, context = {} }) =>
  () => (
    <ChartContext.Provider value={{ title: '', ...context }}>
      <TableChart {...{ data, labelProps, numberFormat }} />
    </ChartContext.Provider>
  )

const headerOf = (canvas, name) => canvas.findByRole('columnheader', { name })

export const RichHeaders = {
  render: renderTable({
    labelProps: [
      { key: 'g', type: 'string', label: 'Site', richLabel: '**Site**' },
      {
        key: 'a',
        type: 'number',
        label: 'Area [m^2]',
        richLabel: '_Area_ \\[$m^2$\\]',
      },
      // Not rich: stays as written
      { key: 'b', type: 'number', label: 'snake_case **raw**' },
    ],
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const site = await headerOf(canvas, 'Site')
    await expect(site.querySelector('strong')?.textContent).toBe('Site')
    const area = await headerOf(canvas, /Area/)
    await expect(area.querySelector('em')?.textContent).toBe('Area')
    await waitFor(() => expect(area.querySelector('.katex')).not.toBeNull())
    const raw = await headerOf(canvas, /snake_case/)
    await expect(raw.textContent).toContain('snake_case **raw**')
    await expect(raw.querySelector('strong')).toBeNull()
  },
}

export const RichTitle = {
  render: renderTable({
    labelProps: [{ key: 'g', type: 'string', label: 'Site' }],
    context: { title: 'Sales', richTitle: '**Sales**', richText: true },
  }),
  play: async ({ canvasElement }) => {
    const title = await within(canvasElement).findByText('Sales')
    await expect(title.tagName).toBe('STRONG')
  },
}

export const PlainTitleStaysAsWritten = {
  render: renderTable({
    labelProps: [{ key: 'g', type: 'string', label: 'Site' }],
    context: { title: '**Sales**', richTitle: '**Sales**', richText: false },
  }),
  play: async ({ canvasElement }) => {
    const title = await within(canvasElement).findByText('**Sales**')
    await expect(title.querySelector('strong')).toBeNull()
  },
}
