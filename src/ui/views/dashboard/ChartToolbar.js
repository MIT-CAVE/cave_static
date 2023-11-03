import { Grid } from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import ChartDropdownWrapper from './ChartDropdownWrapper'
import GlobalOutputsToolbar from './GlobalOutputsToolbar'
import GroupedOutputsToolbar from './GroupedOutputsToolbar'
import MapToolbar from './MapToolbar'

import { mutateLocal } from '../../../data/local'
import {
  selectDashboardLockedLayout,
  selectSync,
} from '../../../data/selectors'
import { chartVariant } from '../../../utils/enums'

import { Select } from '../../compound'

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
            // If we switch to globalOutput and an unsupported plot
            // is selected, we change to a table
            R.when(
              R.both(
                R.always(R.equals('globalOutput')(value)),
                R.pipe(
                  R.prop('variant'),
                  R.includes(R.__, [
                    chartVariant.BAR,
                    chartVariant.LINE,
                    chartVariant.TABLE,
                  ]),
                  R.not
                )
              ),
              R.assoc('variant', 'Table')
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
      <ChartDropdownWrapper
        menuProps={{
          transformOrigin: { horizontal: 'left', vertical: 'top' },
          anchorOrigin: { horizontal: 'left', vertical: 'bottom' },
        }}
      >
        <Select
          value={R.propOr('groupedOutput', 'type')(chartObj)}
          optionsList={[
            {
              label: 'Grouped Outputs',
              value: 'groupedOutput',
              iconName: 'md/MdMultilineChart',
            },
            {
              label: 'Global Outputs',
              value: 'globalOutput',
              iconName: 'md/MdSpeed',
            },
            {
              label: 'Maps',
              value: 'map',
              iconName: 'fa/FaMapMarked',
            },
          ]}
          onSelect={handleSelectVizType}
        />
      </ChartDropdownWrapper>

      {R.propOr('groupedOutput', 'type', chartObj) === 'groupedOutput' ? (
        <GroupedOutputsToolbar {...{ chartObj, index }} />
      ) : chartObj.type === 'globalOutput' ? (
        <GlobalOutputsToolbar {...{ chartObj, index }} />
      ) : (
        <MapToolbar {...{ chartObj, index }} />
      )}
    </Grid>
  )
}

export default memo(ChartToolbar, R.equals)
