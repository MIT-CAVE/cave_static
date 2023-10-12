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

const DashboardChart = ({ chartObj }) => {
  const statisticTypes = useSelector(selectGroupedOutputTypes)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const memoizedChartFunc = useSelector(selectMemoizedChartFunc)
  const categories = useSelector(selectStatGroupings)

  const formattedData = memoizedChartFunc(chartObj)

  const subGrouped = R.hasPath(['groupingLevel', 1])(chartObj)

  //TODO: Generalize this for n-level grouping
  const colors = subGrouped
    ? chartObj.variant === chartType.SUNBURST
      ? R.mergeLeft(
          getColoringFn(
            categories,
            R.path(['groupingId', 1], chartObj),
            R.path(['groupingLevel', 1]),
            chartObj
          ),
          getColoringFn(
            categories,
            R.path(['groupingId', 0], chartObj),
            R.path(['groupingLevel', 0]),
            chartObj
          )
        )
      : getColoringFn(
          categories,
          R.path(['groupingId', 1], chartObj),
          R.path(['groupingLevel', 1]),
          chartObj
        )
    : getColoringFn(
        categories,
        R.path(['groupingId', 0], chartObj),
        R.path(['groupingLevel', 0]),
        chartObj
      )

  const xAxisTitle = chartObj.category
    ? `${getLabelFn(categories)(R.path(['groupingId', 0], chartObj))}${
        chartObj.level && R.path(['groupingLevel', 0], chartObj)
          ? ` \u279D ${getSubLabelFn(
              categories,
              R.path(['groupingId', 0], chartObj),
              R.path(['groupingLevel', 0], chartObj),
              chartObj
            )}`
          : ''
      }`
    : ''

  const stat = R.pathOr({}, [chartObj.groupedOutputDataId, chartObj.statId])(
    statisticTypes
  )
  const unit = stat.unit || numberFormatDefault.unit

  const yAxisTitle = `${getGroupLabelFn(statisticTypes)([
    chartObj.groupedOutputDataId,
    chartObj.statId,
  ])}${unit ? ` [${unit}]` : ''}`

  const labels = { xAxisTitle, yAxisTitle }

  const tableStatLabels = R.map((item) => {
    const stat = R.propOr({}, item)(statisticTypes)
    const unit = stat.unit || numberFormatDefault.unit
    return `${getGroupLabelFn(statisticTypes)(item)}${unit ? ` [${unit}]` : ''}`
  })(R.zip(chartObj.groupedOutputDataId, chartObj.statId))
  const tableLabels = R.prepend(
    chartObj.groupingId
      ? `${getLabelFn(categories)(R.path(['groupingId', 0], chartObj))}${
          R.path(['groupingLevel', 0], chartObj)
            ? ` \u279D ${getSubLabelFn(
                categories,
                R.path(['groupingId', 0], chartObj),
                R.path(['groupingLevel', 0], chartObj)
              )}`
            : ''
        }`
      : '',
    subGrouped
      ? R.prepend(
          `${getLabelFn(categories)(R.path(['groupingId', 1], chartObj))}${
            R.path(['groupingLevel', 1], chartObj)
              ? ` \u279D ${getSubLabelFn(
                  categories,
                  R.path(['groupingId', 1], chartObj),
                  R.path(['groupingLevel', 1], chartObj)
                )}`
              : ''
          }`,
          tableStatLabels
        )
      : tableStatLabels
  )

  const tableColTypes = R.pipe(
    R.concat(R.repeat('number')(R.length(tableStatLabels))),
    R.when(R.always(R.has('groupingLevel')(chartObj)), R.prepend('string'))
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
      {chartObj.variant === chartType.TABLE &&
      chartObj.groupingId &&
      chartObj.groupingId[0] ? (
        <TableChart
          data={formattedData}
          numberFormat={commonFormat}
          labels={tableLabels}
          columnTypes={tableColTypes}
        />
      ) : chartObj.variant === chartType.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.BAR ? (
        <BarPlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.LINE ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.SUNBURST ? (
        <Sunburst
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
        />
      ) : chartObj.variant === chartType.TREEMAP ? (
        <Treemap
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
        />
      ) : chartObj.variant === chartType.GAUGE ? (
        <GaugeChart
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.HEATMAP ? (
        <Heatmap data={formattedData} numberFormat={commonFormat} {...labels} />
      ) : chartObj.variant === chartType.AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          area={true}
          colors={colors}
          {...labels}
        />
      ) : chartObj.variant === chartType.STACKED_AREA ? (
        <LinePlot
          data={formattedData}
          numberFormat={commonFormat}
          colors={colors}
          area={true}
          stack="x"
          {...labels}
        />
      ) : chartObj.variant === chartType.SCATTER ? (
        <ScatterPlot
          data={formattedData}
          numberFormat={commonFormat}
          labels={tableLabels}
          colors={colors}
        />
      ) : chartObj.variant === chartType.BUBBLE ? (
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
