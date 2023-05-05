import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import TextInput from './TextInput'

import { selectNumberFormat } from '../../data/selectors'

import { forceArray, unitStyles } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    p: 1,
    minHeight: (theme) => theme.spacing(5),
  },
  unit: {
    ...unitStyles,
    mb: 1,
    alignSelf: 'end',
  },
}

const PropTextArea = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)

  const { enabled = false, minRows = 2, maxRows = 10 } = prop
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  return (
    <Box sx={[styles.root, ...forceArray(sx)]} {...props}>
      {unit && <Box sx={styles.unit}>{unit}</Box>}
      <TextInput
        multiline
        {...{ enabled, minRows, maxRows }}
        numberFormat={{}}
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
