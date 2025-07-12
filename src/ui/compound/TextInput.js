import { InputAdornment, TextField, IconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { useEffect, useState, useCallback } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch } from 'react-redux'

import {
  setInputValue,
  setIsTextArea,
} from '../../data/utilities/virtualKeyboardSlice'
import { useVirtualKeyboard } from '../views/common/useVirtualKeyboard'

import { getStatusIcon } from '../../utils'

// `controlled` allows to create a `TextInput` instance
// with `value` and `onChange` controlled by its parent.
// `controlled` and `onChange` should be used together.
const TextInput = ({
  controlled,
  disabled,
  readOnly,
  multiline,
  rows,
  label,
  placeholder,
  help,
  value: defaultValue,
  color = 'default',
  statusIcon,
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  sx = [],
  slotProps,
  endAdornments,
  onChange,
  onClickAway = () => {},
}) => {
  const [value, setValue] = useState(defaultValue)
  const dispatch = useDispatch()

  const {
    inputRef,
    virtualKeyboard,
    focused,
    isInternalChange,
    handleFocus,
    handleBlur,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKeyboardToggle,
    handleKeyboardMouseDown,
    handleSelectionChange,
  } = useVirtualKeyboard({
    keyboardLayout: 'default',
    disabled,
    onBlur: () => {
      // component-specific blur logic
      if (value === defaultValue) return
      dispatch(setIsTextArea(false))
      // setKeyboardValue(value)
      onClickAway(value)
    },
    onFocus: () => {
      // component-specific focus logic
      dispatch(setIsTextArea(multiline))
      setKeyboardValue(value)
    },
  })

  useEffect(() => {
    if (focused.current) return
    setValue(defaultValue)
  }, [defaultValue, focused, setValue])

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setKeyboardValue = useCallback(
    (inputValue) => {
      setValue(inputValue)
      dispatch(setInputValue(inputValue))
      isInternalChange.current = true
    },
    [dispatch, isInternalChange]
  )

  // Update this field's value or trigger onChange when user types on virtual keyboard
  useEffect(() => {
    if (disabled || !focused.current || virtualKeyboard.inputValue === value)
      return

    if (controlled) {
      onChange(virtualKeyboard.inputValue)
    } else {
      setValue(virtualKeyboard.inputValue)
    }
  }, [
    onChange,
    disabled,
    controlled,
    virtualKeyboard.inputValue,
    value,
    focused,
  ])

  // Keep cursor position synced with virtual keyboard's
  return (
    <TextField
      {...{
        disabled,
        inputRef,
        label,
        placeholder,
        multiline,
        rows,
        sx,
        fullWidth,
      }}
      name={multiline ? 'cave-textarea-input' : 'cave-text-input'}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      value={controlled ? defaultValue : value}
      onChange={(event) => {
        controlled
          ? onChange(event.target.value)
          : setKeyboardValue(event.target.value)
      }}
      onSelect={handleSelectionChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      helperText={help}
      slotProps={{
        ...slotProps,
        input: {
          readOnly,
          ...(!(disabled || readOnly) && {
            endAdornment: (
              <InputAdornment position="end">
                {endAdornments}
                <IconButton
                  size="small"
                  onClick={handleKeyboardToggle}
                  onMouseDown={handleKeyboardMouseDown}
                >
                  <BiSolidKeyboard />
                </IconButton>
                {color !== 'default' && statusIcon && getStatusIcon(color)}
              </InputAdornment>
            ),
          }),
          ...slotProps?.input,
        },
      }}
    />
  )
}
TextInput.propTypes = {
  color: PropTypes.string,
  statusIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  help: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onClickAway: PropTypes.func,
}

export default TextInput
