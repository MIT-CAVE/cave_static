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
  if (R.isNil(data) || R.isEmpty(data)) return null

  const xLabels = R.pluck('name', data)

  const headData = R.head(data)
  const yValues =
    headData && R.has('children', headData)
      ? R.pluck('children', data)
      : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const chartType = 'boxplot'

  const hasSubObjects =
    Array.isArray(yValues) &&
    yValues.length > 0 &&
    Array.isArray(yValues[0]) &&
    yValues[0].length > 0 &&
    typeof yValues[0][0] === 'object' &&
    yValues[0][0] !== null

  const series = hasSubObjects
    ? R.pipe(
        R.addIndex(R.map)((d, idx) =>
          Array.isArray(d) ? R.map(R.assoc('index', idx))(d) : []
        ),
        R.flatten,
        R.filter((item) => item && item.name != null),
        R.collectBy(R.prop('name')),
        R.map((d) => {
          if (!d || d.length === 0) return null
          const headItem = R.head(d)
          const indices = R.pluck('index', d).filter(
            (i) => typeof i === 'number' && !isNaN(i)
          )
          const maxIdx = indices.length > 0 ? Math.max(...indices) : -1
          if (maxIdx < 0) return null
          const dataArr = new Array(maxIdx + 1)
          const lookup = new Map()
          for (let i = 0; i < d.length; i++) {
            lookup.set(d[i].index, d[i].value)
          }
          for (let i = 0; i <= maxIdx; i++) {
            dataArr[i] = getQuartiles(lookup.get(i))
          }
          return {
            name: headItem?.name,
            type: chartType,
            smooth: true,
            color:
              findColoring(headItem?.name, colors) ??
              getChartItemColor(headItem?.name),
            emphasis: {
              focus: 'series',
            },
            data: dataArr,
          }
        }),
        R.filter(Boolean),
        R.sortBy(({ name }) => R.indexOf(name, subGroupLabels))
      )(yValues)
    : [
        {
          type: chartType,
          smooth: true,
          emphasis: {
            focus: 'series',
          },
          colorBy: 'data',
          color: R.map(
            (item) => findColoring(item, colors) ?? getChartItemColor(item)
          )(xLabels),
          data: R.map((item) => {
            const raw = Array.isArray(item) ? item : [item]
            return getQuartiles(raw)
          }, yValues),
        },
      ]

  let yMax = 0
  for (let s = 0; s < series.length; s++) {
    const sData = series[s]?.data
    if (Array.isArray(sData)) {
      for (let i = 0; i < sData.length; i++) {
        const item = sData[i]
        if (Array.isArray(item)) {
          for (let j = 0; j < item.length; j++) {
            const val = item[j]
            if (typeof val === 'number' && !isNaN(val) && val > yMax) {
              yMax = val
            }
          }
        }
      }
    }
  }

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
