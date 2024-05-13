import { Checkbox, FormGroup, FormControlLabel, Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { withIndex, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropCheckbox = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const value = R.defaultTo(prop.value, currentVal)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <FormGroup>
        {R.map(({ id: key, name: label }) => (
          <FormControlLabel
            key={key}
            {...{ label }}
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
        ))(withIndex(options))}
      </FormGroup>
    </Box>
  )
}
PropCheckbox.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropCheckbox
