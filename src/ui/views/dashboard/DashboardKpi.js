import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectAssociatedData,
  selectNumberFormat,
  selectTheme,
  selectMemoizedKpiFunc,
  selectKpisLayout,
  selectMergedKpis,
} from '../../../data/selectors'
import { chartType } from '../../../utils/enums'
import { renderKpisLayout } from '../common/renderLayout'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import { customSort, forcePath, getLabelFn } from '../../../utils'

const DashboardKpi = ({ obj }) => {
  const dispatch = useDispatch()
  const themeId = useSelector(selectTheme)
  const kpis = useSelector(selectAssociatedData)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const kpiFunc = useSelector(selectMemoizedKpiFunc)
  const layout = useSelector(selectKpisLayout)
  const items = useSelector(selectMergedKpis)

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

  const formattedKpis = kpiFunc(obj)

  const isTable = R.prop('chart', obj) === 'Table'

  const actualKpiRaw = forcePath(R.propOr([], 'kpi', obj))

  const kpiData = R.pipe(
    R.values,
    R.head,
    R.pathOr({}, ['data', 'kpis', 'data']),
    R.pick(actualKpiRaw),
    R.filter(R.has('value'))
  )(kpis)

  const actualKpi = R.pipe(customSort, R.pluck('id'))(kpiData)
  const kpiUnits = R.map((item) => {
    const kpi = R.propOr({}, item)(kpiData)
    return kpi.unit || numberFormatDefault.unit
  })(actualKpi)

  const tableLabels = R.zipWith(
    (a, b) => `${getLabelFn(kpiData)(a)}${b ? ` [${b}]` : ''} `,
    actualKpi,
    kpiUnits
  )

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
  const commonFormat = R.omit(['unit', 'unitPlacement'])(numberFormatDefault)

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
        height: '50%',
      }}
    >
      {obj.chart === chartType.OVERVIEW ? (
        <Box
          sx={{
            overflow: 'auto',
            marginLeft: 'auto',
            marginRight: 'auto',
            '&::-webkit-scrollbar': {
              height: 10,
              width: '12px',
              WebkitAppearance: 'none',
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 8,
              border: '2px solid',
              borderColor: (theme) =>
                theme.palette.mode === 'dark' ? '' : '#E7EBF0',
              backgroundColor: 'rgba(0 0 0 / 0.5)',
            },
          }}
        >
          {renderKpisLayout({ layout, items })}
        </Box>
      ) : obj.chart === chartType.TABLE ? (
        <TableChart
          data={formattedKpis}
          numberFormat={commonFormat}
          columnTypes={tableColTypes}
          labels={R.prepend('Session')(tableLabels)}
        />
      ) : obj.chart === chartType.BAR ? (
        <BarPlot
          data={formattedKpis}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(kpiUnits)}
          theme={themeId}
          // The data structure of the KPI chart is the same
          // as that of a statistics chart with subgrouped data
          subGrouped
        />
      ) : obj.chart === chartType.LINE ? (
        <LinePlot
          data={formattedKpis}
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
