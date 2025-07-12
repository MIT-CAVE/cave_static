import { IconButton, InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useEffect, useState, useCallback } from 'react'
import { BiSolidKeyboard } from 'react-icons/bi'
import { useDispatch } from 'react-redux'

import useNumberInput from './useNumberInput'

import {
  setInputValue,
  setCaretPosition,
} from '../../data/utilities/virtualKeyboardSlice'
import { useVirtualKeyboard } from '../views/common/useVirtualKeyboard'

import { NumberFormat, getStatusIcon } from '../../utils'

const NumberInput = ({
  disabled,
  readOnly,
  min,
  max,
  label,
  placeholder,
  help,
  value: defaultValue,
  numberFormat,
  color = 'default',
  statusIcon,
  fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  sx = [],
  slotProps,
  endAdornments,
  onClickAway,
}) => {
  const [value, setValue] = useState(defaultValue)
  const {
    inputRef,
    isInternalChange,
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
  } = useVirtualKeyboard({
    keyboardLayout: 'numPad',
    disabled,
    onBlur: () => {
      // component-specific blur logic
      const clampedVal = R.clamp(min, max)(value)
      setValue(clampedVal)
      setKeyboardValue(NumberFormat.format(clampedVal, numberFormatMemo))
      if (clampedVal === defaultValue) return

      onClickAway(clampedVal)
    },
    onFocus: () => {
      // component-specific focus logic
      setKeyboardValue(value)
    },
  })
  const dispatch = useDispatch()

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setKeyboardValue = useCallback(
    (inputValue) => {
      setValueText(inputValue)
      dispatch(setInputValue(inputValue.toString()))
      isInternalChange.current = true
    },
    [dispatch, isInternalChange]
  )

  const { validNaNs, numberFormatMemo, handleChange } = useNumberInput({
    defaultValue,
    numberFormat,
    setFieldValue: setValue,
    setKeyboardValue,
  })

  const [valueText, setValueText] = useState(
    defaultValue == null
      ? ''
      : NumberFormat.format(defaultValue, numberFormatMemo)
  )

  // Update this field's value when user types on virtual keyboard
  useEffect(() => {
    if (
      disabled ||
      !focused.current ||
      virtualKeyboard.inputValue === valueText
    )
      return

    const rawValueText = virtualKeyboard.inputValue
    const rawValue = NumberFormat.parse(rawValueText)
    if (!NumberFormat.isValid(rawValue) && !R.test(validNaNs)(rawValueText)) {
      dispatch(setInputValue(valueText))
      dispatch(
        setCaretPosition([
          virtualKeyboard.caretPosition[0] - 1,
          virtualKeyboard.caretPosition[1] - 1,
        ])
      )
    }

    handleChange({ target: { value: virtualKeyboard.inputValue } })
  }, [
    dispatch,
    disabled,
    validNaNs,
    virtualKeyboard.inputValue,
    virtualKeyboard.caretPosition,
    valueText,
    handleChange,
    focused,
  ])

  useEffect(() => {
    if (focused.current) return

    setValue(defaultValue)
    setValueText(
      defaultValue == null
        ? ''
        : NumberFormat.format(defaultValue, numberFormatMemo)
    )
  }, [defaultValue, focused, numberFormatMemo])

  return (
    <TextField
      {...{ disabled, inputRef, label, placeholder, sx, fullWidth }}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      value={valueText}
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
      onChange={handleChange}
      onSelect={handleSelectionChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  )
}
NumberInput.propTypes = {
  color: PropTypes.string,
  statusIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  help: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  numberFormat: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onClickAway: PropTypes.func,
}

export default NumberInput
