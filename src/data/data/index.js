import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { assocHashes } from './utils'

import websocket from '../../utils/websockets'
import { overrideSync } from '../local/actions'

export const mutateData = createAsyncThunk(
  'data/mutateData',
  async (arg, { dispatch, getState }) => {
    const localHashes = R.path(['data', 'hashes'], getState())
    // Matching Hashes (EG: overwrite with no change)
    if (R.equals(arg.hashes)(localHashes)) {
      return { success: true, hashes: localHashes }
    }
    // Mutation
    if (R.prop('event', arg) === 'mutation') {
      // check if this is button response
      if (R.isNil(R.path(['data', 'data_name'], arg))) {
        return { success: true, hashes: localHashes }
      }
      const mutation = R.prop('data', arg)
      let data = R.pipe(
        R.path(['data', mutation.data_name]),
        R.assocPath(mutation.data_path, mutation.data_value)
      )(getState())

      return {
        success: true,
        type: 'update',
        data: { [mutation.data_name]: data },
        hashes: R.prop('hashes', arg),
      }
    }
    // Overwrite
    if (R.prop('event', arg) === 'overwrite') {
      const data = R.pipe(
        R.prop('data'),
        R.map((d) => JSON.parse(d))
      )(arg)
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
      return { success: true, data: data, hashes: R.prop('hashes', arg) }
    }
    console.log(arg)
    // Not an update or mutation (or something did not work quite right)
    console.error('Something did not work quite right during a data mutation')
  }
)

export const sendCommand = createAsyncThunk(
  'data/sendCommand',
  async (arg, { getState }) => {
    const localHashes = R.path(['data', 'hashes'], getState())
    const fullArg = R.assocPath(['data', 'data_hashes'], localHashes, arg)
    websocket.send(fullArg)
  }
)

const updateData = (action, onUpdateFn) => {
  const success = R.path(['payload', 'success'], action)
  if (success) {
    return R.pipe(
      R.mergeLeft(R.pathOr({}, ['payload', 'data'], action)),
      R.pick(R.keys(R.pathOr({}, ['payload', 'hashes'], action))),
      assocHashes,
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
    hashes: {},
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
      console.error('Unable to mutate session')
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
