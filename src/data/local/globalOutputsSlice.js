import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const globalOutputsSlice = createSlice({
  name: 'globalOutputs',
  initialState: {},
  reducers: {
    mapKpiToggle: (state, action) => {
      const path = [action.payload, 'mapKpi']
      return R.assocPath(path, !R.pathOr(false, path)(state))(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) =>
      R.mergeDeepRight(state, R.propOr({}, 'globalOutputs', action.payload))
    )
  },
})

export const { mapKpiToggle } = globalOutputsSlice.actions

export default globalOutputsSlice.reducer
