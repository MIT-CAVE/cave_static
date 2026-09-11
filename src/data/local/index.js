import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

import { overrideSync } from './actions'
import globalOutputsReducer from './globalOutputsSlice'
import mapReducer from './mapSlice'
import settingsReducer, { initialState } from './settingsSlice'

import { sendCommand, mutateData, overwriteData } from '../data'

const reconcileLocalState = (localState, serverData) => {
  if (!localState || !serverData) return localState

  let nextState = localState

  // 1. Reconcile current page against server pages or appBar
  if (nextState.pages?.currentPage) {
    const serverPages = serverData.pages?.data || serverData.appBar?.data
    if (serverPages && Object.keys(serverPages).length > 0) {
      if (!serverPages[nextState.pages.currentPage]) {
        nextState = R.dissocPath(['pages', 'currentPage'], nextState)
      }
    }
  }

  // 2. Reconcile maps (stale map controls / viewports)
  if (nextState.maps?.data && serverData.maps?.data) {
    const validMaps = serverData.maps.data
    const localMapIds = Object.keys(nextState.maps.data)
    for (let i = 0; i < localMapIds.length; i++) {
      const mapId = localMapIds[i]
      if (!validMaps[mapId]) {
        nextState = R.dissocPath(['maps', 'data', mapId], nextState)
      }
    }
  }

  // 3. Reconcile panes
  if (nextState.panes?.paneState && serverData.panes?.data) {
    const validPanes = serverData.panes.data
    const leftOpen = nextState.panes.paneState.left?.open
    if (leftOpen && !validPanes[leftOpen]) {
      nextState = R.dissocPath(
        ['panes', 'paneState', 'left', 'open'],
        nextState
      )
    }
    const rightOpen = nextState.panes.paneState.right?.open
    if (rightOpen && !validPanes[rightOpen]) {
      nextState = R.dissocPath(
        ['panes', 'paneState', 'right', 'open'],
        nextState
      )
    }
  }

  // 4. Reconcile draggables
  if (nextState.draggables?.data && serverData.draggables?.data) {
    const validDraggables = serverData.draggables.data
    const localDraggableIds = Object.keys(nextState.draggables.data)
    for (let i = 0; i < localDraggableIds.length; i++) {
      const dragId = localDraggableIds[i]
      if (!validDraggables[dragId]) {
        nextState = R.dissocPath(['draggables', 'data', dragId], nextState)
      }
    }
  }

  return nextState
}

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
      let nextState = { ...state, settings: initialState }
      const { desyncedPaths, dataState } = action.payload || {}
      if (desyncedPaths) {
        // first remove all previously synced paths
        const desyncedGroupKeys = Object.keys(desyncedPaths)
        for (let i = 0; i < desyncedGroupKeys.length; i++) {
          const paths = desyncedPaths[desyncedGroupKeys[i]]
          if (paths && typeof paths === 'object') {
            const pathKeys = Object.keys(paths)
            for (let j = 0; j < pathKeys.length; j++) {
              const path = paths[pathKeys[j]]
              if (path) {
                nextState = R.assocPath(path, undefined, nextState)
              }
            }
          }
        }
        // now sync all new paths
        for (let i = 0; i < desyncedGroupKeys.length; i++) {
          const key = desyncedGroupKeys[i]
          const paths = desyncedPaths[key]
          if (paths && typeof paths === 'object') {
            const nameKeys = Object.keys(paths)
            for (let j = 0; j < nameKeys.length; j++) {
              const name = nameKeys[j]
              const path = paths[name]
              if (path) {
                nextState = R.assocPath(
                  ['settings', 'sync', key + name],
                  path,
                  nextState
                )
                nextState = R.assocPath(
                  path,
                  R.path(path, dataState),
                  nextState
                )
              }
            }
          }
        }
      }
      return nextState
    })
    builder.addCase(overwriteData.fulfilled, (state, action) => {
      if (action.payload?.noOperation) return state
      return reconcileLocalState(state, action.payload?.data)
    })
    builder.addCase(mutateData.fulfilled, (state, action) => {
      if (action.payload?.noOperation) return state
      return reconcileLocalState(state, action.payload?.data)
    })
  },
})

const finalReducer = (state = {}, action) => {
  const prevGlobalOutputs = state.globalOutputs
  const prevMaps = state.maps
  const prevSettings = state.settings

  const nextGlobalOutputs = globalOutputsReducer(prevGlobalOutputs, action)
  const nextMaps = mapReducer(prevMaps, action)
  const nextSettings = settingsReducer(prevSettings, action)

  let intermediateState = state
  if (
    nextGlobalOutputs !== prevGlobalOutputs ||
    nextMaps !== prevMaps ||
    nextSettings !== prevSettings
  ) {
    intermediateState = {
      ...state,
      globalOutputs: nextGlobalOutputs,
      maps: nextMaps,
      settings: nextSettings,
    }
  }

  return localSlice.reducer(intermediateState, action)
}

export const { mutateLocal, deleteLocal } = localSlice.actions

export default finalReducer
