import { configureStore } from '@reduxjs/toolkit'
import * as echarts from 'echarts/core'
import { Provider } from 'react-redux'
import { expect } from 'storybook/test'

import { BubblePlot } from '../../ui/charts'
import ChartContext from '../../ui/charts/chart-types/echarts/ChartContext'

const mockStore = configureStore({
  reducer: {
    data: (state = {}) => state,
    local: (state = {}) => state,
    utilities: (state = {}) => state,
  },
})

const reduxDecorator = (Story) => (
  <Provider store={mockStore}>
    <div style={{ height: '400px', width: '100%' }}>
      <Story />
    </div>
  </Provider>
)

const bubblePlotStories = {
  title: 'Charts/BubblePlot',
  component: BubblePlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default bubblePlotStories

export const SimpleBubble = {
  args: {
    data: [
      { name: 'Branch Alpha', value: [15, 30, 120] },
      { name: 'Branch Beta', value: [25, 55, 240] },
      { name: 'Branch Gamma', value: [35, 40, 180] },
      { name: 'Branch Delta', value: [45, 80, 310] },
      { name: 'Branch Epsilon', value: [55, 65, 150] },
    ],
    labelProps: [
      { label: 'Branch', key: 'branch' },
      { label: 'Staff Count', key: 'staff' },
      { label: 'Revenue ($k)', key: 'revenue' },
      { label: 'Foot Traffic', key: 'traffic' },
    ],
    numberFormat: {
      staff: { precision: 0 },
      revenue: { precision: 0, unit: '$k' },
      traffic: { precision: 0 },
    },
  },
}

// The chart title must not collide with the chart's own top controls
export const WithTitle = {
  decorators: [
    (Story) => (
      <ChartContext.Provider value={{ title: 'Sample Title' }}>
        <Story />
      </ChartContext.Provider>
    ),
  ],
  args: SimpleBubble.args,
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const container = canvasElement.querySelector('[_echarts_instance_]')
    const option = echarts.getInstanceByDom(container).getOption()
    // The chart title is kept next to the chart's own `Size: ...` title
    expect(option.title.map(({ text }) => text)).toEqual([
      'Sample Title',
      expect.stringContaining('Size:'),
    ])
    expect(option.title[1].top).toBeGreaterThan(50)
    // The legend keeps the same distance below the title as in other charts
    expect(option.legend[0].top - option.title[0].top).toBe(36)
  },
}
