import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const PropDateBase = ({
  component,
  prop,
  currentVal,
  format,
  parseFormat,
  sx = [],
  onChange,
}) => {
  const value = R.defaultTo(prop.value, currentVal)
  const { enabled, readOnly, views } = prop
  const Component = component
  return (
    <Component
      sx={[{ p: 1 }, ...forceArray(sx)]}
      value={dayjs(value, parseFormat)}
      disabled={!enabled}
      slotProps={{
        textField: {
          fullWidth: true,
        },
      }}
      {...{ readOnly, views, format, onChange }}
      onAccept={onChange}
    />
  )
}
PropDateBase.propTypes = {
  component: PropTypes.object,
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

const PropDate = (props) => (
  <PropDateBase component={DatePicker} format="MM-DD-YYYY" {...props} />
)

const PropTime = (props) => (
  <PropDateBase component={TimePicker} parseFormat="HH:mm:ss" {...props} />
)

const PropDateTime = (props) => (
  <PropDateBase
    component={DateTimePicker}
    format="MM-DD-YYYY hh:mm:ss A"
    {...props}
  />
)

export { PropDate, PropDateTime, PropTime }
