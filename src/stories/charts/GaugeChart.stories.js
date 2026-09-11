import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { GaugeChart } from '../../ui/charts'

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

const gaugeChartStories = {
  title: 'Charts/GaugeChart',
  component: GaugeChart,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default gaugeChartStories

export const SimpleGauge = {
  args: {
    data: [
      { name: 'CPU', value: [72] },
      { name: 'Memory', value: [58] },
      { name: 'Disk', value: [41] },
    ],
    xAxisTitle: 'Resource',
    yAxisTitle: 'System Load (%)',
    numberFormat: { precision: 0, unit: '%' },
  },
}
