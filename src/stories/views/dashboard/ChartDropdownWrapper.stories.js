import { MenuItem, Select, TextField } from '@mui/material'
import React from 'react'

import ChartDropdownWrapper from '../../../ui/views/dashboard/ChartDropdownWrapper'

const chartDropdownWrapperStories = {
  title: 'Views/Dashboard/ChartDropdownWrapper',
  component: ChartDropdownWrapper,
  parameters: {
    layoutWidth: '400px',
    layoutHeight: '120px',
  },
}

export default chartDropdownWrapperStories

export const WithTextField = {
  render: () => (
    <ChartDropdownWrapper>
      <TextField fullWidth label="Search datasets" variant="standard" />
    </ChartDropdownWrapper>
  ),
  parameters: {
    preloadedState: {
      data: {
        pages: {
          data: {},
        },
      },
    },
  },
}

export const WithSelect = {
  render: function Render() {
    const [value, setValue] = React.useState('opt1')
    return (
      <ChartDropdownWrapper>
        <Select
          size="small"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <MenuItem value="opt1">Revenue by Region</MenuItem>
          <MenuItem value="opt2">Cost Breakdown</MenuItem>
          <MenuItem value="opt3">Efficiency Metrics</MenuItem>
        </Select>
      </ChartDropdownWrapper>
    )
  },
  parameters: {
    preloadedState: {
      data: {
        pages: {
          data: {},
        },
      },
    },
  },
}

export const Clearable = {
  render: function Render() {
    const [value, setValue] = React.useState('opt2')
    return (
      <ChartDropdownWrapper clearable onClear={() => setValue('')}>
        <Select
          size="small"
          fullWidth
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <MenuItem value="opt1">Session A</MenuItem>
          <MenuItem value="opt2">Session B</MenuItem>
          <MenuItem value="opt3">Session C</MenuItem>
        </Select>
      </ChartDropdownWrapper>
    )
  },
  parameters: {
    preloadedState: {
      data: {
        pages: {
          data: {},
        },
      },
    },
  },
}
