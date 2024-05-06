import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'

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
} from '../../../utils/enums'

import {
  Select,
  SelectAccordionList,
  SelectMulti,
  SelectMultiAccordion,
} from '../../compound'

import {
  withIndex,
  getCategoryItems,
  getLabelFn,
  getGroupLabelFn,
  getSubLabelFn,
  includesPath,
  mapIndexed,
  forceArray,
} from '../../../utils'

const GroupedOutputsToolbar = ({ chartObj, index }) => {
  const categories = useSelector(selectStatGroupings)
  const statisticTypes = useSelector(selectAllowedStats)
  const groupedOutputs = useSelector(selectGroupedOutputsData)
  const statNames = useSelector(selectGroupedOutputNames)
  const currentPage = useSelector(selectCurrentPage)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const getGroupsById = (groupedOutputDataId) =>
    R.pipe(R.path([groupedOutputDataId, 'groupLists']), R.keys)(groupedOutputs)

  // Determine which groups can be selected based on the chosen stat(s)
  const groupByOptions = R.ifElse(
    R.propSatisfies(
      R.either(R.is(String), R.both(R.is(Array), R.isNotEmpty)),
      'statId'
    ),
    R.pipe(
      R.prop('groupedOutputDataId'),
      forceArray,
      R.chain(getGroupsById),
      R.uniq
    ),
    // R.always([])
    // When no stat is selected, all available groups for each stat are shown
    R.always(R.keys(categories))
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
    const maxGrouping = chartMaxGrouping[obj.variant]
    if (maxGrouping == null) return obj

    return R.pipe(
      R.assoc('groupingId', R.slice(0, maxGrouping, obj.groupingId || [])),
      R.assoc('groupingLevel', R.slice(0, maxGrouping, obj.groupingLevel || []))
    )(obj)
  }

  const path = ['pages', 'data', currentPage, 'pageLayout', index]

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
      chartStatUses[chartObj.variant] !== chartStatUses[value]

    const toSingleStatFromTable =
      chartObj.variant === chartVariant.TABLE &&
      chartStatUses[value] == null &&
      chartObj.statId != null &&
      chartObj.statId.length === 1

    const toTableFromSingleStat =
      value === chartVariant.TABLE &&
      typeof chartObj.statId === 'string' &&
      chartObj.statId !== ''

    dispatch(
      mutateLocal({
        path,
        value: R.pipe(
          R.assoc('variant', value),
          R.cond([
            [
              R.always(toTableFromSingleStat),
              // Wrap them inside arrays
              R.pipe(
                R.over(R.lensProp('statId'), R.of(Array)),
                R.over(R.lensProp('groupedOutputDataId'), R.of(Array))
              ),
            ],
            [
              R.always(toSingleStatFromTable),
              // Unwrap them
              R.pipe(
                R.over(R.lensProp('statId'), R.head),
                R.over(R.lensProp('groupedOutputDataId'), R.head)
              ),
            ],
            [
              R.always(statUsesChanged),
              R.pipe(R.dissoc('statId'), R.dissoc('groupedOutputDataId')),
            ],
            [R.T, R.identity],
          ]),
          removeExtraLevels
        )(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }

  const handleSelectStatAggregation = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('statAggregation', value, chartObj),
      })
    )
  }

  return (
    <>
      <ChartDropdownWrapper>
        <Select
          value={R.propOr('', 'variant', chartObj)}
          optionsList={[
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
          ]}
          displayIcon
          onSelect={handleSelectChart}
        />
      </ChartDropdownWrapper>
      <ChartDropdownWrapper>
        <Select
          disabled={chartObj.variant === chartVariant.BOX_PLOT}
          value={R.propOr('', 'statAggregation', chartObj)}
          displayIcon
          optionsList={[
            {
              label: 'Sum',
              value: chartAggrFunc.SUM,
              iconName: 'md/MdFunctions',
            },
            {
              label: 'Mean',
              value: chartAggrFunc.MEAN,
              iconName: 'md/MdVerticalAlignCenter',
            },
            {
              label: 'Minimum',
              value: chartAggrFunc.MIN,
              iconName: 'md/MdVerticalAlignBottom',
            },
            {
              label: 'Maximum',
              value: chartAggrFunc.MAX,
              iconName: 'md/MdVerticalAlignTop',
            },
          ]}
          onSelect={handleSelectStatAggregation}
        />
      </ChartDropdownWrapper>
      <ChartDropdownWrapper>
        {R.has(R.prop('variant', chartObj), chartStatUses) ? (
          R.length(chartStatUses[chartObj.variant]) !== 0 ? (
            <SelectMultiAccordion
              itemGroups={{
                undefined: mapIndexed((_, idx) => ({
                  id: idx,
                  layoutDirection: 'vertical',
                  subItems: R.values(statNames),
                }))(chartStatUses[chartObj.variant]),
              }}
              values={R.zip(
                R.propOr([], 'groupedOutputDataId', chartObj),
                R.propOr([], 'statId', chartObj)
              )}
              header="Select Statistics"
              getLabel={(idx) => {
                const use = chartStatUses[chartObj.variant][idx]
                const currentStats = R.zip(
                  R.propOr([], 'groupedOutputDataId', chartObj),
                  R.propOr([], 'statId', chartObj)
                )
                return R.is(Array, currentStats) &&
                  R.has(idx, currentStats) &&
                  R.isNotNil(R.head(currentStats[idx]))
                  ? `${use}: ${getGroupLabelFn(
                      statisticTypes,
                      currentStats[idx]
                    )}`
                  : use
              }}
              getSubLabel={(_, stat) => getGroupLabelFn(statisticTypes, stat)}
              onSelect={(index, value) => {
                const newVal =
                  R.equals(R.path(['statId', index], chartObj), value[1]) &&
                  R.equals(
                    R.path(['groupedOutputDataId', index], chartObj),
                    value[0]
                  )
                    ? [undefined, undefined]
                    : value
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.pipe(
                      R.assocPath(['statId', index], newVal[1]),
                      R.assocPath(['groupedOutputDataId', index], newVal[0])
                    )(chartObj),
                  })
                )
              }}
            />
          ) : (
            <SelectMulti
              getLabel={getGroupLabelFn(statisticTypes)}
              value={R.zip(
                R.propOr([], 'groupedOutputDataId', chartObj),
                R.propOr([], 'statId', chartObj)
              )}
              header="Select Statistics"
              optionsList={R.values(statNames)}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.pipe(
                      R.assoc('statId', R.pluck(1, value)),
                      R.assoc('groupedOutputDataId', R.pluck(0, value))
                    )(chartObj),
                  })
                )
              }}
            />
          )
        ) : (
          <Select
            getLabel={getGroupLabelFn(statisticTypes)}
            value={
              R.propOr(false, 'statId', chartObj)
                ? [
                    R.propOr('', 'groupedOutputDataId', chartObj),
                    R.propOr('', 'statId', chartObj),
                  ]
                : ''
            }
            placeholder="Statistic"
            optionsList={R.values(statNames)}
            onSelect={(value) => {
              const newGroups = groupedOutputs[value[0]].groupLists
              const [grouping] = getGroupValues()
              const [grouping2] = getGroupValues(1)
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    // Clear group+level selections that are no longer
                    // available for the newly selected statistic
                    R.unless(
                      R.always(R.has(grouping)(newGroups)),
                      R.pipe(
                        R.assocPath(['groupingId', 0], null),
                        R.assocPath(['groupingLevel', 0], null)
                      )
                    ),
                    R.unless(
                      R.always(R.has(grouping2)(newGroups)),
                      R.pipe(
                        R.dissocPath(['groupingId', 1]),
                        R.dissocPath(['groupingLevel', 1])
                      )
                    ),
                    R.assoc('groupedOutputDataId', value[0]),
                    R.assoc('statId', value[1])
                  )(chartObj),
                })
              )
            }}
          />
        )}
      </ChartDropdownWrapper>

      <ChartDropdownWrapper sx={{ minWidth: '152px' }}>
        <SelectAccordionList
          {...{ itemGroups }}
          values={R.pipe(
            R.props(['groupingId', 'groupingLevel']),
            R.map(R.defaultTo('')),
            R.apply(R.zip)
          )(chartObj)}
          placeholder="Group By"
          maxGrouping={chartMaxGrouping[chartObj.variant]}
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onAddGroup={handleAddGroup}
          onChangeGroupIndex={handleChangeGroupIndexFn}
          onDeleteGroup={handleDeleteGroupFn}
          onSelectGroup={handleSelectGroupFn}
        />
      </ChartDropdownWrapper>
    </>
  )
}

export default memo(GroupedOutputsToolbar)
