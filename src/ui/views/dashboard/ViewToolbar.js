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

const ViewToolbar = ({ view, viewIndex, viewPath }) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const handleSelectViewType = useCallback(
    (value) => {
      dispatch(
        mutateLocal({
          path: viewPath,
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
          )(view),
          sync: !includesPath(R.values(sync), viewPath),
        })
      )
    },
    [dispatch, sync, view, viewPath]
  )

  return (
    <Grid
      sx={[style, lockedLayout && { width: '100%', '>:last-child': { mr: 0 } }]}
    >
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('groupedOutputs', 'type')(view)}
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
          onSelect={handleSelectViewType}
        />
      </HeaderSelectWrapper>

      {R.propOr('groupedOutputs', 'type', view) === 'groupedOutputs' ? (
        <GroupedOutputsToolbar {...{ view }} index={viewIndex} />
      ) : view.type === 'globalOutputs' ? (
        <GlobalOutputsToolbar {...{ view }} index={viewIndex} />
      ) : (
        <MapToolbar {...{ view }} index={viewIndex} />
      )}
    </Grid>
  )
}

export default memo(ViewToolbar, R.equals)
