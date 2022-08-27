/** @jsxImportSource @emotion/react */
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import { memo, useEffect, useState, useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectFilteredStatsData,
  selectStatisticTypes,
  selectCategoriesData,
  selectTheme,
  selectDebug,
  selectCategoryFunc,
} from '../../../data/selectors'

import { BarPlot, BoxPlot, LinePlot, TableChart } from '../../charts'

import {
  calculateStatSingleGroup,
  calculateStatSubGroup,
  getLabelFn,
  getSubLabelFn,
  forcePath,
} from '../../../utils'

const useStyles = makeStyles(() => ({
  chart_container: {
    display: 'flex',
    position: 'relative',
    // padding: theme.spacing(1),
    // paddingLeft: theme.spacing(2),
    // paddingRight: theme.spacing(2),
    // paddingTop: theme.spacing(5),
    // paddingBottom: theme.spacing(1),
    // backgroundColor: theme.palette.background.paper,
    flex: '1 1 auto',
  },
}))

const mergeFuncs = {
  Sum: R.sum,
  Minimum: (val) => R.reduce(R.min, R.head(val), R.tail(val)),
  Maximum: (val) => R.reduce(R.max, R.head(val), R.tail(val)),
  Average: R.mean,
}

const customSortByX = R.curry((ordering, data) => {
  // Sort by the predefined `ordering` list
  const sortByPredef = R.sortBy(R.pipe(R.prop('x'), R.indexOf(R.__, ordering)))
  // Sort by alphabetical order (ascending)
  const sortByAlpha = R.sortBy(R.prop('x'))
  // Separate the items that appear in `ordering` from the rest
  const sublists = R.partition(R.pipe(R.prop('x'), R.includes(R.__, ordering)))(
    data
  )

  return R.converge(R.concat, [
    R.pipe(R.head, sortByPredef),
    R.pipe(R.last, sortByAlpha),
  ])(sublists)
})

