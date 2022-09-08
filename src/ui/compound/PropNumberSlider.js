import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { ValueRange } from './ValueRange'

import { selectNumberFormat } from '../../data/selectors'

const styles = (theme) => ({
  pt: 3,
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

const PropNumberSlider = ({ prop, currentVal, onChange, ...props }) => {
  const max = R.propOr(Infinity, 'maxValue', prop)
  const min = R.propOr(-Infinity, 'minValue', prop)
  const {
    numberFormat: numberFormatRaw = {},
    // NOTE: The `unit` prop is deprecated in favor of
    // `numberFormat.unit` and will be removed on 1.0.0
    unit: deprecatUnit,
  } = prop
  const numberFormatDefault = useSelector(selectNumberFormat)
  // TODO: Pass `numberFormat` to `ValueRange` after this component is refactored
  const numberFormat = useMemo(
    () =>
      R.pipe(
        R.mergeRight(numberFormatDefault),
        R.when(R.pipe(R.prop('unit'), R.isNil), R.assoc('unit', deprecatUnit))
      )(numberFormatRaw),
    [deprecatUnit, numberFormatDefault, numberFormatRaw]
  )

  return (
    <ValueRange
      {...props}
      sx={styles}
      enabled={R.propOr(false, 'enabled', prop)}
      label={R.prop('label', prop)}
      number
      minValue={min}
      maxValue={max}
      unit={numberFormat.unit || deprecatUnit}
      valueStart={R.clamp(
        min,
        max,
        R.defaultTo(R.prop('value', prop), currentVal)
      )}
      onClickAwayHandler={(value) => {
        const constrainedVal =
          R.prop('constraint', prop) === 'int' ? Math.trunc(value) : value
        if (R.propOr(false, 'enabled', prop)) onChange(constrainedVal)
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
