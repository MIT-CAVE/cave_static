import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from '../actions'

export const mapLegendSlice = createSlice({
  name: 'map',
  initialState: {},
  reducers: {
    // payload appBarId
    toggleMapLegend: (state, action) => {
      return R.assocPath(
        [action.payload, 'isOpen'],
        !R.pathOr(true, [action.payload, 'isOpen']),
        state
      )
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(
        state,
        R.pathOr({}, ['map', 'mapLegend'], action.payload)
      )
    })
  },
})

export const { toggleMapLegend } = mapLegendSlice.actions

export default mapLegendSlice.reducer
