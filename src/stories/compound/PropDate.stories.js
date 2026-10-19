import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import dayjs from 'dayjs'
import React from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import { PropDate, PropDateTime, PropTime } from '../../ui/compound/PropDate'

const datePickerDecorator = (Story) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Story />
  </LocalizationProvider>
)

const propDateStories = {
  title: 'Compound/PropDate',
  component: PropDate,
  decorators: [datePickerDecorator],
}

export default propDateStories

const withLocalState = (Component) =>
  function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <Component
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  }

export const Date = {
  render: withLocalState(PropDate),
  args: {
    prop: {
      enabled: true,
      value: '2026-07-09',
      readOnly: false,
    },
    currentVal: '2026-07-09',
    onChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Choose date/ }))

    const dialog = within(await within(document.body).findByRole('dialog'))
    await userEvent.click(dialog.getByRole('gridcell', { name: '15' }))
    // Intermediate selections must not be committed
    await expect(args.onChange).not.toHaveBeenCalled()

    await userEvent.click(dialog.getByRole('button', { name: 'OK' }))
    await waitFor(() => expect(args.onChange).toHaveBeenCalledTimes(1))
    await expect(args.onChange).toHaveBeenCalledWith('2026-07-15')
  },
}

export const DateTime = {
  render: withLocalState(PropDateTime),
  args: {
    prop: {
      enabled: true,
      value: '2026-07-09T09:00:00',
      readOnly: false,
    },
    currentVal: '2026-07-09T09:00:00',
    onChange: fn(),
  },
}

export const Time = {
  render: withLocalState(PropTime),
  args: {
    prop: {
      enabled: true,
      value: '09:30:00',
      readOnly: false,
    },
    currentVal: '09:30:00',
    onChange: fn(),
  },
}

export const DateWithViews = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, views: ['year', 'month', 'day'] },
  },
  play: undefined,
}

export const TimeWithSeconds = {
  ...Time,
  args: {
    ...Time.args,
    prop: { ...Time.args.prop, views: ['hours', 'minutes', 'seconds'] },
  },
}

export const ReadOnly = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, readOnly: true },
  },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('spinbutton', { name: 'Month' })
    )
    await expect(within(document.body).queryByRole('dialog')).toBeNull()
    await expect(args.onChange).not.toHaveBeenCalled()
  },
}

export const Disabled = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, enabled: false },
  },
  play: undefined,
}

export const DateWithBounds = {
  ...Date,
  args: {
    ...Date.args,
    prop: {
      ...Date.args.prop,
      label: 'Delivery date',
      minDate: '2026-07-05',
      maxDate: '2026-07-20',
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(dialog.getByRole('gridcell', { name: '4' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '10' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '21' })).toBeDisabled()
  },
}

// NOTE: Bounds accept several formats, including a full date-time string
export const DateWithFlexibleBounds = {
  ...Date,
  args: {
    ...Date.args,
    prop: {
      ...Date.args.prop,
      minDate: '2026-07-05T00:00:00',
      maxDate: '2026-07-20 12:00:00',
    },
  },
  play: undefined,
}

export const DateDisablePast = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, disablePast: true },
  },
  play: undefined,
}

export const TimeWithBounds = {
  ...Time,
  args: {
    ...Time.args,
    prop: { ...Time.args.prop, minTime: '09:00', maxTime: '17:00:00' },
  },
}

export const DateTimeWithBounds = {
  ...DateTime,
  args: {
    ...DateTime.args,
    prop: {
      ...DateTime.args.prop,
      label: 'Appointment',
      minDate: '2026-07-05',
      maxDate: '2026-07-20',
      minTime: '09:00',
      maxTime: '17:00',
    },
  },
}

