import { createSlice } from '@reduxjs/toolkit'

export const timeSlice = createSlice({
  name: 'time',
  initialState: {
    animationInterval: false,
  },
  reducers: {
    updateAnimation: (state, action) => {
      state.animationInterval = action.payload
    },
  },
})

export const { updateAnimation } = timeSlice.actions

export default timeSlice.reducer
