import PropTypes from 'prop-types'

import StepperBase from './StepperBase'

const PropHStepper = ({ prop, currentVal, sx = [], onChange }) => {
  const { options, enabled, propStyle, ...propAttrs } = prop
  const [value] = currentVal ?? prop.value
  return (
    <StepperBase
      disabled={!enabled}
      {...{ options, value, propAttrs, sx, propStyle, onChange }}
    />
  )
}
PropHStepper.propTypes = {
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

export default PropHStepper
