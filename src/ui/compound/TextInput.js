import { InputAdornment, TextField, IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useEffect, useState, useRef } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  setIsOpen,
  setLayout,
  setInputValue,
  setCaretPosition,
  setEnter,
  setIsTextArea,
} from '../../data/utilities/virtualKeyboardSlice'

import { getStatusIcon } from '../../utils'

const DELAY = 10
const KEYBOARD_LAYOUT = 'default'

// `controlled` allows to create a `TextInput` instance
// with `value` and `onChange` controlled by its parent.
// `controlled` and `onChange` should be used together.
const TextInput = ({
  controlled,
  color = 'default',
  disabled,
  multiline,
  label,
  placeholder,
  help,
  value: valueParent,
  sx = [],
  slotProps,
  onChange,
  onClickAway = () => {},
  ...props
}) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const focused = useRef(false)
  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)

  const [value, setValue] = useState(valueParent)

  useEffect(() => {
    if (focused.current) return
    setValue(valueParent)
  }, [valueParent, setValue])

  useEffect(() => {
    if (focused.current && virtualKeyboard.enter) {
      inputRef.current.blur()
      dispatch(setIsOpen(false))
      dispatch(setEnter(false))
    }
  }, [dispatch, virtualKeyboard.enter])

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setAllValues = (inputValue) => {
    setValue(inputValue)
    dispatch(setInputValue(inputValue))
    selfChanged.current = true
  }

  // Update this field's value or trigger onChange when user types on virtual keyboard
  useEffect(() => {
    if (disabled || !focused.current || virtualKeyboard.inputValue === value)
      return

    if (controlled) {
      onChange(virtualKeyboard.inputValue)
    } else {
      setValue(virtualKeyboard.inputValue)
    }
  }, [onChange, disabled, controlled, virtualKeyboard.inputValue, value])

  // Keep cursor position synced with virtual keyboard's
  useEffect(() => {
    if (!focused.current) return

    if (
      inputRef.current &&
      !selfChanged.current &&
      !R.equals(virtualKeyboard.caretPosition, [
        inputRef.current.selectionStart,
        inputRef.current.selectionEnd,
      ])
    ) {
      inputRef.current.setSelectionRange(
        virtualKeyboard.caretPosition[0],
        virtualKeyboard.caretPosition[1]
      )
    }

    if (selfChanged.current) {
      selfChanged.current = false
    }
  }, [virtualKeyboard.caretPosition, virtualKeyboard.inputValue, value])

  const syncCaretPosition = () => {
    if (inputRef.current.selectionStart === inputRef.current.selectionEnd) {
      dispatch(
        setCaretPosition([
          inputRef.current.selectionStart,
          inputRef.current.selectionStart,
        ])
      )
      selfChanged.current = true
    }
  }

  return (
    <TextField
      {...{ disabled, label, placeholder, multiline, sx, ...props }}
      fullWidth
      value={controlled ? valueParent : value}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      onChange={(event) => {
        controlled
          ? onChange(event.target.value)
          : setAllValues(event.target.value)
      }}
      onSelect={syncCaretPosition}
      onFocus={() => {
        if (disabled) return

        // delay to ensure the keyboard closing is overriden
        // if user focuses to another input field
        if (virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(true))
            dispatch(setLayout(KEYBOARD_LAYOUT))
          }, DELAY)
        }

        focused.current = true
        setAllValues(value)
      }}
      onBlur={() => {
        if (disabled) return

        // delay so that focusing to another input field keeps
        // the keyboard open
        if (virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(false))
          }, DELAY)
        }

        focused.current = false
        onClickAway(value)
        dispatch(setIsTextArea(false))
      }}
      onTouchStart={() => {
        if (disabled) return

        isTouchDragging.current = false
      }}
      onTouchMove={() => {
        if (disabled) return

        isTouchDragging.current = true
      }}
      onTouchEnd={() => {
        if (disabled) return

        // delay so that clicking on the keyboard button doesn't immediately
        // close the keyboard due to onClick event
        if (!isTouchDragging.current && !virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(true))
            dispatch(setLayout(KEYBOARD_LAYOUT))
          }, DELAY)
        }
      }}
      helperText={help}
      inputRef={inputRef}
      slotProps={{
        ...slotProps,
        input: {
          readOnly: disabled,
          ...(!disabled && {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    if (!focused.current) {
                      inputRef.current.focus()
                      inputRef.current.setSelectionRange(
                        value.length,
                        value.length
                      )
                    }

                    dispatch(setIsOpen(!virtualKeyboard.isOpen))
                    dispatch(setLayout(KEYBOARD_LAYOUT))
                    syncCaretPosition()
                  }}
                  onMouseDown={(event) => {
                    if (focused.current) event.preventDefault()
                  }}
                >
                  <BiSolidKeyboard />
                </IconButton>
                {color !== 'default' && getStatusIcon(color)}
              </InputAdornment>
            ),
          }),
          ...slotProps?.input,
        },
        name: multiline ? 'cave-textarea-input' : 'cave-text-input',
      }}
    />
  )
}
TextInput.propTypes = {
  color: PropTypes.string,
  disabled: PropTypes.bool,
  help: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onClickAway: PropTypes.func,
}

export default TextInput
