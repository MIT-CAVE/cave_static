import { Box, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

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

const PropIncSlider = ({ prop, sx = [], ...props }) => {
  const { enabled = false, options } = prop
  const [value, setValue] = useState(prop.value)
  const marks = R.map(
    (x) => ({
      value: x,
      label: options[x],
    }),
    R.range(0, R.length(options))
  )
  return (
    <Box sx={[getStyles(enabled).box, ...forceArray(sx)]} {...props}>
      <Slider
        style={getStyles(enabled).slider}
        min={0}
        max={R.length(options) - 1}
        step={null}
        track={false}
        disabled={!enabled}
        valueLabelDisplay="off"
        value={R.indexOf(value, options)}
        marks={marks}
        onChange={(_, val) => {
          if (enabled) setValue(options[val])
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
