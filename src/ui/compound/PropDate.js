import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import { forceArray } from '../../utils'

const DateTimeBase = ({
  component: Component,
  prop: {
    enabled,
    value: defaultValue,
    readOnly,
    views,
    propStyle,
    fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  },
  currentVal,
  format,
  parseFormat,
  sx = [],
  onChange,
}) => {
  const value = R.defaultTo(defaultValue)(currentVal)
  return (
    <Component
      disabled={!enabled}
      value={dayjs(value, parseFormat)}
      sx={[...forceArray(sx), propStyle]}
      slotProps={{ textField: { fullWidth } }}
      {...{ readOnly, views, format, onChange }}
      onAccept={onChange}
    />
  )
}
DateTimeBase.propTypes = {
  component: PropTypes.object,
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  format: PropTypes.string,
  parseFormat: PropTypes.string,
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
  <DateTimeBase component={DatePicker} format="MM-DD-YYYY" {...props} />
)

const PropTime = (props) => (
  <DateTimeBase component={TimePicker} parseFormat="HH:mm:ss" {...props} />
)

const PropDateTime = (props) => (
  <DateTimeBase
    component={DateTimePicker}
    format="MM-DD-YYYY hh:mm:ss A"
    {...props}
  />
)

export { PropDate, PropDateTime, PropTime }
