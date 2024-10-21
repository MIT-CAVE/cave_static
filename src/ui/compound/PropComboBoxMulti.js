import { Autocomplete, Box, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withIndex, forceArray } from '../../utils'

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

const PropComboBoxMulti = ({
  prop,
  currentVal,
  sx = [],
  onChange,
  ...props
}) => {
  const { enabled = false, options, placeholder, numVisibleTags } = prop
  const optionsList = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsList)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Autocomplete
        multiple
        fullWidth
        sx={{ p: 1.5, maxWidth: 300 }}
        disabled={!enabled}
        limitTags={numVisibleTags}
        value={R.defaultTo(prop.value)(currentVal)}
        options={R.pluck('id')(optionsList)}
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            label={placeholder}
            variant="standard"
          />
        )}
        onChange={(_, updatedValue) => {
          if (enabled) onChange(updatedValue)
        }}
        getOptionLabel={(option) =>
          R.pathOr(option, [option, 'name'])(indexedOptions)
        }
      />
    </Box>
  )
}
PropComboBoxMulti.propTypes = {
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

export default PropComboBoxMulti
