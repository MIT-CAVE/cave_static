import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
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

import {
  viewportUpdate,
  openMapModal,
  viewportRotate,
} from '../../../data/local/mapSlice'
import {
  selectSettingsIconUrl,
  selectCurrentMapStyle,
  selectTheme,
  selectViewport,
  selectAppBarId,
  selectMapStyleOptions,
  selectGroupedEnabledArcs,
  selectFilteredGeosData,
  selectCurrentMapProjection,
  selectNodeData,
  selectDemoMode,
  selectDemoSettings,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

import { fetchIcon } from '../../../utils'

const Map = ({ mapboxToken }) => {
  const dispatch = useDispatch()
  const viewport = useSelector(selectViewport)
  const theme = useSelector(selectTheme)
  const mapStyle = useSelector(selectCurrentMapStyle)
  const mapProjection = useSelector(selectCurrentMapProjection)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const appBarId = useSelector(selectAppBarId)
  const arcData = R.propOr({}, 'geoJson')(useSelector(selectGroupedEnabledArcs))
  const nodeData = useSelector(selectNodeData)
  const geosData = useSelector(selectFilteredGeosData)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const demoMode = useSelector(selectDemoMode)
  const demoSettings = useSelector(selectDemoSettings)
  const [highlightLayerId, setHighlightLayerId] = useState()
  const [cursor, setCursor] = useState('auto')
  const [iconData, setIconData] = useState({})
  const [mapStyleSpec, setMapStyleSpec] = useState(undefined)

  const useMapbox = R.isNotNil(mapboxToken) && mapboxToken !== '' && false
  const ReactMapGL = useMapbox ? ReactMapboxGL : ReactMapLibreGL

  const mapRef = useRef({})

  const demoInterval = useRef(-1)

  useEffect(() => {
    const rate = R.pathOr(0.15, [appBarId, 'scrollSpeed'], demoSettings)
    if (demoMode && demoInterval.current === -1) {
      dispatch(viewportRotate({ appBarId, rate }))
      demoInterval.current = setInterval(
        () => dispatch(viewportRotate({ appBarId, rate })),
        13
      )
    } else if (demoMode) {
      demoInterval.current = setInterval(
        () => dispatch(viewportRotate({ appBarId, rate })),
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
  }, [appBarId, demoMode, demoSettings, dispatch])

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
      setHighlightLayerId()

      dispatch(
        openMapModal({
          appBarId,
          data: {
            ...(obj || {}),
            feature: feature,
            type: R.propOr(obj.type, 'name')(obj),
            key: id,
          },
        })
      )
    },
    [appBarId, dispatch, getFeatureFromEvent]
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
    <Fragment>
      <MapControls allowProjections={useMapbox} />
      <ReactMapGL
        {...viewport}
        onMove={(e) => {
          dispatch(viewportUpdate({ viewport: e.viewState, appBarId }))
        }}
        hash="map"
        container="map"
        width={`calc(100vw - ${APP_BAR_WIDTH})`}
        height="100vh"
        mapStyle={
          useMapbox
            ? mapStyleSpec
            : R.path([mapStyle || getDefaultStyleId(theme), 'spec'])(
                mapStyleOptions
              )
        }
        mapboxAccessToken={useMapbox && mapboxToken}
        projection={mapProjection}
        fog={R.pathOr(getDefaultFog(theme), [
          mapStyle || getDefaultStyleId(theme),
          'fog',
        ])(mapStyleOptions)}
        onClick={onClick}
        onMouseMove={onMouseMove}
        onStyleData={loadIconsToStyle}
        ref={mapRef}
        cursor={cursor}
        onMouseOver={onMouseOver}
        interactiveLayerIds={R.values(layerId)}
      >
        <Geos highlightLayerId={highlightLayerId} />
        <Arcs highlightLayerId={highlightLayerId} />
        <Nodes highlightLayerId={highlightLayerId} />
      </ReactMapGL>
      <ErrorPad />
      <KeyPad />
      <MapModal />
      <MapLegend />
    </Fragment>
  )
}
Map.propTypes = { mapboxToken: PropTypes.string }

export default Map
