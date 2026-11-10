import * as echarts from 'echarts'
import { expect, userEvent, waitFor, within } from 'storybook/test'

import GridFilter from '../../../ui/views/common/GridFilter'
import DashboardGlobalOutput from '../../../ui/views/dashboard/DashboardGlobalOutputs'
import GlobalOutputsToolbar from '../../../ui/views/dashboard/GlobalOutputsToolbar'
import { chartVariant } from '../../../utils/enums'

const globalOutputsRichTextStories = {
  title: 'Views/Dashboard/GlobalOutputs/RichText',
  parameters: { layoutWidth: 'full' },
}

export default globalOutputsRichTextStories

// The `richText` cascade of a global output: prop > `globalOutputs` > the app
// default (`settings.defaults.richText`)
const buildData = ({ defaults, root, cost = {} } = {}) => ({
  settings: { ...(defaults && { defaults }) },
  globalOutputs: {
    ...(root != null && { richText: root }),
    props: {
      revenue: { id: 'revenue', type: 'num', name: '**Revenue**' },
      cost: { id: 'cost', type: 'num', name: '_Cost_ per unit', ...cost },
    },
    values: { revenue: 1000, cost: 600 },
  },
  associated: {
    data: {
      first: {
        name: 'Scenario A',
        data: {
          globalOutputs: {
            props: {
              revenue: {
                id: 'revenue',
                name: '**Revenue**',
                unit: '$m^2$',
                value: 1000,
              },
              cost: {
                id: 'cost',
                name: '_Cost_ per unit',
                value: 600,
                ...cost,
              },
            },
          },
        },
      },
    },
  },
})

const table = {
  chartType: chartVariant.TABLE,
  globalOutput: ['cost', 'revenue'],
  sessions: ['Scenario A'],
}

const tableStory = (options) => ({
  render: () => <DashboardGlobalOutput chartObj={table} />,
  parameters: { initData: buildData(options) },
})

const header = (canvasElement, field) =>
  canvasElement.querySelector(`[role="columnheader"][data-field="${field}"]`)

export const HeadersArePlainByDefault = {
  ...tableStory(),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(header(canvasElement, 'revenue')?.textContent).toContain(
        '**Revenue**'
      )
    })
    await expect(
      canvasElement.querySelector('[role="columnheader"] strong')
    ).toBeNull()
  },
}

export const HeadersFollowTheGlobalOutputsRoot = {
  ...tableStory({ root: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        header(canvasElement, 'revenue')?.querySelector('strong')
      ).not.toBeNull()
    })
    const revenue = header(canvasElement, 'revenue')
    await expect(revenue.querySelector('strong').textContent).toBe('Revenue')
    await waitFor(() => expect(revenue.querySelector('.katex')).not.toBeNull())
    // The space after the formatted word is kept
    await expect(
      header(canvasElement, 'cost').querySelector('em').textContent
    ).toBe('Cost')
    await expect(header(canvasElement, 'cost').textContent).toContain(
      'Cost per unit'
    )
  },
}

export const PropOverridesTheRoot = {
  ...tableStory({ root: true, cost: { richText: false } }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        header(canvasElement, 'revenue')?.querySelector('strong')
      ).not.toBeNull()
    })
    const cost = header(canvasElement, 'cost')
    await expect(cost.textContent).toContain('_Cost_ per unit')
    await expect(cost.querySelector('em')).toBeNull()
  },
}

export const GlobalDefaultMakesHeadersRich = {
  ...tableStory({ defaults: { richText: true } }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(
        header(canvasElement, 'revenue')?.querySelector('strong')
      ).not.toBeNull()
    })
  },
}

// Canvas text can't render markup, so the axis title is plain text
const getYAxisName = (canvasElement) => {
  const element = canvasElement.querySelector('[_echarts_instance_]')
  return echarts.getInstanceByDom(element)?.getOption().yAxis?.[0]?.name
}

const barStory = (options) => ({
  render: () => (
    <div style={{ height: 400 }}>
      <DashboardGlobalOutput
        chartObj={{
          chartType: chartVariant.BAR,
          globalOutput: ['revenue'],
          sessions: ['Scenario A'],
        }}
      />
    </div>
  ),
  parameters: { initData: buildData(options) },
})

export const AxisTitleUsesThePlainUnits = {
  ...barStory({ root: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(getYAxisName(canvasElement)).toBeTruthy())
    // The math is kept as written, without its markers
    await expect(getYAxisName(canvasElement)).toContain('m^2')
    await expect(getYAxisName(canvasElement)).not.toContain('$')
  },
}

export const AxisTitleKeepsPlainUnitsAsWritten = {
  ...barStory(),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(getYAxisName(canvasElement)).toBeTruthy())
    await expect(getYAxisName(canvasElement)).toContain('$m^2$')
  },
}

// The picker of global outputs of the toolbar
const toolbarState = (options) => ({
  data: {
    ...buildData(options),
    pages: {
      currentPage: 'page_1',
      data: {
        page_1: {
          charts: {
            chart_1: {
              type: 'globalOutput',
              chartType: chartVariant.BAR,
              sessions: ['Scenario A'],
              globalOutput: [],
            },
          },
        },
      },
    },
  },
})

const toolbarStory = (options) => ({
  render: () => <GlobalOutputsToolbar index="chart_1" />,
  parameters: { layoutWidth: '500px', preloadedState: toolbarState(options) },
})

const openOutputs = async (canvasElement) => {
  const canvas = within(canvasElement)
  const input = await canvas.findByLabelText('Select Global Outputs')
  await waitFor(() => expect(input).toBeEnabled())
  await userEvent.click(input)
  return within(canvasElement.ownerDocument.body)
}

export const PickerNamesAreRich = {
  ...toolbarStory({ root: true }),
  play: async ({ canvasElement }) => {
    const body = await openOutputs(canvasElement)
    const option = await body.findByRole('option', { name: /Revenue/ })
    await expect(option.querySelector('strong')?.textContent).toBe('Revenue')
  },
}

export const PickerNamesArePlainByDefault = {
  ...toolbarStory(),
  play: async ({ canvasElement }) => {
    const body = await openOutputs(canvasElement)
    const option = await body.findByRole('option', { name: /Revenue/ })
    await expect(option.textContent).toContain('**Revenue**')
    await expect(option.querySelector('strong')).toBeNull()
  },
}

// The "Statistic" column of the filter shows the name of the stat
const filterables = (richText) => ({
  sales: {
    name: '**Sales**',
    type: 'num',
    ...(richText != null && { richText }),
  },
})
const filters = [
  {
    id: 1,
    type: 'rule',
    groupId: 0,
    depth: 1,
    prop: 'sales',
    option: '>',
    value: 1,
  },
  { id: 0, type: 'group', groupId: 0, logic: 'and', depth: 0 },
]

const filterStory = ({ richText, parent } = {}) => ({
  render: () => (
    <div style={{ height: 400 }}>
      <GridFilter
        defaultFilters={filters}
        sourceHeaderName="Statistic"
        filterables={filterables(richText)}
        richText={parent}
        onSave={() => {}}
      />
    </div>
  ),
})

export const FilterStatisticNamesAreRich = {
  ...filterStory({ richText: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-field="source"] strong')
      ).not.toBeNull()
    )
    await expect(
      canvasElement.querySelector('[data-field="source"] strong').textContent
    ).toBe('Sales')
  },
}

export const FilterStatisticNamesArePlainByDefault = {
  ...filterStory(),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        within(canvasElement).getAllByText('**Sales**').length
      ).toBeGreaterThan(0)
    )
    await expect(
      canvasElement.querySelector('[data-field="source"] strong')
    ).toBeNull()
  },
}

export const FilterStatisticFollowsItsParent = {
  ...filterStory({ parent: true }),
  play: async ({ canvasElement }) => {
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-field="source"] strong')
      ).not.toBeNull()
    )
  },
}

// The overview renders the global outputs as props: prop > root > app default
const overviewStory = (options) => ({
  render: () => (
    <DashboardGlobalOutput chartObj={{ chartType: chartVariant.OVERVIEW }} />
  ),
  parameters: {
    initData: {
      ...buildData(options),
      globalOutputs: {
        ...buildData(options).globalOutputs,
        layout: {
          type: 'grid',
          numColumns: 1,
          data: {
            a: { type: 'item', itemId: 'revenue' },
            b: { type: 'item', itemId: 'cost' },
          },
        },
      },
    },
  },
})

export const OverviewNamesFollowTheRoot = {
  ...overviewStory({ root: true }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const revenue = await canvas.findAllByText('Revenue')
    for (const element of revenue) await expect(element.tagName).toBe('STRONG')
  },
}

export const OverviewPropOverridesTheRoot = {
  ...overviewStory({ root: true, cost: { richText: false } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await canvas.findAllByText('Revenue')
    await waitFor(() =>
      expect(canvas.getAllByText(/_Cost_ per unit/).length).toBeGreaterThan(0)
    )
  },
}

export const OverviewNamesArePlainByDefault = {
  ...overviewStory(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await waitFor(() =>
      expect(canvas.getAllByText(/\*\*Revenue\*\*/).length).toBeGreaterThan(0)
    )
    await expect(canvasElement.querySelector('strong')).toBeNull()
  },
}
