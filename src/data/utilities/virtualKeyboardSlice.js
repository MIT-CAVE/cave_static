import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const virtualKeyboardSlice = createSlice({
  name: 'virtualKeyboard',
  initialState: {
    isOpen: false,
    inputValue: '',
    caretPosition: [0, 0],
  },
  reducers: {
    toggleKeyboard(state) {
      return R.assoc('isOpen', !state.isOpen, state)
    },
    setInputValue(state, action) {
      return R.assoc('inputValue', action.payload, state)
    },
    setCaretPosition(state, action) {
      return R.assoc('caretPosition', action.payload, state)
    },
  },
})

export const { toggleKeyboard, setInputValue, setCaretPosition } =
  virtualKeyboardSlice.actions

export default virtualKeyboardSlice.reducer
