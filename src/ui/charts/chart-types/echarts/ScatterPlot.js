/** @jsxImportSource @emotion/react */
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { formatNumber, getMinMax } from '../../../../utils'

const ScatterPlot = ({ data, labels, numberFormat, theme }) => {
  if (R.isNil(data) || R.isEmpty(data) || !R.hasPath([0, 'value', 1], data))
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
    R.mergeLeft(
      {
        data: [val.value],
        name: val.name,
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
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#f5f5f5',
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
      valueFormatter: (value) => formatNumber(value, numberFormat),
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

export { ScatterPlot }
