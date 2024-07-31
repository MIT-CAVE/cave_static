import { Container, Paper, Fab, CircularProgress, Box } from '@mui/material'
import * as R from 'ramda'
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import ReactGridLayout from 'react-grid-layout'
import { MdAdd } from 'react-icons/md'
import { useSelector } from 'react-redux'
import { AutoSizer } from 'react-virtualized'

import ChartMenu from './ChartMenu'
import ChartToolbar from './ChartToolbar'
import DashboardGlobalOutput from './DashboardGlobalOutputs'

import {
  selectCurrentPage,
  selectPageLayout,
  selectDashboardLockedLayout,
  selectSync,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
  selectMapboxToken,
  selectShowToolbar,
  selectEditLayoutMode,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, CHART_DEFAULTS } from '../../../utils/constants'
import { useFilter, useMutateState } from '../../../utils/hooks'
import FilterModal from '../common/FilterModal'
import Map from '../map/Map'

import { includesPath } from '../../../utils'

import 'react-grid-layout/css/styles.css'
// eslint-disable-next-line import/no-extraneous-dependencies
import 'react-resizable/css/styles.css'

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
    width: (theme) => `calc(100% - ${theme.spacing(3)})`,
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
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const sync = useSelector(selectSync)

  const { filterOpen, handleOpenFilter, handleCloseFilter } = useFilter()

  const showToolbar = R.propOr(showToolbarDefault, 'showToolbar')(chartObj)
  const isMaximized = R.propOr(false, 'maximized')(chartObj)
  const defaultFilters = R.propOr([], 'filters')(chartObj)
  const vizType = R.propOr('groupedOutput', 'type')(chartObj)
  const defaultToZero = R.propOr(false, 'defaultToZero')(chartObj)
  const showNA = R.propOr(false, 'showNA')(chartObj)

  // Allow session_mutate to perform non-object value update
  const handleShowToolbar = useMutateState(
    () => ({
      path,
      value: R.assoc('showToolbar', !showToolbar)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [showToolbar, sync, chartObj, path]
  )

  const handleToggleMaximize = useMutateState(
    () => ({
      path,
      value: R.assoc('maximized', !isMaximized)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [chartObj, isMaximized, path, sync]
  )

  const handleRemoveChart = useMutateState(
    () => ({
      path: R.init(path),
      value: R.assoc(index, null)(pageLayout),
      sync: !includesPath(R.values(sync), R.init(path)),
    }),
    [pageLayout, sync, index, path]
  )

  const handleSaveFilters = useMutateState(
    (filters) => ({
      path,
      value: R.assoc('filters', filters)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [chartObj, path, sync]
  )

  const handleDefaultToZero = useMutateState(
    () => ({
      path,
      value: R.assoc('defaultToZero', !defaultToZero)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [chartObj, defaultToZero, path, sync]
  )

  const handleToggleShowNA = useMutateState(
    () => ({
      path,
      value: R.assoc('showNA', !showNA)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [chartObj, path, showNA, sync]
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
    <Paper
      sx={[
        styles.paper,
        isMaximized && !showToolbar && { p: 0 },
        editLayoutMode && !isMaximized && { p: 1.5, borderRadius: 5 },
      ]}
      elevation={editLayoutMode && !isMaximized ? 24 : 5}
    >
      <FilterModal
        {...{
          statFilters,
          groupingFilters,
          numActiveStatFilters,
          numGroupingFilters,
        }}
        label="Chart Data Filter"
        labelExtra={
          isMaximized
            ? null
            : `(${['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][index]} Chart)`
        }
        open={filterOpen}
        onSave={handleSaveFilters}
        onClose={handleCloseFilter}
      />
      {showToolbar && (
        <ChartToolbar
          numFilters={numActiveStatFilters + numGroupingFilters}
          showFilter={vizType === 'groupedOutput'}
          onOpenFilter={handleOpenFilter}
          {...{ chartObj, index, path }}
        />
      )}
      {!lockedLayout && !chartObj.lockedLayout && (
        <ChartMenu
          {...{ isMaximized, showToolbar }}
          onRemoveChart={handleRemoveChart}
          onToggleMaximize={handleToggleMaximize}
          onShowToolbar={handleShowToolbar}
          defaultToZero={defaultToZero}
          onToggleDefaultToZero={handleDefaultToZero}
          showNA={showNA}
          onToggleShowNA={handleToggleShowNA}
          isGroupedOutput={vizType === 'groupedOutput'}
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
  )
}

const Dashboard = () => {
  const [cursor, setCursor] = useState()
  const [layouts, setLayouts] = useState({})

  const pageLayout = useSelector(selectPageLayout)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const currentPage = useSelector(selectCurrentPage)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const rightBar = useSelector(selectRightAppBarDisplay)
  const sync = useSelector(selectSync)

  const gridLayoutDefault = useMemo(
    () =>
      R.range(0, 4).map((i) => ({
        i: `${i}`,
        x: i % 2,
        y: Math.floor(i / 2),
        h: 1,
        w: 1,
        maxH: 2,
        maxW: 2,
      })),
    []
  )

  useEffect(() => {
    setCursor(editLayoutMode ? 'grab' : 'auto')
  }, [editLayoutMode])

  useEffect(() => {
    if (R.has(currentPage)(layouts)) return
    setLayouts(R.assoc(currentPage, gridLayoutDefault))
  }, [currentPage, gridLayoutDefault, layouts])

  const layoutPath = useMemo(
    () => ['pages', 'data', currentPage, 'pageLayout'],
    [currentPage]
  )

  const maximizedIndex = useMemo(
    () => R.findIndex(R.propEq(true, 'maximized'))(pageLayout),
    [pageLayout]
  )

  const handleAddChart = useMutateState(() => {
    const index = R.pipe(
      R.findIndex(R.isNil),
      R.when(R.equals(-1), R.always(pageLayout.length))
    )(pageLayout)
    return {
      path: layoutPath,
      value: R.ifElse(
        R.pipe(R.length, R.equals(index)),
        R.append(CHART_DEFAULTS),
        R.update(index, CHART_DEFAULTS)
      )(pageLayout),
      sync: !includesPath(R.values(sync), layoutPath),
    }
  }, [pageLayout, layoutPath, sync])

  const handleResizeStop = useCallback(
    (layout) => {
      console.log({ layout })
      setLayouts(R.assoc(currentPage, layout))
    },
    [currentPage]
  )

  const swapXY = useCallback(
    (index1, index2, arr) =>
      R.pipe(
        R.adjust(index1, R.mergeLeft(R.pick(['x', 'y'])(arr[index2]))),
        R.adjust(index2, R.mergeLeft(R.pick(['x', 'y'])(arr[index1])))
      )(arr),
    []
  )

  const handleDragStop = useCallback(
    (layout, oldItem, newItem, placeholder, event, element) => {
      setCursor('grab')
      if (
        (oldItem.x === newItem.x && oldItem.y === newItem.y) ||
        element.firstChild == null // Prevent ghost-dragging of an empty grid item
      )
        return

      const index1 = R.findIndex(R.whereEq(R.pick(['x', 'y'])(oldItem)))(
        layouts[currentPage]
      )
      const index2 = R.findIndex(R.whereEq(R.pick(['x', 'y'])(newItem)))(
        layouts[currentPage]
      )

      const newLayout = swapXY(index1, index2, layouts[currentPage])
      setLayouts(R.assoc(currentPage, newLayout))
    },
    [currentPage, layouts, swapXY]
  )

  const gridLayout = useMemo(
    () => R.propOr(gridLayoutDefault, currentPage)(layouts),
    [currentPage, gridLayoutDefault, layouts]
  )

  return (
    <Container
      maxWidth={false}
      sx={[
        styles.root,
        maximizedIndex > -1 && { p: 0 },
        { p: 0 },
        leftBar && rightBar
          ? { width: `calc(100vw - ${2 * APP_BAR_WIDTH + 2}px)` }
          : { width: `calc(100vw - ${APP_BAR_WIDTH + 1}px)` },
      ]}
      disableGutters
    >
      <div style={{ flex: '1 1 auto' }}>
        <AutoSizer>
          {({ height, width }) =>
            R.isNotEmpty(pageLayout) && (
              <ReactGridLayout
                className="layout"
                {...{ width }}
                margin={maximizedIndex < 0 ? [8, 8] : [0, 0]}
                cols={2}
                maxRows={2}
                rowHeight={height / 2 - (maximizedIndex < 0 ? 12 : 0)}
                allowOverlap
                draggableCancel=".MuiButtonGroup-root .react-resizable-handle"
                onDragStart={() => {
                  setCursor('grabbing')
                }}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
              >
                {gridLayout.map((gridItem, index) => {
                  if (maximizedIndex > -1 && index !== maximizedIndex)
                    return null

                  const firstIndex = R.findIndex(
                    R.whereEq(R.pick(['x', 'y'])(gridItem))
                  )(gridLayout)
                  const chartObj =
                    index === firstIndex ? pageLayout[index] : null

                  const dataGrid =
                    maximizedIndex < 0
                      ? R.mergeLeft({
                          isDraggable: editLayoutMode,
                          isResizable: false,
                        })(gridItem)
                      : {
                          x: 0,
                          y: 0,
                          w: 2,
                          h: 2,
                          static: true,
                        }

                  return (
                    <Box
                      key={`${index}`}
                      display="flex"
                      data-grid={dataGrid}
                      sx={{
                        cursor: `${cursor} !important`,
                      }}
                    >
                      {chartObj != null && (
                        <DashboardItem
                          {...{ chartObj, index }}
                          path={[...layoutPath, index]}
                        />
                      )}
                    </Box>
                  )
                })}
              </ReactGridLayout>
            )
          }
        </AutoSizer>
      </div>
      {!lockedLayout &&
        maximizedIndex < 0 &&
        R.count(R.isNotNil)(pageLayout) < 4 && (
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
