import { createSlice } from '@reduxjs/toolkit'

export const messagesSlice = createSlice({
  name: 'messages',
  initialState: {},
  reducers: {
    addMessage: (state, action) => {
      // Only add the message to the redux state if snackbarShow is true
      if (action.payload?.data?.snackbarShow) {
        const keys = Object.keys(state)
        let maxId = 0
        for (let i = 0; i < keys.length; i++) {
          const id = parseInt(keys[i], 10)
          if (!isNaN(id) && id > maxId) maxId = id
        }
        state[maxId + 1] = action.payload.data
      }
    },
    removeMessage: (state, action) => {
      const messageKey = action.payload?.messageKey
      if (messageKey != null) {
        delete state[messageKey]
      }
    },
    clearMessages: () => ({}),
  },
})

export const { addMessage, clearMessages, removeMessage } =
  messagesSlice.actions

export default messagesSlice.reducer
