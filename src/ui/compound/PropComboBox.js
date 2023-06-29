import { Autocomplete, Box, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { customSort, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  pt: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
  '& .MuiAutocomplete-root': {
    p: 1,
  },
})

const PropComboBox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options, placeholder } = prop
  const [value] = R.defaultTo(prop.value, currentVal)
  const optionsListRaw = customSort(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Autocomplete
        fullWidth
        {...{ value }}
        sx={{ p: 1.5 }}
        disabled={!enabled}
        disablePortal
        options={R.pluck('id')(optionsListRaw)}
        renderInput={(params) => (
          // The placeholder in the API serves as a label in the context of the MUI component.
          <TextField fullWidth label={placeholder} {...params} />
        )}
        onChange={(event, val) => {
          if (enabled) onChange([val])
        }}
        getOptionLabel={(option) =>
          R.pathOr(option, [option, 'name'])(indexedOptions)
        }
      />
    </Box>
  )
}
PropComboBox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropComboBox
