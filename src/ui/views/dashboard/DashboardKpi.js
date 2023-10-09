import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectAssociatedData,
  selectNumberFormat,
  selectMemoizedKpiFunc,
  selectKpisLayout,
  selectMergedKpis,
} from '../../../data/selectors'
import { chartType } from '../../../utils/enums'
import { renderPropsLayout } from '../common/renderLayout'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import {
  withIndex,
  forcePath,
  getLabelFn,
  addValuesToProps,
} from '../../../utils'

const DashboardKpi = ({ chartObj }) => {
  const dispatch = useDispatch()
  const globalOutputs = useSelector(selectAssociatedData)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const globalOutputFunc = useSelector(selectMemoizedKpiFunc)
  const layout = useSelector(selectKpisLayout)
  const items = useSelector(selectMergedKpis)
  const props = addValuesToProps(
    R.map(R.assoc('enabled', false))(R.propOr({}, 'props', items)),
    R.propOr({}, 'values', items)
  )

  useEffect(() => {
    if (R.isEmpty(globalOutputs)) {
      dispatch(
        sendCommand({
          command: 'get_associated_session_data',
          data: {
            data_names: ['globalOutputs'],
          },
        })
      )
    }
  }, [globalOutputs, dispatch])

  const formattedKpis = globalOutputFunc(chartObj)

  const isTable = R.prop('chart', chartObj) === 'Table'

  const actualKpiRaw = forcePath(R.propOr([], 'globalOutput', chartObj))

  const globalOutputData = R.pipe(
    R.values,
    R.head,
    R.pathOr({}, ['data', 'globalOutputs', 'data']),
    R.pick(actualKpiRaw),
    R.filter(R.has('value'))
  )(globalOutputs)

  const actualKpi = R.pipe(withIndex, R.pluck('id'))(globalOutputData)
  const globalOutputUnits = R.map((item) => {
    const globalOutput = R.propOr({}, item)(globalOutputData)
    return globalOutput.unit || numberFormatDefault.unit
  })(actualKpi)

  const tableLabels = R.zipWith(
    (a, b) => `${getLabelFn(globalOutputData)(a)}${b ? ` [${b}]` : ''} `,
    actualKpi,
    globalOutputUnits
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
      {chartObj.chart === chartType.OVERVIEW ? (
        <Box sx={{ overflow: 'auto', mx: 'auto' }}>
          {renderPropsLayout({
            layout,
            items: props,
            onChangeProp: () => null,
          })}
        </Box>
      ) : chartObj.chart === chartType.TABLE ? (
        <TableChart
          data={formattedKpis}
          numberFormat={commonFormat}
          columnTypes={tableColTypes}
          labels={R.prepend('Session')(tableLabels)}
        />
      ) : chartObj.chart === chartType.BAR ? (
        <BarPlot
          data={formattedKpis}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
          // The data structure of the globalOutput chart is the same
          // as that of a statistics chart with subgrouped data
          subGrouped
        />
      ) : chartObj.chart === chartType.LINE ? (
        <LinePlot
          data={formattedKpis}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
        />
      ) : null}
    </Box>
  )
}

export default memo(DashboardKpi)
