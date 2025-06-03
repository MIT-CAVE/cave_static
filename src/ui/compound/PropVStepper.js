import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useEffect, useMemo, useState } from 'react'

import { forceArray } from '../../utils'

const getRootStyle = (nOpts) => ({
  height: nOpts * 25,
  my: 3,
  mx: 1,
})

const valueToIndex = (val, options) =>
  R.pipe(R.keys, R.reverse, R.indexOf(val))(options)

const PropVStepper = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, options } = prop
  const [value] = R.defaultTo(prop.value)(currentVal)
  const [index, setIndex] = useState(valueToIndex(value, options))

  useEffect(() => {
    setIndex(valueToIndex(value, options))
  }, [value, options])

  const nOpts = useMemo(() => R.pipe(R.keys, R.length)(options), [options])
  const marks = useMemo(
    () =>
      R.pipe(
        R.addIndex(R.map)((val, idx) => ({
          value: R.dec(nOpts - idx),
          label: R.prop('name', val),
        })),
        R.values
      )(options),
    [nOpts, options]
  )
  return (
    <Slider
      disabled={!enabled}
      orientation="vertical"
      valueLabelDisplay="off"
      sx={[getRootStyle(nOpts), ...forceArray(sx)]}
      min={0}
      max={R.dec(nOpts)}
      step={null}
      track={false}
      value={index}
      {...{ marks }}
      onChange={(event, val) => {
        if (enabled) setIndex(val)
      }}
      onChangeCommitted={(event, val) => {
        if (!enabled) return
        onChange([R.pipe(R.keys, R.reverse, R.nth(val))(options)])
      }}
    />
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
