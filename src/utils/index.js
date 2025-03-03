import { colord } from 'colord'
import { quantileSorted } from 'd3-array'
import * as R from 'ramda'
import { GenIcon } from 'react-icons'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import { colorGen } from './ColorGen'
import {
  DEFAULT_ICON_URL,
  ICON_RESOLUTION,
  MAX_MEMOIZED_CHARTS,
} from './constants'
import { propId, scaleId } from './enums'
import { getScaledValueAlt } from './scales'

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

// given a path of arc points adjust them to ensure proper wrapping around the anti-meridian
export const adjustArcPath = (path) => {
  const idicies = R.range(1, path.length)
  let lastCoord = R.path([0, 0])(path)
  const adjustedCoords = R.map((index) => {
    const x = path[index][0]

    const dx = x - lastCoord

    lastCoord = dx >= 180 ? x - 360 : dx <= -180 ? x + 360 : x
    return [lastCoord, path[index][1]]
  })(idicies)

  return R.prepend(path[0], adjustedCoords)
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
  R.pathOr(subItem, [item, 'levels', subItem, 'name'])(data)
)

export const getColoringFn = R.curry((data, item, subItem) =>
  R.pathOr({}, [item, 'levels', subItem, 'coloring'])(data)
)

export const findColoring = (name, colors) => {
  const smallestName = R.pipe(R.split(' \u279D '), R.head)(name)
  return R.prop(smallestName, colors)
}
export const getFreeName = (name, namesList) => {
  const namesSet = new Set(namesList)
  if (!namesSet.has(name)) return name

  const match = name.match(/ \((\d+)\)$/)

  if (match) {
    const baseName = name.slice(0, match.index)
    let count = Number(match[1]) + 1
    while (namesSet.has(`${baseName} (${count})`)) count++
    return `${baseName} (${count})`
  }

  let count = 1
  while (namesSet.has(`${name} (${count})`)) count++
  return `${name} (${count})`
}

export const eitherBoolOrNotNull = (value) =>
  typeof value === 'boolean' ? value : value != null

export const getHeadOrValue = R.when(R.is(Array), R.head)

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

/**
 * True if the value satisfies the condition, false otherwise. If condition is not
 * one of the expected options, returns true.
 *
 * @param {number} value
 * @param {'eq' | 'gt' | 'gte' | 'lt' | 'lte'} condition
 * @param {number} filterValue
 * @returns {boolean}
 */
const checkIfValueSatisfiesCondition = (value, condition, filterValue) =>
  R.cond([
    [R.equals('eq'), R.always(R.equals(value, filterValue))],
    [R.equals('gt'), R.always(R.gt(value, filterValue))],
    [R.equals('gte'), R.always(R.gte(value, filterValue))],
    [R.equals('lt'), R.always(R.lt(value, filterValue))],
    [R.equals('lte'), R.always(R.lte(value, filterValue))],
    [R.T, R.T],
  ])(condition)

const doesFeatureSatisfyFilter = (filterObj, featureObj) => {
  const prop = R.prop('prop', filterObj)
  const filterValue = R.prop('value', filterObj)
  const type = R.path(['props', prop, 'type'], featureObj)
  const value = R.path(['values', prop], featureObj)
  const option = R.prop('option', filterObj)

  if (type === 'selector') {
    if (R.isNotNil(option)) {
      if (option === 'exc') {
        return !R.any(R.flip(R.includes)(value), filterValue)
      } else if (option === 'inc') {
        return !R.none(R.flip(R.includes)(value), filterValue)
      }
    } else {
      return R.all(R.pipe(R.flip(R.includes)(value), R.not), filterValue)
    }
  } else if (type === 'num' && option !== 'eq') {
    return checkIfValueSatisfiesCondition(value, option, filterValue)
  } else {
    return filterValue === value
  }

  return true
}

const doesFeatureSatisfyGroup = (groupId, logic, filters, featureObj) => {
  const children = filters.filter((filt) => filt.parentGroupId === groupId)
  if (R.isEmpty(children)) return true
  const filterResults = children.map((child) => {
    return child.type === 'rule'
      ? doesFeatureSatisfyFilter(child, featureObj)
      : doesFeatureSatisfyGroup(child.groupId, child.logic, filters, featureObj)
  })
  return logic === 'and'
    ? R.all(Boolean, filterResults)
    : R.any(Boolean, filterResults)
}

