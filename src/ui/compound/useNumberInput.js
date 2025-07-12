import * as R from 'ramda'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { NumberFormat } from '../../utils'

const removeUnits = (numberFormat) => {
  // Here, units are excluded from `format` as
  // they are rendered in the prop container
  // eslint-disable-next-line no-unused-vars
  const { unit, unitPlacement, ...rest } = numberFormat
  return rest
}

const shallowEqual = (object1, object2) => {
  const keys1 = Object.keys(object1)
  const keys2 = Object.keys(object2)

  if (keys1.length !== keys2.length) {
    return false
  }

  for (let key of keys1) {
    if (object1[key] !== object2[key]) {
      return false
    }
  }

  return true
}

const useNumberInput = ({
  defaultValue,
  numberFormat,
  setFieldValue,
  setKeyboardValue,
}) => {
  // only changes when numberFormat's keys/values change
  const [numberFormatMemo, setNumberFormatMemo] = useState(() =>
    removeUnits(numberFormat)
  )

  useEffect(() => {
    const newNumberFormatMemo = removeUnits(numberFormat)
    if (!shallowEqual(newNumberFormatMemo, numberFormatMemo)) {
      setNumberFormatMemo(newNumberFormatMemo)
    }
  }, [numberFormat, numberFormatMemo])

  // NaN's can happen for these valid inputs: '.', '-', '-.', '+', '+.'
  const [validNaNs, zerosMatch] = useMemo(
    () => [
      new RegExp(`^(-|\\+)?0?\\${NumberFormat.decimal}?$`),
      new RegExp(`\\${NumberFormat.decimal}\\d*?[1-9]*(0+)?$`),
    ],
    []
  )

  const handleChange = useCallback(
    (event) => {
      const rawValueText = event.target.value
      const rawValue = NumberFormat.parse(rawValueText)
      if (!NumberFormat.isValid(rawValue) && !R.test(validNaNs)(rawValueText))
        return

      if (isNaN(rawValue)) {
        setFieldValue(defaultValue) // Go back to default in case blur occurs prematurely
        setKeyboardValue(rawValueText)
      } else {
        const forceInt = numberFormatMemo.precision === 0 // Decimals not allowed
        const trailingZeros = R.pipe(
          R.match(zerosMatch),
          R.nth(1)
        )(rawValueText)
        const newValueText = rawValue.toString()

        setFieldValue(rawValue)
        setKeyboardValue(
          `${newValueText}${
            !forceInt &&
            // was the decimal lost in formatting?
            rawValueText.includes(NumberFormat.decimal) &&
            !newValueText.includes(NumberFormat.decimal)
              ? NumberFormat.decimal
              : ''
          }${trailingZeros != null ? trailingZeros : ''}`
        )
      }
    },
    [
      defaultValue,
      numberFormatMemo.precision,
      setFieldValue,
      setKeyboardValue,
      validNaNs,
      zerosMatch,
    ]
  )

  return {
    numberFormatMemo,
    validNaNs,
    zerosMatch,
    handleChange,
  }
}

export default useNumberInput
