import { createSelector } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_ICON_URL,
  DEFAULT_VIEWPORT,
  MIN_ZOOM,
  MAX_ZOOM,
} from '../../utils/constants'
import { viewId } from '../../utils/enums'

import {
  checkValidRange,
  filterItems,
  getTimeValue,
  sortProps,
  sortedListById,
} from '../../utils'

// Sessions
export const selectSessions = (state) => R.prop('sessions')(state)
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
export const selectSessionsByTeam = createSelector(
  selectSessionsData,
  R.mapObjIndexed((value) => R.prop('sessions', value))
)

// Tokens
export const selectTokens = (state) => R.path(['tokens'])(state)

export const selectMapboxToken = createSelector(selectTokens, (data) =>
  R.prop('mapboxToken')(data)
)

// Data
export const selectData = (state) => R.prop('data')(state)
export const selectIgnoreData = createSelector(selectData, (data) =>
  R.propOr({}, 'ignore')(data)
)
export const selectHashesData = createSelector(selectData, (data) =>
  R.propOr({}, 'hashes')(data)
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
export const selectAssociated = createSelector(selectData, (data) =>
  R.propOr({}, 'associated')(data)
)
export const selectSettings = createSelector(selectData, (data) =>
  R.propOr({}, 'settings')(data)
)
export const selectMap = createSelector(selectData, R.propOr({}, 'map'))
// Data -> Types
export const selectNodeTypes = createSelector(
  selectNodes,
  R.propOr({}, 'types')
)
export const selectArcTypes = createSelector(selectArcs, R.propOr({}, 'types'))
export const selectGeoTypes = createSelector(selectGeos, R.propOr({}, 'types'))
// Data -> data
export const selectMapData = createSelector(selectMap, R.propOr({}, 'data'))

export const selectAppBarData = createSelector(selectAppBar, (data) =>
  R.propOr({}, 'data')(data)
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
export const selectLegendData = createSelector(selectMapData, (data) =>
  R.propOr([], 'legendGroups', data)
)

const getMergedAllProps = (data, localData) =>
  R.pipe(
    R.propOr(R.propOr({}, 'data', data), 'data'),
    R.mapObjIndexed((d) =>
      R.pipe(
        R.mergeRight(
          R.pathOr(R.pathOr({}, ['types', d.type])(data), ['types', d.type])(
            localData
          )
        ),
        R.over(
          R.lensProp('props'),
          R.mergeDeepRight(
            R.pathOr(R.pathOr({}, ['types', d.type, 'props'])(data), [
              'types',
              d.type,
              'props',
            ])(localData)
          )
        )
      )(d)
    )
  )(localData)

// Data -> defaultViewport
export const selectDefaultViewport = createSelector(selectMapData, (data) =>
  R.pipe(
    R.propOr({}, 'defaultViewport'),
    R.when(
      R.has('zoom'),
      R.over(R.lensProp('zoom'), R.clamp(MIN_ZOOM, MAX_ZOOM))
    )
  )(data)
)

// Data -> settings
export const selectSettingsIconUrl = createSelector(
  selectSettingsData,
  (data) => R.propOr(DEFAULT_ICON_URL, 'IconUrl')(data)
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
  R.propOr({}, 'syncToggles', data)
)
// Data -> stats
export const selectStatisticTypes = createSelector(selectStats, (data) =>
  R.propOr({}, 'types')(data)
)
// Data -> ignore
export const selectIgnoreLoading = createSelector(selectIgnoreData, (data) =>
  R.propOr(false, 'loading')(data)
)

// Local
export const selectLocal = (state) => R.pathOr({}, ['local'])(state)
// Local -> panes
export const selectLocalPanes = createSelector(selectLocal, (data) =>
  R.propOr({}, 'panes')(data)
)
// Local -> settings
export const selectLocalSettings = createSelector(selectLocal, (data) =>
  R.propOr({}, 'settings')(data)
)
export const selectView = createSelector(selectLocalSettings, (data) =>
  R.prop('view')(data)
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
// Local -> Map
export const selectLocalMap = createSelector(selectLocal, (data) =>
  R.propOr({}, 'map')(data)
)
export const selectLocalMapData = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'data')(data)
)
export const selectMapControls = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapControls')(data)
)
export const selectMapModal = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapModal')(data)
)
export const selectMapLayers = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapLayers')(data)
)
export const selectMapLegend = createSelector(selectLocalMap, (data) =>
  R.propOr({}, 'mapLegend')(data)
)
// Local -> appBar (Custom)
export const selectLocalAppBar = createSelector(selectLocal, (data) =>
  R.prop('appBar', data)
)
export const selectLocalAppBarData = createSelector(selectLocalAppBar, (data) =>
  R.prop('data', data)
)
export const selectFiltered = createSelector(
  [selectAppBar, selectLocalAppBar],
  (appBar, localAppBar) =>
    R.propOr(R.propOr({}, 'filtered', appBar), 'filtered', localAppBar),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectPaneState = createSelector(
  [selectLocalAppBar, selectAppBar],
  (localData, data) =>
    R.propOr(R.propOr({}, 'paneState', data), 'paneState', localData)
)
export const selectOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'open', data)
)
export const selectSecondaryOpenPane = createSelector(selectPaneState, (data) =>
  R.propOr('', 'secondaryOpen', data)
)
export const selectGroupedAppBar = createSelector(
  [selectLocalAppBarData, selectAppBarData],
  R.pipe(
    R.mergeDeepRight,
    R.toPairs,
    R.groupBy(R.path([1, 'bar'])),
    R.map(R.fromPairs)
  ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectAppBarId = createSelector(
  [selectLocalAppBarData, selectAppBarData, selectView],
  (localAppBarData, appBarData, view) => {
    const foundId = R.pipe(
      sortProps,
      R.toPairs,
      R.find(R.pathEq([1, 'type'], view)),
      R.prop(0)
    )(appBarData)
    return R.propOr(
      R.propOr(foundId, 'appBarId', appBarData),
      'appBarId',
      localAppBarData
    )
  }
)
export const selectStaticMap = createSelector(
  [selectAppBarId, selectAppBarData],
  (appBarId, appBarData) => R.pathOr(false, [appBarId, 'static'], appBarData)
)
export const selectDashboard = createSelector(
  [selectAppBarId, selectAppBarData, selectLocalAppBarData],
  (appBarId, appBarData, localAppBarData) =>
    R.propOr(R.propOr({}, appBarId, appBarData), appBarId, localAppBarData)
)
export const selectDashboardLayout = createSelector(
  [selectAppBarId, selectAppBarData, selectLocalAppBarData],
  (appBarId, appBarData, localAppBarData) =>
    R.pathOr(
      R.pathOr({}, [appBarId, 'dashboardLayout'], appBarData),
      [appBarId, 'dashboardLayout'],
      localAppBarData
    )
)
export const selectDashboardLockedLayout = createSelector(
  selectDashboard,
  (dashboard) => R.propOr(false, 'lockedLayout', dashboard)
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
    R.filter(R.prop('map_kpi')),
    R.map(R.assoc('view', viewId.MAP)),
    sortedListById,
    R.values
  )
)
// Local -> Map -> mapControls
export const selectViewport = createSelector(
  [selectMapControls, selectDefaultViewport, selectAppBarId],
  (mapControls, defaultViewport, appBarId) =>
    R.mergeAll([
      DEFAULT_VIEWPORT,
      defaultViewport,
      R.pathOr({}, [appBarId, 'viewport'])(mapControls),
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
export const selectOptionalViewports = createSelector(selectMapData, (data) =>
  R.propOr({}, 'optionalViewports')(data)
)
// Local -> Map -> layers
export const selectEnabledArcs = createSelector(
  [selectLocalMapData, selectMapData],
  (localMap, mapData) =>
    R.pathOr(
      R.pathOr({}, ['enabledTypes', 'arc'], mapData),
      ['enabledTypes', 'arc'],
      localMap
    ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectEnabledNodes = createSelector(
  [selectLocalMapData, selectMapData],
  (localMap, mapData) =>
    R.pathOr(
      R.pathOr({}, ['enabledTypes', 'node'], mapData),
      ['enabledTypes', 'node'],
      localMap
    ),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectEnabledGeos = createSelector(
  [selectLocalMapData, selectMapData],
  (localMap, mapData) =>
    R.pathOr(
      R.pathOr({}, ['enabledTypes', 'geo'], mapData),
      ['enabledTypes', 'geo'],
      localMap
    ),
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
export const selectMergedArcs = createSelector(
  [selectArcs, selectLocalArcs],
  (arcs, localArcs) => getMergedAllProps(arcs, localArcs)
)
export const selectMergedNodes = createSelector(
  [selectNodes, selectLocalNodes],
  (nodes, localNodes) => getMergedAllProps(nodes, localNodes)
)
export const selectMergedGeos = createSelector(
  [selectGeos, selectLocalGeos],
  (geos, localGeos) => getMergedAllProps(geos, localGeos)
)
export const selectLocalizedNodeTypes = createSelector(
  [selectNodeTypes, selectLocalNodes],
  (nodeTypes, localNodes) => R.propOr(nodeTypes, 'types', localNodes),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectLocalizedArcTypes = createSelector(
  [selectArcTypes, selectLocalArcs],
  (arcTypes, localArcs) => R.propOr(arcTypes, 'types', localArcs),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
)
export const selectLocalizedGeoTypes = createSelector(
  [selectGeoTypes, selectLocalGeos],
  (geoTypes, localGeos) => R.propOr(geoTypes, 'types', localGeos),
  { memoizeOptions: { resultEqualityCheck: R.equals } }
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
export const selectFilterFunction = createSelector(
  [selectFiltered, selectCategoriesData],
  (filtered, categoriesData) => filterItems(R.__, filtered, categoriesData)
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
    R.filter((d) => R.propOr(false, d.type, enabledNodes))(filteredData)
)
export const selectNodesByType = createSelector(
  selectFilteredNodes,
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
    )(geosByType)
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
//Node, Geo, & Arc derived
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
export const selectArcRange = createSelector(
  [selectArcTypes, selectTimePath],
  (arcs, timePath) => (type, prop, size) =>
    R.pipe(
      timePath([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
      size && !R.has('min')
        ? () => {
            console.warn('sizeBy dose not support categorical variables.')
            return { min: 0, max: 0 }
          }
        : R.identity,
      R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
    )(arcs)
)
export const selectNodeRange = createSelector(
  [selectNodeTypes, selectTimePath],
  (nodeTypes, timePath) => (type, prop, size) =>
    R.pipe(
      timePath([type, size ? 'sizeByOptions' : 'colorByOptions', prop]),
      R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
    )(nodeTypes)
)
export const selectGeoColorRange = createSelector(
  [selectGeoTypes, selectTimePath],
  (geoTypes, timePath) => (type, prop) =>
    R.pipe(
      timePath([type, 'colorByOptions', prop]),
      R.unless(checkValidRange, R.always({ min: 0, max: 0 }))
    )(geoTypes)
)
