import * as R from 'ramda'
import { Children, useEffect, useState } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useSelector } from 'react-redux'

import {
  selectTheme,
  selectSplitNodeData,
  selectNodeRange,
  selectTimePath,
  selectEnabledArcs,
  selectTimeProp,
  selectEnabledNodes,
  selectLineData,
  selectResolveTime,
  selectArcRange,
  selectEnabledGeos,
  selectGeoColorRange,
  selectMatchingKeys,
  selectMatchingKeysByType,
  selectGeoTypes,
  selectArcTypes,
  selectLineMatchingKeysByType,
  selectLineMatchingKeys,
} from '../../../data/selectors'
import { HIGHLIGHT_COLOR, LINE_TYPES } from '../../../utils/constants'

import { getScaledColor, getScaledArray, getScaledValue } from '../../../utils'

export const Geos = ({ highlightLayerId }) => {
  const enabledGeos = useSelector(selectEnabledGeos)
  const timePath = useSelector(selectTimePath)
  const resolveTime = useSelector(selectResolveTime)
  const geoColorRange = useSelector(selectGeoColorRange)
  const matchingKeys = useSelector(selectMatchingKeys)
  const matchingKeysByType = useSelector(selectMatchingKeysByType)
  const geoTypes = useSelector(selectGeoTypes)
  const themeType = useSelector(selectTheme)
  const timeProp = useSelector(selectTimeProp)
  const enabledArcs = useSelector(selectEnabledArcs)
  const arcTypes = useSelector(selectArcTypes)
  const lineMatchingKeys = useSelector(selectLineMatchingKeys)
  const lineMatchingKeysByType = useSelector(selectLineMatchingKeysByType)
  const arcRange = useSelector(selectArcRange)

  const [selectedGeos, setSelectedGeos] = useState({})
  const [selectedArcs, setSelectedArcs] = useState({})

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

  const findColor = R.memoizeWith(
    (geoObj) => {
      const colorProp = R.path([geoObj.type, 'colorBy'], enabledGeos)
      const value = timePath(['props', colorProp, 'value'], geoObj)
      return `${geoObj.geoJsonValue}${value}`
    },
    (geoObj) => {
      const colorProp = R.path([geoObj.type, 'colorBy'], enabledGeos)
      const statRange = geoColorRange(geoObj.type, colorProp)
      const colorRange = R.map((prop) =>
        R.pathOr(0, [prop, themeType])(statRange)
      )(['startGradientColor', 'endGradientColor'])
      const value = R.pipe(
        timePath(['props', colorProp, 'value']),
        R.when(R.isNil, R.always('')),
        (s) => s.toString()
      )(geoObj)
      const isCategorical = !R.has('min', statRange)

      return isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0,5)', value, statRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledColor(
            [timeProp('min', statRange), timeProp('max', statRange)],
            colorRange,
            value
          )
    }
  )

  const findLineSize = R.memoizeWith(
    (d) => {
      const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
      const propVal = timePath(['props', sizeProp, 'value'], d)
      return `${R.prop('data_key', d)}${propVal}`
    },
    (d) => {
      const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
      const sizeRange = arcRange(d.type, sizeProp, true)
      const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d))
      return getScaledValue(
        timeProp('min', sizeRange),
        timeProp('max', sizeRange),
        parseFloat(timeProp('startSize', d)),
        parseFloat(timeProp('endSize', d)),
        propVal
      )
    }
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findLineColor = R.memoizeWith(
    (d) => {
      const colorProp = R.path([d.type, 'colorBy'], enabledArcs)
      const propVal = timePath(['props', colorProp, 'value'], d[1])
      return `${R.prop('data_key', d)}${propVal}`
    },
    (d) => {
      const colorProp = R.path([d.type, 'colorBy'], enabledArcs)
      const colorRange = arcRange(d.type, colorProp, false)
      const isCategorical = !R.has('min', colorRange)
      const propVal = R.pipe(
        timePath(['props', colorProp, 'value']),
        R.when(R.isNil, R.always('')),
        (s) => s.toString()
      )(d)

      return isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0)', propVal, colorRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledArray(
            timeProp('min', colorRange),
            timeProp('max', colorRange),
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
            parseFloat(resolveTime(R.path(['props', colorProp, 'value'], d)))
          )
    }
  )

  return Children.toArray(
    R.concat(
      R.pipe(
        R.mapObjIndexed((geoObj, geoJsonValue) => {
          const geoJsonProp = R.path(['geoJson', 'geoJsonProp'])(geoObj)
          const geoType = R.prop('type')(geoObj)
          const filteredFeatures = R.filter(
            (feature) =>
              R.path(['properties', geoJsonProp])(feature) === geoJsonValue
          )(R.pathOr({}, [geoType, 'features'])(selectedGeos))

          const layerId = R.prop('data_key')(geoObj)

          let color = findColor(geoObj)
          if (highlightLayerId === layerId) {
            color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
          }

          return (
            <Source
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: filteredFeatures,
              }}
            >
              <Layer
                id={R.prop('data_key')(geoObj)}
                type="fill"
                paint={{
                  'fill-color': `rgba(${color})`,
                  'fill-opacity': 0.4,
                }}
              />
            </Source>
          )
        }),
        R.values
      )(matchingKeys),
      R.pipe(
        R.mapObjIndexed((geoObj, geoJsonValue) => {
          const geoJsonProp = R.path(['geoJson', 'geoJsonProp'])(geoObj)
          const geoType = R.prop('type')(geoObj)
          const filteredFeatures = R.filter(
            (feature) =>
              R.path(['properties', geoJsonProp])(feature) === geoJsonValue
          )(R.pathOr({}, [geoType, 'features'])(selectedArcs))

          const layerId = R.prop('data_key')(geoObj)

          let color = findLineColor(geoObj)
          if (highlightLayerId === layerId) {
            color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
          }
          const size = findLineSize(geoObj)

          const dashPattern = LINE_TYPES[R.propOr('solid', 'lineBy')(geoObj)]

          return (
            <Source
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: filteredFeatures,
              }}
            >
              <Layer
                id={R.prop('data_key')(geoObj)}
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
                paint={{
                  'line-color': `rgb(${color.join(',')})`,
                  'line-opacity': 0.8,
                  'line-width': size,
                  ...(dashPattern && {
                    'line-dasharray': dashPattern,
                  }),
                }}
              />
            </Source>
          )
        }),
        R.values
      )(lineMatchingKeys)
    )
  )
}

