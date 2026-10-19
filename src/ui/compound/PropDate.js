import {
  MobileDatePicker as DatePicker,
  MobileDateTimePicker as DateTimePicker,
  MobileTimePicker as TimePicker,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezonePlugin from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { useState } from 'react'

import {
  getDisabledDateProps,
  getDisplayFormat,
  getTimeConstraintProps,
} from '../../utils/dateConstraints'

import { forceArray } from '../../utils'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezonePlugin)

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

// Returns the `timezone` if it is a valid IANA name (or `'UTC'`). Otherwise,
// `undefined` is returned, which uses the browser's timezone. This is also the
// case for `'system'`.
const getTimezone = (timezone) => {
  if (R.isNil(timezone) || timezone === 'system') return undefined
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone })
    return timezone
  } catch {
    return undefined
  }
}

// Stored values are wall-clock strings, so they are not converted between
// timezones. The wall-clock time is read as a time in `timezone` instead.
const toTimezone = (date, timezone) =>
  timezone && date.isValid()
    ? dayjs.tz(date.format('YYYY-MM-DDTHH:mm:ss'), timezone)
    : date

const parseBound = (bound, key, timezone) => {
  const formats = R.includes(key)(DATETIME_BOUND_KEYS)
    ? DATETIME_BOUND_FORMATS
    : BOUND_FORMATS
  const parsed = dayjs(bound, formats, true)
  return parsed.isValid() ? toTimezone(parsed, timezone) : undefined
}

// Keeps the constraints applicable to the variant. Bounds that can't be
// parsed are dropped so that a bad string can't break the prop.
const getConstraints = (prop, keys, timezone) =>
  R.pipe(
    R.pick(keys),
    R.mapObjIndexed((bound, key) =>
      R.is(String)(bound) ? parseBound(bound, key, timezone) : bound
    ),
    R.reject(R.isNil)
  )(prop)

const DateTimeBase = ({
  component: Component,
  prop,
  currentVal,
  parseFormat,
  valueFormat,
  defaultViews,
  constraintKeys,
  hasDate = false,
  hasTime = false,
  sx = [],
  onChange,
}) => {
  const {
    enabled,
    value: defaultValue,
    readOnly,
    label,
    views,
    defaultView,
    dateOrder,
    hour24,
    propStyle,
    fullWidth = true, // NOTE: This will change to `false` in `v4.0.0`
  } = prop
  const pickerViews = R.defaultTo(defaultViews)(views)
  const value = R.defaultTo(defaultValue)(currentVal)
  const timezone = getTimezone(prop.timezone)
  // Intermediate selections are held locally and only committed on accept.
  // The draft is tied to the value it was made from, so it is discarded as
  // soon as the incoming value changes.
  const [draft, setDraft] = useState(null)
  const pickerValue =
    draft?.base === value
      ? draft.picked
      : toTimezone(dayjs(value, parseFormat), timezone)
  return (
    <Component
      disabled={!enabled}
      value={pickerValue}
      sx={[...forceArray(sx), propStyle]}
      slotProps={{ textField: { fullWidth } }}
      views={pickerViews}
      // NOTE: The picker can only open to one of its views
      openTo={R.includes(defaultView)(pickerViews) ? defaultView : undefined}
      {...{ label, readOnly, timezone }}
      format={getDisplayFormat({
        hasDate,
        hasTime,
        dateOrder,
        hour24,
        views: pickerViews,
      })}
      {...(hasTime && { ampm: hour24 !== true })}
      {...getConstraints(prop, constraintKeys, timezone)}
      {...(hasDate && getDisabledDateProps(prop))}
      {...(hasTime && getTimeConstraintProps(prop))}
      onChange={(val) => setDraft({ base: value, picked: val })}
      onAccept={(picked) => onChange(picked.format(valueFormat))}
    />
  )
}
DateTimeBase.propTypes = {
  component: PropTypes.object,
  prop: PropTypes.object,
  currentVal: PropTypes.string,
  parseFormat: PropTypes.string,
  valueFormat: PropTypes.string,
  defaultViews: PropTypes.arrayOf(PropTypes.string),
  constraintKeys: PropTypes.arrayOf(PropTypes.string),
  hasDate: PropTypes.bool,
  hasTime: PropTypes.bool,
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
// - `hasDate` and `hasTime` also set the format of the field, which is separate
//   from the `valueFormat`
// - `valueFormat` is the string format the server stores and validates
// - `defaultViews` match the defaults documented in `cave_utils`
// - `constraintKeys` are the prop attributes that apply to each variant
// - `hasDate` variants also apply the `disabled*` dates, weekdays, months, years
// - `hasTime` variants also apply the `*Step`s and `disabledTimes`
const PropDate = (props) => (
  <DateTimeBase
    component={DatePicker}
    valueFormat="YYYY-MM-DD"
    defaultViews={['year', 'day']}
    hasDate
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
    hasTime
    constraintKeys={['minTime', 'maxTime', 'disablePast', 'disableFuture']}
    {...props}
  />
)

const PropDateTime = (props) => (
  <DateTimeBase
    component={DateTimePicker}
    valueFormat="YYYY-MM-DD[T]HH:mm:ss"
    defaultViews={['year', 'day', 'hours', 'minutes']}
    hasDate
    hasTime
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
