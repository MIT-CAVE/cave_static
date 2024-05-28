import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'
import { Map, Marker, NavigationControl } from 'react-map-gl'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectMapboxToken } from '../../data/selectors'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '100%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const mapSettings = {
  style: {
    width: 480,
    height: 480,
    margin: 10,
  },
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
}

const numberFormatProps = {
  precision: 6,
  trailingZeros: true,
  unitPlacement: 'afterWithSpace',
}

const PropLatLngMap = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const mapboxToken = useSelector(selectMapboxToken)
  const enabled = prop.enabled || false
  const [value, setValue] = useState(
    R.defaultTo(R.prop('value', prop), currentVal)
  )
  const [viewState, setViewState] = useState({
    latitude: value[1],
    longitude: value[0],
  })

  const inputLat = (lat) => {
    if (!enabled) return
    onChange([value[0], lat])
    setValue([value[0], lat])
    setViewState({ latitude: lat, longitude: value[0] })
  }

  const inputLng = (lng) => {
    if (!enabled) return
    onChange([lng, value[1]])
    setValue([lng, value[1]])
    setViewState({ latitude: value[1], longitude: lng })
  }

  const onDragEnd = (event) => {
    if (!enabled) return
    onChange([event.lngLat.lng, event.lngLat.lat])
    setValue([event.lngLat.lng, event.lngLat.lat])
    setViewState({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
  }

  return (
    <Box>
      <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
        <Typography> Latitude </Typography>
        <NumberInput
          {...{ enabled, max: 90, min: -90 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-90, 90, value[1])}
          onClickAway={inputLat}
        />
      </Box>
      <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
        <Typography> Longitude </Typography>
        <NumberInput
          {...{ enabled, max: 180, min: -180 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-180, 180, value[0])}
          onClickAway={inputLng}
        />
      </Box>
      <Map
        {...viewState}
        mapboxAccessToken={mapboxToken}
        style={mapSettings.style}
        mapStyle={mapSettings.mapStyle}
        onMove={(event) => setViewState(event.viewState)}
      >
        <Marker
          longitude={value[0]}
          latitude={value[1]}
          onDragEnd={onDragEnd}
          draggable={true}
          anchor="center"
        />
        <NavigationControl />
      </Map>
    </Box>
  )
}
PropLatLngMap.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropLatLngMap
