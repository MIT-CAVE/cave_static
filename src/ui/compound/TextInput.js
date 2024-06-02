import { InputAdornment, TextField, Box } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useEffect, useRef, useState } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import Keyboard from 'react-simple-keyboard'
import 'react-simple-keyboard/build/css/index.css'
import './Keyboard.css'

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
  // const [keyboardState, setKeyboardState] = useState({
  //   layoutName: 'default',
  //   input: value,
  // })

  // function onKeyboardChange(input) {
  //   onChange(input)
  //   setKeyboardState({ ...keyboardState, input })
  // }

  // function onKeyPress(button) {
  //   if (button === '{shift}' || button === '{lock}') handleShift()
  // }

  // const handleShift = () => {
  //   const layoutName = keyboardState.layoutName

  //   setKeyboardState({
  //     layoutName: layoutName === 'default' ? 'shift' : 'default',
  //   })
  // }

  useEffect(() => {
    if (focused.current) return
    setValue(valueParent)
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
            : setValue(event.target.value)
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
      <Keyboard
        // layoutName={keyboardState.layoutName}
        layout={{
          default: [
            '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
            '{tab} q w e r t y u i o p [ ] \\',
            "{lock} a s d f g h j k l ; ' {enter}",
            '{shift} z x c v b n m , . / {shift}',
            '.com @ {space}',
          ],
          shift: [
            '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
            '{tab} Q W E R T Y U I O P { } |',
            '{lock} A S D F G H J K L : " {enter}',
            '{shift} Z X C V B N M < > ? {shift}',
            '.com @ {space}',
          ],
        }}
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
