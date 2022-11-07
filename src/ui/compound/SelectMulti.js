import {
  Checkbox,
  FormControl,
  ListItemIcon,
  MenuItem,
  Select,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useState } from 'react'

import { forcePath, toIconInstance } from '../../utils'

const styles = {
  formControl: {
    flexDirection: 'initial',
  },
  icon: {
    '& .MuiListItemIcon-root': {
      color: 'text.primary',
      size: 25,
      minWidth: 42,
    },
  },
  select: {
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal',
    },
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
  getLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(forcePath(selectedValue))
  return (
    <FormControl variant="outlined" sx={styles.formControl}>
      <Select
        {...{ disabled, open, ...props }}
        sx={styles.select}
        multiple
        value={selected.length > 0 ? selected : [header]}
        onOpen={() => setOpen(true)}
        onClose={(event) => {
          onClickAway(event)
          setOpen(false)
          onSelect && onSelect(selected)
        }}
        renderValue={() => <span>{header}</span>}
      >
        <MenuItem disabled>{header}</MenuItem>
        {items.map((item, index) => {
          const { label, value, iconClass } = item
          return (
            <MenuItem
              key={index}
              value={value || label || item}
              onClick={() => {
                const newVal = R.includes(item, selected)
                  ? R.without([item], selected)
                  : R.concat([item], selected)
                setSelected(newVal)
              }}
            >
              <Checkbox checked={R.includes(item, selected)} />
              {iconClass && (
                <ListItemIcon sx={styles.icon}>
                  {toIconInstance(iconClass)}
                </ListItemIcon>
              )}
              {getLabel(label || value || item)}
            </MenuItem>
          )
        })}
      </Select>
    </FormControl>
  )
}
SelectMulti.propTypes = {
  optionsList: PropTypes.array,
  value: PropTypes.any,
  header: PropTypes.string,
  displayIcon: PropTypes.bool,
  disabled: PropTypes.bool,
  getLabel: PropTypes.func,
  onClick: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
  children: PropTypes.node,
}

export default SelectMulti
