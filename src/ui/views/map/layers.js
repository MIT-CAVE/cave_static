import PropTypes from 'prop-types'
import * as R from 'ramda'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  memo,
  useRef,
} from 'react'
import { useSelector } from 'react-redux'

import {
  ArcLayer3D,
  NodesWithHeight,
  GeosWithHeight,
  ArcsWithHeight,
} from './CustomLayers'
import { MapContext } from './useMapApi'

import {
  selectIncludedGeoJsonFunc,
  selectFetchedGeoJsonFunc,
  selectFetchedArcGeoJsonFunc,
  selectFeatureData,
  selectCurrentTimeContinuous,
  selectNodeTypeKeys,
  selectArcTypeKeys,
  selectGeoTypeKeys,
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectArcLayer3DGeoJsonFunc,
  selectLegendDataFunc,
} from '../../../data/selectors'
import { LINE_TYPES } from '../../../utils/constants'
import { useMutateStateWithSync } from '../../../utils/hooks'

const DARKEN_FILL_ON_HOVER = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  [
    'let',
    'rgbaArray',
    ['to-rgba', ['get', 'color']],
    [
      'rgba',
      ['*', ['at', 0, ['var', 'rgbaArray']], 0.6],
      ['*', ['at', 1, ['var', 'rgbaArray']], 0.6],
      ['*', ['at', 2, ['var', 'rgbaArray']], 0.6],
      ['at', 3, ['var', 'rgbaArray']],
    ],
  ],
  ['get', 'color'],
]

const getTypeFromFeature = (f) => {
  if (!f || !f.properties) return null
  if (f.properties._parsedType !== undefined) return f.properties._parsedType
  if (f.properties.type) {
    f.properties._parsedType = f.properties.type
    return f.properties.type
  }
  const caveName = f.properties.cave_name
  if (!caveName) return null
  try {
    const parsed = JSON.parse(caveName)[0]
    f.properties._parsedType = parsed
    return parsed
  } catch (e) {
    return null
  }
}

const areFeaturesEqual = (data1, data2) => {
  if (data1 === data2) return true
  if (!data1 || !data2) return false
  const feats1 = data1.features || data1
  const feats2 = data2.features || data2
  if (feats1 === feats2) return true
  if (!Array.isArray(feats1) || !Array.isArray(feats2)) return false
  if (feats1.length !== feats2.length) return false
  if (feats1.length === 0 && feats2.length === 0) return true
  return R.equals(feats1, feats2)
}

const useTypeFilteredFeatures = (features, type) => {
  const prevResultRef = useRef([])
  const prevSourceRef = useRef(null)
  const prevTypeRef = useRef(type)

  return useMemo(() => {
    if (
      prevTypeRef.current === type &&
      prevSourceRef.current === features &&
      prevResultRef.current
    ) {
      return prevResultRef.current
    }
    prevTypeRef.current = type
    prevSourceRef.current = features

    const safeFeatures = Array.isArray(features) ? features : []
    const filtered = safeFeatures.filter((f) => getTypeFromFeature(f) === type)
    if (R.equals(prevResultRef.current, filtered)) {
      return prevResultRef.current
    }
    prevResultRef.current = filtered
    return filtered
  }, [features, type])
}

const useTypeFilteredGeoJson = (selectGeoJsonFunc, mapId, type) => {
  const allGeoJson = useSelector((state) => selectGeoJsonFunc(state)(mapId))
  const prevResultRef = useRef([])
  const prevSourceRef = useRef(null)
  const prevMapIdRef = useRef(mapId)
  const prevTypeRef = useRef(type)

  return useMemo(() => {
    if (
      prevMapIdRef.current === mapId &&
      prevTypeRef.current === type &&
      prevSourceRef.current === allGeoJson &&
      prevResultRef.current
    ) {
      return prevResultRef.current
    }
    prevMapIdRef.current = mapId
    prevTypeRef.current = type
    prevSourceRef.current = allGeoJson

    const safeFeatures = Array.isArray(allGeoJson) ? allGeoJson : []
    const filtered = safeFeatures.filter((f) => getTypeFromFeature(f) === type)
    if (R.equals(prevResultRef.current, filtered)) {
      return prevResultRef.current
    }
    prevResultRef.current = filtered
    return filtered
  }, [allGeoJson, mapId, type])
}