// NOTE: Unlike `minDate` with `minTime`, which limit the day and the time of
// day independently, these are a single cutoff. So, `08:00` on the 6th can
// still be selected, but nothing before `09:00` on the 5th.
export const DateTimeWithDateTimeBounds = {
  ...DateTime,
  args: {
    ...DateTime.args,
    prop: {
      ...DateTime.args.prop,
      minDateTime: '2026-07-05T09:00:00',
      maxDateTime: '2026-07-20 17:00:00',
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(dialog.getByRole('gridcell', { name: '4' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '5' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '20' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '21' })).toBeDisabled()
  },
}

// NOTE: A date-only string has no time, so it is ignored
export const DateTimeWithInvalidDateTimeBound = {
  ...DateTime,
  args: {
    ...DateTime.args,
    prop: { ...DateTime.args.prop, minDateTime: '2026-07-05' },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(dialog.getByRole('gridcell', { name: '4' })).toBeEnabled()
  },
}

// NOTE: These two timezones are 25 hours apart, so their calendar dates always
// differ. With `disableFuture`, the day that is "today" in the further ahead
// zone is only in the future for the zone that is behind.
const AHEAD_ZONE = 'Pacific/Kiritimati' // UTC+14
const BEHIND_ZONE = 'Pacific/Pago_Pago' // UTC-11

const getAheadToday = () => dayjs().tz(AHEAD_ZONE).format('YYYY-MM-DD')

const timezoneStory = (timezone, isTodayDisabled) => ({
  ...Date,
  args: {
    ...Date.args,
    prop: {
      ...Date.args.prop,
      value: getAheadToday(),
      timezone,
      disableFuture: true,
    },
    currentVal: getAheadToday(),
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    const aheadDay = dayjs(getAheadToday()).format('D')
    const cell = dialog.getByRole('gridcell', { name: aheadDay })
    await (isTodayDisabled
      ? expect(cell).toBeDisabled()
      : expect(cell).toBeEnabled())
  },
})

export const DisableFutureInSameTimezone = timezoneStory(AHEAD_ZONE, false)

export const DisableFutureInBehindTimezone = timezoneStory(BEHIND_ZONE, true)

// NOTE: An unknown timezone is ignored, using the browser's timezone
export const InvalidTimezone = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, timezone: 'Mars/Olympus_Mons' },
  },
  play: undefined,
}

export const DateOpensToYear = {
  ...Date,
  args: {
    ...Date.args,
    prop: {
      ...Date.args.prop,
      views: ['year', 'month', 'day'],
      defaultView: 'year',
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(
      await dialog.findByRole('radio', { name: '2026' })
    ).toBeInTheDocument()
    await expect(dialog.queryAllByRole('gridcell')).toHaveLength(0)
  },
}

export const TimeOpensToMinutes = {
  ...Time,
  args: {
    ...Time.args,
    prop: { ...Time.args.prop, defaultView: 'minutes' },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose time/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    const [firstOption] = await dialog.findAllByRole('option')
    await expect(firstOption.getAttribute('aria-label')).toMatch(/minutes/)
  },
}

// NOTE: A `defaultView` that isn't one of the `views` is ignored
export const DefaultViewNotInViews = {
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, defaultView: 'hours' },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(
      await dialog.findByRole('gridcell', { name: '9' })
    ).toBeInTheDocument()
  },
}

// NOTE: The hours and seconds steps are emulated by disabling the values that
// aren't a multiple of the step. The minutes step is native to the picker.
const getClockOptions = async (canvasElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: /Choose time/ })
  )
  const dialog = within(await within(document.body).findByRole('dialog'))
  const options = await dialog.findAllByRole('option')
  const labelsWhere = (isDisabled) =>
    options
      .filter(
        (o) => (o.getAttribute('aria-disabled') === 'true') === isDisabled
      )
      .map((o) => o.getAttribute('aria-label'))
  return { enabled: labelsWhere(false), disabled: labelsWhere(true) }
}

const openDateDialog = async (canvasElement) => {
  await userEvent.click(
    within(canvasElement).getByRole('button', { name: /Choose date/ })
  )
  return within(await within(document.body).findByRole('dialog'))
}

const disabledStory = (disabled, extra = {}) => ({
  ...Date,
  args: {
    ...Date.args,
    prop: { ...Date.args.prop, ...disabled, ...extra },
  },
})

