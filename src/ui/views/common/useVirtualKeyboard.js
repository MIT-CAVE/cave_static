import * as R from 'ramda'
import { useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setIsOpen,
  setLayout,
  setCaretPosition,
  setEnter,
} from '../../../data/utilities/virtualKeyboardSlice'

const DELAY = 10

export function useVirtualKeyboard({
  keyboardLayout = 'default',
  disabled = false,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
}) {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)
  const inputRef = useRef(null)
  const focused = useRef(false)
  const isTouchDragging = useRef(false)
  const isInternalChange = useRef(false)

  // Sync caret position between input and virtual keyboard
  useEffect(() => {
    if (!focused.current) return

    if (
      inputRef.current &&
      !isInternalChange.current &&
      !R.equals(virtualKeyboard.caretPosition)([
        inputRef.current.selectionStart,
        inputRef.current.selectionEnd,
      ])
    ) {
      inputRef.current.setSelectionRange(
        virtualKeyboard.caretPosition[0],
        virtualKeyboard.caretPosition[1]
      )
    }

    if (isInternalChange.current) {
      isInternalChange.current = false
    }
  }, [virtualKeyboard.caretPosition])

  useEffect(() => {
    if (focused.current && virtualKeyboard.enter) {
      inputRef.current.blur()
      dispatch(setIsOpen(false))
      dispatch(setEnter(false))
    }
  }, [dispatch, focused, inputRef, virtualKeyboard.enter])

  const handleFocus = useCallback(() => {
    if (disabled) return
    // Display the keyboard in case the
    // focus shifted to another input field
    if (virtualKeyboard.isOpen) {
      setTimeout(() => {
        dispatch(setIsOpen(true))
        dispatch(setLayout(keyboardLayout))
      }, DELAY)
    }
    focused.current = true
    onFocusProp?.()
  }, [disabled, virtualKeyboard.isOpen, onFocusProp, dispatch, keyboardLayout])

  const handleBlur = useCallback(() => {
    if (disabled) return
    // delay so that focusing to another input field keeps
    // the keyboard open
    if (virtualKeyboard.isOpen) {
      setTimeout(() => {
        dispatch(setIsOpen(false))
      }, DELAY)
    }
    focused.current = false
    onBlurProp?.()
  }, [dispatch, disabled, onBlurProp, virtualKeyboard.isOpen])

  // Touch handlers
  const handleTouchStart = useCallback(() => {
    if (disabled) return
    isTouchDragging.current = false
  }, [disabled])

  const handleTouchMove = useCallback(() => {
    if (disabled) return
    isTouchDragging.current = true
  }, [disabled])

  const handleTouchEnd = useCallback(() => {
    if (disabled) return
    // delay so that clicking on the keyboard button doesn't immediately
    // close the keyboard due to onClick event
    if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
      setTimeout(() => {
        dispatch(setIsOpen(true))
        dispatch(setLayout(keyboardLayout))
      }, DELAY)
    }
  }, [dispatch, disabled, keyboardLayout, virtualKeyboard.isOpen])

  // Handle virtual keyboard enter (blur on enter)
  useEffect(() => {
    if (focused.current && virtualKeyboard.enter) {
      inputRef.current?.blur()
      dispatch(setIsOpen(false))
      dispatch(setEnter(false))
    }
  }, [dispatch, virtualKeyboard.enter])

  // Caret sync
  const handleSelectionChange = useCallback(() => {
    // Only sync caret if we have a position to sync
    if (inputRef.current?.selectionStart === inputRef.current?.selectionEnd) {
      dispatch(
        setCaretPosition([
          inputRef.current.selectionStart,
          inputRef.current.selectionStart,
        ])
      )
      isInternalChange.current = true // Mark this change as originating from the component
    }
  }, [dispatch])

  const handleKeyboardToggle = useCallback(() => {
    if (!focused.current) {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      )
    }

    dispatch(setIsOpen(!virtualKeyboard.isOpen))
    dispatch(setLayout(keyboardLayout))
    handleSelectionChange()
  }, [dispatch, handleSelectionChange, keyboardLayout, virtualKeyboard.isOpen])

  const handleKeyboardMouseDown = useCallback((event) => {
    if (focused.current) event.preventDefault()
  }, [])

  return {
    inputRef,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyboardToggle,
    handleKeyboardMouseDown,
    handleSelectionChange,
    virtualKeyboard,
    focused,
    isInternalChange,
  }
}
