/** @jsxImportSource @emotion/react */
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { formatNumber, getMinMax } from '../../../../utils'

const Heatmap = ({ data, xAxisTitle, numberFormat, theme }) => {
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = R.pipe(
    R.map(R.pluck('name')),
    R.map(R.filter(R.isNotNil)),
    R.reduce(R.concat, []),
    R.uniq
  )(yValues)

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
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#f5f5f5',
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    visualMap: {
      min: yMin,
      max: yMax,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: '5',
    },
    xAxis: {
      name: xAxisTitle,
      nameGap: 40,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      splitArea: {
        show: true,
      },
      type: 'category',
      data: xLabels,
      axisLabel: {
        // rotate: 45,
        interval: 0,
        hideOverlap: true,
      },
      axisLine: {
        show: true,
        lineStyle: {
          // color: '#fff',
          // opacity: 0.7,
        },
      },
    },
    yAxis: {
      splitArea: {
        show: true,
      },
      type: 'category',
      axisLine: {
        show: true,
        lineStyle: {
          // color: '#fff',
          // opacity: 0.7,
        },
      },
      data: subGroupLabels,
      splitLine: {
        lineStyle: {
          type: [2, 5],
          dashOffset: 2,
          // Dark and light colors will be used in turns
          color: ['#aaa', '#ddd'],
          opacity: 0.7,
        },
      },
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

export { Heatmap }
