import { Box, Switch, FormGroup, FormControlLabel } from '@mui/material'
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

const PropListToggle = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const value = R.defaultTo(prop.value, currentVal)

  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <FormGroup>
        {R.map(
          ({ id: key, name: label }) => (
            <FormControlLabel
              {...{ key, label }}
              disabled={!enabled}
              control={
                <Switch
                  checked={R.prop(key, value)}
                  onChange={(event) => {
                    if (!enabled) return
                    onChange(R.assoc(key, event.target.checked, value))
                  }}
                />
              }
            />
          ),
          withIndex(options)
        )}
      </FormGroup>
    </Box>
  )
}

PropListToggle.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.object,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropListToggle
