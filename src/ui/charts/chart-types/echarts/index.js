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
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'

import {
  adjustMinMax,
  formatNumber,
  getChartItemColor,
  getMinMax,
  mapIndexed,
} from '../../../../utils'
import { CHART_PALETTE } from '../../../../utils/constants'

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
 * (x, y) position within a series and returns them to generate the
 * rectangular shape required by echarts.
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
 * @returns {Object} An object that contains dimension values of a rectangule
 * element.
 * @private
 */
const getBarLayout = R.memoizeWith(
  Array,
  (categoryWidth, seriesLength, barGapPct = 0.5, barCategoryGapPct = 0.5) => {
    // The following is a math expression that estimates the bar width based
    // on the current width available for the chart and the gap percentages.
    const barWidth =
      categoryWidth /
      (seriesLength + barCategoryGapPct * (2 + (seriesLength - 1) * barGapPct))
    const barCategoryGap = barCategoryGapPct * barWidth
    const barGap = barGapPct * barCategoryGap

    return {
      halfIntervalX: 0.5 * (seriesLength - 1) * (barWidth + barGap),
      barWidth,
      barCategoryGapPct,
      barGap,
    }
  }
)

const getWaterfallValues = (rawData) => {
  const yData = R.pluck('y')(rawData)
  let yBase = 0
  for (let i = 0; i < yData.length; i++) {
    if (yData[i] == null) continue

    rawData[i]['startValue'] = yBase
    rawData[i]['endValue'] = yBase + yData[i]
    yBase = rawData[i]['endValue']
  }
  return rawData
}

const WaterfallChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  subGrouped,
}) => {
  const xData = R.pluck('x')(data)
  const yData = R.pluck('y')(data)
  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  let barX
  let barY
  let barIndex

  const renderItem = (params, api) => {
    const barStartValue = api.value(2)
    const barEndValue = api.value(3)
    if (isNaN(barStartValue) || isNaN(barEndValue)) return

    const barIndexPrev = barIndex
    barIndex = params.seriesIndex
    const index = params.dataIndex
    const style = api.style()

    if (barIndex !== barIndexPrev || index === 0) {
      barX = undefined
      barY = undefined
    }

    const startCoord = api.coord([index, barStartValue])
    const endCoord = api.coord([index, barEndValue])

    const seriesLength = subGrouped ? yKeys.length : 1
    const categoryWidth = params.coordSys.width / xData.length
    const { barWidth, barGap, halfIntervalX } = getBarLayout(
      categoryWidth,
      seriesLength
    )

    // `startCoord[0]` is used as the reference center of the middle bar
    // to estimate the position of the first bar within the current category.
    const firstBarX = startCoord[0] - halfIntervalX
    const barXPrev = barX
    barX = firstBarX + barIndex * (barWidth + barGap)
    const barYPrev = barY
    barY = endCoord[1]

    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: {
            x: barX - barWidth / 2,
            y: endCoord[1],
            width: barWidth,
            height: startCoord[1] - endCoord[1],
          },
          style,
        },
        // Dashed line connecting the bars
        {
          type: 'line',
          shape: {
            x1: barXPrev,
            y1: barYPrev,
            x2: barX,
            y2: startCoord[1],
          },
          style: api.style({
            stroke: api.visual('color'),
            lineDash: [8, 4],
            lineWidth: 2,
          }),
        },
      ],
    }
  }

  let dataset
  let series
  if (subGrouped) {
    // TODO: Simplify this Ramda pipe
    dataset = R.map((yKey) => ({
      id: yKey,
      source: R.pipe(
        R.pluck(yKey),
        R.map(R.objOf('y')),
        R.zip(R.map(R.objOf('x'))(xData)),
        R.map(R.mergeAll),
        getWaterfallValues,
        R.project(['x', 'y', 'startValue', 'endValue'])
      )(yData),
    }))(yKeys)

    series = yKeys.map((yKey, index) => ({
      type: 'custom',
      renderItem,
      id: yKey,
      name: yKey,
      datasetIndex: index,
      emphasis: {
        focus: 'series',
      },
    }))
  } else {
    dataset = [{ source: getWaterfallValues(data) }]
    series = {
      type: 'custom',
      renderItem,
    }
  }

  const [yMin, yMax] = R.pipe(
    R.pluck('source'),
    R.unnest,
    R.map(R.props(['startValue', 'endValue'])),
    R.unnest,
    getMinMax,
    // `R.apply` will convert the resulting `[<min>, <max>]`
    // array to arguments for the `adjustMinMax` function
    R.apply(adjustMinMax)
  )(dataset)

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    legend: { data: yKeys, top: 24 },
    tooltip: {
      valueFormatter: (value) => formatNumber(value, numberFormat),
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      trigger: 'axis',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
    dataset,
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    xAxis: {
      name: xAxisTitle,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      nameGap: 40,
      type: 'category',
      splitLine: { show: false },
      data: xData,
      axisLabel: {
        hideOverlap: true,
        interval: 0,
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
      scale: true,
      // Add the maximum to do the scaling
      // As well as the min value
      min: yMin,
      max: yMax,
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

// TODO: Refactoring needed
const StackedWaterfallChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  subGrouped,
}) => {
  const xData = R.pluck('x')(data)
  const yData = R.pluck('y')(data)
  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  const categoryBounds = R.pipe(
    // The total values after summing up each category
    R.map(R.pipe(R.values, R.sum)),
    R.reduce((acc, value) => {
      const startValue = R.isEmpty(acc) ? 0 : R.path([-1, 1])(acc)
      const endValue = startValue + value
      return R.append([startValue, endValue])(acc)
    }, []),
    R.zipWith(R.prepend, xData),
    R.map(R.zipObj(['x', 'startValue', 'endValue']))
  )(yData)

  const startValues = R.pipe(
    R.pluck('startValue'),
    R.map((val) => ({ rising: val, falling: val })),
    R.zipObj(xData)
  )(categoryBounds)

  const getBarBounds = (rawData) => {
    const yData = R.pluck('y')(rawData)

    for (let i = 0; i < yData.length; i++) {
      if (yData[i] == null) continue

      const x = rawData[i].x
      const orientation = yData[i] < 0 ? 'falling' : 'rising'

      rawData[i].startValue = startValues[x][orientation]
      rawData[i].endValue = rawData[i].startValue + yData[i]
      startValues[x][orientation] = rawData[i].endValue
    }
    return rawData
  }

  let barX
  let barY
  let barIndex
  let index
  const renderedLinesByIndex = new Set()
  const validIndices = R.pipe(
    mapIndexed((value, idx) => R.mergeLeft({ idx })(value)),
    R.reject(R.pipe(R.prop('y'), R.values, R.all(R.isNil)))
  )(data)

  const renderItem = (params, api) => {
    const barStartValue = api.value(2)
    const barEndValue = api.value(3)

    index = params.dataIndex
    const barIndexPrev = barIndex
    barIndex = params.seriesIndex

    // Prevents re-rendering bugs with uncleared values of dashed line
    if (barIndex === 0 && index === 0) {
      barX = undefined
      barY = undefined
      renderedLinesByIndex.clear()
    }

    if (isNaN(barStartValue) || isNaN(barEndValue)) return

    if (barIndex !== barIndexPrev || index === 0) {
      barX = undefined
      barY = undefined
    }

    const startCoord = api.coord([index, barStartValue])
    const endCoord = api.coord([index, barEndValue])

    const categoryWidth = params.coordSys.width / xData.length
    const { barWidth } = getBarLayout(categoryWidth, 1)

    const barXPrev = barX
    barX = startCoord[0]
    const barYPrev = barY
    barY = endCoord[1]

    const barChart = {
      type: 'rect',
      shape: {
        x: barX - barWidth / 2,
        y: startCoord[1],
        width: barWidth,
        height: barY - startCoord[1],
      },
      style: api.style(),
    }

    // Dashed line connecting the bars
    let lineConnector
    if (index > 0 && !renderedLinesByIndex.has(index)) {
      let shape
      if (subGrouped) {
        const validIndex = R.findIndex(R.propEq('idx', index))(validIndices)
        if (validIndex > 0) {
          const indexPrev = validIndices[validIndex - 1].idx
          const endCoordPrev = api.coord([
            indexPrev,
            categoryBounds[indexPrev].endValue,
          ])
          shape = {
            x1: endCoordPrev[0],
            y1: endCoordPrev[1],
            x2: barX,
            y2: api.coord([index, categoryBounds[index].startValue])[1],
            z: 1,
          }
        }
      } else {
        shape = {
          x1: barXPrev,
          y1: barYPrev,
          x2: barX,
          y2: startCoord[1],
        }
      }

      if (shape) {
        lineConnector = {
          type: 'line',
          shape,
          style: api.style({
            stroke: subGrouped ? 'rgb(255,255,255,0.8)' : api.visual('color'),
            lineWidth: 2,
            lineDash: [8, 6],
            symbolSize: 120,
          }),
          z2: 1,
        }
      }
      renderedLinesByIndex.add(index)
    }

    return {
      type: 'group',
      children: R.unless(
        R.always(lineConnector == null),
        R.append(lineConnector)
      )([barChart]),
    }
  }

  let dataset
  let series
  if (subGrouped) {
    dataset = R.map((yKey) => ({
      id: yKey,
      source: R.pipe(
        R.pluck(yKey),
        R.map(R.objOf('y')),
        R.zip(R.map(R.objOf('x'))(xData)),
        R.map(R.mergeAll),
        getBarBounds,
        R.project(['x', 'y', 'startValue', 'endValue'])
      )(yData),
    }))(yKeys)

    const barSeries = mapIndexed((yKey, idx) => ({
      type: 'custom',
      renderItem,
      id: yKey,
      name: yKey,
      datasetIndex: idx,
    }))(yKeys)

    const getGraphSeries = (nodesData) => ({
      type: 'graph',
      coordinateSystem: 'cartesian2d',
      categories: [
        {
          name: 'Initial',
          symbol: 'diamond',
          itemStyle: {
            color: getChartItemColor(theme, yKeys.length),
          },
        },
        {
          name: 'Net Change',
          symbol: 'circle',
          itemStyle: {
            color: getChartItemColor(theme, yKeys.length + 1),
          },
        },
      ],
      lineStyle: {
        type: 'dashed',
        width: 2,
        color: theme === 'light' ? '#4a4a4a' : '#ffffff',
      },
      emphasis: { focus: 'series' },
      symbolSize: 16,
      itemStyle: {
        borderWidth: 2,
        borderColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      },
      nodes: nodesData,
      tooltip: {
        trigger: 'item',
        backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
        textStyle: { color: theme === 'dark' ? '#ffffff' : '#4a4a4a' },
        valueFormatter: (value) => formatNumber(value, numberFormat),
      },
    })

    const getNodes = R.pipe(({ key, seriesName, ...rest }) =>
      R.map((value) => ({
        value: value[key],
        name: `${seriesName} @${value.x}`,
        ...rest,
      }))(categoryBounds)
    )

    const initNodes = getNodes({
      key: 'startValue',
      seriesName: 'Initial',
      category: 0,
    })

    const netChangeNodes = getNodes({
      key: 'endValue',
      seriesName: 'Net Change',
      category: 1,
    })

    series = [
      ...barSeries,
      getGraphSeries(initNodes, 'Initial'),
      getGraphSeries(netChangeNodes, 'Net Change'),
    ]
  } else {
    dataset = [{ source: getWaterfallValues(data) }]
    series = {
      type: 'custom',
      renderItem,
    }
  }

  const [yMin, yMax] = R.pipe(
    R.pluck('source'),
    R.unnest,
    R.map(R.props(['startValue', 'endValue'])),
    R.unnest,
    getMinMax,
    // `R.apply` will convert the resulting `[<min>, <max>]`
    // array to arguments for the `adjustMinMax` function
    R.apply(adjustMinMax)
  )(dataset)

  const options = {
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    legend: {
      data: [
        ...yKeys,
        { name: 'Initial', icon: 'diamond' },
        { name: 'Net Change', icon: 'circle' },
      ],
      top: 24,
    },
    dataset,
    tooltip: {
      trigger: 'axis',
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      textStyle: { color: theme === 'dark' ? '#ffffff' : '#4a4a4a' },
      valueFormatter: (value) => formatNumber(value, numberFormat),
    },
    grid: {
      top: 64,
      // right: 8,
      // bottom: 24,
      // left: 36,
      // show: true,
    },
    xAxis: {
      name: xAxisTitle,
      nameLocation: 'middle',
      nameTextStyle: {
        fontSize: 16,
      },
      nameGap: 40,
      type: 'category',
      splitLine: { show: false },
      data: xData,
      axisLabel: {
        hideOverlap: true,
        interval: 0,
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
      scale: true,
      // Add the maximum to do the scaling
      // As well as the min value
      min: yMin,
      max: yMax,
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

const CumulativeLineChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  theme,
  subGrouped,
}) => {
  const accumulate = R.pipe(
    R.reduce((acc, value) => R.append(R.add(R.last(acc), value), acc), [0]),
    R.drop(1)
  )

  const yData = R.pluck('y')(data)

  const yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  const yKeysWithVals = R.pipe(
    R.map((val) => [val, 0]),
    R.fromPairs
  )(yKeys)

  const buildSubgroup = R.pipe(
    R.mapAccum(
      (acc, value) => [
        R.append(R.mergeWith(R.add, R.last(acc), value), acc),
        R.mergeWith(R.add, R.last(acc), value),
      ],
      [yKeysWithVals]
    ),
    R.last
  )

  return !subGrouped ? (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={accumulate(yData)}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat }}
    />
  ) : (
    <EchartsPlot
      xData={R.pluck('x')(data)}
      yData={buildSubgroup(yData)}
      chartType="line"
      {...{ theme, xAxisTitle, yAxisTitle, numberFormat }}
    />
  )
}

const Sunburst = ({ data, theme, subGrouped }) => {
  const renameKeys = R.curry((keysMap, obj) =>
    R.reduce(
      (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
      {},
      R.keys(obj)
    )
  )

  let normalData = R.pipe(
    R.map(renameKeys({ x: 'name' })),
    R.map(renameKeys({ y: 'value' }))
  )(data)

  const yData = R.pluck('y')(data)
  let yKeys = R.pipe(R.mergeAll, R.keys)(yData)

  const assignColors = () => {
    let availableColors =
      theme === 'dark' ? CHART_PALETTE.dark : CHART_PALETTE.light
    availableColors = R.without(['#4992ff'], availableColors)
    const assignments = R.pipe(
      R.map((val) => {
        let randomChoice =
          availableColors[Math.floor(Math.random() * availableColors.length)]
        availableColors = R.without([randomChoice], availableColors)
        return [val, randomChoice]
      }),
      R.fromPairs
    )(yKeys)
    return assignments
  }

  let assignments = assignColors()

  const createDatum = (obj) => {
    let base = { name: R.path('x', obj), children: [], visualMap: false }
    let keys = R.keysIn(R.path('y', obj))
    base = R.assoc(
      'children',
      R.map(
        (key) =>
          R.assoc(
            'value',
            Math.abs(R.path(['y', key], obj)),
            R.assoc(
              'name',
              key,
              R.assoc(
                'itemStyle',
                { color: R.path([key], assignments) },
                R.assoc('visualMap', false, {})
              )
            )
          ),
        keys
      ),
      base
    )
    base = R.assoc('itemStyle', { color: '#4992ff' }, base)
    return base
  }

  const options = {
    visualMap: {
      type: 'piecewise',
      categories: yKeys,
      showLabel: 'true',
      inRange: {
        color: R.map((val) => R.path([val], assignments), yKeys),
      },
      itemWidth: 30,
      itemHeight: 24,
      right: 30,
      textStyle: {
        fontSize: 20,
      },
    },
    backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
    series: {
      radius: [60, '90%'],
      label: {
        show: false,
      },
      itemStyle: {
        borderRadius: 7,
        borderWidth: 7,
      },
      type: 'sunburst',
      sort: undefined,
      data: subGrouped ? R.map(createDatum, data) : normalData,
    },
    tooltip: {
      backgroundColor: theme === 'dark' ? '#4a4a4a' : '#ffffff',
      trigger: 'item',
      textStyle: {
        color: theme === 'dark' ? '#ffffff' : '#4a4a4a',
      },
    },
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
  StackedWaterfallChart,
  CumulativeLineChart,
  Sunburst,
}
