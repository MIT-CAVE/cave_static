import PropTypes from 'prop-types'
import * as R from 'ramda'

import { ValueRange } from './ValueRange'

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

const PropNumberSlider = ({
  prop,
  currentVal,
  prettify,
  onChange,
  ...props
}) => {
  const max = R.propOr(Infinity, 'maxValue', prop)
  const min = R.propOr(-Infinity, 'minValue', prop)
  return (
    <ValueRange
      {...props}
      sx={styles}
      enabled={R.propOr(false, 'enabled', prop)}
      label={R.prop('label', prop)}
      number
      prettify={prettify}
      minValue={min}
      maxValue={max}
      unit={R.prop('unit')(prop)}
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
  prettify: PropTypes.bool,
  onChange: PropTypes.func,
}

export default PropNumberSlider
