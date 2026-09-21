import { createSlice } from '@reduxjs/toolkit'

import { overrideSync } from './actions'
import globalOutputsReducer from './globalOutputsSlice'
import mapReducer from './mapSlice'
import settingsReducer, { initialState } from './settingsSlice'

import { sendCommand, mutateData, overwriteData } from '../data'

const getPath = (obj, path) => {
  if (!obj || !path) return undefined
  let current = obj
  for (let i = 0; i < path.length; i++) {
    if (current == null) return undefined
    current = current[path[i]]
  }
  return current
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

const dissocPath = (path, obj) => {
  if (!obj || !path || path.length === 0) return obj
  const [head, ...tail] = path
  if (tail.length === 0) {
    if (Array.isArray(obj)) {
      const copy = [...obj]
      copy.splice(head, 1)
      return copy
    }
    const copy = { ...obj }
    delete copy[head]
    return copy
  }
  if (obj[head] == null || typeof obj[head] !== 'object') return obj
  const child = dissocPath(tail, obj[head])
  if (Array.isArray(obj)) {
    const copy = [...obj]
    copy[head] = child
    return copy
  }
  return { ...obj, [head]: child }
}

const reconcileLocalState = (localState, serverData) => {
  if (!localState || !serverData) return localState

  let nextState = localState

  // 1. Reconcile current page against server pages or appBar
  if (nextState.pages?.currentPage) {
    const serverPages = serverData.pages?.data || serverData.appBar?.data
    if (serverPages && Object.keys(serverPages).length > 0) {
      if (!serverPages[nextState.pages.currentPage]) {
        nextState = dissocPath(['pages', 'currentPage'], nextState)
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
        nextState = dissocPath(['maps', 'data', mapId], nextState)
      }
    }
  }

  // 3. Reconcile panes
  if (nextState.panes?.paneState && serverData.panes?.data) {
    const validPanes = serverData.panes.data
    const leftOpen = nextState.panes.paneState.left?.open
    if (leftOpen && !validPanes[leftOpen]) {
      nextState = dissocPath(['panes', 'paneState', 'left', 'open'], nextState)
    }
    const rightOpen = nextState.panes.paneState.right?.open
    if (rightOpen && !validPanes[rightOpen]) {
      nextState = dissocPath(['panes', 'paneState', 'right', 'open'], nextState)
    }
  }

  // 4. Reconcile draggables
  if (nextState.draggables?.data && serverData.draggables?.data) {
    const validDraggables = serverData.draggables.data
    const localDraggableIds = Object.keys(nextState.draggables.data)
    for (let i = 0; i < localDraggableIds.length; i++) {
      const dragId = localDraggableIds[i]
      if (!validDraggables[dragId]) {
        nextState = dissocPath(['draggables', 'data', dragId], nextState)
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
        return assocPath(action.payload.path, action.payload.value, state)
      } else {
        const path = action.payload.path || []
        if (typeof action.asyncDispatch === 'function') {
          action.asyncDispatch(
            sendCommand({
              command: 'mutate_session',
              data: {
                data_name: path[0],
                data_path: path.slice(1),
                data_value: action.payload.value,
                mutation_type: 'mutate',
              },
            })
          )
        }
        return state
      }
    },
    deleteLocal: (state, action) => {
      return dissocPath(action.payload.path, state)
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
                nextState = assocPath(path, undefined, nextState)
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
                nextState = assocPath(
                  ['settings', 'sync', key + name],
                  path,
                  nextState
                )
                nextState = assocPath(path, getPath(dataState, path), nextState)
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
