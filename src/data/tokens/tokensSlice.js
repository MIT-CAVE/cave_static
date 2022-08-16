import { createSlice } from '@reduxjs/toolkit'

export const tokensSlice = createSlice({
  name: 'tokens',
  initialState: {},
  reducers: {
    // Accept one or multiple tokens
    tokensSet: (state, action) => {
      Object.assign(state, action.payload)
    },
  },
})

export const { tokensSet } = tokensSlice.actions

export default tokensSlice.reducer
