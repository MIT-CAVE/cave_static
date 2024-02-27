import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, getMinMax } from '../../../../utils'

const BubblePlot = ({ data, labelProps, numberFormat, colors }) => {
  const labels = R.pluck('label')(labelProps)
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 2], data) ||
    R.any(R.equals('undefined'), labels)
  )
    return []

  const labelKeys = R.pluck('field')(labelProps)
  const labelsExcludingUnits = R.map(R.replace(/\s*\[.*?\]/g, ''))(labels) // Excluding units

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

  const getNumberFormat = (labelKey, value) =>
    NumberFormat.format(value, numberFormat[labelKey])

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
      formatter: function (params) {
        return `<div style="margin-bottom: 3px"><b>${params.seriesName}</b></div>
                <div style="display: flex">
                  <div style="display: flex; flex-direction:column; flex-basis: 40%; align-items: center; margin-right: 30px">
                    <div>${labelsExcludingUnits[1]}</div>
                    <div>${labelsExcludingUnits[2]}</div>
                    <div>${labelsExcludingUnits[3]}</div>
                  </div>
                  <div style="display: flex; flex-direction:column; flex-basis: 40%; align-items: flex-end; font-weight:bold">
                    <div>${getNumberFormat(labelKeys[1], params.value[0])}</div>
                    <div>${getNumberFormat(labelKeys[2], params.value[1])}</div>
                    <div>${getNumberFormat(labelKeys[3], params.value[2])}</div>
                  </div>
                </div>
              `
      },
    },
    legend: {
      top: 10,
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { BubblePlot }
