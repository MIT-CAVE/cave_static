import { ClickAwayListener, Popper, Stack, ToggleButton } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useState } from 'react'
import { TfiMapAlt } from 'react-icons/tfi'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import {
  selectIsMapboxTokenProvided,
  selectMapboxToken,
} from '../../data/selectors'
import { useMenu } from '../../utils/hooks'
import useMapApi from '../views/map/useMapApi'

import { forceArray } from '../../utils'

const styles = {
  popper: {
    width: '100%',
    height: '100%',
    // overflow: 'hidden',
    zIndex: 2,
  },
  map: {
    minHeight: '480px',
    height: 'auto',
    width: '100%',
    borderRadius: '4px',
    border: '1px solid rgb(128 128 128)',
    boxSizing: 'border-box',
  },
}

const numberFormatProps = {
  precision: 6,
  trailingZeros: true,
  unitPlacement: 'afterWithSpace',
}

const PropLatLngMap = ({ prop, currentVal, sx = [], onChange }) => {
  const [value, setValue] = useState(R.defaultTo(prop.value)(currentVal)[0])
  const [viewState, setViewState] = useState({
    latitude: value[1],
    longitude: value[0],
  })

  const { enabled, placeholder } = prop
  const mapboxToken = useSelector(selectMapboxToken)
  const isMapboxTokenProvided = useSelector(selectIsMapboxTokenProvided)

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const mapStyle =
    prop.mapStyle ??
    (isMapboxTokenProvided
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')

  const { ReactMapGl, Marker, NavigationControl } = useMapApi()

  const handleChangeLatitude = useCallback(
    (latitude) => {
      if (!enabled) return
      onChange([[value[0], latitude]])
      setValue([value[0], latitude])
      setViewState({ latitude, longitude: value[0] })
    },
    [enabled, onChange, value]
  )

  const handleChangeLongitude = useCallback(
    (longitude) => {
      if (!enabled) return
      onChange([[longitude, value[1]]])
      setValue([longitude, value[1]])
      setViewState({ latitude: value[1], longitude })
    },
    [enabled, onChange, value]
  )

  const handleDragEnd = useCallback(
    (event) => {
      if (!enabled) return
      onChange([[event.lngLat.lng, event.lngLat.lat]])
      setValue([event.lngLat.lng, event.lngLat.lat])
      setViewState({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    },
    [enabled, onChange]
  )
  const showMap = Boolean(anchorEl)
  return (
    <Stack useFlexGap spacing={2} sx={[{ width: '100%' }, ...forceArray(sx)]}>
      <ClickAwayListener
        onClickAway={(event) => {
          // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
          if (sessionStorage.getItem('mui-select-open-flag') === '1') return
          handleCloseMenu(event)
        }}
      >
        <Popper
          disablePortal
          placement="auto"
          {...{ anchorEl }}
          open={showMap}
          sx={styles.popper}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <ReactMapGl
            mapboxAccessToken={mapboxToken}
            style={styles.map}
            {...{ mapStyle, ...viewState }}
            onMove={(event) => setViewState(event.viewState)}
          >
            <Marker
              draggable
              anchor="center"
              longitude={value[0]}
              latitude={value[1]}
              onDragEnd={handleDragEnd}
            />
            <NavigationControl />
          </ReactMapGl>
        </Popper>
      </ClickAwayListener>

      <Stack useFlexGap direction="row" spacing={1}>
        <NumberInput
          disabled={!enabled}
          label="Latitude"
          {...{ placeholder, max: 90, min: -90 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-90, 90)(value[1])}
          onClickAway={handleChangeLatitude}
        />
        <NumberInput
          disabled={!enabled}
          label="Longitude"
          {...{ placeholder, max: 180, min: -180 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-180, 180, value[0])}
          onClickAway={handleChangeLongitude}
        />
        <ToggleButton
          selected={showMap}
          value="prop-lat-lng-map-view"
          onClick={showMap ? handleCloseMenu : handleOpenMenu}
        >
          <TfiMapAlt size={28} />
        </ToggleButton>
      </Stack>
    </Stack>
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
