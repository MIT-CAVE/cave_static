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
  CustomChart,
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
import { CHART_PALETTE } from '../../../../utils/constants'

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
  CustomChart,
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
  // numberFormat,
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

    legend = { data: yKeys, top: 24 }
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

/**
 * Estimates the parameters needed to render a single bar at an arbitrary
 * (x, y) position within a series and returns a function that maps the
 * bar's coordinates to a rectangular shape required by echarts.
 * @param {number} categoryWidth The width of an individual category,
 * i.e. a group of bars sharing an `x` value.
 * @param {number} seriesLength The number of distinct series in the chart,
 * i.e. the number of distinct subgrouping elements in the data.
 * @param {number} barCategoryGapPct The gap between two categories of
 * contiguous bars as a percentage of the bar width.
 * Equivalent to: https://echarts.apache.org/en/option.html#series-bar.barGap
 * @param {number} barGapPct The gap between bars within a single category
 * as a percentage of the category gap.
 * Equivalent to: https://echarts.apache.org/en/option.html#series-bar.barCategoryGap
 * @returns {function} A function that returns a valid `shape` object for a
 * rectangle element.
 * @private
 */
const getBarShapeFn = R.memoizeWith(
  Array,
  (categoryWidth, seriesLength, barGapPct = 0.5, barCategoryGapPct = 0.5) => {
    // The following is a math expression that estimates the bar width based
    // on the current width available for the chart and the gap percentages.
    // BUG: broken when `subGrouped` is `false`
    const barWidth =
      categoryWidth /
      (seriesLength + barCategoryGapPct * (2 + (seriesLength - 1) * barGapPct))
    const barCategoryGap = barCategoryGapPct * barWidth
    const barGap = barGapPct * barCategoryGap

    /**
     * Obtains a valid `shape` object.
     * See: https://echarts.apache.org/en/option.html#series-custom.renderItem.return_rect.shape
     * @param {number} barIndex The left to right position of the bar within the category.
     * @param {Array} startCoord The starting coordinates of the bar, centered within the category.
     * @param {Array} endCoord The ending coordinates of the bar, centered within the category.
     * @returns {Array} A valid `shape` object.
     * @private
     */
    return ({ startCoord, endCoord, barIndex }) => {
      // `startCoord[0]` is used as the reference center of the middle bar
      // to estimate the position of the first bar within the category.
      const firstBarX =
        startCoord[0] - ((seriesLength - 1) * (barWidth + barGap)) / 2
      const barX = firstBarX + barIndex * (barWidth + barGap)
      return {
        x: barX - barWidth / 2,
        y: endCoord[1],
        width: barWidth,
        height: startCoord[1] - endCoord[1],
      }
    }
  }
)

// TODO:
// - Set `xAxisTitle`, `yAxisTitle`
// - Different color for raising and falling values (maybe altering them with opacity)
// - Line connector between bars. If there is no value in between, the line must still connect the distant bars.
const WaterfallChart = ({ data, theme, numberFormat, subGrouped }) => {
  const xData = R.pluck('x')(data)
  const yData = R.pluck('y')(data)
  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  const getYPos = (rawData) => {
    const yData = R.pluck('y')(rawData)
    let prevY = 0
    for (let i = 0; i < yData.length; i++) {
      if (yData[i] == null) continue

      rawData[i]['startValue'] =
        i === 0 || yData[i - 1] == null ? prevY : yData[i - 1]
      rawData[i]['endValue'] = yData[i]
      prevY = yData[i]
    }
    return rawData
  }

  const renderItem = (params, api) => {
    const index = params.dataIndex
    const style = api.style({
      fill: CHART_PALETTE[theme][
        params.seriesIndex % CHART_PALETTE[theme].length
      ],
    })

    const categoryWidth = params.coordSys.width / xData.length
    const seriesLength = subGrouped ? yKeys.length : 1
    const getBarShape = getBarShapeFn(categoryWidth, seriesLength)

    const barStartValue = api.value(2)
    const barEndValue = api.value(3)
    if (isNaN(barStartValue) || isNaN(barEndValue)) return

    return {
      type: 'rect',
      shape: getBarShape({
        startCoord: api.coord([index, barStartValue]),
        endCoord: api.coord([index, barEndValue]),
        barIndex: params.seriesIndex,
      }),
      style,
    }
  }

  let dataset
  let series
  let yMax
  let yMin
  if (subGrouped) {
    // TODO: Simplify this Ramda pipe
    dataset = R.map((yKey) => ({
      id: yKey,
      source: R.pipe(
        R.pluck(yKey),
        R.map(R.objOf('y')),
        R.zip(R.map(R.objOf('x'))(xData)),
        R.map(R.mergeAll),
        getYPos,
        R.project(['x', 'y', 'startValue', 'endValue'])
      )(yData),
    }))(yKeys)

    series = yKeys.map((yKey, index) => ({
      type: 'custom',
      renderItem,
      id: yKey,
      name: yKey,
      datasetIndex: index,
    }))

    const getValidPropValues = R.curry((prop, obj) =>
      R.pipe(R.pluck(prop), R.reject(R.isNil))(obj)
    )

    const sources = R.pipe(R.pluck('source'), R.unnest)(dataset)
    yMax = Math.max(...getValidPropValues('endValue')(sources))
    const endValueMin = Math.min(...getValidPropValues('endValue')(sources))
    const startValueMin = Math.min(...getValidPropValues('startValue')(sources))
    yMin = Math.min(...getValidPropValues('endValue')(sources))
    yMin = Math.min(startValueMin, endValueMin)
  } else {
    const waterfallData = getYPos(data)
    yMax = Math.max(...R.pluck('endValue')(waterfallData))
    const endValueMin = Math.min(...R.pluck('endValue')(waterfallData))
    const startValueMin = Math.min(...R.pluck('startValue')(waterfallData))
    yMin = Math.min(startValueMin, endValueMin)

    dataset = { source: waterfallData }
    series = {
      type: 'custom',
      renderItem,
    }
  }

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    tooltip: {
      valueFormatter: (value) => formatNumber(value, numberFormat),
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      trigger: 'axis',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
    dataset,
    xAxis: {
      type: 'category',
      splitLine: { show: false },
      data: xData,
      axisLabel: {
        hideOverlap: true,
        interval: 0,
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      // Add the maximum to do the scaling
      // As well as the min value
      min: yMin - (yMax - yMin) * 0.1,
      max: yMax + (yMax - yMin) * 0.1,
      axisLine: {
        show: true,
      },
      splitLine: {
        show: true,
        lineStyle: {
          type: [2, 5],
          dashOffset: 3,
          // Dark and light colors will be used in turns
          color: ['#aaa', '#ddd'],
          opacity: 0.7,
        },
      },
    },
    series,
  }

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

export {
  FlexibleWrapper,
  LinePlot,
  BarPlot,
  EchartsBoxPlot as BoxPlot,
  WaterfallChart,
}
