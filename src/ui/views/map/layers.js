import * as R from 'ramda'
import { useEffect, useCallback, useContext, useMemo, useState } from 'react'
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
  selectFeatureData,
  selectCurrentTimeContinuous,
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
  const { Layer, Source } = useMapApi(mapId)
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
    Layer,
    Source,
    arcProps,
    mapId,
    createHandleClick: useHandleClickFactory,
  }
}

export const Geos = () => {
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
}

export const IncludedGeos = () => {
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
}

export const Nodes = () => {
  const { Layer, Source, mapId, createHandleClick } = useMapFeature()
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)
  const featureData = useSelector(selectFeatureData)
  const currentTimeInSeconds = useSelector(selectCurrentTimeContinuous)

  const [animatedNodeGeoJson, setAnimatedNodeGeoJson] = useState(nodeGeoJson)
  const isGlobe = true //useSelector(selectIsGlobe)(mapId)

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
        features: nodeGeoJson.length === 0 ? [] : animatedNodeGeoJson,
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
}

export const Arcs = () => {
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
}

export const Arcs3D = () => {
  const { mapId, createHandleClick } = useMapFeature()
  const arcLayerGeoJson = useSelector(selectArcLayer3DGeoJsonFunc)(mapId)
  return (
    <ArcLayer3D
      features={arcLayerGeoJson}
      onClick={createHandleClick('arcs')}
    />
  )
}
