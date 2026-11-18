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
        gradient: { precision: 0, notation: 'compact', scale: 'log' },
      })
    ).toEqual({ precision: 2, gradient: { precision: 0, notation: 'compact' } })
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
})
