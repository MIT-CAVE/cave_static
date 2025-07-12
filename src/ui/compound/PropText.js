import PropTypes from 'prop-types'
import * as R from 'ramda'

import TextInput from './TextInput'

const PropText = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, readOnly, placeholder, label, fullWidth } = prop
  return (
    <TextInput
      disabled={!enabled}
      {...{ readOnly, placeholder, label, sx, fullWidth }}
      value={R.defaultTo(prop.value)(currentVal)}
      onClickAway={(value) => {
        if (enabled) onChange(value)
      }}
    />
  )
}
PropText.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropText
