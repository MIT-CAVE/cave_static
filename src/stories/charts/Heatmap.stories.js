import { configureStore } from '@reduxjs/toolkit'
import * as echarts from 'echarts/core'
import { Provider } from 'react-redux'
import { expect } from 'storybook/test'

import { Heatmap } from '../../ui/charts'
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

const heatmapStories = {
  title: 'Charts/Heatmap',
  component: Heatmap,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default heatmapStories

export const SimpleHeatmap = {
  args: {
    data: [
      {
        name: 'Monday',
        children: [
          { name: 'Morning', value: [30] },
          { name: 'Afternoon', value: [55] },
          { name: 'Evening', value: [70] },
        ],
      },
      {
        name: 'Tuesday',
        children: [
          { name: 'Morning', value: [35] },
          { name: 'Afternoon', value: [60] },
          { name: 'Evening', value: [75] },
        ],
      },
      {
        name: 'Wednesday',
        children: [
          { name: 'Morning', value: [40] },
          { name: 'Afternoon', value: [65] },
          { name: 'Evening', value: [80] },
        ],
      },
      {
        name: 'Thursday',
        children: [
          { name: 'Morning', value: [42] },
          { name: 'Afternoon', value: [68] },
          { name: 'Evening', value: [85] },
        ],
      },
      {
        name: 'Friday',
        children: [
          { name: 'Morning', value: [50] },
          { name: 'Afternoon', value: [75] },
          { name: 'Evening', value: [95] },
        ],
      },
    ],
    xAxisTitle: 'Day of Week',
    yAxisTitle: 'Shift Time',
    numberFormat: { precision: 0, unit: 'orders' },
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
  args: SimpleHeatmap.args,
  play: async ({ canvasElement }) => {
    await new Promise((resolve) => setTimeout(resolve, 300))
    const container = canvasElement.querySelector('[_echarts_instance_]')
    const option = echarts.getInstanceByDom(container).getOption()
    expect(option.title[0].text).toBe('Sample Title')
    // The color range control is moved below the title
    expect(option.visualMap[0].top).toBeGreaterThan(option.title[0].top + 20)
    expect(option.grid[0].top).toBeGreaterThan(64)
  },
}
