import {
  Box,
  Divider,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  Stack,
  Typography,
} from '@mui/material'
import * as R from 'ramda'
import { memo, Fragment } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'
import ChartTypeSelector from './ChartTypeSelector'

import { mutateLocal } from '../../../data/local'
import {
  selectSync,
  selectCurrentPage,
  selectAllowedStats,
  selectGroupedOutputNames,
  selectStatGroupings,
  selectGroupedOutputsData,
} from '../../../data/selectors'
import {
  chartAggrFunc,
  chartOption,
  chartMaxGrouping,
  chartStatUses,
  chartVariant,
  distributionTypes,
  distributionYAxes,
} from '../../../utils/enums'

import { Select, SelectAccordion, SelectAccordionList } from '../../compound'

import {
  withIndex,
  getCategoryItems,
  getLabelFn,
  getGroupLabelFn,
  getSubLabelFn,
  includesPath,
  mapIndexed,
  forceArray,
  capitalize,
} from '../../../utils'

const styles = {
  content: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    overflow: 'auto',
  },
  row: {
    width: '100%',
    display: 'flex',
    flexDirection: 'row',
    gap: 1,
    marginBottom: 0.5,
  },
  field: {
    padding: 1,
    display: 'flex',
    flexDirection: 'row',
    flexGrow: 1,
    gap: 2,
  },
  item: {
    height: '55px',
  },
}

const CHART_OPTIONS = [
  chartOption.BAR,
  chartOption.STACKED_BAR,
  chartOption.LINE,
  chartOption.CUMULATIVE_LINE,
  chartOption.AREA,
  chartOption.STACKED_AREA,
  chartOption.WATERFALL,
  chartOption.STACKED_WATERFALL,
  chartOption.BOX_PLOT,
  chartOption.TABLE,
  chartOption.SUNBURST,
  chartOption.TREEMAP,
  chartOption.GAUGE,
  chartOption.HEATMAP,
  chartOption.SCATTER,
  chartOption.DISTRIBUTION,
  chartOption.MIXED,
]

const HeaderGrid = ({ text }) => (
  <Grid item size={1}>
    <Box
      sx={{
        p: 1,
        bgcolor: 'action.hover',
        borderRadius: 1,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
        }}
      >
        {text}
      </Typography>
    </Box>
  </Grid>
)

const LabelledInput = ({ children, label, labelId }) => (
  <FormControl fullWidth sx={styles.item}>
    <InputLabel id={labelId}>{label}</InputLabel>
    {children}
  </FormControl>
)

