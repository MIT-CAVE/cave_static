import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
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
