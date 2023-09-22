import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../../data/selectors'
import { propContainer, propId, propVariant } from '../../../utils/enums'
import PropButton from '../../compound/PropButton'

import {
  PropCheckbox,
  PropComboBox,
  PropContainer,
  PropDate,
  PropDateTime,
  PropDropdown,
  PropHRadio,
  PropHStepper,
  PropHeadColumn,
  PropHeadRow,
  PropNested,
  PropNumberField,
  PropNumberSlider,
  PropPicture,
  PropRadio,
  PropText,
  PropTextArea,
  PropTime,
  PropToggle,
  PropVideo,
  PropVStepper,
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
const getMediaPropRenderFn = R.cond([
  [R.equals(propVariant.PICTURE), R.always(PropPicture)],
  [R.equals(propVariant.VIDEO), R.always(PropVideo)],
  [R.T, invalidVariant('media')],
])
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
  [R.equals(propVariant.CHECKBOX), R.always(PropCheckbox)],
  [R.equals(propVariant.COMBOBOX), R.always(PropComboBox)],
  [R.equals(propVariant.DROPDOWN), R.always(PropDropdown)],
  [R.equals(propVariant.HRADIO), R.always(PropHRadio)],
  [R.equals(propVariant.HSTEPPER), R.always(PropHStepper)],
  [R.equals(propVariant.NESTED), R.always(PropNested)],
  [R.equals(propVariant.RADIO), R.always(PropRadio)],
  [R.equals(propVariant.VSTEPPER), R.always(PropVStepper)],
  [R.T, invalidVariant('selector')],
])
const getDatePropRenderFn = R.cond([
  [R.equals(propVariant.DATE), R.always(PropDate)],
  [R.equals(propVariant.DATETIME), R.always(PropDateTime)],
  [R.equals(propVariant.TIME), R.always(PropTime)],
  [R.T, invalidVariant('date')],
])
const getHeaderPropRenderFn = R.cond([
  [R.isNil, R.always(PropHeadColumn)],
  [R.equals(propVariant.COLUMN), R.always(PropHeadColumn)],
  [R.equals(propVariant.ROW), R.always(PropHeadRow)],
  [R.T, invalidVariant('head')],
])

const getRendererFn = R.cond([
  [R.equals(propId.MEDIA), R.always(getMediaPropRenderFn)],
  [R.equals(propId.BUTTON), R.always(getButtonPropRenderFn)],
  [R.equals(propId.TEXT), R.always(getTextPropRenderFn)],
  [R.equals(propId.NUMBER), R.always(getNumberPropRenderFn)],
  [R.equals(propId.TOGGLE), R.always(getTogglePropRenderFn)],
  [R.equals(propId.SELECTOR), R.always(getSelectorPropRenderFn)],
  [R.equals(propId.DATE), R.always(getDatePropRenderFn)],
  [R.equals(propId.HEAD), R.always(getHeaderPropRenderFn)],
  [
    R.T,
    (type) => {
      throw Error(`Invalid prop type '${type}'`)
    },
  ],
])

const PropBase = ({ prop, children }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)
  const containerProps = R.applySpec({
    title: R.converge(R.defaultTo, [R.prop('id'), R.prop('name')]),
    tooltipTitle: R.prop('help'),
    unit: R.pipe(
      R.propOr({}, 'numberFormat'),
      R.mergeRight(numberFormatDefault),
      R.prop('unit')
    ),
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
    <PropBase {...{ prop }} key={prop.id}>
      <PropComponent sx={{ boxSizing: 'border-box' }} {...props} />
    </PropBase>
  )
}

export default renderProp
