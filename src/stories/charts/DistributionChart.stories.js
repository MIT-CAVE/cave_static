import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

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
