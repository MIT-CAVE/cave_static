import { Box, Button } from '@mui/material'
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

const StatisticsHeader = memo(({ obj, index }) => {
  const categories = useSelector(selectCategoriesData)
  const statisticTypes = useSelector(selectAllowedStats)
  const sortedStatistics = customSort(statisticTypes)
  const sortedCategories = customSort(categories)
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

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]
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
                  )
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
          onSelect={(value) =>
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('grouping', value, obj),
              })
            )
          }
        />
      </HeaderSelectWrapper>

      <HeaderSelectWrapper>
        {R.prop('chart', obj) === 'Table' ? (
          <SelectMulti
            getLabel={getLabelFn(statisticTypes)}
            value={R.propOr([], 'statistic', obj)}
            header="Select Statistics"
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
        ) : (
          <Select
            getLabel={getLabelFn(statisticTypes)}
            value={R.propOr('', 'statistic', obj)}
            placeholder="Statistic"
            optionsList={R.pluck('id')(sortedStatistics)}
            onSelect={(value) =>
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.assoc('statistic', value, obj),
                })
              )
            }
          />
        )}
      </HeaderSelectWrapper>
      <HeaderSelectWrapper>
        <SelectAccordion
          values={R.pipe(
            R.props(['category', 'level']),
            R.when(R.any(R.isNil), R.always(''))
          )(obj)}
          items={R.mapObjIndexed(getCategoryItems)(groupableCategories)}
          placeholder="Group By"
          subItemLayouts={R.pipe(
            R.values,
            R.pluck('layoutDirection')
          )(sortedCategories)}
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onSelect={(item, subItem) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.pipe(
                  R.assoc('category', item),
                  R.assoc('level', subItem)
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
          values={R.pipe(
            R.props(['category2', 'level2']),
            R.when(R.any(R.isNil), R.always(''))
          )(obj)}
          items={R.mapObjIndexed(getCategoryItems)(groupableCategories)}
          placeholder="Sub Group"
          subItemLayouts={R.pipe(
            R.values,
            R.pluck('layoutDirection')
          )(sortedCategories)}
          getLabel={getLabelFn(categories)}
          getSubLabel={getSubLabelFn(categories)}
          onSelect={(item, subItem) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.pipe(
                  R.assoc('category2', item),
                  R.assoc('level2', subItem)
                )(obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
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
          onSelect={(value) =>
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('kpi', value, obj),
              })
            )
          }
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
