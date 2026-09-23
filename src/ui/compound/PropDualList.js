import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'

import DualListBase from './DualListBase'

import {
  forceArray,
  getActiveDefaults,
  getBaseDefaults,
  getOptionActiveAttrs,
  getOptionBaseAttrs,
  withIndex,
} from '../../utils'

const PropDualList = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    availableTitle,
    selectedTitle,
    height,
    helperText,
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
    () => getActiveDefaults(propAttrs),
    [propAttrs]
  )
  const baseDefaults = useMemo(() => getBaseDefaults(propAttrs), [propAttrs])

  const getActiveAttrs = useCallback(
    (opt) => getOptionActiveAttrs(opt, activeDefaults),
    [activeDefaults]
  )

  const getBaseAttrs = useCallback(
    (opt) => getOptionBaseAttrs(opt, baseDefaults),
    [baseDefaults]
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
        helperText,
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
