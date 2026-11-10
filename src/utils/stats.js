import * as R from 'ramda'

import { forceArray } from '.'
import { statFuncs, statId } from './enums'

// Calculate the mode item in a list (output formatted as a string)
// This can mix strings and numbers, but will always return a string (of the number) or NaN
// Note: 1 is equivalent to '1' in this case
// EG: getMode([1, 2, 3, 1]) => '1'
// EG: getMode([1, 'b','b','a','c']) => 'b'
export const getMode = (arr) => {
  const safeArr = forceArray(arr)
  if (!safeArr.length) return NaN
  const counts = new Map()
  let maxCount = 0
  let modeVal = NaN
  for (let i = 0; i < safeArr.length; i++) {
    const val = String(safeArr[i])
    const count = (counts.get(val) || 0) + 1
    counts.set(val, count)
    if (count > maxCount) {
      maxCount = count
      modeVal = val
    }
  }
  return modeVal
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
  const safeArr = forceArray(arr)
  let maxNum = -Infinity
  let maxStr = ''
  let hasNum = false
  let hasStr = false
  for (let i = 0; i < safeArr.length; i++) {
    const v = safeArr[i]
    if (typeof v === 'number' && !Number.isNaN(v)) {
      if (v > maxNum) maxNum = v
      hasNum = true
    } else if (typeof v === 'string') {
      if (v > maxStr || !hasStr) maxStr = v
      hasStr = true
    }
  }
  if (hasNum) return maxNum
  if (hasStr) return maxStr
  return NaN
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
  const safeArr = forceArray(arr)
  let minNum = Infinity
  let minStr = ''
  let hasNum = false
  let hasStr = false
  for (let i = 0; i < safeArr.length; i++) {
    const v = safeArr[i]
    if (typeof v === 'string') {
      if (v < minStr || !hasStr) minStr = v
      hasStr = true
    } else if (typeof v === 'number' && !Number.isNaN(v)) {
      if (v < minNum) minNum = v
      hasNum = true
    }
  }
  if (hasStr) return minStr
  if (hasNum) return minNum
  return NaN
}

// Calculate the mean of a list (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
export const getMean = (arr) => {
  const safeArr = forceArray(arr)
  let sum = 0
  let count = 0
  for (let i = 0; i < safeArr.length; i++) {
    const v = safeArr[i]
    if (typeof v === 'number' && !Number.isNaN(v)) {
      sum += v
      count++
    }
  }
  return count === 0 ? NaN : sum / count
}

// Calculate the median of a list  (returns a number or NaN)
// This omits everything except numbers and returns NaN if there are no numbers
export const getMedian = (arr) => {
  const safeArr = forceArray(arr)
  const nums = []
  for (let i = 0; i < safeArr.length; i++) {
    const v = safeArr[i]
    if (typeof v === 'number' && !Number.isNaN(v)) {
      nums.push(v)
    }
  }
  if (nums.length === 0) return NaN
  const width = nums.length
  if (width === 1) return nums[0]
  nums.sort((a, b) => a - b)
  return width % 2 === 1
    ? nums[(width - 1) / 2]
    : (nums[width / 2 - 1] + nums[width / 2]) / 2
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
  const safeArr = forceArray(arr)
  let sum = 0
  for (let i = 0; i < safeArr.length; i++) {
    const v = safeArr[i]
    if (typeof v === 'number' && !Number.isNaN(v)) {
      sum += v
    }
  }
  return sum
}

// Calculate the count of all items a list (returns a number or NaN)
export const getCount = (arr) => {
  return forceArray(arr).length
}

export const getAnd = (arr) => {
  const safeArr = forceArray(arr)
  for (let i = 0; i < safeArr.length; i++) {
    if (!safeArr[i]) return false
  }
  return true
}

export const getOr = (arr) => {
  const safeArr = forceArray(arr)
  for (let i = 0; i < safeArr.length; i++) {
    if (safeArr[i]) return true
  }
  return false
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
