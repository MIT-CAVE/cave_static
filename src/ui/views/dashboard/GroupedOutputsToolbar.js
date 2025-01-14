import {
  Box,
  Divider,
  FormControl,
  Grid2 as Grid,
  InputLabel,
  Stack,
  Typography,
  IconButton,
} from '@mui/material'
import * as R from 'ramda'
import { memo, Fragment } from 'react'
import { MdClose } from 'react-icons/md'
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
  chartMaxGrouping,
  chartStatUses,
  chartVariant,
  distributionTypes,
  distributionYAxes,
  distributionVariants,
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
    justifyContent: 'flex-start',
    overflow: 'auto',
    gap: 2,
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
  labelled: {
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    marginLeft: 1,
  },
}

const CHART_OPTIONS = [
  {
    label: 'Bar',
    value: chartVariant.BAR,
    iconName: 'md/MdBarChart',
  },
  {
    label: 'Stacked Bar',
    value: chartVariant.STACKED_BAR,
    iconName: 'md/MdStackedBarChart',
  },
  {
    label: 'Line',
    value: chartVariant.LINE,
    iconName: 'md/MdShowChart',
  },
  {
    label: 'Cumulative Line',
    value: chartVariant.CUMULATIVE_LINE,
    iconName: 'md/MdStackedLineChart',
  },
  {
    label: 'Area',
    value: chartVariant.AREA,
    iconName: 'tb/TbChartAreaLineFilled',
  },
  {
    label: 'Stacked Area',
    value: chartVariant.STACKED_AREA,
    iconName: 'md/MdAreaChart',
  },
  {
    label: 'Waterfall',
    value: chartVariant.WATERFALL,
    iconName: 'md/MdWaterfallChart',
  },
  {
    label: 'Stacked Waterfall',
    value: chartVariant.STACKED_WATERFALL,
    iconName: 'tb/TbStack2',
  },
  {
    label: 'Box Plot',
    value: chartVariant.BOX_PLOT,
    iconName: 'md/MdGraphicEq',
  },
  {
    label: 'Table',
    value: chartVariant.TABLE,
    iconName: 'md/MdTableChart',
  },
  {
    label: 'Sunburst',
    value: chartVariant.SUNBURST,
    iconName: 'md/MdDonutLarge',
  },
  {
    label: 'Treemap',
    value: chartVariant.TREEMAP,
    iconName: 'tb/TbChartTreemap',
  },
  {
    label: 'Gauge',
    value: chartVariant.GAUGE,
    iconName: 'tb/TbGauge',
  },
  {
    label: 'Heatmap',
    value: chartVariant.HEATMAP,
    iconName: 'tb/TbLayoutDashboard',
  },
  {
    label: 'Scatter',
    value: chartVariant.SCATTER,
    iconName: 'md/MdScatterPlot',
  },
  {
    label: 'Distribution',
    value: chartVariant.DISTRIBUTION,
    iconName: 'md/MdBarChart',
  },
  {
    label: 'Mixed',
    value: chartVariant.MIXED,
    iconName: 'tb/TbChartHistogram',
  },
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

const GroupedOutputsToolbar = ({ chartObj, index }) => {
  const categories = useSelector(selectStatGroupings)
  const statisticTypes = useSelector(selectAllowedStats)
  const groupedOutputs = useSelector(selectGroupedOutputsData)
  const statNamesByDataset = useSelector(selectGroupedOutputNames)
  const currentPage = useSelector(selectCurrentPage)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
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
  const statNames = R.propOr({}, chartObj.dataset, statNamesByDataset)

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

  const sortedLevelsByCategory =
    R.mapObjIndexed(getCategoryItems)(groupableCategories)
  const itemGroups = R.pipe(
    R.pick(R.keys(sortedLevelsByCategory)), // Drop any category not included in `levels`
    withIndex,
    R.project(['id', 'grouping', 'layoutDirection']),
    R.map((item) => R.assoc('subItems', sortedLevelsByCategory[item.id])(item)),
    R.groupBy(R.prop('grouping'))
  )(categories)

  const removeExtraLevels = (obj) => {
    const maxGrouping = chartMaxGrouping[obj.chartType]
    if (maxGrouping == null) return obj

    return R.pipe(
      R.assoc('groupingId', R.slice(0, maxGrouping, obj.groupingId || [])),
      R.assoc('groupingLevel', R.slice(0, maxGrouping, obj.groupingLevel || []))
    )(obj)
  }

  const path = ['pages', 'data', currentPage, 'charts', index]

  const handleAddGroup = () => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.evolve({
          groupingId: R.append(null),
          groupingLevel: R.append(null),
        })(chartObj),
      })
    )
  }
  const handleDeleteGroupFn = (n = 0) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.pipe(
          R.dissocPath(['groupingId', n]),
          R.dissocPath(['groupingLevel', n])
        )(chartObj),
      })
    )
  }
  const handleChangeGroupIndexFn = (prevN, n) => {
    const [grouping, level] = getGroupValues(prevN)
    const [grouping2, level2] = getGroupValues(n)
    dispatch(
      mutateLocal({
        path,
        value: R.pipe(
          R.assocPath(['groupingId', prevN], grouping2),
          R.assocPath(['groupingLevel', prevN], level2),
          R.assocPath(['groupingId', n], grouping),
          R.assocPath(['groupingLevel', n], level)
        )(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }
  const handleSelectGroupFn =
    (n = 0) =>
    (item, subItem) => {
      dispatch(
        mutateLocal({
          path,
          sync: !includesPath(R.values(sync), path),
          value: R.pipe(
            R.assocPath(['groupingId', n], item),
            R.assocPath(['groupingLevel', n], subItem)
          )(chartObj),
        })
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

    dispatch(
      mutateLocal({
        path,
        value: R.pipe(
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
        )(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }

  const handleSelectDistributionType = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('distributionType', value, chartObj),
      })
    )
  }

  const handleSelectYAxis = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('distributionYAxis', value, chartObj),
      })
    )
  }

  const handleSelectDistributionVariant = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('distributionVariant', value, chartObj),
      })
    )
  }

  const handleChangeDataset = (value) => {
    dispatch(
      mutateLocal({
        path,
        value: R.pipe(
          R.assoc('dataset', value),
          R.dissoc('stats'),
          R.assoc('groupingId', []),
          R.assoc('groupingLevel', [])
        )(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }

  const renderLabelledSelector = (child, label, extraKey = '') => {
    return (
      <FormControl sx={styles.labelled} key={`${label}${extraKey}`}>
        <InputLabel id={extraKey}>{label}</InputLabel>
        {child}
      </FormControl>
    )
  }

  const datasetSelector = (
    <FormControl fullWidth>
      <InputLabel id="dataset-label">Dataset</InputLabel>
      <Select
        id="dataset"
        labelId="dataset-label"
        label="Dataset"
        value={R.propOr(' ', 'dataset', chartObj)}
        optionsList={R.keys(groupedOutputs)}
        getLabel={getLabelFn(groupedOutputs)}
        onSelect={handleChangeDataset}
      />
    </FormControl>
  )

  const singleStatisticSelector = (
    <Select
      fullWidth
      disabled={chartObj.dataset == null}
      id="stat"
      value={R.pathOr(' ', ['stats', 0, 'statId'], chartObj)}
      optionsList={R.values(statNames)}
      getLabel={(stat) =>
        getGroupLabelFn(statisticTypes, [chartObj.dataset, stat])
      }
      onSelect={(value) => {
        dispatch(
          mutateLocal({
            path,
            sync: !includesPath(R.values(sync), path),
            value: R.assoc('stats', [
              { statId: value, aggregationType: 'sum' },
            ])(chartObj),
          })
        )
      }}
    />
  )

  const distributionTypeSelector = (
    <Select
      sx={{ height: '100%' }}
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

  const distributionYAxisSelector = (
    <Select
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

  const StatSelectors = R.flatten([
    R.has(R.prop('chartType', chartObj), chartStatUses)
      ? R.length(chartStatUses[chartObj.chartType]) !== 0
        ? mapIndexed((_, index) => {
            const label = chartStatUses[chartObj.chartType][index]
            return (
              <FormControl key={index} fullWidth>
                <InputLabel id={`stat-${label}-label`}>{label}</InputLabel>
                <Select
                  labelId={`stat-${label}-label`}
                  label={label}
                  disabled={chartObj.dataset == null}
                  getLabel={(stat) =>
                    getGroupLabelFn(statisticTypes, [chartObj.dataset, stat])
                  }
                  value={R.pathOr(' ', ['stats', index, 'statId'], chartObj)}
                  optionsList={R.values(statNames)}
                  onSelect={(value) => {
                    const newVal = R.equals(
                      R.path(['stats', index, 'statId'], chartObj),
                      value
                    )
                      ? undefined
                      : value
                    dispatch(
                      mutateLocal({
                        path,
                        sync: !includesPath(R.values(sync), path),
                        value: R.assocPath(['stats', index], {
                          statId: newVal,
                          aggregationType: 'sum',
                        })(chartObj),
                      })
                    )
                  }}
                />
              </FormControl>
            )
          })(chartStatUses[chartObj.chartType])
        : (() => {
            const currentStats = R.pipe(
              R.propOr([], 'stats'),
              R.pluck('statId')
            )(chartObj)

            // Get all unused options
            const unusedOptions = R.pipe(
              R.values,
              R.filter((option) => !currentStats.includes(option))
            )(statNames)

            // Determine whether to show an extra dropdown
            const statsToShow = [
              ...currentStats,
              ...(unusedOptions.length > 0 ? [null] : []),
            ]

            return mapIndexed((statId, index) => {
              // Filter out already selected options, except for the current value
              const availableOptions = R.values(statNames).filter(
                (option) => !currentStats.includes(option) || option === statId
              )

              const handleRemove = () => {
                const currentStats = R.propOr([], 'stats', chartObj)
                const newStats = R.remove(index, 1, currentStats)
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assoc('stats', newStats, chartObj),
                  })
                )
              }

              return (
                <Stack
                  key={index}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <Select
                    fullWidth
                    disabled={chartObj.dataset == null}
                    getLabel={(stat) =>
                      getGroupLabelFn(statisticTypes, [chartObj.dataset, stat])
                    }
                    value={statId || ' '}
                    optionsList={availableOptions}
                    onSelect={(value) => {
                      const currentStats = R.propOr([], 'stats', chartObj)
                      let newStats

                      if (value === undefined) {
                        // Remove the stat at this index
                        newStats = R.remove(index, 1, currentStats)
                      } else if (statId === null) {
                        // Add new stat
                        newStats = [
                          ...currentStats,
                          {
                            statId: value,
                            aggregationType: 'sum',
                          },
                        ]
                      } else {
                        // Update existing stat
                        newStats = R.update(
                          index,
                          {
                            statId: value,
                            aggregationType: 'sum',
                          },
                          currentStats
                        )
                      }

                      dispatch(
                        mutateLocal({
                          path,
                          sync: !includesPath(R.values(sync), path),
                          value: R.assoc('stats', newStats, chartObj),
                        })
                      )
                    }}
                  />
                  {currentStats.length > 1 && statId !== null && (
                    <IconButton
                      size="small"
                      onClick={handleRemove}
                      sx={{ marginTop: 1 }}
                    >
                      <MdClose />
                    </IconButton>
                  )}
                </Stack>
              )
            }, statsToShow)
          })()
      : singleStatisticSelector,
  ])

  const AggregationSelector = mapIndexed(
    (_, index) => (
      <Select
        key={index}
        fullWidth
        getLabel={(item) => capitalize(item)}
        value={R.pathOr('', ['stats', index, 'aggregationType'], chartObj)}
        optionsList={[
          chartAggrFunc.SUM,
          chartAggrFunc.MEAN,
          chartAggrFunc.MIN,
          chartAggrFunc.MAX,
          chartAggrFunc.DIVISOR,
        ]}
        onSelect={(value) => {
          dispatch(
            mutateLocal({
              path,
              sync: !includesPath(R.values(sync), path),
              value: R.pipe(
                R.assocPath(['stats', index, 'aggregationType'], value),
                R.dissocPath(['stats', index, 'statIdDivisor']),
                R.dissocPath(['stats', index, 'aggregationGroupingId']),
                R.dissocPath(['stats', index, 'aggregationGroupingLevel'])
              )(chartObj),
            })
          )
        }}
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
          disabled={chartObj.dataset == null}
          id={`divide-${statName}`}
          value={R.pathOr(' ', ['stats', index, 'statIdDivisor'], chartObj)}
          optionsList={R.values(statNames)}
          getLabel={(stat) =>
            getGroupLabelFn(statisticTypes, [chartObj.dataset, stat])
          }
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assocPath(
                  ['stats', index, 'statIdDivisor'],
                  value
                )(chartObj),
              })
            )
          }}
        />
      ) : (
        <SelectAccordion
          key={index}
          fullWidth
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
          onSelect={(item, value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.pipe(
                  R.assocPath(['stats', index, 'aggregationGroupingId'], item),
                  R.assocPath(
                    ['stats', index, 'aggregationGroupingLevel'],
                    value
                  )
                )(chartObj),
              })
            )
          }}
        />
      )
    },
    R.propOr([], 'stats', chartObj)
  )

  const DistributionVariantSelector = [
    <Select
      fullWidth
      disabled={!showFull(chartObj)}
      value={distributionVariant}
      optionsList={[
        {
          label: 'Bar',
          value: distributionVariants.BAR,
          iconName: 'md/MdBarChart',
        },
        {
          label: 'Line',
          value: distributionVariants.LINE,
          iconName: 'md/MdShowChart',
        },
      ]}
      onSelect={handleSelectDistributionVariant}
    />,
  ]

  const MixedVariantSelector = R.map(
    (variant) => (
      <Select
        key={variant}
        fullWidth
        disabled={!showFull(chartObj)}
        getLabel={(item) =>
          item === 'cumulative_line' ? 'Cumulative Line' : capitalize(item)
        }
        value={R.propOr('line', `${variant}Variant`, chartObj)}
        optionsList={['bar', 'line', 'cumulative_line']}
        onSelect={(value) => {
          dispatch(
            mutateLocal({
              path,
              sync: !includesPath(R.values(sync), path),
              value: R.assoc(
                `${variant}Variant`,
                value === 'Cumulative Line'
                  ? 'cumulative_line'
                  : value.toLowerCase(),
                chartObj
              ),
            })
          )
        }}
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
            <>{datasetSelector}</>
          </ChartDropdownWrapper>
        </Box>
      </Stack>

      <ChartDropdownWrapper
        sx={[styles.field, { flexDirection: 'column', flexGrow: 0, gap: 1 }]}
      >
        <>
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
                  <Grid item xs={4} size={1}>
                    {statSelector}
                  </Grid>
                  {VariantSelector && (
                    <Grid item xs={4} size={1}>
                      {R.prop(index, VariantSelector)}
                    </Grid>
                  )}
                  <Grid item xs={4} size={1}>
                    {R.prop(index, AggregationSelector)}
                  </Grid>
                  <Grid item xs={4} size={1}>
                    {R.prop(index, AggregationBySelector)}
                  </Grid>
                </Fragment>
              )
            }, StatSelectors)}
          </Grid>
        </>
      </ChartDropdownWrapper>

      {showFull(chartObj) &&
        chartObj.chartType === chartVariant.DISTRIBUTION && (
          <>
            <Typography variant="overline" sx={styles.header}>
              DISTRIBUTION
            </Typography>
            <Box sx={styles.row}>
              <ChartDropdownWrapper sx={styles.field}>
                <>
                  {R.map(
                    ({ selector, label }) =>
                      renderLabelledSelector(selector, label),
                    [
                      {
                        selector: distributionTypeSelector,
                        label: 'Type',
                      },
                      {
                        selector: distributionYAxisSelector,
                        label: 'Y Axis',
                      },
                    ]
                  )}
                </>
              </ChartDropdownWrapper>
            </Box>
          </>
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
              disabled={!showFull(chartObj) || chartObj.dataset == null}
              {...{ itemGroups }}
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
