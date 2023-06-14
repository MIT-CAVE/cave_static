import { Box, Switch } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropToggle = ({ prop, currentVal, onChange, sx = [], ...props }) => {
  const enabled = prop.enabled || false
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Switch
        checked={R.defaultTo(R.prop('value', prop), currentVal)}
        onChange={(event) => (enabled ? onChange(event.target.checked) : null)}
      />
    </Box>
  )
}
PropToggle.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.bool,
  onChange: PropTypes.func,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropToggle
