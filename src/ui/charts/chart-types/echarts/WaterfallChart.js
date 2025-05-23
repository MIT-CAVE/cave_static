import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'

import {
  NumberFormat,
  adjustMinMax,
  getChartItemColor,
  getDecimalScaleFactor,
  getDecimalScaleLabel,
  getMinMax,
  findSubgroupLabels,
  findColoring,
} from '../../../../utils'

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

const getYDomain = R.pipe(
  R.flatten,
  R.reject(isNaN),
  getMinMax,
  // Cap the min value at 0 if it's greater than 1
  R.over(R.lensIndex(0), R.when(R.lte(1), R.always(0))),
  R.apply(adjustMinMax) // Apply adjusted min/max values
)

const WaterfallChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
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

  const renderItem = (params, api) => {
    const previousVal = R.pipe(
      R.range(0),
      R.map((d) => api.value(1, d)),
      R.filter(R.both(R.isNotNil, (d) => !isNaN(d))),
      R.ifElse(R.isEmpty, R.always(NaN), R.sum)
    )(params.dataIndexInside)

    const currentVal = !isNaN(previousVal)
      ? previousVal + api.value(1)
      : api.value(1)

    const index = params.dataIndex

    const startCoord = api.coord([
      index === 0 || isNaN(previousVal) ? index : index - 1,
      isNaN(previousVal) ? 0 : previousVal,
    ])
    const endCoord = api.coord([index, currentVal])

    const seriesLength = R.isEmpty(subGroupLabels) ? 1 : subGroupLabels.length
    const categoryWidth = params.coordSys.width / xLabels.length
    const { barWidth } = getBarLayout(categoryWidth, seriesLength)
    const xOffset =
      barWidth * params.seriesIndex - (barWidth / 2) * seriesLength
    // `startCoord[0]` is used as the reference center of the middle bar
    // to estimate the position of the first bar within the current category.
    return {
      type: 'group',
      children: [
        {
          type: 'rect',
          shape: {
            x: endCoord[0] + xOffset,
            y: endCoord[1],
            width: barWidth,
            height: startCoord[1] - endCoord[1],
          },
          style: {
            fill: api.visual('color'),
          },
        },
        // Dashed line connecting the bars
        {
          type: 'line',
          shape: {
            x1: startCoord[0] + xOffset,
            y1: startCoord[1],
            x2: endCoord[0] + xOffset,
            y2: startCoord[1],
          },
          style: {
            stroke: api.visual('color'),
            lineDash: [8, 4],
            lineWidth: 2,
          },
        },
      ],
    }
  }

  const baseData = {
    type: 'custom',
    renderItem,
    smooth: true,
    emphasis: {
      focus: 'series',
    },
  }

  const series = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) =>
        R.mergeDeepLeft(baseData, {
          name: R.head(d).name,
          color:
            findColoring(R.head(d).name, colors) ??
            getChartItemColor(R.head(d).name),
          data: R.map(
            // Sort by index, ensuring that empty data is set to undefined
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
      R.mergeDeepLeft(R.assoc('data', R.unnest(d), baseData), {
        colorBy: 'data',
        color: R.map(
          (item) => findColoring(item, colors) ?? getChartItemColor(item)
        )(xLabels),
      }),
    ]
  )(yValues)

  const [yMin, yMax] = R.pipe(
    R.pluck('data'),
    R.map(
      R.pipe(
        R.filter(R.isNotNil),
        // perform a cumulative sum operation
        R.mapAccum((a, b) => [a + b, a + b], 0),
        R.last
      )
    ),
    getYDomain
  )(series)

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

  const options = {
    tooltip: {
      formatter: (params) =>
        params.length === 1
          ? `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
                ${params
                  .map(({ marker, value }) =>
                    R.isNil(value) && !showNA
                      ? false
                      : `<div style="display: flex">
                        <div style="text-align: center; flex: 1 1 auto">${marker}</div>
                        <div><strong>${NumberFormat.format(value, numberFormat)}</strong></div>
                      </div>`
                  )
                  .filter(R.identity)
                  .join('')}`
          : `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
          ${params
            .map(({ marker, seriesName, value }) =>
              R.isNil(value) && !showNA
                ? false
                : `<div style="display: flex">
                  <div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} ${seriesName}</div>
                  <div><strong>${NumberFormat.format(value, numberFormat)}</strong></div>
                </div>`
            )
            .filter(R.identity)
            .join('')}`,
    },
    xAxis: {
      name: xAxisTitle,
      data: xLabels,
    },
    yAxis: {
      name: `${yAxisTitle}${scaleLabel ? ` (${scaleLabel})` : ''}`,
      scale: true,
      // Add the maximum to do the scaling
      // As well as the min value
      min: yMin,
      max: yMax,
      axisLabel: {
        formatter: (value) =>
          scaleLabel ? (+value / scaleFactor).toPrecision(3) : value,
      },
    },
    series,
  }

  return <FlexibleChart {...{ options, chartHoverOrder, path, xAxisOrder }} />
}

const StackedWaterfallChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat,
  colors,
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

  const categoryBounds = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      // The total values after summing up each category
      R.map(R.pipe(R.pluck('value'), R.unnest, R.sum)),
      R.reduce((acc, value) => {
        const startValue = R.isEmpty(acc) ? 0 : R.path([-1, 1])(acc)
        const endValue = startValue + value
        return R.append([startValue, endValue])(acc)
      }, []),
      R.zipWith(R.prepend, xLabels),
      R.map(R.zipObj(['x', 'startValue', 'endValue']))
    ),
    R.pipe(
      // The total values after summing up each category
      R.map(R.sum),
      R.reduce((acc, value) => {
        const startValue = R.isEmpty(acc) ? 0 : R.path([-1, 1])(acc)
        const endValue = startValue + value
        return R.append([startValue, endValue])(acc)
      }, []),
      R.zipWith(R.prepend, xLabels),
      R.map(R.zipObj(['x', 'startValue', 'endValue']))
    )
  )(yValues)

  const directionalSum = R.pipe(
    // perform a cumulative sum operation
    R.mapAccum(
      (acc, val) => {
        const direction = Math.sign(val) === -1 ? 'falling' : 'rising'
        const newVal = R.assoc(direction, acc[direction] + val, acc)
        return [newVal, newVal]
      },
      { falling: 0, rising: 0 }
    ),
    R.last
  )

  const categoryValues = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.map(R.pipe(R.pluck('value'), R.unnest, directionalSum)),
    R.always({})
  )(yValues)

  const renderItem = (params, api) => {
    const index = params.dataIndex
    const newValue = api.value(1)

    const direction = Math.sign(newValue) === -1 ? 'falling' : 'rising'

    const prevColVal = R.prop(
      'startValue',
      categoryBounds[params.dataIndexInside]
    )

    const storedSeriesIndex = R.findIndex(R.propEq(params.seriesName, 'name'))(
      yValues[index]
    )

    const previousVal =
      storedSeriesIndex !== 0 && storedSeriesIndex !== -1
        ? R.path(
            [params.dataIndexInside, storedSeriesIndex - 1, direction],
            categoryValues
          ) + prevColVal
        : prevColVal

    const currentVal = !isNaN(previousVal) ? previousVal + newValue : newValue
    // coordinates of previous column for connecting line
    const lineStartCoord = api.coord([
      index === 0 || isNaN(previousVal) ? index : index - 1,
      prevColVal,
    ])

    // coordinates of previous bar in column if exists || lineStartCoord
    const startCoord = api.coord([
      index === 0 || isNaN(previousVal) ? index : index - 1,
      isNaN(previousVal) ? 0 : previousVal,
    ])
    const endCoord = api.coord([index, currentVal])

    const categoryWidth = params.coordSys.width / xLabels.length
    const { barWidth } = getBarLayout(categoryWidth, 1)

    const barChart = {
      type: 'rect',
      shape: {
        x: endCoord[0] - barWidth / 2,
        y: startCoord[1],
        width: barWidth,
        height: endCoord[1] - startCoord[1],
      },
      style: {
        fill: api.visual('color'),
      },
    }

    // Dashed line connecting the bars
    const lineConnector = [
      {
        shape: {
          x1: startCoord[0],
          y1: lineStartCoord[1],
          x2: endCoord[0],
          y2: lineStartCoord[1],
        },
        type: 'line',
        style: {
          stroke: '#ffffff',
          lineWidth: 2,
          lineDash: [8, 6],
          symbolSize: 120,
        },
        z2: 1,
      },
    ]

    return {
      type: 'group',
      children: R.unless(
        R.always(R.isEmpty(lineConnector)),
        R.concat(lineConnector)
      )([barChart]),
    }
  }

  const baseData = {
    type: 'custom',
    renderItem,
    smooth: true,
    emphasis: {
      focus: 'series',
    },
  }

  const barSeries = R.ifElse(
    (val) => R.type(R.head(R.head(val))) === 'Object',
    R.pipe(
      R.addIndex(R.map)((d, idx) => R.map(R.assoc('index', idx))(d)),
      R.flatten,
      R.collectBy(R.prop('name')),
      R.map((d) =>
        R.mergeDeepLeft(baseData, {
          name: R.head(d).name,
          color:
            findColoring(R.head(d).name, colors) ??
            getChartItemColor(R.head(d).name),
          data: R.map(
            // Sort by index, ensuring that empty data is set to undefined
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
      R.mergeDeepLeft(R.assoc('data', R.unnest(d), baseData), {
        colorBy: 'data',
        color: R.map(
          (item) => findColoring(item, colors) ?? getChartItemColor(item)
        )(xLabels),
      }),
    ]
  )(yValues)

  const [yMin, yMax] = R.pipe(
    R.ifElse(
      (val) => R.type(R.head(R.head(val))) === 'Object',
      R.pipe(
        R.mapAccum(
          (acc, val) => {
            const categoryVals = R.pipe(
              R.pluck('value'),
              R.flatten,
              R.filter(R.isNotNil)
            )(val)
            const max = R.reduce(
              (acc, item) => (R.gt(item, 0) ? acc + item : acc),
              0
            )(categoryVals)
            const min = R.reduce(
              (acc, item) => (R.lt(item, 0) ? acc + item : acc),
              0
            )(categoryVals)
            const current = R.map(R.add(R.prop('sum', acc)))({
              max,
              min,
              sum: R.sum(categoryVals),
            })
            return [current, current]
          },
          { sum: 0 }
        ),
        R.last,
        R.project(['max', 'min']),
        R.map(R.values)
      ),
      R.always(R.chain(R.props(['startValue', 'endValue']))(categoryBounds))
    ),
    getYDomain
  )(yValues)

  const getGraphSeries = (nodesData) => ({
    type: 'graph',
    coordinateSystem: 'cartesian2d',
    categories: [
      {
        name: 'Initial',
        symbol: 'diamond',
        itemStyle: {
          color: getChartItemColor('Initial'),
        },
      },
      {
        name: 'Net Change',
        symbol: 'circle',
        itemStyle: {
          color: getChartItemColor('Net Change'),
        },
      },
    ],
    lineStyle: {
      type: 'dashed',
      width: 2,
      color: '#ffffff',
    },
    emphasis: { focus: 'series' },
    symbolSize: 16,
    itemStyle: {
      borderWidth: 2,
      borderColor: '#4a4a4a',
    },
    nodes: nodesData,
    tooltip: {
      valueFormatter: (value) => NumberFormat.format(value, numberFormat),
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

  const series = [
    ...barSeries,
    getGraphSeries(initNodes, 'Initial'),
    getGraphSeries(netChangeNodes, 'Net Change'),
  ]

  const scaleFactor = getDecimalScaleFactor(yMax)
  const scaleLabel = getDecimalScaleLabel(yMax)

  const options = {
    xAxis: {
      name: xAxisTitle,
      data: xLabels,
    },
    yAxis: {
      name: `${yAxisTitle}${scaleLabel ? ` (${scaleLabel})` : ''}`,
      scale: true,
      // Add the maximum to do the scaling
      // As well as the min value
      min: yMin,
      max: yMax,
      axisLabel: {
        formatter: (value) =>
          scaleLabel ? (+value / scaleFactor).toPrecision(3) : value,
      },
    },
    series,
    legend: {
      data: [
        ...subGroupLabels,
        { name: 'Initial', icon: 'diamond' },
        { name: 'Net Change', icon: 'circle' },
      ],
    },
    tooltip: {
      formatter: (params) =>
        params.length === 3
          ? `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
                ${params
                  .map(({ marker, value }) =>
                    R.isNil(value) && !showNA
                      ? false
                      : `<div style="display: flex">
                        <div style="text-align: center; flex: 1 1 auto">${marker}</div>
                        <div><strong>${NumberFormat.format(value, numberFormat)}</strong></div>
                      </div>`
                  )
                  .filter(R.identity)
                  .join('')}`
          : `<div style="margin-bottom: 3px"><strong>${params[0].name}</strong></div>
          ${params
            .map(({ marker, seriesName, value, seriesType }) =>
              R.isNil(value) && !showNA
                ? false
                : `<div style="display: flex">
                  <div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} ${seriesType === 'graph' ? '' : seriesName}</div>
                  <div><strong>${NumberFormat.format(value, numberFormat)}</strong></div>
                </div>`
            )
            .filter(R.identity)
            .join('')}`,
    },
  }

  return <FlexibleChart {...{ options, chartHoverOrder, path, xAxisOrder }} />
}

export { WaterfallChart, StackedWaterfallChart }
