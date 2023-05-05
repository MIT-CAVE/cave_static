import { Box, Grid, Input, Slider } from '@mui/material'
import * as R from 'ramda'
import { useEffect, useState } from 'react'

import { getSliderMarks, formatNumber, unitStyles } from '../../utils'

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
  unit: {
    ...unitStyles,
    width: 'fit-content',
    mt: 0.5,
    ml: 0,
    textAlign: 'center',
    alignSelf: 'center',
  },
}

const adjustRangeMax = ([min, max], delta = 1) =>
  min === max ? min + delta : max

export const ValueRange = ({
  enabled,
  valueStart,
  minValue,
  maxValue,
  numberFormat,
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
    formatNumber(value, {
      ...R.dissoc('unit')(numberFormat),
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
            max: formatNumber(max, R.dissoc('unit')(numberFormat)),
            type: 'number',
          }}
        />
        {numberFormat.unit && <Box sx={styles.unit}>{numberFormat.unit}</Box>}
      </Grid>
    </Grid>
  )
}
