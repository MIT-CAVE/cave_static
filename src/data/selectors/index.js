import { createSelector, lruMemoize } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_ICON_URL,
  DEFAULT_VIEWPORT,
  DEFAULT_MAP_STYLES,
  MIN_ZOOM,
  MAX_ZOOM,
  MAX_MEMOIZED_CHARTS,
  NUMBER_FORMAT_KEYS,
  ICON_RESOLUTION,
} from '../../utils/constants'
import {
  propId,
  statId,
  chartStatUses,
  chartVariant,
  chartAggrFunc,
  draggableId,
  paneId,
  legendViews,
} from '../../utils/enums'
import { getStatFn } from '../../utils/stats'
import Supercluster from '../../utils/supercluster'
import ThreadMaxWorkers from '../../utils/ThreadMaxWorkers'

import {
  checkValidRange,
  getTimeValue,
  renameKeys,
  sortByOrderNameId,
  forcePath,
  customSortByX,
  withIndex,
  recursiveMap,
  maxSizedMemoization,
  getScaledValue,
  getScaledRgbObj,
  orderEntireDict,
  addValuesToProps,
  recursiveBubbleMap,
  filterGroupedOutputs,
  adjustArcPath,
  constructFetchedGeoJson,
  constructGeoJson,
} from '../../utils'

const workerManager = new ThreadMaxWorkers()

export const selectUtilities = (state) => R.prop('utilities')(state)

// Virtual Keyboard
export const selectVirtualKeyboard = createSelector(selectUtilities, (data) =>
  R.prop('virtualKeyboard')(data)
)

// Loading
export const selectLoading = createSelector(selectUtilities, (data) =>
  R.prop('loading')(data)
)
export const selectSessionLoading = createSelector(selectLoading, (data) =>
  R.prop('session_loading')(data)
)
export const selectDataLoading = createSelector(selectLoading, (data) =>
  R.prop('data_loading')(data)
)

// Sessions
export const selectSessions = createSelector(selectUtilities, (data) =>
  R.prop('sessions')(data)
)
export const selectSessionsData = createSelector(
  selectSessions,
  R.propOr({}, 'data')
)
export const selectCurrentSession = createSelector(selectSessions, (data) =>
  R.prop('session_id')(data)
)
export const selectTeams = createSelector(
  selectSessionsData,
  R.mapObjIndexed((value) => R.dissoc('sessions', value))
)
export const selectSortedTeams = createSelector(
  selectTeams,
  R.pipe(
    R.map(renameKeys({ teamId: 'id', teamName: 'name' })),
    R.values,
    sortByOrderNameId
  )
)
export const selectSessionsByTeam = createSelector(
  selectSessionsData,
  R.mapObjIndexed((value) => R.prop('sessions', value))
)

// Tokens
export const selectTokens = createSelector(selectUtilities, (data) =>
  R.prop('tokens')(data)
)

export const selectMapboxToken = createSelector(selectTokens, (data) =>
  R.prop('mapboxToken')(data)
)

// Messages
export const selectMessages = createSelector(selectUtilities, (data) =>
  R.prop('messages')(data)
)

