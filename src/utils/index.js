import { quantileSorted } from 'd3-array'
import { color, rgb } from 'd3-color'
import { scaleLinear } from 'd3-scale'
import { Parser } from 'expr-eval'
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
    R.length,
    R.range(0)
  )(statistics)
  const filteredIndicies = indicies.filter((idx) => {
    for (const filterObj of filters) {
      const format = R.propOr('stat', 'format', filterObj)
      const prop = R.prop('prop', filterObj)
      const filterValue = R.prop('value', filterObj)
      const value =
        format === 'stat'
          ? R.path([prop, idx], valueLists)
          : groupingIndicies[format]['data'][prop][
              groupingIndicies[format]['data']['id'][
                R.path(['groupLists', format, idx], statistics)
              ]
            ]
      if (format !== 'stat') {
        if (R.has('option', filterObj)) {
          if (R.any(R.flip(R.includes)(value), filterValue)) {
            return false
          }
        } else {
          if (R.all(R.pipe(R.equals(value), R.not), filterValue)) {
            return false
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
          return false
        }
      }
    }
    return true
  })
  return filteredIndicies
}

const promiseAllObject = (obj) =>
  Promise.all(R.values(obj)).then(R.zipObj(R.keys(obj)))

export const calculateStatAnyDepth = (valueBuffers, workerManager) => {
  const valueLists = R.map((buffer) => new Float64Array(buffer))(valueBuffers)
  const parser = new Parser()
  const calculate = (group, calculation) => {
    // if there are no calculations just return values at the group indicies
    if (R.has(calculation, valueLists)) {
      return R.pipe((d) => d[calculation], R.pick(group), R.values)(valueLists)
    }
    // define groupSum for each base level group
    const preSummed = {}
    parser.functions.groupSum = (statName) => {
      // groupSum only works for non-derived stats
      // dont recalculate sum for each stat
      if (R.isNil(preSummed[statName])) {
        preSummed[statName] = R.sum(
          R.map((idx) => valueLists[statName][idx], group)
        )
      }
      return preSummed[statName]
    }
    return group.map((idx) => {
      const proxy = new Proxy(valueLists, {
        get(target, name, receiver) {
          return Reflect.get(target, name, receiver)[idx]
        },
      })
      try {
        return parser.parse(calculation).evaluate(
          // evaluate each list item
          proxy
        )
      } catch {
        console.warn(`Malformed calculation: ${calculation}`)
        // if calculation is malformed return simplified array
        return parseArray(
          parser
            .parse(calculation)
            .simplify(
              // evaluate each list item
              proxy
            )
            .toString()
        )
      }
    })
  }
  const group = async (groupBys, calculation, indicies) => {
    const currentGroupBy = groupBys[0]
    const keyFn = R.pipe(currentGroupBy, R.join(' \u279D '))
    return await R.pipe(
      (idxs) => {
        const acc = {}
        for (let i = 0; i < idxs.length; i++) {
          const idx = idxs[i]
          const key = keyFn(idx)
          if (!(key in acc)) {
            acc[key] = []
          }
          acc[key].push(idx)
        }
        return acc
      },
      R.length(groupBys) === 1
        ? async (d) =>
            await promiseAllObject(
              R.map((group) => {
                // if group is small enough or if sharedArrayBuffer is not available calculate in main thread
                if (group.length < 1000 || !window.crossOriginIsolated)
                  return calculate(group, calculation)
                else
                  return workerManager.doWork({
                    indicies: group,
                    calculation,
                    valueBuffers,
                  })
              })(d)
            )
        : async (d) =>
            await promiseAllObject(
              R.map(
                async (stats) =>
                  await group(groupBys.slice(1), calculation, stats)
              )(d)
            )
    )(indicies)
  }

  return group
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

export const getContrastText = (bgColor) => {
  const background = rgb(bgColor)
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

const allowedRangeKeys = [
  'startGradientColor',
  'endGradientColor',
  'nullColor',
  'nullSize',
  'timeValues',
  'startSize',
  'endSize',
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
  const statIds = R.pathOr([], ['statId'], chartObj)
  if (R.is(String, statIds)) return chartObj
  const transformations = {
    statId: R.dropLast(1),
    groupedOutputDataId: R.dropLast(1),
  }
  const reduced_chart = R.isNil(R.last(statIds))
    ? R.evolve(transformations, chartObj)
    : chartObj

  return R.any(R.isNil)(reduced_chart['statId'])
    ? R.pipe(
        R.assoc('statId', []),
        R.assoc('groupedOutputDataId', [])
      )(reduced_chart)
    : reduced_chart
}

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
                const geoType = R.prop('type')(geoObj)
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

                const colorProp = R.path([geoObj.type, 'colorBy'], enabledItems)
                const colorRange = itemRange(
                  geoObj.type,
                  colorProp,
                  mapId,
                  'colorByOptions'
                )
                const isCategorical = !R.has('min', colorRange)
                const propVal = R.pipe(
                  R.path(['values', colorProp]),
                  R.when(R.isNil, R.always('')),
                  (s) => s.toString()
                )(geoObj)

                const nullColor = R.propOr(
                  'rgba(0,0,0,255)',
                  'nullColor',
                  colorRange
                )

                const color = R.equals('', propVal)
                  ? nullColor
                  : isCategorical
                    ? R.propOr('rgba(0,0,0,255)', propVal, colorRange)
                    : `rgba(${getScaledArray(
                        R.prop('min', colorRange),
                        R.prop('max', colorRange),
                        R.map((val) => parseFloat(val))(
                          R.prop('startGradientColor', colorRange)
                            .replace(/[^\d,.]/g, '')
                            .split(',')
                        ),
                        R.map((val) => parseFloat(val))(
                          R.prop('endGradientColor', colorRange)
                            .replace(/[^\d,.]/g, '')
                            .split(',')
                        ),
                        parseFloat(R.path(['values', colorProp], geoObj))
                      ).join(',')})`

                const id = R.prop('data_key')(geoObj)

                const heightProp = R.path(
                  [geoObj.type, 'heightBy'],
                  enabledItems
                )
                const heightRange = itemRange(
                  geoObj.type,
                  heightProp,
                  mapId,
                  'heightByOptions'
                )

                const heightPropVal = parseFloat(
                  R.path(['values', heightProp], geoObj)
                )
                const defaultHeight =
                  R.has('startHeight', geoObj) && R.has('endHeight', geoObj)
                    ? '100'
                    : '0'

                const height = isNaN(heightPropVal)
                  ? parseFloat(R.propOr(defaultHeight, 'nullSize', heightRange))
                  : getScaledValue(
                      R.prop('min', heightRange),
                      R.prop('max', heightRange),
                      parseFloat(R.prop('startHeight', heightRange)),
                      parseFloat(R.prop('endHeight', heightRange)),
                      heightPropVal
                    )

                // don't calculate size, dash, or adjust path for geos
                if (cacheName === 'geo')
                  return R.mergeRight(filteredFeature, {
                    properties: {
                      cave_name: JSON.stringify([geoType, id]),
                      cave_obj: geoObj,
                      color,
                      height,
                    },
                  })

                const sizeProp = R.path([geoObj.type, 'sizeBy'], enabledItems)
                const sizeRange = itemRange(
                  geoObj.type,
                  sizeProp,
                  mapId,
                  'sizeByOptions'
                )
                const sizePropVal = parseFloat(
                  R.path(['values', sizeProp], geoObj)
                )
                const size = isNaN(sizePropVal)
                  ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
                  : getScaledValue(
                      R.prop('min', sizeRange),
                      R.prop('max', sizeRange),
                      parseFloat(R.prop('startSize', sizeRange)),
                      parseFloat(R.prop('endSize', sizeRange)),
                      sizePropVal
                    )

                const dashPattern = R.propOr(
                  'solid',
                  'lineBy'
                )(R.path([geoType, 'colorBy'], enabledItems))

                if (size === 0 || parseFloat(R.last(R.split(',', color))) < 1)
                  return false

                const adjustedFeature = R.assocPath(
                  ['geometry', 'coordinates'],
                  adjustArcPath(
                    R.pathOr([], ['geometry', 'coordinates'])(filteredFeature)
                  )
                )(filteredFeature)
                return R.mergeRight(adjustedFeature, {
                  properties: {
                    cave_name: JSON.stringify([geoType, id]),
                    cave_obj: geoObj,
                    color,
                    dash: dashPattern,
                    size,
                    height,
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

          const colorProp = legendObj.colorBy
          const colorPropVal = R.pipe(
            R.path(['values', colorProp]),
            R.when(R.isNil, R.always('')),
            (s) => s.toString()
          )(item)
          const colorRange = itemRange(
            item.type,
            colorProp,
            mapId,
            'colorByOptions'
          )

          const nullColor = R.propOr('rgba(0,0,0,255)', 'nullColor', colorRange)

          const isColorCategorical = !R.has('min', colorRange)
          const color = isColorCategorical
            ? R.map((val) => parseFloat(val))(
                R.propOr('rgba(0,0,0,255)', colorPropVal, colorRange)
                  .replace(/[^\d,.]/g, '')
                  .split(',')
              )
            : getScaledArray(
                R.prop('min', colorRange),
                R.prop('max', colorRange),
                R.map((val) => parseFloat(val))(
                  R.prop('startGradientColor', colorRange)
                    .replace(/[^\d,.]/g, '')
                    .split(',')
                ),
                R.map((val) => parseFloat(val))(
                  R.prop('endGradientColor', colorRange)
                    .replace(/[^\d,.]/g, '')
                    .split(',')
                ),
                parseFloat(colorPropVal)
              )
          const colorString = R.equals('', colorPropVal)
            ? nullColor
            : `rgba(${color.join(',')})`

          let size = null

          if (type === 'node' || type === 'arc') {
            const sizeProp = legendObj.sizeBy
            const sizeRange = itemRange(
              item.type,
              sizeProp,
              mapId,
              'sizeByOptions'
            )
            const sizePropVal = R.path(['values', sizeProp], item)
            const isSizeCategorical = !R.has('min', sizeRange)
            size = R.isNil(sizePropVal)
              ? parseFloat(R.propOr('0', 'nullSize', sizeRange))
              : isSizeCategorical
                ? parseFloat(R.propOr('0', sizePropVal, sizeRange))
                : getScaledValue(
                    R.prop('min', sizeRange),
                    R.prop('max', sizeRange),
                    parseFloat(R.prop('startSize', sizeRange)),
                    parseFloat(R.prop('endSize', sizeRange)),
                    parseFloat(sizePropVal)
                  )
          }

          if (size === 0 || parseFloat(R.last(R.split(',', colorString))) < 1)
            return false

          let height = null

          if (type === 'geo' || type === 'arc') {
            const heightProp = legendObj.heightBy
            const heightRange = itemRange(
              item.type,
              heightProp,
              mapId,
              'heightByOptions'
            )

            const heightPropVal = parseFloat(
              R.path(['values', heightProp], item)
            )
            const defaultHeight =
              R.has('startHeight', item) && R.has('endHeight', item)
                ? '100'
                : '0'

            height = isNaN(heightPropVal)
              ? parseFloat(R.propOr(defaultHeight, 'nullSize', heightRange))
              : getScaledValue(
                  R.prop('min', heightRange),
                  R.prop('max', heightRange),
                  parseFloat(R.prop('startHeight', heightRange)),
                  parseFloat(R.prop('endHeight', heightRange)),
                  heightPropVal
                )
          }

          return {
            type: 'Feature',
            properties: {
              cave_obj: item,
              cave_name: JSON.stringify([item.type, id]),
              color: colorString,
              ...(R.isNotNil(height) && { height }),
              ...(R.isNotNil(size) && {
                size: type === 'node' ? size / ICON_RESOLUTION : size,
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
