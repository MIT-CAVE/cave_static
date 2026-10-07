import {
  Avatar,
  Box,
  Button,
  Chip,
  ClickAwayListener,
  Popper,
  Stack,
  ToggleButton,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import {
  useCallback,
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import {
  MdAddCircleOutline,
  MdOutlineCancel,
  MdOutlineCheck,
} from 'react-icons/md'
import { PiEraser } from 'react-icons/pi'
import { TfiMapAlt } from 'react-icons/tfi'
import { useSelector } from 'react-redux'

import { selectMapboxToken } from '../../data/selectors'
import NumberField from '../prototypes/NumberField'
import useMapApi from '../views/map/useMapApi'

import {
  NumberFormat,
  adjustArcPath,
  forceArray,
  getCoordinateMapOptions,
  isEventInside,
  readStoredFlag,
  writeStoredFlag,
  getCoordinateNumberFormat,
} from '../../utils'

const styles = {
  chipsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    justifyItems: 'start',
    alignContent: 'start',
    gap: 1,
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    border: 1,
    borderColor: 'divider',
    borderRadius: 1,
    p: 1,
  },
  getChip: (selected) => ({
    '&:hover': {
      backgroundColor: selected ? 'primary.main' : 'transparent',
    },
  }),
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

const LINE_LAYOUT = { 'line-join': 'round', 'line-cap': 'round' }
const DEFAULT_LINE_PAINT = {
  'line-color': 'rgba(3, 170, 238, 0.5)',
  'line-width': 5,
}
const PATH_SOURCE = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'LineString', coordinates: [] },
}

const edit = {
  NONE: '',
  ADD: 'add',
  RESET: 'reset',
}

const getLastLat = (path) => path[path.length - 1][1]
const viewCenter = (path, index) =>
  index !== null && index < path.length ? path[index] : path[path.length - 1]
const getLastLng = (path) => path[path.length - 1][0]
const displayPath = (
  path,
  numberFormatProps,
  selectedIndex,
  enabled,
  onSelect,
  onDeleteSelected
) => {
  return (
    <Box sx={styles.chipsContainer}>
      {path.map(([lng, lat], idx) => {
        const selected = idx === selectedIndex
        return (
          <Chip
            key={idx}
            avatar={<Avatar>{idx + 1}</Avatar>}
            label={`(${NumberFormat.format(lat, numberFormatProps)}, ${NumberFormat.format(lng, numberFormatProps)})`}
            color={selected ? 'primary' : 'default'}
            variant={selected ? 'filled' : 'outlined'}
            sx={styles.getChip(selected)}
            onClick={() => onSelect(idx)}
            onDelete={
              selected && enabled && path.length > 2
                ? onDeleteSelected
                : undefined
            }
          />
        )
      })}
    </Box>
  )
}

