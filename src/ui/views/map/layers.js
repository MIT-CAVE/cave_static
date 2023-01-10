import { PathStyleExtension } from '@deck.gl/extensions'
import { PathLayer, GeoJsonLayer, IconLayer, ArcLayer } from '@deck.gl/layers'
import * as R from 'ramda'
import { useState, useEffect, useCallback } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdDownloading } from 'react-icons/md'
import { useSelector, useDispatch } from 'react-redux'

import { openMapModal } from '../../../data/local/mapSlice'
import {
  selectNodeData,
  selectNodesByType,
  selectLayerById,
  selectTheme,
  selectEnabledGeos,
  selectGeoColorRange,
  selectSettingsIconUrl,
  selectResolveTime,
  selectTimeProp,
  selectArcRange,
  selectNodeRange,
  selectGeoTypes,
  selectTimePath,
  selectMatchingKeys,
  selectMatchingKeysByType,
  selectGroupedEnabledArcs,
  selectAppBarId,
  selectEnabledArcs,
  selectEnabledNodes,
  selectArcData,
} from '../../../data/selectors'
import { layerId } from '../../../utils/enums'
import { store } from '../../../utils/store'

import {
  fetchIcon,
  getScaledArray,
  getScaledColor,
  getScaledValue,
} from '../../../utils'

const getLayerProps = (props) =>
  R.mergeLeft(props, selectLayerById(store.getState(), props.id))

const lineTypes = { solid: [0, 0], dashed: [7, 3], dotted: [2, 2] }

const Get3dArcLayer = () => {
  const dispatch = useDispatch()
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const appBarId = useSelector(selectAppBarId)
  const arcData = R.prop('true', useSelector(selectGroupedEnabledArcs))
  const legendObjects = useSelector(selectEnabledArcs)

  return new ArcLayer(
    getLayerProps({
      id: layerId.ARC_LAYER_3D,
      data: R.values(arcData),
      visible: true,
      opacity: 0.4,
      autoHighlight: true,
      wrapLongitude: true,
      getTilt: (d) => d.tilt,
      greatCircle: false,
      getHeight: (d) => resolveTime(R.propOr(1, 'height', d)),
      getSourcePosition: (d) => [
        resolveTime(d.startLongitude),
        resolveTime(d.startLatitude),
        resolveTime(d.startAltitude),
      ],
      getTargetPosition: (d) => [
        resolveTime(d.endLongitude),
        resolveTime(d.endLatitude),
        resolveTime(d.endAltitude),
      ],
      getSourceColor: (d) => {
        const colorProp = R.path([d.type, 'colorBy'], legendObjects)
        const colorRange = arcRange(d.type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = timePath(['props', colorProp, 'value'], d).toString()

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
      },
      getTargetColor: (d) => {
        const colorProp = R.path([d.type, 'colorBy'], legendObjects)
        const colorRange = arcRange(d.type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = timePath(['props', colorProp, 'value'], d).toString()

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
      },
      widthUnits: 'pixels',
      getWidth: (d) => {
        const sizeProp = R.path([d.type, 'sizeBy'], legendObjects)
        const sizeRange = arcRange(d.type, sizeProp, true)

        return getScaledValue(
          timeProp('min', sizeRange),
          timeProp('max', sizeRange),
          parseFloat(resolveTime(R.prop('startSize', d))),
          parseFloat(resolveTime(R.prop('endSize', d))),
          parseFloat(resolveTime(R.path(['props', sizeProp, 'value'], d)))
        )
      },
      positionFormat: `XY`,
      dashJustified: true,
      pickable: true,
      onClick: (d) => {
        dispatch(
          openMapModal({
            appBarId,
            data: {
              ...R.propOr({}, 'object')(d),
              feature: 'arcs',
              type: R.propOr(d.object.type, 'name')(d),
              key: R.keys(arcData)[R.propOr(0, 'index', d)],
            },
          })
        )
      },
    })
  )
}

const GetArcLayer = () => {
  const dispatch = useDispatch()
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const appBarId = useSelector(selectAppBarId)
  const arcData = useSelector(selectArcData)
  const legendObjects = useSelector(selectEnabledArcs)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findSize = useCallback(
    R.memoizeWith(
      (d) => d[0],
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const sizeRange = arcRange(d[1].type, sizeProp, true)
        const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d[1]))
        return getScaledValue(
          timeProp('min', sizeRange),
          timeProp('max', sizeRange),
          parseFloat(timeProp('startSize', d[1])),
          parseFloat(timeProp('endSize', d[1])),
          propVal
        )
      }
    ),
    [legendObjects, arcData]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (d) => d[0],
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const colorRange = arcRange(d[1].type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = timePath(['props', colorProp, 'value'], d[1]).toString()

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
              parseFloat(
                resolveTime(R.path(['props', colorProp, 'value'], d[1]))
              )
            )
      }
    ),
    [legendObjects, arcData, themeType]
  )
  return new PathLayer(
    getLayerProps({
      id: layerId.ARC_LAYER,
      data: arcData,
      visible: true,
      opacity: 0.4,
      autoHighlight: true,
      wrapLongitude: true,
      getPath: (d) =>
        R.propOr(
          [
            [
              resolveTime(d[1].startLongitude),
              resolveTime(d[1].startLatitude),
              resolveTime(d[1].startAltitude),
            ],
            [
              resolveTime(d[1].endLongitude),
              resolveTime(d[1].endLatitude),
              resolveTime(d[1].endAltitude),
            ],
          ],
          'path',
          d[1]
        ),
      getColor: (d) => findColor(d),
      widthUnits: 'pixels',
      getWidth: (d) => findSize(d),
      getDashArray: (d) => {
        const lineType = R.propOr('solid', 'lineBy')(d[1])
        return lineTypes[lineType]
      },
      dashJustified: true,
      extensions: [new PathStyleExtension({ dash: true })],
      pickable: true,
      onClick: (d) => {
        dispatch(
          openMapModal({
            appBarId,
            data: {
              ...R.pathOr({}, ['object', 1])(d),
              feature: 'arcs',
              type: R.propOr(d.object[1].type, 'name')(d.object[1]),
              key: d.object[0],
            },
          })
        )
      },
    })
  )
}

