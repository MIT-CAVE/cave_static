import { createContext, useContext } from 'react'

import { getValueDisplayName } from '../../../../utils'

// Per-chart state derived from the `chartObj` and shared with every chart type
// (see `DashboardChart.js` and `DashboardGlobalOutputs.js` for the providers)
const ChartContext = createContext({
  // Plain text for the canvas, plus its markup twin and whether to render it
  title: '',
  richTitle: undefined,
  richText: false,
  path: undefined,
  chartHoverOrder: undefined,
  xAxisOrder: undefined,
  // Display names for the raw values of the grouping levels in use (`valueNames`)
  valueNames: {},
})

// Returns a function that maps a raw grouping level value to its display name
export const useValueDisplayName = () =>
  getValueDisplayName(useContext(ChartContext).valueNames)

export default ChartContext
