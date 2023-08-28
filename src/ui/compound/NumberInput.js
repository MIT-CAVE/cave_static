import { InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useMemo, useState } from 'react'

import { NumberFormat, getStatusIcon } from '../../utils'

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
  const [value, setValue] = useState(defaultValue)
  const [valueText, setValueText] = useState(
    defaultValue == null ? '' : NumberFormat.format(defaultValue, numberFormat)
  )

  // NaN's can happen for these valid inputs: '.', '-', '-.', '+', '+.'
  const { validNaNs, zerosMatch } = useMemo(
    () => ({
      validNaNs: new RegExp(`^(-|\\+)?0?\\${NumberFormat.decimal}?$`),
      zerosMatch: new RegExp(`\\${NumberFormat.decimal}\\d*?[1-9]*(0+)?$`),
    }),
    []
  )

  const handleChange = (event) => {
    const rawValueText = event.target.value
    const rawValue = NumberFormat.parse(rawValueText)
    if (!NumberFormat.isValid(rawValue) && !R.test(validNaNs)(rawValueText))
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
          rawValueText.includes(NumberFormat.decimal) &&
          !newValueText.includes(NumberFormat.decimal)
            ? NumberFormat.decimal
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
      onFocus={() => {
        setValueText(value)
      }}
      onBlur={() => {
        if (!enabled) return

        const clampedVal = R.clamp(min, max, value)
        setValue(clampedVal)
        setValueText(NumberFormat.format(clampedVal, numberFormat))
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
