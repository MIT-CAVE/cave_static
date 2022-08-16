import { StrictMode, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { Provider, useDispatch } from 'react-redux'

import './index.css'
import App from './App' // eslint-disable-line
import { fetchData, mutateData } from './data/data'
import { tokensSet } from './data/tokens/tokensSlice'
// Must import store prior to any slice items to prevent
// potential extra reducer creating race event
import { store } from './utils/store'

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
          if (payload.event === 'set_tokens') {
            dispatch(tokensSet({ mapboxToken: payload.data.mapbox_token }))
            dispatch(tokensSet({ userToken: payload.data.user_token }))
            await dispatch(
              fetchData({
                url: `${window.location.ancestorOrigins[0]}/get_session_data/`,
                httpMethod: 'POST',
                init: true,
              })
            )
          } else if (
            payload.event === 'overwrite' ||
            payload.event === 'mutation'
          ) {
            dispatch(mutateData(payload))
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
