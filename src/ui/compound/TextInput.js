import { InputAdornment, TextField, Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'

import VirtualKeyboard from './VirtualKeyboard.js'

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
  const focused = useRef(false)
  const [value, setValue] = useState(valueParent)
  const keyboard = useRef(null)

  const setInput = (value) => {
    setValue(value)
    keyboard.current.setInput(value)
  }

  useEffect(() => {
    if (focused.current) return
    setInput(valueParent)
  }, [valueParent, setValue])

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 1,
      }}
    >
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
            : setInput(event.target.value)
        }}
        onFocus={() => {
          if (!enabled) return

          focused.current = true
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
              <Box sx={{ cursor: 'pointer' }} onClick={() => {}}>
                <BiSolidKeyboard />
              </Box>
              {color !== 'default' && getStatusIcon(color)}
            </InputAdornment>
          ),
        }}
      />
      <VirtualKeyboard
        keyboardRef={keyboard}
        controlled={controlled}
        setInput={setInput}
        onChange={onChange}
      />
    </Box>
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
