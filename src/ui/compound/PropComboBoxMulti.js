import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'

import ComboboxBase from './ComboboxBase'

import { forceArray, withIndex } from '../../utils'

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const PropComboBoxMulti = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    placeholder,
    numVisibleTags,
    labelPlacement = 'end',
    fullWidth,
    propStyle,
    slotProps,
    ...propAttrs
  } = prop

  const optionsListRaw = withIndex(options)
  const optionsList = useMemo(
    () => R.pluck('id')(optionsListRaw),
    [optionsListRaw]
  )
  const indexedOptions = R.indexBy(R.prop('id'))(optionsListRaw)

  const activeDefaults = useMemo(
    () => ({
      icon: getOrDefault(propAttrs.activeIcon, propAttrs.icon),
      color: getOrDefault(propAttrs.activeColor, propAttrs.color),
      size: getOrDefault(propAttrs.activeSize, propAttrs.size),
    }),
    [propAttrs]
  )

  const getActiveAttrs = useCallback(
    (opt) => ({
      activeName: getOrDefault(opt.activeName, opt.name),
      activeIcon: getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon,
      activeColor:
        getOrDefault(opt.activeColor, opt.color) ?? activeDefaults.color,
      activeSize: getOrDefault(opt.activeSize, opt.size) ?? activeDefaults.size,
    }),
    [activeDefaults.color, activeDefaults.icon, activeDefaults.size]
  )

  const getOptionLabel = useCallback(
    (option) => options[option]?.name,
    [options]
  )

  return (
    <ComboboxBase
      multiple
      disabled={!enabled}
      options={optionsList}
      value={currentVal ?? prop.value ?? ''}
      limitTags={numVisibleTags}
      sx={[...forceArray(sx), propStyle]}
      {...{
        indexedOptions,
        placeholder,
        labelPlacement,
        fullWidth,
        slotProps,
        getActiveAttrs,
        getOptionLabel,
        onChange,
      }}
    />
  )
}
PropComboBoxMulti.propTypes = {
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

export default PropComboBoxMulti
