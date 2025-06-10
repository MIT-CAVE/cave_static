import {
  Checkbox,
  FormControl,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  styled,
} from '@mui/material'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import FetchedIcon from './FetchedIcon'

import buildSvgElementFromIconTree from '../../utils/svgBuilder'

import { fetchIcon, forceArray, getContrastText } from '../../utils'

const styles = {
  getButton: ({ activeColor }) => ({
    '&.Mui-selected': {
      bgcolor: `color-mix(in srgb, ${activeColor}, transparent 92%)`,
      '&:hover': {
        bgcolor: `color-mix(in srgb, ${activeColor}, transparent 80%)`,
      },
    },
  }),
  getCheckbox: ({ color, size, activeColor, activeSize }) => ({
    color,
    '& .MuiSvgIcon-root': { fontSize: size },
    '&.Mui-checked': {
      color: activeColor,
      '& .MuiSvgIcon-root': { fontSize: activeSize },
    },
  }),
  getSwitch: ({
    // TODO: Adjust the track and thumb to match sizes for consistent styling.
    isActive,
    svgIcon,
    color,
    // eslint-disable-next-line no-unused-vars
    size,
    activeSvgIcon,
    activeColor,
    // eslint-disable-next-line no-unused-vars
    activeSize,
  }) => ({
    '& .MuiSwitch-switchBase': {
      '&.Mui-checked': {
        color: activeColor,
        transform: 'translateX(20px)',
        '& .MuiSwitch-thumb:before': {
          backgroundImage: `url('${activeSvgIcon}')`,
        },
        '& + .MuiSwitch-track': {
          backgroundColor: activeColor,
        },
        '&:hover': {
          backgroundColor: `color-mix(in srgb, ${activeColor}, transparent 92%)`,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      backgroundColor: isActive ? activeColor : color,
      width: 20,
      height: 20,
      '&::before': {
        content: "''",
        position: 'absolute',
        width: '100%',
        height: '100%',
        left: 0,
        top: 0,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundImage: `url('${svgIcon}')`,
      },
    },
    '& .MuiSwitch-track': {
      opacity: 0.3,
      backgroundColor: isActive ? activeColor : (color ?? '#fff'),
      borderRadius: 10,
    },
  }),
}

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const getCurrentAttr = (value, attr, activeAttr) =>
  value ? getOrDefault(activeAttr, attr) : attr

const PropToggleButton = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    icon,
    label,
    color,
    size = 20,
    activeIcon,
    activeLabel,
    activeColor,
    activeSize,
    labelPlacement,
    fullWidth,
    propStyle,
  } = prop
  const value = R.defaultTo(prop.value)(currentVal)
  const currentIcon = getCurrentAttr(value, icon, activeIcon)
  const currentLabel = getCurrentAttr(value, label, activeLabel)

  const handleChange = useCallback(
    (event, currentValue) => {
      if (!enabled) return
      onChange(!currentValue)
    },
    [enabled, onChange]
  )

  const direction =
    labelPlacement === 'top'
      ? 'column-reverse'
      : labelPlacement === 'start'
        ? 'row-reverse'
        : labelPlacement === 'bottom'
          ? 'column'
          : 'row'

  return (
    <ToggleButton
      disabled={!enabled}
      {...{ fullWidth, value }}
      selected={value}
      sx={[
        styles.getButton({ activeColor }),
        ...forceArray(sx),
        ...forceArray(propStyle),
      ]}
      onChange={handleChange}
    >
      <Stack
        useFlexGap
        spacing={1}
        {...{ direction }}
        sx={{ alignItems: 'center' }}
      >
        {currentIcon && (
          <FetchedIcon
            iconName={currentIcon}
            size={getCurrentAttr(value, size, activeSize)}
            color={getCurrentAttr(value, color, activeColor)}
          />
        )}
        {currentLabel}
      </Stack>
    </ToggleButton>
  )
}

