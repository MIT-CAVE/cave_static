import { PathStyleExtension } from '@deck.gl/extensions'
import { PathLayer, GeoJsonLayer, IconLayer, ArcLayer } from '@deck.gl/layers'
import * as R from 'ramda'
import { useState, useEffect, useCallback, useRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdDownloading } from 'react-icons/md'
import { useSelector, useDispatch } from 'react-redux'

import { openMapModal } from '../../../data/local/mapSlice'
import {
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
  selectAppBarId,
  selectEnabledArcs,
  selectEnabledNodes,
  selectArcData,
  selectTouchMode,
  selectNodeClustersAtZoom,
  selectLineData,
  selectMapNodes,
} from '../../../data/selectors'
import { layerId } from '../../../utils/enums'
import { store } from '../../../utils/store'

import {
  fetchIcon,
  getScaledArray,
  getScaledColor,
  getScaledValue,
  rgbStrToArray,
} from '../../../utils'

const getLayerProps = (props) =>
  R.mergeLeft(props, selectLayerById(store.getState(), props.id))

const lineTypes = { solid: [0, 0], dashed: [7, 3], dotted: [2, 2] }

const Get3dArcLayer = () => {
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const arcData = useSelector(selectArcData)
  const legendObjects = useSelector(selectEnabledArcs)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findSize = useCallback(
    R.memoizeWith(
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const propVal = timePath(['props', sizeProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const sizeRange = arcRange(d[1].type, sizeProp, true)
        const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d[1]))
        return isNaN(propVal)
          ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
          : getScaledValue(
              timeProp('min', sizeRange),
              timeProp('max', sizeRange),
              parseFloat(timeProp('startSize', d[1])),
              parseFloat(timeProp('endSize', d[1])),
              propVal
            )
      }
    ),
    [legendObjects, arcRange]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const propVal = timePath(['props', colorProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const colorRange = arcRange(d[1].type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = R.pipe(
          timePath(['props', colorProp, 'value']),
          R.when(R.isNil, R.always('')),
          (s) => s.toString()
        )(d[1])

        const nullColor = R.pathOr(
          R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
          ['nullColor', themeType],
          colorRange
        )

        return R.equals('', propVal)
          ? nullColor
          : isCategorical
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
    [legendObjects, themeType, arcRange]
  )

  return new ArcLayer(
    getLayerProps({
      id: layerId.ARC_LAYER_3D,
      data: arcData,
      visible: true,
      opacity: 0.4,
      autoHighlight: true,
      wrapLongitude: true,
      getTilt: (d) => R.propOr(0, 'tilt', d[1]),
      greatCircle: false,
      getHeight: (d) => resolveTime(R.propOr(1, 'height', d[1])),
      getSourcePosition: (d) => [
        resolveTime(d[1].startLongitude),
        resolveTime(d[1].startLatitude),
        resolveTime(d[1].startAltitude),
      ],
      getTargetPosition: (d) => [
        resolveTime(d[1].endLongitude),
        resolveTime(d[1].endLatitude),
        resolveTime(d[1].endAltitude),
      ],
      getSourceColor: (d) => findColor(d),
      getTargetColor: (d) => findColor(d),
      widthUnits: 'pixels',
      getWidth: (d) => findSize(d),
      positionFormat: `XY`,
      dashJustified: true,
      pickable: true,
    })
  )
}

const GetArcLayer = () => {
  const arcRange = useSelector(selectArcRange)
  const themeType = useSelector(selectTheme)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const arcData = useSelector(selectLineData)
  const legendObjects = useSelector(selectEnabledArcs)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findSize = useCallback(
    R.memoizeWith(
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const propVal = timePath(['props', sizeProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const sizeRange = arcRange(d[1].type, sizeProp, true)
        const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d[1]))
        return isNaN(propVal)
          ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
          : getScaledValue(
              timeProp('min', sizeRange),
              timeProp('max', sizeRange),
              parseFloat(timeProp('startSize', d[1])),
              parseFloat(timeProp('endSize', d[1])),
              propVal
            )
      }
    ),
    [legendObjects, arcRange]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const propVal = timePath(['props', colorProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const colorRange = arcRange(d[1].type, colorProp, false)
        const isCategorical = !R.has('min', colorRange)
        const propVal = R.pipe(
          timePath(['props', colorProp, 'value']),
          R.when(R.isNil, R.always('')),
          (s) => s.toString()
        )(d[1])

        const nullColor = R.pathOr(
          R.propOr('rgb(0,0,0)', 'nullColor', colorRange),
          ['nullColor', themeType],
          colorRange
        )

        return R.equals('', propVal)
          ? nullColor
          : isCategorical
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
    [legendObjects, themeType, arcRange]
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
      dashGapPickable: false,
      extensions: [new PathStyleExtension({ dash: true })],
      pickable: true,
    })
  )
}

const GetNodeIconLayer = () => {
  const nodeData = useSelector(selectMapNodes)
  const nodeClusters = useSelector(selectNodeClustersAtZoom)
  const nodesByType = useSelector(selectNodesByType)
  const nodeRange = useSelector(selectNodeRange)
  const themeType = useSelector(selectTheme)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const resolveTime = useSelector(selectResolveTime)
  const timeProp = useSelector(selectTimeProp)
  const timePath = useSelector(selectTimePath)
  const legendObjects = useSelector(selectEnabledNodes)

  const [iconObj, setIconObj] = useState([
    btoa(renderToStaticMarkup(<MdDownloading />)),
  ])
  const [previousIcons, setPreviousIcons] = useState(new Set())

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const propVal = timePath(['props', colorProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const colorProp = R.path([d[1].type, 'colorBy'], legendObjects)
        const value = timePath(['props', colorProp, 'value'])(d[1])
        const statRange = nodeRange(d[1].type, colorProp, false)
        const isCategorical = !R.has('min', statRange)
        const colorRange = isCategorical
          ? statRange
          : R.map((prop) =>
              R.pathOr(statRange[prop], [prop, themeType])(statRange)
            )(['startGradientColor', 'endGradientColor'])
        const nullColor = R.pathOr(
          R.propOr('rgb(0,0,0)', 'nullColor', statRange),
          ['nullColor', themeType],
          statRange
        )
        return R.isNil(value)
          ? rgbStrToArray(nullColor)
          : isCategorical
          ? rgbStrToArray(
              R.when(
                R.has(themeType),
                R.prop(themeType)
              )(timeProp(value, colorRange))
            )
          : getScaledColor(
              [timeProp('min', statRange), timeProp('max', statRange)],
              colorRange,
              value
            )
      }
    ),
    [legendObjects, themeType, nodeRange]
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findSize = useCallback(
    R.memoizeWith(
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const propVal = timePath(['props', sizeProp, 'value'], d[1])
        return `${d[0]}${propVal}`
      },
      (d) => {
        const sizeProp = R.path([d[1].type, 'sizeBy'], legendObjects)
        const sizeRange = nodeRange(d[1].type, sizeProp, true)
        const propVal = parseFloat(timePath(['props', sizeProp, 'value'], d[1]))
        return isNaN(propVal)
          ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
          : getScaledValue(
              timeProp('min', sizeRange),
              timeProp('max', sizeRange),
              parseFloat(timeProp('startSize', d[1])),
              parseFloat(timeProp('endSize', d[1])),
              propVal
            )
      }
    ),
    [legendObjects, nodeRange]
  )

  const getSvgResolution = R.pipe(
    (elem) => elem.getAttribute('viewBox'),
    R.split(' '),
    R.reduce(R.max, 0)
  )

  const createGroup = (position, resolution, scale, parser) => {
    return parser.parseFromString(
      `<g xmlns="http://www.w3.org/2000/svg" transform="translate(${
        // translate horizontally to prevent overlap
        position * resolution
      }) scale(${scale},${scale})"></g>`,
      'image/svg+xml'
    ).firstChild
  }

  const cloneAttributes = (target, source) => {
    const attributesNotCloned = new Set(['width, height, viewbox'])
    const sourceAttributes = [...source.attributes]
    sourceAttributes.forEach((attr) => {
      if (!attributesNotCloned.has(attr.nodeName))
        target.setAttribute(attr.nodeName, attr.nodeValue)
    })
  }

  useEffect(() => {
    const setIcons = async () => {
      // Set desired render resolution
      const iconResolution = 144
      // Offset prevents Icon collisions
      const groupOffset = iconResolution + 15
      const icons = new Set()
      R.forEach(
        (d) => icons.add(R.propOr('MdDownloading', 'icon', d)),
        R.unnest(R.values(nodesByType))
      )
      if ([...icons].every((x) => previousIcons.has(x))) return
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
            const svgElem = parser.parseFromString(
              svgStr,
              'image/svg+xml'
            ).firstChild
            // scale group to correct render resolution
            const scale = iconResolution / getSvgResolution(svgElem)
            const group = createGroup(0, groupOffset, scale, parser)
            // move svg data to group
            group.innerHTML = svgElem.innerHTML
            cloneAttributes(group, svgElem)
            svgElem.innerHTML = ''
            // add group to image
            svgElem.appendChild(group)
            // add mapping
            iconMapping[iconName] = {
              x: 0,
              y: 0,
              width: iconResolution,
              height: iconResolution,
              mask: true,
            }
            return [1, svgElem]
          }
          // all subsequent icons - add to existing image
          const iconElem = parser.parseFromString(
            svgStr,
            'image/svg+xml'
          ).firstChild
          const scale = iconResolution / getSvgResolution(iconElem)
          const group = createGroup(acc[0], groupOffset, scale, parser)
          // take svg data from icon - put in group
          group.innerHTML = iconElem.innerHTML
          cloneAttributes(group, iconElem)
          // add group to existing image
          acc[1].appendChild(group)
          // update image size
          acc[1].setAttribute(
            'viewBox',
            `0 0 ${acc[0] * iconResolution + iconResolution} ${iconResolution}`
          )
          // add new image to mapping
          iconMapping[iconName] = {
            x: acc[0] * groupOffset,
            y: 0,
            width: iconResolution,
            height: iconResolution,
            mask: true,
          }
          // acc becomes [numIcons, packedImage]
          return [acc[0] + 1, acc[1]]
        },
        [],
        R.toPairs(constructed)
      )
      // Check if icons present to prevent log errors
      if (!R.isEmpty(packed)) {
        // Set dimensions of iconAtlas image
        packed[1].setAttribute(
          'viewBox',
          `0 0 ${packed[0] * groupOffset + groupOffset} ${iconResolution}`
        )
        packed[1].setAttribute(
          'width',
          `${groupOffset * packed[0] + groupOffset}`
        )
        packed[1].setAttribute('height', iconResolution)
        setPreviousIcons(icons)
        setIconObj([btoa(serializer.serializeToString(packed[1])), iconMapping])
      }
    }
    setIcons()
  }, [nodesByType, iconUrl, previousIcons, getSvgResolution])

  return [
    new IconLayer({
      id: layerId.NODE_ICON_LAYER,
      visible: true,
      data: nodeData,
      iconAtlas: `data:image/svg+xml;base64,${iconObj[0]}`,
      iconMapping: iconObj[1],
      autoHighlight: true,
      sizeScale: 1,
      pickable: true,
      getIcon: (d) => d[1].icon,
      getColor: (d) => {
        return findColor(d)
      },
      getSize: (d) => {
        return findSize(d)
      },
      getPosition: (d) => [
        resolveTime(d[1].longitude),
        resolveTime(d[1].latitude),
        resolveTime(d[1].altitude + 1),
      ],
    }),
    new IconLayer({
      id: layerId.NODE_ICON_CLUSTER_LAYER,
      visible: true,
      data: nodeClusters.data,
      iconAtlas: `data:image/svg+xml;base64,${iconObj[0]}`,
      iconMapping: iconObj[1],
      autoHighlight: true,
      sizeScale: 1,
      pickable: true,
      getIcon: (d) => d.properties.icon,
      getColor: (d) => {
        const nodeType = d.properties.type
        const colorObj = d.properties.colorProp
        const colorDomain = nodeClusters.range[nodeType].color
        const isCategorical = !R.has('min')(colorDomain)
        const value = timeProp('value', colorObj)
        const colorRange = isCategorical
          ? colorObj
          : R.map((prop) =>
              R.pathOr(colorObj[prop], [prop, themeType])(colorObj)
            )(['startGradientColor', 'endGradientColor'])

        return isCategorical
          ? rgbStrToArray(
              R.when(
                R.has(themeType),
                R.prop(themeType)
              )(timeProp(value, colorRange))
            )
          : getScaledColor(
              [timeProp('min', colorDomain), timeProp('max', colorDomain)],
              colorRange,
              value
            )
      },
      getSize: (d) => {
        const nodeType = d.properties.type
        const sizeObj = d.properties.sizeProp
        const sizeDomain = nodeClusters.range[nodeType].size
        return getScaledValue(
          timeProp('min', sizeDomain),
          timeProp('max', sizeDomain),
          parseFloat(timeProp('startSize', sizeObj)),
          parseFloat(timeProp('endSize', sizeObj)),
          timeProp('value', sizeObj)
        )
      },
      getPosition: (d) => R.path(['geometry', 'coordinates'], d),
    }),
  ]
}

