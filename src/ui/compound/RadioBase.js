import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useMemo } from 'react'

import FetchedIcon from './FetchedIcon'

import { withIndex } from '../../utils'

const DEFAULT_SIZE = '20px'

const styles = {
  getRadio: ({ color, size, activeColor, activeSize }) => ({
    color,
    '& .MuiSvgIcon-root': {
      fontSize: size,
    },
    '&.Mui-checked': {
      color: activeColor,
      '& .MuiSvgIcon-root': {
        fontSize: activeSize,
      },
    },
  }),
}

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const RadioBase = ({
  disabled: propDisabled,
  value,
  options,
  isHorizontal,
  labelPlacement,
  helperText,
  propAttrs,
  sx = [],
  onChange,
}) => {
  const indexedOptions = useMemo(() => withIndex(options), [options])
  const activeDefaults = useMemo(
    () => ({
      icon: getOrDefault(propAttrs.activeIcon, propAttrs.icon),
      color: getOrDefault(propAttrs.activeColor, propAttrs.color),
      size: getOrDefault(propAttrs.activeSize, propAttrs.size),
    }),
    [propAttrs]
  )
  const currentMaxSize = useMemo(
    () =>
      indexedOptions.reduce((acc, opt) => {
        const checked = opt.id === value
        const currentSize = checked
          ? (getOrDefault(opt.activeSize, opt.size) ??
            activeDefaults.size ??
            DEFAULT_SIZE)
          : (getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_SIZE)
        return Math.max(acc, parseInt(currentSize))
      }, -Infinity),
    [activeDefaults.size, indexedOptions, propAttrs.size, value]
  )
  return (
    <FormControl {...{ sx }}>
      <RadioGroup
        row={isHorizontal}
        sx={[
          isHorizontal && { flexWrap: 'nowrap' },
          labelPlacement === 'start' && { pr: '11px' },
          labelPlacement === 'end' && { pl: '11px' },
        ]}
      >
        {R.map(({ id: key, enabled: optEnabled = !propDisabled, ...opt }) => {
          const checked = key === value
          const disabled = propDisabled || !optEnabled

          // Get the label depending on whether the option is checked
          const label = checked
            ? getOrDefault(opt.activeName, opt.name)
            : opt.name

          // Attributes cascade from prop-level to option-level, with option-level taking precedence

          // Base attributes, cascading from prop to option level
          const icon = getOrDefault(opt.icon, propAttrs.icon)
          const color = getOrDefault(opt.color, propAttrs.color)
          const size = getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_SIZE

          // Get active attributes, cascading in two levels:
          // 1. Option active -> Option base
          // 2. Prop active -> Prop base
          const activeIcon =
            getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon
          const activeColor =
            getOrDefault(opt.activeColor, opt.color) ?? activeDefaults.color
          const activeSize =
            getOrDefault(opt.activeSize, opt.size) ??
            activeDefaults.size ??
            DEFAULT_SIZE

          const horizontalAlignment = { my: 'auto' }
          const currentSize = checked ? activeSize : size
          const verticalAlignment = {
            mx: `${Math.abs(currentMaxSize - parseInt(currentSize)) / 2}px`,
          }
          return (
            <FormControlLabel
              key={key}
              {...{ disabled, label, labelPlacement }}
              slotProps={{
                typography: {
                  sx: [
                    labelPlacement === 'start' && { mr: 0.5, ml: 0 },
                    labelPlacement === 'end' && { mr: 0, ml: 0.5 },
                  ],
                },
              }}
              control={
                <Radio
                  sx={[
                    isHorizontal ? horizontalAlignment : verticalAlignment,
                    styles.getRadio({ color, size, activeColor, activeSize }),
                  ]}
                  name={label}
                  {...{ checked, value }}
                  {...(icon && {
                    icon: <FetchedIcon iconName={icon} {...{ color, size }} />,
                  })}
                  {...(activeIcon && {
                    checkedIcon: (
                      <FetchedIcon
                        iconName={activeIcon}
                        color={activeColor}
                        size={activeSize}
                      />
                    ),
                  })}
                  onChange={() => {
                    if (disabled) return
                    onChange([key])
                  }}
                />
              }
            />
          )
        })(indexedOptions)}
      </RadioGroup>
      <FormHelperText>
        {value in options ? options[value]?.helperText : helperText}
      </FormHelperText>
    </FormControl>
  )
}
RadioBase.propTypes = {
  propAttrs: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default RadioBase