const PropToggleCheckbox = ({ prop, currentVal, sx = [], onChange }) => {
  const {
    enabled,
    label,
    icon,
    color,
    size = 24,
    activeLabel,
    activeIcon,
    activeColor,
    activeSize,
    labelPlacement,
    fullWidth,
    propStyle,
  } = prop
  const value = R.defaultTo(prop.value)(currentVal)
  const activeIconName = getOrDefault(activeIcon, icon)

  const Icon = useMemo(
    () => (icon ? <FetchedIcon iconName={icon} {...{ color, size }} /> : null),
    [color, icon, size]
  )

  const ActiveIcon = useMemo(
    () => (
      <FetchedIcon
        iconName={activeIconName}
        size={getOrDefault(activeSize, size)}
        color={getOrDefault(activeColor, color)}
      />
    ),
    [activeColor, activeIconName, activeSize, color, size]
  )

  const handleChange = useCallback(
    (event) => {
      if (!enabled) return
      onChange(event.target.checked)
    },
    [enabled, onChange]
  )

  return (
    <FormControl
      sx={[
        { p: 1 },
        fullWidth && { width: '100%' },
        ...forceArray(sx),
        ...forceArray(propStyle),
      ]}
    >
      <FormControlLabel
        label={getCurrentAttr(value, label, activeLabel)}
        {...{ labelPlacement }}
        control={
          <Checkbox
            disabled={!enabled}
            name="cave-toggle-checkbox"
            checked={value}
            {...(icon && { icon: Icon })}
            {...(activeIconName && { checkedIcon: ActiveIcon })}
            sx={styles.getCheckbox({ color, size, activeColor, activeSize })}
            onChange={handleChange}
          />
        }
      />
    </FormControl>
  )
}

const PropToggleSwitch = ({ prop, currentVal, sx = [], onChange }) => {
  const [svgIcon, setSvgIcon] = useState(null)
  const [activeSvgIcon, setActiveSvgIcon] = useState(null)

  const {
    enabled,
    icon,
    label,
    color,
    size = 18,
    activeIcon,
    activeLabel,
    activeColor,
    activeSize,
    labelPlacement,
    fullWidth,
    propStyle,
  } = prop
  const value = R.defaultTo(prop.value)(currentVal)

  const fetchSvgIcon = useCallback(
    async (iconName) => {
      const iconRootNode = await fetchIcon(iconName, undefined, true)
      const currentColor =
        getCurrentAttr(value, color, activeColor) ??
        (value ? '#90caf9' : '#e0e0e0') // These match MUI's defaults (`primary.main` & `grey[300]`)
      const fillColor = getContrastText(currentColor)
      const svgEl = buildSvgElementFromIconTree(iconRootNode, fillColor, size)
      const svgMarkup = svgEl.outerHTML.replace(/\s+/g, ' ').trim()
      return `data:image/svg+xml,${svgMarkup}`
    },
    [activeColor, color, size, value]
  )

  useEffect(() => {
    const iconName = getOrDefault(activeIcon, icon)
    fetchSvgIcon(iconName).then(setActiveSvgIcon)
  }, [activeIcon, fetchSvgIcon, icon])

  useEffect(() => {
    fetchSvgIcon(icon).then(setSvgIcon)
  }, [fetchSvgIcon, icon])

  const CustomSwitch = useMemo(() => {
    const currentStyle = styles.getSwitch({
      svgIcon,
      color,
      size,
      activeSvgIcon,
      activeColor: getOrDefault(activeColor, color),
      activeSize: getOrDefault(activeSize, size),
      isActive: value,
    })
    return styled(Switch)(currentStyle)
  }, [value, svgIcon, color, size, activeSvgIcon, activeColor, activeSize])

  const handleChange = useCallback(
    (event) => {
      if (!enabled) return
      onChange(event.target.checked)
    },
    [enabled, onChange]
  )

  return (
    <FormControl
      sx={[
        fullWidth && { width: '100%' },
        ...forceArray(sx),
        ...forceArray(propStyle),
      ]}
    >
      <FormControlLabel
        sx={[
          labelPlacement === 'start' && { ml: 0.5, mr: 0 },
          labelPlacement === 'end' && { ml: 0, mr: 0.5 },
        ]}
        label={getCurrentAttr(value, label, activeLabel)}
        {...{ labelPlacement }}
        control={
          <CustomSwitch
            disabled={!enabled}
            name="cave-toggle-switch"
            checked={value}
            onChange={handleChange}
          />
        }
      />
    </FormControl>
  )
}

export { PropToggleButton, PropToggleCheckbox, PropToggleSwitch }
