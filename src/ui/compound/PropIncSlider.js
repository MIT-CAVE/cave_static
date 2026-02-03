import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { forceArray } from '../../utils'

const rootStyle = {
  mt: 2,
  mb: 3.5,
  mx: 3,
  maxWidth: (theme) => `calc(100% - ${theme.spacing(6)})`,
}

const PropIncSlider = ({ prop, currentVal, sx = [], onChange }) => {
  const [index, setIndex] = useState(null)
  const { valueOptions, propStyle } = prop

  const disabled = !prop.enabled
  const value = currentVal ?? prop.value

  useEffect(() => {
    setIndex(R.indexOf(value)(valueOptions))
  }, [value, valueOptions])

  const marks = useMemo(
    () =>
      R.addIndex(R.map)((val, idx) => ({
        value: idx,
        label: val,
      }))(valueOptions),
    [valueOptions]
  )

  const handleChange = useCallback(
    (event, newIndex) => {
      if (disabled) return
      setIndex(newIndex)
    },
    [disabled]
  )

  const handleChangeComitted = useCallback(
    (event, newIndex) => {
      if (disabled) return
      onChange(valueOptions[newIndex])
    },
    [disabled, onChange, valueOptions]
  )

  return (
    <Slider
      {...{ disabled, marks }}
      sx={[rootStyle, ...forceArray(sx), ...forceArray(propStyle)]}
      min={0}
      max={valueOptions.length - 1}
      step={null}
      track={false}
      valueLabelDisplay="off"
      value={index}
      onChange={handleChange}
      onChangeCommitted={handleChangeComitted}
    />
  )
}
PropIncSlider.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.number,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropIncSlider
