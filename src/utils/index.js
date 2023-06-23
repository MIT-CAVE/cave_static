import { quantileSorted } from 'd3-array'
import { color } from 'd3-color'
import { scaleLinear } from 'd3-scale'
import { Parser } from 'expr-eval'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { GenIcon } from 'react-icons'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import { CHART_PALETTE, DEFAULT_ICON_URL, DEFAULT_LOCALE } from './constants'

const getQuantiles = R.curry((n, values) => {
  const percentiles = R.times((i) => i / (n - 1), n)
  return R.map((pct) => quantileSorted(values, pct))(percentiles)
})

const iconPrefix = {
  ANT_DESIGN_ICONS: 'Ai',
  BOX_ICONS: 'Bi',
  BOOTSTRAP_ICONS: 'Bs',
  DEV_ICONS: 'Di',
  FEATHER: 'Fi',
  FLAT_COLOR_ICONS: 'Fc',
  FONT_AWESOME: 'Fa',
  GAME_ICONS: 'Gi',
  GITHUB_OCTICONS_ICONS: 'Go',
  GROMMET_ICONS: 'Gr',
  HERO_ICONS: 'Hi',
  ICOMOON_FREE: 'Im',
  IONICONS_FOUR: 'IoIos',
  IONICONS_FIVE: 'Io',
  MATERIAL_DESIGN_ICONS: 'Md',
  REMIX_ICON: 'Ri',
  SIMPLE_ICON: 'Si',
  TYPICONS: 'Ti',
  VS_CODE_ICONS: 'Vsc',
  WEATHER_ICONS: 'Wi',
  CSS_DOT_GG: 'Cg',
}

// checks if paths contains the given path, or a path to one of its parents
export const includesPath = (paths, path) => {
  return R.any((sub) => path.join(',').indexOf(sub.join(',')) === 0)(paths)
}

// simplified combineReducers to allow for localMutation
export const combineReducers = (reducers) => {
  const reducerKeys = R.keys(reducers)
  return (state = {}, action) => {
    let hasChanged = false
    const nextState = R.clone(state)
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i]
      const reducer = reducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)
      nextState[key] = nextStateForKey
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey
    }
    hasChanged = hasChanged || reducerKeys.length !== Object.keys(state).length
    return hasChanged ? nextState : state
  }
}

export const renameProp = R.curry((oldProp, newProp, obj) =>
  R.pipe(R.assoc(newProp, R.prop(oldProp)(obj)), R.dissoc(oldProp))(obj)
)

/**
 * Taken from: https://github.com/ramda/ramda/wiki/Cookbook#rename-keys-of-an-object
 *
 * Creates a new object with the own properties of the provided object, but the
 * keys renamed according to the keysMap object as `{oldKey: newKey}`.
 * When some key is not found in the keysMap, then it's passed as-is.
 */
export const renameKeys = R.curry((keysMap, obj) =>
  R.reduce(
    (acc, key) => R.assoc(keysMap[key] || key, obj[key], acc),
    {},
    R.keys(obj)
  )
)

export const forcePath = (pathOrProp) =>
  R.is(Array, pathOrProp) ? pathOrProp : [pathOrProp]
export const forceArray = forcePath // Just an alias

export const passLog = (val) => {
  console.log(val)
  return val
}

export const getLabelFn = R.curry((data, item) =>
  R.pathOr(item, [item, 'name'])(data)
)
export const getSubLabelFn = R.curry((data, item, subItem) =>
  R.pathOr(subItem, [item, 'nestedStructure', subItem, 'name'])(data)
)

export const getFreeName = (name, namesList) => {
  const namesSet = new Set(namesList)
  if (!namesSet.has(name)) return name

  let count = 1
  while (namesSet.has(`${name} (${count})`)) count++
  return `${name} (${count})`
}

export const eitherBoolOrNotNull = (value) =>
  typeof value === 'boolean' ? value : value != null

export const getHeadOrValue = R.when(R.is(Array), R.head)

