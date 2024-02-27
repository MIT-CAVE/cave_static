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
  selectNumberFormatPropsFn,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'
import { renderPropsLayout } from '../common/renderLayout'

import { BarPlot, LinePlot, TableChart } from '../../charts'

import { forcePath, getLabelFn, addValuesToProps } from '../../../utils'

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
  const numberFormatPropsFn = useSelector(selectNumberFormatPropsFn)

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

  const actualGlobalOutputRaw = forcePath(
    R.propOr([], 'globalOutput', chartObj)
  )
  const globalOutputData = R.pipe(
    R.values,
    R.head,
    R.pathOr({}, ['data', 'globalOutputs', 'props']),
    R.pick(actualGlobalOutputRaw)
  )(globalOutputs)

  const selectedGlobalOutputKeys = R.keys(globalOutputData)

  const globalOutputUnits = R.map((item) => {
    const globalOutput = R.propOr({}, item)(globalOutputData)
    return globalOutput.unit || numberFormatDefault.unit
  })(selectedGlobalOutputKeys)

  const labelProps =
    chartObj.variant === chartVariant.TABLE
      ? R.pipe(
          R.zipWith(
            (globalOutputKey, unit) => ({
              type: 'number',
              key: globalOutputKey,
              label: `${getLabelFn(globalOutputData)(globalOutputKey)}${unit ? ` [${unit}]` : ''} `,
            }),
            selectedGlobalOutputKeys
          ),
          R.prepend({
            type: 'string',
            key: 'session',
            label: 'Session',
          })
        )(globalOutputUnits)
      : []

  const getNumberFormat = R.pipe(
    numberFormatPropsFn,
    // `unit`s are excluded as they will be represented
    // as part of the axis labels or column headers.
    R.omit(['unit', 'unitPlacement'])
  )
  const numberFormat = R.map(getNumberFormat)(globalOutputData)

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
          {...{ labelProps, numberFormat }}
        />
      ) : chartObj.variant === chartVariant.BAR ? (
        <BarPlot
          data={formattedGlobalOutputs}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
          {...{ numberFormat }}
          // The data structure of the globalOutput chart is the same
          // as that of a statistics chart with subgrouped data
          subGrouped
        />
      ) : chartObj.variant === chartVariant.LINE ? (
        <LinePlot
          data={formattedGlobalOutputs}
          {...{ numberFormat }}
          xAxisTitle="Sessions"
          yAxisTitle={R.join(', ')(globalOutputUnits)}
        />
      ) : null}
    </Box>
  )
}

export default memo(DashboardGlobalOutput)
