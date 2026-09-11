import {
  createSelector,
  createSelectorCreator,
  lruMemoize,
} from '@reduxjs/toolkit'

import {
  DEFAULT_ICON_URL,
  DEFAULT_VIEWPORT,
  DEFAULT_MAP_STYLE_OBJECTS,
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_PITCH,
  MAX_PITCH,
  MIN_BEARING,
  MAX_BEARING,
  MAX_MEMOIZED_CHARTS,
  NUMBER_FORMAT_KEY_PATHS,
  ICON_RESOLUTION,
  DEFAULT_MAP_PROJECTION_OBJECTS,
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
  legendLayouts,
  legendWidths,
  MAPBOX_PROJECTIONS,
  MAPLIBRE_PROJECTIONS,
  MAP_PROJECTIONS,
} from '../../utils/enums'
import { getScaledValue } from '../../utils/scales'
import { getStatFn } from '../../utils/stats'
import Supercluster from '../../utils/supercluster'
import ThreadMaxWorkers from '../../utils/ThreadMaxWorkers'

import {
  checkValidRange,
  getTimeValue,
  sortByOrderNameId,
  forcePath,
  customSortByX,
  recursiveMap,
  orderEntireDict,
  addValuesToProps,
  filterGroupedOutputs,
  adjustArcPath,
  constructFetchedGeoJson,
  constructGeoJson,
  ALLOWED_RANGE_KEYS,
  getColorString,
  parseGradient,
  getChartItemColor,
  isMapboxStyle,
  getColoringFn,
} from '../../utils'

const workerManager = new ThreadMaxWorkers()

const clamp = (min, max, val) => Math.min(Math.max(val, min), max)

const deepEqual = (a, b) => {
  if (a === b) return true
  if (
    a == null ||
    b == null ||
    typeof a !== 'object' ||
    typeof b !== 'object'
  ) {
    return false
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (let i = 0; i < keysA.length; i++) {
    const k = keysA[i]
    if (!Object.prototype.hasOwnProperty.call(b, k) || !deepEqual(a[k], b[k])) {
      return false
    }
  }
  return true
}

const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...(target || {}) }
  const sourceKeys = Object.keys(source)
  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i]
    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

const transposeMapData = (data) => {
  if (!data) return {}
  const result = {}
  for (const outerKey in data) {
    const innerObj = data[outerKey]
    if (innerObj && typeof innerObj === 'object') {
      for (const innerKey in innerObj) {
        if (!result[innerKey]) result[innerKey] = {}
        result[innerKey][outerKey] = innerObj[innerKey]
      }
    }
  }
  return result
}

const maxSizedMemoization = (
  keyFunc,
  resultFunc,
  maxCache = MAX_MEMOIZED_CHARTS
) => {
  const cache = new Map()
  return (...args) => {
    const key = keyFunc(...args)
    if (!cache.has(key)) {
      cache.set(key, resultFunc(...args))
      if (cache.size > maxCache) {
        const remove = cache.keys().next().value
        cache.delete(remove)
      }
    }
    return cache.get(key)
  }
}

const getNumericValue = (val) => {
  if (typeof val === 'number') {
    return Number.isFinite(val) ? val : null
  }
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed === '') return null
    const num = Number(trimmed)
    return Number.isFinite(num) ? num : null
  }
  if (Array.isArray(val) && val.length > 0) {
    return getNumericValue(val[0])
  }
  return null
}

const computeItemRange = (items, prop) => {
  if (!items || items.length === 0) {
    return { min: 0, max: 0, gradient: {} }
  }
  const propObj = items[0]?.props?.[prop]
  let result = propObj
  const isEmpty = !propObj || Object.keys(propObj).length === 0
  const hasGradient = Boolean(propObj && 'gradient' in propObj)

  if (isEmpty || hasGradient || propObj?.type === propId.NUMBER) {
    let min = Infinity
    let max = -Infinity
    for (let i = 0; i < items.length; i++) {
      const num = getNumericValue(items[i]?.values?.[prop])
      if (num != null) {
        if (num < min) min = num
        if (num > max) max = num
      }
    }
    const fallbackMin =
      typeof propObj?.min === 'number' && Number.isFinite(propObj.min)
        ? propObj.min
        : 0
    const fallbackMax =
      typeof propObj?.max === 'number' && Number.isFinite(propObj.max)
        ? propObj.max
        : fallbackMin
    const resolvedMin = min === Infinity ? fallbackMin : min
    const resolvedMax = max === -Infinity ? fallbackMax : max
    result = {
      ...(propObj || {}),
      min: resolvedMin,
      max: resolvedMax,
    }
  }

  if (result == null) {
    return { min: 0, max: 0, gradient: {} }
  }

  const picked = {}
  for (let i = 0; i < ALLOWED_RANGE_KEYS.length; i++) {
    const k = ALLOWED_RANGE_KEYS[i]
    if (k in result) {
      picked[k] = result[k]
    }
  }

  return checkValidRange(picked) ? picked : { min: 0, max: 0, gradient: {} }
}

const pickPaths = (paths, obj) => {
  if (!obj || !paths) return {}
  const result = {}
  for (let i = 0; i < paths.length; i++) {
    const path = forcePath(paths[i])
    let currObj = obj
    let has = true
    for (let j = 0; j < path.length; j++) {
      if (
        currObj == null ||
        typeof currObj !== 'object' ||
        !(path[j] in currObj)
      ) {
        has = false
        break
      }
      currObj = currObj[path[j]]
    }
    if (has) {
      let target = result
      for (let j = 0; j < path.length - 1; j++) {
        const key = path[j]
        if (!target[key] || typeof target[key] !== 'object') {
          target[key] = {}
        }
        target = target[key]
      }
      target[path[path.length - 1]] = currObj
    }
  }
  return result
}

export const selectUtilities = (state) => state?.utilities

// Virtual Keyboard
export const selectVirtualKeyboard = createSelector(
  selectUtilities,
  (data) => data?.virtualKeyboard
)

export const selectVirtualKeyboardValue = createSelector(
  selectVirtualKeyboard,
  (data) => data?.inputValue
)

// Loading
export const selectLoading = createSelector(
  selectUtilities,
  (data) => data?.loading
)
export const selectSessionLoading = createSelector(
  selectLoading,
  (data) => data?.session_loading
)
export const selectDataLoading = createSelector(
  selectLoading,
  (data) => data?.data_loading
)

// Sessions
export const selectSessions = createSelector(
  selectUtilities,
  (data) => data?.sessions
)
export const selectSessionsData = createSelector(
  selectSessions,
  (data) => data?.data ?? {}
)
export const selectCurrentSession = createSelector(
  selectSessions,
  (data) => data?.session_id
)
export const selectTeams = createSelector(selectSessionsData, (data) => {
  if (!data) return {}
  const result = {}
  for (const [id, team] of Object.entries(data)) {
    if (team) {
      const rest = { ...team }
      delete rest.sessions
      result[id] = rest
    }
  }
  return result
})
export const selectSortedTeams = createSelector(selectTeams, (teams) => {
  if (!teams) return []
  const mapped = Object.values(teams).map((team) => ({
    ...team,
    id: team.teamId,
    name: team.teamName,
  }))
  return sortByOrderNameId(mapped)
})
export const selectSessionsByTeam = createSelector(
  selectSessionsData,
  (data) => {
    if (!data) return {}
    const result = {}
    for (const [id, team] of Object.entries(data)) {
      result[id] = team?.sessions
    }
    return result
  }
)

// Tokens
export const selectTokens = createSelector(
  selectUtilities,
  (data) => data?.tokens
)

export const selectMapboxToken = createSelector(
  selectTokens,
  (data) => data?.mapboxToken
)

// Messages
export const selectMessages = createSelector(
  selectUtilities,
  (data) => data?.messages
)

