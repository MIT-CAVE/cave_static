import { createSlice } from '@reduxjs/toolkit'

import { overrideState } from './actions'

const deepMerge = (target, source) => {
  if (!source || typeof source !== 'object') return target
  const result = { ...(target || {}) }
  const sourceKeys = Object.keys(source)
  for (let i = 0; i < sourceKeys.length; i++) {
    const key = sourceKeys[i]
    const val = source[key]
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      result[key] = deepMerge(result[key], val)
    } else {
      result[key] = val
    }
  }
  return result
}

export const globalOutputsSlice = createSlice({
  name: 'globalOutputs',
  initialState: {},
  reducers: {
    mapGlobalOutputToggle: (state, action) => {
      const outputKey = action.payload
      if (!state[outputKey]) {
        state[outputKey] = {}
      }
      state[outputKey].mapGlobalOutput = !state[outputKey].mapGlobalOutput
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideState, (state, action) => {
      const globalOutputs = action.payload?.globalOutputs || {}
      return deepMerge(state, globalOutputs)
    })
  },
})

export const { mapGlobalOutputToggle } = globalOutputsSlice.actions

export default globalOutputsSlice.reducer
