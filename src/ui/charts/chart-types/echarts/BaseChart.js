/** @jsxImportSource @emotion/react */
import {
  LineChart,
  BarChart,
  // PieChart,
  ScatterChart,
  // RadarChart,
  // MapChart,
  // TreeChart,
  TreemapChart,
  GraphChart,
  GaugeChart,
  // FunnelChart,
  // ParallelChart,
  // SankeyChart,
  BoxplotChart,
  // CandlestickChart,
  // EffectScatterChart,
  // LinesChart,
  HeatmapChart,
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
  VisualMapContinuousComponent,
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
  findSubgroupLabels,
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
  VisualMapContinuousComponent,
  GaugeChart,
  HeatmapChart,
  ScatterChart,
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
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  chartType,
  theme,
  stack = false,
  seriesObj = {},
}) => {
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const subGroupLabels = findSubgroupLabels(yValues)

  const baseObject = R.mergeRight(
    {
      type: chartType,
      smooth: true,
      emphasis: {
        focus: 'series',
      },
      ...(stack && { stack }),
    },
    seriesObj
  )

  const series = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) =>
        R.mergeRight(baseObject, {
          name: R.head(d).name,
          data: R.map(
            R.pipe(
              (idx) => R.find(R.propEq(idx, 'index'), d),
              R.when(R.isNotNil, R.path(['value', 0]))
            )
          )(R.range(0, Math.max(...R.pluck('index', d)) + 1)),
        })
      ),
      R.sortBy(({ name }) => R.indexOf(name, subGroupLabels))
    ),
    (d) => [R.assoc('data', R.unnest(d), baseObject)]
  )(yValues)

  const yMax = R.pipe(
    R.pluck('data'),
    R.flatten,
    R.filter(R.isNotNil),
    R.apply(Math.max)
  )(series)

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
            // lazyUpdate
          />
        )}
      </AutoSizer>
    </div>
  )
}

export default EchartsPlot
export { FlexibleWrapper, echarts }
