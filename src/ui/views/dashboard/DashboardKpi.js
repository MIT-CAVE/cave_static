import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectAssociatedData,
  selectNumberFormat,
  selectTheme,
} from '../../../data/selectors'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import { customSort, forcePath } from '../../../utils'

const DashboardKpi = ({ obj, length }) => {
  const dispatch = useDispatch()
  const themeId = useSelector(selectTheme)
  const kpis = useSelector(selectAssociatedData)
  const numberFormatDefault = useSelector(selectNumberFormat)

  useEffect(() => {
    if (R.isEmpty(kpis)) {
      dispatch(
        sendCommand({
          command: 'get_associated_session_data',
          data: {
            data_names: ['kpis'],
          },
        })
      )
    }
  }, [kpis, dispatch])

  const isTable = R.prop('chart', obj) === 'Table'

  const actualKpi = forcePath(R.propOr([], 'kpi', obj))

  const kpiData = R.pipe(
    R.values,
    R.head,
    R.path(['data', 'kpis', 'data']),
    customSort,
    R.filter(R.has('value'))
  )(kpis)

  const kpiUnits = R.map((item) => {
    const kpi = R.find(R.propEq('id', item))(kpiData)
    const { numberFormat = {} } = R.defaultTo({})(kpi)
    return numberFormat.unit || numberFormatDefault.unit
  })(actualKpi)

  const tableUnit = R.zipWith(
    (a, b) => `${a}${b ? ` [${b}]` : ''} `,
    actualKpi,
    kpiUnits
  )

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
        customSort,
        R.filter(R.has('value')),
        R.filter(R.pipe(R.prop('id'), R.includes(R.__, actualKpi))),
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

  // For simplicity, `numberFormatDefault` is used to apply number
  // formatting to all values in a chart, as some statistics may
  // be the result of combining different number formats. Although
  // unlikely in a general `numberFormat` definition, `unit`s are
  // excluded as they will be represented in the header or as part
  // of the axis labels.
  const commonFormat = R.dissoc('unit')(numberFormatDefault)
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      {obj.chart === 'Table' ? (
        <TableChart
          formattedData={formattedKpis}
          numberFormat={commonFormat}
          colTypes={tableColTypes}
          length={length}
          labels={R.prepend('Session')(tableUnit)}
        />
      ) : obj.chart === 'Bar' ? (
        <BarPlot
          data={kpiChartData}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(kpiUnits)}
          theme={themeId}
        />
      ) : obj.chart === 'Line' ? (
        <LinePlot
          data={kpiChartData}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(kpiUnits)}
          theme={themeId}
        />
      ) : null}
    </Box>
  )
}

export default memo(DashboardKpi)
