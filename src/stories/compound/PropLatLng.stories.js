import React from 'react'

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
