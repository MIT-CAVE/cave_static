import { Box, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const getStyles = (enabled, nOpts) => ({
  box: {
    display: 'flex',
    width: '100%',
    height: R.inc(nOpts) * 25,
    p: 1,
    pointerEvents: enabled ? '' : 'none',
    opacity: enabled ? '' : 0.7,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slider: {
    height: nOpts * 25,
  },
})

const PropVStepper = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const [value] = R.defaultTo(prop.value, currentVal)

  const nOpts = R.pipe(R.keys, R.length)(options)
  return (
    <Box sx={[getStyles(enabled, nOpts).box, ...forceArray(sx)]} {...props}>
      <Slider
        style={getStyles(enabled, nOpts).slider}
        min={0}
        max={R.dec(nOpts)}
        step={null}
        track={false}
        orientation="vertical"
        disabled={!enabled}
        valueLabelDisplay="off"
        value={R.pipe(R.keys, R.reverse, R.indexOf(value))(options)}
        marks={R.pipe(
          R.addIndex(R.map)((val, idx) => ({
            value: R.dec(nOpts - idx),
            label: R.prop('name', val),
          })),
          R.values
        )(options)}
        onChange={(_, val) => {
          if (enabled)
            onChange([R.pipe(R.keys, R.reverse, R.nth(val))(options)])
        }}
      />
    </Box>
  )
}
PropVStepper.propTypes = {
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

export default PropVStepper
