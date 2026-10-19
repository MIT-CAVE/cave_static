import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import * as R from 'ramda'

dayjs.extend(customParseFormat)

// How many of each unit make up the next one up, which a step has to divide
// evenly (e.g. a step of 7 minutes would not restart on the hour)
const STEP_LIMITS = { hours: 24, minutes: 60, seconds: 60 }

// A step only restricts anything if it is an integer above 1 that divides the
// unit evenly. Anything else is dropped so that a bad value can't break the prop.
const getValidStep = (step, unit) =>
  Number.isInteger(step) && step > 1 && STEP_LIMITS[unit] % step === 0
    ? step
    : undefined

/**
 * Gets the picker props that apply the `hoursStep`, `minutesStep` and
 * `secondsStep` of a `date` prop.
 *
 * The `minutes` step is native to the picker, which also snaps the clock to it.
 * The picker has no `hours` or `seconds` step, so those disable the values that
 * are not a multiple of the step in the corresponding view instead.
 */
export const getTimeStepProps = (prop) => {
  const hours = getValidStep(prop.hoursStep, 'hours')
  const minutes = getValidStep(prop.minutesStep, 'minutes')
  const seconds = getValidStep(prop.secondsStep, 'seconds')
  return {
    ...(minutes && { minutesStep: minutes }),
    ...((hours || seconds) && {
      shouldDisableTime: (value, view) =>
        (view === 'hours' && Boolean(hours) && value.hour() % hours !== 0) ||
        (view === 'seconds' &&
          Boolean(seconds) &&
          value.second() % seconds !== 0),
    }),
  }
}

// Formats accepted for `disabledDates`, of which only the date part is used
const DISABLED_DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
]
// Names accepted for `disabledWeekdays` (starting on Sunday, which is `0`) and
// `disabledMonths` (starting on January, which is `1`): full, 3-letter, 2-letter
const WEEKDAY_NAMES = [
  ['sunday', 'sun', 'su'],
  ['monday', 'mon', 'mo'],
  ['tuesday', 'tue', 'tu'],
  ['wednesday', 'wed', 'we'],
  ['thursday', 'thu', 'th'],
  ['friday', 'fri', 'fr'],
  ['saturday', 'sat', 'sa'],
]
const MONTH_NAMES = [
  ['january', 'jan'],
  ['february', 'feb'],
  ['march', 'mar'],
  ['april', 'apr'],
  ['may', 'may'],
  ['june', 'jun'],
  ['july', 'jul'],
  ['august', 'aug'],
  ['september', 'sep'],
  ['october', 'oct'],
  ['november', 'nov'],
  ['december', 'dec'],
]

// Converts a number (starting at `first`) or a case-insensitive name into its
// zero-based index, or `undefined` if it is not recognized
const toCalendarIndex = (entry, names, first) => {
  if (Number.isInteger(entry))
    return entry >= first && entry < first + names.length
      ? entry - first
      : undefined
  if (!R.is(String)(entry)) return undefined
  const index = names.findIndex(R.includes(entry.toLowerCase()))
  return index === -1 ? undefined : index
}

export const toWeekdayIndex = (entry) =>
  toCalendarIndex(entry, WEEKDAY_NAMES, 0)
export const toMonthIndex = (entry) => toCalendarIndex(entry, MONTH_NAMES, 1)

const toIndexSet = (entries, toIndex) =>
  new Set(R.reject(R.isNil)(R.map(toIndex)(forceList(entries))))

const forceList = (entries) => (Array.isArray(entries) ? entries : [])

/**
 * Gets the picker props that apply the `disabledDates`, `disabledWeekdays`,
 * `disabledMonths` and `disabledYears` of a `date` prop.
 *
 * All the predicates are derived from the same rules so the views can't
 * disagree: a disabled year disables its months and days, and a disabled month
 * disables its days. Entries that can't be recognized are ignored.
 */
export const getDisabledDateProps = (prop) => {
  const { disabledDates, disabledWeekdays, disabledMonths, disabledYears } =
    prop
  if (
    R.all(R.isNil)([
      disabledDates,
      disabledWeekdays,
      disabledMonths,
      disabledYears,
    ])
  )
    return {}
  const dates = new Set(
    forceList(disabledDates)
      .map((entry) => dayjs(entry, DISABLED_DATE_FORMATS, true))
      .filter((parsed) => parsed.isValid())
      .map((parsed) => parsed.format('YYYY-MM-DD'))
  )
  const weekdays = toIndexSet(disabledWeekdays, toWeekdayIndex)
  const months = toIndexSet(disabledMonths, toMonthIndex)
  const years = new Set(forceList(disabledYears).filter(Number.isInteger))

  const isYearDisabled = (value) => years.has(value.year())
  const isMonthDisabled = (value) =>
    isYearDisabled(value) || months.has(value.month())
  return {
    shouldDisableYear: isYearDisabled,
    shouldDisableMonth: isMonthDisabled,
    shouldDisableDate: (value) =>
      isMonthDisabled(value) ||
      weekdays.has(value.day()) ||
      dates.has(value.format('YYYY-MM-DD')),
  }
}

