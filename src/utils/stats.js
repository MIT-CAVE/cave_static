import * as R from 'ramda'

import { forceArray } from '.'
import { statFuncs, statId } from './enums'

// Calculate the mode item in a list (output formatted as a string)
// This can mix strings and numbers, but will always return a string (of the number) or NaN
// Note: 1 is equivalent to '1' in this case
// EG: getMode([1, 2, 3, 1]) => '1'
// EG: getMode([1, 'b','b','a','c']) => 'b'
export const getMode = (arr) => {
  return R.pipe(
    forceArray,
    R.countBy(R.identity),
    R.toPairs,
    R.reduce((a, b) => (a[1] < b[1] ? b : a), [NaN, 0]),
    R.head
  )(arr)
}

// Calculate the max item in a list (returns a number, string or NaN)
// Note: Numbers are bigger than strings (1 > 'a')
// Note: Lowercase is bigger than Uppercase ('a' > 'A')
// Note: Uppercase is bigger than string numbers ('A' > '1')
// EG: getMax([1, 2, 3]) => 3
// EG: getMax(['a', 'b', 'c']) => 'c'
// EG: getMax(['a', 'b', 'c', 'A']) => 'c'
// EG: getMax(['a', 'b', 'c', 'A', 1]) => 1
export const getMax = (arr) => {
  return R.pipe(
    forceArray,
    R.groupBy(R.type),
    R.cond([
      [
        R.pipe(R.prop('Number'), R.length, R.flip(R.gt)(0)),
        R.pipe(R.prop('Number'), R.reduce(R.max, -Infinity)),
      ],
      [
        R.pipe(R.prop('String'), R.length, R.flip(R.gt)(0)),
        R.pipe(R.prop('String'), R.reduce(R.max, '')),
      ],
      [R.T, R.always(NaN)],
    ])
  )(arr)
}

// Calculate the min item in a list (returns a number, string or NaN)
// Note: Numbers are bigger than strings (1 > 'a')
// Note: Lowercase is bigger than Uppercase ('a' > 'A')
// Note: Uppercase is bigger than string numbers ('A' > '1')
// EG: getMin([1, 2, 3]) => 1
// EG: getMin(['a', 'b', 'c']) => 'a'
// EG: getMin(['a', 'b', 'c', 'A']) => 'A'
// EG: getMin(['a', 'b', 'c', 'A', 1]) => 'A'
// EG: getMin(['a', 'b', 'c', 'A', 1, '1']) => '1'
export const getMin = (arr) => {
  return R.pipe(
    forceArray,
    R.groupBy(R.type),
    R.cond([
      [
        R.pipe(R.prop('String'), R.length, R.flip(R.gt)(0)),
        R.pipe(
          R.prop('String'),
          R.reduce((a, b) => (a < b ? a : b), NaN)
        ),
      ],
      [
        R.pipe(R.prop('Number'), R.length, R.flip(R.gt)(0)),
        R.pipe(R.prop('Number'), R.reduce(R.min, Infinity)),
      ],
      [R.T, R.always(NaN)],
    ])
  )(arr)
}

// Calculate the mean of a list (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
export const getMean = (arr) => {
  return R.mean(R.filter(R.is(Number), forceArray(arr)))
}

// Calculate the median of a list  (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
export const getMedian = (arr) => {
  return R.median(R.filter(R.is(Number), forceArray(arr)))
}

// Calculate the standard deviation of a list (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
// export const getStdDev = (arr) => {
//     return R.pipe(
//         R.filter(R.is(Number)),
//         R.map(x => Math.pow(x - getMean(arr), 2)),
//         R.sum,
//         R.divide(R.__, arr.length),
//         Math.sqrt
//     )(arr)
// }

// Calculate the sum of a list (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
export const getSum = (arr) => {
  return R.sum(R.filter(R.is(Number), forceArray(arr)))
}

// Calculate the count of all items a list (returns a number or NaN)
export const getCount = (arr) => {
  return R.length(forceArray(arr))
}

export const getAnd = (arr) => {
  return R.reduce(R.and, true)(forceArray(arr))
}

export const getOr = (arr) => {
  return R.reduce(R.or, false)(forceArray(arr))
}

// Map an `statId` to its related function
export const getStatFn = {
  [statId.COUNT]: getCount,
  [statId.MAX]: getMax,
  [statId.MEAN]: getMean,
  [statId.MEDIAN]: getMedian,
  [statId.MIN]: getMin,
  [statId.MODE]: getMode,
  [statId.SUM]: getSum,
  [statId.AND]: getAnd,
  [statId.OR]: getOr,
  // [statId.STD_DEV]: getStdDev,
}

export const getStatLabel = R.cond([
  [R.equals(statId.COUNT), R.always('Number of items')],
  [R.equals(statId.MAX), R.always('Maximum')],
  [R.equals(statId.MEAN), R.always('Mean')],
  [R.equals(statId.MEDIAN), R.always('Median')],
  [R.equals(statId.MIN), R.always('Minimum')],
  [R.equals(statId.MODE), R.always('Mode')],
  [R.equals(statId.SUM), R.always('Sum')],
  [R.equals(statId.AND), R.always('All <AND>')], // \u2227
  [R.equals(statId.OR), R.always('Any <OR>')], // \u2228
  [R.T, R.always(null)],
])

export const getStatFuncsByType = R.memoizeWith(R.identity, (type) =>
  Array.from(statFuncs[type])
)