// Time (Utilities)
export const selectTime = createSelector(selectUtilities, (data) => data?.time)
export const selectAnimationInterval = createSelector(
  selectTime,
  (data) => data?.animationInterval
)
// Local
export const selectLocal = (state) => state?.local ?? {}
// Local -> settings
export const selectLocalSettings = createSelector(
  selectLocal,
  (data) => data?.settings ?? {}
)
export const selectCurrentTime = createSelector(selectLocalSettings, (data) =>
  Math.floor(data?.currentTimeContinuous ?? 0)
)
export const selectCurrentTimeContinuous = createSelector(
  selectLocalSettings,
  (data) => data?.currentTimeContinuous ?? 0
)
export const selectSync = createSelector(
  selectLocalSettings,
  (data) => data?.sync ?? {}
)
export const selectEditLayoutMode = createSelector(
  selectLocalSettings,
  (data) => Boolean(data?.editLayout)
)
export const selectMirrorMode = createSelector(selectLocalSettings, (data) =>
  Boolean(data?.mirror)
)
// Data
export const selectData = (state) => state?.data
export const selectIgnoreData = createSelector(
  selectData,
  (data) => data?.ignore ?? {}
)
export const selectVersionsData = createSelector(
  selectData,
  (data) => data?.versions ?? {}
)
export const selectMapFeatures = createSelector(
  selectData,
  (data) => data?.mapFeatures ?? {}
)
export const selectAppBar = createSelector(selectData, (data) => {
  const appBar = { ...(data?.appBar ?? {}) }

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
  const order = appBar.order?.data ?? []
  const updatedOrder = [paneId.SESSION, paneId.APP_SETTINGS, ...order]
  appBar.order = { ...(appBar.order ?? {}), data: updatedOrder }
  appBar.data = deepMerge(systemAppBar, appBar.data ?? {})
  return appBar
})
export const selectDraggables = createSelector(
  selectData,
  (data) => data?.draggables ?? {}
)
export const selectGroupedOutputs = createSelector(
  selectData,
  (data) => data?.groupedOutputs ?? {}
)
export const selectGlobalOutputs = createSelector(
  selectData,
  (data) => data?.globalOutputs ?? {}
)
export const selectPages = createSelector(
  selectData,
  (data) => data?.pages ?? {}
)
export const selectAssociated = createSelector(
  selectData,
  (data) => data?.associated ?? {}
)
export const selectSettings = createSelector(
  selectData,
  (data) => orderEntireDict(data?.settings ?? {}),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: deepEqual },
  }
)
export const selectPanes = createSelector(
  selectData,
  (data) => data?.panes ?? {}
)
export const selectMap = createSelector(selectData, (data) => data?.maps ?? {})
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
const selectOrderedMapFeatures = createSelector(selectMapFeatures, (data) =>
  orderEntireDict(data)
)
// Data -> Types
export const selectFeatureData = createSelector(
  selectOrderedMapFeatures,
  (data) => data?.data ?? {}
)
export const selectNodeTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'node') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
export const selectArcTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'arc') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
export const selectGeoTypes = createSelector(
  [selectFeatureData, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'geo') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
// Data -> data
export const selectPanesData = createSelector(
  [selectPanes, selectCurrentTime],
  (data, time) => {
    const panesData = getTimeValue(time, data?.data ?? {})

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

    return { ...panesData, ...systemPanesData }
  }
)
export const selectMapData = createSelector(
  [selectOrderedMaps, selectCurrentTime],
  (data, time) => getTimeValue(time, data?.data ?? {})
)
export const selectAppBarData = createSelector(
  selectOrderedAppBar,
  (data) => data?.data ?? {}
)
export const selectLeftAppBarData = createSelector(selectAppBarData, (data) => {
  if (!data) return {}
  const result = {}
  for (const [key, item] of Object.entries(data)) {
    if (item?.bar === 'upperLeft' || item?.bar === 'lowerLeft') {
      result[key] = item
    }
  }
  return result
})

export const selectRightAppBarData = createSelector(
  selectAppBarData,
  (data) => {
    if (!data) return {}
    const result = {}
    for (const [key, item] of Object.entries(data)) {
      if (item?.bar === 'upperRight' || item?.bar === 'lowerRight') {
        result[key] = item
      }
    }
    return result
  }
)
export const selectDraggablesData = createSelector(
  selectDraggables,
  (data) => data?.data ?? {}
)
export const selectGroupedOutputsData = createSelector(
  selectOrderedGroupedOutputs,
  (data) => data?.data ?? {}
)
export const selectAnyGroupedOutputData = createSelector(
  selectGroupedOutputsData,
  (data) => Boolean(data && Object.keys(data).length > 0)
)
export const selectGlobalOutputsLayout = createSelector(
  selectGlobalOutputs,
  (data) => data?.layout
)
export const selectAssociatedData = createSelector(
  selectAssociated,
  (data) => data?.data ?? {}
)

// Data -> settings
export const selectSettingsIconUrl = createSelector(
  selectSettings,
  (data) => data?.iconUrl ?? DEFAULT_ICON_URL
)
export const selectNumberFormat = createSelector(selectSettings, (settings) =>
  pickPaths(NUMBER_FORMAT_KEY_PATHS, settings?.defaults ?? {})
)
export const selectNumberFormatPropsFn = createSelector(
  selectNumberFormat,
  (numberFormat) => (prop) => ({
    ...numberFormat,
    ...pickPaths(NUMBER_FORMAT_KEY_PATHS, prop),
  })
)

export const selectLegendNumberFormatFunc = createSelector(
  selectNumberFormatPropsFn,
  (numberFormatPropsFn) => (prop) => {
    const numberFormat = numberFormatPropsFn(prop)
    return {
      ...numberFormat,
      // Formatting hierarchy: `props.*gradient.<key>` -> `settings.defaults.*gradient<key>` -> `props.<key>` -> `settings.defaults.<key>`
      ...{
        precision: numberFormat.gradient?.precision || numberFormat.precision,
        notation: numberFormat.gradient?.notation || numberFormat.notation,
        notationDisplay:
          numberFormat.gradient?.notationDisplay ||
          numberFormat.notationDisplay,
      },
    }
  }
)
// NOTE: Use with Redux hook below:
// const parsedGradient = useSelector((state) => selectParsedGradientFunc(state, <attrKey>, <prop>, <range>, <parseRangeAsNumber>))
export const selectParsedGradient = createSelector(
  [
    selectLegendNumberFormatFunc,
    (state, attrKey) => attrKey,
    (state, attrKey, prop) => prop,
    (state, attrKey, prop, range) => range,
    (state, attrKey, prop, range, parseRangeAsNumber) => parseRangeAsNumber,
  ],
  (legendNumberFormatFunc, attrKey, prop, range, parseRangeAsNumber) =>
    parseGradient(
      attrKey,
      legendNumberFormatFunc(prop).precision,
      parseRangeAsNumber
    )(range),
  { memoizeOptions: { maxSize: MAX_MEMOIZED_CHARTS } }
)
export const selectDemoSettings = createSelector(
  selectSettings,
  (data) => data?.demo ?? {}
)
export const selectDemoMode = createSelector(
  selectLocalSettings,
  (localSettings) => Boolean(localSettings?.demo)
)
export const selectTimeSettings = createSelector(
  selectSettings,
  (data) => data?.time ?? {}
)
export const selectCurrentTimeLength = createSelector(
  selectTimeSettings,
  (data) => data?.timeLength ?? 0
)
export const selectCurrentTimeUnits = createSelector(
  selectTimeSettings,
  (data) => data?.timeUnits ?? 'unit'
)
export const selectCurrentLooping = createSelector(selectTimeSettings, (data) =>
  Boolean(data?.looping)
)
export const selectCurrentSpeed = createSelector(
  selectTimeSettings,
  (data) => data?.speed ?? 1
)
export const selectSyncToggles = createSelector(
  selectSettings,
  (data) => data?.sync ?? {}
)
// Data -> groupedOutputs
export const selectGroupedOutputTypes = createSelector(
  selectGroupedOutputsData,
  (data) => {
    if (!data) return {}
    const result = {}
    for (const [k, v] of Object.entries(data)) {
      result[k] = v?.stats ?? {}
    }
    return result
  }
)
// Data -> dashboard
export const selectDashboardData = createSelector(
  selectPages,
  (data) => data?.data ?? {}
)

// Data -> ignore
export const selectIgnoreLoading = createSelector(selectIgnoreData, (data) =>
  Boolean(data?.loading)
)
// Loading
export const selectShowLoading = createSelector(
  [selectIgnoreLoading, selectSessionLoading, selectDataLoading],
  (ignore, session, data) => ignore || session || data
)
// Local -> panes
export const selectLocalPanes = createSelector(
  selectLocal,
  (data) => data?.panes
)
export const selectLocalPanesData = createSelector(
  [selectLocalPanes, selectCurrentTime],
  (data, time) => getTimeValue(time, data?.data)
)
// Local -> draggables
const selectLocalDraggables = createSelector(
  selectLocal,
  (data) => data?.draggables ?? {}
)
export const selectLocalDraggablesData = createSelector(
  selectLocalDraggables,
  (data) => data?.data ?? {}
)

export const selectMergedDraggables = createSelector(
  [selectLocalDraggablesData, selectDraggablesData],
  (localData, data) => {
    if (!localData || Object.keys(localData).length === 0) return data || {}
    return deepMerge(data || {}, localData)
  }
)
export const selectSessionDraggable = createSelector(
  selectMergedDraggables,
  (data) => data?.[draggableId.SESSION] ?? {}
)
export const selectGlobalOutputsDraggable = createSelector(
  selectMergedDraggables,
  (data) => data?.[draggableId.GLOBAL_OUTPUTS] ?? {}
)
export const selectMapNamesDraggable = createSelector(
  selectMergedDraggables,
  (data) => data?.[draggableId.MAP_NAMES] ?? {}
)

// Local -> Dashboard
export const selectLocalPages = createSelector(
  selectLocal,
  (data) => data?.pages ?? {}
)
export const selectLocalPagesData = createSelector(
  selectLocalPages,
  (data) => data?.data
)
// Local -> appBar (Custom)
export const selectLocalAppBar = createSelector(
  selectLocal,
  (data) => data?.appBar
)
export const selectLocalAppBarData = createSelector(
  selectLocalAppBar,
  (data) => data?.data
)
export const selectLeftLocalAppBarData = createSelector(
  selectLocalAppBarData,
  (data) => data?.left ?? {}
)
export const selectRightLocalAppBarData = createSelector(
  selectLocalAppBarData,
  (data) => data?.right ?? {}
)
export const selectPaneState = createSelector(
  [selectLocalPanes, selectPanes],
  (localData, data) => ({
    left: localData?.paneState?.left ?? data?.paneState?.left ?? {},
    right: localData?.paneState?.right ?? data?.paneState?.right ?? {},
    center: localData?.paneState?.center ?? data?.paneState?.center ?? {},
  })
)
export const selectLeftOpenPane = createSelector(
  selectPaneState,
  (data) => data?.left?.open ?? ''
)
export const selectLeftPinPane = createSelector(selectPaneState, (data) =>
  Boolean(data?.left?.pin)
)
export const selectRightOpenPane = createSelector(
  selectPaneState,
  (data) => data?.right?.open ?? ''
)
export const selectRightPinPane = createSelector(selectPaneState, (data) =>
  Boolean(data?.right?.pin)
)
// Merged pages
export const selectCurrentPage = createSelector(
  [selectLocalPages, selectPages],
  (localPages, pages) => {
    const fallbackId = pages?.data ? Object.keys(pages.data)[0] : undefined
    return localPages?.currentPage ?? pages?.currentPage ?? fallbackId
  }
)
export const selectDashboard = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localdashboardData) =>
    deepMerge(
      dashboardData?.[currentPage] ?? {},
      localdashboardData?.[currentPage] ?? {}
    )
)
export const selectStatOptions = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    localDashboardData?.[currentPage]?.statOptions ??
    dashboardData?.[currentPage]?.statOptions ??
    []
)
export const selectPageLayout = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    localDashboardData?.[currentPage]?.pageLayout ??
    dashboardData?.[currentPage]?.pageLayout ??
    []
)
export const selectCharts = createSelector(
  [selectCurrentPage, selectDashboardData, selectLocalPagesData],
  (currentPage, dashboardData, localDashboardData) =>
    deepMerge(
      dashboardData?.[currentPage]?.charts ?? {},
      localDashboardData?.[currentPage]?.charts ?? {}
    )
)
// NOTE: Use with Redux hook below:
// const chartObj = useSelector((state) => selectChartById(state, <chartId>))
export const selectChartById = createSelector(
  [selectCharts, (state, chartId) => chartId],
  (charts, chartId) => charts?.[chartId],
  { memoizeOptions: { maxSize: MAX_MEMOIZED_CHARTS } }
)
export const selectChartFiltersById = createSelector(
  [selectCharts, (state, chartId) => chartId],
  (charts, chartId) => charts?.[chartId]?.filters ?? [],
  { memoizeOptions: { maxSize: MAX_MEMOIZED_CHARTS } }
)

export const selectIsMaximized = createSelector(selectCharts, (charts) =>
  charts ? Object.values(charts).some((c) => c?.maximized) : false
)
export const selectDashboardLockedLayout = createSelector(
  selectDashboard,
  (dashboard) => Boolean(dashboard?.lockedLayout)
)
export const selectAllowedStats = createSelector(
  [selectGroupedOutputTypes, selectStatOptions],
  (statisticTypes, statOptions) => {
    if (!statOptions || statOptions.length === 0) return statisticTypes ?? {}
    const result = {}
    for (let i = 0; i < statOptions.length; i++) {
      const key = statOptions[i]
      if (statisticTypes && key in statisticTypes) {
        result[key] = statisticTypes[key]
      }
    }
    return result
  }
)
export const selectChartStats = createSelector(
  [selectAllowedStats],
  (allowed) => {
    if (!allowed) return {}
    const result = {}
    for (const [k, v] of Object.entries(allowed)) {
      if (v && typeof v === 'object') {
        const filtered = {}
        for (const [subK, subV] of Object.entries(v)) {
          if (subV?.allowCharting !== false) {
            filtered[subK] = subV
          }
        }
        if (Object.keys(filtered).length > 0) {
          result[k] = filtered
        }
      }
    }
    return result
  }
)
export const selectChartStatsNames = createSelector(
  selectChartStats,
  (chartStats) => {
    if (!chartStats) return {}
    const result = {}
    for (const [k, v] of Object.entries(chartStats)) {
      result[k] = Object.keys(v || {})
    }
    return result
  }
)

export const selectCurrentMapDataByMap = createSelector(
  selectMapData,
  transposeMapData
)

// Merged appBar

export const selectOpenModal = createSelector(
  selectPaneState,
  (paneState) => paneState?.center?.open ?? ''
)
export const selectModal = createSelector(
  selectPaneState,
  (paneState) => paneState?.center ?? {}
)

