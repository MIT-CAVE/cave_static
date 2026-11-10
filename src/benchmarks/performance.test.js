import { performance } from 'perf_hooks'
import { describe, it, expect } from 'vitest'

import { mutateLocal } from '../data/local'
import { addMessage, clearMessages } from '../data/utilities/messagesSlice'
import { parseGradient } from '../utils'
import NumberFormat from '../utils/NumberFormat'
import { getScaledValue, getScaleFunction } from '../utils/scales'
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

function measure(fn, iterations = 1) {
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
  return { totalMs, avgMs, iterations }
}

describe('Performance Benchmarks Suite', () => {
  it('1. Statistics Aggregation Benchmark (100k items)', () => {
    const numItems = 100000
    const numbers = Array.from({ length: numItems }, (_, i) => i + 1)
    const mixed = Array.from({ length: numItems }, (_, i) =>
      i % 5 === 0 ? `cat_${i % 10}` : (i % 100) + 1
    )

    const sumMetric = measure(() => getSum(numbers), 5)
    const meanMetric = measure(() => getMean(numbers), 5)
    const maxMetric = measure(() => getMax(mixed), 5)
    const minMetric = measure(() => getMin(mixed), 5)
    const modeMetric = measure(() => getMode(mixed), 5)
    const medianMetric = measure(() => getMedian(numbers), 3)

    expect(getSum(numbers)).toBe((numItems * (numItems + 1)) / 2)
    expect(getMean(numbers)).toBe((numItems + 1) / 2)
    expect(getMax(mixed)).toBe(100)
    expect(getMin(mixed)).toBe('cat_0')
    expect(getMin(numbers)).toBe(1)
    expect(typeof getMode(mixed)).toBe('string')
    expect(getMedian(numbers)).toBe((numItems + 1) / 2)

    expect(sumMetric.avgMs).toBeLessThan(50)
    expect(meanMetric.avgMs).toBeLessThan(50)
    expect(maxMetric.avgMs).toBeLessThan(50)
    expect(minMetric.avgMs).toBeLessThan(50)
    expect(modeMetric.avgMs).toBeLessThan(100)
    expect(medianMetric.avgMs).toBeLessThan(200)
  })

  it('2. Number Formatting Benchmark (20k items)', () => {
    const sampleNums = Array.from(
      { length: 20000 },
      () => Math.random() * 100000
    )

    const standardMetric = measure(() => {
      for (let i = 0; i < sampleNums.length; i++) {
        NumberFormat.format(sampleNums[i], {
          precision: 2,
          trailingZeros: true,
        })
      }
    }, 2)

    const compactMetric = measure(() => {
      for (let i = 0; i < sampleNums.length; i++) {
        NumberFormat.format(sampleNums[i], {
          notation: 'compact',
          precision: 1,
        })
      }
    }, 2)

    expect(standardMetric.avgMs).toBeLessThan(150)
    expect(compactMetric.avgMs).toBeLessThan(150)
  })

  it('3. Map Scales & Color Interpolation Benchmark (20k points)', () => {
    const testDomain = [0, 500, 1000]
    const testColorRange = ['#ff0000', '#00ff00', '#0000ff']
    const testPoints = Array.from({ length: 20000 }, () => Math.random() * 1000)

    const scaleFunc = getScaleFunction(testDomain, testColorRange, 'linear')
    expect(typeof scaleFunc).toBe('function')
    expect(scaleFunc(0)).toBe('rgb(255, 0, 0)')
    expect(scaleFunc(1000)).toBe('rgb(0, 0, 255)')

    const linearMetric = measure(() => {
      for (let i = 0; i < testPoints.length; i++) {
        getScaledValue(testDomain, testColorRange, testPoints[i], 'linear')
      }
    }, 3)

    const gradientObj = {
      gradient: {
        scale: 'linear',
        data: [
          { value: 'min', color: '#ff0000', size: 10 },
          { value: 500, color: '#00ff00', size: 25 },
          { value: 'max', color: '#0000ff', size: 50 },
        ],
      },
      min: 0,
      max: 1000,
    }

    const parseMetric = measure(() => {
      for (let i = 0; i < 5000; i++) {
        parseGradient('color', 2)(gradientObj)
      }
    }, 3)

    expect(linearMetric.avgMs).toBeLessThan(100)
    expect(parseMetric.avgMs).toBeLessThan(50)
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

    const clusterMetric = measure(() => {
      const superCluster = new Supercluster({ minZoom, maxZoom, radius: 40 })
      superCluster.load(nodes)
      const groups = {}
      for (let z = maxZoom; z >= minZoom; z--) {
        groups[z] = superCluster.getClusters([-180, -90, 180, 90], z)
      }
      return groups
    }, 2)

    expect(clusterMetric.avgMs).toBeLessThan(500)
  })

  it('5. Redux Store Action Dispatch Benchmark', () => {
    const dispatchMetric = measure(() => {
      for (let i = 0; i < 500; i++) {
        store.dispatch(
          mutateLocal({
            path: ['settings', 'theme'],
            value: i % 2 === 0 ? 'dark' : 'light',
            sync: false,
          })
        )
      }
    }, 3)

    const messagesMetric = measure(() => {
      for (let i = 0; i < 200; i++) {
        store.dispatch(
          addMessage({
            data: { message: `Alert ${i}`, snackbarShow: true },
          })
        )
      }
      store.dispatch(clearMessages())
    }, 3)

    expect(dispatchMetric.avgMs).toBeLessThan(100)
    expect(messagesMetric.avgMs).toBeLessThan(100)
  })
})
