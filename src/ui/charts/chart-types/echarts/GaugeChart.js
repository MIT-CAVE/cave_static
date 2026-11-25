import { Box } from '@mui/material'
import * as R from 'ramda'

import { FlexibleChart } from './BaseChart'
import { useValueDisplayName } from './ChartContext'
import {
  DEFAULT_SIZE,
  MIN_LABEL_HEIGHT,
  PADDING,
  getChartHeading,
} from './chartHeading'

import {
  NumberFormat,
  adjustMinMax,
  getMinMax,
  getChartItemColor,
  getTintedItemStyle,
  findColoring,
  resolveNumberFormat,
} from '../../../../utils'
import { markup, safeHtml } from '../../../../utils/html'
import OverflowText from '../../../compound/OverflowText'
// The unfilled part of the dial. ECharts' dark theme makes it almost black, so
// it uses the translucent white that other lines have on the chart background.
const DIAL_TRACK_COLOR = 'rgba(255, 255, 255, 0.04)'
// The size of the names of the axes in the other charts
const GROUP_LABEL_FONT = 20
// The bottom margin of the grid, which the name of the x-axis is measured from
const GRID_BOTTOM = 80

const styles = {
  // The names and values of the gauges, which scroll when they don't fit. It
  // has the background of the chart.
  values: {
    flexShrink: 0,
    bgcolor: 'background.paper',
    px: 1.5,
    py: 0.75,
    textAlign: 'center',
  },
  valueList: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    gap: 3,
  },
  // The name and value of a gauge, with its color as the border and (very
  // faintly) as the background
  valueItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    px: 1,
    py: 0.5,
    border: '1px solid',
    borderRadius: 1,
    lineHeight: 1.3,
  },
  valueName: {
    fontSize: 12,
    color: 'text.secondary',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}

// The opacity of the color of a gauge in the background of its name and value
const VALUE_BACKGROUND_OPACITY = '12%'

const NICE_STEPS = [1, 2, 2.5, 5, 10]

// Rounds the scale of the dial outward, to steps like 1, 2, 2.5 or 5 (times a
// power of ten) so that its numbers are round, with at most `maxIntervals`
const getNiceScale = (min, max, maxIntervals) => {
  const range = max - min || 1
  const rawStep = range / maxIntervals
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step =
    (NICE_STEPS.find((n) => n * magnitude >= rawStep) ?? 10) * magnitude
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  return {
    min: niceMin,
    max: niceMax,
    splitNumber: Math.max(1, Math.round((niceMax - niceMin) / step)),
  }
}

// Everything is laid out in pixels from the size of the chart, as the text
// does not shrink with the dial: the heading on top, the dial below it and the
// grouping label at the bottom. The names and values of the gauges are not
// drawn in the chart, but under it.
const getLayout = ({ width, height }, hasGroupLabel, headingHeight) => {
  const showGroupLabel = height >= MIN_LABEL_HEIGHT && hasGroupLabel
  const groupLabelHeight = showGroupLabel ? GROUP_LABEL_FONT * 1.2 + 10 : 0

  // The dial is its radius tall above its center, and about 0.75 radii below it
  const radius = R.clamp(
    24,
    (width - 2 * PADDING) / 2,
    (height - headingHeight - groupLabelHeight - 8) / 1.75
  )

  const pointerWidth = R.clamp(3, 8, Math.round(radius / 18))
  const tickFont = R.clamp(8, 12, Math.round(radius / 9))
  const axisWidth = R.clamp(6, 20, Math.round(radius / 6))
  const splitLength = R.clamp(4, 10, Math.round(radius / 12))
  const labelDistance = R.clamp(4, 25, Math.round(radius / 8))
  // The numbers are inside the arc, after its tick marks
  const labelRadius =
    radius - axisWidth - splitLength - labelDistance - tickFont / 2

  return {
    showGroupLabel,
    radius,
    pointerWidth,
    centerY: Math.round(headingHeight + radius),
    tickFont,
    axisWidth,
    splitLength,
    labelDistance,
    // The numbers fit along the arc (270 degrees) they are placed on
    maxIntervals: R.clamp(
      3,
      10,
      Math.floor((4.7 * labelRadius) / (tickFont * 3.2))
    ),
  }
}

const GaugeValues = ({ items }) => (
  <OverflowText sx={styles.values}>
    <Box sx={styles.valueList}>
      {items.map(({ name, color, value }, index) => (
        <Box
          key={index}
          sx={[
            styles.valueItem,
            {
              borderColor: color,
              bgcolor: `color-mix(in srgb, ${color} ${VALUE_BACKGROUND_OPACITY}, transparent)`,
            },
          ]}
        >
          <Box sx={styles.valueName}>{name}</Box>
          <Box sx={styles.value}>{value}</Box>
        </Box>
      ))}
    </Box>
  </OverflowText>
)

