import { IconButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { MdSwapHoriz } from 'react-icons/md'
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
  SelectAccordion,
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
} from '../../../utils'

const SwapButton = (props) => (
  <IconButton sx={{ mx: 'auto' }} {...props}>
    <MdSwapHoriz fontSize="22px" />
  </IconButton>
)

const GroupedOutputsToolbar = ({ chartObj, index }) => {
  const categories = useSelector(selectStatGroupings)
  const statisticTypes = useSelector(selectAllowedStats)
  const groupedOutputs = useSelector(selectGroupedOutputsData)
  const statNames = useSelector(selectGroupedOutputNames)
  const currentPage = useSelector(selectCurrentPage)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()
  const groupByOptions =
    R.has('statId')(chartObj) &&
    R.propSatisfies(R.is(String), 'statId', chartObj)
      ? R.pipe(
          R.path([R.prop('groupedOutputDataId', chartObj), 'groupLists']),
          R.keys
        )(groupedOutputs)
      : R.keys(categories)
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
  const removeExtraLevels = (obj) =>
    R.isNotNil(chartMaxGrouping[obj.variant])
      ? R.pipe(
          R.assoc(
            'groupingLevel',
            R.slice(0, chartMaxGrouping[obj.variant], obj.groupingLevel || [])
          ),
          R.assoc(
            'groupingId',
            R.slice(0, chartMaxGrouping[obj.variant], obj.groupingId || [])
          )
        )(obj)
      : obj
  const path = ['pages', 'data', currentPage, 'pageLayout', index]
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
    dispatch(
      mutateLocal({
        sync: !includesPath(R.values(sync), path),
        path,
        value: R.pipe(
          R.assoc('variant', value),
          R.dissoc('statId'),
          R.dissoc('groupedOutputDataId'),
          removeExtraLevels
        )(chartObj),
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
            {
              label: 'Bubble',
              value: chartVariant.BUBBLE,
              iconName: 'md/MdBubbleChart',
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
                undefined: R.addIndex(R.map)((_, idx) => ({
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
                return R.is(Array, currentStats) && R.has(idx, currentStats)
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
                console.log(value)
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
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.assoc('statId', value[1]),
                    R.assoc('groupedOutputDataId', value[0]),
                    R.dissoc('groupingLevel'),
                    R.dissoc('groupingId')
                  )(chartObj),
                })
              )
            }}
          />
        )}
      </ChartDropdownWrapper>
      <ChartDropdownWrapper>
        <SelectAccordion
          {...{ itemGroups }}
          values={getGroupValues()}
          placeholder="Group By"
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onSelect={handleSelectGroupFn()}
        />
      </ChartDropdownWrapper>

      {chartMaxGrouping[chartObj.variant] === 2 ? (
        <>
          <ChartDropdownWrapper
            elevation={6}
            sx={{
              minWidth: '35px',
              height: '40%',
              my: 'auto',
              borderRadius: '40%',
            }}
          >
            <SwapButton
              onClick={() => {
                const [grouping, level] = getGroupValues()
                const [grouping2, level2] = getGroupValues(1)
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.pipe(
                      R.assocPath(['groupingId', 0], grouping2),
                      R.assocPath(['groupingLevel', 0], level2),
                      R.assocPath(['groupingId', 1], grouping),
                      R.assocPath(['groupingLevel', 1], level)
                    )(chartObj),
                  })
                )
              }}
            />
          </ChartDropdownWrapper>
          <ChartDropdownWrapper
            menuProps={{
              transformOrigin: { horizontal: 'right', vertical: 'top' },
              anchorOrigin: { horizontal: 'right', vertical: 'bottom' },
            }}
            clearable={R.hasPath(['groupingLevel', 1], chartObj)}
            onClear={() => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.dissocPath(['groupingId', 1]),
                    R.dissocPath(['groupingLevel', 1])
                  )(chartObj),
                })
              )
            }}
          >
            <SelectAccordion
              {...{ itemGroups }}
              values={getGroupValues(1)}
              placeholder="Sub Group"
              getLabel={getLabelFn(categories)}
              getSubLabel={getSubLabelFn(categories)}
              onSelect={handleSelectGroupFn(1)}
            />
          </ChartDropdownWrapper>
        </>
      ) : (
        []
      )}
    </>
  )
}

export default memo(GroupedOutputsToolbar)
