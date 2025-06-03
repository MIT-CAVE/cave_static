import PropTypes from 'prop-types'

import CheckboxBase from './CheckboxBase'

import { forceArray } from '../../utils'

const PropHCheckbox = ({
  prop: {
    value,
    options,
    enabled,
    labelPlacement = 'bottom',
    helperText,
    fullWidth,
    propStyle,
    ...propAttrs
  },
  currentVal,
  sx = [],
  onChange,
}) => (
  <CheckboxBase
    isHorizontal
    disabled={!enabled}
    sx={[...forceArray(sx), fullWidth && { width: '100%' }, propStyle]}
    value={currentVal ?? value}
    {...{ options, labelPlacement, helperText, propAttrs, onChange }}
  />
)
PropHCheckbox.propTypes = {
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

export default PropHCheckbox
