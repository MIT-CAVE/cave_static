import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { getTimeStepProps } from './dateConstraints'

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
