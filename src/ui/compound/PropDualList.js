import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'

import DualListBase from './DualListBase'

import { forceArray, getOrDefault, withIndex } from '../../utils'

const PropDualList = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    availableTitle,
    selectedTitle,
    height,
    fullWidth = true,
    propStyle,
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

  const baseDefaults = useMemo(
    () => ({
      icon: propAttrs.icon,
      color: propAttrs.color,
      size: propAttrs.size,
    }),
    [propAttrs]
  )

  const getActiveAttrs = useCallback(
    (opt = {}) => ({
      activeName: getOrDefault(opt.activeName, opt.name),
      activeIcon: getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon,
      activeColor:
        getOrDefault(opt.activeColor, opt.color) ?? activeDefaults.color,
      activeSize: getOrDefault(opt.activeSize, opt.size) ?? activeDefaults.size,
    }),
    [activeDefaults.color, activeDefaults.icon, activeDefaults.size]
  )

  const getBaseAttrs = useCallback(
    (opt = {}) => ({
      name: opt.name,
      icon: getOrDefault(opt.icon, baseDefaults.icon),
      color: getOrDefault(opt.color, baseDefaults.color),
      size: getOrDefault(opt.size, baseDefaults.size),
    }),
    [baseDefaults.color, baseDefaults.icon, baseDefaults.size]
  )

  return (
    <DualListBase
      disabled={!enabled}
      options={optionsList}
      value={currentVal ?? prop.value ?? []}
      sx={[...forceArray(sx), propStyle]}
      {...{
        availableTitle,
        selectedTitle,
        height,
        fullWidth,
        indexedOptions,
        getActiveAttrs,
        getBaseAttrs,
        onChange,
      }}
    />
  )
}

PropDualList.propTypes = {
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

export default PropDualList
