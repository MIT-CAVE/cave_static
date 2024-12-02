import { scaleLinear, scaleLog, scalePow } from 'd3-scale'
import * as R from 'ramda'

import { scaleId, scaleParamId } from './enums'

export const getScaleLabel = R.cond([
  [R.equals(scaleId.LINEAR), R.always('Linear')],
  [R.equals(scaleId.LOG), R.always('Logarithmic')],
  [R.equals(scaleId.POW), R.always('Power')],
  [R.T, R.always(null)],
])

export const getScaleParamLabel = R.cond([
  [R.equals(scaleParamId.BASE), R.always('Base')],
  [R.equals(scaleParamId.EXPONENT), R.always('Exponent')],
  [R.T, R.always(null)],
])

export const getScaleParamDefaults = R.cond([
  [R.equals(scaleParamId.BASE), R.always(10)], // Default to a `log10` scale function
  [R.equals(scaleParamId.EXPONENT), R.always(1)], // Default exponent to 1 (equivalent to `'linear'`)
  [R.T, R.always(null)],
])

/**
 * Returns a scaled value based on the provided domain, range, and scale type.
 *
 * @param {Array<number>} domain - The input domain as an array of numbers [min, max].
 * @param {Array<any>} range - The output range corresponding to the domain (e.g., [start, end]).
 * @param {number} value - The input value to scale.
 * @param {string} [scale='linear'] - The type of scale to apply. Supported values: 'linear', 'pow', 'log'.
 * @param {number|{}} [scaleParams={}] - An optional parameter for 'pow' and 'log' scales (exponent for 'pow', base for 'log').
 * @param {any} [fallback=null] - The fallback value to return if the input is invalid or unknown.
 * @returns {number|any} - The scaled value within the range, or the fallback if the input is invalid.
 *
 * @throws {Error} Throws an error if an invalid scale type is provided.
 */
export const getScaledValueAlt = R.curry(
  (
    domain,
    range,
    value,
    scale = scaleId.LINEAR,
    scaleParams = {},
    fallback = null
  ) => {
    const scaleBuilder =
      scale === scaleId.LINEAR
        ? scaleLinear()
        : scale === scaleId.POW
          ? scalePow().exponent(
              scaleParams.exponent ||
                getScaleParamDefaults(scaleParamId.EXPONENT)
            )
          : scale === scaleId.LOG
            ? scaleLog().base(
                scaleParams.base || getScaleParamDefaults(scaleParamId.BASE)
              )
            : () => {
                throw new Error(`Invalid scale "${scale}"`)
              }
    const scaleFunc = scaleBuilder
      .domain(domain)
      .range(range)
      .clamp(true)
      .unknown(fallback)
    return scaleFunc(value) // Return the scaled value or the fallback
  }
)
