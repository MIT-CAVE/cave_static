import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {},
  reducers: {
    // Update sessions list from ws message
    updateTeam: (state, action) => {
      const teamId = R.path(['data', 'team__id'], action.payload)
      return R.assoc(teamId, R.prop('data', action.payload), state)
    },
  },
})

export const { updateTeam } = sessionsSlice.actions

export default sessionsSlice.reducer
