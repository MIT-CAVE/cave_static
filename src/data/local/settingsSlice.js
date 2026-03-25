import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const initialState = {
  currentTime: 0, // discrete
  startTime: null, // continuous
  currentTimeContinuous: 0, // continuous
  pausedTime: null, // continuous
  mirror: false,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    timeSelection: (state, action) => {
      state.currentTime = action.payload
      state.currentTimeContinuous = action.payload
      state.startTime = performance.now() / 1000 - action.payload
      if (state.pausedTime !== null) {
        state.pausedTime = performance.now() / 1000
      }
    },
    // action.payload should be the timeLength
    timeAdvance: (state, action) => {
      state.currentTime =
        state.currentTime + 1 > action.payload ? 0 : state.currentTime + 1
    },
    timeSetStart: (state) => {
      state.startTime = performance.now() / 1000 - state.currentTimeContinuous
      state.pausedTime = null
    },
    timeAdvanceContinuous: (state) => {
      state.currentTimeContinuous = performance.now() / 1000 - state.startTime
    },
    timePause: (state) => {
      if (state.startTime !== null && state.pausedTime === null) {
        state.pausedTime = performance.now() / 1000
      }
    },
    toggleMirror: (state) => {
      state.mirror = !state.mirror
    },
    toggleEditLayout: (state) => {
      state.editLayout = !state.editLayout
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(state, R.propOr({}, 'settings', action.payload))
    })
  },
})

export const {
  timeSelection,
  timeAdvance,
  timeSetStart,
  timeAdvanceContinuous,
  timePause,
  toggleMirror,
  toggleEditLayout,
} = settingsSlice.actions

export default settingsSlice.reducer
