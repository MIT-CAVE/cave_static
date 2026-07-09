import React from 'react'

import {
  PropToggleCheckbox,
  PropToggleSwitch,
  PropToggleButton,
} from '../../ui/compound/PropToggle'

const propToggleStories = {
  title: 'Compound/PropToggle',
  component: PropToggleCheckbox,
}

export default propToggleStories

export const Checkbox = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropToggleCheckbox
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
      label: 'Checkbox Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const Switch = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropToggleSwitch
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
      label: 'Switch Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}

export const Button = {
  render: function Render(args) {
    const [currentVal, setCurrentVal] = React.useState(args.currentVal)
    return (
      <PropToggleButton
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
      label: 'Toggle Button Feature',
      value: false,
    },
    currentVal: false,
    onChange: () => {},
  },
}