const useMapFeature = () => {
  const { mapId } = useContext(MapContext)
  const isGlobe = true

  const handleClick = useMutateStateWithSync(
    (feature, { cave_name: caveName, cave_obj: caveObj } = {}) => ({
      path: ['panes', 'paneState', 'center'],
      value: {
        open: {
          ...(caveObj || {}),
          key: caveName,
          mapId,
          feature,
          type: caveObj?.name ?? (caveName ? JSON.parse(caveName) : undefined),
        },
        type: 'feature',
      },
    }),
    [mapId]
  )

  const createHandleClick = useCallback(
    (feature) => (params) => handleClick(feature, params),
    [handleClick]
  )

  const arcProps = useMemo(
    () => ({
      type: 'line',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
        visibility: isGlobe ? 'visible' : 'none',
      },
      paint: {
        'line-color': DARKEN_FILL_ON_HOVER,
        'line-opacity': 0.8,
        'line-width': ['get', 'size'],
        'line-dasharray': [
          'case',
          ['==', ['get', 'dash'], 'dashed'],
          ['literal', LINE_TYPES.dashed],
          ['==', ['get', 'dash'], 'dotted'],
          ['literal', LINE_TYPES.dotted],
          ['literal', LINE_TYPES.solid],
        ],
      },
    }),
    [isGlobe]
  )

  return {
    arcProps,
    mapId,
    createHandleClick,
  }
}

const MapboxLayer = memo(
  ({ id, type, data, layout = {}, paint = {}, beforeId }) => {
    const { mapRef, mapLoaded } = useContext(MapContext)

    const dataRef = useRef(data)
    const layoutRef = useRef(layout)
    const paintRef = useRef(paint)
    const beforeIdRef = useRef(beforeId)

    const prevDataRef = useRef(null)
    const prevLayoutRef = useRef({})
    const prevPaintRef = useRef({})

    useEffect(() => {
      beforeIdRef.current = beforeId
    }, [beforeId])

    useEffect(() => {
      prevDataRef.current = null
      prevLayoutRef.current = {}
      prevPaintRef.current = {}
    }, [id])

    // Cleanup layer and source from Mapbox map instance on unmount
    useEffect(() => {
      const currentMapRef = mapRef.current
      return () => {
        const map = currentMapRef?.getMap
          ? currentMapRef.getMap()
          : currentMapRef
        if (!map || map._removed) return
        try {
          if (map.getStyle && map.getStyle()) {
            if (map.getLayer(id)) map.removeLayer(id)
            if (map.getSource(id)) map.removeSource(id)
          }
        } catch (e) {
          // Ignore
        }
      }
    }, [id, mapRef])

    useEffect(() => {
      const map = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current
      if (!map) return

      const addLayer = () => {
        try {
          if (!map.getStyle || !map.getStyle()) return
          if (!map.getSource(id)) {
            map.addSource(id, {
              type: 'geojson',
              data: dataRef.current,
              generateId: true,
            })
            prevDataRef.current = dataRef.current
          }
          if (!map.getLayer(id)) {
            const currentBeforeId = beforeIdRef.current
            const safeBeforeId =
              currentBeforeId && map.getLayer(currentBeforeId)
                ? currentBeforeId
                : undefined
            map.addLayer(
              {
                id,
                type,
                source: id,
                layout: layoutRef.current,
                paint: paintRef.current,
              },
              safeBeforeId
            )
            const styleLayer = map.style?._layers?.[id]
            if (styleLayer && typeof styleLayer.recalculate === 'function') {
              try {
                styleLayer.recalculate({
                  zoom: map.getZoom ? map.getZoom() : 0,
                })
              } catch (e) {
                // Ignore
              }
            }
            prevLayoutRef.current = layoutRef.current
            prevPaintRef.current = paintRef.current
          }
        } catch (e) {
          // Ignore
        }
      }

      addLayer()

      const handleStyleData = () => {
        addLayer()
      }

      map.on('styledata', handleStyleData)
      map.on('load', handleStyleData)
      map.on('style.load', handleStyleData)

      return () => {
        map.off('styledata', handleStyleData)
        map.off('load', handleStyleData)
        map.off('style.load', handleStyleData)
      }
    }, [id, type, mapRef, mapLoaded])

    useEffect(() => {
      layoutRef.current = layout
      paintRef.current = paint
      dataRef.current = data

      const map = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current
      if (!map) return

      try {
        if (map.getLayer(id)) {
          const prevLayout = prevLayoutRef.current || {}
          Object.keys(layout || {}).forEach((key) => {
            if (!R.equals(prevLayout[key], layout[key])) {
              map.setLayoutProperty(id, key, layout[key])
            }
          })
          prevLayoutRef.current = layout

          const prevPaint = prevPaintRef.current || {}
          Object.keys(paint || {}).forEach((key) => {
            if (!R.equals(prevPaint[key], paint[key])) {
              map.setPaintProperty(id, key, paint[key])
            }
          })
          prevPaintRef.current = paint

          const source = map.getSource(id)
          if (source && typeof source.setData === 'function') {
            if (!areFeaturesEqual(prevDataRef.current, data)) {
              source.setData(data)
              prevDataRef.current = data
            }
          }
        } else if (map.getStyle && map.getStyle()) {
          if (!map.getSource(id)) {
            map.addSource(id, {
              type: 'geojson',
              data,
              generateId: true,
            })
            prevDataRef.current = data
          } else {
            const source = map.getSource(id)
            if (
              source &&
              typeof source.setData === 'function' &&
              !areFeaturesEqual(prevDataRef.current, data)
            ) {
              source.setData(data)
              prevDataRef.current = data
            }
          }
          if (!map.getLayer(id)) {
            const safeBeforeId =
              beforeIdRef.current && map.getLayer(beforeIdRef.current)
                ? beforeIdRef.current
                : undefined
            map.addLayer(
              {
                id,
                type,
                source: id,
                layout: layoutRef.current,
                paint: paintRef.current,
              },
              safeBeforeId
            )
            const styleLayer = map.style?._layers?.[id]
            if (styleLayer && typeof styleLayer.recalculate === 'function') {
              try {
                styleLayer.recalculate({
                  zoom: map.getZoom ? map.getZoom() : 0,
                })
              } catch (e) {
                // Ignore
              }
            }
            prevLayoutRef.current = layoutRef.current
            prevPaintRef.current = paintRef.current
          }
        }
      } catch (e) {
        // Ignore
      }
    }, [id, type, data, layout, paint, mapRef, mapLoaded])

    return null
  }
)
MapboxLayer.displayName = 'MapboxLayer'

MapboxLayer.propTypes = {
  id: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  layout: PropTypes.object,
  paint: PropTypes.object,
  beforeId: PropTypes.string,
}

