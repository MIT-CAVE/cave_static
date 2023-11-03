import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { SimpleDropdown } from './SimpleDropdown'

import { withIndex, forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

// `Select` might replace `SimpleDropdown` in the future, once
// a `ClickAwayListener` + `Select` bug is resolved in MUI.
// See: https://github.com/mui/material-ui/issues/25578#issuecomment-846222712
const PropDropdown = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const [value] = R.defaultTo(prop.value, currentVal)
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <SimpleDropdown
        {...{ value }}
        disabled={!enabled}
        sx={{ p: 1.5 }}
        optionsList={R.pluck('id')(optionsListRaw)}
        onSelect={(val) => {
          if (enabled) onChange([val])
        }}
        getLabel={(value) => R.pathOr(value, [value, 'name'])(indexedOptions)}
        paperProps={{ elevation: 3 }}
      />
    </Box>
  )
}
PropDropdown.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropDropdown
