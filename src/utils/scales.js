import { colord } from 'colord'
import { scaleLinear, scaleLog, scalePow, scaleThreshold } from 'd3-scale'
import * as R from 'ramda'

import { scaleId, scaleParamId } from './enums'

// `scaleIndexedOptions` acts as the allowlist of legend-supported
// scales, keeping unsupported scales (e.g. `exp`) out of the selector
export const scaleIndexedOptions = {
  [scaleId.LINEAR]: { label: 'Linear', iconName: 'pi/PiArrowUpRight' },
  [scaleId.STEP]: { label: 'Step', iconName: 'pi/PiSteps' },
  [scaleId.LOG]: { label: 'Logarithmic', iconName: 'pi/PiArrowBendUpRight' },
  [scaleId.POW]: { label: 'Power', iconName: 'pi/PiArrowBendRightUp' },
}

// eslint-disable-next-line ramda/cond-simplification
export const getScaleParamLabel = R.cond([
  [R.equals(scaleParamId.EXPONENT), R.always('Exponent')],
  [R.T, R.always(null)],
])

// eslint-disable-next-line ramda/cond-simplification
export const getScaleParamDefaults = R.cond([
  [R.equals(scaleParamId.EXPONENT), R.always(1)], // Default exponent to 1 (equivalent to `'linear'`)
  [R.T, R.always(null)],
])

/**
 * Returns a transform that maps a raw value to its scaled (display)
 * representation. Unlike `getScaledValue`, this is the pure, unbounded
 * scale function with no domain/range interpolation.
 *
 * The CAVE API requires `exponent` for `'pow'` and `base` for `'exp'`;
 * only `'log'`'s `base` is optional (defaults to 10).
 */
export const getScaleTransform =
  (scale = scaleId.LINEAR, scaleParams = {}) =>
  (value) =>
    scale === scaleId.POW
      ? Math.pow(value, scaleParams.exponent)
      : scale === scaleId.LOG
        ? Math.log(value) / Math.log(scaleParams.base ?? 10)
        : scale === scaleId.EXP
          ? Math.pow(scaleParams.base, value)
          : value

/**
 * Returns the inverse of `getScaleTransform`, mapping a scaled (display)
 * value back to its raw form.
 */
export const getInverseScaleTransform =
  (scale = scaleId.LINEAR, scaleParams = {}) =>
  (scaledValue) =>
    scale === scaleId.POW
      ? Math.pow(scaledValue, 1 / scaleParams.exponent)
      : scale === scaleId.LOG
        ? Math.pow(scaleParams.base ?? 10, scaledValue)
        : scale === scaleId.EXP
          ? Math.log(scaledValue) / Math.log(scaleParams.base)
          : scaledValue

const scaleCache = new Map()
const MAX_SCALE_CACHE_SIZE = 1000

/**
 * Returns a configured scale function for the given domain and range,
 * caching the instantiated d3 scale and parsed colors.
 */
export const getScaleFunction = (
  domain,
  range,
  scale = scaleId.LINEAR,
  scaleParams = {},
  fallback = null
) => {
  const cacheKey = `${domain[0]},${domain[1]}|${range.join(',')}|${scale}|${scaleParams?.exponent || ''}|${scaleParams?.base || ''}|${fallback}`
  let scaleFunc = scaleCache.get(cacheKey)
  if (!scaleFunc) {
    if (scaleCache.size >= MAX_SCALE_CACHE_SIZE) {
      scaleCache.clear()
    }
    const scaleBuilder =
      scale === scaleId.LINEAR
        ? scaleLinear()
        : scale === scaleId.STEP
          ? scaleThreshold()
          : scale === scaleId.LOG
            ? scaleLog()
            : scale === scaleId.POW
              ? scalePow().exponent(
                  scaleParams?.exponent ||
                    getScaleParamDefaults(scaleParamId.EXPONENT)
                )
              : () => {
                  throw new Error(`Invalid scale "${scale}"`)
                }

    // Parse range (when using colors) for CSS Color Module Level 4 compatibility
    const parsedRange = range.map((rngValue) => {
      if (typeof rngValue !== 'string') return rngValue
      const color = colord(rngValue)
      return color.isValid() ? color.toRgbString() : rngValue
    })

    const built = scaleBuilder
      .domain(domain)
      .range(parsedRange)
      .unknown(fallback)

    scaleFunc = scale === scaleId.STEP ? (v) => built(v) : built.clamp(true)
    scaleCache.set(cacheKey, scaleFunc)
  }
  return scaleFunc
}

/**
 * Returns a scaled value based on the provided domain, range, and scale type.
 *
 * @param {Array<number>} domain - The input domain as an array of numbers [min, max].
 * @param {Array<any>} range - The output range corresponding to the domain (e.g., [start, end]).
 * @param {number} value - The input value to scale.
 * @param {string} [scale='linear'] - The type of scale to apply. Supported values: 'linear', 'pow', 'log', 'step'.
 * @param {number|{}} [scaleParams={}] - An optional parameter for scales (exponent for 'pow').
 * @param {any} [fallback=null] - The fallback value to return if the input is invalid or unknown.
 * @returns {number|any} - The scaled value within the range, or the fallback if the input is invalid.
 *
 * @throws {Error} Throws an error if an invalid scale type is provided.
 */
export const getScaledValue = R.curry(
  (
    domain,
    range,
    value,
    scale = scaleId.LINEAR,
    scaleParams = {},
    fallback = null
  ) => {
    const scaleFunc = getScaleFunction(
      domain,
      range,
      scale,
      scaleParams,
      fallback
    )
    return scaleFunc(value)
  }
)
