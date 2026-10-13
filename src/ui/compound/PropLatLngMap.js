import {
  Box,
  ClickAwayListener,
  Popper,
  Stack,
  ToggleButton,
} from '@mui/material'
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

import { CoordinateReadout, CoordinateToggleButton } from './CoordinateReadout'

import { selectMapboxToken } from '../../data/selectors'
import { useCoordinateReadout, useDragAutoPan } from '../../utils/hooks'
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
  mapControls: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
    display: 'flex',
    gap: 1,
  },
}

const PropLatLngMap = ({ prop, currentVal, sx = [], onChange }) => {
  const defaultValue = currentVal ?? prop.value
  const [value, setValue] = useState(defaultValue[0])
  const { minZoom, maxZoom, defaultZoom, maxBounds } =
    getCoordinateMapOptions(prop)
  // When set, manual entry is clamped to `maxBounds` (not just the global
  // lat/lng range) to match dragging, which the popup map already keeps
  // within those bounds.
  const [lngMin, lngMax] = maxBounds
    ? [maxBounds[0][0], maxBounds[1][0]]
    : [-180, 180]
  const [latMin, latMax] = maxBounds
    ? [maxBounds[0][1], maxBounds[1][1]]
    : [-90, 90]
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
  const mapRef = useRef(null)
  // `mapRef.current` (the ref `react-map-gl`/`@vis.gl/react-mapbox` forwards)
  // is already a wrapper exposing `.project`/`.unproject`/`.getCenter`/
  // `.getContainer`/etc. directly off the real, library-managed camera -
  // there's no separate "raw" map to unwrap to via `.getMap()`, so just use
  // the wrapper as-is.
  const getMap = useCallback(() => mapRef.current, [])
  const mapOpenKey = `cave.latLngMap.mapOpen.${prop.id ?? prop.name}`
  const [showMap, setShowMapState] = useState(() => readStoredFlag(mapOpenKey))
  const setShowMap = (open) => {
    setShowMapState(open)
    writeStoredFlag(mapOpenKey, open)
  }

  const mapStyle = prop.mapStyle ?? 'mapbox://styles/mapbox/dark-v11'

  const coordsKey = `cave.latLngMap.showCoords.${prop.id ?? prop.name}`
  const {
    coordsEnabled,
    setCoordsEnabled,
    cursorPosition,
    cursorDisplayRef,
    handleMapMouseMove,
    handleMapMouseLeave,
  } = useCoordinateReadout(coordsKey)

  const { dragPosition, suppressClickAwayRef, registerDrag, endDrag } =
    useDragAutoPan({ getMap, setViewState })
  // While a drag is in progress, the dragged marker's rendered position is
  // driven by this instead of `value` - the underlying Marker wrapper
  // forcibly re-syncs to its `longitude`/`latitude` props on every render
  // (not just on mount), so leaving it pointed at the stale `value` while
  // other state changes mid-drag (e.g. `viewState` updating from the
  // auto-pan loop) would fight the live drag and snap the marker back to
  // where it started.
  const markerPosition = dragPosition ?? value

  const { ReactMapGl, Marker, NavigationControl } = useMapApi()

  const handleChangeAt = (index) => (event, newLatOrLng) => {
    setValue(R.update(index, newLatOrLng))
  }

  const handleChangeCommittedAt = (index) => (event, newLatOrLng) => {
    if (!enabled) return
    const clamped =
      index === 0
        ? R.clamp(lngMin, lngMax, newLatOrLng)
        : R.clamp(latMin, latMax, newLatOrLng)
    const newValue = R.update(index, clamped)(value)
    setViewState({ latitude: newValue[1], longitude: newValue[0] })
    onChange([newValue])
  }

  const handleDrag = useCallback(
    (event) => {
      if (!enabled) return
      registerDrag(event, [event.lngLat.lng, event.lngLat.lat])
    },
    [enabled, registerDrag]
  )

  const handleDragEnd = useCallback(
    (event) => {
      endDrag()
      if (!enabled) return
      // Clamped here, at drop time, same as the manual-entry commit above -
      // auto-pan makes it routine to drag well past `maxBounds`, and
      // clamping only the final value (not mid-drag) avoids feeding a
      // bounded position back into the pan/delta math driving the camera
      // and the live marker.
      const bounded = [
        R.clamp(lngMin, lngMax, event.lngLat.lng),
        R.clamp(latMin, latMax, event.lngLat.lat),
      ]
      onChange([bounded])
      setValue(bounded)
      setViewState({ latitude: bounded[1], longitude: bounded[0] })
    },
    [enabled, endDrag, latMax, latMin, lngMax, lngMin, onChange]
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
          if (suppressClickAwayRef.current) {
            suppressClickAwayRef.current = false
            return
          }
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
            ref={mapRef}
            mapboxAccessToken={mapboxToken}
            style={styles.map}
            {...{ mapStyle, minZoom, maxZoom, maxBounds, ...viewState }}
            onMove={(event) => setViewState(event.viewState)}
            onMouseMove={handleMapMouseMove}
            onMouseLeave={handleMapMouseLeave}
          >
            <Box sx={styles.mapControls}>
              <CoordinateToggleButton
                enabled={enabled}
                selected={coordsEnabled}
                onToggle={setCoordsEnabled}
              />
            </Box>
            <CoordinateReadout
              active={Boolean(cursorPosition)}
              position={cursorDisplayRef.current}
              numberFormatProps={numberFormatProps}
            />
            <Marker
              draggable={enabled}
              anchor="center"
              longitude={markerPosition[0]}
              latitude={markerPosition[1]}
              onDrag={handleDrag}
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
            {...{ placeholder, max: latMax, min: latMin }}
            numberFormat={numberFormatProps}
            value={R.clamp(latMin, latMax)(value[1])}
            onChange={handleChangeAt(1)}
            onChangeCommitted={handleChangeCommittedAt(1)}
          />
          <NumberField
            disabled={!enabled}
            label="Longitude"
            {...{ placeholder, max: lngMax, min: lngMin }}
            numberFormat={numberFormatProps}
            value={R.clamp(lngMin, lngMax, value[0])}
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
