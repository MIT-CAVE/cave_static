import { Container, Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdDownloading } from 'react-icons/md'
import ReactMapboxGL from 'react-map-gl'
import ReactMapLibreGL from 'react-map-gl/maplibre'
import { useDispatch, useSelector } from 'react-redux'

import { getDefaultFog, getDefaultStyleId } from '.'
import { Geos, Arcs, Nodes, Arcs3D } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'

import { mutateLocal } from '../../../data/local'
import { viewportUpdate, viewportRotate } from '../../../data/local/mapSlice'
import {
  selectSettingsIconUrl,
  selectCurrentMapStyleFunc,
  selectMapStyleOptions,
  selectGroupedEnabledArcsFunc,
  selectMergedGeos,
  selectCurrentMapProjectionFunc,
  selectDemoMode,
  selectDemoSettings,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
  selectViewportsByMap,
  selectMapData,
  selectAllNodeIcons,
  selectSync,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, ICON_RESOLUTION } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { fetchIcon, includesPath } from '../../../utils'

const Map = ({ mapboxToken, mapId }) => {
  const dispatch = useDispatch()
  const viewport = useSelector(selectViewportsByMap)[mapId]
  const mapStyle = useSelector(selectCurrentMapStyleFunc)(mapId)
  const mapProjection = useSelector(selectCurrentMapProjectionFunc)(mapId)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const arcData = R.propOr(
    {},
    'geoJson'
  )(useSelector(selectGroupedEnabledArcsFunc)(mapId))
  const geosData = useSelector(selectMergedGeos)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const demoMode = useSelector(selectDemoMode)
  const demoSettings = useSelector(selectDemoSettings)
  const mapData = useSelector(selectMapData)
  const nodeIcons = useSelector(selectAllNodeIcons)
  const sync = useSelector(selectSync)
  const [iconData, setIconData] = useState({})
  const [mapStyleSpec, setMapStyleSpec] = useState(undefined)
  const mapExists = R.has(mapId, mapData)

  const isMapboxTokenProvided = R.isNotNil(mapboxToken) && mapboxToken !== ''
  const ReactMapGL = isMapboxTokenProvided ? ReactMapboxGL : ReactMapLibreGL

  const mapRef = useRef(false)
  const highlight = useRef(null)

  const demoInterval = useRef(-1)
  useEffect(() => {
    const rate = R.pathOr(0.15, [mapId, 'scrollSpeed'], demoSettings)
    if (demoMode && demoInterval.current === -1) {
      dispatch(viewportRotate({ mapId, rate }))
      demoInterval.current = setInterval(
        () => dispatch(viewportRotate({ mapId, rate })),
        13
      )
    } else if (demoMode) {
      demoInterval.current = setInterval(
        () => dispatch(viewportRotate({ mapId, rate })),
        13
      )
    } else if (demoInterval.current !== -1) {
      clearInterval(demoInterval.current)
      demoInterval.current = -1
    }
    return () => {
      if (demoInterval.current !== -1) {
        clearInterval(demoInterval.current)
        demoInterval.current = -1
      }
    }
  }, [mapId, demoMode, demoSettings, dispatch])
  useEffect(() => {
    const iconsToLoad = [
      ...new Set(R.without(R.keys(iconData))(nodeIcons(mapId))),
    ]
    R.forEach(async (iconName) => {
      const iconComponent =
        iconName === 'MdDownloading' ? (
          <MdDownloading />
        ) : (
          (await fetchIcon(iconName, iconUrl))()
        )
      const svgString = renderToStaticMarkup(iconComponent)
      const iconImage = new Image(ICON_RESOLUTION, ICON_RESOLUTION)
      iconImage.onload = () => {
        setIconData((iconStrings) => R.assoc(iconName, iconImage)(iconStrings))
      }
      iconImage.src = `data:image/svg+xml;base64,${window.btoa(svgString)}`
    })(iconsToLoad)
  }, [iconUrl, iconData, nodeIcons, mapId])

  const loadIconsToStyle = useCallback(() => {
    mapRef.current &&
      mapRef.current
        .getMap()
        .setFog(
          R.pathOr(getDefaultFog(), [
            mapStyle || getDefaultStyleId(isMapboxTokenProvided),
            'fog',
          ])(mapStyleOptions)
        )
    R.forEachObjIndexed((iconImage, iconName) => {
      if (mapRef.current && !mapRef.current.hasImage(iconName)) {
        mapRef.current.addImage(iconName, iconImage, { sdf: true })
      }
    })(iconData)
  }, [iconData, isMapboxTokenProvided, mapStyle, mapStyleOptions])

  useEffect(() => {
    loadIconsToStyle()
  }, [iconData, loadIconsToStyle])

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

  const onMouseMove = useCallback(
    (e) => {
      if (mapRef.current) {
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
      }
    },
    [getFeatureFromEvent]
  )

  const onMouseOver = useCallback(() => {
    if (R.isNotNil(highlight.current)) {
      mapRef.current.setFeatureState(highlight.current, { hover: false })
      highlight.current = null
    }
  }, [])

  const onClick = useCallback(
    (e) => {
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) return
      const [id, feature, obj] = featureObj
      if (R.isNotNil(highlight.current)) {
        mapRef.current.setFeatureState(highlight.current, { hover: false })
        highlight.current = null
      }

      dispatch(
        mutateLocal({
          path: ['panes', 'paneState', 'center'],
          value: {
            open: {
              ...(obj || {}),
              feature: feature,
              type: R.propOr(obj.type, 'name')(obj),
              key: id,
              mapId,
            },
            type: 'feature',
          },
          sync: !includesPath(R.values(sync), ['panes', 'paneState', 'center']),
        })
      )
    },
    [getFeatureFromEvent, dispatch, mapId, sync]
  )

  useEffect(() => {
    // This needs to be done because calling setStyle with the same style
    // breaks it for some reason
    const newStyle = R.path([
      mapStyle || getDefaultStyleId(isMapboxTokenProvided),
      'spec',
    ])(mapStyleOptions)
    if (!R.equals(newStyle, mapStyleSpec)) {
      setMapStyleSpec(
        R.path([mapStyle || getDefaultStyleId(isMapboxTokenProvided), 'spec'])(
          mapStyleOptions
        )
      )
    }
  }, [isMapboxTokenProvided, mapStyle, mapStyleOptions, mapStyleSpec])

  useEffect(() => {
    document.addEventListener('clearHighlight', onMouseOver, false)
    return () =>
      document.removeEventListener('clearHighlight', onMouseOver, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return !mapExists ? (
    []
  ) : (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        flex: '1 1 auto',
      }}
    >
      <MapControls allowProjections={isMapboxTokenProvided} mapId={mapId} />
      <ReactMapGL
        {...viewport}
        onMove={(e) => {
          // Prevents setting incorrect viewport on load
          if (e.viewState.zoom !== 0)
            dispatch(viewportUpdate({ viewport: e.viewState, mapId }))
        }}
        hash="map"
        container="map"
        mapStyle={mapStyleSpec}
        mapboxAccessToken={isMapboxTokenProvided && mapboxToken}
        projection={mapProjection}
        fog={R.pathOr(getDefaultFog(), [
          mapStyle || getDefaultStyleId(isMapboxTokenProvided),
          'fog',
        ])(mapStyleOptions)}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onStyleData={loadIconsToStyle}
        ref={mapRef}
        onMouseOver={onMouseOver}
        interactiveLayerIds={R.values(layerId)}
        onRender={() => {
          mapRef.current && mapRef.current.resize()
        }}
      >
        <Geos mapId={mapId} />
        <Arcs mapId={mapId} />
        <Nodes mapId={mapId} />
        <Arcs3D mapId={mapId} />
      </ReactMapGL>
      <MapModal mapId={mapId} />
      <MapLegend mapId={mapId} />
    </Box>
  )
}
Map.propTypes = {
  mapboxToken: PropTypes.string,
  mapId: PropTypes.string,
}

const styles = {
  root: {
    display: 'flex',
    height: '100%',
    p: 1,
    color: 'text.primary',
    bgcolor: 'background.paper',
  },
}

export const MapPage = (props) => {
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const rightBar = useSelector(selectRightAppBarDisplay)

  return (
    <Container
      maxWidth={false}
      sx={[
        styles.root,
        leftBar && rightBar
          ? { width: `calc(100vw - ${2 * APP_BAR_WIDTH + 2}px)` }
          : { width: `calc(100vw - ${APP_BAR_WIDTH + 1}px)` },
        rightBar && { mr: APP_BAR_WIDTH },
      ]}
      disableGutters
    >
      <Map {...props} />
    </Container>
  )
}
export default Map
