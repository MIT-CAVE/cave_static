import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, findSubgroupLabels } from '../../../../utils'

const Heatmap = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
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

  const series = R.pipe(
    R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
    R.flatten,
    R.collectBy(R.prop('name')),
    R.addIndex(R.map)((d, yidx) => {
      const indices = R.pluck('index', d).filter(
        (i) => typeof i === 'number' && !isNaN(i)
      )
      const maxIdx = indices.length > 0 ? Math.max(...indices) : -1
      if (maxIdx < 0) return []
      const lookup = new Map()
      for (let i = 0; i < d.length; i++) {
        lookup.set(d[i].index, d[i])
      }
      const points = []
      for (let xidx = 0; xidx <= maxIdx; xidx++) {
        const val = lookup.get(xidx)
        if (val != null) {
          points.push([xidx, yidx, val.value?.[0] ?? yValues[xidx]?.[0]])
        }
      }
      return points
    }),
    R.unnest
  )(yValues)

  let yMin = Infinity
  let yMax = -Infinity
  for (let i = 0; i < series.length; i++) {
    const val = series[i][2]
    if (typeof val === 'number' && !isNaN(val)) {
      if (val < yMin) yMin = val
      if (val > yMax) yMax = val
    }
  }
  if (yMin === Infinity) yMin = 0
  if (yMax === -Infinity) yMax = 0

  const options = {
    visualMap: {
      min: yMin,
      max: yMax,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: '5',
    },
    xAxis: {
      type: 'category',
      name: xAxisTitle,
      splitArea: {
        show: true,
      },
      data: xLabels,
    },
    yAxis: {
      type: 'category',
      name: yAxisTitle,
      splitArea: {
        show: true,
      },
      data: subGroupLabels,
    },
    series: {
      data: series,
      type: 'heatmap',
      label: {
        formatter: (params) =>
          NumberFormat.format(params.data[2], numberFormat),
        show: true,
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0, 0, 0, 0.5)',
        },
      },
    },
    tooltip: {
      valueFormatter: (value) => NumberFormat.format(value, numberFormat),
    },
  }

  return <FlexibleChart {...{ options, chartHoverOrder, path, xAxisOrder }} />
}

export { Heatmap }
