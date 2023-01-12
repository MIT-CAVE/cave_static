import {
  Container,
  Grid,
  Paper,
  Fab,
  IconButton,
  ToggleButton,
  CircularProgress,
} from '@mui/material'
import * as R from 'ramda'
import { useState, lazy, Suspense } from 'react'
import {
  MdAddCircle,
  MdFullscreen,
  MdFullscreenExit,
  MdMultilineChart,
  MdOutlineCancelPresentation,
  MdSpeed,
} from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { KpiHeader, StatisticsHeader } from './DashboardHeaders'
import DashboardKpi from './DashboardKpi'

import { mutateLocal } from '../../../data/local'
import {
  selectAppBarId,
  selectDashboardLayout,
  selectDashboardLockedLayout,
  selectSync,
} from '../../../data/selectors'

import { Select, HeaderSelectWrapper } from '../../compound'

import { includesPath } from '../../../utils'

const DashboardChart = lazy(() => import('./DashboardChart'))

const styles = {
  root: {
    display: 'flex',
    height: '100%',
    p: 1,
    color: 'text.primary',
    bgcolor: 'background.paper',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    p: (theme) => theme.spacing(1, 2),
    color: 'text.secondary',
    textAlign: 'center',
    flex: '1 1 auto',
  },
  gridChart: {
    display: 'flex',
  },
  loader: {
    ml: 'auto',
    mr: 'auto',
    mt: '25%',
  },
  fabAddEmpty: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
  },
  fabAdd: {
    position: 'absolute',
    right: 0,
    bottom: (theme) => theme.spacing(0.5),
  },
  addIcon: {
    mr: 1,
  },
  header: {
    minHeight: '5%',
    overflowWrap: 'anywhere',
    pb: 1.25,
  },
}

const Dashboard = () => {
  const dispatch = useDispatch()

  const [maximizedIndex, setMaximizedIndex] = useState(null)

  const sync = useSelector(selectSync)
  const dashboardLayout = useSelector(selectDashboardLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const appBarId = useSelector(selectAppBarId)

  const DashboardHeader = ({ obj, index }) => {
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
                iconClass: MdMultilineChart,
              },
              {
                label: 'KPIs',
                value: 'kpis',
                iconClass: MdSpeed,
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
                          R.includes(R.__, [
                            'Box Plot',
                            'Stacked Bar',
                            'Waterfall',
                            'Stacked Waterfall',
                          ])
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

        <Grid xs display="flex" justifyContent="flex-end" alignItems="center">
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

  const dashboardItem = (obj, index) => {
    if (maximizedIndex != null && index !== maximizedIndex) return null

    const numDashboard = R.length(dashboardLayout)
    return (
      <Grid
        key={index}
        sx={styles.gridChart}
        xs={maximizedIndex != null || numDashboard === 1 ? 12 : 6}
        item
      >
        {obj != null && (
          <Paper sx={styles.paper} elevation={5}>
            <DashboardHeader {...{ obj, index }} />
            {R.propOr('stats', 'type', obj) === 'stats' ? (
              obj.statistic && (
                <Suspense fallback={<CircularProgress sx={styles.loader} />}>
                  <DashboardChart obj={obj} length={dashboardLayout.length} />
                </Suspense>
              )
            ) : (
              <DashboardKpi obj={obj} length={dashboardLayout.length} />
            )}
          </Paper>
        )}
      </Grid>
    )
  }

  const dashboardDefaults = {
    chart: 'Bar',
    grouping: 'Sum',
  }

  const isDashboardEmpty = R.isEmpty(dashboardLayout)
  const emptyGridCells = R.pipe(
    R.length,
    R.ifElse(R.lt(1), R.pipe(R.subtract(4), R.repeat(null)), R.always([]))
  )(dashboardLayout)

  const path = ['dashboard', 'data', appBarId, 'dashboardLayout']
  return (
    <Container maxWidth={false} sx={styles.root} disableGutters>
      {!isDashboardEmpty && (
        <Grid container spacing={1}>
          {R.concat(dashboardLayout)(emptyGridCells).map(dashboardItem)}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex == null && dashboardLayout.length < 4 ? (
        <Fab
          sx={isDashboardEmpty ? styles.fabAddEmpty : styles.fabAdd}
          size={isDashboardEmpty ? 'large' : 'small'}
          variant="extended"
          onClick={() =>
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.append(dashboardDefaults)(dashboardLayout),
              })
            )
          }
        >
          <MdAddCircle
            sx={styles.addIcon}
            fontSize={isDashboardEmpty ? 'medium' : 'small'}
          />
          Add chart
        </Fab>
      ) : (
        []
      )}
    </Container>
  )
}

export default Dashboard