const groupAppBar = (localData, serverData) => {
  const merged = deepMerge(serverData || {}, localData || {})
  const result = {
    upperLeft: {},
    lowerLeft: {},
    upperRight: {},
    lowerRight: {},
  }
  for (const [key, item] of Object.entries(merged)) {
    const bar = item?.bar
    if (bar && result[bar]) {
      result[bar][key] = item
    }
  }
  return result
}

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
    (!mirrorMode && Object.keys(leftData || {}).length > 0) ||
    (mirrorMode && Object.keys(rightData || {}).length > 0)
)
export const selectRightAppBarDisplay = createSelector(
  [selectMirrorMode, selectLeftAppBarData, selectRightAppBarData],
  (mirrorMode, leftData, rightData) =>
    (!mirrorMode && Object.keys(rightData || {}).length > 0) ||
    (mirrorMode && Object.keys(leftData || {}).length > 0)
)
export const selectDemoViews = createSelector(
  [selectAppBarData, selectDemoSettings],
  (appBarData, demoSettings) => {
    const result = []
    for (const [k, v] of Object.entries(appBarData || {})) {
      if (v?.type === 'page' && (demoSettings?.[k]?.show ?? true)) {
        result.push(k)
      }
    }
    return result
  }
)
export const selectStaticMap = createSelector(
  [selectCurrentPage, selectAppBarData],
  (currentPage, appBarData) => Boolean(appBarData?.[currentPage]?.static)
)
// Merged Panes
export const selectLeftOpenPanesData = createSelector(
  [selectLeftOpenPane, selectPanesData, selectLocalPanesData],
  (leftOpenPane, panesData, localPanesData) =>
    deepMerge(
      panesData?.[leftOpenPane] || {},
      localPanesData?.[leftOpenPane] || {}
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: deepEqual },
  }
)
export const selectRightOpenPanesData = createSelector(
  [selectRightOpenPane, selectPanesData, selectLocalPanesData],
  (rightOpenPane, panesData, localPanesData) =>
    deepMerge(
      panesData?.[rightOpenPane] || {},
      localPanesData?.[rightOpenPane] || {}
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: deepEqual },
  }
)
export const selectOpenModalData = createSelector(
  [selectOpenModal, selectPanesData, selectLocalPanesData],
  (openModal, panesData, localPanesData) =>
    deepMerge(panesData?.[openModal] || {}, localPanesData?.[openModal] || {}),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: deepEqual },
  }
)

// Local -> Map
export const selectLocalMap = createSelector(selectLocal, (data) =>
  orderEntireDict(data?.maps ?? {})
)
export const selectLocalMapData = createSelector(
  [selectLocalMap, selectCurrentTime],
  (data, time) => getTimeValue(time, data?.data)
)
export const selectCurrentLocalMapDataByMap = createSelector(
  [selectLocalMapData],
  transposeMapData
)

// Merged Map Data
export const selectMergedMapData = createSelector(
  [selectMapData, selectLocalMapData],
  (data, localData) => {
    if (!localData || Object.keys(localData).length === 0) return data || {}
    if (!data || Object.keys(data).length === 0) return localData || {}
    const validLocalData = {}
    const mapKeys = Object.keys(data)
    for (let i = 0; i < mapKeys.length; i++) {
      const mapId = mapKeys[i]
      if (localData[mapId]) {
        validLocalData[mapId] = localData[mapId]
      }
    }
    return Object.keys(validLocalData).length === 0
      ? data
      : deepMerge(data, validLocalData)
  }
)
export const selectAnyMapData = createSelector(selectMergedMapData, (data) =>
  Boolean(data && Object.keys(data).length > 0)
)
const selectCurrentMergedMapDataByMap = createSelector(
  selectMergedMapData,
  transposeMapData
)

export const selectAllLegendGroups = createSelector(
  selectCurrentMapDataByMap,
  (mapDataObj) => mapDataObj?.legendGroups ?? {}
)
export const selectAllLocalLegendGroups = createSelector(
  selectCurrentLocalMapDataByMap,
  (mapDataObj) => mapDataObj?.legendGroups ?? {},
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)

// NOTE: Use with Redux hook below:
// const mapName = useSelector((state) => selectMapName(state, <mapId>))
export const selectMapName = createSelector(
  [selectMergedMapData, (state, mapId) => mapId],
  (mapData, mapId) => mapData?.[mapId]?.name ?? '',
  { memoizeOptions: { maxSize: MAX_MEMOIZED_CHARTS } }
)

export const selectDefaultViewportFunc = createSelector(
  selectCurrentMergedMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const vp = dataObj?.defaultViewport?.[mapId] || {}
        const minZoom = clamp(MIN_ZOOM, MAX_ZOOM, vp.minZoom ?? MIN_ZOOM)
        const maxZoom = clamp(minZoom, MAX_ZOOM, vp.maxZoom ?? MAX_ZOOM)
        const minPitch = clamp(MIN_PITCH, MAX_PITCH, vp.minPitch ?? MIN_PITCH)
        const maxPitch = clamp(minPitch, MAX_PITCH, vp.maxPitch ?? MAX_PITCH)
        const minBearing = clamp(
          MIN_BEARING,
          MAX_BEARING,
          vp.minBearing ?? MIN_BEARING
        )
        const maxBearing = clamp(
          minBearing,
          MAX_BEARING,
          vp.maxBearing ?? MAX_BEARING
        )
        return {
          ...vp,
          ...(vp.zoom != null && {
            zoom: clamp(minZoom, maxZoom, vp.zoom),
          }),
          ...(vp.pitch != null && {
            pitch: clamp(minPitch, maxPitch, vp.pitch),
          }),
          ...(vp.bearing != null && {
            bearing: clamp(minBearing, maxBearing, vp.bearing),
          }),
          ...(vp.minZoom != null && { minZoom }),
          ...(vp.maxZoom != null && { maxZoom }),
          ...(vp.minPitch != null && { minPitch }),
          ...(vp.maxPitch != null && { maxPitch }),
          ...(vp.minBearing != null && { minBearing }),
          ...(vp.maxBearing != null && { maxBearing }),
        }
      },
      MAX_MEMOIZED_CHARTS
    )
)

// NOTE: Use with Redux hook below:
// const chartObj = useSelector((state) => selectMapExistsById(state, <mapId>))
export const selectMapExistsById = createSelector(
  [selectMergedMapData, (state, mapId) => mapId],
  (mapData, mapId) => Boolean(mapData?.[mapId]),
  { memoizeOptions: { maxSize: MAX_MEMOIZED_CHARTS } }
)

export const selectLegendDataFunc = createSelector(
  selectCurrentMergedMapDataByMap,
  (mapDataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => mapDataObj?.legendGroups?.[mapId] ?? {},
      MAX_MEMOIZED_CHARTS
    )
)

export const selectLegendPropFunc = createSelector(
  [selectCurrentLocalMapDataByMap, selectCurrentMapDataByMap],
  (currentLocalMapDataByMap, currentMapDataByMap) => (prop, defaultValue) =>
    currentLocalMapDataByMap[prop] ??
    new Proxy(currentMapDataByMap[prop] ?? {}, {
      get: (dataByMap, mapId) => dataByMap[mapId] ?? defaultValue,
    })
)

export const selectLegendView = createSelector(
  selectLegendPropFunc,
  (legendPropFunc) => legendPropFunc('legendView', legendViews.COMPACT)
)

export const selectShowLegendGroupNames = createSelector(
  selectLegendPropFunc,
  (legendPropFunc) => legendPropFunc('showLegendGroupNames', true)
)

export const selectLegendLayout = createSelector(
  selectLegendPropFunc,
  (legendPropFunc) => legendPropFunc('legendLayout', legendLayouts.AUTO)
)

export const selectLegendWidth = createSelector(
  selectLegendPropFunc,
  (legendPropFunc) => legendPropFunc('legendWidth', legendWidths.AUTO)
)

export const selectShowLegendAdvancedControls = createSelector(
  selectLegendPropFunc,
  (legendPropFunc) => legendPropFunc('showLegendAdvancedControls', false)
)

export const selectMapControlsByMap = createSelector(
  selectCurrentMergedMapDataByMap,
  (data) => data?.mapControls ?? {}
)
export const selectMapModal = createSelector(
  selectLocalMap,
  (data) =>
    data?.mapModal ?? {
      isOpen: false,
      data: {
        feature: '',
      },
    },
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: (a, b) => {
        return (b.isOpen === false && b.isOpen === a.isOpen) || a === b
      },
    },
  }
)
export const selectMapLayers = createSelector(
  selectLocalMap,
  (data) => data?.mapLayers ?? {}
)
const selectMapLegendFunc = createSelector(
  selectCurrentLocalMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => dataObj?.mapLegend?.[mapId] ?? {},
      MAX_MEMOIZED_CHARTS
    )
)
export const selectIsMapLegendOpenFunc = createSelector(
  selectMapLegendFunc,
  (mapLegendFunc) => (mapId) => mapLegendFunc(mapId)?.isOpen ?? true
)
// Local -> globalOutputs
const selectLocalGlobalOutputs = createSelector(
  selectLocal,
  (data) => data?.globalOutputs ?? {}
)
export const selectMergedGlobalOutputs = createSelector(
  [selectGlobalOutputs, selectLocalGlobalOutputs],
  (globalOutputsData, localGlobalOutputs) =>
    !localGlobalOutputs || Object.keys(localGlobalOutputs).length === 0
      ? globalOutputsData || {}
      : deepMerge(globalOutputsData || {}, localGlobalOutputs)
)
export const selectAnyGlobalOutputData = createSelector(
  selectMergedGlobalOutputs,
  (data) => Boolean(data && Object.keys(data).length > 0)
)
export const selectGlobalOutputProps = createSelector(
  selectMergedGlobalOutputs,
  (merged) => {
    const props = merged?.props ?? {}
    const values = merged?.values ?? {}
    const combined = addValuesToProps(props, values)
    const result = {}
    for (const [key, item] of Object.entries(combined)) {
      if (item && item.value != null) {
        result[key] = { ...item, enabled: false }
      }
    }
    return result
  }
)
// Local -> Map -> mapControls
export const selectViewportsByMap = createSelector(
  [selectMapControlsByMap, selectDefaultViewportFunc, selectMergedMapData],
  (mapControls, defaultViewportFunc, maps) => {
    const mapKeys = Object.keys(maps || {})
    const viewports = {}
    for (let i = 0; i < mapKeys.length; i++) {
      const mapId = mapKeys[i]
      const defaultVp = defaultViewportFunc(mapId) || {}
      const localVp = mapControls?.[mapId]?.viewport || {}

      const minZoom = clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        defaultVp.minZoom ?? DEFAULT_VIEWPORT.minZoom
      )
      const maxZoom = clamp(
        minZoom,
        MAX_ZOOM,
        defaultVp.maxZoom ?? DEFAULT_VIEWPORT.maxZoom
      )
      const minPitch = clamp(
        MIN_PITCH,
        MAX_PITCH,
        defaultVp.minPitch ?? DEFAULT_VIEWPORT.minPitch
      )
      const maxPitch = clamp(
        minPitch,
        MAX_PITCH,
        defaultVp.maxPitch ?? DEFAULT_VIEWPORT.maxPitch
      )
      const minBearing = clamp(
        MIN_BEARING,
        MAX_BEARING,
        defaultVp.minBearing ?? DEFAULT_VIEWPORT.minBearing
      )
      const maxBearing = clamp(
        minBearing,
        MAX_BEARING,
        defaultVp.maxBearing ?? DEFAULT_VIEWPORT.maxBearing
      )

      const merged = {
        ...DEFAULT_VIEWPORT,
        ...defaultVp,
        ...localVp,
        minZoom,
        maxZoom,
        minPitch,
        maxPitch,
        minBearing,
        maxBearing,
      }

      merged.zoom = clamp(
        minZoom,
        maxZoom,
        merged.zoom ?? DEFAULT_VIEWPORT.zoom
      )
      merged.pitch = clamp(
        minPitch,
        maxPitch,
        merged.pitch ?? DEFAULT_VIEWPORT.pitch
      )
      merged.bearing = clamp(
        minBearing,
        maxBearing,
        merged.bearing ?? DEFAULT_VIEWPORT.bearing
      )

      viewports[mapId] = merged
    }
    return viewports
  }
)
export const selectBearingFunc = createSelector(selectViewportsByMap, (data) =>
  maxSizedMemoization(
    (mapId) => mapId,
    (mapId) => data?.[mapId]?.bearing ?? DEFAULT_VIEWPORT.bearing,
    MAX_MEMOIZED_CHARTS
  )
)
export const selectPitchFunc = createSelector(selectViewportsByMap, (data) =>
  maxSizedMemoization(
    (mapId) => mapId,
    (mapId) => data?.[mapId]?.pitch ?? DEFAULT_VIEWPORT.pitch,
    MAX_MEMOIZED_CHARTS
  )
)
export const selectZoomFunc = createSelector(selectViewportsByMap, (data) =>
  maxSizedMemoization(
    (mapId) => mapId,
    (mapId) => data?.[mapId]?.zoom ?? DEFAULT_VIEWPORT.zoom,
    MAX_MEMOIZED_CHARTS
  )
)

