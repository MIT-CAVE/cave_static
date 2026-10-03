import { createSlice } from '@reduxjs/toolkit'

import { clearVersions } from '../data'

const setPath = (obj, path, value) => {
  if (!path || path.length === 0) return value
  let current = obj
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    if (current[key] == null || typeof current[key] !== 'object') {
      current[key] = typeof path[i + 1] === 'number' ? [] : {}
    }
    current = current[key]
  }
  current[path[path.length - 1]] = value
  return obj
}

export const sessionsSlice = createSlice({
  name: 'sessions',
  initialState: {
    session_id: 0,
    data: {},
  },
  reducers: {
    // Update sessions from ws message
    updateSessions: (state, action) => {
      const dataPath = action.payload?.data_path
      if (
        Array.isArray(dataPath) &&
        dataPath.length === 1 &&
        dataPath[0] === 'session_id'
      ) {
        action.asyncDispatch(clearVersions())
      }
      const targetPath = action.payload?.data?.data_path
      const targetData = action.payload?.data?.data
      if (targetPath) {
        setPath(state, targetPath, targetData)
      }
    },
  },
})

export const { updateSessions } = sessionsSlice.actions

export default sessionsSlice.reducer