const GetGeographyLayer = (openGeo) => {
  const enabledGeos = useSelector(selectEnabledGeos)
  const timePath = useSelector(selectTimePath)
  const geoColorRange = useSelector(selectGeoColorRange)
  const matchingKeys = useSelector(selectMatchingKeys)
  const matchingKeysByType = useSelector(selectMatchingKeysByType)
  const geoTypes = useSelector(selectGeoTypes)
  const themeType = useSelector(selectTheme)
  const timeProp = useSelector(selectTimeProp)
  const appBarId = useSelector(selectAppBarId)
  const touchMode = useSelector(selectTouchMode)

  const currentTimeout = useRef()

  const dispatch = useDispatch()

  const [selectedGeos, setSelectedGeos] = useState([])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const findColor = useCallback(
    R.memoizeWith(
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
        const nullColor = R.pathOr(
          R.propOr('rgb(255,0,0)', 'nullColor', statRange),
          ['nullColor', themeType],
          statRange
        )
        return R.equals('', value)
          ? rgbStrToArray(nullColor)
          : isCategorical
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
    ),
    [enabledGeos, themeType, geoColorRange]
  )

  const onClick = useCallback(
    (d) => {
      if (!openGeo(d)) return false
      else if (R.pipe(R.prop('object'), R.isNil)(d)) return true
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
    [appBarId, dispatch, geoTypes, matchingKeys, openGeo]
  )

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
      return findColor(geoObj)
    },
    pickable: true,
    onClick: onClick,
    onDragStart: () => {
      // Cancel opening modal if dragging map
      currentTimeout.current
        ? clearTimeout(currentTimeout.current)
        : R.identity()
    },
    onHover: (d) => {
      currentTimeout.current = touchMode
        ? setTimeout(() => onClick(d), 100)
        : R.F
    },
    updateTriggers: {
      onHover: [touchMode],
    },
  })
}

export const getLayers = (openGeo) => [
  GetGeographyLayer(openGeo),
  GetArcLayer(),
  Get3dArcLayer(),
  GetNodeIconLayer(),
]
