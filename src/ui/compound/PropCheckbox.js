import { Checkbox, FormGroup, FormControlLabel } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { customSort } from '../../utils'

const PropCheckbox = ({ prop, currentVal, onChange, ...props }) => {
  const { enabled = false, options } = prop
  const value = currentVal || prop.value
  return (
    <FormGroup {...props}>
      {R.map(({ id: key, name: label }) => (
        <FormControlLabel
          {...{ key, label }}
          disabled={!enabled}
          sx={{ pl: 1 }}
          control={
            <Checkbox
              checked={R.includes(key)(value)}
              onClick={() => {
                if (!enabled) return
                onChange(
                  R.ifElse(
                    R.includes(key),
                    R.without([key]),
                    R.append(key)
                  )(value)
                )
              }}
            />
          }
        />
      ))(customSort(options))}
    </FormGroup>
  )
}
PropCheckbox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.oneOfType(
    PropTypes.string,
    PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
      })
    )
  ),
  onChange: PropTypes.func,
}

export default PropCheckbox
