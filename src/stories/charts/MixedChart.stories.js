import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { MixedChart } from '../../ui/charts'

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

const mixedChartStories = {
  title: 'Charts/MixedChart',
  component: MixedChart,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default mixedChartStories

export const SimpleMixedChart = {
  args: {
    data: [
      { name: 'Jan', value: [1200, 24.5] },
      { name: 'Feb', value: [1450, 26.0] },
      { name: 'Mar', value: [1800, 28.2] },
      { name: 'Apr', value: [2100, 31.0] },
      { name: 'May', value: [2400, 33.5] },
      { name: 'Jun', value: [2800, 35.0] },
    ],
    labelProps: [
      { label: 'Month', key: 'month' },
      { label: 'Revenue ($k)', key: 'revenue' },
      { label: 'Margin (%)', key: 'margin' },
    ],
    leftVariant: 'bar',
    rightVariant: 'line',
    numberFormat: {
      revenue: { precision: 0, unit: '$k' },
      margin: { precision: 1, unit: '%' },
    },
  },
}
