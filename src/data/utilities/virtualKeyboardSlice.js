import { createSlice } from '@reduxjs/toolkit'

export const virtualKeyboardSlice = createSlice({
  name: 'virtualKeyboard',
  initialState: {
    isOpen: false,
    layout: 'default',
    inputValue: '',
    caretPosition: [0, 0],
    enter: false,
    lastKeyPress: null,
    isTextArea: false,
    activeFieldId: null,
  },
  reducers: {
    setIsOpen(state, action) {
      state.isOpen = action.payload
    },
    setLayout(state, action) {
      state.layout = action.payload
    },
    setInputValue(state, action) {
      state.inputValue = action.payload
    },
    setCaretPosition(state, action) {
      state.caretPosition = action.payload
    },
    setEnter(state, action) {
      state.enter = action.payload
    },
    setLastKeyPress(state, action) {
      state.lastKeyPress = action.payload
    },
    setIsTextArea(state, action) {
      state.isTextArea = action.payload
    },
    setActiveFieldId(state, action) {
      state.activeFieldId = action.payload
    },
    toggleOpen(state) {
      state.isOpen = !state.isOpen
    },
  },
})

export const {
  setIsOpen,
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
  setLastKeyPress,
  setIsTextArea,
  setActiveFieldId,
  toggleOpen,
} = virtualKeyboardSlice.actions

export default virtualKeyboardSlice.reducer
