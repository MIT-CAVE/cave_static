import { createContext, useContext, useState } from 'react'

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
  // Whether the x-axis of the chart can be sorted (see `sortableChartTypes`)
  sortable: false,
  // Whether the chart takes the whole card (the card has no padding then)
  maximized: false,
  // Whether the controls below the chart are shown, and the values of the ones
  // that are not saved in the chart (see `useChartControl`)
  controlsVisible: true,
  controlValues: {},
  onControlValueChange: undefined,
  // Display names for the raw values of the grouping levels in use (`valueNames`)
  valueNames: {},
})

// Returns a function that maps a raw grouping level value to its display name
export const useValueDisplayName = () =>
  getValueDisplayName(useContext(ChartContext).valueNames)

/**
 * The value of a control of the chart that is not saved in it (e.g., `syncAxes`),
 * and its setter. The value is kept by the card of the chart if it provides a
 * setter, so that the card can tell if it has its default value; otherwise it
 * is local.
 * @param {string} key The name of the control.
 * @param {*} defaultValue The value of the control until it is changed.
 * @returns {[*, Function]}
 */
export const useChartControl = (key, defaultValue) => {
  const { controlValues, onControlValueChange } = useContext(ChartContext)
  const [localValue, setLocalValue] = useState(defaultValue)
  return onControlValueChange
    ? [
        controlValues[key] ?? defaultValue,
        (value) => onControlValueChange(key, value),
      ]
    : [localValue, setLocalValue]
}

export default ChartContext
