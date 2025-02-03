import {
  ListItemIcon,
  MenuItem,
  Select as MuiSelect,
  Stack,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useRef, useState } from 'react'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'
import WrappedText from './WrappedText'

import { forceArray } from '../../utils'

const styles = {
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
  selectedValue: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'start',
    minWidth: '30px',
  },
  select: {
    minWidth: 0,
    borderRadius: 0,
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'normal !important',
    },
  },
}

/**
 * A component used to select values from a list of items.
 * @param {Array} items - An array of strings or objects...
 * @param selectedValue
 * @param placeholder
 * @param iconOnlyOnSelect
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
  iconOnlyOnSelect,
  disabled,
  sx = [],
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
      sx={[styles.select, ...forceArray(sx)]}
      name="cave-select"
      displayEmpty
      value={selectedValue}
      onOpen={() => {
        setOpen(true)
        // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
        sessionStorage.setItem('mui-select-open-flag', 1)
      }}
      onClose={(event) => {
        if (allowClose.current) {
          onClickAway(event)
          setOpen(false)
        } else {
          allowClose.current = true
        }
        // TODO: Find a better workaround for https://github.com/mui/material-ui/issues/25578.
        sessionStorage.removeItem('mui-select-open-flag')
      }}
      // Display only the icon when an item is selected
      {...((selectedValue !== '' || iconOnlyOnSelect) && {
        renderValue: (value) => {
          const item = items.find((prop) => prop.value === value)
          return (
            <Stack
              component="span"
              direction="row"
              spacing={1}
              sx={styles.selectedValue}
            >
              {item?.iconName && (
                <FetchedIcon iconName={item.iconName} size={32} />
              )}
              {(item || value) && !iconOnlyOnSelect && (
                <OverflowText text={getLabel(item?.label ?? value)} />
              )}
            </Stack>
          )
        },
      })}
    >
      {placeholder && (
        <MenuItem
          value=""
          onClick={(event) => {
            onSelect && onSelect(null, event)
            setOpen(false)
          }}
          disabled
        >
          <OverflowText text={placeholder} />
        </MenuItem>
      )}

      {/* HACK: Drop warning for non-existing value */}
      {selectedValue !== '' && (
        <MenuItem value={selectedValue} sx={{ display: 'none' }} />
      )}

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
                : (event) => {
                    onSelect && onSelect(value || label || item, event)
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
                    onClick: (event) => {
                      onSelect && onSelect(value || label || item, event)
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
}

export default Select
