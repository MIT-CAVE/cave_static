import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { BubblePlot } from '../../ui/charts'

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

const bubblePlotStories = {
  title: 'Charts/BubblePlot',
  component: BubblePlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default bubblePlotStories

export const SimpleBubble = {
  args: {
    data: [
      { name: 'Branch Alpha', value: [15, 30, 120] },
      { name: 'Branch Beta', value: [25, 55, 240] },
      { name: 'Branch Gamma', value: [35, 40, 180] },
      { name: 'Branch Delta', value: [45, 80, 310] },
      { name: 'Branch Epsilon', value: [55, 65, 150] },
    ],
    labelProps: [
      { label: 'Branch', key: 'branch' },
      { label: 'Staff Count', key: 'staff' },
      { label: 'Revenue ($k)', key: 'revenue' },
      { label: 'Foot Traffic', key: 'traffic' },
    ],
    numberFormat: {
      staff: { precision: 0 },
      revenue: { precision: 0, unit: '$k' },
      traffic: { precision: 0 },
    },
  },
}
