import * as R from 'ramda'
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectArcLayer3DGeoJsonFunc,
  // selectIsGlobe,
  selectIncludedGeoJsonFunc,
  selectFetchedGeoJsonFunc,
  selectFetchedArcGeoJsonFunc,
  selectFeatureData,
  selectCurrentTimeContinuous,
} from '../../../data/selectors'
import { LAYER_ORDER, LINE_TYPES } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'

const DARKEN_FILL_ON_HOVER = [
  'case',
  ['boolean', ['feature-state', 'hover'], false],
  // Apply darkening when hovered
  [
    'let',
    'rgbaArray',
    ['to-rgba', ['get', 'color']],
    [
      'rgba',
      ['*', ['at', 0, ['var', 'rgbaArray']], 0.6],
      ['*', ['at', 1, ['var', 'rgbaArray']], 0.6],
      ['*', ['at', 2, ['var', 'rgbaArray']], 0.6],
      ['at', 3, ['var', 'rgbaArray']], // Keep alpha unchanged
    ],
  ],
  ['get', 'color'], // No hover
]

const useMapFeature = () => {
  const { mapId } = useContext(MapContext)
  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

  const useHandleClickFactory = (feature) =>
    useMutateStateWithSync(
      ({ cave_name: caveName, cave_obj: caveObj }) => ({
        path: ['panes', 'paneState', 'center'],
        value: {
          open: {
            ...(caveObj || {}),
            key: caveName,
            mapId,
            feature,
            type: caveObj.name ?? JSON.parse(caveName),
          },
          type: 'feature',
        },
      }),
      [mapId]
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
    createHandleClick: useHandleClickFactory,
  }
}

