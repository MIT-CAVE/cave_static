/* eslint-disable no-fallthrough */
// Adapted from Mike Bostock's:
// https://observablehq.com/@mbostock/localized-number-parsing
import { DEFAULT_LOCALE } from './constants'
import { displayOptions, notationOptions, unitPlacements } from './enums'

class NumberFormat {
  constructor(locale) {
    this._locale = locale || DEFAULT_LOCALE

    const parts = new Intl.NumberFormat(this._locale).formatToParts(12345.6)
    this.group = parts.find((d) => d.type === 'group').value
    this.decimal = parts.find((d) => d.type === 'decimal').value
    this._group = new RegExp(`[${this.group}]`, 'g')
    this._decimal = new RegExp(`[${this.decimal}]`)

    const eParts = new Intl.NumberFormat(locale, {
      notation: 'scientific',
    }).formatToParts(1)
    this.exponentSep = eParts.find((d) => d.type === 'exponentSeparator').value

    const numerals = [
      ...new Intl.NumberFormat(this._locale, { useGrouping: false }).format(
        9876543210
      ),
    ].reverse()
    this._numeral = new RegExp(`[${numerals.join('')}]`, 'g')
    this._index = new Map(numerals.map((d, i) => [d, i]))
    this._intlCache = new Map()
  }

  _getIntlFormatter(options) {
    const key = `${options.minimumFractionDigits}|${options.maximumFractionDigits}|${options.minimumSignificantDigits}|${options.maximumSignificantDigits}|${options.notation}|${options.compactDisplay}`
    let formatter = this._intlCache.get(key)
    if (!formatter) {
      const cleanOptions = {}
      if (options.minimumFractionDigits !== undefined)
        cleanOptions.minimumFractionDigits = options.minimumFractionDigits
      if (options.maximumFractionDigits !== undefined)
        cleanOptions.maximumFractionDigits = options.maximumFractionDigits
      if (options.minimumSignificantDigits !== undefined)
        cleanOptions.minimumSignificantDigits = options.minimumSignificantDigits
      if (options.maximumSignificantDigits !== undefined)
        cleanOptions.maximumSignificantDigits = options.maximumSignificantDigits
      if (options.notation !== undefined)
        cleanOptions.notation = options.notation
      if (options.compactDisplay !== undefined)
        cleanOptions.compactDisplay = options.compactDisplay

      formatter = new Intl.NumberFormat(this._locale, cleanOptions)
      this._intlCache.set(key, formatter)
    }
    return formatter
  }

  isValid(valueStr) {
    const pattern = new RegExp(
      `^(-|\\+)?(0|[1-9]\\d*)?(\\${this.decimal})?(\\d+)?$`
    )
    return pattern.test(valueStr)
  }

  parse(numString) {
    const num = numString
      .trim()
      .replace(this._group, '')
      .replace(this._decimal, '.')
      .replace(this._numeral, (d) => this._index.get(d))

    return num ? +num : NaN
  }

  commonFormat(num, options = {}) {
    const {
      notation,
      precision = 2,
      trailingZeros,
      notationDisplay = displayOptions.SHORT,
    } = typeof options === 'object' && options !== null ? options : {}
    const safePrecision = precision != null && !isNaN(precision) ? precision : 2
    const formatter = this._getIntlFormatter({
      minimumFractionDigits: trailingZeros ? safePrecision : 0,
      maximumFractionDigits: safePrecision,
      notation,
      compactDisplay: notationDisplay,
    })
    return formatter.format(num)
  }

  setExponentNotation(numString, notation, notationDisplay, showZeroExponent) {
    const [significand, rawExponent] = numString.split(this.exponentSep)
    const expoValue = this.parse(rawExponent)
    if (expoValue === 0 && !showZeroExponent) return significand

    let exponentSep
    let showPlusSign
    switch (notationDisplay) {
      case displayOptions.E_PLUS:
        showPlusSign = true
      case displayOptions.E:
        exponentSep = this.exponentSep
        break
      case displayOptions.E_LOWER_PLUS:
        showPlusSign = true
      case displayOptions.E_LOWER:
        exponentSep = this.exponentSep.toLocaleLowerCase(this._locale)
        break
      case displayOptions.X10_PLUS:
        showPlusSign = true
      case displayOptions.X10:
        exponentSep = '\u00d710'
        break
      default:
        throw new Error(
          `Invalid notation display "${notationDisplay}" for "${notation}" notation `
        )
    }

    let exponent = `${expoValue > 0 && showPlusSign ? '+' : ''}${expoValue}`
    if (exponentSep === '\u00d710') {
      exponent = exponent.replace(/[\d+-]/g, (match) => {
        const unicodeSymbols = {
          0: '\u2070',
          1: '\u00b9',
          2: '\u00b2',
          3: '\u00b3',
          4: '\u2074',
          5: '\u2075',
          6: '\u2076',
          7: '\u2077',
          8: '\u2078',
          9: '\u2079',
          '+': '\u207a',
          '-': '\u207b',
        }
        return unicodeSymbols[match]
      })
    }
    return `${significand}${exponentSep}${exponent}`
  }

