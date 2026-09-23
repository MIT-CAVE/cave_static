import { FormControl, FormHelperText, Stack } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'

import FetchedIcon from './FetchedIcon'
import { SimpleDropdown } from './SimpleDropdown'

import { getActiveDefaults, getOrDefault, withIndex } from '../../utils'

const styles = {
  root: {
    height: '100%',
  },
  paper: {
    m: 0,
    height: '56px',
  },
  marker: {
    marginRight: '8px',
    border: '1px outset #fff',
  },
}

const DEFAULT_SIZE = '18px'

// `Select` might replace `SimpleDropdown` in the future, once
// a `ClickAwayListener` + `Select` bug is resolved in MUI.
// See: https://github.com/mui/material-ui/issues/25578#issuecomment-846222712
const PropDropdown = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    labelPlacement = 'end',
    helperText,
    fullWidth,
    propStyle,
    ...propAttrs
  } = prop
  const [value] = currentVal ?? prop.value ?? []

  const optionsListRaw = useMemo(() => withIndex(options), [options])

  const activeDefaults = useMemo(
    () => getActiveDefaults(propAttrs),
    [propAttrs]
  )

  const getLabel = useCallback(
    (option) => {
      const {
        icon,
        name,
        color,
        size,
        activeIcon,
        activeName,
        activeColor,
        activeSize,
      } = options[option] ?? {}

      const direction =
        labelPlacement === 'start'
          ? 'row-reverse'
          : labelPlacement === 'end'
            ? 'row'
            : ''

      const selected = option === value
      const currentLabel = selected ? getOrDefault(activeName, name) : name
      const currentIcon = selected
        ? (getOrDefault(activeIcon, icon) ?? activeDefaults.icon)
        : icon
      const currentColor = selected
        ? (getOrDefault(activeColor, color) ?? activeDefaults.color)
        : color
      const currentSize = selected
        ? (getOrDefault(activeSize, size) ?? activeDefaults.size)
        : size

      return (
        <Stack
          useFlexGap
          spacing={1}
          {...{ direction }}
          sx={{ alignItems: 'center' }}
        >
          {currentIcon ? (
            <FetchedIcon
              iconName={currentIcon}
              color={currentColor}
              size={currentSize ?? DEFAULT_SIZE}
            />
          ) : currentColor ? (
            <IoSquareSharp
              color={currentColor}
              size={currentSize ?? DEFAULT_SIZE}
              style={styles.marker}
            />
          ) : currentSize ? (
            <GiEmptyChessboard
              size={currentSize ?? DEFAULT_SIZE}
              style={styles.marker}
            />
          ) : null}
          {currentLabel ?? option}
        </Stack>
      )
    },
    [activeDefaults, labelPlacement, options, value]
  )

  const getOptionDisabled = useCallback(
    (option) => !getOrDefault(options[option]?.enabled, true),
    [options]
  )

  return (
    <FormControl fullWidth {...{ sx }}>
      <SimpleDropdown
        disabled={!enabled}
        optionsList={R.pluck('id')(optionsListRaw)}
        {...{ value, fullWidth, getLabel, getOptionDisabled }}
        sx={[styles.root, propStyle]}
        onSelect={(val) => {
          if (enabled) onChange([val])
        }}
        slotProps={{
          paper: { elevation: 0, sx: styles.paper },
        }}
      />
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}
PropDropdown.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default PropDropdown
