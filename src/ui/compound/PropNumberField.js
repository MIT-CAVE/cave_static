import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '100%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropNumberField = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  const {
    enabled = false,
    maxValue = Infinity,
    minValue = -Infinity,
    placeholder,
    label,
  } = prop
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <NumberInput
        {...{ enabled, placeholder, label }}
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
    </Box>
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
