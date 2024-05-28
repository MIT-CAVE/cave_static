import {
  Box,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'
import {
  MdAddBox,
  MdCancel,
  MdCheckCircle,
  MdDeleteForever,
  MdUndo,
} from 'react-icons/md'
import { Map, Marker, NavigationControl, Source, Layer } from 'react-map-gl'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectMapboxToken } from '../../data/selectors'

import { forceArray } from '../../utils'

const styles = {
  getBoxStyle: (enabled) => ({
    p: 1,
    width: '100%',
    pointerEvents: enabled ? '' : 'none',
    opacity: enabled ? '' : 0.7,
  }),
  button: {
    margin: 10,
  },
  text: {
    overflow: 'auto',
    maxHeight: 200,
    border: 1,
    margin: 1,
  },
}

const mapSettings = {
  style: {
    width: 480,
    height: 480,
    margin: 10,
  },
  mapStyle: 'mapbox://styles/mapbox/dark-v11',
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
      {path.map(([lng, lat]) => {
        return (
          <ListItem disablePadding maxHeight={200}>
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
const getPathData = (path) =>
  R.assocPath(['geometry', 'coordinates'], path, mapSettings.pathSource)

const PropLatLngPath = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const mapboxToken = useSelector(selectMapboxToken)
  const enabled = prop.enabled || false
  const [value, setValue] = useState(
    R.defaultTo(R.prop('value', prop), currentVal)
  )
  const [viewState, setViewState] = useState({
    latitude: getLastLat(value),
    longitude: getLastLng(value),
  })
  const [manual, setManual] = useState(value[value.length - 1])
  const [editState, setEditState] = useState(edit.NONE)
  const [pathData, setPathData] = useState(getPathData(value))

  const inputLat = (lat) => {
    if (!enabled) return
    setManual([manual[0], lat])
  }

  const inputLng = (lng) => {
    if (!enabled) return
    setManual([lng, manual[1]])
  }

  const addManual = () => {
    if (!enabled) return
    const updatedValue = (editState === edit.RESET ? [] : value).concat([
      manual,
    ])
    onChange(updatedValue)
    setValue(updatedValue)
    setPathData(getPathData(updatedValue))
    setViewState({ latitude: manual[1], longitude: manual[0] })
  }

  const onDragEnd = (event) => {
    if (!enabled) return
    const updatedValue = (editState === edit.RESET ? [] : value).concat([
      [event.lngLat.lng, event.lngLat.lat],
    ])
    onChange(updatedValue)
    setValue(updatedValue)
    setPathData(getPathData(updatedValue))
    setViewState({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    setManual([event.lngLat.lng, event.lngLat.lat])
  }

  const slicePath = (endIndex) => {
    if (!enabled || value.length <= 1) return
    const slicedPath = value.slice(0, endIndex)
    onChange(slicedPath)
    setValue(slicedPath)
    setPathData(getPathData(slicedPath))
    setViewState({
      latitude: getLastLat(slicedPath),
      longitude: getLastLng(slicedPath),
    })
  }

  return (
    <Box>
      {editState !== edit.NONE ? (
        <>
          <Box sx={[styles.getBoxStyle(enabled), ...forceArray(sx)]} {...props}>
            <Typography> Latitude </Typography>
            <NumberInput
              {...{ enabled, max: 90, min: -90 }}
              numberFormat={numberFormatProps}
              value={manual[1]}
              onClickAway={inputLat}
            />
          </Box>
          <Box sx={[styles.getBoxStyle(enabled), ...forceArray(sx)]} {...props}>
            <Typography> Longitude </Typography>
            <NumberInput
              {...{ enabled, max: 180, min: -180 }}
              numberFormat={numberFormatProps}
              value={manual[0]}
              onClickAway={inputLng}
            />
          </Box>
          <Button
            style={styles.button}
            variant="contained"
            startIcon={<MdCheckCircle />}
            onClick={() => {
              addManual()
              editState === edit.RESET && setEditState(edit.NONE)
            }}
          >
            {editState === edit.ADD ? 'Add Input' : 'Set As Start'}
          </Button>
          {editState === edit.ADD && (
            <Button
              style={styles.button}
              variant="contained"
              startIcon={<MdCancel />}
              onClick={() => setEditState(edit.NONE)}
            >
              Quit Input
            </Button>
          )}
        </>
      ) : (
        <>
          <Button
            style={styles.button}
            variant="contained"
            startIcon={<MdAddBox />}
            onClick={() => setEditState(edit.ADD)}
          >
            Add Input
          </Button>
          <Button
            style={styles.button}
            variant="contained"
            startIcon={<MdUndo />}
            onClick={() => slicePath(value.length - 1)}
          >
            Undo Last
          </Button>
          <Button
            style={styles.button}
            variant="contained"
            startIcon={<MdDeleteForever />}
            onClick={() => {
              setPathData(getPathData([value[0]]))
              setManual(value[0])
              setEditState(edit.RESET)
            }}
          >
            Clear Path
          </Button>
        </>
      )}

      <Map
        {...viewState}
        mapboxAccessToken={mapboxToken}
        style={mapSettings.style}
        mapStyle={mapSettings.mapStyle}
        onMove={(event) => setViewState(event.viewState)}
      >
        <Marker
          longitude={getLastLng(value)}
          latitude={getLastLat(value)}
          onDragEnd={onDragEnd}
          draggable={true}
          anchor="center"
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
      </Map>
      {editState !== edit.RESET && displayPath(value)}
    </Box>
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
