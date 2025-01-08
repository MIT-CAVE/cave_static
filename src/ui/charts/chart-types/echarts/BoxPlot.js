import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import {
  NumberFormat,
  getDecimalScaleFactor,
  getDecimalScaleLabel,
  findSubgroupLabels,
  getChartItemColor,
  findColoring,
  getQuartiles,
} from '../../../../utils'

// // sort array ascending
// const asc = (arr) => arr.sort((a, b) => a - b)
// const quantile = (arr, q) => {
//   const sorted = asc(arr)
//   const pos = (sorted.length - 1) * q
//   const base = Math.floor(pos)
//   const rest = pos - base
//   if (sorted[base + 1] !== undefined) {
//     return sorted[base] + rest * (sorted[base + 1] - sorted[base])
//   } else {
//     return sorted[base]
//   }
// }

// const calculateBoxPlotStats = (data) => {
//   if (R.isNil(data)) return R.repeat(NaN, 5)
//   const max = Math.max(...data)
//   const min = Math.min(...data)
//   const median = R.median(data)
//   const q1 = quantile(data, 0.25)
//   const q3 = quantile(data, 0.75)
//   return [min, q1, median, q3, max]
// }

const EchartsBoxPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
  showNA,
  chartHoverOrder,
  path,
  xAxisOrder,
}) => {
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const chartType = 'boxplot'

  const series = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) => ({
        name: R.head(d).name,
        type: chartType,
        smooth: true,
        color:
          findColoring(R.head(d).name, colors) ??
          getChartItemColor(R.head(d).name),
        emphasis: {
          focus: 'series',
        },
        data: R.map(
          R.pipe(
            (idx) => R.find(R.propEq(idx, 'index'), d),
            R.when(R.isNotNil, R.prop('value')),
            getQuartiles
          )
        )(R.range(0, Math.max(...R.pluck('index', d)) + 1)),
      })),
      R.sortBy(({ name }) => R.indexOf(name, subGroupLabels))
    ),
    (d) => [
      R.assoc('data', R.map(getQuartiles, d), {
        type: chartType,
        smooth: true,
        emphasis: {
          focus: 'series',
        },
        colorBy: 'data',
        color: R.map(
          (item) => findColoring(item, colors) ?? getChartItemColor(item)
        )(xLabels),
      }),
    ]
  )(yValues)

  const yMax = R.pipe(
    R.pluck('data'),
    R.flatten,
    R.filter(R.isNotNil),
    R.apply(Math.max)
  )(series)

  const legend = R.isEmpty(subGroupLabels)
    ? null
    : {
        type: 'scroll',
        data: subGroupLabels,
        top: 24,
      }

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

  const tooltipOrder = ['Drop', 'Min: ', 'Q1: ', 'Median: ', 'Q3: ', 'Max: ']

  const mapValuesForTooltip = (value) => {
    return value
      .map(
        (val, idx) =>
          `<div>${tooltipOrder[idx]}${NumberFormat.format(val, numberFormat)}</div>`
      )
      .slice(1)
      .join('')
  }

  const options = {
    xAxis: {
      name: xAxisTitle,
      data: xLabels,
    },
    yAxis: {
      name: `${yAxisTitle}${scaleLabel ? ` (${scaleLabel})` : ''}`,
      axisLabel: {
        formatter: (value) =>
          scaleLabel ? (+value / scaleFactor).toPrecision(3) : value,
      },
    },
    series,
    legend,
    tooltip: {
      formatter: (params) => {
        return params.length === 1
          ? `<div style="margin-bottom: 3px">${params[0].marker}<strong>${params[0].name}</strong></div>
          ${params
            .map(({ value }) =>
              R.any(isNaN)(value) && !showNA
                ? false
                : `${mapValuesForTooltip(value)}`
            )
            .filter(R.identity)
            .join('')}`
          : `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
          ${params
            .map(({ marker, seriesName, value }) =>
              R.any(isNaN)(value) && !showNA
                ? false
                : `<div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} <strong>${seriesName}</strong></div>
                  ${mapValuesForTooltip(value)}
                `
            )
            .filter(R.identity)
            .join('')}`
      },
    },
  }

  return <FlexibleChart {...{ options, chartHoverOrder, path, xAxisOrder }} />
}

export { EchartsBoxPlot as BoxPlot }
