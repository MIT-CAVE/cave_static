import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { fetchData } from '../../../data/data'
import { selectAssociatedData, selectTheme } from '../../../data/selectors'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import { forcePath } from '../../../utils'

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

const DashboardKpi = ({ obj, length }) => {
  const dispatch = useDispatch()
  const classes = useStyles()
  const themeId = useSelector(selectTheme)
  const kpis = useSelector(selectAssociatedData)

  useEffect(() => {
    if (R.isEmpty(kpis)) {
      dispatch(
        fetchData({
          url: `${window.location.ancestorOrigins[0]}/get_associated_session_data/`,
          fetchMethod: 'POST',
          body: {
            data_names: ['kpis'],
          },
        })
      )
    }
  }, [kpis, dispatch])

  const isTable = R.prop('chart', obj) === 'Table'

  const actualKpi = forcePath(R.propOr([], 'kpi', obj))

  const tableUnit = R.pipe(
    R.values,
    R.head,
    R.path(['data', 'kpis', 'data']),
    R.values,
    (values) =>
      R.map(
        (item) =>
          `${item} [${R.propOr(
            'Units',
            'unit',
            R.find(R.propEq('name', item), values)
          )}]`,
        actualKpi
      )
  )(kpis)

  const unit = R.pipe(
    R.values,
    R.head,
    R.path(['data', 'kpis', 'data']),
    R.values,
    (values) =>
      R.map(
        (item) =>
          `${R.propOr(
            'Units',
            'unit',
            R.find(R.propEq('name', item), values)
          )}`,
        actualKpi
      )
  )(kpis)

  const preFormattedKpis = R.pipe(
    R.values,
    R.filter((val) => R.includes(val.name, R.propOr([], 'sessions', obj))),
    R.map((val) => ({
      x: val.name,
      y: R.path(['data', 'kpis', 'data'], val),
    }))
  )(kpis)

  const formattedKpis = R.map(
    R.over(
      R.lensProp('y'),
      R.pipe(
        R.values,
        R.filter(R.pipe(R.prop('name'), R.includes(R.__, actualKpi))),
        R.indexBy(R.prop('name')),
        R.pluck('value'),
        obj.chart === 'Table' ? R.values : R.identity
      )
    )
  )(preFormattedKpis)

  const kpiChartData = R.map((val) =>
    R.assoc(
      'y',
      R.pipe(
        R.prop('y'),
        R.map(
          R.pipe(
            R.when(
              R.includes(','),
              // Convert thousand-separator formatted numbers to float
              R.replace(/,/g, '')
            ),
            parseFloat
          )
        )
      )(val)
    )(val)
  )(formattedKpis)

  // FIXME: This should receive column types set by designers in the API
  const tableColTypes = isTable
    ? R.pipe(
        R.concat(R.repeat('number')(R.length(actualKpi))),
        R.prepend('string')
      )([])
    : []

  return (
    <div className={classes.chart_container}>
      {obj.chart === 'Table' ? (
        <TableChart
          formattedData={formattedKpis}
          colTypes={tableColTypes}
          length={length}
          labels={R.prepend('Session')(tableUnit)}
          theme={themeId}
        />
      ) : obj.chart === 'Bar' ? (
        <BarPlot
          data={kpiChartData}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(unit)}
          theme={themeId}
        />
      ) : obj.chart === 'Line' ? (
        <LinePlot
          data={kpiChartData}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(unit)}
          theme={themeId}
        />
      ) : null}
    </div>
  )
}

export default memo(DashboardKpi)
