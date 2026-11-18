import { describe, it, expect } from 'vitest'

import {
  getYAxisLabelProps,
  getYAxisNumberFormat,
  isMultiNumberFormat,
  resolveNumberFormat,
} from './index'

import { selectNumberFormatPropsFn } from '../data/selectors'

describe('getYAxisNumberFormat', () => {
  it('is null when no `yAxis` formatting is set', () => {
    expect(
      getYAxisNumberFormat({ precision: 1, notation: 'compact' })
    ).toBeNull()
    expect(getYAxisNumberFormat({ yAxis: {} })).toBeNull()
    expect(getYAxisNumberFormat({})).toBeNull()
    expect(getYAxisNumberFormat(undefined)).toBeNull()
  })

  it('falls back to the plain keys and drops the unit and the block', () => {
    expect(
      getYAxisNumberFormat({
        precision: 3,
        trailingZeros: true,
        unit: 'kg',
        unitPlacement: 'after',
        yAxis: { notation: 'compact' },
      })
    ).toEqual({
      precision: 3,
      trailingZeros: true,
      notation: 'compact',
      notationDisplay: undefined,
    })
  })

  it('prefers the `yAxis` keys and does not reuse a mismatched `notationDisplay`', () => {
    const format = getYAxisNumberFormat({
      precision: 3,
      notation: 'scientific',
      notationDisplay: 'x10^',
      yAxis: { precision: 0, notation: 'compact' },
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
        a: { yAxis: { precision: 1 } },
        b: { yAxis: { precision: 4 } },
      })
    ).toMatchObject({ precision: 1 })
  })

  it('does not mistake a single format starting with `yAxis` for formats keyed by stat id', () => {
    const format = { yAxis: { precision: 1 }, precision: 3 }
    expect(isMultiNumberFormat(format)).toBe(false)
    expect(resolveNumberFormat(format)).toBe(format)
    expect(getYAxisNumberFormat(format)).toMatchObject({ precision: 1 })
    expect(isMultiNumberFormat({ yAxis: { precision: 1 } })).toBe(false)
  })
})

describe('isMultiNumberFormat', () => {
  it('detects formats keyed by stat id', () => {
    expect(isMultiNumberFormat({ a: { precision: 1 }, b: {} })).toBe(true)
    expect(isMultiNumberFormat({ a: { yAxis: { precision: 1 } } })).toBe(true)
  })

  it('is false for a single format or an empty one', () => {
    expect(
      isMultiNumberFormat({ precision: 1, gradient: { precision: 2 } })
    ).toBe(false)
    expect(isMultiNumberFormat({})).toBe(false)
    expect(isMultiNumberFormat(undefined)).toBe(false)
  })
})

describe('selectNumberFormatPropsFn', () => {
  const getFormat = (defaults) => selectNumberFormatPropsFn.resultFunc(defaults)

  it('falls back per key to `settings.defaults.yAxis`', () => {
    const format = getFormat({
      precision: 2,
      yAxis: { notation: 'compact', precision: 1 },
    })({ precision: 4, yAxis: { precision: 0 } })
    expect(format).toMatchObject({
      precision: 4,
      yAxis: { notation: 'compact', precision: 0 },
    })
  })

  it('keeps the default block when the stat has none, and vice versa', () => {
    expect(getFormat({ yAxis: { notation: 'compact' } })({}).yAxis).toEqual({
      notation: 'compact',
    })
    expect(getFormat({})({ yAxis: { precision: 0 } }).yAxis).toEqual({
      precision: 0,
    })
    expect(getFormat({})({}).yAxis).toBeUndefined()
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
      { trailingZeros: false, yAxis: { notation: 'compact', precision: 1 } },
      2_500_000
    )
    expect(nameSuffix).toBe('')
    expect(formatter(2_500_000)).toBe('2.5M')
    expect(formatter(1_000)).toBe('1K')
  })

  it('supports trailing zeros', () => {
    const { formatter } = getYAxisLabelProps(
      { yAxis: { precision: 2, trailingZeros: true } },
      10
    )
    expect(formatter(1.5)).toBe('1.50')
  })
})
