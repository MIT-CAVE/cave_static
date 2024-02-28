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

  commonFormat(
    num,
    {
      notation,
      precision,
      trailingZeros,
      notationDisplay = displayOptions.SHORT,
    }
  ) {
    return num.toLocaleString(this._locale, {
      minimumFractionDigits: trailingZeros ? precision : 0,
      maximumFractionDigits: precision,
      notation,
      compactDisplay: notationDisplay,
    })
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

  exponentialFormat(
    num,
    {
      precision,
      trailingZeros,
      showZeroExponent,
      notation,
      notationDisplay = displayOptions.E_LOWER_PLUS,
    }
  ) {
    const numString = num.toLocaleString(this._locale, {
      minimumFractionDigits: trailingZeros ? precision : 0,
      maximumFractionDigits: precision,
      notation,
    })
    return this.setExponentNotation(
      numString,
      notation,
      notationDisplay,
      showZeroExponent
    )
  }

  /* A localized version of the `toPrecision` method */
  // `precision` must be > 0
  precisionFormat(
    num,
    { precision, notation, notationDisplay = displayOptions.E_LOWER_PLUS }
  ) {
    if (!Number(num).toPrecision(precision).includes('e')) {
      return num.toLocaleString(this._locale, {
        minimumSignificantDigits: precision,
        maximumSignificantDigits: precision,
      })
    }

    const numString = num.toLocaleString(this._locale, {
      minimumSignificantDigits: precision,
      maximumSignificantDigits: precision,
      notation: 'scientific',
    })
    return this.setExponentNotation(numString, notation, notationDisplay)
  }

  // Units are handled outside the ECMAScript 2023 spec,
  // as custom units are not supported by this specification.
  // See: https://tc39.es/proposal-intl-enumeration/#sec-measurement-unit-identifiers
  format(
    value,
    {
      precision = 2,
      trailingZeros = true,
      fallbackValue = 'N/A',
      notation = notationOptions.STANDARD,
      notationDisplay,
      unit,
      unitPlacement = unitPlacements.AFTER_WITH_SPACE,
      showZeroExponent = false, // REVIEW: Should this be included in the API?
    }
  ) {
    if (value == null) return fallbackValue
    if (value === Infinity || value === -Infinity || isNaN(value)) return 'NaN'

    // Advocate good dev practices
    if (typeof value === 'string') {
      console.warn(
        `Value "${value}" is expected to be a number, but a \`string\` was received with the following number formatting options:
${JSON.stringify({ precision, trailingZeros, notation, notationDisplay, showZeroExponent, unit, unitPlacement }, null, 2)}
The value will be parsed as a \`float\` number.`
      )
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

    const opts = {
      notation,
      precision,
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
