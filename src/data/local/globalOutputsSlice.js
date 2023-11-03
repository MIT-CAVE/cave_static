import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from './actions'

export const globalOutputsSlice = createSlice({
  name: 'globalOutputs',
  initialState: {},
  reducers: {
    mapGlobalOutputToggle: (state, action) => {
      const path = [action.payload, 'mapGlobalOutput']
      return R.assocPath(path, !R.pathOr(false, path)(state))(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) =>
      R.mergeDeepRight(state, R.propOr({}, 'globalOutputs', action.payload))
    )
  },
})

export const { mapGlobalOutputToggle } = globalOutputsSlice.actions

export default globalOutputsSlice.reducer
