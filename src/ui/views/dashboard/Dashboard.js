import { Container, Grid, Paper, Fab, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { lazy, Suspense, useCallback, useMemo } from 'react'
import { MdAdd } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import DashboardKpi from './DashboardKpi'
import ViewMenu from './ViewMenu'
import ViewToolbar from './ViewToolbar'

import { mutateLocal } from '../../../data/local'
import {
  selectCurrentPage,
  selectPageLayout,
  selectDashboardLockedLayout,
  selectSync,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
  selectMapboxToken,
  selectShowToolbar,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, VIEW_DEFAULTS } from '../../../utils/constants'
import Map from '../map/Map'

import { includesPath } from '../../../utils'

const DashboardChart = lazy(() => import('./DashboardChart'))

const styles = {
  root: {
    display: 'flex',
    position: 'relative',
    height: '100%',
    m: 0,
    p: 1,
    color: 'text.primary',
    bgcolor: 'background.paper',
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    width: (theme) => `calc(100% - ${theme.spacing(4)})`,
    p: 0.5,
    color: 'text.secondary',
    textAlign: 'center',
    flex: '1 1 auto',
  },
  loader: {
    mx: 'auto',
    mt: '25%',
  },
  addView: {
    position: 'absolute',
    right: '4px',
    bottom: '4px',
  },
}

const DashboardItem = ({ view, viewIndex, viewPath, sx }) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const mapboxToken = useSelector(selectMapboxToken)
  const pageLayout = useSelector(selectPageLayout)
  const showToolbarDefault = useSelector(selectShowToolbar)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const showToolbar = R.propOr(showToolbarDefault, 'showToolbar')(view)
  const isMaximized = R.propOr(false, 'maximized')(view)

  // Allow session_mutate to perform non-object value update
  const handleShowToolbar = useCallback(() => {
    dispatch(
      mutateLocal({
        path: viewPath,
        value: R.assoc('showToolbar', !showToolbar)(view),
        sync: !includesPath(R.values(sync), viewPath),
      })
    )
  }, [dispatch, showToolbar, sync, view, viewPath])

  const handleToggleMaximize = useCallback(() => {
    dispatch(
      mutateLocal({
        path: viewPath,
        value: R.assoc('maximized', !isMaximized)(view),
        sync: !includesPath(R.values(sync), viewPath),
      })
    )
  }, [dispatch, isMaximized, sync, view, viewPath])

  const handleRemoveView = useCallback(() => {
    dispatch(
      mutateLocal({
        path: R.init(viewPath),
        value: R.remove(viewIndex, 1)(pageLayout),
        sync: !includesPath(R.values(sync), R.init(viewPath)),
      })
    )
  }, [dispatch, pageLayout, sync, viewIndex, viewPath])

  const viewType = R.propOr('stats', 'type')(view)
  return (
    <Grid item container xs={isMaximized ? 12 : 6} {...{ sx }}>
      {view != null && (
        <Paper
          sx={[styles.paper, isMaximized && !showToolbar && { p: 0 }]}
          elevation={5}
        >
          {showToolbar && <ViewToolbar {...{ view, viewIndex, viewPath }} />}
          {!lockedLayout && (
            <ViewMenu
              {...{
                isMaximized,
                showToolbar,
              }}
              onRemoveView={handleRemoveView}
              onToggleMaximize={handleToggleMaximize}
              onShowToolbar={handleShowToolbar}
            />
          )}
          {viewType === 'stats' ? (
            view.statistic && (
              <Suspense fallback={<CircularProgress sx={styles.loader} />}>
                <DashboardChart {...{ view }} />
              </Suspense>
            )
          ) : viewType === 'maps' && view.mapId ? (
            <Map mapId={view.mapId} {...{ mapboxToken }} />
          ) : viewType === 'globalOutputs' ? (
            <DashboardKpi {...{ view }} />
          ) : null}
        </Paper>
      )}
    </Grid>
  )
}

const Dashboard = () => {
  const pageLayout = useSelector(selectPageLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const currentPage = useSelector(selectCurrentPage)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const rightBar = useSelector(selectRightAppBarDisplay)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const path = useMemo(
    () => ['pages', 'data', currentPage, 'pageLayout'],
    [currentPage]
  )

  const maximizedIndex = useMemo(
    () => R.findIndex(R.propEq(true)('maximized'))(pageLayout),
    [pageLayout]
  )

  const handleAddView = useCallback(() => {
    dispatch(
      mutateLocal({
        path,
        value: R.append(VIEW_DEFAULTS)(pageLayout),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }, [dispatch, pageLayout, path, sync])

  const emptyGridCells = R.pipe(
    R.length,
    R.ifElse(R.lt(1), R.pipe(R.subtract(4), R.repeat(null)), R.always([]))
  )(pageLayout)
  return (
    <Container
      maxWidth={false}
      sx={[
        styles.root,
        maximizedIndex > -1 && { p: 0 },
        leftBar && rightBar
          ? { width: `calc(100vw - ${2 * APP_BAR_WIDTH + 2}px)` }
          : { width: `calc(100vw - ${APP_BAR_WIDTH + 1}px)` },
      ]}
      disableGutters
    >
      {!R.isEmpty(pageLayout) && (
        <Grid container spacing={1}>
          {R.concat(pageLayout)(emptyGridCells).map((view, index) => {
            if (maximizedIndex > -1 && index !== maximizedIndex) return null
            return (
              <DashboardItem
                key={index}
                {...{ view }}
                viewIndex={index}
                viewPath={[...path, index]}
                sx={{
                  height: index === maximizedIndex ? '100%' : '50%',
                }}
              />
            )
          })}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex < 0 && pageLayout.length < 4 && (
        <Fab
          color="primary"
          variant="extended"
          sx={styles.addView}
          onClick={handleAddView}
        >
          <MdAdd size={24} style={{ marginRight: '4px' }} />
          Add View
        </Fab>
      )}
    </Container>
  )
}

export default Dashboard
