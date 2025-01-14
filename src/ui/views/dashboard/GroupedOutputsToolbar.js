import {
  Box,
  FormControl,
  InputLabel,
  Stack,
  Typography,
  IconButton,
} from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
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
    width: '99%',
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
    <FormControl fullWidth>
      <InputLabel id="stat-label">Statistic</InputLabel>
      <Select
        disabled={chartObj.dataset == null}
        id="stat"
        labelId="stat-label"
        label="Statistic"
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
    </FormControl>
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

  const distributionVariantSelector = (
    <Select
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
                  <FormControl fullWidth>
                    <InputLabel id={`stat-${index}-label`}>
                      Statistic
                    </InputLabel>
                    <Select
                      labelId={`stat-${index}-label`}
                      label="Statistic"
                      disabled={chartObj.dataset == null}
                      getLabel={(stat) =>
                        getGroupLabelFn(statisticTypes, [
                          chartObj.dataset,
                          stat,
                        ])
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
                  </FormControl>
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

  const AggregationSelector = mapIndexed((_, index) => {
    const statName = getGroupLabelFn(statisticTypes, [
      chartObj.dataset,
      R.pathOr('', ['stats', index, 'statId'], chartObj),
    ])
    const label = `${statName} Aggregation`
    const selector = (
      <Select
        label={label}
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
        sx={{ width: '100%' }}
      />
    )

    return renderLabelledSelector(selector, label, index)
  })(R.propOr([], 'stats', chartObj))

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
      const label = `${statAggregation === chartAggrFunc.DIVISOR ? 'Divide' : 'Aggregate'} ${statName} By`
      const selector =
        statAggregation === chartAggrFunc.DIVISOR ? (
          <Select
            label={label}
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
            label={label}
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
            header={`Aggregate By`}
            getLabel={getLabelFn(categories)}
            getSubLabel={getSubLabelFn(categories)}
            onSelect={(item, value) => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.assocPath(
                      ['stats', index, 'aggregationGroupingId'],
                      item
                    ),
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

      return renderLabelledSelector(selector, label, index)
    },
    R.propOr([], 'stats', chartObj)
  )

  return (
    <Box sx={styles.content}>
      <ChartTypeSelector
        value={chartObj.chartType}
        onChange={handleSelectChart}
        chartOptions={CHART_OPTIONS}
      />

      <Typography variant="overline" sx={styles.header}>
        DATASET SELECTION
      </Typography>
      <Stack direction="row">
        <Box sx={styles.row}>
          <ChartDropdownWrapper sx={styles.field}>
            <>{datasetSelector}</>
          </ChartDropdownWrapper>
        </Box>
      </Stack>

      <Typography variant="overline" sx={styles.header}>
        AGGREGATION
      </Typography>
      <ChartDropdownWrapper
        sx={[styles.field, { flexDirection: 'column', flexGrow: 0 }]}
      >
        <>
          {mapIndexed((statSelector, index) => {
            return (
              <Stack
                key={index}
                direction="row"
                spacing={2}
                sx={{ width: '100%' }}
              >
                {statSelector && <Box sx={{ flex: 1 }}>{statSelector}</Box>}
                <Box sx={{ flex: 1 }}>{R.prop(index, AggregationSelector)}</Box>
                <Box sx={{ flex: 1 }}>
                  {R.prop(index, AggregationBySelector)}
                </Box>
              </Stack>
            )
          }, StatSelectors)}
        </>
      </ChartDropdownWrapper>

      {showFull(chartObj) && (
        <>
          {chartObj.chartType === chartVariant.MIXED && (
            <>
              <Typography variant="overline" sx={styles.header}>
                CHART TYPES
              </Typography>
              <Box sx={styles.row}>
                <ChartDropdownWrapper sx={styles.field}>
                  <>
                    {R.map((variant) => {
                      const selector = (
                        <Select
                          getLabel={(item) =>
                            item === 'cumulative_line'
                              ? 'Cumulative Line'
                              : capitalize(item)
                          }
                          value={R.propOr(
                            'line',
                            `${variant}Variant`,
                            chartObj
                          )}
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
                      )
                      const label = `${capitalize(variant)}`
                      return renderLabelledSelector(selector, label)
                    })(['left', 'right'])}
                  </>
                </ChartDropdownWrapper>
              </Box>
            </>
          )}

          <Typography variant="overline" sx={styles.header}>
            GROUP BY
          </Typography>
          <Box sx={styles.row}>
            <ChartDropdownWrapper sx={styles.field}>
              <SelectAccordionList
                disabled={chartObj.dataset == null}
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
            </ChartDropdownWrapper>
          </Box>

          {chartObj.chartType === chartVariant.DISTRIBUTION && (
            <>
              <Typography variant="overline" sx={styles.header}>
                DISTRIBUTION
              </Typography>
              <Box sx={styles.row}>
                <ChartDropdownWrapper sx={styles.field}>
                  <>
                    {R.map(({ selector, label }) =>
                      renderLabelledSelector(selector, label)
                    )([
                      {
                        selector: distributionTypeSelector,
                        label: 'Type',
                      },
                      {
                        selector: distributionYAxisSelector,
                        label: 'Y Axis',
                      },
                      {
                        selector: distributionVariantSelector,
                        label: 'Variant',
                      },
                    ])}
                  </>
                </ChartDropdownWrapper>
              </Box>
            </>
          )}
        </>
      )}
      <Typography variant="overline" />
    </Box>
  )
}

export default memo(GroupedOutputsToolbar)