/**
 * @deprecated
 * Adjust a given icon class
 * @function
 * @returns {function} A function that returns an icon that matches CAVE
 * standards.
 * @private
 */
export const toIconInstance = (IconClass, className) => (
  <IconClass className={className} size={36} />
)
toIconInstance.propTypes = {
  className: PropTypes.string,
  IconClass: PropTypes.node,
}

export const parseArray = (input) => {
  var s = input
  // remove leading [ and trailing ] if present
  if (input[0] === '[') {
    s = R.drop(1, s)
  }
  if (R.last(input) === ']') {
    s = R.dropLast(1, s)
  }
  // create an arrray, splitting on every ,
  var items = s.split(',')
  return R.map(R.trim)(items)
}

export const calculateStatSingleGroup = (statistics) => {
  const parser = new Parser()
  return (groupBy, calculation) =>
    R.pipe(
      R.flip(R.groupBy)(statistics),
      R.map((group) => {
        // define groupSum for each group
        const preSummed = {}
        parser.functions.groupSum = (statName) => {
          // groupSum only works for non-derived stats
          // dont recalculate sum for each stat
          if (R.isNil(R.prop(statName, preSummed))) {
            preSummed[statName] = R.sum(
              R.map(R.path(['values', statName]), group)
            )
          }
          return R.prop(statName, preSummed)
        }
        const calculated = group.map((obj) => {
          try {
            return parser.parse(calculation).evaluate(
              // evaluate each list item
              R.prop('values', obj)
            )
          } catch {
            // if calculation is malformed return simplified array
            return parseArray(
              parser
                .parse(calculation)
                .simplify(
                  // evaluate each list item
                  R.prop('values', obj)
                )
                .toString()
            )
          }
        })
        return calculated
      })
    )(groupBy)
}

export const calculateStatSubGroup = (statistics) => {
  const parser = new Parser()

  return (groupBy, secondaryGroupBy, calculation) =>
    R.pipe(
      R.flip(R.groupBy)(statistics),
      R.map((group) => R.groupBy(secondaryGroupBy, group)),
      R.map((group) =>
        R.map((subGroup) => {
          // define groupSum for each subGroup
          const preSummed = {}
          parser.functions.groupSum = (statName) => {
            // groupSum only works for non-derived stats
            // dont recalculate sum for each stat
            if (R.isNil(R.prop(statName, preSummed))) {
              preSummed[statName] = R.sum(
                R.map(R.path(['values', statName]), subGroup)
              )
            }
            return R.prop(statName, preSummed)
          }
          return subGroup.map((obj) => {
            try {
              return parser.parse(calculation).evaluate(
                // evaluate each list item
                R.prop('values', obj)
              )
            } catch {
              // if calculation is malformed return simpliefied array
              return parseArray(
                parser
                  .parse(calculation)
                  .simplify(
                    // evaluate each list item
                    R.prop('values', obj)
                  )
                  .toString()
              )
            }
          })
        })(group)
      )
    )(groupBy)
}

// Units will be handled outside the ECMAScript 2020 spec,
// as custom units are not supported by this specification.
// See: https://tc39.es/proposal-unified-intl-numberformat/section6/locales-currencies-tz_proposed_out.html#sec-measurement-unit-identifiers
export const formatNumber = (
  value,
  {
    precision = 2,
    unit,
    unitSpace,
    currency = false,
    trailingZeros = true,
    nilValue = 'N/A',
    locale = DEFAULT_LOCALE,
  }
) => {
  if (value == null) return nilValue

  const valueText = value.toLocaleString(locale, {
    minimumFractionDigits: trailingZeros ? precision : 0,
    maximumFractionDigits: precision,
  })
  // Unless explicitly specified, there should be
  // no space between a currency unit and its value.
  const gap = unitSpace ? ' ' : currency ? '' : unitSpace == null ? ' ' : ''
  return unit
    ? currency
      ? `${unit}${gap}${valueText}`
      : `${valueText}${gap}${unit}`
    : valueText
}

