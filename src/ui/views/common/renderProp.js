import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { selectNumberFormat } from '../../../data/selectors'
import {
  propContainer,
  propId,
  propPlacements,
  propVariant,
} from '../../../utils/enums'

import {
  PropCheckbox,
  PropComboBox,
  PropComboBoxMulti,
  PropContainer,
  PropDate,
  PropDateTime,
  PropDropdown,
  PropHCheckbox,
  PropHRadio,
  PropHStepper,
  PropHeadColumn,
  PropHeadRow,
  PropIncSlider,
  PropLatLngInput,
  PropLatLngMap,
  PropLatLngPath,
  PropNested,
  PropNumberField,
  PropNumberSlider,
  PropPicture,
  PropRadio,
  PropText,
  PropTextArea,
  PropTime,
  PropVideo,
  PropVStepper,
  PropNumberIcon,
  PropNumberIconCompact,
  IconHeadColumn,
  IconHeadRow,
  PropButtonFilled,
  PropButtonOutlined,
  PropButtonText,
  PropButtonIcon,
  PropToggleSwitch,
  PropToggleButton,
  PropToggleCheckbox,
} from '../../compound'

const invalidVariant = R.curry((type, variant) => {
  throw Error(`Invalid variant '${variant}' for prop type '${type}`)
})

const getButtonPropRenderFn = R.cond([
  [R.isNil, R.always(PropButtonFilled)],
  [R.equals(propVariant.FILLED), R.always(PropButtonFilled)],
  [R.equals(propVariant.OUTLINED), R.always(PropButtonOutlined)],
  [R.equals(propVariant.TEXT), R.always(PropButtonText)],
  [R.equals(propVariant.ICON), R.always(PropButtonIcon)],
  [R.T, invalidVariant('button')],
])
const getTogglePropRenderFn = R.cond([
  [R.isNil, R.always(PropToggleSwitch)],
  [R.equals(propVariant.SWITCH), R.always(PropToggleSwitch)],
  [R.equals(propVariant.BUTTON), R.always(PropToggleButton)],
  [R.equals(propVariant.CHECKBOX), R.always(PropToggleCheckbox)],
  [R.T, invalidVariant('toggle')],
])
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
  [R.equals(propVariant.ICON), R.always(PropNumberIcon)],
  [R.equals(propVariant.ICON_COMPACT), R.always(PropNumberIconCompact)],
  [R.equals(propVariant.INCSLIDER), R.always(PropIncSlider)],
  [R.T, invalidVariant('num')],
])
const getSelectorPropRenderFn = R.cond([
  [R.isNil, R.always(PropDropdown)],
  [R.equals(propVariant.CHECKBOX), R.always(PropCheckbox)],
  [R.equals(propVariant.COMBOBOX), R.always(PropComboBox)],
  [R.equals(propVariant.COMBOBOX_MULTI), R.always(PropComboBoxMulti)],
  [R.equals(propVariant.DROPDOWN), R.always(PropDropdown)],
  [R.equals(propVariant.HCHECKBOX), R.always(PropHCheckbox)],
  [R.equals(propVariant.HRADIO), R.always(PropHRadio)],
  [R.equals(propVariant.HSTEPPER), R.always(PropHStepper)],
  [R.equals(propVariant.NESTED), R.always(PropNested)],
  [R.equals(propVariant.RADIO), R.always(PropRadio)],
  [R.equals(propVariant.VSTEPPER), R.always(PropVStepper)],
  [R.T, invalidVariant('selector')],
])
const getDatePropRenderFn = R.cond([
  [R.isNil, R.always(PropDateTime)],
  [R.equals(propVariant.DATE), R.always(PropDate)],
  [R.equals(propVariant.DATETIME), R.always(PropDateTime)],
  [R.equals(propVariant.TIME), R.always(PropTime)],
  [R.T, invalidVariant('date')],
])
const getHeaderPropRenderFn = R.cond([
  [R.isNil, R.always(PropHeadColumn)],
  [R.equals(propVariant.COLUMN), R.always(PropHeadColumn)],
  [R.equals(propVariant.ROW), R.always(PropHeadRow)],
  [R.equals(propVariant.ICON), R.always(IconHeadColumn)],
  [R.equals(propVariant.ICON_ROW), R.always(IconHeadRow)],

  [R.T, invalidVariant('head')],
])
const getCoordinatePropRenderFn = R.cond([
  [R.isNil, R.always(PropLatLngInput)],
  [R.equals(propVariant.LATLNG_INPUT), R.always(PropLatLngInput)],
  [R.equals(propVariant.LATLNG_MAP), R.always(PropLatLngMap)],
  [R.equals(propVariant.LATLNG_PATH), R.always(PropLatLngPath)],
  [R.T, invalidVariant('coordinate')],
])

