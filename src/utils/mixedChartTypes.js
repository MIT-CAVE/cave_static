const MIXED_CHART_TYPES = ['line', 'cumulative_line', 'bar']

// How each side of a mixed chart is drawn when it is not specified
const DEFAULT_MIXED_CHART_TYPES = { left: 'line', right: 'bar' }

/**
 * Gets how a side of a mixed chart is drawn. It is the `leftChartType` (or
 * `rightChartType`) of the `chartOptions` of the chart. Charts edited before
 * these options were used have a `leftVariant` (or `rightVariant`) instead.
 * Values that a mixed chart cannot draw are ignored.
 * @param {Object} chartObj The chart.
 * @param {'left'|'right'} side The side of the chart.
 * @returns {string}
 */
export const getMixedChartType = (chartObj, side) => {
  const chartType =
    chartObj?.chartOptions?.[`${side}ChartType`] ?? chartObj?.[`${side}Variant`]
  return MIXED_CHART_TYPES.includes(chartType)
    ? chartType
    : DEFAULT_MIXED_CHART_TYPES[side]
}
