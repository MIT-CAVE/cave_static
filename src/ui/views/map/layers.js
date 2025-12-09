import * as R from 'ramda'
import {
  useEffect,
  useState,
  memo,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from 'react'
import { useSelector } from 'react-redux'

import {
  ArcLayer3D,
  NodesWithHeight,
  GeosWithHeight,
  ArcsWithHeight,
} from './CustomLayers'
import useMapApi, { MapContext } from './useMapApi'

import {
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectArcLayer3DGeoJsonFunc,
  // selectIsGlobe,
  selectIncludedGeoJsonFunc,
  selectFetchedGeoJsonFunc,
  selectFetchedArcGeoJsonFunc,
} from '../../../data/selectors'
import { LINE_TYPES } from '../../../utils/constants'
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
  const { Layer, Source, isMapboxSelected } = useMapApi(mapId)
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
        // NOTE: Data-driven `line-dasharray` isn't supported in MapLibre yet.
        // Keep track of: https://github.com/maplibre/maplibre-gl-js/issues/1235
        ...(isMapboxSelected && {
          'line-dasharray': [
            'case',
            ['==', ['get', 'dash'], 'dashed'],
            ['literal', LINE_TYPES.dashed],
            ['==', ['get', 'dash'], 'dotted'],
            ['literal', LINE_TYPES.dotted],
            ['literal', LINE_TYPES.solid],
          ],
        }),
      },
    }),
    [isGlobe, isMapboxSelected]
  )

  return {
    Layer,
    Source,
    arcProps,
    mapId,
    createHandleClick: useHandleClickFactory,
  }
}

export const Geos = memo(() => {
  const [loadedGeoJson, setLoadedGeoJson] = useState({})
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState({})

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

  const { mapId, arcProps, Layer, Source, createHandleClick } = useMapFeature()

  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

  useEffect(() => {
    geoJsonObjectFunc(mapId).then(setLoadedGeoJson)
  }, [geoJsonObjectFunc, mapId])

  useEffect(() => {
    lineObjFunc(mapId).then(setLineGeoJsonObject)
  }, [lineObjFunc, mapId])

  return [
    <GeosWithHeight
      id="geos-with-altitude"
      key="geos-with-altitude"
      geos={!isGlobe ? loadedGeoJson : []}
      onClick={createHandleClick('geos')}
    />,
    <ArcsWithHeight
      id="geos-arcs-with-altitude"
      key="geos-arcs-with-altitude"
      arcs={!isGlobe ? lineGeoJsonObject : []}
      onClick={createHandleClick('arcs')}
    />,
    <Source
      type="geojson"
      key={layerId.GEOGRAPHY_LAYER}
      id={layerId.GEOGRAPHY_LAYER}
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: loadedGeoJson,
      }}
    >
      <Layer
        id={layerId.GEOGRAPHY_LAYER}
        key={layerId.GEOGRAPHY_LAYER}
        react
        type="fill"
        layout={{
          visibility: isGlobe ? 'visible' : 'none',
        }}
        paint={{
          'fill-color': DARKEN_FILL_ON_HOVER,
          'fill-opacity': 0.4,
        }}
      />
    </Source>,
    <Source
      id={layerId.MULTI_ARC_LAYER_SOLID}
      key={layerId.MULTI_ARC_LAYER_SOLID}
      generateId={true}
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: lineGeoJsonObject,
      }}
    >
      <Layer
        id={layerId.MULTI_ARC_LAYER_SOLID}
        key={layerId.MULTI_ARC_LAYER_SOLID}
        {...arcProps}
      />
    </Source>,
  ]
})

export const IncludedGeos = memo(() => {
  const { mapId } = useContext(MapContext)
  const geoObjs = useSelector(selectIncludedGeoJsonFunc)(mapId)
  const { Layer, Source } = useMapApi(mapId)
  return (
    <Source
      type="geojson"
      key={layerId.INCLUDED_GEOGRAPHY_LAYER}
      id={layerId.INCLUDED_GEOGRAPHY_LAYER}
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: geoObjs,
      }}
    >
      <Layer
        id={layerId.INCLUDED_GEOGRAPHY_LAYER}
        key={layerId.INCLUDED_GEOGRAPHY_LAYER}
        type="fill"
        paint={{
          'fill-color': DARKEN_FILL_ON_HOVER,
          'fill-opacity': 0.4,
        }}
      />
    </Source>
  )
})

// TODO Add note: must contain 0
const examplePath = {
  0: [-79.63, 43],
  2: [-75, 43],
  5: [-73, 40],
}