  exponentialFormat(num, options = {}) {
    const {
      precision = 2,
      trailingZeros,
      showZeroExponent,
      notation = notationOptions.SCIENTIFIC,
      notationDisplay = displayOptions.E_LOWER_PLUS,
    } = typeof options === 'object' && options !== null ? options : {}
    const safePrecision = precision != null && !isNaN(precision) ? precision : 2
    const formatter = this._getIntlFormatter({
      minimumFractionDigits: trailingZeros ? safePrecision : 0,
      maximumFractionDigits: safePrecision,
      notation,
    })
    const numString = formatter.format(num)
    return this.setExponentNotation(
      numString,
      notation,
      notationDisplay,
      showZeroExponent
    )
  }

  /* A localized version of the `toPrecision` method */
  // `precision` must be > 0
  precisionFormat(num, options = {}) {
    const {
      precision = 2,
      notation = notationOptions.PRECISION,
      notationDisplay = displayOptions.E_LOWER_PLUS,
    } = typeof options === 'object' && options !== null ? options : {}
    const safePrecision =
      precision != null && !isNaN(precision) && precision > 0 ? precision : 2
    if (!Number(num).toPrecision(safePrecision).includes('e')) {
      const formatter = this._getIntlFormatter({
        minimumSignificantDigits: safePrecision,
        maximumSignificantDigits: safePrecision,
      })
      return formatter.format(num)
    }

    const formatter = this._getIntlFormatter({
      minimumSignificantDigits: safePrecision,
      maximumSignificantDigits: safePrecision,
      notation: 'scientific',
    })
    const numString = formatter.format(num)
    return this.setExponentNotation(numString, notation, notationDisplay)
  }

  // Units are handled outside the ECMAScript 2023 spec,
  // as custom units are not supported by this specification.
  // See: https://tc39.es/proposal-intl-enumeration/#sec-measurement-unit-identifiers
  format(value, rawOptions = {}) {
    let {
      precision = 2,
      trailingZeros = true,
      fallbackValue = 'N/A',
      notation = notationOptions.STANDARD,
      notationDisplay,
      unit,
      unitPlacement = unitPlacements.AFTER_WITH_SPACE,
      showZeroExponent = false, // REVIEW: Should this be included in the API?
    } = typeof rawOptions === 'object' && rawOptions !== null ? rawOptions : {}
    if (value == null) return fallbackValue
    if (Array.isArray(value)) {
      value =
        value.length >= 2 && typeof value[0] === 'number' ? value[1] : value[0]
    }
    if (value == null) return fallbackValue
    if (value === Infinity || value === -Infinity || isNaN(value)) return 'NaN'

    if (typeof value === 'string') {
      value = +value
    }

    // Fix `notationDisplay` in case of inconsistency in formatting hierarchy integration
    notationDisplay =
      // Allow to catch an invalid `notationDisplay` later in execution
      !Object.values(displayOptions).includes(notationDisplay)
        ? notationDisplay
        : notation === notationOptions.COMPACT ||
            notation === notationOptions.STANDARD
          ? notationDisplay === displayOptions.SHORT ||
            notationDisplay === displayOptions.LONG
            ? notationDisplay
            : undefined
          : notationDisplay === displayOptions.SHORT ||
              notationDisplay === displayOptions.LONG
            ? undefined
            : notationDisplay

    const safePrecision = precision != null && !isNaN(precision) ? precision : 2

    const opts = {
      notation,
      precision: safePrecision,
      trailingZeros,
      notationDisplay,
      showZeroExponent,
    }

    const valueText =
      notation === notationOptions.STANDARD ||
      notation === notationOptions.COMPACT
        ? this.commonFormat(value, opts)
        : notation === notationOptions.SCIENTIFIC ||
            notation === notationOptions.ENGINEERING
          ? this.exponentialFormat(value, opts)
          : notation === notationOptions.PRECISION
            ? this.precisionFormat(value, opts)
            : null
    if (valueText == null)
      throw new Error(`Invalid notation "${notation}" for number formatting`)

    const gap =
      unitPlacement === unitPlacements.AFTER_WITH_SPACE ||
      unitPlacement === unitPlacements.BEFORE_WITH_SPACE
        ? ' '
        : ''
    return unit
      ? unitPlacement === unitPlacements.AFTER ||
        unitPlacement === unitPlacements.AFTER_WITH_SPACE
        ? `${valueText}${gap}${unit}`
        : `${unit}${gap}${valueText}`
      : valueText
  }
}

const instance = new NumberFormat()
Object.freeze(instance)

export default instance
