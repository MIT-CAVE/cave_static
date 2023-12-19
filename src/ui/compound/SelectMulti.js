import { Checkbox, ListItemIcon, MenuItem, Select } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'
import WrappedText from './WrappedText'

import { forceArray, forcePath } from '../../utils'

const styles = {
  icon: {
    ml: 1,
    color: 'text.primary',
    minWidth: 0,
    mr: 1,
  },
  select: {
    width: '100%',
    borderRadius: 0,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
}

/**
 * A component used to select values from a list of items.
 * @param {Array} items - An array of strings or objects...
 * @param selectedValue
 * @param header
 * @param disabled
 * @param getLabel
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const SelectMulti = ({
  optionsList: items,
  value: selectedValue,
  header,
  disabled,
  sx = [],
  getLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(forcePath(selectedValue))
  return (
    <Select
      {...{ disabled, open, ...props }}
      sx={[styles.select, ...forceArray(sx)]}
      multiple
      value={selected.length > 0 ? selected : [header]}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={(event) => {
        onClickAway(event)
        setOpen(false)
        onSelect && onSelect(selected)
      }}
      renderValue={() => <OverflowText text={header} />}
    >
      <MenuItem disabled>{header}</MenuItem>
      {items.map((item, index) => {
        const { label, value: itemValue, iconName } = item
        const value = itemValue || item
        return (
          <MenuItem
            key={index}
            value={value}
            onClick={() => {
              const newVal = R.includes(value, selected)
                ? R.without([value], selected)
                : R.concat([value], selected)
              setSelected(newVal)
            }}
          >
            <Checkbox checked={R.includes(value, selected)} />
            {iconName && (
              <ListItemIcon sx={styles.icon}>
                <FetchedIcon {...{ iconName }} size={24} />
              </ListItemIcon>
            )}
            <WrappedText text={getLabel(label || value)} />
          </MenuItem>
        )
      })}
    </Select>
  )
}
SelectMulti.propTypes = {
  optionsList: PropTypes.array,
  value: PropTypes.any,
  header: PropTypes.string,
  disabled: PropTypes.bool,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  getLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
  children: PropTypes.node,
}

export default SelectMulti
