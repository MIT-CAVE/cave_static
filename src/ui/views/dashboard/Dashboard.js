/** @jsxImportSource @emotion/react */
import {
  Container,
  Grid,
  Paper,
  Fab,
  IconButton,
  ToggleButton,
  CircularProgress,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import { useState, lazy, Suspense } from 'react'
import {
  MdAddCircle,
  MdAspectRatio,
  MdMultilineChart,
  MdOutlineCancel,
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

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100%',
    maxWidth: 'initial', // Kill Container's max-width for @media >1280px
    padding: theme.spacing(1), // `0 ${theme.spacing(1)}`,
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(1, 2),
    color: theme.palette.text.secondary,
    textAlign: 'center',
    flex: '1 1 auto',
  },
  grid_chart: {
    display: 'flex',
  },
  loader: {
    marginLeft: 'auto',
    marginRight: 'auto',
    marginTop: '25%',
  },
  fab_add_empty: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    // border: `4px solid ${theme.palette.text.primary}`,
    // color: theme.palette.text.primary,
    // backgroundColor:
    //   theme.palette.mode === 'light'
    //     ? theme.palette.grey[400]
    //     : theme.palette.grey[600],
  },
  fab_add: {
    position: 'absolute',
    right: 0,
    bottom: '4px',
    // border: `4px solid ${theme.palette.text.primary}`,
    // color: theme.palette.text.primary,
    // backgroundColor:
    //   theme.palette.mode === 'light'
    //     ? theme.palette.grey[400]
    //     : theme.palette.grey[600],
  },
  add_icon: {
    // backgroundColor:
    //   theme.palette.mode === 'light'
    //     ? theme.palette.grey[400]
    //     : theme.palette.grey[600],
    marginRight: theme.spacing(1),
  },
}))

const Dashboard = () => {
  const classes = useStyles()
  const dispatch = useDispatch()

  const [maximizedIndex, setMaximizedIndex] = useState(null)

  const sync = useSelector(selectSync)
  const dashboardLayout = useSelector(selectDashboardLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const appBarId = useSelector(selectAppBarId)

  const DashboardHeader = ({ obj, index }) => {
    const path = ['appBar', 'data', appBarId, 'dashboardLayout', index]
    return (
      <Grid
        container
        wrap="nowrap"
        css={{
          minHeight: '5%',
          overflowWrap: 'anywhere',
        }}
      >
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
                    // If we switch to KPIs and a box plot
                    // is selected, we change to a table
                    R.when(
                      R.both(
                        R.always(R.equals('kpis')(value)),
                        R.pipe(
                          R.prop('chart'),
                          R.includes(R.__, ['Box Plot', 'Stacked Bar'])
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
                  <MdAspectRatio size={35} />
                </IconButton>
              ) : (
                <ToggleButton
                  selected
                  onChange={() => setMaximizedIndex(null)}
                  value=""
                >
                  <MdAspectRatio size={35} />
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
                <MdOutlineCancel size={35} />
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
        className={classes.grid_chart}
        xs={maximizedIndex != null || numDashboard === 1 ? 12 : 6}
        item
      >
        {obj != null && (
          <Paper className={classes.paper} elevation={5}>
            <DashboardHeader {...{ obj, index }} />
            {R.propOr('stats', 'type', obj) === 'stats' ? (
              obj.statistic && (
                <Suspense
                  fallback={<CircularProgress className={classes.loader} />}
                >
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

  const path = ['appBar', 'data', appBarId, 'dashboardLayout']
  return (
    <Container className={classes.root} disableGutters>
      {!isDashboardEmpty && (
        <Grid container spacing={1}>
          {R.concat(dashboardLayout)(emptyGridCells).map(dashboardItem)}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex == null && dashboardLayout.length < 4 ? (
        <Fab
          className={isDashboardEmpty ? classes.fab_add_empty : classes.fab_add}
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
            className={classes.add_icon}
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
