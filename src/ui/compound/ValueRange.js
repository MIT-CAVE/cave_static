import { Grid, Input, Slider } from '@mui/material'
import * as R from 'ramda'
import { useEffect, useState } from 'react'

import { NumberFormat, getSliderMarks } from '../../utils'

const styles = {
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '50%',
    mx: 1,
  },
  input: {
    '.MuiInput-input': {
      textAlign: 'center',
      ml: 1.5,
    },
  },
}

const adjustRangeMax = ([min, max], delta = 1) =>
  min === max ? min + delta : max

export const ValueRange = ({
  enabled,
  valueStart,
  minValue,
  maxValue,
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  numberFormat: { unit, unitPlacement, ...numberFormat },
  sliderProps,
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

  const step = (max - min) / 100

  const getLabelFormat = (value) =>
    NumberFormat.format(value, {
      ...numberFormat,
      trailingZeros: false,
    })
  return (
    <Grid container spacing={2} alignItems="center">
      <Grid item xs sx={{ mx: 2 }}>
        <Slider
          {...{ max, min, step }}
          track={false}
          disabled={!enabled}
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
          {...sliderProps}
        />
      </Grid>
      <Grid container item xs sx={styles.inputWrapper}>
        <Input
          disabled={!enabled}
          sx={styles.input}
          value={valueCurrent}
          onChange={(event) => {
            setValueCurrent(event.target.value)
          }}
          onBlur={() => {
            if (!enabled) return

            let value = valueCurrent
            if (Object.is(value, -0)) setValueCurrent(0)
            // If the number is not valid revert to the original value
            if (isNaN(value)) setValueCurrent(valueStart)

            value = Number(valueCurrent)
            setValueCurrent(value)
            onClickAwayHandler(R.clamp(min, max, value))
          }}
          inputProps={{
            step: step * 10,
            min,
            max: NumberFormat.format(max, numberFormat),
            type: 'number',
          }}
        />
      </Grid>
    </Grid>
  )
}
