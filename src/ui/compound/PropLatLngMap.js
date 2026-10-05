import { ClickAwayListener, Popper, Stack, ToggleButton } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import {
  useCallback,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import { TfiMapAlt } from 'react-icons/tfi'
import { useSelector } from 'react-redux'

import { selectMapboxToken } from '../../data/selectors'
import NumberField from '../prototypes/NumberField'
import useMapApi from '../views/map/useMapApi'

import {
  forceArray,
  getCoordinateMapOptions,
  getCoordinateNumberFormat,
  isEventInside,
  readStoredFlag,
  writeStoredFlag,
} from '../../utils'

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

const PropLatLngMap = ({ prop, currentVal, sx = [], onChange }) => {
  const defaultValue = currentVal ?? prop.value
  const [value, setValue] = useState(defaultValue[0])
  const { minZoom, maxZoom, defaultZoom } = getCoordinateMapOptions(prop)
  const [viewState, setViewState] = useState({
    latitude: value[1],
    longitude: value[0],
    zoom: defaultZoom,
  })

  useEffect(() => {
    const newValue = (currentVal ?? prop.value)[0]
    setValue(newValue)
    setViewState({
      latitude: newValue[1],
      longitude: newValue[0],
      zoom: defaultZoom,
    })
  }, [currentVal, prop.value, defaultZoom])

  const { enabled, placeholder, direction = 'row' } = prop
  const numberFormatProps = getCoordinateNumberFormat(prop)
  const fieldsRef = useRef(null)
  const [toggleSize, setToggleSize] = useState(null)

  useLayoutEffect(() => {
    if (fieldsRef.current) setToggleSize(fieldsRef.current.offsetHeight)
  }, [direction])
  const iconSize =
    toggleSize && direction === 'column' ? Math.round(toggleSize / 3) : 28
  const mapboxToken = useSelector(selectMapboxToken)

  const containerRef = useRef(null)
  const mapOpenKey = `cave.latLngMap.mapOpen.${prop.id ?? prop.name}`
  const [showMap, setShowMapState] = useState(() => readStoredFlag(mapOpenKey))
  const setShowMap = (open) => {
    setShowMapState(open)
    writeStoredFlag(mapOpenKey, open)
  }

  const mapStyle = prop.mapStyle ?? 'mapbox://styles/mapbox/dark-v11'

  const { ReactMapGl, Marker, NavigationControl } = useMapApi()

  const handleChangeAt = (index) => (event, newLatOrLng) => {
    setValue(R.update(index, newLatOrLng))
  }

  const handleChangeCommittedAt = (index) => (event, newLatOrLng) => {
    if (!enabled) return
    const newValue = R.update(index, newLatOrLng)(value)
    setViewState({ latitude: newValue[1], longitude: newValue[0] })
    onChange([newValue])
  }

  const handleDragEnd = useCallback(
    (event) => {
      if (!enabled) return
      onChange([[event.lngLat.lng, event.lngLat.lat]])
      setValue([event.lngLat.lng, event.lngLat.lat])
      setViewState({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    },
    [enabled, onChange]
  )
  return (
    <Stack
      ref={containerRef}
      useFlexGap
      spacing={2}
      sx={[{ width: '100%' }, ...forceArray(sx)]}
    >
      <ClickAwayListener
        onClickAway={(event) => {
          // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
          if (sessionStorage.getItem('mui-select-open-flag') === '1') return
          if (isEventInside(event, containerRef.current)) return
          setShowMap(false)
        }}
      >
        <Popper
          disablePortal
          placement="right-start"
          anchorEl={containerRef.current}
          open={showMap}
          sx={[styles.popper, { width: containerRef.current?.offsetWidth }]}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <ReactMapGl
            mapboxAccessToken={mapboxToken}
            style={styles.map}
            {...{ mapStyle, minZoom, maxZoom, ...viewState }}
            onMove={(event) => setViewState(event.viewState)}
          >
            <Marker
              draggable={enabled}
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
        <Stack
          useFlexGap
          ref={fieldsRef}
          {...{ direction }}
          spacing={direction === 'row' ? 1 : 2}
          sx={{ flexGrow: 1 }}
        >
          <NumberField
            disabled={!enabled}
            label="Latitude"
            {...{ placeholder, max: 90, min: -90 }}
            numberFormat={numberFormatProps}
            value={R.clamp(-90, 90)(value[1])}
            onChange={handleChangeAt(1)}
            onChangeCommitted={handleChangeCommittedAt(1)}
          />
          <NumberField
            disabled={!enabled}
            label="Longitude"
            {...{ placeholder, max: 180, min: -180 }}
            numberFormat={numberFormatProps}
            value={R.clamp(-180, 180, value[0])}
            onChange={handleChangeAt(0)}
            onChangeCommitted={handleChangeCommittedAt(0)}
          />
        </Stack>
        <ToggleButton
          disabled={!enabled}
          selected={showMap}
          value="prop-lat-lng-map-view"
          onClick={(event) => {
            event.stopPropagation()
            setShowMap(!showMap)
          }}
          style={
            toggleSize && direction === 'column'
              ? { height: toggleSize, width: toggleSize }
              : undefined
          }
        >
          <TfiMapAlt size={iconSize} />
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