// NOTE: July 2026 starts on a Wednesday, so the 5th is a Sunday
// and the 9th (the value) is a Thursday
export const DateWithDisabledWeekdays = {
  ...disabledStory({ disabledWeekdays: [0, 'Mon', 'tuesday'] }),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    await expect(dialog.getByRole('gridcell', { name: '5' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '6' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '7' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '8' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '9' })).toBeEnabled()
  },
}

export const DateWithDisabledDates = {
  ...disabledStory({
    disabledDates: ['2026-07-10', '2026-07-14T10:00:00', '2026-07-15 10:00:00'],
  }),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    await expect(dialog.getByRole('gridcell', { name: '10' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '11' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '14' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '15' })).toBeDisabled()
  },
}

// NOTE: Entries that can't be recognized are ignored
export const DateWithInvalidDisabledEntries = {
  ...disabledStory({
    disabledDates: ['07/10/2026', '2026-07'],
    disabledWeekdays: ['Thur', 7],
    disabledMonths: ['Sept', 0, '2026-07'],
  }),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    await expect(dialog.getByRole('gridcell', { name: '9' })).toBeEnabled()
    await expect(dialog.getByRole('gridcell', { name: '10' })).toBeEnabled()
  },
}

export const DateWithDisabledMonth = {
  ...disabledStory({ disabledMonths: ['Jul'] }),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    // A disabled month disables its days
    await expect(dialog.getByRole('gridcell', { name: '10' })).toBeDisabled()
  },
}

export const DateWithDisabledMonths = {
  ...disabledStory(
    { disabledMonths: [12, 'Feb', 'March'] },
    { views: ['year', 'month', 'day'], defaultView: 'month' }
  ),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    await expect(
      await dialog.findByRole('radio', { name: 'December' })
    ).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: 'February' })).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: 'March' })).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: 'July' })).toBeEnabled()
  },
}

export const DateWithDisabledYears = {
  ...disabledStory({ disabledYears: [2025, 2027] }, { defaultView: 'year' }),
  play: async ({ canvasElement }) => {
    const dialog = await openDateDialog(canvasElement)
    await expect(
      await dialog.findByRole('radio', { name: '2025' })
    ).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: '2027' })).toBeDisabled()
    await expect(dialog.getByRole('radio', { name: '2026' })).toBeEnabled()
  },
}

export const DateTimeWithDisabledWeekdays = {
  ...DateTime,
  args: {
    ...DateTime.args,
    prop: { ...DateTime.args.prop, disabledWeekdays: ['Su', 'Sat'] },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await expect(dialog.getByRole('gridcell', { name: '4' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '5' })).toBeDisabled()
    await expect(dialog.getByRole('gridcell', { name: '6' })).toBeEnabled()
  },
}

const stepsStory = (defaultView) => ({
  ...Time,
  args: {
    ...Time.args,
    prop: {
      ...Time.args.prop,
      value: '10:30:00',
      views: ['hours', 'minutes', 'seconds'],
      defaultView,
      hoursStep: 2,
      minutesStep: 15,
      secondsStep: 30,
    },
    currentVal: '10:30:00',
  },
})

export const TimeStepsHours = {
  ...stepsStory('hours'),
  play: async ({ canvasElement }) => {
    const { enabled, disabled } = await getClockOptions(canvasElement)
    // The 12 on the clock is hour `0` or `12`, both multiples of the step
    await expect(enabled).toEqual([
      '2 hours',
      '4 hours',
      '6 hours',
      '8 hours',
      '10 hours',
      '12 hours',
    ])
    await expect(disabled).toHaveLength(6)
  },
}

export const TimeStepsMinutes = {
  ...stepsStory('minutes'),
  play: async ({ canvasElement }) => {
    const { enabled } = await getClockOptions(canvasElement)
    await expect(enabled).toEqual([
      '15 minutes',
      '30 minutes',
      '45 minutes',
      '00 minutes',
    ])
  },
}

export const TimeStepsSeconds = {
  ...stepsStory('seconds'),
  play: async ({ canvasElement }) => {
    const { enabled } = await getClockOptions(canvasElement)
    await expect(enabled).toEqual(['30 seconds', '00 seconds'])
  },
}

