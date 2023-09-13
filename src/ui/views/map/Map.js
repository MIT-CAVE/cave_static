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
import ErrorPad from './ErrorPad'
import { Geos, Arcs, Nodes, Arcs3D } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'

import {
  viewportUpdate,
  openMapModal,
  viewportRotate,
} from '../../../data/local/mapSlice'
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
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { fetchIcon } from '../../../utils'

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
  const [highlightLayerId, setHighlightLayerId] = useState()
  const [iconData, setIconData] = useState({})
  const [mapStyleSpec, setMapStyleSpec] = useState(undefined)
  const mapExists = R.has(mapId, mapData)

  const useMapbox = R.isNotNil(mapboxToken) && mapboxToken !== ''
  const ReactMapGL = useMapbox ? ReactMapboxGL : ReactMapLibreGL

  const mapRef = useRef(false)

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
      const iconImage = new Image(250, 250)
      iconImage.onload = () => {
        setIconData((iconStrings) => R.assoc(iconName, iconImage)(iconStrings))
      }
      iconImage.src = `data:image/svg+xml;base64,${window.btoa(svgString)}`
    })(iconsToLoad)
  }, [iconUrl, iconData, nodeIcons, mapId])

  const loadIconsToStyle = useCallback(() => {
    R.forEachObjIndexed((iconImage, iconName) => {
      if (mapRef.current && !mapRef.current.hasImage(iconName)) {
        mapRef.current.addImage(iconName, iconImage, { sdf: true })
      }
    })(iconData)
  }, [iconData])

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
          ]
        : R.isNotNil(clickedArc)
        ? [
            clickedArc.properties.cave_name,
            'arcs',
            R.hasPath(['properties', 'cave_obj'])(clickedArc)
              ? JSON.parse(clickedArc.properties.cave_obj)
              : R.propOr({}, clickedArc.properties.cave_name, arcData),
          ]
        : R.isNotNil(clickedGeo)
        ? [
            clickedGeo.properties.cave_name,
            'geos',
            R.propOr({}, clickedGeo.properties.cave_name, geosData),
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
        if (!featureObj) {
          if (canvas.style.cursor !== 'auto') canvas.style.cursor = 'auto'
          if (R.isNotNil(highlightLayerId)) setHighlightLayerId()
        } else {
          const [id] = featureObj
          setHighlightLayerId(id)
          if (canvas.style.cursor === 'auto') canvas.style.cursor = 'pointer'
        }
      }
    },
    [getFeatureFromEvent, highlightLayerId]
  )

  const onMouseOver = useCallback(() => {
    if (R.isNotNil(highlightLayerId)) setHighlightLayerId()
  }, [highlightLayerId])

  const onClick = useCallback(
    (e) => {
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) return
      const [id, feature, obj] = featureObj
      setHighlightLayerId()

      dispatch(
        openMapModal({
          mapId,
          data: {
            ...(obj || {}),
            feature: feature,
            type: R.propOr(obj.type, 'name')(obj),
            key: id,
          },
        })
      )
    },
    [mapId, dispatch, getFeatureFromEvent]
  )

  useEffect(() => {
    // This needs to be done because calling setStyle with the same style
    // breaks it for some reason
    const newStyle = R.path([mapStyle || getDefaultStyleId(), 'spec'])(
      mapStyleOptions
    )
    if (!R.equals(newStyle, mapStyleSpec)) {
      setMapStyleSpec(
        R.path([mapStyle || getDefaultStyleId(), 'spec'])(mapStyleOptions)
      )
    }
  }, [mapStyle, mapStyleOptions, mapStyleSpec])

  useEffect(() => {
    document.addEventListener('clearHighlight', onMouseOver, false)
    return () =>
      document.removeEventListener('clearHighlight', onMouseOver, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightLayerId])

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
      <MapControls allowProjections={useMapbox} mapId={mapId} />
      <ReactMapGL
        {...viewport}
        onMove={(e) => {
          console.log(e)
          if (e.viewState.zoom !== 0)
            dispatch(viewportUpdate({ viewport: e.viewState, mapId }))
        }}
        hash="map"
        container="map"
        // width={`calc(100vw - ${APP_BAR_WIDTH})`}
        // height="100vh"
        mapStyle={mapStyleSpec}
        mapboxAccessToken={useMapbox && mapboxToken}
        projection={mapProjection}
        fog={R.pathOr(getDefaultFog(), [
          mapStyle || getDefaultStyleId(),
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
        <Geos highlightLayerId={highlightLayerId} mapId={mapId} />
        <Arcs highlightLayerId={highlightLayerId} mapId={mapId} />
        <Nodes highlightLayerId={highlightLayerId} mapId={mapId} />
        <Arcs3D mapId={mapId} />
      </ReactMapGL>
      <ErrorPad mapId={mapId} />
      <MapModal mapId={mapId} />
      <MapLegend mapId={mapId} />
    </Box>
  )
}
Map.propTypes = { mapboxToken: PropTypes.string }

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
