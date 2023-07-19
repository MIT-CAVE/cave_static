import { Box, Button, IconButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectCategoriesData,
  selectSync,
  selectAppBarId,
  selectAllowedStats,
} from '../../../data/selectors'
import { chartMaxGrouping, chartStatLimits } from '../../../utils/enums'

import {
  FetchedIcon,
  HeaderSelectWrapper,
  Select,
  SelectAccordion,
  SelectMulti,
} from '../../compound'

import {
  customSort,
  getCategoryItems,
  getLabelFn,
  getSubLabelFn,
  includesPath,
  renameKeys,
} from '../../../utils'

const SwapButton = ({ onClick }) => (
  <IconButton sx={{ mx: 'auto' }} color="primary" {...{ onClick }}>
    <FetchedIcon iconName="MdSwapHoriz" size={22} />
  </IconButton>
)

const StatisticsHeader = memo(({ obj, index }) => {
  const categories = useSelector(selectCategoriesData)
  const statisticTypes = useSelector(selectAllowedStats)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const groupByOptions =
    R.has('statistic')(obj) && R.propIs(String, 'statistic', obj)
      ? R.path([R.prop('statistic', obj), 'groupByOptions'], statisticTypes)
      : R.keys(categories)
  const groupableCategories = R.isNil(groupByOptions)
    ? categories
    : R.pick(groupByOptions, categories)
  const sortedStatistics = customSort(statisticTypes)

  const sortedLevelsByCategory =
    R.mapObjIndexed(getCategoryItems)(groupableCategories)
  const itemGroups = R.pipe(
    R.pick(R.keys(sortedLevelsByCategory)), // Drop any category not included in `nestedStructure`
    customSort,
    R.project(['id', 'grouping', 'layoutDirection']),
    R.map((item) => R.assoc('subItems', sortedLevelsByCategory[item.id])(item)),
    R.groupBy(R.prop('grouping'))
  )(categories)

  const removeExtraLevels = (obj) =>
    chartMaxGrouping[obj.chart] === 1
      ? R.pipe(R.dissoc('level2'), R.dissoc('category2'))(obj)
      : obj

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]
  const onSelectGroupFn =
    (n = '') =>
    (item, subItem) => {
      dispatch(
        mutateLocal({
          path,
          sync: !includesPath(R.values(sync), path),
          value: R.pipe(
            R.assoc(`category${n}`, item),
            R.assoc(`level${n}`, subItem)
          )(obj),
        })
      )
    }
  const getGroupValues = (n = '') =>
    R.pipe(
      R.props([`category${n}`, `level${n}`]),
      R.when(R.any(R.isNil), R.always(''))
    )(obj)

  return (
    <>
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('', 'chart', obj)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconName: 'MdBarChart',
            },
            {
              label: 'Stacked Bar',
              value: 'Stacked Bar',
              iconName: 'MdStackedBarChart',
            },
            {
              label: 'Line',
              value: 'Line',
              iconName: 'MdShowChart',
            },
            {
              label: 'Cumulative Line',
              value: 'Cumulative Line',
              iconName: 'MdStackedLineChart',
            },
            {
              label: 'Stacked Area',
              value: 'Stacked Area',
              iconName: 'TbChartAreaLineFilled',
            },
            {
              label: 'Waterfall',
              value: 'Waterfall',
              iconName: 'MdWaterfallChart',
            },
            {
              label: 'Stacked Waterfall',
              value: 'Stacked Waterfall',
              iconName: 'TbStack2',
            },
            {
              label: 'Box Plot',
              value: 'Box Plot',
              iconName: 'MdGraphicEq',
            },
            {
              label: 'Table',
              value: 'Table',
              iconName: 'MdTableChart',
            },
            {
              label: 'Sunburst (beta)',
              value: 'Sunburst',
              iconName: 'MdDonutLarge',
            },
            {
              label: 'Treemap (beta)',
              value: 'Treemap',
              iconName: 'TbChartTreemap',
            },
            {
              label: 'Gauge',
              value: 'Gauge',
              iconName: 'TbGauge',
            },
            {
              label: 'Heatmap',
              value: 'Heatmap',
              iconName: 'TbLayoutDashboard',
            },
            {
              label: 'Scatter',
              value: 'Scatter',
              iconName: 'MdScatterPlot',
            },
            {
              label: 'Bubble',
              value: 'Bubble',
              iconName: 'MdBubbleChart',
            },
          ]}
          displayIcon
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                sync: !includesPath(R.values(sync), path),
                path,
                value: R.pipe(
                  R.assoc('chart', value),
                  R.when(
                    R.pipe(
                      R.prop('statistic'),
                      R.both(R.is(Array), R.pipe(R.length, R.lt(1)))
                    ),
                    // Uncomment the line below if we want to
                    // select the first one of the whole stats list
                    // R.assoc('statistic', R.path([0, 'id'])(sortedStatistics))
                    R.assoc('statistic', R.path(['statistic', 0])(obj))
                  ),
                  removeExtraLevels
                )(obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <Select
          disabled={obj.chart === 'Box Plot'}
          value={R.propOr('', 'grouping', obj)}
          displayIcon
          optionsList={[
            {
              label: 'Sum',
              value: 'Sum',
              iconName: 'MdFunctions',
            },
            {
              label: 'Average',
              value: 'Average',
              iconName: 'MdVerticalAlignCenter',
            },
            {
              label: 'Minimum',
              value: 'Minimum',
              iconName: 'MdVerticalAlignBottom',
            },
            {
              label: 'Maximum',
              value: 'Maximum',
              iconName: 'MdVerticalAlignTop',
            },
          ]}
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('grouping', value, obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>

      <HeaderSelectWrapper>
        {R.has(R.prop('chart', obj), chartStatLimits) ? (
          <SelectMulti
            getLabel={getLabelFn(statisticTypes)}
            value={R.propOr([], 'statistic', obj)}
            header={
              chartStatLimits[obj.chart] === -1
                ? 'Select Statistics'
                : `Select ${chartStatLimits[obj.chart]} Statistics`
            }
            ordered={chartStatLimits[obj.chart] !== -1}
            optionsList={R.pluck('id')(sortedStatistics)}
            selectionLimit={chartStatLimits[obj.chart]}
            onSelect={(value) => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.assoc('statistic', value, obj),
                })
              )
            }}
          />
        ) : (
          <Select
            getLabel={getLabelFn(statisticTypes)}
            value={R.propOr('', 'statistic', obj)}
            placeholder="Statistic"
            optionsList={R.pluck('id')(sortedStatistics)}
            onSelect={(value) => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.assoc('statistic', value, obj),
                })
              )
            }}
          />
        )}
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <SelectAccordion
          {...{ itemGroups }}
          values={getGroupValues()}
          placeholder="Group By"
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onSelect={onSelectGroupFn()}
        />
      </HeaderSelectWrapper>

      {chartMaxGrouping[obj.chart] === 2 ? (
        <>
          <HeaderSelectWrapper
            sx={{
              minWidth: '35px',
              height: '40%',
              my: 'auto',
              borderRadius: '20%',
            }}
            elevation={6}
          >
            <SwapButton
              onClick={() => {
                const [category, level] = getGroupValues()
                const [category2, level2] = getGroupValues(2)
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.pipe(
                      R.assoc('category', category2),
                      R.assoc('level', level2),
                      R.assoc('category2', category),
                      R.assoc('level2', level)
                    )(obj),
                  })
                )
              }}
            />
          </HeaderSelectWrapper>
          <HeaderSelectWrapper
            clearable={R.has('level2', obj)}
            onClear={() => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(R.dissoc('category2'), R.dissoc('level2'))(obj),
                })
              )
            }}
          >
            <SelectAccordion
              {...{ itemGroups }}
              values={getGroupValues(2)}
              placeholder="Sub Group"
              getLabel={getLabelFn(categories)}
              getSubLabel={getSubLabelFn(categories)}
              onSelect={onSelectGroupFn(2)}
            />
          </HeaderSelectWrapper>{' '}
        </>
      ) : (
        []
      )}
    </>
  )
})

