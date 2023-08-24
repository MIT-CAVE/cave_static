import * as R from 'ramda'
import { useMemo, useEffect, useState, memo, useCallback } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import { ArcLayer3D } from './CustomLayers'

import { openMapModal } from '../../../data/local/mapSlice'
import {
  selectTheme,
  selectEnabledArcsFunc,
  selectArcRange,
  selectEnabledGeosFunc,
  selectGeoColorRange,
  selectMatchingKeysFunc,
  selectMatchingKeysByTypeFunc,
  selectGeoTypes,
  selectArcTypes,
  selectLineMatchingKeysByTypeFunc,
  selectLineMatchingKeysFunc,
  selectNodeLayerGeoJsonFunc,
  selectArcLayerGeoJsonFunc,
  selectAppBarId,
  selectArcLayer3DGeoJsonFunc,
} from '../../../data/selectors'
import { HIGHLIGHT_COLOR, LINE_TYPES } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { getScaledColor, getScaledArray, getScaledValue } from '../../../utils'

export const Geos = memo(({ highlightLayerId, mapId }) => {
  const enabledGeos = useSelector(selectEnabledGeosFunc)(mapId)
  const geoColorRange = useSelector(selectGeoColorRange)
  const matchingKeys = useSelector(selectMatchingKeysFunc)(mapId)
  const matchingKeysByType = useSelector(selectMatchingKeysByTypeFunc)(mapId)
  const geoTypes = useSelector(selectGeoTypes)
  const themeType = useSelector(selectTheme)
  const enabledArcs = useSelector(selectEnabledArcsFunc)(mapId)
  const arcTypes = useSelector(selectArcTypes)
  const lineMatchingKeys = useSelector(selectLineMatchingKeysFunc)(mapId)
  const lineMatchingKeysByType = useSelector(selectLineMatchingKeysByTypeFunc)(
    mapId
  )
  const arcRange = useSelector(selectArcRange)

  const [selectedGeos, setSelectedGeos] = useState({})
  const [selectedArcs, setSelectedArcs] = useState({})

  const highlight = R.isNotNil(highlightLayerId) ? highlightLayerId : -1

  useEffect(() => {
    const geoNames = R.keys(R.filter(R.identity, enabledGeos))

    const fetchCache = async () => {
      const cache = await caches.open('geos')
      const geos = {}
      for (let geoName of geoNames) {
        const url = R.pathOr('', [geoName, 'geoJson', 'geoJsonLayer'], geoTypes)
        // Special catch for empty urls on initial call
        if (url === '') {
          break
        }
        let response = await cache.match(url)
        // add to cache if not found
        if (R.isNil(response)) {
          await cache.add(url)
          response = await cache.match(url)
        }
        geos[geoName] = await response.json()
      }
      setSelectedGeos(geos)
    }
    fetchCache()
  }, [geoTypes, enabledGeos, matchingKeysByType])

  useEffect(() => {
    const arcNames = R.keys(R.filter(R.identity, enabledArcs))

    const fetchCache = async () => {
      const cache = await caches.open('arcs')
      const arcs = {}
      for (let arcName of arcNames) {
        const url = R.pathOr('', [arcName, 'geoJson', 'geoJsonLayer'], arcTypes)
        // Special catch for empty urls on initial call
        if (url === '') {
          break
        }
        let response = await cache.match(url)
        // add to cache if not found
        if (R.isNil(response)) {
          await cache.add(url)
          response = await cache.match(url)
        }
        arcs[arcName] = await response.json()
      }
      setSelectedArcs(arcs)
    }
    fetchCache()
  }, [arcTypes, enabledArcs, lineMatchingKeysByType])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (geoObj) => {
        const colorProp = R.path([geoObj.type, 'colorBy'], enabledGeos)
        const value = R.path(['props', colorProp, 'value'], geoObj)
        return `${geoObj.geoJsonValue}${value}`
      },
      (geoObj) => {
        const colorProp = R.path([geoObj.type, 'colorBy'], enabledGeos)
        const statRange = geoColorRange(geoObj.type, colorProp)
        const colorRange = R.map((prop) =>
          R.pathOr(0, [prop, themeType])(statRange)
        )(['startGradientColor', 'endGradientColor'])
        const value = R.pipe(
          R.path(['props', colorProp, 'value']),
          R.when(R.isNil, R.always('')),
          (s) => s.toString()
        )(geoObj)
        const isCategorical = !R.has('min', statRange)

        const nullColor = R.pathOr(
          R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
          ['nullColor', themeType],
          colorRange
        )

        return R.equals('', value)
          ? nullColor
          : isCategorical
          ? R.propOr('rgb(0,0,0,5)', value, statRange)
          : `rgba(${getScaledColor(
              [R.prop('min', statRange), R.prop('max', statRange)],
              colorRange,
              value
            ).join(',')})`
      }
    ),
    [enabledGeos, geoColorRange, themeType]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findLineSize = useCallback(
    R.memoizeWith(
      (d) => {
        const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
        const propVal = R.path(['props', sizeProp, 'value'], d)
        return `${R.prop('data_key', d)}${propVal}`
      },
      (d) => {
        const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
        const sizeRange = arcRange(d.type, sizeProp, true)
        const propVal = parseFloat(R.path(['props', sizeProp, 'value'], d))
        return isNaN(propVal)
          ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
          : getScaledValue(
              R.prop('min', sizeRange),
              R.prop('max', sizeRange),
              parseFloat(R.prop('startSize', d)),
              parseFloat(R.prop('endSize', d)),
              propVal
            )
      }
    ),
    [enabledArcs, arcRange]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findLineColor = useCallback(
    R.memoizeWith(
      (d) => {
        const colorProp = R.path([d.type, 'colorBy'], enabledArcs)
        const propVal = R.path(['props', colorProp, 'value'], d[1])
        return `${R.prop('data_key', d)}${propVal}`
      },
      (d) => {
        const colorProp = R.path([d.type, 'colorBy'], enabledArcs)
        const colorRange = arcRange(d.type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = R.pipe(
          R.path(['props', colorProp, 'value']),
          R.when(R.isNil, R.always('')),
          (s) => s.toString()
        )(d)

        const nullColor = R.pathOr(
          R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
          ['nullColor', themeType],
          colorRange
        )

        return R.equals('', propVal)
          ? nullColor
          : isCategorical
          ? R.propOr('rgb(0,0,0)', propVal, colorRange)
          : `rgb(${getScaledArray(
              R.prop('min', colorRange),
              R.prop('max', colorRange),
              R.map((val) => parseFloat(val))(
                R.pathOr(
                  R.prop('startGradientColor', colorRange),
                  ['startGradientColor', themeType],
                  colorRange
                )
                  .replace(/[^\d,.]/g, '')
                  .split(',')
              ),
              R.map((val) => parseFloat(val))(
                R.pathOr(
                  R.prop('endGradientColor', colorRange),
                  ['endGradientColor', themeType],
                  colorRange
                )
                  .replace(/[^\d,.]/g, '')
                  .split(',')
              ),
              parseFloat(R.path(['props', colorProp, 'value'], d))
            ).join(',')})`
      }
    ),
    [enabledArcs, arcRange, themeType]
  )

  const geoJsonObject = useMemo(
    () =>
      R.pipe(
        R.mapObjIndexed((geoObj, geoJsonValue) => {
          const geoJsonProp = R.path(['geoJson', 'geoJsonProp'])(geoObj)
          const geoType = R.prop('type')(geoObj)
          const filteredFeature = R.find(
            (feature) =>
              R.path(['properties', geoJsonProp])(feature) === geoJsonValue
          )(R.pathOr({}, [geoType, 'features'])(selectedGeos))
          const color = findColor(geoObj)

          const id = R.prop('data_key')(geoObj)
          return R.mergeRight(filteredFeature, {
            properties: { cave_name: id, color: color },
          })
        }),
        R.values
      )(matchingKeys),
    [findColor, matchingKeys, selectedGeos]
  )

  const lineGeoJsonObject = useMemo(
    () =>
      R.pipe(
        R.mapObjIndexed((geoObj, geoJsonValue) => {
          const geoJsonProp = R.path(['geoJson', 'geoJsonProp'])(geoObj)
          const geoType = R.prop('type')(geoObj)
          const filteredFeatures = R.find(
            (feature) =>
              R.path(['properties', geoJsonProp])(feature) === geoJsonValue
          )(R.pathOr({}, [geoType, 'features'])(selectedArcs))

          const color = findLineColor(geoObj)
          const size = findLineSize(geoObj)
          const id = R.prop('data_key')(geoObj)
          const dashPattern = R.propOr('solid', 'lineBy')(geoObj)
          return R.mergeRight(filteredFeatures, {
            properties: {
              cave_name: id,
              color: color,
              dash: dashPattern,
              size: size,
            },
          })
        }),
        R.values,
        R.groupBy(R.path(['properties', 'dash']))
      )(lineMatchingKeys),
    [findLineColor, findLineSize, lineMatchingKeys, selectedArcs]
  )

  return [
    <Source
      type="geojson"
      key={layerId.GEOGRAPHY_LAYER}
      id={layerId.GEOGRAPHY_LAYER}
      data={{
        type: 'FeatureCollection',
        features: geoJsonObject,
      }}
    >
      <Layer
        id={layerId.GEOGRAPHY_LAYER}
        key={layerId.GEOGRAPHY_LAYER}
        type="fill"
        paint={{
          'fill-color': [
            'match',
            ['get', 'cave_name'],
            highlight,
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
            'match',
            ['get', 'cave_name'],
            highlight,
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
            'match',
            ['get', 'cave_name'],
            highlight,
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
            'match',
            ['get', 'cave_name'],
            highlight,
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

export const Nodes = memo(({ highlightLayerId, mapId }) => {
  const nodeGeoJson = useSelector(selectNodeLayerGeoJsonFunc)(mapId)

  const highlight = R.isNotNil(highlightLayerId) ? highlightLayerId : -1

  return (
    <Source
      id={layerId.NODE_ICON_LAYER}
      key={layerId.NODE_ICON_LAYER}
      type="geojson"
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
            'match',
            ['get', 'cave_name'],
            highlight,
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
        }}
      />
    </Source>
  )
})
export const Arcs = memo(({ highlightLayerId, mapId }) => {
  const arcLayerGeoJson = useSelector(selectArcLayerGeoJsonFunc)(mapId)

  const highlight = R.isNotNil(highlightLayerId) ? highlightLayerId : -1
  return [
    <Source
      id={layerId.ARC_LAYER_SOLID}
      key={layerId.ARC_LAYER_SOLID}
      type="geojson"
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
            'match',
            ['get', 'cave_name'],
            highlight,
            HIGHLIGHT_COLOR,
            ['get', 'color'],
          ],
          'line-opacity': 0.8,
          'line-width': ['get', 'size'],
        }}
      />
    </Source>,
    <Source
      id={layerId.ARC_LAYER_DASH}
      key={layerId.ARC_LAYER_DASH}
      type="geojson"
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
            'match',
            ['get', 'cave_name'],
            highlight,
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
      id={layerId.ARC_LAYER_DOT}
      key={layerId.ARC_LAYER_DOT}
      type="geojson"
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
            'match',
            ['get', 'cave_name'],
            highlight,
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

export const Arcs3D = memo(({ mapId }) => {
  const dispatch = useDispatch()
  const appBarId = useSelector(selectAppBarId)
  const arcLayerGeoJson = useSelector(selectArcLayer3DGeoJsonFunc(mapId))
  return (
    <ArcLayer3D
      features={arcLayerGeoJson}
      onClick={({ cave_name: id, cave_obj: obj }) => {
        dispatch(
          openMapModal({
            appBarId,
            data: {
              ...(obj || {}),
              feature: 'arcs',
              type: R.propOr(obj.type, 'name')(obj),
              key: id,
            },
          })
        )
      }}
    />
  )
})
