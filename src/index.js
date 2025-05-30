import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'

import './index.css'
import App from './App'
import { sendCommand } from './data/data'
import { tokensSet } from './data/utilities/tokensSlice'
// Must import store prior to any slice items to prevent
// potential extra reducer creating race event
import onMessage from './utils/onMessage'
import { store } from './utils/store'
import websocket from './utils/websockets'

// The following should only run once when the app starts; Otherwise,
// mount/unmount issues in React 18 arise when wrapped in a useEffect.
// https://beta.reactjs.org/learn/synchronizing-with-effects#not-an-effect-initializing-the-application
if (typeof window !== 'undefined') {
  const { dispatch } = store
  if (!window.crossOriginIsolated) {
    console.warn(
      'SharedArrayBuffer is not enabled. Update your application to improve performance.'
    )
  }
  const onMessageHandler = async (e) => {
    // check that the data is sent from api
    if (e.origin === window.location.ancestorOrigins[0]) {
      const payload = e.data
      // check if tokens are present in data
      if (payload.event === 'initialize') {
        dispatch(tokensSet({ mapboxToken: payload.data.mapbox_token }))
        await websocket.connect(
          payload.data.user_token,
          onMessage(dispatch),
          payload.data.ws_path,
          payload.data.ws_encoding
        )
        // After initial connection, get the session data
        await dispatch(sendCommand({ command: 'get_session_data', data: {} }))
      } else {
        console.warn('Message error: ', payload)
      }
    }
  }
  // Listen for Messages
  window.addEventListener('message', onMessageHandler)
  // Disable right click
  document.addEventListener('contextmenu', (event) => event.preventDefault())
}

const container = document.getElementById('root')
const root = createRoot(container)
root.render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
