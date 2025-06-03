import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import NumberInput from './NumberInput'

import { forceArray } from '../../utils'

const PropLatLngInput = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, placeholder, direction = 'row' } = prop
  const value = R.defaultTo(prop.value, currentVal)[0]
  const numberFormatProps = {
    precision: 6,
    trailingZeros: true,
    unitPlacement: 'afterWithSpace',
  }
  return (
    <Stack
      useFlexGap
      {...{ direction }}
      spacing={direction === 'row' ? 1 : 2}
      sx={[{ width: '100%' }, ...forceArray(sx)]}
    >
      <NumberInput
        disabled={!enabled}
        label="Latitude"
        {...{ placeholder, max: 90, min: -90 }}
        numberFormat={numberFormatProps}
        value={R.clamp(-90, 90)(value[1])}
        onClickAway={(lat) => {
          if (enabled) onChange([[value[0], lat]])
        }}
      />
      <NumberInput
        disabled={!enabled}
        label="Longitude"
        {...{ placeholder, max: 180, min: -180 }}
        numberFormat={numberFormatProps}
        value={R.clamp(-180, 180)(value[0])}
        onClickAway={(lng) => {
          if (enabled) onChange([[lng, value[1]]])
        }}
      />
    </Stack>
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
