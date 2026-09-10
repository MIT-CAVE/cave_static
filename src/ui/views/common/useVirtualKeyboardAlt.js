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
  setActiveFieldId,
  toggleOpen,
  setInputValue as SetKeyboardInputValue,
} from '../../../data/utilities/virtualKeyboardSlice'

import { NumberFormat } from '../../../utils'

const DELAY = 10

const isTextInput = (el) => {
  if (!el) return false
  const tagName = el.tagName?.toLowerCase()
  if (tagName === 'textarea') return true
  if (tagName === 'input') {
    const type = el.type?.toLowerCase() || 'text'
    const nonTextTypes = [
      'range',
      'checkbox',
      'radio',
      'button',
      'submit',
      'reset',
      'color',
      'file',
      'hidden',
      'image',
    ]
    return !nonTextTypes.includes(type)
  }
  const role = el.getAttribute?.('role')
  return (
    role === 'combobox' || role === 'textbox' || Boolean(el.isContentEditable)
  )
}

const useVirtualKeyboardAlt = ({
  keyboardLayout = 'default',
  disabled,
  inputRef,
  focused,
  fieldId,
  unformattedValue,
  min = -Infinity,
  max = Infinity,
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

  // Update virtual keyboard's value when this field changes from non-keyboard input
  const updateVirtualKeyboardValue = useCallback(
    (value) => {
      dispatch(SetKeyboardInputValue(value))
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
      // Claim VK ownership for this field before syncing its value so the
      // VK internal buffer resets cleanly when focus moves between fields.
      dispatch(setActiveFieldId(fieldId))
      // Ensure virtual keyboard is up to date when focusing the input
      updateVirtualKeyboardValue(unformattedValue)
      onFocusProp?.(event)
    },
    [
      dispatch,
      disabled,
      fieldId,
      onFocusProp,
      unformattedValue,
      updateVirtualKeyboardValue,
    ]
  )

  const handleBlur = useCallback(
    (event) => {
      if (disabled) return

      const nextFocus = event.relatedTarget || document.activeElement
      const isClickingAnotherInput = isTextInput(nextFocus)

      // console.log(isClickingAnotherInput, { nextFocus })

      // Only sync from the VK buffer when the VK was actually in use and this
      // field owned it. Otherwise a stale redux `inputValue` (from a prior
      // field or initial "") would clobber whatever the user just typed
      // directly and fire an extra `input` event that races the blur-triggered
      // commit.
      if (
        virtualKeyboard.isOpen &&
        virtualKeyboard.activeFieldId === fieldId &&
        virtualKeyboard.inputValue !== unformattedValue
      ) {
        const rawValue = NumberFormat.parse(virtualKeyboard.inputValue)
        const fallback = isFinite(min) ? min : isFinite(max) ? max : 0
        const validValue = NumberFormat.isValid(rawValue) ? rawValue : fallback
        const finalValue = R.clamp(min, max)(validValue).toString()

        const customEvent = new CustomEvent('onvirtualkeydown', {
          bubbles: true,
          detail: { value: finalValue },
        })
        document.dispatchEvent(customEvent)

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        ).set
        if (nativeInputValueSetter && inputRef.current) {
          nativeInputValueSetter.call(inputRef.current, finalValue)
          inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }

      if (!isClickingAnotherInput) {
        dispatch(setIsOpen(false))
        dispatch(setActiveFieldId(null))
      }

      onBlurProp?.(event)
      dispatch(setLastKeyPress('{blur}'))
    },
    [
      dispatch,
      disabled,
      fieldId,
      onBlurProp,
      virtualKeyboard.activeFieldId,
      virtualKeyboard.isOpen,
      virtualKeyboard.inputValue,
      unformattedValue,
      inputRef,
      min,
      max,
    ]
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

  // Update the field when user types on virtual keyboard
  useEffect(() => {
    if (
      disabled ||
      !focused ||
      !virtualKeyboard.isOpen ||
      virtualKeyboard.activeFieldId !== fieldId ||
      virtualKeyboard.inputValue === unformattedValue
      // virtualKeyboard.layout === 'numPad'
    )
      return

    // console.log('Dispatching onvirtualkeydown', { value: virtualKeyboard.inputValue })

    const finalValue = virtualKeyboard.inputValue

    // Dispatch an onVirtualKeyDown event so that parent components can listen to changes from the virtual keyboard just like normal typing
    const event = new CustomEvent('onvirtualkeydown', {
      bubbles: true,
      detail: { value: finalValue },
    })
    document.dispatchEvent(event)

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set
    if (nativeInputValueSetter && inputRef.current) {
      nativeInputValueSetter.call(inputRef.current, finalValue)
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, [
    disabled,
    fieldId,
    focused,
    unformattedValue,
    virtualKeyboard.activeFieldId,
    virtualKeyboard.inputValue,
    virtualKeyboard.isOpen,
    virtualKeyboard.layout,
    inputRef,
  ])

  // Handle virtual keyboard enter (blur on enter)
  useEffect(() => {
    if (
      !focused ||
      !virtualKeyboard.enter ||
      virtualKeyboard.activeFieldId !== fieldId
    )
      return

    if (virtualKeyboard.inputValue !== unformattedValue) {
      const rawValue = NumberFormat.parse(virtualKeyboard.inputValue)
      const fallback = isFinite(min) ? min : isFinite(max) ? max : 0
      const validValue = NumberFormat.isValid(rawValue) ? rawValue : fallback
      const finalValue = R.clamp(min, max)(validValue).toString()

      const event = new CustomEvent('onvirtualkeydown', {
        bubbles: true,
        detail: { value: finalValue },
      })
      document.dispatchEvent(event)

      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      ).set
      if (nativeInputValueSetter && inputRef.current) {
        nativeInputValueSetter.call(inputRef.current, finalValue)
        inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }

    inputRef.current?.blur()
    dispatch(setIsOpen(false))
    dispatch(setActiveFieldId(null))
    dispatch(setLastKeyPress('{blur}'))
    dispatch(setEnter(false))
  }, [
    dispatch,
    fieldId,
    focused,
    inputRef,
    virtualKeyboard.activeFieldId,
    virtualKeyboard.enter,
    virtualKeyboard.inputValue,
    unformattedValue,
    min,
    max,
  ])

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
    const nextOpen = !virtualKeyboard.isOpen
    if (!focused) {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      )
    } else if (nextOpen) {
      // Ensure virtual keyboard is up to date when opening it
      updateVirtualKeyboardValue(unformattedValue)
    }

    dispatch(toggleOpen())
    dispatch(setLayout(keyboardLayout))
    handleSelectionChange()
  }, [
    dispatch,
    focused,
    handleSelectionChange,
    inputRef,
    keyboardLayout,
    virtualKeyboard.isOpen,
    unformattedValue,
    updateVirtualKeyboardValue,
  ])

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
    handleSelectionChange,
  }
}

export default useVirtualKeyboardAlt
