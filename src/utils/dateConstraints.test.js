import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import {
  getDisabledDateProps,
  getTimeStepProps,
  toMonthIndex,
  toWeekdayIndex,
} from './dateConstraints'

const at = (time) => dayjs(`2026-07-09T${time}`)

describe('getTimeStepProps', () => {
  it('adds nothing without steps', () => {
    expect(getTimeStepProps({})).toEqual({})
  })

  it('passes the minutes step to the picker', () => {
    expect(getTimeStepProps({ minutesStep: 15 })).toEqual({ minutesStep: 15 })
  })

  it('ignores steps that would not restrict or divide the unit', () => {
    const invalid = { hoursStep: 5, minutesStep: 7, secondsStep: 1.5 }
    expect(getTimeStepProps(invalid)).toEqual({})
    expect(
      getTimeStepProps({ hoursStep: 0, minutesStep: 1, secondsStep: '30' })
    ).toEqual({})
    expect(
      getTimeStepProps({ hoursStep: -2, minutesStep: 90, secondsStep: 61 })
    ).toEqual({})
  })

  it('disables hours that are not a multiple of the hours step', () => {
    const { shouldDisableTime } = getTimeStepProps({ hoursStep: 2 })
    expect(shouldDisableTime(at('00:30:00'), 'hours')).toBe(false)
    expect(shouldDisableTime(at('01:30:00'), 'hours')).toBe(true)
    expect(shouldDisableTime(at('12:30:00'), 'hours')).toBe(false)
    expect(shouldDisableTime(at('13:30:00'), 'hours')).toBe(true)
  })

  it('disables seconds that are not a multiple of the seconds step', () => {
    const { shouldDisableTime } = getTimeStepProps({ secondsStep: 30 })
    expect(shouldDisableTime(at('09:30:00'), 'seconds')).toBe(false)
    expect(shouldDisableTime(at('09:30:30'), 'seconds')).toBe(false)
    expect(shouldDisableTime(at('09:30:15'), 'seconds')).toBe(true)
  })

  it('only restricts the view of each step', () => {
    const { shouldDisableTime } = getTimeStepProps({
      hoursStep: 2,
      secondsStep: 30,
    })
    expect(shouldDisableTime(at('01:07:15'), 'minutes')).toBe(false)
    expect(shouldDisableTime(at('01:07:00'), 'seconds')).toBe(false)
    expect(shouldDisableTime(at('00:07:15'), 'hours')).toBe(false)
  })

  it('combines native and emulated steps', () => {
    const props = getTimeStepProps({
      hoursStep: 3,
      minutesStep: 15,
      secondsStep: 20,
    })
    expect(props.minutesStep).toBe(15)
    expect(props.shouldDisableTime(at('04:00:00'), 'hours')).toBe(true)
    expect(props.shouldDisableTime(at('09:00:10'), 'seconds')).toBe(true)
  })
})

describe('toWeekdayIndex', () => {
  it.each([
    [0, 0],
    [6, 6],
    ['Sunday', 0],
    ['sun', 0],
    ['SU', 0],
    ['Monday', 1],
    ['Tue', 2],
    ['we', 3],
    ['Thursday', 4],
    ['Fri', 5],
    ['Sa', 6],
  ])('reads %j as %j', (entry, index) => {
    expect(toWeekdayIndex(entry)).toBe(index)
  })

  it.each([7, -1, 1.5, true, null, '3', 'Thur', 'tuesdays', '', ['Mon']])(
    'does not recognize %j',
    (entry) => {
      expect(toWeekdayIndex(entry)).toBeUndefined()
    }
  )
})

describe('toMonthIndex', () => {
  it.each([
    [1, 0],
    [12, 11],
    ['January', 0],
    ['jan', 0],
    ['May', 4],
    ['SEP', 8],
    ['December', 11],
    ['dec', 11],
  ])('reads %j as %j', (entry, index) => {
    expect(toMonthIndex(entry)).toBe(index)
  })

  it.each([0, 13, true, null, '7', 'Sept', '2026-12', 'Ja'])(
    'does not recognize %j',
    (entry) => {
      expect(toMonthIndex(entry)).toBeUndefined()
    }
  )
})

describe('getDisabledDateProps', () => {
  // 2026-07-09 is a Thursday
  const on = (date) => dayjs(date)

  it('adds nothing without rules', () => {
    expect(getDisabledDateProps({})).toEqual({})
  })

  it('disables the weekdays in any notation', () => {
    const { shouldDisableDate } = getDisabledDateProps({
      disabledWeekdays: [0, 'Mon', 'tuesday', 'Thursday'],
    })
    expect(shouldDisableDate(on('2026-07-05'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-06'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-07'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-08'))).toBe(false)
    expect(shouldDisableDate(on('2026-07-09'))).toBe(true)
  })

  it('disables the dates ignoring any time part', () => {
    const { shouldDisableDate } = getDisabledDateProps({
      disabledDates: [
        '2026-07-10',
        '2026-07-11T10:00:00',
        '2026-07-12 23:59:59',
      ],
    })
    expect(shouldDisableDate(on('2026-07-10T15:00:00'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-11'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-12'))).toBe(true)
    expect(shouldDisableDate(on('2026-07-13'))).toBe(false)
  })

  it('ignores entries that are not recognized', () => {
    const { shouldDisableDate } = getDisabledDateProps({
      disabledDates: ['07/10/2026', '2026-07', '10:00:00', 20260710, null],
      disabledWeekdays: ['Thur', 7, true],
      disabledMonths: ['Sept', 0, '2026-07'],
    })
    expect(shouldDisableDate(on('2026-07-10'))).toBe(false)
    expect(shouldDisableDate(on('2026-07-09'))).toBe(false)
  })

  it('disables the months in any notation, in every year', () => {
    const { shouldDisableMonth } = getDisabledDateProps({
      disabledMonths: [12, 'Feb', 'March'],
    })
    expect(shouldDisableMonth(on('2026-12-01'))).toBe(true)
    expect(shouldDisableMonth(on('2027-02-01'))).toBe(true)
    expect(shouldDisableMonth(on('2026-03-01'))).toBe(true)
    expect(shouldDisableMonth(on('2026-07-01'))).toBe(false)
  })

  it('disables the months and days of a disabled year', () => {
    const props = getDisabledDateProps({ disabledYears: [2025, 2027] })
    expect(props.shouldDisableYear(on('2025-07-09'))).toBe(true)
    expect(props.shouldDisableYear(on('2026-07-09'))).toBe(false)
    expect(props.shouldDisableMonth(on('2027-01-01'))).toBe(true)
    expect(props.shouldDisableDate(on('2027-07-09'))).toBe(true)
    expect(props.shouldDisableDate(on('2026-07-09'))).toBe(false)
  })

  it('disables the days of a disabled month', () => {
    const { shouldDisableDate } = getDisabledDateProps({
      disabledMonths: ['Jul'],
    })
    expect(shouldDisableDate(on('2026-07-09'))).toBe(true)
    expect(shouldDisableDate(on('2026-08-09'))).toBe(false)
  })
})
