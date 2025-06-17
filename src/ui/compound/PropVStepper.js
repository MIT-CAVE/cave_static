import PropTypes from 'prop-types'

import StepperBase from './StepperBase'

const PropVStepper = ({ prop, currentVal, sx = [], onChange }) => {
  const { options, enabled, propStyle, ...propAttrs } = prop
  const [value] = currentVal ?? prop.value
  return (
    <StepperBase
      isVertical
      disabled={!enabled}
      {...{ options, value, propAttrs, sx, propStyle, onChange }}
    />
  )
}
PropVStepper.propTypes = {
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

export default PropVStepper
