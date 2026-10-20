import React from 'react'
import { expect, userEvent, within } from 'storybook/test'

import ChartToolsModal from '../../../ui/views/common/ChartToolsModal'
import { chartVariant } from '../../../utils/enums'

const chartToolsModalStories = {
  title: 'Views/Common/ChartToolsModal',
  component: ChartToolsModal,
  parameters: {
    layoutWidth: '1200px',
    layoutHeight: '900px',
  },
}

export default chartToolsModalStories

const globalOutputs = {
  props: {
    kpi_revenue: { type: 'num', name: 'Total Revenue', unit: '$', value: 1 },
  },
  values: { kpi_revenue: { value: 1 } },
}

const buildState = (chartObj) => ({
  data: {
    globalOutputs,
    pages: {
      currentPage: 'page_1',
      data: { page_1: { charts: { chart_1: chartObj } } },
    },
  },
  local: {
    settings: {
      // Desync the title path so edits stay in the local slice
      sync: {
        title: ['pages', 'data', 'page_1', 'charts', 'chart_1', 'title'],
      },
    },
    panes: { data: {} },
  },
})

export const WithTitle = {
  render: () => (
    <ChartToolsModal index="chart_1" label="Chart Tools" onClose={() => {}} />
  ),
  parameters: {
    preloadedState: buildState({
      type: 'globalOutput',
      chartType: chartVariant.BAR,
      title: 'Quarterly Revenue',
      sessions: [],
      globalOutput: [],
    }),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    const input = await body.findByLabelText('Title')
    await expect(input).toHaveValue('Quarterly Revenue')
    await userEvent.clear(input)
    await userEvent.type(input, 'Cost Overview')
    await userEvent.tab()
    await expect(await body.findByLabelText('Title')).toHaveValue(
      'Cost Overview'
    )
  },
}

export const NoTitle = {
  render: () => (
    <ChartToolsModal index="chart_1" label="Chart Tools" onClose={() => {}} />
  ),
  parameters: {
    preloadedState: buildState({
      type: 'globalOutput',
      chartType: chartVariant.BAR,
      sessions: [],
      globalOutput: [],
    }),
  },
}
