import { Grid } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import GlobalOutputsToolbar from './GlobalOutputsToolbar'
import GroupedOutputsToolbar from './GroupedOutputsToolbar'
import MapToolbar from './MapToolbar'
import TopRightActions from './TopRightActions'

import { mutateLocal } from '../../../data/local'
import { selectCurrentPage, selectSync } from '../../../data/selectors'

import { Select, HeaderSelectWrapper } from '../../compound'

import { includesPath } from '../../../utils'

const styles = {
  overlay: {
    width: 'auto',
    position: 'absolute',
    p: 0.5,
    top: '12px',
    right: 0,
    zIndex: 1,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'nowrap',
    pb: 0.75,
    width: (theme) => `calc(100% - ${theme.spacing(10)})`,
    '>:first-child': { ml: 0 },
  },
}

const Toolbar = ({ view, viewIndex }) => {
  const sync = useSelector(selectSync)
  const currentPage = useSelector(selectCurrentPage)
  const dispatch = useDispatch()

  const path = ['pages', 'data', currentPage, 'pageLayout', viewIndex]

  const handleSelectViewType = (value) => {
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
                R.includes(R.__, ['Bar', 'Line', 'Table']),
                R.not
              )
            ),
            R.assoc('chart', 'Table')
          )
        )(view),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }

  return (
    <Grid sx={styles.toolbar}>
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

const ViewActions = ({ obj, view, viewIndex, ...topRightActionProps }) => (
  <>
    {(topRightActionProps.showAllToolbars ||
      (topRightActionProps.showToolbar &&
        !topRightActionProps.hideAllToolbars)) && (
      <Toolbar {...{ obj, view, viewIndex, ...topRightActionProps }} />
    )}
    <TopRightActions sx={styles.overlay} {...topRightActionProps} />
  </>
)

export default memo(ViewActions, R.equals)
