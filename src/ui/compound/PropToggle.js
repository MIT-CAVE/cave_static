import { Box, Divider, Switch } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropToggle = ({ prop, currentVal, onChange, sx = [], ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const enabled = prop.enabled || false
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <Switch
        checked={R.defaultTo(R.prop('value', prop), currentVal)}
        onChange={(event) => (enabled ? onChange(event.target.checked) : null)}
      />
      <Divider orientation="vertical" flexItem />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
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
