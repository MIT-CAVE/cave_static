import { describe, it, expect } from 'vitest'

import { getYAxisLabelProps, getYAxisNumberFormat } from './index'

describe('getYAxisNumberFormat', () => {
  it('is null when no `yAxis*` attribute is set', () => {
    expect(
      getYAxisNumberFormat({ precision: 1, notation: 'compact' })
    ).toBeNull()
    expect(getYAxisNumberFormat({})).toBeNull()
    expect(getYAxisNumberFormat(undefined)).toBeNull()
  })

  it('falls back to the plain attributes and drops units', () => {
    expect(
      getYAxisNumberFormat({
        precision: 3,
        trailingZeros: true,
        unit: 'kg',
        unitPlacement: 'after',
        yAxisNotation: 'compact',
      })
    ).toEqual({
      precision: 3,
      trailingZeros: true,
      notation: 'compact',
      notationDisplay: undefined,
      yAxisNotation: 'compact',
    })
  })

  it('prefers `yAxis*` attributes and does not reuse a mismatched `notationDisplay`', () => {
    const format = getYAxisNumberFormat({
      precision: 3,
      notation: 'scientific',
      notationDisplay: 'x10^',
      yAxisPrecision: 0,
      yAxisNotation: 'compact',
    })
    expect(format).toMatchObject({
      precision: 0,
      notation: 'compact',
      notationDisplay: undefined,
    })
  })

  it('uses the first stat when given formats keyed by stat id', () => {
    expect(
      getYAxisNumberFormat({
        a: { yAxisPrecision: 1 },
        b: { yAxisPrecision: 4 },
      })
    ).toMatchObject({ precision: 1 })
  })
})

describe('getYAxisLabelProps', () => {
  it('keeps the automatic scaling by default', () => {
    const { nameSuffix, formatter } = getYAxisLabelProps({}, 2_500_000)
    expect(nameSuffix).toBe(' (millions)')
    expect(formatter(2_500_000)).toBe('2.50')
  })

  it('formats labels and drops the scale suffix when configured', () => {
    const { nameSuffix, formatter } = getYAxisLabelProps(
      { yAxisNotation: 'compact', yAxisPrecision: 1, trailingZeros: false },
      2_500_000
    )
    expect(nameSuffix).toBe('')
    expect(formatter(2_500_000)).toBe('2.5M')
    expect(formatter(1_000)).toBe('1K')
  })

  it('supports trailing zeros', () => {
    const { formatter } = getYAxisLabelProps(
      { yAxisPrecision: 2, yAxisTrailingZeros: true },
      10
    )
    expect(formatter(1.5)).toBe('1.50')
  })
})