const NodeIconLayerInstance = memo(({ type, mapId, beforeId }) => {
  const nodeGeoJson = useTypeFilteredGeoJson(
    selectNodeLayerGeoJsonFunc,
    mapId,
    type
  )
  const typeFeatureData = useSelector(
    (state) => selectFeatureData(state)[type] || {},
    R.equals
  )
  const currentTimeInSeconds = useSelector(selectCurrentTimeContinuous)
  const isGlobe = true

  const [animatedNodeGeoJson, setAnimatedNodeGeoJson] = useState(nodeGeoJson)

  const latitudes = useMemo(
    () => R.pathOr([], ['data', 'location', 'latitude'])(typeFeatureData),
    [typeFeatureData]
  )
  const longitudes = useMemo(
    () => R.pathOr([], ['data', 'location', 'longitude'])(typeFeatureData),
    [typeFeatureData]
  )
  const animationTimes = useMemo(() => {
    const latitude = R.pathOr(
      [],
      ['data', 'location', 'latitude']
    )(typeFeatureData)
    const animationTime = R.path(
      ['data', 'location', 'animationTime'],
      typeFeatureData
    )
    return animationTime ?? R.repeat([null], latitude.length)
  }, [typeFeatureData])

  const visibilityInfo = useMemo(() => {
    const visibilities = {}
    const visibilityTimes = {}
    const visibilityIndices = R.pipe(
      R.pathOr([], ['data', 'location', 'visibilityIndex']),
      R.flatten
    )(typeFeatureData)
    const numMapFeatureNodes = R.pathOr(
      [],
      ['data', 'location', 'latitude']
    )(typeFeatureData).length
    const visibilityTime = R.pathOr(
      [],
      ['data', 'location', 'visibilityTime']
    )(typeFeatureData)
    for (let i = 0; i < numMapFeatureNodes; i++) {
      if (i in visibilityIndices) {
        visibilities[visibilityIndices[i]] = true
        visibilityTimes[visibilityIndices[i]] = visibilityTime[i]
      }
    }
    return { visibilities, visibilityTimes }
  }, [typeFeatureData])

  const definedNodeTimes = useMemo(
    () =>
      R.fromPairs(R.addIndex(R.map)((val, idx) => [idx, val])(animationTimes)),
    [animationTimes]
  )

  const lerp = (start, end, t) => {
    return start + t * (end - start)
  }

  const moveCoordinates = useCallback(
    (f) => {
      if (f.properties?.cave_isCluster) {
        return f.geometry?.coordinates
      }
      let idx = parseInt(f.properties?.cave_obj?.id)
      if (isNaN(idx)) {
        try {
          idx = parseInt(JSON.parse(f.properties?.cave_name)?.[1])
        } catch (e) {
          idx = NaN
        }
      }
      if (isNaN(idx) || idx >= latitudes.length || idx < 0) {
        return f.geometry?.coordinates
      }

      if (
        !definedNodeTimes[idx] ||
        R.equals([null], definedNodeTimes[idx]) ||
        definedNodeTimes[idx].length === 0
      ) {
        return f.geometry?.coordinates
      }
      const definedNodeTime = definedNodeTimes[idx]
      let visible = true

      if (
        idx in visibilityInfo.visibilities &&
        Array.isArray(visibilityInfo.visibilityTimes[idx])
      ) {
        for (const time of visibilityInfo.visibilityTimes[idx]) {
          if (currentTimeInSeconds > time) {
            visible = !visible
          } else {
            break
          }
        }
      }

      const getLat = (i) =>
        Array.isArray(latitudes[idx]) ? latitudes[idx][i] : latitudes[idx]
      const getLng = (i) =>
        Array.isArray(longitudes[idx]) ? longitudes[idx][i] : longitudes[idx]

      const maxTime = Math.max(...definedNodeTime)
      if (currentTimeInSeconds >= maxTime) {
        if (
          visible &&
          latitudes[idx] !== undefined &&
          longitudes[idx] !== undefined
        ) {
          const lastIdx = Array.isArray(latitudes[idx])
            ? latitudes[idx].length - 1
            : 0
          return [getLng(lastIdx), getLat(lastIdx)]
        } else {
          return null
        }
      }

      if (!visible) {
        return null
      }
      const lowerControlTime = R.last(
        R.filter((t) => t <= currentTimeInSeconds, definedNodeTime)
      )
      const upperControlTime = R.head(
        R.filter((t) => t > currentTimeInSeconds, definedNodeTime)
      )
      if (
        lowerControlTime === undefined ||
        upperControlTime === undefined ||
        lowerControlTime === upperControlTime
      ) {
        const targetTime = lowerControlTime ?? upperControlTime
        const targetIndex = R.indexOf(targetTime, definedNodeTime)
        if (
          targetIndex >= 0 &&
          longitudes[idx] !== undefined &&
          latitudes[idx] !== undefined
        ) {
          return [getLng(targetIndex), getLat(targetIndex)]
        }
        return f.geometry?.coordinates
      }
      const t =
        (currentTimeInSeconds - lowerControlTime) /
        (upperControlTime - lowerControlTime)
      const lowerIdx = R.indexOf(lowerControlTime, definedNodeTime)
      const upperIdx = R.indexOf(upperControlTime, definedNodeTime)
      if (
        lowerIdx < 0 ||
        upperIdx < 0 ||
        longitudes[idx] === undefined ||
        latitudes[idx] === undefined
      ) {
        return f.geometry?.coordinates
      }
      return [
        lerp(getLng(lowerIdx), getLng(upperIdx), t),
        lerp(getLat(lowerIdx), getLat(upperIdx), t),
      ]
    },
    [
      definedNodeTimes,
      currentTimeInSeconds,
      visibilityInfo.visibilities,
      visibilityInfo.visibilityTimes,
      longitudes,
      latitudes,
    ]
  )

  const hasAnimation = useMemo(() => {
    return Object.values(definedNodeTimes).some(
      (times) =>
        Array.isArray(times) &&
        times.length > 0 &&
        !R.equals([null], times) &&
        times.some((t) => t !== null && t !== undefined)
    )
  }, [definedNodeTimes])

  useEffect(() => {
    if (!hasAnimation) return
    const requestId = window.requestAnimationFrame(() => {
      const updated = []
      const safeGeoJson = Array.isArray(nodeGeoJson) ? nodeGeoJson : []
      for (const f of safeGeoJson) {
        const coords = moveCoordinates(f)
        if (
          coords &&
          Array.isArray(coords) &&
          coords.length === 2 &&
          isFinite(coords[0]) &&
          isFinite(coords[1])
        ) {
          updated.push(R.assocPath(['geometry', 'coordinates'], coords, f))
        }
      }
      setAnimatedNodeGeoJson(updated)
    })
    return () => window.cancelAnimationFrame(requestId)
  }, [hasAnimation, currentTimeInSeconds, nodeGeoJson, moveCoordinates])

  const data = useMemo(() => {
    const rawFeatures = hasAnimation ? animatedNodeGeoJson : nodeGeoJson
    const safeFeatures = Array.isArray(rawFeatures) ? rawFeatures : []
    return {
      type: 'FeatureCollection',
      features: safeFeatures,
    }
  }, [hasAnimation, animatedNodeGeoJson, nodeGeoJson])

  const layout = useMemo(
    () => ({
      'icon-image': ['get', 'icon'],
      'icon-size': ['get', 'size'],
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      visibility: isGlobe ? 'visible' : 'none',
    }),
    [isGlobe]
  )

  const paint = useMemo(
    () => ({
      'icon-color': DARKEN_FILL_ON_HOVER,
    }),
    []
  )

  return (
    <MapboxLayer
      id={`nodeIconLayer-${mapId}-${type}`}
      type="symbol"
      data={data}
      layout={layout}
      paint={paint}
      beforeId={beforeId}
    />
  )
})
NodeIconLayerInstance.displayName = 'NodeIconLayerInstance'

NodeIconLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  beforeId: PropTypes.string,
}

const ArcLayerInstance = memo(({ type, mapId, beforeId }) => {
  const arcLayerGeoJson = useTypeFilteredGeoJson(
    selectArcLayerGeoJsonFunc,
    mapId,
    type
  )
  const { arcProps } = useMapFeature()

  const data = useMemo(() => {
    const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
      ? arcLayerGeoJson
      : []
    return {
      type: 'FeatureCollection',
      features: safeArcLayerGeoJson,
    }
  }, [arcLayerGeoJson])

  return (
    <MapboxLayer
      id={`arcLayerSolid-${mapId}-${type}`}
      type="line"
      data={data}
      layout={arcProps.layout}
      paint={arcProps.paint}
      beforeId={beforeId}
    />
  )
})
ArcLayerInstance.displayName = 'ArcLayerInstance'

ArcLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  beforeId: PropTypes.string,
}

const MultiArcLayerInstance = memo(
  ({ type, mapId, allFetchedArcs, beforeId }) => {
    const { arcProps } = useMapFeature()

    const filteredFeatures = useTypeFilteredFeatures(allFetchedArcs, type)

    const data = useMemo(
      () => ({
        type: 'FeatureCollection',
        features: filteredFeatures,
      }),
      [filteredFeatures]
    )

    return (
      <MapboxLayer
        id={`multiArcLayerSolid-${mapId}-${type}`}
        type="line"
        data={data}
        layout={arcProps.layout}
        paint={arcProps.paint}
        beforeId={beforeId}
      />
    )
  }
)
MultiArcLayerInstance.displayName = 'MultiArcLayerInstance'

MultiArcLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  allFetchedArcs: PropTypes.array.isRequired,
  beforeId: PropTypes.string,
}

const GeographyLayerInstance = memo(
  ({ type, mapId, allFetchedGeos, beforeId }) => {
    const isGlobe = true

    const filteredFeatures = useTypeFilteredFeatures(allFetchedGeos, type)

    const data = useMemo(
      () => ({
        type: 'FeatureCollection',
        features: filteredFeatures,
      }),
      [filteredFeatures]
    )

    const layout = useMemo(
      () => ({
        visibility: isGlobe ? 'visible' : 'none',
      }),
      [isGlobe]
    )

    const paint = useMemo(
      () => ({
        'fill-color': DARKEN_FILL_ON_HOVER,
        'fill-opacity': 0.4,
      }),
      []
    )

    return (
      <MapboxLayer
        id={`geographyLayer-${mapId}-${type}`}
        type="fill"
        data={data}
        layout={layout}
        paint={paint}
        beforeId={beforeId}
      />
    )
  }
)
GeographyLayerInstance.displayName = 'GeographyLayerInstance'

GeographyLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  allFetchedGeos: PropTypes.array.isRequired,
  beforeId: PropTypes.string,
}

const IncludedGeographyLayerInstance = memo(({ type, mapId, beforeId }) => {
  const filteredFeatures = useTypeFilteredGeoJson(
    selectIncludedGeoJsonFunc,
    mapId,
    type
  )

  const data = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: filteredFeatures,
    }),
    [filteredFeatures]
  )

  const paint = useMemo(
    () => ({
      'fill-color': DARKEN_FILL_ON_HOVER,
      'fill-opacity': 0.4,
    }),
    []
  )

  return (
    <MapboxLayer
      id={`includedGeographyLayer-${mapId}-${type}`}
      type="fill"
      data={data}
      paint={paint}
      beforeId={beforeId}
    />
  )
})
IncludedGeographyLayerInstance.displayName = 'IncludedGeographyLayerInstance'

IncludedGeographyLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  beforeId: PropTypes.string,
}

