import { createSlice } from '@reduxjs/toolkit'

import { overrideState } from './actions'

import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM } from '../../utils/constants'
import { sendCommand } from '../data'

const clamp = (min, max, val) => Math.min(Math.max(val, min), max)

const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...(target || {}) }
  const sourceKeys = Object.keys(source)
  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i]
    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

const ensureMapControls = (state, mapId) => {
  if (!state.data) state.data = {}
  if (!state.data[mapId]) state.data[mapId] = {}
  if (!state.data[mapId].mapControls) state.data[mapId].mapControls = {}
  return state.data[mapId].mapControls
}

const ensureViewport = (state, mapId) => {
  const controls = ensureMapControls(state, mapId)
  if (!controls.viewport) controls.viewport = {}
  return controls.viewport
}

export const mapSlice = createSlice({
  name: 'maps',
  initialState: {},
  reducers: {
    // payload: { mapId, sync }
    toggleMapLegend: (state, action) => {
      const { mapId, sync } = action.payload
      if (!state.data) state.data = {}
      if (!state.data[mapId]) state.data[mapId] = {}
      if (!state.data[mapId].mapLegend) state.data[mapId].mapLegend = {}
      const currentIsOpen = state.data[mapId].mapLegend.isOpen !== false
      const value = !currentIsOpen
      state.data[mapId].mapLegend.isOpen = value

      const path = ['data', mapId, 'mapLegend', 'isOpen']
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
    },
    // payload: { mapId, sync }
    bearingSliderToggle: (state, action) => {
      const { mapId, sync } = action.payload
      const controls = ensureMapControls(state, mapId)
      const value = !controls.showBearingSlider
      controls.showBearingSlider = value

      const path = ['data', mapId, 'mapControls', 'showBearingSlider']
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
    },
    // payload: { mapId, sync }
    pitchSliderToggle: (state, action) => {
      const { mapId, sync } = action.payload
      const controls = ensureMapControls(state, mapId)
      const value = !controls.showPitchSlider
      controls.showPitchSlider = value

      const path = ['data', mapId, 'mapControls', 'showPitchSlider']
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
    },
    // payload: {value: int, mapId:string, sync:bool}
    bearingUpdate: (state, action) => {
      const { mapId, value, sync } = action.payload
      const vp = ensureViewport(state, mapId)
      vp.bearing = value

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
    },
    // payload: {value: int, mapId:string, sync:bool}
    pitchUpdate: (state, action) => {
      const { mapId, value, sync } = action.payload
      const vp = ensureViewport(state, mapId)
      vp.pitch = value

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
    },
    // payload: {viewport:object, mapId:string, sync:bool}
    viewportUpdate: (state, action) => {
      const { mapId, viewport, sync } = action.payload
      const currentVp = state.data?.[mapId]?.mapControls?.viewport || {}
      const minZoom = clamp(MIN_ZOOM, MAX_ZOOM, currentVp.minZoom ?? MIN_ZOOM)
      const maxZoom = clamp(minZoom, MAX_ZOOM, currentVp.maxZoom ?? MAX_ZOOM)
      const zoom = clamp(minZoom, maxZoom, viewport?.zoom ?? 0)
      const clampedViewport = { ...viewport, zoom }
      const finalViewport = { ...DEFAULT_VIEWPORT, ...clampedViewport }

      const controls = ensureMapControls(state, mapId)
      controls.viewport = finalViewport

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
    },
    // payload: {rate: int|float, mapId:string, sync:bool}
    viewportRotate: (state, action) => {
      const { mapId, rate, sync } = action.payload
      const currentVp = {
        ...DEFAULT_VIEWPORT,
        ...(state.data?.[mapId]?.mapControls?.viewport || {}),
      }
      const newLongitude = (currentVp.longitude + rate) % 360
      const vp = ensureViewport(state, mapId)
      vp.longitude = newLongitude

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
    },
    // payload: {value:int|float, mapId:string, sync:bool}
    setZoom: (state, action) => {
      const { mapId, value, sync } = action.payload
      const currentVp = state.data?.[mapId]?.mapControls?.viewport || {}
      const minZoom = clamp(MIN_ZOOM, MAX_ZOOM, currentVp.minZoom ?? MIN_ZOOM)
      const maxZoom = clamp(minZoom, MAX_ZOOM, currentVp.maxZoom ?? MAX_ZOOM)
      const zoom = clamp(minZoom, maxZoom, value)
      const vp = ensureViewport(state, mapId)
      vp.zoom = zoom

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
    },
    // payload: {value:int|float, mapId:string, sync:bool}
    changeZoom: (state, action) => {
      const { mapId, value, sync } = action.payload
      const currentVp = state.data?.[mapId]?.mapControls?.viewport || {}
      const minZoom = clamp(MIN_ZOOM, MAX_ZOOM, currentVp.minZoom ?? MIN_ZOOM)
      const maxZoom = clamp(minZoom, MAX_ZOOM, currentVp.maxZoom ?? MAX_ZOOM)
      const currentZoom = currentVp.zoom ?? minZoom
      const zoom = clamp(minZoom, maxZoom, currentZoom + value)
      const vp = ensureViewport(state, mapId)
      vp.zoom = zoom

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
    },
    // payload: { feature: string, mapId: string, sync: bool }
    openMapModal: (state, action) => {
      const { feature, mapId, sync } = action.payload
      const currentModal = state.mapModal || {
        isOpen: false,
        data: {
          feature: '',
        },
      }
      const isOpen =
        currentModal.data?.feature === 'stats' && state.mapModal?.isOpen
          ? !state.mapModal.isOpen
          : true
      const newValue = {
        isOpen,
        data: { feature, mapId },
      }
      state.mapModal = newValue

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
    },
    // payload: { sync: bool }
    closeMapModal: (state, action) => {
      const { sync } = action.payload || {}
      const closedModal = {
        isOpen: false,
        data: {
          feature: '',
        },
      }
      state.mapModal = closedModal

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
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      const maps = action.payload?.maps || {}
      return deepMerge(state, maps)
    })
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
