import { describe, it, expect } from 'vitest'

import {
  selectLegendNumberFormatFunc,
  selectNumberFormat,
  selectNumberFormatPropsFn,
} from './index'

describe('number format selectors', () => {
  it('only reads `gradient` options from props, not from `settings.defaults`', () => {
    expect(
      selectNumberFormat.resultFunc({
        defaults: { precision: 2, gradient: { precision: 1 } },
      })
    ).toEqual({ precision: 2 })
  })

  it('picks the `gradient` options of a prop', () => {
    const getFormat = selectNumberFormatPropsFn.resultFunc({ precision: 2 })
    expect(
      getFormat({
        gradient: {
          precision: 0,
          notation: 'compact',
          trailingZeros: true,
          scale: 'log',
        },
      })
    ).toEqual({
      precision: 2,
      gradient: { precision: 0, notation: 'compact', trailingZeros: true },
    })
  })

  it('resolves the legend format: gradient -> prop -> defaults', () => {
    const getLegendFormat = selectLegendNumberFormatFunc.resultFunc(
      selectNumberFormatPropsFn.resultFunc({
        precision: 2,
        notation: 'standard',
      })
    )
    expect(getLegendFormat({ gradient: { precision: 1 } })).toMatchObject({
      precision: 1,
      notation: 'standard',
    })
    expect(
      getLegendFormat({ precision: 3, notation: 'compact' })
    ).toMatchObject({
      precision: 3,
      notation: 'compact',
    })
  })

  it('lets `gradient.trailingZeros` override the prop and the defaults, including `false`', () => {
    const getLegendFormat = (defaults) =>
      selectLegendNumberFormatFunc.resultFunc(
        selectNumberFormatPropsFn.resultFunc(defaults)
      )
    expect(
      getLegendFormat({ trailingZeros: true })({
        gradient: { trailingZeros: false },
      }).trailingZeros
    ).toBe(false)
    expect(
      getLegendFormat({ trailingZeros: false })({
        gradient: { trailingZeros: true },
      }).trailingZeros
    ).toBe(true)
    // Falls back to the prop, then the defaults
    expect(getLegendFormat({ trailingZeros: true })({}).trailingZeros).toBe(
      true
    )
    expect(
      getLegendFormat({ trailingZeros: true })({ trailingZeros: false })
        .trailingZeros
    ).toBe(false)
  })

  it('lets `gradient.precision: 0` override a non-zero prop precision', () => {
    const getLegendFormat = selectLegendNumberFormatFunc.resultFunc(
      selectNumberFormatPropsFn.resultFunc({ precision: 2 })
    )
    expect(
      getLegendFormat({ precision: 3, gradient: { precision: 0 } }).precision
    ).toBe(0)
    // Falls back to the prop precision when the gradient has none
    expect(getLegendFormat({ precision: 3, gradient: {} }).precision).toBe(3)
  })
})
