import { InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useMemo, useState } from 'react'

import {
  getLocaleNumberParts,
  getStatusIcon,
  isNumericInputValid,
  parseNumber,
  formatNumber,
} from '../../utils'

const NumberInput = ({
  color = 'default',
  enabled,
  help,
  min,
  max,
  placeholder,
  value: defaultValue,
  // Here, units are excluded from `formatNumber`
  // as they are rendered on the prop container
  // eslint-disable-next-line no-unused-vars
  numberFormat: { unit, currency, ...numberFormat },
  onClickAway,
}) => {
  // const numberFormat = R.omit(['unit', 'currency'])(numberFormat)
  const [value, setValue] = useState(defaultValue)
  const [valueText, setValueText] = useState(
    defaultValue == null ? '' : formatNumber(defaultValue, numberFormat)
  )
  const [{ decimal }] = useState(getLocaleNumberParts())
  // NaN's can happen for these valid inputs: '.', '-', '-.', '+', '+.'
  const { validNaNs, zerosMatch } = useMemo(
    () => ({
      validNaNs: new RegExp(`^(-|\\+)?0?\\${decimal}?$`),
      zerosMatch: new RegExp(`\\${decimal}\\d*?[1-9]*(0+)?$`),
    }),
    [decimal]
  )

  const handleChange = (event) => {
    const rawValueText = event.target.value
    const rawValue = parseNumber(rawValueText)
    if (!isNumericInputValid(rawValue) && !R.test(validNaNs)(rawValueText))
      return

    if (isNaN(rawValue)) {
      setValue(defaultValue) // Go back to default in case blur occurs prematurely
      setValueText(rawValueText)
    } else {
      const forceInt = numberFormat.precision === 0 // Decimals not allowed
      const trailingZeros = R.pipe(R.match(zerosMatch), R.nth(1))(rawValueText)
      const newValueText = rawValue.toString()

      setValue(rawValue)
      setValueText(
        `${newValueText}${
          !forceInt &&
          // was the decimal lost in formatting?
          rawValueText.includes(decimal) &&
          !newValueText.includes(decimal)
            ? decimal
            : ''
        }${trailingZeros != null ? trailingZeros : ''}`
      )
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
      onBlur={() => {
        if (!enabled) return

        // Extra decimals are always rounded
        const roundedVal = parseNumber(formatNumber(value, numberFormat))
        const clampedVal = R.clamp(min, max, roundedVal)
        setValue(clampedVal)
        setValueText(formatNumber(clampedVal, numberFormat))
        if (clampedVal === defaultValue) return

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
