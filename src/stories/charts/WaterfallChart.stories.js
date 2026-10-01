import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { WaterfallChart } from '../../ui/charts'

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

const waterfallStories = {
  title: 'Charts/WaterfallChart',
  component: WaterfallChart,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default waterfallStories

export const SimpleWaterfall = {
  args: {
    data: [
      {
        name: 'Fiscal Year 2025',
        children: [
          { id: 'start', name: 'Starting Cash', value: [1000] },
          { id: 'sales', name: 'Product Sales', value: [650] },
          { id: 'cogs', name: 'COGS', value: [-300] },
          { id: 'opex', name: 'Operating Expenses', value: [-250] },
          { id: 'tax', name: 'Tax', value: [-80] },
        ],
      },
    ],
    xAxisTitle: 'Cash Flow Events',
    yAxisTitle: 'Balance ($M)',
    numberFormat: { precision: 0, unit: '$M' },
  },
}
