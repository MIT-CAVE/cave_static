import messagesReducer from './messagesSlice'
import sessionsReducer from './sessionsSlice'
import tokensReducer from './tokensSlice'

import { combineReducers } from '../../utils'

const utilsSlice = combineReducers({
  messages: messagesReducer,
  sessions: sessionsReducer,
  tokens: tokensReducer,
})

export default utilsSlice
