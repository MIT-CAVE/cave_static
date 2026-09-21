import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { BarPlot } from '../../ui/charts'

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

const barPlotStories = {
  title: 'Charts/BarPlot',
  component: BarPlot,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default barPlotStories

export const SimpleBar = {
  args: {
    data: [
      { name: 'North', value: [120] },
      { name: 'South', value: [200] },
      { name: 'East', value: [150] },
      { name: 'West', value: [80] },
    ],
    xAxisTitle: 'Region',
    yAxisTitle: 'Shipments',
    numberFormat: { precision: 0, unit: 'units' },
  },
}

export const GroupedAndSubgroupedBar = {
  args: {
    data: [
      {
        name: '2024',
        children: [
          { id: 'q1', name: 'Q1', value: [320] },
          { id: 'q2', name: 'Q2', value: [450] },
          { id: 'q3', name: 'Q3', value: [390] },
          { id: 'q4', name: 'Q4', value: [510] },
        ],
      },
      {
        name: '2025',
        children: [
          { id: 'q1', name: 'Q1', value: [380] },
          { id: 'q2', name: 'Q2', value: [520] },
          { id: 'q3', name: 'Q3', value: [460] },
          { id: 'q4', name: 'Q4', value: [600] },
        ],
      },
    ],
    xAxisTitle: 'Year',
    yAxisTitle: 'Revenue ($)',
    numberFormat: { precision: 0, unit: '$' },
  },
}

export const StackedBar = {
  args: {
    data: [
      {
        name: 'Warehouse A',
        children: [
          { id: 'stored', name: 'Stored', value: [1200] },
          { id: 'in_transit', name: 'In Transit', value: [450] },
          { id: 'dispatched', name: 'Dispatched', value: [800] },
        ],
      },
      {
        name: 'Warehouse B',
        children: [
          { id: 'stored', name: 'Stored', value: [950] },
          { id: 'in_transit', name: 'In Transit', value: [300] },
          { id: 'dispatched', name: 'Dispatched', value: [650] },
        ],
      },
    ],
    stack: 'total',
    xAxisTitle: 'Facility',
    yAxisTitle: 'Inventory Volume',
    numberFormat: { precision: 0, unit: 'crates' },
  },
}