export const MapLayers = () => {
  const { mapId } = useContext(MapContext)

  const [loadedGeoJson, setLoadedGeoJson] = useState([])
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState([])

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const geoTypes = useSelector(selectGeoTypeKeys)
  const legendData = useSelector((state) => selectLegendDataFunc(state)(mapId))

  useEffect(() => {
    geoJsonObjectFunc(mapId).then(setLoadedGeoJson)
  }, [geoJsonObjectFunc, mapId])

  useEffect(() => {
    lineObjFunc(mapId).then(setLineGeoJsonObject)
  }, [lineObjFunc, mapId])

  const orderedLayerIds = useMemo(() => {
    const getZIndex = (type, category) => {
      let zIndexVal = null
      for (const group of Object.values(legendData || {})) {
        if (group?.data?.[type] && group.data[type].zIndex !== undefined) {
          zIndexVal = group.data[type].zIndex
          break
        }
      }
      if (zIndexVal !== null && zIndexVal !== undefined) {
        return Number(zIndexVal)
      }
      // Defaults: geos = -2, arcs = -1, nodes = 0
      if (category === 'geo') return -2
      if (category === 'arc') return -1
      return 0
    }

    const layers = []

    // 1. Add all geo layers
    geoTypes.forEach((type, index) => {
      layers.push({
        id: `geographyLayer-${mapId}-${type}`,
        type,
        category: 'geo',
        subOrder: 0,
        typeIndex: index,
      })
      layers.push({
        id: `includedGeographyLayer-${mapId}-${type}`,
        type,
        category: 'geo',
        subOrder: 1,
        typeIndex: index,
      })
    })

    // 2. Add all arc layers
    arcTypes.forEach((type, index) => {
      layers.push({
        id: `multiArcLayerSolid-${mapId}-${type}`,
        type,
        category: 'arc',
        subOrder: 0,
        typeIndex: index,
      })
      layers.push({
        id: `arcLayerSolid-${mapId}-${type}`,
        type,
        category: 'arc',
        subOrder: 1,
        typeIndex: index,
      })
    })

    // 3. Add all node layers
    nodeTypes.forEach((type, index) => {
      layers.push({
        id: `nodeIconLayer-${mapId}-${type}`,
        type,
        category: 'node',
        subOrder: 0,
        typeIndex: index,
      })
    })

    const categoryOrder = { geo: 0, arc: 1, node: 2 }

    layers.sort((a, b) => {
      const zA = getZIndex(a.type, a.category)
      const zB = getZIndex(b.type, b.category)

      // 1. Primary: zIndex ascending
      if (zA !== zB) {
        return zA - zB
      }

      // 2. Secondary: category order (geo < arc < node)
      const catA = categoryOrder[a.category]
      const catB = categoryOrder[b.category]
      if (catA !== catB) {
        return catA - catB
      }

      // 3. Tertiary: subOrder ascending (fetched (0) < included (1))
      if (a.subOrder !== b.subOrder) {
        return a.subOrder - b.subOrder
      }

      // 4. Quaternary: typeIndex ascending (stable relative order of types)
      return a.typeIndex - b.typeIndex
    })

    return layers.map((layer) => layer.id)
  }, [geoTypes, arcTypes, nodeTypes, legendData, mapId])

  const beforeIdMap = useMemo(() => {
    const mapping = {}
    for (let i = 0; i < orderedLayerIds.length; i++) {
      mapping[orderedLayerIds[i]] = orderedLayerIds[i + 1]
    }
    return mapping
  }, [orderedLayerIds])

  const safeLoadedGeoJson = Array.isArray(loadedGeoJson) ? loadedGeoJson : []
  const safeLineGeoJsonObject = Array.isArray(lineGeoJsonObject)
    ? lineGeoJsonObject
    : []

  return (
    <>
      {geoTypes.map((type) => (
        <GeographyLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          allFetchedGeos={safeLoadedGeoJson}
          beforeId={beforeIdMap[`geographyLayer-${mapId}-${type}`]}
        />
      ))}
      {geoTypes.map((type) => (
        <IncludedGeographyLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`includedGeographyLayer-${mapId}-${type}`]}
        />
      ))}
      {arcTypes.map((type) => (
        <MultiArcLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          allFetchedArcs={safeLineGeoJsonObject}
          beforeId={beforeIdMap[`multiArcLayerSolid-${mapId}-${type}`]}
        />
      ))}
      {arcTypes.map((type) => (
        <ArcLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`arcLayerSolid-${mapId}-${type}`]}
        />
      ))}
      {nodeTypes.map((type) => (
        <NodeIconLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`nodeIconLayer-${mapId}-${type}`]}
        />
      ))}
    </>
  )
}

const Geo3DLayerInstance = memo(({ type, mapId, geos, onClick }) => {
  const filteredGeos = useTypeFilteredFeatures(geos, type)

  return (
    <GeosWithHeight
      id={`geos-with-altitude-${mapId}-${type}`}
      geos={filteredGeos}
      onClick={onClick}
    />
  )
})
Geo3DLayerInstance.displayName = 'Geo3DLayerInstance'

Geo3DLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  geos: PropTypes.array.isRequired,
  onClick: PropTypes.func,
}

const Arc3DLineLayerInstance = memo(({ type, mapId, arcs, onClick }) => {
  const filteredArcs = useTypeFilteredFeatures(arcs, type)

  return (
    <ArcsWithHeight
      id={`geos-arcs-with-altitude-${mapId}-${type}`}
      arcs={filteredArcs}
      onClick={onClick}
    />
  )
})
Arc3DLineLayerInstance.displayName = 'Arc3DLineLayerInstance'

Arc3DLineLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  arcs: PropTypes.array.isRequired,
  onClick: PropTypes.func,
}

