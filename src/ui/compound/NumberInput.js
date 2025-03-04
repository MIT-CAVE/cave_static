import { IconButton, InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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

import { NumberFormat, forceArray, getStatusIcon } from '../../utils'

const shallowEqual = (object1, object2) => {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false
    }
  }

  return true
}

const removeUnits = (numberFormat) => {
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  const { unit, unitPlacement, ...rest } = numberFormat
  return rest
}

const DELAY = 10
const KEYBOARD_LAYOUT = 'numPad'

const NumberInput = ({
  disabled,
  help,
  min,
  max,
  label,
  placeholder,
  value: defaultValue,
  numberFormat,
  color = 'default',
  statusIcon,
  sx = [],
  slotProps,
  endAdornments,
  onClickAway,
}) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const focused = useRef(false)
  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)
  // only changes when numberFormat's keys/values change
  const [numberFormatMemo, setNumberFormatMemo] = useState(() =>
    removeUnits(numberFormat)
  )
  const [value, setValue] = useState(defaultValue)
  const [valueText, setValueText] = useState(
    defaultValue == null
      ? ''
      : NumberFormat.format(defaultValue, numberFormatMemo)
  )

  useEffect(() => {
    const newNumberFormatMemo = removeUnits(numberFormat)
    if (!shallowEqual(newNumberFormatMemo, numberFormatMemo)) {
      setNumberFormatMemo(newNumberFormatMemo)
    }
  }, [numberFormat, numberFormatMemo])

  useEffect(() => {
    if (focused.current && virtualKeyboard.enter) {
      inputRef.current.blur()
      dispatch(setIsOpen(false))
      dispatch(setEnter(false))
    }
  }, [dispatch, virtualKeyboard.enter])

  // Update virtual keyboard's value when this field's value changes
  // from anything besides the virtual keyboard
  const setAllValues = useCallback(
    (inputValue) => {
      setValueText(inputValue)
      dispatch(setInputValue(inputValue.toString()))
      selfChanged.current = true
    },
    [dispatch]
  )

  // NaN's can happen for these valid inputs: '.', '-', '-.', '+', '+.'
  const { validNaNs, zerosMatch } = useMemo(
    () => ({
      validNaNs: new RegExp(`^(-|\\+)?0?\\${NumberFormat.decimal}?$`),
      zerosMatch: new RegExp(`\\${NumberFormat.decimal}\\d*?[1-9]*(0+)?$`),
    }),
    []
  )

  const handleChange = useCallback(
    (event) => {
      const rawValueText = event.target.value
      const rawValue = NumberFormat.parse(rawValueText)
      if (!NumberFormat.isValid(rawValue) && !R.test(validNaNs)(rawValueText))
        return

      if (isNaN(rawValue)) {
        setValue(defaultValue) // Go back to default in case blur occurs prematurely
        setAllValues(rawValueText)
      } else {
        const forceInt = numberFormatMemo.precision === 0 // Decimals not allowed
        const trailingZeros = R.pipe(
          R.match(zerosMatch),
          R.nth(1)
        )(rawValueText)
        const newValueText = rawValue.toString()

        setValue(rawValue)
        setAllValues(
          `${newValueText}${
            !forceInt &&
            // was the decimal lost in formatting?
            rawValueText.includes(NumberFormat.decimal) &&
            !newValueText.includes(NumberFormat.decimal)
              ? NumberFormat.decimal
              : ''
          }${trailingZeros != null ? trailingZeros : ''}`
        )
      }
    },
    [
      setAllValues,
      numberFormatMemo.precision,
      validNaNs,
      zerosMatch,
      defaultValue,
    ]
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
  ])

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

  useEffect(() => {
    if (focused.current) return

    setValue(defaultValue)
    setValueText(
      defaultValue == null
        ? ''
        : NumberFormat.format(defaultValue, numberFormatMemo)
    )
  }, [defaultValue, numberFormatMemo])

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
      sx={[{ width: '100%' }, ...forceArray(sx)]}
      {...{ placeholder, label }}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      value={valueText}
      onChange={handleChange}
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

        dispatch(setIsTextArea(false))
        focused.current = false
        const clampedVal = R.clamp(min, max, value)
        setValue(clampedVal)
        setAllValues(NumberFormat.format(clampedVal, numberFormatMemo))
        if (clampedVal === defaultValue) return

        onClickAway(clampedVal)
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
                {endAdornments}
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
NumberInput.propTypes = {
  color: PropTypes.string,
  statusIcon: PropTypes.bool,
  disabled: PropTypes.bool,
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
