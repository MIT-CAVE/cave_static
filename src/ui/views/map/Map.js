import { MapView } from '@deck.gl/core'
import { DeckGL } from '@deck.gl/react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, useCallback, useRef } from 'react'
import ReactMapGL, { ScaleControl } from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import { getDefaultStyleId } from '.'
import ErrorPad from './ErrorPad'
import KeyPad from './KeyPad'
import { getLayers } from './layers'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'

import { viewportUpdate, openMapModal } from '../../../data/local/mapSlice'
import {
  selectMapStyle,
  selectTheme,
  selectViewport,
  selectMapModal,
  selectStaticMap,
  selectAppBarId,
} from '../../../data/selectors'
import { STYLE_URL_BASE, APP_BAR_WIDTH } from '../../../utils/constants'
import { layerId } from '../../../utils/enums'

const viewportKeys = [
  'longitude',
  'latitude',
  'zoom',
  'pitch',
  'bearing',
  'altitude',
  'maxZoom',
  'minZoom',
]

const Map = ({ mapboxToken }) => {
  const dispatch = useDispatch()
  const viewport = useSelector(selectViewport)
  const theme = useSelector(selectTheme)
  const mapStyle = useSelector(selectMapStyle)
  const mapModal = useSelector(selectMapModal)
  const isStatic = useSelector(selectStaticMap)
  const appBarId = useSelector(selectAppBarId)

  const deckRef = useRef({})

  const onViewStateChange = useCallback(
    (nextViewport) => {
      const updatedViewport = R.pipe(
        R.propOr({}, 'viewState'),
        R.pick(viewportKeys)
      )(nextViewport)
      const oldViewport = R.pipe(
        R.propOr({}, 'oldViewState'),
        R.pick(viewportKeys)
      )(nextViewport)
      if (
        !mapModal.isOpen &&
        !R.equals(updatedViewport, oldViewport) &&
        !isStatic
      ) {
        dispatch(viewportUpdate({ appBarId, viewport: updatedViewport }))
      }
    },
    [mapModal.isOpen, isStatic, dispatch, appBarId]
  )

  const openGeo = useCallback(
    (e) =>
      R.pipe(
        (d) =>
          deckRef.current.pickMultipleObjects({
            y: R.prop('y', d),
            x: R.prop('x', d),
            radius: 20,
          }),
        R.filter(
          R.pipe(R.pathEq(['layer', 'id'], layerId.GEOGRAPHY_LAYER), R.not)
        ),
        R.isEmpty
      )(e),
    []
  )

  const onClick = useCallback(
    (e) => {
      const pickedItems = deckRef.current.pickMultipleObjects({
        y: R.prop('y', e),
        x: R.prop('x', e),
        radius: 20,
      })
      const pickedNode = R.find(
        R.pathEq(['layer', 'id'], layerId.NODE_ICON_LAYER)
      )(pickedItems)
      const pickedArc = R.find(
        (d) =>
          R.pathEq(['layer', 'id'], layerId.ARC_LAYER, d) ||
          R.pathEq(['layer', 'id'], layerId.ARC_LAYER_3D, d)
      )(pickedItems)
      !R.isNil(pickedNode)
        ? dispatch(
            openMapModal({
              appBarId,
              data: {
                ...R.pathOr({}, ['object', 1])(pickedNode),
                feature: 'nodes',
                type: R.propOr(
                  pickedNode.object[1].type,
                  'name'
                )(pickedNode.object[1]),
                key: pickedNode.object[0],
              },
            })
          )
        : !R.isNil(pickedArc)
        ? dispatch(
            openMapModal({
              appBarId,
              data: {
                ...R.pathOr({}, ['object', 1])(pickedArc),
                feature: 'arcs',
                type: R.propOr(
                  pickedArc.object[1].type,
                  'name'
                )(pickedArc.object[1]),
                key: pickedArc.object[0],
              },
            })
          )
        : R.identity()
    },
    [appBarId, dispatch]
  )

  return (
    <Fragment>
      <MapControls />
      <ReactMapGL
        {...viewport}
        width={`calc(100vw - ${APP_BAR_WIDTH})`}
        height="100vh"
        mapStyle={mapStyle || `${STYLE_URL_BASE}${getDefaultStyleId(theme)}`}
        mapboxAccessToken={mapboxToken}
      >
        <ScaleControl />
        <DeckGL
          onClick={onClick}
          ref={deckRef}
          views={new MapView({ repeat: true })}
          getCursor={({ isDragging, isHovering }) =>
            isDragging
              ? 'grabbing'
              : isHovering
              ? 'pointer'
              : !isStatic
              ? 'grab'
              : 'auto'
          }
          pickingRadius={5}
          viewState={viewport}
          onViewStateChange={onViewStateChange}
          controller={true}
          layers={getLayers(openGeo)}
        />
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
