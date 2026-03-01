import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const timeSlice = createSlice({
  name: 'time',
  initialState: {
    animationInterval: false,
    continuousInterval: false,
  },
  reducers: {
    updateAnimation: (state, action) => {
      return R.assoc('animationInterval', action.payload, state)
    },
    updateAnimationContinuous: (state, action) => {
      return R.assoc('continuousInterval', action.payload, state)
    },
  },
})

export const { updateAnimation, updateAnimationContinuous } = timeSlice.actions

export default timeSlice.reducer
