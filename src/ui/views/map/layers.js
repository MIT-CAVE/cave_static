import * as R from 'ramda'
import { useEffect, useState, memo } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import {
  ArcLayer3D,
  NodesWithHeight,
  GeosWithHeight,
  ArcsWithHeight,
} from './CustomLayers'

import { mutateLocal } from '../../../data/local'
import {
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectArcLayer3DGeoJsonFunc,
  selectSync,
  selectIsGlobe,
  selectIncludedGeoJsonFunc,
  selectFetchedGeoJsonFunc,
  selectFetchedArcGeoJsonFunc,
} from '../../../data/selectors'
import { HIGHLIGHT_COLOR, LINE_TYPES } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { includesPath } from '../../../utils'

const handleFeatureClick = (
  dispatch,
  sync,
  mapId,
  cave_name,
  cave_obj,
  feature
) => {
  const [type] = JSON.parse(cave_name)
  dispatch(
    mutateLocal({
      path: ['panes', 'paneState', 'center'],
      value: {
        open: {
          ...(cave_obj || {}),
          feature: feature,
          type: R.propOr(type, 'name')(cave_obj),
          key: cave_name,
          mapId,
        },
        type: 'feature',
      },
      sync: !includesPath(R.values(sync), ['panes', 'paneState', 'center']),
    })
  )
}

export const Geos = memo(({ mapId }) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)

  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)
  const isGlobe = useSelector(selectIsGlobe)(mapId)

  const [loadedGeoJson, setLoadedGeoJson] = useState({})
  const [lineGeoJsonObject, setLineGeoJsonObject] = useState({})

  useEffect(() => {
    const loadData = async () => {
      geoJsonObjectFunc(mapId).then((loadedData) => {
        setLoadedGeoJson(loadedData)
      })
    }
    loadData()
  }, [geoJsonObjectFunc, mapId])

  useEffect(() => {
    const loadData = async () => {
      lineObjFunc(mapId).then((loadedData) => {
        setLineGeoJsonObject(loadedData)
      })
    }
    loadData()
  }, [lineObjFunc, mapId])

  return [
    <GeosWithHeight
      id="geos-with-altitude"
      geos={!isGlobe ? loadedGeoJson : []}
      onClick={({ cave_name, cave_obj }) =>
        handleFeatureClick(dispatch, sync, mapId, cave_name, cave_obj, 'geos')
      }
    />,
    <ArcsWithHeight
      id="geos-arcs-with-altitude"
      arcs={!isGlobe ? lineGeoJsonObject : []}
      onClick={({ cave_name, cave_obj }) =>
        handleFeatureClick(dispatch, sync, mapId, cave_name, cave_obj, 'arcs')
      }
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
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
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
        type="line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
          visibility: isGlobe ? 'visible' : 'none',
        }}
        paint={{
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
          'line-dasharray': [
            'case',
            ['==', ['get', 'dash'], 'dashed'],
            LINE_TYPES['dashed'],
            ['==', ['get', 'dash'], 'dotted'],
            LINE_TYPES['dotted'],
            LINE_TYPES['solid'],
          ],
        }}
      />
    </Source>,
  ]
})

export const IncludedGeos = memo(({ mapId }) => {
  const geoObjs = useSelector(selectIncludedGeoJsonFunc)(mapId)

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
          'fill-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'fill-opacity': 0.4,
        }}
      />
    </Source>
  )
})

export const Nodes = memo(({ mapId }) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)
  const isGlobe = useSelector(selectIsGlobe)(mapId)

  return [
    <NodesWithHeight
      id="nodes-with-altitude"
      nodes={!isGlobe ? nodeGeoJson : []}
      onClick={({ cave_name, cave_obj }) =>
        handleFeatureClick(dispatch, sync, mapId, cave_name, cave_obj, 'nodes')
      }
    />,
    <Source
      id={layerId.NODE_ICON_LAYER}
      key={layerId.NODE_ICON_LAYER}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: nodeGeoJson,
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
          'icon-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
        }}
      />
    </Source>,
  ]
})

export const Arcs = memo(({ mapId }) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)
  const isGlobe = useSelector(selectIsGlobe)(mapId)

  return [
    <ArcsWithHeight
      id="arcs-with-altitude"
      arcs={!isGlobe ? arcLayerGeoJson : []}
      onClick={({ cave_name, cave_obj }) =>
        handleFeatureClick(dispatch, sync, mapId, cave_name, cave_obj, 'arcs')
      }
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
        type="line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
          visibility: isGlobe ? 'visible' : 'none',
        }}
        paint={{
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
          'line-dasharray': [
            'case',
            ['==', ['get', 'dash'], 'dashed'],
            LINE_TYPES['dashed'],
            ['==', ['get', 'dash'], 'dotted'],
            LINE_TYPES['dotted'],
            LINE_TYPES['solid'],
          ],
        }}
      />
    </Source>,
  ]
})

export const Arcs3D = memo(({ mapId }) => {
  const dispatch = useDispatch()
  const sync = useSelector(selectSync)
  const arcLayerGeoJson = useSelector(selectArcLayer3DGeoJsonFunc)(mapId)
  return (
    <ArcLayer3D
      features={arcLayerGeoJson}
      onClick={({ cave_name, cave_obj }) =>
        handleFeatureClick(dispatch, sync, mapId, cave_name, cave_obj, 'arcs')
      }
    />
  )
})
