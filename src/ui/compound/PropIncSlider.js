import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useMemo, useState } from 'react'

import { forceArray } from '../../utils'

const rootStyle = {
  mt: 2,
  mb: 3.5,
  mx: 3,
  maxWidth: (theme) => `calc(100% - ${theme.spacing(6)})`,
}

const PropIncSlider = ({ prop, sx = [] }) => {
  const { enabled, valueOptions, propStyle } = prop
  const [value, setValue] = useState(prop.value)
  const marks = useMemo(
    () =>
      R.map(
        (x) => ({
          value: x,
          label: valueOptions[x],
        }),
        R.range(0, R.length(valueOptions))
      ),
    [valueOptions]
  )
  return (
    <Slider
      sx={[rootStyle, ...forceArray(sx), ...forceArray(propStyle)]}
      min={0}
      max={R.length(valueOptions) - 1}
      step={null}
      track={false}
      disabled={!enabled}
      valueLabelDisplay="off"
      value={R.indexOf(value)(valueOptions)}
      {...{ marks }}
      onChange={(event, val) => {
        if (enabled) setValue(valueOptions[val])
      }}
    />
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
