import { createSelector } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_ICON_URL,
  DEFAULT_VIEWPORT,
  MIN_ZOOM,
  MAX_ZOOM,
  MAX_MEMOIZED_CHARTS,
} from '../../utils/constants'
import { propId, statId, viewId } from '../../utils/enums'
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
export const selectMap = createSelector(selectData, R.propOr({}, 'maps'))
// Data -> Types
export const selectNodeTypes = createSelector(
  selectNodes,
  R.propOr({}, 'types')
)
export const selectArcTypes = createSelector(selectArcs, R.propOr({}, 'types'))
export const selectGeoTypes = createSelector(
  selectGeos,
  R.propOr({}, 'types'),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
// Data -> data
export const selectPanesData = createSelector(selectPanes, R.propOr({}, 'data'))
export const selectMapData = createSelector(selectMap, R.propOr({}, 'data'))

export const selectAppBarData = createSelector(selectAppBar, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectLeftAppBarData = createSelector(
  selectAppBarData,
  R.pipe(
    R.dissoc('appBarId'),
    R.toPairs,
    R.filter((keyDataPair) =>
      R.includes(R.prop('bar', keyDataPair[1]), [
        'upperLeft',
        'lowerLeft',
        'upper',
        'lower',
      ])
    ),
    R.fromPairs
  )
)
export const selectRightAppBarData = createSelector(
  selectAppBarData,
  R.pipe(
    R.dissoc('appBarId'),
    R.toPairs,
    R.filter((keyDataPair) =>
      R.includes(R.prop('bar', keyDataPair[1]), ['upperRight', 'lowerRight'])
    ),
    R.fromPairs
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
// Local
export const selectLocal = (state) => R.propOr({}, 'local')(state)
// Local -> panes
export const selectLocalPanes = createSelector(selectLocal, (data) =>
  R.prop('panes')(data)
)
export const selectLocalPanesData = createSelector(selectLocalPanes, (data) =>
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
export const selectTouchMode = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'touch', data)
)
export const selectMirrorMode = createSelector(selectLocalSettings, (data) =>
  R.propOr(false, 'mirror', data)
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
const groupAppBar = R.pipe(
  R.mergeDeepRight,
  R.toPairs,
  R.groupBy(R.path([1, 'bar'])),
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
export const selectCurrentMapData = createSelector(
  [selectMapData, selectAppBarId],
  (data, appBarId) => R.prop(appBarId, data)
)

export const selectDefaultViewport = createSelector(
  selectCurrentMapData,
  (data) =>
    R.pipe(
      R.propOr({}, 'defaultViewport'),
      R.when(
        R.has('zoom'),
        R.over(R.lensProp('zoom'), R.clamp(MIN_ZOOM, MAX_ZOOM))
      )
    )(data)
)
// Local -> Map
export const selectLocalMap = createSelector(selectLocal, (data) =>
  R.propOr({}, 'maps')(data)
)
export const selectLocalMapData = createSelector(selectLocalMap, (data) =>
  R.prop('data')(data)
)
export const selectCurrentLocalMapData = createSelector(
  [selectLocalMapData, selectAppBarId],
  (data, appBarId) => R.propOr({}, appBarId)(data)
)
export const selectLegendData = createSelector(
  [selectCurrentMapData, selectCurrentLocalMapData],
  (mapData, localMapData) =>
    R.propOr(
      R.propOr({}, 'legendGroups', mapData),
      'legendGroups',
      localMapData
    )
)
export const selectMapControls = createSelector(
  selectCurrentLocalMapData,
  (data) => R.propOr({}, 'mapControls')(data)
)
export const selectMapModal = createSelector(
  selectCurrentLocalMapData,
  (data) => R.propOr({}, 'mapModal')(data),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectMapLayers = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapLayers')(data)
)
export const selectMapLegend = createSelector(
  selectCurrentLocalMapData,
  (data) => R.propOr({}, 'mapLegend')(data),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
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
export const selectViewport = createSelector(
  [selectMapControls, selectDefaultViewport],
  (mapControls, defaultViewport) =>
    R.mergeAll([
      DEFAULT_VIEWPORT,
      defaultViewport,
      R.propOr({}, 'viewport')(mapControls),
    ])
)
export const selectBearing = createSelector(selectViewport, (data) =>
  R.prop('bearing')(data)
)
export const selectPitch = createSelector(selectViewport, (data) =>
  R.prop('pitch')(data)
)
export const selectZoom = createSelector(selectViewport, (data) =>
  R.prop('zoom')(data)
)
export const selectMapStyle = createSelector(selectMapControls, (data) =>
  R.prop('mapStyle')(data)
)
export const selectPitchSliderToggle = createSelector(
  selectMapControls,
  (data) => R.prop('showPitchSlider')(data)
)
export const selectBearingSliderToggle = createSelector(
  selectMapControls,
  (data) => R.prop('showBearingSlider')(data)
)
export const selectOptionalViewports = createSelector(
  selectCurrentMapData,
  (data) => R.propOr({}, 'optionalViewports')(data)
)
// Local -> Map -> layers
const selectEnabledTypesFn = createSelector(
  [selectCurrentLocalMapData, selectCurrentMapData],
  (localMap, mapData) => (layerKey) => {
    const getEnabledTypes = R.pipe(
      R.propOr({}, 'legendGroups'),
      R.values,
      R.pluck(layerKey),
      R.mergeAll,
      R.mapObjIndexed(R.unless(R.prop('value'), R.F))
    )
    return R.when(
      R.isEmpty,
      R.always(getEnabledTypes(mapData))
    )(getEnabledTypes(localMap))
  },
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectEnabledArcs = createSelector(
  selectEnabledTypesFn,
  R.applyTo('arcs'),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectEnabledNodes = createSelector(
  selectEnabledTypesFn,
  R.applyTo('nodes'),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectEnabledGeos = createSelector(
  selectEnabledTypesFn,
  R.applyTo('geos'),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
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
  [selectNodeTypes, selectLocalNodes],
  (nodeTypes, localNodes) => R.propOr(nodeTypes, 'types', localNodes)
)
export const selectLocalizedArcTypes = createSelector(
  [selectArcTypes, selectLocalArcs],
  (arcTypes, localArcs) => R.propOr(arcTypes, 'types', localArcs)
)
export const selectLocalizedGeoTypes = createSelector(
  [selectGeoTypes, selectLocalGeos],
  (geoTypes, localGeos) => R.propOr(geoTypes, 'types', localGeos)
)

const selectMemoizedMergeFunc = createSelector(
  [selectLocalizedGeoTypes, selectLocalizedNodeTypes, selectLocalizedArcTypes],
  (geoTypes, nodeTypes, arcTypes) => {
    // Accepts a feature - returns a memoized merge function
    const memoized = (feature) => {
      const data =
        feature === 'geos'
          ? geoTypes
          : feature === 'nodes'
          ? nodeTypes
          : feature === 'arcs'
          ? arcTypes
          : {}
      // The merge function memoized for each node
      const resultFunc = (d) =>
        R.pipe(
          R.mergeRight(R.propOr({}, d.type, data)),
          R.over(
            R.lensProp('props'),
            R.mergeDeepRight(R.pathOr({}, [d.type, 'props'])(data))
          )
        )(d)

      const vals = {}

      // Store inputs for equalityCheck
      const rememberedInputs = {}

      // Check memoized cache - run function if needed
      const checkCache = (value) => {
        if (
          R.isNil(R.prop(value[0], rememberedInputs)) ||
          !R.equals(rememberedInputs[value[0]], value[1])
        ) {
          rememberedInputs[value[0]] = value[1]
          vals[value[0]] = resultFunc(value[1])
        }
        return [value[0], vals[value[0]]]
      }

      return checkCache
    }
    // Return seperate function for each feature
    return {
      arcs: memoized('arcs'),
      nodes: memoized('nodes'),
      geos: memoized('geos'),
    }
  }
)
const getMergedAllProps = (data, localData, memoized) =>
  R.pipe(
    R.propOr(R.propOr({}, 'data', data), 'data'),
    R.toPairs,
    R.map(memoized),
    R.fromPairs
  )(localData)

export const selectMergedArcs = createSelector(
  [selectArcs, selectLocalArcs, selectMemoizedMergeFunc],
  (arcs, localArcs, mergeFunc) =>
    getMergedAllProps(arcs, localArcs, mergeFunc['arcs']),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.prop('data', a) === R.prop('data', b) &&
        R.prop('types', a) === R.prop('types', b),
    },
  }
)
export const selectMergedNodes = createSelector(
  [selectNodes, selectLocalNodes, selectMemoizedMergeFunc],
  (nodes, localNodes, mergeFunc) =>
    getMergedAllProps(nodes, localNodes, mergeFunc['nodes'])
)
export const selectMergedGeos = createSelector(
  [selectGeos, selectLocalGeos, selectMemoizedMergeFunc],
  (geos, localGeos, mergeFunc) =>
    getMergedAllProps(geos, localGeos, mergeFunc['geos'])
)
// General
export const selectResolveTime = createSelector([selectTime], (currentTime) =>
  getTimeValue(currentTime)
)
export const selectTimeProp = createSelector(selectResolveTime, (resolveTime) =>
  R.pipe(R.prop, resolveTime)
)
export const selectTimePath = createSelector(selectTimeProp, (timeProp) =>
  R.flip(R.reduce(R.flip(timeProp)))
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
export const selectNodeData = createSelector(
  [selectEnabledNodes, selectFilteredNodes],
  (enabledNodes, filteredData) =>
    R.toPairs(
      R.filter((d) => R.propOr(false, d.type, enabledNodes))(filteredData)
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
export const selectMatchingKeys = createSelector(
  [selectEnabledGeos, selectGeosByType, selectTimeProp],
  (enabledGeos, geosByType, timeProp) =>
    R.pipe(
      R.pick(R.keys(R.filter(R.identity, enabledGeos))),
      R.values,
      R.reduce(R.concat, []),
      R.indexBy(timeProp('geoJsonValue'))
    )(geosByType)
)
export const selectMatchingKeysByType = createSelector(
  [selectEnabledGeos, selectGeosByType, selectTimeProp],
  (enabledGeos, geosByType, timeProp) =>
    R.pipe(
      R.pick(R.keys(R.filter(R.identity, enabledGeos))),
      R.map(R.indexBy(timeProp('geoJsonValue')))
    )(geosByType),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
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
        const actualStat = obj.chart === 'Table' ? pathedVar : obj.statistic
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
          obj.chart === 'Table'
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
            R.always(obj.chart === 'Table'),
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
export const selectGroupedEnabledArcs = createSelector(
  [selectEnabledArcs, selectFilteredArcsData],
  (enabledArcs, filteredArcs) =>
    R.pipe(
      R.filter((d) => R.propOr(false, d.type, enabledArcs)),
      // 3d arcs grouped under true - others false
      R.toPairs,
      R.groupBy((d) => R.equals(R.path([1, 'lineBy'], d), '3d')),
      R.map(R.fromPairs)
    )(filteredArcs)
)
export const selectLineData = createSelector(selectGroupedEnabledArcs, (data) =>
  R.toPairs(R.prop('false', data))
)
export const selectArcData = createSelector(selectGroupedEnabledArcs, (data) =>
  R.toPairs(R.prop('true', data))
)
export const selectArcRange = createSelector(
  [selectArcTypes, selectTimePath, selectArcsByType],
  (arcs, timePath, arcsByType) =>
    R.memoizeWith(
      (type, prop, size) => [type, prop, size],
      (type, prop, size) =>
        R.pipe(
          timePath([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(
                    acc.max,
                    timePath(['props', prop, 'value'], value)
                  ),
                  min: R.min(
                    acc.min,
                    timePath(['props', prop, 'value'], value)
                  ),
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
export const selectSplitNodeData = createSelector(
  [selectEnabledNodes, selectNodeData],
  (enabledNodes, nodeData) =>
    R.groupBy((d) => {
      const nodeType = d[1].type
      return enabledNodes[nodeType].group || false
    })(nodeData)
)

export const selectGroupedNodesWithId = createSelector(
  selectSplitNodeData,
  (splitNodeData) =>
    R.map((d) => R.assoc('id', d[0])(d[1]))(R.propOr([], true, splitNodeData)),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.equals(R.propOr([], true, a), R.propOr([], true, b)),
    },
  }
)

export const selectNodeRange = createSelector(
  [selectNodeTypes, selectTimePath, selectNodesByType],
  (nodeTypes, timePath, nodesByType) =>
    R.memoizeWith(
      (type, prop, size) => [type, prop, size],
      (type, prop, size) =>
        R.pipe(
          timePath([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(
                    acc.max,
                    timePath(['props', prop, 'value'], value)
                  ),
                  min: R.min(
                    acc.min,
                    timePath(['props', prop, 'value'], value)
                  ),
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
  [selectGeoTypes, selectTimePath, selectGeosByType],
  (geoTypes, timePath, geosByType) =>
    R.memoizeWith(
      (type, prop) => [type, prop],
      (type, prop) =>
        R.pipe(
          timePath([type, 'colorByOptions', prop]),
          R.when(
            (range) =>
              R.isEmpty(range) ||
              (R.has('startGradientColor', range) &&
                (!R.has('max', range) || !R.has('min', range))),
            R.mergeRight(
              R.reduce(
                (acc, value) => ({
                  max: R.max(
                    acc.max,
                    timePath(['props', prop, 'value'], value)
                  ),
                  min: R.min(
                    acc.min,
                    timePath(['props', prop, 'value'], value)
                  ),
                }),
                { min: Infinity, max: -Infinity }
              )(R.propOr([], type, geosByType))
            )
          ),
          R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
        )(geoTypes)
    )
)

export const selectGetLegendGroupId = createSelector(
  selectLegendData,
  (legendData) =>
    R.curry((layerKey, type) =>
      R.pipe(
        toListWithKey('id'),
        R.find(R.hasPath([layerKey, type])),
        R.prop('id')
      )(legendData)
    )
)

export const selectNodeClusters = createSelector(
  [selectGroupedNodesWithId, selectEnabledNodes, selectResolveTime],
  (data, legendObjects, resolveTime) => {
    // define helper functions
    const getVarByProp = R.curry((varByKey, nodeObj) =>
      R.path([nodeObj.type, varByKey])(legendObjects)
    )
    const getClusterVarByProp = R.curry((varByKey, nodeCluster) =>
      R.path([nodeCluster.properties.type, varByKey])(legendObjects)
    )
    const getGroups = (ungroupedData, fn) =>
      ungroupedData.reduce((acc, d) => {
        const result = fn(d)
        acc[result] = acc[result] || []
        acc[result].push(d)
        return acc
      }, {})
    const getPosition = (d) => [
      resolveTime(d.longitude),
      resolveTime(d.latitude),
      resolveTime(d.altitude + 1),
    ]
    const getGroupCalculation = R.curry((groupCalculation, nodeCluster) =>
      R.pathOr(statId.COUNT, [nodeCluster.properties.type, groupCalculation])(
        legendObjects
      )
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
      // NOTE: Using shallow cloning is sufficient, assuming
      // that all `data` properties are enumerable and don't
      // contain any references to another object.
      deepClone: false,
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
  }
)

export const selectNodeClustersAtZoom = createSelector(
  [selectNodeClusters, selectViewport],
  (nodeClusters, viewport) =>
    R.propOr({}, Math.floor(viewport.zoom), nodeClusters),
  {
    memoizeOptions: {
      equalityCheck: (a, b) =>
        R.has('zoom', a) ? R.eqProps('zoom', a, b) : a === b,
    },
  }
)

export const selectNodeRangeAtZoom = createSelector(
  selectNodeClustersAtZoom,
  (nodeClusters) => R.propOr({}, 'range')(nodeClusters),
  {
    memoizeOptions: {
      resultEqualityCheck: R.equals,
    },
  }
)