// NOTE: Steps that don't divide their unit evenly are ignored
export const TimeStepsInvalid = {
  ...stepsStory('minutes'),
  args: {
    ...stepsStory('minutes').args,
    prop: {
      ...stepsStory('minutes').args.prop,
      hoursStep: 5,
      minutesStep: 7,
      secondsStep: 1,
    },
  },
  play: async ({ canvasElement }) => {
    const { disabled } = await getClockOptions(canvasElement)
    await expect(disabled).toHaveLength(0)
  },
}

const disabledTimesStory = (defaultView, disabledTimes, extra = {}) => ({
  ...Time,
  args: {
    ...Time.args,
    prop: {
      ...Time.args.prop,
      value: '10:30:00',
      views: ['hours', 'minutes', 'seconds'],
      defaultView,
      disabledTimes,
      ...extra,
    },
    currentVal: '10:30:00',
  },
})

// NOTE: An hour is disabled only if the windows cover all of it, so `09` (from
// `09:00` to `10:00`) and `02` and `03` (`02:00` to `04:00`) are disabled, while
// `10` (only partly covered by the second window) is not
export const TimeWithDisabledHours = {
  ...disabledTimesStory('hours', [
    ['02:00', '04:00'],
    ['09:00', '10:00'],
    ['10:15', '10:30'],
  ]),
  play: async ({ canvasElement }) => {
    const { disabled } = await getClockOptions(canvasElement)
    await expect(disabled).toEqual(['2 hours', '3 hours', '9 hours'])
  },
}

export const TimeWithDisabledMinutes = {
  ...disabledTimesStory('minutes', [['10:15', '10:40']]),
  play: async ({ canvasElement }) => {
    const { disabled, enabled } = await getClockOptions(canvasElement)
    await expect(disabled).toEqual([
      '15 minutes',
      '20 minutes',
      '25 minutes',
      '30 minutes',
      '35 minutes',
    ])
    // The end of a window is not included
    await expect(enabled).toContain('40 minutes')
  },
}

export const TimeWithDisabledSeconds = {
  ...disabledTimesStory('seconds', [['10:30:15', '10:30:30']]),
  play: async ({ canvasElement }) => {
    const { disabled } = await getClockOptions(canvasElement)
    await expect(disabled).toEqual(['15 seconds', '20 seconds', '25 seconds'])
  },
}

// NOTE: The windows and the steps are applied together
export const TimeWithDisabledHoursAndSteps = {
  ...disabledTimesStory('hours', [['06:00', '08:00']], { hoursStep: 2 }),
  play: async ({ canvasElement }) => {
    const { enabled } = await getClockOptions(canvasElement)
    await expect(enabled).toEqual([
      '2 hours',
      '4 hours',
      '8 hours',
      '10 hours',
      '12 hours',
    ])
  },
}

// NOTE: Windows that can't be recognized are ignored
export const TimeWithInvalidDisabledTimes = {
  ...disabledTimesStory('hours', [
    ['03:00', '02:00'],
    ['09:00'],
    ['9 AM', '10 AM'],
  ]),
  play: async ({ canvasElement }) => {
    const { disabled } = await getClockOptions(canvasElement)
    await expect(disabled).toEqual([])
  },
}

export const DateTimeWithDisabledTimes = {
  ...DateTime,
  args: {
    ...DateTime.args,
    prop: {
      ...DateTime.args.prop,
      defaultView: 'hours',
      disabledTimes: [['02:00', '04:00']],
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Choose date/ })
    )
    const dialog = within(await within(document.body).findByRole('dialog'))
    await userEvent.click(await dialog.findByRole('tab', { name: /time/i }))
    const hour = (name) => dialog.findByRole('option', { name })
    await expect(await hour('2 hours')).toHaveAttribute('aria-disabled', 'true')
    await expect(await hour('5 hours')).not.toHaveAttribute(
      'aria-disabled',
      'true'
    )
  },
}
