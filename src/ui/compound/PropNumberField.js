import PropTypes from 'prop-types'
import { useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { selectNumberFormatPropsFn } from '../../data/selectors'
import NumberField from '../prototypes/NumberField'

import { forceArray } from '../../utils'

const PropNumberField = ({ prop, currentVal, sx = [], onChange }) => {
  const [value, setValue] = useState(currentVal ?? prop.value)
  const lastSentRef = useRef(currentVal ?? prop.value)
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  const {
    enabled,
    readOnly,
    maxValue = Infinity,
    minValue = -Infinity,
    placeholder,
    label,
    marqueeLabel,
    fullWidth,
    spinner,
    step,
    smallStep,
    largeStep,
    hideKeyboardToggle,
    propStyle,
    slotProps,
  } = prop

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  // Keep our "last sent" marker aligned with the server-authoritative value so
  // external updates don't get re-sent on the next blur.
  useEffect(() => {
    const value = currentVal ?? prop.value
    setValue(value)
    lastSentRef.current = value
  }, [currentVal, prop.value])

  const handleChangeCommitted = (event, newValue) => {
    // Base UI can emit `onValueCommitted` more than once per user commit
    // (e.g. format-on-blur after a synthetic input dispatch). Skipping repeats
    // prevents back-to-back `sendCommand`s from racing with stale `versions`,
    // which is how the server reports an out-of-sync error.
    if (newValue === lastSentRef.current) return
    lastSentRef.current = newValue
    onChange(newValue)
  }

  return (
    <NumberField
      disabled={!enabled}
      {...{
        readOnly,
        placeholder,
        label,
        fullWidth,
        value,
        spinner,
        marqueeLabel,
        step,
        smallStep,
        largeStep,
        hideKeyboardToggle,
        slotProps,
      }}
      sx={[...forceArray(sx), ...forceArray(propStyle)]}
      min={minValue}
      max={maxValue}
      numberFormat={numberFormatProps}
      onChange={handleChange}
      onChangeCommitted={handleChangeCommitted}
    />
  )
}
PropNumberField.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.number,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropNumberField
