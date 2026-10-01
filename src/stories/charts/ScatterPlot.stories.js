import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { ScatterPlot } from '../../ui/charts'

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

const scatterPlotStories = {
  title: 'Charts/ScatterPlot',
  component: ScatterPlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default scatterPlotStories

export const SimpleScatter = {
  args: {
    data: [
      { name: 'Site A', value: [10, 25] },
      { name: 'Site B', value: [20, 45] },
      { name: 'Site C', value: [30, 35] },
      { name: 'Site D', value: [40, 70] },
      { name: 'Site E', value: [50, 60] },
    ],
    labelProps: [
      { label: 'Site Name', key: 'name' },
      { label: 'Foot Traffic', key: 'traffic' },
      { label: 'Sales ($k)', key: 'sales' },
    ],
    numberFormat: {
      traffic: { precision: 0 },
      sales: { precision: 0, unit: '$k' },
    },
  },
}
