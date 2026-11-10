import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { BoxPlot } from '../../ui/charts'

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

const boxPlotStories = {
  title: 'Charts/BoxPlot',
  component: BoxPlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default boxPlotStories

export const SimpleBoxPlot = {
  args: {
    data: [
      { name: 'Group A', value: [10, 20, 25, 30, 35, 40, 50] },
      { name: 'Group B', value: [15, 28, 32, 38, 42, 48, 65] },
      { name: 'Group C', value: [5, 12, 18, 22, 28, 30, 34] },
    ],
    xAxisTitle: 'Cohort',
    yAxisTitle: 'Response Time (ms)',
    numberFormat: { precision: 0, unit: 'ms' },
  },
}

export const SubgroupedBoxPlot = {
  args: {
    data: [
      {
        name: 'Region 1',
        children: [
          { name: 'Morning', value: [12, 24, 30, 36, 45] },
          { name: 'Evening', value: [18, 32, 40, 48, 60] },
        ],
      },
      {
        name: 'Region 2',
        children: [
          { name: 'Morning', value: [8, 16, 22, 28, 38] },
          { name: 'Evening', value: [14, 26, 34, 42, 52] },
        ],
      },
    ],
    xAxisTitle: 'Region',
    yAxisTitle: 'Latency (ms)',
    numberFormat: { precision: 0, unit: 'ms' },
  },
}
