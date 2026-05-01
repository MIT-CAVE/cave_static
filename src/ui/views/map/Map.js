import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdDownloading } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { Geos, Arcs, Nodes, Arcs3D, IncludedGeos } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'
import useMapApi, { MapContext } from './useMapApi'

import { viewportUpdate, viewportRotate } from '../../../data/local/mapSlice'
import {
  selectSettingsIconUrl,
  selectGroupedEnabledArcsFunc,
  selectMergedGeos,
  selectCurrentMapProjectionFunc,
  selectDemoMode,
  selectDemoSettings,
  selectViewportsByMap,
  selectAllNodeIcons,
  selectMapboxToken,
  selectMapNamesDraggable,
} from '../../../data/selectors'
import {
  DARK_GLOBE_FOG,
  DARK_SKY_SPEC,
  ICON_RESOLUTION,
  LIGHT_GLOBE_FOG,
  LIGHT_SKY_SPEC,
} from '../../../utils/constants'
import { layerId } from '../../../utils/enums'
import { useMutateStateWithSync } from '../../../utils/hooks'
import { getSvgMarkup } from '../../../utils/svgBuilder'
import MapNameDraggable from '../../draggables/MapNameDraggable'

import { fetchIcon } from '../../../utils'

import 'mapbox-gl/dist/mapbox-gl.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const Map = ({ mapId }) => {
  const [iconData, setIconData] = useState({})
  const mapRef = useRef(null)
  const highlight = useRef(null)
  const containerRef = useRef(null)
  const demoInterval = useRef(-1)

  const viewport = useSelector(selectViewportsByMap)[mapId]
  const currentMapProjectionFunc = useSelector(selectCurrentMapProjectionFunc)
  const groupedEnabledArcsFunc = useSelector(selectGroupedEnabledArcsFunc)
  const geosData = useSelector(selectMergedGeos)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const demoMode = useSelector(selectDemoMode)
  const demoSettings = useSelector(selectDemoSettings)
  const nodeIcons = useSelector(selectAllNodeIcons)
  const mapboxToken = useSelector(selectMapboxToken)
  const draggable = useSelector(selectMapNamesDraggable)
  const dispatch = useDispatch()

  const [currentViewport, setCurrentViewport] = useState(viewport)

  const arcData = useMemo(
    () => R.pipe(groupedEnabledArcsFunc, R.propOr({}, 'geoJson'))(mapId),
    [groupedEnabledArcsFunc, mapId]
  )

  const interactiveLayerIds = useMemo(() => R.values(layerId), [])

  const {
    ReactMapGl,
    isDarkStyle,
    isMapboxSelected,
    mapStyle,
    mapStyleOption,
  } = useMapApi(mapId)

  const clearDemoInterval = useCallback(() => {
    if (demoInterval.current !== -1) {
      clearInterval(demoInterval.current)
      demoInterval.current = -1
    }
  }, [])

  useEffect(() => {
    if (demoMode) {
      if (demoInterval.current === -1) {
        const rate = R.pathOr(0.15, [mapId, 'scrollSpeed'], demoSettings)
        dispatch(viewportRotate({ mapId, rate, sync: false }))
        demoInterval.current = setInterval(
          () => dispatch(viewportRotate({ mapId, rate, sync: false })),
          13
        )
      }
    } else {
      clearDemoInterval()
    }
    return clearDemoInterval
  }, [clearDemoInterval, demoMode, demoSettings, mapId, dispatch])

  useEffect(() => {
    const iconsToLoad = [
      ...new Set(R.without(R.keys(iconData))(nodeIcons(mapId))),
    ]
    R.forEach(async (iconName) => {
      const iconComponent =
        iconName === 'MdDownloading'
          ? MdDownloading
          : await fetchIcon(iconName, iconUrl)
      const svgMarkup = getSvgMarkup(iconComponent)
      const iconImage = new Image(ICON_RESOLUTION, ICON_RESOLUTION)
      iconImage.onload = () => {
        setIconData(R.assoc(iconName, iconImage))
      }
      iconImage.src = `data:image/svg+xml;base64,${window.btoa(svgMarkup)}`
    })(iconsToLoad)
  }, [iconUrl, iconData, nodeIcons, mapId])

  const loadSkyAndFog = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map || !map.isStyleLoaded()) return

    if (isMapboxSelected) {
      const defaultFog = isDarkStyle ? DARK_GLOBE_FOG : LIGHT_GLOBE_FOG
      map.setFog(mapStyleOption?.fog ?? mapStyle?.fog ?? defaultFog)
    } else {
      const defaultSky = isDarkStyle ? DARK_SKY_SPEC : LIGHT_SKY_SPEC
      map.setSky(mapStyleOption?.sky ?? mapStyle?.sky ?? defaultSky)
    }
  }, [
    isDarkStyle,
    isMapboxSelected,
    mapStyle?.fog,
    mapStyle?.sky,
    mapStyleOption?.fog,
    mapStyleOption?.sky,
  ])

  const loadIconsToStyle = useCallback(() => {
    if (!mapRef.current) return
    R.forEachObjIndexed((iconImage, iconName) => {
      if (!mapRef.current.hasImage(iconName)) {
        mapRef.current.addImage(iconName, iconImage, { sdf: true })
      }
    }, iconData)
  }, [iconData])

  useEffect(() => {
    loadIconsToStyle()
  }, [loadIconsToStyle])

  const getFeatureFromEvent = useCallback(
    (e) => {
      const clickedNode = R.find((feature) =>
        R.equals(feature.layer.type, 'symbol')
      )(e.features)
      const isCluster =
        R.isNotNil(clickedNode) &&
        R.pathOr(false, ['properties', 'cave_isCluster'], clickedNode)
      const clickedArc = R.find((feature) =>
        R.equals(feature.layer.type, 'line')
      )(e.features)
      const clickedGeo = R.find((feature) =>
        R.equals(feature.layer.type, 'fill')
      )(e.features)
      const topFeature = R.isNotNil(clickedNode)
        ? [
            clickedNode.properties.cave_name,
            'nodes',
            isCluster
              ? R.prop('properties')(
                  JSON.parse(clickedNode.properties.cave_obj)
                )
              : JSON.parse(clickedNode.properties.cave_obj),
            clickedNode['id'],
            clickedNode['source'],
          ]
        : R.isNotNil(clickedArc)
          ? [
              clickedArc.properties.cave_name,
              'arcs',
              R.hasPath(['properties', 'cave_obj'])(clickedArc)
                ? JSON.parse(clickedArc.properties.cave_obj)
                : R.pathOr(
                    {},
                    JSON.parse(clickedArc.properties.cave_name),
                    arcData
                  ),
              clickedArc['id'],
              clickedArc['source'],
            ]
          : R.isNotNil(clickedGeo)
            ? [
                clickedGeo.properties.cave_name,
                'geos',
                R.pathOr(
                  {},
                  JSON.parse(clickedGeo.properties.cave_name),
                  geosData
                ),
                clickedGeo['id'],
                clickedGeo['source'],
              ]
            : null

      return topFeature
      // return [id, feature, obj]
    },
    [arcData, geosData]
  )

  const {
    latitude,
    longitude,
    zoom,
    pitch,
    bearing,
    minZoom,
    maxZoom,
    minPitch,
    maxPitch,
    minBearing,
    maxBearing,
    padding,
  } = viewport

  useEffect(() => {
    // Avoid using the `viewport` object directly to prevent
    // redundant updates and a brief viewport flicker caused
    // by the same values wrapped in a new object reference.
    setCurrentViewport(
      R.mergeLeft({
        latitude,
        longitude,
        zoom,
        pitch,
        bearing,
        minZoom,
        maxZoom,
        minPitch,
        maxPitch,
        minBearing,
        maxBearing,
        padding,
      })
    )
  }, [
    bearing,
    latitude,
    longitude,
    maxBearing,
    maxPitch,
    maxZoom,
    minBearing,
    minPitch,
    minZoom,
    padding,
    pitch,
    zoom,
  ])

  // useEffect(() => {
  //   setCurrentViewport(viewport)
  //   // Workaround (via JSON.stringify) to prevent redundant
  //   // updates and a brief viewport flicker caused by the
  //   // same values wrapped in a new object reference.
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [JSON.stringify(viewport)])

  const handleMove = useCallback((e) => {
    if (e.viewState.zoom === 0) return // Prevents setting incorrect viewport on load
    setCurrentViewport(e.viewState)
  }, [])

  const handleMoveEnd = useCallback(
    (e) => {
      if (e.viewState.zoom === 0) return // Prevents setting incorrect viewport on load

      dispatch(viewportUpdate({ viewport: e.viewState, mapId, sync: false }))
    },
    [dispatch, mapId]
  )

  const handleMouseMove = useCallback(
    (e) => {
      if (!mapRef.current) return

      const canvas = mapRef.current.getCanvas()
      const featureObj = getFeatureFromEvent(e)
      if (R.isNotNil(highlight.current)) {
        mapRef.current.setFeatureState(highlight.current, { hover: false })
        highlight.current = null
      }
      if (!featureObj) {
        if (canvas.style.cursor !== 'auto') canvas.style.cursor = 'auto'
      } else {
        const id = featureObj[3]
        const source = featureObj[4]
        mapRef.current.setFeatureState({ source, id }, { hover: true })
        highlight.current = { source, id }
        if (canvas.style.cursor === 'auto') canvas.style.cursor = 'pointer'
      }
    },
    [getFeatureFromEvent]
  )

  const handleClick = useMutateStateWithSync(
    (e) => {
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) return

      const [id, feature, obj] = featureObj
      if (R.isNotNil(highlight.current)) {
        mapRef.current.setFeatureState(highlight.current, { hover: false })
        highlight.current = null
      }

      return {
        path: ['panes', 'paneState', 'center'],
        value: {
          open: {
            ...(obj || {}),
            key: id,
            mapId,
            feature,
            type: obj?.name || obj?.type,
          },
          type: 'feature',
        },
      }
    },
    [getFeatureFromEvent, mapId]
  )

  const handleMouseOver = useCallback(() => {
    if (R.isNotNil(highlight.current)) {
      mapRef.current.setFeatureState(highlight.current, { hover: false })
      highlight.current = null
    }
  }, [])

  const handleRender = useCallback(() => {
    // Mapbox GL doesn't resize properly without this. MapLibre fires onMove constantly if resize is fired
    // Checking if token is provided to prevents both issues
    isMapboxSelected && mapRef.current?.resize()
  }, [isMapboxSelected])

  const handleStyleData = useCallback(() => {
    loadIconsToStyle()
    loadSkyAndFog()
  }, [loadSkyAndFog, loadIconsToStyle])

  useEffect(() => {
    document.addEventListener('clearHighlight', handleMouseOver, false)
    return () =>
      document.removeEventListener('clearHighlight', handleMouseOver, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      <MapContext.Provider value={{ mapId, mapRef, containerRef }}>
        {draggable.open && <MapNameDraggable {...{ mapId }} />}
        <MapControls {...{ mapId }} />
        <ReactMapGl
          ref={mapRef}
          hash="map"
          container="map"
          style={
            !isMapboxSelected && {
              backgroundColor: isDarkStyle ? '#1a1a1a' : '#dfe7ef',
            }
          }
          mapboxAccessToken={isMapboxSelected && mapboxToken}
          projection={currentMapProjectionFunc(mapId)}
          {...{ mapStyle, interactiveLayerIds, ...currentViewport }}
          onClick={handleClick}
          onData={loadSkyAndFog} // TODO: Remove this and go back to `setTimeout`
          onLoad={loadSkyAndFog}
          onMouseMove={handleMouseMove}
          onMouseOver={handleMouseOver}
          onMove={handleMove}
          onMoveEnd={handleMoveEnd}
          onRender={handleRender}
          onStyleData={handleStyleData}
        >
          <Geos />
          <IncludedGeos />
          <Arcs />
          <Nodes />
          <Arcs3D />
          {/* `MapPortal` is injected here */}
          <div ref={containerRef} />
        </ReactMapGl>

        <MapModal />
        <MapLegend />
      </MapContext.Provider>
    </Box>
  )
}
Map.propTypes = { mapId: PropTypes.string }

export default Map