export const selectIsMapboxTokenProvided = createSelector(
  selectMapboxToken,
  (token) => token != null && token !== ''
)

export const selectCurrentMapStyleIdFunc = createSelector(
  [selectIsMapboxTokenProvided, selectCurrentMergedMapDataByMap],
  (isMapboxTokenProvided, dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const defaultMapStyleId = isMapboxTokenProvided
          ? 'mapboxDark'
          : 'cartoDarkMatter'
        return dataObj?.currentStyle?.[mapId] ?? defaultMapStyleId
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectLockMapStyleFunc = createSelector(
  selectCurrentMergedMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => Boolean(dataObj?.lockStyle?.[mapId]),
      MAX_MEMOIZED_CHARTS
    )
)

export const selectCurrentMapProjectionFunc = createSelector(
  [selectCurrentMergedMapDataByMap, selectIsMapboxTokenProvided],
  (dataObj, isMapboxTokenProvided) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const proj = dataObj?.currentProjection?.[mapId]
        const validSet = isMapboxTokenProvided
          ? MAPBOX_PROJECTIONS
          : MAPLIBRE_PROJECTIONS
        return validSet.has(proj) ? proj : MAP_PROJECTIONS.MERCATOR
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectLockMapProjectionFunc = createSelector(
  selectCurrentMergedMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => Boolean(dataObj?.lockProjection?.[mapId]),
      MAX_MEMOIZED_CHARTS
    )
)

const selectIsGlobeNotMemoized = createSelector(
  [selectViewportsByMap, selectCurrentMapProjectionFunc],
  (viewportsByMap, currentMapProjectionFunc) => {
    if (!viewportsByMap) return {}
    const result = {}
    for (const [mapId, vp] of Object.entries(viewportsByMap)) {
      const mapProjection = currentMapProjectionFunc(mapId)
      const zoom = vp?.zoom
      result[mapId] = mapProjection === MAP_PROJECTIONS.GLOBE && zoom < 6
    }
    return result
  }
)
export const selectIsGlobe = createSelector(
  [selectIsGlobeNotMemoized],
  (isGlobeData) => (mapId) => isGlobeData?.[mapId]
)
export const selectMapStyleOptions = createSelector(
  [selectOrderedMaps, selectIsMapboxTokenProvided],
  (data, isMapboxTokenProvided) => {
    const ordered = orderEntireDict(data)
    const merged = {
      ...DEFAULT_MAP_STYLE_OBJECTS,
      ...(ordered?.additionalMapStyles ?? {}),
    }
    const result = {}
    for (const [key, styleObj] of Object.entries(merged)) {
      if (
        isMapboxTokenProvided ||
        !(styleObj.mapbox || isMapboxStyle(styleObj.spec))
      ) {
        result[key] = styleObj
      }
    }
    return result
  }
)

export const selectIsCurrentMapboxStyleFunc = createSelector(
  [selectMapStyleOptions, selectCurrentMapStyleIdFunc],
  (mapStyleOptions, currentMapStyleIdFunc) => (mapId) => {
    const currentMapStyleId = currentMapStyleIdFunc(mapId)
    const mapStyleOption = mapStyleOptions[currentMapStyleId]
    const mapStyle = mapStyleOption?.spec
    return Boolean(mapStyleOption?.mapbox || isMapboxStyle(mapStyle))
  }
)

export const selectMapProjectionOptionsFunc = createSelector(
  [selectOrderedMaps, selectIsCurrentMapboxStyleFunc],
  (data, isCurrentMapboxStyleFunc) => (mapId) => {
    const ordered = orderEntireDict(data) || {}
    const additional = ordered.additionalProjections || {}
    const isMapbox = isCurrentMapboxStyleFunc(mapId)
    const validProjections = isMapbox
      ? MAPBOX_PROJECTIONS
      : MAPLIBRE_PROJECTIONS
    const defaultProjections = {}
    for (const proj of validProjections) {
      if (
        proj !== MAP_PROJECTIONS.MERCATOR &&
        proj !== MAP_PROJECTIONS.GLOBE &&
        DEFAULT_MAP_PROJECTION_OBJECTS[proj]
      ) {
        defaultProjections[proj] = DEFAULT_MAP_PROJECTION_OBJECTS[proj]
      }
    }
    return { ...defaultProjections, ...additional }
  }
)

export const selectPitchSliderToggleFunc = createSelector(
  selectMapControlsByMap,
  (controls) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => controls[mapId]?.showPitchSlider,
      MAX_MEMOIZED_CHARTS
    )
)
export const selectBearingSliderToggleFunc = createSelector(
  selectMapControlsByMap,
  (controls) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => controls[mapId]?.showBearingSlider,
      MAX_MEMOIZED_CHARTS
    )
)
export const selectOptionalViewportsFunc = createSelector(
  selectCurrentMapDataByMap,
  (dataObj) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => dataObj?.optionalViewports?.[mapId],
      MAX_MEMOIZED_CHARTS
    )
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
        const getEnabledTypes = (dataSource) => {
          const legendGroups = dataSource?.legendGroups?.[mapId] || {}
          const merged = {}
          for (const group of Object.values(legendGroups)) {
            if (group?.data) {
              Object.assign(merged, group.data)
            }
          }
          const filtered = {}
          for (const key of Object.keys(merged)) {
            if (mapFeatures?.[key]?.type === layerKey) {
              filtered[key] = merged[key]
            }
          }
          return filtered
        }
        const localTypes = getEnabledTypes(localMapObj)
        return Object.keys(localTypes).length === 0
          ? getEnabledTypes(mapDataObj)
          : localTypes
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectAllNodeIcons = createSelector(
  selectLegendTypesFn,
  (typesFn) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const types = typesFn({ mapId, layerKey: 'node' }) || {}
        return Object.values(types)
          .map((item) => item?.icon)
          .filter(Boolean)
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
        const allTypes = typesFn({ mapId, layerKey }) || {}
        const result = {}
        for (const [key, item] of Object.entries(allTypes)) {
          result[key] = item?.value ? item : false
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledArcsFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'arc' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledNodesFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'node' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectEnabledGeosFunc = createSelector(
  selectEnabledTypesFn,
  (enabledTypesFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => enabledTypesFunc({ mapId, layerKey: 'geo' }),
      MAX_MEMOIZED_CHARTS
    )
)
export const selectGeo = createSelector(
  selectMapLayers,
  (data) => data?.geography ?? {}
)

// Local -> features (arcs, nodes, geos)
export const selectLocalFeatures = createSelector(
  selectLocal,
  (data) => data?.mapFeatures?.data ?? {}
)
export const selectLocalNodes = createSelector(
  [selectLocalFeatures, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'node') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
export const selectLocalArcs = createSelector(
  [selectLocalFeatures, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'arc') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
export const selectLocalGeos = createSelector(
  [selectLocalFeatures, selectCurrentTime],
  (data, time) => {
    if (!data) return {}
    const filtered = {}
    for (const [key, val] of Object.entries(data)) {
      if (val?.type === 'geo') filtered[key] = val
    }
    return getTimeValue(time, filtered)
  }
)
export const selectLocalizedNodeTypes = createSelector(
  [selectNodeTypes, selectLocalNodes],
  (nodeTypes, localNodes) =>
    !localNodes || Object.keys(localNodes).length === 0
      ? nodeTypes
      : deepMerge(nodeTypes, localNodes),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)
export const selectLocalizedArcTypes = createSelector(
  [selectArcTypes, selectLocalArcs],
  (arcTypes, localArcs) =>
    !localArcs || Object.keys(localArcs).length === 0
      ? arcTypes
      : deepMerge(arcTypes, localArcs),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)
export const selectLocalizedGeoTypes = createSelector(
  [selectGeoTypes, selectLocalGeos],
  (geoTypes, localGeos) =>
    !localGeos || Object.keys(localGeos).length === 0
      ? geoTypes
      : deepMerge(geoTypes, localGeos),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)
export const selectArcTypeKeys = createSelector(
  selectLocalizedArcTypes,
  (data) => Object.keys(data || {}),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)
export const selectNodeTypeKeys = createSelector(
  selectLocalizedNodeTypes,
  (data) => Object.keys(data || {}),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)

const getMergedAllProps = (data, dataType) => {
  const result = {}
  const typeKeys = Object.keys(data || {})
  for (let t = 0; t < typeKeys.length; t++) {
    const key = typeKeys[t]
    const type = data[key]
    if (!type || typeof type !== 'object') {
      result[key] = []
      continue
    }
    const rawLoc = type.data?.location
    if (!rawLoc || typeof rawLoc !== 'object') {
      result[key] = []
      continue
    }
    const locationKeys = Object.keys(rawLoc).filter((k) => k !== 'timeValues')
    if (locationKeys.length === 0) {
      result[key] = []
      continue
    }
    const count = rawLoc[locationKeys[0]]?.length ?? 0
    if (count === 0) {
      result[key] = []
      continue
    }
    const rawValues = type.data?.valueLists || {}
    const valueKeys = Object.keys(rawValues).filter((k) => k !== 'timeValues')
    const restType = { ...type }
    delete restType.data
    const baseProps = { ...restType, type: key }

    const items = new Array(count)
    for (let i = 0; i < count; i++) {
      const values = {}
      for (let j = 0; j < valueKeys.length; j++) {
        const vk = valueKeys[j]
        values[vk] = rawValues[vk]?.[i]
      }
      const itemLoc = {}
      for (let j = 0; j < locationKeys.length; j++) {
        const lk = locationKeys[j]
        const val = rawLoc[lk]?.[i]
        itemLoc[lk] = dataType === 'node' && Array.isArray(val) ? val[0] : val
      }
      items[i] = {
        ...baseProps,
        ...itemLoc,
        values,
      }
    }
    result[key] = items
  }
  return result
}

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

const selectEffectiveMapFeaturesBy = createSelector(
  selectLegendTypesFn,
  (legendObjectsFunc) => (mapId, layerKey, featuresByType, type) => {
    const legendFeatures = legendObjectsFunc({ mapId, layerKey }) || {}
    const features = featuresByType?.[type] || []
    const legendObj = legendFeatures[type]
    if (!legendObj) return features
    const result = new Array(features.length)
    for (let i = 0; i < features.length; i++) {
      result[i] = deepMerge(features[i], legendObj)
    }
    return result
  }
)
export const selectEffectiveArcsBy = createSelector(
  [selectEffectiveMapFeaturesBy, selectMergedArcs],
  (effectiveMapFeaturesBy, arcsByType) => (type, mapId) =>
    effectiveMapFeaturesBy(mapId, 'arc', arcsByType, type)
)
export const selectEffectiveNodesBy = createSelector(
  [selectEffectiveMapFeaturesBy, selectMergedNodes],
  (effectiveMapFeaturesBy, nodesByType) => (type, mapId) =>
    effectiveMapFeaturesBy(mapId, 'node', nodesByType, type)
)
export const selectEffectiveGeosBy = createSelector(
  [selectEffectiveMapFeaturesBy, selectMergedGeos],
  (effectiveMapFeaturesBy, geosByType) => (type, mapId) =>
    effectiveMapFeaturesBy(mapId, 'geo', geosByType, type)
)

// Map (Custom)
export const selectLayerById = (state, id) => state?.local?.map?.mapLayers?.[id]

export const selectNodeDataFunc = createSelector(
  [selectEnabledNodesFunc, selectMergedNodes],
  (enabledNodesFunc, mergedData) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const enabled = enabledNodesFunc(mapId) || {}
        const result = {}
        for (const [key, isEnabled] of Object.entries(enabled)) {
          if (isEnabled && mergedData?.[key]) {
            result[key] = Object.entries(mergedData[key])
          }
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

// Local -> groupedOutputs
const selectLocalStatGroupings = createSelector(
  selectLocal,
  (data) => data?.groupedOutputs?.groupings ?? {}
)

const selectStatGroupings = createSelector(
  selectOrderedGroupedOutputs,
  (data) => data?.groupings ?? {}
)

// outputs derived
export const selectMergedStatGroupings = createSelector(
  [selectLocalStatGroupings, selectStatGroupings],
  (localData, data) =>
    !localData || Object.keys(localData).length === 0
      ? data || {}
      : deepMerge(data || {}, localData)
)

export const selectSlimStatGroupings = createSelector(
  selectMergedStatGroupings,
  (statGroupings) => {
    const result = {}
    const keys = Object.keys(statGroupings || {})
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const grouping = statGroupings[key]
      if (grouping && grouping.levels) {
        const levels = {}
        const levelKeys = Object.keys(grouping.levels)
        for (let j = 0; j < levelKeys.length; j++) {
          const lk = levelKeys[j]
          const restLevel = { ...(grouping.levels[lk] || {}) }
          delete restLevel.coloring
          levels[lk] = restLevel
        }
        result[key] = { ...grouping, levels }
      } else {
        result[key] = grouping
      }
    }
    return result
  },
  {
    memoize: lruMemoize,
    memoizeOptions: { equalityCheck: deepEqual },
  }
)

const selectStatGroupingIndicies = createSelector(
  selectSlimStatGroupings,
  (groupings) => {
    const result = {}
    const keys = Object.keys(groupings || {})
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const grouping = groupings[key]
      if (grouping && grouping.data && Array.isArray(grouping.data.id)) {
        const idArr = grouping.data.id
        const idIndexMap = {}
        for (let j = 0; j < idArr.length; j++) {
          idIndexMap[idArr[j]] = j
        }
        result[key] = {
          ...grouping,
          data: {
            ...grouping.data,
            id: idIndexMap,
          },
        }
      } else {
        result[key] = grouping
      }
    }
    return result
  }
)

const selectGroupedOutputValueLists = createSelector(
  selectGroupedOutputsData,
  (groupedOutputs) => {
    const result = {}
    for (const [k, v] of Object.entries(groupedOutputs || {})) {
      result[k] = v?.valueLists
    }
    return result
  }
)

const SKIP_EQUALITY_CHECK = '__skipEqualityCheck__'

const skipEqualityCheck = (obj) => Boolean(obj?.[SKIP_EQUALITY_CHECK])

const createSafeDeepEqualSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    equalityCheck: (a, b) =>
      skipEqualityCheck(a) || skipEqualityCheck(b) || deepEqual(a, b),
  },
})

const selectGroupedOutputValueBuffers = createSelector(
  selectGroupedOutputValueLists,
  (valueLists) => {
    const result = {}
    for (const [k, lists] of Object.entries(valueLists || {})) {
      if (lists && typeof lists === 'object') {
        const buffers = {}
        for (const [statKey, arr] of Object.entries(lists)) {
          if (Array.isArray(arr)) {
            const isCrossOriginIsolated =
              typeof window !== 'undefined' && window.crossOriginIsolated
            const buffer = isCrossOriginIsolated
              ? new SharedArrayBuffer(arr.length * 8)
              : new ArrayBuffer(arr.length * 8)
            const view = new Float64Array(buffer)
            for (let i = 0; i < arr.length; i++) {
              view[i] = arr[i]
            }
            buffers[statKey] = view.buffer
          }
        }
        result[k] = buffers
      }
    }
    result[SKIP_EQUALITY_CHECK] = true
    return result
  }
)

export const selectChartColors = createSelector(
  selectMergedStatGroupings,
  (statGroupings) => (chartType, groupingId, groupingLevel) => {
    const groupingLen = groupingId?.length ?? 0
    const groupingRange = []
    for (let i = groupingLen - 1; i >= 0; i--) {
      groupingRange.push(i)
    }
    const isHierarchicalChart =
      chartType === chartVariant.SUNBURST || chartType === chartVariant.TREEMAP
    if (isHierarchicalChart) {
      const merged = {}
      for (let i = 0; i < groupingRange.length; i++) {
        const idx = groupingRange[i]
        const fn = getColoringFn(
          statGroupings,
          groupingId[idx],
          groupingLevel[idx]
        )
        Object.assign(merged, fn)
      }
      return merged
    }
    const firstIdx = groupingRange[0]
    return getColoringFn(
      statGroupings,
      groupingId[firstIdx],
      groupingLevel[firstIdx]
    )
  }
)

export const selectFilterableStats = createSelector(
  selectGroupedOutputTypes,
  (groupedOutputTypes) => {
    if (!groupedOutputTypes) return {}
    const result = {}
    for (const group of Object.values(groupedOutputTypes)) {
      if (group && typeof group === 'object') {
        for (const [key, statObj] of Object.entries(group)) {
          if (statObj?.allowFiltering !== false) {
            result[key] = { ...statObj, type: 'num' }
          }
        }
      }
    }
    return result
  }
)

const mergeFuncs = {
  [chartAggrFunc.SUM]: (val) => {
    if (!val || val.length === 0) return 0
    let sum = 0
    for (let i = 0; i < val.length; i++) sum += val[i]
    return sum
  },
  [chartAggrFunc.MIN]: (val) =>
    val && val.length ? Math.min(...val) : undefined,
  [chartAggrFunc.MAX]: (val) =>
    val && val.length ? Math.max(...val) : undefined,
  [chartAggrFunc.MEAN]: (val) => {
    if (!val || val.length === 0) return 0
    let sum = 0
    for (let i = 0; i < val.length; i++) sum += val[i]
    return sum / val.length
  },
  [chartAggrFunc.DIVISOR]: (val) => {
    if (!val || val.length === 0) return 0
    let sum = 0
    for (let i = 0; i < val.length; i++) sum += val[i]
    return sum
  },
}

export const selectMemoizedChartFunc = createSafeDeepEqualSelector(
  [
    selectGroupedOutputsData,
    selectSlimStatGroupings,
    selectStatGroupingIndicies,
    selectGroupedOutputValueLists, // Only used to determine if `valueBuffers` changed in `equalityCheck` of memoization
    selectGroupedOutputValueBuffers, // This is the one actually used in the worker (ignored in `equalityCheck` since if `valueLists` change, `valueBuffers` will too)
  ],
  (groupedOutputs, groupings, groupingIndicies, _, valueBuffers) =>
    maxSizedMemoization(
      (obj) => JSON.stringify(obj),
      async (obj) => {
        if (!obj || !obj.dataset || !groupedOutputs?.[obj.dataset]) {
          return []
        }
        const groupDict = { All: 0 }
        const intToGroup = ['All']
        const statObjs = obj.stats ?? []
        // Helper function to find the parental path of a given level
        const createParentalPath = (
          path,
          category,
          currentLevel,
          onlyOrdering = false
        ) => {
          const parent = groupings?.[category]?.levels?.[currentLevel]?.parent
          if (
            parent == null ||
            (onlyOrdering &&
              groupings?.[category]?.levels?.[currentLevel]?.orderWithParent ===
                false)
          ) {
            return [...path, currentLevel]
          } else {
            return createParentalPath(
              [...path, currentLevel],
              category,
              parent,
              onlyOrdering
            )
          }
        }

        const valueListsObj = groupedOutputs[obj.dataset]?.valueLists || {}
        const groupLength = Object.values(valueListsObj)[0]?.length ?? 0

        // Given an index returns a string to group all similar indicies by
        const categoryFunc = (category, level) => {
          const parentalPath = createParentalPath([], category, level)
          const groupList =
            groupedOutputs?.[obj.dataset]?.groupLists?.[category]
          const catData = groupings?.[category]?.data || {}
          const groupingVal = []
          for (let p = 0; p < parentalPath.length; p++) {
            const pKey = parentalPath[p]
            if (catData[pKey]) groupingVal.push(catData[pKey])
          }

          if (groupList == null || groupingVal.length === 0) {
            return {
              groupBy: new Array(groupLength).fill(0),
              parentLength: 1,
              groupLength,
            }
          }

          let groupBy = new Array(groupLength * groupingVal.length)
          for (let index = 0; index < groupLength; index++) {
            const groupName = groupList[index]
            const groupingIndex =
              groupingIndicies?.[category]?.data?.id?.[groupName]
            for (let i = 0; i < groupingVal.length; i++) {
              const itemVal = groupingVal[i]?.[groupingIndex]
              if (groupDict[itemVal] == null) {
                groupDict[itemVal] = intToGroup.length
                intToGroup.push(itemVal)
              }
              groupBy[index * groupingVal.length + i] = groupDict[itemVal]
            }
          }
          return {
            groupBy,
            parentLength: groupingVal.length,
            groupLength,
          }
        }
        let groupBys = []
        const parentLengths = []
        const groupingIds = obj.groupingId ?? []
        const groupingLevels = obj.groupingLevel ?? []
        // For each grouping, calculate the groupBy and parentLength
        for (let i = 0; i < groupingIds.length; i++) {
          if (groupingIds[i] != null) {
            const category = categoryFunc(groupingIds[i], groupingLevels[i])
            groupBys = groupBys.concat(category.groupBy)
            parentLengths.push(category.parentLength)
          } else {
            groupBys = groupBys.concat(new Array(groupLength).fill(0))
            parentLengths.push(1)
          }
        }
        if (groupBys.length === 0) {
          groupBys = groupBys.concat(new Array(groupLength).fill(0))
          parentLengths.push(1)
        }

        const filteredStatsToCalc = filterGroupedOutputs(
          groupedOutputs[obj.dataset],
          obj?.filters ?? [],
          groupingIndicies
        )
        // Calculates stat values without applying mergeFunc
        const calculatedStats = statObjs.map((stat) => {
          // Add the aggregationGroupingLevel to the groupBys
          let finalGroupBy = []
          let statParentLengths = []
          if ('aggregationGroupingLevel' in stat) {
            const category = categoryFunc(
              stat.aggregationGroupingId,
              stat.aggregationGroupingLevel
            )
            finalGroupBy = category.groupBy
            statParentLengths = parentLengths.concat(category.parentLength)
          } else {
            finalGroupBy = new Array(groupLength)
            for (let i = 0; i < groupLength; i++) {
              finalGroupBy[i] = i
            }
            statParentLengths = parentLengths.concat(1)
          }
          const buffersize = (finalGroupBy.length + groupBys.length) * 4
          const isCrossOriginIsolated =
            typeof window !== 'undefined' && window.crossOriginIsolated
          const buffer = isCrossOriginIsolated
            ? new SharedArrayBuffer(buffersize)
            : new ArrayBuffer(buffersize)
          const view = new Uint32Array(buffer)
          view.set(groupBys)
          view.set(finalGroupBy, groupBys.length)
          const datasetBuffers = valueBuffers?.[obj.dataset] || {}
          const statGroup = workerManager.doWork({
            groupBys: buffer,
            parentLengths: statParentLengths,
            groupLength,
            indicies: filteredStatsToCalc,
            valueList: datasetBuffers[stat.statId],
          })
          return 'statIdDivisor' in stat
            ? Promise.all([
                statGroup,
                workerManager.doWork({
                  groupBys: buffer,
                  parentLengths: statParentLengths,
                  groupLength,
                  indicies: filteredStatsToCalc,
                  valueList: datasetBuffers[stat.statIdDivisor],
                }),
              ])
            : statGroup
        })
        return Promise.all(calculatedStats).then((resolvedStats) => {
          // Convert integer keys in worker output to string names from intToGroup
          const mapKeysToIntToGroup = (tree) => {
            if (typeof tree !== 'object' || tree === null) return tree
            const values = Object.values(tree)
            if (values.length > 0 && typeof values[0] === 'number') {
              return tree
            }
            const newTree = {}
            for (const key of Object.keys(tree)) {
              const newKey = key
                .split(' \u279D ')
                .map((item) => intToGroup[item] ?? item)
                .join(' \u279D ')
              newTree[newKey] = mapKeysToIntToGroup(tree[key])
            }
            return newTree
          }

          // Aggregate / merge values at the lowest level of the tree
          const isRawValuesChart =
            obj.chartType === chartVariant.BOX_PLOT ||
            obj.chartType === chartVariant.DISTRIBUTION
          const mergeStatTree = (tree, aggrType) => {
            if (typeof tree !== 'object' || tree === null) return tree
            const values = Object.values(tree)
            if (values.length === 0) return tree
            const isLowest = typeof values[0] === 'number'
            if (isLowest) {
              const numValues = values.filter(
                (v) => typeof v === 'number' && !isNaN(v)
              )
              if (isRawValuesChart) return numValues
              if (numValues.length === 0) return 0
              const aggrFn = mergeFuncs[aggrType] || ((v) => v)
              return aggrFn(numValues)
            }
            const newTree = {}
            for (const key of Object.keys(tree)) {
              newTree[key] = mergeStatTree(tree[key], aggrType)
            }
            return newTree
          }

          // merge the calculated stats - unless boxplot
          // NOTE: Boxplot needs subgrouping - handle this in chart adapter
          const mergedValues = resolvedStats.map((statResult, idx) => {
            const statObj = statObjs[idx]
            if (Array.isArray(statResult)) {
              return statResult.map((group) => {
                const namedGroup = mapKeysToIntToGroup(group)
                return mergeStatTree(namedGroup, statObj.aggregationType)
              })
            }
            const namedGroup = mapKeysToIntToGroup(statResult)
            return mergeStatTree(namedGroup, statObj.aggregationType)
          })

          const deepDivide = (a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
              return b !== 0 ? a / b : 0
            }
            if (a && typeof a === 'object' && b && typeof b === 'object') {
              const res = {}
              const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
              for (const k of allKeys) {
                res[k] = deepDivide(a[k], b[k])
              }
              return res
            }
            return a
          }

          const dividedValues = mergedValues.map((val) =>
            Array.isArray(val) ? deepDivide(val[0], val[1]) : val
          )

          // Helper function to map merged stats to chart input object
          const recursiveMapLayers = (val, lowestGroupings) => {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
              const firstVal = Object.values(val)[0]
              if (
                firstVal &&
                typeof firstVal === 'object' &&
                !Array.isArray(firstVal)
              ) {
                return Object.entries(val).map(([key, value]) => ({
                  name: obj.groupingId == null ? 'All' : key,
                  children: recursiveMapLayers(value, lowestGroupings),
                }))
              } else {
                const keys = lowestGroupings ?? Object.keys(val)
                return keys.map((key) => ({
                  name: key,
                  value: recursiveMapLayers(val[key] ?? 0),
                }))
              }
            } else if (Array.isArray(val)) {
              return val
            } else {
              return [val]
            }
          }

          // Helper function to list all of the lowest grouping levels before recursing
          const recursiveMapLayersHelper = (objWithGroups) => {
            const listLowestGroupings = (groupingLevel) => {
              if (groupingLevel && typeof groupingLevel === 'object') {
                const first = Object.values(groupingLevel)[0]
                if (
                  first &&
                  typeof first === 'object' &&
                  !Array.isArray(first)
                ) {
                  const set = new Set()
                  for (const sub of Object.values(groupingLevel)) {
                    const subKeys = listLowestGroupings(sub)
                    for (let i = 0; i < subKeys.length; i++) set.add(subKeys[i])
                  }
                  return Array.from(set)
                }
                return Object.keys(groupingLevel)
              }
              return []
            }

            return recursiveMapLayers(
              objWithGroups,
              obj?.defaultToZero ? listLowestGroupings(objWithGroups) : null
            )
          }

          // Ordering for the X's in the chart
          const getOrderingsAtIndex = (idx) => {
            const gId = obj.groupingId?.[idx]
            const gLevel = obj.groupingLevel?.[idx]
            const parentalPath = createParentalPath([], gId, gLevel, true)
            return parentalPath.map(
              (level) => groupings?.[gId]?.levels?.[level]?.ordering ?? []
            )
          }
          const nLevelOrder = (depth) => (chartItem) => {
            if (chartItem && chartItem.children) {
              const sortedChildren = customSortByX(
                getOrderingsAtIndex(depth),
                chartItem.children
              )
              return {
                ...chartItem,
                children: sortedChildren.map(nLevelOrder(depth + 1)),
              }
            }
            return chartItem
          }
          // Formats and sorts merged stats
          const formattedData = dividedValues.map((val) => {
            const cleaned = recursiveMap(
              (v) => typeof v !== 'object' || v === null || Array.isArray(v),
              (v) => v,
              (v) => {
                if (v && typeof v === 'object') {
                  const copy = { ...v }
                  delete copy[undefined]
                  return copy
                }
                return v
              }
            )(val)
            const mapped = recursiveMapLayersHelper(cleaned)
            const sorted = customSortByX(getOrderingsAtIndex(0), mapped)
            return sorted.map(nLevelOrder(1))
          })

          const mergeDataItems = (a, b) => {
            if (!a) return b
            if (!b) return a
            const result = {}
            const allKeys = new Set([...Object.keys(a), ...Object.keys(b)])
            for (const key of allKeys) {
              if (key === 'name') {
                result.name = a.name ?? b.name
              } else if (key === 'value') {
                result.value = (a.value || []).concat(b.value || [])
              } else if (key === 'children') {
                const mapA = {}
                for (const c of a.children || []) mapA[c.name] = c
                const mergedChildren = []
                const visited = new Set()
                for (const cb of b.children || []) {
                  visited.add(cb.name)
                  if (mapA[cb.name]) {
                    mergedChildren.push(mergeDataItems(mapA[cb.name], cb))
                  } else {
                    mergedChildren.push(cb)
                  }
                }
                for (const ca of a.children || []) {
                  if (!visited.has(ca.name)) {
                    mergedChildren.push(ca)
                  }
                }
                result.children = mergedChildren
              } else {
                result[key] = b[key] ?? a[key]
              }
            }
            return result
          }

          const mergeMultiStatData = (statsArr) => {
            if (!statsArr || statsArr.length === 0) return []
            let mergedMap = {}
            for (let i = 0; i < statsArr.length; i++) {
              const currentList = statsArr[i] || []
              for (let j = 0; j < currentList.length; j++) {
                const item = currentList[j]
                if (!mergedMap[item.name]) {
                  mergedMap[item.name] = item
                } else {
                  mergedMap[item.name] = mergeDataItems(
                    mergedMap[item.name],
                    item
                  )
                }
              }
            }
            return Object.values(mergedMap)
          }

          const result =
            obj.stats.length > 1
              ? mergeMultiStatData(formattedData)
              : formattedData[0] || []
          const xAxisOrder = obj?.xAxisOrder ?? 'default'
          const getValue = (item) => {
            if (item && item.children) {
              let sum = 0
              for (let i = 0; i < item.children.length; i++) {
                sum += getValue(item.children[i])
              }
              return sum
            }
            return item?.value?.[0] ?? 0
          }
          const sortFn = {
            value_ascending: (a, b) => getValue(a) - getValue(b),
            value_descending: (a, b) => getValue(b) - getValue(a),
            alpha_ascending: (a, b) => a.name.localeCompare(b.name),
            alpha_descending: (a, b) => b.name.localeCompare(a.name),
          }[xAxisOrder]
          const sortedResult = sortFn ? [...result].sort(sortFn) : result
          return sortedResult
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
        const selectedGlobalOutputs = forcePath(obj?.globalOutput ?? [])
        const sessionsFilter = obj?.sessions ?? []
        const formattedGlobalOutputs = []

        if (associatedData) {
          for (const val of Object.values(associatedData)) {
            if (sessionsFilter.includes(val?.name)) {
              const globalOutputs = val?.data?.globalOutputs
              const props = globalOutputs?.props ?? {}
              const values = globalOutputs?.values ?? {}
              const combined = addValuesToProps(props, values)
              const children = []
              for (let i = 0; i < selectedGlobalOutputs.length; i++) {
                const k = selectedGlobalOutputs[i]
                const item = combined[k]
                if (item && item.value != null) {
                  let numVal = item.value
                  if (typeof numVal === 'string' && numVal.includes(',')) {
                    numVal = numVal.replace(/,/g, '')
                  }
                  children.push({
                    id: item.id ?? k,
                    name: item.name || item.id || k,
                    value: [parseFloat(numVal)],
                  })
                }
              }
              const sessionItem = {
                name: val.name,
                children,
              }
              if (obj?.chartType in chartStatUses) {
                sessionItem.value = children.flatMap((c) => c.value)
              }
              formattedGlobalOutputs.push(sessionItem)
            }
          }
        }

        const xAxisOrder = obj?.xAxisOrder ?? 'default'
        const getValue = (item) => {
          if (item?.children) {
            let sum = 0
            for (let i = 0; i < item.children.length; i++) {
              sum += getValue(item.children[i])
            }
            return sum
          }
          return item?.value?.[0] ?? 0
        }
        const sortFn = {
          value_ascending: (a, b) => getValue(a) - getValue(b),
          value_descending: (a, b) => getValue(b) - getValue(a),
          alpha_ascending: (a, b) => a.name.localeCompare(b.name),
          alpha_descending: (a, b) => b.name.localeCompare(a.name),
        }[xAxisOrder]
        const sortedFormattedGlobalOutputs = sortFn
          ? [...formattedGlobalOutputs].sort(sortFn)
          : formattedGlobalOutputs
        return sortedFormattedGlobalOutputs
      },
      MAX_MEMOIZED_CHARTS
    )
)
// Node, Geo, & Arc derived
export const selectGroupedEnabledArcsFunc = createSelector(
  [selectEnabledArcsFunc, selectMergedArcs, selectCurrentMapProjectionFunc],
  (enabledArcsFunc, mergedArcs, projectionFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const enabledArcs = enabledArcsFunc(mapId) || {}
        const isMercator = projectionFunc(mapId) === MAP_PROJECTIONS.MERCATOR
        const result = {
          geoJson: {},
          '3d': {},
          false: {},
        }
        for (const [key, arcItems] of Object.entries(mergedArcs || {})) {
          if (enabledArcs[key]) {
            const firstItem = arcItems?.[0]
            let groupKey = 'false'
            if (firstItem && 'geoJson' in firstItem) {
              groupKey = 'geoJson'
            } else if (firstItem?.displayType === '3d' && isMercator) {
              groupKey = '3d'
            }
            result[groupKey][key] = arcItems
          }
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const data = dataFunc(mapId)?.false || {}
        const result = {}
        for (const [k, v] of Object.entries(data)) {
          result[k] = Object.entries(v)
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const data = dataFunc(mapId)?.['3d'] || {}
        const result = {}
        for (const [k, v] of Object.entries(data)) {
          result[k] = Object.entries(v)
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectMultiLineDataFunc = createSelector(
  selectGroupedEnabledArcsFunc,
  (dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const data = dataFunc(mapId)?.geoJson || {}
        const result = {}
        for (const [k, v] of Object.entries(data)) {
          result[k] = Object.entries(v)
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectArcRange = createSelector(
  selectEffectiveArcsBy,
  (effectiveArcsBy) =>
    maxSizedMemoization(
      (type, prop, mapId) => `${type}+${prop}+${mapId}`,
      (type, prop, mapId) => {
        const effectiveArcs = effectiveArcsBy(type, mapId)
        return computeItemRange(effectiveArcs, prop)
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectGroupedEnabledGeosFunc = createSelector(
  [selectEnabledGeosFunc, selectMergedGeos],
  (enabledGeosFunc, mergedGeos) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const enabledGeos = enabledGeosFunc(mapId) || {}
        const result = {
          true: {},
          false: {},
        }
        for (const [key, geoItems] of Object.entries(mergedGeos || {})) {
          if (enabledGeos[key]) {
            const hasGeoJson = Boolean(geoItems?.[0]?.geoJson)
            result[hasGeoJson ? 'true' : 'false'][key] = geoItems
          }
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectFetchedGeoDataFunc = createSelector(
  selectGroupedEnabledGeosFunc,
  (dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => dataFunc(mapId)?.true ?? {},
      MAX_MEMOIZED_CHARTS
    )
)

export const selectIncludedGeoDataFunc = createSelector(
  selectGroupedEnabledGeosFunc,
  (dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const data = dataFunc(mapId)?.false || {}
        const result = {}
        for (const [k, v] of Object.entries(data)) {
          result[k] = Object.entries(v)
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectMatchingKeysByTypeFunc = createSelector(
  [selectFetchedGeoDataFunc],
  (geosByType) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const typesObj = geosByType(mapId) || {}
        const result = {}
        for (const [typeKey, items] of Object.entries(typesObj)) {
          const byVal = {}
          if (Array.isArray(items)) {
            for (let i = 0; i < items.length; i++) {
              const item = { ...items[i], data_key: i }
              byVal[item.geoJsonValue] = item
            }
          }
          result[typeKey] = byVal
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

// Split nodes by those grouped vs those not
export const selectSplitNodeDataFunc = createSelector(
  [selectEnabledNodesFunc, selectNodeDataFunc],
  (enabledNodesFunc, nodeDataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const enabledNodes = enabledNodesFunc(mapId) || {}
        const nodeData = nodeDataFunc(mapId) || {}
        const result = { true: [], false: [] }
        for (const entries of Object.values(nodeData)) {
          for (let i = 0; i < entries.length; i++) {
            const d = entries[i]
            const nodeType = d[1]?.type
            const enabledConfig = enabledNodes[nodeType]
            if (!enabledConfig) continue
            const { colorBy, sizeBy, group } = enabledConfig
            const colorFallback = d[1]?.props?.[colorBy]?.fallback?.color
            const sizeFallback = d[1]?.props?.[sizeBy]?.fallback?.size
            const colorValue = d[1]?.values?.[colorBy]
            const sizeValue = d[1]?.values?.[sizeBy]
            if (
              (colorFallback != null || colorValue != null) &&
              (sizeFallback != null || sizeValue != null) &&
              !(group && colorValue == null)
            ) {
              const isGrouped = Boolean(group)
              result[isGrouped ? 'true' : 'false'].push(d)
            }
          }
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectGroupedNodesWithIdFunc = createSelector(
  selectSplitNodeDataFunc,
  (splitNodeDataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const groupedList = splitNodeDataFunc(mapId)?.true || []
        return groupedList.map((d) => ({ ...d[1], id: d[0] }))
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeRange = createSelector(
  selectEffectiveNodesBy,
  (effectiveNodesBy) =>
    maxSizedMemoization(
      (type, prop, mapId) => `${type}+${prop}+${mapId}`,
      (type, prop, mapId) => {
        const effectiveNodes = effectiveNodesBy(type, mapId)
        return computeItemRange(effectiveNodes, prop)
      },
      MAX_MEMOIZED_CHARTS
    )
)
export const selectGeoRange = createSelector(
  [selectEffectiveGeosBy],
  (effectiveGeosBy) =>
    maxSizedMemoization(
      (type, prop, mapId) => `${type}+${prop}+${mapId}`,
      (type, prop, mapId) => {
        const effectiveGeos = effectiveGeosBy(type, mapId)
        return computeItemRange(effectiveGeos, prop)
      },
      MAX_MEMOIZED_CHARTS
    )
)

// TODO: Explore reusing code for shared logic with `selectSplitNodeDataFunc`
export const selectLineMatchingKeysByTypeFunc = createSelector(
  [selectEnabledArcsFunc, selectMultiLineDataFunc],
  (enabledArcsFunc, dataFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const enabledArcs = enabledArcsFunc(mapId) || {}
        const multiLineData = dataFunc(mapId) || {}
        const result = {}
        for (const entries of Object.values(multiLineData)) {
          for (let i = 0; i < entries.length; i++) {
            const d = entries[i]
            const item = { ...d[1], data_key: d[0] }
            const arcType = item.type
            const enabledConfig = enabledArcs[arcType]
            if (!enabledConfig) continue
            const { colorBy, sizeBy } = enabledConfig
            const colorFallback = item.props?.[colorBy]?.fallback?.color
            const sizeFallback = item.props?.[sizeBy]?.fallback?.size
            const colorValue = item.values?.[colorBy]
            const sizeValue = item.values?.[sizeBy]
            if (
              (colorFallback != null || colorValue != null) &&
              (sizeFallback != null || sizeValue != null)
            ) {
              if (!result[arcType]) result[arcType] = {}
              result[arcType][item.geoJsonValue] = item
            }
          }
        }
        return result
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeClustersFunc = createSelector(
  [selectGroupedNodesWithIdFunc, selectEnabledNodesFunc],
  (dataFunc, legendObjectsFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const data = dataFunc(mapId) || []
        const legendObj = legendObjectsFunc(mapId) || {}
        // define helper functions
        const getVarByProp = (varByKey, nodeObj) =>
          legendObj[nodeObj?.type]?.[varByKey]
        const getClusterVarByProp = (varByKey, nodeCluster) =>
          legendObj[nodeCluster?.properties?.type]?.[varByKey]
        const getPosition = (d) => [d.longitude, d.latitude, d.altitude + 1]
        const getGroupCalculation = (groupCalculation, nodeCluster) =>
          legendObj[nodeCluster?.properties?.type]?.[groupCalculation] ??
          statId.COUNT

        const getColorGroupFn = (cluster) => {
          const calc = getGroupCalculation('groupCalcByColor', cluster)
          return getStatFn[calc]
        }

        const getSizeGroupFn = (cluster) => {
          const calc = getGroupCalculation('groupCalcBySize', cluster)
          return getStatFn[calc]
        }

        // Set the "supercluster" constructor parameters
        const options = {
          minZoom: Math.floor(MIN_ZOOM),
          maxZoom: Math.floor(MAX_ZOOM),
          radius: 50 * Math.sqrt(2),
          deepClone: true,
          map: (d) => {
            const colorProp = getVarByProp('colorBy', d)
            const sizeProp = getVarByProp('sizeBy', d)

            const sizePropObj = sizeProp
              ? { [sizeProp]: { value: [d.values[sizeProp]] } }
              : {}

            const colorPropObj = colorProp
              ? {
                  [colorProp]: {
                    type: d.props[colorProp]?.type,
                    value: [d.values[colorProp]],
                  },
                }
              : {}

            return {
              type: d.type,
              colorDomain: null,
              sizeDomain: null,
              icon: d['icon'],
              grouped_ids: [d.id],
              ...deepMerge(colorPropObj, sizePropObj),
            }
          },
          reduce: (acc, dProps) => {
            const id = dProps.grouped_ids
            const colorProp = getVarByProp('colorBy', dProps)
            const sizeProp = getVarByProp('sizeBy', dProps)
            if (sizeProp && dProps[sizeProp]) {
              const propValue = dProps[sizeProp].value
              acc[sizeProp].value = acc[sizeProp].value.concat(propValue)
            }

            if (colorProp && colorProp !== sizeProp && dProps[colorProp]) {
              const propValue = dProps[colorProp].value
              acc[colorProp].value = acc[colorProp].value.concat(propValue)
            }
            if (id) {
              acc.grouped_ids = acc.grouped_ids.concat(id)
            }
          },
        }
        // create groups
        const groupsMap = {}
        for (let i = 0; i < data.length; i++) {
          const name = data[i].name
          if (!groupsMap[name]) groupsMap[name] = []
          groupsMap[name].push(data[i])
        }
        const groupsRaw = Object.values(groupsMap)
        const groups = {}
        if (data.length > 0) {
          const preparedGroups = groupsRaw.map((dataGroup) => {
            const points = dataGroup.map((d) => ({
              geometry: { coordinates: getPosition(d) },
              properties: d,
            }))
            const sc = new Supercluster(options)
            sc.load(points)
            const nodeType = dataGroup[0].type
            const { groupScaleWithZoom, groupScale } = legendObj[nodeType] || {}
            return { points, sc, groupScaleWithZoom, groupScale }
          })

          // Iterate through every zoom level
          for (let z = options.maxZoom; z >= options.minZoom; z--) {
            const clusters = []
            for (let i = 0; i < preparedGroups.length; i++) {
              const { points, sc, groupScaleWithZoom, groupScale } =
                preparedGroups[i]
              const doNotCluster = !groupScaleWithZoom && groupScale > z
              const groupClustersRaw = doNotCluster
                ? points
                : sc.getClusters([-180, -90, 180, 90], z)
              clusters.push(...groupClustersRaw)
            }

            const ranges = {}

            // find color/size value for each cluster - store min/max by type
            for (let cluster of clusters) {
              // The node type in this cluster
              const clusterType = cluster.properties?.type
              // The props that we use in the legend for colorBy and sizeBy for a specific node type
              const colorProp = getClusterVarByProp('colorBy', cluster)
              const sizeProp = getClusterVarByProp('sizeBy', cluster)
              // The prop type of colorProp to determine if the prop is categorical
              const colorPropType = cluster.properties.cluster
                ? cluster.properties[colorProp]?.type
                : cluster.properties.props?.[colorProp]?.type

              // gets the values and aggregates by groupCalculationFn
              const getDomainValue = (prop, groupCalculationFn) =>
                cluster.properties.cluster
                  ? groupCalculationFn(cluster.properties[prop]?.value)
                  : groupCalculationFn([cluster.properties.values?.[prop]])

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
              const prevSize = ranges[clusterType]?.size
              const prevColor = ranges[clusterType]?.color
              const sizeMin = Number.isFinite(prevSize?.min)
                ? prevSize.min
                : Infinity
              const sizeMax = Number.isFinite(prevSize?.max)
                ? prevSize.max
                : -Infinity
              const colorMin = Number.isFinite(prevColor?.min)
                ? prevColor.min
                : Infinity
              const colorMax = Number.isFinite(prevColor?.max)
                ? prevColor.max
                : -Infinity

              const numColorVal = Number(colorValue)
              const numSizeVal = Number(sizeValue)

              const newColorMin = Number.isFinite(numColorVal)
                ? Math.min(colorMin, numColorVal)
                : colorMin
              const newColorMax = Number.isFinite(numColorVal)
                ? Math.max(colorMax, numColorVal)
                : colorMax
              const newSizeMin = Number.isFinite(numSizeVal)
                ? Math.min(sizeMin, numSizeVal)
                : sizeMin
              const newSizeMax = Number.isFinite(numSizeVal)
                ? Math.max(sizeMax, numSizeVal)
                : sizeMax

              // Update the types min/max with new values
              ranges[clusterType] = {
                color:
                  colorPropType === propId.NUMBER
                    ? {
                        min: newColorMin,
                        max: newColorMax,
                      }
                    : {}, // Empty for a categorical prop
                size: {
                  min: newSizeMin,
                  max: newSizeMax,
                },
              }
            }

            for (const cType of Object.keys(ranges)) {
              const r = ranges[cType]
              if (r.size) {
                if (r.size.min === Infinity) r.size.min = 0
                if (r.size.max === -Infinity) r.size.max = 0
              }
              if (r.color && r.color.min != null) {
                if (r.color.min === Infinity) r.color.min = 0
                if (r.color.max === -Infinity) r.color.max = 0
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
      (mapId) => mapId,
      (mapId) => nodeClustersFunc(mapId)?.[Math.floor(zoomFunc(mapId))] ?? {},
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeRangeAtZoomFunc = createSelector(
  selectNodeClustersAtZoomFunc,
  (nodeClustersFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => nodeClustersFunc(mapId)?.range ?? {},
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeGeoJsonObjectFunc = createSelector(
  [
    selectSplitNodeDataFunc,
    selectNodeRange,
    selectEnabledNodesFunc,
    selectLegendNumberFormatFunc,
  ],
  (nodeDataSplitFunc, nodeRange, legendObjectsFunc, legendNumberFormatFunc) => {
    const nodeDataFunc = (mapId) => nodeDataSplitFunc(mapId)?.false ?? {}
    const geometryFunc = (item) => ({
      type: 'Point',
      coordinates: [item.longitude, item.latitude],
    })
    return constructGeoJson(
      nodeRange,
      nodeDataFunc,
      legendObjectsFunc,
      geometryFunc,
      legendNumberFormatFunc,
      'node'
    )
  }
)
export const selectNodeClusterGeoJsonObjectFunc = createSelector(
  [
    selectNodeClustersAtZoomFunc,
    selectEnabledNodesFunc,
    selectEffectiveNodesBy,
    selectLegendNumberFormatFunc,
  ],
  (
    nodeClustersFunc,
    legendObjectsFunc,
    effectiveNodesBy,
    legendNumberFormatFunc
  ) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => {
        const clusterData = nodeClustersFunc(mapId)
        const groups = clusterData?.data || []
        if (groups.length === 0) return []

        const legendObjects = legendObjectsFunc(mapId) || {}
        const clusterRange = clusterData.range || {}
        const typeMetaCache = {}

        const getTypeMeta = (nodeType) => {
          if (typeMetaCache[nodeType]) return typeMetaCache[nodeType]

          const legendObj = legendObjects[nodeType] || {}
          const effectiveNodes = effectiveNodesBy(nodeType, mapId)[0] || {}
          const { colorBy, sizeBy } = effectiveNodes

          const sizeByProp = effectiveNodes.props?.[sizeBy] || {}
          const sizeFallback = sizeByProp.fallback?.size ?? '0'
          const isSizeCategorical = sizeByProp.type !== propId.NUMBER
          const sizeDomainRaw = clusterRange[nodeType]?.size
          const sizeDomain = {
            min: Number.isFinite(sizeDomainRaw?.min) ? sizeDomainRaw.min : 0,
            max: Number.isFinite(sizeDomainRaw?.max) ? sizeDomainRaw.max : 0,
          }
          const parsedSize = parseGradient(
            'size',
            legendNumberFormatFunc(sizeByProp).precision,
            true
          )({ ...sizeByProp, min: sizeDomain.min, max: sizeDomain.max })

          const colorByProp = effectiveNodes.props?.[colorBy] || {}
          const colorFallback = colorByProp.fallback?.color ?? '#000'
          const isColorCategorical = colorByProp.type !== propId.NUMBER
          const colorDomainRaw = clusterRange[nodeType]?.color
          const colorDomain = {
            min: Number.isFinite(colorDomainRaw?.min) ? colorDomainRaw.min : 0,
            max: Number.isFinite(colorDomainRaw?.max) ? colorDomainRaw.max : 0,
          }
          const parsedColor = parseGradient(
            'color',
            legendNumberFormatFunc(colorByProp).precision
          )({ ...colorByProp, min: colorDomain.min, max: colorDomain.max })

          const meta = {
            legendObj,
            effectiveNodes,
            sizeByProp,
            sizeFallback,
            isSizeCategorical,
            sizeDomain,
            parsedSize,
            colorByProp,
            colorFallback,
            isColorCategorical,
            colorDomain,
            parsedColor,
          }
          typeMetaCache[nodeType] = meta
          return meta
        }

        const results = new Array(groups.length)
        for (let i = 0; i < groups.length; i++) {
          const group = groups[i]
          const nodeType = group.properties.type
          const meta = getTypeMeta(nodeType)

          const sizeObj = group.properties.sizeProp
          const sizeByPropVal = sizeObj?.value
          const rawSize =
            sizeByPropVal == null
              ? meta.sizeFallback
              : meta.isSizeCategorical
                ? (meta.sizeByProp?.options?.[sizeByPropVal]?.size ?? '0')
                : getScaledValue(
                    meta.parsedSize.values,
                    meta.parsedSize.sizes,
                    parseFloat(sizeByPropVal),
                    meta.sizeByProp.gradient?.scale,
                    meta.sizeByProp.gradient?.scaleParams,
                    meta.sizeFallback
                  )

          const colorObj = group.properties.colorProp
          const colorByPropVal =
            colorObj?.value == null ? '' : String(colorObj.value)
          const rawColor =
            colorByPropVal === ''
              ? meta.colorFallback
              : meta.isColorCategorical
                ? (meta.colorByProp?.options?.[colorByPropVal]?.color ??
                  getChartItemColor(colorByPropVal))
                : getScaledValue(
                    meta.parsedColor.values,
                    meta.parsedColor.colors,
                    parseFloat(colorByPropVal),
                    meta.colorByProp.gradient?.scale,
                    meta.colorByProp.gradient?.scaleParams,
                    meta.colorFallback
                  )

          const id =
            group.properties?.id ??
            JSON.stringify((group.properties?.grouped_ids || []).slice(0, 2))

          results[i] = {
            type: 'Feature',
            properties: {
              cave_obj: group,
              cave_isCluster: true,
              cave_name: JSON.stringify([nodeType, id]),
              color: getColorString(rawColor),
              size: parseFloat(rawSize) / ICON_RESOLUTION,
              icon: meta.legendObj.icon,
            },
            geometry: {
              type: 'Point',
              coordinates: group.geometry.coordinates,
            },
          }
        }
        return results
      },
      MAX_MEMOIZED_CHARTS
    )
)

export const selectNodeLayerGeoJsonFunc = createSelector(
  [selectNodeGeoJsonObjectFunc, selectNodeClusterGeoJsonObjectFunc],
  (nodesFunc, clustersFunc) =>
    maxSizedMemoization(
      (mapId) => mapId,
      (mapId) => nodesFunc(mapId).concat(clustersFunc(mapId)),
      MAX_MEMOIZED_CHARTS
    )
)

const flattenArcData = (data) => {
  const result = []
  if (data) {
    for (const group of Object.values(data)) {
      if (Array.isArray(group)) {
        for (let i = 0; i < group.length; i++) {
          result.push(group[i])
        }
      }
    }
  }
  return result
}

export const selectArcLayerGeoJsonFunc = createSelector(
  [
    selectArcRange,
    selectLineDataFunc,
    selectEnabledArcsFunc,
    selectLegendNumberFormatFunc,
  ],
  (arcRange, arcDataFunc, legendObjectsFunc, legendNumberFormatFunc) => {
    const geometryFunc = (item) => ({
      type: 'LineString',
      coordinates: adjustArcPath(item.path),
    })
    const modifiedArcDataFunc = (mapId) => flattenArcData(arcDataFunc(mapId))
    return constructGeoJson(
      arcRange,
      modifiedArcDataFunc,
      legendObjectsFunc,
      geometryFunc,
      legendNumberFormatFunc,
      'arc'
    )
  }
)

export const selectArcLayer3DGeoJsonFunc = createSelector(
  [
    selectArcRange,
    selectArcDataFunc,
    selectEnabledArcsFunc,
    selectLegendNumberFormatFunc,
  ],
  (arcRange, arcDataFunc, legendObjectsFunc, legendNumberFormatFunc) => {
    const geometryFunc = (item) => ({
      type: 'LineString',
      coordinates: adjustArcPath(item.path),
    })
    const modifiedArcDataFunc = (mapId) => flattenArcData(arcDataFunc(mapId))
    return constructGeoJson(
      arcRange,
      modifiedArcDataFunc,
      legendObjectsFunc,
      geometryFunc,
      legendNumberFormatFunc,
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
    selectLegendNumberFormatFunc,
  ],
  (
    lineMatchingKeysByTypeFunc,
    arcRange,
    enabledArcsFunc,
    arcTypes,
    legendNumberFormatFunc
  ) =>
    constructFetchedGeoJson(
      lineMatchingKeysByTypeFunc,
      arcRange,
      enabledArcsFunc,
      legendNumberFormatFunc,
      arcTypes,
      'arc'
    )
)

export const selectIncludedGeoJsonFunc = createSelector(
  [
    selectIncludedGeoDataFunc,
    selectGeoRange,
    selectEnabledGeosFunc,
    selectLegendNumberFormatFunc,
  ],
  (
    includedGeoDataFunc,
    geoRange,
    legendObjectsFunc,
    legendNumberFormatFunc
  ) => {
    const geometryFunc = (item) => {
      const path = item.path || []
      const isNested =
        Array.isArray(path[0]) &&
        Array.isArray(path[0][0]) &&
        typeof path[0][0][0] === 'number'
      return {
        type: 'Polygon',
        coordinates: isNested ? path : [path],
      }
    }
    const modifiedIncludedGeoDataFunc = (mapId) =>
      flattenArcData(includedGeoDataFunc(mapId))
    return constructGeoJson(
      geoRange,
      modifiedIncludedGeoDataFunc,
      legendObjectsFunc,
      geometryFunc,
      legendNumberFormatFunc,
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
    selectLegendNumberFormatFunc,
  ],
  (
    geoRange,
    enabledGeosFunc,
    geoTypes,
    matchingKeysByTypeFunc,
    legendNumberFormatFunc
  ) =>
    constructFetchedGeoJson(
      matchingKeysByTypeFunc,
      geoRange,
      enabledGeosFunc,
      legendNumberFormatFunc,
      geoTypes,
      'geo'
    )
)

export const selectGeoTypeKeys = createSelector(
  selectLocalizedGeoTypes,
  (data) => Object.keys(data || {}),
  {
    memoize: lruMemoize,
    memoizeOptions: {
      resultEqualityCheck: deepEqual,
    },
  }
)
