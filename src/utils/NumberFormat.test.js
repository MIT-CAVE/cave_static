import { describe, it, expect } from 'vitest'

import NumberFormat from './NumberFormat'

describe('NumberFormat', () => {
  describe('format - defensive options handling', () => {
    it('formats with default options when options is omitted', () => {
      expect(NumberFormat.format(1234.5678)).toBe('1,234.57')
    })

    it('formats with default options when options is undefined', () => {
      expect(NumberFormat.format(1234.5678, undefined)).toBe('1,234.57')
    })

    it('formats with default options when options is null', () => {
      expect(NumberFormat.format(1234.5678, null)).toBe('1,234.57')
    })

    it('formats with default options when options is empty string', () => {
      expect(NumberFormat.format(1234.5678, '')).toBe('1,234.57')
    })

    it('formats with default options when options is empty object', () => {
      expect(NumberFormat.format(1234.5678, {})).toBe('1,234.57')
    })

    it('falls back to default precision when precision is null or undefined', () => {
      expect(NumberFormat.format(1234.5678, { precision: undefined })).toBe(
        '1,234.57'
      )
      expect(NumberFormat.format(1234.5678, { precision: null })).toBe(
        '1,234.57'
      )
      expect(NumberFormat.format(1234.5678, { precision: NaN })).toBe(
        '1,234.57'
      )
    })

    it('respects precision = 0 (integer formatting)', () => {
      expect(NumberFormat.format(1234.5678, { precision: 0 })).toBe('1,235')
      expect(NumberFormat.format(100, { precision: 0 })).toBe('100')
    })

    it('respects custom precision and unit', () => {
      expect(NumberFormat.format(42.12345, { precision: 3, unit: 'km' })).toBe(
        '42.123 km'
      )
    })
  })

  describe('format - special values', () => {
    it('returns fallbackValue for null and undefined', () => {
      expect(NumberFormat.format(null)).toBe('N/A')
      expect(NumberFormat.format(undefined)).toBe('N/A')
      expect(NumberFormat.format(null, { fallbackValue: '-' })).toBe('-')
    })

    it('returns NaN for NaN and Infinity', () => {
      expect(NumberFormat.format(NaN)).toBe('NaN')
      expect(NumberFormat.format(Infinity)).toBe('NaN')
      expect(NumberFormat.format(-Infinity)).toBe('NaN')
    })

    it('parses string numbers', () => {
      expect(NumberFormat.format('1234.5', { precision: 1 })).toBe('1,234.5')
    })
  })

  describe('direct format methods defensive handling', () => {
    it('commonFormat handles undefined and null options', () => {
      expect(NumberFormat.commonFormat(1234.5678, undefined)).toBe('1,234.57')
      expect(NumberFormat.commonFormat(1234.5678, null)).toBe('1,234.57')
    })

    it('exponentialFormat handles undefined and null options', () => {
      expect(NumberFormat.exponentialFormat(1234.5678, undefined)).toBe(
        '1.23e+3'
      )
      expect(NumberFormat.exponentialFormat(1234.5678, null)).toBe('1.23e+3')
    })

    it('precisionFormat handles undefined and null options', () => {
      expect(NumberFormat.precisionFormat(1234.5678, undefined)).toBe('1.2e+3')
      expect(NumberFormat.precisionFormat(1234.5678, null)).toBe('1.2e+3')
    })
  })

  describe('chart hover / tooltip formatting scenarios', () => {
    it('handles chart tooltip formatting when numberFormat is undefined', () => {
      let numberFormat
      expect(() => NumberFormat.format(150, numberFormat)).not.toThrow()
      expect(NumberFormat.format(150, numberFormat)).toBe('150.00')
    })

    it('handles chart tooltip formatting when numberFormat[seriesId] is undefined', () => {
      const numberFormat = {
        statA: { precision: 0, unit: '$' },
      }
      const missingSeriesId = 'statB'
      expect(() =>
        NumberFormat.format(250, numberFormat[missingSeriesId])
      ).not.toThrow()
      expect(NumberFormat.format(250, numberFormat[missingSeriesId])).toBe(
        '250.00'
      )
    })

    it('handles chart tooltip formatting when seriesId is an echarts generated string', () => {
      const numberFormat = {
        sales: { precision: 2, unit: 'units' },
      }
      const autoSeriesId = '\u0000series0\u00000'
      expect(() =>
        NumberFormat.format(350, numberFormat[autoSeriesId])
      ).not.toThrow()
      expect(NumberFormat.format(350, numberFormat[autoSeriesId])).toBe(
        '350.00'
      )
    })

    it('defensively handles coordinate pair arrays from line charts [xIndex, yValue]', () => {
      expect(NumberFormat.format([0, 42.5])).toBe('42.50')
      expect(NumberFormat.format([3, 100], { precision: 0 })).toBe('100')
      expect(
        NumberFormat.format([1, 1250.75], { precision: 1, unit: 'USD' })
      ).toBe('1,250.8 USD')
    })

    it('defensively handles single-element arrays [yValue]', () => {
      expect(NumberFormat.format([42.5])).toBe('42.50')
      expect(NumberFormat.format([100], { precision: 0 })).toBe('100')
    })

    it('handles arrays with null, undefined, NaN, or empty', () => {
      expect(NumberFormat.format([])).toBe('N/A')
      expect(NumberFormat.format([0, null])).toBe('N/A')
      expect(NumberFormat.format([0, undefined])).toBe('N/A')
      expect(NumberFormat.format([0, NaN])).toBe('NaN')
    })

    it('simulates line chart tooltip formatter with coordinate pairs and multiNumberFormat', () => {
      const numberFormat = {
        numericStatExampleA: { precision: 2 },
        numericStatExampleB: { precision: 0 },
      }
      const visualMap = true
      const getChartValue = (value) =>
        visualMap && Array.isArray(value) ? value[1] : value
      const getNumberFormat = (labelKey, value) =>
        NumberFormat.format(
          getChartValue(value),
          numberFormat?.[labelKey] ?? Object.values(numberFormat)[0] ?? {}
        )

      const param = {
        name: 'SKU 1',
        seriesId: '\u0000series\u00000',
        seriesName: 'Stat Example A',
        value: [0, 42.5],
      }
      const formatted = getNumberFormat(param.seriesId, param.value)
      expect(formatted).toBe('42.50')
      expect(formatted).not.toBe('NaN')
    })

    it('ensures tooltip series title is empty when defaulting to series0 or when single series', () => {
      const cleanSeriesName = (seriesName) =>
        seriesName == null || /^series\d+$/i.test(seriesName) ? '' : seriesName

      const renderSeriesTitle = (marker, seriesName, isSingle) => {
        const cleanName = isSingle ? '' : cleanSeriesName(seriesName)
        return cleanName
          ? `<div style="text-align: center; flex: 1 1 auto; margin-right: 32px">${marker} ${cleanName}</div>`
          : `<div style="text-align: center; flex: 1 1 auto">${marker}</div>`
      }

      const marker = '<span style="color:red">●</span>'

      // When seriesName defaults to series0, title should just be the marker without series0
      expect(renderSeriesTitle(marker, 'series0', false)).toBe(
        '<div style="text-align: center; flex: 1 1 auto"><span style="color:red">●</span></div>'
      )
      expect(renderSeriesTitle(marker, 'series1', false)).toBe(
        '<div style="text-align: center; flex: 1 1 auto"><span style="color:red">●</span></div>'
      )

      // When isSingle is true, title should just be the marker even if seriesName is set
      expect(renderSeriesTitle(marker, 'Stat Example A', true)).toBe(
        '<div style="text-align: center; flex: 1 1 auto"><span style="color:red">●</span></div>'
      )

      // When isSingle is false and real series name is present, title includes the name
      expect(renderSeriesTitle(marker, 'Stat Example A', false)).toBe(
        '<div style="text-align: center; flex: 1 1 auto; margin-right: 32px"><span style="color:red">●</span> Stat Example A</div>'
      )
    })
  })
})
