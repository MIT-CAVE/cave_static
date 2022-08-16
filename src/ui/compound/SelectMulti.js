import {
  Checkbox,
  FormControl,
  ListItemIcon,
  MenuItem,
  Select,
} from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'

import { forcePath, toIconInstance } from '../../utils'

const useStyles = makeStyles((theme) => ({
  formControl: {
    flexDirection: 'initial',
    margin: theme.spacing(1),
  },
  icon: {
    color: theme.palette.text.primary,
    size: 25,
    minWidth: 42,
  },
  select: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'normal',
  },
}))

/**
 * A component used to select values from a list of items.
 * @param className
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
  className,
  optionsList: items,
  value: selectedValue,
  header,
  disabled,
  getLabel = (label) => label,
  onClickAway = () => {},
  onSelect = () => {},
  ...props
} = {}) => {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState(forcePath(selectedValue))
  const classes = useStyles()
  return (
    <FormControl variant="outlined" className={classes.formControl}>
      <Select
        {...{ className, disabled, open, ...props }}
        classes={{ root: classes.select }}
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
                <ListItemIcon classes={{ root: classes.icon }}>
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
  className: PropTypes.string,
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

export { SelectMulti }
export default SelectMulti
