import { Autocomplete, TextField } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { customSort } from '../../utils'

const PropComboBox = ({ prop, currentVal, onChange }) => {
  const { enabled = false, options, placeholder } = prop
  const [value] = R.defaultTo(prop.value, currentVal)
  const optionsListRaw = customSort(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
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
  )
}
PropComboBox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  onChange: PropTypes.func,
}

export default PropComboBox