const DashboardChart = ({ obj, length }) => {
  const classes = useStyles()
  const themeId = useSelector(selectTheme)
  const debug = useSelector(selectDebug)
  const filteredStatsData = useSelector(selectFilteredStatsData)
  const categories = useSelector(selectCategoriesData)
  const statisticTypes = useSelector(selectStatisticTypes)
  const categoryFunc = useSelector(selectCategoryFunc)

  const [tableData, setTableData] = useState([])
  const [formattedData, setFormattedData] = useState([])

  const pathedVar = useMemo(
    () => forcePath(R.propOr([], 'statistic', obj)),
    [obj]
  )

  const actualStat = obj.chart === 'Table' ? pathedVar : obj.statistic

  useEffect(() => {
    const asyncCalcs = async () => {
      const calculation = R.is(Array, actualStat)
        ? `[${R.reduce(
            (acc, stat) =>
              R.insert(
                -1,
                R.pathOr('0', [stat, 'calculation'])(statisticTypes),
                acc
              ),
            '',
            actualStat
          )}]`
        : R.pathOr('0', [actualStat, 'calculation'])(statisticTypes)

      const doubleFilteredStats = R.filter(
        R.hasPath(['category', obj.category])
      )(R.values(filteredStatsData))

      const actualStatsData = obj.category
        ? doubleFilteredStats
        : R.values(filteredStatsData)

      const calculatedStats = R.has('level2', obj)
        ? calculateStatSubGroup(actualStatsData)(
            categoryFunc(obj.category, obj.level),
            categoryFunc(obj.category2, obj.level2),
            calculation
          )
        : calculateStatSingleGroup(actualStatsData)(
            categoryFunc(obj.category, obj.level),
            calculation
          )
      // merge the calculated stats - unless boxplot
      const statValues =
        obj.chart === 'Box Plot' && !R.has('level2', obj)
          ? R.pipe(
              R.map(R.filter(R.is(Number))),
              R.mapObjIndexed((val, key) => R.assoc(key, val, {}))
            )(calculatedStats)
          : obj.chart === 'Box Plot'
          ? R.map(R.map(R.filter(R.is(Number))))(calculatedStats)
          : R.has('level2', obj)
          ? R.map(
              R.map(R.pipe(R.filter(R.is(Number)), mergeFuncs[obj.grouping]))
            )(calculatedStats)
          : R.map(R.pipe(R.filter(R.is(Number)), mergeFuncs[obj.grouping]))(
              calculatedStats
            )

      // Ordering for the X's in the chart
      const ordering = R.pathOr(
        [],
        [obj.category, 'nestedStructure', obj.level, 'ordering']
      )(categories)

      if (R.propOr('bar', 'chart', obj) !== 'Table') {
        const getFormattedData = R.pipe(
          debug ? R.identity : R.dissoc(undefined),
          debug || !R.has('level2', obj)
            ? R.identity
            : R.map(R.dissoc(undefined)),
          R.mapObjIndexed((value, key) => ({
            x: obj.category == null ? 'All' : key,
            y: value,
          })),
          R.values,
          customSortByX(ordering)
        )

        const formattedData = getFormattedData(statValues)

        setFormattedData(formattedData)
      } else {
        const groupByIdx = R.addIndex(R.groupBy)(
          (val, idx) => idx % R.length(actualStat)
        )

        const getSubGroupedTableData = R.mapObjIndexed((val, key) =>
          R.values(
            R.mapObjIndexed(
              (stats, subLabel) => ({
                x: key,
                y: R.prepend(
                  subLabel,
                  R.map(
                    R.when(
                      R.is(Array),
                      R.pipe(
                        R.flatten,
                        R.map((d) => +d),
                        R.filter((d) => !isNaN(d)),
                        mergeFuncs[obj.grouping]
                      )
                    )
                  )(R.pipe(R.unnest, groupByIdx, R.values)(stats))
                ),
              }),
              val
            )
          )
        )

        const getTableData = R.mapObjIndexed((val, key) => ({
          x: key,
          y: R.map(
            R.when(
              R.is(Array),
              R.pipe(
                R.flatten,
                R.map((d) => +d),
                R.filter((d) => !isNaN(d)),
                mergeFuncs[obj.grouping]
              )
            )
          )(R.pipe(R.unnest, groupByIdx, R.values)(val)),
        }))

        const tableData = R.pipe(
          debug ? R.identity : R.dissoc(undefined),
          debug || !R.has('level2', obj)
            ? R.identity
            : R.map(R.dissoc(undefined)),
          R.has('level2', obj) ? getSubGroupedTableData : getTableData,
          R.values,
          R.has('level2', obj) ? R.unnest : R.identity
        )(calculatedStats)

        setTableData(tableData)
      }
    }
    asyncCalcs()
  }, [
    filteredStatsData,
    debug,
    obj,
    categories,
    categoryFunc,
    statisticTypes,
    actualStat,
  ])

  const xAxisTitle = obj.category
    ? `${getLabelFn(categories)(obj.category)}${
        obj.level
          ? ` -> ${getSubLabelFn(categories, obj.category, obj.level)}`
          : ''
      }`
    : ''
  const yAxisTitle = `${getLabelFn(statisticTypes)(obj.statistic)} [${R.path([
    obj.statistic,
    'unit',
  ])(statisticTypes)}]`

  const labels = { xAxisTitle, yAxisTitle }

  const tableStatLabels = R.map((item) => {
    const unit = R.path([item, 'unit'])(statisticTypes)
    return `${getLabelFn(statisticTypes)(item)}${unit && ` [${unit}]`}`
  })(actualStat)

  const tableLabels = R.prepend(
    obj.category
      ? `${getLabelFn(categories)(obj.category)}${
          obj.level
            ? ` -> ${getSubLabelFn(categories, obj.category, obj.level)}`
            : ''
        }`
      : '',
    R.has('level2', obj)
      ? R.prepend(
          `${getLabelFn(categories)(obj.category2)}${
            obj.level2
              ? ` -> ${getSubLabelFn(categories, obj.category2, obj.level2)}`
              : ''
          }`,
          tableStatLabels
        )
      : tableStatLabels
  )
  const tableColTypes = R.pipe(
    R.concat(R.repeat('number')(R.length(tableStatLabels))),
    R.when(R.always(R.has('level')(obj)), R.prepend('string')),
    R.when(R.always(R.has('level2')(obj)), R.prepend('string'))
  )([])
  return (
    <div className={classes.chart_container}>
      {obj.chart === 'Table' && obj.category ? (
        <TableChart
          formattedData={tableData}
          length={length}
          labels={tableLabels}
          colTypes={tableColTypes}
          theme={themeId}
        />
      ) : obj.chart === 'Box Plot' ? (
        <BoxPlot
          data={formattedData}
          theme={themeId}
          subGrouped={R.has('level2')(obj)}
          {...labels}
        />
      ) : obj.chart === 'Bar' ? (
        <BarPlot data={formattedData} theme={themeId} {...labels} />
      ) : obj.chart === 'Stacked Bar' ? (
        <BarPlot data={formattedData} theme={themeId} stack={'x'} {...labels} />
      ) : obj.chart === 'Line' ? (
        <LinePlot data={formattedData} theme={themeId} {...labels} />
      ) : (
        <></>
      )}
    </div>
  )
}

export default memo(DashboardChart)
