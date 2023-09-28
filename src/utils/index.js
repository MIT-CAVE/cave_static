import { quantileSorted } from 'd3-array'
import { color } from 'd3-color'
import { scaleLinear } from 'd3-scale'
import { Parser } from 'expr-eval'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { GenIcon } from 'react-icons'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import { CHART_PALETTE, DEFAULT_ICON_URL } from './constants'

export { default as NumberFormat } from './NumberFormat'

const getQuantiles = R.curry((n, values) => {
  const percentiles = R.times((i) => i / (n - 1), n)
  return R.map((pct) => quantileSorted(values, pct))(percentiles)
})

// Given a list of chart children find all subgroup labels in given order
// Note: If all labels aren't present in at least one parent order is estimated
export const findSubgroupLabels = R.pipe(
  R.map(R.pluck('name')),
  R.map(R.filter(R.isNotNil)),
  R.sortBy(R.pipe(R.length, R.negate)),
  R.unnest,
  R.uniq
)

// checks if paths contains the given path, or a path to one of its parents
export const includesPath = (paths, path) => {
  return R.any((sub) => path.join(',').indexOf(sub.join(',')) === 0)(paths)
}

// simplified combineReducers to allow for localMutation
export const combineReducers = (reducers) => {
  const reducerKeys = R.keys(reducers)
  return (state = {}, action) => {
    let hasChanged = false
    const nextState = structuredClone(state)
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
export const getGroupLabelFn = R.curry((data, item) =>
  R.pathOr(R.last(item), [...item, 'name'])(data)
)
export const getLabelFn = R.curry((data, item) =>
  R.pathOr(item, [item, 'name'])(data)
)
export const getSubLabelFn = R.curry((data, item, subItem) =>
  R.pathOr(subItem, [item, 'nestedStructure', subItem, 'name'])(data)
)

export const getColoringFn = R.curry((data, item, subItem) =>
  R.pathOr({}, [item, 'nestedStructure', subItem, 'coloring'])(data)
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

export const calculateStatAnyDepth = (statistics) => {
  const parser = new Parser()
  const calculate = (group, calculation) => {
    // define groupSum for each base level group
    const preSummed = {}
    parser.functions.groupSum = (statName) => {
      // groupSum only works for non-derived stats
      // dont recalculate sum for each stat
      if (R.isNil(R.prop(statName, preSummed))) {
        preSummed[statName] = R.sum(
          R.map(
            (idx) => R.path(['valueLists', statName, idx], statistics),
            group
          )
        )
      }
      return R.prop(statName, preSummed)
    }
    return group.map((idx) => {
      const values = R.pipe(R.prop('valueLists'), R.pluck(idx))(statistics)
      try {
        return parser.parse(calculation).evaluate(
          // evaluate each list item
          values
        )
      } catch {
        // if calculation is malformed return simplified array
        return parseArray(
          parser
            .parse(calculation)
            .simplify(
              // evaluate each list item
              values
            )
            .toString()
        )
      }
    })
  }

  const group = (groupBys, calculation, indicies) =>
    R.pipe(
      R.collectBy(R.pipe(R.head(groupBys), R.join(''))),
      R.reduce((acc, value) => {
        const key = R.pipe(R.head, R.head(groupBys), R.head)(value)
        const finalName = R.has(key, acc)
          ? R.pipe(R.head, R.head(groupBys), R.join(', '))(value)
          : key
        return R.assoc(finalName, value, acc)
      }, {}),
      R.length(groupBys) === 1
        ? R.map((group) => calculate(group, calculation))
        : R.map((stats) => group(R.tail(groupBys), calculation, stats))
    )(indicies)

  const indicies = R.pipe(
    R.prop('valueLists'),
    R.values,
    R.head,
    R.length,
    R.range(0)
  )(statistics)

  const groupHelper = (groupBys, calculation) =>
    group(groupBys, calculation, indicies)

  return groupHelper
}

export const recursiveMap = R.curry(
  (endPredicate, endCallback, stepCallback, mappable) =>
    endPredicate(mappable)
      ? endCallback(mappable)
      : R.map(
          (val) => recursiveMap(endPredicate, endCallback, stepCallback, val),
          stepCallback(mappable)
        )
)

export const maxSizedMemoization = (keyFunc, resultFunc, maxCache) => {
  const cache = new Map()
  const checkCache = (val) => {
    const key = keyFunc(val)
    if (!cache.has(key)) {
      cache.set(key, resultFunc(val))
      if (cache.size > maxCache) {
        const remove = cache.keys().next().value
        cache.delete(remove)
      }
    }
    return cache.get(key)
  }
  return checkCache
}

export const getOptimalGridSize = (numRows, numColumns, numItems) => {
  const gridSize = numRows * numColumns
  if (numItems <= gridSize) return [numRows, numColumns]

  const closestSquare = Math.sqrt(numItems)
  const maxDimension = Math.max(numColumns, numRows)
  if (closestSquare < maxDimension) {
    const newDimension = Math.ceil((numItems - gridSize) / maxDimension)
    return numRows === maxDimension
      ? [numRows, numColumns + newDimension]
      : [numRows + newDimension, numColumns]
  }

  return numRows === maxDimension
    ? [Math.ceil(closestSquare), Math.floor(closestSquare)]
    : [Math.floor(closestSquare), Math.ceil(closestSquare)]
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

export const getChartItemColor = (colorIndex) =>
  CHART_PALETTE[colorIndex % CHART_PALETTE.length]

/**
 * Converts a d3-color RGB object into a conventional RGBA array.
 * @function
 * @param {Object} rgbObj - The d3-color RGB object.
 * @returns {Array} A RGBA equivalent array of the given color.
 * @private
 */
const rgbObjToRgbaArray = (rgbObj) => {
  const opacity = R.prop('opacity', rgbObj) * 255
  return R.pipe(R.props(['r', 'g', 'b']), R.append(opacity))(rgbObj)
} // RGBA array

export const rgbStrToArray = (str) => str.match(/[.\d]+/g)
export const getScaledColor = R.curry((colorDomain, colorRange, value) =>
  getScaledRgbObj(colorDomain, colorRange, value)
)

export const getScaledRgbObj = R.curry((colorDomain, colorRange, value) => {
  const getColor = scaleLinear()
    .domain(colorDomain)
    .range(colorRange)
    .clamp(true)
  return rgbObjToRgbaArray(color(getColor(value)))
})

export const addExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...Component.props} {...extraProps} />
}
export const removeExtraProps = (Component, extraProps) => {
  const ComponentType = Component.type
  return <ComponentType {...R.omit(extraProps, Component.props)} />
}

export const fetchIcon = async (iconName, iconUrl = DEFAULT_ICON_URL) => {
  const cache = await caches.open('icons')
  const url = `${iconUrl}/${iconName}.js`
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
 * @param {Object} props Props dictionary
 * @param {Object} values Values dictionary with value for each prop
 * @returns {Object} props with values added
 */
export const addValuesToProps = (props, values) =>
  R.mapObjIndexed((prop, propId) => {
    const value = R.prop(propId, values)
    return R.assoc('value', value, prop)
  }, props)

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

export const withIndex = toListWithKey('id')

export const getCategoryItems = R.cond([
  [
    R.has('nestedStructure'),
    R.pipe(R.prop('nestedStructure'), withIndex, R.pluck('id')),
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

const allowedRangeKeys = [
  'startGradientColor',
  'endGradientColor',
  'nullColor',
  'nullSize',
  'timeValues',
]

// checks that range is either min/max or list of strings
export const checkValidRange = R.pipe(
  R.mapObjIndexed((value, key) =>
    key === 'min' || key === 'max'
      ? R.is(Number, value)
      : R.includes(key, allowedRangeKeys) || R.is(String, value)
  ),
  R.values,
  R.all(R.identity)
)

export const getTimeValue = (timeIndex, object) =>
  recursiveMap(
    (d) => R.type(d) !== 'Object',
    R.identity,
    (d) =>
      R.has('timeValues', d)
        ? R.mergeRight(d, R.pathOr({}, ['timeValues', timeIndex], d))
        : d,
    object
  )

export const orderEntireDict = (object) =>
  recursiveMap(
    (d) => R.type(d) !== 'Object',
    R.identity,
    (d) =>
      R.mergeAll([
        d,
        // sort subkeys alphabetically
        R.pipe(
          R.omit([
            'order',
            ...R.keys(R.propOr({}, 'order')(d)),
            ...R.filter((key) => R.type(d[key]) !== 'Object')(R.keys(d)),
          ]),
          R.mapObjIndexed((subObj, key) =>
            R.reduce((acc, subKey) => {
              acc[subKey] = R.path([key, subKey], d)
              return acc
            }, {})(R.keys(subObj).sort())
          )
        )(d),
        // sort subkeys by order
        R.mapObjIndexed((ordering, key) =>
          R.reduce((acc, subKey) => {
            acc[subKey] = R.path([key, subKey], d)
            return acc
          }, {})(R.uniq([...ordering, ...R.keys(d[key])]))
        )(R.propOr({}, 'order')(d)),
      ]),
    object
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

export const customSortByX = R.curry((ordering, data) => {
  // Sort by the predefined `ordering` list
  const sortByPredef = R.sortBy(
    R.pipe(R.prop('name'), R.indexOf(R.__, ordering))
  )
  // Sort by alphabetical order (ascending)
  const sortByAlpha = R.sortBy(R.prop('name'))
  // Separate the items that appear in `ordering` from the rest
  const sublists = R.partition(
    R.pipe(R.prop('name'), R.includes(R.__, ordering))
  )(data)

  return R.converge(R.concat, [
    R.pipe(R.head, sortByPredef),
    R.pipe(R.last, sortByAlpha),
  ])(sublists)
})
