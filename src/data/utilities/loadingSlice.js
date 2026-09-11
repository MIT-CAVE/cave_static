import { createSlice } from '@reduxjs/toolkit'

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

export const loadingSlice = createSlice({
  name: 'loading',
  initialState: {
    session_loading: false,
    data_loading: false,
  },
  reducers: {
    // Update loading from ws message
    updateLoading: (state, action) => {
      const dataPath = action.payload?.data?.data_path
      const dataVal = action.payload?.data?.data
      if (dataPath) {
        setPath(state, dataPath, dataVal)
      }
    },
  },
})

export const { updateLoading } = loadingSlice.actions

export default loadingSlice.reducer
