import { combineReducers, configureStore } from '@reduxjs/toolkit'

import dataReducer from '../data/data'
import localReducer from '../data/local'
import utilitiesReducer from '../data/utilities'

const getInitialState = (reducer) => reducer(undefined, { type: '@@INIT' })

// This middleware will just add the property "async dispatch" to all actions
const asyncDispatchMiddleware = (store) => (next) => (action) => {
  let syncActivityFinished = false
  const actionQueue = []

  const flushQueue = () => {
    while (actionQueue.length > 0) {
      const asyncAction = actionQueue.shift()
      store.dispatch(asyncAction)
    }
  }

  const asyncDispatch = (asyncAction) => {
    actionQueue.push(asyncAction)

    if (syncActivityFinished) {
      flushQueue()
    }
  }

  action.asyncDispatch = asyncDispatch

  const res = next(action)

  syncActivityFinished = true
  flushQueue()

  return res
}

const reducer = combineReducers({
  data: dataReducer,
  local: localReducer,
  utilities: utilitiesReducer,
})

const preloadedState = getInitialState(reducer)

const store = configureStore({
  reducer,
  preloadedState,
  // keep middleware default and add async dispatch
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(asyncDispatchMiddleware),
  // Use Redux Dev Tools if not in proudction or the build is a dev build
  devTools:
    import.meta.env.REACT_APP_USE_REDUX_DEVTOOLS === 'true' &&
    (import.meta.env.DEV ||
      import.meta.env.REACT_APP_BUILD_VERSION.includes('dev')),
})

export { store }
