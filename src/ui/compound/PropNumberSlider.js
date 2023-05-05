import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { ValueRange } from './ValueRange'

import { selectNumberFormat } from '../../data/selectors'

const styles = (theme) => ({
  pt: 1,
  '& .MuiSlider-rail': {
    height: theme.spacing(0.5),
    borderRadius: 'shape.borderRadius',
  },
  '& .MuiSlider-thumb': {
    height: theme.spacing(3),
    width: theme.spacing(3),
  },
  '& .MuiSlider-track': {
    height: theme.spacing(0.5),
    borderRadius: 'shape.borderRadius',
  },
})

const PropNumberSlider = ({ prop, currentVal, onChange }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const enabled = prop.enabled || false
  const min = R.propOr(-Infinity, 'minValue', prop)
  const max = R.propOr(Infinity, 'maxValue', prop)
  const numberFormatRaw = prop.numberFormat || {}
  const numberFormat = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <ValueRange
      {...{ enabled, numberFormat }}
      sliderProps={{ sx: styles }}
      minValue={min}
      maxValue={max}
      valueStart={R.clamp(
        min,
        max,
        R.defaultTo(R.prop('value', prop), currentVal)
      )}
      onClickAwayHandler={(value) => {
        if (enabled) onChange(value)
      }}
    />
  )
}
PropNumberSlider.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.number,
  onChange: PropTypes.func,
}

export default PropNumberSlider
