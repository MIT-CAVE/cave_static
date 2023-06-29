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

const valueToIndex = (val, options) => R.pipe(R.keys, R.indexOf(val))(options)

const PropHStepper = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const [value] = R.defaultTo(prop.value, currentVal)
  const [index, setIndex] = useState(valueToIndex(value, options))

  useEffect(() => {
    setIndex(valueToIndex(value, options))
  }, [value, options])

  return (
    <Box sx={[getStyles(enabled).box, ...forceArray(sx)]} {...props}>
      <Slider
        style={getStyles(enabled).slider}
        min={0}
        max={R.pipe(R.keys, R.length, R.dec)(options)}
        step={null}
        track={false}
        disabled={!enabled}
        valueLabelDisplay="off"
        value={index}
        marks={R.pipe(
          R.addIndex(R.map)((val, idx) => ({
            value: idx,
            label: R.prop('name', val),
          })),
          R.values
        )(options)}
        onChange={(_, val) => {
          if (enabled) setIndex(val)
        }}
        onChangeCommitted={(_, val) => {
          if (enabled) onChange([R.pipe(R.keys, R.nth(val))(options)])
        }}
      />
    </Box>
  )
}
PropHStepper.propTypes = {
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

export default PropHStepper
