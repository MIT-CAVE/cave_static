import { Grid, Slider } from '@mui/material'
import { useEffect, useState } from 'react'

import NumberInput from './NumberInput'

import { NumberFormat, getSliderMarks } from '../../utils'

const getStyles = (disabled) => ({
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '50%',
  mx: 1,
  pointerEvents: disabled ? 'none' : '',
  opacity: disabled ? 0.7 : '',
})

const adjustRangeMax = ([min, max], delta = 1) =>
  min === max ? min + delta : max

export const ValueRange = ({
  disabled,
  valueStart,
  minValue,
  maxValue,
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  numberFormat: { unit, unitPlacement, ...numberFormat },
  slotProps,
  onClickAwayHandler,
}) => {
  const [min, setMin] = useState(minValue)
  const [max, setMax] = useState(adjustRangeMax([minValue, maxValue]))
  const [valueCurrent, setValueCurrent] = useState(valueStart)

  useEffect(() => {
    setMin(minValue)
    setMax(adjustRangeMax([minValue, maxValue]))
    setValueCurrent(valueStart)
  }, [minValue, maxValue, valueStart])

  const step = 1 / Math.pow(10, numberFormat.precision)
  const getLabelFormat = (value) =>
    NumberFormat.format(value, {
      ...numberFormat,
      trailingZeros: false,
    })

  return (
    <Grid container spacing={2} sx={{ alignItems: 'center' }}>
      <Grid sx={{ mx: 2 }} size="grow">
        <Slider
          {...{ disabled, max, min, step }}
          track={false}
          valueLabelDisplay="auto"
          valueLabelFormat={getLabelFormat}
          value={valueCurrent}
          marks={getSliderMarks(min, max, 2, getLabelFormat)}
          onChange={(event, value) => {
            setValueCurrent(value)
          }}
          onChangeCommitted={() => {
            onClickAwayHandler(Math.round(valueCurrent * 10000) / 10000)
          }}
          {...slotProps?.slider}
        />
      </Grid>
      <Grid container sx={getStyles(disabled)} size="grow">
        <NumberInput
          {...{ disabled, max, min, numberFormat, slotProps }}
          value={valueCurrent}
          onClickAway={onClickAwayHandler}
        />
      </Grid>
    </Grid>
  )
}