const GetNodeIconLayer = () => {
  const dispatch = useDispatch()
  const nodeData = useSelector(selectNodeData)
  const nodesByType = useSelector(selectNodesByType)
  const nodeRange = useSelector(selectNodeRange)
  const themeType = useSelector(selectTheme)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const appBarId = useSelector(selectAppBarId)
  const legendObjects = useSelector(selectEnabledNodes)

  const [iconObj, setIconObj] = useState([
    btoa(renderToStaticMarkup(<MdDownloading />)),
  ])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (d) => d[0],
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const propVal = timePath(['props', colorProp, 'value'], d[1]).toString()
        const colorRange = nodeRange(d[1].type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
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
              parseFloat(propVal)
            )
      }
    ),
    [legendObjects, nodesByType, themeType]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findSize = useCallback(
    R.memoizeWith(
      (d) => d[0],
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const sizeRange = nodeRange(d[1].type, sizeProp, true)
        const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d[1]))
        return getScaledValue(
          timeProp('min', sizeRange),
          timeProp('max', sizeRange),
          parseFloat(timeProp('startSize', d[1])),
          parseFloat(timeProp('endSize', d[1])),
          propVal
        )
      }
    ),
    [legendObjects, nodesByType]
  )

  useEffect(() => {
    const setIcons = async () => {
      const icons = new Set()
      R.forEach(
        (d) => icons.add(R.propOr('MdDownloading', 'icon', d)),
        R.unnest(R.values(nodesByType))
      )
      const newIcons = {}
      for (let icon of icons) {
        newIcons[icon] = await fetchIcon(icon, iconUrl)
      }
      const constructed = R.mapObjIndexed(
        (func) => renderToStaticMarkup(func()),
        newIcons
      )
      const parser = new DOMParser()
      const serializer = new XMLSerializer()
      const iconMapping = {}
      // Pack all icons into one svg image for iconAtlas
      const packed = R.reduce(
        (acc, [iconName, svgStr]) => {
          // first icon - use svg wrapper
          if (R.isEmpty(acc)) {
            const group = parser.parseFromString(
              `<g xmlns="http://www.w3.org/2000/svg"></g>`,
              'image/svg+xml'
            ).firstChild
            const svgElem = parser.parseFromString(
              svgStr,
              'image/svg+xml'
            ).firstChild
            group.innerHTML = svgElem.innerHTML
            svgElem.innerHTML = ''
            svgElem.appendChild(group)
            iconMapping[iconName] = {
              x: 0,
              y: 0,
              width: 24,
              height: 24,
              mask: true,
            }
            return [1, svgElem]
          }
          // all subsequent icons - add to existing image
          const group = parser.parseFromString(
            `<g xmlns="http://www.w3.org/2000/svg" transform="translate(${
              acc[0] * 24
            })"></g>`,
            'image/svg+xml'
          ).firstChild
          group.innerHTML = parser.parseFromString(
            svgStr,
            'image/svg+xml'
          ).firstChild.innerHTML

          acc[1].appendChild(group)
          acc[1].setAttribute('viewBox', `0 0 ${acc[0] * 24 + 24} 24`)
          iconMapping[iconName] = {
            x: acc[0] * 24,
            y: 0,
            width: 24,
            height: 24,
            mask: true,
          }
          return [acc[0] + 1, acc[1]]
        },
        [],
        R.toPairs(constructed)
      )
      // Check if any icons to prevent log errors
      if (!R.isEmpty(packed)) {
        // Set dimensions of iconAtlas image
        packed[1].setAttribute('viewBox', `0 0 ${packed[0] * 24 + 24} 24`)
        packed[1].setAttribute('width', `${24 * packed[0] + 24}`)
        packed[1].setAttribute('height', '24')
        setIconObj([btoa(serializer.serializeToString(packed[1])), iconMapping])
      }
    }
    setIcons()
  }, [nodesByType, iconUrl])
  return new IconLayer({
    id: layerId.NODE_ICON_LAYER,
    visible: true,
    data: nodeData,
    iconAtlas: `data:image/svg+xml;base64,${iconObj[0]}`,
    iconMapping: iconObj[1],
    getIcon: (d) => d[1].icon,
    autoHighlight: true,
    getColor: (d) => {
      return findColor(d)
    },
    sizeScale: 1,
    getSize: (d) => {
      return findSize(d)
    },
    getPosition: (d) => [
      resolveTime(d[1].longitude),
      resolveTime(d[1].latitude),
      resolveTime(d[1].altitude + 1),
    ],
    pickable: true,
    onClick: (d) => {
      dispatch(
        openMapModal({
          appBarId,
          data: {
            ...R.pathOr({}, ['object', 1])(d),
            feature: 'nodes',
            type: R.propOr(d.object[1].type, 'name')(d.object[1]),
            key: d.object[0],
          },
        })
      )
    },
  })
}

