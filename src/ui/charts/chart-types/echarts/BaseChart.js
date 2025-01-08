import { FormControlLabel, Select, MenuItem } from '@mui/material'
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
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import FlexibleContainer from './FlexibleContainer'

import { mutateLocal } from '../../../../data/local'
import {
  NumberFormat,
  findSubgroupLabels,
  getDecimalScaleFactor,
  getDecimalScaleLabel,
  getChartItemColor,
  findColoring,
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

const baseOptions = {
  backgroundColor: '#4a4a4a',
  grid: {
    top: 64,
    // right: 32,
    // bottom: 24,
    left: 96,
    // show: true,
  },
  xAxis: {
    type: 'category',
    nameLocation: 'middle',
    nameGap: 40,
    nameTextStyle: {
      fontSize: 20,
    },
    axisLine: {
      fontSize: 17,
      show: true,
      lineStyle: {
        // color: '#fff',
        // opacity: 0.7,
      },
    },
    axisLabel: {
      // rotate: 45,
      interval: 0,
      hideOverlap: true,
    },
  },
  yAxis: {
    type: 'value',
    nameLocation: 'middle',
    nameGap: 45,
    nameTextStyle: {
      fontSize: 20,
    },
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
        color: '#aaa',
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
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#4a4a4a',
    textStyle: {
      color: '#ffffff',
    },
    extraCssText:
      'width:fit-content; height:fit-content; white-space:pre-line; overflow: hidden;',
    confine: 'true',
  },
  textStyle: {
    // Not setting `fontFamily` to `'inherit'` here as
    // there seems to be a bug in echarts where a `fontSize`
    // value is enforced on the entire chart `canvas`
    fontFamily:
      '"-apple-system", BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", "sans-serif"',
    fontSize: 14,
  },
}

const FlexibleChart = ({
  options,
  chartHoverOrder,
  path,
  xAxisOrder,
  ...props
}) => {
  const dispatch = useDispatch()

  return (
    <>
      <FlexibleContainer>
        <ReactEChartsCore
          echarts={echarts}
          option={R.mergeDeepRight(
            R.assocPath(['tooltip', 'order'], chartHoverOrder, baseOptions)
          )(options)}
          notMerge
          theme="dark"
          // lazyUpdate
          {...props}
        />
      </FlexibleContainer>
      {path && (
        <FormControlLabel
          sx={{ position: 'absolute', right: 160, bottom: 10 }}
          control={
            <Select
              value={xAxisOrder}
              onChange={(e) => {
                dispatch(
                  mutateLocal({
                    path: [...path, 'xAxisOrder'],
                    value: e.target.value,
                    sync: true,
                  })
                )
              }}
              size="small"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="default">Default</MenuItem>
              <MenuItem value="ascending">Ascending</MenuItem>
              <MenuItem value="descending">Descending</MenuItem>
            </Select>
          }
          label="Sort by"
          labelPlacement="start"
        />
      )}
    </>
  )
}

const EchartsPlot = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  chartType,
  stack = false,
  seriesObj = {},
  colors,
  distribution = false,
  showNA,
  chartHoverOrder,
  path,
  xAxisOrder,
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

  // Only true if using a line chart with 1 level of grouping
  const visualMap =
    chartType === 'line' && R.type(R.head(R.head(yValues))) !== 'Object'

  const color = R.map(
    (item) => findColoring(item, colors) ?? getChartItemColor(item)
  )(xLabels)

  const series = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) =>
        R.mergeRight(baseObject, {
          id: R.head(d).id,
          name: R.head(d).name,
          color:
            findColoring(R.head(d).name, colors) ??
            getChartItemColor(R.head(d).name),
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
    (d) => [
      R.mergeDeepLeft(
        R.assoc(
          'data',
          R.pipe(
            R.unnest,
            visualMap ? R.addIndex(R.map)((a, b) => [b, a]) : R.identity
          )(d),
          baseObject
        ),
        {
          colorBy: 'data',
          color,
        }
      ),
    ]
  )(yValues)

  const yMax = R.pipe(
    R.pluck('data'),
    R.flatten,
    R.filter(R.isNotNil),
    R.apply(Math.max)
  )(series)

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

  const lineMap = visualMap
    ? {
        visualMap: {
          type: 'piecewise',
          show: false,
          pieces: R.map((idx) => ({
            max: idx,
            min: idx - 1,
            color: color[idx],
          }))(R.range(0, R.length(xLabels))),
          dimension: 0,
        },
      }
    : {}

  const multiNumberFormat = R.pipe(
    R.values,
    R.propOr([], 0),
    R.type,
    R.equals('Object')
  )(numberFormat)

  const getNumberFormat = (labelKey, value) =>
    NumberFormat.format(value, numberFormat[labelKey])

  const sortParams = (params) => {
    const handleByValue =
      chartHoverOrder === 'valueAsc' || chartHoverOrder === 'valueDesc'
        ? R.sortBy(({ value }) => value)(params)
        : params
    return chartHoverOrder === 'valueAsc' || chartHoverOrder === 'seriesAsc'
      ? handleByValue.reverse()
      : handleByValue
  }

  const options = {
    grid: distribution
      ? {
          bottom: '80',
        }
      : {},
    xAxis: {
      name: xAxisTitle,
      data: xLabels,
    },
    yAxis: {
      name: `${yAxisTitle}${scaleLabel ? ` (${scaleLabel})` : ''}`,
      axisLabel: {
        formatter: (value) =>
          scaleLabel ? (+value / scaleFactor).toPrecision(3) : value,
      },
    },
    series,
    tooltip: {
      ...(multiNumberFormat
        ? {
            formatter: (params) =>
              `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
                ${sortParams(params)
                  .map(({ marker, seriesId, seriesName, value }) =>
                    R.isNil(value) && !showNA
                      ? false
                      : `<div style="display: flex">
                        <div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} ${seriesName}</div>
                        <div><strong>${getNumberFormat(seriesId, value)}</strong></div>
                      </div>`
                  )
                  .filter(R.identity)
                  .join('')}`,
          }
        : {
            formatter: (params) =>
              params.length === 1
                ? `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
                ${params
                  .map(({ marker, value }) =>
                    R.isNil(value) && !showNA
                      ? false
                      : `<div style="display: flex">
                        <div style="text-align: center; flex: 1 1 auto">${marker}</div>
                        <div><strong>${NumberFormat.format(visualMap ? value[1] : value, numberFormat)}</strong></div>
                      </div>`
                  )
                  .filter(R.identity)
                  .join('')}`
                : `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
                ${sortParams(params)
                  .map(({ marker, seriesName, value }) =>
                    R.isNil(value) && !showNA
                      ? false
                      : `<div style="display: flex">
                        <div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} ${seriesName}</div>
                        <div><strong>${NumberFormat.format(visualMap ? value[1] : value, numberFormat)}</strong></div>
                      </div>`
                  )
                  .filter(R.identity)
                  .join('')}`,
          }),
    },
    ...lineMap,
  }

  return <FlexibleChart {...{ options, chartHoverOrder, path, xAxisOrder }} />
}

export default EchartsPlot
export { FlexibleChart }
