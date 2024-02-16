import { Container, Grid, Paper, Fab, CircularProgress } from '@mui/material'
import * as R from 'ramda'
import { lazy, Suspense, useCallback, useMemo } from 'react'
import { MdAdd } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import ChartMenu from './ChartMenu'
import ChartToolbar from './ChartToolbar'
import DashboardGlobalOutput from './DashboardGlobalOutputs'

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
import { APP_BAR_WIDTH, CHART_DEFAULTS } from '../../../utils/constants'
import { useFilter } from '../../../utils/hooks'
import FilterModal from '../common/FilterModal'
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
  addChart: {
    position: 'absolute',
    right: '4px',
    bottom: '4px',
  },
}

const DashboardItem = ({ chartObj, index, path }) => {
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const mapboxToken = useSelector(selectMapboxToken)
  const pageLayout = useSelector(selectPageLayout)
  const showToolbarDefault = useSelector(selectShowToolbar)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const { filterOpen, handleOpenFilter, handleCloseFilter } = useFilter()

  const showToolbar = R.propOr(showToolbarDefault, 'showToolbar')(chartObj)
  const isMaximized = R.propOr(false, 'maximized')(chartObj)
  const defaultFilters = R.propOr([], 'filters')(chartObj)
  const vizType = R.propOr('groupedOutput', 'type')(chartObj)

  // Allow session_mutate to perform non-object value update
  const handleShowToolbar = useCallback(() => {
    dispatch(
      mutateLocal({
        path,
        value: R.assoc('showToolbar', !showToolbar)(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }, [dispatch, showToolbar, sync, chartObj, path])

  const handleToggleMaximize = useCallback(() => {
    dispatch(
      mutateLocal({
        path,
        value: R.assoc('maximized', !isMaximized)(chartObj),
        sync: !includesPath(R.values(sync), path),
      })
    )
  }, [chartObj, dispatch, isMaximized, path, sync])

  const handleRemoveChart = useCallback(() => {
    dispatch(
      mutateLocal({
        path: R.init(path),
        value: R.remove(index, 1)(pageLayout),
        sync: !includesPath(R.values(sync), R.init(path)),
      })
    )
  }, [dispatch, pageLayout, sync, index, path])

  const handleSaveFilters = useCallback(
    (filters) => {
      dispatch(
        mutateLocal({
          path,
          value: R.assoc('filters', filters)(chartObj),
          sync: !includesPath(R.values(sync), path),
        })
      )
    },
    [chartObj, dispatch, path, sync]
  )

  const [statFilters, groupingFilters] = useMemo(
    () =>
      R.partition(
        R.propSatisfies(R.either(R.isNil, R.equals('stat')), 'format')
      )(defaultFilters),
    [defaultFilters]
  )

  const numActiveStatFilters = useMemo(
    () => R.count(R.propOr(true, 'active'))(statFilters),
    [statFilters]
  )

  const numGroupingFilters = useMemo(
    () =>
      R.pipe(
        R.filter(R.propEq('exc', 'option')),
        R.chain(R.pipe(R.prop('value'), R.length)),
        R.sum
      )(groupingFilters),
    [groupingFilters]
  )

  return (
    <Grid
      item
      container
      xs={isMaximized ? 12 : 6}
      height={isMaximized ? '100%' : '50%'}
    >
      {chartObj != null && (
        <Paper
          sx={[styles.paper, isMaximized && !showToolbar && { p: 0 }]}
          elevation={5}
        >
          <FilterModal
            {...{
              statFilters,
              groupingFilters,
              numActiveStatFilters,
              numGroupingFilters,
            }}
            label="Data Filter"
            labelExtra={
              isMaximized
                ? null
                : `(${R.cond([
                    [R.equals(0), R.always('Top-Left')],
                    [R.equals(1), R.always('Top-Right')],
                    [R.equals(2), R.always('Bottom-Left')],
                    [R.equals(3), R.always('Bottom-Right')],
                  ])(index)} Chart)`
            }
            open={filterOpen}
            onSave={handleSaveFilters}
            onClose={handleCloseFilter}
          />
          {showToolbar && <ChartToolbar {...{ chartObj, index, path }} />}
          {!lockedLayout && !chartObj.lockedLayout && (
            <ChartMenu
              {...{ isMaximized, showToolbar }}
              numFilters={numActiveStatFilters + numGroupingFilters}
              showFilter={vizType === 'groupedOutput'}
              onRemoveChart={handleRemoveChart}
              onToggleMaximize={handleToggleMaximize}
              onShowToolbar={handleShowToolbar}
              onOpenFilter={handleOpenFilter}
            />
          )}
          {vizType === 'groupedOutput' ? (
            chartObj.statId && (
              <Suspense fallback={<CircularProgress sx={styles.loader} />}>
                <DashboardChart {...{ chartObj }} />
              </Suspense>
            )
          ) : vizType === 'map' && chartObj.mapId ? (
            <Map mapId={chartObj.mapId} {...{ mapboxToken }} />
          ) : vizType === 'globalOutput' ? (
            <DashboardGlobalOutput {...{ chartObj }} />
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

  const layoutPath = useMemo(
    () => ['pages', 'data', currentPage, 'pageLayout'],
    [currentPage]
  )

  const maximizedIndex = useMemo(
    () => R.findIndex(R.propEq(true)('maximized'))(pageLayout),
    [pageLayout]
  )

  const handleAddChart = useCallback(() => {
    dispatch(
      mutateLocal({
        path: layoutPath,
        value: R.append(CHART_DEFAULTS)(pageLayout),
        sync: !includesPath(R.values(sync), layoutPath),
      })
    )
  }, [dispatch, pageLayout, layoutPath, sync])

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
          {R.concat(pageLayout)(emptyGridCells).map((chartObj, index) => {
            if (maximizedIndex > -1 && index !== maximizedIndex) return null
            return (
              <DashboardItem
                key={index}
                {...{ chartObj, index }}
                path={[...layoutPath, index]}
              />
            )
          })}
        </Grid>
      )}
      {!lockedLayout && maximizedIndex < 0 && pageLayout.length < 4 && (
        <Fab
          color="primary"
          variant="extended"
          sx={styles.addChart}
          onClick={handleAddChart}
        >
          <MdAdd size={24} style={{ marginRight: '4px' }} />
          Add Chart
        </Fab>
      )}
    </Container>
  )
}

export default Dashboard
