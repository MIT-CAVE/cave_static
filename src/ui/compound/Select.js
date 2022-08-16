import {
  FormControl,
  ListItemIcon,
  MenuItem,
  Select as MuiSelect,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import React from 'react'

import { toIconInstance } from '../../utils'

const useStyles = makeStyles((theme) => ({
  formControl: {
    flexDirection: 'initial',
    margin: theme.spacing(1),
  },
  icon: {
    color: theme.palette.text.primary,
    size: 25,
    minWidth: 42,
    marginRight: theme.spacing(0.5),
  },
  select: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'normal !important',
  },
}))

/**
 * A component used to select values from a list of items.
 * @param className
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
  className,
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
  const classes = useStyles()
  return (
    <FormControl variant="outlined" className={classes.formControl}>
      <MuiSelect
        {...{ className, disabled, open, ...props }}
        classes={{ select: classes.select }}
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
                <ListItemIcon classes={{ root: classes.icon }}>
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
  className: PropTypes.string,
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
