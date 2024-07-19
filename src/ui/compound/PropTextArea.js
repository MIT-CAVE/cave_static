import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useDispatch } from 'react-redux'

import TextInput from './TextInput'

import { setIsTextArea } from '../../data/utilities/virtualKeyboardSlice'

import { forceArray } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    p: 1,
    minHeight: (theme) => theme.spacing(5),
  },
}

const PropTextArea = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const dispatch = useDispatch()
  const { enabled = false, rows = 4 } = prop
  return (
    <Box
      sx={[styles.root, ...forceArray(sx)]}
      {...props}
      onFocus={() => dispatch(setIsTextArea(true))}
    >
      <TextInput
        multiline
        {...{ enabled, rows }}
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
