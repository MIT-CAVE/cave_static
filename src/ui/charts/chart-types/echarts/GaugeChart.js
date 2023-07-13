/** @jsxImportSource @emotion/react */
import ReactEChartsCore from 'echarts-for-react/lib/core'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import { echarts } from './BaseChart'

import { adjustMinMax, formatNumber, getMinMax } from '../../../../utils'

const GaugeChart = ({ data, xAxisTitle, yAxisTitle, numberFormat, theme }) => {
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
      overlap: true,
      roundCap: true,
    },
    axisLine: {
      roundCap: true,
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

  const calculateOffset = (idx) => (idx - (dataLength - 1) / 2) * 45
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
            },
          },
        ],
        0
      ),
      R.last
    )(values)

  const initialSeries = [R.assoc('data', createSeriesData(yValues), baseObject)]
  const [yMin, yMax] = R.pipe(
    R.head,
    R.prop('data'),
    R.pluck('value'),
    R.flatten,
    R.filter(R.isNotNil),
    getMinMax,
    R.apply(adjustMinMax)
  )(initialSeries)

  const series = R.pipe(
    R.assocPath([0, 'min'], yMin > 0 ? 0 : yMin),
    R.assocPath([0, 'max'], yMax)
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
    xAxis: {
      name: xAxisTitle,
      nameGap: 40,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
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
    tooltip: {
      trigger: 'axis',
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

export { GaugeChart }
