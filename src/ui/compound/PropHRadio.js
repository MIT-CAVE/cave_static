import PropTypes from 'prop-types'

import RadioBase from './RadioBase'

import { forceArray } from '../../utils'

const PropHRadio = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    options,
    enabled,
    labelPlacement = 'bottom',
    helperText,
    fullWidth,
    propStyle,
    ...propAttrs
  } = prop
  const [value] = currentVal ?? prop.value
  return (
    <RadioBase
      isHorizontal
      disabled={!enabled}
      sx={[...forceArray(sx), fullWidth && { width: '100%' }, propStyle]}
      {...{ options, value, labelPlacement, helperText, propAttrs, onChange }}
    />
  )
}
PropHRadio.propTypes = {
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

export default PropHRadio
