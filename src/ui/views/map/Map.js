import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MdDownloading } from 'react-icons/md'
import ReactMapGL from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import { getDefaultStyleId } from '.'
import ErrorPad from './ErrorPad'
import KeyPad from './KeyPad'
import { Geos, Arcs, Nodes } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'

import { viewportUpdate, openMapModal } from '../../../data/local/mapSlice'
import {
  selectSettingsIconUrl,
  selectCurrentMapStyle,
  selectTheme,
  selectViewport,
  selectAppBarId,
  selectMapStyleOptions,
  selectSplitNodeData,
  selectLineData,
  selectMatchingKeys,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, GLOBE_FOG_CONFIG } from '../../../utils/constants'

import { fetchIcon } from '../../../utils'

const Map = ({ mapboxToken }) => {
  const dispatch = useDispatch()
  const viewport = useSelector(selectViewport)
  const theme = useSelector(selectTheme)
  const mapStyle = useSelector(selectCurrentMapStyle)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const appBarId = useSelector(selectAppBarId)
  const arcData = useSelector(selectLineData)
  const nodeDataSplit = useSelector(selectSplitNodeData)
  const matchingKeys = useSelector(selectMatchingKeys)
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [highlightLayerId, setHighlightLayerId] = useState()
  const [cursor, setCursor] = useState('auto')
  const [iconData, setIconData] = useState({})

  const mapRef = useRef({})

  useEffect(() => {
    const iconsToLoad = [
      ...new Set(
        R.pipe(
          R.propOr([], false),
          R.map((node) => node[1].icon),
          R.append('MdDownloading'),
          R.without(R.keys(iconData))
        )(nodeDataSplit)
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
  }, [nodeDataSplit, iconUrl, mapStyle, iconData])

  const loadIconsToStyle = useCallback(() => {
    R.forEachObjIndexed((iconImage, iconName) => {
      if (!mapRef.current.hasImage(iconName)) {
        mapRef.current.addImage(iconName, iconImage, { sdf: true })
      }
    })(iconData)
  }, [iconData])

  const getFeatureFromEvent = useCallback(
    (e) => {
      const nodeIds = R.propOr([], false)(nodeDataSplit).map(([id]) => id)
      const arcIds = arcData.map(([id]) => id)
      const geoIds = R.values(
        R.mapObjIndexed((geo) => geo.data_key)(matchingKeys)
      )
      const clickedNodes = e.features.filter((feature) =>
        nodeIds.includes(feature.layer.id)
      )
      const clickedArcs = e.features.filter((feature) =>
        arcIds.includes(feature.layer.id)
      )
      const clickedGeos = e.features.filter((feature) =>
        geoIds.includes(feature.layer.id)
      )
      let id, feature, obj
      if (clickedNodes.length > 0) {
        feature = 'nodes'
        id = clickedNodes[0].layer.id
        obj = R.head(
          R.propOr([], false)(nodeDataSplit).filter(([nodeId]) => id === nodeId)
        )[1]
      } else if (clickedArcs.length > 0) {
        feature = 'arcs'
        id = clickedArcs[0].layer.id
        obj = R.head(arcData.filter(([arcId]) => id === arcId))[1]
      } else if (clickedGeos.length > 0) {
        feature = 'geos'
        id = clickedGeos[0].layer.id
        obj = R.head(
          R.filter((geo) => geo.data_key === id)(R.values(matchingKeys))
        )
      } else return
      return [id, feature, obj]
    },
    [matchingKeys, arcData, nodeDataSplit]
  )

  const onMouseMove = useCallback(
    (e) => {
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) {
        setCursor('auto')
        setHighlightLayerId()
      } else {
        const [id] = featureObj
        setHighlightLayerId(id)
        setCursor('pointer')
      }
    },
    [getFeatureFromEvent]
  )

  const newOnClick = useCallback(
    (e) => {
      const featureObj = getFeatureFromEvent(e)
      if (!featureObj) return
      const [id, feature, obj] = featureObj

      dispatch(
        openMapModal({
          appBarId,
          data: {
            ...(obj || {}),
            feature: feature,
            type: R.prop('type')(obj),
            key: id,
          },
        })
      )
    },
    [appBarId, dispatch, getFeatureFromEvent]
  )

  return (
    <Fragment>
      {true && <MapControls />}
      <ReactMapGL
        {...viewport}
        onMove={(e) => {
          dispatch(viewportUpdate({ viewport: e.viewState, appBarId }))
        }}
        hash="map"
        container="map"
        width={`calc(100vw - ${APP_BAR_WIDTH})`}
        height="100vh"
        mapStyle={R.path([mapStyle || getDefaultStyleId(theme), 'spec'])(
          mapStyleOptions
        )}
        mapboxAccessToken={mapboxToken}
        projection="globe"
        fog={GLOBE_FOG_CONFIG}
        onClick={newOnClick}
        onMouseMove={onMouseMove}
        onStyleData={loadIconsToStyle}
        ref={mapRef}
        cursor={cursor}
        interactiveLayerIds={[
          'data',
          ...R.propOr([], false)(nodeDataSplit).map(([id]) => id),
          ...arcData.map(([id]) => id),
          ...R.values(R.mapObjIndexed((geo) => geo.data_key)(matchingKeys)),
        ]}
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
