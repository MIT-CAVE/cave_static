import * as R from 'ramda'
import { Children, useEffect, useState, memo } from 'react'
import { Layer, Source } from 'react-map-gl'
import { useSelector } from 'react-redux'

import {
  selectTheme,
  selectSplitNodeData,
  selectNodeRange,
  selectEnabledArcs,
  selectEnabledNodes,
  selectLineData,
  selectArcRange,
  selectEnabledGeos,
  selectGeoColorRange,
  selectMatchingKeys,
  selectMatchingKeysByType,
  selectGeoTypes,
  selectArcTypes,
  selectLineMatchingKeysByType,
  selectLineMatchingKeys,
  selectNodeClustersAtZoom,
} from '../../../data/selectors'
import { HIGHLIGHT_COLOR, LINE_TYPES } from '../../../utils/constants'

import { getScaledColor, getScaledArray, getScaledValue } from '../../../utils'

export const Geos = memo(({ highlightLayerId }) => {
  const enabledGeos = useSelector(selectEnabledGeos)
  const geoColorRange = useSelector(selectGeoColorRange)
  const matchingKeys = useSelector(selectMatchingKeys)
  const matchingKeysByType = useSelector(selectMatchingKeysByType)
  const geoTypes = useSelector(selectGeoTypes)
  const themeType = useSelector(selectTheme)
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

      return isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0,5)', value, statRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledColor(
            [R.prop('min', statRange), R.prop('max', statRange)],
            colorRange,
            value
          )
    }
  )

  const findLineSize = R.memoizeWith(
    (d) => {
      const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
      const propVal = R.path(['props', sizeProp, 'value'], d)
      return `${R.prop('data_key', d)}${propVal}`
    },
    (d) => {
      const sizeProp = R.path([d.type, 'sizeBy'], enabledArcs)
      const sizeRange = arcRange(d.type, sizeProp, true)
      const propVal = parseFloat(R.path(['props', sizeProp, 'value'], d))
      return getScaledValue(
        R.prop('min', sizeRange),
        R.prop('max', sizeRange),
        parseFloat(R.prop('startSize', d)),
        parseFloat(R.prop('endSize', d)),
        propVal
      )
    }
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findLineColor = R.memoizeWith(
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

      return isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0)', propVal, colorRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledArray(
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

          const id = R.prop('data_key')(geoObj)

          return (
            <Source
              type="geojson"
              key={id}
              id={id}
              data={{
                type: 'FeatureCollection',
                features: filteredFeatures,
              }}
            >
              <Layer
                id={id}
                key={id}
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
          const id = R.prop('data_key')(geoObj)
          const dashPattern = LINE_TYPES[R.propOr('solid', 'lineBy')(geoObj)]
          return (
            <Source
              id={id}
              key={id}
              type="geojson"
              data={{
                type: 'FeatureCollection',
                features: filteredFeatures,
              }}
            >
              <Layer
                id={id}
                key={id}
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
})

export const Nodes = memo(({ highlightLayerId }) => {
  const nodeDataSplit = useSelector(selectSplitNodeData)
  const nodeClusters = useSelector(selectNodeClustersAtZoom)
  const nodeRange = useSelector(selectNodeRange)
  const legendObjects = useSelector(selectEnabledNodes)
  const themeType = useSelector(selectTheme)

  return Children.toArray(
    R.concat(
      R.pipe(
        R.propOr([], false),
        R.mapObjIndexed((obj) => {
          const [id, node] = obj

          const sizeProp = R.path([node.type, 'sizeBy'], legendObjects)
          const sizeRange = nodeRange(node.type, sizeProp, true)
          const sizePropVal = parseFloat(
            R.path(['props', sizeProp, 'value'], node)
          )
          const size = getScaledValue(
            R.prop('min', sizeRange),
            R.prop('max', sizeRange),
            parseFloat(R.prop('startSize', node)),
            parseFloat(R.prop('endSize', node)),
            sizePropVal
          )
          const colorProp = R.path([node.type, 'colorBy'], legendObjects)
          const colorPropVal = R.pipe(
            R.path(['props', colorProp, 'value']),
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
                parseFloat(colorPropVal)
              )
          if (highlightLayerId === id) {
            color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
          }
          const colorString = `rgb(${color.join(',')})`
          return (
            <Source
              id={id}
              key={id}
              type="geojson"
              data={{
                type: 'Feature',
                properties: { cave_obj: node },
                geometry: {
                  type: 'Point',
                  coordinates: [node.longitude, node.latitude],
                },
              }}
            >
              <Layer
                id={id}
                key={id}
                type="symbol"
                layout={{
                  'icon-image': node.icon,
                  'icon-anchor': 'center',
                  'icon-pitch-alignment': 'map',
                  'icon-size': size / 250,
                  'icon-allow-overlap': true,
                }}
                paint={{
                  'icon-color': colorString,
                }}
              />
            </Source>
          )
        }),
        R.values
      )(nodeDataSplit),
      R.pipe(
        R.propOr([], 'data'),
        R.map((group) => {
          const sizeRange = nodeClusters.range[group.properties.type].size
          const sizePropObj = R.path(['properties', 'sizeProp'], group)

          const size = getScaledValue(
            R.prop('min', sizeRange),
            R.prop('max', sizeRange),
            parseFloat(R.prop('startSize', sizePropObj)),
            parseFloat(R.prop('endSize', sizePropObj)),
            parseFloat(sizePropObj.value)
          )

          const nodeType = group.properties.type
          const colorObj = group.properties.colorProp
          const colorDomain = nodeClusters.range[nodeType].color
          const isCategorical = !R.has('min')(colorDomain)
          const value = R.prop('value', colorObj)
          const colorRange = isCategorical
            ? colorObj
            : R.map((prop) =>
                R.pathOr(colorObj[prop], [prop, themeType])(colorObj)
              )(['startGradientColor', 'endGradientColor'])

          const color = isCategorical
            ? R.when(
                R.has(themeType),
                R.prop(themeType)
              )(R.prop(value, colorRange))
                .replace(/[^\d,.]/g, '')
                .split(',')
            : getScaledColor(
                [R.prop('min', colorDomain), R.prop('max', colorDomain)],
                colorRange,
                value
              )
          const id = R.pathOr(
            JSON.stringify(0, 2, R.slice(group.properties.grouped_ids)),
            ['properties', 'id']
          )(group)

          const highlightedColor =
            highlightLayerId === id
              ? color.map((v, i) => v * HIGHLIGHT_COLOR[i])
              : color

          const colorString = `rgb(${highlightedColor.join(',')})`

          return (
            <Source
              id={id}
              type="geojson"
              key={id}
              data={{
                type: 'Feature',
                properties: { cave_obj: group, isCluster: true },
                geometry: {
                  type: 'Point',
                  coordinates: group.geometry.coordinates,
                },
              }}
            >
              <Layer
                key={id}
                id={id}
                type="symbol"
                layout={{
                  'icon-image': group.properties.icon,
                  'icon-anchor': 'center',
                  'icon-pitch-alignment': 'map',
                  'icon-size': size / 250,
                  'icon-allow-overlap': true,
                }}
                paint={{
                  'icon-color': colorString,
                }}
              />
            </Source>
          )
        })
      )(nodeClusters)
    )
  )
})
export const Arcs = memo(({ highlightLayerId }) => {
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const arcData = useSelector(selectLineData)
  const legendObjects = useSelector(selectEnabledArcs)

  return Children.toArray(
    arcData.map(([id, arc]) => {
      const sizeProp = R.path([arc.type, 'sizeBy'], legendObjects)
      const sizeRange = arcRange(arc.type, sizeProp, true)
      const sizePropVal = parseFloat(R.path(['props', sizeProp, 'value'], arc))
      const size = getScaledValue(
        R.prop('min', sizeRange),
        R.prop('max', sizeRange),
        parseFloat(R.prop('startSize', arc)),
        parseFloat(R.prop('endSize', arc)),
        sizePropVal
      )
      const colorProp = R.path([arc.type, 'colorBy'], legendObjects)
      const colorRange = arcRange(arc.type, colorProp, false)
      const isCategorical = !R.has('min', colorRange)
      const colorPropVal = R.pipe(
        R.path(['props', colorProp, 'value']),
        R.when(R.isNil, R.always('')),
        (s) => s.toString()
      )(arc)

      let color = isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0)', colorPropVal, colorRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledArray(
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
            parseFloat(R.path(['props', colorProp, 'value'], arc))
          )
      if (highlightLayerId === id) {
        color = color.map((v, i) => v * HIGHLIGHT_COLOR[i])
      }
      const colorString = `rgb(${color.join(',')})`

      const dashPattern = LINE_TYPES[R.propOr('solid', 'lineBy')(arc)]

      return (
        <Source
          id={id}
          key={id}
          type="geojson"
          data={{
            type: 'Feature',
            properties: { cave_obj: arc },
            geometry: {
              type: 'LineString',
              coordinates: [
                [arc.startLongitude, arc.startLatitude],
                [arc.endLongitude, arc.endLatitude],
              ],
            },
          }}
        >
          <Layer
            id={id}
            key={id}
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
})
