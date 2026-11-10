import * as R from 'ramda'

import { FlexibleChart, splitLine } from './BaseChart'
import { useValueDisplayName } from './ChartContext'

import {
  NumberFormat,
  findColoring,
  getMinMax,
  getChartItemColor,
} from '../../../../utils'

const BubblePlot = ({ data, labelProps, numberFormat = {}, colors }) => {
  const getDisplayName = useValueDisplayName()
  const labels = R.pluck('label')(labelProps)
  if (
    R.isNil(data) ||
    R.isEmpty(data) ||
    !R.hasPath([0, 'value', 2], data) ||
    R.any(R.equals('undefined'), labels)
  )
    return []

  const labelKeys = R.pluck('key')(labelProps)
  const labelsExcludingUnits = R.map(R.replace(/\s*\[.*?\]/g, ''))(labels)

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
        color: findColoring(val.name, colors) ?? getChartItemColor(val.name),
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
    NumberFormat.format(
      value,
      numberFormat?.[labelKey] ??
        (R.is(Object, numberFormat) ? numberFormat : {})
    )

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
      splitLine,
    },
    yAxis: {
      name: labels[2],
      min: yMin - 0.01 * yRange,
      max: yMax + 0.01 * yRange,
      splitLine,
    },
    series,
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        // Built without whitespace between tags: the tooltip container uses
        // `white-space: pre-line`, so template newlines render as blank lines
        const rows = [
          [
            labelsExcludingUnits[1],
            getNumberFormat(labelKeys[1], params.value[0]),
          ],
          [
            labelsExcludingUnits[2],
            getNumberFormat(labelKeys[2], params.value[1]),
          ],
          [
            labelsExcludingUnits[3],
            getNumberFormat(labelKeys[3], params.value[2]),
          ],
        ]
          .map(
            ([label, value]) =>
              `<div style="display: flex; justify-content: space-between; gap: 30px"><span>${label}</span><strong>${value}</strong></div>`
          )
          .join('')
        return `<div style="white-space: nowrap"><div style="margin-bottom: 3px"><strong>${getDisplayName(params.seriesName)}</strong></div>${rows}</div>`
      },
    },
    legend: {
      top: 10,
    },
  }

  return <FlexibleChart {...{ options }} />
}

export { BubblePlot }
