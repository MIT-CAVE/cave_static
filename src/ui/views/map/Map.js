import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MdDownloading } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'

import { Geos, Arcs, Nodes, Arcs3D, MapLayers } from './layers'
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
  selectNodeTypeKeys,
  selectArcTypeKeys,
  selectGeoTypeKeys,
} from '../../../data/selectors'
import { DEFAULT_VIEWPORT, ICON_RESOLUTION } from '../../../utils/constants'
import { useMutateStateWithSync } from '../../../utils/hooks'
import { getSvgMarkup } from '../../../utils/svgBuilder'
import MapNameDraggable from '../../draggables/MapNameDraggable'

import { fetchIcon } from '../../../utils'

import 'mapbox-gl/dist/mapbox-gl.css'

const Map = ({ mapId }) => {
  const [iconData, setIconData] = useState({})
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef(null)
  if (typeof window !== 'undefined') {
    window.__maps = window.__maps || {}
    window.__maps[mapId] = mapRef
  }
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

  const nodeTypes = useSelector(selectNodeTypeKeys)
  const arcTypes = useSelector(selectArcTypeKeys)
  const geoTypes = useSelector(selectGeoTypeKeys)

  const interactiveLayerIds = useMemo(() => {
    const ids = []
    geoTypes.forEach((type) => {
      ids.push(`geographyLayer-${mapId}-${type}`)
      ids.push(`includedGeographyLayer-${mapId}-${type}`)
    })
    arcTypes.forEach((type) => {
      ids.push(`multiArcLayerSolid-${mapId}-${type}`)
      ids.push(`arcLayerSolid-${mapId}-${type}`)
    })
    nodeTypes.forEach((type) => {
      ids.push(`nodeIconLayer-${mapId}-${type}`)
    })
    return ids
  }, [geoTypes, arcTypes, nodeTypes, mapId])

  const { ReactMapGl, mapStyle, fog } = useMapApi(mapId)

  useEffect(() => {
    setMapLoaded(false)
  }, [mapStyle])

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

  const PLACEHOLDER_IMAGE = useMemo(
    () => ({
      width: ICON_RESOLUTION,
      height: ICON_RESOLUTION,
      data: new Uint8Array(ICON_RESOLUTION * ICON_RESOLUTION * 4),
    }),
    []
  )

  const iconDataRef = useRef({})

  const loadSkyAndFog = useCallback(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map) return
    if (!map.isStyleLoaded || !map.isStyleLoaded()) return

    try {
      map.setFog?.(fog)
    } catch (e) {
      // Ignore
    }
  }, [fog])

  const loadIconsToStyle = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap ? mapRef.current.getMap() : mapRef.current
    if (!map || !map.isStyleLoaded || !map.isStyleLoaded()) return
    try {
      const allIcons = nodeIcons(mapId)
      allIcons.forEach((iconName) => {
        if (!map.hasImage(iconName)) {
          const img = iconDataRef.current[iconName] || PLACEHOLDER_IMAGE
          try {
            map.addImage(iconName, img, { sdf: true })
          } catch (e) {
            // Ignore
          }
        }
      })
    } catch (e) {
      // Ignore
    }
  }, [mapId, nodeIcons, PLACEHOLDER_IMAGE])

  useEffect(() => {
    const iconsToLoad = [
      ...new Set(R.without(R.keys(iconDataRef.current))(nodeIcons(mapId))),
    ]
    iconsToLoad.forEach(async (iconName) => {
      try {
        const iconComponent =
          iconName === 'MdDownloading'
            ? MdDownloading
            : await fetchIcon(iconName, iconUrl)
        const svgMarkup = getSvgMarkup(iconComponent)
        const iconImage = new Image(ICON_RESOLUTION, ICON_RESOLUTION)
        iconImage.onload = () => {
          iconDataRef.current[iconName] = iconImage
          setIconData((prev) => ({ ...prev, [iconName]: iconImage }))
          const map = mapRef.current?.getMap
            ? mapRef.current.getMap()
            : mapRef.current
          if (map && map.isStyleLoaded && map.isStyleLoaded()) {
            try {
              if (map.hasImage(iconName)) {
                map.updateImage(iconName, iconImage)
              } else {
                map.addImage(iconName, iconImage, { sdf: true })
              }
            } catch (e) {
              // Ignore
            }
          }
        }
        iconImage.src = `data:image/svg+xml;base64,${window.btoa(svgMarkup)}`
      } catch (e) {
        // Ignore
      }
    })
  }, [iconUrl, nodeIcons, mapId])

  const handleLoad = useCallback(() => {
    loadIconsToStyle()
    loadSkyAndFog()
    setMapLoaded(true)
  }, [loadSkyAndFog, loadIconsToStyle])

  useEffect(() => {
    loadIconsToStyle()
  }, [iconData, loadIconsToStyle])

  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map) return

    loadSkyAndFog()

    const handleStyleLoad = () => {
      loadSkyAndFog()
    }
    const handleStyleData = () => {
      loadSkyAndFog()
    }

    map.on('style.load', handleStyleLoad)
    map.on('styledata', handleStyleData)

    return () => {
      map.off('style.load', handleStyleLoad)
      map.off('styledata', handleStyleData)
    }
  }, [loadSkyAndFog, mapLoaded])

  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (map && !mapLoaded) {
      setMapLoaded(true)
    }
  }, [mapLoaded])

  useEffect(() => {
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (!map) return

    const handleImageMissing = (e) => {
      const iconName = e.id
      const iconImage = iconDataRef.current[iconName] || PLACEHOLDER_IMAGE
      try {
        if (!map.hasImage(iconName)) {
          map.addImage(iconName, iconImage, { sdf: true })
        }
      } catch (err) {
        // Ignore
      }
    }

    map.on('styleimagemissing', handleImageMissing)
    return () => {
      map.off('styleimagemissing', handleImageMissing)
    }
  }, [mapLoaded, PLACEHOLDER_IMAGE])

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
  } = viewport || DEFAULT_VIEWPORT

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
        try {
          if (mapRef.current.getSource?.(highlight.current.source)) {
            mapRef.current.setFeatureState(highlight.current, { hover: false })
          }
        } catch (err) {
          // Ignore
        }
        highlight.current = null
      }
      if (!featureObj) {
        if (canvas.style.cursor !== 'auto') canvas.style.cursor = 'auto'
      } else {
        const id = featureObj[3]
        const source = featureObj[4]
        try {
          if (mapRef.current.getSource?.(source)) {
            mapRef.current.setFeatureState({ source, id }, { hover: true })
            highlight.current = { source, id }
          }
        } catch (err) {
          // Ignore
        }
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
        try {
          if (mapRef.current?.getSource?.(highlight.current.source)) {
            mapRef.current.setFeatureState(highlight.current, { hover: false })
          }
        } catch (err) {
          // Ignore
        }
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
      try {
        if (mapRef.current?.getSource?.(highlight.current.source)) {
          mapRef.current.setFeatureState(highlight.current, { hover: false })
        }
      } catch (err) {
        // Ignore
      }
      highlight.current = null
    }
  }, [])

  const handleStyleData = useCallback(() => {
    loadIconsToStyle()
    loadSkyAndFog()
    const map = mapRef.current?.getMap
      ? mapRef.current.getMap()
      : mapRef.current
    if (map && map.getStyle && map.getStyle()) {
      setMapLoaded(true)
    }
  }, [loadSkyAndFog, loadIconsToStyle])

  useEffect(() => {
    document.addEventListener('clearHighlight', handleMouseOver, false)
    return () =>
      document.removeEventListener('clearHighlight', handleMouseOver, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const contextValue = useMemo(
    () => ({ mapId, mapRef, containerRef, mapLoaded }),
    [mapId, mapLoaded]
  )

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      <MapContext.Provider value={contextValue}>
        {draggable.open && <MapNameDraggable {...{ mapId }} />}
        <MapControls {...{ mapId }} />
        <ReactMapGl
          ref={mapRef}
          hash="map"
          container="map"
          mapboxAccessToken={mapboxToken}
          projection={currentMapProjectionFunc(mapId)}
          fog={fog}
          {...{ mapStyle, interactiveLayerIds, ...currentViewport }}
          onClick={handleClick}
          onLoad={handleLoad}
          onMouseMove={handleMouseMove}
          onMouseOver={handleMouseOver}
          onMove={handleMove}
          onMoveEnd={handleMoveEnd}
          onStyleData={handleStyleData}
        >
          <MapLayers />
          <Geos />
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