// Adapted from Mike Bostock's:
// https://observablehq.com/@mbostock/localized-number-parsing
export const getLocaleNumberParts = R.memoizeWith(
  String,
  (locale = DEFAULT_LOCALE) => {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
    return {
      group: parts.find((d) => d.type === 'group').value,
      decimal: parts.find((d) => d.type === 'decimal').value,
    }
  }
)
const getLocaleNumberPartsRegEx = R.memoizeWith(String, (locale) => {
  const { group, decimal } = getLocaleNumberParts(locale)
  const numerals = [
    ...new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210),
  ].reverse()

  return {
    group: new RegExp(`[${group}]`, 'g'),
    decimal: new RegExp(`[${decimal}]`),
    numeral: new RegExp(`[${numerals.join('')}]`, 'g'),
    index: new Map(numerals.map((d, i) => [d, i])),
  }
})
export const parseNumber = (numberString, locale = DEFAULT_LOCALE) => {
  const { decimal: decimalRaw } = getLocaleNumberParts(locale)
  const { group, decimal, numeral, index } = getLocaleNumberPartsRegEx(locale)
  const num = numberString
    .trim()
    .replace(group, '')
    .replace(decimal, decimalRaw)
    .replace(numeral, (d) => index.get(d))

  return num ? Number(num) : NaN
}

export const isNumericInputValid = (valueStr, locale = DEFAULT_LOCALE) => {
  const { decimal } = getLocaleNumberParts(locale)
  const pattern = new RegExp(`^(-|\\+)?(0|[1-9]\\d*)?(\\${decimal})?(\\d+)?$`)
  return R.test(pattern)(valueStr)
}

export const getOptimalGridSize = (numColumns, numRows, n) => {
  const r = Math.sqrt(n)
  return numColumns === 'auto' && numRows === 'auto'
    ? {
        numColumns: Math.floor(r),
        numRows: Math.ceil(n / Math.floor(r)),
      }
    : numColumns === 'auto'
    ? {
        numColumns: Math.ceil(n / numRows),
        numRows,
      }
    : numRows === 'auto'
    ? {
        numColumns,
        numRows: Math.ceil(n / numColumns),
      }
    : {
        numColumns,
        numRows,
      }
}

export const getScaledValue = (minVal, maxVal, minScale, maxScale, value) => {
  if (minVal === maxVal) return maxScale
  const clampedVal = R.gt(maxVal, minVal)
    ? R.clamp(minVal, maxVal, value)
    : R.clamp(maxVal, minVal, value)
  const pctVal = (clampedVal - minVal) / (maxVal - minVal)
  return pctVal * (maxScale - minScale) + minScale
}

export const getScaledArray = (minVal, maxVal, minArray, maxArray, value) => {
  if (minVal === maxVal) return maxArray
  const clampedVal = R.gt(maxVal, minVal)
    ? R.clamp(minVal, maxVal, value)
    : R.clamp(maxVal, minVal, value)
  const pctVal = (clampedVal - minVal) / (maxVal - minVal)
  return minArray.map((min, index) => pctVal * (maxArray[index] - min) + min)
}

export const getChartItemColor = (theme, colorIndex) =>
  CHART_PALETTE[theme][colorIndex % CHART_PALETTE[theme].length]

/**
 * Converts a d3-color RGB object into a conventional RGBA array.
 * @function
 * @param {Object} rgbObj - The d3-color RGB object.
 * @returns {Array} A RGBA equivalent array of the given color.
 * @private
 */
const rgbObjToRgbaArray = (rgbObj) =>
  R.append(
    R.prop('opacity')(rgbObj) * 255, // Alpha
    R.props(['r', 'g', 'b'])(rgbObj) // RGB array
  )

export const rgbStrToArray = (rgbStr) => rgbObjToRgbaArray(color(rgbStr))

export const getScaledColor = R.curry((colorDomain, colorRange, value) => {
  const getColor = scaleLinear()
    .domain(colorDomain)
    .range(colorRange)
    .clamp(true)
  return rgbObjToRgbaArray(color(getColor(value)))
})

