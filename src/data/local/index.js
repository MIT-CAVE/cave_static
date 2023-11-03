import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideSync } from './actions'
import globalOutputsReducer from './globalOutputsSlice'
import mapReducer from './mapSlice'
import settingsReducer, { initialState } from './settingsSlice'

import { sendCommand } from '../data'

const localSlice = createSlice({
  name: 'local',
  initialState: {},
  reducers: {
    //expects {path: [...], value: any, sync: bool}
    mutateLocal: (state, action) => {
      if (action.payload.sync !== true) {
        return R.assocPath(action.payload.path, action.payload.value, state)
      } else {
        action.asyncDispatch(
          sendCommand({
            command: 'mutate_session',
            data: {
              data_name: R.head(action.payload.path),
              data_path: R.tail(action.payload.path),
              data_value: action.payload.value,
              mutation_type: 'mutate',
            },
          })
        )
        return state
      }
    },
    deleteLocal: (state, action) => {
      return R.dissocPath(action.payload.path, state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(overrideSync, (state, action) => {
      // first remove all previously synced paths
      R.forEachObjIndexed((paths) => {
        R.forEachObjIndexed((path) => {
          action.asyncDispatch(
            mutateLocal({
              path: path,
              value: undefined,
            })
          )
        })(paths)
      })(action.payload.desyncedPaths)
      // now sync all new paths
      R.forEachObjIndexed((paths, key) => {
        R.forEachObjIndexed((path, name) => {
          action.asyncDispatch(
            mutateLocal({
              path: ['settings', 'sync', R.concat(key, name)],
              value: path,
            })
          )
          action.asyncDispatch(
            mutateLocal({
              path: path,
              value: R.path(path, action.payload.dataState),
            })
          )
        })(paths)
      })(action.payload.desyncedPaths)
      return { settings: initialState }
    })
  },
})

const finalReducer = (state, action) => {
  const partialState = R.mergeLeft(
    {
      globalOutputs: globalOutputsReducer(
        R.prop('globalOutputs', state),
        action
      ),
      maps: mapReducer(R.prop('maps', state), action),
      settings: settingsReducer(R.prop('settings', state), action),
    },
    state
  )
  return localSlice.reducer(partialState, action)
}

export const { mutateLocal, deleteLocal } = localSlice.actions

export default finalReducer
