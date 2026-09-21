import { createSlice } from '@reduxjs/toolkit'

import { overrideState } from './actions'

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
      const settings = action.payload?.settings || {}
      return deepMerge(state, settings)
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
