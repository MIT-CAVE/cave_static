import PropTypes from 'prop-types'

import RadioBase from './RadioBase'

import { forceArray } from '../../utils'

const PropRadio = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    options,
    enabled,
    labelPlacement = 'end',
    helperText,
    fullWidth,
    propStyle,
    ...propAttrs
  } = prop
  const [value] = currentVal ?? prop.value
  return (
    <RadioBase
      disabled={!enabled}
      sx={[...forceArray(sx), fullWidth && { width: '100%' }, propStyle]}
      {...{ options, value, labelPlacement, helperText, propAttrs, onChange }}
    />
  )
}
PropRadio.propTypes = {
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

export default PropRadio
