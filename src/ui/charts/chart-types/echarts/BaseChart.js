/** @jsxImportSource @emotion/react */
import {
  LineChart,
  BarChart,
  // PieChart,
  // ScatterChart,
  // RadarChart,
  // MapChart,
  // TreeChart,
  TreemapChart,
  GraphChart,
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
  SunburstChart,
  CustomChart,
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
  VisualMapPiecewiseComponent,
  AriaComponent,
  TransformComponent,
  DatasetComponent,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import ReactEChartsCore from 'echarts-for-react/lib/core'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import AutoSizer from 'react-virtualized-auto-sizer'

import {
  formatNumber,
  getDecimalScaleFactor,
  getDecimalScaleLabel,
} from '../../../../utils'

// Register the required components
echarts.use([
  AriaComponent,
  DatasetComponent,
  LegendComponent,
  TitleComponent,
  TransformComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  BoxplotChart,
  LineChart,
  GraphChart,
  CanvasRenderer,
  CustomChart,
  SunburstChart,
  TreemapChart,
  VisualMapPiecewiseComponent,
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
  subGrouped,
  stack = false,
}) => {
  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)
  const series = subGrouped
    ? R.map((yKey) => ({
        name: yKey,
        data: R.pluck(yKey)(yData),
        type: chartType,
        ...(stack && { stack }),
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

  const yMax = subGrouped
    ? R.reduce(
        (acc, yArr) => Math.max(acc, ...R.values(yArr)),
        -Infinity
      )(yData)
    : Math.max(...yData)
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
    legend: {
      // We might deal better with legend overlapping in the future.
      // Keep track of:
      // - https://github.com/apache/echarts/pull/16825
      // - https://github.com/apache/echarts/issues/15654
      type: 'scroll',
      data: yKeys,
      top: 24,
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
            lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export default EchartsPlot
export { FlexibleWrapper, echarts }
