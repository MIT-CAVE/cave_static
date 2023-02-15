import * as R from 'ramda'

// Calculate the mode item in a list (output formatted as a string)
// This can mix strings and numbers, but will always return a string (of the number) or NaN
// Note: 1 = '1' in this case
// EG: getMode([1, 2, 3, 1]) => '1'
// EG: getMode([1, 'b','b','a','c']) => 'b'
export const getMode = (arr) => {
  return R.pipe(
    R.countBy(R.identity),
    R.toPairs,
    R.reduce((a, b) => (a[1] < b[1] ? b : a), [NaN, 0]),
    R.head
  )(arr)
}

// Calculate the max item in a list (returns a number, string or NaN)
// This should not mix strings and numbers (if so results may be unexpected and are based on ordering)
// If the list is or only contains strings, returns NaN
// EG: getMax([1, 2, 3, 1]) => 3
export const getMax = (arr) => {
  const out = R.reduce(R.max, -Infinity, arr)
  return out === -Infinity ? NaN : out
}

// Calculate the min item in a list (returns a number, string or NaN)
// This should not mix strings and numbers (if so results may be unexpected and are based on ordering)
// If the list is or only contains strings, returns NaN
// EG: getMin([1, 2, 3, 1]) => 1
export const getMin = (arr) => {
  const out = R.reduce(R.min, Infinity, arr)
  return out === Infinity ? NaN : out
}

// Calculate the mean of a list (returns a number or NaN)
// This only takes in numbers or returns NaN
export const getMean = (arr) => {
  return R.mean(arr)
}

// Calculate the median of a list  (returns a number or NaN)
// This only takes in numbers or returns NaN
export const getMedian = (arr) => {
  return R.median(arr)
}

// Calculate the standard deviation of a list
// const getStdDev = (arr) => {
//     return R.pipe(
//         R.map(x => Math.pow(x - getMean(arr), 2)),
//         R.sum,
//         R.divide(R.__, arr.length),
//         Math.sqrt
//     )(arr)
// }

// Calculate the sum of a list (returns a number or NaN)
// This only takes in numbers or returns NaN
export const getSum = (arr) => {
  return R.sum(arr)
}

// Calculate all statistics as an object given a list
export const getStats = (arr) => {
  return {
    mode: getMode(arr),
    max: getMax(arr),
    min: getMin(arr),
    mean: getMean(arr),
    median: getMedian(arr),
    // stdDev: getStdDev(arr),
    sum: getSum(arr),
  }
}
