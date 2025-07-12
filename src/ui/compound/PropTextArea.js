import PropTypes from 'prop-types'

import TextInput from './TextInput'

import { forceArray } from '../../utils'

const PropTextArea = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    readOnly,
    rows = 4,
    placeholder,
    label,
    fullWidth,
    propStyle,
  } = prop
  return (
    <TextInput
      multiline
      disabled={!enabled}
      sx={[...forceArray(sx), propStyle]}
      {...{ readOnly, rows, placeholder, label, fullWidth }}
      value={currentVal ?? prop.value}
      onClickAway={(value) => {
        if (enabled) onChange(value)
      }}
    />
  )
}
PropTextArea.propTypes = {
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

export default PropTextArea
