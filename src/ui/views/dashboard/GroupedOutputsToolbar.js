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
import { chartMaxGrouping, chartStatUses } from '../../../utils/enums'

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
    R.has('statistic')(chartObj) &&
    R.pathSatisfies(R.is(String), ['statistic', 0], chartObj)
      ? R.pipe(
          R.path([R.prop('statistic', chartObj)[0], 'groupLists']),
          R.keys
        )(groupedOutputs)
      : R.keys(categories)

  const groupableCategories = R.isNil(groupByOptions)
    ? categories
    : R.pick(groupByOptions, categories)

  const sortedLevelsByCategory =
    R.mapObjIndexed(getCategoryItems)(groupableCategories)
  const itemGroups = R.pipe(
    R.pick(R.keys(sortedLevelsByCategory)), // Drop any category not included in `nestedStructure`
    withIndex,
    R.project(['id', 'grouping', 'layoutDirection']),
    R.map((item) => R.assoc('subItems', sortedLevelsByCategory[item.id])(item)),
    R.groupBy(R.prop('grouping'))
  )(categories)
  const removeExtraLevels = (obj) =>
    R.isNotNil(chartMaxGrouping[obj.chart])
      ? R.pipe(
          R.assoc(
            'level',
            R.slice(0, chartMaxGrouping[obj.chart], obj.level || [])
          ),
          R.assoc(
            'category',
            R.slice(0, chartMaxGrouping[obj.chart], obj.category || [])
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
            R.assocPath(['category', n], item),
            R.assocPath(['level', n], subItem)
          )(chartObj),
        })
      )
    }
  const getGroupValues = (n = 0) =>
    R.pipe(
      R.props(['category', 'level']),
      R.pluck(n),
      R.when(R.any(R.isNil), R.always(''))
    )(chartObj)

  const handleSelectChart = (value) => {
    dispatch(
      mutateLocal({
        sync: !includesPath(R.values(sync), path),
        path,
        value: R.pipe(
          R.assoc('chart', value),
          R.dissoc('statistic'),
          removeExtraLevels
        )(chartObj),
      })
    )
  }

  const handleSelectGrouping = (value) => {
    dispatch(
      mutateLocal({
        path,
        sync: !includesPath(R.values(sync), path),
        value: R.assoc('grouping', value, chartObj),
      })
    )
  }
  return (
    <>
      <ChartDropdownWrapper>
        <Select
          value={R.propOr('', 'chart', chartObj)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconName: 'md/MdBarChart',
            },
            {
              label: 'Stacked Bar',
              value: 'Stacked Bar',
              iconName: 'md/MdStackedBarChart',
            },
            {
              label: 'Line',
              value: 'Line',
              iconName: 'md/MdShowChart',
            },
            {
              label: 'Cumulative Line',
              value: 'Cumulative Line',
              iconName: 'md/MdStackedLineChart',
            },
            {
              label: 'Area',
              value: 'Area',
              iconName: 'tb/TbChartAreaLineFilled',
            },
            {
              label: 'Stacked Area',
              value: 'Stacked Area',
              iconName: 'md/MdAreaChart',
            },
            {
              label: 'Waterfall',
              value: 'Waterfall',
              iconName: 'md/MdWaterfallChart',
            },
            {
              label: 'Stacked Waterfall',
              value: 'Stacked Waterfall',
              iconName: 'tb/TbStack2',
            },
            {
              label: 'Box Plot',
              value: 'Box Plot',
              iconName: 'md/MdGraphicEq',
            },
            {
              label: 'Table',
              value: 'Table',
              iconName: 'md/MdTableChart',
            },
            {
              label: 'Sunburst',
              value: 'Sunburst',
              iconName: 'md/MdDonutLarge',
            },
            {
              label: 'Treemap',
              value: 'Treemap',
              iconName: 'tb/TbChartTreemap',
            },
            {
              label: 'Gauge',
              value: 'Gauge',
              iconName: 'tb/TbGauge',
            },
            {
              label: 'Heatmap',
              value: 'Heatmap',
              iconName: 'tb/TbLayoutDashboard',
            },
            {
              label: 'Scatter',
              value: 'Scatter',
              iconName: 'md/MdScatterPlot',
            },
            {
              label: 'Bubble',
              value: 'Bubble',
              iconName: 'md/MdBubbleChart',
            },
          ]}
          displayIcon
          onSelect={handleSelectChart}
        />
      </ChartDropdownWrapper>
      <ChartDropdownWrapper>
        <Select
          disabled={chartObj.chart === 'Box Plot'}
          value={R.propOr('', 'grouping', chartObj)}
          displayIcon
          optionsList={[
            {
              label: 'Sum',
              value: 'Sum',
              iconName: 'md/MdFunctions',
            },
            {
              label: 'Average',
              value: 'Average',
              iconName: 'md/MdVerticalAlignCenter',
            },
            {
              label: 'Minimum',
              value: 'Minimum',
              iconName: 'md/MdVerticalAlignBottom',
            },
            {
              label: 'Maximum',
              value: 'Maximum',
              iconName: 'md/MdVerticalAlignTop',
            },
          ]}
          onSelect={handleSelectGrouping}
        />
      </ChartDropdownWrapper>
      <ChartDropdownWrapper>
        {R.has(R.prop('chart', chartObj), chartStatUses) ? (
          R.length(chartStatUses[chartObj.chart]) !== 0 ? (
            <SelectMultiAccordion
              itemGroups={{
                undefined: R.addIndex(R.map)((_, idx) => ({
                  id: idx,
                  layoutDirection: 'vertical',
                  subItems: R.values(statNames),
                }))(chartStatUses[chartObj.chart]),
              }}
              values={R.propOr([], 'statistic', chartObj)}
              header="Select Statistics"
              getLabel={(idx) => {
                const use = chartStatUses[chartObj.chart][idx]
                const currentStats = R.propOr([], 'statistic', chartObj)
                return R.is(Array, currentStats) && R.has(idx, currentStats)
                  ? `${use}: ${getGroupLabelFn(
                      statisticTypes,
                      currentStats[idx]
                    )}`
                  : use
              }}
              getSubLabel={(_, stat) => getGroupLabelFn(statisticTypes, stat)}
              onSelect={(index, value) => {
                const newVal = R.equals(
                  R.path(['statistic', index], chartObj),
                  value
                )
                  ? undefined
                  : value
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assocPath(['statistic', index], newVal, chartObj),
                  })
                )
              }}
            />
          ) : (
            <SelectMulti
              getLabel={getGroupLabelFn(statisticTypes)}
              value={R.propOr([], 'statistic', chartObj)}
              header="Select Statistics"
              optionsList={R.values(statNames)}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assoc('statistic', value, chartObj),
                  })
                )
              }}
            />
          )
        ) : (
          <Select
            getLabel={getGroupLabelFn(statisticTypes)}
            value={R.propOr('', 'statistic', chartObj)}
            placeholder="Statistic"
            optionsList={R.values(statNames)}
            onSelect={(value) => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.assoc('statistic', value),
                    R.dissoc('level'),
                    R.dissoc('category')
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

      {chartMaxGrouping[chartObj.chart] === 2 ? (
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
                const [category, level] = getGroupValues()
                const [category2, level2] = getGroupValues(1)
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.pipe(
                      R.assocPath(['category', 0], category2),
                      R.assocPath(['level', 0], level2),
                      R.assocPath(['category', 1], category),
                      R.assocPath(['level', 1], level)
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
            clearable={R.hasPath(['level', 1], chartObj)}
            onClear={() => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.dissocPath(['category', 1]),
                    R.dissocPath(['level', 1])
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
