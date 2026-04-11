import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const initialState = {
  // currentTime: 0,
  startTime: null,
  currentTimeContinuous: 0,
  pausedTime: null,
  lastTickTime: null,
  mirror: false,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    timeSelection: (state, action) => {
      state.currentTimeContinuous = action.payload
      state.startTime = performance.now() / 1000 - action.payload
      state.lastTickTime = performance.now() / 1000
      if (state.pausedTime !== null) {
        state.pausedTime = performance.now() / 1000
      }
    },
    // action.payload should be the timeLength
    // timeAdvance: (state, action) => {
    //   // state.currentTime =
    //   //   state.currentTime + 1 > action.payload ? 0 : state.currentTime + 1
    // },
    timeSetStart: (state) => {
      state.startTime = performance.now() / 1000 - state.currentTimeContinuous
      state.pausedTime = null
      state.lastTickTime = performance.now() / 1000
    },
    // action.payload should be the playbackSpeed
    timeAdvanceContinuous: (state, action) => {
      const currentTickTime = performance.now() / 1000
      const diff =
        state.lastTickTime !== null ? currentTickTime - state.lastTickTime : 0
      state.currentTimeContinuous += diff * action.payload
      state.lastTickTime = currentTickTime
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
  // timeAdvance,
  timeSetStart,
  timeAdvanceContinuous,
  timePause,
  toggleMirror,
  toggleEditLayout,
} = settingsSlice.actions

export default settingsSlice.reducer
