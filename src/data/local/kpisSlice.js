import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const kpisSlice = createSlice({
  name: 'kpis',
  initialState: {},
  reducers: {
    mapKpiToggle: (state, action) => {
      const path = [action.payload, 'mapKpi']
      return R.assocPath(path, !R.pathOr(false, path)(state))(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) =>
      R.mergeDeepRight(state, R.propOr({}, 'kpis', action.payload))
    )
  },
})

export const { mapKpiToggle } = kpisSlice.actions

export default kpisSlice.reducer