export const filterMapFeature = (filters, featureObj) => {
  const rootGroup = filters.find((filter) => filter.groupId === 0)
  return doesFeatureSatisfyGroup(
    0,
    rootGroup ? rootGroup.logic : 'and',
    filters,
    featureObj
  )
}

const checkIfStatSatisfiesFilter = (statistics, groupingIndices, i, filter) => {
  const valueLists = R.prop('valueLists', statistics)
  const format = R.propOr('stat', 'format', filter)
  const prop = R.prop('prop', filter)
  const filterValue = R.prop('value', filter)
  const data = R.path([format, 'data'], groupingIndices)
  const value =
    format === 'stat'
      ? R.path([prop, i], valueLists)
      : R.path(
          [
            prop,
            R.path(['id', R.path(['groupLists', format, i], statistics)], data),
          ],
          data
        )
  const option = R.prop('option', filter)

  if (format !== 'stat') {
    return R.isNotNil(option)
      ? !R.any(R.flip(R.includes)(value), filterValue)
      : !R.all(R.pipe(R.equals(value), R.not), filterValue)
  } else if (R.isNotNil(option)) {
    return checkIfValueSatisfiesCondition(value, option, filterValue)
  }

  return true
}

export const filterGroupedOutputs = (statistics, filters, groupingIndices) => {
  const valueLists = R.prop('valueLists', statistics)
  const indicies = R.pipe(R.values, R.head, R.length)(valueLists)
  const indiciesBuffer = window.crossOriginIsolated
    ? new SharedArrayBuffer(0, { maxByteLength: indicies * 4 })
    : new ArrayBuffer(0, { maxByteLength: indicies * 4 })
  const indiciesView = new Uint32Array(indiciesBuffer)
  const filterFunc = R.curry(checkIfStatSatisfiesFilter)(
    statistics,
    groupingIndices
  )

  // fill and grow indicies buffer with filtered values
  for (let i = 0; i < indicies; i++) {
    if (R.all(R.curry(filterFunc)(i), filters)) {
      window.crossOriginIsolated
        ? indiciesBuffer.grow(indiciesView.byteLength + 4)
        : indiciesBuffer.resize(indiciesView.byteLength + 4)
      indiciesView[indiciesView.length - 1] = i
    }
  }

  return indiciesBuffer
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
export const recursiveBubbleMap = R.curry(
  (endPredicate, endCallback, stepCallback, bubbleCallback, mappable) =>
    endPredicate(mappable)
      ? endCallback(mappable)
      : bubbleCallback(
          R.map(
            (val) =>
              recursiveBubbleMap(
                endPredicate,
                endCallback,
                stepCallback,
                bubbleCallback,
                val
              ),
            stepCallback(mappable)
          )
        )
)
const mergeObjIntoList = (obj, baseList) =>
  R.reduce((acc, key) => {
    if (isNaN(key)) throw new Error('Can only merge integer keys into list')
    else return R.update(key, obj[key], acc)
  }, baseList)(R.keys(obj))

// Merge 2 objects with obj2 overwriting obj1, or inidivual list indicies within it
const mergeListRight = (obj1, obj2) =>
  R.reduce(
    (acc, key) =>
      R.type(obj2[key]) === 'Object'
        ? R.assoc(key, mergeObjIntoList(obj2[key], acc[key]), acc)
        : R.assoc(key, obj2[key], acc),
    obj1
  )(R.keys(obj2))

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

export const getOptimalGridSize = (
  numRows,
  numColumns,
  numItems,
  maxDimRow,
  maxDimColumn
) => {
  const closestSquare = Math.sqrt(numItems)
  const [rows, columns] =
    numColumns === 'auto' && numRows === 'auto'
      ? maxDimRow > 0 && maxDimColumn > 0
        ? // Some `column`s/`row`s are specified in the layout
          [maxDimRow, maxDimColumn]
        : maxDimRow < 1 && maxDimRow < 1
          ? // No `column` or `row` spec was found in the layout
            [Math.ceil(closestSquare), Math.floor(closestSquare)]
          : maxDimRow < 1
            ? [Math.ceil(numItems / numColumns), maxDimColumn]
            : [maxDimRow, Math.ceil(numItems / numRows)] // if maxDimColumn < 1
      : numColumns === 'auto'
        ? [numRows, Math.max(Math.ceil(numItems / numRows), maxDimColumn)]
        : numRows === 'auto'
          ? [Math.max(Math.ceil(numItems / numColumns), maxDimRow), numColumns]
          : [numRows, numColumns]

  const gridSize = rows * columns
  if (numItems <= gridSize) return [rows, columns]

  const maxDimension = Math.max(columns, rows)
  if (closestSquare < maxDimension) {
    const newDimension = Math.ceil((numItems - gridSize) / maxDimension)
    return rows === maxDimension
      ? [rows, columns + newDimension]
      : [rows + newDimension, columns]
  }

  return rows === maxDimension
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

export const getChartItemColor = (name) => {
  const color = colorGen(name)
  return color
}

export const rgbStrToArray = (str) => str.match(/[.\d]+/g)

export const getColorString = (rawColor) => colord(rawColor).toRgbString()

export const getContrastText = (bgColor) => {
  const background = colord(bgColor).rgba
  // luminance is calculated using the formula provided in WCAG 2.0 guidelines,
  // a specific weighted sum of the RGB values of the color
  const luminance =
    0.2126 * Math.pow(background.r / 255, 2.2) +
    0.7152 * Math.pow(background.g / 255, 2.2) +
    0.0722 * Math.pow(background.b / 255, 2.2)
  // Using 0.179 threshold from the WCAG guidelines instead of 0.5 for better contrast
  return luminance > 0.179 ? 'black' : 'white'
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
export const adjustMinMax = (valueMin, valueMax, adjustPct = 0.05) =>
  fromZeroToOne(Math.abs(valueMin)) && fromZeroToOne(Math.abs(valueMax))
    ? [
        valueMin > 0 ? 0 : valueMin * (1 + adjustPct),
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
  R.sortWith([
    // BUG: Doesn't work for something like row3Col1 and row2Col1
    // (a, b) => R.length(a.id) - R.length(b.id),
    // If the length is the same, compare by alphabetical order
    R.ascend(R.prop('id')),
  ])
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
  [R.has('levels'), R.pipe(R.prop('levels'), withIndex, R.pluck('id'))],
  // The category value has not been loaded yet or is empty
  [R.isEmpty, R.always([])],
  // `levels` must be specified
  [
    R.T,
    () => {
      // This should be part of a full validation mechanism for the data struct
      throw Error('Missing the `levels` property')
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

export const getQuartiles = R.ifElse(
  R.isNil,
  R.always(R.repeat(NaN, 5)),
  R.pipe(R.sort(R.comparator(R.lt)), getQuantiles(5))
)

export const ALLOWED_RANGE_KEYS = [
  'timeValues',
  'gradient',
  'min',
  'max',
  'options',
  'fallback',
]

// checks that range is either min/max or list of strings
export const checkValidRange = R.pipe(
  R.mapObjIndexed((value, key) =>
    key === 'min' || key === 'max'
      ? R.is(Number, value)
      : R.includes(key, ALLOWED_RANGE_KEYS) || R.is(String, value)
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
        ? mergeListRight(d, R.pathOr({}, ['timeValues', timeIndex], d))
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

export const customSortByX = R.curry((orderings, data) => {
  const itemDepth = R.pipe(
    R.head,
    R.propOr('', 'name'),
    R.split(' \u279D '),
    R.length
  )(data)
  // Sort by the predefined `ordering` list
  const sortByPredef = (depth) =>
    R.ascend(
      R.pipe(
        R.prop('name'),
        R.split(' \u279D '),
        R.prop(depth),
        R.indexOf(R.__, orderings[depth] ?? []),
        // If not found in `ordering`, move to the end
        R.when(R.equals(-1), R.always(Infinity))
      )
    )
  return R.sortWith([
    ...R.reverse(R.map(sortByPredef, R.range(0, itemDepth))),
    R.ascend(R.prop('name')),
  ])(data)
})

export const cleanUndefinedStats = (chartObj) => {
  const stats = R.pathOr([], ['stats'], chartObj)
  const transformations = {
    stats: R.dropLast(1),
  }
  const reduced_chart = R.isNil(R.last(stats))
    ? R.evolve(transformations, chartObj)
    : chartObj

  return R.any(R.isNil)(reduced_chart['stats'])
    ? R.pipe(R.assoc('stats', []), R.assoc('dataset', ''))(reduced_chart)
    : reduced_chart
}

export const getNumActiveFilters = R.count(
  R.both(R.propOr(true, 'active'), R.propEq('rule', 'type'))
)

// REVIEW: Change to a selector?
export const parseGradient = R.memoizeWith(
  ([attrKey, precision, parseRangeAsNumber, range]) =>
    JSON.stringify({ attrKey, precision, parseRangeAsNumber, range }),
  R.curry((attrKey, precision = 2, parseRangeAsNumber = false) => (range) => {
    // Avoid negative exponents to prevent floating-point precision issues
    const minPositiveValue = 1 / Math.pow(10, precision)
    return R.ifElse(
      R.pipe(R.propOr({}, 'gradient'), R.isNotEmpty),
      R.pipe(
        R.path(['gradient', 'data']),
        R.filter(R.has(attrKey)),
        R.applySpec({
          [`${attrKey}s`]: R.map(
            R.pipe(
              R.prop(attrKey),
              R.when(R.always(parseRangeAsNumber), parseFloat)
            )
          ),
          rawValues: R.map(
            R.pipe(
              R.prop('value'),
              R.cond([
                [R.equals('min'), R.always(range?.min)],
                [R.equals('max'), R.always(range?.max)],
                [R.T, R.identity],
              ])
            )
          ),
          labels: R.pluck('label'),
        }),
        R.converge(R.mergeLeft, [
          R.pipe(
            R.propOr([], 'rawValues'),
            R.when(
              R.always(range?.gradient?.scale === scaleId.LOG),
              R.map(R.when(R.gte(0), R.always(minPositiveValue)))
            ),
            R.objOf('values')
          ),
          R.identity,
        ])
      ),
      R.always({ [`${attrKey}s`]: [], rawValues: [], values: [], labels: [] })
    )(range)
  })
)

export const constructFetchedGeoJson = (
  matchingKeysByTypeFunc,
  itemRange,
  enabledItemsFunc,
  legendNumberFormatFunc,
  types,
  cacheName
) =>
  maxSizedMemoization(
    R.identity,
    async (mapId) => {
      const enabledItems = enabledItemsFunc(mapId)
      const itemNames = R.keys(R.filter(R.identity, enabledItems))

      const fetchCache = async () => {
        const cache = await caches.open(cacheName)
        const items = {}
        for (let itemName of itemNames) {
          const url = R.pathOr('', [itemName, 'geoJson', 'geoJsonLayer'], types)
          // Special catch for empty urls on initial call
          if (url === '') {
            continue
          }
          let response = await cache.match(url)
          // add to cache if not found
          if (R.isNil(response)) {
            await cache.add(url)
            response = await cache.match(url)
          }
          items[itemName] = await response.json()
        }
        return items
      }
      return fetchCache().then((selecteditems) =>
        R.pipe(
          R.map(
            R.pipe(
              R.mapObjIndexed((geoObj, geoJsonValue) => {
                const geoJsonProp = R.path(['geoJson', 'geoJsonProp'])(geoObj)
                const geoType = geoObj.type
                const geoId = geoObj.data_key
                const filteredFeature = R.find(
                  (feature) =>
                    R.path(['properties', geoJsonProp])(feature) ===
                    geoJsonValue
                )(R.pathOr({}, [geoType, 'features'])(selecteditems))

                const filters = R.pipe(
                  R.pathOr([], [geoObj.type, 'filters']),
                  R.reject(R.propEq(false, 'active'))
                )(enabledItems)
                if (
                  R.isNil(filteredFeature) &&
                  R.isNotEmpty(
                    R.pathOr({}, [geoType, 'features'])(selecteditems)
                  )
                ) {
                  console.warn(
                    `No feature with ${geoJsonValue} for property ${geoJsonProp}`
                  )
                  return false
                } else if (!filterMapFeature(filters, geoObj)) return false

                const colorBy = enabledItems[geoObj.type].colorBy
                const colorRange = itemRange(geoObj.type, colorBy, mapId)
                const colorByPropVal = R.pipe(
                  R.path(['values', colorBy]),
                  R.when(R.isNil, R.always('')),
                  (s) => s.toString()
                )(geoObj)
                const colorFallback = R.pathOr(
                  '#000',
                  ['fallback', 'color'],
                  colorRange
                )
                const colorByProp = R.path(['props', colorBy], geoObj)
                const colorByPrecision =
                  legendNumberFormatFunc(colorByProp).precision
                const parsedColor = parseGradient(
                  'color',
                  colorByPrecision
                )(colorRange)

                const isColorCategorical = colorByProp.type !== propId.NUMBER
                const rawColor =
                  colorByPropVal === ''
                    ? colorFallback
                    : isColorCategorical
                      ? R.pathOr(getChartItemColor(colorByPropVal), [
                          'options',
                          colorByPropVal,
                          'color',
                        ])(colorRange)
                      : getScaledValueAlt(
                          parsedColor.values,
                          parsedColor.colors,
                          parseFloat(colorByPropVal),
                          colorRange.gradient.scale,
                          colorRange.gradient.scaleParams
                        )

                const heightBy = enabledItems[geoObj.type].heightBy
                const heightRange = itemRange(geoObj.type, heightBy, mapId)
                const heightByPropVal = geoObj.values[heightBy]
                const defaultHeight =
                  R.has('startHeight', geoObj) && R.has('endHeight', geoObj)
                    ? '100'
                    : '0'
                const heightFallback = R.pathOr(
                  defaultHeight,
                  ['fallback', 'height'],
                  heightRange
                )
                const heightByProp = R.pathOr({}, ['props', heightBy], geoObj)
                const heightByPrecision =
                  legendNumberFormatFunc(heightByProp).precision
                const parsedHeight = parseGradient(
                  'height',
                  heightByPrecision,
                  true
                )(heightRange)

                const isHeightCategorical = heightByProp.type !== propId.NUMBER
                const rawHeight =
                  heightByPropVal == null
                    ? heightFallback
                    : isHeightCategorical
                      ? R.pathOr('0', ['options', heightByPropVal, 'height'])(
                          heightRange
                        )
                      : getScaledValueAlt(
                          parsedHeight.values,
                          parsedHeight.heights,
                          parseFloat(heightByPropVal),
                          heightRange.gradient.scale,
                          heightRange.gradient.scaleParams
                        )

                // don't calculate size, dash, or adjust path for geos
                if (cacheName === 'geo')
                  return R.mergeRight(filteredFeature, {
                    properties: {
                      cave_name: JSON.stringify([geoType, geoId]),
                      cave_obj: geoObj,
                      color: getColorString(rawColor),
                      height: parseFloat(rawHeight),
                    },
                  })

                const sizeBy = enabledItems[geoObj.type].sizeBy
                const sizeRange = itemRange(geoObj.type, sizeBy, mapId)
                const sizeByPropVal = geoObj.values[sizeBy]
                const sizeFallback = R.pathOr(
                  '0',
                  ['fallback', 'size'],
                  sizeRange
                )
                const sizeByProp = R.path(['props', sizeBy], geoObj)
                const sizeByPrecision =
                  legendNumberFormatFunc(sizeByProp).precision
                const parsedSize = parseGradient(
                  'size',
                  sizeByPrecision,
                  true
                )(sizeRange)

                const isSizeCategorical = sizeByProp.type !== propId.NUMBER
                const rawSize =
                  sizeByPropVal == null
                    ? sizeFallback
                    : isSizeCategorical
                      ? R.pathOr('0', ['options', sizeByPropVal, 'size'])(
                          sizeRange
                        )
                      : getScaledValueAlt(
                          parsedSize.values,
                          parsedSize.sizes,
                          parseFloat(sizeByPropVal),
                          sizeRange.gradient.scale,
                          sizeRange.gradient.scaleParams
                        )

                const dashPattern = enabledItems[geoType].lineStyle ?? 'solid'

                if (parseFloat(rawSize) === 0 || colord(rawColor).alpha() === 0)
                  return false

                const adjustedFeature = R.assocPath(
                  ['geometry', 'coordinates'],
                  adjustArcPath(
                    R.pathOr([], ['geometry', 'coordinates'])(filteredFeature)
                  )
                )(filteredFeature)

                return R.mergeRight(adjustedFeature, {
                  properties: {
                    cave_name: JSON.stringify([geoType, geoId]),
                    cave_obj: geoObj,
                    dash: dashPattern,
                    color: getColorString(rawColor),
                    size: parseFloat(rawSize),
                    height: parseFloat(rawHeight),
                  },
                })
              }),
              R.values,
              R.filter(R.identity)
            )
          ),
          R.values,
          R.unnest
        )(matchingKeysByTypeFunc(mapId))
      )
    },
    MAX_MEMOIZED_CHARTS
  )

export const constructGeoJson = (
  itemRange,
  itemDataFunc,
  legendObjectsFunc,
  geometryFunc,
  legendNumberFormatFunc,
  type
) =>
  maxSizedMemoization(
    R.identity,
    (mapId) =>
      R.pipe(
        R.map((obj) => {
          const [id, item] = obj
          const legendObj = legendObjectsFunc(mapId)[item.type]
          const filters = R.pipe(
            R.propOr([], 'filters'),
            R.reject(R.propEq(false, 'active'))
          )(legendObj)
          if (!filterMapFeature(filters, item)) return false

          const { colorBy } = legendObj
          const colorByPropVal = R.pipe(
            R.path(['values', colorBy]),
            R.when(R.isNil, R.always('')),
            (s) => s.toString()
          )(item)
          const colorRange = itemRange(item.type, colorBy, mapId)
          const colorFallback = R.pathOr(
            '#000',
            ['fallback', 'color'],
            colorRange
          )
          const colorByProp = R.path(['props', colorBy], item)
          const colorByPrecision = legendNumberFormatFunc(colorByProp).precision
          const parsedColor = parseGradient(
            'color',
            colorByPrecision
          )(colorRange)

          const isColorCategorical = colorByProp.type !== propId.NUMBER
          const rawColor =
            colorByPropVal === ''
              ? colorFallback
              : isColorCategorical
                ? R.pathOr(getChartItemColor(colorByPropVal), [
                    'options',
                    colorByPropVal,
                    'color',
                  ])(colorRange)
                : getScaledValueAlt(
                    parsedColor.values,
                    parsedColor.colors,
                    parseFloat(colorByPropVal),
                    colorRange.gradient.scale,
                    colorRange.gradient.scaleParams
                  )

          let rawSize

          if (type === 'node' || type === 'arc') {
            const { sizeBy } = legendObj
            const sizeRange = itemRange(item.type, sizeBy, mapId)
            const sizeByPropVal = item.values[sizeBy]
            const sizeFallback = R.pathOr('0', ['fallback', 'size'], sizeRange)
            const sizeByProp = R.path(['props', sizeBy], item)
            const sizeByPrecision = legendNumberFormatFunc(sizeByProp).precision
            const parsedSize = parseGradient(
              'size',
              sizeByPrecision,
              true
            )(sizeRange)

            const isSizeCategorical = sizeByProp.type !== propId.NUMBER
            rawSize =
              sizeByPropVal == null
                ? sizeFallback
                : isSizeCategorical
                  ? R.pathOr('0', ['options', sizeByPropVal, 'size'])(sizeRange)
                  : getScaledValueAlt(
                      parsedSize.values,
                      parsedSize.sizes,
                      parseFloat(sizeByPropVal),
                      sizeRange.gradient.scale,
                      sizeRange.gradient.scaleParams
                    )
          }
          if (rawSize === 0 || colord(rawColor).alpha() === 0) return false

          let rawHeight

          if (type === 'geo' || type === 'arc') {
            const { heightBy } = legendObj
            const heightRange = itemRange(item.type, heightBy, mapId)
            const heightByPropVal = item.values[heightBy]
            const defaultHeight =
              R.has('startHeight', item) && R.has('endHeight', item)
                ? '100'
                : '0'
            const heightFallback = R.pathOr(
              defaultHeight,
              ['fallback', 'height'],
              heightRange
            )
            const heightByProp = R.pathOr({}, ['props', heightBy], item)
            const heightByPrecision =
              legendNumberFormatFunc(heightByProp).precision
            const parsedHeight = parseGradient(
              'height',
              heightByPrecision,
              true
            )(heightRange)

            const isHeightCategorical = heightByProp.type !== propId.NUMBER
            rawHeight =
              heightByPropVal == null
                ? heightFallback
                : isHeightCategorical
                  ? R.pathOr('0', ['options', heightByPropVal, 'height'])(
                      heightRange
                    )
                  : getScaledValueAlt(
                      parsedHeight.values,
                      parsedHeight.heights,
                      parseFloat(heightByPropVal),
                      heightRange.gradient.scale,
                      heightRange.gradient.scaleParams
                    )
          }

          return {
            type: 'Feature',
            properties: {
              cave_obj: item,
              cave_name: JSON.stringify([item.type, id]),
              color: getColorString(rawColor),
              ...(R.isNotNil(rawHeight) && { height: parseFloat(rawHeight) }),
              ...(R.isNotNil(rawSize) && {
                size:
                  type === 'node'
                    ? parseFloat(rawSize) / ICON_RESOLUTION
                    : parseFloat(rawSize),
              }),
              ...(type === 'node' && { icon: legendObj.icon }),
              ...(type === 'arc' && {
                dash: R.propOr('solid', 'lineStyle')(legendObj),
              }),
            },
            geometry: geometryFunc(item),
          }
        }),
        R.values,
        R.filter(R.identity)
      )(itemDataFunc(mapId)),
    MAX_MEMOIZED_CHARTS
  )