export const Nodes = ({ highlightLayerId }) => {
  const nodeDataSplit = useSelector(selectSplitNodeData)
  const nodeRange = useSelector(selectNodeRange)
  const timePath = useSelector(selectTimePath)
  const timeProp = useSelector(selectTimeProp)
  const legendObjects = useSelector(selectEnabledNodes)
  const themeType = useSelector(selectTheme)

  return Children.toArray(
    R.pipe(
      R.propOr([], true),
      R.mapObjIndexed((obj) => {
        const [id, node] = obj

        const sizeProp = R.path([node.type, 'sizeBy'], legendObjects)
        const sizeRange = nodeRange(node.type, sizeProp, true)
        const sizePropVal = parseFloat(
          timePath(['props', sizeProp, 'value'], node)
        )
        const size = getScaledValue(
          timeProp('min', sizeRange),
          timeProp('max', sizeRange),
          parseFloat(timeProp('startSize', node)),
          parseFloat(timeProp('endSize', node)),
          sizePropVal
        )
        const colorProp = R.path([node.type, 'colorBy'], legendObjects)
        const colorPropVal = R.pipe(
          timePath(['props', colorProp, 'value']),
          R.when(R.isNil, R.always('')),
          (s) => s.toString()
        )(node)
        const colorRange = nodeRange(node.type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        let color = isCategorical
          ? R.map((val) => parseFloat(val))(
              R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
                .replace(/[^\d,.]/g, '')
                .split(',')
            )
          : getScaledArray(
              timeProp('min', colorRange),
              timeProp('max', colorRange),
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
              parseFloat(colorPropVal)
            )
        if (highlightLayerId === id) {
          color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
        }
        const colorString = `rgb(${color.join(',')})`
        return (
          <Source
            type="geojson"
            data={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [node.longitude, node.latitude],
              },
            }}
          >
            <Layer
              id={id}
              type="symbol"
              layout={{
                'icon-image': node.icon,
                'icon-anchor': 'center',
                'icon-pitch-alignment': 'map',
                'icon-size': size / 250,
              }}
              paint={{
                'icon-color': colorString,
              }}
            />
          </Source>
        )
      }),
      R.values
    )(nodeDataSplit)
  )
}
export const Arcs = ({ highlightLayerId }) => {
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const arcData = useSelector(selectLineData)
  const legendObjects = useSelector(selectEnabledArcs)

  return Children.toArray(
    arcData.map(([id, node]) => {
      const sizeProp = R.path([node.type, 'sizeBy'], legendObjects)
      const sizeRange = arcRange(node.type, sizeProp, true)
      const sizePropVal = parseFloat(
        timePath(['props', sizeProp, 'value'], node)
      )
      const size = getScaledValue(
        timeProp('min', sizeRange),
        timeProp('max', sizeRange),
        parseFloat(timeProp('startSize', node)),
        parseFloat(timeProp('endSize', node)),
        sizePropVal
      )
      const colorProp = R.path([node.type, 'colorBy'], legendObjects)
      const colorRange = arcRange(node.type, colorProp, false)
      const isCategorical = !R.has('min', colorRange)
      const colorPropVal = R.pipe(
        timePath(['props', colorProp, 'value']),
        R.when(R.isNil, R.always('')),
        (s) => s.toString()
      )(node)

      let color = isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledArray(
            timeProp('min', colorRange),
            timeProp('max', colorRange),
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
            parseFloat(resolveTime(R.path(['props', colorProp, 'value'], node)))
          )
      if (highlightLayerId === id) {
        color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
      }
      const colorString = `rgb(${color.join(',')})`

      const dashPattern = LINE_TYPES[R.propOr('solid', 'lineBy')(node)]

      return (
        <Source
          type="geojson"
          data={{
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [node.startLongitude, node.startLatitude],
                [node.endLongitude, node.endLatitude],
              ],
            },
          }}
        >
          <Layer
            id={id}
            type="line"
            paint={{
              'line-color': colorString,
              'line-opacity': 0.8,
              'line-width': size,
              ...(dashPattern && {
                'line-dasharray': dashPattern,
              }),
            }}
          />
        </Source>
      )
    })
  )
}
