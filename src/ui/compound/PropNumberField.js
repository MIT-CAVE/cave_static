import PropTypes from 'prop-types'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import { selectNumberFormatPropsFn } from '../../data/selectors'
import NumberField from '../prototypes/NumberField'

import { forceArray } from '../../utils'

const PropNumberField = ({ prop, currentVal, sx = [], onChange }) => {
  const [value, setValue] = useState(currentVal ?? prop.value)
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  const {
    enabled,
    readOnly,
    maxValue = Infinity,
    minValue = -Infinity,
    placeholder,
    label,
    fullWidth,
    spinner,
    propStyle,
    slotProps,
  } = prop

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  const handleChangeCommitted = (event, newValue) => {
    onChange(newValue)
  }

  return (
    <NumberField
      disabled={!enabled}
      {...{
        readOnly,
        placeholder,
        label,
        slotProps,
        fullWidth,
        value,
        spinner,
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
