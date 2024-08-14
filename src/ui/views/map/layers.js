import * as R from 'ramda'
import { useEffect, useState, memo } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import { ArcLayer3D } from './CustomLayers'

import { mutateLocal } from '../../../data/local'
import {
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectArcLayer3DGeoJsonFunc,
  selectSync,
  selectIncludedGeoJsonFunc,
  selectFetchedGeoJsonFunc,
  selectFetchedArcGeoJsonFunc,
} from '../../../data/selectors'
import { HIGHLIGHT_COLOR, LINE_TYPES } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { includesPath } from '../../../utils'

export const Geos = memo(({ mapId }) => {
  const geoJsonObjectFunc = useSelector(selectFetchedGeoJsonFunc)
  const lineObjFunc = useSelector(selectFetchedArcGeoJsonFunc)

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
    </Source>,
    <Source
      id={layerId.MULTI_ARC_LAYER_SOLID}
      key={layerId.MULTI_ARC_LAYER_SOLID}
      generateId={true}
      type="geojson"
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'solid', lineGeoJsonObject),
      }}
    >
      <Layer
        id={layerId.MULTI_ARC_LAYER_SOLID}
        key={layerId.MULTI_ARC_LAYER_SOLID}
        type="line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
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
        }}
      />
    </Source>,
    <Source
      id={layerId.MULTI_ARC_LAYER_DASH}
      key={layerId.MULTI_ARC_LAYER_DASH}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'dashed', lineGeoJsonObject),
      }}
    >
      <Layer
        id={layerId.MULTI_ARC_LAYER_DASH}
        key={layerId.MULTI_ARC_LAYER_DASH}
        type="line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
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
          'line-dasharray': LINE_TYPES['dashed'],
        }}
      />
    </Source>,
    <Source
      id={layerId.MULTI_ARC_LAYER_DOT}
      key={layerId.MULTI_ARC_LAYER_DOT}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'dotted', lineGeoJsonObject),
      }}
    >
      <Layer
        id={layerId.MULTI_ARC_LAYER_DOT}
        key={layerId.MULTI_ARC_LAYER_DOT}
        type="line"
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
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
          'line-dasharray': LINE_TYPES['dotted'],
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
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)

  return (
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
    </Source>
  )
})
export const Arcs = memo(({ mapId }) => {
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)
  return [
    <Source
      id={layerId.ARC_LAYER_SOLID}
      key={layerId.ARC_LAYER_SOLID}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'solid', arcLayerGeoJson),
      }}
    >
      <Layer
        id={layerId.ARC_LAYER_SOLID}
        key={layerId.ARC_LAYER_SOLID}
        type="line"
        paint={{
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
        }}
      />
    </Source>,
    <Source
      id={layerId.ARC_LAYER_DASH}
      key={layerId.ARC_LAYER_DASH}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'dashed', arcLayerGeoJson),
      }}
    >
      <Layer
        id={layerId.ARC_LAYER_DASH}
        key={layerId.ARC_LAYER_DASH}
        type="line"
        paint={{
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
          'line-dasharray': LINE_TYPES['dashed'],
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
        }}
      />
    </Source>,
    <Source
      id={layerId.ARC_LAYER_DOT}
      key={layerId.ARC_LAYER_DOT}
      type="geojson"
      generateId={true}
      data={{
        type: 'FeatureCollection',
        features: R.propOr([], 'dotted', arcLayerGeoJson),
      }}
    >
      <Layer
        id={layerId.ARC_LAYER_DOT}
        key={layerId.ARC_LAYER_DOT}
        type="line"
        paint={{
          'line-color': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
          'line-dasharray': LINE_TYPES['dotted'],
        }}
        layout={{
          'line-cap': 'round',
          'line-join': 'round',
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
      onClick={({ cave_name, cave_obj: obj }) => {
        const [type] = JSON.parse(cave_name)
        dispatch(
          mutateLocal({
            path: ['panes', 'paneState', 'center'],
            value: {
              open: {
                ...(obj || {}),
                feature: 'arcs',
                type: R.propOr(type, 'name')(obj),
                key: cave_name,
                mapId,
              },
              type: 'feature',
            },
            sync: !includesPath(R.values(sync), [
              'panes',
              'paneState',
              'center',
            ]),
          })
        )
      }}
    />
  )
})
