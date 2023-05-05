import { Box, Divider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { SimpleDropdown } from './SimpleDropdown'

import { selectNumberFormat } from '../../data/selectors'

import { customSort, forceArray, unitStyles } from '../../utils'

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
  const numberFormatDefault = useSelector(selectNumberFormat)

  const { enabled = false, options } = prop
  const numberFormatRaw = prop.numberFormat || {}
  const { unit } = R.mergeRight(numberFormatDefault)(numberFormatRaw)
  const [value] = R.defaultTo(prop.value, currentVal)
  const optionsListRaw = customSort(options)
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
      <Divider sx={{ ml: 1 }} orientation="vertical" flexItem />
      {unit && (
        <Box component="span" sx={unitStyles}>
          {unit}
        </Box>
      )}
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
