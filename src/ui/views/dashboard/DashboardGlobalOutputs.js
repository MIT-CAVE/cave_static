import { Box } from '@mui/material'
import * as R from 'ramda'
import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import {
  selectAssociatedData,
  selectNumberFormat,
  selectMemoizedGlobalOutputFunc,
  selectGlobalOutputsLayout,
  selectMergedGlobalOutputs,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'
import { renderPropsLayout } from '../common/renderLayout'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import {
  withIndex,
  forcePath,
  getLabelFn,
  addValuesToProps,
} from '../../../utils'

const styles = {
  root: {
    display: 'flex',
    position: 'relative',
    flex: '1 1 auto',
    height: '50%',
  },
  overview: {
    overflow: 'auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

const DashboardGlobalOutput = ({ chartObj }) => {
  const dispatch = useDispatch()
  const globalOutputs = useSelector(selectAssociatedData)
  const numberFormatDefault = useSelector(selectNumberFormat)
  const globalOutputFunc = useSelector(selectMemoizedGlobalOutputFunc)
  const layout = useSelector(selectGlobalOutputsLayout)
  const items = useSelector(selectMergedGlobalOutputs)
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

  const formattedGlobalOutputs = globalOutputFunc(chartObj)

  const isTable = R.prop('variant', chartObj) === 'Table'

  const actualGlobalOutputRaw = forcePath(
    R.propOr([], 'globalOutput', chartObj)
  )
  const globalOutputData = R.pipe(
    R.values,
    R.head,
    R.pathOr({}, ['data', 'globalOutputs', 'props']),
    R.pick(actualGlobalOutputRaw)
  )(globalOutputs)

  const actualGlobalOutput = R.pipe(withIndex, R.pluck('id'))(globalOutputData)
  const globalOutputUnits = R.map((item) => {
    const globalOutput = R.propOr({}, item)(globalOutputData)
    return globalOutput.unit || numberFormatDefault.unit
  })(actualGlobalOutput)

  const tableLabels = R.zipWith(
    (a, b) => `${getLabelFn(globalOutputData)(a)}${b ? ` [${b}]` : ''} `,
    actualGlobalOutput,
    globalOutputUnits
  )
  // FIXME: This should receive column types set by designers in the API
  const tableColTypes = isTable
    ? R.pipe(
        R.concat(R.repeat('number')(R.length(actualGlobalOutput))),
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
      sx={[
        styles.root,
        chartObj.variant === chartVariant.OVERVIEW && styles.overview,
      ]}
    >
      {chartObj.variant === chartVariant.OVERVIEW ? (
        <Box
          sx={{
            position: 'absolute',
            maxHeight: (theme) => `calc(100% - ${theme.spacing(2)})`,
            maxWidth: (theme) => `calc(100% - ${theme.spacing(2)})`,
          }}
        >
          {renderPropsLayout({
            layout,
            items: props,
            onChangeProp: () => null,
          })}
        </Box>
      ) : chartObj.variant === chartVariant.TABLE ? (
        <TableChart
          data={formattedGlobalOutputs}
          numberFormat={commonFormat}
          columnTypes={tableColTypes}
          labels={R.prepend('Session')(tableLabels)}
        />
      ) : chartObj.variant === chartVariant.BAR ? (
        <BarPlot
          data={formattedGlobalOutputs}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
          // The data structure of the globalOutput chart is the same
          // as that of a statistics chart with subgrouped data
          subGrouped
        />
      ) : chartObj.variant === chartVariant.LINE ? (
        <LinePlot
          data={formattedGlobalOutputs}
          numberFormat={commonFormat}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
        />
      ) : null}
    </Box>
  )
}

export default memo(DashboardGlobalOutput)
