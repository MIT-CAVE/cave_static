import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_VIEWPORT,
  MAX_PITCH,
  MAX_ZOOM,
  MIN_PITCH,
  MIN_ZOOM,
  STYLE_URL_BASE,
} from '../../../utils/constants'
import { overrideState } from '../actions'

export const mapControlSlice = createSlice({
  name: 'map',
  initialState: {
    viewport: {
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      minPitch: MIN_PITCH,
      maxPitch: MAX_PITCH,
    },
  },
  reducers: {
    bearingSliderToggle: (state) => {
      state.showBearingSlider = !state.showBearingSlider
    },
    pitchSliderToggle: (state) => {
      state.showPitchSlider = !state.showPitchSlider
    },
    mapStyleSelection: (state, action) => {
      state.mapStyle = action.payload
        ? `${STYLE_URL_BASE}${action.payload}`
        : null
    },
    bearingUpdate: (state, action) => {
      state.viewport.bearing = action.payload
    },
    pitchUpdate: (state, action) => {
      state.viewport.pitch = action.payload
    },
    viewportUpdate: (state, action) => {
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.propOr(MIN_ZOOM, 'minZoom', state.viewport)
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.propOr(MAX_ZOOM, 'maxZoom', state.viewport)
      )
      const zoom = R.clamp(
        minZoom,
        maxZoom,
        R.propOr(0, 'zoom', action.payload)
      )
      const clampedViewport = R.assoc('zoom', zoom, action.payload)
      state.viewport = R.mergeRight(DEFAULT_VIEWPORT)(clampedViewport)
    },
    setZoom: (state, action) => {
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.propOr(MIN_ZOOM, 'minZoom', state.viewport)
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.propOr(MAX_ZOOM, 'maxZoom', state.viewport)
      )
      state.viewport.zoom = R.clamp(minZoom, maxZoom)(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(
        state,
        R.pathOr({}, ['map', 'mapControls'], action.payload)
      )
    })
  },
})

export const {
  bearingSliderToggle,
  pitchSliderToggle,
  mapStyleSelection,
  bearingUpdate,
  pitchUpdate,
  viewportUpdate,
  setZoom,
} = mapControlSlice.actions

export default mapControlSlice.reducer
