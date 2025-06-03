import PropTypes from 'prop-types'
import * as R from 'ramda'

import ComboboxBase from './ComboboxBase'

import { forceArray, withIndex } from '../../utils'

const PropComboBox = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, options, placeholder, propStyle, fullWidth, slotProps } =
    prop
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  const value = currentVal[0] ?? prop.value[0] ?? ''
  return (
    <ComboboxBase
      disabled={!enabled}
      options={R.pluck('id')(optionsListRaw)}
      sx={[...forceArray(sx), propStyle]}
      {...{ value, placeholder, slotProps, fullWidth, onChange }}
      getOptionLabel={(option) =>
        R.pathOr(option, [option, 'name'])(indexedOptions)
      }
    />
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
