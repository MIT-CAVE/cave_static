import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, getMinMax } from '../../../../utils'

const BubblePlot = ({ data, labels, numberFormat, colors }) => {
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 2], data) ||
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

  const initialSeries = R.map((val) =>
    R.mergeLeft(
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
    )(initialSeries)

  const [xMin, xMax] = findAxisRange(0)
  const [yMin, yMax] = findAxisRange(1)
  const sizeMax = findAxisRange(2)[1]

  const xRange = xMax - xMin
  const yRange = yMax - yMin

  const series = R.map(
    R.mergeRight({
      symbolSize: (data) => (data[2] * 150) / sizeMax,
    })
  )(initialSeries)

  const options = {
    grid: {
      top: 100,
    },
    title: {
      text: `Size: ${labels[3]}`,
      left: '5%',
      top: 50,
      textStyle: {
        fontSize: 20,
      },
    },
    xAxis: {
      name: labels[1],
      // This fixes bug where points at the max/min don't render
      min: xMin - 0.01 * xRange,
      max: xMax + 0.01 * xRange,
      type: 'value',
    },
    yAxis: {
      name: labels[2],
      min: yMin - 0.01 * yRange,
      max: yMax + 0.01 * yRange,
      splitLine: null,
    },
    series,
    tooltip: {
      trigger: 'item',
      formatter: '<b>{a0}</b><br/>{c}<br/>',
      valueFormatter: (value) => NumberFormat.format(value, numberFormat),
    },
    legend: {
      top: 10,
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { BubblePlot }
