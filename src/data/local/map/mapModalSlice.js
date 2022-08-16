import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideState } from '../actions'

export const mapModalSlice = createSlice({
  name: 'map',
  initialState: {
    isOpen: false,
    data: {
      feature: '',
    },
    isError: false,
    errorText: '',
  },
  reducers: {
    openMapModal: (state, action) => {
      state.isOpen =
        state.data.feature === 'stats' && state.isOpen ? !state.isOpen : true
      state.data = action.payload.data
    },
    closeMapModal: (state) => {
      state.isOpen = false
      state.data = { feature: '' }
    },
    openError: (state, action) => {
      state.isError = true
      state.errorText = action.payload
    },
    closeError: (state) => {
      state.isError = false
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      return R.mergeDeepRight(
        state,
        R.pathOr({}, ['map', 'mapModal'], action.payload)
      )
    })
  },
})

export const { openMapModal, closeMapModal, openError, closeError } =
  mapModalSlice.actions

export default mapModalSlice.reducer
