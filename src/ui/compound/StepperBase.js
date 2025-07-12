import { Slider } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import buildSvgElementFromIconTree from '../../utils/svgBuilder'

import { fetchIcon, forceArray, getContrastText } from '../../utils'

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
  sliderH: {
    mt: 1,
    mb: 3.5,
    mx: 3,
    width: '100%',
    '& .MuiSlider-mark': { transform: 'translate(-50%, -50%)' },
  },
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
      const iconRootNode = await fetchIcon(iconName, undefined, true)
      const fillColor = getContrastText(currentColor)
      const svgEl = buildSvgElementFromIconTree(
        iconRootNode,
        fillColor,
        currentSize
      )
      const svgMarkup = svgEl.outerHTML.replace(/\s+/g, ' ').trim()
      return `data:image/svg+xml,${svgMarkup}`
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

/**
 * Returns the value if defined, otherwise returns the fallback.
 * This considers `undefined` as not set but treats `null` as intentionally set
 */
const getOrDefault = (value, fallback) =>
  value === undefined ? fallback : value

const StepperBase = ({
  isVertical,
  disabled,
  value,
  options,
  propStyle,
  propAttrs,
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
    () => ({
      icon: getOrDefault(propAttrs.activeIcon, propAttrs.icon),
      color: getOrDefault(propAttrs.activeColor, propAttrs.color),
      size: getOrDefault(propAttrs.activeSize, propAttrs.size),
    }),
    [propAttrs]
  )

  const lastIndex = optionsList.length - 1

  const marks = useMemo(
    () =>
      R.pipe(
        R.values,
        R.addIndex(R.map)((opt, idx) => ({
          value: isVertical ? lastIndex - idx : idx,
          label: opt.name ?? opt.id,
        }))
      )(options),
    [isVertical, lastIndex, options]
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
      setIndex(newIndex)
    },
    [disabled]
  )

  const handleChangeComitted = useCallback(
    async (event, newIndex) => {
      if (disabled) return
      const newValue = optionsList[newIndex]
      // REVIEW: Icon re-fetching issue
      // `onChange` triggers a prop update, which cascades down
      // and causes icon re-fetching despite no changes in icon dependencies.
      // In general, we need to rethink how we trigger prop value updates.
      onChange([newValue])
    },
    [disabled, onChange, optionsList]
  )

  return (
    <Slider
      {...{ disabled, marks }}
      orientation={isVertical ? 'vertical' : 'horizontal'}
      sx={[
        ...(sliderStyles ? sliderStyles : []),
        isVertical
          ? styles.getSliderV({ numSteps: lastIndex + 1, currentMaxSize })
          : styles.sliderH,
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
  )
}
StepperBase.propTypes = {
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

export default StepperBase
