import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    session_id: 0,
    data: {},
  },
  reducers: {
    // Update sessions from ws message
    updateSessions: (state, action) => {
      return R.assocPath(action.payload.data_path, action.payload.data, state)
    },
  },
})

export const { updateSessions } = sessionsSlice.actions

export default sessionsSlice.reducer
