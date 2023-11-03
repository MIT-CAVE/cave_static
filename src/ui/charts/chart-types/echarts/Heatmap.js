import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, findSubgroupLabels, getMinMax } from '../../../../utils'

const Heatmap = ({ data, xAxisTitle, yAxisTitle, numberFormat }) => {
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
    R.addIndex(R.map)((d, yidx) =>
      R.map((xidx) =>
        R.pipe(
          (idx) => R.find(R.propEq(idx, 'index'), d),
          R.when(R.isNotNil, (val) => [
            xidx,
            yidx,
            R.pathOr(yValues[xidx][0], ['value', 0], val),
          ])
        )(xidx)
      )(R.range(0, Math.max(...R.pluck('index', d)) + 1))
    ),
    R.unnest,
    R.filter(R.isNotNil)
  )(yValues)

  const [yMin, yMax] = R.pipe(R.pluck(2), getMinMax)(series)

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

  return <FlexibleChart {...{ options }} />
}

export { Heatmap }
