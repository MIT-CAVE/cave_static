import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import React from 'react'

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

export const Date = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDate
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  args: {
    prop: {
      enabled: true,
      value: '2026-07-09',
      readOnly: false,
    },
    currentVal: '2026-07-09',
    onChange: () => {},
  },
}

export const DateTime = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropDateTime
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  args: {
    prop: {
      enabled: true,
      value: '2026-07-09 09:00:00',
      readOnly: false,
    },
    currentVal: '2026-07-09 09:00:00',
    onChange: () => {},
  },
}

export const Time = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropTime
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  args: {
    prop: {
      enabled: true,
      value: '09:30:00',
      readOnly: false,
    },
    currentVal: '09:30:00',
    onChange: () => {},
  },
}
