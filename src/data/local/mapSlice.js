import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM } from '../../utils/constants'
import { sendCommand } from '../data'

export const mapSlice = createSlice({
  name: 'maps',
  initialState: {},
  reducers: {
    // payload: { mapId, sync }
    toggleMapLegend: (state, action) => {
      const { mapId, sync } = action.payload
      const path = ['data', mapId, 'mapLegend', 'isOpen']
      const value = !R.pathOr(true, path, state)
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: value,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, value, state)
    },
    // payload: { mapId, sync }
    bearingSliderToggle: (state, action) => {
      const { mapId, sync } = action.payload
      const path = ['data', mapId, 'mapControls', 'showBearingSlider']
      const value = !R.pathOr(false, path, state)
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: value,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, value, state)
    },
    // payload: { mapId, sync }
    pitchSliderToggle: (state, action) => {
      const { mapId, sync } = action.payload
      const path = ['data', mapId, 'mapControls', 'showPitchSlider']
      const value = !R.pathOr(false, path, state)
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: value,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, value, state)
    },
    // payload: {value: int, mapId:string, sync:bool}
    bearingUpdate: (state, action) => {
      const { mapId, value, sync } = action.payload
      const path = ['data', mapId, 'mapControls', 'viewport', 'bearing']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: value,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, value, state)
    },
    // payload: {value: int, mapId:string, sync:bool}
    pitchUpdate: (state, action) => {
      const { mapId, value, sync } = action.payload
      const path = ['data', mapId, 'mapControls', 'viewport', 'pitch']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: value,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, value, state)
    },
    // payload: {viewport:object, mapId:string, sync:bool}
    viewportUpdate: (state, action) => {
      const { mapId, viewport, sync } = action.payload
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const zoom = R.clamp(minZoom, maxZoom, R.propOr(0, 'zoom', viewport))
      const clampedViewport = R.assoc('zoom', zoom, viewport)
      const finalViewport = R.mergeRight(DEFAULT_VIEWPORT)(clampedViewport)

      const path = ['data', mapId, 'mapControls', 'viewport']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: finalViewport,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, finalViewport, state)
    },
    // payload: {rate: int|float, mapId:string, sync:bool}
    viewportRotate: (state, action) => {
      const { mapId, rate, sync } = action.payload
      const currentViewport = R.mergeDeepRight(
        DEFAULT_VIEWPORT,
        R.pathOr({}, ['data', mapId, 'mapControls', 'viewport'], state)
      )
      const newLongitude = (currentViewport.longitude + rate) % 360
      const path = ['data', mapId, 'mapControls', 'viewport', 'longitude']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: newLongitude,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, newLongitude, state)
    },
    // payload: {value:int|float, mapId:string, sync:bool}
    setZoom: (state, action) => {
      const { mapId, value, sync } = action.payload
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const zoom = R.clamp(minZoom, maxZoom)(value)
      const path = ['data', mapId, 'mapControls', 'viewport', 'zoom']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: zoom,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, zoom, state)
    },
    // payload: {value:int|float, mapId:string, sync:bool}
    changeZoom: (state, action) => {
      const { mapId, value, sync } = action.payload
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const currentZoom = R.pathOr(
        minZoom,
        ['data', mapId, 'mapControls', 'viewport', 'zoom'],
        state
      )
      const zoom = R.pipe(R.add(currentZoom), R.clamp(minZoom, maxZoom))(value)
      const path = ['data', mapId, 'mapControls', 'viewport', 'zoom']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: zoom,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, zoom, state)
    },
    // payload: { feature: string, mapId: string, sync: bool }
    openMapModal: (state, action) => {
      const { feature, mapId, sync } = action.payload
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
        },
        ['mapModal'],
        state
      )
      const openedModal = R.assoc(
        'isOpen',
        currentModal.data.feature === 'stats' && state.isOpen
          ? !state.isOpen
          : true,
        currentModal
      )
      const newValue = R.assoc('data', { feature, mapId }, openedModal)
      const path = ['mapModal']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: newValue,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, newValue, state)
    },
    // payload: { sync: bool }
    closeMapModal: (state, action) => {
      const { sync } = action.payload || {}
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
        },
        ['mapModal'],
        state
      )
      const closedModal = R.pipe(
        R.assoc('isOpen', false),
        R.assocPath(['data', 'feature'], '')
      )(currentModal)
      const path = ['mapModal']
      if (sync) {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: 'maps',
              data_path: path,
              data_value: closedModal,
              mutation_type: 'mutate',
            },
          })
        )
      }
      return R.assocPath(path, closedModal, state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) =>
      R.mergeDeepRight(state, R.propOr({}, 'maps', action.payload))
    )
  },
})

export const {
  toggleMapLegend,
  bearingSliderToggle,
  pitchSliderToggle,
  bearingUpdate,
  pitchUpdate,
  viewportUpdate,
  setZoom,
  changeZoom,
  openMapModal,
  closeMapModal,
  viewportRotate,
} = mapSlice.actions

export default mapSlice.reducer
