import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { assocVersions } from './utils'

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
      return { success: true, versions: localVersions }
    }
    // Get expected incremented versions
    const expectedVersions = R.assoc(
      data_name,
      R.inc(R.prop(data_name, localVersions)),
      localVersions
    )
    if (!R.equals(versions)(expectedVersions)) {
      // TODO: Sync with server
      return { success: false, versions: localVersions }
    }
    const mutation = R.prop('data', arg)
    let data = R.pipe(
      R.path(['data', data_name]),
      R.assocPath(mutation.data_path, mutation.data_value)
    )(getState())

    return {
      success: true,
      type: 'update',
      data: { [data_name]: data },
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
      return { success: true, versions: localVersions }
    }
    //
    // Overwrite
    const data = R.prop('data')(arg)
    if (
      R.hasPath(['settings', 'data', 'defaultDesync'], data) &&
      !R.equals(
        R.path(['settings', 'data', 'defaultDesync'], data),
        R.path(['data', 'settings', 'data', 'defaultDesync'], getState())
      )
    )
      dispatch(
        overrideSync({
          paths: R.path(['settings', 'data', 'defaultDesync'], data),
          dataState: R.mergeDeepRight(R.prop('data', getState()), data),
        })
      )
    return { success: true, data: data, versions: R.prop('versions', arg) }
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

const updateData = (action, onUpdateFn) => {
  const success = R.path(['payload', 'success'], action)
  console.log(action)
  if (success) {
    return R.pipe(
      R.mergeLeft(R.pathOr({}, ['payload', 'data'], action)),
      R.pick(R.keys(R.pathOr({}, ['payload', 'versions'], action))),
      assocVersions,
      onUpdateFn
    )
  } else {
    console.error({ input: action.meta.arg, error: action.payload.error })
    return onUpdateFn
  }
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
    kpis: {},
    ignore: {},
    associated: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    // Data mutation
    builder.addCase(mutateData.fulfilled, (state, action) => {
      return updateData(action, R.identity)(state)
    })
    builder.addCase(mutateData.rejected, () => {
      console.error('Unable to mutate session data')
    })
    // Data overwrite
    builder.addCase(overwriteData.fulfilled, (state, action) => {
      return updateData(action, R.identity)(state)
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
