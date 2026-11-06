import { Box, CircularProgress, Stack } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectGroupedOutputsData,
  selectGroupedOutputTypes,
  selectNumberFormat,
  selectRichTextDefault,
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
  escapeRichText,
  labelText,
  resolveRichText,
  richPiece,
} from '../../../utils/richText'
import ChartContext from '../../charts/chart-types/echarts/ChartContext'

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
  const groupedOutputsData = useSelector(selectGroupedOutputsData)
  const richTextDefault = useSelector(selectRichTextDefault)
  const chartRichText = resolveRichText(chartObj.richText, richTextDefault)
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

  const chartContextValue = useMemo(
    () => ({
      // Canvas text can't render markup, so the title is its plain twin
      title: labelText(chartObj.title ?? '', chartRichText),
      richTitle: chartObj.title ?? '',
      richText: chartRichText,
      path,
      chartHoverOrder,
      xAxisOrder,
    }),
    [chartObj.title, chartRichText, path, chartHoverOrder, xAxisOrder]
  )

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

  // Names are rich text when the closest `richText` is `true`: the stat (or
  // its dataset), the grouping level (or its grouping), and the chart title.
  // Canvas text can't render markup, so it uses the plain twin of the names.
  // Table headers are composed of rich and literal pieces: the literal ones are
  // escaped so they are shown as they are.
  const getStatRichText = useCallback(
    (dataset, statId) =>
      resolveRichText(
        statisticTypes[dataset]?.[statId]?.richText,
        groupedOutputsData[dataset]?.richText,
        richTextDefault
      ),
    [groupedOutputsData, richTextDefault, statisticTypes]
  )
  const getGroupingRichText = useCallback(
    (groupingId, level) =>
      resolveRichText(
        categories[groupingId]?.levels?.[level]?.richText,
        categories[groupingId]?.richText,
        richTextDefault
      ),
    [categories, richTextDefault]
  )

  const getGroupingTitle = useCallback(
    (groupingId, level, rich = false, alwaysSub = false) => {
      const flag = getGroupingRichText(groupingId, level)
      const name = rich
        ? richPiece(getLabelFn(categories)(groupingId), flag === true)
        : labelText(getLabelFn(categories)(groupingId), flag)
      if (!level && !alwaysSub) return { text: name, rich: flag === true }
      const subName = getSubLabelFn(categories, groupingId, level)
      return {
        text: `${name}${rich ? escapeRichText(' ➝ ') : ' ➝ '}${
          rich ? richPiece(subName, flag === true) : labelText(subName, flag)
        }`,
        rich: flag === true,
      }
    },
    [categories, getGroupingRichText]
  )

  const xAxisTitle = useMemo(
    () =>
      cleanedChartObj.groupingId
        ? getGroupingTitle(
            R.pathOr('', ['groupingId', 0], cleanedChartObj),
            R.path(['groupingLevel', 0], cleanedChartObj)
          ).text
        : '',
    [cleanedChartObj, getGroupingTitle]
  )

  // `rich` returns the rich text, with `rich: false` its plain twin
  const getYAxisTitle = useCallback(
    (statIdx, rich = false) => {
      let hasRichText = false
      const lit = (text) => (rich ? escapeRichText(text) : text)
      const piece = (text, flag) => {
        if (flag === true) hasRichText = true
        return rich ? richPiece(text, flag === true) : labelText(text, flag)
      }
      // Given a cleanedChartObj and a statIdx, return the yAxisTitle for the chart
      const statDataset = cleanedChartObj.dataset
      const statObject = R.pathOr({}, ['stats', statIdx], cleanedChartObj)
      const statId = R.propOr('', 'statId', statObject)
      const statFlag = getStatRichText(statDataset, statId)
      const statIdLabel = piece(
        getGroupLabelFn(statisticTypes, [statDataset, statId]),
        statFlag
      )
      const statUnit =
        R.pathOr({}, [statDataset, statId], statisticTypes).unit ||
        numberFormatDefault.unit

      const statDivisorId = R.propOr('', 'statIdDivisor', statObject)
      const statDivisorIdLabel = piece(
        getGroupLabelFn(statisticTypes, [statDataset, statDivisorId]),
        getStatRichText(statDataset, statDivisorId)
      )
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
      var yAxisTitle = ''

      // TODO: Consider adding sum back in for consistency...
      if (
        statAggregation !== 'divisor' &&
        statAggregation !== '' &&
        statAggregation !== 'sum'
      ) {
        yAxisTitle += lit(`${statAggregation.toUpperCase()} of `)
      }
      // If the statAggregation is a divisor, add the statId and the divisor name to
      if (statAggregation === 'divisor') {
        yAxisTitle += `${statIdLabel}${lit(' / ')}${statDivisorIdLabel}`
        // If stat unit does not equal the divisor units, add the units to the yAxisTitle
        if (statUnit !== statDivisorUnit) {
          yAxisTitle += statUnit
            ? `${lit('/n[')}${piece(statUnit, statFlag)}${lit(
                ` ${statDivisorUnit ? '/ ' : ''}`
              )}${statDivisorUnit ? piece(statDivisorUnit, statFlag) : ''}${lit(
                statDivisorUnit ? ' ]' : ']'
              )}`
            : ''
        }
      } else {
        yAxisTitle += statIdLabel
        yAxisTitle += statUnit
          ? `${lit(' [')}${piece(statUnit, statFlag)}${lit(']')}`
          : ''
      }
      if (statAggregationGroupingId) {
        const { text, rich: groupingIsRich } = getGroupingTitle(
          statAggregationGroupingId,
          statAggregationGroupingLevel,
          rich,
          true
        )
        if (groupingIsRich) hasRichText = true
        yAxisTitle += `${lit('\nGrouped By ')}${text}`
      }

      return rich ? { text: yAxisTitle, hasRichText } : yAxisTitle
    },
    [
      cleanedChartObj,
      getGroupingTitle,
      getStatRichText,
      numberFormatDefault.unit,
      statisticTypes,
    ]
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
      const { text, hasRichText } = getYAxisTitle(idx, true)
      return {
        type: 'number',
        key: R.pathOr('', ['stats', idx, 'statId'], cleanedChartObj),
        label: getYAxisTitle(idx),
        // Only set when some part of the header is rich text
        ...(hasRichText && { richLabel: text }),
      }
    })(R.range(0, R.length(R.propOr([], 'stats', cleanedChartObj))))

    const getGroupingLabelProps = (n) => {
      const groupingId = R.path(['groupingId', n], cleanedChartObj)
      const level = R.path(['groupingLevel', n], cleanedChartObj)
      const plain = getGroupingTitle(groupingId, level)
      const rich = getGroupingTitle(groupingId, level, true)
      return {
        label: plain.text,
        ...(rich.rich && { richLabel: rich.text }),
      }
    }

    return R.reduce(
      (acc, value) =>
        R.prepend(
          {
            type: 'string',
            key: `grouping${value}`,
            ...getGroupingLabelProps(value),
          },
          acc
        ),
      multiStatLabelProps
    )(groupingRange)
  }, [cleanedChartObj, getGroupingTitle, getYAxisTitle, groupingRange])

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
        : (numberFormats[cleanedChartObj.stats?.[0]?.statId] ?? {}),
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
    <ChartContext.Provider value={chartContextValue}>
      <Box
        sx={{
          display: 'flex',
          position: 'relative',
          flex: '1 1 auto',
          minHeight: 0,
          minWidth: 0,
          overflow: 'hidden',
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
              ...labels,
            }}
          />
        ) : chartType === chartVariant.SUNBURST ? (
          <Sunburst data={formattedData} {...{ colors, numberFormat }} />
        ) : chartType === chartVariant.TREEMAP ? (
          <Treemap data={formattedData} {...{ colors, numberFormat }} />
        ) : chartType === chartVariant.GAUGE ? (
          <GaugeChart
            data={formattedData}
            {...{ colors, numberFormat, ...labels }}
          />
        ) : chartType === chartVariant.HEATMAP ? (
          <Heatmap data={formattedData} {...{ numberFormat, ...labels }} />
        ) : chartType === chartVariant.AREA ? (
          <LinePlot
            area
            data={formattedData}
            {...{
              colors,
              numberFormat,
              showNA,
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
              ...labels,
            }}
          />
        ) : chartType === chartVariant.SCATTER &&
          R.isNil(R.path(['statId', 2], cleanedChartObj)) ? (
          <ScatterPlot
            data={formattedData}
            labelProps={R.dissoc(3)(labelProps)}
            {...{ colors, numberFormat: numberFormats }}
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
            {...{ colors, numberFormat }}
          />
        ) : chartType === chartVariant.MIXED ? (
          <MixedChart
            data={formattedData}
            {...{ labelProps, colors }}
            leftVariant={leftVariant}
            rightVariant={rightVariant}
          />
        ) : chartType === chartVariant.SCATTER ? (
          <BubblePlot
            data={formattedData}
            {...{
              labelProps,
              colors,
              numberFormat: numberFormats,
            }}
          />
        ) : (
          <></>
        )}
      </Box>
    </ChartContext.Provider>
  )
}

export default memo(DashboardChart)
