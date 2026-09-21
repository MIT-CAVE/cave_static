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

const useTypeFilteredFeatures = (features, type) => {
  return useMemo(() => {
    const safeFeatures = Array.isArray(features) ? features : []
    return safeFeatures.filter((f) => getTypeFromFeature(f) === type)
  }, [features, type])
}

const useTypeFilteredGeoJson = (selectGeoJsonFunc, mapId, type) => {
  const allGeoJson = useSelector((state) => selectGeoJsonFunc(state)(mapId))
  return useMemo(() => {
    const safeFeatures = Array.isArray(allGeoJson) ? allGeoJson : []
    return safeFeatures.filter((f) => getTypeFromFeature(f) === type)
  }, [allGeoJson, type])
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
    const { mapRef } = useContext(MapContext)

    const dataRef = useRef(data)
    const layoutRef = useRef(layout)
    const paintRef = useRef(paint)

    useEffect(() => {
      dataRef.current = data
      layoutRef.current = layout
      paintRef.current = paint
    }, [data, layout, paint])

    useEffect(() => {
      const map = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current
      if (!map) return

      const addLayer = () => {
        try {
          if (!map.getSource(id)) {
            map.addSource(id, {
              type: 'geojson',
              data: dataRef.current,
              generateId: true,
            })
          }
          if (!map.getLayer(id)) {
            const safeBeforeId =
              beforeId && map.getLayer(beforeId) ? beforeId : undefined
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

      return () => {
        map.off('styledata', handleStyleData)
        try {
          if (map.getStyle()) {
            if (map.getLayer(id)) map.removeLayer(id)
            if (map.getSource(id)) map.removeSource(id)
          }
        } catch (e) {
          // Ignore
        }
      }
    }, [id, type, mapRef, beforeId])

    useEffect(() => {
      const map = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current
      if (!map) return
      try {
        const source = map.getSource(id)
        if (source && typeof source.setData === 'function') {
          source.setData(data)
        }
      } catch (e) {
        // Ignore
      }
    }, [id, data, mapRef])

    useEffect(() => {
      const map = mapRef.current?.getMap
        ? mapRef.current.getMap()
        : mapRef.current
      if (!map) return
      try {
        if (map.getLayer(id)) {
          Object.keys(layout).forEach((key) => {
            map.setLayoutProperty(id, key, layout[key])
          })
          Object.keys(paint).forEach((key) => {
            map.setPaintProperty(id, key, paint[key])
          })
        }
      } catch (e) {
        // Ignore
      }
    }, [id, layout, paint, mapRef])

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

      const maxTime = Math.max(...definedNodeTime)
      if (currentTimeInSeconds >= maxTime) {
        if (visible && latitudes[idx] && longitudes[idx]) {
          return [
            longitudes[idx][longitudes[idx].length - 1],
            latitudes[idx][latitudes[idx].length - 1],
          ]
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
        if (targetIndex >= 0 && longitudes[idx] && latitudes[idx]) {
          return [longitudes[idx][targetIndex], latitudes[idx][targetIndex]]
        }
        return f.geometry?.coordinates
      }
      const t =
        (currentTimeInSeconds - lowerControlTime) /
        (upperControlTime - lowerControlTime)
      const lowerIdx = R.indexOf(lowerControlTime, definedNodeTime)
      const upperIdx = R.indexOf(upperControlTime, definedNodeTime)
      if (lowerIdx < 0 || upperIdx < 0 || !longitudes[idx] || !latitudes[idx]) {
        return f.geometry?.coordinates
      }
      return [
        lerp(longitudes[idx][lowerIdx], longitudes[idx][upperIdx], t),
        lerp(latitudes[idx][lowerIdx], latitudes[idx][upperIdx], t),
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

  useEffect(() => {
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
  }, [currentTimeInSeconds, nodeGeoJson, moveCoordinates])

  const layout = useMemo(
    () => ({
      'icon-image': ['get', 'icon'],
      'icon-size': ['get', 'size'],
      'icon-allow-overlap': true,
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

  const data = useMemo(() => {
    const safeAnimatedNodeGeoJson = Array.isArray(animatedNodeGeoJson)
      ? animatedNodeGeoJson
      : []
    return {
      type: 'FeatureCollection',
      features: safeAnimatedNodeGeoJson,
    }
  }, [animatedNodeGeoJson])

  return (
    <MapboxLayer
      id={`nodeIconLayer-${type}`}
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
      id={`arcLayerSolid-${type}`}
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

const MultiArcLayerInstance = memo(({ type, allFetchedArcs, beforeId }) => {
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
      id={`multiArcLayerSolid-${type}`}
      type="line"
      data={data}
      layout={arcProps.layout}
      paint={arcProps.paint}
      beforeId={beforeId}
    />
  )
})
MultiArcLayerInstance.displayName = 'MultiArcLayerInstance'

MultiArcLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  allFetchedArcs: PropTypes.array.isRequired,
  beforeId: PropTypes.string,
}

const GeographyLayerInstance = memo(({ type, allFetchedGeos, beforeId }) => {
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
      id={`geographyLayer-${type}`}
      type="fill"
      data={data}
      layout={layout}
      paint={paint}
      beforeId={beforeId}
    />
  )
})
GeographyLayerInstance.displayName = 'GeographyLayerInstance'

GeographyLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
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
      id={`includedGeographyLayer-${type}`}
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
  const { mapId, mapRef } = useContext(MapContext)

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
        id: `geographyLayer-${type}`,
        type,
        category: 'geo',
        subOrder: 0,
        typeIndex: index,
      })
      layers.push({
        id: `includedGeographyLayer-${type}`,
        type,
        category: 'geo',
        subOrder: 1,
        typeIndex: index,
      })
    })

    // 2. Add all arc layers
    arcTypes.forEach((type, index) => {
      layers.push({
        id: `multiArcLayerSolid-${type}`,
        type,
        category: 'arc',
        subOrder: 0,
        typeIndex: index,
      })
      layers.push({
        id: `arcLayerSolid-${type}`,
        type,
        category: 'arc',
        subOrder: 1,
        typeIndex: index,
      })
    })

    // 3. Add all node layers
    nodeTypes.forEach((type, index) => {
      layers.push({
        id: `nodeIconLayer-${type}`,
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
  }, [geoTypes, arcTypes, nodeTypes, legendData])

  const beforeIdMap = useMemo(() => {
    const mapping = {}
    for (let i = 0; i < orderedLayerIds.length; i++) {
      mapping[orderedLayerIds[i]] = orderedLayerIds[i + 1]
    }
    return mapping
  }, [orderedLayerIds])

  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map) return

    const reorder = () => {
      try {
        const customLayersOnMap = orderedLayerIds.filter((id) =>
          map.getLayer(id)
        )
        for (let i = 0; i < customLayersOnMap.length - 1; i++) {
          const currentId = customLayersOnMap[i]
          const nextId = customLayersOnMap[i + 1]
          map.moveLayer(currentId, nextId)
        }
      } catch (e) {
        // Ignore
      }
    }

    reorder()
    map.on('styledata', reorder)
    return () => {
      map.off('styledata', reorder)
    }
  }, [orderedLayerIds, mapRef])

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
          allFetchedGeos={safeLoadedGeoJson}
          beforeId={beforeIdMap[`geographyLayer-${type}`]}
        />
      ))}
      {geoTypes.map((type) => (
        <IncludedGeographyLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`includedGeographyLayer-${type}`]}
        />
      ))}
      {arcTypes.map((type) => (
        <MultiArcLayerInstance
          key={type}
          type={type}
          allFetchedArcs={safeLineGeoJsonObject}
          beforeId={beforeIdMap[`multiArcLayerSolid-${type}`]}
        />
      ))}
      {arcTypes.map((type) => (
        <ArcLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`arcLayerSolid-${type}`]}
        />
      ))}
      {nodeTypes.map((type) => (
        <NodeIconLayerInstance
          key={type}
          type={type}
          mapId={mapId}
          beforeId={beforeIdMap[`nodeIconLayer-${type}`]}
        />
      ))}
    </>
  )
}

