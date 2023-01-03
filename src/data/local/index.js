import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideSync } from './actions'
import kpisReducer from './kpisSlice'
import mapReducer from './mapSlice'
import settingsReducer, { initialState } from './settingsSlice'

import { sendCommand } from '../data'

import { combineReducers } from '../../utils'

const subReducers = combineReducers({
  kpis: kpisReducer,
  map: mapReducer,
  settings: settingsReducer,
})

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
      })(action.payload.paths)
      return { settings: initialState }
    })
  },
})

const finalReducer = (state, action) => {
  const partialState = subReducers(state, action)
  return localSlice.reducer(partialState, action)
}

export const { mutateLocal, deleteLocal } = localSlice.actions

export default finalReducer
