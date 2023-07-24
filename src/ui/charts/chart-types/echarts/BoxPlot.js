import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import {
  getDecimalScaleFactor,
  getDecimalScaleLabel,
  findSubgroupLabels,
  getChartItemColor,
} from '../../../../utils'

// sort array ascending
const asc = (arr) => arr.sort((a, b) => a - b)
const quantile = (arr, q) => {
  const sorted = asc(arr)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

const calculateBoxPlotStats = (data) => {
  if (R.isNil(data)) return R.repeat(NaN, 5)
  const max = Math.max(...data)
  const min = Math.min(...data)
  const median = R.median(data)
  const q1 = quantile(data, 0.25)
  const q3 = quantile(data, 0.75)
  return [min, q1, median, q3, max]
}

const EchartsBoxPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  // numberFormat,
  colors,
  theme,
}) => {
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const chartType = 'boxplot'

  const series = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) => ({
        name: R.head(d).name,
        type: chartType,
        smooth: true,
        color: R.prop(R.head(d).name, colors),
        emphasis: {
          focus: 'series',
        },
        data: R.map(
          R.pipe(
            (idx) => R.find(R.propEq(idx, 'index'), d),
            R.when(R.isNotNil, R.prop('value')),
            calculateBoxPlotStats
          )
        )(R.range(0, Math.max(...R.pluck('index', d)) + 1)),
      })),
      R.sortBy(({ name }) => R.indexOf(name, subGroupLabels))
    ),
    (d) => [
      R.assoc('data', R.map(calculateBoxPlotStats, d), {
        type: chartType,
        smooth: true,
        emphasis: {
          focus: 'series',
        },
        colorBy: 'data',
        color: R.addIndex(R.map)((item, idx) =>
          R.has(item, colors)
            ? R.prop(item, colors)
            : getChartItemColor(theme, idx)
        )(xLabels),
      }),
    ]
  )(yValues)

  const yMax = R.pipe(
    R.pluck('data'),
    R.flatten,
    R.filter(R.isNotNil),
    R.apply(Math.max)
  )(series)

  const legend = R.isEmpty(subGroupLabels)
    ? null
    : {
        type: 'scroll',
        data: subGroupLabels,
        top: 24,
      }

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

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
      data: xLabels,
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
          scaleLabel ? (+value / scaleFactor).toPrecision(3) : value,
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
            // lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export { EchartsBoxPlot as BoxPlot }
