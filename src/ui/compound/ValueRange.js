/** @jsxImportSource @emotion/react */
import { Grid, Input, Slider } from '@mui/material'
import * as R from 'ramda'
import React from 'react'

import { getSliderMarks, formatNumber } from '../../utils'

// TODO: Convert to a functional component

export class ValueRange extends React.Component {
  state = {
    min: this.props.minValue,
    max:
      this.props.maxValue === this.props.minValue
        ? this.props.maxValue + 0.0000001
        : this.props.maxValue,
    valueCurrent: this.props.valueStart,
    roundValue: false,
  }

  componentDidUpdate(prevProps) {
    if (this.props !== prevProps) {
      this.setState({
        min: this.props.minValue,
        max:
          this.props.maxValue === this.props.minValue
            ? this.props.maxValue + 0.0000001
            : this.props.maxValue,
        valueCurrent: this.props.valueStart,
        roundValue: false,
      })
    }
  }

  render() {
    const {
      classes,
      onClickAwayHandler,
      enabled,
      help,
      valueStart,
      numberFormat,
      ...props
    } = this.props
    const step = (this.state.max - this.state.min) / 100

    const handleChange = (value, isInput = false) => {
      isInput
        ? this.setState({ valueCurrent: value })
        : this.setState({ valueCurrent: value, roundValue: true })
    }

    const getLabelFormat = (value) =>
      `${formatNumber(Number(value), {
        precision: this.state.roundValue ? numberFormat.precision : 0,
      })}`

    return (
      <>
        {R.isNotNil(help) ? (
          <div
            css={{
              position: 'absolute',
            }}
          >
            {help}
          </div>
        ) : (
          ''
        )}
        <Grid
          container
          spacing={2}
          alignItems="center"
          {...R.omit(['minValue', 'maxValue', 'number'], props)}
        >
          <Grid item xs css={{ margin: '0 16px' }}>
            <Slider
              track={false}
              classes={classes}
              disabled={!enabled}
              valueLabelDisplay="auto"
              valueLabelFormat={getLabelFormat}
              min={this.state.min}
              max={this.state.max}
              step={step}
              value={this.state.valueCurrent}
              marks={getSliderMarks(
                this.state.min,
                this.state.max,
                2,
                getLabelFormat
              )}
              onChange={(event, value) => {
                this.setState({ valueCurrent: value })
              }}
              onChangeCommitted={() => {
                onClickAwayHandler(
                  Math.round(this.state.valueCurrent * 10000) / 10000
                )
              }}
            />
          </Grid>
          <Grid
            item
            css={{ display: 'flex', flexDirection: 'column', margin: '0 16px' }}
          >
            <Input
              disabled={!enabled}
              sx={{
                '>:first-child': {
                  textAlign: 'center',
                  ml: 1.5,
                },
              }} // FIXME: Use MUI styles
              value={formatNumber(
                this.state.valueCurrent,
                R.dissoc('unit')(numberFormat)
              )}
              onChange={(event) => {
                const value = event.target.value.replace(/[^\d.-]/g, '')
                this.setState({
                  valueCurrent: value,
                })
              }}
              onBlur={() => {
                if (!enabled) return

                let value = this.state.valueCurrent
                if (Object.is(value, -0)) this.setState({ valueCurrent: 0 })
                // If the number is not valid revert to the original value
                if (isNaN(value)) this.setState({ valueCurrent: valueStart })

                value = this.state.valueCurrent
                handleChange(Number(value), true)
                onClickAwayHandler(
                  R.clamp(this.state.min, this.state.max, Number(value))
                )
              }}
              inputProps={{
                step: parseInt(step * 10),
                min: this.state.min,
                max: this.state.max,
                type: 'number',
              }}
            />
            <div css={{ marginTop: '4px', textAlign: 'center' }}>
              {numberFormat.unit}
            </div>
          </Grid>
        </Grid>
      </>
    )
  }
}