const PropLatLngPath = ({ prop, currentVal, sx = [], onChange }) => {
  const mapboxToken = useSelector(selectMapboxToken)
  const { enabled, placeholder, direction = 'row' } = prop
  const numberFormatProps = getCoordinateNumberFormat(prop)
  const { minZoom, maxZoom, defaultZoom, maxBounds } =
    getCoordinateMapOptions(prop)
  const linePaint = {
    'line-color': prop.pathColor ?? DEFAULT_LINE_PAINT['line-color'],
    'line-width': prop.pathWeight ?? DEFAULT_LINE_PAINT['line-width'],
  }
  const fieldsRef = useRef(null)
  const [toggleSize, setToggleSize] = useState(null)

  const containerRef = useRef(null)
  const mapOpenKey = `cave.latLngPath.mapOpen.${prop.id ?? prop.name}`
  const [showMap, setShowMapState] = useState(() => readStoredFlag(mapOpenKey))
  const setShowMap = (open) => {
    setShowMapState(open)
    writeStoredFlag(mapOpenKey, open)
  }
  const handleCloseMenu = () => setShowMap(false)

  const mapStyle = prop.mapStyle ?? 'mapbox://styles/mapbox/dark-v11'

  const getPathData = useCallback(
    (path) =>
      R.assocPath(
        ['geometry', 'coordinates'],
        adjustArcPath(path),
        PATH_SOURCE
      ),
    []
  )

  const defaultInputValues = currentVal ?? prop.value
  const [allInputValues, setAllInputValues] = useState(defaultInputValues)
  const [viewState, setViewState] = useState({
    latitude: getLastLat(allInputValues),
    longitude: getLastLng(allInputValues),
    zoom: defaultZoom,
  })
  const [manualInput, setManualInput] = useState(
    allInputValues[allInputValues.length - 1]
  )
  const [editState, setEditState] = useState(edit.NONE)
  const [pathData, setPathData] = useState(getPathData(allInputValues))
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)

  const entryVisible = editState !== edit.NONE || selectedIndex !== null
  useLayoutEffect(() => {
    if (fieldsRef.current) setToggleSize(fieldsRef.current.offsetHeight)
  }, [direction, entryVisible])
  const iconSize =
    toggleSize && direction === 'column' ? Math.round(toggleSize / 3) : 28

  const pointColor = prop.pathColor ?? '#03aaee'
  const pointsData = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: allInputValues.map((coordinates, index) => ({
        type: 'Feature',
        properties: { index },
        geometry: { type: 'Point', coordinates },
      })),
    }),
    [allInputValues]
  )
  const selectedKey = selectedIndex ?? -1
  const pointPaint = {
    'circle-radius': ['case', ['==', ['get', 'index'], selectedKey], 9, 6],
    'circle-color': [
      'case',
      ['==', ['get', 'index'], selectedKey],
      '#ffffff',
      pointColor,
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': pointColor,
  }
  const activeIndex = selectedIndex ?? allInputValues.length - 1
  const activePoint = allInputValues[activeIndex]

  useEffect(() => {
    const newValue = currentVal ?? prop.value
    setAllInputValues(newValue)
    setPathData(getPathData(newValue))
  }, [currentVal, getPathData, prop.value])

  useEffect(() => {
    const [lng, lat] = viewCenter(currentVal ?? prop.value, selectedIndex)
    setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng }))
  }, [currentVal, prop.value, selectedIndex])

  useEffect(() => {
    const newValue = currentVal ?? prop.value
    if (selectedIndex !== null && selectedIndex < newValue.length) {
      setManualInput(newValue[selectedIndex])
    } else {
      setSelectedIndex(null)
      setManualInput(newValue[newValue.length - 1])
    }
  }, [currentVal, prop.value, selectedIndex])

  const handleChangeAt = (index) => (event, newLatOrLng) => {
    setManualInput(R.update(index, newLatOrLng))
  }

  const handleAddManualInput = useCallback(() => {
    if (!enabled) return

    const clampedInput = [
      R.clamp(-180, 180)(manualInput[0]),
      R.clamp(-90, 90)(manualInput[1]),
    ]
    const updatedValue = (
      editState === edit.RESET ? [] : allInputValues
    ).concat([clampedInput])
    onChange(updatedValue)
    setAllInputValues(updatedValue)
    setPathData(getPathData(updatedValue))
    setViewState((prev) => ({
      ...prev,
      latitude: clampedInput[1],
      longitude: clampedInput[0],
    }))

    editState === edit.RESET && setEditState(edit.NONE)
  }, [allInputValues, editState, enabled, getPathData, manualInput, onChange])

  const handleDragEnd = useCallback(
    (event) => {
      if (!enabled) return
      const { lat: latitude, lng: longitude } = event.lngLat
      const point = [longitude, latitude]
      const updatedValue =
        selectedIndex !== null
          ? R.update(selectedIndex, point, allInputValues)
          : (editState === edit.RESET ? [] : allInputValues).concat([point])
      onChange(updatedValue)
      setAllInputValues(updatedValue)
      setPathData(getPathData(updatedValue))
      setViewState((prev) => ({ ...prev, latitude, longitude }))
      setManualInput(point)
    },
    [allInputValues, editState, enabled, getPathData, onChange, selectedIndex]
  )

  const handleClearPath = useCallback(() => {
    if (!enabled) return
    const resetValue = [allInputValues[0]]
    onChange(resetValue)
    setAllInputValues(resetValue)
    setPathData(getPathData(resetValue))
    setManualInput(resetValue[0])
    setEditState(edit.RESET)
    setSelectedIndex(null)
  }, [enabled, getPathData, allInputValues, onChange])

  const handleCancelEntry = () => {
    setSelectedIndex(null)
    setEditState(edit.NONE)
    setManualInput(allInputValues[allInputValues.length - 1])
  }

  const handleSelectPoint = (index) => {
    if (selectedIndex === index) {
      handleCancelEntry()
      return
    }
    setEditState(edit.NONE)
    setSelectedIndex(index)
    setManualInput(allInputValues[index])
  }

  const handleUpdateSelected = () => {
    if (!enabled || selectedIndex === null) return
    const point = [
      R.clamp(-180, 180, manualInput[0]),
      R.clamp(-90, 90, manualInput[1]),
    ]
    const updatedValue = R.update(selectedIndex, point, allInputValues)
    onChange(updatedValue)
    setAllInputValues(updatedValue)
    setPathData(getPathData(updatedValue))
    setViewState((prev) => ({
      ...prev,
      latitude: point[1],
      longitude: point[0],
    }))
    setManualInput(point)
    setSelectedIndex(null)
  }

  const handleDeleteSelected = () => {
    if (!enabled || selectedIndex === null || allInputValues.length <= 2) return
    const updatedValue = R.remove(selectedIndex, 1, allInputValues)
    onChange(updatedValue)
    setAllInputValues(updatedValue)
    setPathData(getPathData(updatedValue))
    const [lng, lat] = viewCenter(updatedValue, null)
    setViewState((prev) => ({ ...prev, latitude: lat, longitude: lng }))
    setManualInput(updatedValue[updatedValue.length - 1])
    setSelectedIndex(null)
  }

  const { ReactMapGl, Layer, Marker, NavigationControl, Source } = useMapApi()

  // RESET is the "Set As Start" flow after Clear Path, which adds the first point.
  const mapVisible =
    showMap &&
    (selectedIndex !== null ||
      editState === edit.ADD ||
      editState === edit.RESET)
  return (
    <Stack
      ref={containerRef}
      useFlexGap
      spacing={2}
      sx={[
        { width: '100%', height: '100%', alignSelf: 'stretch' },
        ...forceArray(sx),
      ]}
    >
      <ClickAwayListener
        onClickAway={(event) => {
          // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
          if (sessionStorage.getItem('mui-select-open-flag') === '1') return
          if (isEventInside(event, containerRef.current)) return
          handleCloseMenu()
        }}
      >
        <Popper
          disablePortal
          placement="right-start"
          anchorEl={containerRef.current}
          open={mapVisible}
          sx={[styles.popper, { width: containerRef.current?.offsetWidth }]}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <ReactMapGl
            {...viewState}
            {...{ minZoom, maxZoom, maxBounds }}
            mapboxAccessToken={mapboxToken}
            style={styles.map}
            mapStyle={mapStyle}
            onMove={(event) => setViewState(event.viewState)}
          >
            <Marker
              draggable={enabled}
              anchor="center"
              longitude={activePoint[0]}
              latitude={activePoint[1]}
              onDragEnd={handleDragEnd}
            />
            <Source id="polylineLayer" type="geojson" data={pathData}>
              <Layer
                id="path-line"
                type="line"
                layout={LINE_LAYOUT}
                paint={linePaint}
              />
            </Source>
            <Source id="pointsLayer" type="geojson" data={pointsData}>
              <Layer id="path-points" type="circle" paint={pointPaint} />
            </Source>
            <NavigationControl />
          </ReactMapGl>
        </Popper>
      </ClickAwayListener>
      {entryVisible ? (
        <>
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
                value={R.clamp(-90, 90)(manualInput[1])}
                onChange={handleChangeAt(1)}
                // onChangeCommitted={handleChangeCommittedAt(1)}
              />
              <NumberField
                disabled={!enabled}
                label="Longitude"
                {...{ placeholder, max: 180, min: -180 }}
                numberFormat={numberFormatProps}
                value={R.clamp(-180, 180)(manualInput[0])}
                onChange={handleChangeAt(0)}
                // onChangeCommitted={handleChangeCommittedAt(0)}
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
          <Stack useFlexGap direction="row" spacing={1}>
            {(editState === edit.ADD || selectedIndex !== null) && (
              <Button
                fullWidth
                color="error"
                variant="contained"
                startIcon={<MdOutlineCancel />}
                onClick={handleCancelEntry}
              >
                Cancel
              </Button>
            )}
            <Button
              fullWidth
              variant="contained"
              startIcon={<MdOutlineCheck />}
              onClick={
                selectedIndex !== null
                  ? handleUpdateSelected
                  : handleAddManualInput
              }
            >
              {selectedIndex !== null
                ? 'Update Point'
                : editState === edit.ADD
                  ? 'Add Point'
                  : 'Set As Start'}
            </Button>
          </Stack>
        </>
      ) : confirmingClear ? (
        <Stack spacing={1} direction="row">
          <Button
            sx={{ flexGrow: 1 }}
            color="error"
            variant="contained"
            startIcon={<PiEraser />}
            onClick={() => {
              handleClearPath()
              setConfirmingClear(false)
            }}
          >
            Confirm Clear
          </Button>
          <Button
            sx={{ flexGrow: 1 }}
            variant="contained"
            startIcon={<MdOutlineCancel />}
            onClick={() => setConfirmingClear(false)}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Stack spacing={1} direction="row">
          <Button
            disabled={!enabled}
            sx={{ flexGrow: 1 }}
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => {
              setSelectedIndex(null)
              setEditState(edit.ADD)
            }}
          >
            Add Point
          </Button>
          <Button
            disabled={!enabled}
            sx={{ flexGrow: 1 }}
            color="error"
            variant="contained"
            startIcon={<PiEraser />}
            onClick={() => setConfirmingClear(true)}
          >
            Clear Path
          </Button>
        </Stack>
      )}
      {editState !== edit.RESET &&
        displayPath(
          allInputValues,
          numberFormatProps,
          selectedIndex,
          enabled,
          handleSelectPoint,
          handleDeleteSelected
        )}
    </Stack>
  )
}
PropLatLngPath.propTypes = {
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

export default PropLatLngPath
