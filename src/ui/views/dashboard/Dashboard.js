import { Container, Grid, Paper, Fab, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { useState, lazy, Suspense, useCallback, useMemo } from 'react'
import { MdAdd } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import DashboardKpi from './DashboardKpi'
import ViewActions from './ViewActions'

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

const DashboardItem = ({
  view,
  viewIndex,
  maximizedIndex,
  isSingleView,
  showAllToolbars,
  hideAllToolbars,
  onHideAllToolbars,
  onRemoveView,
  onShowAllToolbars,
  onToggleMaximize,
  ...props
}) => {
  const [showToolbar, setShowToolbar] = useState(true)

  const mapboxToken = useSelector(selectMapboxToken)

  const handleShowToolbar = useCallback(() => {
    setShowToolbar(!showToolbar)
  }, [showToolbar])

  const viewType = R.propOr('stats', 'type')(view)
  return (
    <Grid
      item
      container
      xs={maximizedIndex != null || isSingleView ? 12 : 6}
      {...props}
    >
      {view != null && (
        <Paper
          sx={[
            styles.paper,
            maximizedIndex != null &&
              (hideAllToolbars || !(showToolbar || showAllToolbars)) && {
                p: 0,
              },
          ]}
          elevation={5}
        >
          <ViewActions
            {...{
              view,
              showToolbar,
              onToggleMaximize,
              onRemoveView,
              viewIndex,
              showAllToolbars,
              hideAllToolbars,
              onShowAllToolbars,
              onHideAllToolbars,
            }}
            isMaximized={viewIndex != null && viewIndex === maximizedIndex}
            onShowToolbar={handleShowToolbar}
          />
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
  const [showAllToolbars, setShowAllToolbars] = useState(false)
  const [hideAllToolbars, setHideAllToolbars] = useState(false)
  const [maximizedIndex, setMaximizedIndex] = useState(null)

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

  const handleShowAllToolbars = useCallback(() => {
    setShowAllToolbars(!showAllToolbars)
    setHideAllToolbars(false)
  }, [showAllToolbars])

  const handleHideAllToolbars = useCallback(() => {
    setHideAllToolbars(!hideAllToolbars)
    setShowAllToolbars(false)
  }, [hideAllToolbars])

  const handleRemoveViewFn = useCallback(
    (index) => () => {
      dispatch(
        mutateLocal({
          path,
          value: R.remove(index, 1)(pageLayout),
          sync: !includesPath(R.values(sync), path),
        })
      )
      setMaximizedIndex(null)
    },
    [dispatch, pageLayout, path, sync]
  )
  const handleToggleMaximizeFn = useCallback(
    (index) => () => {
      setMaximizedIndex(index === maximizedIndex ? null : index)
    },
    [maximizedIndex]
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
        maximizedIndex != null && { p: 0 },
        leftBar && rightBar
          ? { width: `calc(100vw - ${2 * APP_BAR_WIDTH + 2}px)` }
          : { width: `calc(100vw - ${APP_BAR_WIDTH + 1}px)` },
      ]}
      disableGutters
    >
      {!R.isEmpty(pageLayout) && (
        <Grid container spacing={1}>
          {R.concat(pageLayout)(emptyGridCells).map((view, index) => {
            if (maximizedIndex != null && index !== maximizedIndex) return null
            return (
              <DashboardItem
                key={index}
                viewIndex={index}
                {...{
                  view,
                  maximizedIndex,
                  showAllToolbars,
                  hideAllToolbars,
                }}
                onShowAllToolbars={handleShowAllToolbars}
                onHideAllToolbars={handleHideAllToolbars}
                onToggleMaximize={handleToggleMaximizeFn(index)}
                onRemoveView={handleRemoveViewFn(index)}
                sx={{
                  height:
                    index === maximizedIndex || R.length(pageLayout) === 1
                      ? '100%'
                      : '50%',
                }}
              />
            )
          })}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex == null && pageLayout.length < 4 && (
        <Fab
          color="secondary"
          size="large"
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