const KpiHeader = memo(({ obj, index }) => {
  const dispatch = useDispatch()

  const kpis = useSelector(selectAssociatedData)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]

  return (
    <>
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('Bar', 'chart', obj)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconName: 'MdBarChart',
            },
            {
              label: 'Line',
              value: 'Line',
              iconName: 'MdShowChart',
            },
            // {
            //   label: 'Box Plot',
            //   value: 'Box Plot',
            //   iconName: 'MdGraphicEq',
            // },
            {
              label: 'Table',
              value: 'Table',
              iconName: 'MdTableChart',
            },
          ]}
          displayIcon
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('chart', value)(obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <SelectMulti
          value={R.propOr([], 'sessions', obj)}
          header="Select Sessions"
          optionsList={R.pipe(R.values, R.pluck('name'))(kpis)}
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('sessions', value, obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <SelectMulti
          value={R.propOr([], 'kpi', obj)}
          header="Select KPIs"
          optionsList={R.pipe(
            R.values,
            R.head,
            R.path(['data', 'kpis', 'data']),
            customSort,
            R.filter(R.has('value')),
            R.project(['id', 'name', 'icon']),
            R.map(renameKeys({ id: 'value', name: 'label', icon: 'iconName' }))
          )(kpis)}
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('kpi', value, obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <Button
          sx={{ minWidth: 0 }}
          variant="outlined"
          color="greyscale"
          onClick={() => {
            dispatch(
              sendCommand({
                command: 'get_associated_session_data',
                data: {
                  data_names: ['kpis'],
                },
              })
            )
          }}
        >
          <Box
            component="span"
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '40px',
            }}
          >
            <FetchedIcon iconName="MdRefresh" size={32} />
          </Box>
        </Button>
      </HeaderSelectWrapper>
    </>
  )
})

export { KpiHeader, StatisticsHeader }
