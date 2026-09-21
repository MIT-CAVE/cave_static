import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { CumulativeLineChart } from '../../ui/charts'

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

const cumulativeLineStories = {
  title: 'Charts/CumulativeLineChart',
  component: CumulativeLineChart,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default cumulativeLineStories

export const SimpleCumulativeLine = {
  args: {
    data: [
      { name: 'Jan', value: [100] },
      { name: 'Feb', value: [150] },
      { name: 'Mar', value: [200] },
      { name: 'Apr', value: [180] },
      { name: 'May', value: [250] },
    ],
    xAxisTitle: 'Month',
    yAxisTitle: 'Cumulative Revenue ($k)',
    numberFormat: { precision: 0, unit: '$k' },
  },
}

export const SubgroupedCumulativeLine = {
  args: {
    data: [
      {
        name: 'Product A',
        children: [
          { name: 'Q1', value: [300] },
          { name: 'Q2', value: [450] },
          { name: 'Q3', value: [500] },
          { name: 'Q4', value: [650] },
        ],
      },
      {
        name: 'Product B',
        children: [
          { name: 'Q1', value: [200] },
          { name: 'Q2', value: [350] },
          { name: 'Q3', value: [420] },
          { name: 'Q4', value: [550] },
        ],
      },
    ],
    xAxisTitle: 'Product',
    yAxisTitle: 'Cumulative Sales',
    numberFormat: { precision: 0, unit: 'units' },
  },
}