// Time (Utilities)
export const selectTime = createSelector(selectUtilities, (data) =>
  R.prop('time')(data)
)
export const selectAnimationInterval = createSelector(
  selectTime,
  R.prop('animationInterval')
)
// Local
export const selectLocal = (state) => R.propOr({}, 'local')(state)
// Local -> settings
export const selectLocalSettings = createSelector(selectLocal, (data) =>
  R.propOr({}, 'settings')(data)
)
export const selectCurrentTime = createSelector(selectLocalSettings, (data) =>
  R.prop('currentTime')(data)
)
export const selectSync = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'sync')(data)
)
export const selectEditLayoutMode = createSelector(
  selectLocalSettings,
  R.propOr(false, 'editLayout')
)
export const selectMirrorMode = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'mirror', data)
)
// Local -> settings -> defaults
const selectSettingsDefaults = createSelector(
  selectLocalSettings,
  R.propOr({}, 'defaults')
)
export const selectShowToolbar = createSelector(
  selectSettingsDefaults,
  R.propOr(true, 'showToolbar')
)
// Data
export const selectData = (state) => R.prop('data')(state)
export const selectIgnoreData = createSelector(selectData, (data) =>
  R.propOr({}, 'ignore')(data)
)
export const selectVersionsData = createSelector(selectData, (data) =>
  R.propOr({}, 'versions')(data)
)
export const selectMapFeatures = createSelector(selectData, (data) =>
  R.propOr({}, 'mapFeatures')(data)
)
export const selectAppBar = createSelector(selectData, (data) => {
  let appBar = R.propOr({}, 'appBar', data)

  // add persistent session and settings
  const systemAppBar = {
    [paneId.SESSION]: {
      bar: 'upperLeft',
      icon: 'md/MdApi',
      type: paneId.SESSION,
    },
    [paneId.APP_SETTINGS]: {
      bar: 'upperLeft',
      icon: 'md/MdOutlineSettings',
      type: paneId.APP_SETTINGS,
    },
  }
  const order = R.pathOr([], ['order', 'data'], appBar)
  const updatedOrder = [paneId.SESSION, paneId.APP_SETTINGS, ...order]
  appBar = R.assocPath(['order', 'data'], updatedOrder, appBar)
  appBar = R.assocPath(
    ['data'],
    R.mergeDeepRight(R.propOr({}, 'data', appBar), systemAppBar),
    appBar
  )
  return appBar
})
export const selectGroupedOutputs = createSelector(selectData, (data) =>
  R.propOr({}, 'groupedOutputs')(data)
)
export const selectGlobalOutputs = createSelector(selectData, (data) =>
  R.propOr({}, 'globalOutputs')(data)
)
export const selectPages = createSelector(selectData, (data) =>
  R.propOr({}, 'pages')(data)
)
export const selectAssociated = createSelector(selectData, (data) =>
  R.propOr({}, 'associated')(data)
)
export const selectSettings = createSelector(selectData, (data) =>
  orderEntireDict(R.propOr({}, 'settings')(data))
)
export const selectPanes = createSelector(selectData, (data) =>
  R.propOr({}, 'panes')(data)
)
export const selectModals = createSelector(selectData, (data) =>
  R.propOr({}, 'modals')(data)
)
export const selectMap = createSelector(selectData, (data) =>
  R.propOr({}, 'maps', data)
)
// Ordered dicts
export const selectOrderedAppBar = createSelector(selectAppBar, (data) =>
  orderEntireDict(data)
)
export const selectOrderedMaps = createSelector(selectMap, (data) =>
  orderEntireDict(data)
)
export const selectOrderedGroupedOutputs = createSelector(
  selectGroupedOutputs,
  (data) => orderEntireDict(data)
)
// Data -> Types
export const selectFeatureData = createSelector(selectMapFeatures, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectNodeTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('node', 'type'), data))
)
export const selectArcTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('arc', 'type'), data))
)
export const selectGeoTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('geo', 'type'), data))
)
// Data -> data
export const selectPanesData = createSelector(
  [selectPanes, selectCurrentTime],
  (data, time) => {
    const panesData = getTimeValue(time, R.propOr({}, 'data', data))

    // add persistent session and settings
    const systemPanesData = {
      [paneId.SESSION]: {
        type: paneId.SESSION,
        variant: paneId.SESSION,
        name: `${paneId.SESSION.charAt(0).toUpperCase()}${paneId.SESSION.slice(1)}`,
      },
      [paneId.APP_SETTINGS]: {
        type: paneId.APP_SETTINGS,
        variant: paneId.APP_SETTINGS,
        name: `${paneId.APP_SETTINGS.charAt(0).toUpperCase()}${paneId.APP_SETTINGS.slice(1)}`,
      },
    }

    return R.mergeRight(panesData, systemPanesData)
  }
)
export const selectModalsData = createSelector(
  selectModals,
  R.propOr({}, 'data')
)
export const selectMapData = createSelector(
  [selectOrderedMaps, selectCurrentTime],
  (data, time) => getTimeValue(time, R.propOr({}, 'data', data))
)
export const selectAppBarData = createSelector(selectOrderedAppBar, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectLeftAppBarData = createSelector(
  selectAppBarData,
  // Keep only sub objects with bar: upperLeft, lowerLeft
  R.pipe(
    R.filter((appBarItem) =>
      R.includes(R.prop('bar', appBarItem), ['upperLeft', 'lowerLeft'])
    )
  )
)

export const selectRightAppBarData = createSelector(
  selectAppBarData,
  R.pipe(
    R.filter((appBarItem) =>
      R.includes(R.prop('bar', appBarItem), ['upperRight', 'lowerRight'])
    )
  )
)
export const selectGroupedOutputsData = createSelector(
  selectOrderedGroupedOutputs,
  (data) => R.propOr({}, 'data')(data)
)
export const selectGlobalOutputsLayout = createSelector(
  selectGlobalOutputs,
  R.prop('layout')
)
export const selectAssociatedData = createSelector(selectAssociated, (data) =>
  R.propOr({}, 'data')(data)
)

// Data -> settings
export const selectSettingsIconUrl = createSelector(selectSettings, (data) =>
  R.propOr(DEFAULT_ICON_URL, 'iconUrl')(data)
)
export const selectNumberFormat = createSelector(
  selectSettings,
  R.pipe(R.propOr({}, 'defaults'), R.pick(NUMBER_FORMAT_KEYS))
)
export const selectNumberFormatPropsFn = createSelector(
  selectNumberFormat,
  R.curry((numberFormat, props) =>
    R.mergeRight(numberFormat, R.pick(NUMBER_FORMAT_KEYS)(props))
  )
)
export const selectDemoSettings = createSelector(
  selectSettings,
  R.propOr({}, 'demo')
)
export const selectDemoMode = createSelector(
  selectLocalSettings,
  (localSettings) => R.propOr(false, 'demo', localSettings)
)
export const selectTimeSettings = createSelector(
  selectSettings,
  R.propOr({}, 'time')
)
export const selectCurrentTimeLength = createSelector(
  selectTimeSettings,
  (data) => R.propOr(0, 'timeLength')(data)
)
export const selectCurrentTimeUnits = createSelector(
  selectTimeSettings,
  (data) => R.propOr('unit', 'timeUnits')(data)
)
export const selectCurrentLooping = createSelector(selectTimeSettings, (data) =>
  R.propOr(false, 'looping')(data)
)
export const selectCurrentSpeed = createSelector(selectTimeSettings, (data) =>
  R.propOr(1, 'speed')(data)
)
export const selectSyncToggles = createSelector(selectSettings, (data) =>
  R.propOr({}, 'sync', data)
)
// Data -> groupedOutputs
export const selectGroupedOutputNames = createSelector(
  selectGroupedOutputsData,
  R.pipe(
    R.map((obj) =>
      R.pipe(
        R.propOr({}, 'stats'),
        R.keys,
        R.reduce(
          (acc, statKey) =>
            R.assoc(
              R.pathOr(statKey, ['stats', statKey, 'name'], obj),
              statKey,
              acc
            ),
          {}
        )
      )(obj)
    )
  )
)
export const selectGroupedOutputTypes = createSelector(
  selectGroupedOutputsData,
  R.map((obj) => R.propOr({}, 'stats')(obj))
)
// Data -> dashboard
export const selectDashboardData = createSelector(selectPages, (data) =>
  R.propOr({}, 'data')(data)
)
// Data -> panes

// Data -> ignore
export const selectIgnoreLoading = createSelector(selectIgnoreData, (data) =>
  R.propOr(false, 'loading')(data)
)
// Loading
export const selectShowLoading = createSelector(
  [selectIgnoreLoading, selectSessionLoading, selectDataLoading],
  (ignore, session, data) => ignore || session || data
)
// Local -> panes
export const selectLocalPanes = createSelector(selectLocal, (data) =>
  R.prop('panes')(data)
)
export const selectLocalPanesData = createSelector(
  [selectLocalPanes, selectCurrentTime],
  (data, time) => getTimeValue(time, R.prop('data', data))
)
// Local -> modals
export const selectLocalModals = createSelector(selectLocal, (data) =>
  R.prop('modals')(data)
)
export const selectLocalModalsData = createSelector(selectLocalModals, (data) =>
  R.prop('data', data)
)
// Local -> draggables
export const selectLocalDraggables = createSelector(
  selectLocal,
  R.propOr({}, 'draggables')
)
export const selectSessionDraggable = createSelector(
  selectLocalDraggables,
  R.propOr({}, draggableId.SESSION)
)
export const selectGlobalOutputsDraggable = createSelector(
  selectLocalDraggables,
  R.propOr({}, draggableId.GLOBAL_OUTPUTS)
)
// Local -> Dashboard
export const selectLocalPages = createSelector(selectLocal, (data) =>
  R.propOr({}, 'pages')(data)
)
export const selectLocalPagesData = createSelector(selectLocalPages, (data) =>
  R.prop('data', data)
)
// Local -> appBar (Custom)
export const selectLocalAppBar = createSelector(selectLocal, (data) =>
  R.prop('appBar', data)
)
export const selectLocalAppBarData = createSelector(selectLocalAppBar, (data) =>
  R.prop('data', data)
)
export const selectLeftLocalAppBarData = createSelector(
  selectLocalAppBarData,
  (data) => R.propOr({}, 'left', data)
)
export const selectRightLocalAppBarData = createSelector(
  selectLocalAppBarData,
  (data) => R.propOr({}, 'right', data)
)
export const selectPaneState = createSelector(
  [selectLocalPanes, selectPanes],
  (localData, data) =>
    R.mergeLeft(
      R.propOr({}, 'paneState', localData),
      R.propOr({}, 'paneState', data)
    )
)
export const selectLeftOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'open', R.propOr({}, 'left', data))
)
export const selectLeftPinPane = createSelector(selectPaneState, (data) =>
  R.propOr(false, 'pin', R.propOr({}, 'left', data))
)
export const selectRightOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'open', R.propOr({}, 'right', data))
)
export const selectRightPinPane = createSelector(selectPaneState, (data) =>
  R.propOr(false, 'pin', R.propOr({}, 'right', data))
)
// Merged pages
export const selectCurrentPage = createSelector(
  [selectLocalPages, selectPages],
  (localPages, pages) => {
    const fallbackId = R.pipe(R.prop('data'), R.keys, R.prop(0))(pages)
    const currentId = R.propOr(
      R.propOr(fallbackId, 'currentPage', pages),
      'currentPage',
      localPages
    )
    return currentId
  }
)
export const selectDashboard = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localdashboardData) =>
    R.propOr(
      R.propOr({}, currentPage, dashboardData),
      currentPage,
      localdashboardData
    )
)
export const selectStatOptions = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    R.pathOr(
      R.pathOr([], [currentPage, 'statOptions'], dashboardData),
      [currentPage, 'statOptions'],
      localDashboardData
    )
)
export const selectPageLayout = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    R.pathOr(
      R.pathOr([], [currentPage, 'pageLayout'], dashboardData),
      [currentPage, 'pageLayout'],
      localDashboardData
    )
)
export const selectCharts = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    R.pathOr(
      R.pathOr({}, [currentPage, 'charts'], dashboardData),
      [currentPage, 'charts'],
      localDashboardData
    )
)
export const selectIsMaximized = createSelector(
  selectCharts,
  R.pipe(R.values, R.any(R.propOr(false, 'maximized')))
)
export const selectDashboardLockedLayout = createSelector(
  selectDashboard,
  (dashboard) => R.propOr(false, 'lockedLayout', dashboard)
)
export const selectAllowedStats = createSelector(
  [selectGroupedOutputTypes, selectStatOptions],
  (statisticTypes, statOptions) =>
    R.isEmpty(statOptions)
      ? statisticTypes
      : R.pick(statOptions, statisticTypes)
)

export const selectCurrentMapDataByMap = createSelector(
  selectMapData,
  (data) => {
    const itemKeys = R.reduce((acc, obj) => {
      R.forEach((key) => acc.add(key), R.keys(obj))
      return acc
    }, new Set())(R.values(data))
    return R.reduce(
      (acc, key) => R.assoc(key, R.map((obj) => R.prop(key, obj))(data), acc),
      {}
    )(itemKeys.values())
  }
)

