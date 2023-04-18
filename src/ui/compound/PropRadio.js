import { FormControlLabel, Radio, RadioGroup } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const PropRadio = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const [value] = R.defaultTo(prop.value, currentVal)
  return (
    <RadioGroup sx={[{ pl: 1 }, ...forceArray(sx)]} {...props}>
      {R.values(
        R.mapObjIndexed((val, key) => (
          <FormControlLabel
            key={key}
            disabled={!enabled}
            control={
              <Radio
                value={value}
                name={R.prop('name', val)}
                checked={key === value}
                onChange={() => {
                  if (enabled) onChange([key])
                }}
              />
            }
            label={R.prop('name', val)}
          />
        ))(options)
      )}
    </RadioGroup>
  )
}
PropRadio.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropRadio
