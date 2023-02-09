import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const messagesSlice = createSlice({
  name: 'messages',
  initialState: {},
  reducers: {
    addMessage: (state, action) => {
      // Only add the message to the redux state if snackbarShow is true
      if (R.prop('snackbarShow', action.payload)) {
        const messageId =
          Number(R.reduce(R.max, 0, R.map(parseInt, R.keys(state)))) + 1
        return R.assoc(messageId, action.payload, state)
      } else {
        return state
      }
    },
    removeMessage: (state, action) => {
      return R.dissoc(R.path(['payload', 'messageKey'], action), state)
    },
  },
})

export const { addMessage, removeMessage } = messagesSlice.actions

export default messagesSlice.reducer
