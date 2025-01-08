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
import DashboardGlobalOutput from './DashboardGlobalOutputs'

import {
  selectCurrentPage,
  selectPageLayout,
  selectDashboardLockedLayout,
  selectSync,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
  selectEditLayoutMode,
  selectCharts,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, CHART_DEFAULTS } from '../../../utils/constants'
import { useChartTools, useModal, useMutateState } from '../../../utils/hooks'
import ChartToolsModal from '../common/ChartToolsModal'
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
  const charts = useSelector(selectCharts)
  const pageLayout = useSelector(selectPageLayout)
  const editLayoutMode = useSelector(selectEditLayoutMode)
  const sync = useSelector(selectSync)

  const { modalOpen, handleOpenModal, handleCloseModal } = useModal()
  const { chartToolsOpen, handleOpenChartTools, handleCloseChartTools } =
    useChartTools()

  const isMaximized = R.propOr(false, 'maximized')(chartObj)
  const defaultFilters = R.propOr([], 'filters')(chartObj)
  const vizType = R.propOr('groupedOutput', 'type')(chartObj)
  const defaultToZero = R.propOr(false, 'defaultToZero')(chartObj)
  const showNA = R.propOr(false, 'showNA')(chartObj)
  const chartHoverOrder = R.propOr('seriesDesc', 'chartHoverOrder')(chartObj)

  // Allow session_mutate to perform non-object value update
  const handleChartHover = useMutateState(
    (event) => ({
      path,
      value: R.assoc('chartHoverOrder', event.target.value)(chartObj),
      sync: !includesPath(R.values(sync), path),
    }),
    [chartHoverOrder, sync, chartObj, path]
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
    const nameIndex = R.pipe(R.findIndex(R.equals(index)))(pageLayout)
    const findIndicies = (idx) => {
      const lineLength = pageLayout.length === 9 ? 3 : 2
      const list = [idx]
      if (pageLayout[idx + 1] === 'left') list.push(findIndicies(idx + 1))
      if (pageLayout[idx + lineLength] === 'up')
        list.push(findIndicies(idx + lineLength))
      return R.flatten(list)
    }
    const pagePath = R.init(R.init(path))
    return {
      path: pagePath,
      value: {
        charts: R.assoc(index, null)(charts),
        pageLayout: R.reduce(
          (acc, value) => R.update(value, null, acc),
          pageLayout,
          findIndicies(nameIndex)
        ),
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

  return (
    <Paper
      sx={[
        styles.paper,
        editLayoutMode && !isMaximized && { p: 1.5, borderRadius: 5 },
        (chartToolsOpen || modalOpen) && {
          outline: 'none',
          borderColor: '#9ecaed',
          boxShadow: '0 0 10px #9ecaed',
          border: '3px solid #dadada',
          borderRadius: '7px',
        },
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
        open={modalOpen}
        onSave={handleSaveFilters}
        onClose={handleCloseModal}
      />
      <ChartToolsModal
        {...{
          chartObj,
          index,
          path,
        }}
        label="Chart Tools"
        open={chartToolsOpen}
        onClose={handleCloseChartTools}
      />
      {!lockedLayout && !chartObj.lockedLayout && (
        <ChartMenu
          {...{ isMaximized, chartHoverOrder }}
          onRemoveChart={handleRemoveChart}
          onToggleMaximize={handleToggleMaximize}
          defaultToZero={defaultToZero}
          onToggleDefaultToZero={handleDefaultToZero}
          showNA={showNA}
          onToggleShowNA={handleToggleShowNA}
          isGroupedOutput={vizType === 'groupedOutput'}
          onChartHover={handleChartHover}
          numFilters={numActiveStatFilters + numGroupingFilters}
          onOpenFilter={handleOpenModal}
          onOpenChartTools={handleOpenChartTools}
        />
      )}
      {vizType === 'groupedOutput' ? (
        chartObj.stats && (
          <Suspense fallback={<CircularProgress sx={styles.loader} />}>
            <DashboardChart {...{ chartObj }} />
          </Suspense>
        )
      ) : vizType === 'map' && chartObj.mapId ? (
        <Map mapId={chartObj.mapId} />
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

  const lineLength = pageLayout.length === 9 ? 3 : 2

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
    const index = R.findIndex(R.isNil)(pageLayout)

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

  const translateLayoutToGrid = useCallback(
    (layout) => {
      const grid = []
      for (let i = 0; i < layout.length; i++) {
        if (layout[i] === 'left' || layout[i] === 'up') {
          continue
        } else {
          const x = i % lineLength
          const y = Math.floor(i / lineLength)
          grid.push({
            i: layout[i] ?? 'null',
            x,
            y,
            w: 1,
            h: 1,
          })
          let j = 1
          while (layout[i + j] === 'left') {
            grid[grid.length - 1].w += 1
            j += 1
          }
          j = 1
          while (layout[i + j * lineLength] === 'up') {
            grid[grid.length - 1].h += 1
            j += 1
          }
        }
      }
      return grid
    },
    [lineLength]
  )

  const handleResizeStop = useCallback(
    (grid) => {
      const newLayout = R.repeat(null, lineLength * lineLength)
      for (let i = 0; i < grid.length; i++) {
        const { x, y, w, h } = grid[i]
        // Skip null items
        if (R.includes(null, grid[i].i)) continue
        for (let j = 0; j < w; j++) {
          for (let k = 0; k < h; k++) {
            // set the top left cell to the name of the chart
            if (j === 0 && k === 0) newLayout[x + y * lineLength] = grid[i].i
            // set the rest of the top row to 'left'
            else if (k === 0) newLayout[x + j + y * lineLength] = 'left'
            // set the rest of the cells contained to 'up'
            else newLayout[x + j + (y + k) * lineLength] = 'up'
          }
        }
      }
      handleUpdateLayout(newLayout)
    },
    [handleUpdateLayout, lineLength]
  )

  const handleDragStop = useCallback(
    (layout, oldPos, newPos, placeholder, event, element) => {
      setCursor('grab')
      if (
        (oldPos.x === newPos.x && oldPos.y === newPos.y) ||
        element.firstChild == null // Prevent ghost-dragging of an empty grid item
      )
        return
      const oldPosIndex = oldPos.x + oldPos.y * lineLength
      const newPosIndex = newPos.x + newPos.y * lineLength

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
    [handleUpdateLayout, lineLength, pageLayout, translateLayoutToGrid]
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
    const pageIndex = x + y * lineLength
    const resizeHandles = []
    // can always shrink from a side if larger than 1x1
    if (w >= 2 || h >= 2) {
      if (h >= 2 && y === 0) resizeHandles.push('n')
      else if (h >= 2 && y === 1) resizeHandles.push('s')

      if (w >= 2 && x === 0) resizeHandles.push('w')
      else if (w >= 2 && x === 1) resizeHandles.push('e')
    }
    // for simple 2x2 grid, can only grow if there is a null space - can never be 2x2
    if (lineLength === 2) {
      if (resizeHandles.length > 0) return resizeHandles
      // find empty blocks by checking if they are defined in pageLayout
      const blanks = R.pipe(
        R.filter((item) => item.i === 'null'),
        R.values
      )(gridLayout)
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
    // can only grow if there is a null space
    let growW, growE, growN, growS
    growW = growE = growN = growS = true
    // check over entire height
    for (let i = 0; i < h; i++) {
      if (
        x === 0 ||
        x + w >= lineLength ||
        pageLayout[pageIndex + w + i * lineLength] !== null
      ) {
        growE = false
      }
      if (
        x === lineLength - 1 ||
        x - 1 < 0 ||
        pageLayout[pageIndex - 1 + i * lineLength] !== null
      ) {
        growW = false
      }
    }
    // check over entire width
    for (let i = 0; i < w; i++) {
      if (
        y === 0 ||
        y + h >= lineLength ||
        pageLayout[pageIndex + i + h * lineLength] !== null
      ) {
        growS = false
      }
      if (
        y === lineLength - 1 ||
        y - 1 < 0 ||
        pageLayout[pageIndex + i - lineLength] !== null
      ) {
        growN = false
      }
    }
    if (growW) resizeHandles.push('w')
    if (growE) resizeHandles.push('e')
    if (growN) resizeHandles.push('n')
    if (growS) resizeHandles.push('s')
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
                cols={lineLength}
                maxRows={lineLength}
                layout={translateLayoutToGrid(pageLayout)}
                rowHeight={
                  height / lineLength - (R.isNil(maximizedChart) ? 12 : 0)
                }
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
                        w: lineLength,
                        h: lineLength,
                        static: true,
                      }
                  return (
                    <Box
                      key={
                        index !== 'null'
                          ? `${index}`
                          : `${gridItem.x}x${gridItem.y}null`
                      }
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
        R.count(R.isNotNil)(pageLayout) < lineLength * lineLength && (
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
