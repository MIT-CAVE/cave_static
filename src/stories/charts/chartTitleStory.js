import { expect, within } from 'storybook/test'

import ChartContext from '../../ui/charts/chart-types/echarts/ChartContext'

export const TITLE = 'Sample Title'

// Provides a chart title to the story, as `DashboardChart` does
export const chartTitleDecorator = (Story) => (
  <ChartContext.Provider value={{ title: TITLE }}>
    <Story />
  </ChartContext.Provider>
)

// The title is drawn above the plot, so it can't overlap anything inside it
export const playChartTitle = async ({ canvasElement }) => {
  const title = await within(canvasElement).findByText(TITLE)
  await new Promise((resolve) => setTimeout(resolve, 300))
  const canvas = canvasElement.querySelector('canvas')
  expect(canvas).not.toBeNull()
  expect(title.getBoundingClientRect().bottom).toBeLessThanOrEqual(
    canvas.getBoundingClientRect().top
  )
}
