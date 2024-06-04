import { InputAdornment, TextField, Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useEffect, useState, useRef } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch, useSelector } from 'react-redux'

import { selectVirtualKeyboard } from '../../data/selectors'
import {
  toggleKeyboard,
  setInputValue,
  incrementField,
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
  const field = useRef(-1)
  const [value, setValue] = useState(valueParent)

  useEffect(() => {
    if (focused.current) return
    setValue(valueParent)
  }, [valueParent, setValue])

  // Update virtual keyboard's value when this field's value changes
  useEffect(() => {
    if (!enabled || virtualKeyboard.currField !== field.current) return
    dispatch(setInputValue(value))
  }, [dispatch, virtualKeyboard.currField, enabled, value])

  // Update this field's value or trigger onChange when user types on virtual keyboard
  useEffect(() => {
    if (!enabled || virtualKeyboard.currField !== field.current) return

    if (controlled) {
      onChange(virtualKeyboard.inputValue)
    } else {
      setValue(virtualKeyboard.inputValue)
    }
  }, [
    onChange,
    enabled,
    controlled,
    virtualKeyboard.currField,
    virtualKeyboard.inputValue,
  ])

  const setAsCurrField = () => {
    field.current = virtualKeyboard.currField + 1
    dispatch(incrementField())
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
        controlled ? onChange(event.target.value) : setValue(event.target.value)
      }}
      onFocus={() => {
        if (!enabled) return

        focused.current = true
        setAsCurrField()
      }}
      onBlur={() => {
        if (!enabled) return

        focused.current = false
        onClickAway(value)
      }}
      helperText={help}
      InputProps={{
        readOnly: !enabled,
        endAdornment: (
          <InputAdornment position="end">
            <Box
              sx={{ cursor: 'pointer' }}
              onClick={() => {
                setAsCurrField()
                dispatch(toggleKeyboard())
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
