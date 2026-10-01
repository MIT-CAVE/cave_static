import { Box, CircularProgress, Stack } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectGroupedOutputTypes,
  selectNumberFormat,
  selectMemoizedChartFunc,
  selectChartColors,
  selectSlimStatGroupings,
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
  getGroupLabelFn,
  cleanUndefinedStats,
} from '../../../utils'

const DashboardChart = ({ chartObj, path }) => {
  const [formattedData, setFormattedData] = useState([])
  const [loading, setLoading] = useState(true)
  const [prevChartObj, setPrevChartObj] = useState(null)

  const statisticTypes = useSelector(selectGroupedOutputTypes)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const memoizedChartFunc = useSelector(selectMemoizedChartFunc)
  const categories = useSelector(selectSlimStatGroupings)
  const numberFormatPropsFn = useSelector(selectNumberFormatPropsFn)

  const cleanedChartObj = useMemo(
    () => cleanUndefinedStats(chartObj),
    [chartObj]
  )

  if (cleanedChartObj !== prevChartObj) {
    setPrevChartObj(cleanedChartObj)
    setLoading(true)
    setFormattedData([])
  }

  const chartType = R.propOr(chartVariant.BAR, 'chartType', cleanedChartObj)
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

  const getColors = useSelector(selectChartColors)

  const colors = useMemo(
    () =>
      getColors(
        chartType,
        cleanedChartObj.groupingId,
        cleanedChartObj.groupingLevel
      ),
    [
      chartType,
      cleanedChartObj.groupingId,
      cleanedChartObj.groupingLevel,
      getColors,
    ]
  )

  // NOTE: Use with selectChartColorsAlt
  // const colors = useSelector((state) =>
  //   selectChartColors(
  //     state,
  //     chartType,
  //     chartObj.groupingId,
  //     chartObj.groupingLevel
  //   )
  // )

  const chartHoverOrder = R.propOr(
    'seriesDesc',
    'chartHoverOrder',
    cleanedChartObj
  )
  const xAxisOrder = R.propOr('default', 'xAxisOrder', cleanedChartObj)

  useEffect(() => {
    let isCancelled = false
    const runWorkers = async () => {
      try {
        const computedData = await memoizedChartFunc(cleanedChartObj)
        if (!isCancelled) {
          setFormattedData(computedData || [])
          setLoading(false)
        }
      } catch (err) {
        if (!isCancelled) {
          setFormattedData([])
          setLoading(false)
        }
      }
    }
    const workerRunner = setTimeout(runWorkers, 10)
    return () => {
      isCancelled = true
      clearTimeout(workerRunner)
    }
  }, [cleanedChartObj, memoizedChartFunc])

  const groupingRange = useMemo(
    () =>
      R.pipe(
        R.prop('groupingId'),
        R.length,
        R.range(0),
        R.reverse
      )(cleanedChartObj),
    [cleanedChartObj]
  )

  const xAxisTitle = useMemo(
    () =>
      cleanedChartObj.groupingId
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
        : '',
    [categories, cleanedChartObj]
  )

  const getYAxisTitle = useCallback(
    (statIdx) => {
      // Given a cleanedChartObj and a statIdx, return the yAxisTitle for the chart
      const statDataset = cleanedChartObj.dataset
      const statObject = R.pathOr({}, ['stats', statIdx], cleanedChartObj)
      const statId = R.propOr('', 'statId', statObject)
      const statIdLabel = getGroupLabelFn(statisticTypes, [statDataset, statId])
      const statUnit =
        R.pathOr({}, [statDataset, statId], statisticTypes).unit ||
        numberFormatDefault.unit

      const statDivisorId = R.propOr('', 'statIdDivisor', statObject)
      const statDivisorIdLabel = getGroupLabelFn(statisticTypes, [
        statDataset,
        statDivisorId,
      ])
      const statDivisorUnit =
        statisticTypes[statDataset]?.[statDivisorId]?.unit ||
        numberFormatDefault.unit

      const statAggregation = R.propOr('', 'aggregationType', statObject)
      const statAggregationGroupingId = R.propOr(
        '',
        'aggregationGroupingId',
        statObject
      )
      const statAggregationGroupingLevel = R.propOr(
        '',
        'aggregationGroupingLevel',
        statObject
      )
      const statAggregationGroupingLabel = getLabelFn(
        categories,
        statAggregationGroupingId
      )
      const statAggregationGroupingSubLabel = getSubLabelFn(
        categories,
        statAggregationGroupingId,
        statAggregationGroupingLevel
      )

      var yAxisTitle = ''

      // TODO: Consider adding sum back in for consistency...
      if (
        statAggregation !== 'divisor' &&
        statAggregation !== '' &&
        statAggregation !== 'sum'
      ) {
        yAxisTitle += `${statAggregation.toUpperCase()} of `
      }
      // If the statAggregation is a divisor, add the statId and the divisor name to
      if (statAggregation === 'divisor') {
        yAxisTitle += `${statIdLabel} / ${statDivisorIdLabel}`
        // If stat unit does not equal the divisor units, add the units to the yAxisTitle
        if (statUnit !== statDivisorUnit) {
          yAxisTitle += statUnit
            ? `/n[${statUnit} ${statDivisorUnit ? `/ ${statDivisorUnit} ]` : ']'}`
            : ''
        }
      } else {
        yAxisTitle += statIdLabel
        yAxisTitle += statUnit ? ` [${statUnit}]` : ''
      }
      yAxisTitle += statAggregationGroupingId
        ? `\nGrouped By ${statAggregationGroupingLabel} \u279D ${statAggregationGroupingSubLabel}`
        : ''

      return yAxisTitle
    },
    [categories, cleanedChartObj, numberFormatDefault.unit, statisticTypes]
  )

  const yAxisTitle = useMemo(() => getYAxisTitle(0), [getYAxisTitle])

  const labels = useMemo(
    () => ({ xAxisTitle, yAxisTitle }),
    [xAxisTitle, yAxisTitle]
  )

  const statPaths = useMemo(
    () =>
      R.pipe(
        R.propOr([], 'stats'),
        R.map((stat) => [cleanedChartObj.dataset, stat.statId])
      )(cleanedChartObj),
    [cleanedChartObj]
  )

  const labelProps = useMemo(() => {
    const multiStatLabelProps = R.map((idx) => {
      return {
        type: 'number',
        key: R.pathOr('', ['stats', idx, 'statId'], cleanedChartObj),
        label: getYAxisTitle(idx),
      }
    })(R.range(0, R.length(R.propOr([], 'stats', cleanedChartObj))))

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

    return R.reduce(
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
  }, [categories, cleanedChartObj, getYAxisTitle, groupingRange])

  const numberFormats = useMemo(() => {
    const getNumberFormat = R.pipe(
      numberFormatPropsFn,
      // `unit`s are excluded as they will be represented
      // as part of the axis labels or column headers.
      R.omit(['unit', 'unitPlacement'])
    )
    return R.reduce(
      (acc, [dataset, statId]) =>
        R.assoc(
          statId,
          getNumberFormat(
            R.pathOr({}, [dataset, statId], statisticTypes), // current stat
            statId
          )
        )(acc),
      {}
    )(statPaths)
  }, [numberFormatPropsFn, statPaths, statisticTypes])

  const numberFormat = useMemo(
    () =>
      R.keys(numberFormats).length > 1
        ? numberFormats
        : (numberFormats[cleanedChartObj.stats?.[0]?.statId] ?? ''),
    [cleanedChartObj.stats, numberFormats]
  )

  if (R.isEmpty(statisticTypes) || loading) {
    return <CircularProgress sx={{ mx: 'auto', mt: '25%' }} />
  }

  if (R.isEmpty(formattedData)) {
    return (
      <Stack
        sx={{
          justifyContent: 'center',
          height: '100%',
          width: '100%',
          fontSize: '1.5rem',
        }}
      >
        <Box
          sx={{
            fontWeight: 'bold',
          }}
        >
          Empty Chart Data
        </Box>
        <Box>Please check your data or your filters.</Box>
      </Stack>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
        minHeight: 0,
      }}
    >
      {chartType === chartVariant.TABLE &&
      cleanedChartObj.groupingId &&
      cleanedChartObj.groupingId[0] ? (
        <TableChart
          data={formattedData}
          numberFormat={numberFormats}
          {...{ labelProps }}
        />
      ) : chartType === chartVariant.BOX_PLOT ? (
        <BoxPlot
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.BAR ? (
        <BarPlot
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.STACKED_BAR ? (
        <BarPlot
          stack="x"
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.STACKED_WATERFALL ? (
        <StackedWaterfallChart
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.LINE ? (
        <LinePlot
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.WATERFALL ? (
        <WaterfallChart
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.CUMULATIVE_LINE ? (
        <CumulativeLineChart
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.SUNBURST ? (
        <Sunburst
          data={formattedData}
          {...{ colors, numberFormat, chartHoverOrder, path, xAxisOrder }}
        />
      ) : chartType === chartVariant.TREEMAP ? (
        <Treemap
          data={formattedData}
          {...{ colors, numberFormat, chartHoverOrder, path, xAxisOrder }}
        />
      ) : chartType === chartVariant.GAUGE ? (
        <GaugeChart
          data={formattedData}
          {...{ colors, numberFormat, ...labels }}
        />
      ) : chartType === chartVariant.HEATMAP ? (
        <Heatmap
          data={formattedData}
          {...{ numberFormat, chartHoverOrder, path, xAxisOrder, ...labels }}
        />
      ) : chartType === chartVariant.AREA ? (
        <LinePlot
          area
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.STACKED_AREA ? (
        <LinePlot
          area
          stack="x"
          data={formattedData}
          {...{
            colors,
            numberFormat,
            showNA,
            chartHoverOrder,
            path,
            xAxisOrder,
            ...labels,
          }}
        />
      ) : chartType === chartVariant.SCATTER &&
        R.isNil(R.path(['statId', 2], cleanedChartObj)) ? (
        <ScatterPlot
          data={formattedData}
          labelProps={R.dissoc(3)(labelProps)}
          {...{ colors, numberFormat, chartHoverOrder }}
        />
      ) : chartType === chartVariant.DISTRIBUTION ? (
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
          {...{ colors, numberFormat, chartHoverOrder }}
        />
      ) : chartType === chartVariant.MIXED ? (
        <MixedChart
          data={formattedData}
          {...{ labelProps, colors, chartHoverOrder, path, xAxisOrder }}
          leftVariant={leftVariant}
          rightVariant={rightVariant}
        />
      ) : chartType === chartVariant.SCATTER ? (
        <BubblePlot
          data={formattedData}
          {...{ labelProps, colors, numberFormat, chartHoverOrder }}
        />
      ) : (
        <></>
      )}
    </Box>
  )
}

export default memo(DashboardChart)
