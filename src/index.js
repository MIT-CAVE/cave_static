import * as R from 'ramda'
import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider, useDispatch } from 'react-redux'

import './index.css'
import App from './App'
import { sendCommand } from './data/data'
import { mutateLocal } from './data/local'
import { mutateSessions } from './data/utils/sessionsSlice'
import { tokensSet } from './data/utils/tokensSlice'
// Must import store prior to any slice items to prevent
// potential extra reducer creating race event
import onMessage from './utils/onMessage'
import { store } from './utils/store'
import websocket from './utils/websockets'

const AppWrapper = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    // Handle Messages from the iframe
    // Wrap message handler in async function to satisfy react-hooks/exhaustive-deps
    async function setupMessageHandler() {
      window.addEventListener('message', async (e) => {
        // check that the data is sent from api
        if (e.origin === window.location.ancestorOrigins[0]) {
          const payload = e.data
          // check if tokens are present in data
          if (payload.event === 'initialize') {
            dispatch(tokensSet({ mapboxToken: payload.data.mapbox_token }))
            dispatch(
              mutateSessions({
                data_path: ['sessions', 'session_id'],
                data: payload.data.session_id,
              })
            )
            await websocket.connect(
              payload.data.user_token,
              onMessage(dispatch)
            )
            // After initial connection, get the session data
            await dispatch(
              sendCommand({
                command: 'get_session_data',
                data: {},
              })
            )
            // A selector can't be used because its evaluation
            // would occur before the session data is retrieved
            const mapKpis = R.pipe(
              R.pathOr({}, ['data', 'kpis', 'data']),
              R.mapObjIndexed(R.pick(['mapKpi']))
            )(store.getState())
            dispatch(mutateLocal({ path: ['kpis'], value: mapKpis }))
          } else {
            console.warn('Message error: ', payload)
          }
        }
      })
    }
    setupMessageHandler()
  }, [dispatch])

  return <App />
}

const ProviderWrapper = () => (
  <StrictMode>
    <Provider store={store}>
      <AppWrapper />
    </Provider>
  </StrictMode>
)

const rootNode = document.getElementById('root')
if (
  !(
    process.env.NODE_ENV !== 'production' ||
    process.env.REACT_APP_BUILD_VERSION.includes('dev')
  )
)
  document.addEventListener('contextmenu', (event) => event.preventDefault())

ReactDOM.render(<ProviderWrapper />, rootNode)
