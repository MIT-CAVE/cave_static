import { Slider } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'

import OverflowText from './OverflowText'

import { forceArray } from '../../utils'

export const useSizeSlider = (onChangeSize, unit = 'px') => {
  const [sizeSliderProps, setSizeSliderProps] = useState({})

  const handleOpen = useCallback(
    (key, value) => (event) => {
      setSizeSliderProps(
        key === sizeSliderProps.key ? {} : { key, value: [parseInt(value)] }
      )
      event.stopPropagation()
    },
    [sizeSliderProps.key]
  )

  const handleChange = useCallback((event, value) => {
    setSizeSliderProps(R.assoc('value', value))
  }, [])

  const handleChangeComitted = useCallback(
    (event, value, pathTail = sizeSliderProps.key) => {
      onChangeSize(pathTail)(unit ? `${value[0]}${unit}` : value[0])
    },
    [onChangeSize, sizeSliderProps.key, unit]
  )

  const handleClose = useCallback((event) => {
    setSizeSliderProps({})
    event.stopPropagation()
  }, [])

  return {
    sizeSliderProps,
    showSizeSlider: R.isNotEmpty(sizeSliderProps),
    handleOpen,
    handleClose,
    handleChange,
    handleChangeComitted,
  }
}

const SizeSlider = ({
  sizeLabel,
  value,
  unit = 'px',
  min: minValue = 1,
  max: maxValue = 100,
  sx = [],
  onChange,
  onChangeCommitted,
  ...props
}) => {
  const isRange = value.length > 1
  const range = useMemo(
    () => (isRange ? [Math.min(...value), Math.max(...value)] : []),
    [isRange, value]
  )
  const marks = useMemo(
    () => [
      {
        value: value[0],
        label: <OverflowText text={sizeLabel} sx={{ maxWidth: '64px' }} />,
      },
      ...(range[0] > minValue + 15 || (!isRange && value[0] > minValue + 15)
        ? [{ value: minValue, label: `${minValue}${unit ?? ''}` }]
        : []),
      ...(isRange
        ? [
            { value: value[0], label: 'Min' },
            { value: value[value.length - 1], label: 'Max' },
          ]
        : []),
      ...(range[1] < maxValue - 17 || (!isRange && value[0] < maxValue - 17)
        ? [{ value: maxValue, label: `${maxValue}${unit ?? ''}` }]
        : []),
    ],
    [isRange, maxValue, minValue, range, sizeLabel, unit, value]
  )
  return (
    <Slider
      // BUG: For some reason the `sx` prop doesn't work here when used in `CategoricalSizeLegend`
      sx={[
        { mt: 4, width: '85%', alignSelf: 'center', boxSizing: 'border-box' },
        ...forceArray(sx),
      ]}
      min={minValue}
      max={maxValue}
      valueLabelDisplay="on"
      color="warning"
      {...{ value, marks, onChange, onChangeCommitted, ...props }}
      valueLabelFormat={(value) => `${value}${unit ?? ''}`}
    />
  )
}

export default SizeSlider
