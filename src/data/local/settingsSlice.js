import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

import { themeId, viewId } from '../../utils/enums'

export const initialState = {
  theme: themeId.DARK,
  view: viewId.MAP,
  time: 0,
}

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    themeSelection: (state) => {
      state.theme = state.theme === themeId.DARK ? themeId.LIGHT : themeId.DARK
    },
    viewSelection: (state, action) => {
      state.view = action.payload
    },
    timeSelection: (state, action) => {
      state.time = action.payload
    },
    // action.payload should be the timeLength
    timeAdvance: (state, action) => {
      state.time = state.time + 1 === action.payload ? 0 : state.time + 1
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(state, R.propOr({}, 'settings', action.payload))
    })
  },
})

export const { themeSelection, viewSelection, timeSelection, timeAdvance } =
  settingsSlice.actions

export default settingsSlice.reducer
