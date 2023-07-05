import { Box, ListItemIcon, MenuItem, Select as MuiSelect } from '@mui/material'
import PropTypes from 'prop-types'
import { useState } from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'
import WrappedText from './WrappedText'

const styles = {
  displayIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    minWidth: '30px',
    maxWidth: '50px',
  },
  icon: {
    mr: 1,
    minWidth: 0,
    color: 'text.primary',
  },
  select: {
    minWidth: 0,
    borderRadius: 0,
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
  const [open, setOpen] = useState(false)
  return (
    <MuiSelect
      {...{ disabled, open, ...props }}
      sx={styles.select}
      displayEmpty
      value={selectedValue}
      onOpen={() => {
        console.log('maxkey: open')
        console.log(`maxkey: ${selectedValue}, ${JSON.stringify(items)}`)
        setOpen(true)
      }}
      onClose={(event) => {
        onClickAway(event)
        setOpen(false)
      }}
      // Display only the icon when an item is selected
      {...((selectedValue !== '' || displayIcon) && {
        renderValue: (value) => {
          const item = items.find((prop) => prop.value === value)
          return item ? (
            <Box component="span" sx={styles.displayIcon}>
              <FetchedIcon iconName={item.iconName} size={32} />
            </Box>
          ) : (
            <OverflowText text={getLabel(value)} />
          )
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
          <OverflowText text={placeholder} />
        </MenuItem>
      )}
      {items.map((item, index) => {
        const { label, value, iconName } = item
        return (
          <MenuItem
            elevation={10}
            key={index}
            sx={{ zIndex: 5000, left: '400px', overflow: 'visible' }}
            zIndex={5000}
            value={value || label || item}
            onClick={() => {
              onSelect && onSelect(value || label || item)
              setOpen(false)
            }}
          >
            {iconName && (
              <ListItemIcon sx={styles.icon}>
                <FetchedIcon {...{ iconName }} size={32} />
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
