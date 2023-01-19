import * as R from 'ramda'

import { PROP_WIDTH } from '../../../utils/constants'
import { propContainer, propId, propVariant } from '../../../utils/enums'
import PropButton from '../../compound/PropButton'

import {
  PropCheckbox,
  PropContainer,
  PropDropdown,
  PropHead,
  PropNumberField,
  PropNumberSlider,
  PropRadio,
  PropText,
  PropTextArea,
  PropToggle,
} from '../../compound'

const invalidVariant = R.curry((type, variant) => {
  throw Error(`Invalid variant '${variant}' for prop type '${type}`)
})

const getButtonPropRenderFn = R.ifElse(
  R.isNil,
  R.always(PropButton),
  invalidVariant('button')
)
const getTogglePropRenderFn = R.ifElse(
  R.isNil,
  R.always(PropToggle),
  invalidVariant('toggle')
)
const getTextPropRenderFn = R.cond([
  [R.isNil, R.always(PropText)],
  [R.equals(propVariant.SINGLE), R.always(PropText)],
  [R.equals(propVariant.TEXTAREA), R.always(PropTextArea)],
  [R.T, invalidVariant('text')],
])
const getNumberPropRenderFn = R.cond([
  [R.isNil, R.always(PropNumberField)],
  [R.equals(propVariant.FIELD), R.always(PropNumberField)],
  [R.equals(propVariant.SLIDER), R.always(PropNumberSlider)],
  [R.T, invalidVariant('num')],
])
const getSelectorPropRenderFn = R.cond([
  [R.equals(propVariant.DROPDOWN), R.always(PropDropdown)],
  [R.equals(propVariant.CHECKBOX), R.always(PropCheckbox)],
  [R.equals(propVariant.RADIO), R.always(PropRadio)],
  [R.T, invalidVariant('selector')],
])
const getHeaderPropRenderFn = R.ifElse(
  R.isNil,
  R.always(PropHead),
  invalidVariant('head')
)

const getRendererFn = R.cond([
  [R.equals(propId.BUTTON), R.always(getButtonPropRenderFn)],
  [R.equals(propId.TEXT), R.always(getTextPropRenderFn)],
  [R.equals(propId.NUMBER), R.always(getNumberPropRenderFn)],
  [R.equals(propId.TOGGLE), R.always(getTogglePropRenderFn)],
  [R.equals(propId.SELECTOR), R.always(getSelectorPropRenderFn)],
  [R.equals(propId.HEAD), R.always(getHeaderPropRenderFn)],
  [
    R.T,
    (type) => {
      throw Error(`Invalid prop type '${type}'`)
    },
  ],
])

const PropBase = ({ prop, children }) => {
  const containerProps = R.applySpec({
    title: R.converge(R.defaultTo, [R.prop('id'), R.prop('name')]),
    tooltipTitle: R.prop('help'),
    // eslint-disable-next-line ramda/cond-simplification
    type: R.cond([
      [R.has('container'), R.prop('container')],
      [
        R.pipe(R.prop('type'), R.equals(propId.HEAD)),
        R.always(propContainer.NONE),
      ],
    ]),
    marquee: R.prop('marquee'),
    elevation: R.prop('elevation'),
    style: R.prop('style'),
  })(prop)
  return <PropContainer {...containerProps}>{children}</PropContainer>
}

const renderProp = ({ ...props }) => {
  const prop = R.propOr({}, 'prop')(props)
  const { type, variant } = prop
  const propRendererFn = getRendererFn(type)
  const PropComponent = propRendererFn(variant)

  return (
    <PropBase {...{ prop }}>
      <PropComponent sx={{ minWidth: PROP_WIDTH }} {...props} />
    </PropBase>
  )
}

export default renderProp