// Formats accepted for the boundaries of a `disabledTimes` window, of which
// only the time part is used
const TIME_OF_DAY_FORMATS = [
  'HH:mm:ss',
  'HH:mm',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DD HH:mm:ss',
]
const SECONDS_PER_DAY = 24 * 60 * 60

// Converts a window boundary into seconds since midnight, or `undefined` if it
// is not recognized. Only the end of a window can be the end of the day.
export const toSecondsOfDay = (time, isEnd = false) => {
  if (isEnd && (time === '24:00' || time === '24:00:00')) return SECONDS_PER_DAY
  const parsed = R.is(String)(time)
    ? dayjs(time, TIME_OF_DAY_FORMATS, true)
    : undefined
  return parsed?.isValid()
    ? parsed.hour() * 3600 + parsed.minute() * 60 + parsed.second()
    : undefined
}

// Merges the windows that overlap or touch, so that a span is covered
// by the windows if a single merged window contains it
const mergeWindows = (windows) =>
  R.sortBy(R.head)(windows).reduce((merged, [start, end]) => {
    const last = R.last(merged)
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
    return merged
  }, [])

/**
 * Gets the picker props that apply the `disabledTimes` of a `date` prop.
 *
 * In the `hours` and `minutes` views, an option is disabled only if the
 * windows cover all of it, e.g. with `[['12:00', '12:30']]`, `12` is still
 * available, as `12:30` to `12:59` can be selected. Windows that can't be
 * recognized are ignored.
 */
export const getDisabledTimeProps = (prop) => {
  const windows = mergeWindows(
    forceList(prop.disabledTimes)
      .filter((window) => Array.isArray(window) && window.length === 2)
      .map(([start, end]) => [toSecondsOfDay(start), toSecondsOfDay(end, true)])
      .filter(([start, end]) => !R.isNil(start) && !R.isNil(end) && start < end)
  )
  if (R.isEmpty(windows)) return {}
  const isCovered = (from, to) =>
    windows.some(([start, end]) => start <= from && to <= end)
  const spans = {
    hours: (value) => [value.hour() * 3600, 3600],
    minutes: (value) => [value.hour() * 3600 + value.minute() * 60, 60],
    seconds: (value) => [
      value.hour() * 3600 + value.minute() * 60 + value.second(),
      1,
    ],
  }
  return {
    shouldDisableTime: (value, view) => {
      const [from, length] = spans[view]?.(value) ?? []
      return !R.isNil(from) && isCovered(from, from + length)
    },
  }
}

/**
 * Gets the picker props that apply the time constraints of a `date` prop: its
 * steps and its `disabledTimes`, which share the picker's `shouldDisableTime`.
 */
export const getTimeConstraintProps = (prop) => {
  const { shouldDisableTime: isOffStep, ...steps } = getTimeStepProps(prop)
  const { shouldDisableTime: isInWindow } = getDisabledTimeProps(prop)
  return {
    ...steps,
    ...((isOffStep || isInWindow) && {
      shouldDisableTime: (value, view) =>
        Boolean(isOffStep?.(value, view)) || Boolean(isInWindow?.(value, view)),
    }),
  }
}

// The order of the day, month and year in the field of a `date` prop
const DATE_FORMATS = {
  mdy: 'MM-DD-YYYY',
  dmy: 'DD-MM-YYYY',
  ymd: 'YYYY-MM-DD',
}

/**
 * Gets the format in which the field of a `date` prop displays its value. The
 * value that is stored and sent to the server has its own, fixed format.
 *
 * The date part follows the `dateOrder` and the time part follows `hour24`. The
 * time part displays seconds only if `seconds` is one of the `views`. Anything
 * unrecognized falls back to the defaults, which are `'mdy'` and `false`.
 */
export const getDisplayFormat = ({
  hasDate = false,
  hasTime = false,
  dateOrder,
  hour24,
  views = [],
}) => {
  const is12Hour = hour24 !== true
  const time = [
    is12Hour ? 'hh' : 'HH',
    'mm',
    ...(R.includes('seconds')(views) ? ['ss'] : []),
  ].join(':')
  return R.join(' ')(
    R.reject(R.isNil)([
      hasDate ? (DATE_FORMATS[dateOrder] ?? DATE_FORMATS.mdy) : undefined,
      hasTime ? time + (is12Hour ? ' A' : '') : undefined,
    ])
  )
}
