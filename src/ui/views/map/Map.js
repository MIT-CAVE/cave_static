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
import KeyPad from './KeyPad'
import { Geos, Arcs, Nodes } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'

import { viewportUpdate, openMapModal } from '../../../data/local/mapSlice'
import {
  selectSettingsIconUrl,
  selectCurrentMapStyleFunc,
  selectTheme,
  selectViewportFunc,
  selectMapStyleOptions,
  selectGroupedEnabledArcsFunc,
  selectFilteredGeosData,
  selectCurrentMapProjectionFunc,
  selectNodeDataFunc,
  selectLeftAppBarDisplay,
  selectRightAppBarDisplay,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { fetchIcon } from '../../../utils'

const Map = ({ mapboxToken, mapId }) => {
  const dispatch = useDispatch()
  const viewport = useSelector(selectViewportFunc)(mapId)
  const theme = useSelector(selectTheme)
  const mapStyle = useSelector(selectCurrentMapStyleFunc)(mapId)
  const mapProjection = useSelector(selectCurrentMapProjectionFunc)(mapId)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const arcData = R.propOr(
    {},
    'geoJson'
  )(useSelector(selectGroupedEnabledArcsFunc)(mapId))
  const nodeData = useSelector(selectNodeDataFunc)(mapId)
  const geosData = useSelector(selectFilteredGeosData)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [highlightLayerId, setHighlightLayerId] = useState()
  const [cursor, setCursor] = useState('auto')
  const [iconData, setIconData] = useState({})
  const [mapStyleSpec, setMapStyleSpec] = useState(undefined)

  const useMapbox = R.isNotNil(mapboxToken) && mapboxToken !== ''
  const ReactMapGL = useMapbox ? ReactMapboxGL : ReactMapLibreGL

  const mapRef = useRef({})

  useEffect(() => {
    const iconsToLoad = [
      ...new Set(
        R.pipe(
          R.map((node) => node[1].icon),
          R.without(R.keys(iconData))
        )(nodeData)
      ),
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
  }, [nodeData, iconUrl, iconData])

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
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) {
        setCursor('auto')
        if (R.isNotNil(highlightLayerId)) setHighlightLayerId()
      } else {
        const [id] = featureObj
        setHighlightLayerId(id)
        setCursor('pointer')
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
    const newStyle = R.path([mapStyle || getDefaultStyleId(theme), 'spec'])(
      mapStyleOptions
    )
    if (!R.equals(newStyle, mapStyleSpec)) {
      setMapStyleSpec(
        R.path([mapStyle || getDefaultStyleId(theme), 'spec'])(mapStyleOptions)
      )
    }
  }, [mapStyle, mapStyleOptions, theme, mapStyleSpec])

  return (
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
          dispatch(viewportUpdate({ viewport: e.viewState, mapId }))
        }}
        hash="map"
        container="map"
        // width={`calc(100vw - ${APP_BAR_WIDTH})`}
        // height="100vh"
        mapStyle={mapStyleSpec}
        mapboxAccessToken={useMapbox && mapboxToken}
        projection={mapProjection}
        fog={R.pathOr(getDefaultFog(theme), [
          mapStyle || getDefaultStyleId(theme),
          'fog',
        ])(mapStyleOptions)}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onStyleData={loadIconsToStyle}
        onTouchStart={onClick}
        ref={mapRef}
        cursor={cursor}
        onMouseOver={onMouseOver}
        interactiveLayerIds={R.values(layerId)}
      >
        <Geos highlightLayerId={highlightLayerId} mapId={mapId} />
        <Arcs highlightLayerId={highlightLayerId} mapId={mapId} />
        <Nodes highlightLayerId={highlightLayerId} mapId={mapId} />
      </ReactMapGL>
      <ErrorPad mapId={mapId} />
      <KeyPad />
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