const GroupedOutputsToolbar = ({ chartObj, index }) => {
  const dispatch = useDispatch()

  const categories = useSelector(selectStatGroupings)
  const statisticTypes = useSelector(selectAllowedStats)
  const groupedOutputs = useSelector(selectGroupedOutputsData)
  const statNamesByDataset = useSelector(selectGroupedOutputNames)
  const currentPage = useSelector(selectCurrentPage)
  const sync = useSelector(selectSync)

  const path = ['pages', 'data', currentPage, 'charts', index]
  const distributionType = R.propOr(
    distributionTypes.PDF,
    'distributionType',
    chartObj
  )
  const distributionYAxis = R.propOr(
    distributionYAxes.COUNTS,
    'distributionYAxis',
    chartObj
  )
  const distributionVariant = R.propOr('bar', 'distributionVariant', chartObj)
  const statNames = R.propOr([], chartObj.dataset, statNamesByDataset)
  const currentStats = R.propOr([], 'stats', chartObj)
  const currentStatIds = R.pluck('statId', currentStats)
  const unusedOptions = R.filter(
    (option) => !currentStatIds.includes(option),
    statNames
  )
  // Show an extra dropdown only if there are unused options
  const statsToShow = [
    ...currentStatIds,
    ...(unusedOptions.length > 0 ? [null] : []),
  ]

  const getGroupsById = (groupedOutputDataId) =>
    R.pipe(R.path([groupedOutputDataId, 'groupLists']), R.keys)(groupedOutputs)

  // Determine which groups can be selected based on the chosen stat(s)
  const groupByOptions = R.pipe(
    R.prop('dataset'),
    forceArray,
    R.chain(getGroupsById),
    R.uniq
  )(chartObj)

  const groupableCategories = R.isNil(groupByOptions)
    ? categories
    : R.pick(groupByOptions, categories)

  const sortedLevelsByCategory = R.mapObjIndexed(
    getCategoryItems,
    groupableCategories
  )
  const itemGroups = R.pipe(
    R.pick(R.keys(sortedLevelsByCategory)), // Drop any category not included in `levels`
    withIndex,
    R.project(['id', 'grouping', 'layoutDirection']),
    R.map((item) => R.assoc('subItems', sortedLevelsByCategory[item.id])(item)),
    R.groupBy(R.prop('grouping'))
  )(categories)

  const updateChartObj = (newObj) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: newObj,
      })
    )
  }

  const getStatName = (stat) =>
    getGroupLabelFn(statisticTypes, [chartObj.dataset, stat])

  const removeExtraLevels = (obj) => {
    if (!R.has(obj.chartType, chartMaxGrouping)) return obj

    const maxGrouping = chartMaxGrouping[obj.chartType]

    return R.pipe(
      R.assoc('groupingId', R.slice(0, maxGrouping, obj.groupingId || [])),
      R.assoc('groupingLevel', R.slice(0, maxGrouping, obj.groupingLevel || []))
    )(obj)
  }

  const handleDeleteStatistic = (index) => {
    const newStats = R.remove(index, 1, currentStats)
    updateChartObj(R.assoc('stats', newStats, chartObj))
  }

  const handleAddGroup = () => {
    updateChartObj(
      R.evolve(
        {
          groupingId: R.append(null),
          groupingLevel: R.append(null),
        },
        chartObj
      )
    )
  }

  const handleDeleteGroupFn = (n = 0) => {
    updateChartObj(
      R.pipe(
        R.dissocPath(['groupingId', n]),
        R.dissocPath(['groupingLevel', n])
      )(chartObj)
    )
  }

  const handleChangeGroupIndexFn = (prevN, n) => {
    const [grouping, level] = getGroupValues(prevN)
    const [grouping2, level2] = getGroupValues(n)

    updateChartObj(
      R.pipe(
        R.assocPath(['groupingId', prevN], grouping2),
        R.assocPath(['groupingLevel', prevN], level2),
        R.assocPath(['groupingId', n], grouping),
        R.assocPath(['groupingLevel', n], level)
      )(chartObj)
    )
  }

  const handleSelectGroupFn =
    (n = 0) =>
    (item, subItem) => {
      updateChartObj(
        R.pipe(
          R.assocPath(['groupingId', n], item),
          R.assocPath(['groupingLevel', n], subItem)
        )(chartObj)
      )
    }

  const getGroupValues = (n = 0) =>
    R.pipe(
      R.props(['groupingId', 'groupingLevel']),
      R.pluck(n),
      R.when(R.any(R.isNil), R.always(''))
    )(chartObj)

  const handleSelectChart = (value) => {
    const statUsesChanged =
      chartStatUses[chartObj.chartType] !== chartStatUses[value]

    const toSingleStatFromTable =
      chartObj.chartType === chartVariant.TABLE &&
      chartStatUses[value] == null &&
      chartObj.stats != null &&
      chartObj.stats.length === 1

    updateChartObj(
      R.pipe(
        R.assoc('chartType', value),
        R.cond([
          [
            R.always(toSingleStatFromTable),
            // Unwrap them
            R.over(R.lensProp('stats'), R.head),
          ],
          [R.always(statUsesChanged), R.dissoc('stats')],
          [R.T, R.identity],
        ]),
        removeExtraLevels
      )(chartObj)
    )
  }

  const handleSelectDistributionType = (value) => {
    updateChartObj(R.assoc('distributionType', value, chartObj))
  }

  const handleSelectYAxis = (value) => {
    updateChartObj(R.assoc('distributionYAxis', value, chartObj))
  }

  const handleSelectDistributionVariant = (value) => {
    updateChartObj(R.assoc('distributionVariant', value, chartObj))
  }

  const handleSelectMixedVariant = (variant) => (value) => {
    updateChartObj(R.assoc(`${variant}Variant`, value, chartObj))
  }

  const handleChangeDataset = (value) => {
    updateChartObj(
      R.pipe(
        R.assoc('dataset', value),
        R.dissoc('stats'),
        R.assoc('groupingId', []),
        R.assoc('groupingLevel', [])
      )(chartObj)
    )
  }

  const showFull = (obj) => {
    const selectedStats = R.propOr([], 'stats', obj)
    if (
      R.has(R.prop('chartType', obj), chartStatUses) &&
      !R.isEmpty(chartStatUses[obj.chartType])
    ) {
      return R.length(selectedStats) >= 2
    }
    return !R.isEmpty(selectedStats)
  }

  const DistributionTypeSelector = (
    <Select
      sx={{ height: '100%' }}
      label="Type"
      labelId="distribution-type-label"
      value={distributionType}
      optionsList={[
        {
          label: 'PDF',
          value: distributionTypes.PDF,
        },
        {
          label: 'CDF',
          value: distributionTypes.CDF,
        },
      ]}
      onSelect={handleSelectDistributionType}
    />
  )

  const DistributionYAxisSelector = (
    <Select
      sx={{ height: '100%' }}
      label="Y Axis"
      labelId="distribution-y-axis-label"
      value={distributionYAxis}
      optionsList={[
        {
          label: 'Density',
          value: distributionYAxes.DENSITY,
          iconName: 'md/MdPercent',
        },
        {
          label: 'Counts',
          value: distributionYAxes.COUNTS,
          iconName: 'md/MdNumbers',
        },
      ]}
      onSelect={handleSelectYAxis}
    />
  )

  const DatasetSelector = (
    <LabelledInput label="Dataset" labelId="dataset-label">
      <Select
        id="dataset"
        labelId="dataset-label"
        label="Dataset"
        value={R.propOr(' ', 'dataset', chartObj)}
        optionsList={R.keys(groupedOutputs)}
        getLabel={getLabelFn(groupedOutputs)}
        onSelect={handleChangeDataset}
      />
    </LabelledInput>
  )

  const isDatasetNotSelected = !R.has('dataset', chartObj)

  const SingleStatisticSelector = (
    <Select
      fullWidth
      sx={styles.item}
      disabled={isDatasetNotSelected}
      value={R.pathOr(' ', ['stats', 0, 'statId'], chartObj)}
      optionsList={statNames}
      getLabel={getStatName}
      onSelect={(value) => {
        updateChartObj(
          R.assoc(
            'stats',
            [{ statId: value, aggregationType: 'sum' }],
            chartObj
          )
        )
      }}
    />
  )

  const MultiStatisticSelector = mapIndexed(
    (label, index) => {
      const value = R.pathOr(' ', ['stats', index, 'statId'], chartObj)
      const labelId = `multi-stat-${index}-label`

      return (
        <LabelledInput key={index} label={label} labelId={labelId}>
          <Select
            fullWidth
            label={label}
            labelId={labelId}
            disabled={isDatasetNotSelected}
            value={value}
            optionsList={statNames}
            getLabel={getStatName}
            onSelect={(newVal) => {
              if (R.equals(value, newVal)) {
                handleDeleteStatistic(index)
              } else {
                updateChartObj(
                  R.assocPath(
                    ['stats', index],
                    {
                      statId: newVal,
                      aggregationType: 'sum',
                    },
                    chartObj
                  )
                )
              }
            }}
          />
        </LabelledInput>
      )
    },
    R.propOr([], chartObj.chartType, chartStatUses)
  )

  const TableStatisticSelector = mapIndexed(
    (statId, index) => (
      <Select
        fullWidth
        disabled={isDatasetNotSelected}
        getLabel={getStatName}
        value={statId || ' '}
        optionsList={statId ? statNames : unusedOptions}
        onSelect={(value) => {
          if (R.equals(value, statId)) {
            handleDeleteStatistic(index)
            return
          }

          const defaultStatData = {
            statId: value,
            aggregationType: 'sum',
          }

          const existingIndex = currentStats.findIndex(
            (stat) => stat.statId === value
          )

          // If selecting a stat that's already in use, swap them
          if (existingIndex !== -1 && statId !== null) {
            const newStats = [...currentStats]
            const currentStatData = { statId, aggregationType: 'sum' }
            newStats[existingIndex] = currentStatData
            newStats[index] = defaultStatData
            updateChartObj(R.assoc('stats', newStats, chartObj))
          } else {
            // Otherwise select unused value
            const newStats =
              statId === null
                ? [...currentStats, defaultStatData]
                : R.update(index, defaultStatData, currentStats)
            updateChartObj(R.assoc('stats', newStats, chartObj))
          }
        }}
      />
    ),
    statsToShow
  )

  const StatSelectors = R.flatten([
    R.has(chartObj.chartType, chartStatUses)
      ? R.length(chartStatUses[chartObj.chartType]) !== 0
        ? MultiStatisticSelector
        : TableStatisticSelector
      : SingleStatisticSelector,
  ])

  const AggregationSelector = mapIndexed(
    (_, index) => (
      <Select
        key={index}
        fullWidth
        sx={styles.item}
        getLabel={(item) => capitalize(item)}
        value={R.pathOr('', ['stats', index, 'aggregationType'], chartObj)}
        optionsList={R.values(chartAggrFunc)}
        onSelect={(value) =>
          updateChartObj(
            R.pipe(
              R.assocPath(['stats', index, 'aggregationType'], value),
              R.dissocPath(['stats', index, 'statIdDivisor']),
              R.dissocPath(['stats', index, 'aggregationGroupingId']),
              R.dissocPath(['stats', index, 'aggregationGroupingLevel'])
            )(chartObj)
          )
        }
      />
    ),
    R.propOr([], 'stats', chartObj)
  )

  const AggregationBySelector = mapIndexed(
    (_, index) => {
      const statAggregation = R.pathOr(
        '',
        ['stats', index, 'aggregationType'],
        chartObj
      )

      if (statAggregation === chartAggrFunc.SUM) {
        return null
      }

      const statName = getGroupLabelFn(statisticTypes, [
        chartObj.dataset,
        R.pathOr('', ['stats', index, 'statId'], chartObj),
      ])

      return statAggregation === chartAggrFunc.DIVISOR ? (
        <Select
          key={index}
          fullWidth
          sx={styles.item}
          disabled={isDatasetNotSelected}
          id={`divide-${statName}`}
          value={R.pathOr(' ', ['stats', index, 'statIdDivisor'], chartObj)}
          optionsList={statNames}
          getLabel={getStatName}
          onSelect={(value) =>
            updateChartObj(
              R.assocPath(['stats', index, 'statIdDivisor'], value, chartObj)
            )
          }
        />
      ) : (
        <SelectAccordion
          key={index}
          fullWidth
          sx={styles.item}
          itemGroups={itemGroups}
          values={[
            R.pathOr('', ['stats', index, 'aggregationGroupingId'], chartObj),
            R.pathOr(
              '',
              ['stats', index, 'aggregationGroupingLevel'],
              chartObj
            ),
          ]}
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onSelect={(item, value) =>
            updateChartObj(
              R.pipe(
                R.assocPath(['stats', index, 'aggregationGroupingId'], item),
                R.assocPath(['stats', index, 'aggregationGroupingLevel'], value)
              )(chartObj)
            )
          }
        />
      )
    },
    R.propOr([], 'stats', chartObj)
  )

  const DistributionVariantSelector = [
    showFull(chartObj) && (
      <Select
        fullWidth
        sx={styles.item}
        value={distributionVariant}
        optionsList={[chartOption.BAR, chartOption.LINE]}
        onSelect={handleSelectDistributionVariant}
      />
    ),
  ]

  const MixedVariantSelector = mapIndexed(
    (variant, index) =>
      R.hasPath(['stats', index], chartObj) && (
        <Select
          key={variant}
          fullWidth
          sx={styles.item}
          value={R.propOr('line', `${variant}Variant`, chartObj)}
          optionsList={[
            chartOption.BAR,
            chartOption.LINE,
            chartOption.CUMULATIVE_LINE,
          ]}
          onSelect={handleSelectMixedVariant(variant)}
        />
      ),
    ['left', 'right']
  )

  const VariantSelector =
    chartObj.chartType === chartVariant.DISTRIBUTION
      ? DistributionVariantSelector
      : chartObj.chartType === chartVariant.MIXED
        ? MixedVariantSelector
        : null

  return (
    <Box sx={styles.content}>
      <ChartTypeSelector
        value={chartObj.chartType}
        onChange={handleSelectChart}
        chartOptions={CHART_OPTIONS}
      />

      <Divider />

      <Stack direction="row">
        <Box sx={styles.row}>
          <ChartDropdownWrapper sx={styles.field}>
            {DatasetSelector}
          </ChartDropdownWrapper>
        </Box>
      </Stack>

      <ChartDropdownWrapper
        sx={[styles.field, { flexDirection: 'column', flexGrow: 0, gap: 1 }]}
      >
        <Grid
          container
          spacing={1}
          sx={{ width: '100%' }}
          columns={VariantSelector ? 4 : 3}
        >
          <HeaderGrid text="Statistic" />
          {VariantSelector && <HeaderGrid text="Chart Type" />}
          <HeaderGrid text="Aggregation" />
          <HeaderGrid text="Aggregate By" />
          {mapIndexed((statSelector, index) => {
            return (
              <Fragment key={index}>
                <Grid item size={1}>
                  {statSelector}
                </Grid>
                {VariantSelector && (
                  <Grid item size={1}>
                    {R.prop(index, VariantSelector)}
                  </Grid>
                )}
                <Grid item size={1}>
                  {R.prop(index, AggregationSelector)}
                </Grid>
                <Grid item size={1}>
                  {R.prop(index, AggregationBySelector)}
                </Grid>
              </Fragment>
            )
          }, StatSelectors)}
        </Grid>
      </ChartDropdownWrapper>

      {showFull(chartObj) &&
        chartObj.chartType === chartVariant.DISTRIBUTION && (
          <Box sx={styles.row}>
            <ChartDropdownWrapper sx={styles.field}>
              <>
                {mapIndexed(
                  ({ selector, label, labelId }, index) => (
                    <LabelledInput key={index} labelId={labelId} label={label}>
                      {selector}
                    </LabelledInput>
                  ),
                  [
                    {
                      selector: DistributionTypeSelector,
                      label: 'Type',
                      labelId: 'distribution-type-label',
                    },
                    {
                      selector: DistributionYAxisSelector,
                      label: 'Y Axis',
                      labelId: 'distribution-y-axis-label',
                    },
                  ]
                )}
              </>
            </ChartDropdownWrapper>
          </Box>
        )}

      <Box sx={styles.row}>
        <ChartDropdownWrapper sx={styles.field}>
          <FormControl fullWidth>
            <InputLabel id="group-by-label" shrink>
              Group By
            </InputLabel>
            <SelectAccordionList
              labelId="group-by-label"
              label="Group By"
              disabled={!showFull(chartObj) || isDatasetNotSelected}
              itemGroups={itemGroups}
              values={R.pipe(
                R.props(['groupingId', 'groupingLevel']),
                R.map(R.defaultTo('')),
                R.apply(R.zip)
              )(chartObj)}
              maxGrouping={chartMaxGrouping[chartObj.chartType]}
              getLabel={getLabelFn(categories)}
              getSubLabel={getSubLabelFn(categories)}
              onAddGroup={handleAddGroup}
              onChangeGroupIndex={handleChangeGroupIndexFn}
              onDeleteGroup={handleDeleteGroupFn}
              onSelectGroup={handleSelectGroupFn}
            />
          </FormControl>
        </ChartDropdownWrapper>
      </Box>
    </Box>
  )
}

export default memo(GroupedOutputsToolbar)
