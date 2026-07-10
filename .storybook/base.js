import { Box } from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { configureStore } from '@reduxjs/toolkit'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'
import { Provider } from 'react-redux'

import App from '../src/App'
import dataReducer from '../src/data/data'
import localReducer from '../src/data/local'
import utilitiesReducer from '../src/data/utilities'
import VirtualKeyboard from '../src/ui/views/common/VirtualKeyboard'

// ---------------------------------------------------------------------------
// Middleware: intercepts sendCommand thunks for 'mutate_session' and applies
// the mutation locally instead of sending over the (absent) WebSocket.
// ---------------------------------------------------------------------------
const localDataUpdatesMiddleware = (store) => (next) => (action) => {
  if (action.type === 'data/sendCommand/pending') {
    const { arg } = action.meta
    if (arg && arg.command === 'mutate_session') {
      const { data } = arg
      if (data) {
        store.dispatch({
          type: 'mock/mutateData',
          payload: {
            dataName: data.data_name,
            dataPath: data.data_path,
            dataValue: data.data_value,
          },
        })
      }
    }
    return
  }
  return next(action)
}

// ---------------------------------------------------------------------------
// Reducer: wraps the real data reducer with a handler for mock mutations.
// ---------------------------------------------------------------------------
const customDataReducer = (state, action) => {
  if (action.type === 'mock/mutateData') {
    const { dataName, dataPath, dataValue } = action.payload
    return R.assocPath([dataName, ...dataPath], dataValue, state)
  }
  return dataReducer(state, action)
}

// ---------------------------------------------------------------------------
// Store factory: builds a fully configured mock Redux store from init data.
// Supports overriding initial state slices via options.preloadedState.
// ---------------------------------------------------------------------------
const createMockStore = (initData, options = {}) => {
  const defaultLocalState = localReducer(undefined, { type: '@@INIT' })
  const defaultUtilitiesState = utilitiesReducer(undefined, { type: '@@INIT' })

  const defaultPreloadedState = {
    data: initData,
    local: R.mergeDeepRight(defaultLocalState, {
      settings: {
        sync: {},
      },
    }),
    utilities: R.mergeDeepRight(defaultUtilitiesState, {
      loading: {
        session_loading: false,
        data_loading: false,
      },
    }),
  }
  const mergedState = R.mergeDeepRight(
    defaultPreloadedState,
    options.preloadedState || {}
  )

  return configureStore({
    reducer: {
      data: customDataReducer,
      local: localReducer,
      utilities: utilitiesReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(localDataUpdatesMiddleware),
    preloadedState: mergedState,
  })
}

const caveTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      paper: '#4a4a4a',
    },
  },
})

// ---------------------------------------------------------------------------
// CaveAppWrapper: a marginless, paddingless fullscreen viewport wrapper
// that sets the default system sans-serif font stack.
// ---------------------------------------------------------------------------
const CaveAppWrapper = ({ hideGlobalKeyboard = false, children }) =>
  React.createElement(
    ThemeProvider,
    { theme: caveTheme },
    React.createElement(
      Box,
      {
        sx: {
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          position: 'relative',
          bgcolor: 'background.paper',
          color: 'text.primary',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
          '& *': {
            fontFamily: 'inherit',
          },
        },
      },
      children,
      !hideGlobalKeyboard && React.createElement(VirtualKeyboard, null)
    )
  )
CaveAppWrapper.propTypes = {
  hideGlobalKeyboard: PropTypes.bool,
  children: PropTypes.node.isRequired,
}

// ---------------------------------------------------------------------------
// createReduxDecorator: builds a Storybook decorator that wraps stories in a
// Redux Provider backed by a mock store seeded with the given init data,
// and automatically adds the CaveAppWrapper fullscreen container.
// ---------------------------------------------------------------------------
const createReduxDecorator = (initData, options = {}) => {
  const mockStore = createMockStore(initData, options)

  return (Story) =>
    React.createElement(
      Provider,
      { store: mockStore },
      React.createElement(CaveAppWrapper, null, React.createElement(Story))
    )
}

// ---------------------------------------------------------------------------
// renderStory: a reusable named story object that renders the full App.
// ---------------------------------------------------------------------------
const renderStory = {
  render: () => React.createElement(App),
}

// ---------------------------------------------------------------------------
// createWorkspaceMeta: returns a base story config object containing the
// component, Redux decorator (with wrapper), and layout parameters.
//
// Usage in a story file:
//   import { createWorkspaceMeta, renderStory } from './createWorkspaceStory'
//   const initData = { ... }
//   export default {
//     ...createWorkspaceMeta(initData),
//     title: 'Workspaces/MyStory',
//   }
//   export const Default = renderStory
// ---------------------------------------------------------------------------
const createWorkspaceMeta = (initData, options = {}) => ({
  component: App,
  decorators: [createReduxDecorator(initData, options)],
  parameters: {
    layout: 'fullscreen',
    layoutWidth: 'full',
  },
})

export {
  createReduxDecorator,
  renderStory,
  createWorkspaceMeta,
  createMockStore,
  CaveAppWrapper,
}
