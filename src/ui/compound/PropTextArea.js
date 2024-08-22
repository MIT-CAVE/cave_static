import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import TextInput from './TextInput'

import { setIsTextArea } from '../../data/utilities/virtualKeyboardSlice'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  flexDirection: 'column',
  p: 1,
  width: '100%',
  // minHeight: (theme) => theme.spacing(5),
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const PropTextArea = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const dispatch = useDispatch()
  const { enabled = false, rows = 4, placeholder, label } = prop
  return (
    <Box
      sx={[getStyles(enabled), ...forceArray(sx)]}
      onFocus={() => dispatch(setIsTextArea(true))}
      {...props}
    >
      <TextInput
        multiline
        {...{ enabled, rows, placeholder, label }}
        value={R.defaultTo(prop.value, currentVal)}
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
