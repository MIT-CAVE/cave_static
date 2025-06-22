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
import { useCallback, useState } from 'react'
import {
  MdAddCircleOutline,
  MdOutlineCancel,
  MdOutlineCheck,
  MdUndo,
} from 'react-icons/md'
import { PiEraser } from 'react-icons/pi'
import { TfiMapAlt } from 'react-icons/tfi'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import {
  selectIsMapboxTokenProvided,
  selectMapboxToken,
} from '../../data/selectors'
import { useMenu } from '../../utils/hooks'
import useMapApi from '../views/map/useMapApi'

import { adjustArcPath, forceArray } from '../../utils'

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

const numberFormatProps = {
  precision: 6,
  trailingZeros: true,
  unitPlacement: 'afterWithSpace',
}

const edit = {
  NONE: '',
  ADD: 'add',
  RESET: 'reset',
}

const getLastLat = (path) => path[path.length - 1][1]
const getLastLng = (path) => path[path.length - 1][0]
const displayPath = (path) => {
  return (
    <List sx={styles.text}>
      {path.map(([lng, lat], idx) => {
        return (
          <ListItem key={idx} disablePadding sx={{ maxHeight: 200 }}>
            <ListItemButton component="a" href="#simple-list">
              <ListItemText
                primary={`(${lat.toFixed(6)}, ${lng.toFixed(6)})\n`}
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
  const { enabled, placeholder } = prop
  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const mapSettings = {
    style: {
      minHeight: '480px',
      height: 'auto',
      width: '100%',
      borderRadius: '4px',
      border: '1px solid rgb(128 128 128)',
      boxSizing: 'border-box',
    },
    mapStyle: isMapboxTokenProvided
      ? 'mapbox://styles/mapbox/dark-v11'
      : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    lineLayout: {
      'line-join': 'round',
      'line-cap': 'round',
    },
    linePaint: {
      'line-color': 'rgba(3, 170, 238, 0.5)',
      'line-width': 5,
    },
    pathSource: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    },
  }

  const getPathData = useCallback(
    (path) =>
      R.assocPath(
        ['geometry', 'coordinates'],
        adjustArcPath(path),
        mapSettings.pathSource
      ),
    [mapSettings.pathSource]
  )

  const [value, setValue] = useState(R.defaultTo(prop.value)(currentVal))
  const [viewState, setViewState] = useState({
    latitude: getLastLat(value),
    longitude: getLastLng(value),
  })
  const [manual, setManual] = useState(value[value.length - 1])
  const [editState, setEditState] = useState(edit.NONE)
  const [pathData, setPathData] = useState(getPathData(value))

  const handleChangeLatitude = useCallback(
    (latitude) => {
      if (!enabled) return
      setManual([manual[0], latitude])
    },
    [enabled, manual]
  )

  const handleChangeLongitude = useCallback(
    (longitude) => {
      if (!enabled) return
      setManual([longitude, manual[1]])
    },
    [enabled, manual]
  )

  const handleAddManualInput = useCallback(() => {
    if (!enabled) return

    const updatedValue = (editState === edit.RESET ? [] : value).concat([
      manual,
    ])
    onChange(updatedValue)
    setValue(updatedValue)
    setPathData(getPathData(updatedValue))
    setViewState({ latitude: manual[1], longitude: manual[0] })

    editState === edit.RESET && setEditState(edit.NONE)
  }, [editState, enabled, getPathData, manual, onChange, value])

  const handleDragEnd = useCallback(
    (event) => {
      if (!enabled) return
      const { lat: latitude, lng: longitude } = event.lngLat
      const updatedValue = (editState === edit.RESET ? [] : value).concat([
        [longitude, latitude],
      ])
      onChange(updatedValue)
      setValue(updatedValue)
      setPathData(getPathData(updatedValue))
      setViewState({ latitude, longitude })
      setManual([longitude, latitude])
    },
    [editState, enabled, getPathData, onChange, value]
  )

  const handleUndoLast = useCallback(() => {
    const lastIndex = value.length - 1
    if (!enabled || lastIndex <= 1) return

    const slicedPath = value.slice(0, lastIndex)
    onChange(slicedPath)
    setValue(slicedPath)
    setPathData(getPathData(slicedPath))
    setViewState({
      latitude: getLastLat(slicedPath),
      longitude: getLastLng(slicedPath),
    })
  }, [enabled, getPathData, onChange, value])

  const handleClearPath = useCallback(() => {
    setPathData(getPathData([value[0]]))
    setManual(value[0])
    setEditState(edit.RESET)
  }, [getPathData, value])

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
            mapboxAccessToken={mapboxToken}
            style={mapSettings.style}
            mapStyle={mapSettings.mapStyle}
            onMove={(event) => setViewState(event.viewState)}
          >
            <Marker
              draggable
              anchor="center"
              longitude={getLastLng(value)}
              latitude={getLastLat(value)}
              onDragEnd={handleDragEnd}
            />
            <Source id="polylineLayer" type="geojson" data={pathData}>
              <Layer
                id="path-line"
                type="line"
                source="my-data"
                layout={mapSettings.lineLayout}
                paint={mapSettings.linePaint}
              />
            </Source>
            <NavigationControl />
          </ReactMapGl>
        </Popper>
      </ClickAwayListener>
      {editState !== edit.NONE ? (
        <>
          <Stack useFlexGap direction="row" spacing={1}>
            <NumberInput
              disabled={!enabled}
              label="Latitude"
              {...{ placeholder, max: 90, min: -90 }}
              numberFormat={numberFormatProps}
              value={manual[1]}
              onClickAway={handleChangeLatitude}
            />
            <NumberInput
              disabled={!enabled}
              label="Longitude"
              {...{ placeholder, max: 180, min: -180 }}
              numberFormat={numberFormatProps}
              value={manual[0]}
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
      ) : (
        <Stack spacing={1} direction="row">
          <Button
            sx={{ flexGrow: 5 }}
            variant="contained"
            startIcon={<MdAddCircleOutline />}
            onClick={() => setEditState(edit.ADD)}
          >
            Enter Input Mode
          </Button>
          <Button
            disabled={value.length - 1 <= 1}
            sx={{ flexGrow: 3.5 }}
            color="warning"
            variant="contained"
            startIcon={<MdUndo />}
            onClick={handleUndoLast}
          >
            Undo Last
          </Button>
          <Button
            sx={{ flexGrow: 3.5 }}
            color="error"
            variant="contained"
            startIcon={<PiEraser />}
            onClick={handleClearPath}
          >
            Clear Path
          </Button>
        </Stack>
      )}
      {editState !== edit.RESET && displayPath(value)}
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
