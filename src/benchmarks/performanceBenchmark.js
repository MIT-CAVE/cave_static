import { performance } from 'perf_hooks'

import { mutateLocal } from '../data/local'
import { addMessage, clearMessages } from '../data/utilities/messagesSlice'
import { parseGradient } from '../utils'
import NumberFormat from '../utils/NumberFormat'
import { getScaledValue } from '../utils/scales'
import {
  getSum,
  getMean,
  getMax,
  getMin,
  getMode,
  getMedian,
} from '../utils/stats'
import { store } from '../utils/store'
import Supercluster from '../utils/supercluster'

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
  // 1. STATISTICAL AGGREGATIONS (100,000 items)
  // -------------------------------------------------------------
  console.log('>>> 1. Benchmarking Statistics Functions (100k items)...')
  const numItems = 100000
  const randomNumbers = Array.from(
    { length: numItems },
    () => Math.random() * 1000
  )
  const mixedValues = Array.from({ length: numItems }, (_, i) =>
    i % 5 === 0 ? `category_${i % 10}` : Math.random() * 1000
  )

  const sumRes = measure(
    'getSum (100k numbers)',
    () => getSum(randomNumbers),
    10
  )
  const meanRes = measure(
    'getMean (100k numbers)',
    () => getMean(randomNumbers),
    10
  )
  const maxRes = measure('getMax (100k mixed)', () => getMax(mixedValues), 10)
  const minRes = measure('getMin (100k mixed)', () => getMin(mixedValues), 10)
  const modeRes = measure(
    'getMode (100k mixed)',
    () => getMode(mixedValues),
    10
  )
  const medianRes = measure(
    'getMedian (100k numbers)',
    () => getMedian(randomNumbers),
    5
  )

  results.push(
    {
      category: 'Statistics',
      name: sumRes.name,
      avgMs: sumRes.avgMs,
      iterations: sumRes.iterations,
    },
    {
      category: 'Statistics',
      name: meanRes.name,
      avgMs: meanRes.avgMs,
      iterations: meanRes.iterations,
    },
    {
      category: 'Statistics',
      name: maxRes.name,
      avgMs: maxRes.avgMs,
      iterations: maxRes.iterations,
    },
    {
      category: 'Statistics',
      name: minRes.name,
      avgMs: minRes.avgMs,
      iterations: minRes.iterations,
    },
    {
      category: 'Statistics',
      name: modeRes.name,
      avgMs: modeRes.avgMs,
      iterations: modeRes.iterations,
    },
    {
      category: 'Statistics',
      name: medianRes.name,
      avgMs: medianRes.avgMs,
      iterations: medianRes.iterations,
    }
  )

  // -------------------------------------------------------------
  // 2. NUMBER FORMATTING (20,000 calls)
  // -------------------------------------------------------------
  console.log('>>> 2. Benchmarking Number Formatting (20k calls)...')
  const sampleNums = Array.from({ length: 20000 }, () => Math.random() * 100000)

  const standardFmtRes = measure(
    'NumberFormat.format standard (20k)',
    () => {
      for (let i = 0; i < sampleNums.length; i++) {
        NumberFormat.format(sampleNums[i], {
          precision: 2,
          trailingZeros: true,
        })
      }
    },
    5
  )

  const compactFmtRes = measure(
    'NumberFormat.format compact (20k)',
    () => {
      for (let i = 0; i < sampleNums.length; i++) {
        NumberFormat.format(sampleNums[i], {
          notation: 'compact',
          precision: 1,
        })
      }
    },
    5
  )

  results.push(
    {
      category: 'Number Formatting',
      name: standardFmtRes.name,
      avgMs: standardFmtRes.avgMs,
      iterations: standardFmtRes.iterations,
    },
    {
      category: 'Number Formatting',
      name: compactFmtRes.name,
      avgMs: compactFmtRes.avgMs,
      iterations: compactFmtRes.iterations,
    }
  )

  // -------------------------------------------------------------
  // 3. MAP SCALES & COLOR INTERPOLATION (20,000 points)
  // -------------------------------------------------------------
  console.log(
    '>>> 3. Benchmarking Scales & Color Interpolation (20k points)...'
  )
  const testDomain = [0, 500, 1000]
  const testColorRange = ['#ff0000', '#00ff00', '#0000ff']
  const testPoints = Array.from({ length: 20000 }, () => Math.random() * 1000)

  const scaledLinearRes = measure(
    'getScaledValue linear (20k points)',
    () => {
      for (let i = 0; i < testPoints.length; i++) {
        getScaledValue(testDomain, testColorRange, testPoints[i], 'linear')
      }
    },
    5
  )

  const scaledLogRes = measure(
    'getScaledValue log (20k points)',
    () => {
      for (let i = 0; i < testPoints.length; i++) {
        getScaledValue([1, 1000], [10, 50], testPoints[i] + 1, 'log')
      }
    },
    5
  )

  const gradientObj = {
    gradient: {
      scale: 'linear',
      data: [
        { value: 'min', color: '#ff0000', size: 10, label: 'Low' },
        { value: 500, color: '#00ff00', size: 25, label: 'Mid' },
        { value: 'max', color: '#0000ff', size: 50, label: 'High' },
      ],
    },
    min: 0,
    max: 1000,
  }

  const parseGradientRes = measure(
    'parseGradient (5k calls)',
    () => {
      for (let i = 0; i < 5000; i++) {
        parseGradient('color', 2)(gradientObj)
      }
    },
    5
  )

  results.push(
    {
      category: 'Map Scales',
      name: scaledLinearRes.name,
      avgMs: scaledLinearRes.avgMs,
      iterations: scaledLinearRes.iterations,
    },
    {
      category: 'Map Scales',
      name: scaledLogRes.name,
      avgMs: scaledLogRes.avgMs,
      iterations: scaledLogRes.iterations,
    },
    {
      category: 'Map Scales',
      name: parseGradientRes.name,
      avgMs: parseGradientRes.avgMs,
      iterations: parseGradientRes.iterations,
    }
  )

  // -------------------------------------------------------------
  // 4. SUPERCLUSTER CLUSTERING (10,000 points across 17 zooms)
  // -------------------------------------------------------------
  console.log(
    '>>> 4. Benchmarking Supercluster Spatial Indexing (10k points)...'
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

  const clusterRes = measure(
    'Supercluster load & 17 zooms query (10k)',
    () => {
      const superCluster = new Supercluster({ minZoom, maxZoom, radius: 40 })
      superCluster.load(nodes)
      const groups = {}
      for (let z = maxZoom; z >= minZoom; z--) {
        groups[z] = superCluster.getClusters([-180, -90, 180, 90], z)
      }
      return groups
    },
    5
  )

  results.push({
    category: 'Spatial Clustering',
    name: clusterRes.name,
    avgMs: clusterRes.avgMs,
    iterations: clusterRes.iterations,
  })

  // -------------------------------------------------------------
  // 5. REDUX STORE ACTION DISPATCH (1,000 dispatches)
  // -------------------------------------------------------------
  console.log(
    '>>> 5. Benchmarking Redux Store Action Dispatch (1k dispatches)...'
  )
  const storeDispatchRes = measure(
    'store.dispatch mutateLocal (1k)',
    () => {
      for (let i = 0; i < 1000; i++) {
        store.dispatch(
          mutateLocal({
            path: ['settings', 'theme'],
            value: i % 2 === 0 ? 'dark' : 'light',
            sync: false,
          })
        )
      }
    },
    5
  )

  const messageDispatchRes = measure(
    'store.dispatch addMessage / clearMessages (1k)',
    () => {
      for (let i = 0; i < 500; i++) {
        store.dispatch(
          addMessage({
            data: { message: `Notification ${i}`, snackbarShow: true },
          })
        )
      }
      store.dispatch(clearMessages())
    },
    5
  )

  results.push(
    {
      category: 'Redux State Management',
      name: storeDispatchRes.name,
      avgMs: storeDispatchRes.avgMs,
      iterations: storeDispatchRes.iterations,
    },
    {
      category: 'Redux State Management',
      name: messageDispatchRes.name,
      avgMs: messageDispatchRes.avgMs,
      iterations: messageDispatchRes.iterations,
    }
  )

  // -------------------------------------------------------------
  // PRINT SUMMARY TABLE
  // -------------------------------------------------------------
  console.log(`\n${'='.repeat(75)}`)
  console.log('                     BENCHMARK RESULTS SUMMARY')
  console.log('='.repeat(75))
  console.log(
    `${'Category'.padEnd(25)}${'Benchmark'.padEnd(45)}${'Avg (ms)'.padEnd(12)}Iterations`
  )
  console.log('-'.repeat(90))

  for (const r of results) {
    console.log(
      r.category.padEnd(25) +
        r.name.padEnd(45) +
        r.avgMs.toFixed(3).padEnd(12) +
        r.iterations
    )
  }
  console.log(`${'='.repeat(75)}\n`)

  return results
}

// Self-run when executed directly
runBenchmarks()
