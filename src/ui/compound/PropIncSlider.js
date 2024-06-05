import { Box, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useEffect, useState } from 'react'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  box: {
    display: 'flex',
    width: '100%',
    p: 1,
    pointerEvents: enabled ? '' : 'none',
    opacity: enabled ? '' : 0.7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slider: {
    width: '80%',
  },
})

// const valueToIndex = (val, min, step) => (val - min) / step
const PropIncSlider = ({ prop, sx = [], ...props }) => {
  const { enabled = false } = prop
  const [value, setValue] = useState(prop.value)
  const min = R.propOr(-Infinity, 'minValue', prop)
  const max = R.propOr(Infinity, 'maxValue', prop)
  const step = prop['stepValue']
  const IndexToValue = (ind) => ind * step + min
  const options = R.map(IndexToValue, R.range(0, (max - min) / step + 1))
  useEffect(() => {
    setValue(value)
  }, [value, options])

  return (
    <Box sx={[getStyles(enabled).box, ...forceArray(sx)]} {...props}>
      <Slider
        style={getStyles(enabled).slider}
        min={0}
        max={max}
        step={step}
        track={false}
        disabled={!enabled}
        valueLabelDisplay="off"
        value={value}
        marks={R.map((x) => ({ value: x, label: x }), options)}
        onChange={(_, val) => {
          if (enabled) setValue(val)
        }}
      />
    </Box>
  )
}
PropIncSlider.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropIncSlider
