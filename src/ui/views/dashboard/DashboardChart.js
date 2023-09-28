import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectGroupedOutputTypes,
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

const DashboardChart = ({ view }) => {
  const statisticTypes = useSelector(selectGroupedOutputTypes)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const memoizedChartFunc = useSelector(selectMemoizedChartFunc)
  const categories = useSelector(selectStatGroupings)

  const formattedData = memoizedChartFunc(view)

  const subGrouped = R.hasPath(['level', 1])(view)

  //TODO: Generalize this for n-level grouping
  const colors = subGrouped
    ? view.chart === chartType.SUNBURST
      ? R.mergeLeft(
          getColoringFn(
            categories,
            R.path(['category', 1], view),
            R.path(['level', 1]),
            view
          ),
          getColoringFn(
            categories,
            R.path(['category', 0], view),
            R.path(['level', 0]),
            view
          )
        )
      : getColoringFn(
          categories,
          R.path(['category', 1], view),
          R.path(['level', 1]),
          view
        )
    : getColoringFn(
        categories,
        R.path(['category', 0], view),
        R.path(['level', 0]),
        view
      )

  const xAxisTitle = view.category
    ? `${getLabelFn(categories)(R.path(['category', 0], view))}${
        view.level && R.path(['level', 0], view)
          ? ` \u279D ${getSubLabelFn(
              categories,
              R.path(['category', 0], view),
              R.path(['level', 0], view),
              view
            )}`
          : ''
      }`
    : ''

  const stat = R.pathOr({}, view.statistic)(statisticTypes)
  const unit = stat.unit || numberFormatDefault.unit

  const yAxisTitle = `${getGroupLabelFn(statisticTypes)(view.statistic)}${
    unit ? ` [${unit}]` : ''
  }`

  const labels = { xAxisTitle, yAxisTitle }

  const tableStatLabels = R.map((item) => {
    const stat = R.propOr({}, item)(statisticTypes)
    const unit = stat.unit || numberFormatDefault.unit
    return `${getGroupLabelFn(statisticTypes)(item)}${unit ? ` [${unit}]` : ''}`
  })(view.statistic)
  const tableLabels = R.prepend(
    view.category
      ? `${getLabelFn(categories)(R.path(['category', 0], view))}${
          R.path(['level', 0], view)
            ? ` \u279D ${getSubLabelFn(
                categories,
                R.path(['category', 0], view),
                R.path(['level', 0], view)
              )}`
            : ''
        }`
      : '',
    subGrouped
      ? R.prepend(
          `${getLabelFn(categories)(R.path(['category', 1], view))}${
            R.path(['level', 1], view)
              ? ` \u279D ${getSubLabelFn(
                  categories,
                  R.path(['category', 1], view),
                  R.path(['level', 1], view)
                )}`
              : ''
          }`,
          tableStatLabels
        )
      : tableStatLabels
  )

  const tableColTypes = R.pipe(
    R.concat(R.repeat('number')(R.length(tableStatLabels))),
    R.when(R.always(R.has('level')(view)), R.prepend('string')),
    R.when(R.always(R.has('level2')(view)), R.prepend('string'))
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
      {view.chart === chartType.TABLE && view.category && view.category[0] ? (
        <TableChart
          data={formattedData}
          numberFormat={commonFormat}
          labels={tableLabels}
          columnTypes={tableColTypes}
        />
      ) : view.chart === chartType.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.BAR ? (
        <BarPlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.LINE ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.SUNBURST ? (
        <Sunburst
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
        />
      ) : view.chart === chartType.TREEMAP ? (
        <Treemap
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
        />
      ) : view.chart === chartType.GAUGE ? (
        <GaugeChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.HEATMAP ? (
        <Heatmap data={formattedData} numberFormat={commonFormat} {...labels} />
      ) : view.chart === chartType.AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          area={true}
          colors={colors}
          {...labels}
        />
      ) : view.chart === chartType.STACKED_AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          area={true}
          stack="x"
          {...labels}
        />
      ) : view.chart === chartType.SCATTER ? (
        <ScatterPlot
          data={formattedData}
          numberFormat={commonFormat}
          labels={tableLabels}
          colors={colors}
        />
      ) : view.chart === chartType.BUBBLE ? (
        <BubblePlot
          data={formattedData}
          numberFormat={commonFormat}
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
