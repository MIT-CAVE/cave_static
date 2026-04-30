import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState, useEffect } from 'react'

import NumberField from '../prototypes/NumberField'

import { forceArray } from '../../utils'

const PropLatLngInput = ({ prop, currentVal, sx = [], onChange }) => {
  const defaultValue = currentVal ?? prop.value
  const [value, setValue] = useState(defaultValue[0])

  useEffect(() => {
    setValue((currentVal ?? prop.value)[0])
  }, [currentVal, prop.value])

  const { enabled, placeholder, direction = 'row' } = prop
  const numberFormatProps = {
    precision: 6,
    trailingZeros: true,
    unitPlacement: 'afterWithSpace',
  }

  const handleChangeAt = (index) => (event, newLatOrLng) => {
    setValue(R.update(index, newLatOrLng))
  }

  const handleChangeCommittedAt = (index) => (event, newLatOrLng) => {
    if (!enabled) return
    onChange([R.update(index, newLatOrLng)(value)])
  }

  return (
    <Stack
      useFlexGap
      {...{ direction }}
      spacing={direction === 'row' ? 1 : 2}
      sx={[{ width: '100%' }, ...forceArray(sx)]}
    >
      <NumberField
        disabled={!enabled}
        label="Latitude"
        {...{ placeholder, max: 90, min: -90 }}
        numberFormat={numberFormatProps}
        value={R.clamp(-90, 90)(value[1])}
        onChange={handleChangeAt(1)}
        onChangeCommitted={handleChangeCommittedAt(1)}
      />
      <NumberField
        disabled={!enabled}
        label="Longitude"
        {...{ placeholder, max: 180, min: -180 }}
        numberFormat={numberFormatProps}
        value={R.clamp(-180, 180)(value[0])}
        onChange={handleChangeAt(0)}
        onChangeCommitted={handleChangeCommittedAt(0)}
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