export const selectDefaultViewportFunc = createSelector(
  selectCurrentMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.pathOr({}, ['defaultViewport', mapId]),
          R.when(
            R.has('zoom'),
            R.over(R.lensProp('zoom'), R.clamp(MIN_ZOOM, MAX_ZOOM))
          )
        )(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.propOr({}, 'defaultViewport', a),
          R.propOr({}, 'defaultViewport', b)
        ),
    },
  }
)

// Merged appBar

export const selectOpenModal = createSelector(
  [selectLocalPanes, selectPanes],
  (localData, data) =>
    R.pipe(
      R.pathOr(R.pathOr({}, ['paneState', 'center'], data), [
        'paneState',
        'center',
      ]),
      R.propOr('', 'open')
    )(localData)
)
export const selectModal = createSelector(
  [selectLocalPanes, selectPanes],
  (localData, data) =>
    R.pathOr(
      R.pathOr({}, ['paneState', 'center'], data),
      ['paneState', 'center'],
      localData
    )
)
const groupAppBar = R.pipe(
  R.mergeDeepRight,
  R.toPairs,
  R.groupBy(
    R.cond([
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['upperLeft'])),
        R.always('upperLeft'),
      ],
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['lowerLeft'])),
        R.always('lowerLeft'),
      ],
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['upperRight'])),
        R.always('upperRight'),
      ],
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['lowerRight'])),
        R.always('lowerRight'),
      ],
      [R.T, R.always('')],
    ])
  ),
  R.map(R.fromPairs)
)
export const selectLeftGroupedAppBar = createSelector(
  [selectLeftLocalAppBarData, selectLeftAppBarData],
  groupAppBar
)
export const selectRightGroupedAppBar = createSelector(
  [selectRightLocalAppBarData, selectRightAppBarData],
  groupAppBar
)
export const selectLeftAppBarDisplay = createSelector(
  [selectMirrorMode, selectLeftAppBarData, selectRightAppBarData],
  (mirrorMode, leftData, rightData) =>
    (!mirrorMode && R.isNotEmpty(leftData)) ||
    (mirrorMode && R.isNotEmpty(rightData))
)
export const selectRightAppBarDisplay = createSelector(
  [selectMirrorMode, selectLeftAppBarData, selectRightAppBarData],
  (mirrorMode, leftData, rightData) =>
    (!mirrorMode && R.isNotEmpty(rightData)) ||
    (mirrorMode && R.isNotEmpty(leftData))
)
export const selectDemoViews = createSelector(
  [selectAppBarData, selectDemoSettings],
  (appBarData, demoSettings) =>
    R.pipe(
      R.toPairs,
      R.filter(
        (d) =>
          R.propEq('page', 'type', d[1]) &&
          R.pathOr(true, [d[0], 'show'], demoSettings)
      ),
      R.pluck(0)
    )(appBarData)
)
export const selectStaticMap = createSelector(
  [selectCurrentPage, selectAppBarData],
  (currentPage, appBarData) =>
    R.pathOr(false, [currentPage, 'static'], appBarData)
)
// Merged Panes
export const selectLeftOpenPanesData = createSelector(
  [selectLeftOpenPane, selectPanesData, selectLocalPanesData],
  (leftOpenPane, panesData, localPanesData) =>
    R.mergeDeepRight(
      R.propOr({}, leftOpenPane, panesData),
      R.propOr({}, leftOpenPane, localPanesData)
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: R.equals },
  }
)
export const selectRightOpenPanesData = createSelector(
  [selectRightOpenPane, selectPanesData, selectLocalPanesData],
  (rightOpenPane, panesData, localPanesData) =>
    R.mergeDeepRight(
      R.propOr({}, rightOpenPane, panesData),
      R.propOr({}, rightOpenPane, localPanesData)
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: R.equals },
  }
)
export const selectOpenModalData = createSelector(
  [selectOpenModal, selectPanesData, selectLocalPanesData],
  (openModal, panesData, localPanesData) =>
    R.mergeDeepRight(
      R.propOr({}, openModal, panesData),
      R.propOr({}, openModal, localPanesData)
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: R.equals },
  }
)

// Local -> Map
export const selectLocalMap = createSelector(selectLocal, (data) =>
  orderEntireDict(R.propOr({}, 'maps')(data))
)
export const selectLocalMapData = createSelector(
  [selectLocalMap, selectCurrentTime],
  (data, time) => getTimeValue(time, R.prop('data')(data))
)
export const selectCurrentLocalMapDataByMap = createSelector(
  [selectLocalMapData],
  (data) => {
    const itemKeys = R.reduce((acc, obj) => {
      R.forEach((key) => acc.add(key), R.keys(obj))
      return acc
    }, new Set())(R.values(data))
    return R.reduce(
      (acc, key) => R.assoc(key, R.map((obj) => R.prop(key, obj))(data), acc),
      {}
    )(itemKeys.values())
  }
)
export const selectAllLegendGroups = createSelector(
  selectCurrentMapDataByMap,
  (mapDataObj) => R.propOr({}, 'legendGroups')(mapDataObj)
)
export const selectAllLocalLegendGroups = createSelector(
  selectCurrentLocalMapDataByMap,
  (mapDataObj) => R.propOr({}, 'legendGroups')(mapDataObj),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)

export const selectLegendDataFunc = createSelector(
  [selectAllLegendGroups, selectAllLocalLegendGroups],
  (mapDataObj, localMapDataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.propOr(R.propOr({}, mapId, mapDataObj), mapId, localMapDataObj),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectLegendViewFunc = createSelector(
  [selectCurrentLocalMapDataByMap, selectCurrentMapDataByMap],
  (currentLocalMapDataByMap, currentMapDataByMap) => (mapId) =>
    R.pathOr(
      R.pathOr(legendViews.MINIMAL, ['legendView', mapId])(currentMapDataByMap),
      ['legendView', mapId]
    )(currentLocalMapDataByMap)
)

export const selectShowLegendGroupNamesFunc = createSelector(
  [selectCurrentLocalMapDataByMap, selectCurrentMapDataByMap],
  (currentLocalMapDataByMap, currentMapDataByMap) => (mapId) =>
    R.pathOr(
      R.pathOr(true, ['showLegendGroupNames', mapId])(currentMapDataByMap),
      ['showLegendGroupNames', mapId]
    )(currentLocalMapDataByMap)
)

export const selectMapControlsByMap = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) => R.propOr({}, 'mapControls')(dataObj)
)
export const selectMapModal = createSelector(
  selectLocalMap,
  (data) =>
    R.propOr(
      {
        isOpen: false,
        data: {
          feature: '',
        },
      },
      'mapModal'
    )(data),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        return (b.isOpen === false && b.isOpen === a.isOpen) || a === b
      },
    },
  }
)
export const selectMapLayers = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapLayers')(data)
)
const selectMapLegendFunc = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.pathOr({}, ['mapLegend', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(R.propOr({}, 'mapLegend', a), R.propOr({}, 'mapLegend', b)),
    },
  }
)
export const selectIsMapLegendOpenFunc = createSelector(
  selectMapLegendFunc,
  (mapLegendFunc) => (mapId) => R.propOr(true, 'isOpen')(mapLegendFunc(mapId))
)
// Local -> globalOutputs
const selectLocalGlobalOutputs = createSelector(
  selectLocal,
  R.propOr({}, 'globalOutputs')
)
export const selectMergedGlobalOutputs = createSelector(
  [selectGlobalOutputs, selectLocalGlobalOutputs],
  (globalOutputsData, localGlobalOutputs) =>
    R.mergeDeepLeft(localGlobalOutputs)(globalOutputsData)
)
export const selectGlobalOutputProps = createSelector(
  selectMergedGlobalOutputs,
  R.pipe(
    R.converge(addValuesToProps, [
      R.propOr({}, 'props'),
      R.propOr({}, 'values'),
    ]),
    R.reject(R.pipe(R.prop('value'), R.isNil)),
    R.map(R.assoc('enabled', false))
  )
)
// Local -> Map -> mapControls
export const selectViewportsByMap = createSelector(
  [selectMapControlsByMap, selectDefaultViewportFunc, selectMapData],
  (mapControls, defaultViewportFunc, maps) =>
    R.zipObj(
      R.pipe(R.keys, R.concat(R.keys(mapControls)), R.uniq)(maps),
      R.map((mapId) =>
        R.mergeAll([
          DEFAULT_VIEWPORT,
          defaultViewportFunc(mapId),
          R.propOr({}, 'viewport')(mapControls[mapId]),
        ])
      )(R.pipe(R.keys, R.concat(R.keys(mapControls)), R.uniq)(maps))
    )
)
export const selectBearingFunc = createSelector(
  selectViewportsByMap,
  (data) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('bearing')(data[mapId]),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(R.pluck('bearing', a), R.pluck('bearing', b)),
    },
  }
)
export const selectPitchFunc = createSelector(
  selectViewportsByMap,
  (data) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('pitch')(data[mapId]),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(R.pluck('pitch', a), R.pluck('pitch', b)),
    },
  }
)
export const selectZoomFunc = createSelector(
  selectViewportsByMap,
  (data) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('zoom')(data[mapId]),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(R.pluck('zoom', R.values(a)), R.pluck('zoom', R.values(b))),
    },
  }
)
export const selectCurrentMapStyleFunc = createSelector(
  selectCurrentMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.path(['currentStyle', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.propOr({}, 'currentStyle', a),
          R.propOr({}, 'currentStyle', b)
        ),
    },
  }
)

