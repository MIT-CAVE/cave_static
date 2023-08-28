/** @jsxImportSource @emotion/react */
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { NumberFormat, getMinMax } from '../../../../utils'

const BubblePlot = ({ data, labels, numberFormat, theme, colors }) => {
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
  const [sizeMin, sizeMax] = findAxisRange(2)

  const xRange = xMax - xMin
  const yRange = yMax - yMin
  const sizeRange = sizeMax - sizeMin

  const series = R.map(
    R.mergeRight({
      symbolSize: (data) => (100 * (data[2] + sizeMax)) / (2 * sizeRange),
    })
  )(initialSeries)

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#f5f5f5',
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    title: {
      text: `Size: ${labels[3]}`,
      left: '5%',
      top: 15,
      textStyle: {
        fontSize: 16,
      },
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
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
  }

  // TODO: Prefer FlexibleWrapper here
  return (
    <div style={{ flex: '1 1 auto' }}>
      <AutoSizer>
        {({ height, width }) => (
          <ReactEChartsCore
            echarts={echarts}
            option={options}
            style={{ height, width }}
            theme={theme}
            notMerge
            // lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export { BubblePlot }
