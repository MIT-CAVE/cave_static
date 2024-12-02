import { Slider } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'

import OverflowText from './OverflowText'

export const useSizeSlider = (onChangeSize) => {
  const [sizeSliderProps, setSizeSliderProps] = useState({})

  const handleOpen = useCallback(
    (key, value) => () => {
      setSizeSliderProps(
        key === sizeSliderProps.key ? {} : { key, value: [parseInt(value)] }
      )
    },
    [sizeSliderProps.key]
  )

  const handleChange = useCallback((event, value) => {
    setSizeSliderProps(R.assoc('value', value))
  }, [])

  const handleChangeComitted = useCallback(
    (event, value, pathTail = sizeSliderProps.key) => {
      // TODO: Revert this when the `pamda.assocPath` issue is resolved
      // onChangeSize(pathTail)(`${value[0]}px`)
      onChangeSize(pathTail)(value)
    },
    [onChangeSize, sizeSliderProps.key]
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

const SizeSlider = ({ sizeLabel, value, onChange, onChangeCommitted }) => {
  const isRange = value.length > 1
  const [minValue, maxValue] = useMemo(
    () => (isRange ? [Math.min(...value), Math.max(...value)] : []),
    [isRange, value]
  )
  const marks = useMemo(
    () => [
      {
        value: value[0],
        label: <OverflowText text={sizeLabel} sx={{ maxWidth: '64px' }} />,
      },
      ...(minValue > 16 || (!isRange && value[0] > 16)
        ? [{ value: 1, label: '1px' }]
        : []),
      ...(isRange
        ? [
            { value: value[0], label: 'Min' },
            { value: value[value.length - 1], label: 'Max' },
          ]
        : []),
      ...(maxValue < 83 || (!isRange && value[0] < 83)
        ? [{ value: 100, label: '100px' }]
        : []),
    ],
    [isRange, maxValue, minValue, sizeLabel, value]
  )
  return (
    <Slider
      style={{
        // BUG: For some reason the `sx` prop doesn't work here for `mt` and `mb`
        marginTop: '40px',
        marginBottom: '32px',
        width: '85%',
        alignSelf: 'center',
        boxSizing: 'border-box',
      }}
      min={1}
      max={100}
      valueLabelDisplay="on"
      color="warning"
      {...{ value, marks, onChange, onChangeCommitted }}
      valueLabelFormat={(value) => `${value}px`}
    />
  )
}

export default SizeSlider
