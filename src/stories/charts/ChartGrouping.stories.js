import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'

import {
  BarPlot,
  LinePlot,
  MixedChart,
  Sunburst,
  Treemap,
  WaterfallChart,
} from '../../ui/charts'

const mockStore = configureStore({
  reducer: {
    data: (state = {}) => state,
    local: (state = {}) => state,
    utilities: (state = {}) => state,
  },
})

const chartContainerDecorator = (Story) => (
  <Provider store={mockStore}>
    <div style={{ height: '450px', width: '100%', padding: '16px' }}>
      <Story />
    </div>
  </Provider>
)

const chartGroupingStories = {
  title: 'Charts/GroupingAndSubgrouping',
  decorators: [chartContainerDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default chartGroupingStories

// Hierarchical multi-level dataset
const multiLevelData = [
  {
    name: 'North America',
    children: [
      {
        name: 'United States',
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
        name: 'United Kingdom',
        children: [
          { name: 'England', value: [2600] },
          { name: 'Scotland', value: [900] },
        ],
      },
    ],
  },
]

export const SunburstHierarchicalGrouping = {
  render: () => (
    <Sunburst
      data={multiLevelData}
      numberFormat={{ precision: 0, unit: '$' }}
    />
  ),
}

export const TreemapHierarchicalGrouping = {
  render: () => (
    <Treemap data={multiLevelData} numberFormat={{ precision: 0, unit: '$' }} />
  ),
}

export const WaterfallSubgrouped = {
  render: () => (
    <WaterfallChart
      data={[
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
      ]}
      xAxisTitle="Cash Flow Events"
      yAxisTitle="Balance ($M)"
      numberFormat={{ precision: 0, unit: '$M' }}
    />
  ),
}

export const MixedBarAndLineGrouping = {
  render: () => (
    <MixedChart
      data={[
        {
          name: 'Jan',
          value: [1200, 24.5],
        },
        {
          name: 'Feb',
          value: [1450, 26.0],
        },
        {
          name: 'Mar',
          value: [1800, 28.2],
        },
      ]}
      labelProps={[
        { label: 'Month' },
        { label: 'Revenue ($k)' },
        { label: 'Margin (%)' },
      ]}
      leftVariant="bar"
      rightVariant="line"
      numberFormat={{
        revenue: { precision: 0, unit: '$k' },
        margin: { precision: 1, unit: '%' },
      }}
    />
  ),
}

export const MultiGroupedBarPlot = {
  render: () => (
    <BarPlot
      data={[
        {
          name: 'Red',
          children: [
            { name: 'Michigan ➝ USA', value: [175] },
            { name: 'Massachusetts ➝ USA', value: [190] },
            { name: 'Ontario ➝ Canada', value: [199] },
            { name: 'Quebec ➝ Canada', value: [196] },
          ],
        },
        {
          name: 'Purple',
          children: [
            { name: 'Michigan ➝ USA', value: [60] },
            { name: 'Massachusetts ➝ USA', value: [65] },
            { name: 'Ontario ➝ Canada', value: [67] },
            { name: 'Quebec ➝ Canada', value: [75] },
          ],
        },
      ]}
      xAxisTitle="Product Colors"
      yAxisTitle="Sales (units)"
      numberFormat={{ precision: 0, unit: 'units' }}
    />
  ),
}

export const MultiGroupedLineDivisorPlot = {
  render: () => (
    <LinePlot
      data={[
        {
          name: 'Red',
          children: [
            { name: 'Michigan ➝ USA', value: [0.897] },
            { name: 'Massachusetts ➝ USA', value: [0.913] },
            { name: 'Ontario ➝ Canada', value: [0.926] },
            { name: 'Quebec ➝ Canada', value: [0.942] },
          ],
        },
        {
          name: 'Purple',
          children: [
            { name: 'Michigan ➝ USA', value: [0.857] },
            { name: 'Massachusetts ➝ USA', value: [0.833] },
            { name: 'Ontario ➝ Canada', value: [1.0] },
            { name: 'Quebec ➝ Canada', value: [0.843] },
          ],
        },
      ]}
      xAxisTitle="Product Colors"
      yAxisTitle="Fulfillment Ratio (sales / demand)"
      numberFormat={{ precision: 2 }}
    />
  ),
}
