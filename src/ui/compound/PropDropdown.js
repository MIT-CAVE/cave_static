import { Paper } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { SimpleDropdown } from './SimpleDropdown'

import { customSort } from '../../utils'

// Select might replace `SimpleDropdown` in the future, once
// a `ClickAwayListener` + `Select` bug is resolved in MUI.
// See: https://github.com/mui/material-ui/issues/25578#issuecomment-846222712
const PropDropdown = ({ prop, currentVal, onChange, ...props }) => {
  const { enabled = false, options } = prop
  const [value] = currentVal || prop.value
  const optionsListRaw = customSort(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)
  return (
    <Paper elevation={3} sx={{ ml: 1 }}>
      <SimpleDropdown
        disabled={!enabled}
        sx={{ p: 1.5 }}
        value={value}
        optionsList={R.pluck('id')(optionsListRaw)}
        onSelect={(val) => {
          if (!enabled) return
          onChange(val)
        }}
        getLabel={(value) => R.pathOr(value, [value, 'name'])(indexedOptions)}
      />
    </Paper>
  )
}
PropDropdown.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  onChange: PropTypes.func,
}

export default PropDropdown
