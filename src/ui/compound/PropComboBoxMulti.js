import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import Combobox from './ComboboxBase'

import { withIndex, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  pt: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
  '& .MuiAutocomplete-root': { p: 1 },
})

const PropComboBoxMulti = ({
  prop,
  currentVal,
  sx = [],
  onChange,
  ...props
}) => {
  const { enabled, options, placeholder, numVisibleTags, slotProps } = prop
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Combobox
        multiple
        disabled={!enabled}
        sx={{ maxWidth: '300px' }}
        options={R.pluck('id')(optionsListRaw)}
        value={R.defaultTo(prop.value)(currentVal)}
        limitTags={numVisibleTags}
        {...{ placeholder, slotProps, onChange }}
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
