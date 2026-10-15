import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

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
  valueFormat,
  defaultViews,
  sx = [],
  onChange,
}) => {
  const value = R.defaultTo(defaultValue)(currentVal)
  // Intermediate selections are held locally and only committed on accept.
  // The draft is tied to the value it was made from, so it is discarded as
  // soon as the incoming value changes.
  const [draft, setDraft] = useState(null)
  const pickerValue =
    draft?.base === value ? draft.picked : dayjs(value, parseFormat)
  return (
    <Component
      disabled={!enabled}
      value={pickerValue}
      sx={[...forceArray(sx), propStyle]}
      slotProps={{ textField: { fullWidth } }}
      views={R.defaultTo(defaultViews)(views)}
      {...{ readOnly, format }}
      onChange={(val) => setDraft({ base: value, picked: val })}
      onAccept={(picked) => onChange(picked.format(valueFormat))}
    />
  )
}
DateTimeBase.propTypes = {
  component: PropTypes.object,
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  format: PropTypes.string,
  parseFormat: PropTypes.string,
  valueFormat: PropTypes.string,
  defaultViews: PropTypes.arrayOf(PropTypes.string),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

// NOTE:
// - `valueFormat` is the string format the server stores and validates
// - `defaultViews` match the defaults documented in `cave_utils`
const PropDate = (props) => (
  <DateTimeBase
    component={DatePicker}
    format="MM-DD-YYYY"
    valueFormat="YYYY-MM-DD"
    defaultViews={['year', 'day']}
    {...props}
  />
)

const PropTime = (props) => (
  <DateTimeBase
    component={TimePicker}
    parseFormat="HH:mm:ss"
    valueFormat="HH:mm:ss"
    defaultViews={['hours', 'minutes']}
    {...props}
  />
)

const PropDateTime = (props) => (
  <DateTimeBase
    component={DateTimePicker}
    format="MM-DD-YYYY hh:mm:ss A"
    valueFormat="YYYY-MM-DD[T]HH:mm:ss"
    defaultViews={['year', 'day', 'hours', 'minutes']}
    {...props}
  />
)

export { PropDate, PropDateTime, PropTime }
