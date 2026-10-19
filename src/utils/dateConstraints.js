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