export const selectCurrentMapProjectionFunc = createSelector(
  [selectCurrentMapDataByMap, selectMapboxToken],
  (dataObj, token) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        token !== ''
          ? R.pathOr('mercator', ['currentProjection', mapId])(dataObj)
          : 'mercator',
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.propOr({}, 'currentProjection', a),
          R.propOr({}, 'currentProjection', b)
        ),
    },
  }
)
export const selectIsGlobeNotMemoized = createSelector(
  [selectViewportsByMap, selectCurrentMapDataByMap, selectMapboxToken],
  (viewportsByMap, dataObj, token) =>
    R.pipe(
      R.toPairs,
      R.map(([mapId]) => {
        const mapProjection =
          token !== ''
            ? R.pathOr('mercator', ['currentProjection', mapId], dataObj)
            : 'mercator'
        const zoom = R.path([mapId, 'zoom'], viewportsByMap)
        return [mapId, mapProjection === 'globe' && zoom < 6]
      }),
      R.fromPairs
    )(viewportsByMap),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) => {
        // token
        if (typeof a === 'string') return R.equals(a, b)
        // dataObj
        const getProjection = R.prop('currentProjection')
        if (getProjection(a) !== undefined)
          return R.equals(getProjection(a), getProjection(b))
        // viewportsByMap
        const getZoomLevels = R.map((data) => R.prop('zoom', data) < 6)
        return R.equals(getZoomLevels(a), getZoomLevels(b))
      },
    },
  }
)
export const selectIsGlobe = createSelector(
  [selectIsGlobeNotMemoized],
  (isGlobeData) => (mapId) => R.prop(mapId, isGlobeData),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) => R.equals(a, b),
    },
  }
)
export const selectIsMapboxTokenProvided = createSelector(
  selectMapboxToken,
  R.both(R.isNotNil, R.isNotEmpty)
)
export const selectMapStyleOptions = createSelector(
  [selectOrderedMaps, selectIsMapboxTokenProvided],
  (data, isMapboxTokenProvided) =>
    R.pipe(
      orderEntireDict,
      R.propOr([], 'additionalMapStyles'),
      R.mergeRight(DEFAULT_MAP_STYLES),
      R.filter(
        (style) =>
          isMapboxTokenProvided ||
          R.pipe(R.prop('spec'), R.startsWith('mapbox://'), R.not)(style)
      )
    )(data)
)

export const selectPitchSliderToggleFunc = createSelector(
  selectMapControlsByMap,
  (controls) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('showPitchSlider')(controls[mapId]),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.map(R.dissoc('viewport'), a),
          R.map(R.dissoc('viewport'), b)
        ),
    },
  }
)
export const selectBearingSliderToggleFunc = createSelector(
  selectMapControlsByMap,
  (controls) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('showBearingSlider')(controls[mapId]),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) => {
        return R.equals(
          R.map(R.dissoc('viewport'), b),
          R.map(R.dissoc('viewport'), a)
        )
      },
    },
  }
)
export const selectOptionalViewportsFunc = createSelector(
  selectCurrentMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.path(['optionalViewports', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.propOr({}, 'optionalViewports', a),
          R.propOr({}, 'optionalViewports', b)
        ),
    },
  }
)
// Local -> Map -> layers

const selectLegendTypesFn = createSelector(
  [
    selectCurrentLocalMapDataByMap,
    selectCurrentMapDataByMap,
    selectFeatureData,
  ],
  (localMapObj, mapDataObj, mapFeatures) =>
    maxSizedMemoization(
      ({ mapId, layerKey }) => `${mapId}+${layerKey}`,
      ({ mapId, layerKey }) => {
        const getEnabledTypes = R.pipe(
          R.pathOr({}, ['legendGroups', mapId]),
          R.values,
          R.pluck('data'),
          R.mergeAll,
          (d) =>
            R.pipe(
              R.keys,
              R.filter((key) => R.pathEq(layerKey, [key, 'type'], mapFeatures)),
              R.flip(R.pick)(d)
            )(d)
        )
        return R.when(
          R.isEmpty,
          R.always(getEnabledTypes(mapDataObj))
        )(getEnabledTypes(localMapObj))
      },
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(
          R.propOr({}, 'legendGroups', a),
          R.propOr({}, 'legendGroups', b)
        ),
    },
  }
)

