import React from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import PropLatLngInput from '../../ui/compound/PropLatLngInput'
import PropLatLngMap from '../../ui/compound/PropLatLngMap'
import PropLatLngPath from '../../ui/compound/PropLatLngPath'

const propLatLngStories = {
  title: 'Compound/PropLatLng',
  component: PropLatLngInput,
}

export default propLatLngStories

export const Input = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngInput
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
      value: [[-122.4194, 37.7749]],
      placeholder: 'Enter coordinates...',
      direction: 'row',
    },
    currentVal: [[-122.4194, 37.7749]],
    onChange: () => {},
  },
}

export const MapView = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngMap
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: true,
      value: [[-122.4194, 37.7749]],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [[-122.4194, 37.7749]],
    onChange: () => {},
  },
}

export const MapViewDisabled = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngMap
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: false,
      value: [[-122.4194, 37.7749]],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [[-122.4194, 37.7749]],
    onChange: () => {},
  },
}

export const MapViewColumn = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngMap
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: true,
      value: [[-122.4194, 37.7749]],
      placeholder: 'Enter coordinates...',
      direction: 'column',
    },
    currentVal: [[-122.4194, 37.7749]],
    onChange: () => {},
  },
}

export const Path = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngPath
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: true,
      value: [
        [-122.4194, 37.7749],
        [-122.42, 37.78],
        [-122.41, 37.775],
      ],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [
      [-122.4194, 37.7749],
      [-122.42, 37.78],
      [-122.41, 37.775],
    ],
    onChange: () => {},
  },
}

export const PathClearConfirmation = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngPath
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: true,
      value: [
        [-122.4194, 37.7749],
        [-122.42, 37.78],
        [-122.41, 37.775],
      ],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [
      [-122.4194, 37.7749],
      [-122.42, 37.78],
      [-122.41, 37.775],
    ],
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    // Canceling must not commit anything and must restore the default row
    await userEvent.click(canvas.getByRole('button', { name: /clear path/i }))
    await expect(
      canvas.getByRole('button', { name: /confirm clear/i })
    ).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: /^cancel$/i }))
    await expect(args.onChange).not.toHaveBeenCalled()
    await expect(
      canvas.getByRole('button', { name: /enter input mode/i })
    ).toBeInTheDocument()

    // Confirming must commit a path reset to the original first point,
    // keeping the marker/line in sync (the bug being fixed here)
    await userEvent.click(canvas.getByRole('button', { name: /clear path/i }))
    await userEvent.click(
      canvas.getByRole('button', { name: /confirm clear/i })
    )
    await expect(args.onChange).toHaveBeenCalledWith([[-122.4194, 37.7749]])
  },
}

export const PathColumn = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngPath
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: true,
      value: [
        [-122.4194, 37.7749],
        [-122.42, 37.78],
        [-122.41, 37.775],
      ],
      placeholder: 'Enter coordinates...',
      direction: 'column',
    },
    currentVal: [
      [-122.4194, 37.7749],
      [-122.42, 37.78],
      [-122.41, 37.775],
    ],
    onChange: () => {},
  },
}

export const PathDisabled = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropLatLngPath
        {...args}
        currentVal={currentVal}
        onChange={(val) => {
          args.onChange(val)
          setCurrentVal(val)
        }}
      />
    )
  },
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      enabled: false,
      value: [
        [-122.4194, 37.7749],
        [-122.42, 37.78],
        [-122.41, 37.775],
      ],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [
      [-122.4194, 37.7749],
      [-122.42, 37.78],
      [-122.41, 37.775],
    ],
    onChange: () => {},
  },
}