const GetGeographyLayer = () => {
  const enabledGeos = useSelector(selectEnabledGeos)
  const timePath = useSelector(selectTimePath)
  const geoColorRange = useSelector(selectGeoColorRange)
  const matchingKeys = useSelector(selectMatchingKeys)
  const matchingKeysByType = useSelector(selectMatchingKeysByType)
  const geoTypes = useSelector(selectGeoTypes)
  const themeType = useSelector(selectTheme)
  const timeProp = useSelector(selectTimeProp)
  const appBarId = useSelector(selectAppBarId)

  const dispatch = useDispatch()

  const [selectedGeos, setSelectedGeos] = useState([])

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

  return new GeoJsonLayer({
    id: layerId.GEOGRAPHY_LAYER,
    data: selectedGeos,
    dataTransform: (data) => {
      return R.pipe(
        R.mapObjIndexed((val, key) => {
          const keysOfType = R.pipe(
            R.flip(R.prop)(matchingKeysByType),
            R.keys
          )(key)
          return R.pipe(
            R.prop('features'),
            R.filter((feature) =>
              R.includes(
                R.path(
                  [
                    'properties',
                    R.path([key, 'geoJson', 'geoJsonProp'])(geoTypes),
                  ],
                  feature
                ),
                keysOfType
              )
            ),
            R.map((d) => R.assoc('caveType', key, d))
          )(val)
        }),
        R.values,
        R.reduce(R.concat, [])
      )(data)
    },
    visible: true,
    positionFormat: `XY`,
    opacity: 0.05,
    autoHighlight: true,
    getFillColor: (d) => {
      const geoProp = R.path([d.caveType, 'geoJson', 'geoJsonProp'])(geoTypes)
      const geoObj = R.prop(R.path(['properties', geoProp], d))(matchingKeys)
      const colorProp = R.path([d.caveType, 'colorBy'], enabledGeos)
      const statRange = geoColorRange(geoObj.type, colorProp, false)
      const colorRange = R.map((prop) =>
        R.pathOr(0, [prop, themeType])(statRange)
      )(['startGradientColor', 'endGradientColor'])
      const value = timePath(['props', colorProp, 'value'], geoObj)
      const isCategorical = !R.has('min', statRange)
      const propVal = timePath(['props', colorProp, 'value'], geoObj).toString()

      return isCategorical
        ? R.map((val) => parseFloat(val))(
            R.propOr('rgb(0,0,0)', propVal, statRange)
              .replace(/[^\d,.]/g, '')
              .split(',')
          )
        : getScaledColor(
            [timeProp('min', statRange), timeProp('max', statRange)],
            colorRange,
            value
          )
    },
    pickable: true,
    onClick: (d) => {
      const caveType = R.path(['object', 'caveType'], d)
      const geoProp = R.path([caveType, 'geoJson', 'geoJsonProp'])(geoTypes)
      const geoObj = R.prop(R.path(['object', 'properties', geoProp], d))(
        matchingKeys
      )
      dispatch(
        openMapModal({
          appBarId,
          data: {
            ...geoObj,
            feature: 'geos',
            type: R.propOr('Area', 'name', geoObj),
            key: R.propOr('Area', 'data_key', geoObj),
          },
        })
      )
    },
  })
}

export const getLayers = () => [
  GetGeographyLayer(),
  GetArcLayer(),
  Get3dArcLayer(),
  GetNodeIconLayer(),
]
