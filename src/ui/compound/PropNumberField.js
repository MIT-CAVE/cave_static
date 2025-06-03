import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectNumberFormatPropsFn } from '../../data/selectors'

const PropNumberField = ({ prop, currentVal, sx = [], onChange }) => {
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  const {
    enabled,
    readOnly,
    maxValue = Infinity,
    minValue = -Infinity,
    placeholder,
    label,
    fullWidth,
    slotProps,
  } = prop
  return (
    <NumberInput
      disabled={!enabled}
      {...{ readOnly, placeholder, label, slotProps, sx, fullWidth }}
      min={minValue}
      max={maxValue}
      value={R.pipe(
        R.defaultTo(prop.value),
        R.clamp(minValue, maxValue)
      )(currentVal)}
      numberFormat={numberFormatProps}
      onClickAway={(value) => {
        if (enabled) onChange(value)
      }}
    />
  )
}
PropNumberField.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.number,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropNumberField
