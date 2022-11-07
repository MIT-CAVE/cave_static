import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '80%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropNumberField = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const max = R.propOr(Infinity, 'maxValue', prop)
  const min = R.propOr(-Infinity, 'minValue', prop)
  const enabled = prop.enabled || false
  const numberFormatRaw = prop.numberFormat || {}
  const numberFormat = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <NumberInput
        {...{ enabled, max, min, numberFormat }}
        value={R.clamp(min, max, currentVal || prop.value)}
        onClickAway={(value) => {
          const constrainedVal =
            R.prop('constraint', prop) === 'int' ? Math.trunc(value) : value
          if (enabled) onChange(constrainedVal)
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
