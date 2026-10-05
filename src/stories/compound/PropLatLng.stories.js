import React from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'

import PropLatLngMap from '../../ui/compound/PropLatLngMap'
import PropLatLngPath from '../../ui/compound/PropLatLngPath'

const propLatLngStories = {
  title: 'Compound/PropLatLng',
  component: PropLatLngMap,
}

export default propLatLngStories

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
      defaultZoom: 16,
      minZoom: 10,
      maxZoom: 19,
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

export const MapStoredToggle = {
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
  loaders: [
    () => {
      localStorage.setItem('cave.latLngMap.mapOpen.storedMap', '1')
    },
  ],
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      id: 'storedMap',
      enabled: true,
      value: [[-122.4194, 37.7749]],
      placeholder: 'Enter coordinates...',
    },
    currentVal: [[-122.4194, 37.7749]],
    onChange: fn(),
  },
  play: async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
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
      defaultZoom: 15,
      minZoom: 10,
      maxZoom: 18,
      pathColor: '#a31f34',
      pathWeight: 3,
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
      canvas.getByRole('button', { name: /add point/i })
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

export const PathPointEdit = {
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
    const rows = () => canvasElement.querySelectorAll('.MuiListItemButton-root')

    // Selecting a row shows the point editor, and deleting it commits one fewer point
    await userEvent.click(rows()[1])
    await userEvent.click(canvas.getByRole('button', { name: /delete point/i }))
    await expect(args.onChange).toHaveBeenLastCalledWith([
      [-122.4194, 37.7749],
      [-122.41, 37.775],
    ])

    // At the 2-point minimum, Delete is disabled
    await userEvent.click(rows()[0])
    await expect(
      canvas.getByRole('button', { name: /delete point/i })
    ).toBeDisabled()
  },
}

export const PathMapPopup = {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /add point/i }))
    const toggle = canvasElement.querySelector('.MuiToggleButton-root')
    await userEvent.click(toggle)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const popper = document.querySelector('[role="tooltip"]')
    await expect(popper).not.toBeNull()
    await expect(canvasElement.contains(popper)).toBe(true)
    await expect(popper.getBoundingClientRect().height).toBeGreaterThan(0)

    await userEvent.click(
      canvasElement.querySelector('.MuiListItemButton-root')
    )
    await expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
  },
}

export const PathStoredToggle = {
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
  loaders: [
    () => {
      localStorage.setItem('cave.latLngPath.mapOpen.storedToggle', '1')
    },
  ],
  parameters: {
    layoutWidth: '600px',
  },
  args: {
    prop: {
      id: 'storedToggle',
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /add point/i }))
    await new Promise((resolve) => setTimeout(resolve, 500))
    await expect(document.querySelector('[role="tooltip"]')).not.toBeNull()
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
