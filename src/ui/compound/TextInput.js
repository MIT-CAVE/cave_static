import { InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { getStatusIcon, unitStyles } from '../../utils'

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
  // Since this is just text, only unit and
  // currency are needed for display purposes
  numberFormat = {},
  onChange,
  onClickAway = () => {},
  ...props
}) => {
  const [value, setValue] = useState(valueParent)
  const { unit, currency } = numberFormat
  const unitPos = currency ? 'start' : 'end'
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
      onBlur={() => {
        if (!enabled) return
        onClickAway(value)
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
          [`${unitPos}Adornment`]: (
            <InputAdornment
              disableTypography
              position={unitPos}
              sx={unitStyles}
            >
              {unit}
            </InputAdornment>
          ),
        }),
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
