import { Box, Button, IconButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectSync,
  selectAppBarId,
  selectAllowedStats,
  selectMapData,
  selectGroupedOutputNames,
  selectStatGroupings,
  selectGroupedOutputsData,
} from '../../../data/selectors'
import { chartMaxGrouping, chartStatUses } from '../../../utils/enums'

import {
  FetchedIcon,
  HeaderSelectWrapper,
  Select,
  SelectAccordion,
  SelectMulti,
  SelectMultiAccordion,
} from '../../compound'

import {
  customSort,
  getCategoryItems,
  getFreeName,
  getLabelFn,
  getGroupLabelFn,
  getSubLabelFn,
  includesPath,
  renameKeys,
} from '../../../utils'

const SwapButton = ({ onClick }) => (
  <IconButton sx={{ mx: 'auto' }} color="primary" {...{ onClick }}>
    <FetchedIcon iconName="md/MdSwapHoriz" size={22} />
  </IconButton>
)

const StatisticsHeader = memo(({ obj, index }) => {
  const categories = useSelector(selectStatGroupings)
  const statisticTypes = useSelector(selectAllowedStats)
  const groupedOutputs = useSelector(selectGroupedOutputsData)
  const statNames = useSelector(selectGroupedOutputNames)
  const appBarId = useSelector(selectAppBarId)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const groupByOptions =
    R.has('statistic')(obj) &&
    R.pathSatisfies(R.is(String), ['statistic', 0], obj)
      ? R.pipe(
          R.path([R.prop('statistic', obj)[0], 'groupLists']),
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
    customSort,
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

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]
  const onSelectGroupFn =
    (n = 0) =>
    (item, subItem) => {
      dispatch(
        mutateLocal({
          path,
          sync: !includesPath(R.values(sync), path),
          value: R.pipe(
            R.assocPath([`category`, n], item),
            R.assocPath([`level`, n], subItem)
          )(obj),
        })
      )
    }
  const getGroupValues = (n = 0) =>
    R.pipe(
      R.props([`category`, `level`]),
      R.pluck(n),
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
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                sync: !includesPath(R.values(sync), path),
                path,
                value: R.pipe(
                  R.assoc('chart', value),
                  R.dissoc('statistic'),
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
        {R.has(R.prop('chart', obj), chartStatUses) ? (
          R.length(chartStatUses[obj.chart]) !== 0 ? (
            <SelectMultiAccordion
              itemGroups={{
                undefined: R.addIndex(R.map)((_, idx) => ({
                  id: idx,
                  layoutDirection: 'vertical',
                  subItems: R.values(statNames),
                }))(chartStatUses[obj.chart]),
              }}
              values={R.propOr([], 'statistic', obj)}
              header="Select Statistics"
              getLabel={(idx) => {
                const use = chartStatUses[obj.chart][idx]
                const currentStats = R.propOr([], 'statistic', obj)
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
                  R.path(['statistic', index], obj),
                  value
                )
                  ? undefined
                  : value
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assocPath(['statistic', index], newVal, obj),
                  })
                )
              }}
            />
          ) : (
            <SelectMulti
              getLabel={getGroupLabelFn(statisticTypes)}
              value={R.propOr([], 'statistic', obj)}
              header="Select Statistics"
              optionsList={R.values(statNames)}
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
          )
        ) : (
          <Select
            getLabel={getGroupLabelFn(statisticTypes)}
            value={R.propOr('', 'statistic', obj)}
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
                  )(obj),
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
                    )(obj),
                  })
                )
              }}
            />
          </HeaderSelectWrapper>
          <HeaderSelectWrapper
            clearable={R.hasPath(['level', 1], obj)}
            onClear={() => {
              dispatch(
                mutateLocal({
                  path,
                  sync: !includesPath(R.values(sync), path),
                  value: R.pipe(
                    R.dissocPath(['category', 1]),
                    R.dissocPath(['level', 1])
                  )(obj),
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
              onSelect={onSelectGroupFn(1)}
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

  const globalOutputs = useSelector(selectAssociatedData)
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
              iconName: 'md/MdBarChart',
            },
            {
              label: 'Line',
              value: 'Line',
              iconName: 'md/MdShowChart',
            },
            // {
            //   label: 'Box Plot',
            //   value: 'Box Plot',
            //   iconName: 'md/MdGraphicEq',
            // },
            {
              label: 'Table',
              value: 'Table',
              iconName: 'md/MdTableChart',
            },
            {
              label: 'Overview',
              value: 'Overview',
              iconName: 'md/MdViewQuilt',
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
      {obj.chart !== 'Overview' ? (
        <>
          <HeaderSelectWrapper>
            <SelectMulti
              value={R.propOr([], 'sessions', obj)}
              header="Select Sessions"
              optionsList={R.pipe(R.values, R.pluck('name'))(globalOutputs)}
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
              value={R.propOr([], 'globalOutput', obj)}
              header="Select Global Outputs"
              optionsList={R.pipe(
                R.values,
                R.head,
                R.path(['data', 'globalOutputs', 'data']),
                customSort,
                R.filter(R.has('value')),
                R.project(['id', 'name', 'icon']),
                R.map(
                  renameKeys({ id: 'value', name: 'label', icon: 'iconName' })
                )
              )(globalOutputs)}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assoc('globalOutput', value, obj),
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
                      data_names: ['globalOutputs'],
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
                <FetchedIcon iconName="md/MdRefresh" size={32} />
              </Box>
            </Button>
          </HeaderSelectWrapper>
        </>
      ) : (
        []
      )}
    </>
  )
})

const MapHeader = memo(({ obj, index }) => {
  const dispatch = useDispatch()
  const appBarId = useSelector(selectAppBarId)

  const sync = useSelector(selectSync)
  const maps = useSelector(selectMapData)

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]

  const availableValue = R.pipe(
    R.propOr('', 'mapId'),
    R.unless(R.has(R.__, maps), R.always(''))
  )(obj)
  return (
    <>
      <HeaderSelectWrapper>
        <Select
          value={availableValue}
          placeholder={'Select A Map'}
          getLabel={(mapId) => R.pathOr(mapId, [mapId, 'name'], maps)}
          optionsList={R.pipe(
            R.keys,
            R.map((k) =>
              R.assoc('value', k, {
                subOptions: [
                  R.pathOr(false, [k, 'duplicate'], maps)
                    ? {
                        iconName: 'md/MdDelete',
                        onClick: (key) => {
                          dispatch(
                            mutateLocal({
                              path: ['maps', 'data'],
                              sync: !includesPath(R.values(sync), [
                                'maps',
                                'data',
                              ]),
                              value: R.dissoc(key, maps),
                            })
                          )
                        },
                      }
                    : {
                        iconName: 'md/MdCopyAll',
                        onClick: (value) => {
                          const key = getFreeName(value, R.keys(maps))
                          const name = getFreeName(
                            R.pathOr(value, [value, 'name'], maps),
                            R.values(
                              R.mapObjIndexed(
                                (val, key) => R.propOr(key, 'name', val),
                                maps
                              )
                            )
                          )
                          dispatch(
                            mutateLocal({
                              path: ['maps', 'data', key],
                              sync: !includesPath(R.values(sync), [
                                'maps',
                                'data',
                                key,
                              ]),
                              value: R.pipe(
                                R.assoc('duplicate', true),
                                R.assoc('name', name)
                              )(maps[value]),
                            })
                          )
                        },
                      },
                ],
              })
            )
          )(maps)}
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('mapId', value, obj),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
    </>
  )
})

export { KpiHeader, StatisticsHeader, MapHeader }
