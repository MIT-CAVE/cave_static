import { InputAdornment, TextField, Box } from '@mui/material'
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

import { NumberFormat, getStatusIcon } from '../../utils'

const DELAY = 10
const KEYBOARD_LAYOUT = 'numPad'

const NumberInput = ({
  color = 'default',
  enabled,
  help,
  min,
  max,
  placeholder,
  value: defaultValue,
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  numberFormat: { unit, unitPlacement, ...numberFormat },
  onClickAway,
}) => {
  const dispatch = useDispatch()
  const virtualKeyboard = useSelector(selectVirtualKeyboard)

  const focused = useRef(false)
  const inputRef = useRef(null)
  const selfChanged = useRef(false)
  const isTouchDragging = useRef(false)

  const [value, setValue] = useState(defaultValue)
  const [valueText, setValueText] = useState(
    defaultValue == null ? '' : NumberFormat.format(defaultValue, numberFormat)
  )

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
        const forceInt = numberFormat.precision === 0 // Decimals not allowed
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
    [setAllValues, numberFormat.precision, validNaNs, zerosMatch, defaultValue]
  )

  // Update this field's value when user types on virtual keyboard
  useEffect(() => {
    if (
      !enabled ||
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
    enabled,
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
        : NumberFormat.format(defaultValue, numberFormat)
    )
  }, [defaultValue, numberFormat, setValue, setValueText])

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
      sx={{ width: '100%' }}
      {...{ placeholder }}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      value={valueText}
      onChange={handleChange}
      onSelect={syncCaretPosition}
      onFocus={() => {
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

        dispatch(setIsTextArea(false))
        focused.current = false
        const clampedVal = R.clamp(min, max, value)
        setValue(clampedVal)
        setAllValues(NumberFormat.format(clampedVal, numberFormat))
        if (clampedVal === defaultValue) return

        onClickAway(clampedVal)
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
NumberInput.propTypes = {
  color: PropTypes.string,
  enabled: PropTypes.bool,
  help: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  numberFormat: PropTypes.object,
  onClickAway: PropTypes.func,
}

export default NumberInput
