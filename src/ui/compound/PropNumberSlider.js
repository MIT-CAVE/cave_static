import { Stack, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import NumberInput from './NumberInput'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { forceArray, getSliderMarks, NumberFormat } from '../../utils'

const styles = {
  root: { alignItems: 'center' },
  slider: {
    mx: '27px',
    mb: 1,
    py: 1.5,
    '& .MuiSlider-rail': {
      height: '4px',
      borderRadius: 'shape.borderRadius',
    },
    '& .MuiSlider-thumb': {
      height: '24px',
      width: '24px',
    },
    '& .MuiSlider-track': {
      height: '4px',
      borderRadius: 'shape.borderRadius',
    },
  },
}

const PropNumberSlider = ({ prop, currentVal, sx = [], onChange }) => {
  const [value, setValue] = useState(null)
  const selectNumberFormatProps = useSelector(selectNumberFormatPropsFn)
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  const { unit, unitPlacement, ...numberFormat } = selectNumberFormatProps(prop)

  const { enabled, slotProps = {}, fullWidth = true, propStyle } = prop

  const minValue = prop.minValue ?? -Infinity
  const maxValue = useMemo(() => {
    const rawMaxValue = prop.maxValue ?? Infinity
    return minValue === rawMaxValue ? minValue + 1 : rawMaxValue
  }, [minValue, prop.maxValue])

  useEffect(() => {
    setValue(R.defaultTo(prop.value)(currentVal))
  }, [currentVal, prop.value])

  const getLabelFormat = useCallback(
    (sliderValue) =>
      NumberFormat.format(sliderValue, {
        ...numberFormat,
        trailingZeros: false,
      }),
    [numberFormat]
  )

  const marks = useMemo(
    () => getSliderMarks(minValue, maxValue, 2, getLabelFormat),
    [getLabelFormat, maxValue, minValue]
  )

  const handleChange = useCallback(
    (newValue) => {
      if (!enabled) return
      onChange(newValue)
    },
    [enabled, onChange]
  )

  const step = useMemo(
    () => 1 / Math.pow(10, numberFormat.precision),
    [numberFormat.precision]
  )

  return (
    <Stack
      useFlexGap
      direction="row"
      spacing={1}
      sx={[
        styles.root,
        ...forceArray(sx),
        fullWidth && { width: '100%' },
        ...forceArray(propStyle),
      ]}
    >
      <Slider
        disabled={!enabled}
        min={minValue}
        max={maxValue}
        track={false}
        valueLabelDisplay="auto"
        valueLabelFormat={getLabelFormat}
        {...{ marks, step, value, ...slotProps.slider }}
        sx={[styles.slider, ...forceArray(slotProps.slider?.sx)]}
        onChange={(event, newValue) => {
          setValue(newValue)
        }}
        onChangeCommitted={(event, newValue) => {
          handleChange(newValue)
        }}
      />

      <NumberInput
        sx={{ maxWidth: '50%' }}
        disabled={!enabled}
        min={minValue}
        max={maxValue}
        {...{ value, numberFormat, slotProps }}
        onClickAway={handleChange}
      />
    </Stack>
  )
}
PropNumberSlider.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.number,
  onChange: PropTypes.func,
}

export default PropNumberSlider
