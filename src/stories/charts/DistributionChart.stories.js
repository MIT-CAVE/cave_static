import { configureStore } from '@reduxjs/toolkit'
import * as echarts from 'echarts/core'
import { Provider } from 'react-redux'
import { expect, waitFor, within } from 'storybook/test'

import { chartTitleDecorator, playChartTitle } from './chartTitleStory'

import { DistributionChart } from '../../ui/charts'

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

const distributionChartStories = {
  title: 'Charts/DistributionChart',
  component: DistributionChart,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default distributionChartStories

export const SimpleDistribution = {
  args: {
    data: [
      { name: 'Sample 1', value: [12] },
      { name: 'Sample 2', value: [25] },
      { name: 'Sample 3', value: [38] },
      { name: 'Sample 4', value: [45] },
      { name: 'Sample 5', value: [52] },
      { name: 'Sample 6', value: [60] },
      { name: 'Sample 7', value: [75] },
      { name: 'Sample 8', value: [88] },
    ],
    chartType: 'bar',
    xAxisTitle: 'Value Range',
    yAxisTitle: 'Distribution',
    numberFormat: { precision: 0 },
  },
}

// The chart title is shown above the chart, with the plot right below it
export const WithTitle = {
  decorators: [chartTitleDecorator],
  args: SimpleDistribution.args,
  play: async (context) => {
    await playChartTitle(context)
    // No legend, so the plot is not kept 64px away from the title
    const container = context.canvasElement.querySelector(
      '[_echarts_instance_]'
    )
    const { grid } = echarts.getInstanceByDom(container).getOption()
    expect(grid[0].top).toBeLessThan(64)
  },
}

// The controls are a row below the chart, not drawn over its axis labels
export const ControlsAreBelowTheChart = {
  args: SimpleDistribution.args,
  play: async ({ canvasElement }) => {
    const controls = await within(canvasElement).findByRole('toolbar', {
      name: 'Chart controls',
    })
    await waitFor(() =>
      expect(canvasElement.querySelector('canvas')).not.toBeNull()
    )
    const canvas = canvasElement.querySelector('canvas')
    await expect(controls.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      canvas.getBoundingClientRect().bottom - 1
    )
    // It shares the background of the chart (`#4a4a4a`)
    await expect(getComputedStyle(controls).backgroundColor).toBe(
      'rgb(74, 74, 74)'
    )
  },
}
