import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { getDecimalScaleFactor, getDecimalScaleLabel } from '../../../../utils'

const EchartsBoxPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  // numberFormat,
  theme,
  subGrouped,
}) => {
  const yKeys = R.pipe(R.pluck('y'), R.mergeAll, R.keys)(data)
  const xData = R.pluck('x')(data)
  const yData = R.pluck('y')(data)

  const yMax = subGrouped
    ? R.reduce(
        (acc, yArr) => Math.max(acc, ...R.values(yArr)),
        -Infinity
      )(yData)
    : Math.max(...yData)

  const chartType = 'boxplot'

  let sources
  let transforms
  let series
  let legend

  if (subGrouped) {
    sources = R.map((yKey) => ({
      id: `source-${yKey}`,
      source: R.pipe(
        R.pluck(yKey),
        // This fixes an issue when the 1st groupBy + level
        // matches the 2nd groupBy + level
        R.map(R.when(R.isNil, R.always([])))
      )(yData),
    }))(yKeys)

    transforms = R.map((yKey) => ({
      fromDatasetId: `source-${yKey}`,
      id: yKey,
      transform: {
        type: chartType,
        config: { itemNameFormatter: ({ value }) => xData[value] },
        // print: true,
      },
    }))(yKeys)

    series = R.map((yKey) => ({
      name: yKey,
      dimensions: ['item', 'min', 'Q1', 'median', 'Q3', 'max'],
      type: chartType,
      datasetId: yKey,
      itemStyle: {
        color: '#b8c5f2',
      },
      encode: {
        x: 'item',
        y: ['min', 'Q1', 'median', 'Q3', 'max'],
        tooltip: ['min', 'Q1', 'median', 'Q3', 'max'],
      },
    }))(yKeys)

    legend = {
      type: 'scroll',
      data: yKeys,
      top: 24,
    }
  } else {
    sources = [
      {
        id: 'source',
        source: R.pipe(R.mergeAll, R.values)(yData),
      },
    ]

    transforms = [
      {
        fromDatasetId: 'source',
        id: 'transform',
        transform: {
          type: chartType,
          config: { itemNameFormatter: ({ value }) => xData[value] },
          // print: true,
        },
      },
    ]

    series = {
      // name: yKey,
      dimensions: ['item', 'min', 'Q1', 'median', 'Q3', 'max'],
      type: chartType,
      datasetId: 'transform',
      itemStyle: {
        color: '#b8c5f2',
      },
      encode: {
        x: 'item',
        y: ['min', 'Q1', 'median', 'Q3', 'max'],
        tooltip: ['min', 'Q1', 'median', 'Q3', 'max'],
      },
    }

    legend = null
  }

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    dataset: [...sources, ...transforms],
    xAxis: {
      name: xAxisTitle,
      nameGap: 40,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      axisLabel: {
        // rotate: 45,
        hideOverlap: true,
        interval: 0,
      },
      type: 'category',
      data: xData,
      axisLine: {
        show: true,
        lineStyle: {
          // color: '#fff',
          // opacity: 0.7,
        },
      },
    },
    yAxis: {
      name: `${yAxisTitle}${scaleLabel ? ` (${scaleLabel})` : ''}`,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      nameGap: 64,
      type: 'value',
      axisLine: {
        show: true,
        lineStyle: {
          // color: '#fff',
          // opacity: 0.7,
        },
      },
      axisLabel: {
        formatter: (value) =>
          // `scaleLabel === null` => value >= 1e12
          scaleLabel || scaleLabel === null
            ? (+value / scaleFactor).toPrecision(3)
            : value,
      },
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
    series,
    legend,
    tooltip: {
      trigger: 'axis',
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
            lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export { EchartsBoxPlot as BoxPlot }
