import { Box, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import NumberInput from './NumberInput'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '100%',
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropLatLngInput = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatProps = {
    precision: 6,
    trailingZeros: true,
    unitPlacement: 'afterWithSpace',
  }
  const enabled = prop.enabled || false
  const value = R.defaultTo(R.prop('value', prop), currentVal)

  return (
    <>
      <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
        <Typography> Latitude </Typography>
        <NumberInput
          {...{ enabled, max: 90, min: -90 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-90, 90, value[1])}
          onClickAway={(lat) => {
            if (enabled) onChange([value[0], lat])
          }}
        />
      </Box>
      <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
        <Typography> Longitude </Typography>
        <NumberInput
          {...{ enabled, max: 180, min: -180 }}
          numberFormat={numberFormatProps}
          value={R.clamp(-180, 180, value[0])}
          onClickAway={(lng) => {
            if (enabled) onChange([lng, value[1]])
          }}
        />
      </Box>
    </>
  )
}
PropLatLngInput.propTypes = {
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

export default PropLatLngInput
