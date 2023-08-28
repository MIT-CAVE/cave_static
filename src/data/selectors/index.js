import { createSelector } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_ICON_URL,
  DEFAULT_VIEWPORT,
  DEFAULT_MAP_STYLES,
  MIN_ZOOM,
  MAX_ZOOM,
  MAX_MEMOIZED_CHARTS,
} from '../../utils/constants'
import { propId, statId, viewId, chartStatUses } from '../../utils/enums'
import { getStatFn } from '../../utils/stats'
import Supercluster from '../../utils/supercluster'

import {
  checkValidRange,
  filterItems,
  getTimeValue,
  sortProps,
  sortedListById,
  renameKeys,
  sortByOrderNameId,
  toListWithKey,
  forcePath,
  customSort,
  customSortByX,
  calculateStatAnyDepth,
  recursiveMap,
  maxSizedMemoization,
  getScaledValue,
  getScaledArray,
  getScaledRgbObj,
} from '../../utils'

export const selectUtilities = (state) => R.prop('utilities')(state)

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
// Local
export const selectLocal = (state) => R.propOr({}, 'local')(state)
// Local -> settings
export const selectLocalSettings = createSelector(selectLocal, (data) =>
  R.propOr({}, 'settings')(data)
)
export const selectTheme = createSelector(selectLocalSettings, (data) =>
  R.prop('theme')(data)
)
export const selectTime = createSelector(selectLocalSettings, (data) =>
  R.prop('time')(data)
)
export const selectSync = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'sync')(data)
)
export const selectMirrorMode = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'mirror', data)
)
// Data
export const selectData = (state) => R.prop('data')(state)
export const selectIgnoreData = createSelector(selectData, (data) =>
  R.propOr({}, 'ignore')(data)
)
export const selectVersionsData = createSelector(selectData, (data) =>
  R.propOr({}, 'versions')(data)
)
export const selectArcs = createSelector(selectData, (data) =>
  R.propOr({}, 'arcs')(data)
)
export const selectNodes = createSelector(selectData, (data) =>
  R.propOr({}, 'nodes')(data)
)
export const selectGeos = createSelector(selectData, (data) =>
  R.propOr({}, 'geos')(data)
)
export const selectAppBar = createSelector(selectData, (data) =>
  R.propOr({}, 'appBar')(data)
)
export const selectCategories = createSelector(selectData, (data) =>
  R.propOr({}, 'categories')(data)
)
export const selectStats = createSelector(selectData, (data) =>
  R.propOr({}, 'stats')(data)
)
export const selectKpis = createSelector(selectData, (data) =>
  R.propOr({}, 'kpis')(data)
)
export const selectDash = createSelector(selectData, (data) =>
  R.propOr({}, 'dashboards')(data)
)
export const selectAssociated = createSelector(selectData, (data) =>
  R.propOr({}, 'associated')(data)
)
export const selectSettings = createSelector(selectData, (data) =>
  R.propOr({}, 'settings')(data)
)
export const selectPanes = createSelector(selectData, (data) =>
  R.propOr({}, 'panes')(data)
)
export const selectModals = createSelector(selectData, (data) =>
  R.propOr({}, 'modals')(data)
)
export const selectMap = createSelector(selectData, R.propOr({}, 'maps'))
// Data -> Types
export const selectNodeTypes = createSelector(
  [selectNodes, selectTime],
  (data, time) => getTimeValue(time, R.propOr({}, 'types', data))
)
export const selectArcTypes = createSelector(
  [selectArcs, selectTime],
  (arcs, time) => getTimeValue(time, R.propOr({}, 'types', arcs))
)
export const selectGeoTypes = createSelector(
  [selectGeos, selectTime],
  (data, time) => getTimeValue(time, R.propOr({}, 'types', data)),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
// Data -> data
export const selectPanesData = createSelector(selectPanes, R.propOr({}, 'data'))
export const selectModalsData = createSelector(
  selectModals,
  R.propOr({}, 'data')
)
export const selectMapData = createSelector(selectMap, R.propOr({}, 'data'))

export const selectAppBarData = createSelector(selectAppBar, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectLeftAppBarData = createSelector(
  selectAppBarData,
  // Keep only sub objects with bar: upperLeft, lowerLeft, upper, lower
  R.pipe(
    R.dissoc('appBarId'),
    R.filter((appBarItem) =>
      R.includes(R.prop('bar', appBarItem), [
        'upperLeft',
        'lowerLeft',
        'upper',
        'lower',
      ])
    )
  )
)

export const selectRightAppBarData = createSelector(
  selectAppBarData,
  R.pipe(
    R.dissoc('appBarId'),
    R.filter((appBarItem) =>
      R.includes(R.prop('bar', appBarItem), ['upperRight', 'lowerRight'])
    )
  )
)
export const selectCategoriesData = createSelector(selectCategories, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectStatsData = createSelector(selectStats, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectKpisData = createSelector(selectKpis, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectKpisLayout = createSelector(
  selectKpis,
  R.propOr({}, 'layout')
)
export const selectAssociatedData = createSelector(selectAssociated, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectSettingsData = createSelector(selectSettings, (data) =>
  R.propOr({}, 'data')(data)
)

// Data -> settings
export const selectSettingsIconUrl = createSelector(
  selectSettingsData,
  (data) => R.propOr(DEFAULT_ICON_URL, 'iconUrl')(data)
)
export const selectDebug = createSelector(
  selectSettingsData,
  R.propOr(false, 'debug')
)
export const selectNumberFormat = createSelector(
  selectSettingsData,
  R.propOr({}, 'numberFormat')
)
export const selectDemoSettings = createSelector(
  selectSettingsData,
  R.propOr({}, 'demo')
)
export const selectDemoMode = createSelector(
  selectLocalSettings,
  (localSettings) => R.propOr(false, 'demo', localSettings)
)
export const selectTimeLength = createSelector(selectSettingsData, (data) =>
  R.propOr(0, 'timeLength')(data)
)
export const selectTimeUnits = createSelector(selectSettingsData, (data) =>
  R.propOr('unit', 'timeUnits')(data)
)
export const selectSyncToggles = createSelector(selectSettingsData, (data) =>
  R.propOr({}, 'sync', data)
)
// Data -> stats
export const selectStatisticTypes = createSelector(selectStats, (data) =>
  R.propOr({}, 'types')(data)
)
// Data -> dashboard
export const selectDashboardData = createSelector(selectDash, (data) =>
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
export const selectLocalPanesData = createSelector(selectLocalPanes, (data) =>
  R.prop('data', data)
)
//Local -> modals
export const selectLocalModals = createSelector(selectLocal, (data) =>
  R.prop('modals')(data)
)
export const selectLocalModalsData = createSelector(selectLocalModals, (data) =>
  R.prop('data', data)
)
// Local -> Dashboard
export const selectLocalDashboard = createSelector(selectLocal, (data) =>
  R.propOr({}, 'dashboards')(data)
)
export const selectLocalDashboardData = createSelector(
  selectLocalDashboard,
  (data) => R.prop('data', data)
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
  [selectLocalAppBar, selectAppBar],
  (localData, data) =>
    R.propOr(R.propOr({}, 'paneState', data), 'paneState', localData)
)
export const selectLeftOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'open', R.propOr({}, 'left', data))
)
export const selectLeftSecondaryOpenPane = createSelector(
  selectPaneState,
  (data) => R.propOr('', 'secondaryOpen', R.propOr({}, 'left', data))
)
export const selectLeftPinPane = createSelector(selectPaneState, (data) =>
  R.propOr(false, 'pin', R.propOr({}, 'left', data))
)
export const selectRightOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'open', R.propOr({}, 'right', data))
)
export const selectRightSecondaryOpenPane = createSelector(
  selectPaneState,
  (data) => R.propOr('', 'secondaryOpen', R.propOr({}, 'right', data))
)
export const selectRightPinPane = createSelector(selectPaneState, (data) =>
  R.propOr(false, 'pin', R.propOr({}, 'right', data))
)
export const selectOpenModal = createSelector(
  [selectLocalAppBar, selectAppBar],
  (localData, data) =>
    R.propOr(R.propOr({}, 'openModal', data), 'openModal', localData)
)
const groupAppBar = R.pipe(
  R.mergeDeepRight,
  R.toPairs,
  R.groupBy(
    R.cond([
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['upperLeft', 'upper'])),
        R.always('upperLeft'),
      ],
      [
        R.pipe(R.path([1, 'bar']), R.includes(R.__, ['lowerLeft', 'lower'])),
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
    (!mirrorMode && !R.isEmpty(leftData)) ||
    (mirrorMode && !R.isEmpty(rightData))
)
export const selectRightAppBarDisplay = createSelector(
  [selectMirrorMode, selectLeftAppBarData, selectRightAppBarData],
  (mirrorMode, leftData, rightData) =>
    (!mirrorMode && !R.isEmpty(rightData)) ||
    (mirrorMode && !R.isEmpty(leftData))
)
export const selectDemoViews = createSelector(
  [selectAppBarData, selectDemoSettings],
  (appBarData, demoSettings) =>
    R.pipe(
      R.toPairs,
      R.filter(
        (d) =>
          (R.propEq('stats', 'type', d[1]) ||
            R.propEq('map', 'type', d[1]) ||
            R.propEq('kpi', 'type', d[1])) &&
          R.pathOr(true, [d[0], 'show'], demoSettings)
      ),
      R.pluck(0)
    )(appBarData)
)
export const selectAppBarId = createSelector(
  [selectLocalAppBarData, selectAppBarData],
  (localAppBarData, appBarData) => {
    const fallbackId = R.pipe(
      sortProps,
      R.toPairs,
      R.find(R.pathEq('map', [1, 'type'])),
      R.prop(0)
    )(appBarData)
    const currentId = R.propOr(
      R.propOr(fallbackId, 'appBarId', appBarData),
      'appBarId',
      localAppBarData
    )
    return currentId
  }
)
export const selectStaticMap = createSelector(
  [selectAppBarId, selectAppBarData],
  (appBarId, appBarData) => R.pathOr(false, [appBarId, 'static'], appBarData)
)
// Merged Panes
export const selectLeftOpenPanesData = createSelector(
  [selectLeftOpenPane, selectPanesData, selectLocalPanesData],
  (leftOpenPane, panesData, localPanesData) =>
    R.mergeDeepRight(
      R.propOr({}, leftOpenPane, panesData),
      R.propOr({}, leftOpenPane, localPanesData)
    ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectRightOpenPanesData = createSelector(
  [selectRightOpenPane, selectPanesData, selectLocalPanesData],
  (rightOpenPane, panesData, localPanesData) =>
    R.mergeDeepRight(
      R.propOr({}, rightOpenPane, panesData),
      R.propOr({}, rightOpenPane, localPanesData)
    ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectOpenModalData = createSelector(
  [selectOpenModal, selectModalsData, selectLocalModalsData],
  (openModal, modalsData, localModalsData) =>
    R.mergeDeepRight(
      R.propOr({}, openModal, modalsData),
      R.propOr({}, openModal, localModalsData)
    ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectFiltered = createSelector(
  [selectPanes, selectLocalPanes, selectCategoriesData],
  (panes, localPanes, categoriesData) => {
    const selected = R.propOr(
      R.propOr({}, 'filtered', panes),
      'filtered',
      localPanes
    )
    return R.mapObjIndexed((val, category) => {
      const smallestItem = R.pipe(
        R.path([category, 'nestedStructure']),
        sortProps,
        R.keys,
        R.last
      )(categoriesData)
      const selectedVal = R.propOr([], category, selected)
      return R.isEmpty(selectedVal)
        ? R.pipe(R.prop('data'), R.pluck(smallestItem), R.values)(val)
        : selectedVal
    })(categoriesData)
  },
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
// Merged Dashboards
export const selectDashboard = createSelector(
  [selectAppBarId, selectDashboardData, selectLocalDashboardData],
  (appBarId, dashboardData, localdashboardData) =>
    R.propOr(
      R.propOr({}, appBarId, dashboardData),
      appBarId,
      localdashboardData
    )
)
export const selectStatOptions = createSelector(
  [selectAppBarId, selectDashboardData, selectLocalDashboardData],
  (appBarId, dashboardData, localDashboardData) =>
    R.pathOr(
      R.pathOr([], [appBarId, 'statOptions'], dashboardData),
      [appBarId, 'statOptions'],
      localDashboardData
    )
)
export const selectDashboardLayout = createSelector(
  [selectAppBarId, selectDashboardData, selectLocalDashboardData],
  (appBarId, dashboardData, localDashboardData) =>
    R.pathOr(
      R.pathOr({}, [appBarId, 'dashboardLayout'], dashboardData),
      [appBarId, 'dashboardLayout'],
      localDashboardData
    )
)
export const selectDashboardLockedLayout = createSelector(
  selectDashboard,
  (dashboard) => R.propOr(false, 'lockedLayout', dashboard)
)
export const selectAllowedStats = createSelector(
  [selectStatisticTypes, selectStatOptions],
  (statisticTypes, statOptions) =>
    R.isEmpty(statOptions)
      ? statisticTypes
      : R.pick(statOptions, statisticTypes)
)
// Map -> displayedMap
// export const selectCurrentMapData = createSelector(
//   [selectMapData, selectAppBarId],
//   (data, appBarId) => R.prop(appBarId, data)
// )

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
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('defaultViewport', a) && R.has('defaultViewport', b)
          ? R.equals(a.defaultViewport, b.defaultViewport)
          : a === b,
    },
  }
)

// Local -> Map
export const selectLocalMap = createSelector(selectLocal, (data) =>
  R.propOr({}, 'maps')(data)
)
export const selectLocalMapData = createSelector(selectLocalMap, (data) =>
  R.prop('data')(data)
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
export const selectLegendDataFunc = createSelector(
  [selectCurrentMapDataByMap, selectCurrentLocalMapDataByMap],
  (mapDataObj, localMapDataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pathOr(
          R.pathOr({}, ['legendGroups', mapId], mapDataObj),
          ['legendGroups', mapId],
          localMapDataObj
        ),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('legendGroups', a) && R.has('legendGroups', b)
          ? R.equals(a.legendGroups, b.legendGroups)
          : a === b,
    },
  }
)
export const selectMapControlsFunc = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.pathOr({}, ['mapControls', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('mapControls', a) && R.has('mapControls', b)
          ? R.equals(a.mapControls, b.mapControls)
          : a === b,
    },
  }
)
export const selectMapModalFunc = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.pathOr({}, ['mapModal', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('mapModal', a) && R.has('mapModal', b)
          ? R.equals(a.mapModal, b.mapModal)
          : a === b,
    },
  }
)
export const selectMapLayers = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapLayers')(data)
)
export const selectMapLegendFunc = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.pathOr({}, ['mapLegend', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('mapLegend', a) && R.has('mapLegend', b)
          ? R.equals(a.mapLegend, b.mapLegend)
          : a === b,
    },
  }
)
// Local -> kpis
const selectLocalKpis = createSelector(selectLocal, R.propOr({}, 'kpis'))
export const selectMergedKpis = createSelector(
  [selectKpisData, selectLocalKpis],
  (kpisData, localKpis) => R.mergeDeepLeft(localKpis)(kpisData)
)
export const selectMapKpis = createSelector(
  selectMergedKpis,
  R.pipe(
    R.filter(R.prop('mapKpi')),
    R.map(R.assoc('view', viewId.MAP)),
    sortedListById,
    R.values
  )
)
// Local -> Map -> mapControls
export const selectViewportFunc = createSelector(
  [selectMapControlsFunc, selectDefaultViewportFunc],
  (mapControlsFunc, defaultViewportFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.mergeAll([
          DEFAULT_VIEWPORT,
          defaultViewportFunc(mapId),
          R.propOr({}, 'viewport')(mapControlsFunc(mapId)),
        ]),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectBearingFunc = createSelector(
  selectViewportFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('bearing')(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectPitchFunc = createSelector(selectViewportFunc, (dataFunc) =>
  maxSizedMemoization(
    R.identity,
    (mapId) => R.prop('pitch')(dataFunc(mapId)),
    MAX_MEMOIZED_CHARTS
  )
)
export const selectZoomFunc = createSelector(selectViewportFunc, (dataFunc) =>
  maxSizedMemoization(
    R.identity,
    (mapId) => R.prop('zoom')(dataFunc(mapId)),
    MAX_MEMOIZED_CHARTS
  )
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
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('currentStyle', a) && R.has('currentStyle', b)
          ? R.equals(a.currentStyle, b.currentStyle)
          : a === b,
    },
  }
)
export const selectCurrentMapProjectionFunc = createSelector(
  selectCurrentMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.pathOr('mercator', ['currentProjection', mapId])(dataObj),
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('currentProjection', a) && R.has('currentProjection', b)
          ? R.equals(a.currentProjection, b.currentProjection)
          : a === b,
    },
  }
)
export const selectMapStyleOptions = createSelector(
  [selectSettingsData, selectMapboxToken],
  (data, token) => ({
    ...DEFAULT_MAP_STYLES,
    ...R.pipe(
      R.propOr([], 'additionalMapStyles'),
      R.filter(
        (style) =>
          token !== '' ||
          R.pipe(R.prop('spec'), R.startsWith('mapbox://'), R.not)(style)
      )
    )(data),
  })
)
export const selectPitchSliderToggleFunc = createSelector(
  selectMapControlsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('showPitchSlider')(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectBearingSliderToggleFunc = createSelector(
  selectMapControlsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.prop('showBearingSlider')(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
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
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('optionalViewports', a) && R.has('optionalViewports', b)
          ? R.equals(a.optionalViewports, b.optionalViewports)
          : a === b,
    },
  }
)
// Local -> Map -> layers
const selectEnabledTypesFn = createSelector(
  [selectCurrentLocalMapDataByMap, selectCurrentMapDataByMap],
  (localMapObj, mapDataObj) =>
    maxSizedMemoization(
      ({ mapId, layerKey }) => `${mapId}+${layerKey}`,
      ({ mapId, layerKey }) => {
        const getEnabledTypes = R.pipe(
          R.pathOr({}, ['legendGroups', mapId]),
          R.values,
          R.pluck(layerKey),
          R.mergeAll,
          R.mapObjIndexed(R.unless(R.prop('value'), R.F))
        )
        console.log('evaled')
        return R.when(
          R.isEmpty,
          R.always(getEnabledTypes(mapDataObj))
        )(getEnabledTypes(localMapObj))
      },
      MAX_MEMOIZED_CHARTS
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('legendGroups', a) && R.has('legendGroups', b)
          ? R.equals(a.legendGroups, b.legendGroups)
          : a === b,
    },
  }
)
export const selectEnabledArcsFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'arcs' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledNodesFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'nodes' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledGeosFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'geos' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectGeo = createSelector(
  selectMapLayers,
  R.propOr({}, 'geography')
)

// Local -> features (arcs, nodes, geos)
export const selectLocalNodes = createSelector(selectLocal, (data) =>
  R.prop('nodes', data)
)
export const selectLocalArcs = createSelector(selectLocal, (data) =>
  R.prop('arcs', data)
)
export const selectLocalGeos = createSelector(selectLocal, (data) =>
  R.prop('geos', data)
)
export const selectLocalizedNodeTypes = createSelector(
  [selectNodeTypes, selectLocalNodes, selectTime],
  (nodeTypes, localNodes, time) =>
    R.propOr(nodeTypes, 'types', getTimeValue(time, localNodes)),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectLocalizedArcTypes = createSelector(
  [selectArcTypes, selectLocalArcs, selectTime],
  (arcTypes, localArcs, time) =>
    R.propOr(arcTypes, 'types', getTimeValue(time, localArcs)),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectLocalizedGeoTypes = createSelector(
  [selectGeoTypes, selectLocalGeos, selectTime],
  (geoTypes, localGeos, time) =>
    R.propOr(geoTypes, 'types', getTimeValue(time, localGeos)),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectArcTypeKeys = createSelector(
  selectLocalizedArcTypes,
  (data) => R.keys(data),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
export const selectNodeTypeKeys = createSelector(
  selectLocalizedNodeTypes,
  (data) => R.keys(data),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)

const mergeFunc = (data) =>
  maxSizedMemoization(
    (d) => d,
    (d) => [
      d[0],
      R.pipe(
        R.mergeRight(R.propOr({}, d[1].type, data)),
        R.over(
          R.lensProp('props'),
          R.mergeDeepRight(R.pathOr({}, [d[1].type, 'props'])(data))
        )
      )(d[1]),
    ],
    1000000
  )
const selectMemoizedArcMergeFunc = createSelector(
  selectLocalizedArcTypes,
  (arcTypes) => mergeFunc(arcTypes)
)
const selectMemoizedNodeMergeFunc = createSelector(
  selectLocalizedNodeTypes,
  (nodeTypes) => mergeFunc(nodeTypes)
)
const selectMemoizedGeoMergeFunc = createSelector(
  selectLocalizedGeoTypes,
  (geoTypes) => mergeFunc(geoTypes)
)
const getMergedAllProps = (data, localData, memoized) =>
  R.pipe(
    R.propOr(R.propOr({}, 'data', data), 'data'),
    R.toPairs,
    R.map(memoized),
    R.fromPairs
  )(localData)

export const selectMergedArcs = createSelector(
  [selectArcs, selectLocalArcs, selectMemoizedArcMergeFunc, selectTime],
  (arcs, localArcs, mergeFunc, time) =>
    getMergedAllProps(
      getTimeValue(time, arcs),
      getTimeValue(time, localArcs),
      mergeFunc
    ),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('data', a)
          ? R.prop('data', a) === R.prop('data', b) &&
            R.prop('types', a) === R.prop('types', b)
          : a === b,
    },
  }
)
export const selectMergedNodes = createSelector(
  [selectNodes, selectLocalNodes, selectMemoizedNodeMergeFunc, selectTime],
  (nodes, localNodes, mergeFunc, time) =>
    getMergedAllProps(
      getTimeValue(time, nodes),
      getTimeValue(time, localNodes),
      mergeFunc
    )
)
export const selectMergedGeos = createSelector(
  [selectGeos, selectLocalGeos, selectMemoizedGeoMergeFunc, selectTime],
  (geos, localGeos, mergeFunc, time) =>
    getMergedAllProps(
      getTimeValue(time, geos),
      getTimeValue(time, localGeos),
      mergeFunc
    )
)
// Map (Custom)
export const selectLayerById = (state, id) =>
  R.path(['local', 'map', 'mapLayers', id])(state)

// Filtering
export const selectAcceptableFilterCategories = createSelector(
  [selectFiltered, selectCategoriesData],
  (filtered, categoriesData) => {
    const allowedCategories = {}
    for (let category in categoriesData) {
      allowedCategories[category] = new Set()
      const smallestItem = R.pipe(
        R.path([category, 'nestedStructure']),
        sortProps,
        R.keys,
        R.last
      )(categoriesData)
      const filteredItems = R.propOr({}, category, filtered)
      const categoryItems = R.path([category, 'data'], categoriesData)
      for (let item in categoryItems) {
        if (
          R.isEmpty(filteredItems) ||
          R.includes(
            R.propOr('', smallestItem, categoryItems[item]),
            filteredItems
          )
        ) {
          allowedCategories[category].add(item)
        }
      }
    }
    return allowedCategories
  }
)
export const selectFilterFunction = createSelector(
  [selectAcceptableFilterCategories],
  (acceptableFilterCategories) => filterItems(R.__, acceptableFilterCategories)
)
export const selectFilteredArcsData = createSelector(
  [selectFilterFunction, selectMergedArcs],
  (filterFunction, arcsData) => filterFunction(arcsData)
)
export const selectFilteredNodes = createSelector(
  [selectFilterFunction, selectMergedNodes],
  (filterFunction, nodesData) => filterFunction(nodesData)
)
export const selectFilteredStatsData = createSelector(
  [selectFilterFunction, selectStatsData],
  (filterFunction, statsData) => filterFunction(statsData)
)
export const selectFilteredGeosData = createSelector(
  [selectFilterFunction, selectMergedGeos],
  (filterFunction, geosData) => filterFunction(geosData)
)
export const selectNodeDataFunc = createSelector(
  [selectEnabledNodesFunc, selectFilteredNodes],
  (enabledNodesFunc, filteredData) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.toPairs(
          R.filter((d) => R.propOr(false, d.type, enabledNodesFunc(mapId)))(
            filteredData
          )
        ),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodesByType = createSelector(
  selectFilteredNodes,
  R.pipe(R.values, R.groupBy(R.prop('type')))
)
export const selectArcsByType = createSelector(
  selectFilteredArcsData,
  R.pipe(R.values, R.groupBy(R.prop('type')))
)
export const selectGeosByType = createSelector(
  selectFilteredGeosData,
  R.pipe(
    R.mapObjIndexed((val, key) => R.assoc('data_key', key, val)),
    R.values,
    R.groupBy(R.prop('type'))
  )
)
export const selectMatchingKeysByTypeFunc = createSelector(
  [selectEnabledGeosFunc, selectGeosByType],
  (enabledGeosFunc, geosByType) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.pick(R.keys(R.filter(R.identity, enabledGeosFunc(mapId)))),
          R.map(R.indexBy(R.prop('geoJsonValue')))
        )(geosByType),
      MAX_MEMOIZED_CHARTS
    )
)
// Stats derived
export const selectCategoryFunc = createSelector(
  selectCategoriesData,
  (categories) => (category, level) => (stat) =>
    R.path(
      [category, 'data', R.path(['category', category, 0], stat), level],
      categories
    )
)
export const selectMemoizedChartFunc = createSelector(
  [
    selectFilteredStatsData,
    selectCategoryFunc,
    selectDebug,
    selectCategoriesData,
    selectStatisticTypes,
  ],
  (filteredStatsData, categoryFunc, debug, categoriesData, statisticTypes) =>
    maxSizedMemoization(
      (obj) => JSON.stringify(obj),
      (obj) => {
        const pathedVar = forcePath(R.propOr([], 'statistic', obj))
        const actualStat = R.has(R.prop('chart', obj), chartStatUses)
          ? pathedVar
          : obj.statistic
        const mergeFuncs = {
          Sum: R.sum,
          Minimum: (val) => R.reduce(R.min, R.head(val), R.tail(val)),
          Maximum: (val) => R.reduce(R.max, R.head(val), R.tail(val)),
          Average: R.mean,
        }
        // Find the calculation for selected stat(s)
        const calculation = R.is(Array, actualStat)
          ? `[${R.reduce(
              (acc, stat) =>
                R.insert(
                  -1,
                  R.pathOr('0', [stat, 'calculation'])(statisticTypes),
                  acc
                ),
              '',
              actualStat
            )}]`
          : R.pathOr('0', [actualStat, 'calculation'])(statisticTypes)

        // Filter for category if selected
        const actualStatsData = obj.category
          ? R.filter(R.hasPath(['category', obj.category]))(
              R.values(filteredStatsData)
            )
          : R.values(filteredStatsData)

        // List of groupBy, subGroupBy etc...
        // TODO: Currently groupBys only looks for group and subgroup - make this N depth
        const groupBys = R.without(
          [undefined],
          [
            categoryFunc(obj.category, obj.level),
            R.has('level2', obj)
              ? categoryFunc(obj.category2, obj.level2)
              : undefined,
          ]
        )
        // Calculates stat values without applying mergeFunc
        const calculatedStats = calculateStatAnyDepth(actualStatsData)(
          groupBys,
          calculation
        )

        // Ordering for the X's in the chart
        const ordering = R.pathOr(
          [],
          [obj.category, 'nestedStructure', obj.level, 'ordering']
        )(categoriesData)

        // Helper function for grouping table vals for merge function
        const groupByIdx = R.addIndex(R.groupBy)(
          (val, idx) => idx % R.length(actualStat)
        )

        // merge the calculated stats - unless boxplot
        // NOTE: Boxplot needs subgrouping - handle this in chart adapter
        const statValues = recursiveMap(
          R.is(Array),
          R.has(R.prop('chart', obj), chartStatUses)
            ? R.pipe(
                R.unnest,
                groupByIdx,
                R.values,
                R.map(mergeFuncs[obj.grouping])
              )
            : R.pipe(
                R.filter(R.is(Number)),
                obj.chart !== 'Box Plot' ? mergeFuncs[obj.grouping] : R.identity
              ),
          R.identity,
          calculatedStats
        )

        // Helper function to map merged stats to chart input object
        const recursiveMapLayers = (val) =>
          R.type(val) === 'Object'
            ? R.pipe(R.values, R.head, (item) => R.type(item) === 'Object')(val)
              ? R.values(
                  R.mapObjIndexed((value, key) => ({
                    name: R.isNil(obj.category) ? 'All' : key,
                    children: recursiveMapLayers(value),
                  }))(val)
                )
              : R.values(
                  R.mapObjIndexed((value, key) => ({
                    name: key,
                    value: recursiveMapLayers(value),
                  }))(val)
                )
            : R.is(Array, val)
            ? val
            : [val]
        // Formats and sorts merged stats
        const getFormattedData = R.pipe(
          debug
            ? R.identity
            : recursiveMap(
                (val) => R.type(val) !== 'Object',
                R.identity,
                R.dissoc(undefined)
              ),
          recursiveMapLayers,
          customSortByX(ordering)
        )

        const formattedData = getFormattedData(statValues)

        return formattedData
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectMemoizedKpiFunc = createSelector(
  selectAssociatedData,
  (associatedData) =>
    maxSizedMemoization(
      (obj) => JSON.stringify(obj),
      (obj) => {
        const selectedKpis = forcePath(R.propOr([], 'kpi', obj))
        const formattedKpis = R.pipe(
          R.values,
          R.filter((val) =>
            R.includes(val.name, R.propOr([], 'sessions', obj))
          ),
          R.map((val) => ({
            name: val.name,
            children: R.pipe(
              R.path(['data', 'kpis', 'data']),
              R.pick(selectedKpis),
              R.filter(R.has('value')),
              customSort,
              R.map((kpi) =>
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
                    )(kpi),
                  ],
                  { name: kpi.name || kpi.id }
                )
              )
            )(val),
          })),
          R.when(
            R.always(R.has(R.prop('chart', obj), chartStatUses)),
            R.map((session) => ({
              name: session.name,
              value: R.unnest(R.pluck('value', session.children)),
            }))
          )
        )(associatedData)
        return formattedKpis
      },
      MAX_MEMOIZED_CHARTS
    )
)
// Node, Geo, & Arc derived
export const selectGroupedEnabledArcsFunc = createSelector(
  [
    selectEnabledArcsFunc,
    selectFilteredArcsData,
    selectCurrentMapProjectionFunc,
  ],
  (enabledArcsFunc, filteredArcs, projectionFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.filter((d) => R.propOr(false, d.type, enabledArcsFunc(mapId))),
          // 3d arcs grouped under true - others false
          R.toPairs,
          R.groupBy(
            R.pipe(
              R.prop(1),
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
        )(filteredArcs),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.toPairs(R.prop('false', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.toPairs(R.prop('3d', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectMultiLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) => R.toPairs(R.prop('geoJson', dataFunc(mapId))),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcRange = createSelector(
  [selectArcTypes, selectArcsByType],
  (arcs, arcsByType) =>
    R.memoizeWith(
      (type, prop, size) => [type, prop, size],
      (type, prop, size) =>
        R.pipe(
          R.path([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['props', prop, 'value'], value)),
                  min: R.min(acc.min, R.path(['props', prop, 'value'], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, arcsByType))
            )
          ),
          R.when(
            (range) => size && (!R.has('min', range) || !R.has('max', range)),
            () => {
              console.warn('sizeBy does not support categorical variables.')
              return { min: 0, max: 0 }
            }
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(arcs)
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

            const sizeValue = R.path(['props', sizeProp, 'value'], d[1])
            const colorValue = R.path(['props', colorProp, 'value'], d[1])

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
  [selectNodeTypes, selectNodesByType],
  (nodeTypes, nodesByType) =>
    R.memoizeWith(
      (type, prop, size) => [type, prop, size],
      (type, prop, size) =>
        R.pipe(
          R.path([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['props', prop, 'value'], value)),
                  min: R.min(acc.min, R.path(['props', prop, 'value'], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, nodesByType))
            )
          ),
          R.when(
            (range) => size && (!R.has('min', range) || !R.has('max', range)),
            () => {
              console.warn('sizeBy does not support categorical variables.')
              return { min: 0, max: 0 }
            }
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(nodeTypes)
    )
)
export const selectGeoColorRange = createSelector(
  [selectGeoTypes, selectGeosByType],
  (geoTypes, geosByType) =>
    R.memoizeWith(
      (type, prop) => [type, prop],
      (type, prop) =>
        R.pipe(
          R.path([type, 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(acc.max, R.path(['props', prop, 'value'], value)),
                  min: R.min(acc.min, R.path(['props', prop, 'value'], value)),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, geosByType))
            )
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(geoTypes)
    )
)

export const selectMatchingKeysFunc = createSelector(
  [selectEnabledGeosFunc, selectGeosByType, selectTheme, selectGeoColorRange],
  (enabledGeosFunc, geosByType, themeType, geoRange) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.pick(R.keys(R.filter(R.identity, enabledGeosFunc(mapId)))),
          R.values,
          R.reduce(R.concat, []),
          R.filter((d) => {
            const colorProp = R.path(
              [d.type, 'colorBy'],
              enabledGeosFunc(mapId)
            )

            const statRange = geoRange(d.type, colorProp, false)

            return !(
              R.has('nullColor', statRange) &&
              R.isNil(R.prop('nullColor', statRange))
            )
          }),
          R.indexBy(R.prop('geoJsonValue'))
        )(geosByType),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectLineMatchingKeysFunc = createSelector(
  [selectMultiLineDataFunc, selectArcRange, selectTheme, selectEnabledArcsFunc],
  (dataFunc, arcRange, themeType, enabledArcsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.map((d) => R.assoc('data_key', d[0], d[1])),
          R.filter((d) => {
            const colorProp = R.path(
              [d.type, 'colorBy'],
              enabledArcsFunc(mapId)
            )

            const statRange = arcRange(d.type, colorProp, false)

            return !(
              R.has('nullColor', statRange) &&
              R.isNil(R.prop('nullColor', statRange))
            )
          }),
          R.indexBy(R.prop('geoJsonValue'))
        )(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectLineMatchingKeysByTypeFunc = createSelector(
  selectLineMatchingKeysFunc,
  (dataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.toPairs,
          R.groupBy(R.path([1, 'type'])),
          R.map(R.fromPairs)
        )(dataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectGetLegendGroupId = createSelector(
  selectLegendDataFunc,
  (legendDataFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.curry((layerKey, type) =>
          R.pipe(
            toListWithKey('id'),
            R.find(R.hasPath([layerKey, type])),
            R.prop('id')
          )(legendDataFunc(mapId))
        ),
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
        const getClusterSizeLimits = (cluster, sizeProp) =>
          R.path(['properties', 'cluster'], cluster)
            ? cluster.properties[sizeProp]
            : R.pick(['startSize', 'endSize'], cluster.properties)

        const getClustersColorLimits = (cluster, colorProp) =>
          R.path(['properties', 'cluster'], cluster)
            ? cluster.properties[colorProp]
            : cluster.properties.colorByOptions[colorProp]

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
                    value: [d.props[sizeProp].value],
                    startSize: d.startSize,
                    endSize: d.endSize,
                  }
                : {},
            }

            const isCategorical = d.props[colorProp].type !== propId.NUMBER
            const colorPropObj = {
              [colorProp]: colorProp
                ? {
                    type: d.props[colorProp].type,
                    value: [d.props[colorProp].value],
                    ...(isCategorical
                      ? d.colorByOptions[colorProp]
                      : {
                          startGradientColor:
                            d.colorByOptions[colorProp].startGradientColor,
                          endGradientColor:
                            d.colorByOptions[colorProp].endGradientColor,
                        }),
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
                    groupCalculationFn([cluster.properties.props[prop].value])

              // All elements of a cluster contain the same `nodeType`
              // required to get the corresponding calculationGroup (color or size)
              const colorGroupFn = getColorGroupFn(cluster)
              const sizeGroupFn = getSizeGroupFn(cluster)

              // calculate the color and size value based on the agg func
              const colorValue = getDomainValue(colorProp, colorGroupFn)
              const sizeValue = getDomainValue(sizeProp, sizeGroupFn)

              // set the values including min/max size/color
              cluster.properties.colorProp = {
                ...getClustersColorLimits(cluster, colorProp),
                value: colorValue,
              }
              cluster.properties.sizeProp = {
                ...getClusterSizeLimits(cluster, sizeProp),
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
  [selectNodeClustersFunc, selectViewportFunc],
  (nodeClustersFunc, viewportFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.propOr(
          {},
          Math.floor(viewportFunc(mapId).zoom),
          nodeClustersFunc(mapId)
        ),
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
  [
    selectSplitNodeDataFunc,
    selectNodeRange,
    selectEnabledNodesFunc,
    selectTheme,
  ],
  (nodeDataSplitFunc, nodeRange, legendObjectsFunc, themeType) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.propOr({}, false),
          R.mapObjIndexed((obj) => {
            const [id, node] = obj

            const sizeProp = R.path(
              [node.type, 'sizeBy'],
              legendObjectsFunc(mapId)
            )
            const sizeRange = nodeRange(node.type, sizeProp, true)
            const sizePropVal = parseFloat(
              R.path(['props', sizeProp, 'value'], node)
            )
            const size = isNaN(sizePropVal)
              ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
              : getScaledValue(
                  R.prop('min', sizeRange),
                  R.prop('max', sizeRange),
                  parseFloat(R.prop('startSize', node)),
                  parseFloat(R.prop('endSize', node)),
                  sizePropVal
                )
            const colorProp = R.path(
              [node.type, 'colorBy'],
              legendObjectsFunc(mapId)
            )
            const colorPropVal = R.pipe(
              R.path(['props', colorProp, 'value']),
              R.when(R.isNil, R.always('')),
              (s) => s.toString()
            )(node)
            const colorRange = nodeRange(node.type, colorProp, false)

            const nullColor = R.pathOr(
              R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
              ['nullColor', themeType],
              colorRange
            )

            const isCategorical = !R.has('min', colorRange)
            const color = isCategorical
              ? R.map((val) => parseFloat(val))(
                  R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
                    .replace(/[^\d,.]/g, '')
                    .split(',')
                )
              : getScaledArray(
                  R.prop('min', colorRange),
                  R.prop('max', colorRange),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('startGradientColor', colorRange),
                      ['startGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('endGradientColor', colorRange),
                      ['endGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  parseFloat(colorPropVal)
                )
            const colorString = R.equals('', colorPropVal)
              ? nullColor
              : `rgb(${color.join(',')})`
            return {
              type: 'Feature',
              properties: {
                cave_obj: node,
                cave_name: id,
                color: colorString,
                size: size / 250,
                icon: node.icon,
              },
              geometry: {
                type: 'Point',
                coordinates: [node.longitude, node.latitude],
              },
            }
          }),
          R.values
        )(nodeDataSplitFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectNodeClusterGeoJsonObjectFunc = createSelector(
  [selectNodeClustersAtZoomFunc, selectTheme],
  (nodeClustersFunc, themeType) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.map((group) => {
          const sizeRange =
            nodeClustersFunc(mapId).range[group.properties.type].size
          const sizePropObj = R.path(['properties', 'sizeProp'], group)

          const size = getScaledValue(
            R.prop('min', sizeRange),
            R.prop('max', sizeRange),
            parseFloat(R.prop('startSize', sizePropObj)),
            parseFloat(R.prop('endSize', sizePropObj)),
            parseFloat(sizePropObj.value)
          )

          const nodeType = group.properties.type
          const colorObj = group.properties.colorProp
          const colorDomain = nodeClustersFunc(mapId).range[nodeType].color
          const isCategorical = !R.has('min')(colorDomain)
          const value = R.prop('value', colorObj)
          const colorRange = isCategorical
            ? colorObj
            : R.map((prop) =>
                R.pathOr(colorObj[prop], [prop, themeType])(colorObj)
              )(['startGradientColor', 'endGradientColor'])

          const color = isCategorical
            ? R.when(
                R.has(themeType),
                R.prop(themeType)
              )(R.prop(value, colorRange))
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

          const colorString = `rgb(${color.join(',')})`
          return {
            type: 'Feature',
            properties: {
              cave_obj: group,
              cave_isCluster: true,
              cave_name: id,
              color: colorString,
              size: size / 250,
              icon: group.properties.icon,
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
  [selectArcRange, selectTheme, selectLineDataFunc, selectEnabledArcsFunc],
  (arcRange, themeType, arcDataFunc, legendObjectsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.map(([id, arc]) => {
            const sizeProp = R.path(
              [arc.type, 'sizeBy'],
              legendObjectsFunc(mapId)
            )
            const sizeRange = arcRange(arc.type, sizeProp, true)
            const sizePropVal = parseFloat(
              R.path(['props', sizeProp, 'value'], arc)
            )
            const size = isNaN(sizePropVal)
              ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
              : getScaledValue(
                  R.prop('min', sizeRange),
                  R.prop('max', sizeRange),
                  parseFloat(R.prop('startSize', arc)),
                  parseFloat(R.prop('endSize', arc)),
                  sizePropVal
                )
            const colorProp = R.path(
              [arc.type, 'colorBy'],
              legendObjectsFunc(mapId)
            )
            const colorRange = arcRange(arc.type, colorProp, false)
            const isCategorical = !R.has('min', colorRange)
            const colorPropVal = R.pipe(
              R.path(['props', colorProp, 'value']),
              R.when(R.isNil, R.always('')),
              (s) => s.toString()
            )(arc)

            if (
              R.has('nullColor', colorRange) &&
              R.isNil(R.prop('nullColor', colorRange)) &&
              R.equals('', colorPropVal)
            )
              return false

            const nullColor = R.pathOr(
              R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
              ['nullColor', themeType],
              colorRange
            )

            const color = isCategorical
              ? R.map((val) => parseFloat(val))(
                  R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
                    .replace(/[^\d,.]/g, '')
                    .split(',')
                )
              : getScaledArray(
                  R.prop('min', colorRange),
                  R.prop('max', colorRange),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('startGradientColor', colorRange),
                      ['startGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('endGradientColor', colorRange),
                      ['endGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  parseFloat(colorPropVal)
                )
            const colorString = R.equals('', colorPropVal)
              ? nullColor
              : `rgb(${color.join(',')})`

            const dashPattern = R.propOr('solid', 'lineBy')(arc)

            return {
              type: 'Feature',
              properties: {
                cave_obj: arc,
                cave_name: id,
                color: colorString,
                size: size,
                dash: dashPattern,
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [arc.startLongitude, arc.startLatitude],
                  [arc.endLongitude, arc.endLatitude],
                ],
              },
            }
          }),
          R.filter(R.identity),
          R.groupBy(R.path(['properties', 'dash']))
        )(arcDataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectArcLayer3DGeoJsonFunc = createSelector(
  [selectArcRange, selectTheme, selectArcDataFunc, selectEnabledArcsFunc],
  (arcRange, themeType, arcDataFunc, legendObjectsFunc) =>
    maxSizedMemoization(
      R.identity,
      (mapId) =>
        R.pipe(
          R.map(([id, arc]) => {
            const sizeProp = R.path(
              [arc.type, 'sizeBy'],
              legendObjectsFunc(mapId)
            )
            const sizeRange = arcRange(arc.type, sizeProp, true)
            const sizePropVal = parseFloat(
              R.path(['props', sizeProp, 'value'], arc)
            )
            const size = isNaN(sizePropVal)
              ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
              : getScaledValue(
                  R.prop('min', sizeRange),
                  R.prop('max', sizeRange),
                  parseFloat(R.prop('startSize', arc)),
                  parseFloat(R.prop('endSize', arc)),
                  sizePropVal
                )
            const colorProp = R.path(
              [arc.type, 'colorBy'],
              legendObjectsFunc(mapId)
            )
            const colorRange = arcRange(arc.type, colorProp, false)
            const isCategorical = !R.has('min', colorRange)
            const colorPropVal = R.pipe(
              R.path(['props', colorProp, 'value']),
              R.when(R.isNil, R.always('')),
              (s) => s.toString()
            )(arc)

            if (
              R.has('nullColor', colorRange) &&
              R.isNil(R.prop('nullColor', colorRange)) &&
              R.equals('', colorPropVal)
            )
              return false

            const nullColor = R.pathOr(
              R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
              ['nullColor', themeType],
              colorRange
            )

            const color = isCategorical
              ? R.map((val) => parseFloat(val))(
                  R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
                    .replace(/[^\d,.]/g, '')
                    .split(',')
                )
              : getScaledArray(
                  R.prop('min', colorRange),
                  R.prop('max', colorRange),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('startGradientColor', colorRange),
                      ['startGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  R.map((val) => parseFloat(val))(
                    R.pathOr(
                      R.prop('endGradientColor', colorRange),
                      ['endGradientColor', themeType],
                      colorRange
                    )
                      .replace(/[^\d,.]/g, '')
                      .split(',')
                  ),
                  parseFloat(colorPropVal)
                )
            const colorString = R.equals('', colorPropVal)
              ? nullColor
              : `rgb(${color.join(',')})`

            const dashPattern = R.propOr('solid', 'lineBy')(arc)

            return {
              type: 'Feature',
              properties: {
                cave_obj: arc,
                cave_name: id,
                color: colorString,
                size: size,
                dash: dashPattern,
              },
              geometry: {
                type: 'LineString',
                coordinates: [
                  [arc.startLongitude, arc.startLatitude],
                  [arc.endLongitude, arc.endLatitude],
                ],
              },
            }
          }),
          R.filter(R.identity)
        )(arcDataFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)
