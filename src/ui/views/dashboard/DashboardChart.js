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
import {
  chartVariant,
  distributionTypes,
  distributionYAxes,
} from '../../../utils/enums'

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
  DistributionChart,
  MixedChart,
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
  const distributionType = R.propOr(
    distributionTypes.PDF,
    'distributionType',
    cleanedChartObj
  )
  const distributionYAxis = R.propOr(
    distributionYAxes.COUNTS,
    'distributionYAxis',
    cleanedChartObj
  )
  const distributionVariant = R.propOr(
    'bar',
    'distributionVariant',
    cleanedChartObj
  )
  const leftVariant = R.propOr('line', 'leftVariant', cleanedChartObj)
  const rightVariant = R.propOr('bar', 'rightVariant', cleanedChartObj)
  const showNA = R.propOr(false, 'showNA', cleanedChartObj)

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

  const convertDataToCSV = () => {
    const convertRowData = (rowData) => {
      // recursive case
      if (R.has('children', rowData)) {
        return R.chain(
          (child) =>
            R.map((row) => [rowData.name, ...row], convertRowData(child)),
          rowData.children
        )
      }

      // base case
      return [[rowData.name, rowData.value[0]]]
    }

    const csv = [[...cleanedChartObj.groupingLevel, cleanedChartObj.statId]]
    R.forEach((row) => csv.push(...convertRowData(row)), formattedData)
    return csv.map((row) => row.join(',')).join('\n')
  }

  console.log(convertDataToCSV())

  const groupingRange = R.pipe(
    R.prop('groupingId'),
    R.length,
    R.range(0),
    R.reverse
  )(cleanedChartObj)

  const colors =
    cleanedChartObj.variant === chartVariant.SUNBURST ||
    cleanedChartObj.variant === chartVariant.TREEMAP
      ? R.mergeAll(
          R.map((idx) =>
            getColoringFn(
              categories,
              R.path(['groupingId', idx], cleanedChartObj),
              R.path(['groupingLevel', idx], cleanedChartObj)
            )
          )(groupingRange)
        )
      : getColoringFn(
          categories,
          R.path(['groupingId', R.head(groupingRange)], cleanedChartObj),
          R.path(['groupingLevel', R.head(groupingRange)], cleanedChartObj)
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

  const getNumberFormat = R.pipe(
    numberFormatPropsFn,
    // `unit`s are excluded as they will be represented
    // as part of the axis labels or column headers.
    R.omit(['unit', 'unitPlacement'])
  )

  const loadingComponent = (
    <CircularProgress
      sx={{
        mx: 'auto',
        mt: '25%',
      }}
    />
  )

  if (R.isEmpty(statisticTypes)) {
    return loadingComponent
  }

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

  if (loading) return loadingComponent
  if (R.isEmpty(formattedData))
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Box
          sx={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
          }}
        >
          Empty Chart Data
        </Box>
        <Box
          sx={{
            fontSize: '1.5rem',
          }}
        >
          Please check your data or your filters.
        </Box>
      </Box>
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
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.BAR ? (
        <BarPlot
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.LINE ? (
        <LinePlot
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
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
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.STACKED_AREA ? (
        <LinePlot
          area
          stack="x"
          data={formattedData}
          {...{ colors, numberFormat, showNA, ...labels }}
        />
      ) : cleanedChartObj.variant === chartVariant.SCATTER &&
        R.isNil(R.path(['statId', 2], cleanedChartObj)) ? (
        <ScatterPlot
          data={formattedData}
          labelProps={R.dissoc(3)(labelProps)}
          {...{ colors, numberFormat }}
        />
      ) : cleanedChartObj.variant === chartVariant.DISTRIBUTION ? (
        <DistributionChart
          data={formattedData}
          cumulative={distributionType === distributionTypes.CDF}
          chartType={distributionVariant}
          counts={distributionYAxis === distributionYAxes.COUNTS}
          yAxisTitle={
            distributionYAxis === distributionYAxes.COUNTS
              ? 'Counts'
              : distributionType === distributionTypes.PDF
                ? 'Probability Density'
                : 'Cumulative Density'
          }
          xAxisTitle={yAxisTitle}
          {...{ colors, numberFormat }}
        />
      ) : cleanedChartObj.variant === chartVariant.MIXED ? (
        <MixedChart
          data={formattedData}
          {...{ labelProps }}
          leftVariant={leftVariant}
          rightVariant={rightVariant}
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
