import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import { Treemap } from '../../ui/charts'

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

const treemapStories = {
  title: 'Charts/Treemap',
  component: Treemap,
  decorators: [reduxDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default treemapStories

export const SimpleTreemap = {
  args: {
    data: [
      {
        name: 'North America',
        children: [
          {
            name: 'USA',
            children: [
              { name: 'California', value: [4200] },
              { name: 'Texas', value: [3800] },
              { name: 'New York', value: [3100] },
            ],
          },
          {
            name: 'Canada',
            children: [
              { name: 'Ontario', value: [1900] },
              { name: 'Quebec', value: [1400] },
            ],
          },
        ],
      },
      {
        name: 'Europe',
        children: [
          {
            name: 'Germany',
            children: [
              { name: 'Bavaria', value: [2800] },
              { name: 'Hesse', value: [2100] },
            ],
          },
          {
            name: 'UK',
            children: [
              { name: 'England', value: [2600] },
              { name: 'Scotland', value: [900] },
            ],
          },
        ],
      },
    ],
    numberFormat: { precision: 0, unit: '$' },
  },
}
