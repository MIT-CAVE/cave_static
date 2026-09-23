import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useMemo } from 'react'

import ComboboxMultiBase from './ComboboxMultiBase'

import {
  forceArray,
  getActiveDefaults,
  getBaseDefaults,
  getOptionActiveAttrs,
  getOptionBaseAttrs,
  withIndex,
} from '../../utils'

const PropComboBoxMulti = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    options,
    placeholder,
    helperText,
    numVisibleTags,
    labelPlacement = 'end',
    limitTags,
    fullWidth,
    propStyle,
    slotProps,
    ...propAttrs
  } = prop

  const effectiveLimitTags = numVisibleTags ?? limitTags ?? 1
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
    <ComboboxMultiBase
      disabled={!enabled}
      options={optionsList}
      value={currentVal ?? prop.value ?? []}
      numVisibleTags={effectiveLimitTags}
      sx={[...forceArray(sx), propStyle]}
      {...{
        indexedOptions,
        placeholder,
        helperText,
        labelPlacement,
        fullWidth,
        slotProps,
        propAttrs,
        getActiveAttrs,
        getBaseAttrs,
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
