import { InputAdornment, TextField, Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useEffect, useState, useRef } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  toggleKeyboard,
  setLayout,
  setInputValue,
} from '../../data/utilities/virtualKeyboardSlice'

import { getStatusIcon } from '../../utils'

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
  const inputChange = useRef(false)

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
    inputChange.current = true
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

  // Keep cursor position correct when user types on virtual keyboard since
  // setting the value will reset the cursor position to the end
  // Triggers when cursor position changes rather than immediately after typing
  // to let value update first
  useEffect(() => {
    if (!focused.current) return

    if (
      inputRef.current &&
      !inputChange.current &&
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

    if (inputChange.current) {
      inputChange.current = false
    }
  }, [virtualKeyboard.caretPosition, virtualKeyboard.inputValue, value])

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
      onFocus={() => {
        if (!enabled) return

        focused.current = true
        setAllValues(value)
      }}
      onBlur={() => {
        if (!enabled) return

        focused.current = false
        onClickAway(value)
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
                dispatch(toggleKeyboard())
                dispatch(setLayout('default'))
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
