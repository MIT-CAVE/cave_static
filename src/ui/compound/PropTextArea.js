import { Box } from '@mui/material'
import PropTypes from 'prop-types'

import TextInput from './TextInput'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  p: 1,
  width: '80%',
  minHeight: (theme) => theme.spacing(5),
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropTextArea = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, minRows = 2, maxRows = 6 } = prop
  return (
    <Box sx={[getStyles(enabled), forceArray(sx)]} {...props}>
      <TextInput
        multiline
        {...{ enabled, minRows, maxRows }}
        value={currentVal || prop.value}
        onClickAway={(value) => {
          if (!enabled) return
          onChange(value)
        }}
      />
    </Box>
  )
}
PropTextArea.propTypes = {
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

export default PropTextArea
