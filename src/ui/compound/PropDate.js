import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

import { forceArray } from '../../utils'

dayjs.extend(customParseFormat)

// Formats accepted for `minDate`, `maxDate`, `minTime` and `maxTime`
const BOUND_FORMATS = [
  'YYYY-MM-DD',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
  'HH:mm:ss',
  'HH:mm',
]
// Formats accepted for `minDateTime` and `maxDateTime`, which require a time
const DATETIME_BOUND_FORMATS = ['YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD HH:mm:ss']
const DATETIME_BOUND_KEYS = ['minDateTime', 'maxDateTime']

const parseBound = (bound, key) => {
  const formats = R.includes(key, DATETIME_BOUND_KEYS)
    ? DATETIME_BOUND_FORMATS
    : BOUND_FORMATS
  const parsed = dayjs(bound, formats, true)
  return parsed.isValid() ? parsed : undefined
}

// Keeps the constraints applicable to the variant. Bounds that can't be
// parsed are dropped so that a bad string can't break the prop.
const getConstraints = (prop, keys) =>
  R.pipe(
    R.pick(keys),
    R.mapObjIndexed((bound, key) =>
      R.is(String, bound) ? parseBound(bound, key) : bound
    ),
    R.reject(R.isNil)
  )(prop)

const DateTimeBase = ({
  component: Component,
  prop,
  currentVal,
  format,
  parseFormat,
  valueFormat,
  defaultViews,
  constraintKeys,
  sx = [],
  onChange,
}) => {
  const {
    enabled,
    value: defaultValue,
    readOnly,
    label,
    views,
    propStyle,
    fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  } = prop
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
      {...{ label, readOnly, format }}
      {...getConstraints(prop, constraintKeys)}
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
  constraintKeys: PropTypes.arrayOf(PropTypes.string),
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
// - `constraintKeys` are the prop attributes that apply to each variant
const PropDate = (props) => (
  <DateTimeBase
    component={DatePicker}
    format="MM-DD-YYYY"
    valueFormat="YYYY-MM-DD"
    defaultViews={['year', 'day']}
    constraintKeys={['minDate', 'maxDate', 'disablePast', 'disableFuture']}
    {...props}
  />
)

const PropTime = (props) => (
  <DateTimeBase
    component={TimePicker}
    parseFormat="HH:mm:ss"
    valueFormat="HH:mm:ss"
    defaultViews={['hours', 'minutes']}
    constraintKeys={['minTime', 'maxTime', 'disablePast', 'disableFuture']}
    {...props}
  />
)

const PropDateTime = (props) => (
  <DateTimeBase
    component={DateTimePicker}
    format="MM-DD-YYYY hh:mm:ss A"
    valueFormat="YYYY-MM-DD[T]HH:mm:ss"
    defaultViews={['year', 'day', 'hours', 'minutes']}
    constraintKeys={[
      'minDate',
      'maxDate',
      'minTime',
      'maxTime',
      ...DATETIME_BOUND_KEYS,
      'disablePast',
      'disableFuture',
    ]}
    {...props}
  />
)

export { PropDate, PropDateTime, PropTime }
