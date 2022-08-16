import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { TextInput } from './TextInput'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '80%',
  minHeight: (theme) => theme.spacing(5),
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropText = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const enabled = prop.enabled || false
  return (
    <Box sx={[getStyles(enabled), forceArray(sx)]} {...props}>
      <TextInput
        {...{ enabled }}
        value={currentVal || prop.value}
        unit={R.prop('unit')(prop)}
        onClickAway={(value) => {
          if (enabled) onChange(value)
        }}
      />
    </Box>
  )
}
PropText.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropText
