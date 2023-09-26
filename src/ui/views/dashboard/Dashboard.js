import { Container, Grid, Paper, Fab, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { useState, lazy, Suspense } from 'react'
import { MdAddCircle } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import DashboardHeader from './DashboardHeaderWrapper'
import DashboardKpi from './DashboardKpi'

import { mutateLocal } from '../../../data/local'
import {
  selectCurrentPage,
  selectPageLayout,
  selectDashboardLockedLayout,
  selectSync,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
  selectMapboxToken,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import Map from '../map/Map'

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
    width: (theme) => `calc(100% - ${theme.spacing(4)})`,
    px: 2,
    py: 1,
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
  addIcon: {
    mr: 1,
  },
  header: {
    minHeight: '5%',
    pb: 1.25,
  },
}

const Dashboard = () => {
  const dispatch = useDispatch()
  const mapboxToken = useSelector(selectMapboxToken)

  const [maximizedIndex, setMaximizedIndex] = useState(null)

  const sync = useSelector(selectSync)
  const pageLayout = useSelector(selectPageLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const currentPage = useSelector(selectCurrentPage)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const rightBar = useSelector(selectRightAppBarDisplay)

  const dashboardItem = (obj, index) => {
    if (maximizedIndex != null && index !== maximizedIndex) return null

    const numDashboard = R.length(pageLayout)
    return (
      <Grid
        key={index}
        sx={[
          styles.gridChart,
          {
            height:
              index === maximizedIndex || numDashboard === 1 ? '100%' : '50%',
          },
        ]}
        xs={maximizedIndex != null || numDashboard === 1 ? 12 : 6}
        item
      >
        {obj != null && (
          <Paper sx={styles.paper} elevation={5}>
            <DashboardHeader
              {...{ obj, index, maximizedIndex, setMaximizedIndex }}
            />
            {R.propOr('stats', 'type', obj) === 'stats' ? (
              obj.statistic && (
                <Suspense fallback={<CircularProgress sx={styles.loader} />}>
                  <DashboardChart {...{ obj }} />
                </Suspense>
              )
            ) : R.propOr('stats', 'type', obj) === 'maps' &&
              R.prop('mapId', obj) ? (
              <Map mapId={R.prop('mapId', obj)} {...{ mapboxToken }} />
            ) : R.propOr('stats', 'type', obj) === 'globalOutputs' ? (
              <DashboardKpi {...{ obj }} />
            ) : (
              []
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

  const isDashboardEmpty = R.isEmpty(pageLayout)
  const emptyGridCells = R.pipe(
    R.length,
    R.ifElse(R.lt(1), R.pipe(R.subtract(4), R.repeat(null)), R.always([]))
  )(pageLayout)

  const path = ['pages', 'data', currentPage, 'pageLayout']
  return (
    <Container
      maxWidth={false}
      sx={[
        styles.root,
        leftBar && rightBar
          ? { width: `calc(100vw - ${2 * APP_BAR_WIDTH + 2}px)` }
          : { width: `calc(100vw - ${APP_BAR_WIDTH + 1}px)` },
        rightBar && { mr: APP_BAR_WIDTH },
      ]}
      disableGutters
    >
      {!isDashboardEmpty && (
        <Grid container spacing={1}>
          {R.concat(pageLayout)(emptyGridCells).map(dashboardItem)}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex == null && pageLayout.length < 4 ? (
        <Fab
          sx={
            isDashboardEmpty
              ? {
                  position: 'absolute',
                  top: '50%',
                  left: rightBar ? '40%' : '50%',
                  transform: 'translate(-50%,-50%)',
                }
              : {
                  position: 'absolute',
                  right: rightBar ? `20%` : 0,
                  bottom: (theme) => theme.spacing(0.5),
                }
          }
          size={isDashboardEmpty ? 'large' : 'small'}
          variant="extended"
          onClick={() =>
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.append(dashboardDefaults)(pageLayout),
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
