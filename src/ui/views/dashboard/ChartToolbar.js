import { Grid } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GlobalOutputsToolbar from './GlobalOutputsToolbar'
import GroupedOutputsToolbar from './GroupedOutputsToolbar'
import MapToolbar from './MapToolbar'

import { mutateLocal } from '../../../data/local'
import {
  selectDashboardLockedLayout,
  selectSync,
} from '../../../data/selectors'
import { chartType } from '../../../utils/enums'

import { Select, HeaderSelectWrapper } from '../../compound'

import { includesPath } from '../../../utils'

const style = {
  display: 'flex',
  flexWrap: 'nowrap',
  pb: 0.75,
  width: (theme) => `calc(100% - ${theme.spacing(6)})`,
  '>:first-child': { ml: 0 },
}

const ChartToolbar = ({ chartObj, index, path }) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const handleSelectVizType = useCallback(
    (value) => {
      dispatch(
        mutateLocal({
          path,
          value: R.pipe(
            R.assoc('type', value),
            // If we switch to globalOutputs and an unsupported plot
            // is selected, we change to a table
            R.when(
              R.both(
                R.always(R.equals('globalOutputs')(value)),
                R.pipe(
                  R.prop('chart'),
                  R.includes(R.__, [
                    chartType.BAR,
                    chartType.LINE,
                    chartType.TABLE,
                  ]),
                  R.not
                )
              ),
              R.assoc('chart', 'Table')
            )
          )(chartObj),
          sync: !includesPath(R.values(sync), path),
        })
      )
    },
    [dispatch, sync, chartObj, path]
  )

  return (
    <Grid
      sx={[
        style,
        (lockedLayout || chartObj.lockedLayout) && {
          width: '100%',
          '>:last-child': { mr: 0 },
        },
      ]}
    >
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('groupedOutputs', 'type')(chartObj)}
          optionsList={[
            {
              label: 'Grouped Outputs',
              value: 'groupedOutputs',
              iconName: 'md/MdMultilineChart',
            },
            {
              label: 'Global Outputs',
              value: 'globalOutputs',
              iconName: 'md/MdSpeed',
            },
            {
              label: 'Maps',
              value: 'maps',
              iconName: 'fa/FaMapMarked',
            },
          ]}
          onSelect={handleSelectVizType}
        />
      </HeaderSelectWrapper>

      {R.propOr('groupedOutputs', 'type', chartObj) === 'groupedOutputs' ? (
        <GroupedOutputsToolbar {...{ chartObj, index }} />
      ) : chartObj.type === 'globalOutputs' ? (
        <GlobalOutputsToolbar {...{ chartObj, index }} />
      ) : (
        <MapToolbar {...{ chartObj, index }} />
      )}
    </Grid>
  )
}

export default memo(ChartToolbar, R.equals)
