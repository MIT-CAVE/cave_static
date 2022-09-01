import { InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useMemo, useState } from 'react'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import {
  getLocaleNumberParts,
  isValidNumericInput,
  parseNumber,
  prettifyValue,
} from '../../utils'

const getStatusIcon = (color) => {
  const IconClass = R.cond([
    [R.equals('error'), BiError],
    [R.equals('info'), BiInfoCircle],
    [R.equals('success'), BiCheckCircle],
    [R.equals('warning'), BiError],
    [R.equals(R.T), null],
  ])(color)
  return IconClass ? IconClass : null
}

const NumberInput = ({
  color = 'default',
  enabled,
  help,
  min,
  max,
  placeholder,
  type,
  unit,
  value: defaultValue,
  formatOnChange = false,
  onClickAway,
}) => {
  const [value, setValue] = useState(defaultValue)
  const [valueText, setValueText] = useState(
    defaultValue ? prettifyValue(defaultValue) : ''
  )
  const [{ decimal }] = useState(getLocaleNumberParts())
  const validNaNs = useMemo(
    () => new RegExp(`^(-|\\+)?0?\\${decimal}?$`),
    [decimal]
  )

  const handleChange = (event) => {
    const rawValueText = event.target.value
    const rawValue = parseNumber(rawValueText)
    if (!isValidNumericInput(rawValue) && !R.test(validNaNs)(rawValueText))
      return

    // NaN's can happen for these valid inputs: '.', '-', '-.', '+', '+.'
    if (isNaN(rawValue)) {
      setValue(defaultValue) // Go back to default in case blur occurs prematurely
      setValueText(rawValueText)
    } else {
      const newValueText = formatOnChange ? prettifyValue(rawValue) : rawValue
      setValue(rawValue)
      setValueText(
        `${newValueText}${rawValueText.endsWith(decimal) ? decimal : ''}`
      )
    }
  }

  return (
    <TextField
      sx={{ width: '100%' }}
      {...{ placeholder, type }}
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      value={valueText}
      onChange={handleChange}
      onBlur={() => {
        if (!enabled) return

        const clampedVal = R.clamp(min, max, value)
        setValue(clampedVal)
        setValueText(prettifyValue(clampedVal))
        onClickAway(clampedVal)
      }}
      helperText={help}
      InputProps={{
        readOnly: !enabled,
        ...(color !== 'default' && {
          endAdornment: (
            <InputAdornment position="end">
              {getStatusIcon(color)}
            </InputAdornment>
          ),
        }),
        ...(unit && {
          startAdornment: (
            <InputAdornment position="start">{unit}</InputAdornment>
          ),
        }),
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
  type: PropTypes.string,
  unit: PropTypes.string,
  value: PropTypes.string,
  formatOnChange: PropTypes.bool,
  onClickAway: PropTypes.func,
}

export default NumberInput
