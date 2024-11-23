import { quantileSorted } from 'd3-array'
import { color } from 'd3-color'
import { scaleLinear } from 'd3-scale'
import * as R from 'ramda'
import { GenIcon } from 'react-icons'
import { BiError, BiInfoCircle, BiCheckCircle } from 'react-icons/bi'

import {
  CHART_PALETTE,
  DEFAULT_ICON_URL,
  ICON_RESOLUTION,
  MAX_MEMOIZED_CHARTS,
} from './constants'

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

const doesFeatureSatisfyFilter = (filterObj, featureObj) => {
  const prop = R.prop('prop', filterObj)
  const filterValue = R.prop('value', filterObj)
  const type = R.path(['props', prop, 'type'], featureObj)
  const value = R.path(['values', prop], featureObj)

  if (type === 'selector') {
    if (R.has('option', filterObj)) {
      if (filterObj.option === 'exc') {
        if (R.any(R.flip(R.includes)(value), filterValue)) {
          return false
        }
      } else if (filterObj.option === 'inc') {
        if (R.none(R.flip(R.includes)(value), filterValue)) {
          return false
        }
      }
    } else {
      if (R.all(R.pipe(R.flip(R.includes)(value), R.not), filterValue)) {
        return false
      }
    }
  } else if (type === 'num' && filterObj['option'] !== 'eq') {
    if (!R.has('option', filterObj)) {
      return true
    }
    return R.prop('option', filterObj) === 'gt'
      ? R.gt(value, filterValue)
      : R.prop('option', filterObj) === 'gte'
        ? R.gte(value, filterValue)
        : R.prop('option', filterObj) === 'lt'
          ? R.lt(value, filterValue)
          : R.lte(value, filterValue)
  } else {
    if (filterValue !== value) {
      return false
    }
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

export const filterGroupedOutputs = (statistics, filters, groupingIndicies) => {
  const valueLists = statistics['valueLists']
  const indicies = R.pipe(
    R.prop('valueLists'),
    R.values,
    R.head,
    R.length
  )(statistics)
  const indiciesBuffer = window.crossOriginIsolated
    ? new SharedArrayBuffer(0, { maxByteLength: indicies * 4 })
    : new ArrayBuffer(0, { maxByteLength: indicies * 4 })
  const indiciesView = new Uint32Array(indiciesBuffer)

  // fill and grow indicies buffer with filtered values
  for (let i = 0; i < indicies; i++) {
    let allow = true
    for (const filterObj of filters) {
      const format = R.propOr('stat', 'format', filterObj)
      const prop = R.prop('prop', filterObj)
      const filterValue = R.prop('value', filterObj)
      const value =
        format === 'stat'
          ? R.path([prop, i], valueLists)
          : groupingIndicies[format]['data'][prop][
              groupingIndicies[format]['data']['id'][
                R.path(['groupLists', format, i], statistics)
              ]
            ]
      if (format !== 'stat') {
        if (R.has('option', filterObj)) {
          if (R.any(R.flip(R.includes)(value), filterValue)) {
            allow = false
          }
        } else {
          if (R.all(R.pipe(R.equals(value), R.not), filterValue)) {
            allow = false
          }
        }
      } else if (filterObj['option'] !== 'eq') {
        return !R.has('option', filterObj)
          ? true
          : R.prop('option', filterObj) === 'gt'
            ? R.gt(value, filterValue)
            : R.prop('option', filterObj) === 'gte'
              ? R.gte(value, filterValue)
              : R.prop('option', filterObj) === 'lt'
                ? R.lt(value, filterValue)
                : R.lte(value, filterValue)
      } else {
        if (filterValue !== value) {
          allow = false
        }
      }
    }
    if (allow) {
      if (window.crossOriginIsolated)
        indiciesBuffer.grow(indiciesView.byteLength + 4)
      else indiciesBuffer.resize(indiciesView.byteLength + 4)
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

/**
 * Scales a value from a given domain to a corresponding value in the specified range.
 * If the input value is outside the domain or invalid, the fallback value is returned.
 *
 * @param {Array<number>} domain - The input domain for scaling (e.g., [min, max]).
 * @param {Array<any>} range - The output range corresponding to the domain (e.g., [start, end]).
 * @param {number} value - The input value to scale.
 * @param {any} [fallback=null] - The fallback value to return if the input is invalid or unknown.
 * @returns {any} The scaled value within the range, or the fallback if the input is invalid.
 */
export const getScaledValueAlt = R.curry(
  (domain, range, value, fallback = null) => {
    const linearScale = scaleLinear()
      .domain(domain)
      .range(range)
      .clamp(true)
      .unknown(fallback)
    return linearScale(value) // Return the scaled value or the fallback
  }
)

export const generateHash = (str) => {
  var hash = 0
  if (str.length === 0) return hash
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}

export const getChartItemColor = (name) => {
  const colorIndex = Math.abs(generateHash(name))
  return CHART_PALETTE[colorIndex % CHART_PALETTE.length]
}

export const rgbStrToArray = (str) => str.match(/[.\d]+/g)

export const getColorString = (rawColor) => color(rawColor)?.formatRgb()

export const getContrastText = (bgColor) => {
  const background = color(bgColor)
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
  'startGradientColor',
  'endGradientColor',
  'startSize',
  'endSize',
  'startHeight',
  'endHeight',
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

export const getNumActiveFilters = R.count(R.propEq('rule', 'type'))

export const constructFetchedGeoJson = (
  matchingKeysByTypeFunc,
  itemRange,
  enabledItemsFunc,
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

                const isColorCategorical = !R.has('min', colorRange)
                const rawColor =
                  colorByPropVal === ''
                    ? colorFallback
                    : isColorCategorical
                      ? R.pathOr('#000', ['options', colorByPropVal, 'color'])(
                          colorRange
                        )
                      : getScaledValueAlt(
                          [colorRange.min, colorRange.max],
                          [
                            colorRange.startGradientColor,
                            colorRange.endGradientColor,
                          ],
                          parseFloat(colorByPropVal)
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

                const isHeightCategorical = !R.has('min', heightRange)
                const rawHeight =
                  heightByPropVal == null
                    ? heightFallback
                    : isHeightCategorical
                      ? R.pathOr('0', ['options', heightByPropVal, 'height'])(
                          heightRange
                        )
                      : getScaledValueAlt(
                          [heightRange.min, heightRange.max],
                          [
                            parseFloat(heightRange.startHeight),
                            parseFloat(heightRange.endHeight),
                          ],
                          parseFloat(heightByPropVal)
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

                const isSizeCategorical = !R.has('min', sizeRange)
                const rawSize =
                  sizeByPropVal == null
                    ? sizeFallback
                    : isSizeCategorical
                      ? R.pathOr('0', ['options', sizeByPropVal, 'size'])(
                          sizeRange
                        )
                      : getScaledValueAlt(
                          [sizeRange.min, sizeRange.max],
                          [
                            parseFloat(sizeRange.startSize),
                            parseFloat(sizeRange.endSize),
                          ],
                          parseFloat(sizeByPropVal)
                        )

                const dashPattern = enabledItems[geoType].lineBy ?? 'solid'

                if (parseFloat(rawSize) === 0 || color(rawColor).opacity === 0)
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

          const isColorCategorical = !R.has('min', colorRange)
          const rawColor =
            colorByPropVal === ''
              ? colorFallback
              : isColorCategorical
                ? R.pathOr('#000', ['options', colorByPropVal, 'color'])(
                    colorRange
                  )
                : getScaledValueAlt(
                    [colorRange.min, colorRange.max],
                    [
                      colorRange.startGradientColor,
                      colorRange.endGradientColor,
                    ],
                    parseFloat(colorByPropVal)
                  )

          let rawSize

          if (type === 'node' || type === 'arc') {
            const { sizeBy } = legendObj
            const sizeRange = itemRange(item.type, sizeBy, mapId)
            const sizeByPropVal = item.values[sizeBy]
            const sizeFallback = R.pathOr('0', ['fallback', 'size'], sizeRange)

            const isSizeCategorical = !R.has('min', sizeRange)
            rawSize =
              sizeByPropVal == null
                ? sizeFallback
                : isSizeCategorical
                  ? R.pathOr('0', ['options', sizeByPropVal, 'size'])(sizeRange)
                  : getScaledValueAlt(
                      [sizeRange.min, sizeRange.max],
                      [
                        parseFloat(sizeRange.startSize),
                        parseFloat(sizeRange.endSize),
                      ],
                      parseFloat(sizeByPropVal)
                    )
          }
          if (rawSize === 0 || color(rawColor).opacity === 0) return false

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

            const isHeightCategorical = !R.has('min', heightRange)
            rawHeight =
              heightByPropVal == null
                ? heightFallback
                : isHeightCategorical
                  ? R.pathOr('0', ['options', heightByPropVal, 'height'])(
                      heightRange
                    )
                  : getScaledValueAlt(
                      [heightRange.min, heightRange.max],
                      [
                        parseFloat(heightRange.startHeight),
                        parseFloat(heightRange.endHeight),
                      ],
                      parseFloat(heightByPropVal)
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
                dash: R.propOr('solid', 'lineBy')(legendObj),
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
