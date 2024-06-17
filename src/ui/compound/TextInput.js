import { InputAdornment, TextField, Box } from '@mui/material'
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
} from '../../data/utilities/virtualKeyboardSlice'

import { getStatusIcon } from '../../utils'

const DELAY = 10
const KEYBOARD_LAYOUT = 'default'

// `controlled` allows to create a `TextInput` instance
// with `value` and `onChange` controlled by its parent.
// `controlled` and `onChange` should be used together.
const TextInput = ({
  controlled,
  sx,
  color = 'default',
  enabled,
  label,
  placeholder,
  help,
  value: valueParent,
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

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setAllValues = (inputValue) => {
    setValue(inputValue)
    dispatch(setInputValue(inputValue))
    selfChanged.current = true
  }

  // Update this field's value or trigger onChange when user types on virtual keyboard
  useEffect(() => {
    if (!enabled || !focused.current || virtualKeyboard.inputValue === value)
      return

    if (controlled) {
      onChange(virtualKeyboard.inputValue)
    } else {
      setValue(virtualKeyboard.inputValue)
    }
  }, [onChange, enabled, controlled, virtualKeyboard.inputValue, value])

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
      {...{ label, placeholder, sx, ...props }}
      disabled={!enabled}
      id="standard-basic"
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
        if (!enabled) return

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
        if (!enabled) return

        // delay so that focusing to another input field keeps
        // the keyboard open
        if (virtualKeyboard.isOpen) {
          setTimeout(() => {
            dispatch(setIsOpen(false))
          }, DELAY)
        }

        focused.current = false
        onClickAway(value)
      }}
      onTouchStart={() => {
        if (!enabled) return

        isTouchDragging.current = false
      }}
      onTouchMove={() => {
        if (!enabled) return

        isTouchDragging.current = true
      }}
      onTouchEnd={() => {
        if (!enabled) return

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
      InputProps={{
        readOnly: !enabled,
        endAdornment: (
          <InputAdornment position="end">
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                if (!focused.current) {
                  inputRef.current.focus()
                  inputRef.current.setSelectionRange(value.length, value.length)
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
            </Box>
            {color !== 'default' && getStatusIcon(color)}
          </InputAdornment>
        ),
      }}
    />
  )
}
TextInput.propTypes = {
  color: PropTypes.string,
  enabled: PropTypes.bool,
  help: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onClickAway: PropTypes.func,
}

export default TextInput
