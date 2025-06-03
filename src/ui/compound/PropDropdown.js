import { Stack } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback } from 'react'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'

import FetchedIcon from './FetchedIcon'
import { SimpleDropdown } from './SimpleDropdown'

import { forceArray, withIndex } from '../../utils'

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

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const getCurrentAttr = (value, attr, activeAttr) =>
  value ? getOrDefault(activeAttr, attr) : attr

// `Select` might replace `SimpleDropdown` in the future, once
// a `ClickAwayListener` + `Select` bug is resolved in MUI.
// See: https://github.com/mui/material-ui/issues/25578#issuecomment-846222712
const PropDropdown = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    labelPlacement = 'end',
    fullWidth,
    propStyle,
  } = prop
  const [value] = currentVal ?? prop.value
  const optionsListRaw = withIndex(options)
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)

  const getLabel = useCallback(
    (option) => {
      const {
        icon,
        label,
        name,
        color,
        size,
        activeIcon,
        activeLabel,
        activeName,
        activeColor,
        activeSize,
      } = indexedOptions[option] ?? {}
      const selected = option === value
      const currentLabel = selected
        ? getOrDefault(activeLabel ?? activeName, label ?? name)
        : (label ?? name)

      const direction =
        labelPlacement === 'start'
          ? 'row-reverse'
          : labelPlacement === 'end'
            ? 'row'
            : ''

      const currentIcon = getCurrentAttr(selected, icon, activeIcon)
      const currentColor = getCurrentAttr(selected, color, activeColor)
      const currentSize = getCurrentAttr(selected, size, activeSize)

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
    [indexedOptions, labelPlacement, value]
  )

  return (
    <SimpleDropdown
      disabled={!enabled}
      optionsList={R.pluck('id')(optionsListRaw)}
      {...{ value, fullWidth, getLabel }}
      sx={[styles.root, ...forceArray(sx), propStyle]}
      onSelect={(val) => {
        if (enabled) onChange([val])
      }}
      slotProps={{
        paper: { elevation: 0, sx: styles.paper },
      }}
    />
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