export const MapLayers = () => {
  const { mapId, mapRef, mapLoaded } = useContext(MapContext)

  const [loadedGeoJson, setLoadedGeoJson] = useState([])
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState([])

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

  const geoObjs = useSelector(selectIncludedGeoJsonFunc)(mapId)
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)

  const featureData = useSelector(selectFeatureData)
  const currentTimeInSeconds = useSelector(selectCurrentTimeContinuous)

  const [animatedNodeGeoJson, setAnimatedNodeGeoJson] = useState(nodeGeoJson)
  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

  useEffect(() => {
    geoJsonObjectFunc(mapId).then(setLoadedGeoJson)
  }, [geoJsonObjectFunc, mapId])

  useEffect(() => {
    lineObjFunc(mapId).then(setLineGeoJsonObject)
  }, [lineObjFunc, mapId])

  const latitudes = useMemo(
    () =>
      R.pipe(
        R.values,
        R.map(R.pathOr([], ['data', 'location', 'latitude'])),
        R.unnest
      )(featureData),
    [featureData]
  )
  const longitudes = useMemo(
    () =>
      R.pipe(
        R.values,
        R.map(R.pathOr([], ['data', 'location', 'longitude'])),
        R.unnest
      )(featureData),
    [featureData]
  )
  const animationTimes = useMemo(
    () =>
      R.pipe(
        R.values,
        R.map((item) => {
          const latitude = R.pathOr([], ['data', 'location', 'latitude'])(item)
          const animationTime = R.path(
            ['data', 'location', 'animationTime'],
            item
          )
          return animationTime ?? R.repeat([null], latitude.length)
        }),
        R.unnest
      )(featureData),
    [featureData]
  )
  const visibilityInfo = useMemo(() => {
    const visibilities = {}
    const visibilityTimes = {}
    let totalNodes = 0
    for (const val of Object.values(featureData)) {
      const visibilityIndices = R.pipe(
        R.pathOr([], ['data', 'location', 'visibilityIndex']),
        R.flatten
      )(val)
      const numMapFeatureNodes = R.pathOr(
        [],
        ['data', 'location', 'latitude']
      )(val).length
      const visibilityTime = R.pathOr(
        [],
        ['data', 'location', 'visibilityTime']
      )(val)
      for (let i = 0; i < numMapFeatureNodes; i++) {
        if (i in visibilityIndices) {
          visibilities[totalNodes + visibilityIndices[i]] = true
          visibilityTimes[totalNodes + visibilityIndices[i]] = visibilityTime[i]
        }
      }
      totalNodes += numMapFeatureNodes
    }
    return { visibilities, visibilityTimes }
  }, [featureData])

  const definedNodeTimes = useMemo(
    () =>
      R.fromPairs(R.addIndex(R.map)((val, idx) => [idx, val])(animationTimes)),
    [animationTimes]
  )

  const lerp = (start, end, t) => {
    return start + t * (end - start)
  }

  const moveCoordinates = useCallback(
    (idx) => {
      if (R.equals([null], definedNodeTimes[idx])) {
        return nodeGeoJson[idx].geometry.coordinates
      }
      const definedNodeTime = definedNodeTimes[idx]
      let visible = true

      if (idx in visibilityInfo.visibilities) {
        for (const time of visibilityInfo.visibilityTimes[idx]) {
          if (currentTimeInSeconds > time) {
            visible = !visible
          } else {
            break
          }
        }
      }

      if (currentTimeInSeconds >= Math.max(...definedNodeTime)) {
        if (visible) {
          return [
            longitudes[idx][longitudes[idx].length - 1],
            latitudes[idx][latitudes[idx].length - 1],
          ]
        } else {
          return []
        }
      }

      if (!visible) {
        return []
      }
      const lowerControlTime = R.last(
        R.filter((t) => t <= currentTimeInSeconds, definedNodeTime)
      )
      const upperControlTime = R.head(
        R.filter((t) => t > currentTimeInSeconds, definedNodeTime)
      )
      const t =
        (currentTimeInSeconds - lowerControlTime) /
        (upperControlTime - lowerControlTime)
      return [
        lerp(
          longitudes[idx][R.indexOf(lowerControlTime, definedNodeTime)],
          longitudes[idx][R.indexOf(upperControlTime, definedNodeTime)],
          t
        ),
        lerp(
          latitudes[idx][R.indexOf(lowerControlTime, definedNodeTime)],
          latitudes[idx][R.indexOf(upperControlTime, definedNodeTime)],
          t
        ),
      ]
    },
    [
      definedNodeTimes,
      currentTimeInSeconds,
      visibilityInfo.visibilities,
      visibilityInfo.visibilityTimes,
      longitudes,
      latitudes,
      nodeGeoJson,
    ]
  )

  useEffect(() => {
    const requestId = window.requestAnimationFrame(() => {
      setAnimatedNodeGeoJson(
        nodeGeoJson.map((f, i) =>
          R.assocPath(['geometry', 'coordinates'], moveCoordinates(i), f)
        )
      )
    })
    return () => window.cancelAnimationFrame(requestId)
  }, [currentTimeInSeconds, nodeGeoJson, moveCoordinates])

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

  const geojsonLayers = useMemo(() => {
    const safeLoadedGeoJson = Array.isArray(loadedGeoJson) ? loadedGeoJson : []
    const safeLineGeoJsonObject = Array.isArray(lineGeoJsonObject)
      ? lineGeoJsonObject
      : []
    const safeGeoObjs = Array.isArray(geoObjs) ? geoObjs : []
    const safeNodeGeoJson = Array.isArray(nodeGeoJson) ? nodeGeoJson : []
    const safeAnimatedNodeGeoJson = Array.isArray(animatedNodeGeoJson)
      ? animatedNodeGeoJson
      : []
    const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
      ? arcLayerGeoJson
      : []

    const layersMap = {
      [layerId.GEOGRAPHY_LAYER]: {
        id: layerId.GEOGRAPHY_LAYER,
        type: 'fill',
        data: {
          type: 'FeatureCollection',
          features: safeLoadedGeoJson,
        },
        layout: {
          visibility: isGlobe ? 'visible' : 'none',
        },
        paint: {
          'fill-color': DARKEN_FILL_ON_HOVER,
          'fill-opacity': 0.4,
        },
      },
      [layerId.INCLUDED_GEOGRAPHY_LAYER]: {
        id: layerId.INCLUDED_GEOGRAPHY_LAYER,
        type: 'fill',
        data: {
          type: 'FeatureCollection',
          features: safeGeoObjs,
        },
        paint: {
          'fill-color': DARKEN_FILL_ON_HOVER,
          'fill-opacity': 0.4,
        },
      },
      [layerId.MULTI_ARC_LAYER_SOLID]: {
        id: layerId.MULTI_ARC_LAYER_SOLID,
        type: 'line',
        data: {
          type: 'FeatureCollection',
          features: safeLineGeoJsonObject,
        },
        layout: arcProps.layout,
        paint: arcProps.paint,
      },
      [layerId.ARC_LAYER_SOLID]: {
        id: layerId.ARC_LAYER_SOLID,
        type: 'line',
        data: {
          type: 'FeatureCollection',
          features: safeArcLayerGeoJson,
        },
        layout: arcProps.layout,
        paint: arcProps.paint,
      },
      [layerId.NODE_ICON_LAYER]: {
        id: layerId.NODE_ICON_LAYER,
        type: 'symbol',
        data: {
          type: 'FeatureCollection',
          features: safeNodeGeoJson.length === 0 ? [] : safeAnimatedNodeGeoJson,
        },
        layout: {
          'icon-image': ['get', 'icon'],
          'icon-size': ['get', 'size'],
          'icon-allow-overlap': true,
          visibility: isGlobe ? 'visible' : 'none',
        },
        paint: {
          'icon-color': DARKEN_FILL_ON_HOVER,
        },
      },
    }

    return R.pipe(
      R.map((id) => layersMap[id]),
      R.reject(R.isNil)
    )(LAYER_ORDER)
  }, [
    loadedGeoJson,
    lineGeoJsonObject,
    geoObjs,
    nodeGeoJson,
    animatedNodeGeoJson,
    arcLayerGeoJson,
    isGlobe,
    arcProps,
  ])

  const dataRef = useRef(geojsonLayers)

  useEffect(() => {
    dataRef.current = geojsonLayers
  }, [geojsonLayers])

  // 1. Manage creation, destruction, and style changes in order
  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map || !mapLoaded) return

    const addAll = () => {
      const layers = dataRef.current

      layers.forEach(({ id, type, data, layout = {}, paint = {} }) => {
        if (!map.getSource(id)) {
          map.addSource(id, {
            type: 'geojson',
            data,
            generateId: true,
          })
        }
        if (!map.getLayer(id)) {
          map.addLayer({
            id,
            type,
            source: id,
            layout,
            paint,
          })
        }
      })
    }

    if (map.isStyleLoaded()) {
      addAll()
    }

    const handleStyleData = () => {
      addAll()
    }

    map.on('styledata', handleStyleData)

    return () => {
      map.off('styledata', handleStyleData)
      try {
        if (map.getStyle()) {
          const layers = dataRef.current
          // Remove layers in reverse order
          layers
            .slice()
            .reverse()
            .forEach(({ id }) => {
              if (map.getLayer(id)) map.removeLayer(id)
            })
          // Remove sources
          layers.forEach(({ id }) => {
            if (map.getSource(id)) map.removeSource(id)
          })
        }
      } catch (e) {
        // Ignore
      }
    }
  }, [mapRef, mapLoaded])

  // 2. Manage updating data
  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map || !mapLoaded) return

    geojsonLayers.forEach(({ id, data }) => {
      try {
        const source = map.getSource(id)
        if (source && typeof source.setData === 'function') {
          source.setData(data)
        }
      } catch (e) {
        // Ignore
      }
    })
  }, [geojsonLayers, mapRef, mapLoaded])

  // 3. Manage updating paint and layout properties
  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map || !mapLoaded) return

    geojsonLayers.forEach(({ id, layout = {}, paint = {} }) => {
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
    })
  }, [geojsonLayers, mapRef, mapLoaded])

  return null
}

