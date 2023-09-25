import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

import { DEFAULT_VIEWPORT, MAX_ZOOM, MIN_ZOOM } from '../../utils/constants'

export const mapSlice = createSlice({
  name: 'maps',
  initialState: {},
  reducers: {
    // payload mapId
    toggleMapLegend: (state, action) => {
      return R.assocPath(
        ['data', action.payload, 'mapLegend', 'isOpen'],
        !R.pathOr(true, ['data', action.payload, 'mapLegend', 'isOpen'], state),
        state
      )
    },
    // payload mapId
    bearingSliderToggle: (state, action) => {
      return R.assocPath(
        ['data', action.payload, 'mapControls', 'showBearingSlider'],
        !R.pathOr(
          false,
          ['data', action.payload, 'mapControls', 'showBearingSlider'],
          state
        ),
        state
      )
    },
    // payload mapId
    pitchSliderToggle: (state, action) => {
      return R.assocPath(
        ['data', action.payload, 'mapControls', 'showPitchSlider'],
        !R.pathOr(
          false,
          ['data', action.payload, 'mapControls', 'showPitchSlider'],
          state
        ),
        state
      )
    },
    // payload: {value: int, mapId:string}
    bearingUpdate: (state, action) => {
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'bearing'],
        action.payload.value
      )(state)
    },
    // payload: {value: int, mapId:string}
    pitchUpdate: (state, action) => {
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'pitch'],
        action.payload.value
      )(state)
    },
    // payload: {viewport:object, mapId:string}
    viewportUpdate: (state, action) => {
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const zoom = R.clamp(
        minZoom,
        maxZoom,
        R.propOr(0, 'zoom', action.payload.viewport)
      )
      const clampedViewport = R.assoc('zoom', zoom, action.payload.viewport)
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport'],
        R.mergeRight(DEFAULT_VIEWPORT)(clampedViewport),
        state
      )
    },
    // payload: {rate: int|float, mapId:string}
    viewportRotate: (state, action) => {
      const currentViewport = R.mergeDeepRight(
        DEFAULT_VIEWPORT,
        R.pathOr(
          {},
          ['data', action.payload.mapId, 'mapControls', 'viewport'],
          state
        )
      )
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'longitude'],
        (currentViewport.longitude + action.payload.rate) % 360,
        state
      )
    },
    // payload: {value:int|float, currentPage:string}
    setZoom: (state, action) => {
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const zoom = R.clamp(minZoom, maxZoom)(action.payload.value)
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'zoom'],
        zoom
      )(state)
    },
    // payload: {value:int|float, mapId:string}
    changeZoom: (state, action) => {
      const minZoom = R.clamp(
        MIN_ZOOM,
        MAX_ZOOM,
        R.pathOr(
          MIN_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'minZoom'],
          state
        )
      )
      const maxZoom = R.clamp(
        minZoom,
        MAX_ZOOM,
        R.pathOr(
          MAX_ZOOM,
          ['data', action.payload.mapId, 'mapControls', 'viewport', 'maxZoom'],
          state
        )
      )
      const currentZoom = R.pathOr(
        minZoom,
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'zoom'],
        state
      )
      const zoom = R.pipe(
        R.add(currentZoom),
        R.clamp(minZoom, maxZoom)
      )(action.payload.value)
      return R.assocPath(
        ['data', action.payload.mapId, 'mapControls', 'viewport', 'zoom'],
        zoom
      )(state)
    },
    // payload: {data:object, mapId:string}
    openMapModal: (state, action) => {
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
          isError: false,
          errorText: '',
        },
        ['data', action.payload.mapId, 'mapModal'],
        state
      )
      const openedModal = R.assoc(
        'isOpen',
        currentModal.data.feature === 'stats' && state.isOpen
          ? !state.isOpen
          : true,
        currentModal
      )
      return R.assocPath(
        ['data', action.payload.mapId, 'mapModal'],
        R.assoc('data', action.payload.data, openedModal),
        state
      )
    },
    // payload: mapId:string
    closeMapModal: (state, action) => {
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
          isError: false,
          errorText: '',
        },
        ['data', action.payload, 'mapModal'],
        state
      )
      const closedModal = R.assoc('isOpen', false, currentModal)
      return R.assocPath(
        ['data', action.payload, 'mapModal'],
        R.assoc('data', { feature: '' }, closedModal),
        state
      )
    },
    // payload: {errorText:string, mapId:string}
    openError: (state, action) => {
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
          isError: false,
          errorText: '',
        },
        ['data', action.payload.mapId, 'mapModal'],
        state
      )
      const errorModal = R.assoc('isError', true, currentModal)
      return R.assocPath(
        ['data', action.payload.mapId, 'mapModal'],
        R.assoc('errorText', action.payload.errorText, errorModal),
        state
      )
    },
    // payload: mapId:string
    closeError: (state, action) => {
      const currentModal = R.pathOr(
        {
          isOpen: false,
          data: {
            feature: '',
          },
          isError: false,
          errorText: '',
        },
        ['data', action.payload, 'mapModal'],
        state
      )
      return R.assocPath(
        ['data', action.payload, 'mapModal'],
        R.assoc('isError', false, currentModal),
        state
      )
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) =>
      R.mergeDeepRight(state, R.propOr({}, 'map', action.payload))
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
  openError,
  closeError,
  viewportRotate,
} = mapSlice.actions

export default mapSlice.reducer