export const Nodes = memo(({ animating }) => {
  const { Layer, Source, mapId, createHandleClick } = useMapFeature()
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)
  const [animatedCoordinates, setAnimatedCoordinates] = useState(
    R.pipe(
      R.map((feature) => [
        feature.properties.cave_name,
        feature.geometry.coordinates,
      ]),
      R.fromPairs
    )(nodeGeoJson)
  )
  const rafIdRef = useRef(null)
  const startTime = useRef(null)
  const currentLowerControlPoint = useRef(0)

  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

  const definedTimes = R.sort(
    (m, n) => m - n,
    Object.keys(examplePath).map((k) => parseFloat(k))
  )

  const lerp = (start, end, t) => {
    return start + t * (end - start)
  }

  // TODO use particular coordinates for each node
  const moveCoordinates = useCallback(() => {
    let currentTime = performance.now() - startTime.current
    if (currentTime > Math.max(...definedTimes) * 1000) {
      startTime.current = performance.now()
      currentLowerControlPoint.current = 0
      currentTime %= Math.max(...definedTimes) * 1000
    }
    const currentTimeInSeconds = currentTime / 1000
    if (
      currentTimeInSeconds > definedTimes[currentLowerControlPoint.current + 1]
    ) {
      currentLowerControlPoint.current += 1
    }
    const lowerControlTime = definedTimes[currentLowerControlPoint.current]
    const upperControlTime = definedTimes[currentLowerControlPoint.current + 1]
    const t =
      (currentTimeInSeconds - lowerControlTime) /
      (upperControlTime - lowerControlTime)
    const start = examplePath[lowerControlTime]
    const end = examplePath[upperControlTime]
    return [lerp(start[0], end[0], t), lerp(start[1], end[1], t)]
  }, [definedTimes])

  const animate = useCallback(() => {
    if (startTime.current == null) {
      startTime.current = performance.now()
    }
    setAnimatedCoordinates(
      R.pipe(
        R.map((feature) => [feature.properties.cave_name, moveCoordinates()]),
        R.fromPairs
      )(nodeGeoJson)
    )
    rafIdRef.current = requestAnimationFrame(animate)
  }, [nodeGeoJson, moveCoordinates])

  useEffect(() => {
    // if (animating) {
    rafIdRef.current = requestAnimationFrame(animate)
    // }
    return () => cancelAnimationFrame(rafIdRef.current)
  }, [animating, animate])

  const animatedNodeGeoJson = useMemo(() => {
    return R.map(
      (feature) =>
        R.assocPath(
          ['geometry', 'coordinates'],
          animatedCoordinates[feature],
          R.find(R.pathEq(feature, ['properties', 'cave_name']), nodeGeoJson)
        ),
      R.keys(animatedCoordinates)
    )
  }, [nodeGeoJson, animatedCoordinates])

  return [
    <NodesWithHeight
      id="nodes-with-altitude"
      key="nodes-with-altitude"
      nodes={!isGlobe ? nodeGeoJson : []}
      onClick={createHandleClick('nodes')}
    />,
    <Source
      id={layerId.NODE_ICON_LAYER}
      key={layerId.NODE_ICON_LAYER}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: animatedNodeGeoJson,
      }}
    >
      <Layer
        id={layerId.NODE_ICON_LAYER}
        key={layerId.NODE_ICON_LAYER}
        type="symbol"
        layout={{
          'icon-image': ['get', 'icon'],
          'icon-size': ['get', 'size'],
          'icon-allow-overlap': true,
          visibility: isGlobe ? 'visible' : 'none',
        }}
        paint={{
          'icon-color': DARKEN_FILL_ON_HOVER,
        }}
      />
    </Source>,
  ]
})

export const Arcs = memo(() => {
  const { Layer, Source, mapId, arcProps, createHandleClick } = useMapFeature()
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)
  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

  return [
    <ArcsWithHeight
      id="arcs-with-altitude"
      key="arcs-with-altitude"
      arcs={!isGlobe ? arcLayerGeoJson : []}
      onClick={createHandleClick('arcs')}
    />,
    <Source
      id={layerId.ARC_LAYER_SOLID}
      key={layerId.ARC_LAYER_SOLID}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: arcLayerGeoJson,
      }}
    >
      <Layer
        id={layerId.ARC_LAYER_SOLID}
        key={layerId.ARC_LAYER_SOLID}
        {...arcProps}
      />
    </Source>,
  ]
})

export const Arcs3D = memo(() => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcLayerGeoJson = useSelector(selectArcLayer3DGeoJsonFunc)(mapId)
  return (
    <ArcLayer3D
      features={arcLayerGeoJson}
      onClick={createHandleClick('arcs')}
    />
  )
})