export const Geos = () => {
  const [loadedGeoJson, setLoadedGeoJson] = useState([])
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState([])

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

  const { mapId, createHandleClick } = useMapFeature()

  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

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
    <GeosWithHeight
      id="geos-with-altitude"
      key="geos-with-altitude"
      geos={!isGlobe ? safeLoadedGeoJson : []}
      onClick={createHandleClick('geos')}
    />,
    <ArcsWithHeight
      id="geos-arcs-with-altitude"
      key="geos-arcs-with-altitude"
      arcs={!isGlobe ? safeLineGeoJsonObject : []}
      onClick={createHandleClick('arcs')}
    />,
  ]
}

export const IncludedGeos = () => {
  return null
}

export const Nodes = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)

  const isGlobe = true //useSelector(selectIsGlobe)(mapId)
  const safeNodeGeoJson = Array.isArray(nodeGeoJson) ? nodeGeoJson : []

  return [
    <NodesWithHeight
      id="nodes-with-altitude"
      key="nodes-with-altitude"
      nodes={!isGlobe ? safeNodeGeoJson : []}
      onClick={createHandleClick('nodes')}
    />,
  ]
}

export const Arcs = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)
  const isGlobe = true //useSelector(selectIsGlobe)(mapId)
  const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
    ? arcLayerGeoJson
    : []

  return [
    <ArcsWithHeight
      id="arcs-with-altitude"
      key="arcs-with-altitude"
      arcs={!isGlobe ? safeArcLayerGeoJson : []}
      onClick={createHandleClick('arcs')}
    />,
  ]
}

export const Arcs3D = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcLayerGeoJson = useSelector(selectArcLayer3DGeoJsonFunc)(mapId)
  const safeArcLayerGeoJson = Array.isArray(arcLayerGeoJson)
    ? arcLayerGeoJson
    : []
  return (
    <ArcLayer3D
      features={safeArcLayerGeoJson}
      onClick={createHandleClick('arcs')}
    />
  )
}
