import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

// import { clearVersions } from '../data'

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    session_id: 0,
    data: {},
  },
  reducers: {
    // Update sessions from ws message
    updateSessions: (state, action) => {
      // Clear versions if session_id changes to prevent id colisions
      // if (R.equals(action.payload.data_path, ['session_id'])) {
      //   action.asyncDispatch(clearVersions())
      // }
      return R.assocPath(action.payload.data_path, action.payload.data, state)
    },
  },
})

export const { updateSessions } = sessionsSlice.actions

export default sessionsSlice.reducer
