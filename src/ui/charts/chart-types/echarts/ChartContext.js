import { createContext } from 'react'

// Per-chart state derived from the `chartObj` and shared with every chart type
// (see `DashboardChart.js` and `DashboardGlobalOutputs.js` for the providers)
const ChartContext = createContext({
  title: '',
  path: undefined,
  chartHoverOrder: undefined,
  xAxisOrder: undefined,
})

export default ChartContext
