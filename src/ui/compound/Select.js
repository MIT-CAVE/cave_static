import { Box, ListItemIcon, MenuItem, Select as MuiSelect } from '@mui/material'
import PropTypes from 'prop-types'
import React from 'react'

import WrappedText from './WrappedText'

import { toIconInstance } from '../../utils'

const styles = {
  icon: {
    color: 'text.primary',
    minWidth: 0,
    mr: 1,
  },
  select: {
    borderRadius: 0,
    minWidth: 0,
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'normal !important',
    },
  },
}

/**
 * A component used to select values from a list of items.
 * @param {Array} items - An array of strings or objects...
 * @param selectedValue
 * @param placeholder
 * @param displayIcon
 * @param disabled
 * @param getLabel
 * @param onClickAway
 * @param onSelect
 * @param props
 * @private
 */
const Select = ({
  optionsList: items,
  value: selectedValue,
  placeholder,
  displayIcon,
  disabled,
  getLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = React.useState(false)
  return (
    <MuiSelect
      {...{ disabled, open, ...props }}
      sx={styles.select}
      displayEmpty
      value={selectedValue}
      onOpen={() => setOpen(true)}
      onClose={(event) => {
        onClickAway(event)
        setOpen(false)
      }}
      // Display only the icon when an item is selected
      {...(selectedValue !== '' &&
        displayIcon && {
          renderValue: (value) => {
            const item = items.find((prop) => prop.value === value)
            return <span>{item ? toIconInstance(item.iconClass) : value}</span>
          },
        })}
    >
      {placeholder && (
        <MenuItem
          value=""
          onClick={() => {
            onSelect && onSelect(null)
            setOpen(false)
          }}
          disabled
        >
          <Box sx={styles.itemText}>{placeholder}</Box>
        </MenuItem>
      )}
      {items.map((item, index) => {
        const { label, value, iconClass } = item
        return (
          <MenuItem
            key={index}
            value={value || label || item}
            onClick={() => {
              onSelect && onSelect(value || label || item)
              setOpen(false)
            }}
          >
            {iconClass && (
              <ListItemIcon sx={styles.icon}>
                {toIconInstance(iconClass)}
              </ListItemIcon>
            )}
            <WrappedText text={getLabel(label || value || item)} />
          </MenuItem>
        )
      })}
    </MuiSelect>
  )
}
Select.propTypes = {
  disabled: PropTypes.bool,
  optionsList: PropTypes.array,
  value: PropTypes.any,
  placeholder: PropTypes.string,
  displayIcon: PropTypes.bool,
  getLabel: PropTypes.func,
  onClickAway: PropTypes.func,
  onSelect: PropTypes.func,
}

export default Select