export const Geos = () => {
  const [loadedGeoJson, setLoadedGeoJson] = useState([])
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState([])

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

  const { mapId, createHandleClick } = useMapFeature()
  const geoTypes = useSelector(selectGeoTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)

  const isGlobe = true

  useEffect(() => {
    geoJsonObjectFunc(mapId).then(setLoadedGeoJson)
  }, [geoJsonObjectFunc, mapId])

  useEffect(() => {
    lineObjFunc(mapId).then(setLineGeoJsonObject)
  }, [lineObjFunc, mapId])

  const safeLoadedGeoJson = Array.isArray(loadedGeoJson) ? loadedGeoJson : []
  const safeLineGeoJsonObject = Array.isArray(lineGeoJsonObject)
    ? lineGeoJsonObject
    : []

  return [
    ...geoTypes.map((type) => (
      <Geo3DLayerInstance
        key={type}
        type={type}
        mapId={mapId}
        geos={!isGlobe ? safeLoadedGeoJson : []}
        onClick={createHandleClick('geos')}
      />
    )),
    ...arcTypes.map((type) => (
      <Arc3DLineLayerInstance
        key={type}
        type={type}
        mapId={mapId}
        arcs={!isGlobe ? safeLineGeoJsonObject : []}
        onClick={createHandleClick('arcs')}
      />
    )),
  ]
}

export const IncludedGeos = () => {
  return null
}

const Node3DLayerInstance = memo(({ type, mapId, onClick }) => {
  const nodeGeoJson = useTypeFilteredGeoJson(
    selectNodeLayerGeoJsonFunc,
    mapId,
    type
  )
  const isGlobe = true

  const safeNodeGeoJson = Array.isArray(nodeGeoJson) ? nodeGeoJson : []

  return (
    <NodesWithHeight
      id={`nodes-with-altitude-${mapId}-${type}`}
      nodes={!isGlobe ? safeNodeGeoJson : []}
      onClick={onClick}
    />
  )
})
Node3DLayerInstance.displayName = 'Node3DLayerInstance'

Node3DLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
}

export const Nodes = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const nodeTypes = useSelector(selectNodeTypeKeys)

  return nodeTypes.map((type) => (
    <Node3DLayerInstance
      key={type}
      type={type}
      mapId={mapId}
      onClick={createHandleClick('nodes')}
    />
  ))
}

const Arc3DLayerInstance = memo(({ type, mapId, onClick }) => {
  const arcLayerGeoJson = useTypeFilteredGeoJson(
    selectArcLayerGeoJsonFunc,
    mapId,
    type
  )
  const isGlobe = true

  const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
    ? arcLayerGeoJson
    : []

  return (
    <ArcsWithHeight
      id={`arcs-with-altitude-${mapId}-${type}`}
      arcs={!isGlobe ? safeArcLayerGeoJson : []}
      onClick={onClick}
    />
  )
})
Arc3DLayerInstance.displayName = 'Arc3DLayerInstance'

Arc3DLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
}

export const Arcs = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcTypes = useSelector(selectArcTypeKeys)

  return arcTypes.map((type) => (
    <Arc3DLayerInstance
      key={type}
      type={type}
      mapId={mapId}
      onClick={createHandleClick('arcs')}
    />
  ))
}

const Arc3DModelLayerInstance = memo(({ type, mapId, onClick }) => {
  const arcLayerGeoJson = useTypeFilteredGeoJson(
    selectArcLayer3DGeoJsonFunc,
    mapId,
    type
  )

  const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
    ? arcLayerGeoJson
    : []

  return (
    <ArcLayer3D
      id={`3d-model-${mapId}-${type}`}
      features={safeArcLayerGeoJson}
      onClick={onClick}
    />
  )
})
Arc3DModelLayerInstance.displayName = 'Arc3DModelLayerInstance'

Arc3DModelLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  mapId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
}

export const Arcs3D = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcTypes = useSelector(selectArcTypeKeys)

  return arcTypes.map((type) => (
    <Arc3DModelLayerInstance
      key={type}
      type={type}
      mapId={mapId}
      onClick={createHandleClick('arcs')}
    />
  ))
}
