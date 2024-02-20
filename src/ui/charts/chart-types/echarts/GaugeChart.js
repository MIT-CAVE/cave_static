import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import {
  NumberFormat,
  adjustMinMax,
  getMinMax,
  getChartItemColor,
} from '../../../../utils'

const GaugeChart = ({ data, xAxisTitle, yAxisTitle, numberFormat, colors }) => {
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const baseObject = {
    type: 'gauge',
    anchor: {
      show: true,
      showAbove: true,
      size: 18,
    },
    pointer: {
      icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
      width: 8,
      length: '80%',
    },
    progress: {
      show: true,
      overlap: false,
    },
    axisLine: {
      lineStyle: {
        width: 20,
      },
    },
    axisLabel: {
      distance: 25,
    },
    smooth: true,
    emphasis: {
      focus: 'series',
    },
    detail: {
      width: 40,
      height: 14,
      fontSize: 14,
      borderColor: 'inherit',
      borderWidth: 1,
      borderRadius: 3,
      overflow: 'truncate',
    },
  }

  const dataLength = R.length(yValues)
  const labelSpacings = R.pipe(
    R.map(R.length),
    R.reduce(R.max, 0),
    R.multiply(4),
    R.clamp(40, 115)
  )(xLabels)
  const calculateOffset = (idx) => (idx - (dataLength - 1) / 2) * labelSpacings
  const createSeriesData = (values) =>
    R.pipe(
      R.unnest,
      R.mapAccum(
        (acc, value) => [
          acc + 1,
          {
            value,
            name: xLabels[acc],
            title: {
              offsetCenter: [`${calculateOffset(acc)}%`, '90%'],
            },
            detail: {
              offsetCenter: [`${calculateOffset(acc)}%`, '103%'],
              formatter: () => {
                return `${NumberFormat.format(value, numberFormat)}`
              },
            },
          },
        ],
        0
      ),
      R.last
    )(values)

  const initialSeries = [
    R.mergeDeepLeft(R.assoc('data', createSeriesData(yValues), baseObject), {
      colorBy: 'data',
      color: R.addIndex(R.map)((item, idx) =>
        R.has(item, colors) ? R.prop(item, colors) : getChartItemColor(idx)
      )(xLabels),
    }),
  ]
  const [yMin, yMax] = R.pipe(
    R.flatten,
    R.filter(R.isNotNil),
    getMinMax,
    R.apply(adjustMinMax)
  )(yValues)
  const series = R.pipe(
    R.assocPath([0, 'min'], yMin > 0 ? 0 : yMin),
    R.assocPath([0, 'max'], yMax)
  )(initialSeries)

  const options = {
    xAxis: {
      name: xAxisTitle,
      axisLine: {
        show: false,
      },
    },
    title: {
      text: yAxisTitle,
      left: 'center',
      top: 15,
      textStyle: {
        fontSize: 20,
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
    },
    series,
  }

  return <FlexibleChart {...{ options }} />
}

export { GaugeChart }