export const selectAllNodeIcons = createSelector(
  selectLegendTypesFn,
  (typesFn) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        return R.pipe(
          R.pluck('icon'),
          R.values
        )(typesFn({ mapId, layerKey: 'node' }))
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledTypesFn = createSelector(
  selectLegendTypesFn,
  (typesFn) =>
    maxSizedMemoization(
      ({ mapId, layerKey }) => `${mapId}+${layerKey}`,
      ({ mapId, layerKey }) => {
        const allTypes = typesFn({ mapId, layerKey })
        return R.mapObjIndexed(R.unless(R.prop('value'), R.F))(allTypes)
      }
    )
)
export const selectEnabledArcsFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'arc' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledNodesFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'node' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledGeosFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'geo' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectGeo = createSelector(
  selectMapLayers,
  R.propOr({}, 'geography')
)

// Local -> features (arcs, nodes, geos)
export const selectLocalFeatures = createSelector(selectLocal, (data) =>
  R.pathOr({}, ['mapFeatures', 'data'], data)
)
export const selectLocalNodes = createSelector(
  [selectLocal, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('node', 'type'), data))
)
export const selectLocalArcs = createSelector(
  [selectLocal, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('arc', 'type'), data))
)
export const selectLocalGeos = createSelector(
  [selectLocal, selectCurrentTime],
  (data, time) => getTimeValue(time, R.filter(R.propEq('geo', 'type'), data))
)
export const selectLocalizedNodeTypes = createSelector(
  [selectNodeTypes, selectLocalNodes],
  (nodeTypes, localNodes) => R.mergeDeepRight(nodeTypes, localNodes),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectLocalizedArcTypes = createSelector(
  [selectArcTypes, selectLocalArcs],
  (arcTypes, localArcs) => R.mergeDeepRight(arcTypes, localArcs),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectLocalizedGeoTypes = createSelector(
  [selectGeoTypes, selectLocalGeos],
  (geoTypes, localGeos) => R.mergeDeepRight(geoTypes, localGeos),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectArcTypeKeys = createSelector(
  selectLocalizedArcTypes,
  (data) => R.keys(data),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectNodeTypeKeys = createSelector(
  selectLocalizedNodeTypes,
  (data) => R.keys(data),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)

const getMergedAllProps = (data, dataType) =>
  R.mapObjIndexed((type, key) =>
    R.pipe(
      R.pathOr({}, ['data', 'location']),
      R.dissoc('timeValues'),
      R.values,
      R.head,
      R.length,
      R.range(0),
      R.map((idx) => {
        const values = R.pipe(
          R.pathOr({}, ['data', 'valueLists']),
          R.pluck(idx)
        )(type)
        const location = R.pipe(
          R.pathOr({}, ['data', 'location']),
          dataType === 'node' ? R.map(R.map((d) => d[0])) : R.identity,
          R.pluck(idx)
        )(type)
        return R.pipe(
          R.assoc('values', values),
          R.mergeLeft(location),
          R.assoc('type', key),
          R.dissoc('data')
        )(type)
      })
    )(type)
  )(data)

export const selectMergedArcs = createSelector(
  [selectLocalizedArcTypes, selectCurrentTime],
  (arcs, time) => getMergedAllProps(getTimeValue(time, arcs), 'arc')
)
export const selectMergedNodes = createSelector(
  [selectLocalizedNodeTypes, selectCurrentTime],
  (nodes, time) => getMergedAllProps(getTimeValue(time, nodes), 'node')
)
export const selectMergedGeos = createSelector(
  [selectLocalizedGeoTypes, selectCurrentTime],
  (geos, time) => getMergedAllProps(getTimeValue(time, geos), 'geo')
)
// Map (Custom)
export const selectLayerById = (state, id) =>
  R.path(['local', 'map', 'mapLayers', id])(state)

export const selectNodeDataFunc = createSelector(
  [selectEnabledNodesFunc, selectMergedNodes],
  (enabledNodesFunc, mergedData) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.pick(R.keys(R.filter(R.identity, enabledNodesFunc(mapId)))),
          R.map(R.toPairs)
        )(mergedData),
      MAX_MEMOIZED_CHARTS
    )
)

// outputs derived
export const selectStatGroupings = createSelector(
  selectOrderedGroupedOutputs,
  (data) => R.propOr({}, 'groupings', data)
)

export const selectStatGroupingIndicies = createSelector(
  selectStatGroupings,
  R.pipe(R.map(R.over(R.lensPath(['data', 'id']), R.invertObj)))
)

export const selectGroupedOutputValueBuffers = createSelector(
  selectGroupedOutputsData,
  (groupedOutputs) =>
    R.map(
      R.pipe(
        R.prop('valueLists'),
        R.map((arr) => {
          const buffer = window.crossOriginIsolated
            ? new SharedArrayBuffer(arr.length * 8)
            : new ArrayBuffer(arr.length * 8)
          const view = new Float64Array(buffer)
          for (let i = 0; i < arr.length; i++) {
            view[i] = arr[i]
          }
          return view.buffer
        })
      )
    )(groupedOutputs)
)

const mergeFuncs = {
  [chartAggrFunc.SUM]: R.identity,
  [chartAggrFunc.MIN]: (val) => R.reduce(R.min, R.head(val), R.tail(val)),
  [chartAggrFunc.MAX]: (val) => R.reduce(R.max, R.head(val), R.tail(val)),
  [chartAggrFunc.MEAN]: R.mean,
  // divisor logic happens once stats are calculated - treat as a sum here
  [chartAggrFunc.DIVISOR]: R.sum,
}

export const selectMemoizedChartFunc = createSelector(
  [
    selectGroupedOutputsData,
    selectStatGroupings,
    selectStatGroupingIndicies,
    selectGroupedOutputValueBuffers,
  ],
  (groupedOutputs, groupings, groupingIndicies, valueBuffers) =>
    maxSizedMemoization(
      (obj) => JSON.stringify(R.dissoc('showToolbar', obj)),
      async (obj) => {
        const statObjs = obj.stats ?? []
        // Helper function to find the parental path of a given level
        const createParentalPath = (
          path,
          category,
          currentLevel,
          onlyOrdering = false
        ) => {
          const parent = R.path(
            [category, 'levels', currentLevel, 'parent'],
            groupings
          )
          if (
            R.isNil(parent) ||
            (onlyOrdering &&
              !R.pathOr(
                true,
                [category, 'levels', currentLevel, 'orderWithParent'],
                groupings
              ))
          )
            return R.append(currentLevel, path)
          else
            return createParentalPath(
              R.append(currentLevel, path),
              category,
              parent,
              onlyOrdering
            )
        }

        // Given an index returns a string to group all similar indicies by
        const categoryFunc = R.curry((category, level, outputGroup) => {
          const parentalPath = createParentalPath([], category, level)
          const groupList = R.path([outputGroup, 'groupLists', category])(
            groupedOutputs
          )

          const groupingVal = R.pipe(
            R.path([category, 'data']),
            R.pick(parentalPath),
            R.values
          )(groupings)
          const groupBys = Array(
            R.values(groupedOutputs[outputGroup]['valueLists'])[0].length
          )
          for (let index = 0; index < groupBys.length; index++) {
            if (groupList == null) return []
            const groupName = groupList[index]
            const groupingIndex =
              groupingIndicies[category]['data']['id'][groupName]
            const pluckedValues = Array(groupingVal.length)
            for (let i = 0; i < groupingVal.length; i++) {
              pluckedValues[i] = groupingVal[i][groupingIndex]
            }
            groupBys[index] = pluckedValues
          }
          return groupBys
        })

        // List of groupBy, subGroupBy etc...
        const groupBys = R.pipe(
          R.prop('groupingId'),
          R.length,
          R.range(0),
          R.map((idx) =>
            obj.groupingId[idx] != null
              ? categoryFunc(obj.groupingId[idx], obj.groupingLevel[idx])
              : R.always(
                  R.repeat(
                    ['All'],
                    R.values(groupedOutputs[obj.dataset]['valueLists'])[0]
                      .length
                  )
                )
          ),
          R.ifElse(
            R.isEmpty,
            R.always([
              R.repeat(
                ['All'],
                R.values(groupedOutputs[obj.dataset]['valueLists'])[0].length
              ),
            ]),
            R.map(R.applyTo(obj.dataset))
          )
        )(obj)

        const filteredStatsToCalc = filterGroupedOutputs(
          groupedOutputs[obj.dataset],
          R.pipe(R.propOr([], 'filters'))(obj),
          groupingIndicies
        )

        // Calculates stat values without applying mergeFunc
        const calculatedStats = R.map((stat) => {
          const statGroupBys = R.has('aggregationGroupingLevel', stat)
            ? R.append(
                categoryFunc(
                  stat.aggregationGroupingId,
                  stat.aggregationGroupingLevel,
                  obj.dataset
                )
              )(groupBys)
            : R.append(R.last(groupBys))(groupBys)

          const statGroup = workerManager.doWork({
            groupBys: statGroupBys,
            statId: stat.statId,
            indicies: filteredStatsToCalc,
            valueLists: valueBuffers[obj.dataset],
          })
          return R.has('statIdDivisor', stat)
            ? Promise.all([
                statGroup,
                workerManager.doWork({
                  groupBys: statGroupBys,
                  statId: stat.statIdDivisor,
                  indicies: filteredStatsToCalc,
                  valueLists: valueBuffers[obj.dataset],
                }),
              ])
            : statGroup
        })(statObjs)

        return Promise.all(calculatedStats).then((resolvedStats) => {
          // merge the calculated stats - unless boxplot
          // NOTE: Boxplot needs subgrouping - handle this in chart adapter
          const mergedValues = R.addIndex(R.map)(
            (val, idx) =>
              recursiveBubbleMap(
                R.pipe(R.values, R.head, R.is(Object), R.not),
                R.pipe(
                  R.values,
                  R.filter(R.is(Number)),
                  obj.chartType !== chartVariant.BOX_PLOT
                    ? R.unless(
                        R.isEmpty,
                        mergeFuncs[statObjs[idx].aggregationType]
                      )
                    : R.identity
                ),
                R.identity,
                R.filter(R.isNotEmpty),
                val
              ),
            resolvedStats
          )
          const dividedValues = R.map(
            R.when(R.is(Array), (arr) =>
              R.mergeDeepWith(R.divide, arr[0], arr[1])
            )
          )(mergedValues)
          // Helper function to map merged stats to chart input object
          const recursiveMapLayers = (val, lowestGroupings) =>
            R.type(val) === 'Object'
              ? R.pipe(
                  R.values,
                  R.head,
                  (item) => R.type(item) === 'Object'
                )(val)
                ? R.values(
                    R.mapObjIndexed((value, key) => ({
                      name: R.isNil(obj.groupingId) ? 'All' : key,
                      children: recursiveMapLayers(value, lowestGroupings),
                    }))(val)
                  )
                : R.map((key) => ({
                    name: key,
                    value: recursiveMapLayers(R.propOr(0, key, val)),
                  }))(R.isNil(lowestGroupings) ? R.keys(val) : lowestGroupings)
              : R.is(Array, val)
                ? val
                : [val]

          // Helper function to list all of the lowest grouping levels before recursing
          const recursiveMapLayersHelper = (objWithGroups) => {
            const listLowestGroupings = (groupingLevel) =>
              R.ifElse(
                R.pipe(R.values, R.head, R.type, R.equals('Object')),
                R.pipe(R.values, R.map(listLowestGroupings), R.flatten, R.uniq),
                R.keys
              )(groupingLevel)

            return recursiveMapLayers(
              objWithGroups,
              R.propOr(false, 'defaultToZero', obj)
                ? listLowestGroupings(objWithGroups)
                : null
            )
          }

          // Ordering for the X's in the chart
          const getOrderingsAtIndex = (idx) => {
            const parentalPath = createParentalPath(
              [],
              R.path(['groupingId', idx], obj),
              R.path(['groupingLevel', idx], obj),
              true
            )
            return R.map((level) =>
              R.pathOr(
                [],
                [R.path(['groupingId', idx], obj), 'levels', level, 'ordering']
              )(groupings)
            )(parentalPath)
          }
          const nLevelOrder = R.curry((depth, chartItem) => {
            return R.has('children', chartItem)
              ? R.assoc(
                  'children',
                  R.map(nLevelOrder(depth + 1))(
                    customSortByX(
                      getOrderingsAtIndex(depth),
                      R.prop('children', chartItem)
                    )
                  ),
                  chartItem
                )
              : chartItem
          })
          // Formats and sorts merged stats
          const getFormattedData = R.map(
            R.pipe(
              recursiveMap(
                (val) => R.type(val) !== 'Object',
                R.identity,
                R.dissoc(undefined)
              ),
              recursiveMapLayersHelper,
              customSortByX(getOrderingsAtIndex(0)),
              // The 0th layer is sorted above due to not being a child, so we start at 1
              R.map(nLevelOrder(1))
            )
          )
          const formattedData = getFormattedData(dividedValues)
          const conditionalMerge = (key, a, b) =>
            key === 'name'
              ? a
              : key === 'value'
                ? R.concat(a, b)
                : // key === 'children'
                  mergeMultiStatData([a, b])

          const mergeMultiStatData = R.pipe(
            R.reduce(R.mergeDeepWithKey(conditionalMerge), {}),
            R.values
          )
          return obj.stats.length > 1
            ? mergeMultiStatData(formattedData)
            : R.head(formattedData)
        })
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectMemoizedGlobalOutputFunc = createSelector(
  selectAssociatedData,
  (associatedData) =>
    maxSizedMemoization(
      (obj) => JSON.stringify(obj),
      (obj) => {
        const selectedGlobalOutputs = forcePath(
          R.propOr([], 'globalOutput', obj)
        )
        const formattedGlobalOutputs = R.pipe(
          R.values,
          R.filter((val) =>
            R.includes(val.name, R.propOr([], 'sessions', obj))
          ),
          R.map((val) => ({
            name: val.name,
            children: R.pipe(
              R.path(['data', 'globalOutputs']),
              R.converge(addValuesToProps, [
                R.propOr({}, 'props'),
                R.propOr({}, 'values'),
              ]),
              R.pick(selectedGlobalOutputs),
              R.reject(R.pipe(R.prop('value'), R.isNil)), // It should be filtered by now, but just in case
              withIndex,
              R.map((globalOutput) =>
                R.assoc(
                  'value',
                  [
                    R.pipe(
                      R.prop('value'),
                      R.when(
                        R.includes(','),
                        // Convert thousand-separator formatted numbers to float
                        R.replace(/,/g, '')
                      ),
                      parseFloat
                    )(globalOutput),
                  ],
                  {
                    id: globalOutput.id,
                    name: globalOutput.name || globalOutput.id,
                  }
                )
              )
            )(val),
          })),
          R.when(
            R.always(R.has(R.prop('chartType', obj), chartStatUses)),
            R.map((session) => ({
              name: session.name,
              value: R.unnest(R.pluck('value', session.children)),
            }))
          )
        )(associatedData)
        return formattedGlobalOutputs
      },
      MAX_MEMOIZED_CHARTS
    )
)
// Node, Geo, & Arc derived
export const selectGroupedEnabledArcsFunc = createSelector(
  [selectEnabledArcsFunc, selectMergedArcs, selectCurrentMapProjectionFunc],
  (enabledArcsFunc, mergedArcs, projectionFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.toPairs,
          R.filter((d) => R.propOr(false, d[0], enabledArcsFunc(mapId))),
          R.groupBy(
            R.pipe(
              R.path([1, 0]),
              R.cond([
                [R.has('geoJson'), R.always('geoJson')],
                [
                  R.converge(R.and, [
                    R.propEq('3d', 'displayType'),
                    R.always(R.equals('mercator', projectionFunc(mapId))),
                  ]),
                  R.always('3d'),
                ],
                [R.T, R.always('false')],
              ])
            )
          ),
          R.map(R.fromPairs)
        )(mergedArcs),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.map(R.toPairs)(R.propOr({}, 'false', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.map(R.toPairs)(R.propOr({}, '3d', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectMultiLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.map(R.toPairs)(R.propOr({}, 'geoJson', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcRange = createSelector(
  [selectMergedArcs, selectLegendTypesFn],
  (arcsByType, legendObjectsFunc) =>
    R.memoizeWith(
      (type, prop, mapId, dimensionOptions) =>
        JSON.stringify([type, prop, dimensionOptions, mapId]),
      (type, prop, mapId, dimensionOptions) =>
        R.pipe(
          R.path([type, dimensionOptions, prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              ((R.has('startGradientColor', range) ||
                R.has('startSize', range) ||
                R.has('startHeight', range)) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['values', prop], value)),
                  min: R.min(acc.min, R.path(['values', prop], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, arcsByType))
            )
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(legendObjectsFunc({ mapId, layerKey: 'arc' }))
    )
)
export const selectGroupedEnabledGeosFunc = createSelector(
  [selectEnabledGeosFunc, selectMergedGeos],
  (enabledGeosFunc, mergedGeos) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.toPairs,
          R.filter((d) => R.propOr(false, d[0], enabledGeosFunc(mapId))),
          R.groupBy(R.hasPath([1, 0, 'geoJson'])),
          R.map(R.fromPairs)
        )(mergedGeos),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectFetchedGeoDataFunc = createSelector(
  selectGroupedEnabledGeosFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.propOr({}, 'true', dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectIncludedGeoDataFunc = createSelector(
  selectGroupedEnabledGeosFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(R.propOr({}, 'false'), R.map(R.toPairs))(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectMatchingKeysByTypeFunc = createSelector(
  [selectFetchedGeoDataFunc],
  (geosByType) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.map(
            R.pipe(
              R.addIndex(R.map)(R.flip(R.assoc('data_key'))),
              R.indexBy(R.prop('geoJsonValue'))
            )
          )
        )(geosByType(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

// Split nodes by those grouped vs those not
export const selectSplitNodeDataFunc = createSelector(
  [selectEnabledNodesFunc, selectNodeDataFunc],
  (enabledNodesFunc, nodeDataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.values,
          R.unnest,
          R.filter((d) => {
            const nodeType = d[1].type
            const colorProp = R.path(
              [nodeType, 'colorBy'],
              enabledNodesFunc(mapId)
            )
            const sizeProp = R.path(
              [nodeType, 'sizeBy'],
              enabledNodesFunc(mapId)
            )
            const nullColor = R.path(['colorBy', colorProp], d[1])
            const nullSize = R.path(['sizeBy', colorProp], d[1])

            const sizeValue = R.path(['values', sizeProp], d[1])
            const colorValue = R.path(['values', colorProp], d[1])

            const groupable = enabledNodesFunc(mapId)[nodeType].allowGrouping

            return (
              !(
                R.hasPath(['colorBy', colorProp, 'nullColor'], d[1]) &&
                R.isNil(nullColor)
              ) &&
              (R.isNotNil(nullSize) || R.isNotNil(sizeValue)) &&
              !(groupable && R.isNil(colorValue))
            )
          }),
          R.groupBy((d) => {
            const nodeType = d[1].type
            return enabledNodesFunc(mapId)[nodeType].group || false
          })
        )(nodeDataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectGroupedNodesWithIdFunc = createSelector(
  selectSplitNodeDataFunc,
  (splitNodeDataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.map((d) => R.assoc('id', d[0])(d[1]))(
          R.propOr([], true, splitNodeDataFunc(mapId))
        ),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeRange = createSelector(
  [selectLegendTypesFn, selectMergedNodes],
  (legendObjectsFunc, nodesByType) =>
    R.memoizeWith(
      (type, prop, mapId, dimensionOptions) =>
        JSON.stringify([type, prop, dimensionOptions, mapId]),
      (type, prop, mapId, dimensionOptions) =>
        R.pipe(
          R.path([type, dimensionOptions, prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              ((R.has('startGradientColor', range) ||
                R.has('startSize', range)) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['values', prop], value)),
                  min: R.min(acc.min, R.path(['values', prop], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, nodesByType))
            )
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(legendObjectsFunc({ mapId, layerKey: 'node' }))
    )
)
export const selectGeoRange = createSelector(
  [selectLegendTypesFn, selectMergedGeos],
  (legendObjectsFunc, geosByType) =>
    R.memoizeWith(
      (type, prop, mapId, dimensionOptions) =>
        JSON.stringify([type, prop, dimensionOptions, mapId]),
      (type, prop, mapId, dimensionOptions) =>
        R.pipe(
          R.path([type, dimensionOptions, prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              ((R.has('startGradientColor', range) ||
                R.has('startHeight', range)) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['values', prop], value)),
                  min: R.min(acc.min, R.path(['values', prop], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, geosByType))
            )
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(legendObjectsFunc({ mapId, layerKey: 'geo' }))
    )
)

export const selectLineMatchingKeysByTypeFunc = createSelector(
  [selectMultiLineDataFunc, selectArcRange, selectEnabledArcsFunc],
  (dataFunc, arcRange, enabledArcsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.values,
          R.unnest,
          R.map((d) => R.assoc('data_key', d[0], d[1])),
          R.filter((d) => {
            const colorProp = R.path(
              [d.type, 'colorBy'],
              enabledArcsFunc(mapId)
            )
            const statRange = arcRange(
              d.type,
              colorProp,
              mapId,
              'colorByOptions'
            )
            return !(
              R.has('nullColor', statRange) &&
              R.isNil(R.prop('nullColor', statRange))
            )
          }),
          R.groupBy(R.prop('type')),
          R.map(R.indexBy(R.prop('geoJsonValue')))
        )(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeClustersFunc = createSelector(
  [selectGroupedNodesWithIdFunc, selectEnabledNodesFunc],
  (dataFunc, legendObjectsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => {
        const data = dataFunc(mapId)
        // define helper functions
        const getVarByProp = R.curry((varByKey, nodeObj) =>
          R.path([nodeObj.type, varByKey])(legendObjectsFunc(mapId))
        )
        const getClusterVarByProp = R.curry((varByKey, nodeCluster) =>
          R.path([nodeCluster.properties.type, varByKey])(
            legendObjectsFunc(mapId)
          )
        )
        const getGroups = (ungroupedData, fn) =>
          ungroupedData.reduce((acc, d) => {
            const result = fn(d)
            acc[result] = acc[result] || []
            acc[result].push(d)
            return acc
          }, {})
        const getPosition = (d) => [d.longitude, d.latitude, d.altitude + 1]
        const getGroupCalculation = R.curry((groupCalculation, nodeCluster) =>
          R.pathOr(statId.COUNT, [
            nodeCluster.properties.type,
            groupCalculation,
          ])(legendObjectsFunc(mapId))
        )

        const getColorGroupFn = R.pipe(
          getGroupCalculation('groupCalcByColor'),
          R.nth(R.__, getStatFn)
        )

        const getSizeGroupFn = R.pipe(
          getGroupCalculation('groupCalcBySize'),
          R.nth(R.__, getStatFn)
        )

        // Set the "supercluster" constructor parameters
        const options = {
          minZoom: Math.floor(MIN_ZOOM),
          maxZoom: Math.floor(MAX_ZOOM),
          radius: 50 * Math.sqrt(2),
          deepClone: true,
          map: (d) => {
            const colorProp = getVarByProp('colorBy', d)
            const sizeProp = getVarByProp('sizeBy', d)

            const sizePropObj = {
              [sizeProp]: sizeProp
                ? {
                    value: [d.values[sizeProp]],
                  }
                : {},
            }

            const colorPropObj = {
              [colorProp]: colorProp
                ? {
                    type: d.props[colorProp].type,
                    value: [d.values[colorProp]],
                  }
                : {},
            }
            return {
              type: d.type,
              colorDomain: null,
              sizeDomain: null,
              icon: d['icon'],
              grouped_ids: [d.id],
              ...R.mergeDeepRight(colorPropObj, sizePropObj),
            }
          },
          reduce: (acc, dProps) => {
            const id = dProps.grouped_ids
            const colorProp = getVarByProp('colorBy', dProps)
            const sizeProp = getVarByProp('sizeBy', dProps)
            if (sizeProp) {
              const propValue = dProps[sizeProp].value
              acc[sizeProp].value = acc[sizeProp].value.concat(propValue)
            }

            // BUG: At some point, I noticed that there are more values
            // in the resulting array than the actual points in the cluster,
            // e.g. a cluster with two nodes with values 100 and 50 might end
            // up with an array of values of [100, 50, 60].
            // Not sure if this bug went away after some other fixes
            if (colorProp && colorProp !== sizeProp) {
              const propValue = dProps[colorProp].value
              acc[colorProp].value = acc[colorProp].value.concat(propValue)
            }
            // all the ids of the points grouped in this cluster
            if (id) {
              acc.grouped_ids = acc.grouped_ids.concat(id)
            }
          },
        }
        // create groups
        const groupsRaw = Object.values(getGroups(data, (d) => d.type))
        const superCluster = new Supercluster(options)
        const groups = {}
        if (data.length > 0) {
          // Iterate through every zoom level
          for (let z = options.maxZoom; z >= options.minZoom; z--) {
            const clusters = groupsRaw.reduce((acc, dataGroup) => {
              let points = dataGroup.map((d) => ({
                geometry: { coordinates: getPosition(d) },
                properties: d,
              }))

              superCluster.load(points)
              const groupClustersRaw = superCluster.getClusters(
                [-180, -90, 180, 90],
                z
              )

              // Aggregate clusters into a single data structure
              return acc.concat(groupClustersRaw)
            }, [])

            const ranges = {}

            // find color/size value for each cluster - store min/max by type
            for (let cluster of clusters) {
              // The node type in this cluster
              const clusterType = R.path(['properties', 'type'])(cluster)
              // The props that we use in the legend for colorBy and sizeBy for a specific node type
              const colorProp = getClusterVarByProp('colorBy', cluster)
              const sizeProp = getClusterVarByProp('sizeBy', cluster)
              // The prop type of colorProp to determine if the prop is categorical
              const colorPropType = cluster.properties.cluster
                ? cluster.properties[colorProp].type
                : cluster.properties.props[colorProp].type

              // gets the values and aggregates by groupCalculationFn
              const getDomainValue = (prop, groupCalculationFn) =>
                cluster.properties.cluster
                  ? groupCalculationFn(cluster.properties[prop].value)
                  : // Nodes that were not within the radius to form a cluster
                    // This uses the calculationFn to apply count properly
                    groupCalculationFn([cluster.properties.values[prop]])

              // All elements of a cluster contain the same `nodeType`
              // required to get the corresponding calculationGroup (color or size)
              const colorGroupFn = getColorGroupFn(cluster)
              const sizeGroupFn = getSizeGroupFn(cluster)

              // calculate the color and size value based on the agg func
              const colorValue = getDomainValue(colorProp, colorGroupFn)
              const sizeValue = getDomainValue(sizeProp, sizeGroupFn)

              // set the values including min/max size/color
              cluster.properties.colorProp = {
                value: colorValue,
              }
              cluster.properties.sizeProp = {
                value: sizeValue,
              }

              // Find the current min/max for this node type
              const { min: sizeMin, max: sizeMax } = R.pathOr(
                { min: Infinity, max: -Infinity },
                [clusterType, 'size'],
                ranges
              )
              const { min: colorMin, max: colorMax } = R.pathOr(
                { min: Infinity, max: -Infinity },
                [clusterType, 'color'],
                ranges
              )
              // Update the types min/max with new values
              ranges[clusterType] = {
                color:
                  colorPropType === propId.NUMBER
                    ? {
                        min: R.min(colorMin, +colorValue),
                        max: R.max(colorMax, +colorValue),
                      }
                    : {}, // Empty for a categorical prop
                size: {
                  min: R.min(sizeMin, sizeValue),
                  max: R.max(sizeMax, sizeValue),
                },
              }
            }
            groups[z] = { data: clusters, range: ranges }
          }
        }
        return groups
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeClustersAtZoomFunc = createSelector(
  [selectNodeClustersFunc, selectZoomFunc],
  (nodeClustersFunc, zoomFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.propOr({}, Math.floor(zoomFunc(mapId)), nodeClustersFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeRangeAtZoomFunc = createSelector(
  selectNodeClustersAtZoomFunc,
  (nodeClustersFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.propOr({}, 'range')(nodeClustersFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeGeoJsonObjectFunc = createSelector(
  [selectSplitNodeDataFunc, selectNodeRange, selectEnabledNodesFunc],
  (nodeDataSplitFunc, nodeRange, legendObjectsFunc) => {
    const nodeDataFunc = R.pipe(nodeDataSplitFunc, R.propOr({}, 'false'))
    const geometryFunc = (item) => ({
      type: 'Point',
      coordinates: [item.longitude, item.latitude],
    })
    return constructGeoJson(
      nodeRange,
      nodeDataFunc,
      legendObjectsFunc,
      geometryFunc,
      'node'
    )
  }
)
export const selectNodeClusterGeoJsonObjectFunc = createSelector(
  [selectNodeClustersAtZoomFunc, selectEnabledNodesFunc],
  (nodeClustersFunc, legendObjectsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.map((group) => {
          const nodeType = group.properties.type
          const legendObj = legendObjectsFunc(mapId)[nodeType]
          const sizePropObj = R.path(['properties', 'sizeProp'], group)
          const sizeProp = legendObj.sizeBy
          const isSizeCategorical = !R.has('min')(
            legendObj.sizeByOptions[sizeProp]
          )
          const sizeRange = isSizeCategorical
            ? legendObj.sizeByOptions[sizeProp]
            : nodeClustersFunc(mapId).range[group.properties.type].size
          const size = isSizeCategorical
            ? parseFloat(R.propOr('0', sizePropObj.value, sizeRange))
            : getScaledValue(
                R.prop('min', sizeRange),
                R.prop('max', sizeRange),
                parseFloat(
                  R.prop('startSize', legendObj.sizeByOptions[sizeProp])
                ),
                parseFloat(
                  R.prop('endSize', legendObj.sizeByOptions[sizeProp])
                ),
                parseFloat(sizePropObj.value)
              )

          const colorProp = legendObj.colorBy
          const colorObj = group.properties.colorProp
          const colorDomain = nodeClustersFunc(mapId).range[nodeType].color
          const isColorCategorical = !R.has('min')(
            legendObj.colorByOptions[colorProp]
          )
          const value = R.prop('value', colorObj)
          const colorRange = isColorCategorical
            ? legendObj.colorByOptions[colorProp]
            : R.map((prop) => legendObj.colorByOptions[colorProp][prop])([
                'startGradientColor',
                'endGradientColor',
              ])
          const color = isColorCategorical
            ? R.propOr('', value, colorRange)
                .replace(/[^\d,.]/g, '')
                .split(',')
            : getScaledRgbObj(
                [R.prop('min', colorDomain), R.prop('max', colorDomain)],
                colorRange,
                value
              )
          const id = R.pathOr(
            JSON.stringify(
              R.slice(0, 2, R.pathOr([], ['properties', 'grouped_ids'], group))
            ),
            ['properties', 'id']
          )(group)
          const colorString = `rgba(${color.join(',')})`
          return {
            type: 'Feature',
            properties: {
              cave_obj: group,
              cave_isCluster: true,
              cave_name: JSON.stringify([nodeType, id]),
              color: colorString,
              size: size / ICON_RESOLUTION,
              icon: legendObj.icon,
            },
            geometry: {
              type: 'Point',
              coordinates: group.geometry.coordinates,
            },
          }
        })(R.propOr([], 'data', nodeClustersFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeLayerGeoJsonFunc = createSelector(
  [selectNodeGeoJsonObjectFunc, selectNodeClusterGeoJsonObjectFunc],
  (nodesFunc, clustersFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.concat(nodesFunc(mapId), clustersFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectArcLayerGeoJsonFunc = createSelector(
  [selectArcRange, selectLineDataFunc, selectEnabledArcsFunc],
  (arcRange, arcDataFunc, legendObjectsFunc) => {
    const geometryFunc = (item) => {
      const finalEndLong =
        item.endLongitude - item.startLongitude >= 180
          ? (item.endLongitude -= 360)
          : item.endLongitude - item.startLongitude <= -180
            ? (item.endLongitude += 360)
            : item.endLongitude
      return {
        type: 'LineString',
        coordinates: item.path
          ? adjustArcPath(item.path)
          : [
              [item.startLongitude, item.startLatitude],
              [finalEndLong, item.endLatitude],
            ],
      }
    }
    const modifiedArcDataFunc = R.pipe(arcDataFunc, R.values, R.unnest)
    return constructGeoJson(
      arcRange,
      modifiedArcDataFunc,
      legendObjectsFunc,
      geometryFunc,
      'arc'
    )
  }
)

export const selectArcLayer3DGeoJsonFunc = createSelector(
  [selectArcRange, selectArcDataFunc, selectEnabledArcsFunc],
  (arcRange, arcDataFunc, legendObjectsFunc) => {
    const geometryFunc = (item) => {
      const finalEndLong =
        item.endLongitude - item.startLongitude >= 180
          ? (item.endLongitude -= 360)
          : item.endLongitude - item.startLongitude <= -180
            ? (item.endLongitude += 360)
            : item.endLongitude
      return {
        type: 'LineString',
        coordinates: item.path
          ? adjustArcPath(item.path)
          : [
              [item.startLongitude, item.startLatitude],
              [finalEndLong, item.endLatitude],
            ],
      }
    }
    const modifiedArcDataFunc = R.pipe(arcDataFunc, R.values, R.unnest)
    return constructGeoJson(
      arcRange,
      modifiedArcDataFunc,
      legendObjectsFunc,
      geometryFunc,
      'arc'
    )
  }
)

export const selectFetchedArcGeoJsonFunc = createSelector(
  [
    selectLineMatchingKeysByTypeFunc,
    selectArcRange,
    selectEnabledArcsFunc,
    selectArcTypes,
  ],
  (lineMatchingKeysByTypeFunc, arcRange, enabledArcsFunc, arcTypes) =>
    constructFetchedGeoJson(
      lineMatchingKeysByTypeFunc,
      arcRange,
      enabledArcsFunc,
      arcTypes,
      'arc'
    )
)

export const selectIncludedGeoJsonFunc = createSelector(
  [selectIncludedGeoDataFunc, selectGeoRange, selectEnabledGeosFunc],
  (includedGeoDataFunc, geoRange, legendObjectsFunc) => {
    const geometryFunc = (item) => ({
      type: 'Polygon',
      coordinates: [item.path],
    })
    const modifiedIncludedGeoDataFunc = R.pipe(
      includedGeoDataFunc,
      R.values,
      R.unnest
    )
    return constructGeoJson(
      geoRange,
      modifiedIncludedGeoDataFunc,
      legendObjectsFunc,
      geometryFunc,
      'geo'
    )
  }
)

export const selectFetchedGeoJsonFunc = createSelector(
  [
    selectGeoRange,
    selectEnabledGeosFunc,
    selectGeoTypes,
    selectMatchingKeysByTypeFunc,
  ],
  (geoRange, enabledGeosFunc, geoTypes, matchingKeysByTypeFunc) =>
    constructFetchedGeoJson(
      matchingKeysByTypeFunc,
      geoRange,
      enabledGeosFunc,
      geoTypes,
      'geo'
    )
)
