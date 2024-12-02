import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { clearVersions } from '../data'

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    session_id: 0,
    data: {},
  },
  reducers: {
    // Update sessions from ws message
    updateSessions: (state, action) => {
      action.asyncDispatch(clearVersions())
      return R.assocPath(
        action.payload.data.data_path,
        action.payload.data.data,
        state
      )
    },
  },
})

export const { updateSessions } = sessionsSlice.actions

export default sessionsSlice.reducer
