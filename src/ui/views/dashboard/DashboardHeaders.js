import { Button } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import {
  MdBarChart,
  MdFunctions,
  MdGraphicEq,
  MdStackedBarChart,
  MdTableChart,
  MdShowChart,
  MdVerticalAlignBottom,
  MdVerticalAlignCenter,
  MdVerticalAlignTop,
  MdRefresh,
  MdWaterfallChart,
  MdStackedLineChart,
} from 'react-icons/md'
import { TbStack2 } from 'react-icons/tb'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectStatisticTypes,
  selectCategoriesData,
  selectSync,
  selectAppBarId,
} from '../../../data/selectors'

import {
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
  const statisticTypes = useSelector(selectStatisticTypes)
  const sortedStatistics = customSort(statisticTypes)
  const sortedCategories = customSort(categories)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]
  return (
    <>
      <HeaderSelectWrapper sx={{ ml: 2 }}>
        <Select
          value={R.propOr('', 'chart', obj)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconClass: MdBarChart,
            },
            {
              label: 'Stacked Bar',
              value: 'Stacked Bar',
              iconClass: MdStackedBarChart,
            },
            {
              label: 'Line',
              value: 'Line',
              iconClass: MdShowChart,
            },
            {
              label: 'Cumulative Line',
              value: 'Cumulative Line',
              iconClass: MdStackedLineChart,
            },
            {
              label: 'Waterfall',
              value: 'Waterfall',
              iconClass: MdWaterfallChart,
            },

            {
              label: 'Stacked Waterfall',
              value: 'Stacked Waterfall',
              iconClass: TbStack2,
            },
            {
              label: 'Box Plot',
              value: 'Box Plot',
              iconClass: MdGraphicEq,
            },
            {
              label: 'Table',
              value: 'Table',
              iconClass: MdTableChart,
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
              iconClass: MdFunctions,
            },
            {
              label: 'Average',
              value: 'Average',
              iconClass: MdVerticalAlignCenter,
            },
            {
              label: 'Minimum',
              value: 'Minimum',
              iconClass: MdVerticalAlignBottom,
            },
            {
              label: 'Maximum',
              value: 'Maximum',
              iconClass: MdVerticalAlignTop,
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

      <HeaderSelectWrapper sx={{ ml: 2 }}>
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
          items={R.mapObjIndexed(getCategoryItems)(categories)}
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
          items={R.mapObjIndexed(getCategoryItems)(categories)}
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
      <HeaderSelectWrapper sx={{ ml: 2 }}>
        <Select
          value={R.propOr('Bar', 'chart', obj)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconClass: MdBarChart,
            },
            {
              label: 'Line',
              value: 'Line',
              iconClass: MdShowChart,
            },
            // {
            //   label: 'Box Plot',
            //   value: 'Box Plot',
            //   iconClass: MdGraphicEq,
            // },
            {
              label: 'Table',
              value: 'Table',
              iconClass: MdTableChart,
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
      <HeaderSelectWrapper sx={{ ml: 2 }}>
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
            R.map(renameKeys({ id: 'value', name: 'label', icon: 'iconClass' }))
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
          <MdRefresh size={28} />
        </Button>
      </HeaderSelectWrapper>
    </>
  )
})

export { KpiHeader, StatisticsHeader }
