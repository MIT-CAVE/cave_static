import { Grid, IconButton, ToggleButton } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import {
  MdFullscreen,
  MdFullscreenExit,
  MdOutlineCancelPresentation,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { KpiHeader, StatisticsHeader } from './DashboardHeaders'

import { mutateLocal } from '../../../data/local'
import {
  selectAppBarId,
  selectDashboardLayout,
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
  const dashboardLayout = useSelector(selectDashboardLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const appBarId = useSelector(selectAppBarId)

  const path = ['dashboards', 'data', appBarId, 'dashboardLayout', index]
  return (
    <Grid container wrap="nowrap" sx={styles.header}>
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('stats', 'type', obj)}
          optionsList={[
            {
              label: 'Statistics',
              value: 'stats',
              iconName: 'MdMultilineChart',
            },
            {
              label: 'KPIs',
              value: 'kpis',
              iconName: 'MdSpeed',
            },
          ]}
          onSelect={(value) =>
            dispatch(
              mutateLocal({
                sync: !includesPath(R.values(sync), path),
                path,
                value: R.pipe(
                  R.assoc('type', value),
                  // If we switch to KPIs and an unsupported plot
                  // is selected, we change to a table
                  R.when(
                    R.both(
                      R.always(R.equals('kpis')(value)),
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
      {R.propOr('stats', 'type', obj) === 'stats' ? (
        <StatisticsHeader obj={obj} index={index} />
      ) : (
        <KpiHeader obj={obj} index={index} />
      )}

      <Grid
        item
        xs
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
      >
        {dashboardLayout.length > 1 && (
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
                    value: R.remove(index, 1)(dashboardLayout),
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
