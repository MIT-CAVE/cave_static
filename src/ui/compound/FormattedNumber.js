import PropTypes from 'prop-types'

import RichLabel from './RichLabel'

import { NumberFormat } from '../../utils'

/**
 * A formatted number with its unit. The unit is rich text when `richText` is
 * `true`, which `NumberFormat.format` can not do as it returns a single string.
 */
const FormattedNumber = ({ value, numberFormat, richText }) => {
  const { text, unit, gap, unitAfter } = NumberFormat.formatParts(
    value,
    numberFormat
  )
  if (!unit) return text
  const unitText = <RichLabel text={unit} rich={richText === true} />
  return unitAfter ? (
    <>
      {text}
      {gap}
      {unitText}
    </>
  ) : (
    <>
      {unitText}
      {gap}
      {text}
    </>
  )
}
FormattedNumber.propTypes = {
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.array,
  ]),
  numberFormat: PropTypes.object,
  richText: PropTypes.bool,
}

export default FormattedNumber
