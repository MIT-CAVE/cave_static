import { describe, expect, it } from 'vitest'

import { getMixedChartType } from './mixedChartTypes'

describe('getMixedChartType', () => {
  it('defaults to a line on the left and bars on the right', () => {
    expect(getMixedChartType({}, 'left')).toBe('line')
    expect(getMixedChartType({}, 'right')).toBe('bar')
    expect(getMixedChartType(undefined, 'right')).toBe('bar')
  })

  it('uses the chart types of the chart options', () => {
    const chart = {
      chartOptions: { leftChartType: 'bar', rightChartType: 'cumulative_line' },
    }
    expect(getMixedChartType(chart, 'left')).toBe('bar')
    expect(getMixedChartType(chart, 'right')).toBe('cumulative_line')
  })

  it('falls back to the variants of charts edited before', () => {
    const chart = { leftVariant: 'bar', rightVariant: 'line' }
    expect(getMixedChartType(chart, 'left')).toBe('bar')
    expect(getMixedChartType(chart, 'right')).toBe('line')
  })

  it('prefers the chart options over the variants, per side', () => {
    const chart = {
      leftVariant: 'bar',
      rightVariant: 'bar',
      chartOptions: { leftChartType: 'cumulative_line' },
    }
    expect(getMixedChartType(chart, 'left')).toBe('cumulative_line')
    expect(getMixedChartType(chart, 'right')).toBe('bar')
  })

  it('ignores values that cannot be drawn', () => {
    const chart = {
      leftVariant: 'area',
      chartOptions: { rightChartType: 1 },
    }
    expect(getMixedChartType(chart, 'left')).toBe('line')
    expect(getMixedChartType(chart, 'right')).toBe('bar')
  })
})
