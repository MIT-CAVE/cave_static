import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectGroupedOutputTypes,
  selectTheme,
  selectNumberFormat,
  selectMemoizedChartFunc,
  selectStatGroupings,
} from '../../../data/selectors'
import { chartType } from '../../../utils/enums'

import {
  BarPlot,
  BoxPlot,
  CumulativeLineChart,
  LinePlot,
  StackedWaterfallChart,
  TableChart,
  WaterfallChart,
  Sunburst,
  Treemap,
  GaugeChart,
  Heatmap,
  ScatterPlot,
  BubblePlot,
} from '../../charts'

import {
  getLabelFn,
  getSubLabelFn,
  getColoringFn,
  getGroupLabelFn,
} from '../../../utils'

const DashboardChart = ({ obj }) => {
  const themeId = useSelector(selectTheme)
  const statisticTypes = useSelector(selectGroupedOutputTypes)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const memoizedChartFunc = useSelector(selectMemoizedChartFunc)
  const categories = useSelector(selectStatGroupings)

  const formattedData = memoizedChartFunc(obj)

  const subGrouped = R.hasPath(['level', 1])(obj)

  //TODO: Generalize this for n-level grouping
  const colors = subGrouped
    ? obj.chart === chartType.SUNBURST
      ? R.mergeLeft(
          getColoringFn(
            categories,
            R.path(['category', 1], obj),
            R.path(['level', 1]),
            obj
          ),
          getColoringFn(
            categories,
            R.path(['category', 0], obj),
            R.path(['level', 0]),
            obj
          )
        )
      : getColoringFn(
          categories,
          R.path(['category', 1], obj),
          R.path(['level', 1]),
          obj
        )
    : getColoringFn(
        categories,
        R.path(['category', 0], obj),
        R.path(['level', 0]),
        obj
      )

  const xAxisTitle = obj.category
    ? `${getLabelFn(categories)(R.path(['category', 0], obj))}${
        obj.level && R.path(['level', 0], obj)
          ? ` \u279D ${getSubLabelFn(
              categories,
              R.path(['category', 0], obj),
              R.path(['level', 0], obj),
              obj
            )}`
          : ''
      }`
    : ''

  const stat = R.pathOr({}, obj.statistic)(statisticTypes)
  const unit = stat.unit || numberFormatDefault.unit

  const yAxisTitle = `${getGroupLabelFn(statisticTypes)(obj.statistic)}${
    unit ? ` [${unit}]` : ''
  }`

  const labels = { xAxisTitle, yAxisTitle }

  const tableStatLabels = R.map((item) => {
    const stat = R.propOr({}, item)(statisticTypes)
    const unit = stat.unit || numberFormatDefault.unit
    return `${getGroupLabelFn(statisticTypes)(item)}${unit ? ` [${unit}]` : ''}`
  })(obj.statistic)
  const tableLabels = R.prepend(
    obj.category
      ? `${getLabelFn(categories)(obj.category)}${
          obj.level
            ? ` \u279D ${getSubLabelFn(categories, obj.category, obj.level)}`
            : ''
        }`
      : '',
    subGrouped
      ? R.prepend(
          `${getLabelFn(categories)(obj.category2)}${
            obj.level2
              ? ` \u279D ${getSubLabelFn(
                  categories,
                  obj.category2,
                  obj.level2
                )}`
              : ''
          }`,
          tableStatLabels
        )
      : tableStatLabels
  )

  const tableColTypes = R.pipe(
    R.concat(R.repeat('number')(R.length(tableStatLabels))),
    R.when(R.always(R.has('level')(obj)), R.prepend('string')),
    R.when(R.always(R.has('level2')(obj)), R.prepend('string'))
  )([])

  // For simplicity, `numberFormatDefault` is used to apply number
  // formatting to all values in a chart, as some statistics may
  // be the result of combining different number formats. Although
  // unlikely in a general `numberFormat` definition, `unit`s are
  // excluded as they will be represented in the header or as part
  // of the axis labels.
  const commonFormat = R.omit(['unit', 'unitPlacement'])(numberFormatDefault)
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      {obj.chart === chartType.TABLE && obj.category ? (
        <TableChart
          data={formattedData}
          numberFormat={commonFormat}
          labels={tableLabels}
          columnTypes={tableColTypes}
        />
      ) : obj.chart === chartType.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.BAR ? (
        <BarPlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.LINE ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.SUNBURST ? (
        <Sunburst
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
        />
      ) : obj.chart === chartType.TREEMAP ? (
        <Treemap
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
        />
      ) : obj.chart === chartType.GAUGE ? (
        <GaugeChart
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.HEATMAP ? (
        <Heatmap
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          {...labels}
        />
      ) : obj.chart === chartType.AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          area={true}
          colors={colors}
          {...labels}
        />
      ) : obj.chart === chartType.STACKED_AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          colors={colors}
          area={true}
          stack="x"
          {...labels}
        />
      ) : obj.chart === chartType.SCATTER ? (
        <ScatterPlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          labels={tableLabels}
          colors={colors}
        />
      ) : obj.chart === chartType.BUBBLE ? (
        <BubblePlot
          data={formattedData}
          numberFormat={commonFormat}
          theme={themeId}
          labels={tableLabels}
          colors={colors}
        />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default memo(DashboardChart)
