/** @jsxImportSource @emotion/react */
import { InputAdornment, TextField } from '@mui/material'
import * as R from 'ramda'
import React from 'react'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import { prettifyValue } from '../../utils'

const getStatusIcon = (color) => {
  const IconClass = R.cond([
    [R.equals('error'), BiError],
    [R.equals('info'), BiInfoCircle],
    [R.equals('success'), BiCheckCircle],
    [R.equals('warning'), BiError],
    [R.equals(R.T), null],
  ])(color)
  return IconClass ? IconClass : null
}

export class TextInput extends React.Component {
  state = { text: this.props.value }

  constructor(props) {
    super(props)
    this.valueStart = props.value
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value)
      this.setState({ text: this.props.value })
  }

  render() {
    const {
      color = 'default',
      enabled,
      help,
      min,
      max,
      number,
      placeholder,
      prettify,
      onClickAway,
      type,
      unit,
    } = this.props

    const handleChange = (event) => {
      number
        ? this.setState({ text: event.target.value.replace(/[^\d.-]/g, '') })
        : this.setState({ text: event.target.value })
    }

    return (
      <TextField
        {...{ placeholder, type }}
        id="standard-basic"
        color={color === 'default' ? 'primary' : color}
        focused={color !== 'default'}
        value={
          number && prettify && this.state.text
            ? `${prettifyValue(Number(this.state.text))}${
                this.state.text.toString().endsWith('.') ? '.' : ''
              }`
            : this.state.text
        }
        onChange={handleChange}
        onBlur={() => {
          if (!enabled) return

          let text = this.state.text
          // If the number is not valid revert to the original value
          if (number && isNaN(text)) {
            text = this.valueStart
            this.setState({ text })
          }

          onClickAway(number ? R.clamp(min, max, Number(text)) : text)
        }}
        helperText={help}
        InputProps={{
          readOnly: !enabled,
          ...(color !== 'default' && {
            endAdornment: (
              <InputAdornment position="end">
                {getStatusIcon(color)}
              </InputAdornment>
            ),
          }),
          ...(unit && {
            startAdornment: (
              <InputAdornment position="start">{unit}</InputAdornment>
            ),
          }),
        }}
        css={{ width: '100%' }}
      />
    )
  }
}
