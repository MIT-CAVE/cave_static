import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import TextInput from './TextInput'

import { forceArray } from '../../utils'

const style = {
  p: 1,
  width: '100%',
  minHeight: (theme) => theme.spacing(5),
}

const PropText = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const enabled = prop.enabled || false
  return (
    <Box sx={[style, ...forceArray(sx)]} {...props}>
      <TextInput
        {...{ enabled }}
        value={R.defaultTo(prop.value, currentVal)}
        onClickAway={(value) => {
          if (!enabled) return
          onChange(value)
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
