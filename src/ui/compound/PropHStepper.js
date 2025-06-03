import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { forceArray } from '../../utils'

const rootStyle = {
  mt: 1,
  mb: 3.5,
  mx: 3,
  width: '100%',
}

const valueToIndex = (val, options) => R.pipe(R.keys, R.indexOf(val))(options)

const PropHStepper = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, options, propStyle } = prop
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
          value: idx,
          label: R.prop('name', val),
        })),
        R.values
      )(options),
    [options]
  )

  const handleChangeComitted = useCallback(
    (event, val) => {
      if (!enabled) return
      onChange([R.pipe(R.keys, R.nth(val))(options)])
    },
    [enabled, onChange, options]
  )

  return (
    <Slider
      disabled={!enabled}
      sx={[rootStyle, ...forceArray(sx), propStyle]}
      min={0}
      max={nOpts - 1}
      step={null}
      track={false}
      valueLabelDisplay="off"
      value={index}
      {...{ marks }}
      onChange={(event, val) => {
        if (enabled) setIndex(val)
      }}
      onChangeCommitted={handleChangeComitted}
    />
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
