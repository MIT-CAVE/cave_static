import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import TextInput from './TextInput'

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
  const { enabled = false, minRows = 2, maxRows = 10 } = prop
  return (
    <Box sx={[styles.root, ...forceArray(sx)]} {...props}>
      <TextInput
        multiline
        {...{ enabled, minRows, maxRows }}
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
