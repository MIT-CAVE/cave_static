import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    sessionId: 0,
  },
  reducers: {
    // Update sessions from ws message
    mutateSessions: (state, action) => {
      return R.assocPath(
        R.drop(1, action.payload.data_path),
        action.payload.data,
        state
      )
    },
  },
})

export const { mutateSessions } = sessionsSlice.actions

export default sessionsSlice.reducer
