import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import NumberInput from './NumberInput'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '80%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropNumberField = ({
  prop,
  currentVal,
  formatWhenTyping,
  sx = [],
  onChange,
  ...props
}) => {
  const max = R.propOr(Infinity, 'maxValue', prop)
  const min = R.propOr(-Infinity, 'minValue', prop)
  const enabled = prop.enabled || false
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <NumberInput
        {...{ enabled, max, min, formatWhenTyping }}
        value={R.clamp(min, max, currentVal || prop.value)}
        unit={R.prop('unit')(prop)}
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
  formatWhenTyping: PropTypes.bool,
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
