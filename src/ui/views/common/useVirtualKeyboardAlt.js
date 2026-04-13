import * as R from 'ramda'
import { useRef, useEffect, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../../data/selectors'
import {
  setIsOpen,
  setLayout,
  setCaretPosition,
  setEnter,
  setLastKeyPress,
  toggleOpen,
  setInputValue,
} from '../../../data/utilities/virtualKeyboardSlice'

const DELAY = 10

const useVirtualKeyboardAlt = ({
  keyboardLayout = 'default',
  disabled,
  inputRef,
  focused,
  unformattedValue,
  onChange: onChangeProp,
  onBlur: onBlurProp,
  onFocus: onFocusProp,
  onTouchStart: onTouchStartProp,
  onTouchMove: onTouchMoveProp,
  onTouchEnd: onTouchEndProp,
}) => {
  const isTouchDragging = useRef(false)
  const isInternalChange = useRef(false)

  const virtualKeyboard = useSelector(selectVirtualKeyboard)
  const dispatch = useDispatch()

  // Sync caret position between input and virtual keyboard
  useEffect(() => {
    if (!focused) return

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
  }, [focused, inputRef, virtualKeyboard.caretPosition])

  useEffect(() => {
    if (!focused || !virtualKeyboard.enter) return
    inputRef.current.blur()
    dispatch(setIsOpen(false))
    dispatch(setEnter(false))
  }, [dispatch, focused, inputRef, virtualKeyboard.enter])

  // Update virtual keyboard's value when this field changes from non-keyboard input
  const updateVirtualKeyboardValue = useCallback(
    (value) => {
      dispatch(setInputValue(value))
      isInternalChange.current = true
    },
    [dispatch]
  )

  const handleChange = useCallback(
    (event) => {
      if (disabled) return
      updateVirtualKeyboardValue(event.target.value)
      // console.log('Input change', { value: event.target.value, event })
      onChangeProp?.(event)
    },
    [disabled, onChangeProp, updateVirtualKeyboardValue]
  )

  const handleFocus = useCallback(
    (event) => {
      if (disabled) return
      // Ensure virtual keyboard is up to date when focusing the input
      updateVirtualKeyboardValue(unformattedValue)
      onFocusProp?.(event)
    },
    [disabled, onFocusProp, unformattedValue, updateVirtualKeyboardValue]
  )

  const handleBlur = useCallback(
    (event) => {
      if (disabled) return

      const nextFocus = event.relatedTarget || document.activeElement
      const isClickingAnotherInput =
        nextFocus?.tagName === 'INPUT' ||
        nextFocus?.tagName === 'TEXTAREA' ||
        nextFocus?.getAttribute('role') === 'combobox'

      // console.log(isClickingAnotherInput, { nextFocus })

      if (!isClickingAnotherInput) {
        dispatch(setIsOpen(false))
      }

      onBlurProp?.(event)
      dispatch(setLastKeyPress('{blur}'))
    },
    [dispatch, disabled, onBlurProp]
  )

  // Touch handlers
  const handleTouchStart = useCallback(
    (event) => {
      if (disabled) return
      isTouchDragging.current = false
      onTouchStartProp?.(event)
    },
    [disabled, onTouchStartProp]
  )

  const handleTouchMove = useCallback(
    (event) => {
      if (disabled) return
      isTouchDragging.current = true
      onTouchMoveProp?.(event)
    },
    [disabled, onTouchMoveProp]
  )

  const handleTouchEnd = useCallback(
    (event) => {
      if (disabled) return
      // delay so that clicking on the keyboard button doesn't immediately
      // close the keyboard due to onClick event
      if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
        setTimeout(() => {
          dispatch(setIsOpen(true))
          dispatch(setLayout(keyboardLayout))
        }, DELAY)
      }
      onTouchEndProp?.(event)
    },
    [disabled, virtualKeyboard.isOpen, onTouchEndProp, dispatch, keyboardLayout]
  )

  const handleVirtualKeyDown = useCallback(
    (event) => {
      if (disabled) return

      // eslint-disable-next-line no-unused-vars
      const syntheticEvent = {
        target: { value: event.detail.value },
      }
      // onChangeProp?.(syntheticEvent)
      // console.log('handleVirtualKeyDown', { event })
    },
    [disabled]
  )

  // Update the field when user types on virtual keyboard
  useEffect(() => {
    if (
      disabled ||
      !focused ||
      !virtualKeyboard.isOpen ||
      virtualKeyboard.inputValue === unformattedValue
    )
      return

    //   console.log('Updating field value from virtual keyboard', {
    //   virtualKeyboardValue: virtualKeyboard.inputValue,
    //   unformattedValue,
    // })

    // inputRef.current.value = virtualKeyboard.inputValue
    // Dispatch an onVirtualKeyDown event so that parent components can listen to changes from the virtual keyboard just like normal typing
    // const testEvent =
    // const event = new CustomEvent('onvirtualkeydown', {
    //   bubbles: true,
    //   detail: { value: virtualKeyboard.inputValue },
    // })
    // console.log('Updating field value from virtual keyboard', { event })
    // document.dispatchEvent(event)
    // const event = new Event('input', { bubbles: true })

    // const event = {
    //   reason: 'programmatic',
    //   event: new Event('custom'),
    //   cancel: () => {},
    //   allowPropagation: () => {},
    //   isCanceled: false,
    //   isPropagationAllowed: true,
    // }

    // inputRef.current.value = virtualKeyboard.inputValue
    // inputRef.current.dispatchEvent(event)
  }, [
    disabled,
    focused,
    // inputRef,
    // onChangeProp,
    unformattedValue,
    virtualKeyboard.inputValue,
    virtualKeyboard.isOpen,
  ])

  // Handle virtual keyboard enter (blur on enter)
  useEffect(() => {
    if (!focused || !virtualKeyboard.enter) return

    inputRef.current?.blur()
    dispatch(setIsOpen(false))
    dispatch(setLastKeyPress('{blur}'))
    dispatch(setEnter(false))
  }, [dispatch, focused, inputRef, virtualKeyboard.enter])

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
  }, [dispatch, inputRef])

  const handleKeyboardToggle = useCallback(() => {
    if (!focused) {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      )
    }

    dispatch(toggleOpen())
    dispatch(setLayout(keyboardLayout))
    handleSelectionChange()
  }, [dispatch, focused, handleSelectionChange, inputRef, keyboardLayout])

  return {
    inputRef,
    focused,
    isInternalChange,
    isOpen: virtualKeyboard.isOpen,
    virtualKeyboard, // REVIEW: Consider deprecating this and accessing it from `selectVirtualKeyboard` directly in the component
    handleChange,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyboardToggle,
    handleVirtualKeyDown,
    handleSelectionChange,
  }
}

export default useVirtualKeyboardAlt
