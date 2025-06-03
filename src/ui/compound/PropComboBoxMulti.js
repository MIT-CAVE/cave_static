import PropTypes from 'prop-types'
import * as R from 'ramda'

import ComboboxBase from './ComboboxBase'

import { forceArray, withIndex } from '../../utils'

const PropComboBoxMulti = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    placeholder,
    numVisibleTags,
    propStyle,
    fullWidth,
    slotProps,
  } = prop
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
    <ComboboxBase
      multiple
      disabled={!enabled}
      options={R.pluck('id')(optionsListRaw)}
      value={R.defaultTo(prop.value)(currentVal)}
      limitTags={numVisibleTags}
      sx={[...forceArray(sx), propStyle]}
      {...{ placeholder, slotProps, fullWidth, onChange }}
      getOptionLabel={(option) =>
        R.pathOr(option, [option, 'name'])(indexedOptions)
      }
    />
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
