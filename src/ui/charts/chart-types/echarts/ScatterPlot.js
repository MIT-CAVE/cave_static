import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, getMinMax } from '../../../../utils'

const ScatterPlot = ({ data, labels, numberFormat, colors }) => {
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 1], data) ||
    R.any(R.equals('undefined'), labels)
  )
    return []

  const baseObject = {
    type: 'scatter',
    smooth: true,
    coordinateSystem: 'cartesian2d',
    emphasis: {
      focus: 'series',
    },
  }

  const series = R.map((val) =>
    R.mergeDeepLeft(
      {
        data: [val.value],
        name: val.name,
        color: R.prop(val.name, colors),
      },
      baseObject
    )
  )(data)

  const findAxisRange = (index) =>
    R.pipe(
      R.pluck('data'),
      R.unnest,
      R.pluck(index),
      R.filter(R.isNotNil),
      getMinMax
    )(series)

  const [xMin, xMax] = findAxisRange(0)
  const [yMin, yMax] = findAxisRange(1)

  const xRange = xMax - xMin
  const yRange = yMax - yMin

  const options = {
    backgroundColor: '#4a4a4a',
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    xAxis: {
      name: labels[1],
      nameGap: 40,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      // This fixes bug where points at the max/min don't render
      min: xMin - 0.01 * xRange,
      max: xMax + 0.01 * xRange,
      axisLine: {
        show: true,
      },
      type: 'value',
    },
    yAxis: {
      name: labels[2],
      type: 'value',
      nameGap: 40,
      nameTextStyle: {
        fontSize: 16,
      },
      nameLocation: 'middle',
      min: yMin - 0.01 * yRange,
      max: yMax + 0.01 * yRange,
      axisLine: {
        show: true,
      },
    },
    legend: {
      // We might deal better with legend overlapping in the future.
      // Keep track of:
      // - https://github.com/apache/echarts/pull/16825
      // - https://github.com/apache/echarts/issues/15654
      type: 'scroll',
      top: 24,
    },
    series,
    tooltip: {
      trigger: 'item',
      formatter: '<b>{a0}</b><br/>{c}<br/>',
      valueFormatter: (value) => NumberFormat.format(value, numberFormat),
      backgroundColor: '#4a4a4a',
      textStyle: {
        color: '#ffffff',
      },
    },
  }

  return <FlexibleChart option={options} />
}

export { ScatterPlot }
