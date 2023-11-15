import { Box, ListItemIcon, MenuItem, Select as MuiSelect } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useRef, useState } from 'react'

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
  subIcon: {
    mr: -1,
    minWidth: 0,
    color: 'text.primary',
    ml: 1,
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
  const allowClose = useRef(true)
  return (
    <MuiSelect
      {...{ disabled, open, ...props }}
      sx={styles.select}
      displayEmpty
      value={selectedValue}
      onOpen={() => {
        setOpen(true)
      }}
      onClose={(event) => {
        if (allowClose.current) {
          onClickAway(event)
          setOpen(false)
        } else {
          allowClose.current = true
        }
      }}
      // Display only the icon when an item is selected
      {...((selectedValue !== '' || displayIcon) && {
        renderValue: (value) => {
          const item = items.find((prop) => prop.value === value)
          return item && item.iconName ? (
            <Box component="span" sx={styles.displayIcon}>
              <FetchedIcon iconName={item.iconName} size={32} />
            </Box>
          ) : (
            <OverflowText
              text={getLabel(R.propOr(false, 'label', item) || value)}
            />
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
      {/* HACK: Drop warning for non-existing value */}

      <MenuItem value={selectedValue} sx={{ display: 'none' }} />

      {items.map((item, index) => {
        const { label, value, iconName, subOptions } = item
        return (
          <MenuItem
            key={index}
            value={value || label || item}
            onClick={
              subOptions
                ? () => {
                    allowClose.current = false
                  }
                : () => {
                    onSelect && onSelect(value || label || item)
                    setOpen(false)
                  }
            }
          >
            {iconName && (
              <ListItemIcon sx={styles.icon}>
                <FetchedIcon {...{ iconName }} size={32} />
              </ListItemIcon>
            )}
            <span
              {...(subOptions
                ? {
                    onClick: () => {
                      onSelect && onSelect(value || label || item)
                      setOpen(false)
                    },
                  }
                : {})}
            >
              <WrappedText text={getLabel(label || value || item)} />
            </span>
            {subOptions ? (
              <div style={{ marginLeft: 'auto' }}>
                {(subOptions || []).map((subObj, idx) => (
                  <ListItemIcon
                    key={idx}
                    sx={styles.subIcon}
                    onClick={() =>
                      R.prop('onClick', subObj)(value || label || item)
                    }
                  >
                    <FetchedIcon
                      {...{ iconName: R.prop('iconName', subObj) }}
                      size={32}
                    />
                  </ListItemIcon>
                ))}
              </div>
            ) : (
              []
            )}
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
