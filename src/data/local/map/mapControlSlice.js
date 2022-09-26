import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import {
  DEFAULT_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  STYLE_URL_BASE,
} from '../../../utils/constants'
import { overrideState } from '../actions'

export const mapControlSlice = createSlice({
  name: 'map',
  initialState: {},
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
      state[action.payload.appBarId].viewport.bearing = action.payload.value
    },
    pitchUpdate: (state, action) => {
      state[action.payload.appBarId].viewport.pitch = action.payload.value
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
        R.propOr(0, 'zoom', action.payload.viewport)
      )
      const clampedViewport = R.assoc('zoom', zoom, action.payload.viewport)
      return R.assocPath(
        [action.payload.appBarId, 'viewport'],
        R.mergeRight(DEFAULT_VIEWPORT)(clampedViewport),
        state
      )
    },
    setZoom: (state, action) => {
      const viewport = state[action.payload.appBarId].viewport
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.propOr(MIN_ZOOM, 'minZoom', viewport)
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.propOr(MAX_ZOOM, 'maxZoom', viewport)
      )
      state[action.payload.appBarId].viewport.zoom = R.clamp(
        minZoom,
        maxZoom
      )(action.payload.value)
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
