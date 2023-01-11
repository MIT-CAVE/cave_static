import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const messagesSlice = createSlice({
  name: 'messages',
  initialState: {},
  reducers: {
    addMessage: (state, action) => {
      return R.assoc(
        Number(R.reduce(R.max, 0, R.keys(state))) + 1,
        action.payload,
        state
      )
    },
    removeMessage: (state, action) => {
      // console.log("HEREERE")
      // console.log( R.dissoc(R.path(['payload', 'messageKey'], action), state))
      return R.dissoc(R.path(['payload', 'messageKey'], action), state)
    },
  },
})

export const { addMessage, removeMessage } = messagesSlice.actions

export default messagesSlice.reducer
