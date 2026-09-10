import { colord } from 'colord'
import { scaleLinear } from 'd3-scale'
import { performance } from 'perf_hooks'
import * as R from 'ramda'

import NumberFormat from '../utils/NumberFormat.js'
import { getScaledValue } from '../utils/scales.js'
import { getSum, getMean, getMax, getMin, getMode } from '../utils/stats.js'
import Supercluster from '../utils/supercluster.js'

// Exact implementation of cave combineReducers from src/utils/index.js (line 55)
const caveCombineReducers = (reducers) => {
  const reducerKeys = Object.keys(reducers)
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

// --- Helper to benchmark functions ---
function measure(name, fn, iterations = 1) {
  // Warmup
  try {
    fn()
  } catch (e) {
    /* ignore warmup error */
  }

  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()
  const totalMs = end - start
  const avgMs = totalMs / iterations
  return { name, totalMs, avgMs, iterations }
}

export function runBenchmarks() {
  const results = []

  console.log('='.repeat(75))
  console.log('  CAVE STATIC FRONTEND: PERFORMANCE BENCHMARK & PROFILING SUITE')
  console.log('='.repeat(75))
  console.log(`Node version: ${process.version}`)
  console.log(`Timestamp: ${new Date().toISOString()}\n`)

  // -------------------------------------------------------------
  // 1. STATISTICAL AGGREGATIONS (100,000 values)
  // -------------------------------------------------------------
  console.log('>>> 1. Benchmarking Statistics Functions (100k items)...')
  const numItems = 100000
  const randomNumbers = Array.from(
    { length: numItems },
    () => Math.random() * 1000
  )
  const mixedValues = Array.from({ length: numItems }, (_, i) =>
    i % 5 === 0 ? `cat_${i % 10}` : Math.random() * 1000
  )

  // Baseline Ramda stats
  const ramdaSum = measure(
    'Ramda getSum (100k)',
    () => getSum(randomNumbers),
    10
  )
  const ramdaMean = measure(
    'Ramda getMean (100k)',
    () => getMean(randomNumbers),
    10
  )
  const ramdaMax = measure(
    'Ramda getMax (100k mixed)',
    () => getMax(mixedValues),
    5
  )
  const ramdaMin = measure(
    'Ramda getMin (100k mixed)',
    () => getMin(mixedValues),
    5
  )
  const ramdaMode = measure(
    'Ramda getMode (100k mixed)',
    () => getMode(mixedValues),
    2
  )

  // Optimized Native stats
  const nativeSumFn = (arr) => {
    let sum = 0
    let count = 0
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (typeof v === 'number' && !isNaN(v)) {
        sum += v
        count++
      }
    }
    return count === 0 ? NaN : sum
  }

  const nativeMeanFn = (arr) => {
    let sum = 0
    let count = 0
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (typeof v === 'number' && !isNaN(v)) {
        sum += v
        count++
      }
    }
    return count === 0 ? NaN : sum / count
  }

  const nativeMaxFn = (arr) => {
    let maxNum = -Infinity
    let maxStr = ''
    let hasNum = false
    let hasStr = false
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (typeof v === 'number' && !isNaN(v)) {
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

  const nativeMinFn = (arr) => {
    let minNum = Infinity
    let minStr = ''
    let hasNum = false
    let hasStr = false
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (typeof v === 'number' && !isNaN(v)) {
        if (v < minNum) minNum = v
        hasNum = true
      } else if (typeof v === 'string') {
        if (v < minStr || !hasStr) minStr = v
        hasStr = true
      }
    }
    if (hasStr) return minStr
    if (hasNum) return minNum
    return NaN
  }

  const nativeModeFn = (arr) => {
    const counts = new Map()
    let maxCount = 0
    let modeVal = NaN
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      const count = (counts.get(v) || 0) + 1
      counts.set(v, count)
      if (count > maxCount) {
        maxCount = count
        modeVal = v
      }
    }
    return String(modeVal)
  }

  const optSum = measure(
    'Optimized Native getSum (100k)',
    () => nativeSumFn(randomNumbers),
    10
  )
  const optMean = measure(
    'Optimized Native getMean (100k)',
    () => nativeMeanFn(randomNumbers),
    10
  )
  const optMax = measure(
    'Optimized Native getMax (100k mixed)',
    () => nativeMaxFn(mixedValues),
    10
  )
  const optMin = measure(
    'Optimized Native getMin (100k mixed)',
    () => nativeMinFn(mixedValues),
    10
  )
  const optMode = measure(
    'Optimized Native getMode (100k mixed)',
    () => nativeModeFn(mixedValues),
    10
  )

  results.push(
    {
      category: 'Statistics',
      name: 'getSum (100k items)',
      baselineAvgMs: ramdaSum.avgMs,
      optAvgMs: optSum.avgMs,
      speedup: `${(ramdaSum.avgMs / optSum.avgMs).toFixed(1)}x`,
    },
    {
      category: 'Statistics',
      name: 'getMean (100k items)',
      baselineAvgMs: ramdaMean.avgMs,
      optAvgMs: optMean.avgMs,
      speedup: `${(ramdaMean.avgMs / optMean.avgMs).toFixed(1)}x`,
    },
    {
      category: 'Statistics',
      name: 'getMax (100k mixed)',
      baselineAvgMs: ramdaMax.avgMs,
      optAvgMs: optMax.avgMs,
      speedup: `${(ramdaMax.avgMs / optMax.avgMs).toFixed(1)}x`,
    },
    {
      category: 'Statistics',
      name: 'getMin (100k mixed)',
      baselineAvgMs: ramdaMin.avgMs,
      optAvgMs: optMin.avgMs,
      speedup: `${(ramdaMin.avgMs / optMin.avgMs).toFixed(1)}x`,
    },
    {
      category: 'Statistics',
      name: 'getMode (100k mixed)',
      baselineAvgMs: ramdaMode.avgMs,
      optAvgMs: optMode.avgMs,
      speedup: `${(ramdaMode.avgMs / optMode.avgMs).toFixed(1)}x`,
    }
  )

  // -------------------------------------------------------------
  // 2. NUMBER FORMATTING (20,000 numbers)
  // -------------------------------------------------------------
  console.log('>>> 2. Benchmarking Number Formatting (20k calls)...')
  const sampleNums = Array.from({ length: 20000 }, () => Math.random() * 100000)

  const baselineNumberFormat = measure(
    'Baseline NumberFormat.format (20k)',
    () => {
      for (let i = 0; i < sampleNums.length; i++) {
        NumberFormat.format(sampleNums[i], {
          precision: 2,
          trailingZeros: true,
        })
      }
    },
    2
  )

  // Optimized Intl formatter cache
  const intlCache = new Map()
  const getCachedFormatter = (locale, opts) => {
    const key = `${locale}_${opts.notation}_${opts.precision}_${opts.trailingZeros}_${opts.compactDisplay}`
    let fmt = intlCache.get(key)
    if (!fmt) {
      fmt = new Intl.NumberFormat(locale, {
        minimumFractionDigits: opts.trailingZeros ? opts.precision : 0,
        maximumFractionDigits: opts.precision,
        notation: opts.notation,
        compactDisplay: opts.compactDisplay,
      })
      intlCache.set(key, fmt)
    }
    return fmt
  }

  const optNumberFormat = measure(
    'Cached Intl NumberFormat.format (20k)',
    () => {
      const opts = { notation: 'standard', precision: 2, trailingZeros: true }
      const formatter = getCachedFormatter('en-US', opts)
      for (let i = 0; i < sampleNums.length; i++) {
        formatter.format(sampleNums[i])
      }
    },
    2
  )

  results.push({
    category: 'Number Formatting',
    name: 'format() (20k items)',
    baselineAvgMs: baselineNumberFormat.avgMs,
    optAvgMs: optNumberFormat.avgMs,
    speedup: `${(baselineNumberFormat.avgMs / optNumberFormat.avgMs).toFixed(1)}x`,
  })

  // -------------------------------------------------------------
  // 3. MAP SCALES & COLOR INTERPOLATION (20,000 points)
  // -------------------------------------------------------------
  console.log(
    '>>> 3. Benchmarking Scales & Color/Size Interpolation (20k points)...'
  )
  const testDomain = [0, 1000]
  const testColorRange = ['#ff0000', '#00ff00', '#0000ff']
  const testPoints = Array.from({ length: 20000 }, () => Math.random() * 1000)

  const baselineScales = measure(
    'Baseline getScaledValue per point (20k)',
    () => {
      for (let i = 0; i < testPoints.length; i++) {
        getScaledValue(testDomain, testColorRange, testPoints[i], 'linear')
      }
    },
    2
  )

  // Precomputed scale function (constructed once per layer/range)
  const buildFastScale = (domain, range) => {
    const parsedRange = range.map((c) =>
      typeof c === 'string' ? colord(c).toRgbString() : c
    )
    const scale = scaleLinear().domain(domain).range(parsedRange).clamp(true)
    return (val) => scale(val)
  }

  const fastScaleFn = buildFastScale(testDomain, testColorRange)
  const optScales = measure(
    'Precomputed Scale Function (20k)',
    () => {
      for (let i = 0; i < testPoints.length; i++) {
        fastScaleFn(testPoints[i])
      }
    },
    5
  )

  results.push({
    category: 'Map Scales',
    name: 'getScaledValue (20k points)',
    baselineAvgMs: baselineScales.avgMs,
    optAvgMs: optScales.avgMs,
    speedup: `${(baselineScales.avgMs / optScales.avgMs).toFixed(1)}x`,
  })

  // -------------------------------------------------------------
  // 4. SUPERCLUSTER CLUSTERING ACROSS ZOOM LEVELS (10,000 nodes)
  // -------------------------------------------------------------
  console.log(
    '>>> 4. Benchmarking Supercluster Point Indexing & Clustering (10k nodes)...'
  )
  const nodeCount = 10000
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    geometry: {
      coordinates: [
        -122.4 + (Math.random() - 0.5) * 2,
        37.7 + (Math.random() - 0.5) * 2,
      ],
    },
    properties: {
      id: `node_${i}`,
      type: 'warehouse',
      value: Math.random() * 100,
    },
  }))

  const minZoom = 0
  const maxZoom = 16

  // Current implementation in selectNodeClustersFunc: superCluster.load called inside the zoom loop (17 times)
  const baselineCluster = measure(
    'Current Selector: superCluster.load in zoom loop (17x)',
    () => {
      const superCluster = new Supercluster({ minZoom, maxZoom, radius: 40 })
      const groups = {}
      for (let z = maxZoom; z >= minZoom; z--) {
        superCluster.load(nodes)
        groups[z] = superCluster.getClusters([-180, -90, 180, 90], z)
      }
      return groups
    },
    1
  )

  // Optimized implementation: load once per group, query clusters per zoom level
  const optCluster = measure(
    'Optimized: superCluster.load called once, query 17 zooms',
    () => {
      const superCluster = new Supercluster({ minZoom, maxZoom, radius: 40 })
      superCluster.load(nodes)
      const groups = {}
      for (let z = maxZoom; z >= minZoom; z--) {
        groups[z] = superCluster.getClusters([-180, -90, 180, 90], z)
      }
      return groups
    },
    2
  )

  results.push({
    category: 'Spatial Clustering',
    name: 'Supercluster (10k points, 17 zooms)',
    baselineAvgMs: baselineCluster.avgMs,
    optAvgMs: optCluster.avgMs,
    speedup: `${(baselineCluster.avgMs / optCluster.avgMs).toFixed(1)}x`,
  })

  // -------------------------------------------------------------
  // 5. REDUX REDUCER WITH LARGE STATE (50,000 items in store)
  // -------------------------------------------------------------
  console.log(
    '>>> 5. Benchmarking Redux Reducer with structuredClone vs Shallow Copy (50k items)...'
  )
  const largeState = {
    data: {
      nodes: Object.fromEntries(
        Array.from({ length: 50000 }, (_, i) => [
          `node_${i}`,
          { id: `node_${i}`, lat: 37.7, lng: -122.4, val: i },
        ])
      ),
      settings: { theme: 'dark', zoom: 5 },
    },
    utilities: {
      time: { currentTime: 10 },
      loading: { session_loading: false },
    },
  }

  const testAction = { type: 'time/setTime', payload: 11 }
  const mockReducers = {
    data: (s = largeState.data) => s,
    utilities: (s = largeState.utilities, a) =>
      a.type === 'time/setTime'
        ? { ...s, time: { currentTime: a.payload } }
        : s,
  }

  // Current combineReducers in src/utils/index.js doing structuredClone(state)
  const baselineReducer = measure(
    'Current combineReducers with structuredClone(state)',
    () => {
      const reducer = caveCombineReducers(mockReducers)
      reducer(largeState, testAction)
    },
    3
  )

  // Standard RTK / Redux shallow-copy combineReducers
  const shallowCombineReducers = (reducers) => {
    const keys = Object.keys(reducers)
    return (state = {}, action) => {
      let hasChanged = false
      const nextState = {}
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i]
        const r = reducers[k]
        const prev = state[k]
        const next = r(prev, action)
        nextState[k] = next
        hasChanged = hasChanged || next !== prev
      }
      return hasChanged ? nextState : state
    }
  }

  const optReducer = measure(
    'Optimized shallow combineReducers',
    () => {
      const reducer = shallowCombineReducers(mockReducers)
      reducer(largeState, testAction)
    },
    10
  )

  results.push({
    category: 'Redux State Management',
    name: 'Reducer Action Dispatch (50k items)',
    baselineAvgMs: baselineReducer.avgMs,
    optAvgMs: optReducer.avgMs,
    speedup: `${(baselineReducer.avgMs / optReducer.avgMs).toFixed(1)}x`,
  })

  // -------------------------------------------------------------
  // 6. CHART DATA TRANSFORMATION (5,000 points per series)
  // -------------------------------------------------------------
  console.log(
    '>>> 6. Benchmarking Chart Series Transformation (5k points, O(N^2) vs O(N))...'
  )
  const chartPoints = Array.from({ length: 5000 }, (_, i) => ({
    index: i,
    name: 'Series A',
    value: [Math.random() * 100],
  }))

  // Baseline: R.map with R.find(R.propEq(idx, 'index'), d) over R.range(0, N) -> O(N^2)
  const baselineChartSeries = measure(
    'Baseline O(N^2) R.find across range (5k)',
    () => {
      const maxIdx = 4999
      const d = chartPoints
      const mapped = R.map(
        R.pipe(
          (idx) => R.find(R.propEq(idx, 'index'), d),
          R.when(R.isNotNil, R.path(['value', 0]))
        )
      )(R.range(0, maxIdx + 1))
      return mapped
    },
    1
  )

  // Optimized: Map / Direct Array Indexing -> O(N)
  const optChartSeries = measure(
    'Optimized O(N) Array Indexing (5k)',
    () => {
      const maxIdx = 4999
      const d = chartPoints
      const lookup = new Array(maxIdx + 1)
      for (let i = 0; i < d.length; i++) {
        lookup[d[i].index] = d[i].value?.[0]
      }
      return lookup
    },
    10
  )

  results.push({
    category: 'Chart Transformation',
    name: 'EchartsPlot Series Data (5k points)',
    baselineAvgMs: baselineChartSeries.avgMs,
    optAvgMs: optChartSeries.avgMs,
    speedup: `${(baselineChartSeries.avgMs / optChartSeries.avgMs).toFixed(1)}x`,
  })

  // -------------------------------------------------------------
  // PRINT SUMMARY TABLE
  // -------------------------------------------------------------
  console.log(`\n${'='.repeat(75)}`)
  console.log('                     BENCHMARK RESULTS SUMMARY')
  console.log('='.repeat(75))
  console.log(
    `${
      'Category'.padEnd(25) +
      'Benchmark'.padEnd(38) +
      'Baseline (ms)'.padEnd(16) +
      'Optimized (ms)'.padEnd(16)
    }Speedup`
  )
  console.log('-'.repeat(102))

  for (const r of results) {
    console.log(
      r.category.padEnd(25) +
        r.name.padEnd(38) +
        r.baselineAvgMs.toFixed(3).padEnd(16) +
        r.optAvgMs.toFixed(3).padEnd(16) +
        r.speedup
    )
  }
  console.log(`${'='.repeat(75)}\n`)

  return results
}

// Self-run when executed directly
runBenchmarks()