const Geo3DLayerInstance = memo(({ type, geos, onClick }) => {
  const filteredGeos = useTypeFilteredFeatures(geos, type)

  return (
    <GeosWithHeight
      id={`geos-with-altitude-${type}`}
      geos={filteredGeos}
      onClick={onClick}
    />
  )
})
Geo3DLayerInstance.displayName = 'Geo3DLayerInstance'

Geo3DLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
  geos: PropTypes.array.isRequired,
  onClick: PropTypes.func,
}

const Arc3DLineLayerInstance = memo(({ type, arcs, onClick }) => {
  const filteredArcs = useTypeFilteredFeatures(arcs, type)

  return (
    <ArcsWithHeight
      id={`geos-arcs-with-altitude-${type}`}
      arcs={filteredArcs}
      onClick={onClick}
    />
  )
})
Arc3DLineLayerInstance.displayName = 'Arc3DLineLayerInstance'

Arc3DLineLayerInstance.propTypes = {
  type: PropTypes.string.isRequired,
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
        geos={!isGlobe ? safeLoadedGeoJson : []}
        onClick={createHandleClick('geos')}
      />
    )),
    ...arcTypes.map((type) => (
      <Arc3DLineLayerInstance
        key={type}
        type={type}
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
      id={`nodes-with-altitude-${type}`}
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
      id={`arcs-with-altitude-${type}`}
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
      id={`3d-model-${type}`}
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
