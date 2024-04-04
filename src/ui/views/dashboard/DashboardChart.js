import { Box, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect, useState, useMemo } from 'react'
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
  forceArray,
  cleanUndefinedStats,
} from '../../../utils'

const DashboardChart = ({ chartObj }) => {
  const [formattedData, setFormattedData] = useState([])
  const [loading, setLoading] = useState(true)

  const statisticTypes = useSelector(selectGroupedOutputTypes)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const memoizedChartFunc = useSelector(selectMemoizedChartFunc)
  const categories = useSelector(selectStatGroupings)
  const numberFormatPropsFn = useSelector(selectNumberFormatPropsFn)
  const cleanedChartObj = cleanUndefinedStats(chartObj)
  const chartType = R.propOr('', 'variant', cleanedChartObj)

  useEffect(() => {
    setLoading(false)
  }, [formattedData])

  // for some reason useLayoutEffect doesn't set the state before the chart is rendered
  // so we use useMemo to trigger the loading state
  useMemo(() => {
    setLoading(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType])

  useEffect(() => {
    const runWorkers = async () => {
      memoizedChartFunc(cleanedChartObj).then((computedData) => {
        setFormattedData(computedData)
      })
    }
    runWorkers()
  }, [cleanedChartObj, memoizedChartFunc])

  const subGrouped = R.hasPath(['groupingLevel', 1])(cleanedChartObj)

  //TODO: Generalize this for n-level grouping
  const colors = subGrouped
    ? cleanedChartObj.variant === chartVariant.SUNBURST
      ? R.mergeLeft(
          getColoringFn(
            categories,
            R.path(['groupingId', 1], cleanedChartObj),
            R.path(['groupingLevel', 1], cleanedChartObj)
          ),
          getColoringFn(
            categories,
            R.path(['groupingId', 0], cleanedChartObj),
            R.path(['groupingLevel', 0], cleanedChartObj)
          )
        )
      : getColoringFn(
          categories,
          R.path(['groupingId', 1], cleanedChartObj),
          R.path(['groupingLevel', 1], cleanedChartObj)
        )
    : getColoringFn(
        categories,
        R.path(['groupingId', 0], cleanedChartObj),
        R.path(['groupingLevel', 0], cleanedChartObj)
      )

  const xAxisTitle = cleanedChartObj.groupingId
    ? `${getLabelFn(categories)(R.pathOr('', ['groupingId', 0], cleanedChartObj))}${
        cleanedChartObj.groupingLevel &&
        R.pathOr('', ['groupingLevel', 0], cleanedChartObj)
          ? ` \u279D ${getSubLabelFn(
              categories,
              R.path(['groupingId', 0], cleanedChartObj),
              R.path(['groupingLevel', 0], cleanedChartObj),
              cleanedChartObj
            )}`
          : ''
      }`
    : ''

  const stat = R.pathOr({}, [
    cleanedChartObj.groupedOutputDataId,
    cleanedChartObj.statId,
  ])(statisticTypes)
  const unit = stat.unit || numberFormatDefault.unit

  const yAxisTitle = `${getGroupLabelFn(statisticTypes)([
    cleanedChartObj.groupedOutputDataId,
    cleanedChartObj.statId,
  ])}${unit ? ` [${unit}]` : ''}`

  const labels = { xAxisTitle, yAxisTitle }

  const statPaths = R.pipe(
    R.props(['groupedOutputDataId', 'statId']),
    R.map(forceArray),
    R.apply(R.zip)
  )(cleanedChartObj)

  const multiStatLabelProps = R.map((item) => {
    const stat = R.pathOr({}, item)(statisticTypes)
    const unit = stat.unit || numberFormatDefault.unit
    return {
      type: 'number',
      key: item[1],
      label: `${getGroupLabelFn(statisticTypes)(item)}${unit ? ` [${unit}]` : ''}`,
    }
  })(statPaths)

  const getGroupingLabel = (n) =>
    `${getLabelFn(categories)(R.path(['groupingId', n], cleanedChartObj))}${
      R.path(['groupingLevel', n], cleanedChartObj)
        ? ` \u279D ${getSubLabelFn(
            categories,
            R.path(['groupingId', n], cleanedChartObj),
            R.path(['groupingLevel', n], cleanedChartObj)
          )}`
        : ''
    }`
  const groupingRange = R.pipe(
    R.prop('groupingId'),
    R.length,
    R.range(0),
    R.reverse
  )(cleanedChartObj)
  const labelProps = R.reduce(
    (acc, value) =>
      R.prepend(
        {
          type: 'string',
          key: `grouping${value}`,
          label: getGroupingLabel(value),
        },
        acc
      ),
    multiStatLabelProps
  )(groupingRange)

  // eslint-disable-next-line no-unused-vars
  const getNumberFormat = R.pipe(
    numberFormatPropsFn,
    // `unit`s are excluded as they will be represented
    // as part of the axis labels or column headers.
    R.omit(['unit', 'unitPlacement'])
  )

  const numberFormat = R.is(Array)(cleanedChartObj.statId)
    ? // Multi-stat charts
      R.reduce(
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
    : getNumberFormat(stat)
  // TODO: Use an empty `formattedData` to provide better
  // feedback in the UI when the chart content is empty
  if (R.isEmpty(formattedData) || loading)
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
      {cleanedChartObj.variant === chartVariant.TABLE &&
      cleanedChartObj.groupingId &&
      cleanedChartObj.groupingId[0] ? (
        <TableChart data={formattedData} {...{ labelProps, numberFormat }} />
      ) : cleanedChartObj.variant === chartVariant.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.BAR ? (
        <BarPlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.LINE ? (
        <LinePlot
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.SUNBURST ? (
        <Sunburst data={formattedData} {...{ colors, numberFormat }} />
      ) : cleanedChartObj.variant === chartVariant.TREEMAP ? (
        <Treemap data={formattedData} {...{ colors, numberFormat }} />
      ) : cleanedChartObj.variant === chartVariant.GAUGE ? (
        <GaugeChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.HEATMAP ? (
        <Heatmap data={formattedData} {...{ numberFormat, ...labels }} />
      ) : cleanedChartObj.variant === chartVariant.AREA ? (
        <LinePlot
          area
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_AREA ? (
        <LinePlot
          area
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.SCATTER &&
        R.isNil(R.path(['statId', 2], cleanedChartObj)) ? (
        <ScatterPlot
          data={formattedData}
          labelProps={R.dissoc(3)(labelProps)}
          {...{ colors, numberFormat }}
        />
      ) : cleanedChartObj.variant === chartVariant.SCATTER ? (
        <BubblePlot
          data={formattedData}
          {...{ labelProps, colors, numberFormat }}
        />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default memo(DashboardChart)
