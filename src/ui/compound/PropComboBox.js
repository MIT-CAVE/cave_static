import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'
import { GiEmptyChessboard } from 'react-icons/gi'
import { IoSquareSharp } from 'react-icons/io5'

import ComboboxBase from './ComboboxBase'
import FetchedIcon from './FetchedIcon'

import {
  forceArray,
  getActiveDefaults,
  getOrDefault,
  withIndex,
} from '../../utils'

const DEFAULT_SIZE = '18px'

const PropComboBox = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    placeholder,
    helperText,
    labelPlacement = 'end',
    fullWidth,
    propStyle,
    slotProps,
    ...propAttrs
  } = prop

  const optionsListRaw = useMemo(() => withIndex(options), [options])
  const optionsList = useMemo(
    () => R.pluck('id')(optionsListRaw),
    [optionsListRaw]
  )
  const indexedOptions = useMemo(
    () => R.indexBy(R.prop('id'))(optionsListRaw),
    [optionsListRaw]
  )

  const activeDefaults = useMemo(
    () => getActiveDefaults(propAttrs),
    [propAttrs]
  )

  const value = currentVal[0] ?? prop.value[0] ?? ''
  const opt = options[value] ?? {}

  const activeIcon =
    getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon
  const activeColor =
    getOrDefault(opt.activeColor, opt.color) ?? activeDefaults.color
  const activeSize =
    getOrDefault(opt.activeSize, opt.size) ?? activeDefaults.size

  const markerAdornment = useMemo(() => {
    const markerStyle = {
      verticalAlign: 'middle',
      margin: '0 4px',
      ...(activeIcon == null && { border: '1px outset #fff' }),
      ...(labelPlacement === 'start' && { margin: '0 8px' }),
    }
    return activeIcon ? (
      <FetchedIcon
        iconName={activeIcon}
        color={activeColor}
        size={activeSize ?? DEFAULT_SIZE}
        style={markerStyle}
      />
    ) : activeColor ? (
      <IoSquareSharp
        color={activeColor}
        size={activeSize ?? DEFAULT_SIZE}
        style={markerStyle}
      />
    ) : activeSize ? (
      <GiEmptyChessboard
        size={activeSize ?? DEFAULT_SIZE}
        style={markerStyle}
      />
    ) : null
  }, [activeColor, activeIcon, activeSize, labelPlacement])

  const getOptionLabel = useCallback(
    (option) => {
      const currentOpt = options[option]
      return option === value
        ? (getOrDefault(currentOpt?.activeName, currentOpt?.name) ?? option)
        : (currentOpt?.name ?? option)
    },
    [options, value]
  )

  return (
    <ComboboxBase
      disabled={!enabled}
      options={optionsList}
      sx={[...forceArray(sx), propStyle]}
      {...{
        indexedOptions,
        value,
        placeholder,
        helperText,
        labelPlacement,
        fullWidth,
        slotProps,
        propAttrs,
        getOptionLabel,
        onChange,
      }}
      {...(value &&
        (labelPlacement === 'end'
          ? {
              startAdornments: markerAdornment,
            }
          : labelPlacement === 'start'
            ? {
                endAdornments: markerAdornment,
              }
            : null))}
    />
  )
}
PropComboBox.propTypes = {
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

export default PropComboBox
