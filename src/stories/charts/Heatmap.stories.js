import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { Heatmap } from '../../ui/charts'

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
