import React from 'react'
import { expect, within } from 'storybook/test'

import { TableChart } from '../../ui/charts'
import ChartContext from '../../ui/charts/chart-types/echarts/ChartContext'

const tableChartDecorator = (Story) => (
  <div
    style={{
      height: '500px',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}
  >
    <Story />
  </div>
)

const tableChartStories = {
  title: 'Charts/TableChart',
  component: TableChart,
  decorators: [tableChartDecorator],
  parameters: {
    layoutWidth: 'full',
  },
}

export default tableChartStories

export const SimpleTable = {
  args: {
    data: [
      { name: 'Node Alpha', value: [1250, 42.5] },
      { name: 'Node Beta', value: [980, 31.0] },
      { name: 'Node Gamma', value: [1420, 58.2] },
      { name: 'Node Delta', value: [830, 24.8] },
    ],
    labelProps: [
      { label: 'Facility Name', key: 'name', type: 'string' },
      { label: 'Capacity (MW)', key: 'capacity', type: 'number' },
      { label: 'Efficiency (%)', key: 'efficiency', type: 'number' },
    ],
    numberFormat: {
      capacity: { precision: 0, unit: 'MW' },
      efficiency: { precision: 1, unit: '%' },
    },
  },
}

export const GroupedHierarchicalTable = {
  args: {
    data: [
      {
        name: 'Americas',
        children: [
          { name: 'USA', value: [450000, 120] },
          { name: 'Canada', value: [180000, 45] },
          { name: 'Brazil', value: [220000, 60] },
        ],
      },
      {
        name: 'Europe',
        children: [
          { name: 'Germany', value: [380000, 95] },
          { name: 'France', value: [290000, 75] },
          { name: 'UK', value: [310000, 80] },
        ],
      },
    ],
    labelProps: [
      { label: 'Region', key: 'region', type: 'string' },
      { label: 'Country', key: 'country', type: 'string' },
      { label: 'Revenue ($)', key: 'revenue', type: 'number' },
      { label: 'Sites', key: 'sites', type: 'number' },
    ],
    numberFormat: {
      revenue: { precision: 0, unit: '$' },
      sites: { precision: 0 },
    },
  },
}

// Raw boolean values are shown with their declared `valueNames`, or capitalized
export const BooleanValuesWithValueNames = {
  decorators: [
    (Story) => (
      <ChartContext.Provider
        value={{ title: 'Sales by Type', valueNames: { true: 'Organic' } }}
      >
        <Story />
      </ChartContext.Provider>
    ),
  ],
  args: {
    data: [
      { name: 'true', value: [320] },
      { name: 'false', value: [450] },
    ],
    labelProps: [
      { label: 'Type', key: 'name', type: 'string' },
      { label: 'Sales', key: 'sales', type: 'number' },
    ],
    numberFormat: { sales: { precision: 0 } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText('Organic')).toBeInTheDocument()
    expect(await canvas.findByText('False')).toBeInTheDocument()
    expect(canvas.queryByText('true')).toBeNull()
  },
}