export const getRendererFn = R.cond([
  [R.equals(propId.MEDIA), R.always(getMediaPropRenderFn)],
  [R.equals(propId.BUTTON), R.always(getButtonPropRenderFn)],
  [R.equals(propId.TEXT), R.always(getTextPropRenderFn)],
  [R.equals(propId.NUMBER), R.always(getNumberPropRenderFn)],
  [R.equals(propId.TOGGLE), R.always(getTogglePropRenderFn)],
  [R.equals(propId.SELECTOR), R.always(getSelectorPropRenderFn)],
  [R.equals(propId.DATE), R.always(getDatePropRenderFn)],
  [R.equals(propId.HEAD), R.always(getHeaderPropRenderFn)],
  [R.equals(propId.COORDINATE), R.always(getCoordinatePropRenderFn)],
  [
    R.T,
    (type) => {
      throw Error(`Invalid prop type '${type}'`)
    },
  ],
])

export const PropWrapper = ({ prop, children }) => {
  const numberFormatDefault = useSelector(selectNumberFormat)
  const containerProps = R.applySpec({
    title: R.converge(R.defaultTo, [R.prop('id'), R.prop('name')]),
    tooltipTitle: R.prop('help'),
    unit: R.propOr(numberFormatDefault.unit, 'unit'),
    subtitle: R.prop('subtitle'),
    type: R.cond([
      [
        R.both(
          R.pipe(R.prop('type'), R.equals(propId.BUTTON), R.not),
          R.pipe(
            R.prop('variant'),
            R.includes(R.__, [propVariant.ICON, propVariant.ICON_COMPACT])
          )
        ),
        R.always(propContainer.NONE),
      ],
      [R.has('container'), R.prop('container')],
      [
        R.pipe(R.prop('type'), R.equals(propId.HEAD)),
        R.always(propContainer.MINIMAL),
      ],
    ]),
    marquee: R.prop('marquee'),
    elevation: R.prop('elevation'),
    // NOTE: `style` is deprecated and will be
    // removed in v4.0.0 in favor of `containerStyle`
    style: R.propOr(prop.style, 'containerStyle'),
  })(prop)
  return <PropContainer {...containerProps}>{children}</PropContainer>
}

const placementStyles = {
  // Top alignments
  [propPlacements.TOP_LEFT]: { mr: 'auto', mb: 'auto' },
  [propPlacements.TOP_CENTER]: { mx: 'auto', mb: 'auto' },
  [propPlacements.TOP_RIGHT]: { ml: 'auto', mb: 'auto' },
  // Center alignments
  [propPlacements.LEFT]: { mr: 'auto', my: 'auto' },
  [propPlacements.CENTER]: { m: 'auto' },
  [propPlacements.RIGHT]: { ml: 'auto', my: 'auto' },
  // Bottom alignments
  [propPlacements.BOTTOM_LEFT]: { mr: 'auto', mt: 'auto' },
  [propPlacements.BOTTOM_CENTER]: { mx: 'auto', mt: 'auto' },
  [propPlacements.BOTTOM_RIGHT]: { ml: 'auto', mt: 'auto' },
}

const Prop = (props) => {
  const prop = R.propOr({}, 'prop')(props)
  const { type, variant, enabled = true, placement, propStyle } = prop
  const propRendererFn = getRendererFn(type)
  const PropComponent = propRendererFn(variant)
  return (
    <PropWrapper {...{ prop }}>
      <PropComponent
        sx={[
          {
            boxSizing: 'border-box',
            // bgcolor: 'rgb(255 0 0 / .08)', // FIXME: Remove after debugging
          },
          placement && placementStyles[placement],
        ]}
        {...R.pipe(
          R.assocPath(['prop', 'enabled'], enabled),
          R.assocPath(['prop', 'style'], propStyle)
        )(props)}
      />
    </PropWrapper>
  )
}

export default Prop
