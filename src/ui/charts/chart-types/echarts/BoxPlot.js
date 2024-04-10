import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import {
  NumberFormat,
  getDecimalScaleFactor,
  getDecimalScaleLabel,
  findSubgroupLabels,
  getChartItemColor,
  findColoring,
} from '../../../../utils'

// sort array ascending
const asc = (arr) => arr.sort((a, b) => a - b)
const quantile = (arr, q) => {
  const sorted = asc(arr)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

const calculateBoxPlotStats = (data) => {
  if (R.isNil(data)) return R.repeat(NaN, 5)
  const max = Math.max(...data)
  const min = Math.min(...data)
  const median = R.median(data)
  const q1 = quantile(data, 0.25)
  const q3 = quantile(data, 0.75)
  return [min, q1, median, q3, max]
}

const EchartsBoxPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
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
        color: findColoring(R.head(d).name, colors),
        emphasis: {
          focus: 'series',
        },
        data: R.map(
          R.pipe(
            (idx) => R.find(R.propEq(idx, 'index'), d),
            R.when(R.isNotNil, R.prop('value')),
            calculateBoxPlotStats
          )
        )(R.range(0, Math.max(...R.pluck('index', d)) + 1)),
      })),
      R.sortBy(({ name }) => R.indexOf(name, subGroupLabels))
    ),
    (d) => [
      R.assoc('data', R.map(calculateBoxPlotStats, d), {
        type: chartType,
        smooth: true,
        emphasis: {
          focus: 'series',
        },
        colorBy: 'data',
        color: R.addIndex(R.map)(
          (item, idx) => findColoring(item, colors) ?? getChartItemColor(idx)
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
      valueFormatter: (value) =>
        R.equals([])(value) // Skip extraneous value (EChart's bug?)
          ? null
          : NumberFormat.format(value, numberFormat),
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { EchartsBoxPlot as BoxPlot }
