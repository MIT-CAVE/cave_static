import {
  FormControl,
  ListItemIcon,
  MenuItem,
  Select as MuiSelect,
} from '@mui/material'
import PropTypes from 'prop-types'
import React from 'react'

import { toIconInstance } from '../../utils'

const styles = {
  formControl: {
    flexDirection: 'initial',
  },
  icon: {
    color: 'text.primary',
    size: 25,
    minWidth: 42,
    mr: 0.5,
  },
  select: {
    borderRadius: 0,
    boxSizing: 'border-box',
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      // whiteSpace: 'normal !important',
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
    <FormControl variant="outlined" sx={styles.formControl}>
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
              return <div>{item ? toIconInstance(item.iconClass) : value}</div>
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
            {placeholder}
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
              {getLabel(label || value || item)}
            </MenuItem>
          )
        })}
      </MuiSelect>
    </FormControl>
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
