import { InputAdornment, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import React, { useState } from 'react'

import { getStatusIcon } from '../../utils'

const TextInput = ({
  color = 'default',
  enabled,
  help,
  placeholder,
  value: defaultValue,
  onClickAway,
}) => {
  const [value, setValue] = useState(defaultValue)
  return (
    <TextField
      sx={{ width: '100%' }}
      {...{ placeholder, value }}
      id="standard-basic"
      color={color === 'default' ? 'primary' : color}
      focused={color !== 'default'}
      onChange={(event) => {
        setValue(event.target.value)
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
