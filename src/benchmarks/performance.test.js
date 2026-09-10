import { colord } from 'colord'
import { scaleLinear } from 'd3-scale'
import { performance } from 'perf_hooks'
import * as R from 'ramda'
import { describe, it, expect } from 'vitest'

import NumberFormat from '../utils/NumberFormat'
import { getScaledValue } from '../utils/scales'
import { getSum, getMean, getMax } from '../utils/stats'
import Supercluster from '../utils/supercluster'

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

function measure(name, fn, iterations = 1) {
  try {
    fn()
  } catch (e) {
    /* ignore */
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

describe('Performance Benchmarks & Profiling Suite', () => {
  it('1. Statistics Aggregation Benchmark (100k items)', () => {
    const numItems = 100000
    const randomNumbers = Array.from(
      { length: numItems },
      () => Math.random() * 1000
    )
    const mixedValues = Array.from({ length: numItems }, (_, i) =>
      i % 5 === 0 ? `cat_${i % 10}` : Math.random() * 1000
    )

    const ramdaSum = measure('Ramda getSum', () => getSum(randomNumbers), 5)
    const ramdaMean = measure('Ramda getMean', () => getMean(randomNumbers), 5)
    const ramdaMax = measure('Ramda getMax', () => getMax(mixedValues), 3)

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

    const optSum = measure('Native getSum', () => nativeSumFn(randomNumbers), 5)
    const optMean = measure(
      'Native getMean',
      () => nativeMeanFn(randomNumbers),
      5
    )
    const optMax = measure('Native getMax', () => nativeMaxFn(mixedValues), 5)

    console.log(
      `[STATS] getSum (100k): Baseline=${ramdaSum.avgMs.toFixed(2)}ms | Opt=${optSum.avgMs.toFixed(2)}ms | Speedup=${(ramdaSum.avgMs / optSum.avgMs).toFixed(1)}x`
    )
    console.log(
      `[STATS] getMean (100k): Baseline=${ramdaMean.avgMs.toFixed(2)}ms | Opt=${optMean.avgMs.toFixed(2)}ms | Speedup=${(ramdaMean.avgMs / optMean.avgMs).toFixed(1)}x`
    )
    console.log(
      `[STATS] getMax (100k): Baseline=${ramdaMax.avgMs.toFixed(2)}ms | Opt=${optMax.avgMs.toFixed(2)}ms | Speedup=${(ramdaMax.avgMs / optMax.avgMs).toFixed(1)}x`
    )

    expect(optSum.avgMs).toBeLessThan(ramdaSum.avgMs)
    expect(optMean.avgMs).toBeLessThan(ramdaMean.avgMs)
    expect(optMax.avgMs).toBeLessThan(ramdaMax.avgMs)
  })

  it('2. Number Formatting Benchmark (20k items)', () => {
    const sampleNums = Array.from(
      { length: 20000 },
      () => Math.random() * 100000
    )

    const baselineNumberFormat = measure(
      'Baseline format',
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
      'Cached Intl format',
      () => {
        const opts = { notation: 'standard', precision: 2, trailingZeros: true }
        const formatter = getCachedFormatter('en-US', opts)
        for (let i = 0; i < sampleNums.length; i++) {
          formatter.format(sampleNums[i])
        }
      },
      2
    )

    console.log(
      `[NUMBER_FORMAT] 20k calls: Baseline=${baselineNumberFormat.avgMs.toFixed(2)}ms | Opt=${optNumberFormat.avgMs.toFixed(2)}ms | Speedup=${(baselineNumberFormat.avgMs / optNumberFormat.avgMs).toFixed(1)}x`
    )
    expect(optNumberFormat.avgMs).toBeLessThan(baselineNumberFormat.avgMs)
  })

  it('3. Map Scales & Color Interpolation Benchmark (20k points)', () => {
    const testDomain = [0, 1000]
    const testColorRange = ['#ff0000', '#00ff00', '#0000ff']
    const testPoints = Array.from({ length: 20000 }, () => Math.random() * 1000)

    const baselineScales = measure(
      'Baseline getScaledValue (20k)',
      () => {
        for (let i = 0; i < testPoints.length; i++) {
          getScaledValue(testDomain, testColorRange, testPoints[i], 'linear')
        }
      },
      2
    )

    const buildFastScale = (domain, range) => {
      const parsedRange = range.map((c) =>
        typeof c === 'string' ? colord(c).toRgbString() : c
      )
      const scale = scaleLinear().domain(domain).range(parsedRange).clamp(true)
      return (val) => scale(val)
    }

    const fastScaleFn = buildFastScale(testDomain, testColorRange)
    const optScales = measure(
      'Precomputed Scale (20k)',
      () => {
        for (let i = 0; i < testPoints.length; i++) {
          fastScaleFn(testPoints[i])
        }
      },
      5
    )

    console.log(
      `[SCALES] 20k points: Baseline=${baselineScales.avgMs.toFixed(2)}ms | Opt=${optScales.avgMs.toFixed(2)}ms | Speedup=${(baselineScales.avgMs / optScales.avgMs).toFixed(1)}x`
    )
    expect(optScales.avgMs).toBeLessThan(baselineScales.avgMs)
  })

  it('4. Supercluster Spatial Clustering Benchmark (10k points, 17 zoom levels)', () => {
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

    const baselineCluster = measure(
      'Current: superCluster.load in zoom loop (17x)',
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

    const optCluster = measure(
      'Optimized: superCluster.load once, query 17 zooms',
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

    console.log(
      `[SUPERCLUSTER] 10k points / 17 zooms: Baseline=${baselineCluster.avgMs.toFixed(2)}ms | Opt=${optCluster.avgMs.toFixed(2)}ms | Speedup=${(baselineCluster.avgMs / optCluster.avgMs).toFixed(1)}x`
    )
    expect(optCluster.avgMs).toBeLessThan(baselineCluster.avgMs)
  })

  it('5. Redux Reducer with Large State (50k items in state)', () => {
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

    const baselineReducer = measure(
      'Current combineReducers with structuredClone',
      () => {
        const reducer = caveCombineReducers(mockReducers)
        reducer(largeState, testAction)
      },
      3
    )

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

    console.log(
      `[REDUX] 50k items in store: Baseline=${baselineReducer.avgMs.toFixed(2)}ms | Opt=${optReducer.avgMs.toFixed(2)}ms | Speedup=${(baselineReducer.avgMs / optReducer.avgMs).toFixed(1)}x`
    )
    expect(optReducer.avgMs).toBeLessThan(baselineReducer.avgMs)
  })

  it('6. Chart Series Transformation (5k points, O(N^2) vs O(N))', () => {
    const chartPoints = Array.from({ length: 5000 }, (_, i) => ({
      index: i,
      name: 'Series A',
      value: [Math.random() * 100],
    }))

    const baselineChartSeries = measure(
      'Baseline O(N^2) R.find',
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

    const optChartSeries = measure(
      'Optimized O(N) Array Indexing',
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

    console.log(
      `[CHARTS] Series data (5k points): Baseline=${baselineChartSeries.avgMs.toFixed(2)}ms | Opt=${optChartSeries.avgMs.toFixed(2)}ms | Speedup=${(baselineChartSeries.avgMs / optChartSeries.avgMs).toFixed(1)}x`
    )
    expect(optChartSeries.avgMs).toBeLessThan(baselineChartSeries.avgMs)
  })
})