export const getContrastYIQ = (rgbArray) => {
  const yiq = (rgbArray[0] * 299 + rgbArray[1] * 587 + rgbArray[2] * 114) / 1000
  return yiq >= 128 ? [0, 0, 0] : [255, 255, 255]
}

export const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}
export const removeExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...R.omit(extraProps, Component.props)} />
}

export const fetchIcon = async (iconName, iconUrl = DEFAULT_ICON_URL) => {
  const prefixLength = R.cond([
    [R.pipe(R.take(5), R.equals(iconPrefix.IONICONS_FOUR)), R.always(5)],
    [R.pipe(R.take(3), R.equals(iconPrefix.VS_CODE_ICONS)), R.always(3)],
    [R.T, R.always(2)],
  ])(iconName)
  const lib = R.toLower(R.take(prefixLength, iconName))

  const cache = await caches.open('icons')
  const url = `${iconUrl}/${lib}/${iconName}.js`
  const response = await cache.match(url)
  // If not in cache, fetch from cdn
  if (R.isNil(response)) {
    await cache.add(url)
    const nowCached = await cache.match(url)
    const item = await nowCached.json()
    return GenIcon(item)
  } else {
    const item = await response.json()
    return GenIcon(item)
  }
}

export const getStatusIcon = (color) => {
  const IconClass = R.cond([
    [R.equals('error'), BiError],
    [R.equals('info'), BiInfoCircle],
    [R.equals('success'), BiCheckCircle],
    [R.equals('warning'), BiError],
    [R.equals(R.T), null],
  ])(color)
  return IconClass ? IconClass : null
}

export const mapIndexed = R.addIndex(R.map)

export const getMinMax = R.converge(R.pair, [
  R.reduce(R.min, Infinity),
  R.reduce(R.max, -Infinity),
])

const fromZeroToOne = (x) => x >= 0 && x < 1

/**
 * Gets a new range in which the given bounds `valueMin` and `valueMax` are
 * adjusted in terms of a given percentage to match the closest numbers
 * below and above the given limits. The minimum number will remain
 * unchanged if it is a multiple of ten.
 * @function
 * @param {number} valueMin The upper bound for the new minimum value.
 * @param {number} valueMax The lower bound for the new maximum value.
 * @example
 * // returns [0.02, 0.08]
 * adjustMinMax(0, 0.1)
 * // returns [0, 8]
 * adjustMinMax(1, 6)
 * @example
 * // returns [0, 12]
 * adjustMinMax(0, 10)
 * @returns {number[]} An array containing the new estimated bounds.
 * @private
 */
export const adjustMinMax = (valueMin, valueMax, adjustPct = 0.2) =>
  fromZeroToOne(Math.abs(valueMin)) && fromZeroToOne(Math.abs(valueMax))
    ? [
        valueMin > 0 ? valueMin * (1 - adjustPct) : 0,
        valueMax * (1 + adjustPct),
      ]
    : [
        valueMin % 10 > 0 ? Math.floor(valueMin * (1 - adjustPct)) : valueMin,
        Math.ceil(valueMax * (1 + adjustPct)),
      ]

/**
 * Creates a list of all values that a given internal
 * key can take within a given object.
 */
export const getAllValuesForKey = R.curry((prop, obj, acc = []) =>
  R.pipe(
    R.mapObjIndexed((value, key) =>
      R.is(Object)(value)
        ? getAllValuesForKey(prop, value, acc)
        : prop === key
        ? R.append(value)(acc)
        : acc
    ),
    R.values,
    R.unnest
  )(obj)
)

export const toListWithKey = (key) =>
  R.pipe(
    R.mapObjIndexed((v, k) => R.assoc(key, k)(v)),
    R.values
  )

export const sortedListById = R.pipe(
  toListWithKey('id'),
  R.sortBy(R.prop('id'))
)

