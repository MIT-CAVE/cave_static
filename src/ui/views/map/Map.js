import { MapView } from '@deck.gl/core'
import { DeckGL } from '@deck.gl/react'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment } from 'react'
import ReactMapGL, { ScaleControl } from 'react-map-gl'
import { useDispatch, useSelector } from 'react-redux'

import { getDefaultStyleId } from '.'
import ErrorPad from './ErrorPad'
import KeyPad from './KeyPad'
import MapControls from './MapControls'
import MapLegend from './MapLegend'
import MapModal from './MapModal'
import { getLayers } from './layers'

import { viewportUpdate } from '../../../data/local/map/mapControlSlice'
import {
  selectMapStyle,
  selectTheme,
  selectViewport,
  selectMapModal,
} from '../../../data/selectors'
import {
  STYLE_URL_BASE,
  APP_BAR_WIDTH,
} from '../../../utils/constants'

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

  const onViewStateChange = (nextViewport) => {
    const updatedViewport = R.pipe(
      R.propOr({}, 'viewState'),
      R.pick(viewportKeys)
    )(nextViewport)
    const oldViewport = R.pipe(
      R.propOr({}, 'oldViewState'),
      R.pick(viewportKeys)
    )(nextViewport)
    if (!mapModal.isOpen && !R.equals(updatedViewport, oldViewport)) {
      dispatch(viewportUpdate(updatedViewport))
    }
  }

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
          views={new MapView({ repeat: true })}
          getCursor={({ isDragging, isHovering }) =>
            isDragging ? 'grabbing' : isHovering ? 'pointer' : 'grab'
          }
          viewState={viewport}
          onViewStateChange={onViewStateChange}
          controller={true}
          layers={getLayers()}
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
