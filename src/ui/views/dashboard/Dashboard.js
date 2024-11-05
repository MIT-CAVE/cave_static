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
import AutoSizer from 'react-virtualized-auto-sizer'

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
  selectCharts,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, CHART_DEFAULTS } from '../../../utils/constants'
import { useModal, useMutateState } from '../../../utils/hooks'
import FilterModal from '../common/FilterModal'
import Map from '../map/Map'

import { getFreeName, includesPath } from '../../../utils'

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
  const charts = useSelector(selectCharts)
  const pageLayout = useSelector(selectPageLayout)
  const showToolbarDefault = useSelector(selectShowToolbar)
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const sync = useSelector(selectSync)

  const { modalOpen, handleOpenModal, handleCloseModal } = useModal()

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

  const handleRemoveChart = useMutateState(() => {
    const delIndex = R.pipe(R.findIndex(R.equals(index)))(pageLayout)
    const pagePath = R.init(R.init(path))
    return {
      path: pagePath,
      value: {
        charts: R.assoc(index, null)(charts),
        pageLayout: R.update(delIndex, null, pageLayout),
        lockedLayout,
      },
      sync: !includesPath(R.values(sync), pagePath),
    }
  }, [charts, sync, index, path])

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

  const labelExtra = useMemo(() => {
    if (isMaximized) return
    const chartIndex = pageLayout.indexOf(index)
    return `(${['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][chartIndex]} Chart)`
  }, [index, isMaximized, pageLayout])

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
          labelExtra,
        }}
        label="Chart Data Filter"
        open={modalOpen}
        onSave={handleSaveFilters}
        onClose={handleCloseModal}
      />
      {showToolbar && (
        <ChartToolbar
          numFilters={numActiveStatFilters + numGroupingFilters}
          showFilter={vizType === 'groupedOutput'}
          onOpenFilter={handleOpenModal}
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

  const pageLayout = useSelector(selectPageLayout)
  const charts = useSelector(selectCharts)
  const lockedLayout = useSelector(selectDashboardLockedLayout)
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const currentPage = useSelector(selectCurrentPage)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const rightBar = useSelector(selectRightAppBarDisplay)
  const sync = useSelector(selectSync)

  useEffect(() => {
    setCursor(editLayoutMode ? 'grab' : 'auto')
  }, [editLayoutMode])

  const pagePath = ['pages', 'data', currentPage]
  const layoutPath = [...pagePath, 'pageLayout']
  const chartsPath = [...pagePath, 'charts']

  const maximizedChart = useMemo(
    () =>
      R.pipe(
        R.toPairs,
        R.find(R.pathOr(false, [1, 'maximized'])),
        R.propOr(null, 0)
      )(charts),
    [charts]
  )

  const handleAddChart = useMutateState(() => {
    const name = getFreeName('chart', R.keys(charts))
    const index = R.pipe(R.findIndex(R.isNil))(pageLayout)

    return {
      path: pagePath,
      value: R.pipe(
        R.assocPath(['charts', name], CHART_DEFAULTS),
        R.assocPath(['pageLayout', index], name)
      )({
        charts,
        pageLayout,
        lockedLayout,
      }),
      sync: !includesPath(R.values(sync), pagePath),
    }
  }, [pageLayout, pagePath, sync, charts, lockedLayout, CHART_DEFAULTS])

  const handleUpdateLayout = useMutateState(
    (layout) => {
      return {
        path: layoutPath,
        value: layout,
        sync: !includesPath(R.values(sync), layoutPath),
      }
    },
    [layoutPath, sync]
  )

  const translateLayoutToGrid = useCallback((layout) => {
    const grid = []
    const lineLength = layout.length === 9 ? 3 : 2
    for (let i = 0; i < layout.length; i++) {
      if (layout[i] === 'left') grid[grid.length - 1].w += 1
      else if (layout[i] === 'up') grid[i - lineLength].h += 1
      else {
        const x = i % lineLength
        const y = Math.floor(i / lineLength)
        grid.push({
          i: layout[i],
          x,
          y,
          w: 1,
          h: 1,
        })
      }
    }
    return grid
  }, [])

  const handleResizeStop = useCallback(
    (grid) => {
      const lineLength = pageLayout.length === 9 ? 3 : 2
      const oldGrid = translateLayoutToGrid(pageLayout)
      const changedItem = R.find((item) =>
        R.none(
          (item2) =>
            item.x === item2.x &&
            item.y === item2.y &&
            item.h === item2.h &&
            item.w === item2.w,
          oldGrid
        )
      )(grid)
      if (changedItem == null) return

      const changedIndex = changedItem.x + changedItem.y * lineLength

      const layoutWithChangedItem = R.update(
        changedIndex,
        changedItem.i,
        pageLayout
      )
      // item height increased
      if (changedItem.h === 2) {
        handleUpdateLayout(
          R.update(changedIndex + lineLength, 'up', layoutWithChangedItem)
        )
        // item width increased
      } else if (changedItem.w === 2) {
        handleUpdateLayout(
          R.update(changedIndex + 1, 'left', layoutWithChangedItem)
        )
        // item shrunk - figure out where to set null
      } else {
        // discover whether the shrink is in x or y
        const isY = R.none(
          (item) => item.x === changedItem.x && item.i !== changedItem.i
        )(grid)
        if (isY) {
          if (layoutWithChangedItem[changedIndex + lineLength] === 'up') {
            handleUpdateLayout(
              R.update(changedIndex + lineLength, null, layoutWithChangedItem)
            )
          } else {
            handleUpdateLayout(
              R.update(changedIndex - lineLength, null, layoutWithChangedItem)
            )
          }
        } else {
          if (layoutWithChangedItem[changedIndex + 1] === 'left') {
            handleUpdateLayout(
              R.update(changedIndex + 1, null, layoutWithChangedItem)
            )
          } else {
            handleUpdateLayout(
              R.update(changedIndex - 1, null, layoutWithChangedItem)
            )
          }
        }
      }
    },
    [handleUpdateLayout, pageLayout, translateLayoutToGrid]
  )

  const handleDragStop = useCallback(
    (layout, oldPos, newPos, placeholder, event, element) => {
      setCursor('grab')
      if (
        (oldPos.x === newPos.x && oldPos.y === newPos.y) ||
        element.firstChild == null // Prevent ghost-dragging of an empty grid item
      )
        return
      const gridLength = pageLayout.length === 9 ? 3 : 2
      const oldPosIndex = oldPos.x + oldPos.y * gridLength
      const newPosIndex = newPos.x + newPos.y * gridLength

      const oldItem = translateLayoutToGrid(pageLayout)[newPosIndex]
      // check if either of the items being resized are > 1x1

      const needsResize =
        R.isNil(oldItem) ||
        newPos.h !== oldItem.h ||
        newPos.w !== oldItem.w ||
        pageLayout[newPosIndex] === 'left' ||
        pageLayout[newPosIndex] === 'up'

      const newLayout = R.pipe(
        R.swap(oldPosIndex, newPosIndex),
        needsResize
          ? R.map((item) => {
              if (item === 'left' || item === 'up') return null
              return item
            })
          : R.identity
      )(pageLayout)
      handleUpdateLayout(newLayout)
    },
    [handleUpdateLayout, pageLayout, translateLayoutToGrid]
  )

  const findResizeHandles = (chartObj, gridItem, index, gridLayout) => {
    if (
      chartObj == null ||
      gridItem == null ||
      index == null ||
      gridLayout == null ||
      !editLayoutMode
    )
      return []
    if (chartObj.maximized) return []
    const { x, y, w, h } = gridItem
    const gridSize = pageLayout.length === 9 ? 3 : 2
    // can always shrink if larger than 1x1
    if (gridSize === 2 && (w >= 2 || h >= 2))
      return h === 2 ? ['s', 'n'] : ['e', 'w']
    // find empty blocks by checking if they are defined in pageLayout
    const blanks = R.pipe(
      R.filter((item) => R.isNil(item.i)),
      R.values
    )(gridLayout)
    const resizeHandles = []
    if (R.any((item) => y === item.y && item.x === 1, blanks))
      resizeHandles.push('e')
    if (R.any((item) => x === item.x && item.y === 1, blanks))
      resizeHandles.push('s')
    if (R.any((item) => y === item.y && item.x === 0, blanks))
      resizeHandles.push('w')
    if (R.any((item) => x === item.x && item.y === 0, blanks))
      resizeHandles.push('n')
    return resizeHandles
  }

  return (
    <Container
      maxWidth={false}
      sx={[
        styles.root,
        R.isNotNil(maximizedChart) && { p: 0 },
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
                margin={R.isNil(maximizedChart) ? [8, 8] : [0, 0]}
                cols={2}
                maxRows={2}
                layout={translateLayoutToGrid(pageLayout)}
                rowHeight={height / 2 - (R.isNil(maximizedChart) ? 12 : 0)}
                allowOverlap
                draggableCancel=".MuiSelect-select, .MuiButtonBase-root, div:has(> div.mapboxgl-map)"
                onDragStart={() => {
                  setCursor('grabbing')
                }}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
              >
                {translateLayoutToGrid(pageLayout).map((gridItem) => {
                  if (
                    R.isNotNil(maximizedChart) &&
                    gridItem.i !== maximizedChart
                  )
                    return null
                  const index = gridItem.i
                  const chartObj = charts[index]

                  const dataGrid = R.isNil(maximizedChart)
                    ? gridItem
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
                      data-grid={R.mergeLeft({
                        isDraggable: chartObj != null && editLayoutMode,
                        isResizable: chartObj != null && editLayoutMode,
                        resizeHandles: findResizeHandles(
                          chartObj,
                          gridItem,
                          index,
                          translateLayoutToGrid(pageLayout)
                        ),
                      })(dataGrid)}
                      sx={{
                        cursor: `${cursor} !important`,
                      }}
                    >
                      {chartObj != null && (
                        <DashboardItem
                          {...{ chartObj, index }}
                          path={[...chartsPath, index]}
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
        R.isNil(maximizedChart) &&
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
