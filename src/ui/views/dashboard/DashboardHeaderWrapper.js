import { Grid, IconButton, ToggleButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import {
  MdFullscreen,
  MdFullscreenExit,
  MdOutlineCancelPresentation,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { KpiHeader, StatisticsHeader, MapHeader } from './DashboardHeaders'

import { mutateLocal } from '../../../data/local'
import {
  selectAppBarId,
  selectpageLayout,
  selectDashboardLockedLayout,
  selectSync,
} from '../../../data/selectors'

import { Select, HeaderSelectWrapper } from '../../compound'

import { includesPath } from '../../../utils'

const styles = {
  header: {
    minHeight: '5%',
    pb: 1.25,
  },
}

const DashboardHeader = ({ obj, index, maximizedIndex, setMaximizedIndex }) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const pageLayout = useSelector(selectpageLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const appBarId = useSelector(selectAppBarId)

  const path = ['pages', 'data', appBarId, 'pageLayout', index]
  return (
    <Grid container wrap="nowrap" sx={styles.header}>
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('groupedOutputs', 'type', obj)}
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
          onSelect={(value) =>
            dispatch(
              mutateLocal({
                sync: !includesPath(R.values(sync), path),
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
                )(obj),
              })
            )
          }
        />
      </HeaderSelectWrapper>
      {R.propOr('groupedOutputs', 'type', obj) === 'groupedOutputs' ? (
        <StatisticsHeader obj={obj} index={index} />
      ) : R.prop('type', obj) === 'globalOutputs' ? (
        <KpiHeader obj={obj} index={index} />
      ) : (
        <MapHeader obj={obj} index={index} />
      )}

      <Grid
        item
        xs
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
      >
        {pageLayout.length > 1 && (
          <Grid item>
            {maximizedIndex == null ? (
              <IconButton onClick={() => setMaximizedIndex(index)}>
                <MdFullscreen size={35} />
              </IconButton>
            ) : (
              <ToggleButton
                selected
                onChange={() => setMaximizedIndex(null)}
                value=""
              >
                <MdFullscreenExit size={35} />
              </ToggleButton>
            )}
          </Grid>
        )}
        {!lockedLayout && (
          <Grid item>
            <IconButton
              onClick={() => {
                dispatch(
                  mutateLocal({
                    value: R.remove(index, 1)(pageLayout),
                    path: R.init(path),
                    sync: !includesPath(R.values(sync), R.init(path)),
                  })
                )
                setMaximizedIndex(null)
              }}
              size="large"
            >
              <MdOutlineCancelPresentation size={35} />
            </IconButton>
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}

export default memo(DashboardHeader, R.equals)
