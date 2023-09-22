import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const loadingSlice = createSlice({
  name: 'loading',
  initialState: {
    session_loading: false,
    data_loading: false,
  },
  reducers: {
    // Update loading from ws message
    updateLoading: (state, action) => {
      return R.assocPath(
        action.payload.data.data_path,
        action.payload.data.data,
        state
      )
    },
  },
})

export const { updateLoading } = loadingSlice.actions

export default loadingSlice.reducer