export const sortByOrderNameId = R.sortWith([
  // Infinity due to the fact that non-existent
  // `order` props move items forward in the list
  R.ascend(R.propOr(Infinity, 'order')),
  R.ascend(R.prop('name')),
  R.ascend(R.prop('id')),
])

/**
 * list - a list of items with 'order' props to specify their position in the
 * list.
 * @returns {Array} An ascending list that contains the items sorted first
 * followed by the rest of the items without an `order` prop in alphabetical
 * `order`.
 * @private
 */
export const customSort = R.pipe(toListWithKey('id'), sortByOrderNameId)

export const getCategoryItems = R.cond([
  [
    R.has('nestedStructure'),
    R.pipe(R.prop('nestedStructure'), customSort, R.pluck('id')),
  ],
  // The category value has not been loaded yet or is empty
  [R.isEmpty, R.always([])],
  // `nestedStructure` must be specified
  [
    R.T,
    () => {
      // This should be part of a full validation mechanism for the data struct
      throw Error('Missing the `nestedStructure` property')
    },
    // Optionally, we might want to retrieve the level names from the data
    // R.pipe(R.prop('data'), R.values, R.head, R.keys)
  ],
])

export const filterItems = (items, acceptableFilterCategories) =>
  R.filter((item) =>
    R.all((object) =>
      R.any(
        (item) => acceptableFilterCategories[object[0]].has(item),
        object[1]
      )
    )(R.toPairs(R.prop('category', item)))
  )(items)

// sorts sub objects in obj by order prop - ascending
export const sortProps = (obj) => {
  const sortBy = (a, b) =>
    R.pathOr(0, [a, 'order'], obj) - R.pathOr(0, [b, 'order'], obj)
  return R.pipe(
    R.keys,
    R.sort(sortBy),
    R.reduce((res, key) => R.assoc(key, obj[key], res), {})
  )(obj)
}

export const getSliderMarks = R.curry(
  (min, max, numMarks, getLabelFormat, extraValues = []) =>
    R.pipe(
      R.unfold((value) =>
        value > max ? false : [value, value + (max - min) / (numMarks - 1)]
      ),
      R.concat(extraValues),
      R.map(R.applySpec({ value: R.identity, label: getLabelFormat }))
    )(min)
)

export const getQuartilesData = R.mapObjIndexed(
  R.pipe(R.values, R.sort(R.comparator(R.lt)), getQuantiles(5))
)

// checks that range is either min/max or list of strings
export const checkValidRange = R.pipe(
  R.mapObjIndexed((value, key) =>
    key === 'min' || key === 'max'
      ? R.is(Number, value)
      : key === 'startGradientColor' || key === 'endGradientColor'
      ? R.is(Object, value)
      : R.is(String, value)
  ),
  R.values,
  R.all(R.identity)
)

export const getTimeValue = (timeIndex) =>
  R.when(
    R.prop('timeObject'), // check that this is time object
    R.path(['value', timeIndex])
  )

export const serializeNumLabel = (numLabel, precision) =>
  numLabel === Infinity || numLabel === -Infinity
    ? 'NaN'
    : (+numLabel).toPrecision(precision ?? 3)

export const countDigits = (num) =>
  num === 0 ? 1 : Math.floor(Math.log10(Math.abs(num))) + 1

export const getDecimalScaleFactor = R.pipe(
  Math.abs,
  R.cond([
    [R.lte(1e9), R.always(9)],
    [R.lte(1e6), R.always(6)],
    [R.lte(1e3), R.always(3)],
    [R.T, R.always(0)],
  ]),
  (n) => Math.pow(10, n)
)

export const getDecimalScaleLabel = R.pipe(
  Math.abs,
  R.cond([
    [R.lte(1e9), R.always('billions')],
    [R.lte(1e6), R.always('millions')],
    [R.lte(1e3), R.always('thousands')],
  ])
)

export const capitalize = R.when(
  R.isNotNil,
  R.converge(R.concat, [R.pipe(R.head, R.toUpper), R.pipe(R.toLower, R.tail)])
)
