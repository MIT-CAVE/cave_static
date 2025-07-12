import PropTypes from 'prop-types'

import CheckboxBase from './CheckboxBase'

import { forceArray } from '../../utils'

const PropCheckbox = ({
  prop: {
    value,
    options,
    enabled,
    labelPlacement = 'end',
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
    disabled={!enabled}
    value={currentVal ?? value}
    sx={[...forceArray(sx), fullWidth && { width: '100%' }, propStyle]}
    {...{ options, labelPlacement, helperText, propAttrs, onChange }}
  />
)

PropCheckbox.propTypes = {
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

export default PropCheckbox
