import { FormControl, FormHelperText, Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import OverflowText from './OverflowText'

import { getIconSvgDataUri } from '../../utils/svgBuilder'

import {
  fetchIcon,
  forceArray,
  getActiveDefaults,
  getContrastText,
  getOrDefault,
} from '../../utils'

const DEFAULT_MARK_COLOR = '#90caf9' // MUI's primary color
const DEFAULT_MARK_SIZE = '4px'
const DEFAULT_MARK_ACTIVE_SIZE = '20px' // MUI's default thumb size

const styles = {
  getRoot: ({ dragging, color, activeSvgIcon, activeColor, activeSize }) => ({
    '& .MuiSlider-thumb': {
      color: activeColor,
      height: activeSize,
      width: activeSize,
      ...(activeSvgIcon != null && {
        backgroundImage: `url('${activeSvgIcon}')`,
      }),
    },
    '& .MuiSlider-rail': {
      color: dragging
        ? // Preserve currently selected color when dragging the thumb
          color
        : activeColor,
    },
    '& .MuiSlider-mark': { borderRadius: '50%' },
  }),
  getSliderH: ({ numSteps }) => ({
    mt: 1,
    mb: 3.5,
    mx: 5,
    width: (theme) => `calc(100% - ${theme.spacing(10)})`,
    '& .MuiSlider-mark': { transform: 'translate(-50%, -50%)' },
    // Each label gets an equal slice of the rail, so text only
    // marquees when it exceeds the space it really has.
    '& .MuiSlider-markLabel': { maxWidth: `calc(100% / ${numSteps})` },
  }),
  getSliderV: ({ numSteps, currentMaxSize }) => ({
    my: 3,
    mx: 1,
    height: numSteps * Math.max(32, currentMaxSize),
    '& .MuiSlider-mark': { transform: 'translate(-50%, 50%)' },
  }),
}

const useIconFetcher = (options, propAttrs, activeDefaults) => {
  const [icons, setIcons] = useState({ svgIcons: null, activeSvgIcons: null })

  const fetchSvgIcon = useCallback(
    async (iconName, currentColor, currentSize) => {
      if (iconName == null) return
      // console.log('fetching...', iconName)
      const iconRootNode = await fetchIcon(iconName, undefined)
      const fillColor = getContrastText(currentColor)
      return getIconSvgDataUri(iconRootNode, fillColor, currentSize)
    },
    []
  )

  useEffect(() => {
    const fetchIcons = async () => {
      // SVG icons
      const svgIconPromises = Object.values(options).map((opt) => {
        const icon = getOrDefault(opt.icon, propAttrs.icon)
        const color =
          getOrDefault(opt.color, propAttrs.color) ?? DEFAULT_MARK_COLOR
        const size = getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_MARK_SIZE
        return fetchSvgIcon(icon, color, size)
      })

      // Active SVG icons
      const activeSvgIconPromises = Object.values(options).map((opt) => {
        const activeIcon =
          getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon
        const activeColor =
          getOrDefault(opt.activeColor, opt.color) ??
          activeDefaults.color ??
          DEFAULT_MARK_COLOR
        const activeSize =
          getOrDefault(opt.activeSize, opt.size) ??
          activeDefaults.size ??
          DEFAULT_MARK_ACTIVE_SIZE
        return fetchSvgIcon(activeIcon, activeColor, activeSize)
      })

      const [svgIcons, activeSvgIcons] = await Promise.all([
        Promise.all(svgIconPromises),
        Promise.all(activeSvgIconPromises),
      ])

      setIcons({ svgIcons, activeSvgIcons })
    }

    fetchIcons()
  }, [options, propAttrs, activeDefaults, fetchSvgIcon])

  return icons
}

const StepperBase = ({
  isVertical,
  disabled,
  value,
  options,
  propStyle,
  propAttrs,
  helperText,
  sx = [],
  onChange,
}) => {
  const [index, setIndex] = useState(null)
  const [sliderStyles, setSliderStyles] = useState(null)

  const optionsList = useMemo(
    () => R.pipe(R.keys, R.when(R.always(isVertical), R.reverse))(options),
    [isVertical, options]
  )

  useEffect(() => {
    setIndex(R.indexOf(value)(optionsList))
  }, [value, optionsList])

  const activeDefaults = useMemo(
    () => getActiveDefaults(propAttrs),
    [propAttrs]
  )

  const lastIndex = optionsList.length - 1

  const isOptionEnabled = useCallback(
    (idx) => getOrDefault(options[optionsList[idx]]?.enabled, true),
    [options, optionsList]
  )

  // Finds the nearest enabled option to `targetIndex`, searching outward
  // in both directions; falls back to `targetIndex` if every option is disabled.
  const getNearestEnabledIndex = useCallback(
    (targetIndex) => {
      if (isOptionEnabled(targetIndex)) return targetIndex
      for (let offset = 1; offset <= lastIndex; offset++) {
        if (targetIndex - offset >= 0 && isOptionEnabled(targetIndex - offset))
          return targetIndex - offset
        if (
          targetIndex + offset <= lastIndex &&
          isOptionEnabled(targetIndex + offset)
        )
          return targetIndex + offset
      }
      return targetIndex
    },
    [isOptionEnabled, lastIndex]
  )

  const marks = useMemo(
    () =>
      R.pipe(
        R.values,
        R.addIndex(R.map)((opt, idx) => {
          const markIndex = isVertical ? lastIndex - idx : idx
          const isActive = markIndex === index
          const label = isActive
            ? getOrDefault(opt.activeName, opt.name ?? opt.id)
            : (opt.name ?? opt.id)
          return {
            value: markIndex,
            // Only hstepper marquees overflowing labels
            label: isVertical ? (
              label
            ) : (
              <OverflowText text={label} sx={{ maxWidth: '100%' }} />
            ),
          }
        })
      )(options),
    [index, isVertical, lastIndex, options]
  )

  const currentMaxSize = useMemo(
    () =>
      Object.values(options).reduce((acc, opt, idx) => {
        const currentIndex = isVertical ? lastIndex - index : index
        const isActive = idx === currentIndex
        const currentSize = isActive
          ? (getOrDefault(opt.activeSize, opt.size) ??
            activeDefaults.size ??
            DEFAULT_MARK_ACTIVE_SIZE)
          : (getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_MARK_SIZE)
        return Math.max(acc, parseInt(currentSize))
      }, -Infinity),
    [activeDefaults.size, index, isVertical, lastIndex, options, propAttrs.size]
  )

  const { svgIcons, activeSvgIcons } = useIconFetcher(
    options,
    propAttrs,
    activeDefaults
  )

  useEffect(() => {
    // Only update styles when icons are available
    if (!svgIcons || !activeSvgIcons) return

    const currentIndex = isVertical ? lastIndex - index : index
    const selectedOption = optionsList[index]

    const fetchStyles = async () => {
      const activeSvgIcon = activeSvgIcons[currentIndex]
      // Get active attributes, cascading in two levels:
      // 1. Option active -> Option base
      // 2. Prop active -> Prop base
      const activeColor =
        getOrDefault(
          options[selectedOption]?.activeColor,
          options[selectedOption]?.color
        ) ??
        activeDefaults.color ??
        DEFAULT_MARK_COLOR
      const activeSize =
        getOrDefault(
          options[selectedOption]?.activeSize,
          options[selectedOption]?.size
        ) ??
        activeDefaults.size ??
        DEFAULT_MARK_ACTIVE_SIZE

      const markStyles = await Object.values(options).reduce(
        async (acc, opt, idx) => {
          const currentSvgIcon = svgIcons[idx]
          const color =
            getOrDefault(opt.color, propAttrs.color) ?? DEFAULT_MARK_COLOR
          const size =
            getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_MARK_SIZE
          // `idx` here is in natural declaration order, but `isOptionEnabled`
          // expects slider-space (reversed for vertical) — convert before use.
          const markIndex = isVertical ? lastIndex - idx : idx

          return {
            ...(await acc),
            [`& .MuiSlider-mark[data-index="${idx}"]`]: {
              ...(idx !== currentIndex
                ? {
                    ...(currentSvgIcon != null && {
                      backgroundImage: `url('${currentSvgIcon}')`,
                    }),
                    color,
                    height: size,
                    width: size,
                  }
                : {
                    height: activeSize,
                    width: activeSize,
                  }),
              ...(!isOptionEnabled(markIndex) && {
                opacity: 0.4,
                cursor: 'not-allowed',
              }),
            },
          }
        },
        {}
      )

      setSliderStyles([
        styles.getRoot({
          dragging: selectedOption !== value,
          color: getOrDefault(options[value]?.color, propAttrs.color),
          activeSvgIcon,
          activeColor,
          activeSize,
        }),
        markStyles,
        ...forceArray(sx),
        propStyle,
      ])
    }
    fetchStyles()
  }, [
    activeDefaults.color,
    activeDefaults.size,
    activeSvgIcons,
    index,
    isOptionEnabled,
    isVertical,
    lastIndex,
    options,
    optionsList,
    propAttrs.color,
    propAttrs.size,
    propStyle,
    svgIcons,
    sx,
    value,
  ])

  const handleChange = useCallback(
    (event, newIndex) => {
      if (disabled) return
      setIndex(getNearestEnabledIndex(newIndex))
    },
    [disabled, getNearestEnabledIndex]
  )

  const handleChangeComitted = useCallback(
    (event, newIndex) => {
      if (disabled) return
      const snappedIndex = getNearestEnabledIndex(newIndex)
      const newValue = optionsList[snappedIndex]
      if (snappedIndex !== newIndex) setIndex(snappedIndex)
      // REVIEW: Icon re-fetching issue
      // `onChange` triggers a prop update, which cascades down
      // and causes icon re-fetching despite no changes in icon dependencies.
      // In general, we need to rethink how we trigger prop value updates.
      onChange([newValue])
    },
    [disabled, getNearestEnabledIndex, onChange, optionsList]
  )

  return (
    <FormControl fullWidth>
      <Slider
        {...{ disabled, marks }}
        orientation={isVertical ? 'vertical' : 'horizontal'}
        sx={[
          ...(sliderStyles ? sliderStyles : []),
          isVertical
            ? styles.getSliderV({ numSteps: lastIndex + 1, currentMaxSize })
            : styles.getSliderH({ numSteps: lastIndex + 1 }),
        ]}
        min={0}
        max={lastIndex}
        step={null}
        track={false}
        valueLabelDisplay="off"
        value={index}
        onChange={handleChange}
        onChangeCommitted={handleChangeComitted}
      />
      <FormHelperText>{helperText}</FormHelperText>
    </FormControl>
  )
}
StepperBase.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.array,
  helperText: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

export default StepperBase
