import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import websocket from '../../utils/websockets'
import { overrideSync } from '../local/actions'

export const mutateData = createAsyncThunk(
  'data/mutateData',
  async (arg, { getState }) => {
    const localVersions = R.path(['data', 'versions'], getState())
    const versions = R.prop('versions', arg)
    // Get the mutated data name
    const data_name = R.path(['data', 'data_name'], arg)
    // Check for Matching Versions or Button Response (Noop)
    if (R.equals(versions)(localVersions) || R.isNil(data_name)) {
      return {
        noOperation: true,
        data: {},
        versions: versions,
        newLocalVersions: localVersions,
      }
    }
    const mutation = R.prop('data', arg)
    let data = R.pipe(
      R.path(['data', data_name]),
      R.assocPath(mutation.data_path, mutation.data_value)
    )(getState())

    return {
      data: { [data_name]: data },
      newLocalVersions: R.mergeRight(
        R.pick(R.keys(versions), localVersions),
        R.pick([data_name], versions)
      ),
      versions: versions,
    }
  }
)

export const overwriteData = createAsyncThunk(
  'data/overwriteData',
  async (arg, { dispatch, getState }) => {
    const localVersions = R.path(['data', 'versions'], getState())
    const versions = R.prop('versions', arg)
    // Check for Matching Versions or Button Response (Noop)
    if (R.equals(versions)(localVersions)) {
      return {
        noOperation: true,
        data: {},
        versions: versions,
        newLocalVersions: localVersions,
      }
    }
    // Overwrite
    const data = R.prop('data')(arg)
    if (
      R.hasPath(['settings', 'data', 'sync'], data) &&
      !R.equals(
        R.path(['settings', 'data', 'sync'], data),
        R.path(['data', 'settings', 'data', 'sync'], getState())
      )
    ) {
      const desyncedPaths = R.pipe(
        R.path(['settings', 'data', 'sync']),
        R.filter(R.pipe(R.prop('value'), R.not)),
        R.pluck('data')
      )(data)
      dispatch(
        overrideSync({
          paths: desyncedPaths,
          dataState: R.mergeDeepRight(R.prop('data', getState()), data),
        })
      )
    }
    return {
      data: data,
      newLocalVersions: R.mergeRight(
        R.pick(R.keys(versions), localVersions),
        R.pick(R.keys(data), versions)
      ),
      versions: versions,
    }
  }
)

export const sendCommand = createAsyncThunk(
  'data/sendCommand',
  async (arg, { getState }) => {
    const localVersions = R.path(['data', 'versions'], getState())
    const fullArg = R.assocPath(['data', 'data_versions'], localVersions, arg)
    websocket.send(fullArg)
  }
)

const updateData = (action) => {
  const payload = R.pathOr({}, ['payload'], action)
  const versions = R.pathOr({}, ['versions'], payload)
  const newLocalVersions = R.pathOr({}, ['newLocalVersions'], payload)
  const noOperation = R.pathOr(false, ['noOperation'], payload)
  // Check if the new localVersions match the passed versions and fix errors by syncing with the server.
  if (!R.equals(versions, newLocalVersions)) {
    action.asyncDispatch(
      sendCommand({
        command: 'get_session_data',
        data: { data_versions: newLocalVersions },
      })
    )
  }
  // Apply any mutation/overwrite if the resulting output is not a noop
  if (!noOperation) {
    return R.pipe(
      R.mergeLeft(R.pathOr({}, ['payload', 'data'], action)),
      R.pick(R.keys(versions)),
      R.assocPath(['versions'], newLocalVersions)
    )
  }
  return R.identity()
}

const toggleLoadingFx = (action, value) => {
  const url = R.pathOr('', ['meta', 'arg', 'url'], action)
  return url.includes('/get_session_data/')
    ? R.assocPath(['ignore', 'loading'], value)
    : R.identity()
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
  reducers: {},
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

export const { dataMutate } = dataSlice.actions

export default dataSlice.reducer
