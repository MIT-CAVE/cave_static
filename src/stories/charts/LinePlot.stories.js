import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { LinePlot } from '../../ui/charts'

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

const linePlotStories = {
  title: 'Charts/LinePlot',
  component: LinePlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default linePlotStories

export const SimpleLine = {
  args: {
    data: [
      { name: 'Jan', value: [120] },
      { name: 'Feb', value: [150] },
      { name: 'Mar', value: [210] },
      { name: 'Apr', value: [190] },
      { name: 'May', value: [280] },
      { name: 'Jun', value: [310] },
    ],
    xAxisTitle: 'Month',
    yAxisTitle: 'Daily Active Users',
    numberFormat: { precision: 0 },
  },
}

export const MultiSeriesSubgroupedLine = {
  args: {
    data: [
      {
        name: 'Product A',
        children: [
          { id: '2023', name: '2023', value: [420] },
          { id: '2024', name: '2024', value: [580] },
          { id: '2025', name: '2025', value: [750] },
        ],
      },
      {
        name: 'Product B',
        children: [
          { id: '2023', name: '2023', value: [310] },
          { id: '2024', name: '2024', value: [490] },
          { id: '2025', name: '2025', value: [630] },
        ],
      },
    ],
    xAxisTitle: 'Product Line',
    yAxisTitle: 'Annual Sales ($)',
    numberFormat: { precision: 0, unit: '$' },
  },
}

export const AreaStackedLine = {
  args: {
    data: [
      {
        name: 'Server Cluster 1',
        children: [
          { id: 'cpu', name: 'CPU Load', value: [65] },
          { id: 'mem', name: 'Memory Load', value: [80] },
          { id: 'disk', name: 'Disk I/O', value: [45] },
        ],
      },
      {
        name: 'Server Cluster 2',
        children: [
          { id: 'cpu', name: 'CPU Load', value: [55] },
          { id: 'mem', name: 'Memory Load', value: [70] },
          { id: 'disk', name: 'Disk I/O', value: [35] },
        ],
      },
    ],
    area: true,
    stack: 'total',
    xAxisTitle: 'Cluster',
    yAxisTitle: 'Resource Utilization (%)',
    numberFormat: { precision: 1, unit: '%' },
  },
}
