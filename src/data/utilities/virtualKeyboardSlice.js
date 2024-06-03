import { createSlice } from '@reduxjs/toolkit'
import * as R from 'ramda'

export const virtualKeyboardSlice = createSlice({
  name: 'virtualKeyboard',
  initialState: {
    isOpen: false,
    inputValue: '',
    currField: 0,
  },
  reducers: {
    toggleKeyboard(state) {
      return R.assoc('isOpen', !state.isOpen, state)
    },
    setInputValue(state, action) {
      return R.assoc('inputValue', action.payload, state)
    },
    incrementField(state) {
      return R.assoc('currField', state.currField + 1, state)
    },
  },
})

export const { toggleKeyboard, setInputValue, incrementField } =
  virtualKeyboardSlice.actions

export default virtualKeyboardSlice.reducer
