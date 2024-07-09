import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const virtualKeyboardSlice = createSlice({
  name: 'virtualKeyboard',
  initialState: {
    isOpen: false,
    layout: 'default',
    inputValue: '',
    caretPosition: [0, 0],
    enter: false,
  },
  reducers: {
    setIsOpen(state, action) {
      return R.assoc('isOpen', action.payload, state)
    },
    setLayout(state, action) {
      return R.assoc('layout', action.payload, state)
    },
    setInputValue(state, action) {
      return R.assoc('inputValue', action.payload, state)
    },
    setCaretPosition(state, action) {
      return R.assoc('caretPosition', action.payload, state)
    },
    setEnter(state, action) {
      return R.assoc('enter', action.payload, state)
    },
  },
})

export const {
  setIsOpen,
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
} = virtualKeyboardSlice.actions

export default virtualKeyboardSlice.reducer
