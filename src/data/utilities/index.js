import loadingReducer from './loadingSlice'
import messagesReducer from './messagesSlice'
import sessionsReducer from './sessionsSlice'
import timeReducer from './timeSlice'
import tokensReducer from './tokensSlice'
import virtualKeyboardReducer from './virtualKeyboardSlice'

import { combineReducers } from '../../utils'

const utilitiesSlice = combineReducers({
  loading: loadingReducer,
  messages: messagesReducer,
  sessions: sessionsReducer,
  tokens: tokensReducer,
  time: timeReducer,
  virtualKeyboard: virtualKeyboardReducer,
})

export default utilitiesSlice
