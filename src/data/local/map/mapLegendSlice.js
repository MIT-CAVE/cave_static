import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from '../actions'

export const mapLegendSlice = createSlice({
  name: 'map',
  initialState: {
    isOpen: true,
    data: null,
  },
  reducers: {
    toggleMapLegend: (state) => {
      state.isOpen = !state.isOpen
    },
    // action.payload = {feature: nodes|arcs, type: string, by: size|color, value: string/null}
    updateBy: (state, action) => {
      state.data = R.assocPath(
        [action.payload.feature, action.payload.type, action.payload.by],
        action.payload.value
      )(state.data)
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

export const { toggleMapLegend, updateBy } = mapLegendSlice.actions

export default mapLegendSlice.reducer
