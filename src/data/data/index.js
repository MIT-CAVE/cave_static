import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import websocket from '../../utils/websockets'
import { overrideSync } from '../local/actions'

const areVersionsEqual = (v1, v2) => {
  if (v1 === v2) return true
  if (!v1 || !v2) return false
  const k1 = Object.keys(v1)
  const k2 = Object.keys(v2)
  if (k1.length !== k2.length) return false
  for (let i = 0; i < k1.length; i++) {
    const k = k1[i]
    if (v1[k] !== v2[k]) return false
  }
  return true
}

const assocPath = (path, value, obj) => {
  if (!path || path.length === 0) return value
  const [head, ...tail] = path
  if (tail.length === 0) {
    if (Array.isArray(obj)) {
      const copy = [...obj]
      copy[head] = value
      return copy
    }
    return { ...obj, [head]: value }
  }
  const nextObj = obj && typeof obj === 'object' ? obj[head] : undefined
  const child = assocPath(
    tail,
    value,
    typeof nextObj === 'object' && nextObj !== null
      ? nextObj
      : typeof tail[0] === 'number'
        ? []
        : {}
  )
  if (Array.isArray(obj)) {
    const copy = [...obj]
    copy[head] = child
    return copy
  }
  return { ...obj, [head]: child }
}

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

export const mutateData = createAsyncThunk(
  'data/mutateData',
  async (arg, { getState }) => {
    const state = getState()
    const localVersions = state?.data?.versions
    const versions = arg?.versions
    // Get the mutated data name
    const data_name = arg?.data?.data_name
    // Check for Matching Versions or Button Response (Noop)
    if (areVersionsEqual(versions, localVersions) || data_name == null) {
      return {
        noOperation: true,
        data: {},
        versions: versions,
        newLocalVersions: localVersions,
      }
    }
    const mutation = arg?.data || {}
    const currentDataSlice = state?.data?.[data_name]
    const mutatedSlice = assocPath(
      mutation.data_path,
      mutation.data_value,
      currentDataSlice
    )

    const newLocalVersions = {}
    if (versions) {
      const vKeys = Object.keys(versions)
      for (let i = 0; i < vKeys.length; i++) {
        const k = vKeys[i]
        if (localVersions && k in localVersions) {
          newLocalVersions[k] = localVersions[k]
        }
      }
      if (data_name in versions) {
        newLocalVersions[data_name] = versions[data_name]
      }
    }

    return {
      data: { [data_name]: mutatedSlice },
      newLocalVersions,
      versions: versions,
    }
  }
)

export const overwriteData = createAsyncThunk(
  'data/overwriteData',
  async (arg, { dispatch, getState }) => {
    const state = getState()
    const localVersions = state?.data?.versions
    const versions = arg?.versions
    const forceOverwrite = Boolean(arg?.forceOverwrite)
    // Check for Matching Versions or Button Response (Noop)

    if (areVersionsEqual(versions, localVersions) && !forceOverwrite) {
      return {
        noOperation: true,
        data: {},
        versions: versions,
        newLocalVersions: localVersions,
      }
    }
    // Overwrite
    const data = arg?.data || {}

    if ('settings' in data) {
      const extractDesynced = (syncObj) => {
        const desynced = {}
        if (!syncObj || typeof syncObj !== 'object') return desynced
        for (const [k, v] of Object.entries(syncObj)) {
          if (v && !v.value && v.data) {
            desynced[k] = v.data
          }
        }
        return desynced
      }

      const desyncedPaths = extractDesynced(data.settings?.sync)
      const pathsToSync = extractDesynced(state?.data?.settings?.sync)

      const currentState = state?.data || {}
      const dataState = { ...currentState }
      for (const k of Object.keys(data)) {
        dataState[k] =
          typeof data[k] === 'object' &&
          data[k] !== null &&
          !Array.isArray(data[k])
            ? deepMerge(currentState[k] || {}, data[k])
            : data[k]
      }

      dispatch(
        overrideSync({
          pathsToSync,
          desyncedPaths,
          dataState,
        })
      )
    }

    const newLocalVersions = {}
    if (versions) {
      const vKeys = Object.keys(versions)
      for (let i = 0; i < vKeys.length; i++) {
        const k = vKeys[i]
        if (localVersions && k in localVersions) {
          newLocalVersions[k] = localVersions[k]
        }
      }
      const dataKeys = Object.keys(data)
      for (let i = 0; i < dataKeys.length; i++) {
        const k = dataKeys[i]
        if (k in versions) {
          newLocalVersions[k] = versions[k]
        }
      }
    }

    return {
      data: data,
      newLocalVersions,
      versions: versions,
    }
  }
)

export const sendCommand = createAsyncThunk(
  'data/sendCommand',
  async (arg, { getState }) => {
    const localVersions = getState()?.data?.versions
    const fullArg = assocPath(['data', 'data_versions'], localVersions, arg)
    websocket.send(fullArg)
  }
)

const updateData = (action) => {
  const payload = action.payload || {}
  const versions = payload.versions || {}
  const newLocalVersions = payload.newLocalVersions || {}
  const noOperation = payload.noOperation || false
  // Check if the new localVersions match the passed versions and fix errors by syncing with the server.
  if (!areVersionsEqual(versions, newLocalVersions)) {
    action.asyncDispatch(
      sendCommand({
        command: 'get_session_data',
        data: { data_versions: newLocalVersions },
      })
    )
  }
  // Apply any mutation/overwrite if the resulting output is not a noop
  if (!noOperation) {
    const payloadData = payload.data || {}
    const versionKeys = Object.keys(versions)
    return (state) => {
      const nextState = {}
      for (let i = 0; i < versionKeys.length; i++) {
        const k = versionKeys[i]
        nextState[k] = payloadData[k] !== undefined ? payloadData[k] : state[k]
      }
      nextState.versions = newLocalVersions
      return nextState
    }
  }
  return (state) => state
}

const toggleLoadingFx = (action, value) => {
  const url = action.meta?.arg?.url || ''
  return url.includes('/get_session_data/')
    ? (state) => ({ ...state, ignore: { ...state.ignore, loading: value } })
    : (state) => state
}

export const dataSlice = createSlice({
  name: 'data',
  initialState: {
    settings: {},
    categories: {},
    appBar: {},
    versions: {},
    arcs: {},
    nodes: {},
    geos: {},
    stats: {},
    globalOutputs: {},
    ignore: {},
    associated: {},
  },
  reducers: {
    clearVersions: (state) => {
      state.versions = {}
    },
  },
  extraReducers: (builder) => {
    // Data mutation
    builder.addCase(mutateData.fulfilled, (state, action) => {
      return updateData(action)(state)
    })
    builder.addCase(mutateData.rejected, () => {
      console.error('Unable to mutate session data')
    })
    // Data overwrite
    builder.addCase(overwriteData.fulfilled, (state, action) => {
      return updateData(action)(state)
    })
    builder.addCase(overwriteData.rejected, () => {
      console.error('Unable to overwrite session data')
    })
    // Data fetching
    builder.addCase(sendCommand.pending, (state, action) => {
      return toggleLoadingFx(action, true)(state)
    })
    builder.addCase(sendCommand.fulfilled, (state, action) => {
      return toggleLoadingFx(action, false)(state)
    })
    builder.addCase(sendCommand.rejected, (state, action) => {
      console.error('Unable to fetch data from session')
      return toggleLoadingFx(action, false)(state)
    })
  },
})

export const { dataMutate, clearVersions } = dataSlice.actions

export default dataSlice.reducer
