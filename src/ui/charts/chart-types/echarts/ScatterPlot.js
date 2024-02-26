import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import { NumberFormat, getMinMax } from '../../../../utils'

const ScatterPlot = ({ data, labels: labelsRaw, numberFormat, colors }) => {
  const labelValues = R.values(labelsRaw)
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 1], data) ||
    R.any(R.equals('undefined'), labelValues)
  )
    return []

  const labelKeys = R.keys(labelsRaw)
  const labels = R.map(R.replace(/\s*\[.*?\]/g, ''))(labelValues) // Excluding units

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

  const getNumberFormat = (labelKey, value) =>
    NumberFormat.format(value, numberFormat[labelKey])

  const options = {
    xAxis: {
      type: 'value',
      name: labels[1],
      // This fixes bug where points at the max/min don't render
      min: xMin - 0.01 * xRange,
      max: xMax + 0.01 * xRange,
    },
    yAxis: {
      name: labels[2],
      min: yMin - 0.01 * yRange,
      max: yMax + 0.01 * yRange,
    },
    series,
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        return `<div style="margin-bottom: 3px"><b>${params.seriesName}</b></div>
                <div style="display: flex">
                  <div style="display: flex; flex-direction:column; flex-basis: 40%; align-items: center; margin-right: 30px">
                    <div>${labels[1]}</div>
                    <div>${labels[2]}</div>
                  </div>
                  <div style="display: flex; flex-direction:column; flex-basis: 40%; align-items: flex-end; font-weight:bold">
                  <div>${getNumberFormat(labelKeys[1], params.value[0])}</div>
                  <div>${getNumberFormat(labelKeys[2], params.value[1])}</div>
                  </div>
                </div>
              `
      },
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { ScatterPlot }
