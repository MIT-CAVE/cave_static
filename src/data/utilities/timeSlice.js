import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const timeSlice = createSlice({
  name: 'time',
  initialState: {
    animationInterval: false,
  },
  reducers: {
    updateAnimation: (state, action) => {
      return R.assoc('animationInterval', action.payload, state)
    },
  },
})

export const { updateAnimation } = timeSlice.actions

export default timeSlice.reducer
