import { Box, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectGroupedOutputTypes,
  selectNumberFormat,
  selectMemoizedChartFunc,
  selectStatGroupings,
  selectNumberFormatPropsFn,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'

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
  const numberFormatPropsFn = useSelector(selectNumberFormatPropsFn)

  const [formattedData, setFormattedData] = useState([])

  useEffect(() => {
    const runWorkers = async () => {
      const formattedData = await memoizedChartFunc(chartObj)
      setFormattedData(formattedData)
    }
    setFormattedData([])
    runWorkers()
  }, [chartObj, memoizedChartFunc])

  const subGrouped = R.hasPath(['groupingLevel', 1])(chartObj)

  //TODO: Generalize this for n-level grouping
  const colors = subGrouped
    ? chartObj.variant === chartVariant.SUNBURST
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

  const xAxisTitle = chartObj.groupingId
    ? `${getLabelFn(categories)(R.pathOr('', ['groupingId', 0], chartObj))}${
        chartObj.groupingLevel && R.pathOr('', ['groupingLevel', 0], chartObj)
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

  const statPaths = R.zip(chartObj.groupedOutputDataId)(chartObj.statId)

  const tableStatColumnProps = R.map((item) => {
    const stat = R.pathOr({}, item)(statisticTypes)
    const unit = stat.unit || numberFormatDefault.unit
    return {
      type: 'number',
      field: item[1],
      label: `${getGroupLabelFn(statisticTypes)(item)}${unit ? ` [${unit}]` : ''}`,
    }
  })(statPaths)

  const getGroupingLabel = (n) =>
    `${getLabelFn(categories)(R.path(['groupingId', n], chartObj))}${
      R.path(['groupingLevel', n], chartObj)
        ? ` \u279D ${getSubLabelFn(
            categories,
            R.path(['groupingId', n], chartObj),
            R.path(['groupingLevel', n], chartObj)
          )}`
        : ''
    }`

  const columnProps = R.pipe(
    R.when(
      R.always(subGrouped),
      R.prepend({
        type: 'string',
        field: 'level',
        label: getGroupingLabel(1),
      })
    ),
    R.when(
      R.always(chartObj.groupingId != null),
      R.prepend({
        type: 'string',
        field: 'grouping',
        label: getGroupingLabel(0),
      })
    )
  )(tableStatColumnProps)

  // eslint-disable-next-line no-unused-vars
  const getNumberFormat = R.curry((currentStat, currentStatId) =>
    R.pipe(
      // TODO: Consider removing this unused code commented below
      // R.ifElse(
      //   R.propEq(currentStatId, 'calculation'),
      //   // If the stat matches `calculation`, apply the stat's number formatting.
      //   numberFormatPropsFn,
      //   // Otherwise, use `numberFormatDefault` to apply number formatting for
      //   // a stat that is the result of combining different number formats.
      //   R.always(numberFormatDefault)
      // ),
      numberFormatPropsFn,
      // `unit`s are excluded as they will be represented
      // as part of the axis labels or column headers.
      R.omit(['unit', 'unitPlacement'])
    )(currentStat)
  )

  const numberFormat =
    chartObj.variant === chartVariant.TABLE
      ? R.reduce(
          (acc, [groupedOutputDataId, statId]) =>
            R.assoc(
              statId,
              getNumberFormat(
                statisticTypes[groupedOutputDataId][statId], // current stat
                statId
              )
            )(acc),
          {}
        )(statPaths)
      : getNumberFormat(stat, chartObj.statId)

  if (R.isEmpty(formattedData))
    return (
      <CircularProgress
        sx={{
          mx: 'auto',
          mt: '25%',
        }}
      />
    )
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      {chartObj.variant === chartVariant.TABLE &&
      chartObj.groupingId &&
      chartObj.groupingId[0] ? (
        <TableChart data={formattedData} {...{ columnProps, numberFormat }} />
      ) : chartObj.variant === chartVariant.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.BAR ? (
        <BarPlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.LINE ? (
        <LinePlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.SUNBURST ? (
        <Sunburst data={formattedData} {...{ colors, numberFormat }} />
      ) : chartObj.variant === chartVariant.TREEMAP ? (
        <Treemap data={formattedData} {...{ colors, numberFormat }} />
      ) : chartObj.variant === chartVariant.GAUGE ? (
        <GaugeChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.HEATMAP ? (
        <Heatmap data={formattedData} {...{ numberFormat, ...labels }} />
      ) : chartObj.variant === chartVariant.AREA ? (
        <LinePlot
          area
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.STACKED_AREA ? (
        <LinePlot
          area
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartObj.variant === chartVariant.SCATTER &&
        R.isNil(R.path(['statId', 2], chartObj)) ? (
        <ScatterPlot
          data={formattedData}
          labels={R.pipe(R.pluck('label'), R.dissoc(3))(columnProps)}
          {...{ colors, numberFormat }}
        />
      ) : chartObj.variant === chartVariant.SCATTER ? (
        <BubblePlot
          data={formattedData}
          labels={R.pluck('label')(columnProps)}
          {...{ colors, numberFormat }}
        />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default memo(DashboardChart)
