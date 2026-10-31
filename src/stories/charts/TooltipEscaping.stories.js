import { configureStore } from '@reduxjs/toolkit'
import * as echarts from 'echarts/core'
import { Provider } from 'react-redux'
import { expect } from 'storybook/test'

import {
  BarPlot,
  BoxPlot,
  BubblePlot,
  Heatmap,
  ScatterPlot,
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

const reduxDecorator = (Story) => (
  <Provider store={mockStore}>
    <div style={{ height: '400px', width: '100%' }}>
      <Story />
    </div>
  </Provider>
)

const tooltipEscapingStories = {
  title: 'Charts/TooltipEscaping',
  decorators: [reduxDecorator],
  parameters: { layoutWidth: 'full' },
}

export default tooltipEscapingStories

// Names, labels and units come from the data, so they must be shown as text
// in the tooltips, which ECharts renders from HTML strings
const NAME = '<img src=x onerror="window.__xss = \'name\'">'
const SERIES = '<b onmouseover="window.__xss = \'series\'">series</b>'
const LABEL = '<i onmouseover="window.__xss = \'label\'">label</i>'
const UNIT = '<u onmouseover="window.__xss = \'unit\'">unit</u>'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const expectInertTooltip = async (canvasElement, literals, dataIndex = 0) => {
  delete window.__xss
  await wait(500)
  const chart = echarts.getInstanceByDom(
    canvasElement.querySelector('.echarts-for-react')
  )
  chart.dispatchAction({ type: 'showTip', seriesIndex: 0, dataIndex })
  await wait(300)
  // The tooltip is the only element that `BaseChart` sizes with `fit-content`
  const tooltip = canvasElement.querySelector('div[style*="fit-content"]')
  await expect(tooltip).not.toBeNull()
  // The text is shown, but nothing it contains became an element
  // NOTE: `b` is not listed, as some tooltips use it for their title. Injected
  // elements are caught by their handlers and by their text being shown
  await expect(
    tooltip.querySelectorAll('img, script, iframe, u, i')
  ).toHaveLength(0)
  const handlers = [...tooltip.querySelectorAll('*')].filter((element) =>
    element.getAttributeNames().some((name) => name.startsWith('on'))
  )
  await expect(handlers).toHaveLength(0)
  for (const literal of literals) {
    await expect(tooltip.textContent).toContain(literal)
  }
  // Give a rejected `<img onerror>` the time to fire if it was left in
  await wait(200)
  await expect(window.__xss).toBeUndefined()
}

export const BarSingleSeries = {
  render: () => (
    <BarPlot
      data={[{ name: NAME, value: [5] }]}
      xAxisTitle="Region"
      yAxisTitle="Shipments"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, ['<img src=x', '<u onmouseover']),
}

export const BarMultipleSeries = {
  render: () => (
    <BarPlot
      data={[
        {
          name: NAME,
          children: [
            { id: 'a', name: SERIES, value: [5] },
            { id: 'b', name: 'Other', value: [7] },
          ],
        },
      ]}
      xAxisTitle="Region"
      yAxisTitle="Shipments"
      numberFormat={{
        a: { precision: 0, unit: UNIT },
        b: { precision: 0, unit: 'kg' },
      }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, [
      '<img src=x',
      '<b onmouseover',
      '<u onmouseover',
    ]),
}

export const BarSeriesWithSingleNumberFormat = {
  render: () => (
    <BarPlot
      data={[
        {
          name: NAME,
          children: [
            { id: 'a', name: SERIES, value: [5] },
            { id: 'b', name: 'Other', value: [7] },
          ],
        },
      ]}
      xAxisTitle="Region"
      yAxisTitle="Shipments"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, [
      '<img src=x',
      '<b onmouseover',
      '<u onmouseover',
    ]),
}

export const BoxSingleGroup = {
  render: () => (
    <BoxPlot
      data={[{ name: NAME, value: [10, 20, 25, 30, 35, 40, 50] }]}
      xAxisTitle="Cohort"
      yAxisTitle="Response time"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, ['<img src=x', '<u onmouseover']),
}

export const BoxSubgroups = {
  render: () => (
    <BoxPlot
      data={[
        {
          name: NAME,
          children: [
            { name: SERIES, value: [12, 24, 30, 36, 45] },
            { name: 'Evening', value: [18, 32, 40, 48, 60] },
          ],
        },
      ]}
      xAxisTitle="Region"
      yAxisTitle="Latency"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, [
      '<img src=x',
      '<b onmouseover',
      '<u onmouseover',
    ]),
}

export const Waterfall = {
  render: () => (
    <WaterfallChart
      data={[
        {
          name: NAME,
          children: [
            { id: 'start', name: SERIES, value: [1000] },
            { id: 'sales', name: 'Sales', value: [650] },
            { id: 'cogs', name: 'COGS', value: [-300] },
          ],
        },
      ]}
      xAxisTitle="Events"
      yAxisTitle="Balance"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, ['<u onmouseover']),
}

export const Scatter = {
  render: () => (
    <ScatterPlot
      data={[{ name: NAME, value: [10, 25] }]}
      labelProps={[
        { label: 'Site', key: 'name' },
        { label: LABEL, key: 'traffic' },
        { label: SERIES, key: 'sales' },
      ]}
      numberFormat={{
        traffic: { precision: 0, unit: UNIT },
        sales: { precision: 0 },
      }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, [
      '<img src=x',
      '<i onmouseover',
      '<b onmouseover',
      '<u onmouseover',
    ]),
}

export const Bubble = {
  render: () => (
    <BubblePlot
      data={[{ name: NAME, value: [15, 30, 120] }]}
      labelProps={[
        { label: 'Branch', key: 'branch' },
        { label: LABEL, key: 'staff' },
        { label: SERIES, key: 'revenue' },
        { label: 'Traffic', key: 'traffic' },
      ]}
      numberFormat={{
        staff: { precision: 0, unit: UNIT },
        revenue: { precision: 0 },
        traffic: { precision: 0 },
      }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, [
      '<img src=x',
      '<i onmouseover',
      '<b onmouseover',
      '<u onmouseover',
    ]),
}

// These charts use the default tooltip of ECharts with a `valueFormatter`
const NESTED_DATA = [
  {
    name: NAME,
    children: [
      { name: SERIES, value: [4200] },
      { name: 'Other', value: [3800] },
    ],
  },
]

export const HeatmapDefaultTooltip = {
  render: () => (
    <Heatmap
      data={NESTED_DATA}
      xAxisTitle="Region"
      yAxisTitle="Period"
      numberFormat={{ precision: 0, unit: UNIT }}
    />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, ['<u onmouseover']),
}

export const TreemapDefaultTooltip = {
  render: () => (
    <Treemap data={NESTED_DATA} numberFormat={{ precision: 0, unit: UNIT }} />
  ),
  play: ({ canvasElement }) =>
    expectInertTooltip(canvasElement, ['<u onmouseover']),
}

export const SunburstDefaultTooltip = {
  render: () => (
    <Sunburst data={NESTED_DATA} numberFormat={{ precision: 0, unit: UNIT }} />
  ),
  play: ({ canvasElement }) =>
    // The slice at index 0 is not the first one in a sunburst
    expectInertTooltip(canvasElement, ['<u onmouseover'], 1),
}
