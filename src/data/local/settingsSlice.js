import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

import { themeId } from '../../utils/enums'

export const initialState = {
  theme: themeId.DARK,
  time: 0,
  touch: false,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themeSelection: (state) => {
      state.theme = state.theme === themeId.DARK ? themeId.LIGHT : themeId.DARK
    },
    timeSelection: (state, action) => {
      state.time = action.payload
    },
    // action.payload should be the timeLength
    timeAdvance: (state, action) => {
      state.time = state.time + 1 === action.payload ? 0 : state.time + 1
    },
    toggleTouch: (state) => {
      state.touch = !state.touch
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(state, R.propOr({}, 'settings', action.payload))
    })
  },
})

export const { themeSelection, timeSelection, timeAdvance, toggleTouch } =
  settingsSlice.actions

export default settingsSlice.reducer
