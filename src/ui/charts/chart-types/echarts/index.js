/** @jsxImportSource @emotion/react */
import ReactEChartsCore from 'echarts-for-react/lib/core'
import {
  LineChart,
  BarChart,
  // PieChart,
  // ScatterChart,
  // RadarChart,
  // MapChart,
  // TreeChart,
  // TreemapChart,
  // GraphChart,
  // GaugeChart,
  // FunnelChart,
  // ParallelChart,
  // SankeyChart,
  BoxplotChart,
  // CandlestickChart,
  // EffectScatterChart,
  // LinesChart,
  // HeatmapChart,
  // PictorialBarChart,
  // ThemeRiverChart,
  // SunburstChart,
  // CustomChart,
} from 'echarts/charts'
import {
  // GridSimpleComponent,
  GridComponent,
  // PolarComponent,
  // RadarComponent,
  // GeoComponent,
  // SingleAxisComponent,
  // ParallelComponent,
  // CalendarComponent,
  // GraphicComponent,
  // ToolboxComponent,
  TooltipComponent,
  // AxisPointerComponent,
  // BrushComponent,
  TitleComponent,
  // TimelineComponent,
  // MarkPointComponent,
  // MarkLineComponent,
  // MarkAreaComponent,
  LegendComponent,
  // LegendScrollComponent,
  // LegendPlainComponent,
  // DataZoomComponent,
  // DataZoomInsideComponent,
  // DataZoomSliderComponent,
  // VisualMapComponent,
  // VisualMapContinuousComponent,
  // VisualMapPiecewiseComponent,
  // AriaComponent,
  TransformComponent,
  DatasetComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'

import { formatNumber } from '../../../../utils'

// Register the required components
echarts.use([
  DatasetComponent,
  LegendComponent,
  TitleComponent,
  TransformComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  BoxplotChart,
  LineChart,
  CanvasRenderer,
])

const FlexibleWrapper = ({ children, ...props }) => (
  <div style={{ flex: '1 1 auto' }}>
    <AutoSizer>
      {({ height, width }) => (
        <div css={{ '>': { height, width } }} {...props}>
          {children}
        </div>
      )}
    </AutoSizer>
  </div>
)
FlexibleWrapper.propTypes = { children: PropTypes.node }

const EchartsPlot = ({
  xData,
  yData,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  chartType,
  theme,
  stack = false,
}) => {
  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)
  const series = R.pipe(R.head, R.is(Object))(yData)
    ? R.map((yKey) => ({
        name: yKey,
        data: R.pluck(yKey)(yData),
        type: chartType,
        ...(stack && { stack: stack }),
        smooth: true,
        emphasis: {
          focus: 'series',
        },
      }))(yKeys)
    : {
        data: yData,
        type: chartType,
        smooth: true,
      }

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
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
      type: 'category',
      data: xData,
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
      name: yAxisTitle,
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
    legend: { data: yKeys, top: 24 },
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
            lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

const EchartsBoxPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  subGrouped,
}) => {
  const yKeys = R.pipe(R.pluck('y'), R.mergeAll, R.keys)(data)
  const xData = R.pluck('x')(data)
  const yData = R.pluck('y')(data)

  const chartType = 'boxplot'

  let sources
  let transforms
  let series
  let legend

  if (subGrouped) {
    sources = R.map((yKey) => ({
      id: `source-${yKey}`,
      type: chartType,
      source: R.pipe(
        R.pluck(yKey),
        // This fixes an issue when the 1st groupBy + level
        // matches the 2nd groupBy + level
        R.map(R.when(R.isNil, R.always([])))
      )(yData),
      name: yKey,
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

    legend = { data: yKeys, top: 24 }
  } else {
    sources = [
      {
        id: 'source',
        type: chartType,
        source: R.pipe(R.mergeAll, R.values)(yData),
        // name: ,
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

  // console.log({yKeys, data, yData, sources, transforms, series});

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
      name: yAxisTitle,
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
      valueFormatter: (value) => formatNumber(value, numberFormat),
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
  }

  // console.log({options});

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

/**
 * Renders a line plot.
 * @todo Implement this component.
 * @todo Write the documentation by following JSDoc 3.
 */
const LinePlot = ({ data, xAxisTitle, yAxisTitle, numberFormat, theme }) => {
  return (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={R.pluck('y')(data)}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat }}
    />
  )
}
LinePlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  theme: PropTypes.string,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
}

const BarPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  stack = false,
}) => {
  return (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={R.pluck('y')(data)}
      chartType="bar"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat, stack }}
    />
  )
}
BarPlot.propTypes = {
  data: PropTypes.array,
  numberFormat: PropTypes.object,
  theme: PropTypes.string,
  xAxisTitle: PropTypes.string,
  yAxisTitle: PropTypes.string,
  stack: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
}

const BoxPlot = ({ ...props }) => <EchartsBoxPlot {...props} />

export { FlexibleWrapper, LinePlot, BarPlot, BoxPlot }
