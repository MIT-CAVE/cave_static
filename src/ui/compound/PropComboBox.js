import { Autocomplete, Box, Divider, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { customSort, forceArray, unitStyles } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropComboBox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const { enabled = false, options, placeholder } = prop
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
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
      <Divider orientation="vertical" flexItem />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
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
