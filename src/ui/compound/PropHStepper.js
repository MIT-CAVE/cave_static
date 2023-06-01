import { Box, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

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

const PropHStepper = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const { enabled = false, options } = prop
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  const [value] = R.defaultTo(prop.value, currentVal)
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
        value={R.pipe(R.keys, R.indexOf(value))(options)}
        marks={R.pipe(
          R.addIndex(R.map)((val, idx) => ({
            value: idx,
            label: R.prop('name', val),
          })),
          R.values
        )(options)}
        onChange={(_, val) => {
          if (enabled) onChange([R.pipe(R.keys, R.nth(val))(options)])
        }}
      />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
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
