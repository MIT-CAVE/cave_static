import {
  Button,
  ClickAwayListener,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
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
import {
  MdAddCircleOutline,
  MdOutlineCancel,
  MdOutlineCheck,
  MdUndo,
} from 'react-icons/md'
import { PiEraser } from 'react-icons/pi'
import { TfiMapAlt } from 'react-icons/tfi'
import { useSelector } from 'react-redux'

import {
  selectIsMapboxTokenProvided,
  selectMapboxToken,
} from '../../data/selectors'
import { useMenu } from '../../utils/hooks'
import NumberField from '../prototypes/NumberField'
import useMapApi from '../views/map/useMapApi'

import {
  NumberFormat,
  adjustArcPath,
  forceArray,
  getCoordinateMapOptions,
  getCoordinateNumberFormat,
} from '../../utils'

const styles = {
  text: {
    overflow: 'auto',
    maxHeight: 200,
    border: 1,
  },
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
const getLastLng = (path) => path[path.length - 1][0]
const displayPath = (path, numberFormatProps) => {
  return (
    <List sx={styles.text}>
      {path.map(([lng, lat], idx) => {
        return (
          <ListItem key={idx} disablePadding sx={{ maxHeight: 200 }}>
            <ListItemButton component="a" href="#simple-list">
              <ListItemText
                primary={`(${NumberFormat.format(lat, numberFormatProps)}, ${NumberFormat.format(lng, numberFormatProps)})\n`}
              />
            </ListItemButton>
          </ListItem>
        )
      })}
    </List>
  )
}

const PropLatLngPath = ({ prop, currentVal, sx = [], onChange }) => {
  const mapboxToken = useSelector(selectMapboxToken)
  const isMapboxTokenProvided = useSelector(selectIsMapboxTokenProvided)
  const { enabled, placeholder, direction = 'row' } = prop
  const numberFormatProps = getCoordinateNumberFormat(prop)
  const { minZoom, maxZoom, defaultZoom } = getCoordinateMapOptions(prop)
  const linePaint = {
    'line-color': prop.pathColor ?? DEFAULT_LINE_PAINT['line-color'],
    'line-width': prop.pathWeight ?? DEFAULT_LINE_PAINT['line-width'],
  }
  const fieldsRef = useRef(null)
  const [toggleSize, setToggleSize] = useState(null)

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const mapStyle =
    prop.mapStyle ??
    (isMapboxTokenProvided
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')

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

  useLayoutEffect(() => {
    if (fieldsRef.current) setToggleSize(fieldsRef.current.offsetHeight)
  }, [direction, editState])
  const iconSize =
    toggleSize && direction === 'column' ? Math.round(toggleSize / 3) : 28

  useEffect(() => {
    const newValue = currentVal ?? prop.value
    setAllInputValues(newValue)
    setViewState({
      latitude: getLastLat(newValue),
      longitude: getLastLng(newValue),
      zoom: defaultZoom,
    })
    setManualInput(newValue[newValue.length - 1])
    setPathData(getPathData(newValue))
  }, [currentVal, getPathData, prop.value, defaultZoom])

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
    setViewState({ latitude: clampedInput[1], longitude: clampedInput[0] })

    editState === edit.RESET && setEditState(edit.NONE)
  }, [allInputValues, editState, enabled, getPathData, manualInput, onChange])

  const handleDragEnd = useCallback(
    (event) => {
      if (!enabled) return
      const { lat: latitude, lng: longitude } = event.lngLat
      const updatedValue = (
        editState === edit.RESET ? [] : allInputValues
      ).concat([[longitude, latitude]])
      onChange(updatedValue)
      setAllInputValues(updatedValue)
      setPathData(getPathData(updatedValue))
      setViewState({ latitude, longitude })
      setManualInput([longitude, latitude])
    },
    [allInputValues, editState, enabled, getPathData, onChange]
  )

  const handleUndoLast = useCallback(() => {
    const lastIndex = allInputValues.length - 1
    if (!enabled || lastIndex <= 1) return

    const slicedPath = allInputValues.slice(0, lastIndex)
    onChange(slicedPath)
    setAllInputValues(slicedPath)
    setPathData(getPathData(slicedPath))
    setViewState({
      latitude: getLastLat(slicedPath),
      longitude: getLastLng(slicedPath),
    })
  }, [allInputValues, enabled, getPathData, onChange])

  const handleClearPath = useCallback(() => {
    if (!enabled) return
    const resetValue = [allInputValues[0]]
    onChange(resetValue)
    setAllInputValues(resetValue)
    setPathData(getPathData(resetValue))
    setManualInput(resetValue[0])
    setEditState(edit.RESET)
  }, [enabled, getPathData, allInputValues, onChange])

  const { ReactMapGl, Layer, Marker, NavigationControl, Source } = useMapApi()

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
            {...viewState}
            {...{ minZoom, maxZoom }}
            mapboxAccessToken={mapboxToken}
            style={styles.map}
            mapStyle={mapStyle}
            onMove={(event) => setViewState(event.viewState)}
          >
            <Marker
              draggable={enabled}
              anchor="center"
              longitude={getLastLng(allInputValues)}
              latitude={getLastLat(allInputValues)}
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
            <NavigationControl />
          </ReactMapGl>
        </Popper>
      </ClickAwayListener>
      {editState !== edit.NONE ? (
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
              onClick={showMap ? handleCloseMenu : handleOpenMenu}
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
            {editState === edit.ADD && (
              <Button
                fullWidth
                color="error"
                variant="contained"
                startIcon={<MdOutlineCancel />}
                onClick={() => setEditState(edit.NONE)}
              >
                Exit Input Mode
              </Button>
            )}
            <Button
              fullWidth
              variant="contained"
              startIcon={<MdOutlineCheck />}
              onClick={handleAddManualInput}
            >
              {editState === edit.ADD ? 'Add Input' : 'Set As Start'}
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
            sx={{ flexGrow: 5 }}
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => setEditState(edit.ADD)}
          >
            Enter Input Mode
          </Button>
          <Button
            disabled={!enabled || allInputValues.length < 3}
            sx={{ flexGrow: 3.5 }}
            color="warning"
            variant="contained"
            startIcon={<MdUndo />}
            onClick={handleUndoLast}
          >
            Undo Last
          </Button>
          <Button
            disabled={!enabled}
            sx={{ flexGrow: 3.5 }}
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
        displayPath(allInputValues, numberFormatProps)}
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
