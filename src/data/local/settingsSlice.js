import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const initialState = {
  time: 0,
  mirror: false,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    timeSelection: (state, action) => {
      state.time = action.payload
    },
    // action.payload should be the timeLength
    timeAdvance: (state, action) => {
      state.time = state.time + 1 === action.payload ? 0 : state.time + 1
    },
    toggleMirror: (state) => {
      state.mirror = !state.mirror
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(state, R.propOr({}, 'settings', action.payload))
    })
  },
})

export const { timeSelection, timeAdvance, toggleTouch, toggleMirror } =
  settingsSlice.actions

export default settingsSlice.reducer