const GaugeChart = ({
  data,
  xAxisTitle,
  yAxisTitle,
  numberFormat = {},
  colors,
}) => {
  const getDisplayName = useValueDisplayName()
  if (R.isNil(data) || R.isEmpty(data)) return []

  const xLabels = R.pluck('name', data)

  const yValues = R.has('children', R.head(data))
    ? R.pluck('children', data)
    : R.pluck('value', data)

  const resolvedNumberFormat = resolveNumberFormat(numberFormat)
  const getColor = (label) =>
    findColoring(label, colors) ?? getChartItemColor(label)

  const getBaseObject = (layout) => ({
    type: 'gauge',
    center: ['50%', layout.centerY],
    radius: layout.radius,
    anchor: {
      show: true,
      showAbove: true,
      size: R.clamp(8, 18, Math.round(layout.radius / 8)),
    },
    pointer: {
      icon: 'path://M2.9,0.7L2.9,0.7c1.4,0,2.6,1.2,2.6,2.6v115c0,1.4-1.2,2.6-2.6,2.6l0,0c-1.4,0-2.6-1.2-2.6-2.6V3.3C0.3,1.9,1.4,0.7,2.9,0.7z',
      width: layout.pointerWidth,
      length: '80%',
    },
    progress: {
      show: true,
      overlap: false,
      roundCap: true,
    },
    axisLine: {
      lineStyle: {
        width: layout.axisWidth,
        color: [[1, DIAL_TRACK_COLOR]],
      },
    },
    splitLine: {
      length: layout.splitLength,
    },
    axisTick: {
      length: Math.max(3, Math.round(layout.splitLength * 0.6)),
    },
    axisLabel: {
      distance: layout.labelDistance,
      fontSize: layout.tickFont,
      formatter: (value) => String(Number(value.toPrecision(10))),
    },
    smooth: true,
    emphasis: {
      focus: 'series',
    },
    // The names and values are under the chart (see `GaugeValues`)
    title: { show: false },
    detail: { show: false },
  })

  const seriesData = R.pipe(
    R.unnest,
    R.addIndex(R.map)((value, index) => ({
      value,
      name: getDisplayName(xLabels[index]),
    }))
  )(yValues)

  const [yMin, yMax] = R.pipe(
    R.flatten,
    R.filter(R.isNotNil),
    getMinMax,
    R.apply(adjustMinMax)
  )(yValues)

  const getOptions = (size) => {
    const { width } = size ?? DEFAULT_SIZE
    const heading = getChartHeading(size ?? DEFAULT_SIZE, yAxisTitle)
    const layout = getLayout(
      size ?? DEFAULT_SIZE,
      Boolean(xAxisTitle),
      heading.height
    )
    const scale = getNiceScale(yMin > 0 ? 0 : yMin, yMax, layout.maxIntervals)
    // The progress and the needle of each gauge are a translucent fill with a
    // border of its color (as in the bars of the bar chart). They can be thinner
    // than the border, so it gets thinner with them.
    const getBorderWidth = (thickness) => R.clamp(0.5, 1, thickness / 4)
    const progressBorderWidth = getBorderWidth(
      layout.axisWidth / seriesData.length
    )
    const pointerBorderWidth = getBorderWidth(layout.pointerWidth)
    const series = [
      {
        ...getBaseObject(layout),
        data: seriesData.map((item, index) => {
          const itemStyle = getTintedItemStyle(getColor(xLabels[index]))
          return {
            ...item,
            progress: {
              itemStyle: { ...itemStyle, borderWidth: progressBorderWidth },
            },
            pointer: {
              itemStyle: { ...itemStyle, borderWidth: pointerBorderWidth },
            },
          }
        }),
        colorBy: 'data',
        color: R.map(getColor)(xLabels),
        min: scale.min,
        max: scale.max,
        splitNumber: scale.splitNumber,
      },
    ]

    const labelWidth = width - 2 * PADDING
    return {
      grid: { bottom: GRID_BOTTOM },
      // The name of the axis is the grouping label, which is at the bottom
      xAxis: {
        name: layout.showGroupLabel ? xAxisTitle : undefined,
        nameLocation: 'middle',
        nameGap: GRID_BOTTOM - 6 - Math.round(GROUP_LABEL_FONT * 1.2),
        nameTextStyle: {
          fontSize: GROUP_LABEL_FONT,
          width: labelWidth,
          overflow: 'truncate',
        },
        axisLine: {
          show: false,
        },
      },
      title: heading.title,
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
      },
      series,
      tooltip: {
        trigger: 'item',
        formatter: ({ marker, name, value }) =>
          markup`${safeHtml(marker)} ${name}: <strong>${NumberFormat.format(
            value,
            resolvedNumberFormat
          )}</strong>`.toString(),
      },
    }
  }

  const items = seriesData.map(({ name, value }, index) => ({
    name,
    color: getColor(xLabels[index]),
    value: NumberFormat.format(value, resolvedNumberFormat),
  }))

  return (
    <FlexibleChart
      options={getOptions}
      below={<GaugeValues {...{ items }} />}
    />
  )
}

export { GaugeChart }
